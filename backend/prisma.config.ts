import path from 'node:path';
import dotenv from 'dotenv';
import { defineConfig } from 'prisma/config';

/**
 * Prisma CLI configuration.
 *
 * Replaces the deprecated `package.json#prisma` block. When a config file is
 * present the CLI no longer loads `.env` automatically, so we do it here -
 * this is what makes `DATABASE_URL` available to `migrate` / `db seed`.
 */
dotenv.config({ path: path.join(__dirname, '.env') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
    seed: 'tsx prisma/seed.ts',
  },
});
