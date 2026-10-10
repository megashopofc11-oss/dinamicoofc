import React, { useState } from 'react';
import { useAuth } from '../../services/auth';
import { BatchStack3DIcon, Layers3DIcon, AdminShield3DIcon } from './Icons3D';
import {
  Shield,
  Sliders,
  CheckCircle,
  Clock,
  Ban,
  LogOut,
  User,
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
  const { user, isAdmin, isActive, isPending, isBlocked, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/90 bg-[#09090b]/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo Brand with 3D High-Relief Badge */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => setActiveTab(isAdmin ? 'admin' : 'batches')}
          >
            <div className="relative">
              <BatchStack3DIcon size={44} className="group-hover:scale-105 transition-transform duration-200" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-black tracking-tight text-white font-['Outfit']">
                  DINÂMICO <span className="text-red-500 font-extrabold drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]">PRO</span>
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30 uppercase tracking-widest">
                  NFC 3D
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 hidden sm:block font-medium">Plaquinhas Inteligentes 10×10 cm</p>
            </div>
          </div>

          {/* Desktop Nav Navigation */}
          {user && (
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-3">
              {/* Gerar Lote with 3D Button Styling */}
              {isActive && (
                <button
                  onClick={() => setActiveTab('generator')}
                  className={`flex items-center space-x-2.5 px-4 py-2.5 rounded-xl text-xs font-extrabold tracking-wider transition-all ${
                    activeTab === 'generator'
                      ? 'btn-3d-red text-white shadow-xl shadow-red-500/25 ring-1 ring-red-400'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 hover:bg-zinc-800/80'
                  }`}
                >
                  <BatchStack3DIcon size={20} />
                  <span>GERAR LOTE</span>
                </button>
              )}

              {/* Meus Lotes */}
              {isActive && (
                <button
                  onClick={() => setActiveTab('batches')}
                  className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'batches'
                      ? 'bg-zinc-800 text-white border border-zinc-700 shadow-md'
                      : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Layers3DIcon size={18} />
                  <span>Meus Lotes</span>
                </button>
              )}

              {/* Admin Panel Link */}
              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      activeTab === 'admin'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40 shadow-sm'
                        : 'text-zinc-300 hover:text-red-400 hover:bg-zinc-900'
                    }`}
                  >
                    <AdminShield3DIcon size={18} />
                    <span>Painel Admin</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('calibration')}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeTab === 'calibration'
                        ? 'bg-zinc-800 text-red-400 border border-red-500/30'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Calibração</span>
                  </button>
                </>
              )}
            </nav>
          )}

          {/* User Profile & Auth Status */}
          <div className="flex items-center space-x-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 px-3.5 py-2 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 transition-all text-left shadow-md"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-700 flex items-center justify-center text-xs font-bold text-white border border-zinc-600 shadow-inner">
                    {user.displayName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-white leading-tight truncate max-w-[140px]">
                      {user.displayName || user.email.split('@')[0]}
                    </p>
                    <div className="flex items-center space-x-1 mt-0.5">
                      {isAdmin ? (
                        <span className="text-[10px] text-red-400 font-extrabold flex items-center">
                          <Shield className="w-2.5 h-2.5 mr-0.5" /> Admin Master
                        </span>
                      ) : isActive ? (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                          <CheckCircle className="w-2.5 h-2.5 mr-0.5" /> Aprovado
                        </span>
                      ) : isPending ? (
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center">
                          <Clock className="w-2.5 h-2.5 mr-0.5" /> Pendente
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-semibold flex items-center">
                          <Ban className="w-2.5 h-2.5 mr-0.5" /> Bloqueado
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#121217] border border-zinc-800 shadow-2xl p-2.5 z-50 text-xs">
                    <div className="px-3 py-2.5 border-b border-zinc-800/80">
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Conta Conectada</p>
                      <p className="font-bold text-white truncate text-xs mt-0.5">{user.email}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">UID: {user.uid.substring(0, 12)}...</p>
                    </div>

                    <button
                      onClick={() => {
                        logout();
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full mt-1.5 flex items-center space-x-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 font-bold transition-all"
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
                  className="px-4 py-2 text-xs font-bold text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-all"
                >
                  Entrar
                </button>
                <button
                  onClick={onOpenRegister}
                  className="btn-3d-red px-4 py-2 text-xs font-extrabold text-white rounded-xl shadow-lg transition-all"
                >
                  Criar Conta
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
        <div className="md:hidden border-t border-zinc-800 bg-[#0c0c10] px-4 pt-3 pb-5 space-y-2">
          {user && isActive && (
            <>
              <button
                onClick={() => {
                  setActiveTab('generator');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-xs font-extrabold tracking-wider ${
                  activeTab === 'generator' ? 'btn-3d-red text-white' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <BatchStack3DIcon size={20} />
                <span>GERAR LOTE DE PLAQUINHAS</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('batches');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'batches' ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Layers3DIcon size={18} />
                <span>Meus Lotes</span>
              </button>
            </>
          )}

          {user && isAdmin && (
            <>
              <button
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'admin' ? 'bg-red-500/20 text-red-400' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <AdminShield3DIcon size={18} />
                <span>Painel Administrativo</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('calibration');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'calibration' ? 'bg-zinc-800 text-red-400' : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Calibração dos 8 Modelos</span>
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
