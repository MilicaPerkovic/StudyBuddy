import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  dbFile: process.env.DB_FILE || path.join(here, '..', 'data', 'studybuddy.db'),
  clientDist: path.join(here, '..', '..', 'client', 'dist'),
};
