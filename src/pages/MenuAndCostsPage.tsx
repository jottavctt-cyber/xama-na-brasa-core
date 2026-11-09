import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  ChevronRight,
  History,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { Product, Recipe } from '../types';
import { formatBRL, formatPercent } from '../utils/deterministicMath';
import { ProductRecipeModal } from '../components/modals/ProductRecipeModal';

export const MenuAndCostsPage: React.FC = () => {
  const { products, recipes, updateProduct } = useBusiness();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [productModalItem, setProductModalItem] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  const categories = ['Espetinhos', 'Porções e alimentos', 'Bebidas', 'Outros'];

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(term);
      const noteMatch = p.costNote?.toLowerCase().includes(term);
      return nameMatch || noteMatch;
    }
    return true;
  });

  const toggleRecipeExpansion = (prodId: string) => {
    setExpandedRecipeId(expandedRecipeId === prodId ? null : prodId);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Cardápio, Preços e Fichas de Custo (CMV)</h3>
            <p className="text-[11px] text-stone-500">
              Cálculo de margens brutas determinísticas sem inventar números quando faltar informação
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setProductModalItem(null);
            setIsProductModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Item no Cardápio</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar item do cardápio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input w-full pl-8 pr-3 py-1.5 rounded-lg text-xs text-stone-900"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
              categoryFilter === 'all'
                ? 'bg-stone-900 text-white font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-stone-900 text-white font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products & Recipes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map((product) => {
          const recipe = product.recipeId ? recipes.find((r) => r.id === product.recipeId) : null;
          const isCostIncomplete =
            product.costStatus === 'incomplete' || (recipe && !recipe.isComplete) || product.directUnitCost === null;

          const hasSalePrice = product.salePrice !== null;
          const costValue = product.directUnitCost;

          let grossProfit: number | null = null;
          let grossMarginPct: number | null = null;

          if (hasSalePrice && !isCostIncomplete && costValue !== null) {
            grossProfit = product.salePrice! - costValue;
            grossMarginPct = product.salePrice! > 0 ? (grossProfit / product.salePrice!) * 100 : null;
          }

          const isExpanded = expandedRecipeId === product.id;

          return (
            <div
              key={product.id}
              className={`glass-panel p-4 rounded-2xl flex flex-col justify-between transition-all ${
                !product.active ? 'opacity-50' : ''
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-stone-200/70">
                  <div className="min-w-0">
                    <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wide">
                      {product.category}
                    </span>
                    <h4 className="text-sm font-bold text-stone-900 truncate">{product.name}</h4>
                    {product.portionDescription && (
                      <span className="text-[11px] text-stone-500 block truncate">
                        {product.portionDescription}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setProductModalItem(product);
                      setIsProductModalOpen(true);
                    }}
                    className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer shrink-0"
                    title="Editar produto ou ficha técnica"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Pricing & Cost Badges */}
                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="p-2.5 bg-white/80 rounded-xl border border-stone-200/70">
                    <span className="text-[10px] text-stone-500 block">Preço de Venda</span>
                    <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                      {hasSalePrice ? (
                        formatBRL(product.salePrice)
                      ) : (
                        <span className="text-amber-800 text-[11px] font-semibold">Não informado</span>
                      )}
                    </span>
                  </div>

                  <div className="p-2.5 bg-white/80 rounded-xl border border-stone-200/70">
                    <span className="text-[10px] text-stone-500 block">Custo Unitário (CMV)</span>
                    <span className="font-mono font-bold text-stone-900 text-sm tabular-nums">
                      {isCostIncomplete || costValue === null ? (
                        <span className="text-amber-800 text-[11px] font-semibold">Custo incompleto</span>
                      ) : (
                        formatBRL(costValue)
                      )}
                    </span>
                  </div>
                </div>

                {/* Margins Result */}
                <div className="p-2.5 bg-stone-100/70 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Lucro Bruto Unitário:</span>
                    <span className="font-mono font-bold text-stone-900 tabular-nums">
                      {grossProfit !== null ? (
                        formatBRL(grossProfit)
                      ) : (
                        <span className="text-stone-400 font-normal">Não calculável</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-stone-600">Margem Bruta Estimada:</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        grossMarginPct !== null && grossMarginPct >= 40
                          ? 'text-emerald-800'
                          : 'text-stone-800'
                      }`}
                    >
                      {grossMarginPct !== null ? (
                        formatPercent(grossMarginPct)
                      ) : (
                        <span className="text-stone-400 font-normal">Não calculável</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Notes & Missing cost details */}
                {product.costNote && (
                  <p className="text-[11px] text-stone-500 mt-2 bg-stone-50 p-2 rounded-lg leading-relaxed">
                    {product.costNote}
                  </p>
                )}

                {/* Ficha Técnica Collapsible Section */}
                {recipe && (
                  <div className="mt-3 pt-2 border-t border-stone-200/60">
                    <button
                      onClick={() => toggleRecipeExpansion(product.id)}
                      className="w-full flex items-center justify-between text-[11px] font-semibold text-stone-700 hover:text-stone-900 cursor-pointer"
                    >
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-stone-400" />
                        <span>Ficha Técnica ({recipe.ingredients.length} insumos)</span>
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="mt-2 space-y-1.5 text-[11px] bg-white/90 p-2.5 rounded-lg border border-stone-200/70">
                        <div className="flex justify-between text-stone-500 pb-1 border-b border-stone-100">
                          <span>Rendimento da receita:</span>
                          <span className="font-mono font-semibold text-stone-800">
                            {recipe.yieldQuantity} {recipe.yieldUnit}
                          </span>
                        </div>
                        {recipe.ingredients.map((ing, i) => (
                          <div key={i} className="flex justify-between items-center text-stone-700">
                            <span>
                              {ing.quantityNeeded} {ing.unit} de {ing.itemName}
                            </span>
                            <span className="font-mono tabular-nums">
                              {ing.isCostKnown && ing.unitCostAtCreation != null ? (
                                formatBRL(ing.quantityNeeded * ing.unitCostAtCreation)
                              ) : (
                                <span className="text-amber-800 text-[10px]">Custo pendente</span>
                              )}
                            </span>
                          </div>
                        ))}
                        {recipe.preparationNotes && (
                          <p className="text-[10px] text-stone-400 pt-1 border-t border-stone-100 italic">
                            {recipe.preparationNotes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-3 mt-3 border-t border-stone-200/60 flex items-center justify-between text-[11px] text-stone-500">
                <span className="flex items-center gap-1">
                  {product.hasRecipe ? 'Ficha técnica vinculada' : 'Revenda direta'}
                </span>

                <button
                  onClick={() => {
                    setProductModalItem(product);
                    setIsProductModalOpen(true);
                  }}
                  className="font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
                >
                  Ver Ficha Completa
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {isProductModalOpen && (
        <ProductRecipeModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          productToEdit={productModalItem}
        />
      )}
    </div>
  );
};
