import React from 'react';
import { Calendar, Plus, Wallet, ShoppingCart, ClipboardCheck, ArrowLeftRight } from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface HeaderProps {
  pageTitle: string;
  onOpenNewExpense: () => void;
  onOpenNewPurchase: () => void;
  onOpenStockCount: () => void;
  onOpenCashClosing: () => void;
  onOpenE2ETest: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onOpenNewExpense,
  onOpenNewPurchase,
  onOpenStockCount,
  onOpenCashClosing,
  onOpenE2ETest,
}) => {
  const { activeDateFilter, setActiveDateFilter } = useBusiness();

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const isToday = activeDateFilter === todayStr;
  const isYesterday = activeDateFilter === yesterday;
  const isMonth = activeDateFilter.length === 7 && activeDateFilter === currentMonthStr;
  const isAll = activeDateFilter === 'all';

  return (
    <header className="glass-header sticky top-0 z-20 px-6 py-3.5 flex items-center justify-between gap-6">
      {/* Zone 1: Breadcrumb & Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-stone-500 font-medium">Xamã na Brasa</span>
        <span className="text-stone-300 text-xs">/</span>
        <h2 className="text-sm font-semibold text-stone-900 tracking-tight">{pageTitle}</h2>
      </div>

      {/* Zone 2: Date Selector segmented buttons */}
      <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-lg">
        <button
          onClick={() => setActiveDateFilter(todayStr)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            isToday
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Hoje
        </button>
        <button
          onClick={() => setActiveDateFilter(yesterday)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            isYesterday
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Ontem
        </button>
        <button
          onClick={() => setActiveDateFilter(currentMonthStr)}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            isMonth
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Este Mês
        </button>
        <button
          onClick={() => setActiveDateFilter('all')}
          className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
            isAll
              ? 'bg-white text-stone-900 shadow-xs font-semibold'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Tudo
        </button>

        {/* Date input for custom day */}
        <div className="flex items-center gap-1 pl-1 border-l border-stone-300/80">
          <input
            type="date"
            value={activeDateFilter !== 'all' && activeDateFilter.length === 10 ? activeDateFilter : ''}
            onChange={(e) => {
              if (e.target.value) setActiveDateFilter(e.target.value);
            }}
            className="text-[11px] font-mono text-stone-700 bg-transparent px-1.5 py-0.5 rounded border border-transparent hover:border-stone-300 focus:outline-none focus:border-amber-600 cursor-pointer"
            title="Escolher data específica"
          />
        </div>
      </div>

      {/* Zone 3: Fast Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenNewExpense}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Wallet className="w-3.5 h-3.5 text-stone-500" />
          <span>Lançar Despesa</span>
        </button>

        <button
          onClick={onOpenNewPurchase}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <ShoppingCart className="w-3.5 h-3.5 text-stone-500" />
          <span>Registrar Compra</span>
        </button>

        <button
          onClick={onOpenStockCount}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-stone-500" />
          <span>Contagem</span>
        </button>

        <button
          onClick={onOpenCashClosing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-amber-700" />
          <span>Fechamento Caixa</span>
        </button>

        <button
          onClick={onOpenE2ETest}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-950 bg-emerald-50/90 hover:bg-emerald-100/90 border border-emerald-300/80 rounded-lg transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          title="Executar verificação de precisão e testes end-to-end de todos os movimentos"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span>Auditoria E2E</span>
        </button>
      </div>
    </header>
  );
};
