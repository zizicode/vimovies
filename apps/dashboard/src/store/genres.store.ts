import { create } from 'zustand';
import { genresService } from '../services/api.service';
import type { GenreItem } from '../services/api.service';
import { useAuthStore } from './token.store';

interface GenresState {
  genres: GenreItem[];
  loading: boolean;
  error: string | null;
  total: number;
  currentPage: number;
  perPage: number;
  filters: {
    search?: string;
  };

  fetchGenres: () => Promise<void>;
  createGenre: (genre: Partial<GenreItem>) => Promise<void>;
  updateGenre: (id: number, genre: Partial<GenreItem>) => Promise<void>;
  removeGenre: (id: number) => Promise<void>;
  getGenreById: (id: number) => GenreItem | undefined;
  getGenreNamesByIds: (ids: number[]) => GenreItem[];
  setPage: (page: number) => void;
  setFilters: (filters: { search?: string }) => void;
}

export const useGenresStore = create<GenresState>()((set, get) => ({
  genres: [],
  loading: false,
  error: null,
  total: 0,
  currentPage: 1,
  perPage: 20,
  filters: {},

  fetchGenres: async () => {
    const { token } = useAuthStore.getState();
    const { currentPage, perPage, filters } = get();

    set({ loading: true, error: null });

    try {
      const response = await genresService.list(token);

      if (response.data) {
        set({
          genres: response.data,
          total: response.data.length,
          loading: false,
        });
      } else {
        set({
          genres: [],
          total: 0,
          loading: false,
        });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error desconocido',
        loading: false,
      });
    }
  },

  createGenre: async (genre: Partial<GenreItem>) => {
    const { token } = useAuthStore.getState();
    
    try {
      await genresService.create(genre, token);
      get().fetchGenres();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al crear género',
      });
    }
  },

  updateGenre: async (id: number, genre: Partial<GenreItem>) => {
    const { token } = useAuthStore.getState();
    
    try {
      await genresService.update(id, genre, token);
      get().fetchGenres();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al actualizar género',
      });
    }
  },

  removeGenre: async (id: number) => {
    const { token } = useAuthStore.getState();
    
    try {
      await genresService.remove(id, token);
      get().fetchGenres();
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Error al eliminar género',
      });
    }
  },

  getGenreById: (id) => {
    return get().genres.find(g => g.id === id);
  },

  getGenreNamesByIds: (ids) => {
    const allGenres = get().genres;
    return ids.map(id => allGenres.find(g => g.id === id)).filter(Boolean) as GenreItem[];
  },

  setPage: (page) => set({ currentPage: page }),
  
  setFilters: (filters) => set({ filters, currentPage: 1 }),
}));
