import React, { useState } from 'react';
import {
  Boxes,
  ClipboardCheck,
  ArrowDownUp,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { StockCategory, StockItem, UnitOfMeasure } from '../types';
import { formatBRL, formatQuantity } from '../utils/deterministicMath';
import { StockMovementModal } from '../components/modals/StockMovementModal';
import { NewStockItemModal } from '../components/modals/NewStockItemModal';

interface StockPageProps {
  onOpenStockCount: () => void;
}

export const StockPage: React.FC<StockPageProps> = ({ onOpenStockCount }) => {
  const { stockItems, stockMovements } = useBusiness();

  const [activeTab, setActiveTab] = useState<'itens' | 'movimentacoes'>('itens');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'uncounted' | 'low' | 'ok'>('all');
  const [movementModalItem, setMovementModalItem] = useState<StockItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);

  // New stock item modal state
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);

  const categories: StockCategory[] = [
    'Carnes',
    'Bebidas',
    'Ingredientes',
    'Porções e preparados',
    'Embalagens',
    'Outros',
  ];

  // Filtering items
  const filteredStock = stockItems.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

    if (statusFilter === 'uncounted') {
      if (item.isCounted && item.currentQuantity !== null) return false;
    } else if (statusFilter === 'low') {
      if (!item.isCounted || item.currentQuantity === null || item.currentQuantity > item.minStock) {
        return false;
      }
    } else if (statusFilter === 'ok') {
      if (!item.isCounted || item.currentQuantity === null || item.currentQuantity <= item.minStock) {
        return false;
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = item.name.toLowerCase().includes(term);
      const noteMatch = item.notes?.toLowerCase().includes(term);
      return nameMatch || noteMatch;
    }
    return true;
  });

  const uncountedCount = stockItems.filter((s) => !s.isCounted || s.currentQuantity === null).length;
  const lowStockCount = stockItems.filter(
    (s) => s.isCounted && s.currentQuantity !== null && s.currentQuantity <= s.minStock
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Controle de Estoque e Insumos</h3>
            <p className="text-[11px] text-stone-500">
              Contagem física, baixas automáticas por venda e controle de perdas e quebras
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewItemModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-stone-950" />
            <span>Novo Item no Estoque</span>
          </button>

          <button
            onClick={() => {
              setMovementModalItem(null);
              setIsMovementModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-all shadow-2xs cursor-pointer"
          >
            <ArrowDownUp className="w-4 h-4 text-stone-500" />
            <span>Movimentação Avulsa</span>
          </button>

          <button
            onClick={onOpenStockCount}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4 text-amber-500" />
            <span>Contagem de Inventário</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-stone-500 font-medium block">Total de Itens Cadastrados</span>
          <span className="text-xl font-bold font-mono text-stone-900 tabular-nums block mt-1">
            {stockItems.length} itens
          </span>
          <span className="text-[10px] text-stone-400">Carnes, bebidas e insumos</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-amber-800 font-medium block">Sem Contagem Inicial</span>
          <span className="text-xl font-bold font-mono text-amber-900 tabular-nums block mt-1">
            {uncountedCount} itens
          </span>
          <span className="text-[10px] text-amber-700">Aguardando primeira contagem física</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-red-800 font-medium block">Estoque Baixo ou Crítico</span>
          <span className="text-xl font-bold font-mono text-red-900 tabular-nums block mt-1">
            {lowStockCount} itens
          </span>
          <span className="text-[10px] text-red-700">Abaixo da margem mínima de segurança</span>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl overflow-x-auto no-scrollbar touch-scroll max-w-full text-xs font-medium">
        <button
          onClick={() => setActiveTab('itens')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'itens' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Itens de Estoque ({stockItems.length})
        </button>
        <button
          onClick={() => setActiveTab('movimentacoes')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            activeTab === 'movimentacoes'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Histórico de Movimentações ({stockMovements.length})
        </button>
      </div>

      {activeTab === 'itens' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[220px]">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Buscar insumo ou bebida..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="glass-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input px-2.5 py-1.5 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="all">Todas as categorias</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="glass-input px-2.5 py-1.5 rounded-lg text-stone-800 cursor-pointer"
              >
                <option value="all">Todos os status</option>
                <option value="uncounted">Não contados ({uncountedCount})</option>
                <option value="low">Estoque baixo ({lowStockCount})</option>
                <option value="ok">Estoque normal</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                    <th className="py-3 px-4">Insumo / Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-right">Saldo Atual</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-right">Custo de Compra</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredStock.map((item) => {
                    const isUncounted = !item.isCounted || item.currentQuantity === null;
                    const isLow = !isUncounted && item.currentQuantity! <= item.minStock;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-stone-900 block">{item.name}</span>
                          {item.packageDescription ? (
                            <span className="text-[10px] text-stone-500 block">
                              {item.packageDescription}
                            </span>
                          ) : item.notes ? (
                            <span className="text-[10px] text-stone-400 block truncate max-w-xs">
                              {item.notes}
                            </span>
                          ) : null}
                        </td>

                        <td className="py-3 px-4 text-stone-600">{item.category}</td>

                        <td className="py-3 px-4 text-right font-mono font-bold tabular-nums">
                          {isUncounted ? (
                            <span className="text-amber-800 text-[11px] font-semibold">
                              Não contado
                            </span>
                          ) : (
                            <span className={isLow ? 'text-red-700' : 'text-stone-900'}>
                              {formatQuantity(item.currentQuantity, item.unit)}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-stone-500 tabular-nums">
                          {formatQuantity(item.minStock, item.unit)}
                        </td>

                        <td className="py-3 px-4 text-right font-mono tabular-nums">
                          {item.unitCost !== null ? (
                            <div>
                              <span className="text-stone-800 font-semibold">
                                {formatBRL(item.unitCost)} / {item.unit}
                              </span>
                              {item.costRangeNote && (
                                <span className="block text-[9px] text-stone-400 truncate max-w-[160px] ml-auto">
                                  {item.costRangeNote}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-800 text-[10px] font-semibold">
                              Não informado
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {isUncounted ? (
                            <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              Sem contagem
                            </span>
                          ) : isLow ? (
                            <span className="text-[10px] font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                              Estoque Baixo
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Normal
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setMovementModalItem(item);
                              setIsMovementModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-md transition-colors cursor-pointer"
                          >
                            Movimentar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Movimentações */}
      {activeTab === 'movimentacoes' && (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-stone-200 text-xs font-semibold text-stone-700 flex justify-between items-center">
            <span>Registro Histórico de Movimentações ({stockMovements.length})</span>
            <span className="text-[11px] text-stone-400 font-normal">
              Entradas, consumos por vendas, perdas e ajustes físicos
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-4">Item</th>
                  <th className="py-2.5 px-4">Tipo</th>
                  <th className="py-2.5 px-4 text-right">Qtd Movimentada</th>
                  <th className="py-2.5 px-4 text-right">Novo Saldo</th>
                  <th className="py-2.5 px-4">Motivo / Origem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      Nenhuma movimentação de estoque registrada até o momento.
                    </td>
                  </tr>
                ) : (
                  stockMovements.map((mov) => {
                    const isPositive = mov.quantityDelta > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-stone-600">
                          {mov.date.slice(0, 10).split('-').reverse().join('/')}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-stone-900">{mov.itemName}</td>
                        <td className="py-2.5 px-4 capitalize">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                              mov.type === 'entrada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : mov.type === 'perda'
                                ? 'bg-red-100 text-red-800'
                                : mov.type === 'consumo_venda'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}
                          >
                            {mov.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={isPositive ? 'text-emerald-800' : 'text-red-700'}>
                            {isPositive
                              ? `+${mov.quantityDelta} ${mov.unit}`
                              : `${mov.quantityDelta} ${mov.unit}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-stone-700 tabular-nums">
                          {mov.newQuantity} {mov.unit}
                        </td>
                        <td className="py-2.5 px-4 text-stone-600">{mov.reason}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {isMovementModalOpen && (
        <StockMovementModal
          isOpen={isMovementModalOpen}
          onClose={() => setIsMovementModalOpen(false)}
          selectedItem={movementModalItem}
        />
      )}

      {/* New Stock Item Modal */}
      {isNewItemModalOpen && (
        <NewStockItemModal
          isOpen={isNewItemModalOpen}
          onClose={() => setIsNewItemModalOpen(false)}
        />
      )}
    </div>
  );
};
