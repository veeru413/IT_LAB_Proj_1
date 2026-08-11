/** Cross-cutting API behaviour: response envelope, 404s and error hygiene. */
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, bearer, createStudent, resetDatabase } from './helpers';
import { prisma } from '../src/config/prisma';

describe('API conventions', () => {
  beforeEach(resetDatabase);
  afterAll(async () => {
    await resetDatabase();
    await prisma.$disconnect();
  });

  it('exposes a health endpoint', async () => {
    const response = await api().get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('returns 404 with the standard error envelope for unknown routes', async () => {
    const response = await api().get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(typeof response.body.message).toBe('string');
  });

  it('wraps every success response in { success: true, data }', async () => {
    const student = await createStudent('envelope@college.local', 'CS21B050');

    const response = await api().get('/api/tasks').set('Authorization', bearer(student.token));

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('data');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('rejects malformed JSON with 400 rather than crashing', async () => {
    const response = await api()
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": broken}');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('never leaks a stack trace to the client', async () => {
    const response = await api().get('/api/tasks/some-id');

    expect(response.status).toBe(401);
    expect(JSON.stringify(response.body)).not.toMatch(/at \w+ \(/);
    expect(response.body).not.toHaveProperty('stack');
  });

  it('sets standard security headers via Helmet', async () => {
    const response = await api().get('/api/health');

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers).toHaveProperty('x-frame-options');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
});
