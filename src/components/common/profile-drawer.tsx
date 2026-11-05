'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useDespensa } from '@/features/context/despensa-context';
import { UserAvatar } from './user-avatar';
import { ConfirmDialog } from './confirm-dialog';
import {
  House,
  UsersThree,
  SignOut,
  X,
  CaretRight,
  ShieldCheck,
  User,
} from '@phosphor-icons/react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

interface ProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileDrawer({ open, onOpenChange }: ProfileDrawerProps) {
  const { currentUser, household, logout } = useDespensa();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in" />
          <DialogPrimitive.Content className="fixed right-0 top-0 bottom-0 z-[75] w-full max-w-sm bg-[#FAF8F5] p-6 shadow-2xl border-l border-stone-200/80 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-200/60">
                <h3 className="text-base font-bold text-[#1C1917]">Perfil & Lar</h3>
                <DialogPrimitive.Close asChild>
                  <button
                    type="button"
                    className="p-1.5 rounded-full hover:bg-stone-200/60 text-[#716D66] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </DialogPrimitive.Close>
              </div>

              {/* User Card */}
              <div className="mt-6 bg-white border border-stone-200/80 rounded-3xl p-5 shadow-xs flex items-center gap-3.5">
                <UserAvatar
                  name={currentUser.name}
                  avatarUrl={currentUser.avatar_url}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-base font-bold text-[#1C1917] truncate">
                    {currentUser.name}
                  </h4>
                  <p className="text-xs text-[#716D66] truncate mt-0.5">
                    {currentUser.email || 'Conta sincronizada'}
                  </p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#ECF5F0] text-[#26593F]">
                    <ShieldCheck className="w-3 h-3" weight="bold" />
                    {currentUser.role === 'admin' ? 'Administrador' : 'Membro'}
                  </span>
                </div>
              </div>

              {/* Household Links */}
              <div className="mt-5 space-y-2">
                <Link
                  href="/household"
                  onClick={() => onOpenChange(false)}
                  className="flex items-center justify-between p-4 bg-white border border-stone-200/80 rounded-2xl shadow-2xs hover:bg-[#F3EFE9] transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center">
                      <House className="w-5 h-5" weight="duotone" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#1C1917]">
                        {household.name}
                      </div>
                      <div className="text-xs text-[#716D66]">
                        Configurações, orçamento e convite
                      </div>
                    </div>
                  </div>
                  <CaretRight className="w-4 h-4 text-stone-400 group-hover:text-stone-600 transition-colors" />
                </Link>
              </div>

              {/* Participants summary */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-bold text-[#716D66] uppercase tracking-wider mb-2.5 px-1">
                  <span>Integrantes do Lar</span>
                  <span>{household.members.length}</span>
                </div>
                <div className="space-y-2">
                  {household.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 bg-white border border-stone-200/60 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <UserAvatar name={m.name} avatarUrl={m.avatar_url} size="xs" />
                        <span className="font-semibold text-[#1C1917] truncate">
                          {m.name} {m.id === currentUser.id && '(Você)'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-[#716D66] font-medium">
                        {m.role === 'admin' ? 'Admin' : 'Membro'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout Footer */}
            <div className="pt-4 border-t border-stone-200/60">
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  setShowLogoutConfirm(true);
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold transition-colors"
              >
                <SignOut className="w-4 h-4" />
                Sair da Conta
              </button>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

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
