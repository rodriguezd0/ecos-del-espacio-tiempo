// Esquinas cóncavas de la playa de borde doble de Añil (pincel `playa`, bloque 5×5 en la columna 0, fila 366 de los
// tilesets exteriores). Añil solo trae la playa convexa: en una esquina cóncava el pincel ponía arena lisa y la espuma
// se cortaba en seco. Esta herramienta genera, para cada una de las 4 orientaciones, un bloque de 2×2 tiles en el que
// cada píxel toma el color del borde recto (perfil de 2 tiles: espuma + arena mojada) a la misma distancia de la
// esquina del agua, mezclando el perfil horizontal y el vertical según el ángulo: la espuma dobla la esquina en curva.
// Los tiles van AL FINAL de cada atlas (tras `tileCount`, base en tilesets.json → beachCorners.base) con la
// pasabilidad del centro de la playa, y el mapa por orientación se escribe en game/src/content/stamps/beachCorners.js
// (lo usa el pincel edge2). Idempotente. Se ejecuta en `npm run data` después de forest_dense.
// Uso: node tools/beach_corners.mjs [--check]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { ATLAS_COLUMNS, TILE, FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';
import { origId, readTile, writeTile, ensureHeight, copyTileProps } from './lib/atlas_tiles.mjs';
import { EXTRA_LAYOUTS } from '../game/src/content/stamps/extraTiles.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_FILE = path.join(ROOT, 'game', 'data', 'tilesets.json');
const ATLAS_DIR = path.join(ROOT, 'game', 'assets', 'tilesets');
const OUT_MODULE = path.join(ROOT, 'game', 'src', 'content', 'stamps', 'beachCorners.js');
const CHECK = process.argv.includes('--check');

const EXTERIOR_TILESETS = [1, 3, 5, 6, 7, 9];
/** Esquina superior izquierda del bloque 5×5 de la playa (disposición original de 8 columnas). */
const SRC = [0, 366];
const BAND = TILE * 2;
/** Terrain tag Sand de Essentials (world/terrain.js). */
const SAND_TERRAIN = 3;
/** Orientaciones: lado del agua respecto a la casilla (sx, sy). */
const QUADRANTS = [[-1, 1], [1, 1], [-1, -1], [1, -1]];

const blockId = (col, row) => origId(SRC[0] + col, SRC[1] + row);

/** Perfil del borde recto: (d = distancia al agua en px desde 0, t = coordenada tangencial 0..31) → RGBA. */
function edgeProfile(png, side) {
  const tiles = {
    S: [blockId(2, 3), blockId(2, 4)], N: [blockId(2, 1), blockId(2, 0)],
    W: [blockId(1, 2), blockId(0, 2)], E: [blockId(3, 2), blockId(4, 2)],
  }[side].map((id) => readTile(png, id));
  // tiles[0] = banda interior (más lejos del agua), tiles[1] = exterior (toca el agua).
  return (d, t) => {
    const k = Math.min(BAND - 1, Math.max(0, Math.floor(d)));
    const tile = k < TILE ? tiles[1] : tiles[0];
    const depth = k % TILE; // 0 = pegado al lado del agua de ese tile
    let x; let y;
    if (side === 'S') { x = t; y = TILE - 1 - depth; }
    else if (side === 'N') { x = t; y = depth; }
    else if (side === 'W') { x = depth; y = t; }
    else { x = TILE - 1 - depth; y = t; }
    const i = (y * TILE + x) * 4;
    return [tile[i], tile[i + 1], tile[i + 2], tile[i + 3]];
  };
}

