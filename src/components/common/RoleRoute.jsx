import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RoleRoute({ roles, children }) {
  const { role, loading } = useAuth();

  if (loading) return null;
  if (!roles.includes(role)) return <Navigate to="/app/search" replace />;

  return children;
}

export default RoleRoute;
