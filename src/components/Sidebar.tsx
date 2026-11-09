import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Boxes,
  UtensilsCrossed,
  Truck,
  BarChart3,
  Settings,
  Flame,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';

export type PageId =
  | 'overview'
  | 'sales'
  | 'financial'
  | 'stock'
  | 'menu'
  | 'purchases'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentPage: PageId;
  onSelectPage: (page: PageId) => void;
  onOpenNewSale: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  onOpenNewSale,
}) => {
  const { stockItems, transactions, settings } = useBusiness();
  const [logoError, setLogoError] = React.useState(false);

  const logoSrc = settings.customLogoUrl || '/logo/logo.png';

  // Metrics for badges
  const uncountedCount = stockItems.filter((s) => !s.isCounted || s.currentQuantity === null).length;
  const pendingBillsCount = transactions.filter((t) => t.type === 'despesa' && t.status === 'pendente').length;

  const navItems = [
    {
      id: 'overview' as PageId,
      label: 'Visão Geral',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'sales' as PageId,
      label: 'Vendas',
      icon: Receipt,
      badge: null,
    },
    {
      id: 'financial' as PageId,
      label: 'Financeiro',
      icon: Wallet,
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} pendente` : null,
      badgeColor: 'text-amber-800 bg-amber-100/80',
    },
    {
      id: 'stock' as PageId,
      label: 'Estoque',
      icon: Boxes,
      badge: uncountedCount > 0 ? `${uncountedCount} s/ contagem` : null,
      badgeColor: 'text-orange-800 bg-orange-100/80',
    },
    {
      id: 'menu' as PageId,
      label: 'Cardápio e Custos',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      id: 'purchases' as PageId,
      label: 'Compras',
      icon: Truck,
      badge: null,
    },
    {
      id: 'reports' as PageId,
      label: 'Relatórios',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'settings' as PageId,
      label: 'Configurações e Backup',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 flex flex-col justify-between border-r border-stone-200/80 bg-white/70 backdrop-blur-md h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="px-5 py-4 border-b border-stone-200/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-950 border border-stone-200/80 shadow-xs flex items-center justify-center shrink-0">
              {!logoError ? (
                <img
                  src={logoSrc}
                  alt="Xamã na Brasa Logo"
                  className="w-full h-full object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white">
                  <Flame className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-stone-900 tracking-tight leading-tight truncate">
                {settings.businessName || 'Xamã na Brasa'}
              </h1>
              <p className="text-[10px] font-semibold text-amber-800 tracking-wider uppercase">
                Business Core
              </p>
            </div>
          </div>
        </div>

        {/* Primary Quick CTA */}
        <div className="p-3">
          <button
            onClick={onOpenNewSale}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Registrar Venda</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="px-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer text-left ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-900 font-semibold'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100/70'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-amber-700' : 'text-stone-400'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                      item.badgeColor || 'text-stone-600 bg-stone-100'
                    } whitespace-nowrap`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info & Local Offline Status */}
      <div className="p-4 border-t border-stone-200/70 bg-stone-50/50">
        <div className="flex items-center gap-2 text-[11px] text-stone-500 mb-1">
          <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium text-stone-700">Operação Local-First</span>
        </div>
        <p className="text-[10px] text-stone-500 leading-relaxed">
          Sem dependência de internet ou IA. Cálculos matemáticos determinísticos.
        </p>
      </div>
    </aside>
  );
};
