import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '../services/api.service';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  setToken: (token: string) => void;
  clearToken: () => void;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      token: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setHasHydrated: (state) => {
        set({
          _hasHydrated: state,
        });
      },

      // Acción para agregar/actualizar el token
      setToken: (newToken) => set({ token: newToken, isAuthenticated: !!newToken }),

      // Acción para borrar el token
      clearToken: () => set({ token: null, isAuthenticated: false }),

      // Acción de login
      login: async (password: string) => {
        try {
          const response = await authService.login(password);

          if (response.success && response.data) {
            // Extract token string from response
            const token = typeof response.data === 'string' 
              ? response.data 
              : (response.data as any).token || null;
            
            if (typeof token === 'string') {
              set({ token, isAuthenticated: true });
              return true;
            }

            return false;
          }

          return false;
        } catch (error) {
          console.error('Login error:', error);
          return false;
        }
      },

      // Acción de logout
      logout: () => {
        set({ token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);