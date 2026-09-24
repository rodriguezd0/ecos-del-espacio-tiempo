// Variantes «bosque denso» de las unidades de árbol de los tilesets exteriores de Añil.
//
// En los tilesets exteriores de Añil (Exterior1/2/3, Safari, Bosque Celeste, Prisma) la unidad de bosque son
// dos árboles apilados de 2×6 tiles (redondos en las columnas 0–1, pinos en las 2–3, filas 39–44). Entre ambos
// árboles, y en el tronco del de arriba cuando hay otro debajo, el arte trae píxeles de césped en sombra: en un
// bosque denso se leen como una franja que "corta" cada árbol por la mitad. Esta herramienta genera copias de las
// filas 40–43 de esas unidades con el césped en sombra repintado con el follaje más oscuro del propio árbol, las
// añade AL FINAL de cada atlas (tras `tileCount`) con la misma pasabilidad/prioridad/terrain tag que el original y
// escribe el mapa original→denso en game/src/content/stamps/forestDense.js (lo usa el pincel `forest`).
// Idempotente: reescribe siempre las mismas casillas (guardadas en tilesets.json → forestDense.base).
// Se ejecuta al final de `npm run data`.   Uso: node tools/forest_dense.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = path.join(ROOT, 'game', 'data', 'tilesets.json');
const ATLAS_DIR = path.join(ROOT, 'game', 'assets', 'tilesets');
const OUT_MODULE = path.join(ROOT, 'game', 'src', 'content', 'stamps', 'forestDense.js');
const CHECK = process.argv.includes('--check');

/** Tilesets exteriores con la misma disposición de árboles (ver content/stamps/derive.js). */
const EXTERIOR_TILESETS = [1, 3, 5, 6, 7, 9];
/** Unidades de bosque: columna izquierda de cada unidad de 2 columnas, filas 39–44 del tileset original. */
const UNIT_COLS = [0, 2];
const UNIT_ROW = 39;
const DENSE_ROWS = [40, 41, 42, 43];
const ORIGINAL_COLUMNS = 8;

const origId = (col, row) => FIRST_REGULAR_TILE + row * ORIGINAL_COLUMNS + col;

/** ¿Césped en sombra? Verdes apagados (rojo alto, poca distancia verde-rojo) frente al follaje saturado. */
function isShadowGrass(r, g, b) {
  return r >= 60 && b >= 60 && g > r && g - r < 100;
}

function tileOffset(id) {
  const t = id - FIRST_REGULAR_TILE;
  return { x: (t % ATLAS_COLUMNS) * TILE, y: Math.floor(t / ATLAS_COLUMNS) * TILE };
}

function readTile(png, id) {
  const { x, y } = tileOffset(id);
  const out = Buffer.alloc(TILE * TILE * 4);
  for (let j = 0; j < TILE; j++) png.data.copy(out, j * TILE * 4, ((y + j) * png.width + x) * 4, ((y + j) * png.width + x + TILE) * 4);
  return out;
}

function writeTile(png, id, data) {
  const { x, y } = tileOffset(id);
  for (let j = 0; j < TILE; j++) data.copy(png.data, ((y + j) * png.width + x) * 4, j * TILE * 4, (j + 1) * TILE * 4);
}

/** Color de follaje más oscuro y frecuente de la unidad (se usa para rellenar el césped en sombra). */
function darkestFoliage(png, col) {
  const counts = new Map();
  for (let row = UNIT_ROW; row < UNIT_ROW + 6; row++) {
    for (let dc = 0; dc < 2; dc++) {
      const tile = readTile(png, origId(col + dc, row));
      for (let i = 0; i < tile.length; i += 4) {
        const [r, g, b, a] = [tile[i], tile[i + 1], tile[i + 2], tile[i + 3]];
        if (a !== 255 || isShadowGrass(r, g, b) || g <= r) continue; // descarta césped y marrones del tronco
        const k = (r << 16) | (g << 8) | b;
        counts.set(k, (counts.get(k) || 0) + 1);
      }
    }
  }
  const frequent = [...counts.entries()].filter(([, n]) => n >= 40);
  if (!frequent.length) return null;
  const lum = (k) => 0.3 * (k >> 16) + 0.59 * ((k >> 8) & 255) + 0.11 * (k & 255);
  frequent.sort((a, b) => lum(a[0]) - lum(b[0]));
  const k = frequent[0][0];
  return [k >> 16, (k >> 8) & 255, k & 255];
}

