import {
  addDoc,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { endOfDay, startOfDay } from 'date-fns';
import { db } from '../../lib/firebase';

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  return value instanceof Date ? value : new Date(value);
}

export async function markBoarding({ childId, vanId, boardingLocation }) {
  const from = startOfDay(new Date());
  const to = endOfDay(new Date());

  const todaySnap = await getDocs(
    query(
      collection(db, 'attendance'),
      where('childId', '==', childId),
      where('vanId', '==', vanId),
    ),
  );

  const alreadyMarked = todaySnap.docs.some((item) => {
    const docDate = toDate(item.data().date);
    return docDate && docDate >= from && docDate <= to;
  });

  if (alreadyMarked) {
    throw new Error('Child already marked for today');
  }

  const ref = await addDoc(collection(db, 'attendance'), {
    attendanceId: crypto.randomUUID(),
    childId,
    vanId,
    date: serverTimestamp(),
    boardingTime: serverTimestamp(),
    boardingLocation,
    schoolArrivalTime: null,
    dropBoardingTime: null,
    homeArrivalTime: null,
  });

  return ref.id;
}

export async function markSchoolArrival(attendanceId) {
  await updateDoc(doc(db, 'attendance', attendanceId), {
    schoolArrivalTime: serverTimestamp(),
  });
}

export async function markSchoolArrivalForVan(vanId) {
  const from = startOfDay(new Date());
  const to = endOfDay(new Date());

  const snap = await getDocs(
    query(
      collection(db, 'attendance'),
      where('vanId', '==', vanId),
    ),
  );

  const batch = writeBatch(db);
  let updates = 0;

  snap.docs.forEach((item) => {
    const data = item.data();
    const docDate = toDate(data.date);
    if (!docDate || docDate < from || docDate > to) return;
    if (data.schoolArrivalTime) return;
    batch.update(item.ref, { schoolArrivalTime: serverTimestamp() });
    updates += 1;
  });

  if (updates > 0) {
    await batch.commit();
  }

  return updates;
}

export async function listTodayAttendanceByVan(vanId) {
  const from = startOfDay(new Date());
  const to = endOfDay(new Date());

  const snap = await getDocs(
    query(
      collection(db, 'attendance'),
      where('vanId', '==', vanId),
    ),
  );

  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((row) => {
      const docDate = toDate(row.date);
      return docDate && docDate >= from && docDate <= to;
    })
    .sort((a, b) => {
      const da = toDate(a.date);
      const db2 = toDate(b.date);
      return (db2?.getTime() ?? 0) - (da?.getTime() ?? 0);
    });
}

export async function listAttendanceByChild(childId, filters = {}) {
  const constraints = [where('childId', '==', childId), orderBy('date', 'desc')];

  if (filters.from) constraints.push(where('date', '>=', startOfDay(new Date(filters.from))));
  if (filters.to) constraints.push(where('date', '<=', endOfDay(new Date(filters.to))));

  const snap = await getDocs(query(collection(db, 'attendance'), ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function attendanceToCsv(rows) {
  const headers = ['Date', 'Boarding Time', 'School Arrival Time', 'Drop Boarding Time', 'Home Arrival Time'];
  const body = rows.map((row) => {
    const date = toDate(row.date)?.toISOString() ?? '';
    const boarding = toDate(row.boardingTime)?.toISOString() ?? '';
    const schoolArrival = toDate(row.schoolArrivalTime)?.toISOString() ?? '';
    const dropBoarding = toDate(row.dropBoardingTime)?.toISOString() ?? '';
    const homeArrival = toDate(row.homeArrivalTime)?.toISOString() ?? '';
    return [date, boarding, schoolArrival, dropBoarding, homeArrival].join(',');
  });

  return [headers.join(','), ...body].join('\n');
}
