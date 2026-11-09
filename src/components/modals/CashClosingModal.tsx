import React, { useState } from 'react';
import { X, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { calculateExpectedDrawerCash, formatBRL } from '../../utils/deterministicMath';

interface CashClosingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashClosingModal: React.FC<CashClosingModalProps> = ({ isOpen, onClose }) => {
  const { sales, transactions, settings, recordCashClosing } = useBusiness();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [openingCash, setOpeningCash] = useState<number>(settings.openingCashDrawerDefault);
  const [countedCash, setCountedCash] = useState<number | ''>('');
  const [notes, setNotes] = useState<string>('');
  const [differenceReason, setDifferenceReason] = useState<string>('');

  if (!isOpen) return null;

  const expectedData = calculateExpectedDrawerCash(openingCash, sales, transactions, date);
  const countedNum = countedCash === '' ? 0 : Number(countedCash);
  const difference = countedCash === '' ? 0 : countedNum - expectedData.expectedInDrawer;

  const totalGrossDaySales = sales
    .filter((s) => s.status === 'concluida' && s.date.startsWith(date))
    .reduce((acc, s) => acc + s.grossTotal, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (countedCash === '') return;

    recordCashClosing({
      date,
      openingCash,
      expectedCashInDrawer: expectedData.expectedInDrawer,
      countedCashInDrawer: countedNum,
      difference,
      differenceReason: differenceReason.trim() || undefined,
      breakdown: expectedData.totalsByMethod,
      totalGrossSales: totalGrossDaySales,
      totalExpensesPaidInCash: expectedData.expensesInCash,
      notes: notes.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setCountedCash('');
    setNotes('');
    setDifferenceReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Fechamento Diário de Caixa</h3>
              <p className="text-[11px] text-stone-500">
                Conferência do dinheiro em gaveta física e apuração de sobras/faltas
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

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data do Fechamento
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fundo de Abertura (Gaveta)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={openingCash}
                onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Totals by payment method summary */}
          <div className="p-4 bg-stone-100/70 border border-stone-200/80 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-stone-800 flex justify-between items-center">
              <span>Totais de Vendas do Dia por Método</span>
              <span className="font-mono text-stone-900 font-bold tabular-nums">
                {formatBRL(totalGrossDaySales)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-2 bg-white rounded-lg border border-stone-200/70">
                <span className="text-[10px] text-stone-500 block">Em Dinheiro</span>
                <span className="font-mono font-semibold text-stone-900 tabular-nums">
                  {formatBRL(expectedData.totalsByMethod.dinheiro)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-stone-200/70">
                <span className="text-[10px] text-stone-500 block">PIX</span>
                <span className="font-mono font-semibold text-stone-900 tabular-nums">
                  {formatBRL(expectedData.totalsByMethod.pix)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-stone-200/70">
                <span className="text-[10px] text-stone-500 block">Cartão Débito</span>
                <span className="font-mono font-semibold text-stone-900 tabular-nums">
                  {formatBRL(expectedData.totalsByMethod.debito)}
                </span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-stone-200/70">
                <span className="text-[10px] text-stone-500 block">Cartão Crédito</span>
                <span className="font-mono font-semibold text-stone-900 tabular-nums">
                  {formatBRL(expectedData.totalsByMethod.credito)}
                </span>
              </div>
            </div>
          </div>

          {/* Drawer Reconciliation Section */}
          <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
              Reconciliação da Gaveta Física (Dinheiro em Espécie)
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>(+) Fundo de Abertura Inicial:</span>
                <span className="font-mono tabular-nums">{formatBRL(openingCash)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>(+) Vendas em Dinheiro:</span>
                <span className="font-mono tabular-nums text-emerald-700">
                  +{formatBRL(expectedData.salesInCash)}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>(-) Saídas de Caixa / Despesas Pagas em Dinheiro:</span>
                <span className="font-mono tabular-nums text-red-700">
                  -{formatBRL(expectedData.expensesInCash)}
                </span>
              </div>
              <div className="pt-1.5 border-t border-amber-200 flex justify-between font-bold text-stone-900">
                <span>(=) Saldo Esperado na Gaveta:</span>
                <span className="font-mono text-sm tabular-nums text-amber-900">
                  {formatBRL(expectedData.expectedInDrawer)}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60">
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Valor Contado Fisicamente na Gaveta (R$) *
              </label>
              <input
                type="number"
                step="0.05"
                min="0"
                required
                placeholder="Informe o dinheiro contado na gaveta..."
                value={countedCash}
                onChange={(e) => setCountedCash(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-2 text-sm font-mono font-bold rounded-lg text-stone-900 bg-white"
              />
            </div>

            {countedCash !== '' && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center justify-between font-medium ${
                  difference === 0
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : difference > 0
                    ? 'bg-blue-100 text-blue-900 border border-blue-300'
                    : 'bg-red-100 text-red-900 border border-red-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {difference === 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  ) : (
                    <AlertCircle className="w-4 h-4" />
                  )}
                  <span>
                    {difference === 0
                      ? 'Caixa perfeito: sem divergência.'
                      : difference > 0
                      ? 'Sobra de Caixa apurada:'
                      : 'Falta / Quebra de Caixa apurada:'}
                  </span>
                </div>
                <span className="font-mono font-bold text-sm tabular-nums">
                  {difference > 0 ? `+${formatBRL(difference)}` : formatBRL(difference)}
                </span>
              </div>
            )}

            {countedCash !== '' && difference !== 0 && (
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Justificativa da Divergência (Obrigatório em caso de sobra/falta)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: troco dado a mais, gorjeta deixada no caixa, arredondamento..."
                  value={differenceReason}
                  onChange={(e) => setDifferenceReason(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 bg-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações Gerais do Fechamento
            </label>
            <input
              type="text"
              placeholder="Ex: movimento tranquilo, falta de energia às 21h..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
            />
          </div>

          {/* Footer */}
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
              disabled={countedCash === ''}
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              Registrar Fechamento de Caixa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
