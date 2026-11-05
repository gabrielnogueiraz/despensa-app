-- ==============================================================================
-- MIGRAÇÃO: CORREÇÃO DEFINITIVA DE RECURSÃO INFINITA EM RLS (ERRO 42P17)
-- Arquivo: 20241105000004_fix_household_members_rls_recursion.sql
-- ==============================================================================

-- 1. FUNÇÃO get_user_household_id EM PL/pgSQL COM SECURITY DEFINER E SEARCH_PATH
-- O uso de plpgsql impede que o PostgreSQL faça o inlining da consulta,
-- executando como superuser e ignorando o RLS de household_members, quebrando o loop.
CREATE OR REPLACE FUNCTION public.get_user_household_id(p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_household_id UUID;
BEGIN
    SELECT household_id INTO v_household_id
    FROM public.household_members
    WHERE user_id = p_user_id
    LIMIT 1;
    
    RETURN v_household_id;
END;
$$;

-- 2. FUNÇÃO is_household_admin EM PL/pgSQL
CREATE OR REPLACE FUNCTION public.is_household_admin(p_household_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.household_members
        WHERE household_id = p_household_id AND user_id = p_user_id AND role = 'admin'
    );
END;
$$;

-- 3. REMOVE AS POLÍTICAS QUE CAUSAVAM RECURSÃO INFINITA
DROP POLICY IF EXISTS "Apenas admin pode gerenciar membros" ON public.household_members;
DROP POLICY IF EXISTS "Membros podem ver integrantes do mesmo lar" ON public.household_members;
DROP POLICY IF EXISTS "Membros veem integrantes do lar" ON public.household_members;
DROP POLICY IF EXISTS "Admin insere membros" ON public.household_members;
DROP POLICY IF EXISTS "Admin atualiza membros" ON public.household_members;
DROP POLICY IF EXISTS "Admin remove membros ou saida propria" ON public.household_members;

-- 4. POLÍTICAS SEGURAS E NÃO-RECURSIVAS PARA household_members
-- Permite leitura se a linha pertence ao próprio usuário OU se pertence ao mesmo lar do usuário (via função plpgsql)
CREATE POLICY "Membros veem integrantes do lar" ON public.household_members
    FOR SELECT USING (
        user_id = auth.uid() OR 
        household_id = public.get_user_household_id(auth.uid())
    );

CREATE POLICY "Admin insere membros" ON public.household_members
    FOR INSERT WITH CHECK (public.is_household_admin(household_id, auth.uid()));

CREATE POLICY "Admin atualiza membros" ON public.household_members
    FOR UPDATE USING (public.is_household_admin(household_id, auth.uid()));

CREATE POLICY "Admin remove membros ou saida propria" ON public.household_members
    FOR DELETE USING (public.is_household_admin(household_id, auth.uid()) OR user_id = auth.uid());

-- 5. PERMISSÕES DE EXECUÇÃO
GRANT EXECUTE ON FUNCTION public.get_user_household_id(UUID) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.is_household_admin(UUID, UUID) TO authenticated, anon, service_role;