function denseTile(src, [fr, fg, fb]) {
  const out = Buffer.from(src);
  let changed = 0;
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue;
    if (!isShadowGrass(out[i], out[i + 1], out[i + 2])) continue;
    out[i] = fr; out[i + 1] = fg; out[i + 2] = fb; out[i + 3] = 255;
    changed += 1;
  }
  return { out, changed };
}

function ensureHeight(png, rows) {
  const needed = rows * TILE;
  if (png.height >= needed) return png;
  const bigger = new PNG({ width: png.width, height: needed });
  bigger.data.fill(0);
  png.data.copy(bigger.data, 0, 0, png.data.length);
  return bigger;
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const byImage = new Map();
for (const id of EXTERIOR_TILESETS) {
  const ts = db.tilesets[id];
  if (!ts) continue;
  if (!byImage.has(ts.image)) byImage.set(ts.image, []);
  byImage.get(ts.image).push(ts);
}

const denseMap = {};
let pending = false;
for (const [image, sets] of byImage) {
  const file = path.join(ATLAS_DIR, `${image}.png`);
  let png = PNG.sync.read(fs.readFileSync(file));
  const first = sets[0];
  const base = first.forestDense?.base ?? first.tileCount;
  const map = {};
  let slot = 0;
  for (const col of UNIT_COLS) {
    const color = darkestFoliage(png, col);
    if (!color) continue;
    for (const row of DENSE_ROWS) {
      for (let dc = 0; dc < 2; dc++) {
        const orig = origId(col + dc, row);
        const { out, changed } = denseTile(readTile(png, orig), color);
        if (!changed) continue; // sin césped que repintar: el pincel usa el original
        const dense = FIRST_REGULAR_TILE + base + slot;
        slot += 1;
        map[orig] = dense;
        png = ensureHeight(png, Math.ceil((base + slot) / ATLAS_COLUMNS));
        const current = readTile(png, dense);
        if (!current.equals(out)) {
          pending = true;
          if (!CHECK) writeTile(png, dense, out);
        }
      }
    }
  }
  const tileCount = base + slot;
  for (const ts of sets) {
    const before = JSON.stringify([ts.tileCount, ts.forestDense]);
    ts.tileCount = Math.max(ts.tileCount, tileCount);
    ts.atlasHeight = png.height;
    ts.forestDense = { base, map };
    for (const [o, d] of Object.entries(map)) {
      ts.passages[d] = ts.passages[o];
      ts.priorities[d] = ts.priorities[o];
      ts.terrainTags[d] = ts.terrainTags[o];
    }
    if (JSON.stringify([ts.tileCount, ts.forestDense]) !== before) pending = true;
    denseMap[ts.id] = map;
  }
  if (!CHECK) fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`${image}: ${slot} tiles densos (desde el índice ${base})`);
}

const moduleText = `// GENERADO por tools/forest_dense.mjs — no editar a mano.
// Tile original → variante «bosque denso» (sin césped en sombra) por id de tileset. Lo usa el pincel forest.
export const FOREST_DENSE = ${JSON.stringify(denseMap)};
`;
const moduleStale = !fs.existsSync(OUT_MODULE) || fs.readFileSync(OUT_MODULE, 'utf8') !== moduleText;
if (CHECK) {
  if (pending || moduleStale) {
    console.error('Las variantes de bosque denso no están al día: ejecuta node tools/forest_dense.mjs');
    process.exitCode = 1;
  } else console.log('Bosque denso al día.');
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
  fs.writeFileSync(OUT_MODULE, moduleText);
  console.log(`tilesets.json y ${path.relative(ROOT, OUT_MODULE)} actualizados`);
}
