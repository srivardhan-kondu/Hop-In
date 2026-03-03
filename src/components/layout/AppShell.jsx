import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function AppShell() {
  const { role, profile, logout } = useAuth();
  const navigate = useNavigate();
  const initial = profile?.name?.[0]?.toUpperCase() ?? 'U';

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Simple role-based tabs — one "Dashboard" + one optional "Search"
  const dashPath = role === 'admin' ? '/app/admin' : role === 'driver' ? '/app/driver' : '/app/parent';

  return (
    <div className="app-shell animate-in">
      <header className="topbar">
        <p className="brand">Hop-In 🚌</p>
        <div className="topbar-right">
          <span style={{ fontSize: '0.85rem', color: 'var(--c-ink-muted)', fontWeight: 600 }}>
            {profile?.name ?? 'User'}
          </span>
          <div className="avatar" title={profile?.name}>{initial}</div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Sign Out</button>
        </div>
      </header>

      <nav className="nav-tabs">
        <NavLink to={dashPath} className={({ isActive }) => (isActive ? 'active' : '')} end>
          🏠 Dashboard
        </NavLink>
        {role === 'parent' && (
          <NavLink to="/app/search" className={({ isActive }) => (isActive ? 'active' : '')}>
            🔍 Find Vans
          </NavLink>
        )}
      </nav>

      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}

export default AppShell;
