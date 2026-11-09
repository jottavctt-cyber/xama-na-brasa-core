/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Boxes,
  Menu as MenuIcon,
  Plus,
} from 'lucide-react';
import { BusinessProvider } from './context/BusinessContext';
import { Sidebar, PageId } from './components/Sidebar';
import { Header } from './components/Header';

import { OverviewPage } from './pages/OverviewPage';
import { SalesPage } from './pages/SalesPage';
import { FinancialPage } from './pages/FinancialPage';
import { StockPage } from './pages/StockPage';
import { MenuAndCostsPage } from './pages/MenuAndCostsPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

import { NewSaleModal } from './components/modals/NewSaleModal';
import { NewExpenseModal } from './components/modals/NewExpenseModal';
import { NewPurchaseModal } from './components/modals/NewPurchaseModal';
import { StockCountModal } from './components/modals/StockCountModal';
import { CashClosingModal } from './components/modals/CashClosingModal';
import { E2ETestModal } from './components/modals/E2ETestModal';

const PAGE_TITLES: Record<PageId, string> = {
  overview: 'Visão Geral',
  sales: 'Vendas e Fechamento',
  financial: 'Financeiro e Fluxo de Caixa',
  stock: 'Estoque e Insumos',
  menu: 'Cardápio e Custos',
  purchases: 'Compras e Fornecedores',
  reports: 'Relatórios e Estimativas',
  settings: 'Configurações e Backup',
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState<PageId>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Global modals
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isStockCountModalOpen, setIsStockCountModalOpen] = useState(false);
  const [isCashClosingModalOpen, setIsCashClosingModalOpen] = useState(false);
  const [isE2ETestModalOpen, setIsE2ETestModalOpen] = useState(false);

  const renderActivePage = () => {
    switch (currentPage) {
      case 'overview':
        return (
          <OverviewPage
            onNavigate={(page) => setCurrentPage(page)}
            onOpenNewSale={() => setIsSaleModalOpen(true)}
            onOpenStockCount={() => setIsStockCountModalOpen(true)}
          />
        );
      case 'sales':
        return <SalesPage onOpenNewSale={() => setIsSaleModalOpen(true)} />;
      case 'financial':
        return (
          <FinancialPage
            onOpenNewExpense={() => setIsExpenseModalOpen(true)}
            onOpenCashClosing={() => setIsCashClosingModalOpen(true)}
          />
        );
      case 'stock':
        return (
          <StockPage onOpenStockCount={() => setIsStockCountModalOpen(true)} />
        );
      case 'menu':
        return <MenuAndCostsPage />;
      case 'purchases':
        return (
          <PurchasesPage onOpenNewPurchase={() => setIsPurchaseModalOpen(true)} />
        );
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage onOpenE2ETest={() => setIsE2ETestModalOpen(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FAF9F5] text-stone-900">
      {/* Responsive Sidebar (Fixed on Desktop, Slide-over Drawer on Mobile) */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => {
          setCurrentPage(page);
          setIsMobileMenuOpen(false);
        }}
        onOpenNewSale={() => {
          setIsSaleModalOpen(true);
          setIsMobileMenuOpen(false);
        }}
        mobileOpen={isMobileMenuOpen}
        onMobileClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          pageTitle={PAGE_TITLES[currentPage]}
          onOpenNewExpense={() => setIsExpenseModalOpen(true)}
          onOpenNewPurchase={() => setIsPurchaseModalOpen(true)}
          onOpenStockCount={() => setIsStockCountModalOpen(true)}
          onOpenCashClosing={() => setIsCashClosingModalOpen(true)}
          onOpenE2ETest={() => setIsE2ETestModalOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        />

        {/* Content area with bottom padding on mobile for the fixed tab bar */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Mobile Ergonomic Bottom Navigation Bar (md:hidden) */}
      <nav
        aria-label="Navegação Rápida Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-[0_-4px_20px_rgba(28,25,23,0.06)] px-2 py-1.5 flex items-center justify-around pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        {/* Tab 1: Visão Geral */}
        <button
          onClick={() => setCurrentPage('overview')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors cursor-pointer ${
            currentPage === 'overview'
              ? 'text-amber-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Início</span>
        </button>

        {/* Tab 2: Vendas */}
        <button
          onClick={() => setCurrentPage('sales')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors cursor-pointer ${
            currentPage === 'sales'
              ? 'text-amber-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Receipt className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Vendas</span>
        </button>

        {/* Central Floating Primary Action: + Venda */}
        <button
          onClick={() => setIsSaleModalOpen(true)}
          className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
          aria-label="Registrar Nova Venda"
        >
          <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-amber-600 via-orange-600 to-amber-500 text-white shadow-lg shadow-amber-900/25 border-3 border-white flex items-center justify-center group-active:scale-95 transition-transform">
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span className="text-[10px] font-bold text-amber-900 mt-0.5">Vender</span>
        </button>

        {/* Tab 4: Estoque */}
        <button
          onClick={() => setCurrentPage('stock')}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors cursor-pointer ${
            currentPage === 'stock'
              ? 'text-amber-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Estoque</span>
        </button>

        {/* Tab 5: Menu Gaveta Completo */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] py-1 transition-colors cursor-pointer ${
            isMobileMenuOpen
              ? 'text-amber-800 font-semibold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MenuIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Mais</span>
        </button>
      </nav>

      {/* Modals */}
      <NewSaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
      />

      <NewExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
      />

      <NewPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />

      <StockCountModal
        isOpen={isStockCountModalOpen}
        onClose={() => setIsStockCountModalOpen(false)}
      />

      <CashClosingModal
        isOpen={isCashClosingModalOpen}
        onClose={() => setIsCashClosingModalOpen(false)}
      />

      <E2ETestModal
        isOpen={isE2ETestModalOpen}
        onClose={() => setIsE2ETestModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BusinessProvider>
      <AppContent />
    </BusinessProvider>
  );
}
