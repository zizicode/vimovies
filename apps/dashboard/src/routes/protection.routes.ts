// protected.routes.ts
import { useAuthStore } from '../store';

/**
 * Valida de forma síncrona si existe un token activo en el store.
 * Útil para interceptores de Axios, guards de enrutadores basados en funciones, etc.
 */
export function isAuthenticated(): boolean {
  const token = useAuthStore.getState().token;
  
  // Retorna true si el token existe y no es un string vacío
  return !!token;
}

/**
 * Ejemplo de uso en una función de redirección o guard genérico
 */
export function checkRouteAccess(targetPath: string): string | null {
  const publicRoutes = ['/login', '/register'];
  
  if (!publicRoutes.includes(targetPath) && !isAuthenticated()) {
    return '/login'; // Redirigir aquí si intenta entrar a zona protegida sin token
  }
  
  return null; // Permitir acceso
}