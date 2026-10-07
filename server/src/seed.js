// Fills the database with a demo user and sample data.
// Login: demo@studybuddy.si / demo1234
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { createDb } from './db.js';

fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
const db = createDb(config.dbFile);

const DAY = 24 * 60 * 60 * 1000;
const at = (days, hour = 12) => {
  const d = new Date(Date.now() + days * DAY);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};

db.prepare('DELETE FROM users WHERE email = ?').run('demo@studybuddy.si');
const userId = Number(
  db
    .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
    .run('demo@studybuddy.si', 'Demo Student', bcrypt.hashSync('demo1234', 10)).lastInsertRowid,
);

const addCourse = (name, code, ects, professor, color) =>
  Number(
    db
      .prepare(
        'INSERT INTO courses (user_id, name, code, ects, professor, color) VALUES (?, ?, ?, ?, ?, ?)',
      )
      .run(userId, name, code, ects, professor, color).lastInsertRowid,
  );

const zits = addCourse('Zanesljivost in testiranje IS', 'ZITS', 6, 'prof. dr. Novak', '#4f46e5');
const web = addCourse('Spletne tehnologije', 'ST', 6, 'doc. dr. Kranjc', '#0891b2');
const db2 = addCourse('Podatkovne baze II', 'PB2', 5, 'prof. dr. Horvat', '#16a34a');

const addAssignment = db.prepare(
  `INSERT INTO assignments (user_id, course_id, title, description, type, due_date, priority, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
);
addAssignment.run(
  userId,
  zits,
  '1. naloga - Izbira projekta',
  'Dokumentacija in stanje testiranja',
  'assignment',
  at(5),
  'high',
  'in_progress',
);
addAssignment.run(userId, zits, 'Kolokvij 1', '', 'exam', at(21, 9), 'high', 'todo');
addAssignment.run(
  userId,
  web,
  'React projekt',
  'SPA z avtentikacijo',
  'project',
  at(30),
  'medium',
  'todo',
);
addAssignment.run(userId, db2, 'SQL vaje', '', 'assignment', at(-2), 'low', 'todo');
addAssignment.run(userId, db2, 'Normalizacija', '', 'assignment', at(-10), 'medium', 'done');

const addSession = db.prepare(
  'INSERT INTO study_sessions (user_id, course_id, started_at, duration_minutes, note) VALUES (?, ?, ?, ?, ?)',
);
addSession.run(userId, zits, at(0, 9), 50, 'Pregled testnih tehnik');
addSession.run(userId, web, at(-1, 15), 90, 'React hooks');
addSession.run(userId, db2, at(-2, 10), 45, '');

const addNote = db.prepare(
  'INSERT INTO notes (user_id, course_id, title, content) VALUES (?, ?, ?, ?)',
);
addNote.run(userId, zits, 'Piramida testiranja', 'Enotski > integracijski > E2E testi.');
addNote.run(userId, web, 'useEffect', 'Pazi na seznam odvisnosti.');

const addGrade = db.prepare(
  'INSERT INTO grades (user_id, course_id, label, grade, weight) VALUES (?, ?, ?, ?, ?)',
);
addGrade.run(userId, db2, 'Kolokvij', 9, 50);
addGrade.run(userId, db2, 'Vaje', 10, 50);
addGrade.run(userId, web, 'Vaje', 8, 40);

console.log('Seeded demo data. Login: demo@studybuddy.si / demo1234');
