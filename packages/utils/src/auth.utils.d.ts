/**
 * Encripta una contraseña usando bcrypt-like con PBKDF2
 * NOTA: En este caso, las contraseñas no se almacenan en BD,
 * pero esta función puede ser útil para otros propósitos.
 */
export declare function hashPassword(password: string): string;
/**
 * Verifica una contraseña contra un hash
 */
export declare function verifyPassword(password: string, hashedPassword: string): boolean;
/**
 * Verifica si la contraseña coincide con la hardcodeada
 * Esta es la función principal para autenticación admin
 */
export declare function verifyHardcodedPassword(password: string): boolean;
export interface JWTPayload {
    sub: string;
    role: string;
    iat: number;
    exp: number;
}
/**
 * Genera un token JWT simple (sin dependencias externas)
 */
export declare function generateToken(userId: string, role?: string): string;
/**
 * Verifica y decodifica un token JWT
 * Retorna el payload si es válido, null si es inválido
 */
export declare function verifyToken(token: string): JWTPayload | null;
/**
 * Extrae el token del header Authorization
 */
export declare function extractTokenFromHeader(authHeader: string | null): string | null;
/**
 * Middleware para validar token JWT en requests admin
 */
export declare function createAuthMiddleware(requiredRole?: string): (c: any, next: any) => Promise<any>;
