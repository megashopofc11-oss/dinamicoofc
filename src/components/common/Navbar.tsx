import React, { useState } from 'react';
import { useAuth } from '../../services/auth';
import {
  Layers,
  PlusCircle,
  Shield,
  Sliders,
  CheckCircle,
  Clock,
  Ban,
  LogOut,
  User,
  Zap,
  Menu,
  X,
  ExternalLink
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'generator' | 'batches' | 'admin' | 'calibration' | 'diagnostics';
  setActiveTab: (tab: 'generator' | 'batches' | 'admin' | 'calibration' | 'diagnostics') => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenLogin,
  onOpenRegister,
}) => {
  const { user, isAdmin, isActive, isPending, isBlocked, logout, switchUser } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-[#09090b]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('batches')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 shadow-lg shadow-red-500/25 border border-red-400/30">
              <Zap className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400 font-['Outfit']">
                  DINÂMICO <span className="text-red-500 font-black">PRO</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-wider">
                  NFC • QR
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block">Plaquinhas Inteligentes 10×10 cm</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'generator'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Gerar Lote</span>
            </button>

            <button
              onClick={() => setActiveTab('batches')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'batches'
                  ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Meus Lotes</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'admin'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                      : 'text-zinc-300 hover:text-red-400 hover:bg-zinc-800/60'
                  }`}
                >
                  <Shield className="w-4 h-4 text-red-400" />
                  <span>Painel Admin</span>
                </button>

                <button
                  onClick={() => setActiveTab('calibration')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === 'calibration'
                      ? 'bg-zinc-800 text-red-400 border border-red-500/30'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Calibração dos 8 Modelos</span>
                </button>
              </>
            )}

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/60'
              }`}
              title="Testes e Diagnósticos do Sistema"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Diagnósticos</span>
            </button>
          </nav>

          {/* User Profile & Auth Actions */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-zinc-700 to-zinc-800 flex items-center justify-center text-xs font-bold text-white border border-zinc-600">
                    {user.displayName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                      {user.displayName || user.email}
                    </p>
                    <div className="flex items-center space-x-1">
                      {isAdmin ? (
                        <span className="text-[10px] text-red-400 font-bold flex items-center">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Administrador
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] text-emerald-400 font-medium flex items-center">
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Comprador Ativo
                        </span>
                      ) : isPending ? (
                        <span className="text-[10px] text-amber-400 font-medium flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> Aguardando Aprovação
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-medium flex items-center">
                          <Ban className="w-2.5 h-2.5 mr-0.5" /> Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#121217] border border-zinc-800 shadow-2xl p-2 z-50 text-sm">
                    <div className="px-3 py-2 border-b border-zinc-800">
                      <p className="text-xs text-zinc-400">Conectado como:</p>
                      <p className="font-semibold text-white truncate">{user.email}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">UID: {user.uid.substring(0, 14)}...</p>
                    </div>

                    {/* Quick Profile Switcher for Testing / Verification */}
                    <div className="py-2 px-3 border-b border-zinc-800/80">
                      <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                        Testar Papéis (Simulador):
                      </p>
                      <div className="grid grid-cols-1 gap-1">
                        <button
                          onClick={() => {
                            switchUser('admin');
                            setProfileDropdownOpen(false);
                          }}
                          className={`text-left text-xs px-2 py-1.5 rounded flex items-center justify-between ${
                            isAdmin ? 'bg-red-500/20 text-red-400 font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span>Admin (jeannmkt2@gmail.com)</span>
                          {isAdmin && <CheckCircle className="w-3 h-3 text-red-400" />}
                        </button>
                        <button
                          onClick={() => {
                            switchUser('buyer_active');
                            setProfileDropdownOpen(false);
                          }}
                          className={`text-left text-xs px-2 py-1.5 rounded flex items-center justify-between ${
                            isActive && !isAdmin ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span>Comprador Ativo (Aprovado)</span>
                          {isActive && !isAdmin && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                        </button>
                        <button
                          onClick={() => {
                            switchUser('buyer_pending');
                            setProfileDropdownOpen(false);
                          }}
                          className={`text-left text-xs px-2 py-1.5 rounded flex items-center justify-between ${
                            isPending ? 'bg-amber-500/20 text-amber-400 font-bold' : 'hover:bg-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span>Comprador Pendente</span>
                          {isPending && <CheckCircle className="w-3 h-3 text-amber-400" />}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full mt-1 flex items-center space-x-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={onOpenLogin}
                  className="px-3.5 py-1.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={onOpenRegister}
                  className="btn-3d-red px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-all"
                >
                  Cadastrar
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#0c0c10] px-4 pt-2 pb-4 space-y-2">
          <button
            onClick={() => {
              setActiveTab('generator');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeTab === 'generator' ? 'bg-red-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Gerar Lote de Plaquinhas</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('batches');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeTab === 'batches' ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Meus Lotes</span>
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  activeTab === 'admin' ? 'bg-red-500/20 text-red-400' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Shield className="w-4 h-4 text-red-400" />
                <span>Painel Administrativo</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('calibration');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                  activeTab === 'calibration' ? 'bg-zinc-800 text-red-400' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Calibração dos Modelos</span>
              </button>
            </>
          )}
          <button
            onClick={() => {
              setActiveTab('diagnostics');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold ${
              activeTab === 'diagnostics' ? 'bg-emerald-500/20 text-emerald-400' : 'text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Testes & Diagnósticos</span>
          </button>
        </div>
      )}
    </header>
  );
};
