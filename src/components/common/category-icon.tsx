'use client';

import React from 'react';
import {
  BowlFood,
  CookingPot,
  Drop,
  Coffee,
  Brandy,
  Cheese,
  Knife,
  Fish,
  Egg,
  Bread,
  AppleLogo,
  Plant,
  Carrot,
  Wine,
  Snowflake,
  Cookie,
  Cake,
  Sparkle,
  TShirt,
  Shower,
  HandSoap,
  Smiley,
  Trash,
  PawPrint,
  DotsThree,
  ShoppingBag,
  IconWeight,
} from '@phosphor-icons/react';

interface CategoryIconProps {
  icon?: string;
  iconName?: string;
  className?: string;
  weight?: IconWeight;
  style?: React.CSSProperties;
}

export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  BowlFood,
  CookingPot,
  Drop,
  Coffee,
  Brandy,
  Cheese,
  Knife,
  Fish,
  Egg,
  Bread,
  AppleLogo,
  Plant,
  Carrot,
  Wine,
  Snowflake,
  Cookie,
  Cake,
  Sparkle,
  TShirt,
  Shower,
  HandSoap,
  Smiley,
  Trash,
  PawPrint,
  DotsThree,
  ShoppingBag,
  // Fallbacks de compatibilidade
  apple: AppleLogo,
  wheat: BowlFood,
  milk: Brandy,
  beef: Knife,
  'cup-soda': Wine,
  croissant: Bread,
  sparkles: Sparkle,
  bath: Shower,
  package: DotsThree,
};

export function CategoryIcon({
  icon,
  iconName,
  className = 'w-4 h-4',
  weight = 'duotone',
  style,
}: CategoryIconProps) {
  const resolvedIcon = icon || iconName || 'ShoppingBag';
  const IconComponent = CATEGORY_ICON_MAP[resolvedIcon] || ShoppingBag;
  return <IconComponent className={className} weight={weight} style={style} />;
}
