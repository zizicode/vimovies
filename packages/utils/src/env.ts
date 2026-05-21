import { config } from 'dotenv'
import { z } from 'zod'
import { resolve } from 'path'

// Only load .env in Node.js environment (server-side)
const isServer = typeof (globalThis as unknown as { window?: unknown }).window === 'undefined'

if (isServer) {
  // Load .env from multiple possible locations
  const possiblePaths = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../apps/api/.env'),
  ]

  for (const path of possiblePaths) {
    const result = config({ path })
    if (!result.error) {
      break
    }
  }

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
  console.error('❌ Variables de entorno inválidas:')
  console.error(parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
