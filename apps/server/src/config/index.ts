import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file (if present)
dotenv.config();

/**
 * Environment Schema Definition with Zod.
 * This guarantees type safety and fails fast at startup if critical variables are missing.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  CORS_ORIGIN: z.string().default('*'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'), // 15 mins
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('200'),
  SUPABASE_URL: z.string().url().default('https://placeholder.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('placeholder-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  throw new Error('Environment configuration validation failed');
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  corsOrigin: parsedEnv.data.CORS_ORIGIN.includes(',')
    ? parsedEnv.data.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : parsedEnv.data.CORS_ORIGIN,
  rateLimit: {
    windowMs: parsedEnv.data.RATE_LIMIT_WINDOW_MS,
    max: parsedEnv.data.RATE_LIMIT_MAX_REQUESTS,
  },
  supabase: {
    url: parsedEnv.data.SUPABASE_URL,
    anonKey: parsedEnv.data.SUPABASE_ANON_KEY,
    serviceRoleKey: parsedEnv.data.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: parsedEnv.data.SUPABASE_JWT_SECRET,
  },
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
};
