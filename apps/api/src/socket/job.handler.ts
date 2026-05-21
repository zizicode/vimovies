import { Server, Socket } from 'socket.io'
import { SyncMoviesJob } from '../job/sync-movies.job.js'

/**
 * Manejador del canal 'job' - Solo accesible por admins
 */
export function setupJobChannel(io: Server) {
  // Crear namespace '/job' con middleware de autenticación admin
  const jobNamespace = io.of('/job')

  // Aplicar middleware de autenticación
  jobNamespace.use(async (socket, next) => {
    // Importar el middleware de autenticación
    const { adminAuthMiddleware } = await import('./auth.middleware.js')
    await adminAuthMiddleware(socket, next)
  })

  jobNamespace.on('connection', (socket: Socket) => {
    console.log(`[Socket] Admin connected to job channel: ${socket.id}`)

    // Unirse a la sala general del canal job
    socket.join('job-general')

    // Enviar mensaje de bienvenida
    socket.emit('connected', {
      message: 'Connected to job channel',
      channel: 'job',
      timestamp: new Date().toISOString(),
    })

    // ── Eventos del canal job ───────────────────────────────────────

    /**
     * Emitir progreso de un job
     * El admin puede enviar actualizaciones de progreso
     */
    socket.on('job:progress', (data) => {
      const { jobId, progress, message } = data
      console.log(`[Socket] Job progress: ${jobId} - ${progress}% - ${message}`)

      // Broadcast a todos los admins en el canal
      jobNamespace.to('job-general').emit('job:progress', {
        jobId,
        progress,
        message,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Emitir estado de un job
     */
    socket.on('job:status', (data) => {
      const { jobId, status } = data
      console.log(`[Socket] Job status: ${jobId} - ${status}`)

      jobNamespace.to('job-general').emit('job:status', {
        jobId,
        status,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Emitir error de un job
     */
    socket.on('job:error', (data) => {
      const { jobId, error } = data
      console.error(`[Socket] Job error: ${jobId}`, error)

      jobNamespace.to('job-general').emit('job:error', {
        jobId,
        error,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Iniciar un job (ejemplo: sync movies)
     */
    socket.on('job:start', async (data) => {
      const { type, params, config } = data
      console.log(`[Socket] Job started: ${type}`, params, config)

      const jobId = generateJobId()

      // Emitir confirmación
      socket.emit('job:started', {
        jobId,
        type,
        params,
        config,
        timestamp: new Date().toISOString(),
      })

      // Ejecutar job real si es sync-movies
      if (type === 'sync-movies') {
        SyncMoviesJob.execute(jobId, {
          maxMovies: config?.maxMovies || 20,
          delayBetweenMovies: config?.delayBetweenMovies,
          minPopularity: config?.minPopularity,
          minVoteAverage: config?.minVoteAverage,
          minVoteCount: config?.minVoteCount,
          releaseYearStart: config?.releaseYearStart,
          releaseYearEnd: config?.releaseYearEnd,
          includeAdult: config?.includeAdult,
          originalLanguage: config?.originalLanguage,
          genres: config?.genres,
          syncGenres: config?.syncGenres,
          syncCredits: config?.syncCredits,
          syncVideos: config?.syncVideos,
          syncWatchProviders: config?.syncWatchProviders,
          syncRatings: config?.syncRatings,
          maxCast: config?.maxCast,
          maxCrew: config?.maxCrew,
          crewJobs: config?.crewJobs,
          videoSites: config?.videoSites,
          videoTypes: config?.videoTypes,
          includeOfficialOnly: config?.includeOfficialOnly,
          providerRegions: config?.providerRegions,
          skipExisting: config?.skipExisting,
          updateExisting: config?.updateExisting,
          preserveEditorial: config?.preserveEditorial,
          preserveSeo: config?.preserveSeo,
          defaultStatus: config?.defaultStatus,
          defaultNoindex: config?.defaultNoindex,
          defaultSitemapPriority: config?.defaultSitemapPriority,
          onProgress: (jid, progress, message, details) => {
            jobNamespace.to('job-general').emit('job:progress', {
              jobId: jid,
              progress,
              message,
              details,
              timestamp: new Date().toISOString(),
            })
          },
          onStatus: (jid, status) => {
            jobNamespace.to('job-general').emit('job:status', {
              jobId: jid,
              status,
              timestamp: new Date().toISOString(),
            })

            // Emit dashboard update when job completes
            if (status === 'completed' || status === 'failed') {
              jobNamespace.to('job-general').emit('dashboard:update', {
                type: 'refresh',
                timestamp: new Date().toISOString(),
              });
            }
          },
          onError: (jid, error) => {
            jobNamespace.to('job-general').emit('job:error', {
              jobId: jid,
              error,
              timestamp: new Date().toISOString(),
            })
          }
        })
      }
    })

    /**
     * Detener un job
     */
    socket.on('job:stop', (data) => {
      const { jobId } = data
      console.log(`[Socket] Job stopped: ${jobId}`)

      const stopped = SyncMoviesJob.stop(jobId)
      
      jobNamespace.to('job-general').emit('job:stopped', {
        jobId,
        success: stopped,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Pausar un job
     */
    socket.on('job:pause', (data) => {
      const { jobId } = data
      console.log(`[Socket] Job paused: ${jobId}`)

      const paused = SyncMoviesJob.pause(jobId)
      
      jobNamespace.to('job-general').emit('job:paused', {
        jobId,
        success: paused,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Reanudar un job pausado
     */
    socket.on('job:resume', (data) => {
      const { jobId } = data
      console.log(`[Socket] Job resumed: ${jobId}`)

      const resumed = SyncMoviesJob.resume(jobId)
      
      jobNamespace.to('job-general').emit('job:resumed', {
        jobId,
        success: resumed,
        timestamp: new Date().toISOString(),
      })
    })

    /**
     * Obtener estado de un job
     */
    socket.on('job:status', (data) => {
      const { jobId } = data
      console.log(`[Socket] Job status requested: ${jobId}`)

      const status = SyncMoviesJob.getJobStatus(jobId)
      
      socket.emit('job:status-response', {
        jobId,
        status,
        timestamp: new Date().toISOString(),
      })
    })

    // ── Manejo de desconexión ───────────────────────────────────────

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Admin disconnected from job channel: ${socket.id} - ${reason}`)
    })

    socket.on('error', (error) => {
      console.error(`[Socket] Error in job channel:`, error)
    })
  })

  return jobNamespace
}

/**
 * Generar un ID único para jobs
 */
function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Helper para emitir eventos desde fuera del contexto de socket
 * (útil para emitir desde jobs o servicios)
 */
export function emitJobEvent(io: Server, event: string, data: any) {
  const jobNamespace = io.of('/job')
  jobNamespace.to('job-general').emit(event, {
    ...data,
    timestamp: new Date().toISOString(),
  })
}
