import React, { useEffect, useState } from 'react';
import { storageService } from '../../services/storage';
import { sanitizeUrl } from '../../utils/formatters';
import { Zap, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';

interface RedirectHandlerProps {
  plaqueId: string;
}

export const RedirectHandler: React.FC<RedirectHandlerProps> = ({ plaqueId }) => {
  const [destinationUrl, setDestinationUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(1);

  useEffect(() => {
    let timer: any;

    const processRedirect = async () => {
      try {
        const dest = await storageService.recordScanAndGetDestination(plaqueId);
        const cleanDest = sanitizeUrl(dest || 'https://google.com');
        setDestinationUrl(cleanDest);

        // Immediate redirect after brief confirmation
        timer = setTimeout(() => {
          window.location.replace(cleanDest);
        }, 800);
      } catch (err: any) {
        console.error('Erro no redirecionamento:', err);
        setError('Plaquinha não encontrada ou link inativo.');
      }
    };

    if (plaqueId) {
      processRedirect();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [plaqueId]);

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#121217] border border-red-500/30 p-8 shadow-2xl text-center space-y-6 glow-red-sm">
        {/* Brand Icon */}
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 shadow-xl shadow-red-500/25 border border-red-400/30 mx-auto">
          <Zap className="w-8 h-8 text-white animate-pulse" />
        </div>

        <div>
          <h1 className="text-2xl font-black text-white font-['Outfit'] tracking-wide">
            DINÂMICO <span className="text-red-500">PRO</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mr-1" />
            Redirecionamento Seguro de Plaquinha NFC / QR
          </p>
        </div>

        {error ? (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs space-y-2">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="font-bold">{error}</p>
            <p className="text-zinc-500">Verifique se o código escaneado está correto.</p>
          </div>
        ) : destinationUrl ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 text-left space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-bold">
                Destino Programado:
              </span>
              <p className="font-mono text-xs text-white truncate font-semibold">
                {destinationUrl}
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-zinc-400">
                Redirecionando automaticamente...
              </p>
            </div>

            <a
              href={destinationUrl}
              className="btn-3d-red w-full py-3 rounded-xl text-white font-bold text-xs tracking-wider inline-flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>ACESSAR AGORA</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="py-6 space-y-3">
            <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400">Consultando destino no banco de dados...</p>
          </div>
        )}

        <div className="pt-4 border-t border-zinc-800/80 text-[10px] text-zinc-600">
          Tecnologia DINÂMICO PRO • Plaquinhas Inteligentes 10×10 cm
        </div>
      </div>
    </div>
  );
};
