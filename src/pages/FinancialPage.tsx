import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Plus,
  ArrowLeftRight,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { FinancialCategory, FinancialTransaction, PaymentMethod } from '../types';
import { formatBRL } from '../utils/deterministicMath';

interface FinancialPageProps {
  onOpenNewExpense: () => void;
  onOpenCashClosing: () => void;
}

export const FinancialPage: React.FC<FinancialPageProps> = ({
  onOpenNewExpense,
  onOpenCashClosing,
}) => {
  const {
    transactions,
    cashClosings,
    settings,
    updateTransactionStatus,
    addTransaction,
    activeDateFilter,
  } = useBusiness();

  const [activeTab, setActiveTab] = useState<'transacoes' | 'contas_a_pagar' | 'fechamentos' | 'recorrentes'>('transacoes');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pago' | 'pendente'>('all');

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    if (activeDateFilter !== 'all' && !t.date.startsWith(activeDateFilter)) {
      return false;
    }
    if (categoryFilter !== 'all' && t.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && t.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const pendingBills = transactions.filter((t) => t.type === 'despesa' && t.status === 'pendente');
  const totalPendingBillsAmount = pendingBills.reduce((acc, t) => acc + t.amount, 0);

  const totalPaidExpenses = filteredTransactions
    .filter((t) => t.type === 'despesa' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalRevenues = filteredTransactions
    .filter((t) => t.type === 'receita' && t.status === 'pago')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashPeriod = totalRevenues - totalPaidExpenses;

  // Launch monthly recurring batch
  const handleLaunchRecurringExpense = (
    category: FinancialCategory,
    description: string,
    amount: number
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    addTransaction({
      date: today,
      dueDate: today,
      type: 'despesa',
      category,
      description,
      amount,
      paymentMethod: 'pix',
      status: 'pendente',
      referenceType: 'fixa',
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Gestão Financeira e Fluxo de Caixa</h3>
            <p className="text-[11px] text-stone-500">
              Controle de contas a pagar, despesas fixas da brasa, receitas e fechamento diário
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewExpense}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Lançar Despesa</span>
          </button>
          <button
            onClick={onOpenCashClosing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200/80 border border-amber-300 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-amber-700" />
            <span>Fechamento Caixa</span>
          </button>
        </div>
      </div>

      {/* KPI Financial Overview Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-stone-500 font-medium block">Entradas Efetivas</span>
          <span className="text-xl font-bold font-mono text-emerald-800 tabular-nums block mt-1">
            +{formatBRL(totalRevenues)}
          </span>
          <span className="text-[10px] text-stone-400">Vendas recebidas no período</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-stone-500 font-medium block">Despesas Pagas</span>
          <span className="text-xl font-bold font-mono text-red-800 tabular-nums block mt-1">
            -{formatBRL(totalPaidExpenses)}
          </span>
          <span className="text-[10px] text-stone-400">Saídas liquidadas no período</span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-stone-500 font-medium block">Contas Pendentes (A Pagar)</span>
          <span className="text-xl font-bold font-mono text-amber-900 tabular-nums block mt-1">
            {formatBRL(totalPendingBillsAmount)}
          </span>
          <span className="text-[10px] text-amber-800 font-medium">
            {pendingBills.length} despesa(s) aguardando pagamento
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <span className="text-xs text-stone-500 font-medium block">Resultado Efetivo (Caixa)</span>
          <span
            className={`text-xl font-bold font-mono tabular-nums block mt-1 ${
              netCashPeriod >= 0 ? 'text-stone-900' : 'text-red-700'
            }`}
          >
            {formatBRL(netCashPeriod)}
          </span>
          <span className="text-[10px] text-stone-400">Entradas menos saídas pagas</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 p-1 bg-stone-200/60 rounded-xl w-fit text-xs font-medium">
        <button
          onClick={() => setActiveTab('transacoes')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'transacoes'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Extrato Completo ({filteredTransactions.length})
        </button>
        <button
          onClick={() => setActiveTab('contas_a_pagar')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'contas_a_pagar'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <span>Contas a Pagar</span>
          {pendingBills.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
              {pendingBills.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recorrentes')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'recorrentes'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Despesas Recorrentes da Brasa
        </button>
        <button
          onClick={() => setActiveTab('fechamentos')}
          className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'fechamentos'
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Fechamentos de Caixa ({cashClosings.length})
        </button>
      </div>

      {/* TAB 1: Extrato Completo */}
      {activeTab === 'transacoes' && (
        <div className="glass-panel rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-3.5 border-b border-stone-200/70 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-medium">Filtrar por Categoria:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="glass-input px-2.5 py-1 rounded text-stone-800"
              >
                <option value="all">Todas as categorias</option>
                <option value="Venda">Vendas</option>
                <option value="Aluguel">Aluguel</option>
                <option value="Energia">Energia</option>
                <option value="Gás">Gás</option>
                <option value="Carvão">Carvão</option>
                <option value="Compra de ingredientes">Ingredientes</option>
                <option value="Compra de bebidas">Bebidas</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  statusFilter === 'all' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('pago')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  statusFilter === 'pago' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Pagos
              </button>
              <button
                onClick={() => setStatusFilter('pendente')}
                className={`px-2.5 py-1 rounded text-xs font-medium cursor-pointer ${
                  statusFilter === 'pendente'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Pendentes
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-stone-100/70 border-b border-stone-200 text-stone-600 font-semibold">
                  <th className="py-2.5 px-4">Data</th>
                  <th className="py-2.5 px-4">Descrição</th>
                  <th className="py-2.5 px-4">Categoria</th>
                  <th className="py-2.5 px-4">Forma Pagto</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Valor</th>
                  <th className="py-2.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-stone-400">
                      Nenhum lançamento financeiro encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => {
                    const isRevenue = tx.type === 'receita';
                    const isPaid = tx.status === 'pago';

                    return (
                      <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-stone-600 whitespace-nowrap">
                          {tx.date.split('-').reverse().join('/')}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-stone-900">
                          {tx.description}
                          {tx.dueDate && !isPaid && (
                            <span className="block text-[10px] text-amber-800">
                              Vencimento: {tx.dueDate.split('-').reverse().join('/')}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-stone-600">{tx.category}</td>
                        <td className="py-2.5 px-4 capitalize text-stone-700">{tx.paymentMethod}</td>
                        <td className="py-2.5 px-4 text-center">
                          {isPaid ? (
                            <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                              Pago
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                              Pendente
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={isRevenue ? 'text-emerald-800' : 'text-stone-900'}>
                            {isRevenue ? `+${formatBRL(tx.amount)}` : `-${formatBRL(tx.amount)}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {!isPaid ? (
                            <button
                              onClick={() => updateTransactionStatus(tx.id, 'pago')}
                              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                            >
                              Marcar Pago
                            </button>
                          ) : (
                            <button
                              onClick={() => updateTransactionStatus(tx.id, 'pendente')}
                              className="text-[11px] text-stone-400 hover:text-stone-700 underline cursor-pointer"
                            >
                              Desmarcar
                            </button>
                          )}
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

      {/* TAB 2: Contas a Pagar */}
      {activeTab === 'contas_a_pagar' && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h4 className="text-sm font-bold text-stone-900">Contas e Despesas Pendentes de Pagamento</h4>
              <p className="text-[11px] text-stone-500">
                Compromissos lançados que ainda não tiveram saída de caixa
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500 block">Total a Pagar:</span>
              <span className="font-mono text-base font-bold text-amber-900 tabular-nums">
                {formatBRL(totalPendingBillsAmount)}
              </span>
            </div>
          </div>

          {pendingBills.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Nenhuma conta a pagar pendente no momento!
            </div>
          ) : (
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white/70">
              {pendingBills.map((bill) => (
                <div key={bill.id} className="p-3.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-stone-900 block">{bill.description}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                      <span>Categoria: {bill.category}</span>
                      <span>·</span>
                      <span className="text-amber-800 font-medium">
                        Vencimento: {bill.dueDate ? bill.dueDate.split('-').reverse().join('/') : 'Não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                      {formatBRL(bill.amount)}
                    </span>
                    <button
                      onClick={() => updateTransactionStatus(bill.id, 'pago')}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
                    >
                      Confirmar Pagamento
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Despesas Recorrentes da Brasa */}
      {activeTab === 'recorrentes' && (
        <div className="glass-panel p-5 rounded-2xl space-y-5">
          <div>
            <h4 className="text-sm font-bold text-stone-900">
              Despesas Operacionais Recorrentes do Xamã na Brasa
            </h4>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Base da Seção 7 da especificação: Custos mensais estruturais estimados com base em 30 dias
              de operação e 1 saco de carvão/dia.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Aluguel */}
            <div className="p-4 bg-white/80 border border-stone-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-stone-900">Aluguel do Ponto</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">R$ 300,00 / mês</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Despesa fixa mensal de locação do espaço comercial.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() => handleLaunchRecurringExpense('Aluguel', 'Aluguel comercial mensal', 300)}
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium text-[11px] cursor-pointer"
                >
                  Lançar para este mês
                </button>
              </div>
            </div>

            {/* Energia */}
            <div className="p-4 bg-white/80 border border-stone-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-stone-900">Energia Elétrica</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">~R$ 150,00 / mês</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Valor médio estimado de consumo dos freezers e iluminação.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() =>
                    handleLaunchRecurringExpense('Energia', 'Conta de energia elétrica comercial', 150)
                  }
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium text-[11px] cursor-pointer"
                >
                  Lançar para este mês
                </button>
              </div>
            </div>

            {/* Gás */}
            <div className="p-4 bg-white/80 border border-stone-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-stone-900">Botijão de Gás P13</span>
                  <span className="font-mono font-bold text-stone-900 text-sm">R$ 135,00 / ciclo</span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Ciclo de troca a cada 30 dias para preparo de porções, frituras e cozimento.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() =>
                    handleLaunchRecurringExpense('Gás', 'Botijão de gás P13 (30 dias)', 135)
                  }
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium text-[11px] cursor-pointer"
                >
                  Lançar troca de gás
                </button>
              </div>
            </div>

            {/* Carvão */}
            <div className="p-4 bg-white/80 border border-stone-200 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-stone-900">Carvão Vegetal (Grelha)</span>
                  <span className="font-mono font-bold text-amber-900 text-sm">
                    R$ 10,80 / saco · R$ 324,00 / mês
                  </span>
                </div>
                <p className="text-[11px] text-stone-500">
                  Pacote com 5 sacos custa R$ 54,00. Média de 1 saco por dia operado. Varia conforme dias
                  efetivamente trabalhados no mês.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-stone-100 flex justify-end">
                <button
                  onClick={() =>
                    handleLaunchRecurringExpense('Carvão', 'Compra de pacote com 5 sacos de carvão', 54)
                  }
                  className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-md font-medium text-[11px] cursor-pointer"
                >
                  Lançar pacote de carvão (R$ 54)
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
            <div className="flex justify-between font-bold text-amber-950">
              <span>Total Estimado de Despesas Operacionais:</span>
              <span className="font-mono text-sm">~R$ 909,00 / mês</span>
            </div>
            <p className="text-[11px] text-stone-600">
              Cálculo: R$ 300 (Aluguel) + R$ 150 (Energia) + R$ 135 (Gás) + R$ 324 (30 sacos de carvão a R$ 10,80).
              O total real sempre dependerá dos dias efetivamente abertos e do consumo real apurado.
            </p>
          </div>
        </div>
      )}

      {/* TAB 4: Fechamentos de Caixa */}
      {activeTab === 'fechamentos' && (
        <div className="glass-panel p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-200">
            <div>
              <h4 className="text-sm font-bold text-stone-900">Histórico de Fechamentos de Caixa</h4>
              <p className="text-[11px] text-stone-500">
                Auditoria de conferência física da gaveta de dinheiro e divergências
              </p>
            </div>
            <button
              onClick={onOpenCashClosing}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg cursor-pointer"
            >
              + Novo Fechamento
            </button>
          </div>

          {cashClosings.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400">
              Nenhum fechamento diário realizado ainda. Clique no botão acima para realizar a conferência de hoje.
            </div>
          ) : (
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-xl overflow-hidden bg-white/70">
              {cashClosings.map((c) => (
                <div key={c.id} className="p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-900 text-sm">
                        Fechamento de {c.date.split('-').reverse().join('/')}
                      </span>
                      <span className="text-[11px] text-stone-500 ml-2">
                        Realizado às {new Date(c.closedAt).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        c.difference === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.difference > 0
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {c.difference === 0
                        ? 'Sem divergência'
                        : c.difference > 0
                        ? `Sobra: +${formatBRL(c.difference)}`
                        : `Quebra / Falta: ${formatBRL(c.difference)}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    <div className="p-2 bg-stone-50 rounded">
                      <span className="text-stone-400 block text-[10px]">Abertura Gaveta</span>
                      <span className="text-stone-800 font-bold">{formatBRL(c.openingCash)}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded">
                      <span className="text-stone-400 block text-[10px]">Esperado Gaveta</span>
                      <span className="text-stone-800 font-bold">{formatBRL(c.expectedCashInDrawer)}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded">
                      <span className="text-stone-400 block text-[10px]">Contado Fisicamente</span>
                      <span className="text-stone-900 font-bold">{formatBRL(c.countedCashInDrawer)}</span>
                    </div>
                    <div className="p-2 bg-stone-50 rounded">
                      <span className="text-stone-400 block text-[10px]">Vendas Totais do Dia</span>
                      <span className="text-stone-900 font-bold">{formatBRL(c.totalGrossSales)}</span>
                    </div>
                  </div>

                  {c.differenceReason && (
                    <p className="text-[11px] text-stone-600 bg-stone-50 p-2 rounded">
                      <strong>Justificativa da divergência:</strong> {c.differenceReason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
