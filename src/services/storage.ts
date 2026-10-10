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
  onSnapshot,
  orderBy,
  Unsubscribe,
  writeBatch
} from 'firebase/firestore';
import { Batch, GlobalCounter, ModelCalibration, Plaque, SystemStats, UserProfile } from '../types';
import { OFFICIAL_MODELS, ADMIN_EMAIL } from '../config/models';
import { formatSequence, generatePlaqueId, sanitizeUrl } from '../utils/formatters';

// Storage cache fallback for offline/disconnected states
const LS_USERS = 'dinamico_pro_users';
const LS_BATCHES = 'dinamico_pro_batches';
const LS_PLAQUES = 'dinamico_pro_plaques';
const LS_COUNTER = 'dinamico_pro_counter';
const LS_CALIBRATIONS = 'dinamico_pro_calibrations';

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
    console.error('Erro ao gravar no cache local:', err);
  }
}

export const storageService = {
  // ==========================================
  // REAL-TIME USERS MANAGEMENT
  // ==========================================

  /**
   * Listen to all users in real-time for the Admin Panel
   */
  subscribeToUsers(
    onSuccess: (users: UserProfile[]) => void,
    onError: (err: any) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      try {
        const usersRef = collection(db, 'users');
        return onSnapshot(
          usersRef,
          (snapshot) => {
            const list: UserProfile[] = [];
            snapshot.forEach((d) => {
              list.push(d.data() as UserProfile);
            });
            // Sort by creation date descending
            list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            // Cache locally
            setLocal(LS_USERS, list);
            onSuccess(list);
          },
          (err) => {
            console.error('Erro no snapshot do Firestore para usuários:', err);
            onError(err);
          }
        );
      } catch (err) {
        console.error('Erro ao iniciar listener de usuários:', err);
        onError(err);
      }
    }

    // Fallback: local store listener
    const emitLocal = () => onSuccess(getLocal<UserProfile[]>(LS_USERS, []));
    emitLocal();
    const handler = () => emitLocal();
    window.addEventListener('dinamico_store_changed', handler);
    return () => window.removeEventListener('dinamico_store_changed', handler);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) {
          return snap.data() as UserProfile;
        }
      } catch (err) {
        console.warn('Erro ao buscar perfil no Firestore:', err);
      }
    }
    const users = getLocal<UserProfile[]>(LS_USERS, []);
    return users.find((u) => u.uid === uid) || null;
  },

  async saveUserProfile(profile: UserProfile): Promise<void> {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
    }
    const users = getLocal<UserProfile[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.uid === profile.uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...profile };
    } else {
      users.unshift(profile);
    }
    setLocal(LS_USERS, users);
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (isFirebaseConfigured && db) {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map((d) => d.data() as UserProfile);
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return list;
    }
    return getLocal<UserProfile[]>(LS_USERS, []);
  },

  async updateUserStatus(
    uid: string,
    status: 'active' | 'blocked' | 'pending',
    adminEmail: string
  ): Promise<void> {
    const updateData: Partial<UserProfile> = {
      status,
      approvedAt: status === 'active' ? Date.now() : undefined,
      approvedBy: status === 'active' ? adminEmail : undefined
    };

    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', uid), updateData);
    }

    const users = getLocal<UserProfile[]>(LS_USERS, []);
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...updateData };
      setLocal(LS_USERS, users);
    }
  },

  // ==========================================
  // ATOMIC SEQUENCE RESERVATION
  // ==========================================

  async reserveSequenceRange(quantity: number): Promise<{ start: number; end: number }> {
    if (quantity <= 0) throw new Error('Quantidade inválida para reserva.');

    if (isFirebaseConfigured && db) {
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
    }

    // Local atomic fallback
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

  // ==========================================
  // BATCH CREATION (LIGHTWEIGHT - ZERO AUTO PDF)
  // ==========================================

  /**
   * Creates a batch and registers individual plaques in Firestore.
   * NOTE: As strictly requested, does NOT generate or store any PDF/PNG files.
   * Exports happen strictly on-demand in the browser when the user clicks download!
   */
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

    // Write batch and plaques atomically to Firestore using writeBatch
    if (isFirebaseConfigured && db) {
      const wb = writeBatch(db);
      wb.set(doc(db, 'batches', batch.id), batch);

      // Max 500 writes in a Firestore batch, process in chunks of 400
      for (const p of plaques) {
        wb.set(doc(db, 'plaques', p.id), p);
      }
      await wb.commit();
    }

    // Keep client cache updated
    const batches = getLocal<Batch[]>(LS_BATCHES, []);
    batches.unshift(batch);
    setLocal(LS_BATCHES, batches);

    const existingPlaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    setLocal(LS_PLAQUES, [...plaques, ...existingPlaques]);

    return { batch, plaques };
  },

  async getUserBatches(userId: string, isAdmin = false): Promise<Batch[]> {
    if (isFirebaseConfigured && db) {
      const colRef = collection(db, 'batches');
      const q = isAdmin ? query(colRef) : query(colRef, where('userId', '==', userId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as Batch);
      list.sort((a, b) => b.createdAt - a.createdAt);
      return list;
    }
    const all = getLocal<Batch[]>(LS_BATCHES, []);
    if (isAdmin) return all;
    return all.filter((b) => b.userId === userId);
  },

  async getBatchById(batchId: string): Promise<Batch | null> {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'batches', batchId));
      if (snap.exists()) return snap.data() as Batch;
    }
    const batches = getLocal<Batch[]>(LS_BATCHES, []);
    return batches.find((b) => b.id === batchId) || null;
  },

  async getBatchPlaques(batchId: string): Promise<Plaque[]> {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, 'plaques'),
        where('batchId', '==', batchId)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data() as Plaque);
      return list.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    }
    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    return plaques
      .filter((p) => p.batchId === batchId)
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber);
  },

  // ==========================================
  // PLAQUE MANAGEMENT & DYNAMIC REDIRECT
  // ==========================================

  async getPlaqueById(plaqueId: string): Promise<Plaque | null> {
    if (isFirebaseConfigured && db) {
      const snap = await getDoc(doc(db, 'plaques', plaqueId));
      if (snap.exists()) return snap.data() as Plaque;
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
      await updateDoc(doc(db, 'plaques', plaqueId), {
        destinationUrl: cleanUrl,
        updatedAt: Date.now()
      });
    }

    const plaques = getLocal<Plaque[]>(LS_PLAQUES, []);
    const idx = plaques.findIndex((p) => p.id === plaqueId);
    if (idx >= 0) {
      plaques[idx] = updated;
      setLocal(LS_PLAQUES, plaques);
    }

    return updated;
  },

  /**
   * Public redirect scan handler:
   * Records scan event and returns the target URL
   */
  async recordScanAndGetDestination(plaqueId: string): Promise<string> {
    const plaque = await this.getPlaqueById(plaqueId);
    if (!plaque) return 'https://dinamicopro.com';

    if (isFirebaseConfigured && db) {
      try {
        await updateDoc(doc(db, 'plaques', plaqueId), {
          scanCount: increment(1),
          lastScannedAt: Date.now()
        });
        await setDoc(
          doc(db, 'system', 'counters'),
          { totalScansRecorded: increment(1) },
          { merge: true }
        );
      } catch (err) {
        console.warn('Erro ao registrar scan no Firestore:', err);
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

  // ==========================================
  // MODEL CALIBRATIONS
  // ==========================================

  async getModelCalibrations(): Promise<ModelCalibration[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'models'));
        if (!snap.empty) {
          const list = snap.docs.map((d) => d.data() as ModelCalibration);
          return OFFICIAL_MODELS.map((def) => {
            const found = list.find((m) => m.id === def.id);
            return found || def;
          });
        }
      } catch (err) {
        console.warn('Erro ao ler modelos do Firestore:', err);
      }
    }

    const stored = getLocal<ModelCalibration[]>(LS_CALIBRATIONS, []);
    if (stored.length === 8) return stored;

    const merged = OFFICIAL_MODELS.map((def) => {
      const match = stored.find((s) => s.id === def.id);
      return match || def;
    });
    setLocal(LS_CALIBRATIONS, merged);
    return merged;
  },

  async saveModelCalibration(calibration: ModelCalibration): Promise<void> {
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'models', String(calibration.id)), {
        ...calibration,
        lastUpdated: Date.now()
      });
    }

    const current = await this.getModelCalibrations();
    const idx = current.findIndex((c) => c.id === calibration.id);
    if (idx >= 0) {
      current[idx] = { ...calibration, lastUpdated: Date.now() };
    } else {
      current.push({ ...calibration, lastUpdated: Date.now() });
    }
    setLocal(LS_CALIBRATIONS, current);
  },

  // ==========================================
  // REAL SYSTEM STATS (NO FAKE / ZERO MOCK NUMBERS)
  // ==========================================

  async getSystemStats(): Promise<SystemStats> {
    if (isFirebaseConfigured && db) {
      try {
        const [usersSnap, batchesSnap, plaquesSnap, counterDoc] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'batches')),
          getDocs(collection(db, 'plaques')),
          getDoc(doc(db, 'system', 'counters'))
        ]);

        const allUsers = usersSnap.docs.map((d) => d.data() as UserProfile);
        const buyerUsers = allUsers.filter((u) => u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase());

        let totalScans = 0;
        if (counterDoc.exists()) {
          totalScans = (counterDoc.data().totalScansRecorded as number) || 0;
        } else {
          // Sum scanCounts of all plaques
          plaquesSnap.docs.forEach((d) => {
            totalScans += (d.data().scanCount as number) || 0;
          });
        }

        return {
          totalUsers: buyerUsers.length,
          pendingUsers: buyerUsers.filter((u) => u.status === 'pending').length,
          activeUsers: buyerUsers.filter((u) => u.status === 'active').length,
          blockedUsers: buyerUsers.filter((u) => u.status === 'blocked').length,
          totalBatches: batchesSnap.size,
          totalPlaques: plaquesSnap.size,
          totalScans
        };
      } catch (err) {
        console.error('Falha ao calcular estatísticas reais do Firestore:', err);
        throw new Error('Não foi possível carregar os dados reais do Firestore.');
      }
    }

    // Local fallback: count actual stored items without mock increments
    const users = getLocal<UserProfile[]>(LS_USERS, []).filter((u) => u.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase());
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
      totalScans: counter.totalScansRecorded || 0
    };
  }
};
