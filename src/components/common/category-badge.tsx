'use client';

import React from 'react';
import { CategoryIcon } from './category-icon';

interface CategoryBadgeProps {
  name: string;
  icon: string;
  color: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function CategoryBadge({
  name,
  icon,
  color,
  size = 'sm',
  className = '',
}: CategoryBadgeProps) {
  const isSm = size === 'sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium transition-colors ${
        isSm ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      } ${className}`}
      style={{
        backgroundColor: `${color}14`, // 8% opacity tint
        color: color,
        border: `1px solid ${color}2E`, // 18% border
      }}
    >
      <CategoryIcon
        icon={icon}
        weight="duotone"
        className={isSm ? 'w-3.5 h-3.5' : 'w-4 h-4'}
      />
      <span>{name}</span>
    </span>
  );
}
