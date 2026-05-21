import { create } from 'zustand';
import { useSocketStore } from './socket.store';
import { useSyncConfigStore } from './sync-config.store';

interface JobState {
  jobId: string | null;
  status: 'idle' | 'running' | 'paused' | 'stopped' | 'completed' | 'error';
  progress: number;
  message: string;
  currentMovie: string | null;
  currentMovieIndex: number;
  totalMovies: number;
  currentStep: string | null;
  totalSteps: number;
  stepIndex: number;
  estimatedTime: number; // in seconds
  processedCount: number;
  errorCount: number;
  startTime: number | null;
  startJob: (maxMovies?: number) => void;
  pauseJob: () => void;
  resumeJob: () => void;
  stopJob: () => void;
  setJobState: (state: Partial<JobState>) => void;
  resetJob: () => void;
}

const STEPS = [
  'obteniendo datos de TMDB',
  'sincronizando géneros',
  'sincronizando rating',
  'sincronizando créditos',
  'sincronizando vídeos',
  'sincronizando plataformas'
];

export const useJobStore = create<JobState>()((set, get) => ({
  jobId: null,
  status: 'idle',
  progress: 0,
  message: '',
  currentMovie: null,
  currentMovieIndex: 0,
  totalMovies: 0,
  currentStep: null,
  totalSteps: STEPS.length,
  stepIndex: 0,
  estimatedTime: 0,
  processedCount: 0,
  errorCount: 0,
  startTime: null,

  startJob: (maxMovies = 20) => {
    const socket = useSocketStore.getState().socket;
    const config = useSyncConfigStore.getState().config;
    if (!socket) {
      console.error('[Job] Socket not connected');
      return;
    }

    set({
      status: 'running',
      progress: 0,
      message: 'Iniciando sincronización...',
      processedCount: 0,
      errorCount: 0,
      startTime: Date.now(),
    });

    // Use customSchedule if schedule is 'custom'
    const schedule = config.schedule === 'custom' && config.customSchedule ? config.customSchedule : config.schedule;

    socket.emit('job:start', {
      type: 'sync-movies',
      params: { maxMovies },
      config: { ...config, schedule },
    });
  },

  pauseJob: () => {
    const socket = useSocketStore.getState().socket;
    const jobId = get().jobId;
    if (!socket || !jobId) {
      console.error('[Job] Cannot pause: no socket or job id');
      return;
    }

    socket.emit('job:pause', { jobId });
  },

  resumeJob: () => {
    const socket = useSocketStore.getState().socket;
    const jobId = get().jobId;
    if (!socket || !jobId) {
      console.error('[Job] Cannot resume: no socket or job id');
      return;
    }

    socket.emit('job:resume', { jobId });
  },

  stopJob: () => {
    const socket = useSocketStore.getState().socket;
    const jobId = get().jobId;
    if (!socket || !jobId) {
      console.error('[Job] Cannot stop: no socket or job id');
      return;
    }

    socket.emit('job:stop', { jobId });
  },

  setJobState: (state) => set(state),

  resetJob: () => set({
    jobId: null,
    status: 'idle',
    progress: 0,
    message: '',
    currentMovie: null,
    currentMovieIndex: 0,
    totalMovies: 0,
    currentStep: null,
    stepIndex: 0,
    estimatedTime: 0,
    processedCount: 0,
    errorCount: 0,
    startTime: null,
  }),
}));
