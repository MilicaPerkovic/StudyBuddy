import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { HttpError } from '../errors.js';

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });
}

/** Requires a valid `Authorization: Bearer <token>` header and sets `req.userId`. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Missing or invalid Authorization header'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.userId = Number(payload.sub);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
