// Overlay de tiles propios: escribe las piezas de game/src/content/stamps/extraTiles.js en las filas VACÍAS
// de los atlas reempaquetados (game/assets/tilesets/<Imagen>.png) y fija su pasabilidad, prioridad y terrain
// tag en game/data/tilesets.json para todos los tilesets que usan esa imagen. Idempotente.
// Se ejecuta al final de `npm run data` (que regenera atlas y tilesets.json desde Añil).
//
// También aplica las correcciones de pasabilidad de tiles de Añil (content/stamps/passPatches.js: rocas, flores).
//
// Uso: node tools/stamps_extra.mjs [Imagen ...] [--check] [--pass-only]
//   --check      no escribe: comprueba que el overlay está aplicado (sale con código 1 si no).
//   --pass-only  solo las correcciones de pasabilidad (no toca los atlas).
// Hoja de referencia: tools/cache/stamps/extra/<Imagen>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { EXTRA_LAYOUTS, EXTRA_PIECES, extraTiles, validateLayout, terrainPatchCells } from '../game/src/content/stamps/extraTiles.js';
import { passPatchCells } from '../game/src/content/stamps/passPatches.js';
import { regularTileAtlasPos, FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';
import { drawKitPiece, hasKitArt } from './stamps_extra_art.mjs';
import { drawTerrain, hasTerrainArt } from './stamps_extra_terrain.mjs';
import { ROOT, originalTileset, isEmptyTile } from './stamps_lib.mjs';
import { drawText, fillRect } from './stamps_font.mjs';

const T = 32;
const ATLAS_DIR = path.join(ROOT, 'game', 'assets', 'tilesets');
const DB_FILE = path.join(ROOT, 'game', 'data', 'tilesets.json');
const SHEET_DIR = path.join(ROOT, 'tools', 'cache', 'stamps', 'extra');

/** Calco de w×h tiles de una imagen ORIGINAL de Añil (`copy` de la pieza), ya a 32 px/tile. */
function copiedArt(piece, name) {
  const { image, src: [col, row] } = piece.copy;
  const png = originalTileset(image);
  const w = piece.w * T; const h = piece.h * T;
  const x0 = col * T; const y0 = row * T;
  if (col < 0 || col + piece.w > 8 || y0 + h > png.height) throw new Error(`Pieza "${name}": copy fuera de ${image}`);
  const data = Buffer.alloc(w * h * 4);
  for (let j = 0; j < h; j++) png.data.copy(data, j * w * 4, ((y0 + j) * png.width + x0) * 4, ((y0 + j) * png.width + x0 + w) * 4);
  return { w, h, data };
}

const artCache = new Map();
/** Arte a 32 px/tile (nativo ×2, o calco directo de otra imagen de Añil) de una pieza. */
export function pieceArt(name) {
  if (!artCache.has(name)) {
    const piece = EXTRA_PIECES[name];
    let img;
    if (piece?.copy) img = copiedArt(piece, name);
    else if (hasKitArt(name)) img = drawKitPiece(name).scale(2);
    else if (hasTerrainArt(name)) img = drawTerrain(name).scale(2);
    else throw new Error(`Pieza "${name}" sin arte (copy, stamps_extra_art / stamps_extra_terrain)`);
    artCache.set(name, img);
  }
  return artCache.get(name);
}

const regionIds = (layout) => {
  const out = [];
  for (let r = layout.row; r < layout.row + layout.rows; r++) for (let c = 0; c < 8; c++) out.push(FIRST_REGULAR_TILE + r * 8 + c);
  return out;
};

function checkFreeRows(image, layout) {
  const png = originalTileset(image);
  const used = regionIds(layout).filter((id) => !isEmptyTile(png, id));
  if (used.length) throw new Error(`${image}: las filas ${layout.row}..${layout.row + layout.rows - 1} no están vacías en Añil (${used.length} tiles)`);
}

const clearTile = (png, id) => {
  const { x, y } = regularTileAtlasPos(id);
  for (let j = 0; j < T; j++) png.data.fill(0, ((y + j) * png.width + x) * 4, ((y + j) * png.width + x + T) * 4);
};

function copyTile(png, id, art, sx, sy) {
  const { x, y } = regularTileAtlasPos(id);
  let opaque = 0;
  for (let j = 0; j < T; j++) {
    for (let i = 0; i < T; i++) {
      const s = ((sy + j) * art.w + sx + i) * 4;
      const d = ((y + j) * png.width + x + i) * 4;
      for (let k = 0; k < 4; k++) png.data[d + k] = art.data[s + k];
      if (art.data[s + 3]) opaque++;
    }
  }
  return opaque;
}

function tileMatches(png, id, art, sx, sy) {
  const { x, y } = regularTileAtlasPos(id);
  for (let j = 0; j < T; j++) {
    for (let i = 0; i < T; i++) {
      const s = ((sy + j) * art.w + sx + i) * 4;
      const d = ((y + j) * png.width + x + i) * 4;
      for (let k = 0; k < 4; k++) if (png.data[d + k] !== art.data[s + k]) return false;
    }
  }
  return true;
}

function sheetPreview(image, layout, atlas) {
  const W = 8 * T; const H = layout.rows * T;
  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = ((x >> 3) + (y >> 3)) & 1 ? 70 : 90;
      out.data.set([c, c, c + 8, 255], (y * W + x) * 4);
    }
  }
  regionIds(layout).forEach((id, n) => {
    const { x: ax, y: ay } = regularTileAtlasPos(id);
    const ox = (n % 8) * T; const oy = Math.floor(n / 8) * T;
    for (let j = 0; j < T; j++) {
      for (let i = 0; i < T; i++) {
        const s = ((ay + j) * atlas.width + ax + i) * 4;
        const a = atlas.data[s + 3] / 255;
        if (!a) continue;
        const d = ((oy + j) * W + ox + i) * 4;
        for (let k = 0; k < 3; k++) out.data[d + k] = Math.round(atlas.data[s + k] * a + out.data[d + k] * (1 - a));
      }
    }
  });
  for (const [name, [c, r]] of Object.entries(layout.pieces)) {
    drawText(out, c * T + 1, r * T + 1, name.replace(/^pilar_/, 'p_').slice(0, 14), [255, 255, 120, 255], [0, 0, 0, 255]);
  }
  fillRect(out, 0, 0, W, 1, [255, 0, 90, 255]);
  return out;
}

