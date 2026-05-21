import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface JobProgress {
  jobId: string
  progress: number
  message: string
  timestamp: string
}

interface JobStatus {
  jobId: string
  status: string
  timestamp: string
}

interface JobError {
  jobId: string
  error: string
  timestamp: string
}

interface JobStarted {
  jobId: string
  type: string
  params: any
  timestamp: string
}

interface JobStopped {
  jobId: string
  timestamp: string
}

export function useJobChannel(token: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [progress, setProgress] = useState<JobProgress | null>(null)
  const [status, setStatus] = useState<JobStatus | null>(null)
  const [error, setError] = useState<JobError | null>(null)

  // Conectar al canal job
  useEffect(() => {
    if (!token) return

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const socketInstance = io(`${API_URL}/job`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socketInstance.on('connect', () => {
      setIsConnected(true)
      console.log('[JobChannel] Connected')
    })

    socketInstance.on('disconnect', () => {
      setIsConnected(false)
      console.log('[JobChannel] Disconnected')
    })

    socketInstance.on('connected', (data) => {
      console.log('[JobChannel] Authenticated:', data)
    })

    socketInstance.on('job:progress', (data: JobProgress) => {
      setProgress(data)
    })

    socketInstance.on('job:status', (data: JobStatus) => {
      setStatus(data)
    })

    socketInstance.on('job:error', (data: JobError) => {
      setError(data)
    })

    socketInstance.on('job:started', (data: JobStarted) => {
      console.log('[JobChannel] Job started:', data)
    })

    socketInstance.on('job:stopped', (data: JobStopped) => {
      console.log('[JobChannel] Job stopped:', data)
    })

    socketInstance.on('connect_error', (err) => {
      console.error('[JobChannel] Connection error:', err)
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [token])

  // Enviar progreso
  const sendProgress = useCallback((jobId: string, progress: number, message: string) => {
    if (socket?.connected) {
      socket.emit('job:progress', { jobId, progress, message })
    }
  }, [socket])

  // Enviar estado
  const sendStatus = useCallback((jobId: string, status: string) => {
    if (socket?.connected) {
      socket.emit('job:status', { jobId, status })
    }
  }, [socket])

  // Enviar error
  const sendError = useCallback((jobId: string, error: string) => {
    if (socket?.connected) {
      socket.emit('job:error', { jobId, error })
    }
  }, [socket])

  // Iniciar job
  const startJob = useCallback((type: string, params: any = {}) => {
    if (socket?.connected) {
      socket.emit('job:start', { type, params })
    }
  }, [socket])

  // Detener job
  const stopJob = useCallback((jobId: string) => {
    if (socket?.connected) {
      socket.emit('job:stop', { jobId })
    }
  }, [socket])

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isConnected,
    progress,
    status,
    error,
    sendProgress,
    sendStatus,
    sendError,
    startJob,
    stopJob,
    clearError,
  }
}
