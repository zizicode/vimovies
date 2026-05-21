import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  // Mientras el store no ha cargado desde sessionStorage, no mostrar nada
  if (!_hasHydrated) {
    return null;
  }

  // Si no está autenticado después de cargar, redirigir inmediatamente
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}