'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, CheckCircle, ArrowRight, GoogleLogo, House, WarningCircle, CircleNotch } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '@/lib/haptics';

interface InvitationDetails {
  valid: boolean;
  household_id?: string;
  household_name?: string;
  inviter_name?: string;
  expires_at?: string;
}

function InviteContent() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;

  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) return;

    // 1. Armazena token em cookie e localStorage para persistência em fluxos OAuth
    try {
      localStorage.setItem('despensa_invite_token', token);
      document.cookie = `despensa_invite_token=${token}; path=/; max-age=604800; SameSite=Lax`;
    } catch {
      // Ignora erro de storage restrito
    }

    async function loadData() {
      try {
        const supabase = createClient() as any;

        // Checa usuário atual
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Busca detalhes públicos do convite
        const { data, error } = await supabase.rpc('get_invitation_details', {
          p_token: token,
        });

        if (!error && data) {
          setInviteDetails(data as InvitationDetails);
        } else {
          setInviteDetails({ valid: false });
        }
      } catch (err) {
        console.error('Erro ao checar convite:', err);
        setInviteDetails({ valid: false });
      } finally {
        setChecking(false);
      }
    }

    loadData();
  }, [token]);

  const handleAccept = async () => {
    if (!currentUser) return;

    triggerHaptic('success');
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase.rpc('accept_household_invitation', {
        p_token: token,
        p_user_id: currentUser.id,
      });

      if (error) {
        console.error('Erro ao aceitar convite:', error);
        setErrorMsg(error.message || 'Falha ao aceitar o convite.');
        setLoading(false);
        return;
      }

      // Limpa dados de convite pendente
      try {
        localStorage.removeItem('despensa_invite_token');
        document.cookie = 'despensa_invite_token=; path=/; max-age=0';
      } catch {
        // ignore
      }

      setAccepted(true);
      try {
        confetti({
          particleCount: 100,
          spread: 75,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        router.push('/');
      }, 1200);
    } catch {
      setErrorMsg('Falha ao aceitar o convite. Tente novamente.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/invite/${token}`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMsg('Erro ao conectar ao Google.');
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="max-w-md w-full mx-auto bg-white border border-stone-200/80 p-8 rounded-3xl shadow-sm text-center space-y-4">
        <CircleNotch className="w-8 h-8 text-[#D9532F] animate-spin mx-auto" />
        <p className="text-xs font-semibold text-[#716D66]">Verificando convite...</p>
      </div>
    );
  }

  if (inviteDetails && !inviteDetails.valid) {
    return (
      <div className="max-w-md w-full mx-auto bg-white border border-stone-200/80 p-8 rounded-3xl shadow-sm text-center space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto">
          <WarningCircle className="w-8 h-8" weight="duotone" />
        </div>
        <h2 className="text-xl font-extrabold text-[#1C1917]">Convite Indisponível</h2>
        <p className="text-xs text-[#716D66] leading-relaxed">
          Este link de convite expirou, já foi utilizado ou não é mais válido. Peça ao administrador do lar para gerar um novo convite.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#26593F] text-white font-bold text-xs hover:bg-[#1D4330] transition-all"
        >
          <House className="w-4 h-4" /> Ir para a página inicial
        </Link>
      </div>
    );
  }

  const householdName = inviteDetails?.household_name || 'Nosso Lar';
  const inviterName = inviteDetails?.inviter_name || 'Seu parceiro(a)';

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-stone-200/80 p-6 md:p-8 rounded-3xl shadow-sm text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto shadow-xs">
        <Heart className="w-8 h-8" weight="fill" />
      </div>

      <div>
        <span className="text-xs font-bold text-[#26593F] uppercase tracking-wider block">
          Convite Compartilhado
        </span>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight mt-1">
          Entrar em {householdName}
        </h2>
        <p className="text-xs text-[#716D66] mt-2 leading-relaxed">
          <strong className="text-[#1C1917]">{inviterName}</strong> convidou você para compartilhar as compras, despensa e orçamento da casa.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FDEEE9] border border-[#D9532F]/20 rounded-xl text-xs font-semibold text-[#D9532F]">
          {errorMsg}
        </div>
      )}

      <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/80 text-left space-y-3 text-xs">
        <div className="flex items-center gap-2.5 text-[#1C1917] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
          Lista de compras mensal sincronizada em tempo real
        </div>
        <div className="flex items-center gap-2.5 text-[#1C1917] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
          Modo supermercado com acompanhamento ao vivo a dois
        </div>
        <div className="flex items-center gap-2.5 text-[#1C1917] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
          Controle automático de gastos e orçamento familiar
        </div>
      </div>

      {/* Ações dependendo do estado de autenticação */}
      {currentUser ? (
        <button
          type="button"
          onClick={handleAccept}
          disabled={accepted || loading}
          className="w-full py-4 px-6 rounded-2xl bg-[#26593F] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#1D4330] active:scale-98 transition-all shadow-md disabled:opacity-80"
        >
          {accepted ? (
            <>
              <CheckCircle className="w-5 h-5" weight="fill" />
              Convite Aceito! Entrando...
            </>
          ) : (
            <>
              {loading ? 'Entrando no Lar...' : `Aceitar e Entrar em ${householdName}`}
              <ArrowRight className="w-5 h-5" weight="bold" />
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-stone-200 text-[#1C1917] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#FAF8F5] active:scale-98 transition-all shadow-xs disabled:opacity-70"
          >
            <GoogleLogo className="w-5 h-5 text-[#D9532F]" weight="bold" />
            {loading ? 'Conectando ao Google...' : 'Entrar com Google para Aceitar'}
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px bg-stone-200 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29A]">
              ou com e-mail
            </span>
            <div className="h-px bg-stone-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/login?next=/invite/${token}`}
              className="py-2.5 px-3 rounded-xl bg-[#FAF8F5] border border-stone-200 text-[#1C1917] font-bold text-xs text-center hover:bg-stone-100 transition-all"
            >
              Fazer Login
            </Link>
            <Link
              href={`/register?next=/invite/${token}`}
              className="py-2.5 px-3 rounded-xl bg-[#26593F] text-white font-bold text-xs text-center hover:bg-[#1D4330] transition-all"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      )}

      <span className="text-[11px] text-[#A8A29A] block">
        Espaço: {householdName} • Token: {token ? token.slice(0, 8) : '...'}
      </span>
    </div>
  );
}

export default function InviteAcceptPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center px-4 py-12">
      <Suspense fallback={<div className="text-center text-xs text-[#716D66]">Carregando convite...</div>}>
        <InviteContent />
      </Suspense>
    </div>
  );
}
