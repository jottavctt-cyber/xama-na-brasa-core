/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
      {/* Fixed Desktop Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onOpenNewSale={() => setIsSaleModalOpen(true)}
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
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

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
