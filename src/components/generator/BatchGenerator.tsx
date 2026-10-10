import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { ModelCalibration, Batch, Plaque } from '../../types';
import { OFFICIAL_MODELS } from '../../config/models';
import { formatSequence, sanitizeUrl, isValidUrl } from '../../utils/formatters';
import {
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Link as LinkIcon,
  HelpCircle,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';

interface BatchGeneratorProps {
  onBatchCreated: (batch: Batch, plaques: Plaque[]) => void;
  onGoToBatches: () => void;
}

export const BatchGenerator: React.FC<BatchGeneratorProps> = ({
  onBatchCreated,
  onGoToBatches,
}) => {
  const { user, isActive, isPending, isBlocked } = useAuth();
  const [models, setModels] = useState<ModelCalibration[]>(OFFICIAL_MODELS);
  const [selectedModelId, setSelectedModelId] = useState<number>(1);
  const [quantity, setQuantity] = useState<number>(4);
  const [batchName, setBatchName] = useState<string>('');
  const [destinationUrl, setDestinationUrl] = useState<string>('https://instagram.com');
  const [generating, setGenerating] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [nextSeqStart, setNextSeqStart] = useState<number>(1);

  // Load models & latest sequence counter
  useEffect(() => {
    const load = async () => {
      const dbModels = await storageService.getModelCalibrations();
      if (dbModels && dbModels.length > 0) setModels(dbModels);

      const stats = await storageService.getSystemStats();
      // Estimate next sequence number
      setNextSeqStart(stats.totalPlaques + 1);
    };
    load();
  }, []);

  const selectedModel = models.find((m) => m.id === selectedModelId) || models[0];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError('Você precisa estar autenticado para gerar um lote.');
      return;
    }

    if (!isActive) {
      setError('Sua conta não tem autorização ativa para gerar lotes. Aguarde a aprovação do administrador.');
      return;
    }

    if (quantity < 1 || quantity > 500) {
      setError('A quantidade deve ser entre 1 e 500 plaquinhas por lote.');
      return;
    }

    setGenerating(true);
    setProgressMsg('Reservando numeração sequencial transacional...');

    try {
      await new Promise((r) => setTimeout(r, 400));
      setProgressMsg('Criando identificadores únicos permanentes para os QR Codes...');

      const defaultName = batchName.trim() || `Lote ${selectedModel.name.split(' - ')[1] || selectedModel.name} (${quantity} un)`;

      const { batch, plaques } = await storageService.createBatch(
        {
          name: defaultName,
          userId: user.uid,
          userEmail: user.email,
          modelId: selectedModel.id,
          modelName: selectedModel.name,
          quantity,
        },
        destinationUrl
      );

      setProgressMsg('Finalizando gravação no banco de dados...');
      await new Promise((r) => setTimeout(r, 300));

      setGenerating(false);
      onBatchCreated(batch, plaques);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao processar e salvar o lote.');
      setGenerating(false);
    }
  };

  const nextSeqEnd = nextSeqStart + quantity - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4" />
            <span>Gerador Oficial de Lotes</span>
          </div>
          <h1 className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
            Criar Lote de Plaquinhas NFC & QR
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Escolha o modelo oficial, defina a tiragem e gere QR Codes permanentes com numeração sequencial única.
          </p>
        </div>

        <button
          onClick={onGoToBatches}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all"
        >
          <Layers className="w-4 h-4" />
          <span>Ver Meus Lotes Criados</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Step 1: Select Model */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h2 className="text-lg font-bold text-white font-['Outfit']">Escolha o Modelo Oficial (10×10 cm)</h2>
            </div>
            <span className="text-xs text-zinc-400">8 modelos com substituição limpa de QR</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {models.map((mod) => {
              const isSelected = mod.id === selectedModelId;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModelId(mod.id)}
                  className={`relative group cursor-pointer rounded-2xl p-3 border transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-red-500 shadow-xl shadow-red-500/10 glow-red-sm ring-1 ring-red-500'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  {/* Selection badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Artwork Preview Card (Square 1:1) */}
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-black border border-zinc-800 mb-3">
                    <img
                      src={mod.customBaseUrl || mod.originalUrl}
                      alt={mod.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={(e) => {
                        // Fallback illustration
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 text-zinc-300 backdrop-blur-sm border border-white/10">
                        {mod.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{mod.name}</h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{mod.description}</p>
                    <div className="flex items-center space-x-1 mt-2 text-[10px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Calibrado & Limpo</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Batch Config & Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quantity Selector */}
          <div className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">Quantidade de Plaquinhas</h3>
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[4, 8, 12, 20, 40, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all ${
                    quantity === qty
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {qty} un {qty % 4 === 0 && <span className="text-[9px] opacity-75">({qty / 4} folha{qty > 4 ? 's' : ''})</span>}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Ou digite uma tiragem:</label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1 flex items-center">
                <Printer className="w-3 h-3 mr-1" />
                Dica de impressão: 4 plaquinhas preenchem exatamente 1 folha A4.
              </p>
            </div>
          </div>

          {/* Batch Name & Destination */}
          <div className="md:col-span-2 rounded-2xl bg-zinc-900/60 border border-zinc-800 p-5 space-y-4">
            <div className="flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="text-sm font-bold text-white font-['Outfit']">Identificação e Destino do QR Code</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome / Referência do Lote (Opcional)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Ex: Restaurante Sabor Brasil - Mesas"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Link Inicial de Destino (Editável depois)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://instagram.com/seuperfil"
                    className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
            </div>

            {/* Sequence Reservation Forecast Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                  Previsão de Numeração Sequencial Única:
                </p>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Garantia de numeração contínua sem repetição em toda a plataforma.
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-lg bg-zinc-900 border border-red-500/30 text-red-400 font-mono font-bold text-xs tracking-wider">
                  Nº {formatSequence(nextSeqStart)} até Nº {formatSequence(nextSeqEnd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button & Progress */}
        <div className="pt-2">
          {generating ? (
            <div className="p-6 rounded-2xl bg-[#121217] border border-red-500/40 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-bold text-white">{progressMsg}</p>
              <div className="w-full max-w-md mx-auto bg-zinc-800 h-2 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-red-600 to-rose-500 h-full w-2/3 animate-pulse" />
              </div>
              <p className="text-xs text-zinc-400">Por favor, não feche a janela enquanto a numeração é reservada.</p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={generating || !isActive}
              className="w-full btn-3d-red py-4 rounded-2xl text-white font-extrabold text-base tracking-wide flex items-center justify-center space-x-3 shadow-2xl disabled:opacity-50"
            >
              <Zap className="w-5 h-5" />
              <span>GERAR LOTE DE {quantity} PLAQUINHA{quantity > 1 ? 'S' : ''} AGORA</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
