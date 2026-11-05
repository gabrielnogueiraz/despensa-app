'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import { House, ClipboardText, Tote, ClockCounterClockwise } from '@phosphor-icons/react';
import { useDespensa } from '@/features/context/despensa-context';
import { triggerHaptic } from '@/lib/haptics';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | boolean;
}

export function BottomNav() {
  const pathname = usePathname();
  const { activeSession, shoppingStats } = useDespensa();

  const navItems: NavItem[] = [
    {
      label: 'Início',
      href: '/',
      icon: House,
    },
    {
      label: 'Lista',
      href: '/recurring',
      icon: ClipboardText,
    },
    {
      label: 'Mercado',
      href: '/shopping',
      icon: Tote,
      badge: activeSession ? shoppingStats.boughtCount : false,
    },
    {
      label: 'Histórico',
      href: '/history',
      icon: ClockCounterClockwise,
    },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-safe pointer-events-none mb-3">
      <div className="pointer-events-auto flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-stone-200/80 rounded-full px-3 py-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)] max-w-md w-full justify-between">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => triggerHaptic('light')}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-full transition-all duration-200 ${
                isActive ? 'text-[#D9532F]' : 'text-[#716D66] hover:text-[#1C1917]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-active-pill"
                  className="absolute inset-0 bg-[#FDEEE9] rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                  weight={isActive ? 'duotone' : 'regular'}
                />
                {Boolean(item.badge) && (
                  <span className="absolute -top-1 -right-2 bg-[#26593F] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {item.badge}
                  </span>
                )}
              </div>

              <span className={`text-[11px] font-medium mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
