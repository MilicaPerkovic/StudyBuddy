import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../errors.js';
import { assertCourse, buildUpdate, findOwned, isoDate } from './helpers.js';

const TYPES = ['assignment', 'exam', 'project'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUSES = ['todo', 'in_progress', 'done'];

const assignmentSchema = z.object({
  course_id: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).default(''),
  type: z.enum(TYPES).default('assignment'),
  due_date: isoDate,
  priority: z.enum(PRIORITIES).default('medium'),
  status: z.enum(STATUSES).default('todo'),
});

const filterSchema = z.object({
  course_id: z.coerce.number().int().positive().optional(),
  status: z.enum(STATUSES).optional(),
  type: z.enum(TYPES).optional(),
  overdue: z.enum(['true', 'false']).optional(),
});

const SELECT = `
  SELECT a.*, c.name AS course_name, c.color AS course_color
  FROM assignments a JOIN courses c ON c.id = a.course_id`;

export function assignmentsRouter(db) {
  const router = Router();

  const load = (id) => db.prepare(`${SELECT} WHERE a.id = ?`).get(id);

  router.get('/', (req, res) => {
    const f = validate(filterSchema, req.query);
    const where = ['a.user_id = ?'];
    const params = [req.userId];
    if (f.course_id) {
      where.push('a.course_id = ?');
      params.push(f.course_id);
    }
    if (f.status) {
      where.push('a.status = ?');
      params.push(f.status);
    }
    if (f.type) {
      where.push('a.type = ?');
      params.push(f.type);
    }
    if (f.overdue === 'true') {
      where.push("a.status != 'done' AND a.due_date < ?");
      params.push(new Date().toISOString());
    }
    const rows = db
      .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY a.due_date ASC`)
      .all(...params);
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const a = findOwned(db, 'assignments', req.params.id, req.userId);
    res.json(load(a.id));
  });

  router.post('/', (req, res) => {
    const d = validate(assignmentSchema, req.body);
    assertCourse(db, d.course_id, req.userId);
    const { lastInsertRowid } = db
      .prepare(
        `INSERT INTO assignments (user_id, course_id, title, description, type, due_date, priority, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        req.userId,
        d.course_id,
        d.title,
        d.description,
        d.type,
        d.due_date,
        d.priority,
        d.status,
      );
    res.status(201).json(load(lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const a = findOwned(db, 'assignments', req.params.id, req.userId);
    const d = validate(assignmentSchema.partial(), req.body);
    if (d.course_id) assertCourse(db, d.course_id, req.userId);
    if (Object.keys(d).length > 0) {
      const { sql, values } = buildUpdate(d);
      db.prepare(`UPDATE assignments SET ${sql} WHERE id = ?`).run(...values, a.id);
    }
    res.json(load(a.id));
  });

  router.patch('/:id/status', (req, res) => {
    const a = findOwned(db, 'assignments', req.params.id, req.userId);
    const { status } = validate(z.object({ status: z.enum(STATUSES) }), req.body);
    db.prepare('UPDATE assignments SET status = ? WHERE id = ?').run(status, a.id);
    res.json(load(a.id));
  });

  router.delete('/:id', (req, res) => {
    const a = findOwned(db, 'assignments', req.params.id, req.userId);
    db.prepare('DELETE FROM assignments WHERE id = ?').run(a.id);
    res.status(204).end();
  });

  return router;
}
