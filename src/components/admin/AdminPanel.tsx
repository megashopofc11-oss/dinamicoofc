import React, { useState, useEffect } from 'react';
import { useAuth } from '../../services/auth';
import { storageService } from '../../services/storage';
import { UserProfile, SystemStats } from '../../types';
import { ADMIN_EMAIL } from '../../config/models';
import { isFirebaseConfigured, firebaseConfig } from '../../config/firebase';
import { formatDate } from '../../utils/formatters';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Database,
  Layers,
  QrCode,
  AlertTriangle,
  Lock,
  Search,
  Sliders,
  Settings
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'blocked'>('pending');
  const [search, setSearch] = useState('');
  const [statusActionLoading, setStatusActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, systemStats] = await Promise.all([
        storageService.getAllUsers(),
        storageService.getSystemStats()
      ]);
      setUsers(allUsers);
      setStats(systemStats);
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
  }, []);

  const handleUpdateStatus = async (uid: string, newStatus: 'active' | 'blocked' | 'pending') => {
    setStatusActionLoading(uid);
    try {
      await storageService.updateUserStatus(uid, newStatus, user?.email || ADMIN_EMAIL);
      await loadData();
    } catch (e) {
      console.error(e);
      alert('Erro ao atualizar status do comprador.');
    } finally {
      setStatusActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-[#121217] border border-red-500/30 text-center space-y-4">
        <Lock className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Acesso Restrito ao Administrador</h2>
        <p className="text-xs text-zinc-400">
          Apenas o e-mail autorizado <span className="text-red-400 font-mono font-bold">{ADMIN_EMAIL}</span> possui permissão para acessar esta área.
        </p>
      </div>
    );
  }

  const filteredUsers = users
    .filter((u) => u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-red-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>Painel Administrativo Exclusivo</span>
          </div>
          <h1 className="text-3xl font-black text-white font-['Outfit']">
            Gestão de Compradores & Operações
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Aprovação manual de cadastros, controle de acesso e auditoria de lotes gerados.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenCalibration}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-xs font-semibold text-zinc-200 transition-all"
          >
            <Sliders className="w-4 h-4 text-red-400" />
            <span>Calibrar 8 Modelos</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-xs font-bold text-emerald-400 transition-all"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Executar Testes</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:text-white text-zinc-400 transition-all"
            title="Atualizar dados em tempo real"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#121217] border border-amber-500/30 p-5 space-y-2 glow-red-sm">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Aguardando Aprovação</span>
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-white font-['Outfit']">
            {stats?.pendingUsers || 0}
          </p>
          <p className="text-[11px] text-zinc-400">Cadastros pendentes de validação</p>
        </div>

        <div className="rounded-2xl bg-[#121217] border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Compradores Ativos</span>
            <Users className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-white font-['Outfit']">
            {stats?.activeUsers || 0}
          </p>
          <p className="text-[11px] text-zinc-400">Liberados para emitir plaquinhas</p>
        </div>

        <div className="rounded-2xl bg-[#121217] border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-red-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Plaquinhas</span>
            <QrCode className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-white font-['Outfit']">
            {stats?.totalPlaques || 0}
          </p>
          <p className="text-[11px] text-zinc-400">Numeração sequencial contínua</p>
        </div>

        <div className="rounded-2xl bg-[#121217] border border-zinc-800 p-5 space-y-2">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Acessos QR</span>
            <Layers className="w-5 h-5" />
          </div>
          <p className="text-3xl font-black text-white font-['Outfit']">
            {stats?.totalScans || 0}
          </p>
          <p className="text-[11px] text-zinc-400">Leituras redirecionadas com sucesso</p>
        </div>
      </div>

      {/* Backend & Security Status Notice */}
      <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${isFirebaseConfigured ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-amber-400'} animate-pulse`} />
          <div>
            <p className="font-bold text-white">
              Status da Conexão Firebase: {isFirebaseConfigured ? 'Conectado ao Cloud Firestore' : 'Modo Local Ativo com Persistência Reativa'}
            </p>
            <p className="text-zinc-400 mt-0.5">
              Projeto configurado: <code className="text-red-400 font-mono">{firebaseConfig.projectId || 'teste-c625b'}</code> • Isolamento por regras ativas
            </p>
          </div>
        </div>

        <div className="text-zinc-500 text-[11px]">
          Administrador Master autenticado: <span className="text-zinc-300 font-bold">{ADMIN_EMAIL}</span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-zinc-900 border border-zinc-800 self-start">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === 'pending'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pendentes ({users.filter((u) => u.status === 'pending').length})</span>
          </button>

          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Ativos ({users.filter((u) => u.status === 'active' && u.email !== ADMIN_EMAIL).length})</span>
          </button>

          <button
            onClick={() => setFilter('blocked')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              filter === 'blocked'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Bloqueados ({users.filter((u) => u.status === 'blocked').length})</span>
          </button>

          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por e-mail, nome..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl bg-[#121217] border border-zinc-800/90 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/80 text-zinc-400 border-b border-zinc-800 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-5 py-3.5">Comprador</th>
                <th className="px-5 py-3.5">Empresa / Negócio</th>
                <th className="px-5 py-3.5">Data de Cadastro</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-zinc-500">
                    Nenhum comprador encontrado nesta categoria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isActionLoading = statusActionLoading === u.uid;
                  return (
                    <tr key={u.uid} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-white text-xs">
                            {u.displayName?.charAt(0).toUpperCase() || u.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{u.displayName || 'Sem nome informado'}</p>
                            <p className="text-zinc-400 text-[11px] font-mono">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-zinc-300 font-medium">
                        {u.businessName || '—'}
                      </td>

                      <td className="px-5 py-4 text-zinc-400 text-[11px]">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        {u.status === 'active' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" /> Ativo
                          </span>
                        )}
                        {u.status === 'pending' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            <Clock className="w-3 h-3 mr-1" /> Pendente
                          </span>
                        )}
                        {u.status === 'blocked' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <Ban className="w-3 h-3 mr-1" /> Bloqueado
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {u.status === 'pending' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'active')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center space-x-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Aprovar</span>
                            </button>
                          )}

                          {u.status === 'active' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'blocked')}
                              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-rose-600/30 text-rose-400 hover:text-rose-300 border border-rose-500/20 text-xs font-semibold transition-all flex items-center space-x-1"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Bloquear</span>
                            </button>
                          )}

                          {u.status === 'blocked' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleUpdateStatus(u.uid, 'active')}
                              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-all flex items-center space-x-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Reativar</span>
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
