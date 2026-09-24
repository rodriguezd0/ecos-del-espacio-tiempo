// Construcción de mapas de Axis en Node (sin navegador) con las mismas piezas que el juego:
// MapBuilder + biblioteca de stamps + tiles vacíos del atlas + mapas de Añil para stamps `from`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { buildMap, createEntry } from '../../game/src/world/mapLoader.js';
import { computeEmptyTiles, emptinessChecker } from '../../game/src/world/tileEmptiness.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GAME = path.join(ROOT, 'game');
const emptyCache = new Map();

export function tilesetDB() {
  return JSON.parse(fs.readFileSync(path.join(GAME, 'data', 'tilesets.json'), 'utf8'));
}

export function isEmptyFor(tileset) {
  if (!emptyCache.has(tileset.image)) {
    const png = PNG.sync.read(fs.readFileSync(path.join(GAME, 'assets', 'tilesets', `${tileset.image}.png`)));
    emptyCache.set(tileset.image, emptinessChecker(computeEmptyTiles(png.data, png.width, tileset.tileCount)));
  }
  return emptyCache.get(tileset.image);
}

export function anilMapLoader(id) {
  const file = path.join(ROOT, 'tools', 'cache', 'anil_maps', `${String(id).padStart(3, '0')}.json`);
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

/** Biblioteca de stamps (tolerante) + pintor de brushes. */
export async function loadLibrary(tilesetId) {
  let library = null;
  let paintBrush = null;
  try {
    const mod = await import(pathToFileURL(path.join(GAME, 'src', 'content', 'stamps', 'index.js')).href);
    library = await mod.loadStampLibrary(tilesetId);
  } catch (err) {
    console.warn(`(sin biblioteca de stamps para ${tilesetId}: ${err.message})`);
  }
  try {
    paintBrush = (await import(pathToFileURL(path.join(GAME, 'src', 'content', 'stamps', 'brushes.js')).href)).paintBrush;
  } catch { /* opcional */ }
  return { library, paintBrush };
}

export async function loadMapDef(id) {
  const { loadMapDefinition } = await import(pathToFileURL(path.join(GAME, 'src', 'content', 'maps', 'index.js')).href);
  return loadMapDefinition(id);
}

/** Construye un mapa por id → { def, built, entry, tileset, warnings } */
export async function buildMapNode(id, { useLibrary = true } = {}) {
  const def = await loadMapDef(id);
  const db = tilesetDB();
  const tileset = db.tilesets[def.tileset];
  if (!tileset) throw new Error(`Tileset ${def.tileset} inexistente`);
  const warnings = [];
  const lib = useLibrary ? await loadLibrary(def.tileset) : { library: null, paintBrush: null };
  const built = buildMap(def, {
    library: lib.library || undefined,
    paintBrush: lib.paintBrush,
    isEmpty: isEmptyFor(tileset),
    anilMap: anilMapLoader,
    warn: (m) => warnings.push(m),
  });
  return { def, built, entry: createEntry(def, built, tileset), tileset, warnings };
}
