import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function createUserProfile(userId, data) {
  await setDoc(doc(db, 'users', userId), {
    userId,
    createdAt: serverTimestamp(),
    ...data,
  });
}

export async function getUserById(userId) {
  const snap = await getDoc(doc(db, 'users', userId));
  return snap.exists() ? snap.data() : null;
}

export async function listPendingDrivers() {
  const q = query(collection(db, 'users'), where('role', '==', 'driver'), where('verificationStatus', '==', 'pending'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function subscribePendingDrivers(callback) {
  const q = query(collection(db, 'users'), where('role', '==', 'driver'), where('verificationStatus', '==', 'pending'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
  });
}

export async function updateDriverVerification(userId, isApproved) {
  await updateDoc(doc(db, 'users', userId), {
    verificationStatus: isApproved ? 'approved' : 'rejected',
    aadhaarVerified: isApproved,
  });

  const userSnap = await getDoc(doc(db, 'users', userId));
  const vanId = userSnap.data()?.vanDetails?.vanId;
  if (!vanId) return;

  await updateDoc(doc(db, 'vans', vanId), {
    driverVerified: isApproved,
  });
}
