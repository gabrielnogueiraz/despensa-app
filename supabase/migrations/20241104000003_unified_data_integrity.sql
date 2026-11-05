-- ==============================================================================
-- MIGRAÇÃO DEFINITIVA: UNIFICAÇÃO DE INTEGRIDADE DE DADOS, ONBOARDING E MODO MERCADO
-- Arquivo: 20241104000003_unified_data_integrity.sql
-- Idempotente: pode ser executada múltiplas vezes no SQL Editor do Supabase com sucesso total
-- ==============================================================================

-- 1. CORREÇÃO DE COLUNAS E TIPOS EM HOUSEHOLDS
ALTER TABLE public.households 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shopping_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS preferred_shopping_day INT,
ADD COLUMN IF NOT EXISTS average_ticket_target NUMERIC(10, 2) DEFAULT 0.00;

-- 2. AJUSTE DE PRECISÃO NUMÉRICA E CORREÇÃO DE COLUNA GERADA EM CART_ITEMS
ALTER TABLE public.products ALTER COLUMN default_price TYPE NUMERIC(10, 2);
ALTER TABLE public.recurring_items ALTER COLUMN target_quantity TYPE NUMERIC(10, 3);
ALTER TABLE public.shopping_list_items ALTER COLUMN planned_quantity TYPE NUMERIC(10, 3);

