import React, { useState } from 'react';
import { X, ShoppingCart, Plus, Trash2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { PaymentMethod, UnitOfMeasure } from '../../types';
import { formatBRL } from '../../utils/deterministicMath';

interface NewPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftPurchaseItem {
  stockItemId?: string;
  itemName: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice: number;
  totalPrice: number;
}

export const NewPurchaseModal: React.FC<NewPurchaseModalProps> = ({ isOpen, onClose }) => {
  const { stockItems, addPurchase } = useBusiness();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [status, setStatus] = useState<'pago' | 'pendente'>('pago');
  const [stockUpdated, setStockUpdated] = useState<boolean>(true);
  const [observation, setObservation] = useState<string>('');

  const [items, setItems] = useState<DraftPurchaseItem[]>([
    {
      stockItemId: '',
      itemName: '',
      quantity: 1,
      unit: 'kg',
      unitPrice: 0,
      totalPrice: 0,
    },
  ]);

  if (!isOpen) return null;

  const handleItemSelect = (index: number, stockItemId: string) => {
    const stock = stockItems.find((s) => s.id === stockItemId);
    const updated = [...items];
    if (stock) {
      const unitCost = stock.unitCost || 0;
      updated[index] = {
        ...updated[index],
        stockItemId: stock.id,
        itemName: stock.name,
        unit: stock.unit,
        unitPrice: unitCost,
        totalPrice: updated[index].quantity * unitCost,
      };
    } else {
      updated[index] = {
        ...updated[index],
        stockItemId: '',
      };
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof DraftPurchaseItem, value: any) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      current.totalPrice = (Number(current.quantity) || 0) * (Number(current.unitPrice) || 0);
    } else if (field === 'totalPrice') {
      const q = Number(current.quantity) || 1;
      current.unitPrice = Number(current.totalPrice) / q;
    }

    updated[index] = current;
    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        stockItemId: '',
        itemName: '',
        quantity: 1,
        unit: 'kg',
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || grandTotal <= 0) return;

    addPurchase({
      date,
      supplier: supplier.trim() || undefined,
      items: items.map((i) => ({
        stockItemId: i.stockItemId || undefined,
        itemName: i.itemName.trim(),
        quantity: Number(i.quantity),
        unit: i.unit,
        unitPrice: Number(i.unitPrice),
        totalPrice: Number(i.totalPrice),
      })),
      totalAmount: grandTotal,
      paymentMethod,
      status,
      stockUpdated,
      observation: observation.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSupplier('');
    setObservation('');
    setItems([
      {
        stockItemId: '',
        itemName: '',
        quantity: 1,
        unit: 'kg',
        unitPrice: 0,
        totalPrice: 0,
      },
    ]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-100 text-stone-800 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Registrar Compra de Estoque</h3>
              <p className="text-[11px] text-stone-500">
                Gera entrada em estoque e lançamento financeiro correspondente
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data da Compra
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
                Fornecedor (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Frigorífico Central, Distribuidora de Bebidas..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white/70">
            <div className="px-3 py-2 bg-stone-100/70 text-[11px] font-semibold text-stone-700 flex justify-between items-center">
              <span>Itens Comprados</span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-[11px] text-amber-800 hover:text-amber-900 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Linha</span>
              </button>
            </div>

            <div className="p-3 space-y-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-5">
                    <select
                      value={item.stockItemId || ''}
                      onChange={(e) => handleItemSelect(index, e.target.value)}
                      className="glass-input w-full px-2 py-1 text-xs rounded text-stone-900 cursor-pointer"
                    >
                      <option value="">Vincular a item do estoque...</option>
                      {stockItems.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.unit})
                        </option>
                      ))}
                    </select>
                    {!item.stockItemId && (
                      <input
                        type="text"
                        placeholder="Ou digite o nome do item..."
                        required
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className="glass-input w-full mt-1 px-2 py-1 text-xs rounded text-stone-900"
                      />
                    )}
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      placeholder="Qtd"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                      className="glass-input w-full px-2 py-1 text-xs font-mono text-center rounded text-stone-900"
                    />
                  </div>

                  <div className="col-span-2">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, 'unit', e.target.value as UnitOfMeasure)}
                      className="glass-input w-full px-1.5 py-1 text-xs rounded text-stone-900 cursor-pointer"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="un">un</option>
                      <option value="garrafa">garrafa</option>
                      <option value="lata">lata</option>
                      <option value="caixa">caixa</option>
                      <option value="fardo">fardo</option>
                      <option value="saco">saco</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Total R$"
                      required
                      value={item.totalPrice}
                      onChange={(e) => handleItemChange(index, 'totalPrice', parseFloat(e.target.value))}
                      className="glass-input w-full px-2 py-1 text-xs font-mono text-right rounded text-stone-900"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(index)}
                      className="text-stone-400 hover:text-red-600 disabled:opacity-20 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment, Status & Stock Options */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro em espécie</option>
                <option value="debito">Cartão Débito</option>
                <option value="credito">Cartão Crédito</option>
                <option value="outro">Boleto / Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Situação Financeira
              </label>
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setStatus('pago')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    status === 'pago' ? 'bg-white text-stone-900 shadow-2xs font-semibold' : 'text-stone-600'
                  }`}
                >
                  Pago (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pendente')}
                  className={`py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    status === 'pendente' ? 'bg-white text-amber-900 shadow-2xs font-semibold' : 'text-stone-600'
                  }`}
                >
                  Pendente (A pagar)
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="stockUpdated"
              checked={stockUpdated}
              onChange={(e) => setStockUpdated(e.target.checked)}
              className="rounded border-stone-300 text-amber-700 focus:ring-amber-600 h-4 w-4 cursor-pointer"
            />
            <label htmlFor="stockUpdated" className="text-xs text-stone-700 font-medium cursor-pointer">
              Dar entrada automática das quantidades nos itens vinculados do estoque
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observação
            </label>
            <input
              type="text"
              placeholder="Número de nota, lote, etc."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500">Total da Compra:</span>{' '}
              <span className="font-mono text-base font-bold text-stone-900 tabular-nums">
                {formatBRL(grandTotal)}
              </span>
            </div>

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
                disabled={items.length === 0 || grandTotal <= 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                Salvar Compra
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
