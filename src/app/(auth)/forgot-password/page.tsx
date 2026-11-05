'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Key, ArrowLeft, CheckCircle } from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        triggerHaptic('success');
        setSent(true);
      }
    } catch {
      setErrorMsg('Não foi possível enviar o e-mail de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto shadow-2xs">
          <Key className="w-6 h-6" weight="duotone" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
          Recuperar Senha
        </h2>
        <p className="text-xs text-[#716D66]">
          Enviaremos um link de redefinição para o seu e-mail
        </p>
      </div>

      {sent ? (
        <div className="bg-[#ECF5F0] border border-[#26593F]/20 p-4 rounded-2xl text-center space-y-2">
          <CheckCircle className="w-8 h-8 text-[#26593F] mx-auto" weight="duotone" />
          <h4 className="text-sm font-bold text-[#1C1917]">E-mail Enviado</h4>
          <p className="text-xs text-[#716D66] leading-relaxed">
            Verifique a caixa de entrada de <strong>{email}</strong> e siga as instruções.
          </p>
          <div className="pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#26593F] hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar para o login
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-[#FDEEE9] border border-[#D9532F]/20 rounded-xl text-xs font-semibold text-[#D9532F]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#716D66] mb-1">
              Seu e-mail cadastrado
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-sm font-medium focus:outline-none focus:border-[#D9532F]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#D9532F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs disabled:opacity-70"
          >
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#716D66] hover:text-[#1C1917]"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar ao login
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
