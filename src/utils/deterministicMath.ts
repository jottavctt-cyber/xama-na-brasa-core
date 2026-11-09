import { Sale, FinancialTransaction, DailyCashClosing } from '../types';

/**
 * Currency formatting helper for Brazilian Real (BRL)
 */
export function formatBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Não informado';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format percentages with safe check
 */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'N/A';
  }
  return `${value.toFixed(1).replace('.', ',')}%`;
}

/**
 * Format quantity with unit
 */
export function formatQuantity(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'Não contado';
  }
  // If unit is kg/g or L/ml format with up to 3 decimals, else integer/2 decimals
  const formattedNum = Number.isInteger(value)
    ? value.toString()
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 3 });
  return `${formattedNum} ${unit}`;
}

/**
 * Vendas Brutas: soma das vendas antes de descontos
 * Desconsidera vendas canceladas
 */
export function calculateGrossSales(sales: Sale[]): number {
  return sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, sale) => acc + sale.grossTotal, 0);
}

/**
 * Total de Descontos aplicados em vendas ativas
 */
export function calculateTotalDiscounts(sales: Sale[]): number {
  return sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, sale) => acc + (sale.discountTotal || 0), 0);
}

/**
 * Vendas Líquidas: vendas brutas menos descontos e cancelamentos
 */
export function calculateNetSales(sales: Sale[]): number {
  return sales
    .filter((s) => s.status === 'concluida')
    .reduce((acc, sale) => acc + sale.netTotal, 0);
}

/**
 * CMV (Custo dos Produtos Vendidos): soma dos custos conhecidos das vendas ativas.
 * Retorna também se todos os itens possuem CMV completo.
 */
export function calculateTotalCMV(sales: Sale[]): {
  cmvTotal: number;
  isComplete: boolean;
  uncalculatedItemsCount: number;
} {
  let cmvTotal = 0;
  let isComplete = true;
  let uncalculatedItemsCount = 0;

  const activeSales = sales.filter((s) => s.status === 'concluida');

  for (const sale of activeSales) {
    if (sale.calculatedCMV !== null) {
      cmvTotal += sale.calculatedCMV;
    }
    if (!sale.isCMVComplete) {
      isComplete = false;
      uncalculatedItemsCount++;
    }
  }

  return { cmvTotal, isComplete, uncalculatedItemsCount };
}

/**
 * Lucro Bruto: Vendas Líquidas - CMV
 */
export function calculateGrossProfit(netSales: number, cmv: number): number {
  return netSales - cmv;
}

/**
 * Margem Bruta (%): Lucro Bruto / Vendas Líquidas * 100
 * Retorna null se não houver vendas líquidas no período
 */
export function calculateGrossMarginPct(grossProfit: number, netSales: number): number | null {
  if (netSales <= 0) {
    return null;
  }
  return (grossProfit / netSales) * 100;
}

/**
 * Despesas Operacionais: soma das despesas operacionais registradas no período
 * (Aluguel, Energia, Gás, Carvão, Manutenção, etc.)
 */
export function calculateOperatingExpenses(transactions: FinancialTransaction[]): {
  totalPaid: number;
  totalPending: number;
  totalOverall: number;
  byCategory: Record<string, number>;
} {
  const expenses = transactions.filter((t) => t.type === 'despesa');
  let totalPaid = 0;
  let totalPending = 0;
  const byCategory: Record<string, number> = {};

  for (const exp of expenses) {
    if (exp.status === 'pago') {
      totalPaid += exp.amount;
    } else {
      totalPending += exp.amount;
    }

    byCategory[exp.category] = (byCategory[exp.category] || 0) + exp.amount;
  }

  return {
    totalPaid,
    totalPending,
    totalOverall: totalPaid + totalPending,
    byCategory,
  };
}

/**
 * Lucro Líquido Estimado: Lucro Bruto - Despesas Operacionais registradas
 */
export function calculateNetProfit(grossProfit: number, operationalExpenses: number): number {
  return grossProfit - operationalExpenses;
}

/**
 * Margem Líquida (%): Lucro Líquido / Vendas Líquidas * 100
 * Retorna null se não houver vendas
 */
export function calculateNetMarginPct(netProfit: number, netSales: number): number | null {
  if (netSales <= 0) {
    return null;
  }
  return (netProfit / netSales) * 100;
}

/**
 * Fluxo de Caixa: Entradas efetivas (receitas pagas) - Saídas efetivas (despesas pagas)
 * Não é lucro! Representa a movimentação de tesouraria.
 */
export function calculateCashFlow(transactions: FinancialTransaction[]): {
  inflows: number;
  outflows: number;
  netCashFlow: number;
} {
  let inflows = 0;
  let outflows = 0;

  for (const t of transactions) {
    if (t.status === 'pago') {
      if (t.type === 'receita') {
        inflows += t.amount;
      } else if (t.type === 'despesa') {
        outflows += t.amount;
      }
    }
  }

  return {
    inflows,
    outflows,
    netCashFlow: inflows - outflows,
  };
}

