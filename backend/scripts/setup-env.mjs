/**
 * Creates `backend/.env` from `backend/.env.example` when it does not exist yet.
 *
 * Run automatically by `npm run setup`, so a fresh clone becomes runnable
 * without the developer having to remember to copy the file by hand.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(backendRoot, '.env');
const examplePath = resolve(backendRoot, '.env.example');

if (existsSync(envPath)) {
  console.log('[setup] backend/.env already exists - leaving it untouched.');
} else if (!existsSync(examplePath)) {
  console.error('[setup] backend/.env.example is missing. Cannot create .env.');
  process.exit(1);
} else {
  copyFileSync(examplePath, envPath);
  console.log('[setup] Created backend/.env from .env.example.');
  console.log('[setup] Remember to change JWT_SECRET before deploying anywhere real.');
}
