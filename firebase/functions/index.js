import { initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentUpdated, onDocumentWritten } from 'firebase-functions/v2/firestore';

initializeApp();
const db = getFirestore();

function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function sendToUser(userId, { title, body, data = {} }) {
  const tokenSnap = await db.collection('fcmTokens').doc(userId).get();
  const token = tokenSnap.data()?.token;

  if (token) {
    await getMessaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])),
    });
  }

  await db.collection('notifications').add({
    userId,
    title,
    body,
    data,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export const geoFenceAlerts = onDocumentWritten('driverLocations/{driverId}', async (event) => {
  const after = event.data?.after?.data();
  if (!after || !after.vanId || !after.isActiveTrip) return;
  if (!Number.isFinite(after.latitude) || !Number.isFinite(after.longitude)) return;

  const vanSnap = await db.collection('vans').doc(after.vanId).get();
  if (!vanSnap.exists) return;
  const van = vanSnap.data();

  const children = van.enrolledChildren ?? [];
  await Promise.all(
    children.map(async (child) => {
      const parentSnap = await db.collection('users').doc(child.parentId).get();
      const parent = parentSnap.data();
      const targetChild = (parent?.children ?? []).find((entry) => entry.childId === child.childId);
      if (!targetChild?.homeAddress) return;

      const distanceKm = haversineDistanceKm(
        after.latitude,
        after.longitude,
        targetChild.homeAddress.latitude,
        targetChild.homeAddress.longitude,
      );

      let level = 'none';
      let message = '';
      if (distanceKm <= 0.5) {
        level = 'almost_here';
        message = 'Van almost here — get ready!';
      } else if (distanceKm <= 1) {
        level = 'approaching';
        message = 'Van approaching — 1 km away';
      }

      const stateId = `${after.vanId}_${child.childId}`;
      const stateRef = db.collection('geoFenceState').doc(stateId);
      const stateSnap = await stateRef.get();
      const prev = stateSnap.data();

      const nowMs = Date.now();
      const lastSentMs = prev?.lastSentAt?.toMillis?.() ?? 0;
      const recentlySent = nowMs - lastSentMs < 180000;
      const sameLevel = prev?.level === level;

      await stateRef.set(
        {
          vanId: after.vanId,
          childId: child.childId,
          parentId: child.parentId,
          level,
          distanceKm: Number(distanceKm.toFixed(2)),
          updatedAt: FieldValue.serverTimestamp(),
          ...(level === 'none' ? {} : { lastSentAt: FieldValue.serverTimestamp() }),
        },
        { merge: true },
      );

      if (level === 'none' || (sameLevel && recentlySent)) return;

      await sendToUser(child.parentId, {
        title: 'Hop-In Alert',
        body: message,
        data: {
          type: 'geofence',
          vanId: after.vanId,
          childId: child.childId,
          distanceKm: Number(distanceKm.toFixed(2)),
          level,
        },
      });
    }),
  );
});

export const boardingNotification = onDocumentCreated('attendance/{attendanceId}', async (event) => {
  const row = event.data?.data();
  if (!row?.vanId || !row?.childId) return;

  const vanSnap = await db.collection('vans').doc(row.vanId).get();
  const van = vanSnap.data();
  const child = (van?.enrolledChildren ?? []).find((entry) => entry.childId === row.childId);
  if (!child?.parentId) return;

  await sendToUser(child.parentId, {
    title: 'Boarding Update',
    body: `${child.firstName ?? 'Your child'} has boarded the van`,
    data: {
      type: 'boarding',
      attendanceId: event.params.attendanceId,
      vanId: row.vanId,
      childId: row.childId,
    },
  });
});

export const schoolArrivalNotification = onDocumentUpdated('attendance/{attendanceId}', async (event) => {
  const before = event.data?.before?.data();
  const after = event.data?.after?.data();
  if (!after?.vanId || !after?.childId) return;
  if (before?.schoolArrivalTime || !after?.schoolArrivalTime) return;

  const vanSnap = await db.collection('vans').doc(after.vanId).get();
  const van = vanSnap.data();
  const child = (van?.enrolledChildren ?? []).find((entry) => entry.childId === after.childId);
  if (!child?.parentId) return;

  await sendToUser(child.parentId, {
    title: 'School Arrival',
    body: `${child.firstName ?? 'Your child'} has safely reached school`,
    data: {
      type: 'school_arrival',
      attendanceId: event.params.attendanceId,
      vanId: after.vanId,
      childId: after.childId,
    },
  });
});

export const emergencyAlertFanout = onDocumentCreated('emergencyAlerts/{alertId}', async (event) => {
  const after = event.data?.data();
  if (!after || after.status !== 'open') return;

  const admins = await db.collection('users').where('role', '==', 'admin').get();
  await Promise.all(
    admins.docs.map(async (adminDoc) => {
      await sendToUser(adminDoc.id, {
        title: 'Emergency Alert',
        body: `${after.role} reported: ${after.description}`,
        data: {
          type: 'emergency',
          alertId: event.params.alertId,
          vanId: after.vanId ?? '',
        },
      });
    }),
  );
});
