import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  Recipe,
  StockItem,
  StockMovement,
  Sale,
  SaleItem,
  FinancialTransaction,
  Purchase,
  DailyCashClosing,
  AppSettings,
  PaymentMethod,
  StockCategory,
  UnitOfMeasure,
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_RECIPES,
  INITIAL_STOCK_ITEMS,
  INITIAL_SETTINGS,
  INITIAL_TRANSACTIONS,
} from '../data/initialData';

const LOCAL_STORAGE_KEY = 'xama_business_data_v1';

interface BusinessContextType {
  products: Product[];
  recipes: Recipe[];
  stockItems: StockItem[];
  stockMovements: StockMovement[];
  sales: Sale[];
  transactions: FinancialTransaction[];
  purchases: Purchase[];
  cashClosings: DailyCashClosing[];
  settings: AppSettings;
  activeDateFilter: string; // YYYY-MM-DD or 'all' or 'month'
  setActiveDateFilter: (filter: string) => void;

  // Actions
  addSale: (saleData: {
    items: Omit<SaleItem, 'subtotal' | 'unitCostAtSale' | 'isCostKnown' | 'ingredientsDeducted'>[];
    paymentMethod: PaymentMethod;
    channel: Sale['channel'];
    observation?: string;
    saleDate?: string;
  }) => { success: boolean; saleId: string; stockWarnings: string[] };

  cancelSale: (saleId: string, reason: string) => boolean;

  addTransaction: (data: Omit<FinancialTransaction, 'id' | 'createdAt'>) => string;
  updateTransactionStatus: (id: string, status: 'pago' | 'pendente', paymentDate?: string) => void;
  deleteTransaction: (id: string) => void;

  addPurchase: (purchaseData: Omit<Purchase, 'id' | 'code' | 'createdAt'>) => string;

  recordStockMovement: (movement: {
    stockItemId: string;
    type: 'entrada' | 'perda' | 'ajuste' | 'contagem';
    quantity: number; // positive number
    reason: string;
    date?: string;
  }) => void;

