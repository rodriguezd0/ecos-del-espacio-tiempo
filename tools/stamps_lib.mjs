// Utilidades Node para la biblioteca de stamps: carga de definiciones, horneado y validación.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPNG, getTilesetDB } from './lib/tile_render.mjs';
import { stampSignature, STAMP_LIBRARIES } from '../game/src/content/stamps/index.js';
import { FIRST_REGULAR_TILE, isAutotile, autotileSlot } from '../game/src/shared/autotile.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const STAMPS_DIR = path.join(ROOT, 'game', 'src', 'content', 'stamps');
export const BAKED_DIR = path.join(STAMPS_DIR, 'baked');
export const TILESET_DIR = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Tilesets');
export const MAPS_DIR = path.join(ROOT, 'tools', 'cache', 'anil_maps');
export const T = 32;

const mapCache = new Map();
export function loadAnilMap(id) {
  if (!mapCache.has(id)) {
    const file = path.join(MAPS_DIR, `${String(id).padStart(3, '0')}.json`);
    if (!fs.existsSync(file)) throw new Error(`Mapa de Añil ${id} no volcado (${file}); ejecuta tools/extract_anil_maps.mjs`);
    mapCache.set(id, JSON.parse(fs.readFileSync(file, 'utf8')));
  }
  return mapCache.get(id);
}

export function tilesetInfo(id) {
  const ts = getTilesetDB().tilesets[id];
  if (!ts) throw new Error(`Tileset ${id} inexistente en tilesets.json`);
  return ts;
}

export const originalTileset = (image) => loadPNG(path.join(TILESET_DIR, `${image}.png`));

/** ¿El tile normal `id` es completamente transparente en la imagen original? */
export function isEmptyTile(png, id) {
  if (id < FIRST_REGULAR_TILE) return id === 0;
  const t = id - FIRST_REGULAR_TILE;
  const x0 = (t % 8) * T; const y0 = Math.floor(t / 8) * T;
  if (y0 + T > png.height) return true;
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) if (png.data[((y0 + y) * png.width + x0 + x) * 4 + 3] !== 0) return false;
  }
  return true;
}

/** ¿El tile `id` es idéntico píxel a píxel en dos imágenes de tileset? */
export function sameTile(pngA, pngB, id) {
  if (id < FIRST_REGULAR_TILE) return true;
  const t = id - FIRST_REGULAR_TILE;
  const x0 = (t % 8) * T; const y0 = Math.floor(t / 8) * T;
  if (y0 + T > pngA.height || y0 + T > pngB.height) return false;
  for (let y = 0; y < T; y++) {
    const ia = ((y0 + y) * pngA.width + x0) * 4; const ib = ((y0 + y) * pngB.width + x0) * 4;
    for (let k = 0; k < T * 4; k++) if (pngA.data[ia + k] !== pngB.data[ib + k]) return false;
  }
  return true;
}

export async function loadStampDef(image) {
  const file = path.join(STAMPS_DIR, `${image}.js`);
  if (!fs.existsSync(file)) throw new Error(`No existe ${file}`);
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.default;
}

export async function loadBaked(image) {
  const file = path.join(BAKED_DIR, `${image}.js`);
  if (!fs.existsSync(file)) return null;
  const mod = await import(`${pathToFileURL(file).href}?t=${Date.now()}`);
  return mod.default;
}

export const libraryImages = () => Object.values(STAMP_LIBRARIES).map((e) => e.image);

const skipSet = (skip) => new Set((skip || []).map((s) => s.join(',')));

function bakeSrc(sdef, png) {
  const [sx, sy, w, h] = sdef.src;
  const layer = sdef.layer ?? 1;
  const skip = skipSet(sdef.skip);
  const grid = new Array(w * h).fill(0);
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) {
      const id = FIRST_REGULAR_TILE + (sy + dy) * 8 + sx + dx;
      if (skip.has(`${dx},${dy}`) || isEmptyTile(png, id)) continue;
      grid[dx + dy * w] = id;
    }
  }
  const layers = [null, null, null];
  layers[layer] = grid;
  return { w, h, layers };
}