/** Aplica (o comprueba) el overlay de una imagen. Devuelve lista de problemas (vacía = bien). */
function processImage(image, db, { check }) {
  const layout = EXTRA_LAYOUTS[image];
  validateLayout(image);
  checkFreeRows(image, layout);
  const atlasFile = path.join(ATLAS_DIR, `${image}.png`);
  const atlas = PNG.sync.read(fs.readFileSync(atlasFile));
  const tiles = extraTiles(image);
  const problems = [];
  if (!check) for (const id of regionIds(layout)) clearTile(atlas, id);
  for (const t of tiles) {
    const art = pieceArt(t.name);
    if (check) {
      if (!tileMatches(atlas, t.id, art, t.dx * T, t.dy * T)) problems.push(`${image}: tile ${t.id} (${t.name}) no coincide con el arte`);
    } else if (!copyTile(atlas, t.id, art, t.dx * T, t.dy * T)) {
      throw new Error(`${image}: la celda ${t.dx},${t.dy} de "${t.name}" está vacía en el arte pero su 'pass' pide tile`);
    }
  }
  const byId = new Map(tiles.map((t) => [t.id, t]));
  const users = Object.values(db.tilesets).filter((ts) => ts.image === image);
  for (const ts of users) {
    for (const id of regionIds(layout)) {
      if (id >= ts.passages.length) throw new Error(`${image}: tile ${id} fuera de tilesets.json (${ts.passages.length})`);
      const t = byId.get(id);
      const want = { passage: t ? t.passage : 0, priority: t ? t.priority : 0, terrain: t ? t.terrain : 0 };
      if (check) {
        if (ts.passages[id] !== want.passage || ts.priorities[id] !== want.priority || ts.terrainTags[id] !== want.terrain) {
          problems.push(`tileset ${ts.id} (${image}): propiedades del tile ${id} desactualizadas`);
        }
      } else {
        ts.passages[id] = want.passage;
        ts.priorities[id] = want.priority;
        ts.terrainTags[id] = want.terrain;
      }
    }
    // correcciones de terrain en tiles de Añil (solo las celdas bloqueadas)
    for (const p of terrainPatchCells(image)) {
      if ((ts.passages[p.id] & 0x0f) !== 0x0f) continue;
      if (check && ts.terrainTags[p.id] !== p.terrain) problems.push(`tileset ${ts.id}: terrain de ${p.what} (${p.id}) sin corregir`);
      if (!check) ts.terrainTags[p.id] = p.terrain;
    }
  }
  if (!check) {
    fs.writeFileSync(atlasFile, PNG.sync.write(atlas));
    fs.mkdirSync(SHEET_DIR, { recursive: true });
    fs.writeFileSync(path.join(SHEET_DIR, `${image}.png`), PNG.sync.write(sheetPreview(image, layout, atlas)));
    console.log(`${image}: ${tiles.length} tiles propios en filas ${layout.row}..${layout.row + layout.rows - 1} → tilesets ${users.map((u) => u.id).join(', ')}`);
  }
  return problems;
}

/** Aplica (o comprueba) las correcciones de pasabilidad (content/stamps/passPatches.js) en todos los tilesets. */
function processPassPatches(db, { check }) {
  const problems = [];
  for (const ts of Object.values(db.tilesets)) {
    if (!ts?.passages) continue;
    for (const p of passPatchCells(ts)) {
      if (ts.passages[p.id] === p.passage) continue;
      if (check) problems.push(`tileset ${ts.id} (${ts.image}): pasaje de ${p.what} (${p.id}) sin corregir`);
      else ts.passages[p.id] = p.passage;
    }
  }
  return problems;
}

/** Comprueba sin escribir que el overlay está aplicado; devuelve la lista de problemas. */
export function checkOverlay(images = Object.keys(EXTRA_LAYOUTS)) {
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  return [...images.flatMap((image) => processImage(image, db, { check: true })), ...processPassPatches(db, { check: true })];
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const images = args.filter((a) => !a.startsWith('--'));
  const list = args.includes('--pass-only') ? [] : (images.length ? images : Object.keys(EXTRA_LAYOUTS));
  const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const problems = [];
  for (const image of list) {
    if (!EXTRA_LAYOUTS[image]) throw new Error(`Sin overlay definido para ${image}`);
    problems.push(...processImage(image, db, { check }));
  }
  problems.push(...processPassPatches(db, { check }));
  if (check) {
    if (problems.length) {
      console.error(`Overlay desactualizado (${problems.length}):\n  ${problems.slice(0, 20).join('\n  ')}\nEjecuta: node tools/stamps_extra.mjs`);
      process.exit(1);
    }
    console.log('Overlay al día.');
    return;
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db));
  console.log(`→ ${path.relative(ROOT, DB_FILE)} actualizado`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`stamps_extra: ${err.message}`);
    process.exit(1);
  }
}
