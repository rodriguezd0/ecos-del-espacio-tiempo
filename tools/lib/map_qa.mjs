// Comprobaciones de arte de un mapa construido (módulo de herramientas, Node): lo usan tools/validate_content.mjs
// (avisos) y tools/qa_maps.mjs (listado de docs/QA_MAPAS.md). Todas trabajan sobre el resultado final de build(b),
// así que no dependen del orden en que el mapa pinta bosques y coloca stamps.
//   · árboles cortados: unidades de árbol a las que les falta una parte (copa sin punta, medio árbol, tronco
//     tapado); los bordes del mapa no cuentan (allí manda tools/check_seams.mjs)
//   · solapes: stamps que no son árboles con alguna casilla sobre un árbol o que cortan uno; stamps sólidos que se
//     pisan entre sí (salvo los que se apilan a propósito: `stack`), y eventos visibles dentro de un árbol
//   · rocas de agua (`roca` + `agua`) fuera del agua
//   · copas de árbol (capa 2) sobre caminos, hierba alta u otras piezas de la capa 1 («caminos que se cortan»)
import { loadStampLibrary } from '../../game/src/content/stamps/index.js';
import { expandEventDef } from '../../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../../game/src/world/mapEvent.js';
import { terrainTag } from '../../game/src/world/terrain.js';
import { FOREST_BLOCKER_TILE } from '../../game/src/content/stamps/forest.js';
import { treeIndex, treesIn, treeCutSides } from './tree_tiles.mjs';

const BLOCKER = FOREST_BLOCKER_TILE;
const SIDE_DELTA ={ arriba: [0, -1], abajo: [0, 1], izquierda: [-1, 0], derecha: [1, 0] };

/** Lista de ids (capas 0..2) de una casilla, o null si está fuera del mapa. */
export function cellReader(built) {
  return (x, y) => {
    if (x < 0 || y < 0 || x >= built.width || y >= built.height) return null;
    const i = x + y * built.width;
    return built.layers.map((l) => l[i]);
  };
}

/** Rejillas { w, h, layers } de un stamp colocado (biblioteca horneada o definición propia del mapa). */
function stampData(name, def, library) {
  const s = def.stamps?.[name] || library?.stamps?.[name] || def.fallback?.stamps?.[name];
  if (!s) return null;
  if (Array.isArray(s.layers) && s.w) return { def: s, w: s.w, h: s.h, layers: s.layers };
  const d = s.tiles || s.data;
  if (d?.layers) return { def: s, w: d.w, h: d.h, layers: d.layers };
  if (s.src) {
    const [, , w, h] = s.src;
    return { def: s, w, h, layers: null }; // sin rejilla: se usa la huella completa
  }
  return null;
}

/** Casillas no vacías de un stamp colocado → [[x, y, ids]] (ids = sus tiles en esa casilla). */
function stampCells(info, data) {
  const out = [];
  for (let j = 0; j < data.h; j++) {
    for (let i = 0; i < data.w; i++) {
      const ids = data.layers ? data.layers.map((g) => (g ? g[i + j * data.w] : 0)).filter(Boolean) : [];
      if (data.layers && !ids.length) continue;
      out.push([info.x + i, info.y + j, ids]);
    }
  }
  return out;
}

const tagsOf = (s) => s?.def?.tags || [];
const isTree = (name, s) => tagsOf(s).includes('arbol') || /^(arbol|pino|cerezo)/.test(name);
const isSolid = (s) => Boolean(s?.def?.solid);

/** Agrupa casillas en texto corto: «(3,4) (5,4) … +12». */
export function sampleCells(cells, max = 4) {
  const list = cells.slice(0, max).map(([x, y]) => `(${x},${y})`).join(' ');
  return cells.length > max ? `${list} … +${cells.length - max}` : list;
}

function cutTrees(index, read, built) {
  const cells = [];
  for (let y = 0; y < built.height; y++) {
    for (let x = 0; x < built.width; x++) {
      const sides = treeCutSides(index, read, x, y);
      if (sides.length) cells.push([x, y, sides]);
    }
  }
  return cells;
}

