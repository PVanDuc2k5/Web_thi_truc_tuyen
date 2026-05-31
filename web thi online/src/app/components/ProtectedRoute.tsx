import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '../../lib/auth-store';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
}

export default function ProtectedRoute({ allowedRoles, redirectPath = '/' }: ProtectedRouteProps) {
  const { user, role, isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to={redirectPath} replace />;
  }

  if (!allowedRoles.includes(role!)) {
    return <div>Forbidden: You do not have access to this page.</div>;
  }

  return <Outlet />;
}