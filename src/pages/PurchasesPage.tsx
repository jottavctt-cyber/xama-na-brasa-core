import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShoppingCart,
  Calendar,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Purchase } from '../types';
import { formatBRL } from '../utils/deterministicMath';

interface PurchasesPageProps {
  onOpenNewPurchase: () => void;
}

export const PurchasesPage: React.FC<PurchasesPageProps> = ({ onOpenNewPurchase }) => {
  const { purchases, activeDateFilter } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');

  const filteredPurchases = purchases.filter((p) => {
    if (activeDateFilter !== 'all' && !p.date.startsWith(activeDateFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && p.status !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = p.code.toLowerCase().includes(term);
      const supplierMatch = p.supplier?.toLowerCase().includes(term);
      const itemMatch = p.items.some((i) => i.itemName.toLowerCase().includes(term));
      return codeMatch || supplierMatch || itemMatch;
    }
    return true;
  });

  const totalPurchasesAmount = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Compras e Reposição de Estoque</h3>
            <p className="text-[11px] text-stone-500">
              Registros integrados com atualização de custos unitários e contas a pagar
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewPurchase}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Compra</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar compra por fornecedor, item ou código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-stone-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todas ({purchases.length})
            </button>
            <button
              onClick={() => setStatusFilter('pago')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'pago'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pagas
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'pendente'
                  ? 'bg-white text-amber-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pendentes
            </button>
          </div>

          <div className="pl-3 border-l border-stone-200">
            <span className="text-stone-500">Total do Período:</span>{' '}
            <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
              {formatBRL(totalPurchasesAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Purchases List */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <th className="py-3 px-4">Código / Data</th>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Itens Comprados</th>
                <th className="py-3 px-4">Forma Pagto</th>
                <th className="py-3 px-4 text-center">Estoque Atualizado</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Nenhuma compra registrada para o período selecionado.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => {
                  const isPaid = p.status === 'pago';
                  return (
                    <tr key={p.id} className="hover:bg-stone-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900 block">{p.code}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {p.date.split('-').reverse().join('/')}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-medium text-stone-900">
                        {p.supplier || <span className="text-stone-400 italic">Não informado</span>}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-800">
                          {p.items.map((i) => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')}
                        </div>
                        {p.observation && (
                          <span className="text-[10px] text-stone-500 italic block">
                            Obs: {p.observation}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 capitalize text-stone-700">{p.paymentMethod}</td>

                      <td className="py-3 px-4 text-center">
                        {p.stockUpdated ? (
                          <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Entrada confirmada
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
                            Não atualizado
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isPaid ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Pago
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                            A Pagar
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                        {formatBRL(p.totalAmount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
