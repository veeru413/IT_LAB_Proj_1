import bcrypt from 'bcryptjs';
import { env } from '../config/env';

/**
 * Password hashing helpers.
 *
 * bcrypt automatically generates and embeds a per-password salt, so two users
 * with the same password still produce different hashes. Plaintext passwords
 * are never written to the database or logged.
 */

export const hashPassword = async (plainPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
};

export const verifyPassword = async (
  plainPassword: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(plainPassword, passwordHash);
