import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { downloadBatchPdfA4, downloadBatchZip, ExportProgress } from '../../services/exporter';
import { Batch, ModelCalibration, Plaque } from '../../types';
import { formatDate, formatSequence } from '../../utils/formatters';
import { BatchStack3DIcon, Layers3DIcon } from '../common/Icons3D';
import {
  Layers,
  FileArchive,
  FileText,
  Eye,
  Calendar,
  Hash,
  Sparkles,
  Download,
  AlertCircle,
  PlusCircle,
  Search
} from 'lucide-react';

interface BatchListProps {
  onSelectBatch: (batch: Batch) => void;
  onGoToGenerator: () => void;
}

export const BatchList: React.FC<BatchListProps> = ({
  onSelectBatch,
  onGoToGenerator,
}) => {
  const { user, isAdmin } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [models, setModels] = useState<ModelCalibration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Progress modal state
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportingType, setExportingType] = useState<'zip' | 'pdf' | null>(null);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [userBatches, allModels] = await Promise.all([
        storageService.getUserBatches(user.uid, isAdmin),
        storageService.getModelCalibrations()
      ]);
      setBatches(userBatches);
      setModels(allModels);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('dinamico_store_changed', loadData);
    return () => window.removeEventListener('dinamico_store_changed', loadData);
  }, [user, isAdmin]);

  const handleDownloadZip = async (batch: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    const model = models.find((m) => m.id === batch.modelId) || models[0];
    const plaques = await storageService.getBatchPlaques(batch.id);

    setExportingType('zip');
    setExportProgress({ current: 0, total: plaques.length, percentage: 0, statusText: 'Iniciando geração de ZIP...' });

    try {
      await downloadBatchZip(batch, model, plaques, (prog) => {
        setExportProgress(prog);
      });
      setTimeout(() => {
        setExportProgress(null);
        setExportingType(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar arquivo ZIP.');
      setExportProgress(null);
      setExportingType(null);
    }
  };

  const handleDownloadPdf = async (batch: Batch, e: React.MouseEvent) => {
    e.stopPropagation();
    const model = models.find((m) => m.id === batch.modelId) || models[0];
    const plaques = await storageService.getBatchPlaques(batch.id);

    setExportingType('pdf');
    setExportProgress({ current: 0, total: plaques.length, percentage: 0, statusText: 'Iniciando montagem do PDF A4...' });

    try {
      await downloadBatchPdfA4(batch, model, plaques, (prog) => {
        setExportProgress(prog);
      });
      setTimeout(() => {
        setExportProgress(null);
        setExportingType(null);
      }, 1500);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF de impressão.');
      setExportProgress(null);
      setExportingType(null);
    }
  };

  const filteredBatches = batches.filter((b) =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(b.startSequenceNumber).includes(searchTerm)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-black text-white font-['Outfit']">
            {isAdmin ? 'Lotes da Plataforma' : 'Meus Lotes de Plaquinhas'}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Gerencie suas tiragens, edite links de destino e baixe arquivos ZIP e PDF para impressão em tamanho real.
          </p>
        </div>

        <button
          onClick={onGoToGenerator}
          className="btn-3d-red self-start sm:self-auto flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white font-bold text-xs tracking-wider shadow-lg"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NOVO LOTE</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar lote por nome, modelo ou número sequencial..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
        <div className="text-xs text-zinc-400 font-semibold px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
          Total: <span className="text-white">{filteredBatches.length}</span> lote{filteredBatches.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Batch Cards Grid */}
      {loading ? (
        <div className="text-center py-16 space-y-3">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-[#121217]/50 border border-zinc-800/80 p-8 space-y-5">
          <div className="flex justify-center">
            <BatchStack3DIcon size={64} />
          </div>
          <h3 className="text-xl font-bold text-white font-['Outfit']">Nenhum lote gerado ainda</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Você ainda não criou nenhum lote de plaquinhas. Escolha um dos 8 modelos oficiais e inicie sua primeira tiragem com QR Codes dinâmicos!
          </p>
          <button
            onClick={onGoToGenerator}
            className="btn-3d-red px-6 py-3 rounded-2xl text-white font-bold text-xs inline-flex items-center space-x-2 shadow-xl"
          >
            <BatchStack3DIcon size={18} />
            <span>Gerar Meu Primeiro Lote</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch) => {
            const model = models.find((m) => m.id === batch.modelId);
            return (
              <div
                key={batch.id}
                onClick={() => onSelectBatch(batch)}
                className="group cursor-pointer rounded-2xl bg-[#121217] border border-zinc-800/90 hover:border-red-500/50 hover:shadow-xl hover:shadow-red-500/5 transition-all p-5 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 uppercase tracking-wider">
                      {model?.category || 'Modelo'}
                    </span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                      Nº {formatSequence(batch.startSequenceNumber)} - {formatSequence(batch.endSequenceNumber)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                    {batch.name}
                  </h3>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">{batch.modelName}</p>

                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{formatDate(batch.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-1.5 justify-end">
                      <Hash className="w-3.5 h-3.5 text-zinc-500" />
                      <span className="font-bold text-white">{batch.quantity} plaquinha{batch.quantity > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectBatch(batch)}
                    className="flex-1 flex items-center justify-center space-x-1 py-2 px-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Abrir</span>
                  </button>

                  <button
                    onClick={(e) => handleDownloadZip(batch, e)}
                    title="Baixar ZIP com todas as imagens PNG individuais"
                    className="flex items-center justify-center space-x-1 py-2 px-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-red-500/40 text-zinc-200 text-xs font-semibold transition-all"
                  >
                    <FileArchive className="w-3.5 h-3.5 text-amber-400" />
                    <span>ZIP</span>
                  </button>

                  <button
                    onClick={(e) => handleDownloadPdf(batch, e)}
                    title="Baixar PDF A4 com 4 plaquinhas 10x10cm por folha"
                    className="btn-3d-red flex items-center justify-center space-x-1 py-2 px-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-md"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF A4</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Export Progress Modal */}
      {exportProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#121217] border border-red-500/40 p-6 shadow-2xl text-center space-y-4 glow-red-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 mx-auto">
              <Download className="w-6 h-6 animate-bounce" />
            </div>

            <h3 className="text-lg font-bold text-white font-['Outfit']">
              {exportingType === 'zip' ? 'Gerando Pacote ZIP de Alta Resolução' : 'Gerando PDF A4 para Impressão'}
            </h3>

            <p className="text-xs text-zinc-300">{exportProgress.statusText}</p>

            <div className="space-y-1">
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-red-600 to-rose-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                <span>{exportProgress.current} / {exportProgress.total}</span>
                <span>{exportProgress.percentage}%</span>
              </div>
            </div>

            <p className="text-[11px] text-zinc-500">
              Compondo plaquinhas 10×10 cm @ 300 DPI com QR Code dinâmico e numeração precisa...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
