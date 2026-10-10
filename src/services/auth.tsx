import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, UserRole, UserStatus } from '../types';
import { ADMIN_EMAIL } from '../config/models';
import { storageService } from './storage';
import { auth as firebaseAuth, isFirebaseConfigured } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  isPending: boolean;
  isBlocked: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string, businessName?: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function translateFirebaseError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use':
      return 'Este e-mail já está cadastrado no sistema.';
    case 'auth/weak-password':
      return 'A senha é muito fraca. Utilize pelo menos 6 caracteres.';
    case 'auth/invalid-email':
      return 'Formato de e-mail inválido.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas sem sucesso. Aguarde alguns instantes.';
    case 'auth/network-request-failed':
      return 'Erro de conexão com a internet. Verifique sua rede.';
    default:
      return error?.message || 'Falha ao autenticar.';
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadUserProfile = async (uid: string, email: string) => {
    try {
      let profile = await storageService.getUserProfile(uid);
      const isMasterAdmin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (!profile) {
        // Auto-initialize profile in Firestore if absent
        profile = {
          uid,
          email,
          displayName: email.split('@')[0],
          role: isMasterAdmin ? 'admin' : 'buyer',
          status: isMasterAdmin ? 'active' : 'pending',
          createdAt: Date.now(),
          approvedAt: isMasterAdmin ? Date.now() : undefined,
          approvedBy: isMasterAdmin ? 'SISTEMA_MASTER' : undefined
        };
        await storageService.saveUserProfile(profile);
      } else if (isMasterAdmin && (profile.role !== 'admin' || profile.status !== 'active')) {
        // Enforce master admin privilege
        profile.role = 'admin';
        profile.status = 'active';
        await storageService.saveUserProfile(profile);
      }

      setUser(profile);
    } catch (err) {
      console.error('[DINÂMICO PRO] Erro ao carregar perfil do Firestore:', err);
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        setFirebaseUser(fbUser);
        if (fbUser && fbUser.email) {
          await loadUserProfile(fbUser.uid, fbUser.email);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // If Firebase SDK is not configured yet
      setLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (!firebaseAuth) {
      setLoading(false);
      return { success: false, error: 'Firebase Auth não inicializado.' };
    }

    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
      setFirebaseUser(cred.user);
      await loadUserProfile(cred.user.uid, cleanEmail);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: translateFirebaseError(err) };
    }
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    businessName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL.toLowerCase();

    if (!firebaseAuth) {
      setLoading(false);
      return { success: false, error: 'Firebase Auth não inicializado.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
      await updateProfile(cred.user, { displayName: name });
      setFirebaseUser(cred.user);

      // Create profile in Firestore with initial status 'pending' (or 'active' if master admin)
      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cleanEmail,
        displayName: name,
        businessName: businessName || '',
        role: isMasterAdmin ? 'admin' : 'buyer',
        status: isMasterAdmin ? 'active' : 'pending',
        createdAt: Date.now(),
        approvedAt: isMasterAdmin ? Date.now() : undefined,
        approvedBy: isMasterAdmin ? 'SISTEMA_MASTER' : undefined
      };

      await storageService.saveUserProfile(profile);
      setUser(profile);
      setLoading(false);
      return { success: true };
    } catch (err: any) {
      setLoading(false);
      return { success: false, error: translateFirebaseError(err) };
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!firebaseAuth) return { success: false, error: 'Firebase Auth não inicializado.' };
    try {
      await sendPasswordResetEmail(firebaseAuth, email.trim().toLowerCase());
      return { success: true };
    } catch (err: any) {
      return { success: false, error: translateFirebaseError(err) };
    }
  };

  const logout = async (): Promise<void> => {
    if (firebaseAuth) {
      await fbSignOut(firebaseAuth);
    }
    setUser(null);
    setFirebaseUser(null);
  };

  const refreshUser = async () => {
    if (firebaseUser && firebaseUser.email) {
      await loadUserProfile(firebaseUser.uid, firebaseUser.email);
    }
  };

  const isAdmin = user?.role === 'admin' || user?.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  const isActive = user?.status === 'active' || isAdmin;
  const isPending = user?.status === 'pending' && !isAdmin;
  const isBlocked = user?.status === 'blocked';

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        isAdmin: Boolean(isAdmin),
        isActive: Boolean(isActive),
        isPending: Boolean(isPending),
        isBlocked: Boolean(isBlocked),
        login,
        register,
        resetPassword,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
};
