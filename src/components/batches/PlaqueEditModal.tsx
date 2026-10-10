import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { renderPlaqueCanvas } from '../../services/renderer';
import { downloadSinglePlaquePng } from '../../services/exporter';
import { ModelCalibration, Plaque } from '../../types';
import { formatSequence, isValidUrl, sanitizeUrl } from '../../utils/formatters';
import {
  X,
  Link as LinkIcon,
  ExternalLink,
  Download,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  QrCode,
  Sparkles
} from 'lucide-react';

interface PlaqueEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  plaque: Plaque | null;
  model: ModelCalibration | null;
  onPlaqueUpdated: (updated: Plaque) => void;
}

export const PlaqueEditModal: React.FC<PlaqueEditModalProps> = ({
  isOpen,
  onClose,
  plaque,
  model,
  onPlaqueUpdated,
}) => {
  const { user, isAdmin } = useAuth();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (plaque) {
      setDestinationUrl(plaque.destinationUrl || '');
      setSavedSuccess(false);
      setError(null);
    }
  }, [plaque]);

  // Live Canvas Rendering
  useEffect(() => {
    let active = true;
    const renderPreview = async () => {
      if (!plaque || !model || !canvasRef.current) return;
      try {
        const previewCanvas = await renderPlaqueCanvas(model, plaque, {
          width: 600,
          height: 600
        });

        if (active && canvasRef.current) {
          const targetCtx = canvasRef.current.getContext('2d');
          if (targetCtx) {
            canvasRef.current.width = 600;
            canvasRef.current.height = 600;
            targetCtx.drawImage(previewCanvas, 0, 0);
          }
        }
      } catch (err) {
        console.error('Erro ao renderizar prévia do canvas:', err);
      }
    };

    if (isOpen && plaque && model) {
      renderPreview();
    }

    return () => {
      active = false;
    };
  }, [isOpen, plaque, model]);

  if (!isOpen || !plaque || !model) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const clean = sanitizeUrl(destinationUrl);
    if (!isValidUrl(clean)) {
      setError('Por favor insira uma URL válida (ex: https://instagram.com/perfil).');
      return;
    }

    setSaving(true);
    try {
      const updated = await storageService.updatePlaqueDestination(
        plaque.id,
        clean,
        user.uid,
        isAdmin
      );
      setSaving(false);
      setSavedSuccess(true);
      onPlaqueUpdated(updated);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar novo destino.');
      setSaving(false);
    }
  };

  const handleTestRedirect = () => {
    // Open dynamic route in new tab
    const url = plaque.permanentUrl || `${window.location.origin}/r/${plaque.id}`;
    window.open(url, '_blank');
  };

  const handleDownloadPng = async () => {
    if (model && plaque) {
      await downloadSinglePlaquePng(model, plaque);
    }
  };

  const formattedSeq = plaque.formattedNumber || formatSequence(plaque.sequenceNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#121217] border border-zinc-800 p-6 md:p-8 shadow-2xl glow-red-sm max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white font-['Outfit']">
                Plaquinha Nº {formattedSeq}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                10 × 10 cm
              </span>
            </div>
            <p className="text-xs text-zinc-400">{model.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Live Preview Canvas */}
          <div className="space-y-3">
            <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-xl flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
                width={600}
                height={600}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="flex items-center">
                <Sparkles className="w-3.5 h-3.5 text-red-400 mr-1" />
                Prévia Idêntica ao Arquivo de Impressão
              </span>
              <button
                type="button"
                onClick={handleDownloadPng}
                className="text-red-400 hover:text-red-300 font-semibold inline-flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PNG</span>
              </button>
            </div>
          </div>

          {/* Details & Destination URL Editor */}
          <div className="space-y-5">
            {/* Permanent Link Info Box */}
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center">
                  <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                  URL Permanente do QR (Imutável)
                </span>
                <span className="text-[10px] text-zinc-500">Gravada na plaquinha</span>
              </div>
              <p className="font-mono text-xs text-red-400 break-all select-all p-2 rounded bg-zinc-900 border border-zinc-800">
                {plaque.permanentUrl || `${window.location.origin}/r/${plaque.id}`}
              </p>
              <p className="text-[11px] text-zinc-400 leading-tight">
                Mesmo depois de impressa e colada no balcão, a plaquinha sempre continuará funcionando!
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {savedSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-2 text-emerald-400 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>Destino atualizado com sucesso! Teste o QR para conferir.</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Link de Destino Atual (Editável a qualquer momento)
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={destinationUrl}
                    onChange={(e) => setDestinationUrl(e.target.value)}
                    placeholder="https://instagram.com/seuperfil"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Exemplos: perfil no Instagram, página do Google Avaliações, WhatsApp (wa.me/...), Cardápio Digital ou Chave Pix.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-3d-red py-3 rounded-xl text-white font-bold text-xs tracking-wider flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'SALVANDO...' : 'SALVAR NOVO LINK'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestRedirect}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs tracking-wider flex items-center justify-center space-x-2 transition-all border border-zinc-700"
                >
                  <ExternalLink className="w-4 h-4 text-emerald-400" />
                  <span>TESTAR QR (ABRIR LINK)</span>
                </button>
              </div>
            </form>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex justify-between">
                <span>Total de Leituras/Scans:</span>
                <span className="font-bold text-white">{plaque.scanCount || 0} acessos</span>
              </div>
              <div className="flex justify-between">
                <span>Criada em:</span>
                <span className="text-zinc-300">{new Date(plaque.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
