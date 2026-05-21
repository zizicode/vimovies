import type { Context } from 'hono'
import { AuthService } from '../services/auth.service.js'
import {
  ok,
  fail,
  serverError,
} from '@vimovies/utils'

interface AdminLoginBody {
  password: string
}

export const AuthController = {
  /**
   * Login de administrador
   * POST /auth/admin/login
   */
  async adminLogin(c: Context) {
    try {
      const parsedBody = c.get('parsedBody') as Record<string, string> | undefined
      const body = (parsedBody || await c.req.json()) as AdminLoginBody
      const { password } = body

      if (!password) {
        return fail(c, 'Contraseña requerida', 400)
      }

      const result = await AuthService.adminLogin({ password })

      if (!result) {
        return fail(c, 'Credenciales inválidas', 401)
      }

      return ok(c, result)
    } catch (err) {
      return serverError(c, err)
    }
  },

  /**
   * Verificar token actual
   * GET /auth/verify
   */
  async verifyToken(c: Context) {
    try {
      const authHeader = c.req.header('Authorization')
      
      if (!authHeader) {
        return fail(c, 'Token no proporcionado', 401)
      }

      const parts = authHeader.split(' ')
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return fail(c, 'Formato de token inválido', 401)
      }

      const token = parts[1] || ''
      const payload = AuthService.verifyAccessToken(token)

      if (!payload) {
        return fail(c, 'Token inválido o expirado', 401)
      }

      return ok(c, {
        valid: true,
        user: {
          id: payload.sub,
          role: payload.role,
        },
      })
    } catch (err) {
      return serverError(c, err)
    }
  },
}
