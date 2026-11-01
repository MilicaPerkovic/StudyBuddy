// S0 iz testnih primerov: vsak test se začne nad znanim stanjem baze.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createDb } from '../../server/src/db.js';
import { E2E_DB_FILE, ROOT } from './env.js';

/**
 * Izprazni testno bazo (vse uporabnike in z njimi povezane podatke) in ponastavi števce ID,
 * nato zažene seed. Rezultat je enak sveži bazi iz koraka S0 (zapisek »Piramida testiranja« ima ID 1).
 */
export function resetDatabase() {
  const db = createDb(E2E_DB_FILE);
  db.exec('DELETE FROM users; DELETE FROM sqlite_sequence;');
  db.close();
  execFileSync(process.execPath, [path.join(ROOT, 'server', 'src', 'seed.js')], {
    env: { ...process.env, DB_FILE: E2E_DB_FILE },
    stdio: 'pipe',
  });
}
