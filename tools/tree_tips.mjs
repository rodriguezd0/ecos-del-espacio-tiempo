// Puntas de copa «selladas»: copias exactas de la fila de arriba del todo de cada árbol de bosque (grande y pequeño)
// con pasaje 0x0F (bloquea) y la misma prioridad. Las usa world/treeTips.js para cerrar una punta que tiene algo
// encima (otro árbol, un obstáculo, un evento, el borde) sin necesitar una capa libre para el tile invisible 503.
// Los tiles van AL FINAL de cada atlas exterior (base guardada en tilesets.json → sealedTips.base; mapa punta→copia
// en sealedTips.map). Idempotente. Se ejecuta al final de `npm run data`.   Uso: node tools/tree_tips.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { ATLAS_COLUMNS, FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';
import { SMALL_TREES } from '../game/src/content/stamps/forest.js';
import { origId, readTile, writeTile, ensureHeight } from './lib/atlas_tiles.mjs';
import { EXTRA_LAYOUTS } from '../game/src/content/stamps/extraTiles.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = path.join(ROOT, 'game', 'data', 'tilesets.json');
const ATLAS_DIR = path.join(ROOT, 'game', 'assets', 'tilesets');
const CHECK = process.argv.includes('--check');
const EXTERIOR_TILESETS = [1, 3, 5, 6, 7, 9];
export const BLOCK = 0x0f;

/** Puntas de copa candidatas (2 tiles por árbol): árboles de bosque y sus pequeños (content/stamps/forest.js). */
function tipTiles() {
  const out = [];
  for (const [key, small] of Object.entries(SMALL_TREES)) {
    const [x, y] = key.split(',').map(Number);
    for (const [cx, cy] of [[x, y], small]) for (let dx = 0; dx < 2; dx++) out.push(origId(cx + dx, cy));
  }
  return [...new Set(out)];
}

const hasPixels = (buf) => { for (let i = 3; i < buf.length; i += 4) if (buf[i]) return true; return false; };

function main() {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const byImage = new Map();
  for (const id of EXTERIOR_TILESETS) {
    const ts = db.tilesets[id];
    if (!ts) continue;
    if (!byImage.has(ts.image)) byImage.set(ts.image, []);
    byImage.get(ts.image).push(ts);
  }
  let pending = false;
  for (const [image, sets] of byImage) {
    const file = path.join(ATLAS_DIR, `${image}.png`);
    let png = PNG.sync.read(fs.readFileSync(file));
    const first = sets[0];
    const layout = EXTRA_LAYOUTS[image];
    const overlayEnd = layout ? (layout.row + layout.rows) * 8 : 0;
    const base = first.sealedTips?.base >= overlayEnd
      ? first.sealedTips.base
      : Math.max(overlayEnd, ...sets.map((s) => s.tileCount));
    const map = {};
    let slot = 0;
    for (const tip of tipTiles()) {
      if (tip - FIRST_REGULAR_TILE >= base) continue;
      const art = readTile(png, tip);
      // solo puntas reales: con dibujo y transitables en el tileset original
      if (!hasPixels(art) || (first.passages[tip] & 0x0f) === 0x0f) continue;
      const twin = FIRST_REGULAR_TILE + base + slot;
      slot += 1;
      map[tip] = twin;
      png = ensureHeight(png, Math.ceil((base + slot) / ATLAS_COLUMNS));
      if (!readTile(png, twin).equals(art)) {
        pending = true;
        if (!CHECK) writeTile(png, twin, art);
      }
    }
    for (const ts of sets) {
      const before = JSON.stringify([ts.tileCount, ts.sealedTips, ...Object.values(map).map((t) => ts.passages[t])]);
      ts.tileCount = Math.max(ts.tileCount, base + slot);
      ts.atlasHeight = png.height;
      ts.sealedTips = { base, map };
      for (const [tip, twin] of Object.entries(map)) {
        ts.passages[twin] = BLOCK;
        ts.priorities[twin] = ts.priorities[tip];
        ts.terrainTags[twin] = ts.terrainTags[tip];
      }
      if (JSON.stringify([ts.tileCount, ts.sealedTips, ...Object.values(map).map((t) => ts.passages[t])]) !== before) pending = true;
    }
    if (!CHECK) fs.writeFileSync(file, PNG.sync.write(png));
    console.log(`${image}: ${slot} puntas selladas (desde el índice ${base})`);
  }
  if (CHECK) {
    if (pending) {
      console.error('Las puntas selladas no están al día: ejecuta node tools/tree_tips.mjs');
      process.exitCode = 1;
    } else console.log('Puntas selladas al día.');
    return;
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
  console.log(`→ ${path.relative(ROOT, DB_FILE)} actualizado`);
}

main();
