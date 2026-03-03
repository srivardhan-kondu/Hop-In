import { useEffect, useMemo, useState } from 'react';
import LiveMap from '../../components/maps/LiveMap';
import QrScanner from '../../components/qr/QrScanner';
import EmergencyButton from '../../components/alerts/EmergencyButton';
import { useAuth } from '../../context/AuthContext';
import { listTodayAttendanceByVan, markBoarding, markSchoolArrivalForVan } from '../../services/db/attendance';
import { startDriverTripTracking, stopDriverTripTracking } from '../../services/tracking/geolocation';
import { isChildEnrolledInVan, setVanTripState } from '../../services/db/vans';

function DriverDashboardPage() {
  const { authUser, profile } = useAuth();
  const vanId = profile?.vanDetails?.vanId;
  const [tripActive, setTripActive] = useState(false);
  const [lastLocation, setLastLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [scanLog, setScanLog] = useState([]);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [processingScan, setProcessingScan] = useState(false);
  const [scanMode, setScanMode] = useState('boarding');
  const [saving, setSaving] = useState(false);

  const mapCenter = useMemo(() => [lastLocation.lat, lastLocation.lng], [lastLocation]);
  const approved = profile?.verificationStatus === 'approved';

  const refreshTodayAttendance = async () => {
    if (!vanId) return;
    const rows = await listTodayAttendanceByVan(vanId);
    setAttendanceRows(rows);
  };

  const handleStartTrip = async () => {
    if (!authUser?.uid || !vanId || !approved) return;
    setSaving(true);
    try {
      await setVanTripState(vanId, true);
      startDriverTripTracking(authUser.uid, vanId);
      setTripActive(true);
      setScanLog((prev) => ['Trip started', ...prev].slice(0, 20));
    } finally {
      setSaving(false);
    }
  };

  const handleEndTrip = async () => {
    if (!authUser?.uid || !vanId) return;
    setSaving(true);
    try {
      await setVanTripState(vanId, false);
      await stopDriverTripTracking(authUser.uid, vanId);
      setTripActive(false);
      setScanLog((prev) => ['Trip ended', ...prev].slice(0, 20));
    } finally {
      setSaving(false);
    }
  };

  const markArrival = async () => {
    if (!vanId) return;
    const updated = await markSchoolArrivalForVan(vanId);
    setScanLog((prev) => [`Marked school arrival for ${updated} records`, ...prev].slice(0, 20));
    await refreshTodayAttendance();
  };

  useEffect(() => {
    if (!navigator.geolocation) return;
    const watcher = navigator.geolocation.watchPosition((position) => {
      setLastLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
    });
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  useEffect(() => {
    refreshTodayAttendance();
  }, [vanId]);

  const onQrDecoded = async (rawText) => {
    if (!vanId || processingScan) return;

    setProcessingScan(true);
    try {
      const data = JSON.parse(rawText);
      if (!data?.childId) {
        setScanLog((prev) => ['QR payload missing childId', ...prev].slice(0, 20));
        return;
      }

      const enrolled = await isChildEnrolledInVan(vanId, data.childId);
      if (!enrolled) {
        setScanLog((prev) => [`${data.childName ?? 'Child'} is not enrolled in this van`, ...prev].slice(0, 20));
        return;
      }

      if (scanMode === 'boarding') {
        await markBoarding({
          childId: data.childId,
          vanId,
          boardingLocation: { lat: lastLocation.lat, lng: lastLocation.lng },
        });
        setScanLog((prev) => [`Success: ${data.childName ?? 'Child'} boarded`, ...prev].slice(0, 20));
      } else if (scanMode === 'school_arrived') {
        await markSchoolArrivalForVan(vanId);
        setScanLog((prev) => [`Success: ${data.childName ?? 'Child'} arrived at school`, ...prev].slice(0, 20));
      }

      await refreshTodayAttendance();
    } catch (error) {
      setScanLog((prev) => [`Error: ${error?.message ?? 'Invalid QR scanned'}`, ...prev].slice(0, 20));
    } finally {
      setProcessingScan(false);
    }
  };

  if (!profile) return <div className="loader-wrap"><div className="loader"></div></div>;

  return (
    <section className="page-grid animate-in">
      <div className="panel" style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <h2>Driver Center</h2>
          {!approved ? (
            <span className="badge-pending">⏳ Account pending verification</span>
          ) : (
            <span className="badge-verified">✓ Verified Driver</span>
          )}
        </div>

        <div className="stats-grid">
          <article className="stat-card">
            <p>Status</p>
            <h3 style={{ color: tripActive ? 'var(--c-success)' : 'inherit' }}>
              {tripActive ? 'Trip Active' : 'Off Duty'}
            </h3>
          </article>
          <article className="stat-card">
            <p>Score</p>
            <h3>{profile?.performanceScore ?? 'N/A'}<span style={{ fontSize: '0.9rem', fontWeight: 400 }}>/100</span></h3>
          </article>
          <article className="stat-card">
            <p>Rating</p>
            <h3 style={{ color: 'var(--c-warn)' }}>★ {profile?.overallRating ?? 'N/A'}</h3>
          </article>
          <article className="stat-card">
            <p>Today's Boarding</p>
            <h3>{attendanceRows.length}</h3>
          </article>
        </div>
      </div>

      <div className="stack gap-md">
        <div className="panel">
          <h2 style={{ marginBottom: '1.25rem' }}>Trip Controls</h2>
          <div className="action-row" style={{ flexDirection: 'column' }}>
            {!tripActive ? (
              <button className="btn btn-lg" onClick={handleStartTrip} disabled={saving || !approved} style={{ width: '100%' }}>
                {saving ? 'Starting...' : 'Start Trip'}
              </button>
            ) : (
              <>
                <button className="btn btn-lg btn-danger" onClick={handleEndTrip} disabled={saving} style={{ width: '100%' }}>
                  {saving ? 'Ending...' : 'End Trip'}
                </button>
                <button className="btn btn-outline" onClick={markArrival} style={{ width: '100%' }}>
                  Mark School Arrival
                </button>
              </>
            )}
          </div>
          {!approved && <p className="error-text" style={{ marginTop: '1rem' }}>Trip controls disabled until admin verification is complete.</p>}
        </div>

        {tripActive && (
          <div className="panel">
            <h2 style={{ marginBottom: '1rem' }}>QR Attendance Scanner</h2>
            <select
              value={scanMode}
              onChange={(e) => setScanMode(e.target.value)}
              style={{ marginBottom: '1rem', width: '100%' }}
            >
              <option value="boarding">Scan: Child Boarding Van</option>
              <option value="school_arrived">Scan: Child Dropped at School</option>
            </select>
            <QrScanner onDecoded={onQrDecoded} />
            <p className="muted" style={{ marginTop: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>
              Camera should activate above. Scan child's QR code.
            </p>
          </div>
        )}

        <div className="panel">
          <h2 style={{ marginBottom: '1rem' }}>Emergency</h2>
          <EmergencyButton
            reportedBy={profile?.userId ?? ''}
            role="driver"
            vanId={vanId ?? ''}
            location={lastLocation}
          />
        </div>
      </div>

      <div className="stack gap-md">
        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          <LiveMap center={mapCenter} markerLabel="Your Location" />
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: '1rem' }}>Attendance Today</h2>
          <ul className="log-list">
            {attendanceRows.slice(0, 8).map((entry) => (
              <li key={entry.id} className={entry.schoolArrivalTime ? 'log-success' : ''}>
                {entry.childId} {entry.schoolArrivalTime ? '• Reached school' : '• In transit'}
              </li>
            ))}
            {attendanceRows.length === 0 && <li className="muted">No boarding records yet today.</li>}
          </ul>
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: '1rem' }}>Session Logs</h2>
          <ul className="log-list">
            {scanLog.map((log, i) => (
              <li key={i} className={log.includes('Success') || log.includes('started') || log.includes('ended') ? 'log-success' : ''}>
                {log}
              </li>
            ))}
            {scanLog.length === 0 && <li className="muted">No activity this session.</li>}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default DriverDashboardPage;
