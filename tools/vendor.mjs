// Copia three.js (build ES module) a game/vendor para servirlo sin bundler.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'node_modules', 'three', 'build');
const DST = path.join(ROOT, 'game', 'vendor');
fs.mkdirSync(DST, { recursive: true });
for (const f of ['three.module.js', 'three.core.js']) {
  const src = path.join(SRC, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(DST, f));
    console.log(`vendor/${f}`);
  }
}
fs.copyFileSync(path.join(SRC, '..', 'LICENSE'), path.join(DST, 'LICENSE.three.txt'));
console.log('vendor/LICENSE.three.txt');
