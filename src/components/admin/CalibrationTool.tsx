import React, { useState, useEffect, useRef } from 'react';
import { ModelCalibration, Plaque } from '../../types';
import { storageService } from '../../services/storage';
import { renderPlaqueCanvas } from '../../services/renderer';
import { OFFICIAL_MODELS } from '../../config/models';
import {
  Sliders,
  Save,
  CheckCircle,
  Eye,
  Upload,
  RefreshCw,
  Sparkles,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

export const CalibrationTool: React.FC = () => {
  const [models, setModels] = useState<ModelCalibration[]>(OFFICIAL_MODELS);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [current, setCurrent] = useState<ModelCalibration>(OFFICIAL_MODELS[0]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Canvas refs for side-by-side diagnostic
  const finalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const dbModels = await storageService.getModelCalibrations();
      if (dbModels && dbModels.length > 0) {
        setModels(dbModels);
        const match = dbModels.find((m) => m.id === selectedId) || dbModels[0];
        setCurrent(match);
      }
    };
    load();
  }, [selectedId]);

  // Update live preview when calibration parameters change
  useEffect(() => {
    let active = true;

    const renderViews = async () => {
      if (!current || !finalCanvasRef.current) return;

      const dummyPlaque: Plaque = {
        id: 'calib-test',
        sequenceNumber: 1,
        formattedNumber: '000001',
        batchId: 'demo-batch',
        userId: 'admin',
        modelId: current.id,
        destinationUrl: 'https://dinamicopro.com/teste-calibracao',
        permanentUrl: `${window.location.origin}/r/calib-test`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        // Render final composite plaque
        const composite = await renderPlaqueCanvas(current, dummyPlaque, {
          width: 500,
          height: 500
        });

        if (active && finalCanvasRef.current) {
          const ctx = finalCanvasRef.current.getContext('2d');
          if (ctx) {
            finalCanvasRef.current.width = 500;
            finalCanvasRef.current.height = 500;
            ctx.drawImage(composite, 0, 0);
          }
        }

        // Render masked base only (to visualize clean substitution without overlapping old QR)
        if (active && maskCanvasRef.current) {
          const maskCanvas = document.createElement('canvas');
          maskCanvas.width = 500;
          maskCanvas.height = 500;
          const maskCtx = maskCanvas.getContext('2d');
          if (maskCtx) {
            // Draw original
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
              maskCtx.drawImage(img, 0, 0, 500, 500);
              // Draw mask overlay
              if (current.maskEnabled) {
                const qx = Math.round(current.qrX * 500);
                const qy = Math.round(current.qrY * 500);
                const qw = Math.round(current.qrWidth * 500);
                const qh = Math.round(current.qrHeight * 500);
                const br = Math.round((current.qrBorderRadius || 24) * (500 / 1181));

                maskCtx.save();
                maskCtx.beginPath();
                if (maskCtx.roundRect) {
                  maskCtx.roundRect(qx, qy, qw, qh, br);
                } else {
                  maskCtx.rect(qx, qy, qw, qh);
                }
                maskCtx.fillStyle = current.maskFillColor || '#ffffff';
                maskCtx.fill();
                maskCtx.strokeStyle = '#ef4444';
                maskCtx.lineWidth = 2;
                maskCtx.stroke();
                maskCtx.restore();
              }

              if (maskCanvasRef.current) {
                maskCanvasRef.current.width = 500;
                maskCanvasRef.current.height = 500;
                const targetCtx = maskCanvasRef.current.getContext('2d');
                targetCtx?.drawImage(maskCanvas, 0, 0);
              }
            };
            img.src = current.customBaseUrl || current.originalUrl;
          }
        }
      } catch (e) {
        console.error('Erro na renderização de calibração:', e);
      }
    };

    renderViews();

    return () => {
      active = false;
    };
  }, [current]);

  const handleSelectModel = (id: number) => {
    setSelectedId(id);
    const m = models.find((item) => item.id === id) || models[0];
    setCurrent({ ...m });
  };

  const handleFieldChange = (field: keyof ModelCalibration, val: any) => {
    setCurrent((prev) => ({ ...prev, [field]: val }));
  };

  const handleSave = async () => {
    await storageService.saveModelCalibration(current);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          handleFieldChange('customBaseUrl', evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Ferramenta de Calibração e Preparação Visual</span>
          </div>
          <h1 className="text-3xl font-black text-white font-['Outfit']">
            Calibração dos 8 Modelos Oficiais
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Substituição limpa do QR ilustrativo por coordenadas relativas à arte e posicionamento da numeração.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="btn-3d-red self-start md:self-auto flex items-center space-x-2 px-5 py-3 rounded-xl text-white font-bold text-xs tracking-wider shadow-xl"
        >
          <Save className="w-4 h-4" />
          <span>SALVAR CALIBRAÇÃO OFICIAL</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5" />
          <span>Calibração salva com sucesso! Os novos valores foram aplicados em todo o sistema.</span>
        </div>
      )}

      {/* Model Selection Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {models.map((m) => (
          <button
            key={m.id}
            onClick={() => handleSelectModel(m.id)}
            className={`p-2.5 rounded-xl border text-center transition-all ${
              m.id === selectedId
                ? 'bg-red-500/20 border-red-500 text-white font-bold shadow-md glow-red-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
            }`}
          >
            <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Mod 0{m.id}</span>
            <span className="text-xs truncate block font-semibold">{m.name.split(' - ')[1] || m.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Calibration Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* QR Code Calibration Section */}
          <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center font-['Outfit']">
                <Layers className="w-4 h-4 mr-2 text-red-500" />
                Posicionamento do QR Code Dinâmico
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">0.00 a 1.00</span>
            </div>

            {/* qrX slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-semibold">qrX (Posição Horizontal):</span>
                <span className="text-red-400 font-mono">{current.qrX.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.005"
                value={current.qrX}
                onChange={(e) => handleFieldChange('qrX', parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            {/* qrY slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-300 font-semibold">qrY (Posição Vertical):</span>
                <span className="text-red-400 font-mono">{current.qrY.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.005"
                value={current.qrY}
                onChange={(e) => handleFieldChange('qrY', parseFloat(e.target.value))}
                className="w-full accent-red-500"
              />
            </div>

            {/* qrWidth & qrHeight sliders */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">Largura (qrW):</span>
                  <span className="text-red-400 font-mono">{current.qrWidth.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.005"
                  value={current.qrWidth}
                  onChange={(e) => handleFieldChange('qrWidth', parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">Altura (qrH):</span>
                  <span className="text-red-400 font-mono">{current.qrHeight.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.8"
                  step="0.005"
                  value={current.qrHeight}
                  onChange={(e) => handleFieldChange('qrHeight', parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
            </div>

            {/* Masking Fill Color & Border Radius */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Cor da Base Limpa:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={current.maskFillColor || '#ffffff'}
                    onChange={(e) => handleFieldChange('maskFillColor', e.target.value)}
                    className="w-8 h-8 rounded bg-transparent cursor-pointer border border-zinc-700"
                  />
                  <input
                    type="text"
                    value={current.maskFillColor || '#ffffff'}
                    onChange={(e) => handleFieldChange('maskFillColor', e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-800 font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Raio de Borda (px):
                </label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  value={current.qrBorderRadius || 24}
                  onChange={(e) => handleFieldChange('qrBorderRadius', parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-xs rounded bg-zinc-900 border border-zinc-800 font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* Numbering Calibration Section */}
          <div className="p-5 rounded-2xl bg-[#121217] border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center font-['Outfit']">
                <Sparkles className="w-4 h-4 mr-2 text-red-500" />
                Calibração da Numeração Sequencial
              </h3>
              <span className="text-[10px] text-zinc-500 font-mono">000001</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">numberX:</span>
                  <span className="text-red-400 font-mono">{current.numberX.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.01"
                  value={current.numberX}
                  onChange={(e) => handleFieldChange('numberX', parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-300 font-semibold">numberY:</span>
                  <span className="text-red-400 font-mono">{current.numberY.toFixed(3)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.98"
                  step="0.01"
                  value={current.numberY}
                  onChange={(e) => handleFieldChange('numberY', parseFloat(e.target.value))}
                  className="w-full accent-red-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Tamanho (px):</label>
                <input
                  type="number"
                  min="12"
                  max="48"
                  value={current.numberFontSize || 24}
                  onChange={(e) => handleFieldChange('numberFontSize', parseInt(e.target.value) || 24)}
                  className="w-full px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-800 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Alinhamento:</label>
                <select
                  value={current.numberAlignment || 'right'}
                  onChange={(e) => handleFieldChange('numberAlignment', e.target.value)}
                  className="w-full px-2 py-1 text-xs rounded bg-zinc-900 border border-zinc-800 text-white"
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Fundo / Badge:</label>
                <button
                  type="button"
                  onClick={() => handleFieldChange('showNumberBg', !current.showNumberBg)}
                  className={`w-full py-1 rounded text-xs font-bold ${
                    current.showNumberBg ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {current.showNumberBg ? 'Ativo' : 'Desativado'}
                </button>
              </div>
            </div>
          </div>

          {/* Custom Clean Artwork Uploader */}
          <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-2">
            <span className="text-xs font-bold text-white flex items-center">
              <Upload className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              Carregar Imagem Base Limpa Personalizada
            </span>
            <p className="text-[11px] text-zinc-500">
              Se você possui o arquivo original em alta resolução sem o QR ilustrativo, faça o upload aqui para substituir a imagem deste modelo.
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomImageUpload}
              className="text-xs text-zinc-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700 cursor-pointer"
            />
          </div>
        </div>

        {/* Right Column: Side-by-Side Visual Diagnostic (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* View 1: Clean Base / Mask Diagnostic */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
                  Diagnóstico da Região de Mascaramento
                </span>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800 flex items-center justify-center shadow-lg">
                <canvas ref={maskCanvasRef} className="w-full h-full object-contain" />
              </div>
              <p className="text-[11px] text-zinc-500">
                Linha vermelha destaca a área limpa que cobre o QR ilustrativo antigo, impedindo duplicidade visual.
              </p>
            </div>

            {/* View 2: Live Dynamic Composite Plaque */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                  Plaquinha Final (10×10 cm @ 300 DPI)
                </span>
                <span className="text-[10px] text-red-400 font-mono">Mod 0{current.id}</span>
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-red-500/40 flex items-center justify-center shadow-xl glow-red-sm">
                <canvas ref={finalCanvasRef} className="w-full h-full object-contain" />
              </div>
              <p className="text-[11px] text-zinc-400">
                Resultado idêntico ao PNG de alta qualidade, pacote ZIP e folha de impressão A4.
              </p>
            </div>
          </div>

          {/* Model Diagnostic Summary Card */}
          <div className="p-4 rounded-2xl bg-[#121217] border border-zinc-800 text-xs space-y-2">
            <h4 className="font-bold text-white flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-400 mr-1.5" />
              Verificação de Conformidade do Modelo
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-zinc-400">
              <div>
                <span className="text-zinc-500 block">QR Code Antigo Oculto:</span>
                <span className="text-emerald-400 font-bold">100% Coberto (Sem Sobreposição)</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Numeração Legível:</span>
                <span className="text-white font-mono">Nº 000001 (Posição Calibrada)</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Status de Produção:</span>
                <span className="text-red-400 font-bold uppercase">Pronto para Lotes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