-- Tratamento seguro da coluna gerada subtotal em cart_items
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS subtotal;
ALTER TABLE public.cart_items ALTER COLUMN quantity TYPE NUMERIC(10, 3);
ALTER TABLE public.cart_items ADD COLUMN subtotal NUMERIC(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED;

-- 2.1. LIMPEZA DE ASSINATURAS ANTIGAS PARA EVITAR CONFLITO DE PARÂMETROS DEFAULT (42P13)
DROP FUNCTION IF EXISTS public.create_initial_household(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.create_initial_household(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_initial_household(UUID, TEXT, TEXT, NUMERIC, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.create_initial_household(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.complete_onboarding_transaction(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.complete_onboarding_transaction(UUID, TEXT, TEXT, NUMERIC, TEXT, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_monthly_list(UUID, INT, INT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS public.get_or_create_monthly_list(UUID, INT, INT) CASCADE;
DROP FUNCTION IF EXISTS public.start_or_resume_shopping_session(UUID, UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.start_or_resume_shopping_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.seed_default_categories(UUID) CASCADE;

-- 3. SEED DE CATEGORIAS PADRÃO EXPANDIDAS (100% Idempotente com verificação NOT EXISTS)
CREATE OR REPLACE FUNCTION public.seed_default_categories(p_household_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.categories (household_id, name, icon, color, sort_order)
    SELECT p_household_id, c.name, c.icon, c.color, c.sort_order
    FROM (VALUES
        ('Arroz, Feijão & Grãos', 'BowlFood', '#D9532F', 1),
        ('Massas & Molhos', 'CookingPot', '#EA580C', 2),
        ('Óleos, Azeites & Temperos', 'Drop', '#CA8A04', 3),
        ('Açúcar, Cafés & Chás', 'Coffee', '#854D0E', 4),
        ('Leites & Bebidas Vegetais', 'Brandy', '#0284C7', 5),
        ('Queijos & Frios', 'Cheese', '#F59E0B', 6),
        ('Carnes & Aves', 'Knife', '#DC2626', 7),
        ('Peixes & Frutos do Mar', 'Fish', '#0EA5E9', 8),
        ('Ovos', 'Egg', '#D97706', 9),
        ('Pães & Padaria', 'Bread', '#B45309', 10),
        ('Frutas Frescas', 'AppleLogo', '#16A34A', 11),
        ('Verduras & Folhas', 'Plant', '#15803D', 12),
        ('Legumes & Raízes', 'Carrot', '#C2410C', 13),
        ('Bebidas & Sucos', 'Wine', '#6366F1', 14),
        ('Congelados & Prontos', 'Snowflake', '#38BDF8', 15),
        ('Biscoitos & Snacks', 'Cookie', '#A16207', 16),
        ('Doces & Sobremesas', 'Cake', '#EC4899', 17),
        ('Limpeza da Casa', 'Sparkle', '#0D9488', 18),
        ('Lavanderia & Roupas', 'TShirt', '#0891B2', 19),
        ('Higiene Pessoal & Banho', 'Shower', '#7C3AED', 20),
        ('Cuidados Cabelo & Pele', 'HandSoap', '#9333EA', 21),
        ('Bebê & Infantil', 'Baby', '#F43F5E', 22),
        ('Pet Shop', 'Bone', '#84CC16', 23),
        ('Utilidades & Outros', 'Package', '#78716C', 24)
    ) AS c(name, icon, color, sort_order)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories cat 
        WHERE cat.household_id = p_household_id AND cat.name = c.name
    );
END;
$$;

-- 4. FUNÇÃO IDEMPOTENTE PARA CRIAR OU ATUALIZAR LISTA MENSAL E SINCRONIZAR RECORRENTES
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_list(
    p_household_id UUID,
    p_month INT,
    p_year INT,
    p_budget NUMERIC DEFAULT 0.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_list_id UUID;
    v_title TEXT;
    v_budget NUMERIC;
BEGIN
    -- Se não informado orçamento, recupera o do lar
    IF p_budget IS NULL OR p_budget <= 0 THEN
        SELECT monthly_budget INTO v_budget FROM public.households WHERE id = p_household_id;
    ELSE
        v_budget := p_budget;
    END IF;

    -- Localiza ou cria a lista para o mês/ano
    SELECT id INTO v_list_id
    FROM public.shopping_lists
    WHERE household_id = p_household_id AND period_month = p_month AND period_year = p_year
    LIMIT 1;

    IF v_list_id IS NULL THEN
        v_title := 'Compras ' || TO_CHAR(TO_DATE(p_month::text, 'MM'), 'TMMonth') || '/' || p_year;

        INSERT INTO public.shopping_lists (household_id, title, period_month, period_year, budget_target, status)
        VALUES (p_household_id, v_title, p_month, p_year, COALESCE(v_budget, 0.00), 'draft')
        RETURNING id INTO v_list_id;
    ELSE
        -- Atualiza teto da lista se fornecido
        IF v_budget > 0 THEN
            UPDATE public.shopping_lists
            SET budget_target = v_budget, updated_at = NOW()
            WHERE id = v_list_id AND (budget_target IS NULL OR budget_target = 0);
        END IF;
    END IF;

    -- Sincroniza qualquer item recorrente ativo que ainda não conste na shopping_list_items
    INSERT INTO public.shopping_list_items (
        shopping_list_id,
        product_id,
        custom_name,
        category_id,
        planned_quantity,
        unit,
        estimated_price
    )
    SELECT 
        v_list_id,
        p.id,
        p.name,
        p.category_id,
        r.target_quantity,
        r.unit,
        p.default_price
    FROM public.recurring_items r
    JOIN public.products p ON p.id = r.product_id
    WHERE r.household_id = p_household_id 
      AND r.is_active = true
      AND NOT EXISTS (
          SELECT 1 FROM public.shopping_list_items sli 
          WHERE sli.shopping_list_id = v_list_id 
            AND sli.product_id = p.id
      );

    RETURN v_list_id;
END;
$$;

-- 5. PROCEDURE COMPLETA DE CRIAÇÃO / ATUALIZAÇÃO DO LAR (Suporte multi-assinatura)
CREATE OR REPLACE FUNCTION public.create_initial_household(
    p_user_id UUID, 
    p_user_name TEXT, 
    p_household_name TEXT DEFAULT 'Nosso Lar',
    p_budget NUMERIC DEFAULT 0.00,
    p_frequency TEXT DEFAULT 'monthly',
    p_avatar_url TEXT DEFAULT NULL,
    p_ticket_target NUMERIC DEFAULT 0.00
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_household_id UUID;
    v_final_name TEXT;
    v_ticket NUMERIC;
BEGIN
    v_final_name := COALESCE(NULLIF(TRIM(p_household_name), ''), 'Nosso Lar');
    
    -- Calcula ticket médio alvo caso não informado explicitamente
    IF p_ticket_target IS NOT NULL AND p_ticket_target > 0 THEN
        v_ticket := p_ticket_target;
    ELSIF p_budget > 0 THEN
        IF p_frequency = 'weekly' THEN
            v_ticket := ROUND(p_budget / 4.0, 2);
        ELSIF p_frequency = 'biweekly' THEN
            v_ticket := ROUND(p_budget / 2.0, 2);
        ELSE
            v_ticket := p_budget;
        END IF;
    ELSE
        v_ticket := 0.00;
    END IF;

    -- 1. Cria ou atualiza perfil
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (p_user_id, p_user_name, p_avatar_url)
    ON CONFLICT (id) DO UPDATE SET 
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    -- 2. Idempotência: Se o usuário já tiver um lar cadastrado, reaproveita e atualiza
    SELECT household_id INTO v_household_id
    FROM public.household_members
    WHERE user_id = p_user_id
    LIMIT 1;

    IF v_household_id IS NOT NULL THEN
        UPDATE public.households
        SET name = v_final_name,
            monthly_budget = p_budget,
            shopping_frequency = p_frequency,
            average_ticket_target = v_ticket,
            onboarding_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_household_id;

        PERFORM public.seed_default_categories(v_household_id);
        RETURN v_household_id;
    END IF;

    -- 3. Cria novo lar
    INSERT INTO public.households (
        name,
        monthly_budget,
        shopping_frequency,
        average_ticket_target,
        onboarding_completed_at
    )
    VALUES (
        v_final_name,
        p_budget,
        p_frequency,
        v_ticket,
        NOW()
    )
    RETURNING id INTO v_household_id;

    -- 4. Vincula criador como Admin
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_household_id, p_user_id, 'admin')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- 5. Popula categorias padrão expandidas
    PERFORM public.seed_default_categories(v_household_id);

    RETURN v_household_id;
END;
$$;

-- 6. PROCEDURE ATÔMICA COMPLETA DE ONBOARDING (Resolve 100% da persistência)
CREATE OR REPLACE FUNCTION public.complete_onboarding_transaction(
    p_user_id UUID,
    p_user_name TEXT,
    p_household_name TEXT DEFAULT 'Nosso Lar',
    p_budget NUMERIC DEFAULT 0.00,
    p_frequency TEXT DEFAULT 'monthly',
    p_avatar_url TEXT DEFAULT NULL,
    p_products JSONB DEFAULT '[]'::jsonb,
    p_ticket_target NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_household_id UUID;
    v_list_id UUID;
    v_prod RECORD;
    v_category_id UUID;
    v_new_product_id UUID;
    v_month INT := EXTRACT(MONTH FROM NOW())::INT;
    v_year INT := EXTRACT(YEAR FROM NOW())::INT;
    v_items_count INT := 0;
BEGIN
    -- 1. Cria ou atualiza o Lar e Perfil
    v_household_id := public.create_initial_household(
        p_user_id,
        p_user_name,
        p_household_name,
        p_budget,
        p_frequency,
        p_avatar_url,
        COALESCE(p_ticket_target, 0.00)
    );

    -- 2. Garante que a Lista de Compras do Mês Atual exista antes de inserir itens
    v_list_id := public.get_or_create_monthly_list(v_household_id, v_month, v_year, p_budget);

    -- 3. Processa produtos selecionados no onboarding
    IF p_products IS NOT NULL AND jsonb_array_length(p_products) > 0 THEN
        FOR v_prod IN SELECT * FROM jsonb_to_recordset(p_products) AS (
            name TEXT,
            category_name TEXT,
            default_unit TEXT,
            default_price NUMERIC,
            target_qty NUMERIC
        )
        LOOP
            -- Descobre categoria pelo nome dentro do lar
            SELECT id INTO v_category_id
            FROM public.categories
            WHERE household_id = v_household_id AND name = v_prod.category_name
            LIMIT 1;

            -- Insere produto no catálogo do lar
            INSERT INTO public.products (household_id, category_id, name, default_unit, default_price)
            VALUES (
                v_household_id, 
                v_category_id, 
                v_prod.name, 
                COALESCE(v_prod.default_unit, 'un'), 
                COALESCE(v_prod.default_price, 0.00)
            )
            RETURNING id INTO v_new_product_id;

            -- Insere na lista recorrente da despensa
            INSERT INTO public.recurring_items (household_id, product_id, target_quantity, unit, is_active)
            VALUES (
                v_household_id, 
                v_new_product_id, 
                COALESCE(v_prod.target_qty, 1), 
                COALESCE(v_prod.default_unit, 'un'), 
                true
            )
            ON CONFLICT (household_id, product_id) DO UPDATE SET 
                target_quantity = EXCLUDED.target_quantity,
                unit = EXCLUDED.unit,
                is_active = true;

            -- Insere DIRETAMENTE na lista mensal ativa deste mês
            INSERT INTO public.shopping_list_items (
                shopping_list_id,
                product_id,
                custom_name,
                category_id,
                planned_quantity,
                unit,
                estimated_price,
                is_added_during_shopping
            )
            VALUES (
                v_list_id,
                v_new_product_id,
                v_prod.name,
                v_category_id,
                COALESCE(v_prod.target_qty, 1),
                COALESCE(v_prod.default_unit, 'un'),
                COALESCE(v_prod.default_price, 0.00),
                false
            );

            v_items_count := v_items_count + 1;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'household_id', v_household_id,
        'shopping_list_id', v_list_id,
        'items_count', v_items_count
    );
END;
$$;

-- 7. PROCEDURE PARA INICIAR OU RETOMAR SESSÃO NO MODO MERCADO
CREATE OR REPLACE FUNCTION public.start_or_resume_shopping_session(
    p_household_id UUID,
    p_user_id UUID,
    p_shopping_list_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_list_id UUID := p_shopping_list_id;
    v_budget NUMERIC;
    v_month INT := EXTRACT(MONTH FROM NOW())::INT;
    v_year INT := EXTRACT(YEAR FROM NOW())::INT;
BEGIN
    -- 1. Verifica se já existe sessão em andamento no lar
    SELECT id INTO v_session_id
    FROM public.shopping_sessions
    WHERE household_id = p_household_id AND status = 'in_progress'
    ORDER BY started_at DESC
    LIMIT 1;

    IF v_session_id IS NOT NULL THEN
        RETURN v_session_id;
    END IF;

    -- 2. Garante que a lista mensal esteja carregada e sincronizada com recorrentes
    IF v_list_id IS NULL THEN
        v_list_id := public.get_or_create_monthly_list(p_household_id, v_month, v_year);
    ELSE
        PERFORM public.get_or_create_monthly_list(p_household_id, v_month, v_year);
    END IF;

    -- 3. Recupera o orçamento da lista ou do lar
    SELECT budget_target INTO v_budget FROM public.shopping_lists WHERE id = v_list_id;
    IF v_budget IS NULL OR v_budget <= 0 THEN
        SELECT monthly_budget INTO v_budget FROM public.households WHERE id = p_household_id;
    END IF;

    -- 4. Cria a nova sessão no banco de dados vinculada à lista
    INSERT INTO public.shopping_sessions (
        household_id,
        shopping_list_id,
        started_by,
        budget_target,
        total_spent,
        total_items_count,
        status
    )
    VALUES (
        p_household_id,
        v_list_id,
        p_user_id,
        COALESCE(v_budget, 0.00),
        0.00,
        0,
        'in_progress'
    )
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;

-- 8. GRANT DE PERMISSÕES PARA AS FUNÇÕES
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon, service_role;
