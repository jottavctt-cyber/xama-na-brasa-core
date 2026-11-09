import React, { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle, CheckCircle2, ShoppingBag, Flame } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Product, PaymentMethod, SalesChannel } from '../../types';
import { formatBRL } from '../../utils/deterministicMath';

interface NewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SaleDraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export const NewSaleModal: React.FC<NewSaleModalProps> = ({ isOpen, onClose }) => {
  const { products, addSale } = useBusiness();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [saleItems, setSaleItems] = useState<SaleDraftItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [channel, setChannel] = useState<SalesChannel>('balcao');
  const [observation, setObservation] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [resultWarnings, setResultWarnings] = useState<string[] | null>(null);

  if (!isOpen) return null;

  const activeProducts = products.filter((p) => p.active);

  const handleAddItem = (prod: Product) => {
    const existingIndex = saleItems.findIndex((i) => i.productId === prod.id);
    const price = prod.salePrice ?? 0;

    if (existingIndex !== -1) {
      const updated = [...saleItems];
      updated[existingIndex].quantity += 1;
      setSaleItems(updated);
    } else {
      setSaleItems([
        ...saleItems,
        {
          productId: prod.id,
          productName: prod.name,
          quantity: 1,
          unitPrice: price,
          discount: 0,
        },
      ]);
    }
  };

