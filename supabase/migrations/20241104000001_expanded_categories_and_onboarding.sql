-- Migração 000001: Categorias Expandidas, Onboarding e Precisão de Quantidades
-- Data: 2024-11-04

-- 1. Campos de Onboarding no Household
ALTER TABLE public.households 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS shopping_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS preferred_shopping_day INT;

-- 2. Ajuste de Precisão Numérica para Quantidades e Pesos Fracionados
ALTER TABLE public.products ALTER COLUMN default_price TYPE NUMERIC(10, 2);
ALTER TABLE public.recurring_items ALTER COLUMN target_quantity TYPE NUMERIC(10, 3);
ALTER TABLE public.shopping_list_items ALTER COLUMN planned_quantity TYPE NUMERIC(10, 3);

-- Ajuste em cart_items: remove coluna gerada, altera o tipo de quantity e recria a coluna gerada
ALTER TABLE public.cart_items DROP COLUMN IF EXISTS subtotal;
ALTER TABLE public.cart_items ALTER COLUMN quantity TYPE NUMERIC(10, 3);
ALTER TABLE public.cart_items ADD COLUMN subtotal NUMERIC(10, 2) GENERATED ALWAYS AS ((quantity * unit_price) - discount) STORED;

-- 3. Procedure Idempotente para Inserir Categorias Padrão Expandidas
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
        ('Higiene Bucal', 'Smiley', '#2563EB', 22),
        ('Descartáveis & Utilidades', 'Trash', '#64748B', 23),
        ('Pet Shop', 'PawPrint', '#78716C', 24),
        ('Outros', 'DotsThree', '#716D66', 25)
    ) AS c(name, icon, color, sort_order)
    WHERE NOT EXISTS (
        SELECT 1 FROM public.categories cat
        WHERE cat.household_id = p_household_id AND cat.name = c.name
    );
END;
$$;

-- 4. Atualização da Procedure de Criação Inicial de Household
CREATE OR REPLACE FUNCTION public.create_initial_household(
    p_user_id UUID, 
    p_user_name TEXT, 
    p_household_name TEXT DEFAULT 'Nosso Lar',
    p_budget NUMERIC DEFAULT 0.00,
    p_frequency TEXT DEFAULT 'monthly'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_household_id UUID;
BEGIN
    -- Cria ou atualiza perfil
    INSERT INTO public.profiles (id, full_name)
    VALUES (p_user_id, p_user_name)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

    -- Cria o Household
    INSERT INTO public.households (name, monthly_budget, shopping_frequency, onboarding_completed_at)
    VALUES (p_household_name, p_budget, p_frequency, NOW())
    RETURNING id INTO v_household_id;

    -- Vincula o criador como Admin
    INSERT INTO public.household_members (household_id, user_id, role)
    VALUES (v_household_id, p_user_id, 'admin')
    ON CONFLICT (household_id, user_id) DO NOTHING;

    -- Popula categorias padrão expandidas
    PERFORM public.seed_default_categories(v_household_id);

    RETURN v_household_id;
END;
$$;
