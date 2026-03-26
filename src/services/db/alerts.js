import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function createEmergencyAlert(payload) {
  return addDoc(collection(db, 'emergencyAlerts'), {
    alertId: crypto.randomUUID(),
    status: 'open',
    adminNotes: '',
    timestamp: serverTimestamp(),
    ...payload,
  });
}

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  return value instanceof Date ? value : new Date(value);
}

export async function listOpenAlerts() {
  // Query by status only — sort client-side to avoid composite index requirement
  const snap = await getDocs(
    query(collection(db, 'emergencyAlerts'), where('status', '==', 'open')),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const da = toDate(a.timestamp);
      const db2 = toDate(b.timestamp);
      return (db2?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
}

export function subscribeOpenAlerts(callback) {
  return onSnapshot(
    query(collection(db, 'emergencyAlerts'), where('status', '==', 'open')),
    (snap) => {
      const rows = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => {
          const da = toDate(a.timestamp);
          const db2 = toDate(b.timestamp);
          return (db2?.getTime() ?? 0) - (da?.getTime() ?? 0);
        });
      callback(rows);
    },
  );
}

export async function resolveAlert(alertId, adminNotes) {
  await updateDoc(doc(db, 'emergencyAlerts', alertId), {
    status: 'resolved',
    adminNotes,
  });
}