/** Bloque 2×2 de la esquina cóncava con el agua en (sx, sy) → 4 tiles RGBA en orden i + 2·j (i, j = 0..1). */
function cornerTiles(png, sx, sy) {
  const vertical = edgeProfile(png, sy > 0 ? 'S' : 'N');
  const horizontal = edgeProfile(png, sx < 0 ? 'W' : 'E');
  const center = readTile(png, blockId(2, 2));
  const out = [];
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 2; i++) {
      const tile = Buffer.alloc(TILE * TILE * 4);
      for (let v = 0; v < TILE; v++) {
        for (let u = 0; u < TILE; u++) {
          const dx = i * TILE + (sx < 0 ? u : TILE - 1 - u) + 0.5;
          const dy = j * TILE + (sy > 0 ? TILE - 1 - v : v) + 0.5;
          const d = Math.hypot(dx, dy);
          const o = (v * TILE + u) * 4;
          if (d >= BAND) { center.copy(tile, o, o, o + 4); continue; }
          // Junto al lado horizontal del bloque manda el perfil vertical y al revés; en medio, mezcla por ángulo.
          const w = Math.atan2(dy, dx) / (Math.PI / 2);
          const a = vertical(d, u);
          const b = horizontal(d, v);
          for (let c = 0; c < 4; c++) tile[o + c] = Math.round(a[c] * w + b[c] * (1 - w));
        }
      }
      out.push(tile);
    }
  }
  return out;
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const byImage = new Map();
for (const id of EXTERIOR_TILESETS) {
  const ts = db.tilesets[id];
  if (!ts) continue;
  if (!byImage.has(ts.image)) byImage.set(ts.image, []);
  byImage.get(ts.image).push(ts);
}

const cornerMap = {};
let pending = false;
for (const [image, sets] of byImage) {
  const file = path.join(ATLAS_DIR, `${image}.png`);
  let png = PNG.sync.read(fs.readFileSync(file));
  const first = sets[0];
  const layout = EXTRA_LAYOUTS[image];
  const overlayEnd = layout ? (layout.row + layout.rows) * 8 : 0;
  const base = first.beachCorners?.base >= overlayEnd
    ? first.beachCorners.base
    : Math.max(overlayEnd, ...sets.map((s) => s.tileCount));
  const map = {};
  let slot = 0;
  for (const [sx, sy] of QUADRANTS) {
    const ids = [];
    for (const tile of cornerTiles(png, sx, sy)) {
      const id = FIRST_REGULAR_TILE + base + slot;
      slot += 1;
      png = ensureHeight(png, Math.ceil((base + slot) / ATLAS_COLUMNS));
      if (!readTile(png, id).equals(tile)) {
        pending = true;
        if (!CHECK) writeTile(png, id, tile);
      }
      ids.push(id);
    }
    map[`${sx},${sy}`] = ids;
  }
  for (const ts of sets) {
    const before = JSON.stringify([ts.tileCount, ts.beachCorners]);
    ts.tileCount = Math.max(ts.tileCount, base + slot);
    ts.atlasHeight = png.height;
    ts.beachCorners = { base, map };
    for (const ids of Object.values(map)) {
      for (const id of ids) {
        copyTileProps(ts, blockId(2, 2), id);
        // Bajo la esquina queda agua (capa 0) para que se vea en su hueco: sin tag propio la casilla contaría como mar
        // y se podría «nadar» en plena arena. Arena (3) la deja en tierra.
        ts.terrainTags[id] = SAND_TERRAIN;
      }
    }
    if (JSON.stringify([ts.tileCount, ts.beachCorners]) !== before) pending = true;
    cornerMap[ts.id] = map;
  }
  if (!CHECK) fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`${image}: ${slot} tiles de esquina cóncava (desde el índice ${base})`);
}

const moduleText = `// GENERADO por tools/beach_corners.mjs — no editar a mano.
// Esquinas cóncavas de la playa (pincel edge2 con src [${SRC}]) por id de tileset: "sx,sy" (lado del agua) →
// 4 ids en orden i + 2·j (i, j = distancia en casillas a la esquina del agua − 1).
export const BEACH_CORNER_SRC = ${JSON.stringify(SRC)};
export const BEACH_CORNERS = ${JSON.stringify(cornerMap)};
`;
const moduleStale = !fs.existsSync(OUT_MODULE) || fs.readFileSync(OUT_MODULE, 'utf8') !== moduleText;
if (CHECK) {
  if (pending || moduleStale) {
    console.error('Las esquinas de playa no están al día: ejecuta node tools/beach_corners.mjs');
    process.exitCode = 1;
  } else console.log('Esquinas de playa al día.');
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
  fs.writeFileSync(OUT_MODULE, moduleText);
  console.log(`tilesets.json y ${path.relative(ROOT, OUT_MODULE)} actualizados`);
}
