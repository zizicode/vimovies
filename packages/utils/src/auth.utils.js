"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.verifyHardcodedPassword = verifyHardcodedPassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.extractTokenFromHeader = extractTokenFromHeader;
exports.createAuthMiddleware = createAuthMiddleware;
var crypto_1 = require("crypto");
// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────
var JWT_SECRET = process.env.JWT_SECRET || 'vimovies-secret-key-change-in-production';
var JWT_ALGORITHM = 'HS256';
var TOKEN_EXPIRATION = '24h'; // 24 horas
// Contraseña hardcodeada para admin (NO almacenar en BD)
var HARDCODED_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
// ─────────────────────────────────────────────────────────────────────────────
// ENCRIPTACIÓN DE CONTRASEÑAS
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Encripta una contraseña usando bcrypt-like con PBKDF2
 * NOTA: En este caso, las contraseñas no se almacenan en BD,
 * pero esta función puede ser útil para otros propósitos.
 */
function hashPassword(password) {
    var salt = (0, crypto_1.randomBytes)(16).toString('hex');
    var hash = (0, crypto_1.createHmac)('sha256', salt)
        .update(password)
        .digest('hex');
    return "".concat(salt, ":").concat(hash);
}
/**
 * Verifica una contraseña contra un hash
 */
function verifyPassword(password, hashedPassword) {
    var _a = hashedPassword.split(':'), salt = _a[0], hash = _a[1];
    if (!salt || !hash)
        return false;
    var computedHash = (0, crypto_1.createHmac)('sha256', salt)
        .update(password)
        .digest('hex');
    return (0, crypto_1.timingSafeEqual)(Buffer.from(hash), Buffer.from(computedHash));
}
/**
 * Verifica si la contraseña coincide con la hardcodeada
 * Esta es la función principal para autenticación admin
 */
function verifyHardcodedPassword(password) {
    // Comparación segura contra timing attacks
    var expectedHash = (0, crypto_1.createHash)('sha256')
        .update(HARDCODED_PASSWORD)
        .digest('hex');
    var providedHash = (0, crypto_1.createHash)('sha256')
        .update(password)
        .digest('hex');
    return (0, crypto_1.timingSafeEqual)(Buffer.from(expectedHash), Buffer.from(providedHash));
}
/**
 * Genera un token JWT simple (sin dependencias externas)
 */
function generateToken(userId, role) {
    if (role === void 0) { role = 'admin'; }
    var header = {
        alg: JWT_ALGORITHM,
        typ: 'JWT'
    };
    var now = Math.floor(Date.now() / 1000);
    var payload = {
        sub: userId,
        role: role,
        iat: now,
        exp: now + (24 * 60 * 60) // 24 horas
    };
    var encodedHeader = base64UrlEncode(JSON.stringify(header));
    var encodedPayload = base64UrlEncode(JSON.stringify(payload));
    var signature = (0, crypto_1.createHmac)('sha256', JWT_SECRET)
        .update("".concat(encodedHeader, ".").concat(encodedPayload))
        .digest('base64');
    return "".concat(encodedHeader, ".").concat(encodedPayload, ".").concat(base64UrlEncode(signature));
}
/**
 * Verifica y decodifica un token JWT
 * Retorna el payload si es válido, null si es inválido
 */
function verifyToken(token) {
    try {
        var _a = token.split('.'), encodedHeader = _a[0], encodedPayload = _a[1], encodedSignature = _a[2];
        if (!encodedHeader || !encodedPayload || !encodedSignature) {
            return null;
        }
        // Verificar firma
        var expectedSignature = (0, crypto_1.createHmac)('sha256', JWT_SECRET)
            .update("".concat(encodedHeader, ".").concat(encodedPayload))
            .digest('base64');
        var providedSignature = base64UrlDecode(encodedSignature);
        if (!(0, crypto_1.timingSafeEqual)(Buffer.from(expectedSignature), Buffer.from(providedSignature))) {
            return null;
        }
        // Decodificar payload
        var payload = JSON.parse(base64UrlDecode(encodedPayload));
        // Verificar expiración
        var now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
            return null;
        }
        return payload;
    }
    catch (error) {
        return null;
    }
}
/**
 * Extrae el token del header Authorization
 */
function extractTokenFromHeader(authHeader) {
    if (!authHeader)
        return null;
    var parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1] || null;
}
// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE PARA HONO
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Middleware para validar token JWT en requests admin
 */
function createAuthMiddleware(requiredRole) {
    var _this = this;
    if (requiredRole === void 0) { requiredRole = 'admin'; }
    return function (c, next) { return __awaiter(_this, void 0, void 0, function () {
        var authHeader, token, payload;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authHeader = c.req.header('Authorization');
                    token = extractTokenFromHeader(authHeader);
                    if (!token) {
                        return [2 /*return*/, c.json({ error: 'Token no proporcionado' }, 401)];
                    }
                    payload = verifyToken(token);
                    if (!payload) {
                        return [2 /*return*/, c.json({ error: 'Token inválido o expirado' }, 401)];
                    }
                    if (payload.role !== requiredRole) {
                        return [2 /*return*/, c.json({ error: 'Rol insuficiente' }, 403)];
                    }
                    // Agregar userId al contexto
                    c.set('userId', payload.sub);
                    c.set('userRole', payload.role);
                    return [4 /*yield*/, next()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); };
}
// ─────────────────────────────────────────────────────────────────────────────
// UTILIDADES BASE64 URL-SAFE
// ─────────────────────────────────────────────────────────────────────────────
function base64UrlEncode(str) {
    return Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}
function base64UrlDecode(str) {
    var base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
        base64 += '=';
    }
    return Buffer.from(base64, 'base64').toString();
}
