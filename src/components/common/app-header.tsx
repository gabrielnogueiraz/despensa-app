'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDespensa } from '@/features/context/despensa-context';
import { UserAvatar } from './user-avatar';
import { ProfileDrawer } from './profile-drawer';

export function AppHeader() {
  const { household, currentUser } = useDespensa();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <>
      <header className="lg:hidden sticky top-0 z-20 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-stone-200/60 pt-safe px-4 pb-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Identidade Visual */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-stone-200/80 shadow-xs flex items-center justify-center text-[#D9532F]">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="2">
                <path d="M4 11C4 16 7 18 12 18C17 18 20 16 20 11Z" fill="#D9532F" fillOpacity="0.15" stroke="#D9532F" />
                <path d="M7 10C7 5 17 5 17 10" stroke="#716D66" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 6C10 4 8 6 12 8C16 6 14 4 12 6Z" fill="#26593F" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-[#1C1917] leading-none">
                Despensa
              </h1>
              <span className="text-[11px] text-[#716D66] font-medium">
                {household.name}
              </span>
            </div>
          </Link>

          {/* Perfil Trigger -> Abre ProfileDrawer */}
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 bg-white border border-stone-200/80 rounded-full shadow-2xs hover:bg-[#F3EFE9] transition-colors focus:outline-none"
            title="Abrir menu do perfil"
          >
            <UserAvatar
              name={currentUser?.name || 'Você'}
              avatarUrl={currentUser?.avatar_url}
              size="xs"
            />
            <span className="text-xs font-semibold text-[#1C1917] max-w-[90px] truncate">
              {currentUser?.name || 'Você'}
            </span>
          </button>
        </div>
      </header>

      <ProfileDrawer open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
