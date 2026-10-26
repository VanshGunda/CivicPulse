import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from './components/Toast.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { LoadingState } from './components/UI.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const IssuesPage = lazy(() => import('./pages/IssuesPage.jsx'));
const CreateIssuePage = lazy(() => import('./pages/CreateIssuePage.jsx'));
const IssueDetailPage = lazy(() => import('./pages/IssueDetailPage.jsx'));
const MyReportsPage = lazy(() => import('./pages/MyReportsPage.jsx'));
const AssignedPage = lazy(() => import('./pages/AssignedPage.jsx'));
const DepartmentsPage = lazy(() => import('./pages/DepartmentsPage.jsx'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, booting, user } = useAuth();
  if (booting) return <LoadingState label="Restoring your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) return <LoadingState label="Restoring your session…" />;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return <Suspense fallback={<LoadingState />}><Routes>
    <Route path="/login" element={<GuestOnly><AuthPage mode="login" /></GuestOnly>} />
    <Route path="/register" element={<GuestOnly><AuthPage mode="register" /></GuestOnly>} />
    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
      <Route index element={<DashboardPage />} />
      <Route path="issues" element={<IssuesPage />} />
      <Route path="issues/new" element={<CreateIssuePage />} />
      <Route path="issues/:id" element={<IssueDetailPage />} />
      <Route path="my-reports" element={<MyReportsPage />} />
      <Route path="assigned" element={<ProtectedRoute roles={['STAFF', 'ADMIN']}><AssignedPage /></ProtectedRoute>} />
      <Route path="departments" element={<ProtectedRoute roles={['ADMIN']}><DepartmentsPage /></ProtectedRoute>} />
      <Route path="users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
      <Route path="notifications" element={<NotificationsPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes></Suspense>;
}

export default function App() {
  return <ErrorBoundary><ToastProvider><AppRoutes /></ToastProvider></ErrorBoundary>;
}
