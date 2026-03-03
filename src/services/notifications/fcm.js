import { getToken } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db, getMessagingClient } from '../../lib/firebase';

export async function registerFcmToken(userId) {
  const messaging = await getMessagingClient();
  if (!messaging || !userId) return null;
  if (typeof Notification === 'undefined') return null;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  const token = await getToken(messaging, { vapidKey });

  if (!token) return null;

  await setDoc(doc(db, 'fcmTokens', userId), { userId, token }, { merge: true });
  return token;
}
