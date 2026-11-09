import React, { useState } from 'react';
import { X, ArrowDownUp } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { StockItem } from '../../types';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem?: StockItem | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
}) => {
  const { stockItems, recordStockMovement } = useBusiness();

  const [itemId, setItemId] = useState<string>(selectedItem?.id || '');
  const [type, setType] = useState<'entrada' | 'perda' | 'ajuste'>('entrada');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reason, setReason] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  React.useEffect(() => {
    if (selectedItem) {
      setItemId(selectedItem.id);
    } else if (stockItems.length > 0 && !itemId) {
      setItemId(stockItems[0].id);
    }
  }, [selectedItem, stockItems]);

  if (!isOpen) return null;

  const currentStock = stockItems.find((s) => s.id === itemId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || quantity === '' || Number(quantity) <= 0 || !reason.trim()) return;

    recordStockMovement({
      stockItemId: itemId,
      type,
      quantity: Number(quantity),
      reason: reason.trim(),
      date,
    });

    handleClose();
  };

  const handleClose = () => {
    setQuantity('');
    setReason('');
    setType('entrada');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <ArrowDownUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Movimentação Avulsa de Estoque</h3>
              <p className="text-[11px] text-stone-500">
                Registro manual de entrada, perda por avaria ou ajuste
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Item do Estoque
            </label>
            <select
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900 cursor-pointer"
            >
              {stockItems.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.unit}) — Saldo:{' '}
                  {s.currentQuantity !== null ? `${s.currentQuantity} ${s.unit}` : 'Não contado'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tipo de Movimentação
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-lg">
              <button
                type="button"
                onClick={() => setType('entrada')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  type === 'entrada'
                    ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('perda')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  type === 'perda'
                    ? 'bg-white text-red-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                - Perda / Quebra
              </button>
              <button
                type="button"
                onClick={() => setType('ajuste')}
                className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  type === 'ajuste'
                    ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Ajuste
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Quantidade ({currentStock?.unit || 'un'})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-2 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full px-3 py-2 text-xs font-mono rounded-lg text-stone-900 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Motivo da Movimentação *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: garrafa quebrada no transporte, carne aparada para descarte..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900"
            />
          </div>

          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Confirmar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
