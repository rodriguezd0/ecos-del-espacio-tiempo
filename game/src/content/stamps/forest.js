// Pincel `forest` (bosque de árboles apilados) — módulo puro. Reglas (docs/stamps.md «Bosques»):
//
//   · Solo árboles ENTEROS. Cada par de columnas se divide en tramos verticales continuos; en cada tramo el árbol de
//     abajo apoya el tronco en la última fila y el de arriba empieza con la punta de la copa en la primera. Entre
//     medias se reparten los árboles con separación flexible (periodo ± 1–2 filas) para que encajen exactos: nunca
//     queda una copa sin punta ni un tronco sin árbol («árboles cortados»).
//   · Un tramo de 2–4 filas usa el árbol PEQUEÑO (2×4) de la misma especie (`SMALL_TREES` / `forest.small`), apoyado
//     en la última fila. Si aun así no cabe (o sobra una fila a un tramo alto), el árbol se completa hacia ARRIBA,
//     fuera del trazo (lo que sale del mapa no se dibuja: el bosque sigue fuera).
//   · Columnas: los pares se alinean con el borde del mapa que toque el trazo (oeste, o este si solo toca ese), así
//     el bosque llega entero a la costura con el mapa vecino; un par con una sola columna dentro del trazo se completa
//     si la otra cabe en el mapa.
//   · Una franja de 1–3 filas pegada al borde norte cuando ese lado tiene conexión (`opts.openSides.north`) no dibuja
//     troncos sueltos: deja el suelo con el bloqueo invisible (el bosque del mapa vecino cierra la costura).
//   · Filas tapadas por el árbol de debajo → capa `trunkLayer` con la variante «bosque densa» (bloquean). La punta de
//     copa (fila 0) va sola en la capa `layer`: se pasa por detrás. Las escrituras llevan `tree: 'tip' | 'body'` y
//     `blocker`: el MapBuilder sella después las puntas que tienen algo encima (world/treeTips.js).
import { FOREST_DENSE } from './forestDense.js';

/** Tile vacío y bloqueante (prioridad 0) presente en todos los tilesets exteriores de Añil (1, 3, 5, 6, 7, 9). */
export const FOREST_BLOCKER_TILE = 503;

const tileId = (x, y) => 384 + y * 8 + x;

