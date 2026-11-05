-- ==============================================================================
-- SCRIPT DE RESET COMPLETO DO BANCO DE DADOS (Zerar Dados de Teste)
-- Arquivo: reset_database.sql
-- Executar no SQL Editor do Supabase para começar 100% do zero
-- ==============================================================================

-- Desabilita triggers temporariamente para limpeza em cascata
SET session_replication_role = 'replica';

TRUNCATE TABLE public.audit_events CASCADE;
TRUNCATE TABLE public.cart_items CASCADE;
TRUNCATE TABLE public.shopping_sessions CASCADE;
TRUNCATE TABLE public.shopping_list_items CASCADE;
TRUNCATE TABLE public.shopping_lists CASCADE;
TRUNCATE TABLE public.recurring_items CASCADE;
TRUNCATE TABLE public.products CASCADE;
TRUNCATE TABLE public.categories CASCADE;
TRUNCATE TABLE public.household_invitations CASCADE;
TRUNCATE TABLE public.household_members CASCADE;
TRUNCATE TABLE public.households CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- Reativa triggers
SET session_replication_role = 'origin';

-- Confirmação
SELECT 'Banco de dados limpo com sucesso! Você pode realizar o login e onboarding do zero.' AS status;
