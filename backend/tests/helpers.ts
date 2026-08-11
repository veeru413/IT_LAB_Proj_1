import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { hashPassword } from '../src/utils/password';

export const app: Express = createApp();
export const api = () => request(app);

/** Empties both tables. Tasks first because of the foreign key. */
export const resetDatabase = async (): Promise<void> => {
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
};

export interface TestUser {
  id: string;
  email: string;
  password: string;
  token: string;
}

const DEFAULT_PASSWORD = 'Password123';

/** Creates a user directly in the DB and logs in to obtain a real JWT. */
export const createTestUser = async (options: {
  email: string;
  name?: string;
  studentId?: string | null;
  role?: 'STUDENT' | 'ADMIN';
  password?: string;
}): Promise<TestUser> => {
  const password = options.password ?? DEFAULT_PASSWORD;

  const user = await prisma.user.create({
    data: {
      name: options.name ?? 'Test User',
      email: options.email,
      studentId: options.studentId === undefined ? `ID-${Date.now()}-${Math.random()}` : options.studentId,
      passwordHash: await hashPassword(password),
      role: options.role ?? 'STUDENT',
    },
  });

  const response = await api().post('/api/auth/login').send({ email: options.email, password });

  return { id: user.id, email: user.email, password, token: response.body.data.token };
};

export const createStudent = (email: string, studentId: string): Promise<TestUser> =>
  createTestUser({ email, studentId, role: 'STUDENT', name: `Student ${studentId}` });

export const createAdmin = (email = 'admin@test.local'): Promise<TestUser> =>
  createTestUser({ email, studentId: null, role: 'ADMIN', name: 'Test Admin' });

/** Creates a task owned by `studentId`. */
export const createTaskFor = async (
  studentId: string,
  overrides: Partial<{
    title: string;
    description: string;
    subject: string;
    priority: string;
    status: string;
    dueDate: Date;
    createdBy: string;
  }> = {},
) =>
  prisma.task.create({
    data: {
      title: overrides.title ?? 'Sample Assignment',
      description: overrides.description ?? 'A task created for testing.',
      subject: overrides.subject ?? 'DBMS',
      priority: overrides.priority ?? 'MEDIUM',
      status: overrides.status ?? 'PENDING',
      dueDate: overrides.dueDate ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      studentId,
      createdBy: overrides.createdBy ?? studentId,
    },
  });

export const bearer = (token: string): string => `Bearer ${token}`;

export const daysFromNow = (days: number): Date =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);
