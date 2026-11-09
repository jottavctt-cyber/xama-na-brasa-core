import React, { useState } from 'react';
import { X, Wallet } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { FinancialCategory, PaymentMethod } from '../../types';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES: FinancialCategory[] = [
  'Aluguel',
  'Energia',
  'Gás',
  'Carvão',
  'Compra de ingredientes',
  'Compra de bebidas',
  'Embalagens',
  'Manutenção',
  'Outros',
];

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction } = useBusiness();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState<FinancialCategory>('Outros');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || Number(amount) <= 0) return;

    addTransaction({
      date,
      dueDate: status === 'pendente' ? dueDate : undefined,
      type: 'despesa',
      category,
      description: description.trim(),
      amount: Number(amount),
      paymentMethod,
      status,
      paymentDate: status === 'pago' ? date : undefined,
      referenceType: 'avulsa',
    });

    handleClose();
  };

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCategory('Outros');
    setPaymentMethod('pix');
    setStatus('pago');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Lançar Despesa</h3>
              <p className="text-[11px] text-stone-500">
                Registro no financeiro (contas a pagar ou saída imediata de caixa)
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
              Descrição da Despesa
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Manutenção da grelha, Recarga do botijão, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-2 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FinancialCategory)}
                className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Situação
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    status === 'pago'
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Já Pago
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    status === 'pendente'
                      ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Pendente
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro (Caixa físico)</option>
                <option value="debito">Cartão Débito</option>
                <option value="credito">Cartão Crédito</option>
                <option value="outro">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data do Lançamento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900 cursor-pointer"
              />
            </div>

            {status === 'pendente' && (
              <div>
                <label className="block text-xs font-semibold text-amber-800 mb-1">
                  Vencimento
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900 cursor-pointer border-amber-300"
                />
              </div>
            )}
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
              Lançar Despesa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