  performStockCount: (counts: { stockItemId: string; countedQuantity: number }[], notes?: string) => void;

  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>) => string;
  updateProduct: (id: string, updates: Partial<Product>) => void;

  saveRecipe: (recipe: Omit<Recipe, 'id'>, existingRecipeId?: string) => void;

  addStockItem: (stockData: {
    name: string;
    category: StockCategory;
    unit: UnitOfMeasure;
    minStock: number;
    initialQuantity?: number | null;
    unitCost?: number | null;
    notes?: string;
    packageDescription?: string;
    supplier?: string;
  }) => string;

  deleteStockItem: (id: string) => void;

  recordCashClosing: (closingData: Omit<DailyCashClosing, 'id' | 'closedAt'>) => string;

  updateSettings: (newSettings: Partial<AppSettings>) => void;
  exportBackupJSON: () => void;
  importBackupJSON: (jsonData: string) => { success: boolean; error?: string };
  resetToDefaultData: () => void;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [stockItems, setStockItems] = useState<StockItem[]>(INITIAL_STOCK_ITEMS);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>(INITIAL_TRANSACTIONS);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cashClosings, setCashClosings] = useState<DailyCashClosing[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  
  // Date filter: defaults to today's date in local ISO format (YYYY-MM-DD)
  const todayStr = new Date().toISOString().slice(0, 10);
  const [activeDateFilter, setActiveDateFilter] = useState<string>(todayStr);

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);

        // Non-destructive stock merge: ensure new portion stock items exist and obsolete sub-batches are cleaned
        let loadedStock: StockItem[] = parsed.stockItems || INITIAL_STOCK_ITEMS;
        const obsoleteStockIds = [
          'stock-mini-coxinha-massa-recheio',
          'stock-bolinho-mandioca-massa',
          'stock-mini-risole-massa',
          'stock-coxinha-grande-insumos',
          'stock-bolo-mandioca-insumos',
          'stock-bolinho-mandioca-carne-insumo',
          'stock-feijao-tropeiro-insumos',
        ];
        loadedStock = loadedStock.filter((s) => !obsoleteStockIds.includes(s.id));

        const portionStockIds = ['stock-mini-coxinha', 'stock-bolinho-mandioca', 'stock-mini-risole', 'stock-mandioca-torresmo'];
        portionStockIds.forEach((id) => {
          if (!loadedStock.some((s) => s.id === id)) {
            const initialItem = INITIAL_STOCK_ITEMS.find((s) => s.id === id);
            if (initialItem) {
              loadedStock.push(initialItem);
            }
          }
        });

        // Non-destructive product upgrade: convert portion products to direct unit cost ready portions
        let loadedProducts: Product[] = parsed.products || INITIAL_PRODUCTS;
        loadedProducts = loadedProducts.map((p) => {
          const isPortion =
            p.category === 'Porções e alimentos' ||
            p.id.includes('coxinha') ||
            p.id.includes('mandioca') ||
            p.id.includes('risole') ||
            p.id.includes('torresmo');

          if (isPortion) {
            const defaultCost = p.id.includes('coxinha')
              ? 1.79
              : p.id.includes('risole')
              ? 2.0
              : p.id.includes('torresmo')
              ? 3.4
              : 2.5;

            return {
              ...p,
              hasRecipe: false,
              directUnitCost: p.directUnitCost ?? defaultCost,
              costStatus: 'confirmed',
            };
          }
          return p;
        });

        // Auto-sync products into loadedStock if missing matching stock item
        loadedProducts.forEach((p) => {
          const matching = loadedStock.find(
            (s) => s.name.trim().toLowerCase() === p.name.trim().toLowerCase() || s.id.includes(p.id.replace('prod-', ''))
          );
          if (!matching) {
            let cat: StockCategory = 'Outros';
            let unit: UnitOfMeasure = 'un';
            if (p.category === 'Espetinhos') {
              cat = 'Carnes';
              unit = 'un';
            } else if (p.category === 'Bebidas') {
              cat = 'Bebidas';
              unit = (p as any).unit || 'garrafa';
            } else if (p.category === 'Porções e alimentos') {
              cat = 'Porções e preparados';
              unit = 'porcao';
            } else {
              cat = 'Outros';
              unit = (p as any).unit || 'un';
            }

            loadedStock.push({
              id: `stock-${p.id.replace('prod-', '')}`,
              name: p.name,
              category: cat,
              unit,
              minStock: 5,
              currentQuantity: null,
              isCounted: false,
              lastCountDate: undefined,
              unitCost: p.directUnitCost ?? null,
              costStatus: p.directUnitCost !== null && p.directUnitCost !== undefined ? 'confirmed' : 'incomplete',
              notes: `Sincronizado do cardápio (${p.category})`,
            });
          }
        });

        setProducts(loadedProducts);
        if (parsed.recipes) setRecipes(parsed.recipes);
        setStockItems(loadedStock);
        if (parsed.stockMovements) setStockMovements(parsed.stockMovements);
        if (parsed.sales) setSales(parsed.sales);
        if (parsed.transactions) setTransactions(parsed.transactions);
        if (parsed.purchases) setPurchases(parsed.purchases);
        if (parsed.cashClosings) setCashClosings(parsed.cashClosings);
        if (parsed.settings) setSettings(parsed.settings);
      }
    } catch (e) {
      console.error('Error loading data from localStorage', e);
    }
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    try {
      const dataToSave = {
        products,
        recipes,
        stockItems,
        stockMovements,
        sales,
        transactions,
        purchases,
        cashClosings,
        settings,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  }, [products, recipes, stockItems, stockMovements, sales, transactions, purchases, cashClosings, settings]);

  /**
   * Helper: Add a sale with preserved cost snapshot and deterministic recipe deduction
   */
  const addSale = ({
    items,
    paymentMethod,
    channel,
    observation,
    saleDate,
  }: {
    items: Omit<SaleItem, 'subtotal' | 'unitCostAtSale' | 'isCostKnown' | 'ingredientsDeducted'>[];
    paymentMethod: PaymentMethod;
    channel: Sale['channel'];
    observation?: string;
    saleDate?: string;
  }) => {
    const saleId = `sale-${Date.now()}`;
    const code = `VND-${String(sales.length + 1).padStart(4, '0')}`;
    const date = saleDate || new Date().toISOString();

    const stockWarnings: string[] = [];
    const updatedStockItems = [...stockItems];
    const newMovements: StockMovement[] = [];

    let grossTotal = 0;
    let discountTotal = 0;
    let calculatedCMV = 0;
    let isCMVComplete = true;

    const enrichedItems: SaleItem[] = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      const subtotal = Math.max(0, item.quantity * item.unitPrice - (item.discount || 0));
      grossTotal += item.quantity * item.unitPrice;
      discountTotal += item.discount || 0;

      let unitCostAtSale: number | null = null;
      let isCostKnown = false;
      let ingredientsDeducted = false;

      if (product) {
        if (product.hasRecipe && product.recipeId) {
          const recipe = recipes.find((r) => r.id === product.recipeId);
          if (recipe) {
            unitCostAtSale = recipe.costPerPortion;
            isCostKnown = recipe.isComplete && recipe.costPerPortion !== null;

            if (isCostKnown && unitCostAtSale !== null) {
              calculatedCMV += unitCostAtSale * item.quantity;
            } else {
              isCMVComplete = false;
              stockWarnings.push(
                `Produto "${product.name}": receita com custo incompleto. CMV não foi calculado totalmente.`
              );
            }

            // Deduce ingredients from stock
            let canDeductAll = true;
            recipe.ingredients.forEach((ing) => {
              const stockIdx = updatedStockItems.findIndex((s) => s.id === ing.stockItemId);
              if (stockIdx !== -1) {
                const stockItem = updatedStockItems[stockIdx];
                const totalNeeded = (ing.quantityNeeded / recipe.yieldQuantity) * item.quantity;

                if (!stockItem.isCounted || stockItem.currentQuantity === null) {
                  canDeductAll = false;
                  stockWarnings.push(
                    `Insumo "${stockItem.name}" não possui contagem de estoque inicial registrada.`
                  );
                } else {
                  const previousQty = stockItem.currentQuantity;
                  const newQty = previousQty - totalNeeded;
                  updatedStockItems[stockIdx] = {
                    ...stockItem,
                    currentQuantity: newQty,
                  };

                  newMovements.push({
                    id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                    stockItemId: stockItem.id,
                    itemName: stockItem.name,
                    type: 'consumo_venda',
                    quantityDelta: -totalNeeded,
                    previousQuantity: previousQty,
                    newQuantity: newQty,
                    unit: stockItem.unit,
                    unitCost: stockItem.unitCost,
                    totalCost: stockItem.unitCost ? totalNeeded * stockItem.unitCost : null,
                    reason: `Venda ${code} (${item.quantity}x ${product.name})`,
                    date,
                    referenceId: saleId,
                  });
                }
              }
            });
            ingredientsDeducted = canDeductAll;
          } else {
            isCMVComplete = false;
          }
        } else {
          // Direct resale (e.g. beer bottles, cans, water)
          unitCostAtSale = product.directUnitCost;
          isCostKnown = product.directUnitCost !== null;

          if (isCostKnown && unitCostAtSale !== null) {
            calculatedCMV += unitCostAtSale * item.quantity;
          } else {
            isCMVComplete = false;
            stockWarnings.push(`Produto "${product.name}" sem custo de revenda informado.`);
          }

          // Try finding matching stock item by product name or id
          const matchingStockIdx = updatedStockItems.findIndex(
            (s) => s.name.toLowerCase() === product.name.toLowerCase() || s.id.includes(product.id.replace('prod-', ''))
          );
          if (matchingStockIdx !== -1) {
            const stockItem = updatedStockItems[matchingStockIdx];
            if (stockItem.isCounted && stockItem.currentQuantity !== null) {
              const previousQty = stockItem.currentQuantity;
              const newQty = previousQty - item.quantity;
              updatedStockItems[matchingStockIdx] = {
                ...stockItem,
                currentQuantity: newQty,
              };

              newMovements.push({
                id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                stockItemId: stockItem.id,
                itemName: stockItem.name,
                type: 'consumo_venda',
                quantityDelta: -item.quantity,
                previousQuantity: previousQty,
                newQuantity: newQty,
                unit: stockItem.unit,
                unitCost: stockItem.unitCost,
                totalCost: stockItem.unitCost ? item.quantity * stockItem.unitCost : null,
                reason: `Venda ${code} (${item.quantity}x ${product.name})`,
                date,
                referenceId: saleId,
              });
              ingredientsDeducted = true;
            } else {
              stockWarnings.push(`Estoque de "${stockItem.name}" ainda não foi contado.`);
            }
          }
        }
      }

      return {
        ...item,
        subtotal,
        unitCostAtSale,
        isCostKnown,
        ingredientsDeducted,
      };
    });

    const netTotal = Math.max(0, grossTotal - discountTotal);

    const deductionStatus =
      stockWarnings.length === 0 ? 'deducted' : newMovements.length > 0 ? 'partial' : 'skipped';

    const newSale: Sale = {
      id: saleId,
      code,
      date,
      items: enrichedItems,
      grossTotal,
      discountTotal,
      netTotal,
      calculatedCMV: isCMVComplete ? calculatedCMV : calculatedCMV > 0 ? calculatedCMV : null,
      isCMVComplete,
      paymentMethod,
      channel,
      status: 'concluida',
      observation,
      stockDeductionStatus: deductionStatus,
      stockDeductionNotes: stockWarnings.join(' | '),
    };

    // Financial entry: Revenue recorded in transactions
    const saleTransaction: FinancialTransaction = {
      id: `tx-sale-${Date.now()}`,
      date: date.slice(0, 10),
      type: 'receita',
      category: 'Venda',
      description: `Venda ${code} (${enrichedItems.map((i) => `${i.quantity}x ${i.productName}`).join(', ')})`,
      amount: netTotal,
      paymentMethod,
      status: 'pago',
      paymentDate: date.slice(0, 10),
      referenceType: 'venda',
      referenceId: saleId,
      createdAt: date,
    };

    setSales((prev) => [newSale, ...prev]);
    setTransactions((prev) => [saleTransaction, ...prev]);
    if (newMovements.length > 0) {
      setStockItems(updatedStockItems);
      setStockMovements((prev) => [...newMovements, ...prev]);
    }

    return { success: true, saleId, stockWarnings };
  };

  /**
   * Cancel sale with audit trail and stock rollback
   */
  const cancelSale = (saleId: string, reason: string): boolean => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale || sale.status === 'cancelada') return false;

    const now = new Date().toISOString();

    // Revert stock movements associated with this sale
    const relatedMovements = stockMovements.filter((m) => m.referenceId === saleId);
    if (relatedMovements.length > 0) {
      setStockItems((currentStock) => {
        const updated = [...currentStock];
        for (const mov of relatedMovements) {
          const idx = updated.findIndex((s) => s.id === mov.stockItemId);
          if (idx !== -1 && updated[idx].currentQuantity !== null) {
            updated[idx] = {
              ...updated[idx],
              currentQuantity: updated[idx].currentQuantity! - mov.quantityDelta, // reverse delta (quantityDelta was negative)
            };
          }
        }
        return updated;
      });

      // Record reversal movements
      const reversalMovements: StockMovement[] = relatedMovements.map((m) => ({
        id: `mov-rev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        stockItemId: m.stockItemId,
        itemName: m.itemName,
        type: 'ajuste',
        quantityDelta: -m.quantityDelta,
        previousQuantity: null,
        newQuantity: 0,
        unit: m.unit,
        unitCost: m.unitCost,
        totalCost: m.totalCost,
        reason: `Estorno de venda cancelada (${sale.code}): ${reason}`,
        date: now,
        referenceId: saleId,
      }));
      setStockMovements((prev) => [...reversalMovements, ...prev]);
    }

    // Cancel related financial transaction
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.referenceId === saleId ? { ...tx, status: 'pendente', description: `[CANCELADA] ${tx.description}` } : tx
      )
    );

    // Update sale status
    setSales((prev) =>
      prev.map((s) =>
        s.id === saleId
          ? {
              ...s,
              status: 'cancelada',
              cancellationReason: reason,
              cancelledAt: now,
            }
          : s
      )
    );

    return true;
  };

  /**
   * Add a financial transaction (Expense or Income)
   */
  const addTransaction = (data: Omit<FinancialTransaction, 'id' | 'createdAt'>): string => {
    const id = `tx-${Date.now()}`;
    const newTx: FinancialTransaction = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    return id;
  };

  /**
   * Update transaction status (Pago / Pendente)
   */
  const updateTransactionStatus = (id: string, status: 'pago' | 'pendente', paymentDate?: string) => {
    setTransactions((prev) =>
      prev.map((tx) =>
        tx.id === id
          ? {
              ...tx,
              status,
              paymentDate: status === 'pago' ? paymentDate || new Date().toISOString().slice(0, 10) : undefined,
            }
          : tx
      )
    );
  };

  /**
   * Delete transaction
   */
  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  /**
   * Register a purchase with stock entry and financial entry
   */
  const addPurchase = (purchaseData: Omit<Purchase, 'id' | 'code' | 'createdAt'>): string => {
    const id = `pur-${Date.now()}`;
    const code = `CMP-${String(purchases.length + 1).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newPurchase: Purchase = {
      ...purchaseData,
      id,
      code,
      createdAt: now,
    };

    // Financial entry
    const isBeverage = purchaseData.items.some((i) => i.itemName.toLowerCase().includes('cerveja') || i.itemName.toLowerCase().includes('refri') || i.itemName.toLowerCase().includes('água'));
    const category = isBeverage ? 'Compra de bebidas' : 'Compra de ingredientes';

    const tx: FinancialTransaction = {
      id: `tx-pur-${Date.now()}`,
      date: purchaseData.date,
      type: 'despesa',
      category,
      description: `Compra ${code}${purchaseData.supplier ? ` - ${purchaseData.supplier}` : ''} (${purchaseData.items.map((i) => `${i.quantity} ${i.unit} ${i.itemName}`).join(', ')})`,
      amount: purchaseData.totalAmount,
      paymentMethod: purchaseData.paymentMethod,
      status: purchaseData.status,
      paymentDate: purchaseData.status === 'pago' ? purchaseData.date : undefined,
      referenceType: 'compra',
      referenceId: id,
      createdAt: now,
    };

    setPurchases((prev) => [newPurchase, ...prev]);
    setTransactions((prev) => [tx, ...prev]);

    // Stock entry if selected
    if (purchaseData.stockUpdated) {
      setStockItems((currentStock) => {
        const updated = [...currentStock];
        const movements: StockMovement[] = [];

        for (const pItem of purchaseData.items) {
          const idx = updated.findIndex((s) => s.id === pItem.stockItemId || s.name.toLowerCase() === pItem.itemName.toLowerCase());
          if (idx !== -1) {
            const stock = updated[idx];
            const prevQty = stock.currentQuantity;
            const newQty = (prevQty || 0) + pItem.quantity;

            updated[idx] = {
              ...stock,
              currentQuantity: newQty,
              isCounted: true,
              unitCost: pItem.unitPrice,
              costStatus: 'confirmed',
            };

            movements.push({
              id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              stockItemId: stock.id,
              itemName: stock.name,
              type: 'entrada',
              quantityDelta: pItem.quantity,
              previousQuantity: prevQty,
              newQuantity: newQty,
              unit: stock.unit,
              unitCost: pItem.unitPrice,
              totalCost: pItem.totalPrice,
              reason: `Compra ${code}${purchaseData.supplier ? ` (${purchaseData.supplier})` : ''}`,
              date: purchaseData.date,
              referenceId: id,
            });
          }
        }

        if (movements.length > 0) {
          setStockMovements((prev) => [...movements, ...prev]);
        }
        return updated;
      });
    }

    return id;
  };

  /**
   * Manual stock movement (Entrada, Perda, Ajuste)
   */
  const recordStockMovement = ({
    stockItemId,
    type,
    quantity,
    reason,
    date,
  }: {
    stockItemId: string;
    type: 'entrada' | 'perda' | 'ajuste' | 'contagem';
    quantity: number;
    reason: string;
    date?: string;
  }) => {
    const item = stockItems.find((s) => s.id === stockItemId);
    if (!item) return;

    const prevQty = item.currentQuantity;
    const delta = type === 'entrada' ? quantity : -quantity;
    const newQty = (prevQty || 0) + delta;
    const moveDate = date || new Date().toISOString().slice(0, 10);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      stockItemId: item.id,
      itemName: item.name,
      type,
      quantityDelta: delta,
      previousQuantity: prevQty,
      newQuantity: Math.max(0, newQty),
      unit: item.unit,
      unitCost: item.unitCost,
      totalCost: item.unitCost ? quantity * item.unitCost : null,
      reason,
      date: moveDate,
    };

    setStockItems((prev) =>
      prev.map((s) =>
        s.id === stockItemId
          ? {
              ...s,
              currentQuantity: Math.max(0, newQty),
              isCounted: true,
              lastCountDate: moveDate,
            }
          : s
      )
    );

    setStockMovements((prev) => [movement, ...prev]);
  };

  /**
   * Physical Inventory Count
   */
  const performStockCount = (
    counts: { stockItemId: string; countedQuantity: number }[],
    notes?: string
  ) => {
    const today = new Date().toISOString().slice(0, 10);
    const newMovements: StockMovement[] = [];

    setStockItems((currentStock) => {
      const updated = [...currentStock];

      for (const count of counts) {
        const idx = updated.findIndex((s) => s.id === count.stockItemId);
        if (idx !== -1) {
          const item = updated[idx];
          const previousQty = item.currentQuantity;
          const countedQty = count.countedQuantity;
          const variance = previousQty !== null ? countedQty - previousQty : 0;

          updated[idx] = {
            ...item,
            currentQuantity: countedQty,
            isCounted: true,
            lastCountDate: today,
          };

          newMovements.push({
            id: `mov-count-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            stockItemId: item.id,
            itemName: item.name,
            type: 'contagem',
            quantityDelta: variance,
            previousQuantity: previousQty,
            newQuantity: countedQty,
            unit: item.unit,
            unitCost: item.unitCost,
            totalCost: item.unitCost ? Math.abs(variance) * item.unitCost : null,
            reason:
              previousQty === null
                ? `Primeira contagem física registrada (${countedQty} ${item.unit})`
                : variance === 0
                ? `Contagem confirmada sem divergência (${countedQty} ${item.unit})`
                : `Ajuste de inventário: divergência de ${variance > 0 ? `+${variance}` : variance} ${item.unit}${notes ? ` (${notes})` : ''}`,
            date: today,
          });
        }
      }

      return updated;
    });

    if (newMovements.length > 0) {
      setStockMovements((prev) => [...newMovements, ...prev]);
    }
  };

  /**
   * Add new stock item directly
   */
  const addStockItem = (stockData: {
    name: string;
    category: StockCategory;
    unit: UnitOfMeasure;
    minStock: number;
    initialQuantity?: number | null;
    unitCost?: number | null;
    notes?: string;
    packageDescription?: string;
    supplier?: string;
  }): string => {
    const id = `stock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const now = new Date().toISOString().slice(0, 10);
    const isCounted = stockData.initialQuantity !== undefined && stockData.initialQuantity !== null;

    const newItem: StockItem = {
      id,
      name: stockData.name,
      category: stockData.category,
      unit: stockData.unit,
      minStock: stockData.minStock,
      currentQuantity: isCounted ? stockData.initialQuantity! : null,
      isCounted,
      lastCountDate: isCounted ? now : undefined,
      unitCost: stockData.unitCost ?? null,
      costStatus: stockData.unitCost !== undefined && stockData.unitCost !== null ? 'confirmed' : 'incomplete',
      notes: stockData.notes,
      packageDescription: stockData.packageDescription,
      supplier: stockData.supplier,
    };

    setStockItems((prev) => [...prev, newItem]);
    return id;
  };

  /**
   * Add or update product and price history
   */
  const addProduct = (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'priceHistory'>
  ): string => {
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const newProd: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now,
      priceHistory: productData.salePrice !== null ? [{ date: now.slice(0, 10), price: productData.salePrice, note: 'Cadastro inicial' }] : [],
    };
    setProducts((prev) => [newProd, ...prev]);

    // Auto-sync new product to stockItems
    setStockItems((prev) => {
      const exists = prev.some((s) => s.name.trim().toLowerCase() === newProd.name.trim().toLowerCase());
      if (exists) return prev;

      let cat: StockCategory = 'Outros';
      let unit: UnitOfMeasure = 'un';
      if (newProd.category === 'Espetinhos') {
        cat = 'Carnes';
        unit = 'un';
      } else if (newProd.category === 'Bebidas') {
        cat = 'Bebidas';
        unit = (newProd as any).unit || 'garrafa';
      } else if (newProd.category === 'Porções e alimentos') {
        cat = 'Porções e preparados';
        unit = 'porcao';
      } else {
        cat = 'Outros';
        unit = (newProd as any).unit || 'un';
      }

      const newStockItem: StockItem = {
        id: `stock-${id.replace('prod-', '')}`,
        name: newProd.name,
        category: cat,
        unit,
        minStock: 5,
        currentQuantity: null,
        isCounted: false,
        lastCountDate: undefined,
        unitCost: newProd.directUnitCost ?? null,
        costStatus: newProd.directUnitCost !== null && newProd.directUnitCost !== undefined ? 'confirmed' : 'incomplete',
        notes: `Sincronizado do cardápio (${newProd.category})`,
      };

      return [...prev, newStockItem];
    });

    return id;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date().toISOString();
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const priceChanged = updates.salePrice !== undefined && updates.salePrice !== p.salePrice;
        const newHistory = [...p.priceHistory];
        if (priceChanged && updates.salePrice !== undefined) {
          newHistory.push({
            date: now.slice(0, 10),
            price: updates.salePrice,
            note: 'Atualização de preço',
          });
        }

        return {
          ...p,
          ...updates,
          updatedAt: now,
          priceHistory: newHistory,
        };
      })
    );

    // Sync updates with matching stock item
    setStockItems((prevStock) =>
      prevStock.map((s) => {
        const isMatch = s.id.includes(id.replace('prod-', ''));
        if (!isMatch) return s;

        return {
          ...s,
          name: updates.name ? updates.name : s.name,
          unitCost: updates.directUnitCost !== undefined ? updates.directUnitCost : s.unitCost,
          costStatus: updates.directUnitCost !== undefined && updates.directUnitCost !== null ? 'confirmed' : s.costStatus,
        };
      })
    );
  };

  /**
   * Save Recipe (Ficha Técnica)
   */
  const saveRecipe = (recipeData: Omit<Recipe, 'id'>, existingRecipeId?: string) => {
    const id = existingRecipeId || `recipe-${Date.now()}`;
    const fullRecipe: Recipe = {
      ...recipeData,
      id,
    };

    setRecipes((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = fullRecipe;
        return copy;
      }
      return [...prev, fullRecipe];
    });

    // Link recipe to product
    setProducts((prev) =>
      prev.map((p) =>
        p.id === recipeData.productId
          ? {
              ...p,
              hasRecipe: true,
              recipeId: id,
              directUnitCost: fullRecipe.costPerPortion,
              costStatus: fullRecipe.isComplete ? 'confirmed' : 'incomplete',
            }
          : p
      )
    );
  };

  /**
   * Record Daily Cash Closing
   */
  const recordCashClosing = (closingData: Omit<DailyCashClosing, 'id' | 'closedAt'>): string => {
    const id = `close-${Date.now()}`;
    const closing: DailyCashClosing = {
      ...closingData,
      id,
      closedAt: new Date().toISOString(),
    };
    setCashClosings((prev) => [closing, ...prev]);
    return id;
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  /**
   * Local Backup Export (Download JSON)
   */
  const exportBackupJSON = () => {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'Xama Business Core',
      businessName: settings.businessName,
      data: {
        products,
        recipes,
        stockItems,
        stockMovements,
        sales,
        transactions,
        purchases,
        cashClosings,
        settings: {
          ...settings,
          lastBackupDate: new Date().toISOString(),
        },
      },
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `backup-xama-core-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setSettings((prev) => ({ ...prev, lastBackupDate: new Date().toISOString() }));
  };

  /**
   * Local Backup Restore (Upload JSON)
   */
  const importBackupJSON = (jsonData: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonData);
      const data = parsed.data || parsed;

      if (!data.products || !data.stockItems) {
        return { success: false, error: 'Arquivo inválido: estrutura de dados incompatível.' };
      }

      setProducts(data.products || INITIAL_PRODUCTS);
      setRecipes(data.recipes || INITIAL_RECIPES);
      setStockItems(data.stockItems || INITIAL_STOCK_ITEMS);
      setStockMovements(data.stockMovements || []);
      setSales(data.sales || []);
      setTransactions(data.transactions || INITIAL_TRANSACTIONS);
      setPurchases(data.purchases || []);
      setCashClosings(data.cashClosings || []);
      if (data.settings) setSettings(data.settings);

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Erro ao processar arquivo JSON.' };
    }
  };

  /**
   * Reset data to specification initial state
   */
  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setRecipes(INITIAL_RECIPES);
    setStockItems(INITIAL_STOCK_ITEMS);
    setStockMovements([]);
    setSales([]);
    setTransactions(INITIAL_TRANSACTIONS);
    setPurchases([]);
    setCashClosings([]);
    setSettings(INITIAL_SETTINGS);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  /**
   * Delete stock item from inventory
   */
  const deleteStockItem = (id: string) => {
    setStockItems((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <BusinessContext.Provider
      value={{
        products,
        recipes,
        stockItems,
        stockMovements,
        sales,
        transactions,
        purchases,
        cashClosings,
        settings,
        activeDateFilter,
        setActiveDateFilter,
        addSale,
        cancelSale,
        addTransaction,
        updateTransactionStatus,
        deleteTransaction,
        addPurchase,
        recordStockMovement,
        performStockCount,
        addStockItem,
        deleteStockItem,
        addProduct,
        updateProduct,
        saveRecipe,
        recordCashClosing,
        updateSettings,
        exportBackupJSON,
        importBackupJSON,
        resetToDefaultData,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};
