import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

/** Full-screen placeholder while the stored token is being validated. */
const SessionLoading = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50">
    <div role="status" className="flex flex-col items-center gap-3">
      <Loader2 className="h-7 w-7 animate-spin text-brand-600" aria-hidden="true" />
      <p className="text-sm text-slate-500">Loading your session...</p>
    </div>
  </div>
);

/**
 * Blocks unauthenticated visitors and remembers where they were heading, so
 * logging in returns them to the page they asked for.
 *
 * This is a navigation convenience only - the API independently rejects any
 * request without a valid token.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated, isInitialising } = useAuth();
  const location = useLocation();

  if (isInitialising) return <SessionLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

/**
 * Admin-only section. Students are redirected to their own dashboard.
 *
 * Again: cosmetic. `requireAdmin` on the Express router is what actually
 * protects the data, and it returns 403 regardless of what the client renders.
 */
export const AdminRoute = () => {
  const { isAdmin, isInitialising } = useAuth();

  if (isInitialising) return <SessionLoading />;

  return isAdmin ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

/** Keeps signed-in users away from /login and /register. */
export const PublicOnlyRoute = () => {
  const { isAuthenticated, isAdmin, isInitialising } = useAuth();

  if (isInitialising) return <SessionLoading />;

  if (isAuthenticated) {
    return <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
};
