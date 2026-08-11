import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load `backend/.env` regardless of the directory the process was started from.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Environment contract. The process refuses to boot with an invalid
 * configuration rather than failing later with a confusing runtime error.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`\nInvalid environment configuration:\n${issues}\n`);
  console.error('Copy backend/.env.example to backend/.env and fill in the values.\n');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  /** CORS accepts a comma-separated list so several origins can be allowed. */
  allowedOrigins: raw.CLIENT_URL.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
} as const;

export type Env = typeof env;
