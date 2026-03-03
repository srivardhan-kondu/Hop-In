import {
  addDoc,
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export async function createUserNotification({ userId, title, body, type = 'info', data = {} }) {
  await addDoc(collection(db, 'notifications'), {
    userId,
    title,
    body,
    type,
    data,
    createdAt: serverTimestamp(),
  });
}

export async function listNotificationsByUser(userId, limitCount = 10) {
  const snap = await getDocs(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
  );

  return snap.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function subscribeNotificationsByUser(userId, callback, limitCount = 10) {
  return onSnapshot(
    query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount),
    ),
    (snap) => {
      callback(snap.docs.map((item) => ({ id: item.id, ...item.data() })));
    },
  );
}
