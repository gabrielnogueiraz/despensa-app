'use client';

import React, { useState } from 'react';
import { useDespensa } from '@/features/context/despensa-context';
import { formatCurrency, formatDate } from '@/lib/formatters';
import {
  ClockCounterClockwise,
  TrendDown,
  TrendUp,
  CaretDown,
  CaretUp,
  Receipt,
  Tote,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function HistoryPage() {
  const { history, household } = useDespensa();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    triggerHaptic('light');
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const totalSpentAllTime = history.reduce((acc, curr) => acc + curr.total_spent, 0);
  const averageSpent = history.length > 0 ? totalSpentAllTime / history.length : 0;

  return (
    <div className="space-y-6 lg:space-y-8 pb-12">
      {/* Cabeçalho Editorial */}
      <section>
        <span className="text-xs font-bold text-[#716D66] uppercase tracking-wider block">
          Registro Histórico
        </span>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1C1917] tracking-tight mt-0.5">
          Histórico de Compras
        </h2>
        <p className="text-xs text-[#716D66] mt-1 leading-relaxed">
          Compras anteriores finalizadas e preservadas com preços reais registrados.
        </p>
      </section>

      {/* Métricas Acumuladas */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs">
          <span className="text-[11px] font-bold text-[#716D66] uppercase tracking-wider block">
            Média por Compra
          </span>
          <div className="text-xl lg:text-2xl font-extrabold text-[#1C1917] tabular-nums mt-1">
            {formatCurrency(averageSpent)}
          </div>
          <span className="text-xs text-[#26593F] font-semibold block mt-1">
            {history.length} compras concluídas
          </span>
        </div>

        <div className="bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs">
          <span className="text-[11px] font-bold text-[#716D66] uppercase tracking-wider block">
            Orçamento Atual
          </span>
          <div className="text-xl lg:text-2xl font-extrabold text-[#1C1917] tabular-nums mt-1">
            {formatCurrency(household.monthly_budget)}
          </div>
          <span className="text-xs text-[#716D66] font-medium block mt-1">
            Meta mensal definida
          </span>
        </div>

        <div className="bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs col-span-2 md:col-span-1">
          <span className="text-[11px] font-bold text-[#716D66] uppercase tracking-wider block">
            Total Histórico
          </span>
          <div className="text-xl lg:text-2xl font-extrabold text-[#26593F] tabular-nums mt-1">
            {formatCurrency(totalSpentAllTime)}
          </div>
          <span className="text-xs text-[#716D66] font-medium block mt-1">
            Acumulado de compras
          </span>
        </div>
      </section>

      {/* Lista de Compras Finalizadas */}
      <section className="space-y-4">
        {history.length === 0 ? (
          <div className="text-center py-16 bg-white border border-stone-200/80 rounded-3xl p-8 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF8F5] text-stone-400 flex items-center justify-center mx-auto">
              <ClockCounterClockwise className="w-6 h-6" weight="duotone" />
            </div>
            <h4 className="text-base font-bold text-[#1C1917]">
              Nenhum histórico registrado
            </h4>
            <p className="text-xs text-[#716D66] max-w-sm mx-auto leading-relaxed">
              Ao concluir sua primeira compra no Modo Supermercado, ela aparecerá aqui com todos os itens e preços congelados.
            </p>
          </div>
        ) : (
          history.map((purchase) => {
            const isExpanded = expandedId === purchase.id;
            const isUnderBudget = purchase.total_spent <= purchase.budget_target;
            const diff = Math.abs(purchase.budget_target - purchase.total_spent);

            return (
              <div
                key={purchase.id}
                className="bg-white border border-stone-200/80 rounded-3xl shadow-xs overflow-hidden transition-all"
              >
                {/* Linha do Resumo */}
                <div
                  onClick={() => toggleExpand(purchase.id)}
                  className="p-5 cursor-pointer flex items-center justify-between hover:bg-[#FAF8F5]/80 active:bg-[#FAF8F5]"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-[#1C1917]">
                        {purchase.title}
                      </h4>
                      <span className="text-xs text-[#716D66]">
                        · {formatDate(purchase.date)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[#716D66]">
                        {purchase.items_count} itens comprados
                      </span>
                      <span>·</span>
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 ${
                          isUnderBudget ? 'text-[#26593F]' : 'text-[#D9532F]'
                        }`}
                      >
                        {isUnderBudget ? (
                          <>
                            <TrendDown className="w-3.5 h-3.5" weight="bold" />
                            {formatCurrency(diff)} abaixo da meta
                          </>
                        ) : (
                          <>
                            <TrendUp className="w-3.5 h-3.5" weight="bold" />
                            {formatCurrency(diff)} além da meta
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xl font-extrabold text-[#1C1917] tabular-nums">
                      {formatCurrency(purchase.total_spent)}
                    </span>
                    {isExpanded ? (
                      <CaretUp className="w-4 h-4 text-[#716D66]" weight="bold" />
                    ) : (
                      <CaretDown className="w-4 h-4 text-[#716D66]" weight="bold" />
                    )}
                  </div>
                </div>

                {/* Detalhamento dos Itens Comprados */}
                {isExpanded && (
                  <div className="bg-[#FAF8F5] p-5 border-t border-stone-100 space-y-3">
                    <span className="text-xs font-bold text-[#716D66] uppercase tracking-wider block">
                      Itens e Preços Registrados
                    </span>

                    {purchase.cart_items.length === 0 ? (
                      <p className="text-xs text-[#716D66] italic">
                        Compra anterior arquivada.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {purchase.cart_items.map((item) => (
                          <div
                            key={item.id}
                            className="p-2.5 rounded-xl bg-white border border-stone-200/60 flex items-center justify-between text-xs"
                          >
                            <span className="font-semibold text-[#1C1917]">
                              {item.item_name} ({item.quantity < 1 ? `${Math.round(item.quantity * 1000)}g` : `${item.quantity} un`})
                            </span>
                            <span className="font-bold text-[#1C1917] tabular-nums">
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
