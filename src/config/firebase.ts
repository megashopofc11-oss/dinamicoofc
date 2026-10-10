import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

// Read Vite client environment variables
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || 'teste-c625b';
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;

// Check stored override in localStorage (allows runtime connection testing)
const storedCustomConfig = (() => {
  try {
    const raw = localStorage.getItem('dinamico_pro_custom_firebase');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const firebaseConfig: FirebaseEnvConfig = {
  apiKey: storedCustomConfig?.apiKey || envApiKey,
  authDomain: storedCustomConfig?.authDomain || envAuthDomain,
  projectId: storedCustomConfig?.projectId || envProjectId,
  storageBucket: storedCustomConfig?.storageBucket || envStorageBucket,
  messagingSenderId: storedCustomConfig?.messagingSenderId || envMessagingSenderId,
  appId: storedCustomConfig?.appId || envAppId,
};

export const isFirebaseConfigured: boolean = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 5 &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig as Record<string, string>) : getApps()[0];
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[DINÂMICO PRO] Firebase inicializado com sucesso para projeto:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[DINÂMICO PRO] Erro ao inicializar Firebase SDK:', err);
  }
} else {
  console.info('[DINÂMICO PRO] Modo Local/Simulado ativo. Para conectar ao Firestore real, preencha as variáveis VITE_FIREBASE_* ou configure no Painel.');
}

export { app, auth, db };
