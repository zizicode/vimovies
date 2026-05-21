import { create } from 'zustand';

interface ActivityItem {
  id: string;
  type: 'sync' | 'editorial' | 'new' | 'seo';
  title: string;
  details: string;
  time: string;
  timestamp: number;
}

interface SyncQueueItem {
  id: string;
  name: string;
  step: string;
  progress: number;
  status: 'queued' | 'processing' | 'completed' | 'error';
}

interface DashboardState {
  // Stats
  totalMovies: number;
  monthlyVisits: number;
  totalPeople: number;
  noindexMovies: number;
  moviesDelta: string;
  visitsDelta: string;
  peopleDelta: string;
  
  // Activity
  recentActivity: ActivityItem[];
  
  // Sync Queue
  syncQueue: SyncQueueItem[];
  
  // Actions
  setStats: (stats: Partial<DashboardState>) => void;
  addActivity: (activity: ActivityItem) => void;
  updateSyncQueue: (queue: SyncQueueItem[]) => void;
  updateSyncItem: (id: string, updates: Partial<SyncQueueItem>) => void;
  
  // Fetch data from API
  fetchDashboardData: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial stats (will be replaced with API data)
  totalMovies: 3412,
  monthlyVisits: 94200,
  totalPeople: 8207,
  noindexMovies: 312,
  moviesDelta: '+48 esta semana',
  visitsDelta: '+12.4% vs mes anterior',
  peopleDelta: '+124 este mes',
  
  // Initial activity
  recentActivity: [
    {
      id: '1',
      type: 'sync',
      title: 'Oppenheimer',
      details: 'Sync completado — 9 pasos, 42 créditos, 3 plataformas',
      time: 'hace 14 min',
      timestamp: Date.now() - 14 * 60 * 1000,
    },
    {
      id: '2',
      type: 'editorial',
      title: 'The Dark Knight',
      details: 'Editorial actualizado — reseña ES añadida',
      time: 'hace 1 hora',
      timestamp: Date.now() - 60 * 60 * 1000,
    },
    {
      id: '3',
      type: 'new',
      title: 'Furiosa (2024)',
      details: 'Nueva película añadida — pendiente de sync completo',
      time: 'hace 2 horas',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
    },
    {
      id: '4',
      type: 'sync',
      title: 'Dune (2021)',
      details: 'Sync completado — 5 plataformas en 4 países',
      time: 'hace 3 horas',
      timestamp: Date.now() - 3 * 60 * 60 * 1000,
    },
    {
      id: '5',
      type: 'seo',
      title: '123 páginas',
      details: 'SEO optimizado con prioridad "high" actualizadas en sitemap',
      time: 'Ayer, 11:42 PM',
      timestamp: Date.now() - 24 * 60 * 60 * 1000,
    },
  ],
  
  // Initial sync queue
  syncQueue: [
    {
      id: '1',
      name: 'Challengers (2024)',
      step: 'Completado',
      progress: 100,
      status: 'completed',
    },
  ],
  
  setStats: (stats) => set(stats),
  
  addActivity: (activity) => set((state) => ({
    recentActivity: [activity, ...state.recentActivity].slice(0, 10),
  })),
  
  updateSyncQueue: (queue) => set({ syncQueue: queue }),
  
  updateSyncItem: (id, updates) => set((state) => ({
    syncQueue: state.syncQueue.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    ),
  })),
  
  fetchDashboardData: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch stats
      const statsResponse = await fetch('http://localhost:3002/api/dashboard/stats', {
        method: 'GET',
        headers,
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success && statsData.data) {
          set({
            totalMovies: statsData.data.totalMovies,
            monthlyVisits: statsData.data.monthlyVisits,
            totalPeople: statsData.data.totalPeople,
            noindexMovies: statsData.data.noindexMovies,
            moviesDelta: statsData.data.moviesDelta,
            visitsDelta: statsData.data.visitsDelta,
            peopleDelta: statsData.data.peopleDelta,
          });
        }
      }

      // Fetch activity
      const activityResponse = await fetch('http://localhost:3002/api/dashboard/activity', {
        method: 'GET',
        headers,
      });

      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        if (activityData.success && activityData.data) {
          set({ recentActivity: activityData.data });
        }
      }

      // Fetch sync queue
      const queueResponse = await fetch('http://localhost:3002/api/dashboard/sync-queue', {
        method: 'GET',
        headers,
      });

      if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        if (queueData.success && queueData.data) {
          set({ syncQueue: queueData.data });
        }
      }
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error);
    }
  },
}));
