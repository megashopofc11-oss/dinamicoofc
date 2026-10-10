import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { UserProfile, SystemStats } from '../../types';
import { ADMIN_EMAIL } from '../../config/models';
import { isFirebaseConfigured, firebaseConfig } from '../../config/firebase';
import { formatDate } from '../../utils/formatters';
import { AdminShield3DIcon, Layers3DIcon, QrCodes3DIcon, BatchStack3DIcon } from '../common/Icons3D';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Search,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface AdminPanelProps {
  onOpenCalibration: () => void;
  onOpenDiagnostics: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onOpenCalibration,
  onOpenDiagnostics,
}) => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'active' | 'blocked' | 'all'>('pending');
  const [search, setSearch] = useState('');
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);

  // Real-time listener for users using onSnapshot
  useEffect(() => {
    setLoading(true);

    const unsubscribe = storageService.subscribeToUsers(
      (liveUsers) => {
        setUsers(liveUsers);
        setLoading(false);
      },
      (err) => {
        console.error('Erro no snapshot de usuários:', err);
        setLoading(false);
      }
    );

    // Initial load of real stats
    loadRealStats();

    return () => {
      unsubscribe();
    };
  }, []);

  const loadRealStats = async () => {
    setStatsError(null);
    try {
      const realStats = await storageService.getSystemStats();
      setStats(realStats);
    } catch (err: any) {
      console.error(err);
      setStatsError('Não foi possível carregar os dados reais.');
    }
  };

  const handleUpdateStatus = async (uid: string, newStatus: 'active' | 'blocked' | 'pending') => {
    setStatusActionLoading(uid);
    try {
      await storageService.updateUserStatus(uid, newStatus, user?.email || ADMIN_EMAIL);
      // Refresh stats
      await loadRealStats();
    } catch (e: any) {
      console.error(e);
      alert('Erro ao atualizar status do comprador no Firebase.');
    } finally {
      setStatusActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 rounded-3xl bg-[#121217] border border-red-500/30 text-center space-y-4">
        <Shield className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="text-2xl font-black text-white font-['Outfit']">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-zinc-400">
          Apenas o e-mail autorizado <span className="text-red-400 font-mono font-bold">{ADMIN_EMAIL}</span> possui permissão para acessar esta área.
        </p>
      </div>
    );
  }

  const buyersOnly = users.filter((u) => u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase());

  const filteredUsers = buyersOnly
    .filter((u) => {
      if (filter === 'all') return true;
      return u.status === filter;
    })
    .filter((u) => {
      const term = search.toLowerCase();
      return (
        u.email.toLowerCase().includes(term) ||
        (u.displayName && u.displayName.toLowerCase().includes(term)) ||
        (u.businessName && u.businessName.toLowerCase().includes(term))
      );
    });

  const pendingCount = buyersOnly.filter((u) => u.status === 'pending').length;
  const activeCount = buyersOnly.filter((u) => u.status === 'active').length;
  const blockedCount = buyersOnly.filter((u) => u.status === 'blocked').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-extrabold text-xs uppercase tracking-wider mb-1">
            <AdminShield3DIcon size={18} />
            <span>Painel Administrativo Exclusivo • Em Tempo Real</span>
          </div>
          <h1 className="text-3xl font-black text-white font-['Outfit']">
            Gestão de Compradores & Operações
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Aprovação manual imediata, controle de acesso e auditoria de lotes gerados no Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCalibration}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-xs font-bold text-zinc-200 transition-all shadow-md"
          >
            <Sliders className="w-4 h-4 text-red-400" />
            <span>Calibrar 8 Modelos</span>
          </button>

          <button
            onClick={loadRealStats}
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-400 transition-all shadow-md"
            title="Recarregar estatísticas reais do Firestore"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-Time Stats Grid (Zero Mocks / Only Confirmed Firestore Data) */}
      {statsError ? (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{statsError}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Card 1: Pending Approvals */}
          <div className="rounded-3xl bg-[#121217] border border-amber-500/40 p-5 space-y-2 glow-red-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Aguardando Aprovação</span>
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <p className="text-3xl font-black text-white font-['Outfit']">
              {pendingCount}
            </p>
            <p className="text-[11px] text-zinc-400">Cadastros pendentes de liberação</p>
          </div>

          {/* Card 2: Active Buyers */}
          <div className="rounded-3xl bg-[#121217] border border-zinc-800 p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Compradores Ativos</span>
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-white font-['Outfit']">
              {activeCount}
            </p>
            <p className="text-[11px] text-zinc-400">Liberados para emitir plaquinhas</p>
          </div>

          {/* Card 3: Total Plaques Registered */}
          <div className="rounded-3xl bg-[#121217] border border-zinc-800 p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-red-500">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Plaquinhas Emitidas</span>
              <BatchStack3DIcon size={22} />
            </div>
            <p className="text-3xl font-black text-white font-['Outfit']">
              {stats?.totalPlaques ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400">Gravadas no Cloud Firestore</p>
          </div>

          {/* Card 4: Real QR Scans Recorded */}
          <div className="rounded-3xl bg-[#121217] border border-zinc-800 p-5 space-y-2 relative overflow-hidden">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[11px] font-extrabold uppercase tracking-wider">Leituras de QR Registradas</span>
              <QrCodes3DIcon size={22} />
            </div>
            <p className="text-3xl font-black text-white font-['Outfit']">
              {stats?.totalScans ?? 0}
            </p>
            <p className="text-[11px] text-zinc-400">Eventos de redirecionamento reais</p>
          </div>
        </div>
      )}

      {/* Backend & Security Status Box */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse" />
          <div>
            <p className="font-bold text-white">
              Cloud Firestore Ativo & Conectado: <code className="text-emerald-400 font-mono text-xs">{firebaseConfig.projectId}</code>
            </p>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              Banco de Dados ID: <code className="text-red-400 font-mono">{firebaseConfig.firestoreDatabaseId}</code> • Sincronização via onSnapshot
            </p>
          </div>
        </div>

        <div className="text-zinc-400 text-[11px]">
          Administrador Autenticado: <strong className="text-white">{ADMIN_EMAIL}</strong>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-zinc-900 border border-zinc-800 self-start">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes ({pendingCount})</span>
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              filter === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Aprovados ({activeCount})</span>
          </button>

          <button
            onClick={() => setFilter('blocked')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center space-x-2 ${
              filter === 'blocked'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Bloqueados ({blockedCount})</span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos ({buyersOnly.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail, nome..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500 font-medium"
          />
        </div>
      </div>

      {/* Real-time Users Table */}
      <div className="rounded-3xl bg-[#121217] border border-zinc-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 border-b border-zinc-800 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Comprador</th>
                <th className="px-6 py-4">Empresa / Negócio</th>
                <th className="px-6 py-4">Data do Cadastro</th>
                <th className="px-6 py-4">Status no Firebase</th>
                <th className="px-6 py-4 text-right">Ações Administrativas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-500">
                    <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Carregando cadastros em tempo real...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-zinc-500">
                    Nenhum comprador encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActionLoading = statusActionLoading === u.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-black text-white text-xs shadow-inner">
                            {u.displayName?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{u.displayName || 'Sem nome'}</p>
                            <p className="text-zinc-400 text-xs font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-zinc-300 font-medium">
                        {u.businessName || '—'}
                      </td>

                      <td className="px-6 py-4 text-zinc-400 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        {u.status === 'active' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3 mr-1" /> Aprovado (Ativo)
                          </span>
                        )}
                        {u.status === 'pending' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" /> Aguardando Aprovação
                          </span>
                        )}
                        {u.status === 'blocked' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <Ban className="w-3 h-3 mr-1" /> Bloqueado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {u.status === 'pending' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'active')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all flex items-center space-x-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{isActionLoading ? 'Salvando...' : 'Aprovar'}</span>
                            </button>
                          )}

                          {u.status === 'active' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'blocked')}
                              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{isActionLoading ? 'Salvando...' : 'Bloquear'}</span>
                            </button>
                          )}

                          {u.status === 'blocked' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'active')}
                              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center space-x-1.5"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>{isActionLoading ? 'Salvando...' : 'Reativar'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
