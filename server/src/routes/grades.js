import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../errors.js';
import { ectsWeightedAverage, weightedAverage } from '../services/grades.js';
import { assertCourse, findOwned } from './helpers.js';

// Slovenian grading scale: 5 (fail) to 10.
const gradeSchema = z.object({
  course_id: z.number().int().positive(),
  label: z.string().trim().min(1).max(100),
  grade: z.number().min(5).max(10),
  weight: z.number().positive().max(100),
});

export function gradesRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const { course_id } = validate(
      z.object({ course_id: z.coerce.number().int().positive().optional() }),
      req.query,
    );
    const rows = course_id
      ? db
          .prepare(
            'SELECT * FROM grades WHERE user_id = ? AND course_id = ? ORDER BY created_at, id',
          )
          .all(req.userId, course_id)
      : db
          .prepare('SELECT * FROM grades WHERE user_id = ? ORDER BY created_at, id')
          .all(req.userId);
    res.json(rows);
  });

  /** Per-course weighted averages plus the overall ECTS-weighted average. */
  router.get('/summary', (req, res) => {
    const courses = db
      .prepare('SELECT id, name, ects, color FROM courses WHERE user_id = ? ORDER BY name')
      .all(req.userId);
    const stmt = db.prepare('SELECT grade, weight FROM grades WHERE course_id = ?');
    const perCourse = courses.map((c) => ({ ...c, average: weightedAverage(stmt.all(c.id)) }));
    res.json({ courses: perCourse, overall: ectsWeightedAverage(perCourse) });
  });

  router.post('/', (req, res) => {
    const d = validate(gradeSchema, req.body);
    assertCourse(db, d.course_id, req.userId);
    const { lastInsertRowid } = db
      .prepare(
        'INSERT INTO grades (user_id, course_id, label, grade, weight) VALUES (?, ?, ?, ?, ?)',
      )
      .run(req.userId, d.course_id, d.label, d.grade, d.weight);
    res.status(201).json(db.prepare('SELECT * FROM grades WHERE id = ?').get(lastInsertRowid));
  });

  router.delete('/:id', (req, res) => {
    const g = findOwned(db, 'grades', req.params.id, req.userId);
    db.prepare('DELETE FROM grades WHERE id = ?').run(g.id);
    res.status(204).end();
  });

  return router;
}
