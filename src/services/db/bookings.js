import { collection, doc, getDocs, increment, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function createBookingAndEnroll(payload) {
  const bookingRef = doc(collection(db, 'bookings'));

  await runTransaction(db, async (tx) => {
    const parentRef = doc(db, 'users', payload.parentId);
    const vanRef = doc(db, 'vans', payload.vanId);
    const [parentSnap, vanSnap] = await Promise.all([tx.get(parentRef), tx.get(vanRef)]);

    if (!parentSnap.exists()) throw new Error('Parent profile not found');
    if (!vanSnap.exists()) throw new Error('Van not found');

    const parent = parentSnap.data();
    const van = vanSnap.data();
    if (Number(van.currentVacancy) < 1) throw new Error('Van has no vacancy');

    const targetChild = (parent.children ?? []).find((child) => child.childId === payload.childId);
    if (!targetChild) throw new Error('Child not found in parent profile');
    if (targetChild.activeBookingId) throw new Error('Child already has an active booking');

    const children = (parent.children ?? []).map((child) => {
      if (child.childId !== payload.childId) return child;
      return {
        ...child,
        activeBookingId: bookingRef.id,
        activeVanId: payload.vanId,
        activeDriverId: payload.driverId,
      };
    });

    const enrolledChildren = [...(van.enrolledChildren ?? [])];
    enrolledChildren.push({
      childId: payload.childId,
      firstName: payload.childFirstName,
      parentId: payload.parentId,
    });

    tx.set(bookingRef, {
      bookingId: bookingRef.id,
      parentId: payload.parentId,
      childId: payload.childId,
      driverId: payload.driverId,
      vanId: payload.vanId,
      contractMonths: Number(payload.contractMonths),
      monthlyPrice: Number(payload.monthlyPrice),
      totalValue: Number(payload.contractMonths) * Number(payload.monthlyPrice),
      startDate: payload.startDate,
      endDate: payload.endDate,
      status: 'active',
      paymentStatus: 'completed',
      createdAt: serverTimestamp(),
    });

    tx.update(parentRef, { children });
    tx.update(vanRef, { enrolledChildren, currentVacancy: increment(-1) });
  });

  return bookingRef.id;
}

export async function listParentBookings(parentId) {
  const snap = await getDocs(query(collection(db, 'bookings'), where('parentId', '==', parentId)));
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function listEligibleBookingsForReview(parentId, driverId) {
  const snap = await getDocs(
    query(
      collection(db, 'bookings'),
      where('parentId', '==', parentId),
      where('driverId', '==', driverId),
      where('status', 'in', ['active', 'completed']),
    ),
  );
  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}
