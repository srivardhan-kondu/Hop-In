import { useEffect, useMemo, useState } from 'react';
import LiveMap from '../../components/maps/LiveMap';
import { subscribeOpenAlerts, resolveAlert } from '../../services/db/alerts';
import { getSystemStats } from '../../services/db/metrics';
import { subscribePendingDrivers, updateDriverVerification } from '../../services/db/users';

function AdminDashboardPage() {
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState({
    totalVans: 0,
    activeBookings: 0,
    totalDrivers: 0,
    verifiedDrivers: 0,
    openAlerts: 0,
  });

  useEffect(() => {
    const unsubscribeDrivers = subscribePendingDrivers(setPendingDrivers);
    const unsubscribeAlerts = subscribeOpenAlerts(setAlerts);

    let timer = null;
    const loadStats = async () => {
      const data = await getSystemStats();
      setStats(data);
    };

    loadStats();
    timer = window.setInterval(loadStats, 30000);

    return () => {
      unsubscribeDrivers();
      unsubscribeAlerts();
      window.clearInterval(timer);
    };
  }, []);

  const reviewDriver = async (driverId, approved) => {
    await updateDriverVerification(driverId, approved);
  };

  const closeAlert = async (alertId) => {
    await resolveAlert(alertId, 'Resolved by admin');
  };

  const alertCenter = useMemo(() => {
    const first = alerts[0]?.location;
    if (first?.lat && first?.lng) {
      return [first.lat, first.lng];
    }
    return [12.9716, 77.5946];
  }, [alerts]);

  return (
    <section className="page-grid animate-in">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <h2 style={{ marginBottom: '1.25rem' }}>System Overview</h2>
        <div className="stats-grid">
          <article className="stat-card"><p>Total Vans</p><h3>{stats.totalVans}</h3></article>
          <article className="stat-card"><p>Active Bookings</p><h3>{stats.activeBookings}</h3></article>
          <article className="stat-card"><p>Total Drivers</p><h3>{stats.totalDrivers}</h3></article>
          <article className="stat-card"><p>Verified Drivers</p><h3 style={{ color: 'var(--c-primary)' }}>{stats.verifiedDrivers}</h3></article>
        </div>
      </div>

      <div className="panel">
        <h2 style={{ marginBottom: '1.25rem' }}>
          Needs Verification
          {pendingDrivers.length > 0 && <span className="badge-pending" style={{ marginLeft: '0.75rem' }}>{pendingDrivers.length} Pending</span>}
        </h2>
        <div className="stack gap-sm">
          {pendingDrivers.map((driver) => (
            <article key={driver.userId} className="driver-card">
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{driver.name}</h3>
                <p className="muted" style={{ fontSize: '0.85rem' }}>Aadhaar: {driver.aadhaarNumber ? '****' + String(driver.aadhaarNumber).slice(-4) : 'N/A'}</p>
                <p className="muted" style={{ fontSize: '0.85rem' }}>Experience: {driver.yearsOfExperience} years</p>
                {driver.aadhaarDocUrl && (
                  <a href={driver.aadhaarDocUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', display: 'inline-block', marginTop: '0.4rem' }}>
                    View Document ↗
                  </a>
                )}
              </div>
              <div className="action-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <button className="btn btn-sm" onClick={() => reviewDriver(driver.userId, true)}>Approve</button>
                <button className="btn btn-outline btn-sm" onClick={() => reviewDriver(driver.userId, false)}>Reject</button>
              </div>
            </article>
          ))}
          {pendingDrivers.length === 0 && <p className="muted" style={{ padding: '1rem', textAlign: 'center' }}>All drivers verified.</p>}
        </div>
      </div>

      <div className="stack gap-md">
        <div className="panel">
          <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            Emergency Alerts
            {alerts.length > 0 && (
              <span className="blink-indicator"><span className="blink-dot"></span> LIVE ({alerts.length})</span>
            )}
          </h2>
          <div className="stack gap-sm">
            {alerts.map((alert) => (
              <article key={alert.id} className="emergency-box danger-border">
                <div style={{ marginBottom: '0.75rem' }}>
                  <p><strong>{alert.role.toUpperCase()} REPORTED:</strong> {alert.description}</p>
                  <small className="muted">{alert.location?.lat.toFixed(4)}, {alert.location?.lng.toFixed(4)}</small>
                </div>
                <button className="btn btn-sm btn-outline" onClick={() => closeAlert(alert.id)}>Mark Resolved</button>
              </article>
            ))}
            {alerts.length === 0 && <p className="muted" style={{ padding: '1rem', textAlign: 'center' }}>No active emergencies.</p>}
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <LiveMap center={alertCenter} markerLabel="Latest emergency" />
        </div>
      </div>
    </section>
  );
}

export default AdminDashboardPage;
