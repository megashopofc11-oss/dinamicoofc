import { db, isFirebaseConfigured } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  runTransaction,
  increment,
  onSnapshot
} from 'firebase/firestore';
import { Batch, GlobalCounter, ModelCalibration, Plaque, SystemStats, UserProfile } from '../types';
import { OFFICIAL_MODELS, ADMIN_EMAIL } from '../config/models';
import { formatSequence, generatePlaqueId, sanitizeUrl } from '../utils/formatters';

// Keys for local storage fallback
const LS_USERS = 'dinamico_pro_users';
const LS_BATCHES = 'dinamico_pro_batches';
const LS_PLAQUES = 'dinamico_pro_plaques';
const LS_COUNTER = 'dinamico_pro_counter';
const LS_CALIBRATIONS = 'dinamico_pro_calibrations';

// --- Local Storage Helpers ---
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('dinamico_store_changed'));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
}

// Initial seed data if local storage is empty
export function seedInitialLocalData(): void {
  const users = getLocal<UserProfile[]>(LS_USERS, []);
  if (users.length === 0) {
    const initialUsers: UserProfile[] = [
      {
        uid: 'admin-master-uid',
        email: ADMIN_EMAIL,
        displayName: 'Administrador Master',
        role: 'admin',
        status: 'active',
        createdAt: Date.now() - 86400000 * 30,
        approvedAt: Date.now() - 86400000 * 30,
      },
      {
        uid: 'comprador-demo-1',
        email: 'cliente@exemplo.com.br',
        displayName: 'Carlos Gráfica Rápida',
        role: 'buyer',
        status: 'active',
        createdAt: Date.now() - 86400000 * 10,
        approvedAt: Date.now() - 86400000 * 9,
        approvedBy: ADMIN_EMAIL,
        businessName: 'Gráfica Express',
      },
      {
        uid: 'comprador-pending-2',
        email: 'novocliente@teste.com',
        displayName: 'Mariana Comunicação Visual',
        role: 'buyer',
        status: 'pending',
        createdAt: Date.now() - 3600000 * 2,
        businessName: 'Print & Midia',
      }
    ];
    setLocal(LS_USERS, initialUsers);
  }

  const counter = getLocal<GlobalCounter>(LS_COUNTER, {
    lastSequenceNumber: 0,
    totalBatchesCreated: 0,
    totalPlaquesCreated: 0,
    totalScansRecorded: 0
  });
  if (!localStorage.getItem(LS_COUNTER)) {
    setLocal(LS_COUNTER, counter);
  }

  // Seed sample batch for demonstration if plaques are empty
  const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
  if (plaques.length === 0) {
    const sampleBatchId = 'batch-seed-01';
    const sampleBatch: Batch = {
      id: sampleBatchId,
      name: 'Lote Inaugural - Instagram & Reviews',
      userId: 'comprador-demo-1',
      userEmail: 'cliente@exemplo.com.br',
      modelId: 1,
      modelName: OFFICIAL_MODELS[0].name,
      quantity: 4,
      startSequenceNumber: 1,
      endSequenceNumber: 4,
      createdAt: Date.now() - 86400000 * 2,
      defaultDestinationUrl: 'https://instagram.com'
    };
    setLocal(LS_BATCHES, [sampleBatch]);

    const samplePlaques: Plaque[] = [];
    for (let i = 1; i <= 4; i++) {
      const pid = generatePlaqueId();
      samplePlaques.push({
        id: pid,
        sequenceNumber: i,
        formattedNumber: formatSequence(i),
        batchId: sampleBatchId,
        userId: 'comprador-demo-1',
        modelId: 1,
        destinationUrl: 'https://instagram.com/dinamicopro',
        permanentUrl: `${window.location.origin}/r/${pid}`,
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000 * 2,
        scanCount: Math.floor(Math.random() * 25)
      });
    }
    setLocal(LS_PLAQUES, samplePlaques);
    setLocal(LS_COUNTER, {
      lastSequenceNumber: 4,
      totalBatchesCreated: 1,
      totalPlaquesCreated: 4,
      totalScansRecorded: 18
    });
  }
}

// Ensure seed data is initialized
seedInitialLocalData();

// --- DATA ACCESS LAYER ---

