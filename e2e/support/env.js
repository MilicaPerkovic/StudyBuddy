import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export const ROOT = root;
export const E2E_PORT = Number(process.env.E2E_PORT) || 3101;
// Ločena testna baza (kot manual-test.db pri ročnem testiranju); privzeta studybuddy.db ostane nedotaknjena.
export const E2E_DB_FILE = path.join(root, 'server', 'data', 'e2e-test.db');
