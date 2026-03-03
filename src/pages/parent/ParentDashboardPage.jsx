import { useEffect, useMemo, useState } from 'react';
import ChildQrCard from '../../components/qr/ChildQrCard';
import LiveMap from '../../components/maps/LiveMap';
import AttendanceTable from '../../components/attendance/AttendanceTable';
import EmergencyButton from '../../components/alerts/EmergencyButton';
import { useAuth } from '../../context/AuthContext';
import { attendanceToCsv, listAttendanceByChild } from '../../services/db/attendance';
import { subscribeDriverLocation } from '../../services/db/locations';
import { downloadTextFile } from '../../utils/files';
import { geofenceLevel, haversineDistanceKm } from '../../utils/haversine';
import { subscribeNotificationsByUser } from '../../services/db/notifications';

function ParentDashboardPage() {
  const { profile } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [driverLocation, setDriverLocation] = useState(null);
  const [attendanceFilters, setAttendanceFilters] = useState({ from: '', to: '' });
  const [notifications, setNotifications] = useState([]);

  const children = profile?.children ?? [];
  const selectedChild = children.find((child) => child.childId === selectedChildId) ?? children[0] ?? null;

  useEffect(() => {
    if (!selectedChild?.childId) return;
    if (selectedChildId) return;
    setSelectedChildId(selectedChild.childId);
  }, [selectedChild?.childId, selectedChildId]);

  useEffect(() => {
    if (!selectedChild?.childId) return;
    listAttendanceByChild(selectedChild.childId, {
      from: attendanceFilters.from || undefined,
      to: attendanceFilters.to || undefined,
    }).then(setAttendance);
  }, [selectedChild?.childId, attendanceFilters.from, attendanceFilters.to]);

  useEffect(() => {
    if (!selectedChild?.activeDriverId) return;
    const unsubscribe = subscribeDriverLocation(selectedChild.activeDriverId, setDriverLocation);
    return unsubscribe;
  }, [selectedChild?.activeDriverId]);

  useEffect(() => {
    if (!profile?.userId) return;
    const unsubscribe = subscribeNotificationsByUser(profile.userId, setNotifications);
    return unsubscribe;
  }, [profile?.userId]);

  const mapCenter = useMemo(() => {
    if (driverLocation?.latitude && driverLocation?.longitude) {
      return [driverLocation.latitude, driverLocation.longitude];
    }
    if (selectedChild?.homeAddress?.latitude && selectedChild?.homeAddress?.longitude) {
      return [selectedChild.homeAddress.latitude, selectedChild.homeAddress.longitude];
    }
    return [12.9716, 77.5946];
  }, [driverLocation, selectedChild?.homeAddress?.latitude, selectedChild?.homeAddress?.longitude]);

  const geofence = useMemo(() => {
    if (!selectedChild?.homeAddress || !driverLocation?.latitude || !driverLocation?.longitude) {
      return null;
    }

    const distanceKm = haversineDistanceKm(
      driverLocation.latitude,
      driverLocation.longitude,
      selectedChild.homeAddress.latitude,
      selectedChild.homeAddress.longitude,
    );

    return {
      level: geofenceLevel(distanceKm),
      distanceKm: Number(distanceKm.toFixed(2)),
    };
  }, [selectedChild?.homeAddress, driverLocation]);

  const exportCsv = () => {
    if (!attendance.length) return;
    const csv = attendanceToCsv(attendance);
    const suffix = selectedChild?.name?.replace(/\s+/g, '_').toLowerCase() || 'child';
    downloadTextFile(`attendance_${suffix}.csv`, csv, 'text/csv;charset=utf-8');
  };

  if (!profile) return <div className="loader-wrap"><div className="loader"></div></div>;

  return (
    <section className="page-grid animate-in">
      <div className="panel" style={{ gridRow: 'span 2' }}>
        <h2 style={{ marginBottom: '1rem' }}>My Children</h2>
        <label className="form-field">
          <span>Viewing</span>
          <select value={selectedChildId} onChange={(event) => setSelectedChildId(event.target.value)}>
            {children.map((child) => (
              <option value={child.childId} key={child.childId}>{child.name}</option>
            ))}
          </select>
        </label>

        <div className="stack gap-sm" style={{ marginTop: '1.5rem' }}>
          {children.map((child) => (
            <div key={child.childId} style={{ display: child.childId === selectedChildId ? 'block' : 'none' }}>
              <ChildQrCard child={child} vanId={child.activeVanId ?? ''} parentId={profile.userId ?? ''} />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Safety & Alerts</h2>
          <EmergencyButton
            reportedBy={profile.userId}
            role="parent"
            vanId={selectedChild?.activeVanId ?? ''}
            location={{ lat: mapCenter[0], lng: mapCenter[1] }}
          />
        </div>
      </div>

      <div className="stack gap-md">
        <div className="panel" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Live Van Location</h2>
            {geofence && (
              <span className={`geofence-badge ${geofence.level === 'almost_here' ? 'geofence-almost' : geofence.level === 'approaching' ? 'geofence-approaching' : 'geofence-none'}`}>
                {geofence.distanceKm} km {geofence.level === 'almost_here' ? '(Almost here)' : geofence.level === 'approaching' ? '(Approaching)' : '(On route)'}
              </span>
            )}
          </div>
          <LiveMap center={mapCenter} markerLabel="Tracked van" />
        </div>

        <div className="panel">
          <h2 style={{ marginBottom: '1rem' }}>Recent Notifications</h2>
          <div className="stack gap-sm">
            {notifications.slice(0, 4).map((item) => (
              <div key={item.id} className="notif-item">
                <div className="notif-icon">🔔</div>
                <div>{item.body ?? item.title}</div>
              </div>
            ))}
            {notifications.length === 0 && <p className="muted" style={{ padding: '1rem', textAlign: 'center' }}>No notifications yet</p>}
          </div>
        </div>
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <AttendanceTable
          rows={attendance}
          filters={attendanceFilters}
          onFiltersChange={setAttendanceFilters}
          onExportCsv={exportCsv}
        />
      </div>
    </section>
  );
}

export default ParentDashboardPage;
