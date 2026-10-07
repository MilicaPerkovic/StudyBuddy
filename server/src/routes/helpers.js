import { z } from 'zod';
import { HttpError } from '../errors.js';

export const idParam = z.coerce.number().int().positive();

/** Loads a row from `table` that belongs to `userId`, or throws 404. */
export function findOwned(db, table, id, userId) {
  const parsedId = idParam.safeParse(id);
  if (!parsedId.success) throw new HttpError(404, 'Not found');
  const row = db
    .prepare(`SELECT * FROM ${table} WHERE id = ? AND user_id = ?`)
    .get(parsedId.data, userId);
  if (!row) throw new HttpError(404, 'Not found');
  return row;
}

/** Ensures the course exists and belongs to the user (throws 400 otherwise). */
export function assertCourse(db, courseId, userId) {
  const row = db
    .prepare('SELECT id FROM courses WHERE id = ? AND user_id = ?')
    .get(courseId, userId);
  if (!row)
    throw new HttpError(400, 'Validation failed', [
      { field: 'course_id', message: 'Course does not exist' },
    ]);
}

/** Builds `SET a = ?, b = ?` and the matching values for a partial update. */
export function buildUpdate(data) {
  const keys = Object.keys(data);
  return {
    sql: keys.map((k) => `${k} = ?`).join(', '),
    values: keys.map((k) => data[k]),
  };
}

/** Any parseable date string, normalised to a full ISO string so SQL string comparisons work. */
export const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'Invalid date' })
  .transform((s) => new Date(s).toISOString());