/** ¿El stamp tapa o corta un árbol? (una casilla suya con tile de árbol, o un árbol vecino cortado hacia ella) */
function stampOnTree(index, read, cells, cutAt) {
  const own = new Set(cells.map(([x, y]) => `${x},${y}`));
  const hits = [];
  for (const [x, y, ids] of cells) {
    const all = read(x, y) || [];
    const mine = new Set(ids);
    const others = all.filter((id) => id && !mine.has(id));
    if (treesIn(index, others).length) { hits.push([x, y]); continue; }
    for (const [side, [dx, dy]] of Object.entries(SIDE_DELTA)) {
      const key = `${x - dx},${y - dy}`;
      if (own.has(key)) continue;
      if ((cutAt.get(key) || []).includes(side)) { hits.push([x, y]); break; }
    }
  }
  return hits;
}

/** Parte del mapa a partir de la cual un tile de la capa 1 se considera «suelo de fondo» (nieve, arena…), no pieza. */
const COVER_SHARE = 0.05;

/**
 * Casillas con copa de árbol (capa 2) sobre un camino, hierba alta u otra pieza de la capa 1 que no es árbol. Los
 * tiles que cubren buena parte del mapa en la capa 1 (nieve o suelo de fondo pintado en la capa 1) no cuentan.
 */
function groundUnderTrees(index, built) {
  const out = [];
  const [, l1, l2] = built.layers;
  const freq = new Map();
  for (const id of l1) if (id) freq.set(id, (freq.get(id) || 0) + 1);
  const cover = (id) => freq.get(id) >= l1.length * COVER_SHARE;
  for (let i = 0; i < l2.length; i++) {
    if (!index.has(l2[i]) || !l1[i] || index.has(l1[i]) || l1[i] === BLOCKER || cover(l1[i])) continue;
    out.push([i % built.width, Math.floor(i / built.width)]);
  }
  return out;
}

function waterUnder(read, tileset, x, y, rockIds) {
  const ids = read(x, y) || [];
  return ids.some((id) => id && !rockIds.has(id) && terrainTag(tileset.terrainTags[id] || 0).canSurf);
}

function visibleEvents(def) {
  const out = [];
  (def.events || []).forEach((raw, i) => {
    if (!raw || !Number.isInteger(raw.x) || !Number.isInteger(raw.y)) return;
    let ev;
    try { ev = normalizeEventDef(expandEventDef(raw, def), i); } catch { return; }
    const sprite = ev.pages?.find((p) => p.sprite)?.sprite;
    if (sprite || raw.type === 'sign') out.push({ id: raw.id ?? `#${i}`, type: raw.type || 'evento', x: raw.x, y: raw.y });
  });
  return out;
}

/** Tile de árbol que bloquea en la casilla (las puntas de copa libres no cuentan: se pasa por detrás). */
function blockingTree(index, tileset, ids) {
  return ids.some((id) => id && index.get(id) && (tileset.passages[id] & 0x0f) === 0x0f);
}

/**
 * Comprobaciones de arte de un mapa ya construido (`res` = resultado de buildMapNode).
 * → { cutTrees: [[x,y,lados]], stampOverlaps: [{ name, other?, cells }], waterRocks: [{ name, x, y }],
 *     treeEvents: [{ id, type, x, y }], groundUnderTrees: [[x,y]] }
 */
