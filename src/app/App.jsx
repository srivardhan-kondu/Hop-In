import { Route, Routes } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import ProtectedRoute from '../components/common/ProtectedRoute';
import RoleRoute from '../components/common/RoleRoute';
import RoleRedirect from '../components/common/RoleRedirect';
import LandingPage from '../pages/landing/LandingPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterParentPage from '../pages/auth/RegisterParentPage';
import RegisterDriverPage from '../pages/auth/RegisterDriverPage';
import RegisterAdminPage from '../pages/auth/RegisterAdminPage';
import ParentDashboardPage from '../pages/parent/ParentDashboardPage';
import DriverDashboardPage from '../pages/driver/DriverDashboardPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import SearchVansPage from '../pages/search/SearchVansPage';
import VanDetailPage from '../pages/search/VanDetailPage';
import BookingPage from '../pages/booking/BookingPage';
import NotFoundPage from '../pages/common/NotFoundPage';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-parent" element={<RegisterParentPage />} />
      <Route path="/register-driver" element={<RegisterDriverPage />} />
      <Route path="/register-admin" element={<RegisterAdminPage />} />

      {/* Protected routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        {/* Auto-redirect /app to the correct dashboard */}
        <Route index element={<RoleRedirect />} />
        <Route path="search" element={<SearchVansPage />} />
        <Route path="vans/:vanId" element={<VanDetailPage />} />
        <Route path="bookings/:vanId" element={<RoleRoute roles={['parent']}><BookingPage /></RoleRoute>} />
        <Route path="parent" element={<RoleRoute roles={['parent']}><ParentDashboardPage /></RoleRoute>} />
        <Route path="driver" element={<RoleRoute roles={['driver']}><DriverDashboardPage /></RoleRoute>} />
        <Route path="admin" element={<RoleRoute roles={['admin']}><AdminDashboardPage /></RoleRoute>} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
