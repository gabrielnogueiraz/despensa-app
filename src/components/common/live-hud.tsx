'use client';

import React from 'react';
import { useDespensa } from '@/features/context/despensa-context';
import { formatCurrency } from '@/lib/formatters';
import { CheckCircle, WarningCircle, Tote, Plus } from '@phosphor-icons/react';
import confetti from 'canvas-confetti';
import { triggerHaptic } from '@/lib/haptics';

interface LiveHudProps {
  onOpenQuickAdd?: () => void;
  onFinishConfirm?: () => void;
}

export function LiveHud({ onOpenQuickAdd, onFinishConfirm }: LiveHudProps) {
  const { shoppingStats, finishShoppingSession, activeSession } = useDespensa();

  if (!activeSession) return null;

  const { totalSpent, budget, remaining, percentUsed, boughtCount, pendingCount } = shoppingStats;

  let progressColor = 'bg-[#26593F]';
  let statusBadgeColor = 'text-[#26593F] bg-[#ECF5F0]';
  if (percentUsed > 100) {
    progressColor = 'bg-[#D9532F]';
    statusBadgeColor = 'text-[#D9532F] bg-[#FDEEE9]';
  } else if (percentUsed > 85) {
    progressColor = 'bg-[#D97706]';
    statusBadgeColor = 'text-[#D97706] bg-[#FEF3C7]';
  }

  const handleFinish = () => {
    triggerHaptic('success');
    try {
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }

    if (onFinishConfirm) {
      onFinishConfirm();
    } else {
      finishShoppingSession();
    }
  };

  return (
    <div className="sticky top-0 lg:top-4 z-20 bg-[#FAF8F5]/95 backdrop-blur-md border border-stone-200/80 rounded-3xl px-4 py-3.5 shadow-2xs">
      <div className="space-y-3">
        {/* Linha Principal: Total e Saldo */}
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#716D66]">
              Total no Carrinho
            </span>
            <div className="text-3xl lg:text-4xl font-extrabold text-[#1C1917] tabular-nums tracking-tight leading-none mt-1">
              {formatCurrency(totalSpent)}
            </div>
          </div>

          <div className="text-right">
            <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statusBadgeColor}`}>
              {percentUsed > 100 ? (
                <>
                  <WarningCircle className="w-4 h-4" weight="fill" />
                  + {formatCurrency(totalSpent - budget)} além
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" weight="fill" />
                  {formatCurrency(remaining)} restantes
                </>
              )}
            </div>
            <div className="text-xs text-[#716D66] mt-1 font-semibold">
              Meta: {formatCurrency(budget)}
            </div>
          </div>
        </div>

        {/* Barra de Progresso Orgânica */}
        <div className="w-full h-2.5 bg-stone-200/60 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${progressColor}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>

        {/* Estatísticas e Botões de Ação */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs font-medium text-[#716D66]">
            <span className="flex items-center gap-1.5">
              <Tote className="w-4 h-4 text-[#26593F]" weight="duotone" />
              <strong className="text-[#1C1917] font-bold">{boughtCount}</strong> no carrinho
            </span>
            <span>·</span>
            <span>
              <strong className="text-[#1C1917] font-bold">{pendingCount}</strong> pendentes
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenQuickAdd && (
              <button
                type="button"
                onClick={onOpenQuickAdd}
                className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-[#F3EFE9] text-[#1C1917] hover:bg-[#ECE7DF] active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" weight="bold" />
                Extra
              </button>
            )}

            <button
              type="button"
              onClick={handleFinish}
              className="text-xs font-bold px-4 py-1.5 rounded-full bg-[#26593F] text-white hover:bg-[#1D4330] active:scale-95 transition-all shadow-xs"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
