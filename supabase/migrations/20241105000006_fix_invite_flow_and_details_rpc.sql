-- ==============================================================================
-- CORREÇÃO DO FLUXO DE CONVITES, RPC DE DETALHES E ORDENAÇÃO DE MEMBROS
-- Arquivo: 20241105000006_fix_invite_flow_and_details_rpc.sql
-- ==============================================================================

-- 1. Garante que get_user_household_id sempre priorize o lar mais recente
CREATE OR REPLACE FUNCTION public.get_user_household_id(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_household_id UUID;
BEGIN
    SELECT household_id INTO v_household_id
    FROM public.household_members
    WHERE user_id = p_user_id
    ORDER BY joined_at DESC
    LIMIT 1;
    
    RETURN v_household_id;
END;
$$;

-- 2. RPC pública segura para ler detalhes do convite antes do login
CREATE OR REPLACE FUNCTION public.get_invitation_details(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_inv RECORD;
BEGIN
    SELECT i.*, h.name as h_name, p.full_name as inviter
    INTO v_inv
    FROM public.household_invitations i
    JOIN public.households h ON h.id = i.household_id
    LEFT JOIN public.profiles p ON p.id = i.invited_by
    WHERE i.token = p_token AND i.status = 'pending' AND i.expires_at > NOW();

    IF NOT FOUND THEN
        RETURN json_build_object('valid', false);
    END IF;

    RETURN json_build_object(
        'valid', true,
        'household_id', v_inv.household_id,
        'household_name', v_inv.h_name,
        'inviter_name', COALESCE(v_inv.inviter, 'Alguém'),
        'expires_at', v_inv.expires_at
    );
END;
$$;

-- 3. Atualiza accept_household_invitation para associar com o lar convidado e atualizar status
CREATE OR REPLACE FUNCTION public.accept_household_invitation(p_token text, p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

    -- Insere membro no lar do convite
    INSERT INTO public.household_members (household_id, user_id, role, joined_at)
    VALUES (v_invitation.household_id, p_user_id, 'member', NOW())
    ON CONFLICT (household_id, user_id) 
    DO UPDATE SET role = 'member', joined_at = NOW();

    -- Atualiza status do convite
    UPDATE public.household_invitations
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = v_invitation.id;

    RETURN v_invitation.household_id;
END;
$$;
