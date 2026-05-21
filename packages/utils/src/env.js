"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
var dotenv_1 = require("dotenv");
var zod_1 = require("zod");
var path_1 = require("path");
// Only load .env in Node.js environment (server-side)
var isServer = typeof globalThis.window === 'undefined';
if (isServer) {
    // Load .env from multiple possible locations
    var possiblePaths = [
        (0, path_1.resolve)(process.cwd(), '.env'),
        (0, path_1.resolve)(process.cwd(), 'apps/api/.env'),
        (0, path_1.resolve)(process.cwd(), '../.env'),
        (0, path_1.resolve)(process.cwd(), '../apps/api/.env'),
    ];
    for (var _i = 0, possiblePaths_1 = possiblePaths; _i < possiblePaths_1.length; _i++) {
        var path = possiblePaths_1[_i];
        var result = (0, dotenv_1.config)({ path: path });
        if (!result.error) {
            break;
        }
    }
}
var envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3001),
    SUPABASE_URL: zod_1.z.string().url().default('https://nadwnngiahknfwfbppqt.supabase.co'),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1),
    TMDB_API_KEY: zod_1.z.string().min(1),
    TMDB_BASE_URL: zod_1.z.string().url().default('https://api.themoviedb.org/3'),
    WEB_URL: zod_1.z.string().url().default('http://localhost:5173'),
    DASHBOARD_URL: zod_1.z.string().url().default('http://localhost:5174'),
    SUPABASE_JWT_SECRET: zod_1.z.string().min(1).default('Development_8825'),
}).passthrough();
var parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Variables de entorno inválidas:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
}
exports.env = parsed.data;
