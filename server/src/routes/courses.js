import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../errors.js';
import { weightedAverage } from '../services/grades.js';
import { buildUpdate, findOwned } from './helpers.js';

const courseSchema = z.object({
  name: z.string().trim().min(1).max(100),
  code: z.string().trim().max(20).optional().nullable(),
  ects: z.number().int().min(1).max(30).default(6),
  professor: z.string().trim().max(100).optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #4f46e5')
    .default('#4f46e5'),
});

export function coursesRouter(db) {
  const router = Router();

  const withStats = (course) => {
    const grades = db
      .prepare('SELECT grade, weight FROM grades WHERE course_id = ?')
      .all(course.id);
    const open = db
      .prepare("SELECT COUNT(*) AS n FROM assignments WHERE course_id = ? AND status != 'done'")
      .get(course.id).n;
    return { ...course, average: weightedAverage(grades), open_assignments: open };
  };

  router.get('/', (req, res) => {
    const rows = db
      .prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY name COLLATE NOCASE')
      .all(req.userId);
    res.json(rows.map(withStats));
  });

  router.get('/:id', (req, res) => {
    res.json(withStats(findOwned(db, 'courses', req.params.id, req.userId)));
  });

  router.post('/', (req, res) => {
    const d = validate(courseSchema, req.body);
    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO courses (user_id, name, code, ects, professor, color) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(req.userId, d.name, d.code ?? null, d.ects, d.professor ?? null, d.color);
    res.status(201).json(withStats(findOwned(db, 'courses', lastInsertRowid, req.userId)));
  });

  router.put('/:id', (req, res) => {
    const course = findOwned(db, 'courses', req.params.id, req.userId);
    const d = validate(courseSchema.partial(), req.body);
    if (Object.keys(d).length > 0) {
      const { sql, values } = buildUpdate(d);
      db.prepare(`UPDATE courses SET ${sql} WHERE id = ?`).run(...values, course.id);
    }
    res.json(withStats(findOwned(db, 'courses', course.id, req.userId)));
  });

  router.delete('/:id', (req, res) => {
    const course = findOwned(db, 'courses', req.params.id, req.userId);
    db.prepare('DELETE FROM courses WHERE id = ?').run(course.id);
    res.status(204).end();
  });

  return router;
}
