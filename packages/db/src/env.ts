// env.ts
import { config } from 'dotenv'
import { z } from 'zod'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env from multiple possible locations
const possiblePaths = [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), 'apps/api/.env'),
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../../apps/api/.env'),
]

let loaded = false
for (const path of possiblePaths) {
  const result = config({ path })
  if (result.error) {
    console.log(`[Env] Trying: ${path} - not found`)
    continue
  }
  console.log(`[Env] Loaded .env from: ${path}`)
  loaded = true
  break
}

if (!loaded) {
  console.warn('[Env] No .env file found, using process.env')
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),

  SUPABASE_URL: z.string().url().default('https://nadwnngiahknfwfbppqt.supabase.co'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  TMDB_API_KEY: z.string().min(1),
  TMDB_BASE_URL: z.string().url().default('https://api.themoviedb.org/3'),

  WEB_URL: z.string().url().default('http://localhost:5173'),
  DASHBOARD_URL: z.string().url().default('http://localhost:5174'),

  SUPABASE_JWT_SECRET: z.string().min(1).default('Development_8825'),
}).passthrough()

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas o faltantes:')
  console.error(parsed.error.flatten().fieldErrors)
  console.error('Check required vars:', {
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    TMDB_API_KEY: !!process.env.TMDB_API_KEY,
  })
  process.exit(1)
}

console.log('[Env] Environment variables loaded successfully')
export const env = parsed.data