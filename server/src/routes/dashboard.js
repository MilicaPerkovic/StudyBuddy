import { Router } from 'express';
import { daysUntil, minutesPerDay, startOfWeek } from '../services/stats.js';

export function dashboardRouter(db) {
  const router = Router();

  router.get('/', (req, res) => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    const open = db
      .prepare(
        `SELECT a.id, a.title, a.type, a.due_date, a.priority, a.status,
                c.name AS course_name, c.color AS course_color
         FROM assignments a JOIN courses c ON c.id = a.course_id
         WHERE a.user_id = ? AND a.status != 'done'
         ORDER BY a.due_date ASC`,
      )
      .all(req.userId)
      .map((a) => ({ ...a, days_left: daysUntil(a.due_date, now) }));

    const sessions = db
      .prepare(
        'SELECT started_at, duration_minutes FROM study_sessions WHERE user_id = ? AND started_at >= ? AND started_at < ?',
      )
      .all(req.userId, weekStart.toISOString(), weekEnd.toISOString());

    const perDay = minutesPerDay(sessions, weekStart);
    const counts = db
      .prepare(
        `SELECT
           (SELECT COUNT(*) FROM courses WHERE user_id = ?) AS courses,
           (SELECT COUNT(*) FROM assignments WHERE user_id = ? AND status = 'done') AS done`,
      )
      .get(req.userId, req.userId);

    res.json({
      upcoming: open.filter((a) => a.days_left >= 0).slice(0, 5),
      overdue: open.filter((a) => a.days_left < 0),
      open_count: open.length,
      done_count: counts.done,
      course_count: counts.courses,
      week: { start: weekStart.toISOString().slice(0, 10), per_day: perDay },
      week_minutes: perDay.reduce((s, d) => s + d.minutes, 0),
    });
  });

  return router;
}
