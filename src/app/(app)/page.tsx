'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDespensa } from '@/features/context/despensa-context';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { SpendingTrendChart } from '@/components/dashboard/spending-trend-chart';
import { CategoryDonutChart } from '@/components/dashboard/category-donut-chart';
import { QuickAddSheet } from '@/components/common/quick-add-sheet';
import { UserAvatar } from '@/components/common/user-avatar';
import {
  Tote,
  ArrowRight,
  Sparkle,
  CheckCircle,
  ShareNetwork,
  Plus,
  Repeat,
  Receipt,
  TrendUp,
  TrendDown,
  ShoppingBag,
  Wallet,
  CalendarBlank,
  ChartPieSlice,
  ChartLineUp,
  Tag,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export function HomeEditorial() {
  const {
    currentUser,
    household,
    currentShoppingList,
    activeSession,
    startShoppingSession,
    history,
    addExtraListItem,
    generateInviteLink,
    categories,
    products,
  } = useDespensa();

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Data atual inicializada de forma segura para o prerender do Next.js 16
  const [dateState, setDateState] = useState({
    month: 10,
    year: 2026,
  });

  React.useEffect(() => {
    const d = new Date();
    setDateState({ month: d.getMonth(), year: d.getFullYear() });
  }, []);

  const currentMonth = dateState.month;
  const currentYear = dateState.year;

  // 1. Cálculos do Mês Atual baseados em dados reais
  const currentMonthPurchases = useMemo(() => {
    return history.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [history, currentMonth, currentYear]);

  // Gasto total do mês atual (histórico + sessão em andamento se houver)
  const totalSpentThisMonth = useMemo(() => {
    const fromHistory = currentMonthPurchases.reduce((acc, curr) => acc + curr.total_spent, 0);
    const fromActive = activeSession?.total_spent || 0;
    return fromHistory + fromActive;
  }, [currentMonthPurchases, activeSession]);

  // Orçamento e saldo restante
  const monthlyBudget = Number(household.monthly_budget) || 0;
  const remainingBudget = Math.max(0, monthlyBudget - totalSpentThisMonth);
  const percentUsed = monthlyBudget > 0 ? (totalSpentThisMonth / monthlyBudget) * 100 : 0;

  // Quantidade de compras e ticket médio no mês
  const purchasesCountThisMonth = currentMonthPurchases.length + (activeSession ? 1 : 0);
  const averageTicket = purchasesCountThisMonth > 0 ? totalSpentThisMonth / purchasesCountThisMonth : 0;

  // 2. Comparativo com o Mês Anterior
  const prevMonthPurchases = useMemo(() => {
    const prevM = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevY = currentMonth === 0 ? currentYear - 1 : currentYear;
    return history.filter((s) => {
      const d = new Date(s.date);
      return d.getMonth() === prevM && d.getFullYear() === prevY;
    });
  }, [history, currentMonth, currentYear]);

  const totalSpentPrevMonth = useMemo(() => {
    return prevMonthPurchases.reduce((acc, curr) => acc + curr.total_spent, 0);
  }, [prevMonthPurchases]);

  const monthComparison = useMemo(() => {
    if (totalSpentPrevMonth === 0) return null;
    const diff = totalSpentThisMonth - totalSpentPrevMonth;
    const percentDiff = (diff / totalSpentPrevMonth) * 100;
    return {
      diff,
      percentDiff,
      isHigher: diff > 0,
    };
  }, [totalSpentThisMonth, totalSpentPrevMonth]);

  // 3. Distribuição dos Gastos por Categoria (Dados reais)
  const categorySpendingData = useMemo(() => {
    const catTotalMap = new Map<string, number>();

    // Soma itens das compras do mês atual
    currentMonthPurchases.forEach((p) => {
      p.cart_items.forEach((item) => {
        const catId = item.category_id || 'cat-outros';
        catTotalMap.set(catId, (catTotalMap.get(catId) || 0) + item.subtotal);
      });
    });

    // Soma itens da sessão em andamento
    if (activeSession) {
      activeSession.cart_items.forEach((item) => {
        const catId = item.category_id || 'cat-outros';
        catTotalMap.set(catId, (catTotalMap.get(catId) || 0) + item.subtotal);
      });
    }

    const result: { name: string; value: number; color: string }[] = [];
    catTotalMap.forEach((val, catId) => {
      if (val > 0) {
        const catObj = categories.find((c) => c.id === catId);
        result.push({
          name: catObj?.name || 'Outros',
          value: Math.round(val * 100) / 100,
          color: catObj?.color || '#716D66',
        });
      }
    });

    return result.sort((a, b) => b.value - a.value);
  }, [currentMonthPurchases, activeSession, categories]);

  // Categoria com maior gasto
  const topCategory = categorySpendingData.length > 0 ? categorySpendingData[0] : null;

  // 4. Evolução Temporal dos Gastos (Últimos 6 meses)
  const trendData = useMemo(() => {
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const result: { month: string; amount: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[m]}/${String(y).slice(2)}`;

      const sessionsInMonth = history.filter((s) => {
        const sd = new Date(s.date);
        return sd.getMonth() === m && sd.getFullYear() === y;
      });

      let total = sessionsInMonth.reduce((acc, curr) => acc + curr.total_spent, 0);
      if (i === 0 && activeSession) {
        total += activeSession.total_spent;
      }

      result.push({
        month: label,
        amount: Math.round(total * 100) / 100,
      });
    }

    return result;
  }, [history, currentMonth, currentYear, activeSession]);

  const hasAnyPurchaseHistory = history.length > 0 || Boolean(activeSession && activeSession.total_spent > 0);

  const handleCopyInvite = async () => {
    triggerHaptic('success');
    const link = await generateInviteLink();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const totalItemsCount = currentShoppingList?.items.length || 0;

  return (
    <div className="space-y-6 lg:space-y-8 max-w-6xl mx-auto pb-28 lg:pb-12">
      {/* Saudação Editorial com Participantes */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#26593F]" />
            <span className="text-xs font-bold text-[#716D66] uppercase tracking-wider">
              {household.name}
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1C1917] tracking-tight mt-1">
            Olá, {currentUser.name.split(' ')[0]}
          </h2>
          <p className="text-sm text-[#716D66] mt-0.5 leading-relaxed">
            Painel financeiro e acompanhamento de compras da casa.
          </p>
        </div>

        {/* Membros do lar */}
        <div className="flex items-center gap-3 bg-white border border-stone-200/80 px-3.5 py-2 rounded-2xl shadow-2xs self-start md:self-auto">
          <div className="flex -space-x-2">
            {household.members.slice(0, 3).map((m) => (
              <UserAvatar
                key={m.id}
                name={m.name}
                avatarUrl={m.avatar_url}
                size="sm"
                className="ring-2 ring-white"
              />
            ))}
          </div>
          <div className="text-xs">
            <span className="font-bold text-[#1C1917] block">
              {household.members.length} {household.members.length === 1 ? 'pessoa' : 'pessoas'}
            </span>
            <span className="text-[11px] text-[#A8A29A]">Lar compartilhado</span>
          </div>
        </div>
      </section>

      {/* BANNER DE COMPRA AO VIVO (Se houver sessão em andamento) */}
      {activeSession && (
        <section className="bg-[#26593F] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#ECF5F0] text-[#26593F] animate-pulse">
              <span className="w-2 h-2 rounded-full bg-[#26593F]" />
              Sessão de Compras Ativa
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs text-white/70">Total acumulado no carrinho</span>
              <div className="text-3xl lg:text-4xl font-extrabold tabular-nums tracking-tight mt-0.5">
                {formatCurrency(activeSession.total_spent)}
              </div>
              <span className="text-xs text-white/80 font-medium block mt-1">
                {activeSession.cart_items.length} itens registrados até o momento
              </span>
            </div>

            <Link
              href="/shopping"
              onClick={() => triggerHaptic('light')}
              className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-white text-[#26593F] px-5 py-3 rounded-2xl hover:bg-stone-100 transition-colors shadow-sm shrink-0"
            >
              <Tote className="w-4 h-4" weight="bold" />
              Retomar no Mercado
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* 11.1 CARDS DE MÉTRICAS PRINCIPAIS (Dados reais) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3.5 lg:gap-4">
        {/* Total Gasto no Mês */}
        <div className="bg-white border border-stone-200/80 p-4 lg:p-5 rounded-3xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gasto no Mês</span>
            <Wallet className="w-4 h-4 text-[#D9532F]" weight="duotone" />
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#1C1917] tabular-nums tracking-tight pt-1">
            {formatCurrency(totalSpentThisMonth)}
          </div>
          <div className="text-[11px] font-semibold text-[#716D66]">
            {monthlyBudget > 0 ? `${percentUsed.toFixed(0)}% do teto mensal` : 'Sem teto definido'}
          </div>
        </div>

        {/* Orçamento Mensal & Restante */}
        <div className="bg-white border border-stone-200/80 p-4 lg:p-5 rounded-3xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Saldo Restante</span>
            <TrendUp className="w-4 h-4 text-[#26593F]" weight="duotone" />
          </div>
          <div className={`text-xl lg:text-2xl font-extrabold tabular-nums tracking-tight pt-1 ${
            totalSpentThisMonth > monthlyBudget && monthlyBudget > 0 ? 'text-red-600' : 'text-[#26593F]'
          }`}>
            {formatCurrency(remainingBudget)}
          </div>
          <div className="text-[11px] font-semibold text-[#716D66]">
            Teto: {formatCurrency(monthlyBudget)}
          </div>
        </div>

        {/* Compras Realizadas */}
        <div className="bg-white border border-stone-200/80 p-4 lg:p-5 rounded-3xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Idas ao Mercado</span>
            <ShoppingBag className="w-4 h-4 text-[#D97706]" weight="duotone" />
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#1C1917] tabular-nums tracking-tight pt-1">
            {purchasesCountThisMonth} {purchasesCountThisMonth === 1 ? 'compra' : 'compras'}
          </div>
          <div className="text-[11px] font-semibold text-[#716D66]">
            Neste mês atual
          </div>
        </div>

        {/* Ticket Médio / Meta por Ida */}
        <div className="bg-white border border-stone-200/80 p-4 lg:p-5 rounded-3xl shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#716D66]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              {purchasesCountThisMonth > 0 ? 'Ticket Médio' : 'Meta por Ida'}
            </span>
            <Receipt className="w-4 h-4 text-[#2563EB]" weight="duotone" />
          </div>
          <div className="text-xl lg:text-2xl font-extrabold text-[#1C1917] tabular-nums tracking-tight pt-1">
            {purchasesCountThisMonth > 0
              ? formatCurrency(averageTicket)
              : formatCurrency(
                  household.average_ticket_target ||
                    (monthlyBudget > 0
                      ? monthlyBudget /
                        (household.shopping_frequency === 'weekly'
                          ? 4
                          : household.shopping_frequency === 'biweekly'
                          ? 2
                          : 1)
                      : 0)
                )}
          </div>
          <div className="text-[11px] font-semibold text-[#716D66]">
            {purchasesCountThisMonth > 0 ? 'Por ida ao supermercado' : 'Planejado no onboarding'}
          </div>
        </div>
      </section>

      {/* MENSAGEM CONTEXTUAL REAL */}
      {monthlyBudget > 0 && (
        <section className="bg-white border border-stone-200/80 p-4 lg:p-5 rounded-3xl shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              percentUsed > 100
                ? 'bg-red-50 text-red-600'
                : percentUsed > 80
                ? 'bg-amber-50 text-amber-600'
                : 'bg-[#ECF5F0] text-[#26593F]'
            }`}>
              <Sparkle className="w-5 h-5" weight="duotone" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#716D66]">
                Diagnóstico de Gastos
              </h4>
              <p className="text-sm font-semibold text-[#1C1917] mt-0.5">
                {percentUsed > 100
                  ? `Vocês ultrapassaram o teto mensal em ${formatCurrency(totalSpentThisMonth - monthlyBudget)}.`
                  : percentUsed > 0
                  ? `Vocês já utilizaram ${percentUsed.toFixed(0)}% do orçamento mensal deste mês.`
                  : 'Nenhuma compra realizada ainda neste mês.'}
                {topCategory && ` A categoria com maior investimento é ${topCategory.name} (${formatCurrency(topCategory.value)}).`}
              </p>
            </div>
          </div>

          {monthComparison && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FAF8F5] border border-stone-200 shrink-0">
              {monthComparison.isHigher ? (
                <>
                  <TrendUp className="w-4 h-4 text-red-600" weight="bold" />
                  <span className="text-red-600">+{monthComparison.percentDiff.toFixed(0)}%</span>
                </>
              ) : (
                <>
                  <TrendDown className="w-4 h-4 text-[#26593F]" weight="bold" />
                  <span className="text-[#26593F]">{monthComparison.percentDiff.toFixed(0)}%</span>
                </>
              )}
              <span className="text-[#716D66] font-medium">vs mês anterior</span>
            </div>
          )}
        </section>
      )}

      {/* GRÁFICOS APACHE ECHARTS (Renderizados com dados reais) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gráfico 1: Evolução Temporal dos Gastos (7 Colunas no Desktop) */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 p-5 lg:p-6 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center">
                <ChartLineUp className="w-4 h-4" weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Evolução Temporal dos Gastos
                </h3>
                <span className="text-xs text-[#716D66]">
                  Acompanhamento dos últimos 6 meses
                </span>
              </div>
            </div>
          </div>

          {!hasAnyPurchaseHistory ? (
            <div className="py-16 text-center space-y-2">
              <CalendarBlank className="w-10 h-10 text-stone-300 mx-auto" weight="duotone" />
              <p className="text-xs font-semibold text-[#716D66]">
                O gráfico de evolução aparecerá assim que vocês concluírem as primeiras compras no modo mercado.
              </p>
            </div>
          ) : (
            <SpendingTrendChart data={trendData} />
          )}
        </div>

        {/* Gráfico 2: Distribuição por Categoria (5 Colunas no Desktop) */}
        <div className="lg:col-span-5 bg-white border border-stone-200/80 p-5 lg:p-6 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center">
                <ChartPieSlice className="w-4 h-4" weight="duotone" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1C1917]">
                  Gastos por Categoria
                </h3>
                <span className="text-xs text-[#716D66]">
                  Concentração das compras do mês
                </span>
              </div>
            </div>
          </div>

          {categorySpendingData.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Tag className="w-10 h-10 text-stone-300 mx-auto" weight="duotone" />
              <p className="text-xs font-semibold text-[#716D66]">
                Nenhuma compra categorizada neste mês ainda.
              </p>
            </div>
          ) : (
            <CategoryDonutChart
              data={categorySpendingData}
              totalSpent={totalSpentThisMonth}
            />
          )}
        </div>
      </div>

      {/* SEÇÃO INFERIOR: AÇÕES RÁPIDAS & HISTÓRICO RECENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Ações da Lista e Despensa */}
        <div className="lg:col-span-5 space-y-4">
          {/* Card da Lista do Mês */}
          <section className="bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#D9532F] uppercase tracking-wider block">
                  Planejamento
                </span>
                <h3 className="text-base font-bold text-[#1C1917] mt-0.5">
                  {currentShoppingList?.title || 'Compras do Mês'}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center font-bold">
                <Tote className="w-5 h-5" weight="duotone" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-stone-100 text-xs">
              <div>
                <span className="text-[#716D66]">Itens planejados</span>
                <div className="text-base font-bold text-[#1C1917] mt-0.5">
                  {totalItemsCount} produtos
                </div>
              </div>
              <div>
                <span className="text-[#716D66]">Despensa base</span>
                <div className="text-base font-bold text-[#26593F] mt-0.5">
                  {products.length} cadastrados
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!activeSession && (
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('success');
                    startShoppingSession();
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-[#D9532F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs"
                >
                  <Tote className="w-4 h-4" weight="bold" />
                  Iniciar Mercado
                </button>
              )}

              <Link
                href="/recurring"
                className="py-3 px-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#1C1917] hover:bg-[#F3EFE9] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Repeat className="w-4 h-4" />
                Ver Lista
              </Link>

              <button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 text-[#1C1917] hover:bg-[#F3EFE9] active:scale-95 transition-all"
                title="Adicionar item rápido à lista"
              >
                <Plus className="w-4 h-4" weight="bold" />
              </button>
            </div>
          </section>

          {/* Convidar Cônjuge */}
          <section className="bg-gradient-to-br from-[#FDEEE9] to-[#FAF8F5] border border-[#D9532F]/20 p-5 rounded-3xl shadow-xs space-y-3">
            <div>
              <span className="text-[11px] font-bold text-[#D9532F] uppercase tracking-wider block">
                Sincronização a Dois
              </span>
              <h4 className="text-sm font-bold text-[#1C1917] mt-0.5">
                Convidar Parceiro(a) para o Lar
              </h4>
              <p className="text-xs text-[#716D66] mt-1 leading-relaxed">
                Envie o link para acompanhar a mesma lista e as compras do mercado em tempo real.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyInvite}
              className="w-full py-2.5 px-4 rounded-2xl bg-white border border-[#D9532F]/30 text-xs font-bold text-[#D9532F] flex items-center justify-center gap-2 hover:bg-[#FDEEE9] active:scale-95 transition-all shadow-2xs"
            >
              {copiedLink ? (
                <>
                  <CheckCircle className="w-4 h-4 text-[#26593F]" weight="fill" />
                  <span className="text-[#26593F]">Link Copiado para o WhatsApp!</span>
                </>
              ) : (
                <>
                  <ShareNetwork className="w-4 h-4" weight="bold" />
                  Copiar Link de Convite
                </>
              )}
            </button>
          </section>
        </div>

        {/* Resumo das Compras Recentes */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 p-5 lg:p-6 rounded-3xl shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h3 className="text-sm font-bold text-[#1C1917]">
              Compras Recentes
            </h3>
            <Link
              href="/history"
              className="text-xs font-bold text-[#D9532F] hover:underline flex items-center gap-1"
            >
              Ver todas ({history.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Receipt className="w-10 h-10 text-stone-300 mx-auto" weight="duotone" />
              <h4 className="text-xs font-bold text-[#1C1917]">Nenhuma compra finalizada</h4>
              <p className="text-[11px] text-[#716D66] max-w-xs mx-auto">
                Quando você concluir sua primeira compra no modo mercado, o recibo e histórico aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {history.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center font-bold shrink-0">
                      <Receipt className="w-4 h-4" weight="duotone" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#1C1917]">{item.title}</h4>
                      <span className="text-[#716D66]">
                        {formatDate(item.date)} · {item.items_count} itens
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-[#1C1917] tabular-nums block">
                      {formatCurrency(item.total_spent)}
                    </span>
                    <span className="text-[10px] text-[#26593F] font-semibold">
                      Concluída
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Item Rápido */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={addExtraListItem}
      />
    </div>
  );
}

export default HomeEditorial;
