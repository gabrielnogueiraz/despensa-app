'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SignIn, GoogleLogo, Envelope, LockKey, ArrowRight } from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message === 'Invalid login credentials' 
          ? 'E-mail ou senha incorretos.' 
          : error.message);
        setLoading(false);
      } else if (data.user) {
        triggerHaptic('success');
        
        // Verifica se usuário já tem household
        const { data: member } = await supabase
          .from('household_members')
          .select('household_id')
          .eq('user_id', data.user.id)
          .limit(1)
          .maybeSingle();

        if (!member) {
          router.push('/onboarding');
        } else {
          router.push('/');
        }
      }
    } catch {
      setErrorMsg('Erro inesperado ao conectar.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg('Erro ao iniciar login com Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto shadow-2xs">
          <SignIn className="w-6 h-6" weight="duotone" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
          Entrar no Despensa
        </h2>
        <p className="text-xs text-[#716D66]">
          Compras domésticas e controle de gastos compartilhados
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#FDEEE9] border border-[#D9532F]/20 rounded-xl text-xs font-semibold text-[#D9532F]">
          {errorMsg}
        </div>
      )}

      {/* Botão Google OAuth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading}
        className="w-full py-3 px-4 rounded-xl bg-white border border-stone-200 text-[#1C1917] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FAF8F5] active:scale-98 transition-all shadow-2xs disabled:opacity-70"
      >
        <GoogleLogo className="w-4 h-4 text-[#D9532F]" weight="bold" />
        {googleLoading ? 'Conectando ao Google...' : 'Continuar com o Google'}
      </button>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-stone-200" />
        <span className="flex-shrink mx-3 text-xs text-[#A8A29A]">ou com e-mail</span>
        <div className="flex-grow border-t border-stone-200" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[#716D66] mb-1">
            E-mail
          </label>
          <div className="relative">
            <Envelope className="w-4 h-4 text-[#A8A29A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-sm font-medium focus:outline-none focus:border-[#D9532F]"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-[#716D66]">
              Senha
            </label>
            <Link
              href="/forgot-password"
              className="text-[11px] text-[#D9532F] hover:underline font-medium"
            >
              Esqueceu?
            </Link>
          </div>
          <div className="relative">
            <LockKey className="w-4 h-4 text-[#A8A29A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-sm font-medium focus:outline-none focus:border-[#D9532F]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#D9532F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs disabled:opacity-70"
        >
          {loading ? 'Entrando...' : 'Entrar'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          href="/register"
          className="text-xs font-semibold text-[#716D66] hover:text-[#1C1917]"
        >
          Não tem conta? <span className="text-[#D9532F] underline">Cadastre-se</span>
        </Link>
      </div>
    </div>
  );
}
