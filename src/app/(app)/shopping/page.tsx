'use client';

import React, { useState, useMemo } from 'react';
import { useDespensa } from '@/features/context/despensa-context';
import { formatCurrency } from '@/lib/formatters';
import { LiveHud } from '@/components/common/live-hud';
import { NumericKeypadSheet } from '@/components/common/numeric-keypad-sheet';
import { QuickAddSheet } from '@/components/common/quick-add-sheet';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { CategoryIcon } from '@/components/common/category-icon';
import {
  MagnifyingGlass,
  Tote,
  CheckCircle,
  ArrowCounterClockwise,
  Plus,
  Play,
  Check,
  XCircle,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function ShoppingModePage() {
  const {
    isLoading,
    activeSession,
    startShoppingSession,
    currentShoppingList,
    categories,
    checkItemInCart,
    addExtraItemToCart,
    undoCartItem,
    finishShoppingSession,
    cancelShoppingSession,
    shoppingStats,
  } = useDespensa();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'cart'>('pending');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const [selectedPendingItem, setSelectedPendingItem] = useState<{
    id: string;
    product_id?: string;
    name: string;
    category_id: string;
    unit: string;
    quantity: number;
    price: number;
  } | null>(null);

  // Mapeamento estável de itens no carrinho
  const cartItemMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof activeSession>['cart_items'][0]>();
    if (!activeSession) return map;
    activeSession.cart_items.forEach((c) => {
      if (c.shopping_list_item_id) {
        map.set(c.shopping_list_item_id, c);
      }
    });
    return map;
  }, [activeSession]);

  const allListItems = useMemo(() => currentShoppingList?.items || [], [currentShoppingList]);

  const pendingItems = useMemo(() => {
    return allListItems
      .filter((item) => !cartItemMap.has(item.id))
      .filter((item) =>
        item.custom_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allListItems, cartItemMap, searchQuery]);

  const cartItems = useMemo(() => {
    if (!activeSession) return [];
    return activeSession.cart_items.filter((item) =>
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [activeSession, searchQuery]);

  const handleItemClick = (item: (typeof allListItems)[0]) => {
    triggerHaptic('light');
    setSelectedPendingItem({
      id: item.id,
      product_id: item.product_id,
      name: item.custom_name,
      category_id: item.category_id,
      unit: item.unit,
      quantity: item.planned_quantity,
      price: item.estimated_price,
    });
  };

  const handleConfirmCart = (quantity: number, unitPrice: number, discount: number) => {
    if (!selectedPendingItem) return;

    checkItemInCart({
      listItemId: selectedPendingItem.id,
      product_id: selectedPendingItem.product_id,
      name: selectedPendingItem.name,
      category_id: selectedPendingItem.category_id,
      quantity,
      unit_price: unitPrice,
      discount,
    });

    setSelectedPendingItem(null);
  };

  // Se não houver sessão ativa
  if (!activeSession) {
    return (
      <div className="py-12 md:py-20 space-y-6 text-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-3xl bg-[#FDEEE9] text-[#D9532F] flex items-center justify-center mx-auto shadow-sm">
          <Tote className="w-8 h-8" weight="duotone" />
        </div>

        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1C1917] tracking-tight">
            Pronto para ir ao Mercado?
          </h2>
          <p className="text-sm text-[#716D66] mt-2 leading-relaxed">
            Inicie a compra compartilhada para acompanhar o valor acumulado em tempo real,
            marcar produtos e nunca estourar o orçamento planejado.
          </p>
        </div>

        <div className="bg-white border border-stone-200/80 p-5 rounded-3xl shadow-xs text-left space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-[#716D66]">Lista do Mês:</span>
            <span className="font-bold text-[#1C1917]">{currentShoppingList?.title || 'Compras do Mês'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[#716D66]">Itens planejados:</span>
            <span className="font-bold text-[#26593F]">
              {isLoading && !currentShoppingList
                ? 'Sincronizando itens da despensa...'
                : `${allListItems.length} produtos cadastrados`}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('success');
            startShoppingSession();
          }}
          disabled={isLoading}
          className="w-full py-4 px-6 rounded-2xl bg-[#D9532F] text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-[#BF3F1D] active:scale-98 transition-all shadow-md cursor-pointer disabled:opacity-50"
        >
          <Play className="w-5 h-5" weight="fill" />
          Começar Compras Agora
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-28 lg:pb-12">
      {/* HUD sempre visível com progresso e ações */}
      <LiveHud
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onFinishConfirm={() => setShowFinishConfirm(true)}
      />

      {/* Grid Responsivo para Desktop (2 colunas) e Mobile (1 coluna com abas) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna da Esquerda: Itens Pendentes (Mobile e Desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Barra de Busca e Ação de Item Extra */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <MagnifyingGlass className="w-4 h-4 text-[#716D66] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produto no corredor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-stone-200/80 text-sm font-medium focus:outline-none focus:border-[#26593F] shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#716D66] p-1"
                >
                  Limpar
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-white border border-stone-200 text-[#D9532F] hover:bg-[#FDEEE9] text-xs font-bold transition-colors shadow-2xs shrink-0"
              title="Adicionar item fora da lista"
            >
              <Plus className="w-4 h-4" weight="bold" />
              <span className="hidden sm:inline">Produto Extra</span>
            </button>
          </div>

          {/* Seletor de Abas (visível apenas em telas menores) */}
          <div className="lg:hidden flex bg-[#F3EFE9] p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                triggerHaptic('light');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'pending'
                  ? 'bg-white text-[#1C1917] shadow-2xs'
                  : 'text-[#716D66] hover:text-[#1C1917]'
              }`}
            >
              Pendentes ({pendingItems.length})
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('cart');
                triggerHaptic('light');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'cart'
                  ? 'bg-white text-[#26593F] shadow-2xs'
                  : 'text-[#716D66] hover:text-[#1C1917]'
              }`}
            >
              <CheckCircle className="w-3.5 h-3.5" weight="fill" />
              No Carrinho ({cartItems.length})
            </button>
          </div>

          {/* LISTA DE PENDENTES */}
          <div className={`${activeTab === 'cart' ? 'hidden lg:block' : 'block'} space-y-4`}>
            <div className="hidden lg:flex items-center justify-between pb-1">
              <h3 className="text-base font-bold text-[#1C1917]">
                Produtos Pendentes na Prateleira ({pendingItems.length})
              </h3>
            </div>

            {pendingItems.length === 0 ? (
              <div className="text-center py-12 bg-white border border-stone-200/80 rounded-3xl p-6 space-y-2">
                <CheckCircle className="w-10 h-10 text-[#26593F] mx-auto" weight="duotone" />
                <h4 className="text-base font-bold text-[#1C1917]">
                  Tudo Coletado!
                </h4>
                <p className="text-xs text-[#716D66]">
                  Todos os itens planejados estão no carrinho físico.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {categories.map((category) => {
                  const categoryItems = pendingItems.filter(
                    (i) => i.category_id === category.id
                  );
                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category.id} className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                          style={{ backgroundColor: `${category.color}15`, color: category.color }}
                        >
                          <CategoryIcon iconName={category.icon} className="w-3.5 h-3.5" weight="duotone" />
                        </span>
                        <h4 className="text-xs font-bold text-[#716D66] uppercase tracking-wider">
                          {category.name} ({categoryItems.length})
                        </h4>
                      </div>

                      <div className="bg-white border border-stone-200/80 rounded-3xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
                        {categoryItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5] active:bg-[#F3EFE9] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:border-[#26593F]">
                                <span className="w-2 h-2 rounded-full bg-transparent" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-[#1C1917]">
                                  {item.custom_name}
                                </h5>
                                <span className="text-xs text-[#716D66]">
                                  {item.planned_quantity} {item.unit} · Ref: {formatCurrency(item.estimated_price)}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-[#D9532F] bg-[#FDEEE9] px-3 py-1 rounded-full">
                              Pegar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Fallback para produtos sem categoria mapeada */}
                {(() => {
                  const knownCatIds = new Set(categories.map((c) => c.id));
                  const uncatItems = pendingItems.filter(
                    (i) => !i.category_id || !knownCatIds.has(i.category_id)
                  );
                  if (uncatItems.length === 0) return null;

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-1">
                        <span className="w-5 h-5 rounded-md flex items-center justify-center text-xs bg-stone-100 text-stone-600">
                          <CategoryIcon iconName="Package" className="w-3.5 h-3.5" weight="duotone" />
                        </span>
                        <h4 className="text-xs font-bold text-[#716D66] uppercase tracking-wider">
                          Outros Produtos ({uncatItems.length})
                        </h4>
                      </div>

                      <div className="bg-white border border-stone-200/80 rounded-3xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
                        {uncatItems.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-[#FAF8F5] active:bg-[#F3EFE9] transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full border-2 border-stone-300 flex items-center justify-center hover:border-[#26593F]">
                                <span className="w-2 h-2 rounded-full bg-transparent" />
                              </div>
                              <div>
                                <h5 className="text-sm font-bold text-[#1C1917]">
                                  {item.custom_name}
                                </h5>
                                <span className="text-xs text-[#716D66]">
                                  {item.planned_quantity} {item.unit} · Ref: {formatCurrency(item.estimated_price)}
                                </span>
                              </div>
                            </div>

                            <span className="text-xs font-bold text-[#D9532F] bg-[#FDEEE9] px-3 py-1 rounded-full">
                              Pegar
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Carrinho ao Vivo (Fixa/Lado a Lado no Desktop, Alternada em Aba no Mobile) */}
        <div className={`lg:col-span-5 space-y-4 ${activeTab === 'pending' ? 'hidden lg:block' : 'block'}`}>
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-base font-bold text-[#1C1917] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#26593F]" weight="fill" />
              Itens no Carrinho ({cartItems.length})
            </h3>

            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="text-xs font-semibold text-[#A8A29A] hover:text-red-600 transition-colors"
            >
              Cancelar sessão
            </button>
          </div>

          {cartItems.length === 0 ? (
            <div className="text-center py-12 bg-white border border-stone-200/80 rounded-3xl p-6 space-y-2">
              <Tote className="w-10 h-10 text-stone-300 mx-auto" weight="duotone" />
              <h4 className="text-base font-bold text-[#1C1917]">
                Carrinho Vazio
              </h4>
              <p className="text-xs text-[#716D66]">
                Toque nos produtos pendentes para registrar o preço de prateleira e colocar no carrinho.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-stone-200/80 rounded-3xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex items-center justify-between bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#26593F] text-white flex items-center justify-center shadow-2xs shrink-0">
                      <Check className="w-3.5 h-3.5" weight="bold" />
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-[#1C1917] line-through text-[#716D66]">
                        {item.item_name}
                      </h5>
                      <span className="text-xs text-[#26593F] font-semibold">
                        {item.quantity < 1
                          ? `${Math.round(item.quantity * 1000)}g × ${formatCurrency(item.unit_price)}/kg`
                          : `${item.quantity} un × ${formatCurrency(item.unit_price)}`}
                        {item.checked_by && ` · ${item.checked_by.split(' ')[0]}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold text-[#1C1917] tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>

                    <button
                      type="button"
                      onClick={() => undoCartItem(item.id)}
                      className="p-1.5 rounded-lg text-[#716D66] hover:text-[#D9532F] hover:bg-[#FDEEE9] transition-colors"
                      title="Devolver para a prateleira / Desfazer"
                    >
                      <ArrowCounterClockwise className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teclado Numérico para Registro de Preço */}
      {selectedPendingItem && (
        <NumericKeypadSheet
          isOpen={Boolean(selectedPendingItem)}
          onClose={() => setSelectedPendingItem(null)}
          itemName={selectedPendingItem.name}
          unit={selectedPendingItem.unit}
          initialQuantity={selectedPendingItem.quantity}
          initialPrice={selectedPendingItem.price}
          onConfirm={handleConfirmCart}
        />
      )}

      {/* Modal para Adicionar Produto Extra / Fora da Lista */}
      <QuickAddSheet
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAdd={async (item) => {
          await addExtraItemToCart({
            name: item.name,
            category_id: item.category_id,
            unit: item.unit,
            quantity: item.quantity,
            unit_price: item.price,
          });
        }}
      />

      {/* Diálogo de Confirmação para Finalizar Compra */}
      <ConfirmDialog
        open={showFinishConfirm}
        onOpenChange={setShowFinishConfirm}
        title="Finalizar compra no mercado?"
        description={`Você registrou ${shoppingStats.boughtCount} itens totalizando ${formatCurrency(shoppingStats.totalSpent)}. Ao finalizar, esta compra será arquivada no histórico.`}
        confirmLabel="Finalizar Compra"
        cancelLabel="Continuar Comprando"
        variant="primary"
        onConfirm={finishShoppingSession}
      />

      {/* Diálogo de Confirmação para Cancelar Sessão */}
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title="Cancelar sessão de compras?"
        description="A compra atual será interrompida e os itens registrados nesta sessão não serão salvos no histórico."
        confirmLabel="Sim, cancelar"
        cancelLabel="Voltar às compras"
        variant="danger"
        onConfirm={cancelShoppingSession}
      />
    </div>
  );
}
