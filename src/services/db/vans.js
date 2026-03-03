import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  updateDoc,
  where,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function createVanProfile(payload) {
  await setDoc(doc(db, 'vans', payload.vanId), {
    vanId: payload.vanId,
    driverId: payload.driverId,
    driverName: payload.driverName,
    driverVerified: false,
    schoolId: payload.schoolId ?? '',
    capacity: payload.capacity,
    currentVacancy: payload.currentVacancy,
    enrolledChildren: [],
    pricePerMonth: payload.pricePerMonth,
    route: payload.route ?? [],
    pickupTime: payload.pickupTime ?? '',
    dropTime: payload.dropTime ?? '',
    isActive: true,
    isActiveTrip: false,
    overallRating: 0,
  });
}

export async function listVansBySchool(schoolId, onlyVerified = false) {
  const constraints = [where('schoolId', '==', schoolId), where('isActive', '==', true)];
  if (onlyVerified) constraints.push(where('driverVerified', '==', true));
  const snap = await getDocs(query(collection(db, 'vans'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getVanById(vanId) {
  const snap = await getDoc(doc(db, 'vans', vanId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function isChildEnrolledInVan(vanId, childId) {
  const van = await getVanById(vanId);
  if (!van) return false;
  return (van.enrolledChildren ?? []).some((child) => child.childId === childId);
}

export async function enrollChildToVan({ vanId, child }) {
  await runTransaction(db, async (tx) => {
    const vanRef = doc(db, 'vans', vanId);
    const vanSnap = await tx.get(vanRef);
    if (!vanSnap.exists()) throw new Error('Van not found');

    const van = vanSnap.data();
    if (van.currentVacancy < 1) throw new Error('Van has no vacancy');

    const enrolledChildren = van.enrolledChildren ?? [];
    enrolledChildren.push(child);

    tx.update(vanRef, {
      enrolledChildren,
      currentVacancy: increment(-1),
    });
  });
}

export async function setVanTripState(vanId, isActive) {
  await updateDoc(doc(db, 'vans', vanId), { isActiveTrip: isActive });
}
