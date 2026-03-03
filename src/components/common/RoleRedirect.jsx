import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function RoleRedirect() {
    const { role, loading } = useAuth();

    if (loading) return null;
    if (role === 'admin') return <Navigate to="/app/admin" replace />;
    if (role === 'driver') return <Navigate to="/app/driver" replace />;
    return <Navigate to="/app/parent" replace />;
}

export default RoleRedirect;
