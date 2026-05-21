// apps/api/src/index.ts
import { serve } from '@hono/node-server'
import { app } from './app.js'
import { env } from '@vimovies/utils'
import { initializeSocket } from './socket/index.js'
// import { SyncMoviesJob } from './job/sync-movies.job.js'

const port = env.PORT

// Crear servidor con Hono y obtener la instancia HTTP
const server = serve({
  fetch: app.fetch,
  port: Number(port),
})

// Inicializar Socket.IO con el servidor HTTP de Hono
initializeSocket(server as any)

console.log(`[API] Running on http://localhost:${port}/api`)
console.log(`[Socket] Socket.IO ready`)

// SyncMoviesJob.start({
//   schedule: '0 3 * * *',        // Todos los días a las 3am
//   maxMovies: 1,                // 50 películas por ciclo
//   startOnBoot: true,            // Ejecutar al arrancar
//   bootIntervalMs: 60000,        // Cada 60 segundos
//   bootExecutions: 1            // 10 ejecuciones al arranque
// })