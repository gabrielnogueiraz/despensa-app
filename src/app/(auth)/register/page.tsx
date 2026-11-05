'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserPlus, GoogleLogo, User, Envelope, LockKey, ArrowRight } from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '';

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
      } else if (data.user) {
        triggerHaptic('success');
        if (next) {
          router.push(next);
        } else {
          router.push('/onboarding');
        }
      }
    } catch {
      setErrorMsg('Erro inesperado ao cadastrar.');
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setErrorMsg('');
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const callbackUrl = next 
        ? `${origin}/auth/callback?next=${encodeURIComponent(next)}` 
        : `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setErrorMsg('Erro ao iniciar cadastro com Google.');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="bg-white border border-stone-200/80 p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center mx-auto shadow-2xs">
          <UserPlus className="w-6 h-6" weight="duotone" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
          Criar Espaço do Lar
        </h2>
        <p className="text-xs text-[#716D66]">
          {next.startsWith('/invite/')
            ? 'Cadastre-se para aceitar o convite e sincronizar o lar'
            : 'Cadastre-se para gerenciar as compras compartilhadas a dois'}
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
        onClick={handleGoogleRegister}
        disabled={googleLoading || loading}
        className="w-full py-3 px-4 rounded-xl bg-white border border-stone-200 text-[#1C1917] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#FAF8F5] active:scale-98 transition-all shadow-2xs disabled:opacity-70"
      >
        <GoogleLogo className="w-4 h-4 text-[#D9532F]" weight="bold" />
        {googleLoading ? 'Conectando ao Google...' : 'Continuar com o Google'}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px bg-stone-200 flex-1" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#A8A29A]">
          ou cadastre com e-mail
        </span>
        <div className="h-px bg-stone-200 flex-1" />
      </div>

      {/* Formulário Tradicional */}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
            Seu Nome
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#A8A29A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ex: Ana Clara"
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#26593F] focus:ring-1 focus:ring-[#26593F] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
            E-mail
          </label>
          <div className="relative">
            <Envelope className="w-4 h-4 text-[#A8A29A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#26593F] focus:ring-1 focus:ring-[#26593F] transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#1C1917] mb-1.5">
            Criar Senha
          </label>
          <div className="relative">
            <LockKey className="w-4 h-4 text-[#A8A29A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-stone-200 rounded-xl text-xs text-[#1C1917] focus:outline-none focus:border-[#26593F] focus:ring-1 focus:ring-[#26593F] transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full py-3.5 px-4 rounded-xl bg-[#26593F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1D4330] active:scale-98 transition-all shadow-xs disabled:opacity-70"
        >
          {loading ? 'Criando espaço...' : 'Cadastrar e Começar'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="text-center pt-2">
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : '/login'}
          className="text-xs font-semibold text-[#716D66] hover:text-[#1C1917]"
        >
          Já tem conta? <span className="text-[#26593F] underline">Fazer login</span>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center text-xs text-[#716D66] p-8">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
