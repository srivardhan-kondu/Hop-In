import { addMonths } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import LiveMap from '../../components/maps/LiveMap';
import { useAuth } from '../../context/AuthContext';
import { createBookingAndEnroll } from '../../services/db/bookings';
import { getVanById } from '../../services/db/vans';
import { totalContractValue } from '../../utils/pricing';

function BookingPage() {
  const { vanId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [van, setVan] = useState(null);
  const [childId, setChildId] = useState('');
  const [months, setMonths] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getVanById(vanId).then(setVan);
  }, [vanId]);

  useEffect(() => {
    const first = profile?.children?.[0]?.childId;
    if (first) setChildId(first);
  }, [profile?.children]);

  const totalValue = useMemo(() => totalContractValue(van?.pricePerMonth || 0, months), [van?.pricePerMonth, months]);

  const book = async () => {
    if (!van || !childId || !profile?.userId) return;

    setLoading(true);
    setError('');
    try {
      const child = profile.children.find((item) => item.childId === childId);
      if (child?.activeBookingId) {
        throw new Error('Selected child already has an active booking');
      }

      const startDate = new Date();
      const endDate = addMonths(startDate, Number(months));

      await createBookingAndEnroll({
        parentId: profile.userId,
        childId,
        driverId: van.driverId,
        vanId: van.vanId || van.id,
        contractMonths: Number(months),
        monthlyPrice: van.pricePerMonth,
        startDate,
        endDate,
        childFirstName: child?.name?.split(' ')?.[0] ?? 'Child',
      });

      window.alert('Booking complete. Payment marked as completed (demo mode).');
      navigate('/app/parent');
    } catch (err) {
      setError(err?.message ?? 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  if (!van) return <div className="loader-wrap"><div className="loader"></div></div>;

  const firstRoutePoint = van.route?.[0] || { latitude: 12.9716, longitude: 77.5946 };

  return (
    <section className="page-grid animate-in">
      <article className="panel">
        <h2 style={{ marginBottom: '1.5rem' }}>Confirm Booking</h2>

        {/* Driver summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--c-border)' }}>
          <div className="avatar">{van.driverName?.[0]?.toUpperCase() ?? 'D'}</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0 }}>{van.driverName ?? 'Driver'}</h3>
            <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
              Pickup: {van.pickupTime || '-'} → Drop: {van.dropTime || '-'}
            </p>
          </div>
          <div className="van-card-price">₹{van.pricePerMonth}<span className="muted" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>/mo</span></div>
        </div>

        {/* Child & duration selection */}
        <label className="form-field">
          <span>Select Child</span>
          <select value={childId} onChange={(e) => setChildId(e.target.value)}>
            {(profile?.children ?? []).map((child) => (
              <option value={child.childId} key={child.childId}>{child.name}</option>
            ))}
          </select>
        </label>

        <label className="form-field">
          <span>Contract Duration (3—48 months)</span>
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))}>
            {Array.from({ length: 46 }, (_, i) => i + 3).map((month) => (
              <option value={month} key={month}>{month} months</option>
            ))}
          </select>
        </label>

        {/* Price summary */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(45,212,191,0.06)', border: '1px solid rgba(45,212,191,0.15)', margin: '1rem 0' }}>
          <span style={{ fontWeight: 600 }}>Total Contract Value</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--c-primary)' }}>₹{totalValue.toLocaleString()}</span>
        </div>

        {error && <p className="error-text">{error}</p>}

        {/* Payment section */}
        <div className="payment-box">
          <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.5rem' }}>Payment</p>
          <p className="muted" style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>Select a payment method to proceed</p>
          <div className="payment-methods">
            <span className="payment-chip">UPI</span>
            <span className="payment-chip">Net Banking</span>
            <span className="payment-chip">Credit/Debit Card</span>
            <span className="payment-chip">Wallet</span>
          </div>
          <button className="btn btn-lg" onClick={book} disabled={loading} style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Processing Payment...' : `Pay ₹${totalValue.toLocaleString()} & Confirm`}
          </button>
        </div>
      </article>

      {/* Route map */}
      <div className="stack gap-md">
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--c-border)' }}>
            <h2>Van Route</h2>
          </div>
          <div className="map-wrap">
            <LiveMap center={[firstRoutePoint.latitude, firstRoutePoint.longitude]} markerLabel="Van route" />
          </div>
        </div>

        {/* Contract details card */}
        <div className="panel">
          <h2 style={{ marginBottom: '1rem' }}>Contract Details</h2>
          <ul className="log-list">
            <li>📅 Duration: <strong>{months} months</strong></li>
            <li>💰 Monthly: <strong>₹{van.pricePerMonth}</strong></li>
            <li>🧒 Student: <strong>{profile?.children?.find(c => c.childId === childId)?.name ?? 'Select a child'}</strong></li>
            <li>🏫 School: <strong>{profile?.children?.find(c => c.childId === childId)?.schoolName ?? '-'}</strong></li>
          </ul>
        </div>
      </div>
    </section>
  );
}

export default BookingPage;
