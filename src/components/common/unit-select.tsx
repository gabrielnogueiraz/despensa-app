'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';

export const COMMON_UNITS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (l)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'dz', label: 'Dúzia (dz)' },
];

interface UnitSelectProps {
  value: string;
  onValueChange: (val: string) => void;
  className?: string;
}

export function UnitSelect({
  value,
  onValueChange,
  className = '',
}: UnitSelectProps) {
  const currentUnit = COMMON_UNITS.find((u) => u.value === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-medium text-[#1C1917] hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#26593F] ${className}`}
      >
        <SelectPrimitive.Value placeholder="Unidade">
          {currentUnit ? currentUnit.label : value || 'Unidade (un)'}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <CaretDown className="w-4 h-4 text-stone-500 shrink-0 ml-1.5" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={5}
          className="z-[90] w-[var(--radix-select-trigger-width)] max-h-56 overflow-y-auto bg-white rounded-2xl p-1.5 shadow-xl border border-stone-200/80 animate-in fade-in zoom-in-95"
        >
          <SelectPrimitive.Viewport className="space-y-0.5">
            {COMMON_UNITS.map((unit) => (
              <SelectPrimitive.Item
                key={unit.value}
                value={unit.value}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#1C1917] cursor-pointer hover:bg-stone-100 focus:bg-stone-100 focus:outline-none select-none data-[state=checked]:bg-[#EAF2EC] data-[state=checked]:text-[#26593F]"
              >
                <SelectPrimitive.ItemText>{unit.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator>
                  <Check className="w-4 h-4 text-[#26593F] shrink-0" weight="bold" />
                </SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
