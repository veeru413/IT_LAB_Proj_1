import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createStudent, resetDatabase } from './helpers';
import { prisma } from '../src/config/prisma';

const validRegistration = {
  name: 'Veerendra Patil',
  studentId: 'CS21B099',
  email: 'veerendra@college.local',
  password: 'Secure123',
  confirmPassword: 'Secure123',
};

describe('Authentication', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new student and returns a token', async () => {
      const response = await api().post('/api/auth/register').send(validRegistration);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('veerendra@college.local');
      expect(response.body.data.user.role).toBe('STUDENT');
      expect(typeof response.body.data.token).toBe('string');
    });

    it('stores the password as a bcrypt hash, never as plaintext', async () => {
      await api().post('/api/auth/register').send(validRegistration);

      const user = await prisma.user.findUnique({ where: { email: validRegistration.email } });

      expect(user).not.toBeNull();
      expect(user?.passwordHash).not.toBe(validRegistration.password);
      expect(user?.passwordHash).toMatch(/^\$2[aby]\$/); // bcrypt signature
    });

    it('never returns the password hash to the client', async () => {
      const response = await api().post('/api/auth/register').send(validRegistration);

      expect(response.body.data.user).not.toHaveProperty('passwordHash');
      expect(JSON.stringify(response.body)).not.toContain(validRegistration.password);
    });

    it('rejects a mismatched password confirmation', async () => {
      const response = await api()
        .post('/api/auth/register')
        .send({ ...validRegistration, confirmPassword: 'Different123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toHaveProperty('confirmPassword');
    });

    it('rejects an invalid email and a weak password', async () => {
      const response = await api()
        .post('/api/auth/register')
        .send({ ...validRegistration, email: 'not-an-email', password: 'abc', confirmPassword: 'abc' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty('email');
      expect(response.body.errors).toHaveProperty('password');
    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      await api().post('/api/auth/register').send(validRegistration);

      const response = await api()
        .post('/api/auth/register')
        .send({ ...validRegistration, studentId: 'CS21B100' });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/email/i);
    });

    it('rejects a duplicate student ID with 409 Conflict', async () => {
      await api().post('/api/auth/register').send(validRegistration);

      const response = await api()
        .post('/api/auth/register')
        .send({ ...validRegistration, email: 'someone.else@college.local' });

      expect(response.status).toBe(409);
      expect(response.body.message).toMatch(/student id/i);
    });

    it('cannot be used to self-register an ADMIN account', async () => {
      const response = await api()
        .post('/api/auth/register')
        .send({ ...validRegistration, role: 'ADMIN' });

      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('STUDENT');
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      await api().post('/api/auth/register').send(validRegistration);

      const response = await api()
        .post('/api/auth/login')
        .send({ email: validRegistration.email, password: validRegistration.password });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeTruthy();
      expect(response.body.data.user.name).toBe('Veerendra Patil');
    });

    it('rejects an invalid password with 401', async () => {
      await api().post('/api/auth/register').send(validRegistration);

      const response = await api()
        .post('/api/auth/login')
        .send({ email: validRegistration.email, password: 'WrongPassword1' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });

    it('rejects a non-existent account with the same generic message', async () => {
      const response = await api()
        .post('/api/auth/login')
        .send({ email: 'ghost@college.local', password: 'Secure123' });

      expect(response.status).toBe(401);
      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const student = await createStudent('me@college.local', 'CS21B010');

      const response = await api().get('/api/auth/me').set('Authorization', bearer(student.token));

      expect(response.status).toBe(200);
      expect(response.body.data.user.id).toBe(student.id);
    });

    it('returns 401 when no token is supplied', async () => {
      const response = await api().get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('returns 401 for a tampered token', async () => {
      const student = await createStudent('tamper@college.local', 'CS21B011');

      const response = await api()
        .get('/api/auth/me')
        .set('Authorization', bearer(`${student.token}x`));

      expect(response.status).toBe(401);
    });

    it('returns 401 once the account has been deleted', async () => {
      const student = await createStudent('deleted@college.local', 'CS21B012');
      await prisma.user.delete({ where: { id: student.id } });

      const response = await api().get('/api/auth/me').set('Authorization', bearer(student.token));

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('acknowledges logout for an authenticated user', async () => {
      const student = await createStudent('bye@college.local', 'CS21B013');

      const response = await api()
        .post('/api/auth/logout')
        .set('Authorization', bearer(student.token));

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
