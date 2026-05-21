import { z } from 'zod';
export declare const env: z.objectOutputType<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    SUPABASE_URL: z.ZodDefault<z.ZodString>;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    TMDB_API_KEY: z.ZodString;
    TMDB_BASE_URL: z.ZodDefault<z.ZodString>;
    WEB_URL: z.ZodDefault<z.ZodString>;
    DASHBOARD_URL: z.ZodDefault<z.ZodString>;
    SUPABASE_JWT_SECRET: z.ZodDefault<z.ZodString>;
}, z.ZodTypeAny, "passthrough">;
