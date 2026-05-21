import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.number().default(3000),
  SUPABASE_URL: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  TMDB_API_KEY: z.string(),
  TMDB_BASE_URL: z.string().default('https://api.themoviedb.org/3'),
  WEB_URL: z.string().default('http://localhost:3000'),
  DASHBOARD_URL: z.string().default('http://localhost:3001'),
  SUPABASE_JWT_SECRET: z.string().default(''),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  TMDB_API_KEY: process.env.TMDB_API_KEY,
  TMDB_BASE_URL: process.env.TMDB_BASE_URL,
  WEB_URL: process.env.WEB_URL,
  DASHBOARD_URL: process.env.DASHBOARD_URL,
  SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET,
});
