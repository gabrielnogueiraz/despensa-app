'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import { useDespensa } from '@/features/context/despensa-context';
import { CategorySelect } from './category-select';
import { UnitSelect } from './unit-select';
import { triggerHaptic } from '@/lib/haptics';

interface QuickAddSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: { name: string; category_id: string; quantity: number; unit: string; price: number }) => void;
}

export function QuickAddSheet({ isOpen, onClose, onAdd }: QuickAddSheetProps) {
  const { categories, products } = useDespensa();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-graos');
  const [qtyStr, setQtyStr] = useState('1');
  const [unit, setUnit] = useState('un');
  const [priceStr, setPriceStr] = useState('');
  const [filteredCatalog, setFilteredCatalog] = useState<typeof products>([]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (val.trim().length > 1) {
      const matches = products.filter((p) =>
        p.name.toLowerCase().includes(val.toLowerCase())
      );
      setFilteredCatalog(matches.slice(0, 5));
    } else {
      setFilteredCatalog([]);
    }
  };

  const selectExistingProduct = (prod: (typeof products)[0]) => {
    setName(prod.name);
    setCategoryId(prod.category_id || categories[0]?.id || 'cat-graos');
    setUnit(prod.default_unit || 'un');
    if (prod.default_price > 0) {
      setPriceStr(prod.default_price.toFixed(2).replace('.', ','));
    }
    setFilteredCatalog([]);
    triggerHaptic('light');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    triggerHaptic('success');
    const priceNum = parseFloat(priceStr.replace(/\./g, '').replace(',', '.')) || 0;
    const quantityNum = parseFloat(qtyStr.replace(',', '.')) || 1;

    onAdd({
      name: name.trim(),
      category_id: categoryId,
      quantity: quantityNum,
      unit,
      price: priceNum,
    });

    setName('');
    setPriceStr('');
    setQtyStr('1');
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[75] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop escuro com z-index alto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal / Bottom Sheet adaptativo */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative bg-white w-full max-w-lg rounded-t-3xl md:rounded-3xl shadow-2xl p-5 pb-safe md:p-6 z-10 flex flex-col gap-4 border border-stone-200 max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <span className="text-[11px] font-bold text-[#D9532F] uppercase tracking-wider">
                Modo Supermercado
              </span>
              <h3 className="text-lg font-bold text-[#1C1917]">
                Adicionar Produto Extra / Fora da Lista
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#F3EFE9] text-[#716D66] hover:bg-[#ECE7DF] active:scale-90"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-[#716D66] mb-1">
                Nome do Produto
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Queijo Minas Padrão, Chocolate..."
                required
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#D9532F]"
              />

              {/* Sugestões do catálogo existente */}
              {filteredCatalog.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-stone-200 rounded-2xl shadow-xl z-20 overflow-hidden divide-y divide-stone-100">
                  {filteredCatalog.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => selectExistingProduct(p)}
                      className="w-full px-3.5 py-2 text-left text-xs font-semibold text-[#1C1917] hover:bg-stone-50 flex items-center justify-between"
                    >
                      <span>{p.name}</span>
                      <span className="text-[#A8A29E] text-[10px]">Catálogo</span>
                    </button>
                  ))}
                </div>
              )}
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
                  Quantidade
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={qtyStr}
                    onChange={(e) => setQtyStr(e.target.value)}
                    placeholder="1"
                    className="w-20 px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-bold text-center tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D9532F]"
                  />
                  <UnitSelect
                    value={unit}
                    onValueChange={setUnit}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#716D66] mb-1">
                  Preço de Prateleira (R$)
                </label>
                <input
                  type="text"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D9532F]"
                />
              </div>
            </div>

            <p className="text-[11px] text-[#A8A29E] leading-relaxed">
              * Itens extras adicionados aqui entram no carrinho desta compra e não são adicionados à despensa recorrente.
            </p>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-[#D9532F] text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-98 shadow-md hover:bg-[#BF3F1D] transition-all"
            >
              <Plus className="w-4 h-4" weight="bold" />
              Adicionar ao Carrinho
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
