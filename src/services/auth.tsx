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
  User as FirebaseUser
} from 'firebase/auth';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isActive: boolean;
  isPending: boolean;
  isBlocked: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string, businessName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchUser: (role: 'admin' | 'buyer_active' | 'buyer_pending') => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACTIVE_SESSION_KEY = 'dinamico_pro_active_session_uid';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load active session from storage or Firebase
  const loadUserFromUid = async (uid: string) => {
    try {
      const profile = await storageService.getUserProfile(uid);
      if (profile) {
        // Enforce super admin rule
        if (profile.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          profile.role = 'admin';
          profile.status = 'active';
        }
        setUser(profile);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Erro ao carregar usuário:', e);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          let profile = await storageService.getUserProfile(fbUser.uid);
          if (!profile) {
            // First time Firebase user
            const isAdm = fbUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
            profile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0],
              role: isAdm ? 'admin' : 'buyer',
              status: isAdm ? 'active' : 'pending',
              createdAt: Date.now(),
              approvedAt: isAdm ? Date.now() : undefined,
            };
            await storageService.saveUserProfile(profile);
          }
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Local session initialization
      const storedUid = localStorage.getItem(ACTIVE_SESSION_KEY) || 'admin-master-uid';
      loadUserFromUid(storedUid);
    }
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const cred = await signInWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
        await loadUserFromUid(cred.user.uid);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Falha na autenticação.' };
      }
    }

    // Local authentication fallback
    const allUsers = await storageService.getAllUsers();
    let found = allUsers.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!found) {
      // If user logs in with admin email and doesn't exist yet, auto create
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        found = {
          uid: 'admin-master-uid',
          email: ADMIN_EMAIL,
          displayName: 'Administrador Master',
          role: 'admin',
          status: 'active',
          createdAt: Date.now(),
          approvedAt: Date.now(),
        };
        await storageService.saveUserProfile(found);
      } else {
        setLoading(false);
        return { success: false, error: 'Usuário não encontrado com este e-mail.' };
      }
    }

    localStorage.setItem(ACTIVE_SESSION_KEY, found.uid);
    setUser(found);
    setLoading(false);
    return { success: true };
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

    if (isFirebaseConfigured && firebaseAuth) {
      try {
        const cred = await createUserWithEmailAndPassword(firebaseAuth, cleanEmail, pass);
        const profile: UserProfile = {
          uid: cred.user.uid,
          email: cleanEmail,
          displayName: name,
          businessName: businessName || '',
          role: isMasterAdmin ? 'admin' : 'buyer',
          status: isMasterAdmin ? 'active' : 'pending',
          createdAt: Date.now(),
          approvedAt: isMasterAdmin ? Date.now() : undefined,
        };
        await storageService.saveUserProfile(profile);
        setUser(profile);
        return { success: true };
      } catch (err: any) {
        setLoading(false);
        return { success: false, error: err.message || 'Falha ao cadastrar conta.' };
      }
    }

    // Local registration
    const allUsers = await storageService.getAllUsers();
    if (allUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setLoading(false);
      return { success: false, error: 'Este e-mail já está cadastrado no sistema.' };
    }

    const newUid = `user-${Date.now().toString(36)}`;
    const newProfile: UserProfile = {
      uid: newUid,
      email: cleanEmail,
      displayName: name,
      businessName: businessName || '',
      role: isMasterAdmin ? 'admin' : 'buyer',
      status: isMasterAdmin ? 'active' : 'pending',
      createdAt: Date.now(),
      approvedAt: isMasterAdmin ? Date.now() : undefined,
    };

    await storageService.saveUserProfile(newProfile);
    localStorage.setItem(ACTIVE_SESSION_KEY, newUid);
    setUser(newProfile);
    setLoading(false);
    return { success: true };
  };

  const logout = async (): Promise<void> => {
    if (isFirebaseConfigured && firebaseAuth) {
      await fbSignOut(firebaseAuth);
    }
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setUser(null);
  };

  // Helper for testing: quick switch between Admin, Active Buyer, Pending Buyer
  const switchUser = async (role: 'admin' | 'buyer_active' | 'buyer_pending') => {
    setLoading(true);
    const allUsers = await storageService.getAllUsers();
    let target: UserProfile | undefined;

    if (role === 'admin') {
      target = allUsers.find((u) => u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    } else if (role === 'buyer_active') {
      target = allUsers.find((u) => u.role === 'buyer' && u.status === 'active');
    } else if (role === 'buyer_pending') {
      target = allUsers.find((u) => u.status === 'pending');
    }

    if (target) {
      localStorage.setItem(ACTIVE_SESSION_KEY, target.uid);
      setUser(target);
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (user) {
      await loadUserFromUid(user.uid);
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
        loading,
        isAdmin: Boolean(isAdmin),
        isActive: Boolean(isActive),
        isPending: Boolean(isPending),
        isBlocked: Boolean(isBlocked),
        login,
        register,
        logout,
        switchUser,
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
