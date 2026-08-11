import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import { AdminRoute, ProtectedRoute, PublicOnlyRoute } from '@/components/routing/RouteGuards';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';

import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CompletedTasksPage, TasksPage } from '@/pages/TasksPage';
import { TaskDetailPage } from '@/pages/TaskDetailPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminStudentsPage } from '@/pages/admin/AdminStudentsPage';
import { AdminStudentDetailPage } from '@/pages/admin/AdminStudentDetailPage';
import { AdminTasksPage } from '@/pages/admin/AdminTasksPage';
import { AdminCreateTaskPage } from '@/pages/admin/AdminCreateTaskPage';

/**
 * Route table.
 *
 * Three tiers of access:
 *   PublicOnlyRoute - login/register, redirects away if already signed in
 *   ProtectedRoute  - requires a valid session
 *   AdminRoute      - additionally requires the ADMIN role
 *
 * These guards shape navigation only. Every one of them has a matching
 * server-side check (`authenticate` / `requireAdmin`), which is what actually
 * protects the data.
 */
const App = () => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route element={<PublicOnlyRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>
          </Route>

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/completed" element={<CompletedTasksPage />} />
              <Route path="/profile" element={<ProfilePage />} />

              {/* Admin only */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="/admin/students" element={<AdminStudentsPage />} />
                <Route path="/admin/students/:id" element={<AdminStudentDetailPage />} />
                <Route path="/admin/tasks" element={<AdminTasksPage />} />
                <Route path="/admin/tasks/create" element={<AdminCreateTaskPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

export default App;
