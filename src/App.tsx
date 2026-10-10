import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/auth';
import { Navbar } from './components/common/Navbar';
import { BatchGenerator } from './components/generator/BatchGenerator';
import { BatchList } from './components/batches/BatchList';
import { BatchDetail } from './components/batches/BatchDetail';
import { AdminPanel } from './components/admin/AdminPanel';
import { CalibrationTool } from './components/admin/CalibrationTool';
import { DiagnosticSuite } from './components/admin/DiagnosticSuite';
import {
  LoginModal,
  RegisterModal,
  ForgotPasswordModal,
  PendingApprovalNotice,
  BlockedNotice
} from './components/auth/AuthModals';
import { RedirectHandler } from './components/redirect/RedirectHandler';
import { Batch, Plaque } from './types';
import { BatchStack3DIcon, Layers3DIcon, QrCodes3DIcon, Export3DIcon } from './components/common/Icons3D';
import { ArrowRight, ShieldCheck, Zap, Lock } from 'lucide-react';

function MainApp() {
  const { user, isAdmin, isActive, isPending, isBlocked, loading } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'generator' | 'batches' | 'admin' | 'calibration' | 'diagnostics'>('batches');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Auth Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Auto-redirect admin to 'admin' tab when authenticated
  useEffect(() => {
    if (isAdmin) {
      setActiveTab('admin');
    } else if (isActive && activeTab === 'admin') {
      setActiveTab('batches');
    }
  }, [isAdmin, isActive]);

  // Check URL pathname for public dynamic redirect: /r/:id
  const pathname = window.location.pathname;
  const redirectMatch = pathname.match(/^\/r\/([a-zA-Z0-9_-]+)/);

  if (redirectMatch) {
    const plaqueId = redirectMatch[1];
    return <RedirectHandler plaqueId={plaqueId} />;
  }

  const handleBatchCreated = (batch: Batch, plaques: Plaque[]) => {
    setSelectedBatch(batch);
    setActiveTab('batches');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-400 font-mono tracking-widest uppercase">
            Conectando ao Firebase DINÂMICO PRO...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col selection:bg-red-500/30 selection:text-red-200">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setSelectedBatch(null);
          setActiveTab(tab);
        }}
        onOpenLogin={() => setLoginModalOpen(true)}
        onOpenRegister={() => setRegisterModalOpen(true)}
      />

      <main className="flex-1">
        {/* If user is not authenticated, show welcoming SaaS gateway */}
        {!user ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-extrabold uppercase tracking-wider mb-2">
                <Zap className="w-3.5 h-3.5" />
                <span>Plataforma Comercial de Plaquinhas NFC 10×10 cm</span>
              </div>

              <div className="flex justify-center">
                <BatchStack3DIcon size={84} />
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white font-['Outfit'] tracking-tight leading-tight">
                Plaquinhas Inteligentes com <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-rose-500 to-red-600 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]">
                  QR Codes Dinâmicos
                </span>
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-2xl mx-auto">
                Emissão em lote de plaquinhas em alta definição (300 DPI), numeração sequencial atômica, redirecionamentos editáveis a qualquer momento e exportação sob demanda em PNG, ZIP e PDF A4.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="w-full sm:w-auto btn-3d-red px-8 py-4 rounded-2xl text-white font-black text-sm tracking-wider flex items-center justify-center space-x-2 shadow-2xl"
                >
                  <Lock className="w-4 h-4" />
                  <span>ENTRAR NO SISTEMA</span>
                </button>

                <button
                  onClick={() => setRegisterModalOpen(true)}
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-white font-bold text-sm tracking-wider flex items-center justify-center space-x-2 transition-all shadow-xl"
                >
                  <span>CRIAR CONTA DE COMPRADOR</span>
                  <ArrowRight className="w-4 h-4 text-red-500" />
                </button>
              </div>

              <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="p-5 rounded-3xl bg-[#121217] border border-zinc-800/80 space-y-2">
                  <div className="text-red-500 font-bold text-sm">8 Modelos Oficiais</div>
                  <p className="text-xs text-zinc-400">
                    Instagram, Google Avaliações, Pix, WhatsApp, Wi-Fi, Cardápio e Black Edition com calibragem exata.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[#121217] border border-zinc-800/80 space-y-2">
                  <div className="text-red-500 font-bold text-sm">QR Code Permanente</div>
                  <p className="text-xs text-zinc-400">
                    O QR impresso nunca perde a validade. Altere o destino a qualquer momento pelo painel.
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-[#121217] border border-zinc-800/80 space-y-2">
                  <div className="text-red-500 font-bold text-sm">Impressão A4 Sob Demanda</div>
                  <p className="text-xs text-zinc-400">
                    PDF 100% em tamanho real (4 plaquinhas por página A4) gerado na hora, sem arquivos prévios no banco.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : isBlocked ? (
          <BlockedNotice />
        ) : isPending ? (
          <PendingApprovalNotice />
        ) : (
          <>
            {activeTab === 'generator' && (
              <BatchGenerator
                onBatchCreated={handleBatchCreated}
                onGoToBatches={() => {
                  setSelectedBatch(null);
                  setActiveTab('batches');
                }}
              />
            )}

            {activeTab === 'batches' && (
              selectedBatch ? (
                <BatchDetail
                  batch={selectedBatch}
                  onBack={() => setSelectedBatch(null)}
                />
              ) : (
                <BatchList
                  onSelectBatch={(b) => setSelectedBatch(b)}
                  onGoToGenerator={() => setActiveTab('generator')}
                />
              )
            )}

            {activeTab === 'admin' && (
              <AdminPanel
                onOpenCalibration={() => setActiveTab('calibration')}
                onOpenDiagnostics={() => setActiveTab('diagnostics')}
              />
            )}

            {activeTab === 'calibration' && (
              <CalibrationTool />
            )}

            {activeTab === 'diagnostics' && (
              <DiagnosticSuite />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#070709] py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-zinc-300">DINÂMICO PRO</strong> • Sistema Profissional de Plaquinhas NFC & QR Codes Dinâmicos
          </p>
          <p className="text-[11px] text-zinc-600">
            Formato Padrão: 10×10 cm @ 300 DPI • Grade de Impressão A4 (4 por folha)
          </p>
        </div>
      </footer>

      {/* Auth Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSwitchToForgot={() => {
          setLoginModalOpen(false);
          setForgotModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        onSwitchToLogin={() => {
          setForgotModalOpen(false);
          setLoginModalOpen(true);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
