import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from './Loader';

function ProtectedRoute({ children }) {
  const { authUser, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader />;
  if (!authUser) return <Navigate to="/login" state={{ from: location }} replace />;

  return children;
}

export default ProtectedRoute;
