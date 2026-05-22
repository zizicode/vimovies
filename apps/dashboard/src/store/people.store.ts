import { create } from 'zustand';
import { useAuthStore } from './token.store';
import { peopleService } from '../services/api.service';

export interface PersonItem {
  id: string;
  tmdb_id: number;
  slug: string;
  name: string;
  also_known_as?: string[] | null;
  birthdate?: string | null;
  deathdate?: string | null;
  birthplace?: string | null;
  biography_es?: string | null;
  biography_en?: string | null;
  gender?: 0 | 1 | 2 | 3 | null;
  profile_path?: string | null;
  homepage_url?: string | null;
  imdb_id?: string | null;
  tmdb_popularity?: number | null;
  sitemap_priority?: string;
  seo_title_es?: string | null;
  seo_title_en?: string | null;
  seo_description_es?: string | null;
  seo_description_en?: string | null;
  og_image_url?: string | null;
  canonical_url_es?: string | null;
  canonical_url_en?: string | null;
  created_at: string;
  updated_at: string;
}

interface PeopleState {
  people: PersonItem[];
  total: number;
  currentPage: number;
  perPage: number;
  loading: boolean;
  error: string | null;
  filters: {
    search?: string;
  };
  
  fetchPeople: () => Promise<void>;
  setPage: (page: number) => void;
  setFilters: (filters: Partial<{ search: string }>) => void;
  getPersonById: (id: string) => Promise<PersonItem | null>;
  updatePerson: (id: string, data: Partial<PersonItem>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  total: 0,
  currentPage: 1,
  perPage: 20,
  loading: false,
  error: null,
  filters: {},

  fetchPeople: async () => {
    const { token } = useAuthStore.getState();
    const { currentPage, perPage, filters } = get();
    
    set({ loading: true, error: null });
    
    try {
      const response = await peopleService.list(
        currentPage,
        perPage,
        filters.search,
        token ?? undefined
      );
      
      if (response.data) {
        const people = (response.data as any).data || [];
        const total = (response.data as any).total || 0;
        set({
          people,
          total,
          loading: false,
        });
      } else {
        set({
          people: [],
          total: 0,
          loading: false,
        });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Error fetching people',
        loading: false,
      });
    }
  },

  setPage: (page: number) => {
    set({ currentPage: page });
  },

  setFilters: (filters: Partial<{ search: string }>) => {
    set({ filters: { ...get().filters, ...filters }, currentPage: 1 });
  },

  getPersonById: async (id: string) => {
    const { token } = useAuthStore.getState();
    
    try {
      const response = await peopleService.getById(id, token ?? undefined);
      return response.data || null;
    } catch (error) {
      console.error('Error fetching person:', error);
      return null;
    }
  },

  updatePerson: async (id: string, data: Partial<PersonItem>) => {
    const { token } = useAuthStore.getState();
    
    try {
      console.log('Updating person with data:', { id, data }); // Debug log
      const response = await peopleService.update(id, data, token);
      console.log('Update response:', response); // Debug log
      
      // Update the local state with the returned data
      if (response.data) {
        set((state) => ({
          people: state.people.map((person) =>
            person.id === id ? { ...person, ...response.data } : person
          ),
        }));
      }
      
      // Optionally refresh to ensure consistency
      await get().fetchPeople();
    } catch (error) {
      console.error('Error updating person:', error);
      set({
        error: error instanceof Error ? error.message : 'Error al actualizar persona',
      });
      throw error;
    }
  },

  deletePerson: async (id: string) => {
    const { token } = useAuthStore.getState();
    
    try {
      await peopleService.remove(id, token);
      await get().fetchPeople();
    } catch (error) {
      console.error('Error deleting person:', error);
      throw error;
    }
  },
}));
