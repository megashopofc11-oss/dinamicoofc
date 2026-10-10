import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  firestoreDatabaseId?: string;
}

// Read Vite client environment variables or use the provisioned applet config
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY || appletConfig.apiKey;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId;
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID || appletConfig.appId;
const databaseId = (appletConfig as any).firestoreDatabaseId || '(default)';

export const firebaseConfig: FirebaseEnvConfig = {
  apiKey: envApiKey,
  authDomain: envAuthDomain,
  projectId: envProjectId,
  storageBucket: envStorageBucket,
  messagingSenderId: envMessagingSenderId,
  appId: envAppId,
  firestoreDatabaseId: databaseId,
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
    // Set local persistence so user session stays across refreshes
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[DINÂMICO PRO] Aviso ao definir persistência do Auth:', err);
    });

    // Connect to the specific provisioned Firestore database
    if (databaseId && databaseId !== '(default)') {
      db = getFirestore(app, databaseId);
    } else {
      db = getFirestore(app);
    }
    console.log('[DINÂMICO PRO] Firebase conectado com sucesso!', {
      projectId: firebaseConfig.projectId,
      databaseId: databaseId
    });
  } catch (err) {
    console.error('[DINÂMICO PRO] Erro ao inicializar Firebase SDK:', err);
  }
}

export { app, auth, db };
