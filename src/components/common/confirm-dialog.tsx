'use client';

import React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { Warning, Trash, Check, X } from '@phosphor-icons/react';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return (
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Trash className="w-6 h-6" weight="duotone" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Warning className="w-6 h-6" weight="duotone" />
          </div>
        );
      case 'primary':
      default:
        return (
          <div className="w-12 h-12 rounded-2xl bg-[#EAF2EC] text-[#26593F] flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-6 h-6" weight="duotone" />
          </div>
        );
    }
  };

  const getConfirmButtonClasses = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm focus:ring-amber-500';
      case 'primary':
      default:
        return 'bg-[#26593F] hover:bg-[#1E4732] text-white shadow-sm focus:ring-[#26593F]';
    }
  };

  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in" />
        <AlertDialogPrimitive.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[85] w-[calc(100%-2rem)] max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-200/80 focus:outline-none animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-4">
            {getIcon()}
            <div className="space-y-1 text-left flex-1">
              <AlertDialogPrimitive.Title className="text-lg font-bold text-[#1C1917] tracking-tight">
                {title}
              </AlertDialogPrimitive.Title>
              <AlertDialogPrimitive.Description className="text-sm text-[#716D66] leading-relaxed">
                {description}
              </AlertDialogPrimitive.Description>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
            <AlertDialogPrimitive.Cancel asChild>
              <button
                type="button"
                className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-sm font-semibold text-[#716D66] bg-stone-100 hover:bg-stone-200 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-400"
              >
                {cancelLabel}
              </button>
            </AlertDialogPrimitive.Cancel>
            <AlertDialogPrimitive.Action asChild>
              <button
                type="button"
                onClick={onConfirm}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${getConfirmButtonClasses()}`}
              >
                {confirmLabel}
              </button>
            </AlertDialogPrimitive.Action>
          </div>
        </AlertDialogPrimitive.Content>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}
