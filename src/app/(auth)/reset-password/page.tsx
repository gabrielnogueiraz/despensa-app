'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LockSimple, CheckCircle } from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        triggerHaptic('success');
        router.push('/');
      }
    } catch {
      setErrorMsg('Falha ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center mx-auto shadow-2xs">
          <LockSimple className="w-6 h-6" weight="duotone" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
          Criar Nova Senha
        </h2>
        <p className="text-xs text-[#716D66]">
          Digite a sua nova senha de acesso
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FDEEE9] border border-[#D9532F]/20 rounded-xl text-xs font-semibold text-[#D9532F]">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#716D66] mb-1">
            Nova Senha (mínimo 6 caracteres)
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-sm font-medium focus:outline-none focus:border-[#26593F]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#26593F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1D4330] active:scale-98 transition-all shadow-xs disabled:opacity-70"
        >
          {loading ? 'Atualizando...' : 'Salvar Nova Senha'}
        </button>
      </form>
    </div>
  );
}
