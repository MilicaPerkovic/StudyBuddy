import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { HttpError, errorHandler } from './errors.js';
import { requireAuth } from './middleware/auth.js';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { assignmentsRouter } from './routes/assignments.js';
import { sessionsRouter } from './routes/sessions.js';
import { notesRouter } from './routes/notes.js';
import { gradesRouter } from './routes/grades.js';
import { dashboardRouter } from './routes/dashboard.js';

/** Builds the Express app around a given database (lets tests use an in-memory DB). */
export function createApp(db) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
  app.use('/api/auth', authRouter(db));
  app.use('/api/courses', requireAuth, coursesRouter(db));
  app.use('/api/assignments', requireAuth, assignmentsRouter(db));
  app.use('/api/sessions', requireAuth, sessionsRouter(db));
  app.use('/api/notes', requireAuth, notesRouter(db));
  app.use('/api/grades', requireAuth, gradesRouter(db));
  app.use('/api/dashboard', requireAuth, dashboardRouter(db));
  app.use('/api', (req, res, next) => next(new HttpError(404, 'Not found')));

  // In production the built React app is served by the same server.
  if (fs.existsSync(config.clientDist)) {
    app.use(express.static(config.clientDist));
    app.get('/{*splat}', (req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
