import dayjs from 'dayjs';
import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

function toDate(value) {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  return value instanceof Date ? value : new Date(value);
}

function minutesFromPickup(pickupTime, value) {
  if (!pickupTime || !value) return null;
  const [hours, minutes] = pickupTime.split(':').map((v) => Number(v));
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;

  const reference = dayjs(value).hour(hours).minute(minutes).second(0).millisecond(0);
  return dayjs(value).diff(reference, 'minute');
}

export async function getDriverOperationalMetrics(driverId) {
  const vansSnap = await getDocs(query(collection(db, 'vans'), where('driverId', '==', driverId)));
  const vans = vansSnap.docs.map((item) => item.data());

  if (!vans.length) {
    return {
      attendanceAccuracy: 95,
      punctualityScore: 95,
      tripCompletionRate: 100,
    };
  }

  let totalExpected = 0;
  let totalRecords = 0;
  let punctualRecords = 0;
  let punctualTotal = 0;
  let completedTrips = 0;

  for (const van of vans) {
    const attendanceSnap = await getDocs(query(collection(db, 'attendance'), where('vanId', '==', van.vanId)));
    const rows = attendanceSnap.docs.map((item) => item.data());
    if (!rows.length) continue;

    totalRecords += rows.length;
    const uniqueDays = new Set(
      rows
        .map((row) => toDate(row.date))
        .filter(Boolean)
        .map((date) => dayjs(date).format('YYYY-MM-DD')),
    );

    const enrolledCount = Math.max((van.enrolledChildren ?? []).length, 1);
    totalExpected += uniqueDays.size * enrolledCount;

    rows.forEach((row) => {
      if (row.schoolArrivalTime || row.homeArrivalTime) {
        completedTrips += 1;
      }

      const boardingDate = toDate(row.boardingTime);
      const delta = minutesFromPickup(van.pickupTime, boardingDate);
      if (delta === null) return;
      punctualTotal += 1;
      if (Math.abs(delta) <= 20) punctualRecords += 1;
    });
  }

  const attendanceAccuracy = totalExpected > 0 ? Math.min(100, (totalRecords / totalExpected) * 100) : 95;
  const punctualityScore = punctualTotal > 0 ? (punctualRecords / punctualTotal) * 100 : 95;
  const tripCompletionRate = totalRecords > 0 ? (completedTrips / totalRecords) * 100 : 100;

  return {
    attendanceAccuracy: Number(attendanceAccuracy.toFixed(2)),
    punctualityScore: Number(punctualityScore.toFixed(2)),
    tripCompletionRate: Number(tripCompletionRate.toFixed(2)),
  };
}

export async function getSystemStats() {
  const [vansCount, bookingsCount, driversCount, verifiedDriversCount, openAlertsCount] = await Promise.all([
    getCountFromServer(collection(db, 'vans')),
    getCountFromServer(query(collection(db, 'bookings'), where('status', '==', 'active'))),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'driver'))),
    getCountFromServer(query(collection(db, 'users'), where('role', '==', 'driver'), where('verificationStatus', '==', 'approved'))),
    getCountFromServer(query(collection(db, 'emergencyAlerts'), where('status', '==', 'open'))),
  ]);

  return {
    totalVans: vansCount.data().count,
    activeBookings: bookingsCount.data().count,
    totalDrivers: driversCount.data().count,
    verifiedDrivers: verifiedDriversCount.data().count,
    openAlerts: openAlertsCount.data().count,
  };
}
