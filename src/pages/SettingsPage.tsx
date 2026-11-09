import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { useBusiness } from '../context/BusinessContext';
import { formatBRL } from '../utils/deterministicMath';

interface SettingsPageProps {
  onOpenE2ETest?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenE2ETest }) => {
  const {
    settings,
    updateSettings,
    exportBackupJSON,
    importBackupJSON,
    resetToDefaultData,
    products,
    stockItems,
    sales,
    transactions,
  } = useBusiness();

  const [openingDrawer, setOpeningDrawer] = useState(settings.openingCashDrawerDefault);
  const [operationalDays, setOperationalDays] = useState(settings.operationalDaysPerMonth);
  const [coalBags, setCoalBags] = useState(settings.coalBagsPerDay);
  const [coalPrice, setCoalPrice] = useState(settings.coalPricePerBag);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveOperationalParams = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      openingCashDrawerDefault: Number(openingDrawer),
      operationalDaysPerMonth: Number(operationalDays),
      coalBagsPerDay: Number(coalBags),
      coalPricePerBag: Number(coalPrice),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importBackupJSON(content);
      if (res.success) {
        setImportStatus({ type: 'success', msg: 'Backup restaurado com sucesso!' });
      } else {
        setImportStatus({ type: 'error', msg: res.error || 'Falha ao restaurar backup.' });
      }
      setTimeout(() => setImportStatus(null), 5000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Configurações, Parâmetros e Backup Local</h3>
            <p className="text-[11px] text-stone-500">
              Gerencie logotipo, cópias de segurança locais e parâmetros de custos da brasa
            </p>
          </div>
        </div>
      </div>

      {/* Brand Logo Configuration */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-700" />
            <h4 className="text-sm font-bold text-stone-900">Logotipo Oficial do Xamã na Brasa</h4>
          </div>
          <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded">
            Pasta dedicada: /public/logo/logo.png
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-1">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-950 border border-stone-200 shadow-sm flex items-center justify-center shrink-0">
            <img
              src={settings.customLogoUrl || '/logo/logo.png'}
              alt="Logo Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/image_e7a71324.png';
              }}
            />
          </div>

          <div className="space-y-2 flex-1 min-w-[280px] text-xs">
            <p className="text-stone-600 leading-relaxed">
              A pasta <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-amber-900">/public/logo/</code>{' '}
              foi criada e já contém a sua logo oficial. Qualquer arquivo nomeado como <code className="bg-stone-100 px-1 py-0.5 rounded font-mono text-amber-900">logo.png</code> salvo nessa pasta é carregado automaticamente no canto superior esquerdo.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                <Camera className="w-3.5 h-3.5" />
                <span>Subir Foto do Computador</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) updateSettings({ customLogoUrl: dataUrl });
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>

              {settings.customLogoUrl && (
                <button
                  type="button"
                  onClick={() => updateSettings({ customLogoUrl: undefined })}
                  className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg border border-stone-200 cursor-pointer"
                >
                  Restaurar /logo/logo.png
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backup and Local Data Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
          <Database className="w-4 h-4 text-emerald-700" />
          <h4 className="text-sm font-bold text-stone-900">Cópia de Segurança Local (Backup JSON)</h4>
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Princípio 7 e 9: O sistema opera 100% no seu computador, sem depender de internet ou serviços
          em nuvem. Exporte periodicamente uma cópia dos seus dados para um pen drive ou pasta segura.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <button
            onClick={exportBackupJSON}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Fazer Download do Backup (Exportar JSON)</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 rounded-xl text-xs font-semibold shadow-2xs transition-all cursor-pointer">
            <Upload className="w-4 h-4 text-stone-500" />
            <span>Restaurar Cópia de Segurança (Importar JSON)</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                : 'bg-red-100 text-red-900 border border-red-300'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-700" />
            )}
            <span>{importStatus.msg}</span>
          </div>
        )}

        <div className="text-[11px] text-stone-500 pt-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {settings.lastBackupDate
              ? `Último backup exportado em: ${new Date(settings.lastBackupDate).toLocaleString('pt-BR')}`
              : 'Nenhum backup exportado ainda neste dispositivo.'}
          </span>
        </div>
      </div>

      {/* End to End Precision Audit Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4 border border-emerald-200/80 bg-gradient-to-br from-white/95 via-emerald-50/20 to-teal-50/10">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                Auditoria de Precisão Matemática & Teste E2E (100% Determinístico)
              </h4>
              <p className="text-[11px] text-stone-500">
                Simula todas as movimentações, vendas, baixas de estoque, compras, DRE e caixa
              </p>
            </div>
          </div>

          {onOpenE2ETest && (
            <button
              onClick={onOpenE2ETest}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Executar Testes E2E</span>
            </button>
          )}
        </div>

        <p className="text-xs text-stone-600 leading-relaxed">
          Executa a validação formal das 9 invariantes do sistema: conferência centésima do CMV de receitas,
          marcação de custo incompleto, estorno exato de estoque em cancelamentos, reconciliação de gaveta
          física e ausência total de divisão por zero.
        </p>
      </div>

      {/* Operational Parameters Form */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
          <HardDrive className="w-4 h-4 text-stone-700" />
          <h4 className="text-sm font-bold text-stone-900">Parâmetros Operacionais e Dias de Funcionamento</h4>
        </div>

        <form onSubmit={handleSaveOperationalParams} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Fundo de Gaveta Padrão na Abertura (R$)
              </label>
              <input
                type="number"
                step="5"
                min="0"
                value={openingDrawer}
                onChange={(e) => setOpeningDrawer(parseFloat(e.target.value) || 0)}
                className="glass-input w-full px-3 py-2 rounded-lg font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Valor padrão sugerido ao abrir o fechamento diário de caixa.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Dias Operados Estimados por Mês
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={operationalDays}
                onChange={(e) => setOperationalDays(parseInt(e.target.value) || 30)}
                className="glass-input w-full px-3 py-2 rounded-lg font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Base para estimativa mensal de consumo de insumos como carvão e gás.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Consumo Padrão de Carvão (Sacos / Dia)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={coalBags}
                onChange={(e) => setCoalBags(parseFloat(e.target.value) || 1)}
                className="glass-input w-full px-3 py-2 rounded-lg font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Padrão informado: 1 saco por dia operado.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Preço de Custo por Saco de Carvão (R$)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={coalPrice}
                onChange={(e) => setCoalPrice(parseFloat(e.target.value) || 10.8)}
                className="glass-input w-full px-3 py-2 rounded-lg font-mono text-stone-900"
              />
              <span className="text-[10px] text-stone-400 block mt-1">
                Pacote com 5 sacos por R$ 54,00 (R$ 10,80/saco).
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            {saveSuccess ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Parâmetros salvos com sucesso!
              </span>
            ) : (
              <span className="text-stone-400 text-[11px]">
                As alterações têm efeito imediato nas métricas calculadas.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Salvar Parâmetros
            </button>
          </div>
        </form>
      </div>

      {/* Database Stats & Reset Section */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-200">
          <RotateCcw className="w-4 h-4 text-stone-500" />
          <h4 className="text-sm font-bold text-stone-900">Estatísticas do Banco Local e Redefinição</h4>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Itens do Cardápio:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">{products.length}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Itens no Estoque:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">{stockItems.length}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Vendas Registradas:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">{sales.length}</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-stone-200">
            <span className="text-stone-500 block">Lançamentos Financeiros:</span>
            <span className="font-mono font-bold text-stone-900 text-sm">{transactions.length}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-800 block">
              Redefinir para os Dados Originais da Especificação
            </span>
            <span className="text-[11px] text-stone-500">
              Restaura a base com os produtos e despesas do Xamã na Brasa, limpando movimentações criadas.
            </span>
          </div>

          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Restaurar Dados Originais
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-bold">Confirma a limpeza?</span>
              <button
                onClick={() => {
                  resetToDefaultData();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Sim, Limpar e Restaurar
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
