import { create } from 'zustand';
import { platformsService } from '../services/api.service';
import type { PlatformItem } from '../services/api.service';
import { useAuthStore } from './token.store';

interface PlatformsState {
  platforms: PlatformItem[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  perPage: number;
  filters: {
    search?: string;
  };

  fetchPlatforms: () => Promise<void>;
  createPlatform: (platform: Partial<PlatformItem>) => Promise<void>;
  updatePlatform: (id: number, platform: Partial<PlatformItem>) => Promise<void>;
  removePlatform: (id: number) => Promise<void>;
  getPlatformById: (id: number) => PlatformItem | undefined;
  setPage: (page: number) => void;
  setFilters: (filters: { search?: string }) => void;
}

export const usePlatformsStore = create<PlatformsState>()((set, get) => ({
  platforms: [],
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  perPage: 20,
  filters: {},

  fetchPlatforms: async () => {
    const { token } = useAuthStore.getState();

    set({ loading: true, error: null });

    try {
      const response = await platformsService.adminList(token ?? undefined);
      console.log('Platforms response:', response); // Debug log

      if (response.data) {
        set({
          platforms: response.data,
          total: response.data.length,
          loading: false,
        });
      } else {
        console.log('No platforms data:', response);
        set({
          platforms: [],
          total: 0,
          loading: false,
        });
      }
    } catch (err) {
      console.error('Error fetching platforms:', err);
      set({
        error: err instanceof Error ? err.message : 'Error desconocido',
        loading: false,
        platforms: [],
        total: 0,
      });
    }
  },

  createPlatform: async (platform: Partial<PlatformItem>) => {
    const { token } = useAuthStore.getState();
    
    try {
      await platformsService.create(platform, token ?? undefined);
      get().fetchPlatforms();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al crear plataforma',
      });
    }
  },

  updatePlatform: async (id: number, platform: Partial<PlatformItem>) => {
    const { token } = useAuthStore.getState();
    
    try {
      await platformsService.update(id, platform, token ?? undefined);
      get().fetchPlatforms();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar plataforma',
      });
    }
  },

  removePlatform: async (id: number) => {
    const { token } = useAuthStore.getState();
    
    try {
      await platformsService.remove(id, token ?? undefined);
      get().fetchPlatforms();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al eliminar plataforma',
      });
    }
  },

  getPlatformById: (id) => {
    return get().platforms.find(p => p.id === id);
  },

  setPage: (page) => set({ currentPage: page }),
  
  setFilters: (filters) => set({ filters, currentPage: 1 }),
}));
