import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mediaService } from '../services/api.service';
import type { MediaItem, MediaListParams } from '../services/api.service';
import type { ContentStatus } from '@vimovies/types';
import { MediaType } from '@vimovies/types';
import { useAuthStore } from './token.store';

interface MediaState {
  // Estado de la lista
  allMovies: MediaItem[]; // Todas las películas cargadas (1000+)
  movies: MediaItem[]; // Películas filtradas y paginadas para mostrar
  total: number;
  currentPage: number;
  perPage: number;
  loading: boolean;
  error: string | null;

  // Filtros
  filters: {
    search: string;
    status: ContentStatus | '';
    mediaType: MediaType | '';
    genreId: number | '';
    sortBy: 'tmdb_popularity' | 'release_date' | 'editorial_rating';
    sortOrder: 'asc' | 'desc';
  };

  // Película seleccionada
  selectedMovie: MediaItem | null;

  // Acciones
  setFilters: (filters: Partial<MediaState['filters']>) => void;
  setPage: (page: number) => void;
  applyFilters: () => void;
  resetFilters: () => void;
  fetchMovies: () => Promise<void>;
  fetchMovieById: (id: string) => Promise<MediaItem | null>;
  updateEditorial: (id: string, data: any) => Promise<void>;
  patchMovie: (id: string, data: any) => Promise<void>;
  deleteMovie: (id: string) => Promise<void>;
  setSelectedMovie: (movie: MediaItem | null) => void;
}

const defaultFilters: MediaState['filters'] = {
  search: '',
  status: '',
  mediaType: MediaType.Movie,
  genreId: '',
  sortBy: 'tmdb_popularity',
  sortOrder: 'desc',
};

export const useMediaStore = create<MediaState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      allMovies: [],
      movies: [],
      total: 0,
      currentPage: 1,
      perPage: 20,
      loading: false,
      error: null,
      filters: defaultFilters,
      selectedMovie: null,

      // Acciones de filtros
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1, // Resetear a página 1 al cambiar filtros
        }));
      },

      setPage: (page) => {
        set({ currentPage: page });
      },

      // Aplicar filtros y paginación client-side
      applyFilters: () => {
        const { allMovies, filters, currentPage, perPage } = get();
        
        let filtered = [...allMovies];
        
        // Filtrar por búsqueda
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.title_es?.toLowerCase().includes(searchLower) ||
              m.original_title.toLowerCase().includes(searchLower) ||
              m.slug.toLowerCase().includes(searchLower)
          );
        }
        
        // Filtrar por estado
        if (filters.status) {
          filtered = filtered.filter((m) => m.status === filters.status);
        }
        
        // Filtrar por tipo de media
        if (filters.mediaType) {
          filtered = filtered.filter((m) => (m as any).media_type === filters.mediaType);
        }
        
        // Filtrar por género
        if (filters.genreId) {
          filtered = filtered.filter((m) => 
            m.genre_ids?.includes(filters.genreId as number)
          );
        }
        
        // Ordenar
        filtered.sort((a, b) => {
          let aVal: any, bVal: any;
          
          switch (filters.sortBy) {
            case 'tmdb_popularity':
              aVal = a.tmdb_popularity || 0;
              bVal = b.tmdb_popularity || 0;
              break;
            case 'release_date':
              aVal = a.release_date || '';
              bVal = b.release_date || '';
              break;
            case 'editorial_rating':
              aVal = (a as any).editorial_rating || 0;
              bVal = (b as any).editorial_rating || 0;
              break;
            default:
              return 0;
          }
          
          if (filters.sortOrder === 'asc') {
            return aVal > bVal ? 1 : -1;
          } else {
            return aVal < bVal ? 1 : -1;
          }
        });
        
        // Paginar
        const startIndex = (currentPage - 1) * perPage;
        const paginated = filtered.slice(startIndex, startIndex + perPage);
        
        set({
          movies: paginated,
          total: filtered.length,
        });
      },

      resetFilters: () => {
        set({
          filters: defaultFilters,
          currentPage: 1,
        });
      },

      // Obtener películas
      fetchMovies: async () => {
        const { token } = useAuthStore.getState();
        const { filters, currentPage, perPage } = get();

        set({ loading: true, error: null });

        try {
          const params: MediaListParams = {
            page: currentPage,
            limit: perPage,
          };

          if (filters.search) params.search = filters.search;
          if (filters.status) params.status = filters.status;
          if (filters.mediaType) {
            (params as any).media_type = filters.mediaType;
          }
          if (filters.genreId) {
            (params as any).genre_id = filters.genreId;
          }
          if (filters.sortBy) (params as any).sort_by = filters.sortBy;
          if (filters.sortOrder) (params as any).sort_order = filters.sortOrder;

          const response = await mediaService.list(params, token);

          if (response.success && response.data) {
            const total = (response as any).pagination?.total || response.data?.length || 0;
            set({
              movies: response.data,
              allMovies: response.data, // Mantener para compatibilidad
              total: total,
              loading: false,
            });
          } else {
            set({
              error: response.error || 'Error al cargar películas',
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

      // Obtener película por ID
      fetchMovieById: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          const response = await mediaService.getById(id, token);

          if (response.success && response.data) {
            set({
              selectedMovie: response.data,
              loading: false,
            });
            return response.data;
          } else {
            set({
              error: response.error || 'Error al cargar película',
              loading: false,
            });
            return null;
          }
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Error desconocido',
            loading: false,
          });
          return null;
        }
      },

      // Actualizar campos editoriales
      updateEditorial: async (id: string, data: any) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          const response = await mediaService.updateEditorial(id, data, token);

          if (response.success && response.data) {
            set((state) => ({
              allMovies: state.allMovies.map((m) => (m.id === id ? response.data! : m)),
              movies: state.movies.map((m) => (m.id === id ? response.data! : m)),
              selectedMovie: state.selectedMovie?.id === id ? response.data! : state.selectedMovie,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al actualizar película',
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

      // Actualización parcial
      patchMovie: async (id: string, data: any) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          const response = await mediaService.patch(id, data, token);

          if (response.success && response.data) {
            set((state) => ({
              allMovies: state.allMovies.map((m) => (m.id === id ? response.data! : m)),
              movies: state.movies.map((m) => (m.id === id ? response.data! : m)),
              selectedMovie: state.selectedMovie?.id === id ? response.data! : state.selectedMovie,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al actualizar película',
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

      // Eliminar película
      deleteMovie: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          const response = await mediaService.remove(id, token);

          if (response.success) {
            set((state) => ({
              allMovies: state.allMovies.filter((m) => m.id !== id),
              movies: state.movies.filter((m) => m.id !== id),
              selectedMovie: state.selectedMovie?.id === id ? null : state.selectedMovie,
              total: state.total - 1,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al eliminar película',
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

      // Establecer película seleccionada
      setSelectedMovie: (movie) => {
        set({ selectedMovie: movie });
      },
    }),
    {
      name: 'media-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        currentPage: state.currentPage,
      }), // Solo persistir filtros y página, no los datos
    }
  )
);