export async function qaMap(res) {
  const { def, built, tileset } = res;
  const out = { cutTrees: [], stampOverlaps: [], waterRocks: [], treeEvents: [], groundUnderTrees: [] };
  if (!built?.layers || !tileset) return out;
  let library = null;
  try { library = await loadStampLibrary(def.tileset); } catch { library = null; }
  const index = await treeIndex(def.tileset, { brushes: def.brushes, stamps: def.stamps });
  const read = cellReader(built);
  out.cutTrees = cutTrees(index, read, built);
  out.groundUnderTrees = groundUnderTrees(index, built);
  const cutAt = new Map(out.cutTrees.map(([x, y, s]) => [`${x},${y}`, s]));
  const placed = [];
  for (const info of built.stamps || []) {
    const data = stampData(info.name, def, library);
    if (!data) continue;
    const cells = stampCells(info, data).filter(([x, y]) => read(x, y));
    placed.push({ info, data, cells });
    const tags = tagsOf(data);
    if (tags.includes('roca') && tags.includes('agua')) {
      const rockIds = new Set(cells.flatMap((c) => c[2]));
      const dry = cells.filter(([x, y]) => !waterUnder(read, tileset, x, y, rockIds));
      if (dry.length) out.waterRocks.push({ name: info.name, x: info.x, y: info.y, cells: dry });
    }
    if (isTree(info.name, data)) continue;
    const hits = stampOnTree(index, read, cells, cutAt);
    if (hits.length) out.stampOverlaps.push({ name: info.name, x: info.x, y: info.y, other: 'árbol', cells: hits });
  }
  // stamps sólidos que se pisan entre sí (el de encima sustituye tiles del de debajo)
  const owner = new Map();
  for (const p of placed) {
    const solid = isSolid(p.data) || isTree(p.info.name, p.data);
    const stack = Boolean(p.data.def?.stack) && !isTree(p.info.name, p.data);
    for (const [x, y] of p.cells) {
      const key = `${x},${y}`;
      const prev = owner.get(key);
      if (prev && solid && !stack && prev.solid && !(prev.tree && isTree(p.info.name, p.data)) && prev.p !== p) {
        const hit = out.stampOverlaps.find((o) => o.name === p.info.name && o.x === p.info.x && o.y === p.info.y && o.other === prev.p.info.name);
        if (hit) hit.cells.push([x, y]);
        else out.stampOverlaps.push({ name: p.info.name, x: p.info.x, y: p.info.y, other: prev.p.info.name, cells: [[x, y]] });
      }
      if (solid || !prev) owner.set(key, { p, solid, tree: isTree(p.info.name, p.data) });
    }
  }
  for (const ev of visibleEvents(def)) {
    const ids = read(ev.x, ev.y);
    if (ids && blockingTree(index, tileset, ids)) out.treeEvents.push(ev);
  }
  return out;
}

/** Líneas de aviso cortas para el validador (una por categoría). */
export function qaWarnings(qa) {
  const lines = [];
  if (qa.cutTrees.length) lines.push(`arte: ${qa.cutTrees.length} casilla(s) con árbol cortado — ${sampleCells(qa.cutTrees)}`);
  for (const r of qa.waterRocks) lines.push(`arte: roca de agua "${r.name}" en (${r.x},${r.y}) sin agua debajo`);
  const onTree = qa.stampOverlaps.filter((o) => o.other === 'árbol');
  if (onTree.length) lines.push(`arte: ${onTree.length} stamp(s) sobre árboles — ${onTree.slice(0, 4).map((o) => `${o.name} (${o.x},${o.y})`).join(', ')}${onTree.length > 4 ? ' …' : ''}`);
  const solid = qa.stampOverlaps.filter((o) => o.other !== 'árbol');
  if (solid.length) lines.push(`arte: ${solid.length} stamp(s) sólidos pisando otro — ${solid.slice(0, 4).map((o) => `${o.name} sobre ${o.other} (${o.x},${o.y})`).join(', ')}${solid.length > 4 ? ' …' : ''}`);
  if (qa.groundUnderTrees.length) lines.push(`arte: ${qa.groundUnderTrees.length} casilla(s) con copa de árbol sobre camino/hierba/pieza de la capa 1 — ${sampleCells(qa.groundUnderTrees)}`);
  if (qa.treeEvents.length) lines.push(`arte: ${qa.treeEvents.length} evento(s) visibles dentro de un árbol — ${qa.treeEvents.slice(0, 4).map((e) => `${e.id} (${e.x},${e.y})`).join(', ')}`);
  return lines;
}
