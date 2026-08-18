import type { Prisma, User } from '@prisma/client';
import { prisma } from '../config/prisma';

/**
 * All database access for the `users` table.
 *
 * Keeping Prisma calls here means the service layer never talks to the ORM
 * directly, and swapping the persistence layer would touch only this file.
 */

export const findUserById = (id: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { id } });

export const findUserByEmail = (email: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { email } });

export const findUserByStudentId = (studentId: string): Promise<User | null> =>
  prisma.user.findUnique({ where: { studentId } });

export const createUser = (data: Prisma.UserCreateInput): Promise<User> =>
  prisma.user.create({ data });

/** All STUDENT accounts, optionally narrowed by a name/email/roll-number search. */
export const findAllStudents = (search?: string): Promise<User[]> => {
  const where: Prisma.UserWhereInput = { role: 'STUDENT' };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { email: { contains: search } },
      { studentId: { contains: search } },
    ];
  }

  return prisma.user.findMany({ where, orderBy: { name: 'asc' } });
};

/** Ids only - used when an admin assigns one assignment to the whole class. */
export const findAllStudentIds = async (): Promise<string[]> => {
  const rows = await prisma.user.findMany({
    where: { role: 'STUDENT' },
    select: { id: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map((row) => row.id);
};

/** Verifies that every supplied id belongs to an existing STUDENT account. */
export const findStudentsByIds = (ids: string[]): Promise<User[]> =>
  prisma.user.findMany({ where: { id: { in: ids }, role: 'STUDENT' } });

export const countStudents = (): Promise<number> => prisma.user.count({ where: { role: 'STUDENT' } });

export const countExaminers = (): Promise<number> =>
  prisma.user.count({ where: { role: 'EXAMINER' } });
