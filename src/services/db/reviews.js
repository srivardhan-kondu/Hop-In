import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { listEligibleBookingsForReview } from './bookings';
import { getDriverOperationalMetrics } from './metrics';
import { calculatePerformanceScore } from '../../utils/performance';

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, item) => sum + item, 0) / values.length;
}

function sortReviews(rows, sortBy) {
  if (sortBy === 'high') {
    return [...rows].sort((a, b) => Number(b.rating) - Number(a.rating));
  }
  if (sortBy === 'low') {
    return [...rows].sort((a, b) => Number(a.rating) - Number(b.rating));
  }

  return [...rows].sort((a, b) => {
    const aTime = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0;
    const bTime = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });
}

export async function submitReview(payload) {
  const rating = Number(payload.rating);
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const bookingSnap = await getDoc(doc(db, 'bookings', payload.bookingId));
  if (!bookingSnap.exists()) {
    throw new Error('Booking not found');
  }

  const booking = bookingSnap.data();
  if (booking.parentId !== payload.parentId || booking.driverId !== payload.driverId) {
    throw new Error('You are not allowed to review this booking');
  }

  if (!['active', 'completed'].includes(booking.status)) {
    throw new Error('Reviews are allowed only for active or completed bookings');
  }

  const existingReview = await getDocs(query(collection(db, 'reviews'), where('bookingId', '==', payload.bookingId)));
  if (!existingReview.empty) {
    throw new Error('A review already exists for this booking');
  }

  await addDoc(collection(db, 'reviews'), {
    reviewId: crypto.randomUUID(),
    driverId: payload.driverId,
    parentId: payload.parentId,
    bookingId: payload.bookingId,
    rating,
    comment: payload.comment.trim(),
    createdAt: serverTimestamp(),
    reportedAbuse: false,
    moderatedByAdmin: false,
  });

  const reviewSnap = await getDocs(query(collection(db, 'reviews'), where('driverId', '==', payload.driverId)));
  const ratings = reviewSnap.docs.map((item) => Number(item.data().rating));
  const overallRating = Number(average(ratings).toFixed(2));
  const metrics = await getDriverOperationalMetrics(payload.driverId);
  const performanceScore = Number(
    calculatePerformanceScore({
      averageRating: overallRating,
      attendanceAccuracy: metrics.attendanceAccuracy,
      punctualityScore: metrics.punctualityScore,
      tripCompletionRate: metrics.tripCompletionRate,
    }).toFixed(2),
  );

  await updateDoc(doc(db, 'users', payload.driverId), {
    overallRating,
    totalReviews: ratings.length,
    performanceScore,
  });

  const vanSnap = await getDocs(query(collection(db, 'vans'), where('driverId', '==', payload.driverId)));
  await Promise.all(vanSnap.docs.map((item) => updateDoc(item.ref, { overallRating })));
}

export async function listReviewsByDriver(driverId, sortBy = 'recent') {
  const snap = await getDocs(query(collection(db, 'reviews'), where('driverId', '==', driverId)));
  const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return sortReviews(rows, sortBy);
}

export async function listAvailableReviewBookings(parentId, driverId) {
  const [bookings, reviewsSnap] = await Promise.all([
    listEligibleBookingsForReview(parentId, driverId),
    getDocs(query(collection(db, 'reviews'), where('parentId', '==', parentId), where('driverId', '==', driverId))),
  ]);

  const reviewedBookingIds = new Set(reviewsSnap.docs.map((item) => item.data().bookingId));
  return bookings.filter((booking) => !reviewedBookingIds.has(booking.id));
}
