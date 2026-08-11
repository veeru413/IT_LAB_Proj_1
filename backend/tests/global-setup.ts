import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const TEST_DB_FILE = 'test.db';

/**
 * Runs once before the whole suite.
 *
 * Builds a dedicated `prisma/test.db` by applying the committed migrations, so
 * tests never touch the developer's `dev.db`. Any stale test database from a
 * previous run is removed first - it is a disposable, git-ignored artefact
 * owned entirely by this harness.
 */
export default function globalSetup(): void {
  const backendRoot = resolve(__dirname, '..');
  const prismaDir = resolve(backendRoot, 'prisma');

  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = `file:./${TEST_DB_FILE}`;
  process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';

  // Guard: only ever delete files whose name is exactly `test.db*`.
  for (const suffix of ['', '-journal', '-wal', '-shm']) {
    const file = resolve(prismaDir, `${TEST_DB_FILE}${suffix}`);
    if (existsSync(file) && resolve(file).endsWith(`${TEST_DB_FILE}${suffix}`)) {
      rmSync(file, { force: true });
    }
  }

  // `migrate deploy` is non-destructive: it applies the committed migrations
  // to the freshly created, empty test database.
  execSync('npx prisma migrate deploy', {
    cwd: backendRoot,
    stdio: 'pipe',
    env: { ...process.env, DATABASE_URL: `file:./${TEST_DB_FILE}` },
  });
}
