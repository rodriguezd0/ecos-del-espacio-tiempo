// Costuras entre mapas conectados: renderiza las dos caras de cada conexión y detecta
//   · árboles partidos: una unidad de árbol de un lado que no sigue en el otro (medio árbol, copa sin tronco…)
//   · objetos cortados: stamps que salen del mapa por el lado de la conexión (salvo si el vecino dibuja su resto:
//     el mismo stamp en la misma posición del mundo)
//   · cambios bruscos de suelo: el suelo que se pisa (capas 0–1, sin árboles ni piezas altas; las paredes, caras de
//     acantilado y árboles que no se pisan por ningún lado no cuentan) cambia de golpe en la costura
// Uso: node tools/check_seams.mjs [mapa ...] [--depth=6] [--scale=1] [--no-png] [--json]
//   PNG por conexión en tools/cache/seams/<A>__<dir>__<B>.png (rojo = árbol partido, naranja = suelo, magenta = objeto)
// API: checkSeams({ only, depth, png }) → [{ a, b, dir, overlap, trees, objects, ground, file }]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PNG } from 'pngjs';
import { MAPS } from '../game/src/content/maps/index.js';
import { connectionOffset } from '../game/src/world/mapLoader.js';
import { buildMapNode } from './lib/map_node.mjs';
import { renderMap, savePNG, drawTile, blit } from './lib/tile_render.mjs';
import { treeIndex, treesIn, cutSides } from './lib/tree_tiles.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'tools', 'cache', 'seams');
const T = 32;
/** Distancia de color (RGB medio de la casilla) a partir de la cual el suelo «salta» en la costura. */
export const GROUND_JUMP = 70;
const COLORS = { tree: [255, 40, 40], ground: [255, 150, 0], object: [230, 0, 230] };
const SIDES = {
  south: { a: 'abajo', b: 'arriba', axis: 'v' }, north: { a: 'arriba', b: 'abajo', axis: 'v' },
  east: { a: 'derecha', b: 'izquierda', axis: 'h' }, west: { a: 'izquierda', b: 'derecha', axis: 'h' },
};

const cache = new Map();
async function load(id) {
  if (!cache.has(id)) {
    cache.set(id, (async () => {
      const res = await buildMapNode(id);
      const index = await treeIndex(res.def.tileset, { brushes: res.def.brushes, stamps: res.def.stamps });
      return { ...res, index };
    })().catch((err) => ({ error: err })));
  }
  return cache.get(id);
}

const idsAt = (m, x, y) => m.built.layers.map((l) => l[x + y * m.built.width]);
const inside = (m, x, y) => x >= 0 && y >= 0 && x < m.built.width && y < m.built.height;

/** Lector en coordenadas de A que mira en A o en B (desplazado); fuera de ambos → null. */
function worldReader(A, B, off) {
  return (x, y) => {
    if (inside(A, x, y)) return { m: A, x, y };
    if (inside(B, x - off.x, y - off.y)) return { m: B, x: x - off.x, y: y - off.y };
    return null;
  };
}

/** Casillas de la costura en coordenadas de A: [[xa, ya, xb, yb]] (casilla de A y su vecina de B). */
function seamPairs(A, B, dir, off) {
  const out = [];
  const { width: aw, height: ah } = A.built;
  if (SIDES[dir].axis === 'v') {
    const x0 = Math.max(0, off.x); const x1 = Math.min(aw, off.x + B.built.width);
    const ya = dir === 'south' ? ah - 1 : 0; const yb = dir === 'south' ? ah : -1;
    for (let x = x0; x < x1; x++) out.push([x, ya, x, yb]);
  } else {
    const y0 = Math.max(0, off.y); const y1 = Math.min(ah, off.y + B.built.height);
    const xa = dir === 'east' ? aw - 1 : 0; const xb = dir === 'east' ? aw : -1;
    for (let y = y0; y < y1; y++) out.push([xa, y, xb, y]);
  }
  return out;
}

// ---------------------------------------------------------------- suelo
const colorCache = new Map();
/** Color medio del suelo de una casilla: capas 0–1 sin árboles ni tiles con prioridad (lo que se pisa). */
function groundColor(m, x, y) {
  const ts = m.tileset;
  const ids = idsAt(m, x, y).slice(0, 2).filter((id) => id && !m.index.has(id) && !(ts.priorities[id] > 0));
  const key = `${ts.id}:${ids.join(',')}`;
  if (colorCache.has(key)) return colorCache.get(key);
  const png = new PNG({ width: T, height: T });
  for (const id of ids) drawTile(png, ts, id, 0, 0);
  let r = 0; let g = 0; let b = 0; let n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (!png.data[i + 3]) continue;
    r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
  }
  const c = n ? [r / n, g / n, b / n] : null;
  colorCache.set(key, c);
  return c;
}
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);

