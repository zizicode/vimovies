import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './token.store';
import { useJobStore } from './job.store';
import { useDashboardStore } from './dashboard.store';

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  isConnected: false,

  connect: () => {
    const { token } = useAuthStore.getState();
    
    if (!token) {
      console.log('[Socket] No token available, cannot connect');
      return;
    }

    if (get().socket?.connected) {
      console.log('[Socket] Already connected');
      return;
    }

    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3002/job', {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected to job channel');
      set({ isConnected: true });
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      set({ isConnected: false });
    });

    socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
      set({ isConnected: false });
    });

    socket.on('connected', (data) => {
      console.log('[Socket] Server confirmed connection:', data);
    });

    // Job events
    socket.on('job:started', (data) => {
      console.log('[Socket] Job started:', data);
      useJobStore.getState().setJobState({
        jobId: data.jobId,
        status: 'running',
        progress: 0,
        message: 'Job iniciado',
      });
    });

    socket.on('job:progress', (data) => {
      console.log('[Socket] Job progress:', data);
      const jobStore = useJobStore.getState();
      
      // Parse message to extract movie name and step
      const message = data.message || '';
      let currentMovie = jobStore.currentMovie;
      let currentStep = jobStore.currentStep;
      let stepIndex = jobStore.stepIndex;
      
      // Use details from backend if available
      if (data.details) {
        currentMovie = data.details.movieTitle || currentMovie;
        currentStep = data.details.currentStep || currentStep;
        stepIndex = data.details.stepIndex || stepIndex;
      }

      // Fallback: Try to extract movie name from message like "Procesando: Movie Title"
      if (!currentMovie) {
        const movieMatch = message.match(/Procesando:\s*(.+?)(?:\s+—|$)/);
        if (movieMatch) {
          currentMovie = movieMatch[1].trim();
        }
      }

      // Fallback: Try to extract step from message
      if (!currentStep) {
        const STEPS = ['obteniendo datos de TMDB', 'sincronizando géneros', 'sincronizando rating', 'sincronizando créditos', 'sincronizando vídeos', 'sincronizando plataformas'];
        for (let i = 0; i < STEPS.length; i++) {
          if (message.toLowerCase().includes(STEPS[i])) {
            currentStep = STEPS[i];
            stepIndex = i + 1;
            break;
          }
        }
      }

      // Calculate estimated time
      let estimatedTime = jobStore.estimatedTime;
      if (jobStore.startTime && data.progress > 0) {
        const elapsed = (Date.now() - jobStore.startTime) / 1000;
        const totalTime = (elapsed / data.progress) * 100;
        estimatedTime = Math.max(0, totalTime - elapsed);
      }

      useJobStore.getState().setJobState({
        progress: data.progress,
        message,
        currentMovie,
        currentStep,
        stepIndex,
        totalSteps: data.details?.totalSteps || jobStore.totalSteps,
        processedCount: data.details?.processed || jobStore.processedCount,
        errorCount: data.details?.errors || jobStore.errorCount,
        estimatedTime: Math.round(estimatedTime),
      });
    });

    socket.on('job:status', (data) => {
      console.log('[Socket] Job status:', data);
      
      if (data.status === 'completed') {
        const jobStore = useJobStore.getState();
        useJobStore.getState().setJobState({
          status: 'completed',
          progress: 100,
          message: 'Sincronización completada',
        });

        // Add activity to dashboard
        if (jobStore.currentMovie) {
          useDashboardStore.getState().addActivity({
            id: Date.now().toString(),
            type: 'sync',
            title: jobStore.currentMovie,
            details: 'Sync completado — sincronización de películas finalizada',
            time: 'ahora mismo',
            timestamp: Date.now(),
          });
        }
      } else if (data.status === 'failed') {
        useJobStore.getState().setJobState({
          status: 'error',
          message: 'La sincronización falló',
        });
      } else {
        useJobStore.getState().setJobState({
          status: data.status,
        });
      }
    });

    socket.on('job:error', (data) => {
      console.error('[Socket] Job error:', data);
      useJobStore.getState().setJobState({
        status: 'error',
        message: data.error,
      });
    });

    socket.on('job:paused', (data) => {
      console.log('[Socket] Job paused:', data);
      useJobStore.getState().setJobState({
        status: 'paused',
        message: 'Job pausado',
      });
    });

    socket.on('job:resumed', (data) => {
      console.log('[Socket] Job resumed:', data);
      useJobStore.getState().setJobState({
        status: 'running',
        message: 'Job reanudado',
      });
    });

    socket.on('job:stopped', (data) => {
      console.log('[Socket] Job stopped:', data);
      useJobStore.getState().setJobState({
        status: 'stopped',
        jobId: null,
        progress: 0,
        message: 'Job detenido',
      });
    });

    // Dashboard update events
    socket.on('dashboard:update', (data) => {
      console.log('[Socket] Dashboard update:', data);
      useDashboardStore.getState().fetchDashboardData();
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isConnected: false });
      console.log('[Socket] Disconnected');
    }
  },
}));
