// Índice de tiles de árbol de un tileset para las herramientas de QA de mapas (tools/check_seams.mjs,
// tools/lib/map_qa.mjs). Cada tile de árbol conocido (pinceles `forest`, sus variantes «bosque denso» y los stamps
// con etiqueta `arbol`) se asocia a su unidad: ancho, fila, columna y qué vecinas necesita para verse entero.
//   treeIndex(tilesetId, { brushes, stamps }) → Map id → { w, h, row, col, up, down, left, right, unit }
//   treesIn(index, ids) → [entradas] de los tiles de árbol de una casilla (ids de sus capas)
//   treeCutSides(index, getCell, x, y) → lados ('arriba'…) en los que un árbol de la casilla queda cortado
//   cutSides(entriesAt, x, y) → lo mismo con un lector de entradas (para casar dos mapas de tilesets distintos)
import { loadStampLibrary } from '../../game/src/content/stamps/index.js';
import { FOREST_DENSE } from '../../game/src/content/stamps/forestDense.js';
import { FIRST_REGULAR_TILE } from '../../game/src/shared/autotile.js';
import { tilesetDB } from './map_node.mjs';

const tileId = (x, y) => FIRST_REGULAR_TILE + y * 8 + x;
const cache = new Map();

/** Registra una rejilla w×h de ids (0 = sin tile) como una unidad de árbol. */
function addGrid(index, unit, w, h, idAt) {
  const has = (i, j) => i >= 0 && j >= 0 && i < w && j < h && Boolean(idAt(i, j));
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const id = idAt(i, j);
      if (!id || index.has(id)) continue;
      index.set(id, {
        unit, w, h, row: j, col: i,
        up: has(i, j - 1), down: has(i, j + 1), left: has(i - 1, j), right: has(i + 1, j),
      });
    }
  }
}

/** Pincel forest → unidades de sus árboles (y variantes densas del tileset, que se leen como la original). */
function addForest(index, brush, tilesetId) {
  const f = brush.forest;
  const [tw, th] = f.size || [2, 6];
  const dense = FOREST_DENSE[tilesetId] || {};
  for (const [tx, ty] of f.trees || []) {
    addGrid(index, `bosque ${tx},${ty}`, tw, th, (i, j) => tileId(tx + i, ty + j));
    for (let j = 0; j < th; j++) {
      for (let i = 0; i < tw; i++) {
        const base = index.get(tileId(tx + i, ty + j));
        const d = dense[tileId(tx + i, ty + j)];
        if (base && d && !index.has(d)) index.set(d, { ...base, dense: true });
      }
    }
  }
}

/** Stamp (horneado de la biblioteca o definición propia del mapa con `src` / `tiles`) → capa superior no vacía. */
function stampGrid(s) {
  if (s.src) {
    const [sx, sy, w, h] = s.src;
    return { w, h, idAt: (i, j) => tileId(sx + i, sy + j) };
  }
  const data = s.layers && s.w ? s : (s.tiles || s.data);
  if (!data || !data.layers) return null;
  const idAt = (i, j) => {
    for (let l = data.layers.length - 1; l >= 0; l--) {
      const v = data.layers[l]?.[i + j * data.w];
      if (v) return v;
    }
    return 0;
  };
  return { w: data.w, h: data.h, idAt };
}

const isTreeStamp = (name, s) => (s.tags || []).includes('arbol') || /^(arbol|pino|cerezo)/.test(name);

/**
 * Índice de tiles de árbol del tileset (biblioteca + pinceles y stamps propios del mapa). Los pinceles forest van
 * primero: un mismo tile (p. ej. `arbol_alto` = árbol del bosque) conserva la forma de la unidad de 2×6.
 */
export async function treeIndex(tilesetId, own = {}) {
  const key = tilesetId;
  let base = cache.get(key);
  if (!base) {
    base = new Map();
    let lib = null;
    try { lib = await loadStampLibrary(tilesetId); } catch { lib = null; }
    for (const b of Object.values(lib?.brushes || {})) if (b?.forest) addForest(base, b, tilesetId);
    for (const [name, s] of Object.entries(lib?.stamps || {})) {
      if (!isTreeStamp(name, s)) continue;
      const g = stampGrid(s);
      if (g) addGrid(base, name, g.w, g.h, g.idAt);
    }
    // puntas selladas (tools/tree_tips.mjs): se leen como la punta original
    for (const [tip, twin] of Object.entries(tilesetDB().tilesets[tilesetId]?.sealedTips?.map || {})) {
      const e = base.get(Number(tip));
      if (e && !base.has(twin)) base.set(twin, { ...e, sealed: true });
    }
    cache.set(key, base);
  }
  const hasOwn = Object.values(own.brushes || {}).some((b) => b?.forest) || Object.keys(own.stamps || {}).length;
  if (!hasOwn) return base;
  const index = new Map(base);
  for (const b of Object.values(own.brushes || {})) if (b?.forest) addForest(index, b, tilesetId);
  for (const [name, s] of Object.entries(own.stamps || {})) {
    if (!isTreeStamp(name, s)) continue;
    const g = stampGrid(s);
    if (g) addGrid(index, name, g.w, g.h, g.idAt);
  }
  return index;
}

/** Entradas de árbol de una lista de ids (las capas de una casilla). */
export function treesIn(index, ids) {
  const out = [];
  for (const id of ids) {
    const e = id && index.get(id);
    if (e) out.push(e);
  }
  return out;
}

/**
 * Lados en los que un árbol de la casilla (x, y) queda cortado. `entriesAt(x, y)` → entradas de árbol de la casilla
 * ([] si no hay) o null si está fuera de lo que se sabe (borde de mapa sin vecino: se da por bueno, el bosque sigue
 * fuera). Una vecina vale si tiene un árbol del mismo ancho en la columna que toca (cualquier fila: en el bosque
 * apilado las filas se solapan).
 */
export function cutSides(entriesAt, x, y) {
  const here = entriesAt(x, y) || [];
  if (!here.length) return [];
  const sides = new Set();
  const check = (nx, ny, w, col, side) => {
    const there = entriesAt(nx, ny);
    if (there === null) return;
    if (!there.some((e) => e.w === w && e.col === col)) sides.add(side);
  };
  for (const e of here) {
    if (e.up) check(x, y - 1, e.w, e.col, 'arriba');
    if (e.down) check(x, y + 1, e.w, e.col, 'abajo');
    if (e.left) check(x - 1, y, e.w, e.col - 1, 'izquierda');
    if (e.right) check(x + 1, y, e.w, e.col + 1, 'derecha');
  }
  return [...sides];
}

/** Igual que cutSides con un índice y un lector de ids por casilla (`getCell` → ids | null). */
export function treeCutSides(index, getCell, x, y) {
  return cutSides((cx, cy) => {
    const ids = getCell(cx, cy);
    return ids === null ? null : treesIn(index, ids);
  }, x, y);
}
