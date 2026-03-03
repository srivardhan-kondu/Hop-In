import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
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

export async function listOpenAlerts() {
  const snap = await getDocs(query(collection(db, 'emergencyAlerts'), where('status', '==', 'open'), orderBy('timestamp', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribeOpenAlerts(callback) {
  return onSnapshot(
    query(collection(db, 'emergencyAlerts'), where('status', '==', 'open'), orderBy('timestamp', 'desc')),
    (snap) => {
      callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
  );
}

export async function resolveAlert(alertId, adminNotes) {
  await updateDoc(doc(db, 'emergencyAlerts', alertId), {
    status: 'resolved',
    adminNotes,
  });
}