/** Parte de la casilla (0..1) que tapan los árboles y piezas altas (lo que groundColor deja fuera). */
const coverCache = new Map();
function coverOf(m, x, y) {
  const ts = m.tileset;
  const ids = idsAt(m, x, y).filter((id) => id && (m.index.has(id) || ts.priorities[id] > 0));
  if (!ids.length) return 0;
  const key = `${ts.id}:${ids.join(',')}`;
  if (coverCache.has(key)) return coverCache.get(key);
  const png = new PNG({ width: T, height: T });
  for (const id of ids) drawTile(png, ts, id, 0, 0);
  let n = 0;
  for (let i = 3; i < png.data.length; i += 4) if (png.data[i]) n++;
  const c = n / (T * T);
  coverCache.set(key, c);
  return c;
}
/** Parte tapada a partir de la cual el suelo de la casilla no se ve (copa entera de un árbol, tejado…). */
const HIDDEN = 0.9;

/**
 * ¿El suelo de la casilla no cuenta? (a) Paredes que no son árboles (no se pisan por ningún lado y no son agua):
 * caras de acantilado, muros, vallas; la base de una cara que llega a la hierba del vecino es el pie natural del
 * acantilado. (b) Casillas cuyo suelo no se ve (copa entera de árbol encima). Los troncos y las copas con huecos sí
 * cuentan: por los lados se ve el suelo (hierba verde entre pinos nevados, p. ej.).
 */
function groundHidden(m, x, y) {
  if (coverOf(m, x, y) >= HIDDEN) return true;
  const map = m.entry?.map;
  if (!map || map.terrainTagAt(x, y).canSurf) return false;
  if (treesIn(m.index, idsAt(m, x, y)).length) return false;
  return [2, 4, 6, 8].every((d) => !map.playerPassable(x, y, d));
}

// ---------------------------------------------------------------- objetos
/** Stamps de `m` que salen del mapa por el lado `side` (y caen dentro del tramo de costura `range` local). */
function cutObjects(m, side, range) {
  const { width: w, height: h } = m.built;
  const out = [];
  for (const s of m.built.stamps || []) {
    const past = { abajo: s.y + s.h > h, arriba: s.y < 0, derecha: s.x + s.w > w, izquierda: s.x < 0 }[side];
    if (!past) continue;
    const [lo, hi] = side === 'abajo' || side === 'arriba' ? [s.x, s.x + s.w] : [s.y, s.y + s.h];
    if (hi <= range[0] || lo >= range[1]) continue;
    out.push({ name: s.name, x: s.x, y: s.y });
  }
  return out;
}

// ---------------------------------------------------------------- una conexión
async function checkConnection(A, conn, depth) {
  const B = await load(conn.to);
  if (B.error) return { a: A.def.id, b: conn.to, dir: conn.dir, error: B.error.message };
  const off = connectionOffset(conn, A.def, B.def);
  const read = worldReader(A, B, off);
  const entriesAt = (x, y) => {
    const c = read(x, y);
    return c ? treesIn(c.m.index, idsAt(c.m, c.x, c.y)) : null;
  };
  const pairs = seamPairs(A, B, conn.dir, off);
  const side = SIDES[conn.dir];
  const trees = []; const ground = [];
  for (const [xa, ya, xb, yb] of pairs) {
    if (cutSides(entriesAt, xa, ya).includes(side.a)) trees.push([xa, ya]);
    if (cutSides(entriesAt, xb, yb).includes(side.b)) trees.push([xb, yb]);
    if (groundHidden(A, xa, ya) || groundHidden(B, xb - off.x, yb - off.y)) continue;
    const ca = groundColor(A, xa, ya); const cb = groundColor(B, xb - off.x, yb - off.y);
    if (ca && cb && dist(ca, cb) > GROUND_JUMP) ground.push([xa, ya], [xb, yb]);
  }
  const axisV = side.axis === 'v';
  const rangeA = pairs.length ? (axisV ? [pairs[0][0], pairs.at(-1)[0] + 1] : [pairs[0][1], pairs.at(-1)[1] + 1]) : [0, 0];
  const rangeB = axisV ? rangeA.map((v) => v - off.x) : rangeA.map((v) => v - off.y);
  // Un objeto que sigue dibujado en el vecino (el mismo stamp en la misma posición del mundo) no está cortado.
  const continues = (m, name, x, y) => (m.built.stamps || []).some((s) => s.name === name && s.x === x && s.y === y);
  const objects = [
    ...cutObjects(A, side.a, rangeA).filter((o) => !continues(B, o.name, o.x - off.x, o.y - off.y)).map((o) => ({ ...o, map: A.def.id })),
    ...cutObjects(B, side.b, rangeB).filter((o) => !continues(A, o.name, o.x + off.x, o.y + off.y)).map((o) => ({ ...o, map: B.def.id })),
  ];
  return { a: A.def.id, b: B.def.id, dir: conn.dir, off, pairs, trees, ground, objects, B };
}

// ---------------------------------------------------------------- imagen
function tintCell(png, px, py, [r, g, b], a = 0.45) {
  for (let y = py; y < py + T; y++) {
    for (let x = px; x < px + T; x++) {
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      const i = (y * png.width + x) * 4;
      const edge = x - px < 2 || y - py < 2 || x - px >= T - 2 || y - py >= T - 2;
      const k = edge ? 0.9 : a;
      png.data[i] = png.data[i] * (1 - k) + r * k;
      png.data[i + 1] = png.data[i + 1] * (1 - k) + g * k;
      png.data[i + 2] = png.data[i + 2] * (1 - k) + b * k;
    }
  }
}

