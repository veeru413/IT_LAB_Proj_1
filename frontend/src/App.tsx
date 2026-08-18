import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute, StudentRoute } from '@/components/routing/RouteGuards';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useAuth } from '@/hooks/useAuth';

import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const HomeRedirect = () => {
  const { isAuthenticated, isStaff, isInitialising } = useAuth();

  if (isInitialising) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isStaff ? '/admin' : '/dashboard'} replace />;
};

const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />

          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route element={<StudentRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
