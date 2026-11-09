import React, { useState } from 'react';
import { X, Plus, Trash2, AlertTriangle, CheckCircle2, ShoppingBag } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Registrar Venda</h3>
              <p className="text-[11px] text-stone-500">
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
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Item Selector Quick Strip */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Adicionar Produtos do Cardápio
            </label>
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
                className="glass-input flex-1 px-3 py-2 text-xs rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="">Selecione um produto para adicionar...</option>
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

          {/* Selected Items Table */}
          <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white/70">
            <div className="px-3 py-2 bg-stone-100/70 text-[11px] font-semibold text-stone-600 flex justify-between items-center">
              <span>Itens da Venda ({saleItems.length})</span>
              <span>Subtotal</span>
            </div>

            {saleItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-500">
                Nenhum item adicionado ainda. Escolha os produtos acima para compor a venda.
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {saleItems.map((item, idx) => {
                  const subtotal = Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
                  return (
                    <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-stone-900 truncate">{item.productName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-stone-500">Qtd:</span>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(idx, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                              }
                              className="w-14 px-1.5 py-0.5 border border-stone-200 rounded text-center text-xs font-mono"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-stone-500">Preço:</span>
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

                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-stone-500">Desc:</span>
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

                      <div className="flex items-center gap-3">
                        <span className="font-mono font-semibold text-stone-900 tabular-nums">
                          {formatBRL(subtotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-stone-400 hover:text-red-600 transition-colors p-1"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method & Sales Channel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Forma de Pagamento
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { id: 'pix', label: 'PIX' },
                    { id: 'dinheiro', label: 'Dinheiro (Espécie)' },
                    { id: 'debito', label: 'Cartão Débito' },
                    { id: 'credito', label: 'Cartão Crédito' },
                  ] as const
                ).map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-colors cursor-pointer ${
                      paymentMethod === pm.id
                        ? 'border-amber-600 bg-amber-50/70 text-amber-900 font-semibold'
                        : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Canal de Venda & Data
              </label>
              <div className="space-y-2">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as SalesChannel)}
                  className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-800"
                >
                  <option value="balcao">Balcão / Retirada</option>
                  <option value="mesa">Mesa / Consumo Local</option>
                  <option value="entrega">Entrega / Delivery</option>
                  <option value="outro">Outro</option>
                </select>

                <input
                  type="datetime-local"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-800"
                />
              </div>
            </div>
          </div>

          {/* Observations */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: sem cebola, mesa 4, cliente frequente..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-800"
            />
          </div>

          {/* Warnings Banner if stock missing or incomplete */}
          {resultWarnings && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Venda registrada com alertas operacionais de estoque:</span>
              </div>
              <ul className="list-disc list-inside text-stone-700 space-y-0.5 pl-2 text-[11px]">
                {resultWarnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Entendido, Concluir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer & Totals */}
        {!resultWarnings && (
          <div className="px-6 py-4 border-t border-stone-200/80 bg-stone-50/70 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-stone-500">Bruto:</span>{' '}
                <span className="font-mono text-stone-700 tabular-nums">{formatBRL(grossTotal)}</span>
              </div>
              {discountTotal > 0 && (
                <div>
                  <span className="text-stone-500">Descontos:</span>{' '}
                  <span className="font-mono text-amber-800 tabular-nums">-{formatBRL(discountTotal)}</span>
                </div>
              )}
              <div className="pl-3 border-l border-stone-300">
                <span className="text-stone-500 font-medium">Total Líquido:</span>{' '}
                <span className="font-mono text-base font-bold text-stone-900 tabular-nums">
                  {formatBRL(netTotal)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saleItems.length === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Confirmar Venda
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
