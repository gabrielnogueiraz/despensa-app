-- Migração 000002: RPC Atômico de Onboarding, Sincronização de Sessões de Compras e Lista Mensal
-- Data: 2024-11-04

-- 1. Função Idempotente para Obter ou Criar Lista Mensal
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
    -- Se já existe lista para o mês/ano, retorna o ID existente
    SELECT id INTO v_list_id
    FROM public.shopping_lists
    WHERE household_id = p_household_id AND period_month = p_month AND period_year = p_year
    LIMIT 1;

    IF v_list_id IS NOT NULL THEN
        RETURN v_list_id;
    END IF;

    -- Se orçamento não foi passado, herda o do household
    IF p_budget IS NULL OR p_budget <= 0 THEN
        SELECT monthly_budget INTO v_budget FROM public.households WHERE id = p_household_id;
    ELSE
        v_budget := p_budget;
    END IF;

    v_title := 'Compras ' || TO_CHAR(TO_DATE(p_month::text, 'MM'), 'TMMonth') || '/' || p_year;

    -- Cria lista
    INSERT INTO public.shopping_lists (household_id, title, period_month, period_year, budget_target, status)
    VALUES (p_household_id, v_title, p_month, p_year, COALESCE(v_budget, 0.00), 'draft')
    RETURNING id INTO v_list_id;

    -- Popula itens a partir dos produtos recorrentes ativos
    INSERT INTO public.shopping_list_items (shopping_list_id, product_id, custom_name, category_id, planned_quantity, unit, estimated_price)
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
    WHERE r.household_id = p_household_id AND r.is_active = true;

    RETURN v_list_id;
END;
$$;

-- 2. Procedure de Criação/Atualização do Lar com Foto e Idempotência
CREATE OR REPLACE FUNCTION public.create_initial_household(
    p_user_id UUID, 
    p_user_name TEXT, 
    p_household_name TEXT DEFAULT 'Nosso Lar',
    p_budget NUMERIC DEFAULT 0.00,
    p_frequency TEXT DEFAULT 'monthly',
    p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_household_id UUID;
BEGIN
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
        SET name = COALESCE(NULLIF(p_household_name, ''), 'Nosso Lar'),
            monthly_budget = p_budget,
            shopping_frequency = p_frequency,
            onboarding_completed_at = NOW(),
            updated_at = NOW()
        WHERE id = v_household_id;

        PERFORM public.seed_default_categories(v_household_id);
        RETURN v_household_id;
    END IF;

    -- 3. Cria novo lar
    INSERT INTO public.households (name, monthly_budget, shopping_frequency, onboarding_completed_at)
    VALUES (COALESCE(NULLIF(p_household_name, ''), 'Nosso Lar'), p_budget, p_frequency, NOW())
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

-- 3. Procedure Transacional Completa de Onboarding (Tudo em 1 operação atômica)
CREATE OR REPLACE FUNCTION public.complete_onboarding_transaction(
    p_user_id UUID,
    p_user_name TEXT,
    p_household_name TEXT,
    p_budget NUMERIC,
    p_frequency TEXT,
    p_avatar_url TEXT,
    p_products JSONB DEFAULT '[]'::jsonb
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
    -- 1. Cria ou atualiza o Lar
    v_household_id := public.create_initial_household(
        p_user_id,
        p_user_name,
        p_household_name,
        p_budget,
        p_frequency,
        p_avatar_url
    );

    -- 2. Processa produtos selecionados no onboarding
    IF p_products IS NOT NULL AND jsonb_array_length(p_products) > 0 THEN
        FOR v_prod IN SELECT * FROM jsonb_to_recordset(p_products) AS (
            name TEXT,
            category_name TEXT,
            default_unit TEXT,
            default_price NUMERIC,
            target_qty NUMERIC
        )
        LOOP
            -- Descobre categoria pelo nome
            SELECT id INTO v_category_id
            FROM public.categories
            WHERE household_id = v_household_id AND name = v_prod.category_name
            LIMIT 1;

            -- Insere produto no catálogo do lar
            INSERT INTO public.products (household_id, category_id, name, default_unit, default_price)
            VALUES (v_household_id, v_category_id, v_prod.name, COALESCE(v_prod.default_unit, 'un'), COALESCE(v_prod.default_price, 0.00))
            RETURNING id INTO v_new_product_id;

            -- Insere na lista recorrente
            INSERT INTO public.recurring_items (household_id, product_id, target_quantity, unit, is_active)
            VALUES (v_household_id, v_new_product_id, COALESCE(v_prod.target_qty, 1), COALESCE(v_prod.default_unit, 'un'), true)
            ON CONFLICT (household_id, product_id) DO UPDATE SET 
                target_quantity = EXCLUDED.target_quantity,
                unit = EXCLUDED.unit,
                is_active = true;

            v_items_count := v_items_count + 1;
        END LOOP;
    END IF;

    -- 3. Gera a primeira Lista Mensal com os itens recorrentes
    v_list_id := public.get_or_create_monthly_list(v_household_id, v_month, v_year, p_budget);

    RETURN jsonb_build_object(
        'household_id', v_household_id,
        'shopping_list_id', v_list_id,
        'items_count', v_items_count
    );
END;
$$;

-- 4. Procedure para Iniciar ou Retomar Sessão de Compras (Modo Mercado)
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

    -- 2. Se não foi informada uma lista, pega ou cria a lista do mês atual
    IF v_list_id IS NULL THEN
        v_list_id := public.get_or_create_monthly_list(p_household_id, v_month, v_year);
    END IF;

    -- 3. Recupera o orçamento da lista ou do lar
    SELECT budget_target INTO v_budget FROM public.shopping_lists WHERE id = v_list_id;
    IF v_budget IS NULL OR v_budget <= 0 THEN
        SELECT monthly_budget INTO v_budget FROM public.households WHERE id = p_household_id;
    END IF;

    -- 4. Cria a nova sessão no banco de dados
    INSERT INTO public.shopping_sessions (household_id, shopping_list_id, started_by, budget_target, total_spent, total_items_count, status)
    VALUES (p_household_id, v_list_id, p_user_id, COALESCE(v_budget, 0.00), 0.00, 0, 'in_progress')
    RETURNING id INTO v_session_id;

    RETURN v_session_id;
END;
$$;
