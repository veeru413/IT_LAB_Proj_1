/**
 * Per-worker setup.
 *
 * Environment variables must be assigned before any module imports
 * `src/config/env`, which is why this file only sets values and does not
 * import application code.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'file:./test.db';
process.env.JWT_SECRET = 'test-secret-key-for-integration-tests';
process.env.JWT_EXPIRES_IN = '1h';
process.env.BCRYPT_SALT_ROUNDS = '4'; // fast hashing keeps the suite quick
process.env.CLIENT_URL = 'http://localhost:5173';
