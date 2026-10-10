import React, { useState, useEffect } from 'react';
import { Batch, ModelCalibration, Plaque } from '../../types';
import { storageService } from '../../services/storage';
import { downloadBatchPdfA4, downloadBatchZip, downloadSinglePlaquePng, ExportProgress } from '../../services/exporter';
import { renderPlaqueCanvas } from '../../services/renderer';
import { PlaqueEditModal } from './PlaqueEditModal';
import { formatDate, formatSequence } from '../../utils/formatters';
import { BatchStack3DIcon, Layers3DIcon } from '../common/Icons3D';
import {
  ArrowLeft,
  FileArchive,
  FileText,
  Download,
  ExternalLink,
  Edit3,
  Search,
  Layers,
  Sparkles,
  QrCode,
  Calendar,
  Hash,
  ShieldCheck
} from 'lucide-react';

interface BatchDetailProps {
  batch: Batch;
  onBack: () => void;
}

// Single Plaque Card with Canvas Preview
const PlaqueCard: React.FC<{
  plaque: Plaque;
  model: ModelCalibration;
  onEdit: (p: Plaque) => void;
}> = ({ plaque, model, onEdit }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const generateThumb = async () => {
      try {
        const canvas = await renderPlaqueCanvas(model, plaque, { width: 320, height: 320 });
        if (active) {
          setDataUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      } catch (err) {
        console.error('Thumb error:', err);
      }
    };
    generateThumb();
    return () => {
      active = false;
    };
  }, [plaque, model]);

  const seqStr = plaque.formattedNumber || formatSequence(plaque.sequenceNumber);

  return (
    <div className="group rounded-2xl bg-[#121217] border border-zinc-800/80 hover:border-red-500/40 p-4 transition-all flex flex-col justify-between space-y-3">
      {/* Plaque Canvas Thumbnail */}
      <div
        onClick={() => onEdit(plaque)}
        className="relative aspect-square w-full rounded-xl overflow-hidden bg-black border border-zinc-800/90 cursor-pointer flex items-center justify-center"
      >
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`Plaquinha ${seqStr}`}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-1 text-zinc-600">
            <QrCode className="w-8 h-8 animate-pulse text-zinc-500" />
            <span className="text-[10px]">Renderizando...</span>
          </div>
        )}

        <div className="absolute top-2 left-2">
          <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm border border-white/10 text-white font-mono font-bold text-[10px]">
            Nº {seqStr}
          </span>
        </div>

        <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="px-3 py-1 rounded-lg bg-black/80 text-white font-bold text-xs shadow-lg backdrop-blur-sm">
            Clique para Editar
          </span>
        </div>
      </div>

      {/* Info & Destination URL */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[11px] text-zinc-400 font-semibold truncate max-w-[150px]">
            {plaque.destinationUrl.replace(/^https?:\/\//i, '')}
          </span>
          <span className="text-[10px] text-zinc-500 font-mono">
            {plaque.scanCount || 0} scans
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-zinc-800/60 text-xs">
        <button
          onClick={() => onEdit(plaque)}
          className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white transition-all text-[11px] font-semibold"
          title="Editar link de destino"
        >
          <Edit3 className="w-3 h-3 text-red-400" />
          <span>Editar</span>
        </button>

        <a
          href={plaque.permanentUrl || `${window.location.origin}/r/${plaque.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all text-[11px] font-semibold"
          title="Testar QR Code dinâmico"
        >
          <ExternalLink className="w-3 h-3 text-emerald-400" />
          <span>Testar</span>
        </a>

        <button
          onClick={() => downloadSinglePlaquePng(model, plaque)}
          className="flex items-center justify-center space-x-1 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-zinc-300 hover:text-white transition-all text-[11px] font-semibold"
          title="Baixar PNG em alta definição (1181x1181 px)"
        >
          <Download className="w-3 h-3 text-red-400" />
          <span>PNG</span>
        </button>
      </div>
    </div>
  );
};

export const BatchDetail: React.FC<BatchDetailProps> = ({ batch, onBack }) => {
  const [model, setModel] = useState<ModelCalibration | null>(null);
  const [plaques, setPlaques] = useState<Plaque[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlaque, setEditingPlaque] = useState<Plaque | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 12;

  // Export progress
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportingType, setExportingType] = useState<'zip' | 'pdf' | null>(null);

  const loadBatchData = async () => {
    setLoading(true);
    try {
      const [allModels, batchPlaques] = await Promise.all([
        storageService.getModelCalibrations(),
        storageService.getBatchPlaques(batch.id),
      ]);
      const foundModel = allModels.find((m) => m.id === batch.modelId) || allModels[0];
      setModel(foundModel);
      setPlaques(batchPlaques);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatchData();
  }, [batch.id]);

  const handlePlaqueUpdated = (updated: Plaque) => {
    setPlaques((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPlaque(updated);
  };

  const handleDownloadZip = async () => {
    if (!model || plaques.length === 0) return;
    setExportingType('zip');
    setExportProgress({ current: 0, total: plaques.length, percentage: 0, statusText: 'Iniciando geração do ZIP...' });

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

  const handleDownloadPdf = async () => {
    if (!model || plaques.length === 0) return;
    setExportingType('pdf');
    setExportProgress({ current: 0, total: plaques.length, percentage: 0, statusText: 'Compondo folhas A4 (4 plaquinhas por página)...' });

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

  const filteredPlaques = plaques.filter((p) => {
    const seqStr = p.formattedNumber || formatSequence(p.sequenceNumber);
    return seqStr.includes(searchTerm) || p.destinationUrl.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredPlaques.length / pageSize) || 1;
  const paginatedPlaques = filteredPlaques.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & top bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-black text-white font-['Outfit']">{batch.name}</h1>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                {batch.quantity} un
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {batch.modelName} • Criado em {formatDate(batch.createdAt)}
            </p>
          </div>
        </div>

        {/* Global Batch Download Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadZip}
            className="flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-xs tracking-wider transition-all shadow-md"
          >
            <FileArchive className="w-4 h-4 text-amber-400" />
            <span>BAIXAR LOTE EM ZIP</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="btn-3d-red flex items-center space-x-2 py-2.5 px-4 rounded-xl text-white font-bold text-xs tracking-wider transition-all shadow-lg"
          >
            <FileText className="w-4 h-4" />
            <span>BAIXAR PDF A4 IMPRESSÃO</span>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-[#121217] border border-zinc-800/90 text-xs">
        <div>
          <span className="text-zinc-500 block">Intervalo Sequencial</span>
          <span className="text-white font-bold font-mono text-sm">
            Nº {formatSequence(batch.startSequenceNumber)} - {formatSequence(batch.endSequenceNumber)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Medida Física</span>
          <span className="text-white font-bold text-sm">10 × 10 cm (Quadrada)</span>
        </div>
        <div>
          <span className="text-zinc-500 block">Páginas A4 (4 por folha)</span>
          <span className="text-white font-bold text-sm">
            {Math.ceil(batch.quantity / 4)} folha{Math.ceil(batch.quantity / 4) > 1 ? 's' : ''}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 block">Resolução de Saída</span>
          <span className="text-emerald-400 font-bold text-sm">300 DPI (1181×1181 px)</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Filtrar por número da plaquinha ou link..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>

        {totalPages > 1 && (
          <div className="flex items-center space-x-2 text-xs">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40"
            >
              Anterior
            </button>
            <span className="text-zinc-400 font-mono">
              Página {page} de {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Plaques Grid */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-zinc-400">Carregando plaquinhas do lote...</p>
        </div>
      ) : model && paginatedPlaques.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {paginatedPlaques.map((plaque) => (
            <PlaqueCard
              key={plaque.id}
              plaque={plaque}
              model={model}
              onEdit={(p) => setEditingPlaque(p)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-zinc-500 text-sm">
          Nenhuma plaquinha corresponde ao filtro pesquisado.
        </div>
      )}

      {/* Plaque Edit Modal */}
      {editingPlaque && (
        <PlaqueEditModal
          isOpen={Boolean(editingPlaque)}
          onClose={() => setEditingPlaque(null)}
          plaque={editingPlaque}
          model={model}
          onPlaqueUpdated={handlePlaqueUpdated}
        />
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
              Garantindo posicionamento calibrado do QR Code e numeração legível...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
