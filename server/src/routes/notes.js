import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../errors.js';
import { assertCourse, buildUpdate, findOwned } from './helpers.js';

const noteSchema = z.object({
  course_id: z.number().int().positive(),
  title: z.string().trim().min(1).max(200),
  content: z.string().max(50000).default(''),
});

const SELECT = `
  SELECT n.*, c.name AS course_name, c.color AS course_color
  FROM notes n JOIN courses c ON c.id = n.course_id`;

export function notesRouter(db) {
  const router = Router();

  const load = (id) => db.prepare(`${SELECT} WHERE n.id = ?`).get(id);

  router.get('/', (req, res) => {
    const f = validate(
      z.object({
        course_id: z.coerce.number().int().positive().optional(),
        q: z.string().trim().max(100).optional(),
      }),
      req.query,
    );
    const where = ['n.user_id = ?'];
    const params = [req.userId];
    if (f.course_id) {
      where.push('n.course_id = ?');
      params.push(f.course_id);
    }
    if (f.q) {
      where.push('(n.title LIKE ? OR n.content LIKE ?)');
      params.push(`%${f.q}%`, `%${f.q}%`);
    }
    const rows = db
      .prepare(`${SELECT} WHERE ${where.join(' AND ')} ORDER BY n.updated_at DESC, n.id DESC`)
      .all(...params);
    res.json(rows);
  });

  router.get('/:id', (req, res) => {
    const n = findOwned(db, 'notes', req.params.id, req.userId);
    res.json(load(n.id));
  });

  router.post('/', (req, res) => {
    const d = validate(noteSchema, req.body);
    assertCourse(db, d.course_id, req.userId);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO notes (user_id, course_id, title, content) VALUES (?, ?, ?, ?)')
      .run(req.userId, d.course_id, d.title, d.content);
    res.status(201).json(load(lastInsertRowid));
  });

  router.put('/:id', (req, res) => {
    const n = findOwned(db, 'notes', req.params.id, req.userId);
    const d = validate(noteSchema.partial(), req.body);
    if (d.course_id) assertCourse(db, d.course_id, req.userId);
    const { sql, values } = buildUpdate({ ...d, updated_at: new Date().toISOString() });
    db.prepare(`UPDATE notes SET ${sql} WHERE id = ?`).run(...values, n.id);
    res.json(load(n.id));
  });

  router.delete('/:id', (req, res) => {
    const n = findOwned(db, 'notes', req.params.id, req.userId);
    db.prepare('DELETE FROM notes WHERE id = ?').run(n.id);
    res.status(204).end();
  });

  return router;
}
