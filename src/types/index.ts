export type UnitOfMeasure = 'g' | 'kg' | 'ml' | 'L' | 'un' | 'porcao' | 'garrafa' | 'lata' | 'fardo' | 'caixa' | 'saco';

export type PaymentMethod = 'dinheiro' | 'pix' | 'debito' | 'credito' | 'outro';

export type SalesChannel = 'balcao' | 'mesa' | 'entrega' | 'outro';

export type StockCategory =
  | 'Carnes'
  | 'Bebidas'
  | 'Ingredientes'
  | 'Porções e preparados'
  | 'Embalagens'
  | 'Outros';

export type FinancialCategory =
  | 'Aluguel'
  | 'Energia'
  | 'Gás'
  | 'Carvão'
  | 'Compra de ingredientes'
  | 'Compra de bebidas'
  | 'Embalagens'
  | 'Manutenção'
  | 'Venda'
  | 'Outros';

export interface RecipeIngredient {
  stockItemId: string;
  itemName: string;
  quantityNeeded: number;
  unit: UnitOfMeasure;
  unitCostAtCreation?: number | null; // e.g. cost per kg/g/un
  isCostKnown: boolean;
}

export interface Recipe {
  id: string;
  productId: string;
  yieldQuantity: number;
  yieldUnit: UnitOfMeasure; // e.g. 1 un, 25 un, 15 porções
  ingredients: RecipeIngredient[];
  preparationNotes?: string;
  recipeCostTotal: number | null; // total cost for the entire yield
  costPerPortion: number | null; // recipeCostTotal / yieldQuantity
  isComplete: boolean; // false if any ingredient has unknown cost
  missingCostNotes?: string[];
}

export interface Product {
  id: string;
  name: string;
  category: 'Espetinhos' | 'Porções e alimentos' | 'Bebidas' | 'Outros';
  salePrice: number | null; // null if not informed (e.g. Bolo de mandioca grande)
  active: boolean;
  hasRecipe: boolean;
  recipeId?: string;
  directUnitCost: number | null; // for direct resale products like beers or water
  costStatus: 'confirmed' | 'range' | 'incomplete';
  costNote?: string;
  portionDescription?: string;
  createdAt: string;
  updatedAt: string;
  priceHistory: { date: string; price: number | null; note?: string }[];
}

export interface StockItem {
  id: string;
  name: string;
  category: StockCategory;
  unit: UnitOfMeasure;
  currentQuantity: number | null; // null represents 'Não contado'
  isCounted: boolean;
  minStock: number;
  unitCost: number | null; // cost per basic unit (e.g., per kg, per bottle)
  costStatus: 'confirmed' | 'range' | 'incomplete';
  costRangeNote?: string;
  packageDescription?: string; // e.g. 'Caixa com 24', 'Fardo com 12'
  supplier?: string;
  expiryDate?: string;
  notes?: string;
  lastCountDate?: string;
}

export interface StockMovement {
  id: string;
  stockItemId: string;
  itemName: string;
  type: 'entrada' | 'consumo_venda' | 'perda' | 'ajuste' | 'contagem';
  quantityDelta: number; // positive for entries, negative for sales/losses
  previousQuantity: number | null;
  newQuantity: number;
  unit: UnitOfMeasure;
  unitCost: number | null;
  totalCost: number | null;
  reason: string;
  date: string;
  referenceId?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  unitCostAtSale: number | null;
  isCostKnown: boolean;
  ingredientsDeducted: boolean;
}

export interface Sale {
  id: string;
  code: string;
  date: string; // ISO string
  items: SaleItem[];
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
  calculatedCMV: number | null;
  isCMVComplete: boolean;
  paymentMethod: PaymentMethod;
  channel: SalesChannel;
  status: 'concluida' | 'cancelada';
  cancellationReason?: string;
  cancelledAt?: string;
  observation?: string;
  stockDeductionStatus: 'deducted' | 'partial' | 'skipped';
  stockDeductionNotes?: string;
}

export interface FinancialTransaction {
  id: string;
  date: string;
  dueDate?: string;
  type: 'receita' | 'despesa';
  category: FinancialCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: 'pago' | 'pendente';
  paymentDate?: string;
  referenceType?: 'venda' | 'compra' | 'fixa' | 'avulsa';
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export interface PurchaseItem {
  stockItemId?: string;
  itemName: string;
  quantity: number;
  unit: UnitOfMeasure;
  unitPrice: number;
  totalPrice: number;
}

export interface Purchase {
  id: string;
  code: string;
  date: string;
  supplier?: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: 'pago' | 'pendente';
  stockUpdated: boolean;
  observation?: string;
  createdAt: string;
}

export interface DailyCashClosing {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number;
  expectedCashInDrawer: number;
  countedCashInDrawer: number;
  difference: number; // counted - expected
  differenceReason?: string;
  breakdown: {
    dinheiro: number;
    pix: number;
    debito: number;
    credito: number;
    outro: number;
  };
  totalGrossSales: number;
  totalExpensesPaidInCash: number;
  closedAt: string;
  closedBy?: string;
  notes?: string;
}

export interface AppSettings {
  businessName: string;
  openingCashDrawerDefault: number;
  operationalDaysPerMonth: number;
  coalBagsPerDay: number;
  coalPricePerBag: number;
  monthlyFixedExpenses: {
    rent: number;
    electricity: number;
    gasBottlePrice: number;
    gasDaysDuration: number;
  };
  lastBackupDate?: string;
  customLogoUrl?: string;
}
