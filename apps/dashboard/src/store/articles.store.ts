import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { articlesService } from '../services/api.service';
import type { ArticleItem, ArticleListParams } from '../services/api.service';
import type { ContentStatus, ArticleIntent } from '@vimovies/types';
import { useAuthStore } from './token.store';

interface ArticlesState {
  // Estado de la lista
  articles: ArticleItem[];
  total: number;
  currentPage: number;
  perPage: number;
  loading: boolean;
  error: string | null;

  // Filtros
  filters: {
    search: string;
    status: ContentStatus | '';
    intent: ArticleIntent | '';
    authorId: string | '';
  };

  // Artículo seleccionado
  selectedArticle: ArticleItem | null;

  // Acciones
  setFilters: (filters: Partial<ArticlesState['filters']>) => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
  fetchArticles: () => Promise<void>;
  fetchArticleById: (id: string) => Promise<ArticleItem | null>;
  createArticle: (data: any) => Promise<void>;
  updateArticle: (id: string, data: any) => Promise<void>;
  publishArticle: (id: string) => Promise<void>;
  archiveArticle: (id: string) => Promise<void>;
  deleteArticle: (id: string) => Promise<void>;
  setSelectedArticle: (article: ArticleItem | null) => void;
}

const defaultFilters: ArticlesState['filters'] = {
  search: '',
  status: '',
  intent: '',
  authorId: '',
};

export const useArticlesStore = create<ArticlesState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      articles: [],
      total: 0,
      currentPage: 1,
      perPage: 20,
      loading: false,
      error: null,
      filters: defaultFilters,
      selectedArticle: null,

      // Acciones de filtros
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          currentPage: 1,
        }));
      },

      setPage: (page) => {
        set({ currentPage: page });
      },

      resetFilters: () => {
        set({
          filters: defaultFilters,
          currentPage: 1,
        });
      },

      // Obtener artículos
      fetchArticles: async () => {
        const { token } = useAuthStore.getState();
        const { filters, currentPage, perPage } = get();

        set({ loading: true, error: null });

        try {
          const params: ArticleListParams = {
            page: currentPage,
            limit: perPage,
          };

          if (filters.status) params.status = filters.status as ContentStatus;
          if (filters.intent) params.intent = filters.intent as ArticleIntent;
          if (filters.authorId) (params as any).author_id = filters.authorId;

          const response = await articlesService.list(params, token ?? undefined);

          if (response.success && response.data) {
            const total = (response as any).pagination?.total || response.data?.length || 0;
            set({
              articles: response.data,
              total: total,
              loading: false,
            });
          } else {
            set({
              error: response.error || 'Error al cargar artículos',
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

      // Obtener artículo por ID
      fetchArticleById: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          const response = await articlesService.getById(id, token);

          if (response.success && response.data) {
            set({
              selectedArticle: response.data,
              loading: false,
            });
            return response.data;
          } else {
            set({
              error: response.error || 'Error al cargar artículo',
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

      // Crear artículo
      createArticle: async (data: any) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          if (!token) throw new Error('Authentication required');
          const response = await articlesService.create(data, token);

          if (response.success && response.data) {
            set((state) => ({
              articles: [response.data!, ...state.articles],
              total: state.total + 1,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al crear artículo',
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

      // Actualizar artículo
      updateArticle: async (id: string, data: any) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          if (!token) throw new Error('Authentication required');
          const response = await articlesService.update(id, data, token);

          if (response.success && response.data) {
            set((state) => ({
              articles: state.articles.map((a) => (a.id === id ? response.data! : a)),
              selectedArticle: state.selectedArticle?.id === id ? response.data! : state.selectedArticle,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al actualizar artículo',
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

      // Publicar artículo
      publishArticle: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          if (!token) throw new Error('Authentication required');
          const response = await articlesService.publish(id, token);

          if (response.success && response.data) {
            set((state) => ({
              articles: state.articles.map((a) => (a.id === id ? response.data! : a)),
              selectedArticle: state.selectedArticle?.id === id ? response.data! : state.selectedArticle,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al publicar artículo',
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

      // Archivar artículo
      archiveArticle: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          if (!token) throw new Error('Authentication required');
          const response = await articlesService.archive(id, token);

          if (response.success && response.data) {
            set((state) => ({
              articles: state.articles.map((a) => (a.id === id ? response.data! : a)),
              selectedArticle: state.selectedArticle?.id === id ? response.data! : state.selectedArticle,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al archivar artículo',
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

      // Eliminar artículo
      deleteArticle: async (id: string) => {
        const { token } = useAuthStore.getState();
        
        set({ loading: true, error: null });

        try {
          if (!token) throw new Error('Authentication required');
          const response = await articlesService.remove(id, token);

          if (response.success) {
            set((state) => ({
              articles: state.articles.filter((a) => a.id !== id),
              selectedArticle: state.selectedArticle?.id === id ? null : state.selectedArticle,
              total: state.total - 1,
              loading: false,
            }));
          } else {
            set({
              error: response.error || 'Error al eliminar artículo',
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

      // Establecer artículo seleccionado
      setSelectedArticle: (article) => {
        set({ selectedArticle: article });
      },
    }),
    {
      name: 'articles-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        filters: state.filters,
        currentPage: state.currentPage,
      }),
    }
  )
);
