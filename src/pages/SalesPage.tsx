import React, { useState } from 'react';
import {
  Receipt,
  Search,
  Filter,
  Plus,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  ChevronDown,
  Eye,
  X,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Sale } from '../types';
import { formatBRL, formatQuantity } from '../utils/deterministicMath';

interface SalesPageProps {
  onOpenNewSale: () => void;
}

export const SalesPage: React.FC<SalesPageProps> = ({ onOpenNewSale }) => {
  const { sales, cancelSale, activeDateFilter } = useBusiness();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'concluida' | 'cancelada'>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [cancelModalSale, setCancelModalSale] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Date filtering
  const filteredSales = sales.filter((s) => {
    if (activeDateFilter !== 'all' && !s.date.startsWith(activeDateFilter)) {
      return false;
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) {
      return false;
    }
    if (channelFilter !== 'all' && s.channel !== channelFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const codeMatch = s.code.toLowerCase().includes(term);
      const itemMatch = s.items.some((i) => i.productName.toLowerCase().includes(term));
      const obsMatch = s.observation?.toLowerCase().includes(term);
      return codeMatch || itemMatch || obsMatch;
    }
    return true;
  });

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalSale || !cancelReason.trim()) return;

    cancelSale(cancelModalSale.id, cancelReason.trim());
    setCancelModalSale(null);
    setCancelReason('');
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Registro e Histórico de Vendas</h3>
            <p className="text-[11px] text-stone-500">
              Preços e custos congelados no momento da venda com baixa automática de ingredientes
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewSale}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Venda</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar por código, produto ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-stone-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status buttons */}
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Todas ({sales.length})
            </button>
            <button
              onClick={() => setStatusFilter('concluida')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'concluida'
                  ? 'bg-white text-emerald-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Concluídas
            </button>
            <button
              onClick={() => setStatusFilter('cancelada')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                statusFilter === 'cancelada'
                  ? 'bg-white text-red-900 shadow-2xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Canceladas
            </button>
          </div>

          {/* Channel dropdown */}
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="glass-input px-2.5 py-1.5 rounded-lg text-stone-800 cursor-pointer"
          >
            <option value="all">Todos os canais</option>
            <option value="balcao">Balcão</option>
            <option value="mesa">Mesa</option>
            <option value="entrega">Entrega</option>
          </select>
        </div>
      </div>

      {/* Sales Table */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                <th className="py-3 px-4">Código / Hora</th>
                <th className="py-3 px-4">Itens Vendidos</th>
                <th className="py-3 px-4">Forma Pagto / Canal</th>
                <th className="py-3 px-4 text-right">CMV Estimado</th>
                <th className="py-3 px-4 text-right">Total Líquido</th>
                <th className="py-3 px-4 text-center">Estoque</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    Nenhuma venda encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCancelled = sale.status === 'cancelada';
                  const dateObj = new Date(sale.date);
                  const formattedTime = dateObj.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const formattedDate = dateObj.toLocaleDateString('pt-BR');

                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-stone-50/50 transition-colors ${
                        isCancelled ? 'opacity-60 bg-stone-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-stone-900 block">{sale.code}</span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          {formattedDate} {formattedTime}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-medium text-stone-900 truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </div>
                        {sale.observation && (
                          <span className="text-[10px] text-stone-500 italic block truncate">
                            Obs: {sale.observation}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 capitalize block">
                          {sale.paymentMethod}
                        </span>
                        <span className="text-[10px] text-stone-500 capitalize">
                          {sale.channel}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {sale.calculatedCMV !== null ? (
                          <span className="text-stone-700">{formatBRL(sale.calculatedCMV)}</span>
                        ) : (
                          <span
                            className="text-amber-800 text-[10px] font-semibold"
                            title={sale.stockDeductionNotes || 'Receita com custo incompleto'}
                          >
                            Custo incompleto
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                        {formatBRL(sale.netTotal)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {sale.stockDeductionStatus === 'deducted' ? (
                          <span
                            className="text-[10px] font-medium text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded"
                            title="Todos os ingredientes foram baixados automaticamente do estoque"
                          >
                            Baixado
                          </span>
                        ) : sale.stockDeductionStatus === 'partial' ? (
                          <span
                            className="text-[10px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded"
                            title={sale.stockDeductionNotes || 'Baixa parcial: insumo sem contagem'}
                          >
                            Parcial
                          </span>
                        ) : (
                          <span
                            className="text-[10px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded"
                            title="Sem ingredientes mapeados ou estoque pendente"
                          >
                            Pendente
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isCancelled ? (
                          <span
                            className="text-[10px] font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded"
                            title={`Motivo: ${sale.cancellationReason || 'Cancelamento'}`}
                          >
                            Cancelada
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Concluída
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedSaleForDetails(sale)}
                            className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded transition-colors cursor-pointer"
                            title="Ver detalhes da venda"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isCancelled && (
                            <button
                              onClick={() => setCancelModalSale(sale)}
                              className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Cancelar lançamento"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Details Modal */}
      {selectedSaleForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="glass-panel w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-900">
                  Detalhes da Venda {selectedSaleForDetails.code}
                </h3>
                <p className="text-[11px] text-stone-500">
                  Registrada em {new Date(selectedSaleForDetails.date).toLocaleString('pt-BR')}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleForDetails(null)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-stone-50 rounded-xl">
                <div>
                  <span className="text-stone-500 block">Forma de Pagamento:</span>
                  <span className="font-semibold text-stone-900 capitalize">
                    {selectedSaleForDetails.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Canal:</span>
                  <span className="font-semibold text-stone-900 capitalize">
                    {selectedSaleForDetails.channel}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-stone-800 mb-2">Composição dos Itens:</h4>
                <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
                  {selectedSaleForDetails.items.map((item, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-stone-900 block">{item.productName}</span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          {item.quantity} un x {formatBRL(item.unitPrice)}
                          {item.discount > 0 && ` (Desc: -${formatBRL(item.discount)})`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-stone-900 block">
                          {formatBRL(item.subtotal)}
                        </span>
                        <span className="text-[10px] text-stone-500 font-mono">
                          CMV Unit: {item.unitCostAtSale ? formatBRL(item.unitCostAtSale) : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSaleForDetails.stockDeductionNotes && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px]">
                  <strong>Notas sobre o estoque:</strong> {selectedSaleForDetails.stockDeductionNotes}
                </div>
              )}

              {selectedSaleForDetails.status === 'cancelada' && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-[11px]">
                  <strong>Cancelada em:</strong>{' '}
                  {selectedSaleForDetails.cancelledAt
                    ? new Date(selectedSaleForDetails.cancelledAt).toLocaleString('pt-BR')
                    : 'Data não informada'}
                  <br />
                  <strong>Motivo:</strong> {selectedSaleForDetails.cancellationReason}
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex justify-between items-center text-xs">
              <div>
                <span className="text-stone-500">Total Líquido:</span>{' '}
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatBRL(selectedSaleForDetails.netTotal)}
                </span>
              </div>
              <button
                onClick={() => setSelectedSaleForDetails(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Audit Modal */}
      {cancelModalSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs">
          <div className="glass-panel w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700">
                <Ban className="w-4 h-4" />
                <h3 className="text-sm font-bold">Cancelar Venda {cancelModalSale.code}</h3>
              </div>
              <button
                onClick={() => setCancelModalSale(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCancel} className="p-6 space-y-4 text-xs">
              <p className="text-stone-600">
                O cancelamento manterá o registro histórico auditado, estornará as baixas de estoque
                já efetuadas e cancelará a receita de{' '}
                <strong className="text-stone-900 font-mono">
                  {formatBRL(cancelModalSale.netTotal)}
                </strong>{' '}
                no financeiro.
              </p>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Motivo do Cancelamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: pedido desistido pelo cliente, erro de lançamento..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="glass-input w-full px-3 py-2 rounded-lg text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalSale(null)}
                  className="px-4 py-2 font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm cursor-pointer"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