/**
 * Saldo de Caixa Atual:
 * Saldo inicial + todas as entradas pagas - todas as saídas pagas
 */
export function calculateCurrentCashBalance(
  initialBalance: number,
  transactions: FinancialTransaction[]
): number {
  const { netCashFlow } = calculateCashFlow(transactions);
  return initialBalance + netCashFlow;
}

/**
 * Fechamento de Caixa Diário:
 * Saldo esperado em gaveta física = abertura em dinheiro + vendas em dinheiro + receitas em dinheiro - despesas pagas em dinheiro
 */
export function calculateExpectedDrawerCash(
  openingCash: number,
  sales: Sale[],
  transactions: FinancialTransaction[],
  dateStr: string // YYYY-MM-DD
): {
  openingCash: number;
  salesInCash: number;
  expensesInCash: number;
  expectedInDrawer: number;
  totalsByMethod: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    outro: number;
  };
} {
  // Filter active sales for this date
  const daySales = sales.filter(
    (s) => s.status === 'concluida' && s.date.startsWith(dateStr)
  );

  const totalsByMethod = {
    dinheiro: 0,
    pix: 0,
    debito: 0,
    credito: 0,
    outro: 0,
  };

  for (const sale of daySales) {
    if (sale.paymentMethod in totalsByMethod) {
      totalsByMethod[sale.paymentMethod] += sale.netTotal;
    } else {
      totalsByMethod.outro += sale.netTotal;
    }
  }

  // Expenses paid specifically in cash on this day
  const dayCashExpenses = transactions
    .filter(
      (t) =>
        t.type === 'despesa' &&
        t.status === 'pago' &&
        t.paymentMethod === 'dinheiro' &&
        t.date.startsWith(dateStr)
    )
    .reduce((acc, t) => acc + t.amount, 0);

  const expectedInDrawer = openingCash + totalsByMethod.dinheiro - dayCashExpenses;

  return {
    openingCash,
    salesInCash: totalsByMethod.dinheiro,
    expensesInCash: dayCashExpenses,
    expectedInDrawer,
    totalsByMethod,
  };
}

/**
 * Estimativa Determinística de Vendas:
 * Calcula a média simples de vendas de dias equivalentes (ex.: média de sábados passados)
 * Ou média diária dos últimos N dias operados.
 * Retorna fórmula explicada e amostra.
 */
export interface DeterministicEstimateResult {
  hasSufficientData: boolean;
  estimatedDailySales: number | null;
  methodDescription: string;
  formula: string;
  daysAnalyzedCount: number;
  daysSampleDates: string[];
}

export function calculateDeterministicSalesEstimate(
  sales: Sale[],
  targetDayOfWeek?: number // 0 = Domingo, 6 = Sábado
): DeterministicEstimateResult {
  const activeSales = sales.filter((s) => s.status === 'concluida');

  // Group sales by day (YYYY-MM-DD)
  const salesByDate: Record<string, number> = {};
  for (const sale of activeSales) {
    const dayKey = sale.date.slice(0, 10);
    salesByDate[dayKey] = (salesByDate[dayKey] || 0) + sale.netTotal;
  }

  let relevantDays = Object.entries(salesByDate);

  if (targetDayOfWeek !== undefined) {
    relevantDays = relevantDays.filter(([dateStr]) => {
      // parse YYYY-MM-DD
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayIndex = new Date(y, m - 1, d).getDay();
      return dayIndex === targetDayOfWeek;
    });
  }

  // Need at least 3 comparable days to establish a reliable deterministic average
  if (relevantDays.length < 3) {
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const targetName = targetDayOfWeek !== undefined ? dayNames[targetDayOfWeek] : 'dias de operação';
    return {
      hasSufficientData: false,
      estimatedDailySales: null,
      methodDescription: `Histórico insuficiente para estimativa confiável de ${targetName}.`,
      formula: 'Média aritmética dos dias operados comparáveis (requer mínimo de 3 dias registrados).',
      daysAnalyzedCount: relevantDays.length,
      daysSampleDates: relevantDays.map(([date]) => date),
    };
  }

  const totalSum = relevantDays.reduce((acc, [, total]) => acc + total, 0);
  const average = totalSum / relevantDays.length;

  return {
    hasSufficientData: true,
    estimatedDailySales: average,
    methodDescription: `Média aritmética calculada sobre ${relevantDays.length} dias comparáveis registrados.`,
    formula: `Soma das vendas líquidas (${formatBRL(totalSum)}) ÷ Quantidade de dias (${relevantDays.length})`,
    daysAnalyzedCount: relevantDays.length,
    daysSampleDates: relevantDays.map(([date]) => date),
  };
}
