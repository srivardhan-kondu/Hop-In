import { useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';

function SearchVansPage() {
  const [schoolTerm, setSchoolTerm] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runSearch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Search approach: query vans collection directly
      // First try exact schoolId match, then fall back to fetching all and filtering
      const term = schoolTerm.trim();

      // Try exact schoolId match
      const exactQuery = query(
        collection(db, 'vans'),
        where('schoolId', '==', term),
        where('isActive', '==', true)
      );
      let snap = await getDocs(exactQuery);
      let vans = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

      // If no exact match, fetch all active vans and filter by schoolId containing the search term
      if (vans.length === 0) {
        const allQuery = query(
          collection(db, 'vans'),
          where('isActive', '==', true)
        );
        const allSnap = await getDocs(allQuery);
        const lowerTerm = term.toLowerCase();
        vans = allSnap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((van) =>
            van.schoolId?.toLowerCase().includes(lowerTerm) ||
            van.driverName?.toLowerCase().includes(lowerTerm)
          );
      }

      // Apply verified filter
      if (verifiedOnly) {
        vans = vans.filter((van) => van.driverVerified === true);
      }

      setResults(vans);
    } catch (err) {
      setError(err?.message ?? 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-grid animate-in">
      <div className="panel search-hero" style={{ gridColumn: '1 / -1' }}>
        <h2>Find reliable vans for your school</h2>
        <p className="muted">Enter your child's school name or school ID to see available routes and verified drivers.</p>
        <form className="search-row" onSubmit={runSearch}>
          <input
            value={schoolTerm}
            onChange={(e) => setSchoolTerm(e.target.value)}
            placeholder="Type school name or ID (e.g. DPS-Bangalore)"
            required
          />
          <button className="btn btn-lg" disabled={loading} style={{ minWidth: '140px' }}>
            {loading ? 'Searching...' : 'Search Vans'}
          </button>
        </form>
        <label className="check-inline" style={{ marginTop: '1rem' }}>
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} />
          Show only Aadhaar verified drivers
        </label>
        {error && <p className="error-text">{error}</p>}
      </div>

      <div className="van-grid" style={{ gridColumn: '1 / -1' }}>
        {results.map((van) => (
          <article key={van.vanId || van.id} className="van-card">
            <div className="van-card-header">
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{van.driverName ?? 'Driver'}</h3>
                {van.driverVerified && <span className="badge-verified">✓ Verified Driver</span>}
                {!van.driverVerified && <span className="badge-pending">⏳ Pending Verification</span>}
              </div>
              <div className="van-card-price">₹{van.pricePerMonth} <span className="muted" style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>/ mo</span></div>
            </div>

            <div className="van-card-meta">
              <span>🏫 {van.schoolId}</span>
              <span>💺 Vacancy: <strong>{van.currentVacancy}</strong>/{van.capacity}</span>
              <span>🕐 {van.pickupTime || '-'} → {van.dropTime || '-'}</span>
              <span>⭐ Rating: <strong style={{ color: 'var(--c-warn)' }}>{van.overallRating || 'N/A'}</strong></span>
            </div>

            <Link className="btn btn-outline" to={`/app/vans/${van.vanId || van.id}`} style={{ marginTop: '0.5rem' }}>
              View Details & Route
            </Link>
          </article>
        ))}
        {!loading && results.length === 0 && schoolTerm === '' && (
          <p className="muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            Start by searching for a school above.
          </p>
        )}
        {!loading && results.length === 0 && schoolTerm !== '' && (
          <p className="muted" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem' }}>
            No vans found matching your criteria.
          </p>
        )}
      </div>
    </section>
  );
}

export default SearchVansPage;
