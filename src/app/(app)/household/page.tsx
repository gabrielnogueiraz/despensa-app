'use client';

import React, { useState, useEffect } from 'react';
import { useDespensa } from '@/features/context/despensa-context';
import { formatCurrency } from '@/lib/formatters';
import { UserAvatar } from '@/components/common/user-avatar';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  UsersThree,
  ShareNetwork,
  Copy,
  Check,
  Crown,
  WhatsappLogo,
  SignOut,
  House,
  FloppyDisk,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';
import { createClient } from '@/lib/supabase/client';

export default function HouseholdPage() {
  const {
    household,
    updateHouseholdBudget,
    generateInviteLink,
    currentUser,
    refreshData,
    logout,
  } = useDespensa();

  const [householdName, setHouseholdName] = useState(household.name || 'Nosso Lar');
  const [budgetString, setBudgetString] = useState(household.monthly_budget > 0 ? household.monthly_budget.toString() : '');
  const [copied, setCopied] = useState(false);
  const [inviteUrl, setInviteUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (household.name) setHouseholdName(household.name);
    if (household.monthly_budget > 0) setBudgetString(household.monthly_budget.toString());
  }, [household.name, household.monthly_budget]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    triggerHaptic('light');

    try {
      const supabase = createClient() as any;
      const budgetNum = parseFloat(budgetString.replace(/\./g, '').replace(',', '.')) || 0;
      const finalName = householdName.trim() || 'Nosso Lar';

      if (household.id) {
        await supabase
          .from('households')
          .update({
            name: finalName,
            monthly_budget: budgetNum,
            updated_at: new Date().toISOString(),
          })
          .eq('id', household.id);
      }

      await refreshData();
      setSavedSuccess(true);
      triggerHaptic('success');
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateInvite = async () => {
    const link = await generateInviteLink();
    setInviteUrl(link);
    triggerHaptic('success');
  };

  const handleCopyLink = () => {
    if (!inviteUrl) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      triggerHaptic('success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Oi! Nosso espaço de compras no Despensa está pronto. Acesse o link para sincronizarmos as listas e as idas ao supermercado: ${inviteUrl || 'https://despensa.app'}`
  );

  return (
    <div className="space-y-6 lg:space-y-8 pb-28 lg:pb-12 max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <section>
        <div className="flex items-center gap-2">
          <House className="w-4 h-4 text-[#D9532F]" weight="duotone" />
          <span className="text-xs font-bold text-[#D9532F] uppercase tracking-wider block">
            Configurações do Espaço
          </span>
        </div>
        <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1C1917] tracking-tight mt-1">
          {household.name}
        </h2>
        <p className="text-sm text-[#716D66] mt-0.5 leading-relaxed">
          Gerencie o nome do lar, teto de orçamento mensal e membros sincronizados.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário do Espaço e Orçamento */}
        <section className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#1C1917]">
              Dados do Lar
            </h3>
            <p className="text-xs text-[#716D66] mt-0.5">
              Altere o nome e o orçamento mensal compartilhado entre vocês.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#716D66] mb-1">
                Nome do Espaço Doméstico
              </label>
              <input
                type="text"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Ex: Nosso Lar"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-semibold text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#26593F]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#716D66] mb-1">
                Teto de Gastos Mensal (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[#716D66]">
                  R$
                </span>
                <input
                  type="text"
                  value={budgetString}
                  onChange={(e) => setBudgetString(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-bold tabular-nums text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#26593F]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSettings}
              className="w-full py-3 px-4 rounded-2xl bg-[#26593F] text-white text-xs font-bold hover:bg-[#1D4330] active:scale-98 transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" weight="bold" />
                  Salvo com Sucesso!
                </>
              ) : (
                <>
                  <FloppyDisk className="w-4 h-4" />
                  {savingSettings ? 'Salvando...' : 'Salvar Alterações'}
                </>
              )}
            </button>
          </form>
        </section>

        {/* Convite Compartilhado para o Cônjuge */}
        <section className="bg-gradient-to-br from-[#FDEEE9] to-[#FAF8F5] border border-[#D9532F]/20 p-6 rounded-3xl shadow-xs space-y-4">
          <div>
            <span className="text-[11px] font-bold text-[#D9532F] uppercase tracking-wider block">
              Acesso Compartilhado
            </span>
            <h3 className="text-base font-bold text-[#1C1917] mt-0.5">
              Convidar Parceiro(a) para o Lar
            </h3>
            <p className="text-xs text-[#716D66] mt-1 leading-relaxed">
              Gera um link seguro para o outro participante acessar a mesma despensa utilizando sua própria conta.
            </p>
          </div>

          {!inviteUrl ? (
            <button
              type="button"
              onClick={handleCreateInvite}
              className="w-full py-3 px-4 rounded-2xl bg-[#D9532F] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-xs"
            >
              <ShareNetwork className="w-4 h-4" weight="bold" />
              Gerar Link de Convite
            </button>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="p-3 bg-white rounded-2xl border border-stone-200 text-xs font-mono text-[#716D66] truncate">
                {inviteUrl}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-white border border-stone-200 text-xs font-bold text-[#1C1917] flex items-center justify-center gap-1.5 hover:bg-[#FAF8F5]"
                >
                  {copied ? <Check className="w-4 h-4 text-[#26593F]" weight="bold" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copiado!' : 'Copiar Link'}
                </button>

                <a
                  href={`https://api.whatsapp.com/send?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-[#26593F] text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#1D4330]"
                >
                  <WhatsappLogo className="w-4 h-4" weight="fill" />
                  Enviar WhatsApp
                </a>
              </div>
            </div>
          )}
        </section>

        {/* Membros do Lar com Avatar e Identidade */}
        <section className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1C1917]">
                Participantes do Lar
              </h3>
              <span className="text-xs text-[#716D66]">
                {household.members.length} {household.members.length === 1 ? 'membro cadastrado' : 'membros cadastrados'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-2xl bg-[#ECF5F0] text-[#26593F] flex items-center justify-center">
              <UsersThree className="w-5 h-5" weight="duotone" />
            </div>
          </div>

          <div className="space-y-2 divide-y divide-stone-100">
            {/* Usuário Atual */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={currentUser?.name || 'Você'}
                  avatarUrl={currentUser?.avatar_url}
                  size="md"
                />
                <div>
                  <h4 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                    {currentUser?.name || 'Você'}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#D9532F] bg-[#FDEEE9] px-2 py-0.5 rounded-full">
                      <Crown className="w-3 h-3" weight="fill" /> Criador / Admin
                    </span>
                  </h4>
                  <span className="text-xs text-[#716D66]">{currentUser?.email || 'Sua conta'}</span>
                </div>
              </div>

              <span className="text-xs font-bold text-[#26593F] bg-[#ECF5F0] px-3 py-1 rounded-full">
                Sessão Atual
              </span>
            </div>

            {/* Outros Membros Reais */}
            {household.members
              .filter((m) => m.id !== currentUser.id)
              .map((member) => (
                <div key={member.id} className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={member.name}
                      avatarUrl={member.avatar_url}
                      size="md"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1917] flex items-center gap-1.5">
                        {member.name}
                        <span className="text-[10px] font-bold text-[#26593F] bg-[#ECF5F0] px-2 py-0.5 rounded-full">
                          Membro
                        </span>
                      </h4>
                      <span className="text-xs text-[#716D66]">{member.email || 'Conta vinculada'}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </section>

        {/* Desconectar / Logout */}
        <section className="lg:col-span-2 pt-2">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-stone-200 text-red-600 font-bold text-xs flex items-center justify-center gap-2 hover:bg-red-50 active:scale-98 transition-all"
          >
            <SignOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </section>
      </div>

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
    </div>
  );
}
