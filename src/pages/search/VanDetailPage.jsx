import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import LiveMap from '../../components/maps/LiveMap';
import { useAuth } from '../../context/AuthContext';
import { getVanById } from '../../services/db/vans';
import { listAvailableReviewBookings, listReviewsByDriver, submitReview } from '../../services/db/reviews';

function VanDetailPage() {
  const { vanId } = useParams();
  const { profile, role } = useAuth();
  const [van, setVan] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [reviewForm, setReviewForm] = useState({ bookingId: '', rating: 5, comment: '' });
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [reviewError, setReviewError] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const load = async (selectedSort = sortBy) => {
    const value = await getVanById(vanId);
    setVan(value);
    if (!value?.driverId) return;

    const driverReviews = await listReviewsByDriver(value.driverId, selectedSort);
    setReviews(driverReviews);

    if (role === 'parent' && profile?.userId) {
      const bookings = await listAvailableReviewBookings(profile.userId, value.driverId);
      setEligibleBookings(bookings);
      if (bookings[0]) {
        setReviewForm((prev) => (prev.bookingId ? prev : { ...prev, bookingId: bookings[0].id }));
      }
    }
  };

  useEffect(() => {
    load(sortBy);
  }, [vanId, role, profile?.userId, sortBy]);

  const firstRoutePoint = useMemo(() => {
    return van?.route?.[0] || { latitude: 12.9716, longitude: 77.5946 };
  }, [van?.route]);

  const onSubmitReview = async (event) => {
    event.preventDefault();
    if (!van?.driverId || !profile?.userId) return;

    setSubmittingReview(true);
    setReviewError('');
    try {
      await submitReview({
        driverId: van.driverId,
        parentId: profile.userId,
        bookingId: reviewForm.bookingId,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
      });

      setReviewForm({ bookingId: '', rating: 5, comment: '' });
      await load(sortBy);
    } catch (error) {
      setReviewError(error?.message ?? 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!van) return <div className="loader-wrap"><div className="loader"></div></div>;

  const starDisplay = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return (
    <section className="page-grid animate-in">
      {/* Driver profile card */}
      <article className="panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="avatar" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
              {van.driverName?.[0]?.toUpperCase() ?? 'D'}
            </div>
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>{van.driverName ?? 'Driver Profile'}</h2>
              {van.driverVerified
                ? <span className="badge-verified">✓ Verified Driver</span>
                : <span className="badge-pending">⏳ Verification Pending</span>}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="van-card-price">₹{van.pricePerMonth} <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>/ month</span></div>
          </div>
        </div>

        <div className="van-card-meta" style={{ marginTop: '1.25rem' }}>
          <span>🕐 Pickup: <strong>{van.pickupTime || '-'}</strong></span>
          <span>🕐 Drop: <strong>{van.dropTime || '-'}</strong></span>
          <span>💺 Vacancy: <strong>{van.currentVacancy}</strong>/{van.capacity}</span>
        </div>

        <Link className="btn btn-lg" to={`/app/bookings/${vanId}`} style={{ marginTop: '1.5rem', display: 'inline-flex' }}>
          Book This Van
        </Link>
      </article>

      {/* Route map */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--c-border)' }}>
          <h2>Route Preview</h2>
        </div>
        <div className="map-wrap">
          <LiveMap center={[firstRoutePoint.latitude, firstRoutePoint.longitude]} markerLabel="Route start" />
        </div>
      </div>

      {/* Enrolled children */}
      <div className="panel">
        <h2 style={{ marginBottom: '1rem' }}>Enrolled Children</h2>
        <div className="stack gap-sm">
          {(van.enrolledChildren ?? []).map((child) => (
            <div key={child.childId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <div className="child-avatar">{child.firstName?.[0]?.toUpperCase() ?? 'C'}</div>
              <span>{child.firstName}</span>
            </div>
          ))}
          {(van.enrolledChildren ?? []).length === 0 && <p className="muted">No children enrolled yet.</p>}
        </div>
      </div>

      {/* Reviews section */}
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h2>Reviews ({reviews.length})</h2>
          <label className="form-field" style={{ margin: 0, minWidth: '160px' }}>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="recent">Most recent</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </select>
          </label>
        </div>
        <div className="stack gap-sm">
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <span className="stars" style={{ letterSpacing: '2px' }}>{starDisplay(review.rating)}</span>
                <span className="muted" style={{ fontSize: '0.8rem' }}>{review.rating}/5</span>
              </div>
              <p className="review-comment">{review.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="muted" style={{ textAlign: 'center', padding: '1rem' }}>No reviews yet. Be the first!</p>}
        </div>
      </div>

      {/* Submit review form */}
      {role === 'parent' && (
        <form className="panel" onSubmit={onSubmitReview} style={{ gridColumn: '1 / -1' }}>
          <h2 style={{ marginBottom: '1.25rem' }}>Submit Your Review</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <label className="form-field">
              <span>Eligible Booking</span>
              <select
                value={reviewForm.bookingId}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, bookingId: event.target.value }))}
                required
                disabled={eligibleBookings.length === 0}
              >
                {eligibleBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>Booking {booking.id.slice(0, 8)}</option>
                ))}
                {eligibleBookings.length === 0 && <option value="">No eligible bookings</option>}
              </select>
            </label>

            <label className="form-field">
              <span>Rating</span>
              <select
                value={reviewForm.rating}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
              >
                {[5, 4, 3, 2, 1].map((value) => (
                  <option key={value} value={value}>{'★'.repeat(value)} ({value})</option>
                ))}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>Comment</span>
            <textarea
              rows={4}
              value={reviewForm.comment}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
              placeholder="Share your experience with this driver..."
              required
            />
          </label>

          {reviewError && <p className="error-text">{reviewError}</p>}
          <button className="btn" disabled={submittingReview || eligibleBookings.length === 0} style={{ marginTop: '0.5rem' }}>
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}
    </section>
  );
}

export default VanDetailPage;
