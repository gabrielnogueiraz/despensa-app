'use client';

import React, { useState, useMemo } from 'react';
import { useDespensa } from '@/features/context/despensa-context';
import { CategoryIcon } from '@/components/common/category-icon';
import { CategorySelect } from '@/components/common/category-select';
import { UnitSelect } from '@/components/common/unit-select';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import {
  Plus,
  MagnifyingGlass,
  CheckCircle,
  Package,
  Trash,
  X,
  Sparkle,
} from '@phosphor-icons/react';
import { triggerHaptic } from '@/lib/haptics';

export default function RecurringItemsPage() {
  const {
    products,
    recurringItems,
    categories,
    addProduct,
    deleteProduct,
    toggleRecurringItem,
    updateRecurringQuantity,
  } = useDespensa();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  // Form states para criação
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-graos');
  const [defaultUnit, setDefaultUnit] = useState('un');
  const [defaultPrice, setDefaultPrice] = useState('');

  // Itens filtrados com mapeamento para as categorias
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Agrupamento por categoria
  const groupedByCategory = useMemo(() => {
    const map = new Map<string, typeof products>();
    filteredProducts.forEach((p) => {
      const catId = p.category_id || 'cat-outros';
      const list = map.get(catId) || [];
      list.push(p);
      map.set(catId, list);
    });
    return map;
  }, [filteredProducts]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic('success');
    const price = parseFloat(defaultPrice.replace(',', '.')) || 0;

    await addProduct({
      name: name.trim(),
      category_id: categoryId,
      default_unit: defaultUnit,
      default_price: price,
    });

    // Reset
    setName('');
    setDefaultPrice('');
    setIsAddModalOpen(false);
  };

  const activeRecurringCount = useMemo(() => {
    return recurringItems.filter((r) => r.is_active).length;
  }, [recurringItems]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 lg:pb-12">
      {/* Header com Ações e Totalizador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-[#1C1917] tracking-tight">
            Lista de Compras & Despensa
          </h2>
          <p className="text-sm text-[#716D66] mt-1">
            Itens que abastecem a sua casa todo mês.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#D9532F] text-white text-sm font-bold shadow-sm hover:bg-[#BF3F1D] active:scale-98 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" weight="bold" />
          Novo Produto
        </button>
      </div>

      {/* Barra de Filtro e Busca */}
      <div className="space-y-3">
        <div className="relative">
          <MagnifyingGlass className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#716D66]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome do produto..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-stone-200/80 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D9532F]/20 focus:border-[#D9532F] shadow-xs"
          />
        </div>

        {/* Categorias Rápidas em Pills Horizontais */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setSelectedCategory('all');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#1C1917] text-white shadow-2xs'
                : 'bg-white border border-stone-200/80 text-[#716D66] hover:bg-[#FAF8F5]'
            }`}
          >
            Todas ({products.length})
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isSelected
                    ? 'bg-[#D9532F] text-white shadow-2xs'
                    : 'bg-white border border-stone-200/80 text-[#716D66] hover:bg-[#FAF8F5]'
                }`}
              >
                <CategoryIcon iconName={cat.icon} className="w-3.5 h-3.5" />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Itens Agrupados */}
      {products.length === 0 ? (
        <div className="p-8 md:p-12 text-center bg-white border border-dashed border-stone-300 rounded-3xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FAF8F5] text-[#716D66] flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" weight="duotone" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1C1917]">
              Sua despensa está vazia
            </h3>
            <p className="text-xs text-[#716D66] mt-1 max-w-sm mx-auto">
              Cadastre os produtos que você compra com frequência para que eles sejam
              incluídos automaticamente nas suas listas de mercado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#26593F] text-white text-xs font-bold hover:bg-[#1D4330] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(groupedByCategory.entries()).map(([catId, prods]) => {
            const category = categories.find((c) => c.id === catId) || {
              name: 'Outros',
              icon: 'DotsThree',
              color: '#716D66',
            };

            return (
              <div key={catId} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <span
                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                    style={{ backgroundColor: `${category.color}15`, color: category.color }}
                  >
                    <CategoryIcon iconName={category.icon} className="w-3.5 h-3.5" weight="duotone" />
                  </span>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#716D66]">
                    {category.name} ({prods.length})
                  </h3>
                </div>

                <div className="bg-white border border-stone-200/80 rounded-2xl divide-y divide-stone-100 shadow-2xs overflow-hidden">
                  {prods.map((product) => {
                    const rec = recurringItems.find((r) => r.product_id === product.id);
                    const isActive = rec ? rec.is_active : false;
                    const qty = rec ? rec.target_quantity : 1;
                    const unit = rec ? rec.unit : product.default_unit;

                    return (
                      <div
                        key={product.id}
                        className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF8F5]/60 transition-colors"
                      >
                        {/* Ativar/Desativar Recorrente */}
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleRecurringItem(product.id)}
                            className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0 ${
                              isActive
                                ? 'bg-[#26593F] border-[#26593F] text-white shadow-2xs'
                                : 'border-stone-300 bg-white hover:border-stone-400'
                            }`}
                            title={isActive ? 'Item ativo nas compras mensais' : 'Item inativo'}
                          >
                            {isActive && <CheckCircle className="w-4 h-4" weight="bold" />}
                          </button>

                          <div className="min-w-0">
                            <h4
                              className={`text-sm font-semibold truncate ${
                                isActive ? 'text-[#1C1917]' : 'text-[#716D66] line-through opacity-70'
                              }`}
                            >
                              {product.name}
                            </h4>
                            <span className="text-[11px] text-[#A8A29A]">
                              Est. R$ {Number(product.default_price).toFixed(2).replace('.', ',')} / {product.default_unit}
                            </span>
                          </div>
                        </div>

                        {/* Quantidade & Excluir */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-stone-200/80 rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                const step = ['un', 'pct', 'cx'].includes(unit) ? 1 : 0.5;
                                const newQ = Math.max(0.5, qty - step);
                                updateRecurringQuantity(product.id, newQ);
                              }}
                              className="text-[#716D66] hover:text-[#1C1917] font-bold text-xs p-1"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-[#1C1917] tabular-nums min-w-[36px] text-center">
                              {qty} {unit}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                triggerHaptic('light');
                                const step = ['un', 'pct', 'cx'].includes(unit) ? 1 : 0.5;
                                updateRecurringQuantity(product.id, qty + step);
                              }}
                              className="text-[#716D66] hover:text-[#1C1917] font-bold text-xs p-1"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              triggerHaptic('light');
                              setProductToDelete({ id: product.id, name: product.name });
                            }}
                            className="p-2 text-[#A8A29A] hover:text-[#D9532F] transition-colors"
                            title="Remover produto"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adaptativo de Cadastro de Produto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
          <div
            onClick={() => setIsAddModalOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
          />

          <div className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl p-6 pb-safe z-10 border border-stone-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-base font-bold text-[#1C1917]">
                Cadastrar Item na Despensa
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full text-[#716D66] hover:text-[#1C1917]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#716D66] mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Pão de Forma Integral"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D9532F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#716D66] mb-1">
                  Categoria
                </label>
                <CategorySelect
                  value={categoryId}
                  onValueChange={setCategoryId}
                  categories={categories}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#716D66] mb-1">
                    Unidade Padrão
                  </label>
                  <UnitSelect
                    value={defaultUnit}
                    onValueChange={setDefaultUnit}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#716D66] mb-1">
                    Preço Estimado (R$)
                  </label>
                  <input
                    type="text"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    placeholder="0,00"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D9532F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#D9532F] text-white font-bold text-sm shadow-md hover:bg-[#BF3F1D] active:scale-98 transition-all"
              >
                Salvar na Despensa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmação Padronizada com Radix UI ConfirmDialog (Sem alert/confirm nativo) */}
      <ConfirmDialog
        open={Boolean(productToDelete)}
        onOpenChange={(open) => !open && setProductToDelete(null)}
        title="Remover produto?"
        description={`Tem certeza que deseja excluir "${productToDelete?.name}" da despensa? Ele não aparecerá mais nas próximas listas mensais.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={() => {
          if (productToDelete) {
            deleteProduct(productToDelete.id);
            setProductToDelete(null);
          }
        }}
      />
    </div>
  );
}
