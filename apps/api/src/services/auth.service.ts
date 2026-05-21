import { verifyHardcodedPassword, generateToken, verifyToken, type JWTPayload } from '@vimovies/utils'

// ─────────────────────────────────────────────────────────────────────────────
// INPUT TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminLoginInput {
  password: string
}

export interface LoginResult {
  token: string
  user: {
    id: string
    role: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const AuthService = {
  /**
   * Autentica un usuario admin usando contraseña hardcodeada
   * Retorna un token JWT y datos del usuario si la contraseña es correcta
   */
  async adminLogin(input: AdminLoginInput): Promise<LoginResult | null> {
    const { password } = input

    if (!verifyHardcodedPassword(password)) {
      return null
    }

    // Generar token con un userId fijo para admin
    const adminUserId = '00000000-0000-0000-0000-000000000000'
    const token = generateToken(adminUserId, 'admin')

    return {
      token,
      user: {
        id: adminUserId,
        role: 'admin',
      },
    }
  },

  /**
   * Verifica un token JWT y retorna el payload
   */
  verifyAccessToken(token: string): JWTPayload | null {
    return verifyToken(token)
  },
}
