-- Migração Inicial: Despensa - Compras Domésticas
-- Data: 2024-11-04
-- Descrição: Tabelas, RLS, Procedures e Publicações Realtime

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles (Extensão de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Households
CREATE TABLE IF NOT EXISTS public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL DEFAULT 'Nosso Lar',
    currency TEXT NOT NULL DEFAULT 'BRL',
    monthly_budget NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Household Members
DO $$ BEGIN
    CREATE TYPE member_role AS ENUM ('admin', 'member');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role member_role NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household ON public.household_members(household_id);

-- 5. Household Invitations
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'revoked', 'expired');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.household_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status invitation_status NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.household_invitations(token);

-- 6. Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'shopping-bag',
    color TEXT NOT NULL DEFAULT '#26593F',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_household ON public.categories(household_id);

-- 7. Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    default_unit TEXT NOT NULL DEFAULT 'un',
    default_price NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_household ON public.products(household_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);

-- 8. Recurring Items
CREATE TABLE IF NOT EXISTS public.recurring_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    target_quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'un',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (household_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_household ON public.recurring_items(household_id);

-- 9. Shopping Lists (Listas Mensais)
DO $$ BEGIN
    CREATE TYPE shopping_list_status AS ENUM ('draft', 'active', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year INT NOT NULL CHECK (period_year >= 2024),
    budget_target NUMERIC(10, 2) DEFAULT 0.00,
    status shopping_list_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (household_id, period_month, period_year)
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_household ON public.shopping_lists(household_id);

-- 10. Shopping List Items
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    custom_name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    planned_quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'un',
    estimated_price NUMERIC(10, 2) DEFAULT 0.00,
    is_added_during_shopping BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON public.shopping_list_items(shopping_list_id);

-- 11. Shopping Sessions (Modo Supermercado)
DO $$ BEGIN
    CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.shopping_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE SET NULL,
    started_by UUID NOT NULL REFERENCES public.profiles(id),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    budget_target NUMERIC(10, 2) DEFAULT 0.00,
    total_spent NUMERIC(10, 2) DEFAULT 0.00,
    total_items_count INT DEFAULT 0,
    notes TEXT,
    status session_status NOT NULL DEFAULT 'in_progress'
);

CREATE INDEX IF NOT EXISTS idx_shopping_sessions_household ON public.shopping_sessions(household_id);

-- 12. Cart Items (Itens no Carrinho)
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shopping_session_id UUID NOT NULL REFERENCES public.shopping_sessions(id) ON DELETE CASCADE,
    shopping_list_item_id UUID REFERENCES public.shopping_list_items(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    item_name TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    subtotal NUMERIC(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED,
    checked_by UUID REFERENCES public.profiles(id),
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_items_session ON public.cart_items(shopping_session_id);

-- 13. Audit Events
CREATE TABLE IF NOT EXISTS public.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id),
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_household ON public.audit_events(household_id);

-- 14. Funções e Triggers

-- Função helper para recuperar o household_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_user_household_id(p_user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT household_id 
    FROM public.household_members 
    WHERE user_id = p_user_id 
    LIMIT 1;
$$;

-- Função trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_households_updated_at ON public.households;
CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON public.households FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_updated_at ON public.recurring_items;
CREATE TRIGGER update_recurring_updated_at BEFORE UPDATE ON public.recurring_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_lists_updated_at ON public.shopping_lists;
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Procedure Transacional: Criar Household Inicial + Categorias Padrão
CREATE OR REPLACE FUNCTION public.create_initial_household(p_user_id UUID, p_user_name TEXT, p_household_name TEXT DEFAULT 'Nosso Lar')
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_household_id UUID;
BEGIN
    -- Cria perfil se não existir
    INSERT INTO public.profiles (id, full_name)
    VALUES (p_user_id, p_user_name)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Cria o Household
    INSERT INTO public.households (name, monthly_budget)
    VALUES (p_household_name, 1200.00)
    RETURNING id INTO v_household_id;

    -- Associa como admin
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_household_id, p_user_id, 'admin');

    -- Insere categorias padrão acolhedoras
    INSERT INTO public.categories (household_id, name, icon, color, sort_order) VALUES
        (v_household_id, 'Hortifruti', 'apple', '#26593F', 1),
        (v_household_id, 'Mercearia', 'wheat', '#D9532F', 2),
        (v_household_id, 'Laticínios', 'milk', '#3B82F6', 3),
        (v_household_id, 'Carnes & Peixes', 'beef', '#B91C1C', 4),
        (v_household_id, 'Bebidas', 'cup-soda', '#6366F1', 5),
        (v_household_id, 'Padaria', 'croissant', '#D97706', 6),
        (v_household_id, 'Limpeza', 'sparkles', '#0D9488', 7),
        (v_household_id, 'Higiene & Cuidados', 'bath', '#8B5CF6', 8),
        (v_household_id, 'Outros', 'package', '#78716C', 9);

    RETURN v_household_id;
END;
$$;

-- Procedure: Aceitar Convite
CREATE OR REPLACE FUNCTION public.accept_household_invitation(p_token TEXT, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_invitation RECORD;
BEGIN
    SELECT * INTO v_invitation
    FROM public.household_invitations
    WHERE token = p_token AND status = 'pending' AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Convite inválido, expirado ou já utilizado.';
    END IF;

    -- Insere membro no lar
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_invitation.household_id, p_user_id, 'member')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- Atualiza status do convite
    UPDATE public.household_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN v_invitation.household_id;
END;
$$;

-- Procedure: Gerar Lista Mensal a partir da Lista Recorrente
CREATE OR REPLACE FUNCTION public.generate_monthly_list(
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
BEGIN
    IF EXISTS (SELECT 1 FROM public.shopping_lists WHERE household_id = p_household_id AND period_month = p_month AND period_year = p_year) THEN
        RAISE EXCEPTION 'Lista de compras para este mês já existe.';
    END IF;

    v_title := 'Compras ' || TO_CHAR(TO_DATE(p_month::text, 'MM'), 'TMMonth') || '/' || p_year;

    INSERT INTO public.shopping_lists (household_id, title, period_month, period_year, budget_target, status)
    VALUES (p_household_id, v_title, p_month, p_year, p_budget, 'draft')
    RETURNING id INTO v_list_id;

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

-- Procedure: Finalizar Sessão de Compras
CREATE OR REPLACE FUNCTION public.finish_shopping_session(p_session_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total NUMERIC(10,2);
    v_count INT;
    v_list_id UUID;
BEGIN
    SELECT COALESCE(SUM(subtotal), 0), COUNT(*)
    INTO v_total, v_count
    FROM public.cart_items
    WHERE shopping_session_id = p_session_id;

    UPDATE public.shopping_sessions
    SET status = 'completed',
        finished_at = NOW(),
        total_spent = v_total,
        total_items_count = v_count
    WHERE id = p_session_id
    RETURNING shopping_list_id INTO v_list_id;

    IF v_list_id IS NOT NULL THEN
        UPDATE public.shopping_lists
        SET status = 'completed'
        WHERE id = v_list_id;
    END IF;
END;
$$;

-- 15. Ativação de RLS e Políticas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Políticas Profiles
DROP POLICY IF EXISTS "Usuários podem ver perfis do mesmo lar" ON public.profiles;
CREATE POLICY "Usuários podem ver perfis do mesmo lar" ON public.profiles
    FOR SELECT USING (
        id = auth.uid() OR 
        id IN (SELECT user_id FROM public.household_members WHERE household_id = public.get_user_household_id(auth.uid()))
    );

DROP POLICY IF EXISTS "Usuários podem editar seu próprio perfil" ON public.profiles;
CREATE POLICY "Usuários podem editar seu próprio perfil" ON public.profiles
    FOR ALL USING (id = auth.uid());

-- Políticas Households
DROP POLICY IF EXISTS "Membros podem ver seu household" ON public.households;
CREATE POLICY "Membros podem ver seu household" ON public.households
    FOR SELECT USING (id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Membros podem atualizar seu household" ON public.households;
CREATE POLICY "Membros podem atualizar seu household" ON public.households
    FOR UPDATE USING (id = public.get_user_household_id(auth.uid()));

-- Políticas Household Members
DROP POLICY IF EXISTS "Membros podem ver integrantes do mesmo lar" ON public.household_members;
CREATE POLICY "Membros podem ver integrantes do mesmo lar" ON public.household_members
    FOR SELECT USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Apenas admin pode gerenciar membros" ON public.household_members;
CREATE POLICY "Apenas admin pode gerenciar membros" ON public.household_members
    FOR ALL USING (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas Household Invitations
DROP POLICY IF EXISTS "Membros podem ver convites do seu lar" ON public.household_invitations;
CREATE POLICY "Membros podem ver convites do seu lar" ON public.household_invitations
    FOR SELECT USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Admin pode criar convites" ON public.household_invitations;
CREATE POLICY "Admin pode criar convites" ON public.household_invitations
    FOR INSERT WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Políticas Domínio
DROP POLICY IF EXISTS "Acesso total aos membros do household em categories" ON public.categories;
CREATE POLICY "Acesso total aos membros do household em categories" ON public.categories
    FOR ALL USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Acesso total aos membros do household em products" ON public.products;
CREATE POLICY "Acesso total aos membros do household em products" ON public.products
    FOR ALL USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Acesso total aos membros do household em recurring_items" ON public.recurring_items;
CREATE POLICY "Acesso total aos membros do household em recurring_items" ON public.recurring_items
    FOR ALL USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Acesso total aos membros do household em shopping_lists" ON public.shopping_lists;
CREATE POLICY "Acesso total aos membros do household em shopping_lists" ON public.shopping_lists
    FOR ALL USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Acesso total em shopping_list_items" ON public.shopping_list_items;
CREATE POLICY "Acesso total em shopping_list_items" ON public.shopping_list_items
    FOR ALL USING (
        shopping_list_id IN (
            SELECT id FROM public.shopping_lists WHERE household_id = public.get_user_household_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Acesso total aos membros em shopping_sessions" ON public.shopping_sessions;
CREATE POLICY "Acesso total aos membros em shopping_sessions" ON public.shopping_sessions
    FOR ALL USING (household_id = public.get_user_household_id(auth.uid()));

DROP POLICY IF EXISTS "Acesso total em cart_items" ON public.cart_items;
CREATE POLICY "Acesso total em cart_items" ON public.cart_items
    FOR ALL USING (
        shopping_session_id IN (
            SELECT id FROM public.shopping_sessions WHERE household_id = public.get_user_household_id(auth.uid())
        )
    );

DROP POLICY IF EXISTS "Leitura de auditoria pelos membros do lar" ON public.audit_events;
CREATE POLICY "Leitura de auditoria pelos membros do lar" ON public.audit_events
    FOR SELECT USING (household_id = public.get_user_household_id(auth.uid()));

-- 16. Configuração de Publicação Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_sessions;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.cart_items;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_list_items;
EXCEPTION WHEN OTHERS THEN NULL; END $$;
