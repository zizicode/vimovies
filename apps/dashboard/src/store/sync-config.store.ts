import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SyncConfig {
  // Parámetros de sincronización
  maxMovies: number;
  schedule: string;
  customSchedule?: string;
  delayBetweenMovies: number; // ms
  
  // Filtros de películas
  minPopularity: number;
  minVoteAverage: number;
  minVoteCount: number;
  releaseYearStart: number | null;
  releaseYearEnd: number | null;
  includeAdult: boolean;
  originalLanguage: string | null;
  genres: number[]; // TMDB genre IDs
  
  // Qué sincronizar
  syncGenres: boolean;
  syncCredits: boolean;
  syncVideos: boolean;
  syncWatchProviders: boolean;
  syncRatings: boolean;
  
  // Créditos específicos
  maxCast: number;
  maxCrew: number;
  crewJobs: string[];
  
  // Vídeos específicos
  videoSites: string[];
  videoTypes: string[];
  includeOfficialOnly: boolean;
  
  // Watch providers
  providerRegions: string[];
  
  // Opciones avanzadas
  skipExisting: boolean;
  updateExisting: boolean;
  preserveEditorial: boolean;
  preserveSeo: boolean;
  defaultStatus: 'draft' | 'published' | 'archived';
  defaultNoindex: boolean;
  defaultSitemapPriority: 'high' | 'medium' | 'low' | 'minimal';
}

interface SyncConfigState {
  config: SyncConfig;
  updateConfig: (updates: Partial<SyncConfig>) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => boolean;
}

const DEFAULT_CONFIG: SyncConfig = {
  maxMovies: 20,
  schedule: '0 3 * * *',
  customSchedule: '',
  delayBetweenMovies: 500,
  
  minPopularity: 0,
  minVoteAverage: 0,
  minVoteCount: 0,
  releaseYearStart: null,
  releaseYearEnd: null,
  includeAdult: false,
  originalLanguage: null,
  genres: [],
  
  syncGenres: true,
  syncCredits: true,
  syncVideos: true,
  syncWatchProviders: true,
  syncRatings: true,
  
  maxCast: 15,
  maxCrew: 15,
  crewJobs: ['Director', 'Screenplay', 'Story', 'Producer', 'Executive Producer', 'Original Music Composer', 'Director of Photography'],
  
  videoSites: ['YouTube'],
  videoTypes: ['Trailer', 'Teaser', 'Clip', 'Featurette'],
  includeOfficialOnly: false,
  
  providerRegions: ['ES', 'MX', 'AR', 'CO', 'US'],
  
  skipExisting: false,
  updateExisting: true,
  preserveEditorial: true,
  preserveSeo: true,
  defaultStatus: 'draft',
  defaultNoindex: true,
  defaultSitemapPriority: 'medium',
};

export const useSyncConfigStore = create<SyncConfigState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      
      updateConfig: (updates) => set((state) => ({
        config: { ...state.config, ...updates }
      })),
      
      resetConfig: () => set({ config: DEFAULT_CONFIG }),
      
      exportConfig: () => {
        return JSON.stringify(get().config, null, 2);
      },
      
      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json);
          set({ config: { ...DEFAULT_CONFIG, ...parsed } });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'vimovies-sync-config',
      version: 1,
    }
  )
);
