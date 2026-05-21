# SyncMoviesJob - Configuration Examples

This file shows different ways to configure the movie sync job.

## Production Mode - Runs daily at 3am

```typescript
SyncMoviesJob.start({
  schedule: '0 3 * * *',        // Every day at 3am
  maxMovies: 50,                // 50 movies per cycle
})
```

## Boot Mode - Runs on API startup

```typescript
SyncMoviesJob.start({
  schedule: '0 3 * * *',        // Every day at 3am
  maxMovies: 50,
  startOnBoot: true,            // Execute on startup
  bootIntervalMs: 60000,        // Every 60 seconds
  bootExecutions: 10            // 10 executions on boot
})
```

## Limited Executions - Runs N times then stops

```typescript
SyncMoviesJob.start({
  schedule: '*/30 * * * *',     // Every 30 minutes
  limit: 5,                     // Stop after 5 cycles
  maxMovies: 20
})
```

## Time Limited - Runs for N duration then stops

```typescript
SyncMoviesJob.start({
  schedule: '*/10 * * * *',     // Every 10 minutes
  durationMs: 60 * 60 * 1000,   // Stop after 1 hour
  maxMovies: 30
})
```

## Combined - N executions OR N time, whichever comes first

```typescript
SyncMoviesJob.start({
  schedule: '*/5 * * * *',      // Every 5 minutes
  limit: 10,                    // Max 10 cycles
  durationMs: 2 * 60 * 60 * 1000, // Or 2 hours
  maxMovies: 25
})
```

## Boot Only - Only runs on startup, no scheduled execution

```typescript
SyncMoviesJob.start({
  schedule: '0 3 * * *',        // Schedule still required by cron
  maxMovies: 100,
  startOnBoot: true,
  bootIntervalMs: 30000,        // Every 30 seconds
  bootExecutions: 20            // 20 executions on boot
})
```

## Development - Fast sync for testing

```typescript
SyncMoviesJob.start({
  schedule: '*/1 * * * *',      // Every minute
  maxMovies: 5,                 // Only 5 movies per cycle
  limit: 3                      // Stop after 3 cycles
})
```

## Manual Control

```typescript
// Start job
SyncMoviesJob.start(options)

// Stop job manually
SyncMoviesJob.stop()

// Get current status
const status = SyncMoviesJob.getStatus()
console.log(status)
// { isRunning: boolean, executionCount: number, totalProcessed: number, totalErrors: number }
```

## Schedule Format (Cron)

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-7, Sunday = 0 or 7)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)

Examples:
'0 3 * * *'      - Every day at 3:00 AM
'*/30 * * * *'   - Every 30 minutes
'0 */2 * * *'    - Every 2 hours
'0 9-17 * * 1-5' - Every hour from 9am to 5pm, Monday to Friday
'0 0 * * 0'      - Every Sunday at midnight
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| schedule | string | '0 3 * * *' | Cron expression for scheduled execution |
| limit | number | undefined | Maximum number of cycles to run before stopping |
| durationMs | number | undefined | Maximum duration in milliseconds before stopping |
| maxMovies | number | 20 | Maximum movies to sync per cycle |
| startOnBoot | boolean | false | Execute cycles immediately on API startup |
| bootIntervalMs | number | 60000 | Interval between boot executions (ms) |
| bootExecutions | number | 5 | Number of executions to run on boot |
