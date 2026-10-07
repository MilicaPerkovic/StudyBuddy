import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { createDb } from './db.js';
import { createApp } from './app.js';

fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
const db = createDb(config.dbFile);
const app = createApp(db);

app.listen(config.port, () => {
  console.log(`StudyBuddy API listening on http://localhost:${config.port}`);
});
