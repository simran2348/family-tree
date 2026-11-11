// Creates server/db.json the first time the backend starts.
// The app fills it with your trees and settings on its first save.
import { existsSync, writeFileSync } from 'node:fs';

const file = new URL('./db.json', import.meta.url);
if (!existsSync(file)) {
  writeFileSync(file, `${JSON.stringify({ trees: [], app: {}, settings: {} }, null, 2)}\n`);
  console.log('Created server/db.json');
}
