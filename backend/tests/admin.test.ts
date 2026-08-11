import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  bearer,
  createAdmin,
  createStudent,
  createTaskFor,
  daysFromNow,
  resetDatabase,
  type TestUser,
} from './helpers';
import { prisma } from '../src/config/prisma';

describe('Admin', () => {
  let admin: TestUser;
  let alice: TestUser;
  let bob: TestUser;
  let carol: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    admin = await createAdmin('professor@college.local');
    alice = await createStudent('alice.admin@college.local', 'CS21B040');
    bob = await createStudent('bob.admin@college.local', 'CS21B041');
    carol = await createStudent('carol.admin@college.local', 'CS21B042');
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  const assignment = {
    title: 'Compiler Design Lab 4',
    description: 'Implement a recursive descent parser.',
    subject: 'Compiler Design',
    dueDate: '2026-12-20',
    priority: 'HIGH' as const,
  };

  describe('GET /api/admin/students', () => {
    it('lists every student with their task counters', async () => {
      await createTaskFor(alice.id, { status: 'COMPLETED' });
      await createTaskFor(alice.id, { status: 'PENDING' });
      await createTaskFor(alice.id, { status: 'PENDING', dueDate: daysFromNow(-2) });

      const response = await api()
        .get('/api/admin/students')
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3); // admin itself is excluded

      const aliceRow = response.body.data.find((s: { id: string }) => s.id === alice.id);
      expect(aliceRow).toMatchObject({
        totalTasks: 3,
        completedTasks: 1,
        pendingTasks: 2,
        overdueTasks: 1,
      });
      expect(aliceRow).not.toHaveProperty('passwordHash');
    });

    it('supports a search term', async () => {
      const response = await api()
        .get('/api/admin/students?search=CS21B041')
        .set('Authorization', bearer(admin.token));

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe(bob.id);
    });
  });

  describe('GET /api/admin/students/:id', () => {
    it('returns a student profile with their tasks', async () => {
      await createTaskFor(bob.id, { title: 'Bob task 1' });
      await createTaskFor(bob.id, { title: 'Bob task 2' });

      const response = await api()
        .get(`/api/admin/students/${bob.id}`)
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
      expect(response.body.data.student.id).toBe(bob.id);
      expect(response.body.data.tasks).toHaveLength(2);
    });

    it('returns 404 for an unknown student', async () => {
      const response = await api()
        .get('/api/admin/students/nope')
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/admin/tasks', () => {
    it('returns tasks belonging to every student', async () => {
      await createTaskFor(alice.id, { title: 'A' });
      await createTaskFor(bob.id, { title: 'B' });
      await createTaskFor(carol.id, { title: 'C' });

      const response = await api()
        .get('/api/admin/tasks')
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].student).toBeDefined();
    });

    it('can be filtered down to one student', async () => {
      await createTaskFor(alice.id, { title: 'A' });
      await createTaskFor(bob.id, { title: 'B' });

      const response = await api()
        .get(`/api/admin/tasks?studentId=${bob.id}`)
        .set('Authorization', bearer(admin.token));

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('B');
    });
  });

  describe('POST /api/admin/tasks - assign to one student', () => {
    it('creates exactly one task owned by the selected student', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: [bob.id] });

      expect(response.status).toBe(201);
      expect(response.body.data.created).toBe(1);
      expect(response.body.data.tasks[0].studentId).toBe(bob.id);
      // Provenance: owned by the student, authored by the admin.
      expect(response.body.data.tasks[0].createdBy).toBe(admin.id);
      expect(response.body.data.tasks[0].assignedByAdmin).toBe(true);
      expect(response.body.data.tasks[0].status).toBe('PENDING');

      expect(await prisma.task.count()).toBe(1);
    });

    it('makes the assignment visible on that student’s own task list', async () => {
      await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: [bob.id] });

      const bobsTasks = await api().get('/api/tasks').set('Authorization', bearer(bob.token));
      const alicesTasks = await api().get('/api/tasks').set('Authorization', bearer(alice.token));

      expect(bobsTasks.body.data).toHaveLength(1);
      expect(bobsTasks.body.data[0].title).toBe(assignment.title);
      expect(alicesTasks.body.data).toHaveLength(0);
    });

    it('rejects an unknown student id', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: ['not-a-real-student'] });

      expect(response.status).toBe(400);
      expect(await prisma.task.count()).toBe(0);
    });

    it('refuses to assign a task to another admin account', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: [admin.id] });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/admin/tasks - assign to all students', () => {
    it('creates one task row per student, each owned by that student', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: 'ALL' });

      expect(response.status).toBe(201);
      expect(response.body.data.created).toBe(3);

      const tasks = await prisma.task.findMany();
      expect(tasks).toHaveLength(3);

      // Critically: no task is stored without an owner.
      expect(tasks.every((task) => Boolean(task.studentId))).toBe(true);
      expect(new Set(tasks.map((task) => task.studentId))).toEqual(
        new Set([alice.id, bob.id, carol.id]),
      );
      expect(tasks.every((task) => task.createdBy === admin.id)).toBe(true);
    });

    it('shows the class assignment on every student’s dashboard', async () => {
      await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: 'ALL' });

      for (const student of [alice, bob, carol]) {
        const response = await api().get('/api/tasks').set('Authorization', bearer(student.token));
        expect(response.body.data).toHaveLength(1);
        expect(response.body.data[0].title).toBe(assignment.title);
      }
    });

    it('validates the assignment body', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ title: 'x', subject: '', dueDate: 'nope', priority: 'HUGE', assignTo: 'ALL' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty('title');
      expect(response.body.errors).toHaveProperty('subject');
      expect(response.body.errors).toHaveProperty('dueDate');
      expect(response.body.errors).toHaveProperty('priority');
    });

    it('rejects an empty student selection', async () => {
      const response = await api()
        .post('/api/admin/tasks')
        .set('Authorization', bearer(admin.token))
        .send({ ...assignment, assignTo: [] });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/admin/statistics', () => {
    it('aggregates totals across the whole class', async () => {
      await createTaskFor(alice.id, { status: 'COMPLETED' });
      await createTaskFor(alice.id, { status: 'PENDING', dueDate: daysFromNow(-1) });
      await createTaskFor(bob.id, { status: 'PENDING', dueDate: daysFromNow(5) });

      const response = await api()
        .get('/api/admin/statistics')
        .set('Authorization', bearer(admin.token));

      expect(response.status).toBe(200);
      expect(response.body.data.statistics).toMatchObject({
        totalStudents: 3,
        totalAssignments: 3,
        completedAssignments: 1,
        pendingAssignments: 2,
        overdueAssignments: 1,
      });
      expect(response.body.data.recentTasks.length).toBeGreaterThan(0);
      expect(response.body.data.studentProgress).toHaveLength(3);
    });
  });
});
