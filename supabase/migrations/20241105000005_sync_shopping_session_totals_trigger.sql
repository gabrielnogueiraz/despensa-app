-- ==============================================================================
-- TRIGGER: ATUALIZAÇÃO EM TEMPO REAL DE TOTAL_SPENT EM SHOPPING_SESSIONS
-- Arquivo: 20241105000005_sync_shopping_session_totals_trigger.sql
-- ==============================================================================

-- 1. Garante que shopping_sessions possui a coluna updated_at
ALTER TABLE public.shopping_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Trigger function para recalcular totais automaticamente
CREATE OR REPLACE FUNCTION public.sync_shopping_session_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id UUID;
    v_total NUMERIC(10, 2);
    v_count INT;
BEGIN
    v_session_id := COALESCE(NEW.shopping_session_id, OLD.shopping_session_id);

    SELECT COALESCE(SUM(subtotal), 0), COUNT(*)
    INTO v_total, v_count
    FROM public.cart_items
    WHERE shopping_session_id = v_session_id;

    UPDATE public.shopping_sessions
    SET total_spent = v_total,
        total_items_count = v_count,
        updated_at = NOW()
    WHERE id = v_session_id;

    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_cart_items_totals ON public.cart_items;
CREATE TRIGGER trigger_sync_cart_items_totals
AFTER INSERT OR UPDATE OR DELETE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.sync_shopping_session_totals();

