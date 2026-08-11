import type { User } from '@prisma/client';
import type { Role } from '../types/domain';

/** Public user shape. `passwordHash` is deliberately absent. */
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/**
 * Strips the password hash before a user record ever leaves the API.
 * Every endpoint that returns a user goes through this function.
 */
export const toUserDTO = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
  email: user.email,
  studentId: user.studentId,
  role: user.role as Role,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});
