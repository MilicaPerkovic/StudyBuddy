import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser, setup } from './helpers.js';

let ctx;
let user;
beforeEach(async () => {
  ctx = setup();
  user = await registerUser(ctx.app);
});

describe('courses', () => {
  it('creates a course with defaults', async () => {
    const res = await user.as.post('/api/courses', { name: 'ZITS' });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: 'ZITS', ects: 6, color: '#4f46e5', average: null });
  });

  it('validates ects and color', async () => {
    const res = await user.as.post('/api/courses', { name: 'X', ects: 0, color: 'red' });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['color', 'ects']);
  });

  it('lists, updates and deletes a course', async () => {
    const { body: c } = await user.as.post('/api/courses', { name: 'B course' });
    await user.as.post('/api/courses', { name: 'a course' });

    const list = await user.as.get('/api/courses');
    expect(list.body.map((x) => x.name)).toEqual(['a course', 'B course']);

    const upd = await user.as.put(`/api/courses/${c.id}`, { professor: 'Dr. X' });
    expect(upd.status).toBe(200);
    expect(upd.body.professor).toBe('Dr. X');
    expect(upd.body.name).toBe('B course');

    expect((await user.as.delete(`/api/courses/${c.id}`)).status).toBe(204);
    expect((await user.as.get(`/api/courses/${c.id}`)).status).toBe(404);
  });

  it('includes the weighted grade average', async () => {
    const { body: c } = await user.as.post('/api/courses', { name: 'PB' });
    await user.as.post('/api/grades', { course_id: c.id, label: 'K1', grade: 10, weight: 30 });
    await user.as.post('/api/grades', { course_id: c.id, label: 'K2', grade: 6, weight: 70 });
    const res = await user.as.get(`/api/courses/${c.id}`);
    expect(res.body.average).toBe(7.2);
  });

  it('deleting a course cascades to its assignments', async () => {
    const { body: c } = await user.as.post('/api/courses', { name: 'PB' });
    await user.as.post('/api/assignments', {
      course_id: c.id,
      title: 'HW',
      due_date: '2026-12-01',
    });
    await user.as.delete(`/api/courses/${c.id}`);
    const res = await user.as.get('/api/assignments');
    expect(res.body).toEqual([]);
  });

  it("does not expose other users' courses", async () => {
    const other = await registerUser(ctx.app);
    const { body: c } = await other.as.post('/api/courses', { name: 'Secret' });

    expect((await user.as.get('/api/courses')).body).toEqual([]);
    expect((await user.as.get(`/api/courses/${c.id}`)).status).toBe(404);
    expect((await user.as.put(`/api/courses/${c.id}`, { name: 'Hacked' })).status).toBe(404);
    expect((await user.as.delete(`/api/courses/${c.id}`)).status).toBe(404);
  });

  it('returns 404 for a non-numeric id', async () => {
    expect((await user.as.get('/api/courses/abc')).status).toBe(404);
  });
});
