'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useDespensa } from '@/features/context/despensa-context';
import { EXPANDED_CATEGORIES, ONBOARDING_PRODUCT_SUGGESTIONS } from '@/lib/constants/initial-data';
import {
  House,
  CalendarCheck,
  ShoppingBag,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkle,
  Plus,
  CircleNotch,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';
import confetti from 'canvas-confetti';

export default function OnboardingPage() {
  const router = useRouter();
  const { refreshData } = useDespensa();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Preparando seu espaço...');
  const [errorMsg, setErrorMsg] = useState('');

  // Previne que usuários com convite pendente ou que já possuem lar fiquem presos no onboarding
  useEffect(() => {
    async function checkExisting() {
      try {
        const pendingToken = typeof window !== 'undefined' ? localStorage.getItem('despensa_invite_token') : null;
        if (pendingToken) {
          router.replace(`/invite/${pendingToken}`);
          return;
        }

        const supabase = createClient() as any;
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: member } = await supabase
            .from('household_members')
            .select('household_id')
            .eq('user_id', user.id)
            .order('joined_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (member?.household_id) {
            router.replace('/');
          }
        }
      } catch (err) {
        console.error('Erro ao verificar status no onboarding:', err);
      }
    }
    checkExisting();
  }, [router]);

  // Etapa 1: Espaço
  const [householdName, setHouseholdName] = useState('Nosso Lar');

  // Etapa 2: Organização
  const [frequency, setFrequency] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [monthlyBudget, setMonthlyBudget] = useState('1200,00');

  // Etapa 3: Primeira Lista
  const [listChoice, setListChoice] = useState<'suggestions' | 'manual' | 'later'>('suggestions');
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>(
    ONBOARDING_PRODUCT_SUGGESTIONS.slice(0, 8).map((s) => s.id)
  );

  const toggleSuggestion = (id: string) => {
    triggerHaptic('light');
    setSelectedSuggestions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic('light');
    if (step < 3) {
      setStep((prev) => (prev + 1) as 2 | 3);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    setErrorMsg('');
    setLoadingMessage('Preparando seu espaço...');
    triggerHaptic('light');

    try {
      const supabase = createClient() as any;
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const budgetNum = parseFloat(monthlyBudget.replace(/\./g, '').replace(',', '.')) || 0;
      const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Você';
      const userAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
      const finalName = householdName.trim() || 'Nosso Lar';
      const tripsPerMonth = frequency === 'weekly' ? 4 : frequency === 'biweekly' ? 2 : 1;
      const targetTicket = budgetNum > 0 ? Math.round((budgetNum / tripsPerMonth) * 100) / 100 : 0;

      // Monta produtos formatados caso o usuário tenha escolhido sugestões
      const productsPayload = listChoice === 'suggestions'
        ? ONBOARDING_PRODUCT_SUGGESTIONS
            .filter((s) => selectedSuggestions.includes(s.id))
            .map((item) => {
              const catSeed = EXPANDED_CATEGORIES.find((c) => c.id === item.category_id);
              return {
                name: item.name,
                category_name: catSeed?.name || 'Outros',
                default_unit: item.default_unit,
                default_price: item.default_price,
                target_qty: item.target_qty,
              };
            })
        : [];

      setLoadingMessage('Organizando suas categorias e orçamento...');

      // 1. Tenta RPC atômica completa
      let createdHouseholdId: string | null = null;
      let createdShoppingListId: string | null = null;

      const { data: rpcResult, error: rpcError } = await supabase.rpc('complete_onboarding_transaction', {
        p_user_id: user.id,
        p_user_name: userName,
        p_household_name: finalName,
        p_budget: budgetNum,
        p_frequency: frequency,
        p_avatar_url: userAvatar,
        p_products: productsPayload,
        p_ticket_target: targetTicket,
      });

      if (!rpcError && rpcResult?.household_id) {
        createdHouseholdId = rpcResult.household_id;
        createdShoppingListId = rpcResult.shopping_list_id;
      } else {
        // Fallback caso a procedure precise de execução manual via client
        setLoadingMessage('Criando seu espaço no banco de dados...');
        const { data: hhId, error: hhErr } = await supabase.rpc('create_initial_household', {
          p_user_id: user.id,
          p_user_name: userName,
          p_household_name: finalName,
          p_budget: budgetNum,
          p_frequency: frequency,
          p_avatar_url: userAvatar,
          p_ticket_target: targetTicket,
        });

        if (hhErr || !hhId) {
          // Fallback direto via tabelas se as RPCs falharem
          const { data: insertedHh } = await supabase
            .from('households')
            .insert({
              name: finalName,
              monthly_budget: budgetNum,
              shopping_frequency: frequency,
              average_ticket_target: targetTicket,
              onboarding_completed_at: new Date().toISOString(),
            })
            .select('id')
            .single();

          if (insertedHh) {
            createdHouseholdId = insertedHh.id;
            await supabase.from('household_members').upsert({
              household_id: insertedHh.id,
              user_id: user.id,
              role: 'admin',
            });
            await supabase.rpc('seed_default_categories', { p_household_id: insertedHh.id });
          } else {
            throw new Error(hhErr?.message || 'Falha ao criar lar no Supabase.');
          }
        } else {
          createdHouseholdId = hhId;
        }

        // Garante que o lar tenha os dados de onboarding atualizados
        await supabase
          .from('households')
          .update({
            name: finalName,
            monthly_budget: budgetNum,
            shopping_frequency: frequency,
            average_ticket_target: targetTicket,
            onboarding_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', createdHouseholdId);

        // Garante criação da primeira lista mensal
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const { data: listId } = await supabase.rpc('get_or_create_monthly_list', {
          p_household_id: createdHouseholdId,
          p_month: month,
          p_year: year,
          p_budget: budgetNum,
        });
        createdShoppingListId = listId;

        if (productsPayload.length > 0) {
          setLoadingMessage('Cadastrando sua lista inicial...');
          const { data: dbCategories } = await supabase
            .from('categories')
            .select('id, name')
            .eq('household_id', createdHouseholdId);

          const catMap = new Map<string, string>();
          if (dbCategories) {
            dbCategories.forEach((c: any) => catMap.set(c.name, c.id));
          }

          for (const item of productsPayload) {
            const catId = catMap.get(item.category_name) || null;
            const { data: newProd } = await supabase
              .from('products')
              .insert({
                household_id: createdHouseholdId,
                name: item.name,
                category_id: catId,
                default_unit: item.default_unit,
                default_price: item.default_price,
              })
              .select('id')
              .single();

            if (newProd) {
              await supabase.from('recurring_items').insert({
                household_id: createdHouseholdId,
                product_id: newProd.id,
                target_quantity: item.target_qty,
                unit: item.default_unit,
                is_active: true,
              });

              // Insere diretamente na lista de compras ativa
              if (createdShoppingListId) {
                await supabase.from('shopping_list_items').insert({
                  shopping_list_id: createdShoppingListId,
                  product_id: newProd.id,
                  custom_name: item.name,
                  category_id: catId,
                  planned_quantity: item.target_qty,
                  unit: item.default_unit,
                  estimated_price: item.default_price,
                  is_added_during_shopping: false,
                });
              }
            }
          }
        }
      }

      setLoadingMessage('Quase tudo pronto...');
      // 2. Atualiza os dados no contexto global da aplicação
      await refreshData();

      setLoadingMessage('Tudo pronto!');
      triggerHaptic('success');

      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      setTimeout(() => {
        router.push('/');
      }, 700);
    } catch (err: any) {
      console.error('Erro no onboarding:', err);
      setErrorMsg(err?.message || 'Ocorreu um erro ao salvar suas informações. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-center px-4 py-8 md:py-16">
      <div className="max-w-xl w-full mx-auto bg-white border border-stone-200/80 p-6 md:p-10 rounded-3xl shadow-sm space-y-6">
        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#716D66]">
            <span>Configuração do Lar</span>
            <span>Etapa {step} de 3</span>
          </div>
          <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D9532F] rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-[#FDEEE9] border border-[#D9532F]/20 rounded-xl text-xs font-semibold text-[#D9532F] flex items-center justify-between">
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ETAPA 1: O ESPAÇO */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center shadow-2xs">
                <House className="w-6 h-6" weight="duotone" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
                Como devemos chamar o seu espaço?
              </h2>
              <p className="text-sm text-[#716D66] leading-relaxed">
                Este é o nome do espaço compartilhado entre você e quem divide as compras com você.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#716D66] mb-1.5">
                Nome do Espaço Doméstico
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Nosso Lar, Casa da Família, Apê 42"
                required
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-stone-200 text-base font-semibold focus:outline-none focus:border-[#D9532F]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#D9532F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ETAPA 2: ORGANIZAÇÃO & ORÇAMENTO */}
        {step === 2 && (
          <form onSubmit={handleNextStep} className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center shadow-2xs">
                <CalendarCheck className="w-6 h-6" weight="duotone" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
                Como vocês se organizam?
              </h2>
              <p className="text-sm text-[#716D66] leading-relaxed">
                Defina o ritmo de compras e o orçamento mensal de gastos para o acompanhamento ao vivo.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-[#716D66]">
                Frequência habitual de idas ao supermercado
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'weekly', label: 'Semanal' },
                  { id: 'biweekly', label: 'Quinzenal' },
                  { id: 'monthly', label: 'Mensal' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setFrequency(f.id as typeof frequency);
                    }}
                    className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all ${
                      frequency === f.id
                        ? 'bg-[#1C1917] text-white border-[#1C1917] shadow-2xs'
                        : 'bg-[#FAF8F5] border-stone-200 text-[#716D66] hover:bg-[#F3EFE9]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#716D66] mb-1.5">
                Orçamento Mensal Estimado
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#716D66]">
                  R$
                </span>
                <input
                  type="text"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  placeholder="1200,00"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#FAF8F5] border border-stone-200 text-base font-bold tabular-nums focus:outline-none focus:border-[#26593F]"
                />
              </div>
              <span className="text-[11px] text-[#A8A29A] mt-1 block">
                Você poderá alterar esse valor a qualquer momento nas configurações.
              </span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-3.5 px-4 rounded-xl border border-stone-200 text-[#716D66] font-bold text-sm hover:bg-[#FAF8F5]"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="submit"
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#26593F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1D4330] active:scale-98 transition-all shadow-xs"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 3: PRIMEIRA LISTA */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shadow-2xs">
                <ShoppingBag className="w-6 h-6" weight="duotone" />
              </div>
              <h2 className="text-2xl font-extrabold text-[#1C1917] tracking-tight">
                Como deseja iniciar a sua despensa?
              </h2>
              <p className="text-sm text-[#716D66] leading-relaxed">
                Você pode começar com sugestões de itens comuns e editá-los, ou começar do zero.
              </p>
            </div>

            {/* Opções de Início */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'suggestions',
                  title: 'Com Sugestões',
                  desc: 'Escolha itens básicos para adiantar',
                  icon: Sparkle,
                },
                {
                  id: 'manual',
                  title: 'Começar do Zero',
                  desc: 'Cadastrar tudo do seu jeito',
                  icon: Plus,
                },
                {
                  id: 'later',
                  title: 'Configurar Depois',
                  desc: 'Ir direto para o aplicativo',
                  icon: ArrowRight,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = listChoice === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      triggerHaptic('light');
                      setListChoice(opt.id as typeof listChoice);
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#FAF8F5] border-[#D9532F] ring-2 ring-[#D9532F]/20'
                        : 'bg-white border-stone-200/80 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <Icon
                      className={`w-6 h-6 mb-3 ${
                        isSelected ? 'text-[#D9532F]' : 'text-[#716D66]'
                      }`}
                      weight="duotone"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1917]">
                        {opt.title}
                      </h4>
                      <p className="text-xs text-[#716D66] mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Lista de Seleção de Sugestões (se optou por sugestões) */}
            {listChoice === 'suggestions' && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#716D66]">
                  <span>Selecione os itens que você costuma comprar:</span>
                  <span>{selectedSuggestions.length} selecionados</span>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 divide-y divide-stone-100 border border-stone-200/80 rounded-2xl p-2 bg-[#FAF8F5]">
                  {ONBOARDING_PRODUCT_SUGGESTIONS.map((item) => {
                    const isChecked = selectedSuggestions.includes(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => !loading && toggleSuggestion(item.id)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-colors ${
                          isChecked ? 'bg-white shadow-2xs' : 'hover:bg-white/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-[#26593F] border-[#26593F] text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isChecked && <CheckCircle className="w-3.5 h-3.5" weight="bold" />}
                          </div>
                          <span className="text-xs font-semibold text-[#1C1917]">
                            {item.name}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#716D66]">
                          {item.target_qty} {item.default_unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback de processamento durante a finalização */}
            {loading && (
              <div className="p-4 bg-[#FAF8F5] border border-stone-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
                <CircleNotch className="w-5 h-5 text-[#D9532F] animate-spin shrink-0" />
                <span className="text-xs font-bold text-[#1C1917]">{loadingMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setStep(2)}
                className="py-3.5 px-4 rounded-xl border border-stone-200 text-[#716D66] font-bold text-sm hover:bg-[#FAF8F5] disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleFinish}
                disabled={loading}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#D9532F] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? loadingMessage : 'Concluir e Começar'}
                {!loading && <CheckCircle className="w-4 h-4" weight="bold" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
