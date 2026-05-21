# Socket.IO - Canal Job

## Instalación de dependencias

```bash
npm install socket.io
npm install --save-dev @types/socket.io
```

## Estructura

- `index.ts` - Configuración principal de Socket.IO
- `auth.middleware.ts` - Middleware para autenticación de admin
- `job.handler.ts` - Manejador del canal `/job` (solo admins)

## Uso del Canal Job (Admin)

El canal `/job` está protegido y solo permite conexiones de usuarios admin.

### Conectar desde el cliente (Dashboard)

```typescript
import { io } from 'socket.io-client'

const socket = io(`${API_URL}/job`, {
  auth: {
    token: userToken, // Token de autenticación de Supabase
  },
  transports: ['websocket'],
})

// Evento de conexión exitosa
socket.on('connected', (data) => {
  console.log('Connected to job channel:', data)
})

// Recibir actualizaciones de progreso
socket.on('job:progress', (data) => {
  console.log('Job progress:', data)
  // { jobId, progress, message, timestamp }
})

// Recibir actualizaciones de estado
socket.on('job:status', (data) => {
  console.log('Job status:', data)
  // { jobId, status, timestamp }
})

// Recibir errores
socket.on('job:error', (data) => {
  console.error('Job error:', data)
  // { jobId, error, timestamp }
})

// Recibir confirmación de inicio
socket.on('job:started', (data) => {
  console.log('Job started:', data)
  // { jobId, type, params, timestamp }
})

// Recibir confirmación de detención
socket.on('job:stopped', (data) => {
  console.log('Job stopped:', data)
  // { jobId, timestamp }
})

// Iniciar un job
socket.emit('job:start', {
  type: 'sync-movies',
  params: {
    maxMovies: 50,
  },
})

// Enviar progreso (desde el cliente o desde el server)
socket.emit('job:progress', {
  jobId: 'job_123',
  progress: 50,
  message: 'Processing...',
})

// Detener un job
socket.emit('job:stop', {
  jobId: 'job_123',
})

// Desconectar
socket.disconnect()
```

## Emitir eventos desde el servidor (Jobs/Servicios)

Para emitir eventos al canal job desde cualquier parte del backend:

```typescript
import { getSocketIO, emitJobEvent } from './socket'

// Opción 1: Usar el helper
emitJobEvent(getSocketIO()!, 'job:progress', {
  jobId: 'job_123',
  progress: 75,
  message: 'Almost done...',
})

// Opción 2: Usar directamente la instancia
const io = getSocketIO()
if (io) {
  io.of('/job').to('job-general').emit('job:progress', {
    jobId: 'job_123',
    progress: 75,
    message: 'Almost done...',
    timestamp: new Date().toISOString(),
  })
}
```

## Eventos del Canal Job

### Emitidos por el Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `job:start` | `{ type, params }` | Iniciar un nuevo job |
| `job:progress` | `{ jobId, progress, message }` | Enviar progreso de un job |
| `job:status` | `{ jobId, status }` | Enviar estado de un job |
| `job:error` | `{ jobId, error }` | Enviar error de un job |
| `job:stop` | `{ jobId }` | Detener un job |

### Recibidos por el Cliente

| Evento | Payload | Descripción |
|--------|---------|-------------|
| `connected` | `{ message, channel, timestamp }` | Conexión exitosa |
| `job:progress` | `{ jobId, progress, message, timestamp }` | Actualización de progreso |
| `job:status` | `{ jobId, status, timestamp }` | Actualización de estado |
| `job:error` | `{ jobId, error, timestamp }` | Error en job |
| `job:started` | `{ jobId, type, params, timestamp }` | Job iniciado |
| `job:stopped` | `{ jobId, timestamp }` | Job detenido |

## Autenticación

El canal `/job` requiere autenticación. El cliente debe enviar un token en el handshake:

```typescript
const socket = io(`${API_URL}/job`, {
  auth: {
    token: userToken,
  },
})
```

El token se verifica en `auth.middleware.ts`. Actualmente está en modo desarrollo (permite cualquier token). Para producción, descomentar la verificación de Supabase en el middleware.

## Configuración CORS

Socket.IO está configurado para aceptar conexiones desde:
- `process.env.WEB_URL`
- `process.env.DASHBOARD_URL`

Puedes ajustar esto en `socket/index.ts`.
