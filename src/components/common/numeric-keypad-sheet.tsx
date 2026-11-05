'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Backspace, Plus, Minus, Check } from '@phosphor-icons/react';
import { formatCurrency } from '@/lib/formatters';
import { triggerHaptic } from '@/lib/haptics';

interface KeypadSheetProps {
  isOpen: boolean;
  onClose: () => void;
  itemName: string;
  unit: string;
  initialQuantity?: number;
  initialPrice?: number;
  onConfirm: (quantity: number, unitPrice: number, discount: number) => void;
}

export function NumericKeypadSheet({
  isOpen,
  onClose,
  itemName,
  unit,
  initialQuantity = 1,
  initialPrice = 0,
  onConfirm,
}: KeypadSheetProps) {
  const u = (unit || 'un').toLowerCase();
  const isGrams = u === 'g' || u === 'gr' || u === 'gramas';
  const isMl = u === 'ml';
  const isKg = u === 'kg';
  const isLiter = u === 'l' || u === 'litro';

  const [quantity, setQuantity] = useState<number>(initialQuantity);
  const [qtyInput, setQtyInput] = useState<string>(initialQuantity.toString());
  const [priceStr, setPriceStr] = useState(
    initialPrice > 0 ? initialPrice.toFixed(2).replace('.', ',') : '0,00'
  );

  // Para produtos pesados em gramas, padrão é digitar o preço total da bandeja (ex: 150g por R$ 7,00)
  const [priceMode, setPriceMode] = useState<'total' | 'unit'>(isGrams || isMl ? 'total' : 'unit');

  useEffect(() => {
    if (isOpen) {
      const q = initialQuantity || (isGrams ? 150 : 1);
      setQuantity(q);
      setQtyInput(q.toString());
      setPriceStr(initialPrice > 0 ? initialPrice.toFixed(2).replace('.', ',') : '0,00');
      setPriceMode(isGrams || isMl ? 'total' : 'unit');
    }
  }, [isOpen, initialQuantity, initialPrice, isGrams, isMl]);

  const numericPrice = parseFloat(priceStr.replace(/\./g, '').replace(',', '.')) || 0;

  // Subtotal calculado com base no modo de precificação
  const subtotal = useMemo(() => {
    if (priceMode === 'total') {
      return numericPrice;
    }
    if (isGrams || isMl) {
      // Preço digitado é por kg/litro
      return Math.round(((quantity / 1000) * numericPrice) * 100) / 100;
    }
    return Math.round((quantity * numericPrice) * 100) / 100;
  }, [priceMode, numericPrice, quantity, isGrams, isMl]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    triggerHaptic('light');
    setPriceStr((prev) => {
      const clean = prev.replace(/\D/g, '');
      const newDigits = clean + digit;
      if (newDigits.length > 7) return prev;
      const numVal = parseInt(newDigits, 10) / 100;
      return numVal.toFixed(2).replace('.', ',');
    });
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    setPriceStr((prev) => {
      const clean = prev.replace(/\D/g, '');
      if (clean.length <= 1) return '0,00';
      const newDigits = clean.slice(0, -1);
      const numVal = parseInt(newDigits, 10) / 100;
      return numVal.toFixed(2).replace('.', ',');
    });
  };

  const handleQtyChange = (valStr: string) => {
    setQtyInput(valStr);
    const parsed = parseFloat(valStr.replace(',', '.'));
    if (!isNaN(parsed) && parsed > 0) {
      setQuantity(parsed);
    }
  };

  const adjustQty = (delta: number) => {
    triggerHaptic('light');
    setQuantity((prev) => {
      let step = 1;
      if (isGrams || isMl) {
        step = 50;
      } else if (isKg || isLiter) {
        step = 0.1;
      }
      const nextVal = Math.max(step, Math.round((prev + delta * step) * 1000) / 1000);
      setQtyInput(nextVal.toString());
      return nextVal;
    });
  };

  const handleConfirm = () => {
    triggerHaptic('success');

    if (priceMode === 'total') {
      if (isGrams || isMl) {
        // Converte gramas para kg no banco para satisfazer a coluna gerada (quantity * unit_price = subtotal)
        const qtyInKg = Math.max(0.001, Math.round((quantity / 1000) * 1000) / 1000);
        const unitPricePerKg = Math.round((numericPrice / qtyInKg) * 100) / 100;
        onConfirm(qtyInKg, unitPricePerKg, 0);
      } else if (isKg || isLiter) {
        const unitPricePerKg = quantity > 0 ? Math.round((numericPrice / quantity) * 100) / 100 : numericPrice;
        onConfirm(quantity, unitPricePerKg, 0);
      } else {
        const unitPrice = quantity > 0 ? Math.round((numericPrice / quantity) * 100) / 100 : numericPrice;
        onConfirm(quantity, unitPrice, 0);
      }
    } else {
      // Modo Preço Unitário / por Kg
      if (isGrams || isMl) {
        const qtyInKg = Math.max(0.001, Math.round((quantity / 1000) * 1000) / 1000);
        onConfirm(qtyInKg, numericPrice, 0);
      } else {
        onConfirm(quantity, numericPrice, 0);
      }
    }

    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center p-0 md:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs"
        />

        {/* Modal / Sheet Adaptativo */}
        <motion.div
          initial={{ y: '100%', opacity: 0.5 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl p-5 pb-safe md:p-6 z-10 flex flex-col gap-3.5 border border-stone-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <div>
              <span className="text-[11px] font-bold text-[#26593F] uppercase tracking-wider">
                Registrar no Carrinho
              </span>
              <h3 className="text-lg font-bold text-[#1C1917] line-clamp-1">
                {itemName}
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

          {/* Seletor de Modo de Precificação */}
          <div className="flex bg-[#F3EFE9] p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setPriceMode('total');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                priceMode === 'total'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-extrabold'
                  : 'text-[#716D66] hover:text-[#1C1917]'
              }`}
            >
              {isGrams ? 'Valor da Bandeja / Pacote' : 'Preço Total Fechado'}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setPriceMode('unit');
              }}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                priceMode === 'unit'
                  ? 'bg-white text-[#1C1917] shadow-2xs font-extrabold'
                  : 'text-[#716D66] hover:text-[#1C1917]'
              }`}
            >
              {isGrams || isKg ? 'Preço por Kg' : isMl || isLiter ? 'Preço por Litro' : 'Preço Unitário'}
            </button>
          </div>

          {/* Quantidade e Subtotal */}
          <div className="grid grid-cols-2 gap-3 items-center bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200/80">
            <div>
              <span className="text-[11px] font-semibold text-[#716D66] block mb-1">
                Quantidade ({unit})
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => adjustQty(-1)}
                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-[#1C1917] active:scale-90"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={qtyInput}
                  onChange={(e) => handleQtyChange(e.target.value)}
                  className="w-16 text-center py-1 rounded-lg bg-white border border-stone-200 text-sm font-bold text-[#1C1917] tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => adjustQty(1)}
                  className="w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center font-bold text-[#1C1917] active:scale-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-[#716D66] block mb-0.5">
                Subtotal
              </span>
              <div className="text-xl font-extrabold text-[#26593F] tabular-nums leading-tight">
                {formatCurrency(subtotal)}
              </div>
              <span className="text-[10px] text-[#716D66] block mt-0.5 font-medium">
                {priceMode === 'total' && isGrams && quantity > 0
                  ? `~ ${formatCurrency((numericPrice / (quantity / 1000)) || 0)}/kg`
                  : priceMode === 'unit' && isGrams
                  ? `${quantity}g a ${formatCurrency(numericPrice)}/kg`
                  : `${quantity} ${unit}`}
              </span>
            </div>
          </div>

          {/* Visor de Preço */}
          <div className="text-center py-0.5">
            <span className="text-xs font-semibold text-[#716D66]">
              {priceMode === 'total'
                ? isGrams
                  ? 'Valor Total da Bandeja (R$ na Etiqueta)'
                  : 'Valor Total a Pagar (R$)'
                : isGrams || isKg
                ? 'Preço por Kg (R$/kg na Balança)'
                : 'Preço Unitário (R$ cada)'}
            </span>
            <div className="text-3xl font-extrabold text-[#1C1917] tabular-nums tracking-tight mt-0.5">
              R$ {priceStr}
            </div>
          </div>

          {/* Teclado Numérico */}
          <div className="grid grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDigit(digit)}
                className="h-11 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-xl font-bold text-[#1C1917] active:bg-[#ECE7DF] active:scale-95 transition-all"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleDigit('00')}
              className="h-11 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-base font-bold text-[#716D66] active:bg-[#ECE7DF] active:scale-95 transition-all"
            >
              00
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-11 rounded-xl bg-[#FAF8F5] border border-stone-200/80 text-xl font-bold text-[#1C1917] active:bg-[#ECE7DF] active:scale-95 transition-all"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              className="h-11 rounded-xl bg-[#FDEEE9] border border-[#D9532F]/20 text-[#D9532F] flex items-center justify-center active:scale-95 transition-all"
            >
              <Backspace className="w-5 h-5" weight="bold" />
            </button>
          </div>

          {/* Botão de Confirmação */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#26593F] text-white font-bold text-base flex items-center justify-center gap-2 active:scale-98 shadow-md hover:bg-[#1D4330] transition-all cursor-pointer"
          >
            <Check className="w-5 h-5" weight="bold" />
            Colocar no Carrinho ({formatCurrency(subtotal)})
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
