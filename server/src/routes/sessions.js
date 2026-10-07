import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../errors.js';
import { assertCourse, findOwned, isoDate } from './helpers.js';

const sessionSchema = z.object({
  course_id: z.number().int().positive().nullable().optional(),
  started_at: isoDate,
  duration_minutes: z
    .number()
    .int()
    .min(1)
    .max(24 * 60),
  note: z.string().max(1000).default(''),
});

const SELECT = `
  SELECT s.*, c.name AS course_name, c.color AS course_color
  FROM study_sessions s LEFT JOIN courses c ON c.id = s.course_id`;

export function sessionsRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { from, to } = validate(
      z.object({ from: isoDate.optional(), to: isoDate.optional() }),
      req.query,
    );
    const where = ['s.user_id = ?'];
    const params = [req.userId];
    if (from) {
      where.push('s.started_at >= ?');
      params.push(from);
    }
    if (to) {
      where.push('s.started_at < ?');
      params.push(to);
    }
    const rows = db
      .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY s.started_at DESC`)
      .all(...params);
    res.json(rows);
  });

  router.post('/', (req, res) => {
    const d = validate(sessionSchema, req.body);
    if (d.course_id) assertCourse(db, d.course_id, req.userId);
    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO study_sessions (user_id, course_id, started_at, duration_minutes, note) VALUES (?, ?, ?, ?, ?)',
      )
      .run(req.userId, d.course_id ?? null, d.started_at, d.duration_minutes, d.note);
    res.status(201).json(db.prepare(`${SELECT} WHERE s.id = ?`).get(lastInsertRowid));
  });

  router.delete('/:id', (req, res) => {
    const s = findOwned(db, 'study_sessions', req.params.id, req.userId);
    db.prepare('DELETE FROM study_sessions WHERE id = ?').run(s.id);
    res.status(204).end();
  });

  return router;
}