function bakeFrom(sdef, png) {
  const f = sdef.from;
  const map = loadAnilMap(f.map);
  const { x, y, w, h } = f;
  if (x < 0 || y < 0 || x + w > map.width || y + h > map.height) {
    throw new Error(`recorte fuera del mapa ${f.map} (${map.width}x${map.height})`);
  }
  const srcLayers = f.layers || [0, 1, 2];
  const dest = f.to || srcLayers; // capa destino para cada capa origen
  const skip = skipSet(sdef.skip);
  const layers = [null, null, null];
  srcLayers.forEach((sl, i) => {
    const grid = new Array(w * h).fill(0);
    let any = false;
    for (let dy = 0; dy < h; dy++) {
      for (let dx = 0; dx < w; dx++) {
        if (skip.has(`${dx},${dy}`) || skip.has(`${dx},${dy},${sl}`)) continue;
        const id = map.layers[sl][(x + dx) + (y + dy) * map.width];
        if (!id || (id >= FIRST_REGULAR_TILE && isEmptyTile(png, id))) continue;
        grid[dx + dy * w] = id;
        any = true;
      }
    }
    const dl = dest[i];
    if (!any) return;
    if (layers[dl]) {
      // fusiona (la capa origen posterior gana)
      layers[dl] = layers[dl].map((v, k) => grid[k] || v);
    } else layers[dl] = grid;
  });
  return { w, h, layers, sourceTileset: map.tileset };
}

function bakeTiles(sdef) {
  const { w, h, layers } = sdef.tiles;
  const out = [null, null, null];
  (layers || []).forEach((g, l) => {
    if (!g) return;
    if (g.length !== w * h) throw new Error(`tiles.layers[${l}] debe tener ${w * h} elementos`);
    out[l] = g.slice();
  });
  return { w, h, layers: out };
}

/** Hornea un stamp → { w, h, layers, sig, warnings[] }. */
export function bakeStamp(def, name, sdef, png) {
  const kinds = ['src', 'from', 'tiles'].filter((k) => sdef[k]);
  if (kinds.length !== 1) throw new Error(`stamp "${name}": define exactamente uno de src/from/tiles`);
  let baked;
  if (sdef.src) baked = bakeSrc(sdef, png);
  else if (sdef.from) baked = bakeFrom(sdef, png);
  else baked = bakeTiles(sdef);
  const warnings = validateBaked(def, name, sdef, baked, png);
  return { w: baked.w, h: baked.h, layers: baked.layers, sig: stampSignature(sdef), warnings };
}

function validateBaked(def, name, sdef, baked, png) {
  const warnings = [];
  const ts = tilesetInfo(def.tileset);
  const max = ts.passages.length;
  if (!baked.layers.some(Boolean)) throw new Error(`stamp "${name}" vacío`);
  for (const grid of baked.layers) {
    if (!grid) continue;
    for (const id of grid) {
      if (!id) continue;
      if (id >= max) throw new Error(`stamp "${name}": tile ${id} fuera del tileset (${max})`);
      if (isAutotile(id) && !ts.autotiles[autotileSlot(id)]) throw new Error(`stamp "${name}": autotile ${id} en slot vacío`);
    }
  }
  if (sdef.door) {
    const [dx, dy] = sdef.door;
    if (dx < 0 || dy < 0 || dx >= baked.w || dy >= baked.h) throw new Error(`stamp "${name}": door fuera del stamp`);
  }
  if (baked.sourceTileset !== undefined && baked.sourceTileset !== def.tileset) {
    const other = originalTileset(tilesetInfo(baked.sourceTileset).image);
    const diff = new Set();
    for (const grid of baked.layers) for (const id of grid || []) if (id >= FIRST_REGULAR_TILE && !sameTile(png, other, id)) diff.add(id);
    if (diff.size) warnings.push(`${diff.size} tiles distintos entre el tileset del mapa (${baked.sourceTileset}) y ${def.tileset}: revisar hoja`);
  }
  return warnings;
}

/** Serializa el horneado como módulo ES. */
export function writeBakedModule(image, tileset, stamps) {
  const lines = [
    `// GENERADO por tools/stamps_bake.mjs a partir de ../${image}.js — no editar a mano.`,
    'export default {',
    `  tileset: ${tileset},`,
    '  stamps: {',
  ];
  for (const [name, s] of Object.entries(stamps)) {
    const layers = s.layers.map((g) => (g ? `[${g.join(',')}]` : 'null')).join(', ');
    lines.push(`    ${JSON.stringify(name)}: { sig: '${s.sig}', w: ${s.w}, h: ${s.h}, layers: [${layers}] },`);
  }
  lines.push('  },', '};', '');
  fs.mkdirSync(BAKED_DIR, { recursive: true });
  const file = path.join(BAKED_DIR, `${image}.js`);
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
  return file;
}
