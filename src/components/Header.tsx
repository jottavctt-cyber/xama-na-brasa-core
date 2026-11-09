import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  Wallet,
  ShoppingCart,
  ClipboardCheck,
  ArrowLeftRight,
  Menu,
  Sparkles,
  ChevronDown,
  X,
  Flame,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

interface HeaderProps {
  pageTitle: string;
  onOpenNewExpense: () => void;
  onOpenNewPurchase: () => void;
  onOpenStockCount: () => void;
  onOpenCashClosing: () => void;
  onOpenE2ETest: () => void;
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  onOpenNewExpense,
  onOpenNewPurchase,
  onOpenStockCount,
  onOpenCashClosing,
  onOpenE2ETest,
  onToggleMobileMenu,
}) => {
  const { activeDateFilter, setActiveDateFilter, settings } = useBusiness();
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const isToday = activeDateFilter === todayStr;
  const isYesterday = activeDateFilter === yesterday;
  const isMonth = activeDateFilter.length === 7 && activeDateFilter === currentMonthStr;
  const isAll = activeDateFilter === 'all';

  // Close mobile actions menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setMobileActionsOpen(false);
      }
    };
    if (mobileActionsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [mobileActionsOpen]);

  return (
    <header className="glass-header sticky top-0 z-20 px-3.5 sm:px-6 py-2.5 sm:py-3.5 transition-all">
      {/* Desktop Layout (3-Zone Contract) */}
      <div className="hidden md:flex items-center justify-between gap-6">
        {/* Zone 1: Breadcrumb & Title */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs text-stone-500 font-medium whitespace-nowrap">
            {settings.businessName || 'Xamã na Brasa'}
          </span>
          <span className="text-stone-300 text-xs">/</span>
          <h2 className="text-sm font-semibold text-stone-900 tracking-tight truncate">
            {pageTitle}
          </h2>
        </div>

        {/* Zone 2: Date Selector segmented buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-stone-200/60 rounded-lg">
          <button
            onClick={() => setActiveDateFilter(todayStr)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              isToday
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Hoje
          </button>
          <button
            onClick={() => setActiveDateFilter(yesterday)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              isYesterday
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Ontem
          </button>
          <button
            onClick={() => setActiveDateFilter(currentMonthStr)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              isMonth
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Este Mês
          </button>
          <button
            onClick={() => setActiveDateFilter('all')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
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
      </div>

      {/* Mobile Layout (< 768px) */}
      <div className="flex md:hidden flex-col gap-2">
        {/* Top bar row with Hamburger, Brand title, and Quick Actions trigger */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Hamburger Button */}
            <button
              onClick={onToggleMobileMenu}
              aria-label="Abrir Menu Principal"
              className="min-h-[40px] min-w-[40px] p-2 text-stone-700 hover:text-stone-900 hover:bg-stone-200/60 rounded-xl transition-colors cursor-pointer flex items-center justify-center -ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Small Brand Logo & Page Title */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                  Xamã na Brasa
                </span>
                <span className="text-stone-300 text-xs">·</span>
                <span className="text-xs font-semibold text-stone-900 truncate">
                  {pageTitle}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Menu Trigger for Mobile */}
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setMobileActionsOpen((prev) => !prev)}
              aria-expanded={mobileActionsOpen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-stone-800 bg-white hover:bg-stone-50 border border-stone-200/90 rounded-lg shadow-2xs transition-colors cursor-pointer shrink-0"
            >
              <span>+ Ações</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-stone-500 transition-transform ${
                  mobileActionsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Mobile Actions Dropdown Sheet */}
            {mobileActionsOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-white/98 backdrop-blur-xl border border-stone-200/90 rounded-xl shadow-xl z-50 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    setMobileActionsOpen(false);
                    onOpenNewExpense();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Wallet className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">Lançar Despesa</span>
                </button>

                <button
                  onClick={() => {
                    setMobileActionsOpen(false);
                    onOpenNewPurchase();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <ShoppingCart className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">Registrar Compra</span>
                </button>

                <button
                  onClick={() => {
                    setMobileActionsOpen(false);
                    onOpenStockCount();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <ClipboardCheck className="w-4 h-4 text-stone-500" />
                  <span className="font-medium">Contagem de Estoque</span>
                </button>

                <button
                  onClick={() => {
                    setMobileActionsOpen(false);
                    onOpenCashClosing();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-amber-900 bg-amber-50 hover:bg-amber-100/80 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <ArrowLeftRight className="w-4 h-4 text-amber-700" />
                  <span className="font-semibold">Fechamento de Caixa</span>
                </button>

                <div className="border-t border-stone-100 my-1 pt-1">
                  <button
                    onClick={() => {
                      setMobileActionsOpen(false);
                      onOpenE2ETest();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-emerald-950 bg-emerald-50 hover:bg-emerald-100/80 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="font-semibold">Auditoria E2E (100%)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Horizontal Date Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-scroll py-0.5 max-w-full">
          <div className="flex items-center gap-1 p-0.5 bg-stone-200/60 rounded-lg shrink-0">
            <button
              onClick={() => setActiveDateFilter(todayStr)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isToday
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setActiveDateFilter(yesterday)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isYesterday
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Ontem
            </button>
            <button
              onClick={() => setActiveDateFilter(currentMonthStr)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isMonth
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Este Mês
            </button>
            <button
              onClick={() => setActiveDateFilter('all')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                isAll
                  ? 'bg-white text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Tudo
            </button>
          </div>

          <div className="flex items-center shrink-0 bg-white/70 border border-stone-200/80 rounded-lg px-2 py-0.5">
            <input
              type="date"
              value={activeDateFilter !== 'all' && activeDateFilter.length === 10 ? activeDateFilter : ''}
              onChange={(e) => {
                if (e.target.value) setActiveDateFilter(e.target.value);
              }}
              className="text-[11px] font-mono text-stone-700 bg-transparent py-0.5 focus:outline-none cursor-pointer"
              title="Escolher data específica"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
