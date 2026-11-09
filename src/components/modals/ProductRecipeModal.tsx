import React, { useState, useEffect } from 'react';
import { X, UtensilsCrossed, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { Product, Recipe, RecipeIngredient, UnitOfMeasure } from '../../types';
import { formatBRL, formatPercent } from '../../utils/deterministicMath';

interface ProductRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductRecipeModal: React.FC<ProductRecipeModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { stockItems, recipes, addProduct, updateProduct, saveRecipe } = useBusiness();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Espetinhos');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [active, setActive] = useState(true);
  const [portionDescription, setPortionDescription] = useState('');
  const [hasRecipe, setHasRecipe] = useState(true);
  const [directUnitCost, setDirectUnitCost] = useState<number | ''>('');
  const [costNote, setCostNote] = useState('');

  // Recipe Fields
  const [yieldQuantity, setYieldQuantity] = useState<number>(1);
  const [yieldUnit, setYieldUnit] = useState<UnitOfMeasure>('un');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [preparationNotes, setPreparationNotes] = useState('');

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setSalePrice(productToEdit.salePrice !== null ? productToEdit.salePrice : '');
      setActive(productToEdit.active);
      setPortionDescription(productToEdit.portionDescription || '');
      setHasRecipe(productToEdit.hasRecipe);
      setDirectUnitCost(productToEdit.directUnitCost !== null ? productToEdit.directUnitCost : '');
      setCostNote(productToEdit.costNote || '');

      if (productToEdit.hasRecipe && productToEdit.recipeId) {
        const existingRecipe = recipes.find((r) => r.id === productToEdit.recipeId);
        if (existingRecipe) {
          setYieldQuantity(existingRecipe.yieldQuantity);
          setYieldUnit(existingRecipe.yieldUnit);
          setIngredients(existingRecipe.ingredients);
          setPreparationNotes(existingRecipe.preparationNotes || '');
        }
      } else {
        setIngredients([]);
      }
    } else {
      setName('');
      setCategory('Espetinhos');
      setSalePrice('');
      setActive(true);
      setPortionDescription('');
      setHasRecipe(true);
      setDirectUnitCost('');
      setCostNote('');
      setYieldQuantity(1);
      setYieldUnit('un');
      setIngredients([]);
      setPreparationNotes('');
    }
  }, [productToEdit, isOpen, recipes]);

  if (!isOpen) return null;

  const handleAddIngredient = () => {
    setIngredients([
      ...ingredients,
      {
        stockItemId: '',
        itemName: '',
        quantityNeeded: 1,
        unit: 'kg',
        unitCostAtCreation: null,
        isCostKnown: false,
      },
    ]);
  };

  const handleSelectStockItem = (index: number, stockItemId: string) => {
    const stock = stockItems.find((s) => s.id === stockItemId);
    const updated = [...ingredients];
    if (stock) {
      updated[index] = {
        ...updated[index],
        stockItemId: stock.id,
        itemName: stock.name,
        unit: stock.unit,
        unitCostAtCreation: stock.unitCost,
        isCostKnown: stock.unitCost !== null,
      };
    } else {
      updated[index] = {
        ...updated[index],
        stockItemId: '',
        itemName: '',
        unitCostAtCreation: null,
        isCostKnown: false,
      };
    }
    setIngredients(updated);
  };

  const handleUpdateIngredient = (index: number, updates: Partial<RecipeIngredient>) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], ...updates };
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Recipe Cost Math
  let recipeCostTotal: number | null = 0;
  let isRecipeComplete = true;

  if (hasRecipe) {
    if (ingredients.length === 0) {
      recipeCostTotal = null;
      isRecipeComplete = false;
    } else {
      for (const ing of ingredients) {
        if (!ing.isCostKnown || ing.unitCostAtCreation == null) {
          isRecipeComplete = false;
          recipeCostTotal = null;
          break;
        } else {
          recipeCostTotal += ing.quantityNeeded * ing.unitCostAtCreation;
        }
      }
    }
  }

  const costPerPortion =
    hasRecipe && isRecipeComplete && recipeCostTotal !== null && yieldQuantity > 0
      ? recipeCostTotal / yieldQuantity
      : !hasRecipe && directUnitCost !== ''
      ? Number(directUnitCost)
      : null;

  const effectivePrice = salePrice === '' ? null : Number(salePrice);
  const grossMargin =
    effectivePrice !== null && costPerPortion !== null ? effectivePrice - costPerPortion : null;
  const grossMarginPct =
    grossMargin !== null && effectivePrice !== null && effectivePrice > 0
      ? (grossMargin / effectivePrice) * 100
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let productId = productToEdit?.id;

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        name: name.trim(),
        category,
        salePrice: salePrice === '' ? null : Number(salePrice),
        active,
        portionDescription: portionDescription.trim() || undefined,
        hasRecipe,
        directUnitCost: costPerPortion,
        costStatus: isRecipeComplete ? 'confirmed' : 'incomplete',
        costNote: costNote.trim() || undefined,
      });
    } else {
      productId = addProduct({
        name: name.trim(),
        category,
        salePrice: salePrice === '' ? null : Number(salePrice),
        active,
        portionDescription: portionDescription.trim() || undefined,
        hasRecipe,
        directUnitCost: costPerPortion,
        costStatus: isRecipeComplete ? 'confirmed' : 'incomplete',
        costNote: costNote.trim() || undefined,
      });
    }

    if (hasRecipe && productId) {
      saveRecipe(
        {
          productId,
          yieldQuantity,
          yieldUnit,
          ingredients,
          preparationNotes: preparationNotes.trim() || undefined,
          recipeCostTotal,
          costPerPortion,
          isComplete: isRecipeComplete,
        },
        productToEdit?.recipeId
      );
    }

    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900 leading-tight">
                {productToEdit ? 'Editar Produto e Ficha Técnica' : 'Novo Produto do Cardápio'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500">
                Fórmula explícita de custo e cálculo de margem sem números inventados
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome do Produto *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Espetinho de Boi, Cerveja Skol..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Product['category'])}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="Espetinhos">Espetinhos</option>
                <option value="Porções e alimentos">Porções e Alimentos</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Preço de Venda (R$)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                placeholder="Vazio se não inf."
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Status</label>
              <select
                value={active ? 'true' : 'false'}
                onChange={(e) => setActive(e.target.value === 'true')}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="true">Ativo no Cardápio</option>
                <option value="false">Inativo</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Porção / Apresentação
              </label>
              <input
                type="text"
                placeholder="Ex: 100g, porção de 25 un, lata 350ml..."
                value={portionDescription}
                onChange={(e) => setPortionDescription(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
              />
            </div>
          </div>

          {/* Toggle Recipe vs Direct Resale */}
          <div className="p-3 bg-stone-100/70 border border-stone-200/80 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-stone-900">Possui Ficha Técnica / Receita Fracionada?</span>
                <p className="text-[11px] text-stone-500">
                  Desmarque para porções prontas (coxinhas, bolinhos, risoles, mandioca) ou produtos de revenda (bebidas).
                </p>
              </div>
              <input
                type="checkbox"
                checked={hasRecipe}
                onChange={(e) => setHasRecipe(e.target.checked)}
                className="w-4 h-4 rounded text-amber-700 focus:ring-amber-600 border-stone-300 cursor-pointer"
              />
            </div>

            {!hasRecipe && (
              <div className="mt-3 pt-3 border-t border-stone-200 flex gap-4 items-center">
                <div className="w-56">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Custo Unitário da Porção Pronta (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Vazio se não inf."
                    value={directUnitCost}
                    onChange={(e) =>
                      setDirectUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                    className="glass-input w-full px-2.5 py-1 text-xs font-mono rounded text-stone-900"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Nota sobre embalagem / custo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Caixa com 24 por R$ 70,00"
                    value={costNote}
                    onChange={(e) => setCostNote(e.target.value)}
                    className="glass-input w-full px-2.5 py-1 text-xs rounded text-stone-900"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Recipe Editor Section */}
          {hasRecipe && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                  Ingredientes da Ficha Técnica
                </h4>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-stone-500 text-[11px]">Rendimento:</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={yieldQuantity}
                      onChange={(e) => setYieldQuantity(parseFloat(e.target.value) || 1)}
                      className="w-14 px-1.5 py-0.5 border border-stone-200 rounded text-center text-xs font-mono"
                    />
                    <select
                      value={yieldUnit}
                      onChange={(e) => setYieldUnit(e.target.value as UnitOfMeasure)}
                      className="px-1.5 py-0.5 border border-stone-200 rounded text-xs"
                    >
                      <option value="un">unidades</option>
                      <option value="porcao">porções</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddIngredient}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insumo</span>
                  </button>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="border border-stone-200/80 rounded-xl overflow-hidden bg-white/70">
                {ingredients.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-500">
                    Nenhum ingrediente adicionado. Clique em "+ Insumo" para mapear os itens do estoque.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100 p-2 space-y-2">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center text-xs py-1">
                        <div className="col-span-5">
                          <select
                            value={ing.stockItemId}
                            onChange={(e) => handleSelectStockItem(idx, e.target.value)}
                            className="glass-input w-full px-2 py-1 text-xs rounded text-stone-900 cursor-pointer"
                          >
                            <option value="">Selecione o insumo...</option>
                            {stockItems.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.unit}) —{' '}
                                {s.unitCost !== null ? formatBRL(s.unitCost) : 'Custo pendente'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-3 flex items-center gap-1">
                          <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={ing.quantityNeeded}
                            onChange={(e) =>
                              handleUpdateIngredient(idx, {
                                quantityNeeded: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-16 px-1.5 py-1 text-center font-mono border border-stone-200 rounded"
                          />
                          <span className="text-[11px] text-stone-500">{ing.unit}</span>
                        </div>

                        <div className="col-span-3 text-right font-mono">
                          {ing.isCostKnown && ing.unitCostAtCreation != null ? (
                            <span className="text-stone-800 tabular-nums">
                              {formatBRL(ing.quantityNeeded * ing.unitCostAtCreation)}
                            </span>
                          ) : (
                            <span className="text-amber-800 text-[10px] font-semibold">Custo pendente</span>
                          )}
                        </div>

                        <div className="col-span-1 flex justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIngredient(idx)}
                            className="text-stone-400 hover:text-red-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Real-time Margins Summary Card */}
          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div>
              <span className="text-stone-500 block">Custo Unitário (CMV):</span>
              <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                {costPerPortion !== null ? (
                  formatBRL(costPerPortion)
                ) : (
                  <span className="text-amber-800 font-semibold">Custo incompleto</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-stone-500 block">Lucro Bruto Unitário:</span>
              <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                {grossMargin !== null ? (
                  formatBRL(grossMargin)
                ) : (
                  <span className="text-stone-400 font-normal">Não calculável</span>
                )}
              </span>
            </div>

            <div>
              <span className="text-stone-500 block">Margem Bruta Estimada:</span>
              <span className="font-mono text-sm font-bold text-stone-900 tabular-nums">
                {grossMarginPct !== null ? (
                  formatPercent(grossMarginPct)
                ) : (
                  <span className="text-stone-400 font-normal">Não calculável</span>
                )}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              Salvar Produto e Ficha Técnica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