  const handleUpdateItem = (index: number, updates: Partial<SaleDraftItem>) => {
    const updated = [...saleItems];
    updated[index] = { ...updated[index], ...updates };
    setSaleItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const grossTotal = saleItems.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  const discountTotal = saleItems.reduce((acc, item) => acc + (item.discount || 0), 0);
  const netTotal = Math.max(0, grossTotal - discountTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (saleItems.length === 0) return;

    const result = addSale({
      items: saleItems,
      paymentMethod,
      channel,
      observation: observation.trim() || undefined,
      saleDate: new Date(saleDate).toISOString(),
    });

    if (result.stockWarnings.length > 0) {
      setResultWarnings(result.stockWarnings);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setSaleItems([]);
    setObservation('');
    setResultWarnings(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">Registrar Venda</h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500">
                Baixa de estoque e congelamento de preço no momento da venda
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
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5">
          {/* Quick Item Addition & Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Adicionar Produtos do Cardápio
            </label>

            {/* Quick 1-Tap Touch Chips for Mobile/Counter */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll pb-2 mb-2">
              {activeProducts.slice(0, 6).map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAddItem(prod)}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100 hover:bg-amber-100/70 border border-stone-200/80 rounded-lg text-xs font-medium text-stone-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap active:scale-95"
                >
                  <Plus className="w-3 h-3 text-amber-700 shrink-0" />
                  <span className="truncate max-w-[120px]">{prod.name}</span>
                  {prod.salePrice !== null && (
                    <span className="text-[10px] text-stone-500 font-mono">
                      {formatBRL(prod.salePrice)}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const prod = activeProducts.find((p) => p.id === e.target.value);
                  if (prod) {
                    handleAddItem(prod);
                    setSelectedProductId('');
                  }
                }}
                className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">Selecione outro produto no cardápio completo...</option>
                <optgroup label="Espetinhos">
                  {activeProducts
                    .filter((p) => p.category === 'Espetinhos')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.salePrice !== null ? formatBRL(p.salePrice) : 'Preço pendente'}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Porções e Alimentos">
                  {activeProducts
                    .filter((p) => p.category === 'Porções e alimentos')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.salePrice !== null ? formatBRL(p.salePrice) : 'Preço pendente'}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Bebidas">
                  {activeProducts
                    .filter((p) => p.category === 'Bebidas')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.salePrice !== null ? formatBRL(p.salePrice) : 'Preço pendente'}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Selected Items Table / Mobile Cards */}
          <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white/70">
            <div className="px-3 py-2 bg-stone-100/70 text-[11px] font-semibold text-stone-600 flex justify-between items-center">
              <span>Itens da Venda ({saleItems.length})</span>
              <span>Subtotal</span>
            </div>

            {saleItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                Nenhum item adicionado ainda. Toque nos botões rápidos ou selecione acima para compor a venda.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {saleItems.map((item, idx) => {
                  const subtotal = Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
                  return (
                    <div key={idx} className="p-2.5 sm:p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 truncate">{item.productName}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          {/* Quantity control */}
                          <div className="flex items-center gap-1 bg-stone-100/80 px-1.5 py-0.5 rounded border border-stone-200">
                            <span className="text-[10px] text-stone-500 font-medium">Qtd:</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(idx, { quantity: Math.max(1, item.quantity - 1) })
                              }
                              className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-6 text-center font-mono font-bold text-stone-900">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateItem(idx, { quantity: item.quantity + 1 })
                              }
                              className="w-5 h-5 flex items-center justify-center font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                            >
                              +
                            </button>
                          </div>

                          {/* Unit Price */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500">R$:</span>
                            <input
                              type="number"
                              step="0.5"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })
                              }
                              className="w-18 px-1.5 py-0.5 border border-stone-200 rounded text-right text-xs font-mono"
                            />
                          </div>

                          {/* Discount */}
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-stone-500">Desc:</span>
                            <input
                              type="number"
                              step="0.5"
                              min="0"
                              value={item.discount}
                              onChange={(e) =>
                                handleUpdateItem(idx, { discount: parseFloat(e.target.value) || 0 })
                              }
                              className="w-16 px-1.5 py-0.5 border border-stone-200 rounded text-right text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                        <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                          {formatBRL(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1.5 cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method & Sales Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {(['dinheiro', 'pix', 'debito', 'credito'] as PaymentMethod[]).map(
                  (method) => {
                    const labels: Record<string, string> = {
                      dinheiro: 'Dinheiro',
                      pix: 'PIX',
                      debito: 'Débito',
                      credito: 'Crédito',
                      outro: 'Outro',
                    };
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-1 text-center rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                          paymentMethod === method
                            ? 'bg-amber-600 text-white font-semibold shadow-xs'
                            : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70 border border-stone-200'
                        }`}
                      >
                        {labels[method]}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Canal da Venda
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['balcao', 'mesa', 'entrega'] as SalesChannel[]).map((c) => {
                  const labels: Record<string, string> = {
                    balcao: 'Balcão',
                    mesa: 'Mesa',
                    entrega: 'Entrega',
                    outro: 'Outro',
                  };
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c)}
                      className={`py-2 px-2 text-center rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                        channel === c
                          ? 'bg-stone-900 text-white font-semibold shadow-xs'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70 border border-stone-200'
                      }`}
                    >
                      {labels[c]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Date and Observation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Data e Horário
              </label>
              <input
                type="datetime-local"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Observação (Mesa / Cliente)
              </label>
              <input
                type="text"
                placeholder="Ex: Mesa 04, sem cebola..."
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-800"
              />
            </div>
          </div>

          {/* Warnings Alert Box */}
          {resultWarnings && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Venda registrada com alertas no estoque:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800 space-y-0.5">
                {resultWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1 bg-amber-700 hover:bg-amber-800 text-white font-medium rounded-lg text-xs cursor-pointer"
                >
                  Entendido e Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary & Submit */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-stone-50/80 border-t border-stone-200/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-baseline justify-between sm:justify-start gap-4">
            <span className="text-xs text-stone-500">Total a Pagar:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl sm:text-2xl font-bold font-mono text-stone-900 tabular-nums">
                {formatBRL(netTotal)}
              </span>
              {discountTotal > 0 && (
                <span className="text-xs text-stone-400 line-through font-mono">
                  {formatBRL(grossTotal)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200/80 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saleItems.length === 0}
              onClick={handleSubmit}
              className="flex-1 sm:flex-initial min-h-[44px] flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Venda</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
