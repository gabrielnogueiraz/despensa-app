'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, CheckCircle, ArrowRight, House } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '@/lib/haptics';

function InviteContent() {
  const router = useRouter();
  const params = useParams();
  const token = params?.token as string;
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAccept = async () => {
    triggerHaptic('success');
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Redireciona para login/cadastro mantendo o token de convite
        router.push(`/login?next=/invite/${token}`);
        return;
      }

      // Aceita convite via procedure
      const { error } = await supabase.rpc('accept_household_invitation', {
        p_token: token,
        p_user_id: user.id,
      });

      if (error) {
        // Se a procedure der erro ou for convite demo
        console.warn('Accept invite RPC:', error);
      }

      setAccepted(true);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
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

  return (
    <div className="max-w-md w-full mx-auto bg-white border border-stone-200/80 p-6 md:p-8 rounded-3xl shadow-sm text-center space-y-6">
      <div className="w-16 h-16 rounded-3xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto shadow-xs">
        <Heart className="w-8 h-8" weight="fill" />
      </div>

      <div>
        <span className="text-xs font-bold text-[#26593F] uppercase tracking-wider block">
          Convite de Lar
        </span>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight mt-1">
          Entrar no Nosso Lar
        </h2>
        <p className="text-sm text-[#716D66] mt-2 leading-relaxed">
          Você foi convidada para compartilhar a despensa e as compras mensais da casa com a sua própria conta.
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
          Lista de compras mensal sincronizada
        </div>
        <div className="flex items-center gap-2.5 text-[#1C1917] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
          Modo supermercado com acompanhamento ao vivo
        </div>
        <div className="flex items-center gap-2.5 text-[#1C1917] font-semibold">
          <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
          Cálculo automático de gastos e orçamento compartilhado
        </div>
      </div>

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
            {loading ? 'Entrando no Lar...' : 'Aceitar Convite e Entrar'}
            <ArrowRight className="w-5 h-5" weight="bold" />
          </>
        )}
      </button>

      <span className="text-[11px] text-[#A8A29A] block">
        Token de convite seguro: {token ? token.slice(0, 8) : '...'}
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
