import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  PieChart,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import {
  calculateGrossSales,
  calculateTotalDiscounts,
  calculateNetSales,
  calculateTotalCMV,
  calculateGrossProfit,
  calculateGrossMarginPct,
  calculateOperatingExpenses,
  calculateNetProfit,
  calculateNetMarginPct,
  calculateCashFlow,
  calculateDeterministicSalesEstimate,
  formatBRL,
  formatPercent,
} from '../utils/deterministicMath';

export const ReportsPage: React.FC = () => {
  const { sales, transactions, stockMovements, products, recipes, activeDateFilter } = useBusiness();

  const [reportTab, setReportTab] = useState<'dre' | 'vendas_produto' | 'despesas' | 'perdas_estoque' | 'estimativas'>('dre');

  // Filtered collections based on activeDateFilter
  const filteredSales = sales.filter((s) => {
    if (activeDateFilter === 'all') return true;
    return s.date.startsWith(activeDateFilter);
  });

  const filteredTransactions = transactions.filter((t) => {
    if (activeDateFilter === 'all') return true;
    return t.date.startsWith(activeDateFilter);
  });

  const filteredMovements = stockMovements.filter((m) => {
    if (activeDateFilter === 'all') return true;
    return m.date.startsWith(activeDateFilter);
  });

  // Financial Math
  const grossSales = calculateGrossSales(filteredSales);
  const totalDiscounts = calculateTotalDiscounts(filteredSales);
  const netSales = calculateNetSales(filteredSales);
  const { cmvTotal, isComplete: isCMVComplete } = calculateTotalCMV(filteredSales);
  const grossProfit = calculateGrossProfit(netSales, cmvTotal);
  const grossMarginPct = calculateGrossMarginPct(grossProfit, netSales);

  const { totalPaid, totalPending, totalOverall, byCategory: expensesByCategory } =
    calculateOperatingExpenses(filteredTransactions);

  const netProfit = calculateNetProfit(grossProfit, totalOverall);
  const netMarginPct = calculateNetMarginPct(netProfit, netSales);

  const { inflows, outflows, netCashFlow } = calculateCashFlow(filteredTransactions);

  // Sales by Category
  const salesByCategory: Record<string, { quantity: number; revenue: number }> = {};
  filteredSales
    .filter((s) => s.status === 'concluida')
    .forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Outros';
        if (!salesByCategory[cat]) {
          salesByCategory[cat] = { quantity: 0, revenue: 0 };
        }
        salesByCategory[cat].quantity += item.quantity;
        salesByCategory[cat].revenue += item.subtotal;
      });
    });

  // Sales by Product
  const salesByProduct: Record<string, { name: string; category: string; quantity: number; revenue: number; cmv: number | null }> = {};
  filteredSales
    .filter((s) => s.status === 'concluida')
    .forEach((s) => {
      s.items.forEach((item) => {
        if (!salesByProduct[item.productId]) {
          const prod = products.find((p) => p.id === item.productId);
          salesByProduct[item.productId] = {
            name: item.productName,
            category: prod?.category || 'Outros',
            quantity: 0,
            revenue: 0,
            cmv: 0,
          };
        }
        salesByProduct[item.productId].quantity += item.quantity;
        salesByProduct[item.productId].revenue += item.subtotal;
        if (item.unitCostAtSale !== null && salesByProduct[item.productId].cmv !== null) {
          salesByProduct[item.productId].cmv! += item.unitCostAtSale * item.quantity;
        } else {
          salesByProduct[item.productId].cmv = null;
        }
      });
    });

  // Stock Losses (Perdas e Quebras)
  const lossMovements = filteredMovements.filter((m) => m.type === 'perda');
  const totalLossCost = lossMovements.reduce((acc, m) => acc + (m.totalCost || 0), 0);

  // Deterministic estimate calculation
  const estimateSaturday = calculateDeterministicSalesEstimate(sales, 6); // Sábado
  const estimateSunday = calculateDeterministicSalesEstimate(sales, 0); // Domingo
  const estimateGeneral = calculateDeterministicSalesEstimate(sales); // Todos os dias

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Relatórios, DRE e Estimativas Determinísticas</h3>
            <p className="text-[11px] text-stone-500">
              Demonstrativo financeiro por competência, separação de fluxo de caixa e médias comprováveis
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl overflow-x-auto no-scrollbar touch-scroll max-w-full text-xs font-medium">
        <button
          onClick={() => setReportTab('dre')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            reportTab === 'dre' ? 'bg-white text-stone-900 shadow-xs font-semibold' : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Demonstrativo de Resultado (DRE)
        </button>
        <button
          onClick={() => setReportTab('vendas_produto')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            reportTab === 'vendas_produto'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Vendas por Produto & Categoria
        </button>
        <button
          onClick={() => setReportTab('despesas')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            reportTab === 'despesas'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Despesas por Categoria
        </button>
        <button
          onClick={() => setReportTab('perdas_estoque')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            reportTab === 'perdas_estoque'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Perdas de Estoque ({lossMovements.length})
        </button>
        <button
          onClick={() => setReportTab('estimativas')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
            reportTab === 'estimativas'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Estimativas Determinísticas
        </button>
      </div>

      {/* TAB 1: Demonstrativo de Resultado (DRE) */}
      {reportTab === 'dre' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="border-b border-stone-200 pb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                Demonstrativo de Resultado do Exercício (DRE Simplificado)
              </h4>
              <p className="text-[11px] text-stone-500">
                Apuração econômica por competência · Princípio 5: Não confunde lucro com movimentação de caixa
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-500 block">Período de Análise:</span>
              <span className="text-xs font-mono font-bold text-stone-900">
                {activeDateFilter === 'all'
                  ? 'Histórico Integral'
                  : activeDateFilter.length === 7
                  ? `Mês ${activeDateFilter}`
                  : `Dia ${activeDateFilter.split('-').reverse().join('/')}`}
              </span>
            </div>
          </div>

          {/* DRE Waterfall Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
            <div className="p-3 bg-stone-50/80 flex justify-between items-center font-medium">
              <span className="text-stone-800">(+) Vendas Brutas</span>
              <span className="font-mono font-bold text-stone-900 tabular-nums">
                {formatBRL(grossSales)}
              </span>
            </div>

            <div className="p-3 flex justify-between items-center text-stone-600 pl-6">
              <span>(-) Descontos Concedidos</span>
              <span className="font-mono text-amber-800 tabular-nums">-{formatBRL(totalDiscounts)}</span>
            </div>

            <div className="p-3 bg-stone-100/60 flex justify-between items-center font-bold text-stone-900">
              <span>(=) Vendas Líquidas</span>
              <span className="font-mono tabular-nums">{formatBRL(netSales)}</span>
            </div>

            <div className="p-3 flex justify-between items-center text-stone-600 pl-6">
              <div className="flex items-center gap-1.5">
                <span>(-) Custo das Mercadorias Vendidas (CMV)</span>
                {!isCMVComplete && (
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-100 px-1.5 py-0.2 rounded">
                    Parcial (há itens sem custo completo)
                  </span>
                )}
              </div>
              <span className="font-mono text-stone-800 tabular-nums">-{formatBRL(cmvTotal)}</span>
            </div>

            <div className="p-3 bg-amber-50/50 flex justify-between items-center font-bold text-stone-900">
              <div className="flex items-center gap-2">
                <span>(=) Lucro Bruto Operacional</span>
                <span className="text-[11px] font-semibold text-amber-900">
                  (Margem Bruta: {grossMarginPct !== null ? formatPercent(grossMarginPct) : 'N/A'})
                </span>
              </div>
              <span className="font-mono text-amber-950 tabular-nums">{formatBRL(grossProfit)}</span>
            </div>

            <div className="p-3 flex justify-between items-center text-stone-600 pl-6">
              <span>(-) Despesas Operacionais Lançadas</span>
              <span className="font-mono text-red-800 tabular-nums">-{formatBRL(totalOverall)}</span>
            </div>

            <div className="p-3.5 bg-stone-900 text-white flex justify-between items-center font-bold text-sm">
              <div className="flex items-center gap-2">
                <span>(=) Lucro Líquido Estimado</span>
                <span className="text-xs font-normal text-stone-300">
                  (Margem Líquida: {netMarginPct !== null ? formatPercent(netMarginPct) : 'N/A'})
                </span>
              </div>
              <span className="font-mono tabular-nums">{formatBRL(netProfit)}</span>
            </div>
          </div>

          {/* DRE vs Cash Flow Differentiation Box */}
          <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2 text-xs">
            <h5 className="font-bold text-stone-900">
              Comparativo Rigoroso: Lucro Líquido (DRE) vs. Fluxo de Caixa (Financeiro)
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 font-medium block">
                  Lucro Líquido Estimado (Competência):
                </span>
                <span
                  className={`font-mono text-base font-bold tabular-nums block mt-1 ${
                    netProfit >= 0 ? 'text-stone-900' : 'text-red-700'
                  }`}
                >
                  {formatBRL(netProfit)}
                </span>
                <p className="text-[10px] text-stone-500 mt-1">
                  Mede a viabilidade econômica do negócio (Receitas líquidas menos custos e despesas totais do período).
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-stone-200">
                <span className="text-[11px] text-stone-500 font-medium block">
                  Fluxo de Caixa Efetivo (Tesouraria):
                </span>
                <span
                  className={`font-mono text-base font-bold tabular-nums block mt-1 ${
                    netCashFlow >= 0 ? 'text-emerald-800' : 'text-red-700'
                  }`}
                >
                  {formatBRL(netCashFlow)}
                </span>
                <p className="text-[10px] text-stone-500 mt-1">
                  Mede apenas o dinheiro que efetivamente entrou menos o dinheiro que efetivamente saiu da conta/caixa.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Vendas por Produto & Categoria */}
      {reportTab === 'vendas_produto' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-stone-900">Vendas por Produto e Categoria</h4>
              <p className="text-[11px] text-stone-500">Volume de saídas, receita gerada e CMV apurado</p>
            </div>
          </div>

          {/* By Category Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(salesByCategory).map(([cat, data]) => (
              <div key={cat} className="p-3.5 bg-white/80 rounded-xl border border-stone-200 text-xs">
                <span className="text-[11px] text-stone-500 font-medium block">{cat}</span>
                <span className="font-mono text-base font-bold text-stone-900 tabular-nums block mt-1">
                  {formatBRL(data.revenue)}
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  {data.quantity} unidades vendidas
                </span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-2.5 px-3">Produto</th>
                  <th className="py-2.5 px-3">Categoria</th>
                  <th className="py-2.5 px-3 text-right">Qtd Vendida</th>
                  <th className="py-2.5 px-3 text-right">Receita Líquida</th>
                  <th className="py-2.5 px-3 text-right">CMV Total</th>
                  <th className="py-2.5 px-3 text-right">Lucro Estimado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {Object.values(salesByProduct).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400">
                      Nenhuma venda registrada no período selecionado.
                    </td>
                  </tr>
                ) : (
                  Object.values(salesByProduct).map((item, idx) => {
                    const itemProfit = item.cmv !== null ? item.revenue - item.cmv : null;
                    return (
                      <tr key={idx} className="hover:bg-stone-50/50">
                        <td className="py-2.5 px-3 font-semibold text-stone-900">{item.name}</td>
                        <td className="py-2.5 px-3 text-stone-500">{item.category}</td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900 tabular-nums">
                          {formatBRL(item.revenue)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                          {item.cmv !== null ? formatBRL(item.cmv) : <span className="text-amber-800">Incompleto</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-emerald-800">
                          {itemProfit !== null ? formatBRL(itemProfit) : <span className="text-stone-400">N/A</span>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Despesas por Categoria */}
      {reportTab === 'despesas' && (
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-bold text-stone-900">Despesas Operacionais por Categoria</h4>
            <p className="text-[11px] text-stone-500">Distribuição dos custos lançados no período</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(expensesByCategory).map(([cat, amount]) => {
              const pct = totalOverall > 0 ? (amount / totalOverall) * 100 : 0;
              return (
                <div key={cat} className="p-3.5 bg-white rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-stone-900 block">{cat}</span>
                    <span className="text-[10px] text-stone-500 font-mono">
                      {pct.toFixed(1)}% do total de despesas
                    </span>
                  </div>
                  <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                    {formatBRL(amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Perdas de Estoque */}
      {reportTab === 'perdas_estoque' && (
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="border-b border-stone-200 pb-3 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-stone-900">Relatório de Perdas e Avarias de Estoque</h4>
              <p className="text-[11px] text-stone-500">
                Auditoria de quebras de mercadoria, descartes e perdas na operação
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-stone-500 block">Custo Total das Perdas:</span>
              <span className="font-mono text-base font-bold text-red-700 tabular-nums">
                {formatBRL(totalLossCost)}
              </span>
            </div>
          </div>

          {lossMovements.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Nenhuma perda registrada no período selecionado!
            </div>
          ) : (
            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 text-xs">
              {lossMovements.map((mov) => (
                <div key={mov.id} className="p-3 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-stone-900 block">{mov.itemName}</span>
                    <span className="text-[11px] text-stone-500">
                      Motivo: {mov.reason} · Data: {mov.date.slice(0, 10).split('-').reverse().join('/')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-red-700 block tabular-nums">
                      {mov.quantityDelta} {mov.unit}
                    </span>
                    <span className="font-mono text-[10px] text-stone-500">
                      Custo: {mov.totalCost !== null ? formatBRL(mov.totalCost) : 'Não informado'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Estimativas Determinísticas */}
      {reportTab === 'estimativas' && (
        <div className="glass-panel p-6 rounded-2xl space-y-5">
          <div className="border-b border-stone-200 pb-3">
            <h4 className="text-sm font-bold text-stone-900">
              Projeções e Estimativas de Vendas Determinísticas
            </h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Princípio 1 e 5: Sem inteligência artificial ou dados inventados. Projeções baseadas estritamente
              em médias comprováveis de dias equivalentes no histórico registrado no app.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Estimativa Geral Diária */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-900 block mb-1">Média Diária Geral</span>
                <span className="font-mono text-xl font-bold text-stone-900 tabular-nums block">
                  {estimateGeneral.hasSufficientData && estimateGeneral.estimatedDailySales !== null
                    ? formatBRL(estimateGeneral.estimatedDailySales)
                    : 'Histórico insuficiente'}
                </span>
                <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                  {estimateGeneral.methodDescription}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
                Fórmula: {estimateGeneral.formula}
              </div>
            </div>

            {/* Estimativa Sábados */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-900 block mb-1">Projeção para Sábados</span>
                <span className="font-mono text-xl font-bold text-amber-900 tabular-nums block">
                  {estimateSaturday.hasSufficientData && estimateSaturday.estimatedDailySales !== null
                    ? formatBRL(estimateSaturday.estimatedDailySales)
                    : 'Histórico insuficiente'}
                </span>
                <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                  {estimateSaturday.methodDescription}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
                Fórmula: {estimateSaturday.formula}
              </div>
            </div>

            {/* Estimativa Domingos */}
            <div className="p-4 bg-white rounded-xl border border-stone-200 flex flex-col justify-between">
              <div>
                <span className="font-bold text-stone-900 block mb-1">Projeção para Domingos</span>
                <span className="font-mono text-xl font-bold text-amber-900 tabular-nums block">
                  {estimateSunday.hasSufficientData && estimateSunday.estimatedDailySales !== null
                    ? formatBRL(estimateSunday.estimatedDailySales)
                    : 'Histórico insuficiente'}
                </span>
                <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
                  {estimateSunday.methodDescription}
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 text-[10px] text-stone-400 font-mono">
                Fórmula: {estimateSunday.formula}
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Como funcionam as estimativas determinísticas:</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed pl-5">
              O sistema exige no mínimo 3 dias comparáveis reais registrados no histórico de vendas para
              formar uma média. Conforme os dias de operação forem registrados no Xama Business Core,
              a precisão das projeções aumenta automaticamente, mantendo a fórmula e a amostra de dias
              sempre visíveis para conferência.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
