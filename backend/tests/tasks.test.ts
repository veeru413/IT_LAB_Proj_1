import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  api,
  bearer,
  createStudent,
  createTaskFor,
  daysFromNow,
  resetDatabase,
  type TestUser,
} from './helpers';
import { prisma } from '../src/config/prisma';

describe('Tasks', () => {
  let student: TestUser;

  beforeEach(async () => {
    await resetDatabase();
    student = await createStudent('owner@college.local', 'CS21B020');
  });

  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  const validTask = {
    title: 'DBMS Assignment',
    description: 'Complete the normalization questions',
    subject: 'DBMS',
    dueDate: '2026-12-15',
    priority: 'HIGH',
  };

  describe('POST /api/tasks', () => {
    it('creates a task owned by the logged-in student, defaulting to PENDING', async () => {
      const response = await api()
        .post('/api/tasks')
        .set('Authorization', bearer(student.token))
        .send(validTask);

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('DBMS Assignment');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.priority).toBe('HIGH');
      expect(response.body.data.studentId).toBe(student.id);
      expect(response.body.data.createdBy).toBe(student.id);
    });

    it('ignores a studentId supplied in the body (no assigning work to others)', async () => {
      const victim = await createStudent('victim@college.local', 'CS21B021');

      const response = await api()
        .post('/api/tasks')
        .set('Authorization', bearer(student.token))
        .send({ ...validTask, studentId: victim.id, status: 'COMPLETED' });

      expect(response.status).toBe(201);
      expect(response.body.data.studentId).toBe(student.id);
      expect(response.body.data.status).toBe('PENDING');
    });

    it('rejects a missing title and an invalid priority', async () => {
      const response = await api()
        .post('/api/tasks')
        .set('Authorization', bearer(student.token))
        .send({ ...validTask, title: '', priority: 'URGENT' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty('title');
      expect(response.body.errors).toHaveProperty('priority');
    });

    it('rejects an invalid due date', async () => {
      const response = await api()
        .post('/api/tasks')
        .set('Authorization', bearer(student.token))
        .send({ ...validTask, dueDate: 'not-a-date' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty('dueDate');
    });

    it('requires authentication', async () => {
      const response = await api().post('/api/tasks').send(validTask);
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/tasks', () => {
    it('returns only the caller’s own tasks', async () => {
      const other = await createStudent('other@college.local', 'CS21B022');
      await createTaskFor(student.id, { title: 'Mine' });
      await createTaskFor(other.id, { title: 'Theirs' });

      const response = await api().get('/api/tasks').set('Authorization', bearer(student.token));

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Mine');
    });

    it('includes a summary with total, pending, completed and overdue counts', async () => {
      await createTaskFor(student.id, { status: 'COMPLETED' });
      await createTaskFor(student.id, { status: 'PENDING' });
      await createTaskFor(student.id, { status: 'PENDING', dueDate: daysFromNow(-3) });

      const response = await api().get('/api/tasks').set('Authorization', bearer(student.token));

      expect(response.body.meta.summary).toEqual({
        total: 3,
        pending: 2,
        completed: 1,
        overdue: 1,
      });
    });

    it('filters by status', async () => {
      await createTaskFor(student.id, { title: 'Done', status: 'COMPLETED' });
      await createTaskFor(student.id, { title: 'Todo', status: 'PENDING' });

      const response = await api()
        .get('/api/tasks?status=COMPLETED')
        .set('Authorization', bearer(student.token));

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Done');
    });

    it('filters by priority and subject', async () => {
      await createTaskFor(student.id, { title: 'A', priority: 'HIGH', subject: 'DBMS' });
      await createTaskFor(student.id, { title: 'B', priority: 'LOW', subject: 'OS' });

      const byPriority = await api()
        .get('/api/tasks?priority=HIGH')
        .set('Authorization', bearer(student.token));
      expect(byPriority.body.data).toHaveLength(1);
      expect(byPriority.body.data[0].title).toBe('A');

      const bySubject = await api()
        .get('/api/tasks?subject=OS')
        .set('Authorization', bearer(student.token));
      expect(bySubject.body.data).toHaveLength(1);
      expect(bySubject.body.data[0].title).toBe('B');
    });

    it('searches across title, subject and description', async () => {
      await createTaskFor(student.id, { title: 'Database indexing', subject: 'DBMS' });
      await createTaskFor(student.id, { title: 'Networking lab', subject: 'CN' });
      await createTaskFor(student.id, {
        title: 'Unrelated',
        subject: 'Maths',
        description: 'revise database transactions',
      });

      const response = await api()
        .get('/api/tasks?search=database')
        .set('Authorization', bearer(student.token));

      expect(response.body.data).toHaveLength(2);
    });

    it('sorts by priority with HIGH first', async () => {
      await createTaskFor(student.id, { title: 'Low one', priority: 'LOW' });
      await createTaskFor(student.id, { title: 'High one', priority: 'HIGH' });
      await createTaskFor(student.id, { title: 'Medium one', priority: 'MEDIUM' });

      const response = await api()
        .get('/api/tasks?sortBy=priority&order=desc')
        .set('Authorization', bearer(student.token));

      expect(response.body.data.map((t: { priority: string }) => t.priority)).toEqual([
        'HIGH',
        'MEDIUM',
        'LOW',
      ]);
    });

    it('sorts by due date ascending', async () => {
      await createTaskFor(student.id, { title: 'Later', dueDate: daysFromNow(10) });
      await createTaskFor(student.id, { title: 'Sooner', dueDate: daysFromNow(2) });

      const response = await api()
        .get('/api/tasks?sortBy=dueDate&order=asc')
        .set('Authorization', bearer(student.token));

      expect(response.body.data.map((t: { title: string }) => t.title)).toEqual(['Sooner', 'Later']);
    });

    it('rejects an unknown sort field', async () => {
      const response = await api()
        .get('/api/tasks?sortBy=hackme')
        .set('Authorization', bearer(student.token));

      expect(response.status).toBe(400);
    });
  });

  describe('Overdue detection', () => {
    it('marks a PENDING task with a past due date as overdue', async () => {
      const task = await createTaskFor(student.id, {
        status: 'PENDING',
        dueDate: daysFromNow(-1),
      });

      const response = await api()
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token));

      expect(response.body.data.isOverdue).toBe(true);
    });

    it('does not mark a COMPLETED task as overdue even when the date has passed', async () => {
      const task = await createTaskFor(student.id, {
        status: 'COMPLETED',
        dueDate: daysFromNow(-5),
      });

      const response = await api()
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token));

      expect(response.body.data.isOverdue).toBe(false);
    });

    it('does not mark a future PENDING task as overdue', async () => {
      const task = await createTaskFor(student.id, { dueDate: daysFromNow(5) });

      const response = await api()
        .get(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token));

      expect(response.body.data.isOverdue).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    it('updates the caller’s own task', async () => {
      const task = await createTaskFor(student.id);

      const response = await api()
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token))
        .send({ title: 'Updated title', priority: 'LOW' });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated title');
      expect(response.body.data.priority).toBe('LOW');
    });

    it('returns 404 for a task that does not exist', async () => {
      const response = await api()
        .put('/api/tasks/does-not-exist')
        .set('Authorization', bearer(student.token))
        .send({ title: 'Updated title' });

      expect(response.status).toBe(404);
    });

    it('rejects an empty update body', async () => {
      const task = await createTaskFor(student.id);

      const response = await api()
        .put(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token))
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /api/tasks/:id/status', () => {
    it('marks a task as completed and back to pending', async () => {
      const task = await createTaskFor(student.id);

      const completed = await api()
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', bearer(student.token))
        .send({ status: 'COMPLETED' });

      expect(completed.status).toBe(200);
      expect(completed.body.data.status).toBe('COMPLETED');

      const reopened = await api()
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', bearer(student.token))
        .send({ status: 'PENDING' });

      expect(reopened.body.data.status).toBe('PENDING');
    });

    it('rejects an invalid status value', async () => {
      const task = await createTaskFor(student.id);

      const response = await api()
        .patch(`/api/tasks/${task.id}/status`)
        .set('Authorization', bearer(student.token))
        .send({ status: 'ARCHIVED' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('deletes the caller’s own task', async () => {
      const task = await createTaskFor(student.id);

      const response = await api()
        .delete(`/api/tasks/${task.id}`)
        .set('Authorization', bearer(student.token));

      expect(response.status).toBe(200);
      expect(await prisma.task.findUnique({ where: { id: task.id } })).toBeNull();
    });
  });

  describe('Data persistence', () => {
    it('keeps a created task readable in a later request', async () => {
      const created = await api()
        .post('/api/tasks')
        .set('Authorization', bearer(student.token))
        .send(validTask);

      const fetched = await api()
        .get(`/api/tasks/${created.body.data.id}`)
        .set('Authorization', bearer(student.token));

      expect(fetched.status).toBe(200);
      expect(fetched.body.data.title).toBe(validTask.title);
    });
  });
});
