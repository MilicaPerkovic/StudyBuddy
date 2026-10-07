import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser, setup } from './helpers.js';

let ctx;
let user;
let course;
beforeEach(async () => {
  ctx = setup();
  user = await registerUser(ctx.app);
  course = (await user.as.post('/api/courses', { name: 'ZITS', color: '#ff0000' })).body;
});

const future = (days) => new Date(Date.now() + days * 86400000).toISOString();

describe('assignments', () => {
  it('creates an assignment with course info', async () => {
    const res = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Naloga 1',
      due_date: future(3),
      type: 'project',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      title: 'Naloga 1',
      type: 'project',
      status: 'todo',
      priority: 'medium',
      course_name: 'ZITS',
      course_color: '#ff0000',
    });
  });

  it('normalises the due date to ISO format', async () => {
    const res = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'X',
      due_date: '2026-12-01T10:00:00Z',
    });
    expect(res.body.due_date).toBe('2026-12-01T10:00:00.000Z');
  });

  it('rejects invalid enums and dates', async () => {
    const res = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'X',
      due_date: 'tomorrow-ish',
      priority: 'urgent',
    });
    expect(res.status).toBe(400);
    expect(res.body.details.map((d) => d.field).sort()).toEqual(['due_date', 'priority']);
  });

  it('rejects a course that belongs to another user', async () => {
    const other = await registerUser(ctx.app);
    const otherCourse = (await other.as.post('/api/courses', { name: 'Theirs' })).body;
    const res = await user.as.post('/api/assignments', {
      course_id: otherCourse.id,
      title: 'X',
      due_date: future(1),
    });
    expect(res.status).toBe(400);
    expect(res.body.details[0].field).toBe('course_id');
  });

  it('lists sorted by due date and filters by status and overdue', async () => {
    await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Later',
      due_date: future(10),
    });
    await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Late',
      due_date: future(-2),
    });
    const { body: soon } = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Soon',
      due_date: future(1),
    });
    await user.as.patch(`/api/assignments/${soon.id}/status`, { status: 'done' });

    const all = await user.as.get('/api/assignments');
    expect(all.body.map((a) => a.title)).toEqual(['Late', 'Soon', 'Later']);

    const todo = await user.as.get('/api/assignments?status=todo');
    expect(todo.body.map((a) => a.title)).toEqual(['Late', 'Later']);

    const overdue = await user.as.get('/api/assignments?overdue=true');
    expect(overdue.body.map((a) => a.title)).toEqual(['Late']);
  });

  it('rejects an invalid status filter', async () => {
    expect((await user.as.get('/api/assignments?status=nope')).status).toBe(400);
  });

  it('updates and deletes an assignment', async () => {
    const { body: a } = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Old',
      due_date: future(1),
    });
    const upd = await user.as.put(`/api/assignments/${a.id}`, { title: 'New', priority: 'high' });
    expect(upd.body).toMatchObject({ title: 'New', priority: 'high' });

    expect((await user.as.delete(`/api/assignments/${a.id}`)).status).toBe(204);
    expect((await user.as.get(`/api/assignments/${a.id}`)).status).toBe(404);
  });

  it('validates the status on PATCH', async () => {
    const { body: a } = await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'X',
      due_date: future(1),
    });
    expect(
      (await user.as.patch(`/api/assignments/${a.id}/status`, { status: 'finished' })).status,
    ).toBe(400);
  });
});
