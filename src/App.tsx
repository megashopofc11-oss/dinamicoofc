import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './services/auth';
import { Navbar } from './components/common/Navbar';
import { BatchGenerator } from './components/generator/BatchGenerator';
import { BatchList } from './components/batches/BatchList';
import { BatchDetail } from './components/batches/BatchDetail';
import { AdminPanel } from './components/admin/AdminPanel';
import { CalibrationTool } from './components/admin/CalibrationTool';
import { DiagnosticSuite } from './components/admin/DiagnosticSuite';
import { LoginModal, RegisterModal, PendingApprovalNotice, BlockedNotice } from './components/auth/AuthModals';
import { RedirectHandler } from './components/redirect/RedirectHandler';
import { Batch, Plaque } from './types';

function MainApp() {
  const { user, isAdmin, isActive, isPending, isBlocked, loading } = useAuth();

  // Navigation states
  const [activeTab, setActiveTab] = useState<'generator' | 'batches' | 'admin' | 'calibration' | 'diagnostics'>('generator');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);

  // Auth Modals
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);

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
            Carregando DINÂMICO PRO...
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
        {/* If user is blocked, render blocked notice */}
        {isBlocked ? (
          <BlockedNotice />
        ) : isPending ? (
          /* If user is pending approval, render pending notice with demo role switcher */
          <PendingApprovalNotice />
        ) : (
          /* Normal app views */
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
      />

      <RegisterModal
        isOpen={registerModalOpen}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
          setRegisterModalOpen(false);
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
