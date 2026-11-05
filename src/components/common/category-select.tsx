'use client';

import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { CaretDown, Check } from '@phosphor-icons/react';
import { CategoryIcon } from './category-icon';
import { EXPANDED_CATEGORIES, CategorySeed } from '@/lib/constants/initial-data';

interface CategorySelectProps {
  value: string;
  onValueChange: (val: string) => void;
  categories?: CategorySeed[];
  className?: string;
}

export function CategorySelect({
  value,
  onValueChange,
  categories = EXPANDED_CATEGORIES,
  className = '',
}: CategorySelectProps) {
  const currentCategory = categories.find((c) => c.id === value || c.name === value);

  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-medium text-[#1C1917] hover:bg-stone-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#26593F] ${className}`}
      >
        <SelectPrimitive.Value placeholder="Selecione uma categoria">
          {currentCategory ? (
            <div className="flex items-center gap-2 truncate">
              <span
                className="w-5 h-5 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${currentCategory.color}20`, color: currentCategory.color }}
              >
                <CategoryIcon iconName={currentCategory.icon} className="w-3.5 h-3.5" weight="duotone" />
              </span>
              <span className="truncate">{currentCategory.name}</span>
            </div>
          ) : (
            <span className="text-[#A8A29E]">Selecione uma categoria</span>
          )}
        </SelectPrimitive.Value>
        <SelectPrimitive.Icon asChild>
          <CaretDown className="w-4 h-4 text-stone-500 shrink-0 ml-2" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={5}
          className="z-[90] w-[var(--radix-select-trigger-width)] max-h-64 overflow-y-auto bg-white rounded-2xl p-1.5 shadow-xl border border-stone-200/80 animate-in fade-in zoom-in-95"
        >
          <SelectPrimitive.Viewport className="space-y-0.5">
            {categories.map((cat) => (
              <SelectPrimitive.Item
                key={cat.id}
                value={cat.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium text-[#1C1917] cursor-pointer hover:bg-stone-100 focus:bg-stone-100 focus:outline-none select-none data-[state=checked]:bg-[#EAF2EC] data-[state=checked]:text-[#26593F]"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                  >
                    <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" weight="duotone" />
                  </span>
                  <SelectPrimitive.ItemText>{cat.name}</SelectPrimitive.ItemText>
                </div>
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
