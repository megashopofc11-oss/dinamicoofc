import React, { useState } from 'react';
import { useAuth } from '../../services/auth';
import { ADMIN_EMAIL } from '../../config/models';
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowRight
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
}) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Erro ao realizar login.');
    }
  };

  const handleQuickFillAdmin = () => {
    setEmail(ADMIN_EMAIL);
    setPassword('admin123456');
  };

  const handleQuickFillBuyer = () => {
    setEmail('cliente@exemplo.com.br');
    setPassword('comprador123');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121217] border border-zinc-800 p-6 shadow-2xl glow-red-sm">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">Acessar DINÂMICO PRO</h2>
            <p className="text-xs text-zinc-400">Entre com sua conta autorizada</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-3d-red py-3 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Entrando...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Fill */}
        <div className="mt-5 pt-4 border-t border-zinc-800">
          <p className="text-[11px] font-semibold text-zinc-400 text-center mb-2">Preenchimento rápido para demonstração:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleQuickFillAdmin}
              className="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-red-400 hover:border-red-500/40 transition-all font-medium"
            >
              👑 Administrador Master
            </button>
            <button
              type="button"
              onClick={handleQuickFillBuyer}
              className="py-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all font-medium"
            >
              🏷️ Comprador Aprovado
            </button>
          </div>
        </div>

        {onSwitchToRegister && (
          <div className="mt-4 text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-xs text-zinc-400 hover:text-white transition-all"
            >
              Não tem uma conta? <span className="text-red-400 font-semibold underline">Solicitar cadastro</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const RegisterModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
}) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await register(email, password, name, businessName);
    setLoading(false);

    if (res.success) {
      setRegisteredSuccess(true);
    } else {
      setError(res.error || 'Erro ao realizar cadastro.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-[#121217] border border-zinc-800 p-6 shadow-2xl glow-red-sm">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {registeredSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white font-['Outfit']">Solicitação Enviada!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              Sua conta foi criada e está <strong className="text-amber-400">aguardando aprovação manual</strong> do administrador único (<span className="text-zinc-200">{ADMIN_EMAIL}</span>).
            </p>
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl text-left text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-white">Status da Conta: <span className="text-amber-400">PENDENTE</span></p>
              <p>Assim que o administrador autorizar, seu acesso ao gerador de lotes será liberado automaticamente.</p>
            </div>
            <button
              onClick={onClose}
              className="btn-3d-red w-full py-2.5 rounded-xl text-white font-bold text-sm shadow-md"
            >
              Entendido
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white font-['Outfit']">Criar Conta de Comprador</h2>
                <p className="text-xs text-zinc-400">Plataforma exclusiva DINÂMICO PRO</p>
              </div>
            </div>

            <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start space-x-2 text-amber-300 text-[11px] leading-tight">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Atenção:</strong> Cada cadastro passa por aprovação manual do administrador antes de emitir plaquinhas.
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Empresa / Negócio (Opcional)</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Gráfica Rápida Express"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="comprador@email.com"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Senha</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-3d-red py-2.5 rounded-xl text-white font-bold text-sm shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Cadastrando...' : 'Solicitar Cadastro'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {onSwitchToLogin && (
              <div className="mt-4 text-center">
                <button
                  onClick={onSwitchToLogin}
                  className="text-xs text-zinc-400 hover:text-white transition-all"
                >
                  Já tem conta cadastrada? <span className="text-red-400 font-semibold underline">Fazer login</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export const PendingApprovalNotice: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-[#121217] border border-amber-500/30 shadow-2xl text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
        <Clock className="w-8 h-8 animate-pulse" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-white font-['Outfit']">Conta Aguardando Aprovação</h2>
        <p className="text-sm text-zinc-400 mt-1">Status: <span className="text-amber-400 font-bold uppercase">Pendente</span></p>
      </div>

      <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-left text-xs text-zinc-300 space-y-2">
        <p className="flex items-center text-amber-400 font-semibold">
          <AlertCircle className="w-4 h-4 mr-1.5 shrink-0" />
          Acesso Restrito ao Gerador de Plaquinhas
        </p>
        <p>
          Olá, <strong className="text-white">{user?.displayName || user?.email}</strong>. Seu cadastro foi recebido com sucesso no DINÂMICO PRO e está na fila de aprovação do administrador exclusivo:
        </p>
        <p className="p-2 bg-black/40 rounded border border-zinc-800 font-mono text-red-400 text-center text-xs">
          {ADMIN_EMAIL}
        </p>
        <p className="text-zinc-400">
          Assim que aprovado, esta tela será atualizada automaticamente e você poderá gerar lotes de 10×10 cm, baixar arquivos ZIP e exportar os PDFs para impressão.
        </p>
      </div>

      <div className="text-xs text-zinc-500">
        Dica para testes: no menu superior, você pode alternar para o perfil do Administrador Master para aprovar esta conta no Painel Admin!
      </div>
    </div>
  );
};

export const BlockedNotice: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl bg-[#121217] border border-rose-500/30 shadow-2xl text-center space-y-5">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-white font-['Outfit']">Acesso Suspenso</h2>
        <p className="text-sm text-zinc-400 mt-1">Status: <span className="text-rose-500 font-bold uppercase">Bloqueado</span></p>
      </div>
      <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
        Sua conta de comprador foi desativada pelo administrador. Para reativar seu acesso à geração de lotes e QR codes, entre em contato com <strong className="text-red-400">{ADMIN_EMAIL}</strong>.
      </p>
    </div>
  );
};