/** Composición de las dos caras: rectángulo en coordenadas de A que cubre `depth` casillas a cada lado. */
function renderSeam(A, r, depth) {
  if (!r.pairs.length) return null;
  const v = SIDES[r.dir].axis === 'v';
  const xs = r.pairs.flatMap((p) => [p[0], p[2]]); const ys = r.pairs.flatMap((p) => [p[1], p[3]]);
  const box = v
    ? { x: Math.min(...xs), y: Math.min(...ys) - depth + 1, w: Math.max(...xs) - Math.min(...xs) + 1, h: depth * 2 }
    : { x: Math.min(...xs) - depth + 1, y: Math.min(...ys), w: depth * 2, h: Math.max(...ys) - Math.min(...ys) + 1 };
  const out = new PNG({ width: box.w * T, height: box.h * T });
  for (let i = 0; i < out.data.length; i += 4) out.data.set([0, 0, 0, 255], i);
  for (const [m, ox, oy] of [[A, 0, 0], [r.B, r.off.x, r.off.y]]) {
    const { width, height } = m.built;
    const x0 = Math.max(0, box.x - ox); const y0 = Math.max(0, box.y - oy);
    const x1 = Math.min(width, box.x + box.w - ox); const y1 = Math.min(height, box.y + box.h - oy);
    if (x1 <= x0 || y1 <= y0) continue;
    const part = renderMap({ tilesetId: m.def.tileset, width, height, layers: m.built.layers, region: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } });
    blit(out, part, 0, 0, part.width, part.height, (x0 + ox - box.x) * T, (y0 + oy - box.y) * T);
  }
  const mark = (cells, color) => cells.forEach(([x, y]) => tintCell(out, (x - box.x) * T, (y - box.y) * T, color));
  mark(r.ground, COLORS.ground);
  mark(r.trees, COLORS.tree);
  for (const o of r.objects) {
    const [ox, oy] = o.map === A.def.id ? [0, 0] : [r.off.x, r.off.y];
    tintCell(out, (o.x + ox - box.x) * T, (o.y + oy - box.y) * T, COLORS.object, 0.6);
  }
  // línea de la costura
  const line = [255, 255, 0, 255];
  if (v) {
    const py = (r.dir === 'south' ? depth : depth) * T;
    for (let x = 0; x < out.width; x += 2) out.data.set(line, (py * out.width + x) * 4);
  } else {
    const px = depth * T;
    for (let y = 0; y < out.height; y += 2) out.data.set(line, (y * out.width + px) * 4);
  }
  return out;
}

/** Comprueba todas las conexiones (una vez por pareja y eje). */
export async function checkSeams({ only = [], depth = 6, png = true, scale = 1 } = {}) {
  const seen = new Set();
  const results = [];
  for (const id of Object.keys(MAPS)) {
    const A = await load(id);
    if (A.error) continue;
    for (const conn of A.def.connections || []) {
      if (only.length && !only.includes(id) && !only.includes(conn.to)) continue;
      const key = `${[id, conn.to].sort().join('|')}|${SIDES[conn.dir]?.axis}`;
      if (seen.has(key) || !MAPS[conn.to]) continue;
      seen.add(key);
      const r = await checkConnection(A, conn, depth);
      if (!r.error && png) {
        const img = renderSeam(A, r, depth);
        if (img) {
          r.file = path.join(OUT_DIR, `${r.a}__${r.dir}__${r.b}.png`);
          savePNG(img, r.file, scale);
        }
      }
      delete r.B;
      delete r.pairs;
      results.push(r);
    }
  }
  return results;
}

/** Resumen en una línea por conexión. */
export function seamLine(r) {
  if (r.error) return `${r.a} → ${r.dir} → ${r.b}: no construye (${r.error})`;
  const bits = [];
  if (r.trees.length) bits.push(`${r.trees.length} árbol(es) partido(s)`);
  if (r.objects.length) bits.push(`${r.objects.length} objeto(s) cortado(s) (${r.objects.slice(0, 3).map((o) => `${o.name}@${o.map}`).join(', ')})`);
  if (r.ground.length) bits.push(`${r.ground.length / 2} casilla(s) de suelo que cambia de golpe`);
  return `${r.a} —${r.dir}→ ${r.b}: ${bits.length ? bits.join('; ') : 'bien'}`;
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
  const only = args.filter((a) => !a.startsWith('--'));
  const results = await checkSeams({ only, depth: Number(opt('depth', 6)), png: !args.includes('--no-png'), scale: Number(opt('scale', 1)) });
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'report.json'), JSON.stringify(results, null, 1));
  if (args.includes('--json')) console.log(JSON.stringify(results, null, 1));
  else for (const r of results) console.log(seamLine(r));
  const bad = results.filter((r) => r.error || r.trees?.length || r.objects?.length || r.ground?.length).length;
  console.log(`\n${results.length} conexiones, ${bad} con problemas → ${path.relative(ROOT, OUT_DIR)}`);
}
