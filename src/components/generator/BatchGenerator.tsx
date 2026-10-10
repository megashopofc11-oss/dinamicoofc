import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { ModelCalibration, Batch, Plaque } from '../../types';
import { OFFICIAL_MODELS } from '../../config/models';
import { formatSequence, sanitizeUrl } from '../../utils/formatters';
import { BatchStack3DIcon, Layers3DIcon } from '../common/Icons3D';
import {
  Layers,
  Sparkles,
  Check,
  AlertCircle,
  Link as LinkIcon,
  Printer,
  ChevronRight,
  ShieldCheck,
  Tag,
  Clock
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

  // Load models & latest sequence counter from Firestore
  useEffect(() => {
    const load = async () => {
      try {
        const dbModels = await storageService.getModelCalibrations();
        if (dbModels && dbModels.length > 0) setModels(dbModels);

        const stats = await storageService.getSystemStats();
        setNextSeqStart(stats.totalPlaques + 1);
      } catch (err) {
        console.warn('Erro ao carregar dados iniciais:', err);
      }
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
    setProgressMsg('Reservando numeração sequencial atômica no Cloud Firestore...');

    try {
      const defaultName = batchName.trim() || `Lote ${selectedModel.name.split(' - ')[1] || selectedModel.name} (${quantity} un)`;

      setProgressMsg('Gravando registros leves do lote e identificadores únicos de QR...');

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

      setProgressMsg('Lote registrado com sucesso no banco de dados!');
      setGenerating(false);
      onBatchCreated(batch, plaques);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Falha ao processar e salvar o lote no Firestore.');
      setGenerating(false);
    }
  };

  const nextSeqEnd = nextSeqStart + quantity - 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header with 3D Plaque Icon */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-zinc-800 pb-7">
        <div className="flex items-start space-x-4">
          <div className="hidden sm:block shrink-0 mt-1">
            <BatchStack3DIcon size={56} />
          </div>
          <div>
            <div className="flex items-center space-x-2 text-red-500 font-extrabold text-xs uppercase tracking-wider mb-1">
              <span>Gerador de Lotes 3D Premium</span>
            </div>
            <h1 className="text-3xl font-black text-white font-['Outfit'] tracking-tight">
              Criar Lote de Plaquinhas NFC & QR
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Escolha o modelo oficial, defina a tiragem e reserve numeração sequencial atômica sem duplicações.
            </p>
          </div>
        </div>

        <button
          onClick={onGoToBatches}
          className="self-start md:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-all shadow-md"
        >
          <Layers3DIcon size={18} />
          <span>Ver Meus Lotes Criados</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center space-x-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Step 1: Select Model */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-red-600/30">
                1
              </span>
              <h2 className="text-xl font-bold text-white font-['Outfit']">Escolha o Modelo Oficial (10×10 cm)</h2>
            </div>
            <span className="text-xs text-zinc-400 font-medium">8 modelos oficiais pré-calibrados</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {models.map((mod) => {
              const isSelected = mod.id === selectedModelId;
              return (
                <div
                  key={mod.id}
                  onClick={() => setSelectedModelId(mod.id)}
                  className={`relative group cursor-pointer rounded-3xl p-3.5 border transition-all ${
                    isSelected
                      ? 'bg-zinc-900/90 border-red-500 shadow-2xl shadow-red-500/15 glow-red-sm ring-1 ring-red-500'
                      : 'bg-[#121217]/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                  }`}
                >
                  {/* Selection Badge */}
                  {isSelected && (
                    <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}

                  {/* Artwork Preview Card */}
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 mb-3 shadow-inner">
                    <img
                      src={mod.customBaseUrl || mod.originalUrl}
                      alt={mod.name}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-black/70 text-zinc-200 backdrop-blur-md border border-white/10">
                        {mod.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-white truncate">{mod.name}</h3>
                    <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{mod.description}</p>
                    <div className="flex items-center space-x-1 mt-2 text-[10px] text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Calibração Exata</span>
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
          <div className="rounded-3xl bg-[#121217] border border-zinc-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-red-600/30">
                2
              </span>
              <h3 className="text-base font-bold text-white font-['Outfit']">Quantidade de Plaquinhas</h3>
            </div>

            {/* Quick preset buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[4, 8, 12, 20, 40, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setQuantity(qty)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
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
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Ou informe a quantidade:</label>
              <input
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-bold focus:outline-none focus:border-red-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center">
                <Printer className="w-3 h-3 mr-1" />
                Dica de impressão: 4 plaquinhas por folha A4 (10×10 cm).
              </p>
            </div>
          </div>

          {/* Batch Name & Destination */}
          <div className="md:col-span-2 rounded-3xl bg-[#121217] border border-zinc-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center space-x-2.5">
              <span className="w-7 h-7 rounded-full bg-red-600 text-white font-black text-xs flex items-center justify-center shadow-lg shadow-red-600/30">
                3
              </span>
              <h3 className="text-base font-bold text-white font-['Outfit']">Identificação e Destino do QR Code</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Lote (Opcional)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    placeholder="Ex: Restaurante Brasil - Mesas"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Link Inicial de Destino (Editável depois)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://instagram.com/seuperfil"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Sequence Reservation Forecast Box */}
            <div className="p-4 rounded-2xl bg-zinc-950/90 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-white flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                  Previsão de Numeração Sequencial Única:
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Reserva transacional atômica no banco, sem PDFs prévios ou arquivos duplicados.
                </p>
              </div>
              <div className="text-right">
                <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-red-500/30 text-red-400 font-mono font-black text-xs tracking-wider">
                  Nº {formatSequence(nextSeqStart)} até Nº {formatSequence(nextSeqEnd)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button & Progress */}
        <div className="pt-2">
          {generating ? (
            <div className="p-8 rounded-3xl bg-[#121217] border border-red-500/40 text-center space-y-4 glow-red-sm">
              <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-base font-bold text-white">{progressMsg}</p>
              <p className="text-xs text-zinc-400">Gravando no Firestore com integridade transacional...</p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={generating || !isActive}
              className="w-full btn-3d-red py-4 rounded-2xl text-white font-black text-base tracking-wider flex items-center justify-center space-x-3 shadow-2xl disabled:opacity-50"
            >
              <BatchStack3DIcon size={28} />
              <span>GERAR LOTE DE {quantity} PLAQUINHA{quantity > 1 ? 'S' : ''} (10×10 CM)</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
