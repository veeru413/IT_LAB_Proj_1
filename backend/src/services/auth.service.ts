import * as userRepository from '../repositories/user.repository';
import { ApiError } from '../utils/ApiError';
import { hashPassword, verifyPassword } from '../utils/password';
import { signAccessToken } from '../utils/jwt';
import { toUserDTO, type UserDTO } from '../utils/user';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';
import type { Role } from '../types/domain';

export interface AuthResult {
  user: UserDTO;
  token: string;
}

const issueToken = (user: { id: string; email: string; role: string }): string =>
  signAccessToken({ sub: user.id, email: user.email, role: user.role as Role });

/**
 * Registers a new STUDENT account.
 *
 * Self-registration can never create an admin - the role is hard-coded here,
 * so a crafted request body cannot escalate privileges.
 */
export const register = async (input: RegisterInput): Promise<AuthResult> => {
  const [existingEmail, existingStudentId] = await Promise.all([
    userRepository.findUserByEmail(input.email),
    userRepository.findUserByStudentId(input.studentId),
  ]);

  if (existingEmail) {
    throw ApiError.conflict('An account with this email already exists');
  }

  if (existingStudentId) {
    throw ApiError.conflict('An account with this student ID already exists');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await userRepository.createUser({
    name: input.name,
    email: input.email,
    studentId: input.studentId,
    passwordHash,
    role: 'STUDENT',
  });

  return { user: toUserDTO(user), token: issueToken(user) };
};

/**
 * Authenticates an existing account.
 *
 * A missing account and a wrong password intentionally produce the same
 * message so the endpoint cannot be used to enumerate registered emails.
 */
export const login = async (input: LoginInput): Promise<AuthResult> => {
  const user = await userRepository.findUserByEmail(input.email);

  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { user: toUserDTO(user), token: issueToken(user) };
};

/** Resolves the current user for `GET /api/auth/me`. */
export const getProfile = async (userId: string): Promise<UserDTO> => {
  const user = await userRepository.findUserById(userId);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return toUserDTO(user);
};
