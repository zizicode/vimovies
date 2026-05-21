import { Socket } from 'socket.io'
import { verifyToken } from '@vimovies/utils'

/**
 * Middleware para verificar que el usuario es admin antes de unirse al canal 'job'
 */
export async function adminAuthMiddleware(socket: Socket, next: (err?: Error) => void) {
  try {
    // Obtener el token de autenticación del handshake
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error('Authentication token required'))
    }

    // Verificar el token JWT usando el validador de @vimovies/utils
    const payload = verifyToken(token)

    if (!payload) {
      return next(new Error('Invalid or expired token'))
    }

    // Verificar que el usuario es admin
    if (payload.role !== 'admin') {
      return next(new Error('Admin access required'))
    }

    // Agregar información del usuario al socket
    socket.data.userId = payload.sub
    socket.data.userRole = payload.role

    next()
  } catch (error) {
    next(new Error('Authentication failed'))
  }
}
