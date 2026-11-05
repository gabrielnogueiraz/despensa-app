'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDespensa } from '@/features/context/despensa-context';
import { UserAvatar } from './user-avatar';
import { ConfirmDialog } from './confirm-dialog';
import {
  House,
  ClipboardText,
  Tote,
  ClockCounterClockwise,
  UsersThree,
  SignOut,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export function DesktopSidebar() {
  const pathname = usePathname();
  const { household, currentUser, activeSession, shoppingStats, logout } = useDespensa();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    {
      label: 'Início',
      href: '/',
      icon: House,
    },
    {
      label: 'Lista de Compras',
      href: '/recurring',
      icon: ClipboardText,
    },
    {
      label: 'Modo Mercado',
      href: '/shopping',
      icon: Tote,
      badge: activeSession ? shoppingStats.boughtCount : false,
    },
    {
      label: 'Histórico',
      href: '/history',
      icon: ClockCounterClockwise,
    },
    {
      label: 'Nosso Lar',
      href: '/household',
      icon: UsersThree,
    },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-white border-r border-stone-200/80 p-5 select-none z-30 justify-between">
        <div>
          {/* Brand Header */}
          <div className="flex items-center gap-3 pb-6 border-b border-stone-100">
            <div className="w-10 h-10 rounded-2xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center font-bold shadow-2xs">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" stroke="currentColor" strokeWidth="2">
                <path d="M4 11C4 16 7 18 12 18C17 18 20 16 20 11Z" fill="#D9532F" fillOpacity="0.15" stroke="#D9532F" />
                <path d="M7 10C7 5 17 5 17 10" stroke="#716D66" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 6C10 4 8 6 12 8C16 6 14 4 12 6Z" fill="#26593F" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight text-[#1C1917] leading-none">
                Despensa
              </h1>
              <span className="text-xs text-[#716D66] font-medium block mt-1 truncate">
                {household.name}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="py-6 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => triggerHaptic('light')}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#FDEEE9] text-[#D9532F] shadow-2xs'
                      : 'text-[#716D66] hover:bg-[#FAF8F5] hover:text-[#1C1917]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`}
                      weight={isActive ? 'duotone' : 'regular'}
                    />
                    <span>{item.label}</span>
                  </div>

                  {Boolean(item.badge) && (
                    <span className="bg-[#26593F] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
          <Link
            href="/household"
            className="flex items-center gap-2.5 min-w-0 hover:opacity-80 transition-opacity"
            title="Ver detalhes da conta e lar"
          >
            <UserAvatar
              name={currentUser?.name || 'Você'}
              avatarUrl={currentUser?.avatar_url}
              size="md"
            />
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#1C1917] truncate">
                {currentUser?.name || 'Usuário'}
              </h4>
              <span className="text-[11px] text-[#A8A29A] truncate block">
                {currentUser?.email || ''}
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            title="Sair da conta"
            className="p-2 rounded-xl text-[#716D66] hover:text-[#D9532F] hover:bg-[#FDEEE9] transition-colors"
          >
            <SignOut className="w-5 h-5" />
          </button>
        </div>
      </aside>

      <ConfirmDialog
        open={showLogoutConfirm}
        onOpenChange={setShowLogoutConfirm}
        title="Sair da sua conta?"
        description="Você será desconectado da sessão neste dispositivo. Seus dados e listas continuam salvos no Supabase."
        confirmLabel="Sair agora"
        cancelLabel="Permanecer"
        variant="danger"
        onConfirm={logout}
      />
    </>
  );
}
