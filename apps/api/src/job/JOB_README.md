# SyncMoviesJob - TMDB Database Synchronization

This job synchronizes movie data from TMDB to your database following the exact specification in the [TMDB SYNC GUIDE](./README.md).

## Features

- **Complete movie sync**: Fetches and stores all movie data including credits, videos, genres, ratings, and watch providers
- **Person sync**: Automatically creates/updates actors, directors, and crew members
- **Socket.IO control**: Real-time job control via WebSocket (start, pause, resume, stop)
- **Real-time progress**: Live progress updates via Socket.IO events
- **Flexible scheduling**: Cron-based scheduling with optional boot-time execution
- **Execution limits**: Stop after N cycles or N duration
- **Configurable batch size**: Control how many movies to sync per cycle
- **Protected fields**: Editorial fields are never overwritten by sync
- **Clean logging**: Structured console output without emojis

## Usage

### Socket.IO Control (Recommended for Admin Dashboard)

The job can be controlled in real-time via Socket.IO on the `/job` namespace (requires admin authentication).

**Connect to job namespace:**
```typescript
import { io } from 'socket.io-client'

const socket = io('http://localhost:3002/job', {
  auth: {
    token: 'your-admin-jwt-token'
  }
})
```

**Start a job:**
```typescript
socket.emit('job:start', {
  type: 'sync-movies',
  params: {
    maxMovies: 50
  }
})

// Response
socket.on('job:started', (data) => {
  console.log('Job started:', data.jobId)
})
```

**Listen to progress:**
```typescript
socket.on('job:progress', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.message}`)
})

socket.on('job:status', (data) => {
  console.log('Status:', data.status) // running, paused, completed, stopped, failed
})

socket.on('job:error', (data) => {
  console.error('Error:', data.error)
})
```

**Control the job:**
```typescript
// Pause
socket.emit('job:pause', { jobId: 'job_1234567890_abc123' })
socket.on('job:paused', (data) => console.log('Paused:', data.success))

// Resume
socket.emit('job:resume', { jobId: 'job_1234567890_abc123' })
socket.on('job:resumed', (data) => console.log('Resumed:', data.success))

// Stop
socket.emit('job:stop', { jobId: 'job_1234567890_abc123' })
socket.on('job:stopped', (data) => console.log('Stopped:', data.success))

// Get status
socket.emit('job:status', { jobId: 'job_1234567890_abc123' })
socket.on('job:status-response', (data) => {
  console.log('Job state:', data.status)
})
```

### Programmatic Usage (Cron Mode)

```typescript
import { SyncMoviesJob } from './job/sync-movies.job'

// Basic usage - runs daily at 3am
SyncMoviesJob.start({
  schedule: '0 3 * * *',
  maxMovies: 50
})

// Manual control
SyncMoviesJob.stopCron()
```

See [CONFIG_EXAMPLES.md](./CONFIG_EXAMPLES.md) for more configuration options.

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| schedule | string | '0 3 * * *' | Cron expression for scheduled execution (cron mode only) |
| jobId | string | 'cron-job' | Unique identifier for the job instance |
| maxMovies | number | 20 | Maximum movies to sync per execution |
| onProgress | function | undefined | Callback for progress updates: `(jobId, progress, message) => void` |
| onStatus | function | undefined | Callback for status changes: `(jobId, status) => void` |
| onError | function | undefined | Callback for errors: `(jobId, error) => void` |
| limit | number | undefined | Maximum number of cycles before stopping (legacy) |
| durationMs | number | undefined | Maximum duration in milliseconds before stopping (legacy) |
| startOnBoot | boolean | false | Execute cycles immediately on API startup (legacy) |
| bootIntervalMs | number | 60000 | Interval between boot executions (legacy) |
| bootExecutions | number | 5 | Number of executions to run on boot (legacy) |

## Sync Process

The job follows this exact order for each movie:

1. Fetch movie data from TMDB (Spanish and English)
2. Generate slug from original title and year
3. Insert/update media record
4. Sync genres (delete old, insert new)
5. Sync ratings (upsert)
6. Sync people (actors and crew)
7. Sync media credits (delete old, insert new)
8. Sync videos (delete old, insert new)
9. Sync watch providers (delete old, insert new)

## Protected Fields

The following fields are NEVER overwritten by sync:

- slug
- status (new movies are inserted as "draft" for manual review)
- editorial_review_es
- editorial_review_en
- editorial_rating
- editorial_verdict_es
- editorial_verdict_en
- seo_title_es
- seo_title_en
- seo_description_es
- seo_description_en
- og_image_url

## Console Output

The job provides structured logging without emojis:

```
[2024-01-15T10:30:00.000Z] SyncMoviesJob configured - schedule: 0 3 * * *, maxMovies: 50
[2024-01-15T10:30:00.000Z] Starting cycle 1
[2024-01-15T10:30:01.000Z] Starting sync cycle - max movies: 50
[2024-01-15T10:30:02.000Z] Fetched 50 movies from TMDB page 123
[2024-01-15T10:30:03.000Z] [155] The Dark Knight - synced successfully
[2024-01-15T10:30:04.000Z] [278] Inception - synced successfully
[2024-01-15T10:30:05.000Z] ERROR: [550] Fight Club - Failed to fetch from TMDB
[2024-01-15T10:30:45.000Z] Cycle completed - processed: 48, errors: 2, time: 42.50s
[2024-01-15T10:30:45.000Z] Cycle 1 completed - +48 movies, 2 errors, 42.50s
```

## Implementation Details

- **Movie source**: Fetches random pages from TMDB popular movies
- **Person sync**: Only syncs first 15 actors and key crew roles
- **Video filtering**: Only YouTube videos of type Trailer, Teaser, Clip, Featurette
- **Provider regions**: ES, MX, AR, CO, US
- **Crew roles synced**: Director, Screenplay, Story, Producer, Executive Producer, Original Music Composer, Director of Photography
- **Rate limiting**: 500ms delay between movie syncs to avoid overwhelming TMDB API

## Error Handling

- Individual movie sync failures don't stop the entire cycle
- Errors are logged with TMDB ID and movie title
- Person sync failures are logged but don't prevent movie sync
- Database errors are caught and logged

## Status Monitoring

**Via Socket.IO:**
```typescript
socket.emit('job:status', { jobId: 'job_1234567890_abc123' })
socket.on('job:status-response', (data) => {
  // data.status contains:
  // {
  //   isRunning: boolean,
  //   isPaused: boolean,
  //   isStopped: boolean,
  //   executionCount: number,
  //   totalProcessed: number,
  //   totalErrors: number,
  //   jobStartedAt: number,
  //   currentMovieIndex: number,
  //   totalMovies: number
  // }
})
```

**Programmatic:**
```typescript
const status = SyncMoviesJob.getJobStatus('job_1234567890_abc123')
// Returns JobState or null
```

## Related Documentation

- [README.md](./README.md) - Detailed TMDB sync specification and data transformation guide
- [CONFIG_EXAMPLES.md](./CONFIG_EXAMPLES.md) - Configuration examples and cron format
