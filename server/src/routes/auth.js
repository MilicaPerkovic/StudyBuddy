import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { HttpError, validate } from '../errors.js';
import { requireAuth, signToken } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name });

export function authRouter(db) {
  const router = Router();

  router.post('/register', (req, res) => {
    const data = validate(registerSchema, req.body);
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
    if (exists) throw new HttpError(409, 'Email is already registered');

    const hash = bcrypt.hashSync(data.password, 10);
    const { lastInsertRowid } = db
      .prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)')
      .run(data.email, data.name, hash);
    const user = { id: Number(lastInsertRowid), email: data.email, name: data.name };
    res.status(201).json({ token: signToken(user), user });
  });

  router.post('/login', (req, res) => {
    const data = validate(loginSchema, req.body);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(data.email);
    if (!user || !bcrypt.compareSync(data.password, user.password_hash)) {
      throw new HttpError(401, 'Invalid email or password');
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  router.get('/me', requireAuth, (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
    if (!user) throw new HttpError(401, 'User no longer exists');
    res.json(publicUser(user));
  });

  return router;
}