export const storageService = {
  // USER PROFILES
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) return snap.data() as UserProfile;
      } catch (e) {
        console.warn('Erro ao buscar perfil no Firestore, recorrendo a local:', e);
      }
    }
    const users = getLocal<UserProfile[]>(LS_USERS, []);
    return users.find((u) => u.uid === uid) || null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
      } catch (e) {
        console.warn('Erro ao salvar no Firestore:', e);
      }
    }
    const users = getLocal<UserProfile[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.uid === profile.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
    } else {
      users.push(profile);
    }
    setLocal(LS_USERS, users);
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'users'));
        return snap.docs.map((d) => d.data() as UserProfile);
      } catch (e) {
        console.warn('Erro ao buscar usuários no Firestore:', e);
      }
    }
    return getLocal<UserProfile[]>(LS_USERS, []);
  },

  async updateUserStatus(uid: string, status: 'active' | 'blocked' | 'pending', adminEmail: string): Promise<void> {
    const updateData: Partial<UserProfile> = {
      status,
      approvedAt: status === 'active' ? Date.now() : undefined,
      approvedBy: status === 'active' ? adminEmail : undefined
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'users', uid), updateData);
      } catch (e) {
        console.warn('Erro ao atualizar status no Firestore:', e);
      }
    }

    const users = getLocal<UserProfile[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updateData };
      setLocal(LS_USERS, users);
    }
  },

  // ATOMIC SEQUENCE RESERVATION
  async reserveSequenceRange(quantity: number): Promise<{ start: number; end: number }> {
    if (quantity <= 0) throw new Error('Quantidade inválida para reserva.');

    if (isFirebaseConfigured && db) {
      try {
        const counterRef = doc(db, 'system', 'counters');
        const range = await runTransaction(db, async (txn) => {
          const counterDoc = await txn.get(counterRef);
          let current = 0;
          if (counterDoc.exists()) {
            current = (counterDoc.data().lastSequenceNumber as number) || 0;
          }
          const nextStart = current + 1;
          const nextEnd = current + quantity;

          txn.set(
            counterRef,
            {
              lastSequenceNumber: nextEnd,
              totalPlaquesCreated: increment(quantity),
              totalBatchesCreated: increment(1)
            },
            { merge: true }
          );

          return { start: nextStart, end: nextEnd };
        });
        return range;
      } catch (e) {
        console.warn('Erro na transação Firestore, usando reserva local segura:', e);
      }
    }

    // Local atomic reservation
    const counter = getLocal<GlobalCounter>(LS_COUNTER, {
      lastSequenceNumber: 0,
      totalBatchesCreated: 0,
      totalPlaquesCreated: 0,
      totalScansRecorded: 0
    });

    const start = counter.lastSequenceNumber + 1;
    const end = counter.lastSequenceNumber + quantity;

    counter.lastSequenceNumber = end;
    counter.totalPlaquesCreated += quantity;
    counter.totalBatchesCreated += 1;
    setLocal(LS_COUNTER, counter);

    return { start, end };
  },

  // BATCH OPERATIONS
  async createBatch(
    batchData: Omit<Batch, 'id' | 'createdAt' | 'startSequenceNumber' | 'endSequenceNumber'>,
    defaultDestinationUrl = 'https://dinamicopro.com'
  ): Promise<{ batch: Batch; plaques: Plaque[] }> {
    const range = await this.reserveSequenceRange(batchData.quantity);
    const batchId = `lote-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    const batch: Batch = {
      ...batchData,
      id: batchId,
      startSequenceNumber: range.start,
      endSequenceNumber: range.end,
      createdAt: now,
      defaultDestinationUrl: sanitizeUrl(defaultDestinationUrl)
    };

    const plaques: Plaque[] = [];
    for (let seq = range.start; seq <= range.end; seq++) {
      const plaqueId = generatePlaqueId();
      plaques.push({
        id: plaqueId,
        sequenceNumber: seq,
        formattedNumber: formatSequence(seq),
        batchId,
        userId: batchData.userId,
        modelId: batchData.modelId,
        destinationUrl: sanitizeUrl(defaultDestinationUrl),
        permanentUrl: `${window.location.origin}/r/${plaqueId}`,
        createdAt: now,
        updatedAt: now,
        scanCount: 0
      });
    }

    // Persist to Firestore
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'batches', batch.id), batch);
        // Batch write plaques
        for (const p of plaques) {
          await setDoc(doc(db, 'plaques', p.id), p);
        }
      } catch (e) {
        console.warn('Erro ao salvar lote no Firestore:', e);
      }
    }

    // Persist to Local Storage
    const batches = getLocal<Batch[]>(LS_BATCHES, []);
    batches.unshift(batch);
    setLocal(LS_BATCHES, batches);

    const existingPlaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    setLocal(LS_PLAQUES, [...plaques, ...existingPlaques]);

    return { batch, plaques };
  },

  async getUserBatches(userId: string, isAdmin = false): Promise<Batch[]> {
    if (isFirebaseConfigured && db) {
      try {
        const colRef = collection(db, 'batches');
        const q = isAdmin ? colRef : query(colRef, where('userId', '==', userId));
        const snap = await getDocs(q);
        return snap.docs.map((d) => d.data() as Batch);
      } catch (e) {
        console.warn('Erro ao buscar lotes no Firestore:', e);
      }
    }
    const all = getLocal<Batch[]>(LS_BATCHES, []);
    if (isAdmin) return all;
    return all.filter((b) => b.userId === userId);
  },

  async getBatchById(batchId: string): Promise<Batch | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'batches', batchId));
        if (snap.exists()) return snap.data() as Batch;
      } catch (e) {
        console.warn('Erro ao buscar lote no Firestore:', e);
      }
    }
    const batches = getLocal<Batch[]>(LS_BATCHES, []);
    return batches.find((b) => b.id === batchId) || null;
  },

  async getBatchPlaques(batchId: string): Promise<Plaque[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'plaques'), where('batchId', '==', batchId));
        const snap = await getDocs(q);
        const list = snap.docs.map((d) => d.data() as Plaque);
        return list.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      } catch (e) {
        console.warn('Erro ao buscar plaquinhas do lote no Firestore:', e);
      }
    }
    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    return plaques
      .filter((p) => p.batchId === batchId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  // PLAQUE MANAGEMENT
  async getPlaqueById(plaqueId: string): Promise<Plaque | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'plaques', plaqueId));
        if (snap.exists()) return snap.data() as Plaque;
      } catch (e) {
        console.warn('Erro ao buscar plaquinha no Firestore:', e);
      }
    }
    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    return plaques.find((p) => p.id === plaqueId) || null;
  },

  async updatePlaqueDestination(
    plaqueId: string,
    newDestinationUrl: string,
    userId: string,
    isAdmin = false
  ): Promise<Plaque> {
    const cleanUrl = sanitizeUrl(newDestinationUrl);
    const existing = await this.getPlaqueById(plaqueId);
    if (!existing) throw new Error('Plaquinha não encontrada.');
    if (!isAdmin && existing.userId !== userId) {
      throw new Error('Permissão negada. Você não é o proprietário desta plaquinha.');
    }

    const updated: Plaque = {
      ...existing,
      destinationUrl: cleanUrl,
      updatedAt: Date.now()
    };

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'plaques', plaqueId), {
          destinationUrl: cleanUrl,
          updatedAt: Date.now()
        });
      } catch (e) {
        console.warn('Erro ao atualizar URL no Firestore:', e);
      }
    }

    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    const idx = plaques.findIndex((p) => p.id === plaqueId);
    if (idx >= 0) {
      plaques[idx] = updated;
      setLocal(LS_PLAQUES, plaques);
    }

    return updated;
  },

  // REDIRECT SCAN HANDLER (Public route /r/:id)
  async recordScanAndGetDestination(plaqueId: string): Promise<string> {
    const plaque = await this.getPlaqueById(plaqueId);
    if (!plaque) return 'https://dinamicopro.com';

    // Increment scan counters
    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'plaques', plaqueId), {
          scanCount: increment(1),
          lastScannedAt: Date.now()
        });
        await updateDoc(doc(db, 'system', 'counters'), {
          totalScansRecorded: increment(1)
        });
      } catch (e) {
        console.warn('Erro ao registrar scan no Firestore:', e);
      }
    }

    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    const idx = plaques.findIndex((p) => p.id === plaqueId);
    if (idx >= 0) {
      plaques[idx].scanCount = (plaques[idx].scanCount || 0) + 1;
      plaques[idx].lastScannedAt = Date.now();
      setLocal(LS_PLAQUES, plaques);
    }

    const counter = getLocal<GlobalCounter>(LS_COUNTER, {
      lastSequenceNumber: 0,
      totalBatchesCreated: 0,
      totalPlaquesCreated: 0,
      totalScansRecorded: 0
    });
    counter.totalScansRecorded += 1;
    setLocal(LS_COUNTER, counter);

    return plaque.destinationUrl || 'https://google.com';
  },

  // MODEL CALIBRATIONS
  async getModelCalibrations(): Promise<ModelCalibration[]> {
    const stored = getLocal<ModelCalibration[]>(LS_CALIBRATIONS, []);
    if (stored.length === 8) return stored;

    // Merge defaults with any overrides
    const merged = OFFICIAL_MODELS.map((defaultMod) => {
      const match = stored.find((s) => s.id === defaultMod.id);
      return match || defaultMod;
    });

    setLocal(LS_CALIBRATIONS, merged);
    return merged;
  },

  async saveModelCalibration(calibration: ModelCalibration): Promise<void> {
    const current = await this.getModelCalibrations();
    const idx = current.findIndex((c) => c.id === calibration.id);
    if (idx >= 0) {
      current[idx] = { ...calibration, lastUpdated: Date.now() };
    } else {
      current.push({ ...calibration, lastUpdated: Date.now() });
    }
    setLocal(LS_CALIBRATIONS, current);

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'models', String(calibration.id)), calibration);
      } catch (e) {
        console.warn('Erro ao salvar calibração no Firestore:', e);
      }
    }
  },

  // SYSTEM STATS
  async getSystemStats(): Promise<SystemStats> {
    const users = await this.getAllUsers();
    const batches = getLocal<Batch[]>(LS_BATCHES, []);
    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    const counter = getLocal<GlobalCounter>(LS_COUNTER, {
      lastSequenceNumber: 0,
      totalBatchesCreated: 0,
      totalPlaquesCreated: 0,
      totalScansRecorded: 0
    });

    return {
      totalUsers: users.length,
      pendingUsers: users.filter((u) => u.status === 'pending').length,
      activeUsers: users.filter((u) => u.status === 'active').length,
      blockedUsers: users.filter((u) => u.status === 'blocked').length,
      totalBatches: batches.length,
      totalPlaques: plaques.length,
      totalScans: counter.totalScansRecorded
    };
  }
};
