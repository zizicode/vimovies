import { createHash, randomBytes, createHmac, timingSafeEqual } from 'crypto'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'vimovies-secret-key-change-in-production'
const JWT_ALGORITHM = 'HS256'
const TOKEN_EXPIRATION = '24h' // 24 horas

// Contraseña hardcodeada para admin (NO almacenar en BD)
const HARDCODED_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// ─────────────────────────────────────────────────────────────────────────────
// ENCRIPTACIÓN DE CONTRASEÑAS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encripta una contraseña usando bcrypt-like con PBKDF2
 * NOTA: En este caso, las contraseñas no se almacenan en BD,
 * pero esta función puede ser útil para otros propósitos.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = createHmac('sha256', salt)
    .update(password)
    .digest('hex')
  return `${salt}:${hash}`
}

/**
 * Verifica una contraseña contra un hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':')
  if (!salt || !hash) return false
  
  const computedHash = createHmac('sha256', salt)
    .update(password)
    .digest('hex')
  
  return timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
}

/**
 * Verifica si la contraseña coincide con la hardcodeada
 * Esta es la función principal para autenticación admin
 */
export function verifyHardcodedPassword(password: string): boolean {
  // Comparación segura contra timing attacks
  const expectedHash = createHash('sha256')
    .update(HARDCODED_PASSWORD)
    .digest('hex')
  
  const providedHash = createHash('sha256')
    .update(password)
    .digest('hex')
  
  return timingSafeEqual(Buffer.from(expectedHash), Buffer.from(providedHash))
}

// ─────────────────────────────────────────────────────────────────────────────
// JWT TOKENS
// ─────────────────────────────────────────────────────────────────────────────

export interface JWTPayload {
  sub: string      // user ID
  role: string     // user role
  iat: number      // issued at
  exp: number      // expiration
}

/**
 * Genera un token JWT simple (sin dependencias externas)
 */
export function generateToken(userId: string, role: string = 'admin'): string {
  const header = {
    alg: JWT_ALGORITHM,
    typ: 'JWT'
  }
  
  const now = Math.floor(Date.now() / 1000)
  const payload: JWTPayload = {
    sub: userId,
    role,
    iat: now,
    exp: now + (24 * 60 * 60) // 24 horas
  }
  
  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  const signature = createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
  
  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`
}

/**
 * Verifica y decodifica un token JWT
 * Retorna el payload si es válido, null si es inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.')
    
    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return null
    }
    
    // Verificar firma
    const expectedSignature = createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
    
    const providedSignature = base64UrlDecode(encodedSignature)
    
    if (!timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(providedSignature)
    )) {
      return null
    }
    
    // Decodificar payload
    const payload: JWTPayload = JSON.parse(base64UrlDecode(encodedPayload))
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }
    
    return payload
  } catch (error) {
    return null
  }
}

/**
 * Extrae el token del header Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null
  
  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }
  
  return parts[1] || null
}

// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE PARA HONO
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Middleware para validar token JWT en requests admin
 */
export function createAuthMiddleware(requiredRole: string = 'admin') {
  return async (c: any, next: any) => {
    const authHeader = c.req.header('Authorization')
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return c.json({ error: 'Token no proporcionado' }, 401)
    }
    
    const payload = verifyToken(token)
    
    if (!payload) {
      return c.json({ error: 'Token inválido o expirado' }, 401)
    }
    
    if (payload.role !== requiredRole) {
      return c.json({ error: 'Rol insuficiente' }, 403)
    }
    
    // Agregar userId al contexto
    c.set('userId', payload.sub)
    c.set('userRole', payload.role)
    
    await next()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES BASE64 URL-SAFE
// ─────────────────────────────────────────────────────────────────────────────

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  
  while (base64.length % 4) {
    base64 += '='
  }
  
  return Buffer.from(base64, 'base64').toString()
}