function cellHash(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Origen x de cada par de columnas: alineado con el borde del mapa que toca el trazo (o con su mínimo x). */
function columnAnchor(minX, maxX, tw, pxp, width) {
  const touchesWest = minX <= 0;
  const touchesEast = Number.isFinite(width) && maxX >= width - 1;
  if (touchesEast && !touchesWest) return maxX - tw + 1;
  return minX;
}

/** Pares de columnas → { ax, ys: Set } con las filas de cualquiera de sus columnas dentro del trazo. */
function columnPairs(cells, tw, pxp, width) {
  const xs = cells.map((c) => c[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const base = columnAnchor(minX, maxX, tw, pxp, width);
  const mod = (a, n) => ((a % n) + n) % n;
  const pairs = new Map();
  for (const [x, y] of cells) {
    const ax = x - mod(x - base, pxp);
    if (!pairs.has(ax)) pairs.set(ax, new Set());
    pairs.get(ax).add(y);
  }
  return pairs;
}

function boundsOf(cells) {
  const xs = cells.map((c) => c[0]); const ys = cells.map((c) => c[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

/** Tramos verticales continuos [top, bottom] de un conjunto de filas. */
function runsOf(ys) {
  const sorted = [...ys].sort((a, b) => a - b);
  const runs = [];
  for (const y of sorted) {
    const last = runs[runs.length - 1];
    if (last && y === last[1] + 1) last[1] = y;
    else runs.push([y, y]);
  }
  return runs;
}

/**
 * Posiciones (fila de la punta) de los árboles de un tramo, de arriba abajo: el último apoya el tronco en `bottom`,
 * el primero empieza en `top` (o más arriba si no cabe), con separaciones entre pmin y pmax.
 */
export function stackRows(top, bottom, th, pyp) {
  const pmin = Math.max(2, Math.ceil(pyp / 2));
  const pmax = pyp + 1;
  const last = bottom - th + 1;
  let total = last - top;
  if (total <= 0) return [last];
  let gaps = Math.max(1, Math.round(total / pyp));
  while (total > gaps * pmax) gaps++;
  while (gaps > 1 && gaps * pmin > total) gaps--;
  if (gaps * pmin > total) total = gaps * pmin; // sobra menos de una separación: el de arriba sale del trazo
  const q = Math.floor(total / gaps);
  let rem = total - q * gaps;
  const rows = [last];
  let y = last;
  for (let g = 0; g < gaps; g++) {
    y -= q + (rem > 0 ? 1 : 0);
    rem--;
    rows.unshift(y);
  }
  return rows;
}

/**
 * Árbol pequeño (2×4) equivalente a cada árbol de bosque de Añil (misma especie): los tramos de 2 a 4 filas usan este
 * en vez de un árbol de 6 filas que se saldría por arriba. `forest.small` en el pincel manda sobre esta tabla.
 */
export const SMALL_TREES = {
  '0,39': [4, 41], '2,39': [6, 41], // árbol redondo y pino (1, 3, 5, 6, 7, 9)
  '0,208': [4, 210], '2,208': [6, 210], // árbol y pino morados del Bosque Celeste (7)
  '0,563': [2, 565], // pino nevado (Exterior1, filas propias)
};
const SMALL_SIZE = [2, 4];
const SMALL_CROWN = 2;

/** Árbol pequeño de un árbol de bosque (o null). */
function smallTree(f, tree) {
  const i = f.trees.indexOf(tree);
  if (Array.isArray(f.small) && f.small[i]) return f.small[i];
  if (f.small === false) return null;
  return SMALL_TREES[`${tree[0]},${tree[1]}`] || null;
}

/** Escrituras de un árbol en (ax, ay); `cover` = filas propias tapadas por el árbol de debajo (desde esa fila). */
function treeWrites(ctx, tree, ax, ay, cover) {
  const { tw, th, crownRows, layer, trunkLayer, dense, H, W, blocker } = ctx;
  const out = [];
  for (let dy = 0; dy < th; dy++) {
    const y = ay + dy;
    if (y < 0 || y >= H) continue;
    const covered = dy >= cover;
    const trunkRow = dy >= crownRows;
    let srcRow = dy;
    if (covered && trunkRow) srcRow = dy - 1;
    const useDense = dy > 0 && (!trunkRow || covered);
    const L = covered || trunkRow ? trunkLayer : layer;
    for (let dx = 0; dx < tw; dx++) {
      const x = ax + dx;
      if (x < 0 || x >= W) continue;
      const id = tileId(tree[0] + dx, tree[1] + srcRow);
      out.push({ x, y, layer: L, id: useDense ? dense(id) : id, tree: dy === 0 ? 'tip' : 'body', blocker });
    }
  }
  return out;
}

/** Pincel forest: ver cabecera. */
export function paintForest(brush, cells, opts = {}) {
  const f = brush.forest;
  const [tw, th] = f.size || [2, 6];
  const [pxp, pyp] = f.period || [2, 4];
  const denseMap = FOREST_DENSE[opts.tileset] || null;
  const ctx = {
    tw, th,
    crownRows: f.crownRows ?? pyp,
    layer: brush.layer ?? 2,
    trunkLayer: brush.trunkLayer ?? 1,
    dense: (id) => (denseMap && denseMap[id]) || id,
    W: opts.width ?? Infinity,
    H: opts.height ?? Infinity,
    blocker: f.blocker ?? FOREST_BLOCKER_TILE,
  };
  // por defecto un mismo tipo de árbol por columna (las copas apiladas encajan); mix: 'tree' varía por árbol
  const pick = (ax, ay) => f.trees[Math.floor((f.mix === 'tree' ? cellHash(ax, ay, opts.seed) : cellHash(ax, 0, opts.seed)) * f.trees.length)];
  const smallCtx = { ...ctx, th: SMALL_SIZE[1], crownRows: SMALL_CROWN, dense: (id) => id };
  const out = [];
  const mask = new Set(cells.map(([x, y]) => `${x},${y}`));
  const bbox = boundsOf(cells);
  // Completar fuera del trazo: solo fuera de su rectángulo (un hueco dentro del trazo es un claro a propósito) y en
  // casillas libres (el MapBuilder dice cuáles: sin nada en las capas 1–2 ni eventos/warps). Si no, el árbol se
  // dibuja recortado al trazo (queda cortado y tools/qa_maps.mjs lo lista).
  const allowed = (x, y) => (x < bbox.x0 || x > bbox.x1 || y < bbox.y0 || y > bbox.y1) && (!opts.canExtend || opts.canExtend(x, y));
  const place = (writes) => {
    const outside = writes.filter((w) => !mask.has(`${w.x},${w.y}`));
    if (outside.every((w) => allowed(w.x, w.y))) out.push(...writes);
    else out.push(...writes.filter((w) => mask.has(`${w.x},${w.y}`)));
  };
  for (const [ax, ys] of columnPairs(cells, tw, pxp, ctx.W)) {
    for (const [top, bottom] of runsOf(ys)) {
      if (top <= 0 && opts.openSides?.north && bottom - top + 1 < SMALL_SIZE[1]) {
        // Franja de 1–3 filas pegada a una conexión norte: serían troncos sin copa (la copa quedaría en el vecino).
        // Se deja el suelo y se bloquea con el tile invisible: el bosque del vecino cierra la costura.
        for (let y = Math.max(0, top); y <= bottom; y++) {
          for (let dx = 0; dx < tw; dx++) if (mask.has(`${ax + dx},${y}`)) out.push({ x: ax + dx, y, layer: ctx.trunkLayer, id: ctx.blocker });
        }
        continue;
      }
      const small =tw === SMALL_SIZE[0] && bottom - top + 1 < th - 1 ? smallTree(f, pick(ax, bottom)) : null;
      if (small) {
        place(treeWrites(smallCtx, small, ax, bottom - SMALL_SIZE[1] + 1, SMALL_SIZE[1]));
        continue;
      }
      const rows = stackRows(top, bottom, th, pyp);
      rows.forEach((ay, i) => {
        const cover = i < rows.length - 1 ? rows[i + 1] - ay : th;
        place(treeWrites(ctx, pick(ax, ay), ax, ay, cover));
      });
    }
  }
  return out;
}
