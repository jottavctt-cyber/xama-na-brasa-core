import React, { useState } from 'react';
import { X, Boxes, Plus, CheckCircle2 } from 'lucide-react';
import { useBusiness } from '../../context/BusinessContext';
import { StockCategory, UnitOfMeasure } from '../../types';

interface NewStockItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewStockItemModal: React.FC<NewStockItemModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addStockItem } = useBusiness();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<StockCategory>('Porções e preparados');
  const [unit, setUnit] = useState<UnitOfMeasure>('porcao');
  const [minStock, setMinStock] = useState<number>(5);
  const [initialQuantity, setInitialQuantity] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [supplier, setSupplier] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addStockItem({
      name: name.trim(),
      category,
      unit,
      minStock: Number(minStock) || 5,
      initialQuantity: initialQuantity === '' ? null : Number(initialQuantity),
      unitCost: unitCost === '' ? null : Number(unitCost),
      notes: notes.trim() || undefined,
      packageDescription: packageDescription.trim() || undefined,
      supplier: supplier.trim() || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setName('');
    setCategory('Porções e preparados');
    setUnit('porcao');
    setMinStock(5);
    setInitialQuantity('');
    setUnitCost('');
    setNotes('');
    setPackageDescription('');
    setSupplier('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/50 backdrop-blur-xs">
      <div className="glass-panel w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Novo Item no Estoque</h3>
              <p className="text-[10px] sm:text-[11px] text-stone-500">
                Cadastre insumos, materiais, carvão ou porções prontas diretamente no estoque
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-3.5 sm:p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Nome do Item / Insumo *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Coxinha, Guardanapo, Detergente, Saco de Carvão..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input w-full px-3 py-2 text-xs rounded-lg text-stone-900 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StockCategory)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="Porções e preparados">Porções e preparados</option>
                <option value="Carnes">Carnes</option>
                <option value="Bebidas">Bebidas</option>
                <option value="Ingredientes">Ingredientes</option>
                <option value="Embalagens">Embalagens</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Unidade de Medida</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitOfMeasure)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900 cursor-pointer"
              >
                <option value="porcao">porção (porcao)</option>
                <option value="un">unidade (un)</option>
                <option value="kg">quilograma (kg)</option>
                <option value="g">grama (g)</option>
                <option value="garrafa">garrafa</option>
                <option value="lata">lata</option>
                <option value="caixa">caixa</option>
                <option value="fardo">fardo</option>
                <option value="saco">saco</option>
                <option value="L">litro (L)</option>
                <option value="ml">mililitro (ml)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Saldo Inicial (Físico)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Vazio = Não contado"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Estoque Mínimo
              </label>
              <input
                type="number"
                step="1"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Custo Unitário (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Vazio se n/ inf."
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="glass-input w-full px-3 py-1.5 text-xs font-mono rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Descrição da Embalagem / Pacote
              </label>
              <input
                type="text"
                placeholder="Ex: Pacote com 10 un, Fardo c/ 12..."
                value={packageDescription}
                onChange={(e) => setPackageDescription(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Fornecedor (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Distribuidora X..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Observações Adicionais
            </label>
            <input
              type="text"
              placeholder="Ex: Guardado no freezer 2..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="glass-input w-full px-3 py-1.5 text-xs rounded-lg text-stone-900"
            />
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-200/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Salvar Item no Estoque</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
