import React, { useState } from 'react';
import { X, ClipboardCheck, ArrowUpDown, Check, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { formatQuantity } from '../../utils/deterministicMath';

interface StockCountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockCountModal: React.FC<StockCountModalProps> = ({ isOpen, onClose }) => {
  const { stockItems, performStockCount } = useBusiness();

  // Map of stockItemId -> counted quantity input (string to allow typing)
  const [counts, setCounts] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    stockItems.forEach((item) => {
      if (item.currentQuantity !== null) {
        initial[item.id] = String(item.currentQuantity);
      } else {
        initial[item.id] = '';
      }
    });
    return initial;
  });

  const [notes, setNotes] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  if (!isOpen) return null;

  const categories = Array.from(new Set(stockItems.map((s) => s.category)));

  const filteredItems = filterCategory === 'all'
    ? stockItems
    : stockItems.filter((s) => s.category === filterCategory);

  const handleCountChange = (itemId: string, value: string) => {
    setCounts((prev) => ({ ...prev, [itemId]: value }));
  };

  const handleFillAllWithCurrent = () => {
    const updated = { ...counts };
    stockItems.forEach((item) => {
      if (item.currentQuantity !== null) {
        updated[item.id] = String(item.currentQuantity);
      }
    });
    setCounts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload: { stockItemId: string; countedQuantity: number }[] = [];

    for (const item of stockItems) {
      const val = counts[item.id];
      if (val !== undefined && val.trim() !== '') {
        const num = parseFloat(val);
        if (!isNaN(num) && num >= 0) {
          payload.push({
            stockItemId: item.id,
            countedQuantity: num,
          });
        }
      }
    }

    if (payload.length === 0) return;

    performStockCount(payload, notes.trim() || undefined);
    handleClose();
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">Contagem Física de Estoque (Inventário)</h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500">
                Ajusta as quantidades reais e apura quebras ou divergências
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

        {/* Toolbar: Category filter + fast autofill */}
        <div className="px-3 sm:px-6 py-2 sm:py-2.5 bg-stone-50/80 border-b border-stone-200/60 flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll text-xs max-w-full">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                filterCategory === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
              }`}
            >
              Todos ({stockItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  filterCategory === cat
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleFillAllWithCurrent}
            className="text-[11px] font-medium text-stone-700 hover:text-stone-900 underline whitespace-nowrap cursor-pointer shrink-0"
          >
            Repetir saldo do sistema
          </button>
        </div>

        {/* Table Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          <div className="border border-stone-200/80 rounded-xl overflow-x-auto bg-white/70">
            <table className="w-full min-w-[540px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">Item / Insumo</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Saldo Atual</th>
                  <th className="py-2.5 px-3 text-center w-32">Contagem Física</th>
                  <th className="py-2.5 px-3 text-right">Divergência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const inputVal = counts[item.id] || '';
                  const hasInput = inputVal.trim() !== '';
                  const countedNum = parseFloat(inputVal);
                  const isCountValid = hasInput && !isNaN(countedNum);

                  let varianceText = '—';
                  let varianceColor = 'text-stone-400';

                  if (isCountValid) {
                    if (item.currentQuantity === null) {
                      varianceText = '1ª Contagem';
                      varianceColor = 'text-amber-800 font-medium';
                    } else {
                      const diff = countedNum - item.currentQuantity;
                      if (diff === 0) {
                        varianceText = 'Sem divergência';
                        varianceColor = 'text-emerald-700';
                      } else if (diff > 0) {
                        varianceText = `+${diff.toLocaleString('pt-BR')} ${item.unit}`;
                        varianceColor = 'text-blue-700 font-semibold';
                      } else {
                        varianceText = `${diff.toLocaleString('pt-BR')} ${item.unit}`;
                        varianceColor = 'text-red-700 font-semibold';
                      }
                    }
                  }

                  return (
                    <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-stone-900">
                        {item.name}
                        {item.packageDescription && (
                          <span className="block text-[10px] text-stone-400 font-normal">
                            {item.packageDescription}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500">{item.category}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-stone-700 tabular-nums">
                        {formatQuantity(item.currentQuantity, item.unit)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Contar..."
                            value={inputVal}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            className="w-20 px-2 py-1 text-xs font-mono text-center rounded border border-stone-200 focus:border-amber-600 focus:outline-none bg-white"
                          />
                          <span className="text-[11px] text-stone-400 w-8 text-left">{item.unit}</span>
                        </div>
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono text-xs tabular-nums ${varianceColor}`}>
                        {varianceText}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações do Inventário (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: contagem de fechamento semanal, conferência após evento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between">
            <span className="text-xs text-stone-500">
              * Apenas os itens com valor preenchido serão atualizados no inventário.
            </span>

            <div className="flex items-center gap-2">
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
                Gravar Contagem de Estoque
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
