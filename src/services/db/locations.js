import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export function subscribeDriverLocation(driverId, callback) {
  return onSnapshot(doc(db, 'driverLocations', driverId), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function updateDriverLocation(driverId, payload) {
  await setDoc(
    doc(db, 'driverLocations', driverId),
    {
      driverId,
      timestamp: serverTimestamp(),
      ...payload,
    },
    { merge: true },
  );
}
