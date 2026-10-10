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
  AlertCircle,
  Zap,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  LogOut
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToForgot?: () => void;
}

export const LoginModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgot,
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121217] border border-zinc-800 p-6 sm:p-8 shadow-2xl glow-red-sm">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/30 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-['Outfit']">Acessar DINÂMICO PRO</h2>
            <p className="text-xs text-zinc-400">Autenticação segura via Firebase</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Senha</label>
              {onSwitchToForgot && (
                <button
                  type="button"
                  onClick={onSwitchToForgot}
                  className="text-[11px] text-red-400 hover:text-red-300 hover:underline"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-3d-red py-3.5 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {onSwitchToRegister && (
          <div className="mt-6 pt-5 border-t border-zinc-800/80 text-center">
            <button
              onClick={onSwitchToRegister}
              className="text-xs text-zinc-400 hover:text-white transition-all"
            >
              Não tem uma conta cadastrada? <span className="text-red-400 font-semibold underline">Solicitar cadastro</span>
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As senhas digitadas não coincidem.');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve conter no mínimo 6 caracteres.');
      return;
    }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121217] border border-zinc-800 p-6 sm:p-8 shadow-2xl glow-red-sm max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {registeredSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
              <Clock className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white font-['Outfit']">Solicitação Enviada!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-xs mx-auto">
              Sua conta foi criada no Firebase com status <strong className="text-amber-400">Pendente</strong> e já apareceu no painel do administrador único (<span className="text-zinc-200">{ADMIN_EMAIL}</span>).
            </p>
            <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-left text-xs text-zinc-400 space-y-1">
              <p className="font-semibold text-white">Próximo Passo:</p>
              <p>O administrador irá avaliar seu cadastro. Assim que aprovado, seu gerador de lotes será liberado automaticamente em tempo real.</p>
            </div>
            <button
              onClick={onClose}
              className="btn-3d-red w-full py-3 rounded-xl text-white font-bold text-sm shadow-md"
            >
              Acessar Painel (Aguardando Aprovação)
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center space-x-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/30 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white font-['Outfit']">Criar Conta de Comprador</h2>
                <p className="text-xs text-zinc-400">Plataforma exclusiva DINÂMICO PRO</p>
              </div>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start space-x-2 text-amber-300 text-xs leading-tight">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Aprovação Requerida:</strong> Cada comprador cadastrado passa por aprovação manual do administrador antes de gerar lotes.
              </span>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Empresa / Negócio (Opcional)</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Gráfica Rápida Express"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">E-mail</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="comprador@email.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Confirmar Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-3d-red py-3.5 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 mt-4"
              >
                <span>{loading ? 'Processando Cadastro...' : 'Solicitar Cadastro'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {onSwitchToLogin && (
              <div className="mt-5 text-center">
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

export const ForgotPasswordModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await resetPassword(email);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || 'Erro ao enviar e-mail de recuperação.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121217] border border-zinc-800 p-6 sm:p-8 shadow-2xl glow-red-sm">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-xl hover:bg-zinc-800 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 border border-red-400/30 flex items-center justify-center text-white shadow-lg shadow-red-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white font-['Outfit']">Recuperar Senha</h2>
            <p className="text-xs text-zinc-400">Instruções enviadas para seu e-mail</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-white">E-mail de redefinição enviado!</p>
            <p className="text-xs text-zinc-400">
              Verifique sua caixa de entrada e spam no endereço <span className="text-white font-semibold">{email}</span> para criar uma nova senha.
            </p>
            <button
              onClick={onSwitchToLogin}
              className="btn-3d-red w-full py-3 rounded-xl text-white font-bold text-xs"
            >
              Voltar ao Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center space-x-2 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">E-mail cadastrado</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white focus:outline-none focus:border-red-500 font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-3d-red py-3.5 rounded-xl text-white font-bold text-sm shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? 'Enviando...' : 'Enviar Link de Redefinição'}</span>
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Lembrou sua senha? <span className="text-red-400 font-semibold underline">Fazer login</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const PendingApprovalNotice: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto my-16 px-4">
      <div className="p-8 sm:p-10 rounded-3xl bg-[#121217] border border-amber-500/40 shadow-2xl text-center space-y-6 glow-red-sm">
        <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-xl">
          <Clock className="w-10 h-10 animate-pulse" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-white font-['Outfit']">Aguardando Aprovação</h2>
          <div className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Status: PENDENTE</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 text-left text-xs text-zinc-300 space-y-3">
          <p className="text-sm font-bold text-white">
            Olá, {user?.displayName || user?.email}!
          </p>
          <p className="leading-relaxed">
            Seu cadastro foi registrado no Firebase e está aguardando aprovação manual do administrador master:
          </p>
          <p className="p-2.5 bg-black/60 rounded-xl border border-zinc-800 font-mono text-red-400 text-center font-bold text-xs select-all">
            {ADMIN_EMAIL}
          </p>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            Esta tela se atualizará automaticamente assim que o administrador autorizar sua conta. Não é necessário atualizar a página.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={logout}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const BlockedNotice: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl mx-auto my-16 px-4">
      <div className="p-8 sm:p-10 rounded-3xl bg-[#121217] border border-rose-500/40 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mx-auto shadow-xl">
          <ShieldAlert className="w-10 h-10" />
        </div>

        <div>
          <h2 className="text-3xl font-black text-white font-['Outfit']">Conta Bloqueada</h2>
          <div className="inline-flex items-center space-x-1.5 mt-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <span>Status: ACESSO SUSPENSO</span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
          Seu acesso ao gerador de lotes foi suspenso temporariamente pelo administrador. Suas plaquinhas e QR Codes já impressos continuam funcionando normalmente.
        </p>

        <div className="pt-2">
          <button
            onClick={logout}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
          >
            <LogOut className="w-4 h-4 text-zinc-500" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </div>
    </div>
  );
};
