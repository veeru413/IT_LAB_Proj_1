/**
 * The security-critical suite: proves that authorisation is enforced by the
 * API itself, not by hiding buttons in React.
 */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createAdmin, createStudent, createTaskFor, resetDatabase, type TestUser } from './helpers';
import { prisma } from '../src/config/prisma';

describe('Authorization', () => {
  let alice: TestUser;
  let bob: TestUser;
  let admin: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    alice = await createStudent('alice@college.local', 'CS21B030');
    bob = await createStudent('bob@college.local', 'CS21B031');
    admin = await createAdmin('prof@college.local');
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  describe('Students cannot reach admin endpoints', () => {
    const adminGetRoutes = ['/api/admin/students', '/api/admin/tasks', '/api/admin/statistics'];

    it.each(adminGetRoutes)('GET %s returns 403 for a student', async (route) => {
      const response = await api().get(route).set('Authorization', bearer(alice.token));

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('POST /api/admin/tasks returns 403 for a student', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(alice.token))
        .send({
          title: 'Sneaky assignment',
          subject: 'DBMS',
          dueDate: '2026-12-01',
          priority: 'HIGH',
          assignTo: 'ALL',
        });

      expect(response.status).toBe(403);
    });

    it('GET /api/admin/students/:id returns 403 for a student', async () => {
      const response = await api()
        .get(`/api/admin/students/${bob.id}`)
        .set('Authorization', bearer(alice.token));

      expect(response.status).toBe(403);
    });

    it('returns 401 (not 403) when no token is supplied at all', async () => {
      const response = await api().get('/api/admin/students');
      expect(response.status).toBe(401);
    });

    it('allows the admin through the same routes', async () => {
      const response = await api()
        .get('/api/admin/students')
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
    });
  });

  describe('Students cannot touch another student’s task', () => {
    it('cannot read it', async () => {
      const task = await createTaskFor(bob.id, { title: "Bob's homework" });

      const response = await api()
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(alice.token));

      expect(response.status).toBe(403);
    });

    it('cannot update it', async () => {
      const task = await createTaskFor(bob.id);

      const response = await api()
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(alice.token))
        .send({ title: 'Hijacked' });

      expect(response.status).toBe(403);
      const unchanged = await prisma.task.findUnique({ where: { id: task.id } });
      expect(unchanged?.title).toBe('Sample Assignment');
    });

    it('cannot change its status', async () => {
      const task = await createTaskFor(bob.id);

      const response = await api()
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', bearer(alice.token))
        .send({ status: 'COMPLETED' });

      expect(response.status).toBe(403);
    });

    it('cannot delete it', async () => {
      const task = await createTaskFor(bob.id);

      const response = await api()
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(alice.token));

      expect(response.status).toBe(403);
      expect(await prisma.task.findUnique({ where: { id: task.id } })).not.toBeNull();
    });

    it('does not see it in their own task list', async () => {
      await createTaskFor(bob.id, { title: "Bob's homework" });

      const response = await api().get('/api/tasks').set('Authorization', bearer(alice.token));

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('Admin oversight', () => {
    it('an admin may read any student’s task', async () => {
      const task = await createTaskFor(bob.id, { title: "Bob's homework" });

      const response = await api()
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe("Bob's homework");
    });
  });
});
