import React from 'react';
import {
  TrendingUp,
  Receipt,
  Wallet,
  Boxes,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Info,
  Calendar,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import {
  calculateGrossSales,
  calculateNetSales,
  calculateTotalDiscounts,
  calculateTotalCMV,
  calculateGrossProfit,
  calculateGrossMarginPct,
  calculateOperatingExpenses,
  calculateNetProfit,
  calculateNetMarginPct,
  calculateCashFlow,
  calculateCurrentCashBalance,
  calculateDeterministicSalesEstimate,
  formatBRL,
  formatPercent,
  formatQuantity,
} from '../utils/deterministicMath';
import { PageId } from '../components/Sidebar';

interface OverviewPageProps {
  onNavigate: (page: PageId) => void;
  onOpenNewSale: () => void;
  onOpenStockCount: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onOpenNewSale,
  onOpenStockCount,
}) => {
  const {
    sales,
    transactions,
    stockItems,
    products,
    settings,
    activeDateFilter,
  } = useBusiness();

  // Filter sales & transactions according to activeDateFilter
  const filteredSales = sales.filter((s) => {
    if (activeDateFilter === 'all') return true;
    return s.date.startsWith(activeDateFilter);
  });

  const filteredTransactions = transactions.filter((t) => {
    if (activeDateFilter === 'all') return true;
    return t.date.startsWith(activeDateFilter);
  });

  // Deterministic Metrics
  const grossSales = calculateGrossSales(filteredSales);
  const totalDiscounts = calculateTotalDiscounts(filteredSales);
  const netSales = calculateNetSales(filteredSales);
  const { cmvTotal, isComplete: isCMVComplete, uncalculatedItemsCount } = calculateTotalCMV(filteredSales);
  const grossProfit = calculateGrossProfit(netSales, cmvTotal);
  const grossMarginPct = calculateGrossMarginPct(grossProfit, netSales);

  const { totalPaid: expensesPaid, totalPending: expensesPending, totalOverall: totalExpenses } =
    calculateOperatingExpenses(filteredTransactions);

  const netProfit = calculateNetProfit(grossProfit, totalExpenses);
  const netMarginPct = calculateNetMarginPct(netProfit, netSales);

  const { inflows, outflows, netCashFlow } = calculateCashFlow(filteredTransactions);
  const currentCashBalance = calculateCurrentCashBalance(settings.openingCashDrawerDefault, transactions);

  // Stock status
  const uncountedStock = stockItems.filter((s) => !s.isCounted || s.currentQuantity === null);
  const lowStock = stockItems.filter(
    (s) => s.isCounted && s.currentQuantity !== null && s.currentQuantity <= s.minStock
  );

  // Incomplete recipes/costs in Menu
  const incompleteProducts = products.filter(
    (p) => p.costStatus === 'incomplete' || p.salePrice === null
  );

  // Best Sellers (Product ranking)
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
  filteredSales
    .filter((s) => s.status === 'concluida')
    .forEach((s) => {
      s.items.forEach((item) => {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSalesMap[item.productId].quantity += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      });
    });

  const topProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // Deterministic estimate
  const currentDayOfWeek = new Date().getDay();
  const salesEstimate = calculateDeterministicSalesEstimate(sales, currentDayOfWeek);

  return (
    <div className="space-y-6">
      {/* Date Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-stone-900">
                Resumo Operacional ·{' '}
                {activeDateFilter === 'all'
                  ? 'Todo o Histórico'
                  : activeDateFilter.length === 7
                  ? `Mês ${activeDateFilter}`
                  : `Dia ${activeDateFilter.split('-').reverse().join('/')}`}
              </h3>
              <span className="text-[11px] text-stone-500 font-medium">
                ({filteredSales.filter((s) => s.status === 'concluida').length} vendas realizadas)
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Todas as métricas são calculadas por fórmulas determinísticas sobre os registros do período.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenNewSale}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* KPI Primary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vendas Líquidas */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Vendas Líquidas</span>
            <Receipt className="w-4 h-4 text-stone-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {formatBRL(netSales)}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-1 border-t border-stone-200/60">
            <span>Bruto:</span>
            <span className="font-mono tabular-nums text-stone-700">{formatBRL(grossSales)}</span>
            {totalDiscounts > 0 && (
              <>
                <span>· Desc:</span>
                <span className="font-mono tabular-nums text-amber-700">-{formatBRL(totalDiscounts)}</span>
              </>
            )}
          </div>
        </div>

        {/* Lucro Bruto & CMV */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Lucro Bruto & Margem</span>
            <TrendingUp className="w-4 h-4 text-stone-400" />
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {formatBRL(grossProfit)}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded ${
                grossMarginPct !== null && grossMarginPct >= 40
                  ? 'text-emerald-800 bg-emerald-100/70'
                  : 'text-amber-800 bg-amber-100/70'
              }`}
            >
              {grossMarginPct !== null ? formatPercent(grossMarginPct) : 'N/A'}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-1 border-t border-stone-200/60">
            <span>CMV Apurado:</span>
            <span className="font-mono tabular-nums text-stone-700">{formatBRL(cmvTotal)}</span>
            {!isCMVComplete && (
              <span className="text-amber-800 text-[10px] font-medium" title="Existem itens sem custo completo cadastrado">
                (parcial)
              </span>
            )}
          </div>
        </div>

        {/* Despesas Operacionais */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Despesas Lançadas</span>
            <Wallet className="w-4 h-4 text-stone-400" />
          </div>
          <div className="my-1">
            <span className="text-2xl font-bold font-mono text-stone-900 tabular-nums">
              {formatBRL(totalExpenses)}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-1 border-t border-stone-200/60">
            <span>Pagas:</span>
            <span className="font-mono tabular-nums text-stone-700">{formatBRL(expensesPaid)}</span>
            {expensesPending > 0 && (
              <>
                <span>· A pagar:</span>
                <span className="font-mono tabular-nums text-red-700">{formatBRL(expensesPending)}</span>
              </>
            )}
          </div>
        </div>

        {/* Lucro Líquido Estimado */}
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-stone-500 mb-1">
            <span className="text-xs font-medium">Lucro Líquido Estimado</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="my-1 flex items-baseline justify-between">
            <span
              className={`text-2xl font-bold font-mono tabular-nums ${
                netProfit >= 0 ? 'text-stone-900' : 'text-red-700'
              }`}
            >
              {formatBRL(netProfit)}
            </span>
            <span className="text-xs font-semibold text-stone-600">
              {netMarginPct !== null ? formatPercent(netMarginPct) : 'N/A'}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 pt-1 border-t border-stone-200/60 truncate">
            <span>Fórmula: Lucro Bruto - Despesas</span>
          </div>
        </div>
      </div>

      {/* Cash Flow vs Economic View & Drawer Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cash Flow Card */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Fluxo de Caixa (Financeiro Efetivo)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Entradas e saídas reais de dinheiro no período (não confundir com lucro)
                </p>
              </div>
            </div>

            <div className="space-y-3 py-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  Entradas Efetivas Recebidas:
                </span>
                <span className="font-mono font-semibold text-emerald-800 tabular-nums">
                  +{formatBRL(inflows)}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
                  Saídas Efetivas Pagas:
                </span>
                <span className="font-mono font-semibold text-red-800 tabular-nums">
                  -{formatBRL(outflows)}
                </span>
              </div>

              <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between text-xs font-bold">
                <span className="text-stone-900">Resultado Financeiro do Período:</span>
                <span
                  className={`font-mono text-sm tabular-nums ${
                    netCashFlow >= 0 ? 'text-emerald-800' : 'text-red-700'
                  }`}
                >
                  {formatBRL(netCashFlow)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-100/70 rounded-xl flex items-center justify-between text-xs">
            <span className="text-stone-600">Saldo Atual Acumulado em Caixa:</span>
            <span className="font-mono font-bold text-stone-900 tabular-nums">
              {formatBRL(currentCashBalance)}
            </span>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
              <div>
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Produtos Mais Vendidos
                </h4>
                <p className="text-[11px] text-stone-500">Classificação por volume de saída</p>
              </div>
              <button
                onClick={() => onNavigate('sales')}
                className="text-[11px] font-semibold text-amber-800 hover:text-amber-900 flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver Vendas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-stone-400">
                Nenhuma venda registrada no período selecionado.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 py-2">
                {topProducts.map((p, index) => (
                  <div key={index} className="py-2 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-2">
                      <span className="font-semibold text-stone-900 block truncate">
                        {p.name}
                      </span>
                      <span className="text-[10px] text-stone-500 font-mono tabular-nums">
                        {p.quantity} unidades vendidas
                      </span>
                    </div>
                    <span className="font-mono font-bold text-stone-900 tabular-nums shrink-0">
                      {formatBRL(p.revenue)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[10px] text-stone-400 text-right">
            Preços congelados no momento da venda
          </p>
        </div>

        {/* Operational Gaps & Incomplete Data Warnings */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-200/70">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Alertas e Dados Pendentes
                </h4>
              </div>
              <span className="text-[10px] text-amber-900 font-semibold px-1.5 py-0.5 rounded bg-amber-100">
                Princípio 4: Sem números inventados
              </span>
            </div>

            <div className="space-y-2.5 py-3 text-xs">
              {/* Uncounted Stock Alert */}
              {uncountedStock.length > 0 && (
                <div className="p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-orange-950">
                      {uncountedStock.length} itens sem contagem inicial
                    </span>
                    <button
                      onClick={onOpenStockCount}
                      className="text-[11px] font-bold text-orange-800 underline cursor-pointer"
                    >
                      Contar agora
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Quantidades permanecem como "Não contado" até serem inventariadas.
                  </p>
                </div>
              )}

              {/* Incomplete product costs */}
              {incompleteProducts.length > 0 && (
                <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-950">
                      {incompleteProducts.length} itens com dados pendentes
                    </span>
                    <button
                      onClick={() => onNavigate('menu')}
                      className="text-[11px] font-bold text-amber-800 underline cursor-pointer"
                    >
                      Ver cardápio
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    Ex: Cheddar, Coca 2L, Dose de pinga ou bolo sem preço. O sistema não estima custos silenciosamente.
                  </p>
                </div>
              )}

              {/* Low stock warning */}
              {lowStock.length > 0 && (
                <div className="p-2.5 bg-red-50/70 border border-red-200/80 rounded-xl">
                  <span className="font-semibold text-red-950 block">
                    {lowStock.length} itens com estoque baixo/crítico
                  </span>
                  <p className="text-[11px] text-stone-600 mt-0.5">
                    {lowStock.map((s) => s.name).join(', ')}
                  </p>
                </div>
              )}

              {uncountedStock.length === 0 && incompleteProducts.length === 0 && lowStock.length === 0 && (
                <p className="text-xs text-stone-500 py-4 text-center">
                  Todos os cadastros e dados de estoque estão em dia!
                </p>
              )}
            </div>
          </div>

          {/* Deterministic Sales Estimate Box */}
          <div className="p-3 bg-stone-100/70 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between text-stone-700">
              <span className="font-semibold">Estimativa Determinística:</span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {salesEstimate.hasSufficientData && salesEstimate.estimatedDailySales !== null
                  ? formatBRL(salesEstimate.estimatedDailySales)
                  : 'Histórico insuficiente'}
              </span>
            </div>
            <p className="text-[10px] text-stone-500 leading-tight">
              {salesEstimate.methodDescription}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
