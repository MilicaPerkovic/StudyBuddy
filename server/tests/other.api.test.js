import { beforeEach, describe, expect, it } from 'vitest';
import { registerUser, setup } from './helpers.js';

let ctx;
let user;
let course;
beforeEach(async () => {
  ctx = setup();
  user = await registerUser(ctx.app);
  course = (await user.as.post('/api/courses', { name: 'ZITS', ects: 6 })).body;
});

describe('study sessions', () => {
  it('logs a session with and without a course', async () => {
    const a = await user.as.post('/api/sessions', {
      course_id: course.id,
      started_at: '2026-10-05T09:00:00Z',
      duration_minutes: 45,
    });
    expect(a.status).toBe(201);
    expect(a.body.course_name).toBe('ZITS');

    const b = await user.as.post('/api/sessions', {
      started_at: '2026-10-06T09:00:00Z',
      duration_minutes: 30,
    });
    expect(b.status).toBe(201);
    expect(b.body.course_id).toBeNull();
  });

  it('validates duration', async () => {
    const res = await user.as.post('/api/sessions', {
      started_at: '2026-10-05T09:00:00Z',
      duration_minutes: 0,
    });
    expect(res.status).toBe(400);
  });

  it('filters by date range', async () => {
    for (const day of ['01', '05', '09']) {
      await user.as.post('/api/sessions', {
        started_at: `2026-10-${day}T09:00:00Z`,
        duration_minutes: 10,
      });
    }
    const res = await user.as.get('/api/sessions?from=2026-10-02&to=2026-10-08');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].started_at).toBe('2026-10-05T09:00:00.000Z');
  });

  it('deletes a session', async () => {
    const { body: s } = await user.as.post('/api/sessions', {
      started_at: '2026-10-05T09:00:00Z',
      duration_minutes: 10,
    });
    expect((await user.as.delete(`/api/sessions/${s.id}`)).status).toBe(204);
    expect((await user.as.get('/api/sessions')).body).toEqual([]);
  });
});

describe('notes', () => {
  it('creates, searches, updates and deletes notes', async () => {
    const { body: n } = await user.as.post('/api/notes', {
      course_id: course.id,
      title: 'Piramida testiranja',
      content: 'Unit, integration, E2E',
    });
    await user.as.post('/api/notes', { course_id: course.id, title: 'Other', content: 'nothing' });

    const search = await user.as.get('/api/notes?q=integration');
    expect(search.body.map((x) => x.title)).toEqual(['Piramida testiranja']);

    const upd = await user.as.put(`/api/notes/${n.id}`, { content: 'Updated' });
    expect(upd.body.content).toBe('Updated');
    expect(upd.body.title).toBe('Piramida testiranja');

    expect((await user.as.delete(`/api/notes/${n.id}`)).status).toBe(204);
    expect((await user.as.get('/api/notes')).body).toHaveLength(1);
  });

  it('requires a title', async () => {
    const res = await user.as.post('/api/notes', { course_id: course.id, title: '   ' });
    expect(res.status).toBe(400);
  });
});

describe('grades', () => {
  it('validates the 5-10 scale', async () => {
    const res = await user.as.post('/api/grades', {
      course_id: course.id,
      label: 'X',
      grade: 11,
      weight: 10,
    });
    expect(res.status).toBe(400);
  });

  it('computes the ECTS-weighted overall average', async () => {
    const small = (await user.as.post('/api/courses', { name: 'Small', ects: 3 })).body;
    await user.as.post('/api/courses', { name: 'Ungraded', ects: 6 });
    await user.as.post('/api/grades', {
      course_id: course.id,
      label: 'Izpit',
      grade: 10,
      weight: 100,
    });
    await user.as.post('/api/grades', {
      course_id: small.id,
      label: 'Izpit',
      grade: 7,
      weight: 100,
    });

    const res = await user.as.get('/api/grades/summary');
    expect(res.status).toBe(200);
    expect(res.body.overall).toBe(9);
    expect(res.body.courses.find((c) => c.name === 'Ungraded').average).toBeNull();
  });

  it('lists by course and deletes', async () => {
    const { body: g } = await user.as.post('/api/grades', {
      course_id: course.id,
      label: 'K1',
      grade: 8,
      weight: 50,
    });
    expect((await user.as.get(`/api/grades?course_id=${course.id}`)).body).toHaveLength(1);
    expect((await user.as.delete(`/api/grades/${g.id}`)).status).toBe(204);
    expect((await user.as.get('/api/grades')).body).toEqual([]);
  });
});

describe('dashboard', () => {
  it('summarises upcoming, overdue and weekly study time', async () => {
    const day = 86400000;
    await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Soon',
      due_date: new Date(Date.now() + 2 * day).toISOString(),
    });
    await user.as.post('/api/assignments', {
      course_id: course.id,
      title: 'Late',
      due_date: new Date(Date.now() - 3 * day).toISOString(),
    });
    await user.as.post('/api/sessions', {
      started_at: new Date().toISOString(),
      duration_minutes: 40,
    });

    const res = await user.as.get('/api/dashboard');
    expect(res.status).toBe(200);
    expect(res.body.upcoming.map((a) => a.title)).toEqual(['Soon']);
    expect(res.body.upcoming[0].days_left).toBe(2);
    expect(res.body.overdue.map((a) => a.title)).toEqual(['Late']);
    expect(res.body.open_count).toBe(2);
    expect(res.body.course_count).toBe(1);
    expect(res.body.week.per_day).toHaveLength(7);
    expect(res.body.week_minutes).toBe(40);
  });
});
