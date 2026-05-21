import { useJobChannel } from '../../hooks/useJobChannel'

export function JobMonitor({ token }: { token: string | null }) {
  const {
    isConnected,
    progress,
    status,
    error,
    startJob,
    stopJob,
    clearError,
  } = useJobChannel(token)

  const handleStartSync = () => {
    startJob('sync-movies', { maxMovies: 50 })
  }

  const handleStopJob = () => {
    if (progress?.jobId) {
      stopJob(progress.jobId)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Job Monitor</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800 font-medium">Error: {error.error}</p>
          <button
            onClick={clearError}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {progress && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Job ID: {progress.jobId}</span>
            <span className="font-bold">{progress.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-gray-600">{progress.message}</p>
          <button
            onClick={handleStopJob}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Stop Job
          </button>
        </div>
      )}

      {status && !progress && (
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded">
          <p className="font-medium">Status: {status.status}</p>
          <p className="text-sm text-gray-600">Job ID: {status.jobId}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleStartSync}
          disabled={!isConnected}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Start Sync Movies
        </button>
      </div>
    </div>
  )
}
