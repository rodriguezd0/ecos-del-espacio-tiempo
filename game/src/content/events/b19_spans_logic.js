// Tramos forzados de la Calzada del Rey (T15, docs/TABLILLAS.md: «estabilizar los tramos con la Reconstrucción
// auténtica en tres puntos»). Reglas PURAS (sin motor) que usan los eventos, las pruebas y el E2E:
//   · Los Peregrinos alzan piedras a la fuerza con un trozo del Resonador. Cada piedra forzada aguanta UNA pisada:
//     al dejarla, cae a la Sima.
//   · La Calzada de verdad sigue debajo, pero no encaja mientras quede una piedra forzada en el aire: para alzarla
//     con la Reconstrucción hay que pisarlas todas (cada una una sola vez) y acabar junto a la aguja del tramo.
//   · Quedarse en una piedra sin salida derrumba el tramo; volver al borde también: el Resonador vuelve a subirlas
//     («tramos reiniciables»). Estado: var `b19_tramo_<n>_caidas` (máscara de piedras caídas) + flag del tramo.
// Trazado ASCII de cada caja: '.' vacío · 'o' piedra forzada · 'P' aguja (punto de Reconstrucción).
// `near`: casillas de calzada firme junto al tramo (entrada) · `far`: casillas que la Reconstrucción vuelve pisables.

export const SPAN_DEFS = Object.freeze([
  Object.freeze({
    n: 1,
    name: 'primer tramo',
    x0: 10, y0: 33,
    rows: Object.freeze([
      '.......',
      '.ooo...',
      '.o.oo..',
      'oo.Po..',
      'o..oo..',
      'oooo...',
      '...o...',
    ]),
    axis: 'v', // la calzada corre de sur a norte por x = 13 (x 12–14)
    road: Object.freeze({ x0: 12, y0: 33, x1: 14, y1: 39 }),
    // la orilla del Mirador: solo la piedra (13,39) toca tierra (Tadeo la guarda desde (13,40))
    near: Object.freeze([[12, 40], [13, 40], [14, 40]]),
    far: Object.freeze([[12, 30], [13, 30], [14, 30], [12, 31], [13, 31], [14, 31], [12, 32], [13, 32], [14, 32]]),
    farKind: 'stairs', // escalera sobre la cara de la pila A
    start: Object.freeze({ x: 13, y: 41, dir: 8 }),
    beyond: Object.freeze({ x: 13, y: 28 }), // primera casilla firme al otro lado
  }),
  Object.freeze({
    n: 2,
    name: 'segundo tramo',
    x0: 19, y0: 22,
    rows: Object.freeze([
      '...ooooo..',
      '...o..oo..',
      '...o.oo...',
      '...o.o....',
      'oo.o.P....',
      '.o.o......',
      '.ooo......',
      '..........',
      '..........',
    ]),
    axis: 'h', // de oeste a este por y = 26 (y 25–27)
    road: Object.freeze({ x0: 19, y0: 25, x1: 28, y1: 27 }),
    near: Object.freeze([[18, 25], [18, 26], [18, 27]]),
    far: Object.freeze([[29, 25], [29, 26], [29, 27]]),
    farKind: 'road', // a través del muro oeste de la pila B
    start: Object.freeze({ x: 16, y: 26, dir: 6 }),
    beyond: Object.freeze({ x: 31, y: 26 }),
  }),
  Object.freeze({
    n: 3,
    name: 'último tramo',
    x0: 31, y0: 16,
    rows: Object.freeze([
      '.ooooo.',
      '.o...oo',
      'oo.P..o',
      'o.oo..o',
      'ooooooo',
      '...o...',
    ]),
    axis: 'v', // de la pila B a la Peña del Rey por x = 34 (x 33–35)
    road: Object.freeze({ x0: 33, y0: 16, x1: 35, y1: 21 }),
    near: Object.freeze([[33, 22], [34, 22], [35, 22]]),
    far: Object.freeze([[33, 14], [34, 14], [35, 14], [33, 15], [34, 15], [35, 15]]),
    farKind: 'road', // sobre el labio y la cara norte del foso
    start: Object.freeze({ x: 34, y: 23, dir: 8 }),
    beyond: Object.freeze({ x: 34, y: 13 }),
  }),
]);

const DV = Object.freeze([[0, 1], [-1, 0], [1, 0], [0, -1]]);
const key = (x, y) => `${x},${y}`;

/** Flag de un tramo estabilizado y variable con su máscara de piedras caídas. */
export const spanFlag = (n) => `b19_tramo_${n}`;
export const spanMaskVar = (n) => `b19_tramo_${n}_caidas`;
/** Índice de la piedra bajo el jugador (−1 = ninguna) de cada tramo. */
export const spanFootVar = (n) => `b19_tramo_${n}_pie`;

/** Definición de un tramo por número (1–3). */
export function spanDef(n) {
  const d = SPAN_DEFS.find((s) => s.n === n);
  if (!d) throw new Error(`Tramo inexistente: ${n}`);
  return d;
}

/**
 * Casillas de un tramo: piedras (en orden de lectura, con su índice = bit de la máscara), aguja, huella de la calzada
 * de verdad, entrada y salida. Valida el trazado.
 */
export function spanCells(def) {
  const stones = [];
  let pinnacle = null;
  def.rows.forEach((row, j) => {
    if (row.length !== def.rows[0].length) throw new Error(`Tramo ${def.n}: filas de distinto ancho`);
    [...row].forEach((ch, i) => {
      const x = def.x0 + i;
      const y = def.y0 + j;
      if (ch === 'o') stones.push(Object.freeze({ x, y, i: stones.length }));
      else if (ch === 'P') {
        if (pinnacle) throw new Error(`Tramo ${def.n}: dos agujas`);
        pinnacle = Object.freeze({ x, y });
      } else if (ch !== '.') throw new Error(`Tramo ${def.n}: carácter desconocido «${ch}»`);
    });
  });
  if (!pinnacle) throw new Error(`Tramo ${def.n}: sin aguja`);
  if (stones.length > 30) throw new Error(`Tramo ${def.n}: demasiadas piedras para la máscara`);
  const r = def.road;
  const footprint = [];
  for (let y = r.y0; y <= r.y1; y++) for (let x = r.x0; x <= r.x1; x++) footprint.push([x, y]);
  const nearSet = new Set(def.near.map(([x, y]) => key(x, y)));
  const entries = stones.filter((s) => DV.some(([dx, dy]) => nearSet.has(key(s.x + dx, s.y + dy))));
  const goals = stones.filter((s) => Math.abs(s.x - pinnacle.x) + Math.abs(s.y - pinnacle.y) === 1);
  return Object.freeze({ stones: Object.freeze(stones), pinnacle, footprint: Object.freeze(footprint), entries, goals, nearSet });
}

const CELLS = new Map();
/** spanCells memorizado por número de tramo. */
export function cellsOf(n) {
  if (!CELLS.has(n)) CELLS.set(n, spanCells(spanDef(n)));
  return CELLS.get(n);
}

/** Máscara con todas las piedras caídas. */
export const fullMask = (n) => (2 ** cellsOf(n).stones.length) - 1;
export const isFallen = (mask, i) => Math.floor(Number(mask || 0) / 2 ** i) % 2 === 1;
export const withFallen = (mask, i) => (isFallen(mask, i) ? Number(mask || 0) : Number(mask || 0) + 2 ** i);
export const fallenCount = (n, mask) => cellsOf(n).stones.filter((s) => isFallen(mask, s.i)).length;

/** Piedra (índice) en (x, y) o −1. */
export function stoneAt(n, x, y) {
  const s = cellsOf(n).stones.find((st) => st.x === x && st.y === y);
  return s ? s.i : -1;
}

/** ¿Está (x, y) en la caja del tramo? */
export function inSpanBox(n, x, y) {
  const d = spanDef(n);
  return x >= d.x0 && y >= d.y0 && x < d.x0 + d.rows[0].length && y < d.y0 + d.rows.length;
}

/** ¿Es (x, y) una casilla firme de la entrada del tramo? */
export const isNear = (n, x, y) => cellsOf(n).nearSet.has(key(x, y));

/** Casillas vecinas pisables desde (x, y) durante el puzzle (piedras en pie o la entrada). */
export function walkableNeighbours(n, mask, x, y) {
  const out = [];
  for (const [dx, dy] of DV) {
    const nx = x + dx; const ny = y + dy;
    const i = stoneAt(n, nx, ny);
    if ((i >= 0 && !isFallen(mask, i)) || isNear(n, nx, ny)) out.push([nx, ny]);
  }
  return out;
}

/**
 * ¿Estado final? El jugador está sobre la última piedra en pie, junto a la aguja: la Reconstrucción ya puede alzar la
 * Calzada de verdad.
 */
export function isGoal(n, mask, x, y) {
  const c = cellsOf(n);
  const i = stoneAt(n, x, y);
  if (i < 0 || isFallen(mask, i)) return false;
  if (Math.abs(x - c.pinnacle.x) + Math.abs(y - c.pinnacle.y) !== 1) return false;
  return c.stones.every((s) => s.i === i || isFallen(mask, s.i));
}

/** ¿Quedan piedras forzadas en el aire aparte de la que pisa el jugador? */
export function stonesLeft(n, mask, x = null, y = null) {
  const here = x === null ? -1 : stoneAt(n, x, y);
  return cellsOf(n).stones.filter((s) => s.i !== here && !isFallen(mask, s.i)).length;
}

/** ¿Sin salida? Sobre una piedra en pie, sin vecina pisable y sin ser el estado final. */
export function isStranded(n, mask, x, y) {
  const i = stoneAt(n, x, y);
  if (i < 0 || isFallen(mask, i)) return false;
  if (isGoal(n, mask, x, y)) return false;
  return walkableNeighbours(n, mask, x, y).length === 0;
}

/** Dirección 2/4/6/8 de (ax, ay) a una casilla vecina (bx, by). */
export function dirTo(ax, ay, bx, by) {
  if (bx === ax && by === ay + 1) return 2;
  if (bx === ax - 1 && by === ay) return 4;
  if (bx === ax + 1 && by === ay) return 6;
  if (bx === ax && by === ay - 1) return 8;
  return 0;
}

/**
 * Soluciones del tramo: recorridos que empiezan en una casilla de entrada (`near`), pisan todas las piedras una sola vez
 * y acaban junto a la aguja. → { count, paths: [[[x, y]…]…] } (paths hasta `limit`; count hasta `countLimit`).
 */
export function solveSpan(n, { limit = 4, countLimit = 1000 } = {}) {
  const c = cellsOf(n);
  const total = c.stones.length;
  const paths = [];
  let count = 0;
  const goalSet = new Set(c.goals.map((s) => s.i));
  const neigh = c.stones.map((s) => c.stones.filter((t) => Math.abs(t.x - s.x) + Math.abs(t.y - s.y) === 1).map((t) => t.i));
  const used = new Array(total).fill(false);
  const trail = [];
  function dfs(i, depth) {
    if (count >= countLimit) return;
    if (depth === total) {
      if (goalSet.has(i)) {
        count += 1;
        if (paths.length < limit) paths.push(trail.map((k) => [c.stones[k].x, c.stones[k].y]));
      }
      return;
    }
    for (const j of neigh[i]) {
      if (used[j]) continue;
      used[j] = true; trail.push(j);
      dfs(j, depth + 1);
      used[j] = false; trail.pop();
    }
  }
  for (const e of c.entries) {
    used[e.i] = true; trail.push(e.i);
    dfs(e.i, 1);
    used[e.i] = false; trail.pop();
  }
  return { count, paths };
}

/**
 * Pasos (direcciones) desde la casilla de entrada que toca la primera piedra de la solución hasta la meta, y la
 * dirección final para mirar a la aguja. → { from: [x, y], dirs: [2|4|6|8…], face }
 */
export function solutionSteps(n) {
  const { paths } = solveSpan(n, { limit: 1, countLimit: 1 });
  if (!paths.length) throw new Error(`Tramo ${n} sin solución`);
  const path = paths[0];
  const c = cellsOf(n);
  const [sx, sy] = path[0];
  const from = spanDef(n).near.find(([x, y]) => Math.abs(x - sx) + Math.abs(y - sy) === 1);
  const dirs = [];
  let [cx, cy] = from;
  for (const [x, y] of path) { dirs.push(dirTo(cx, cy, x, y)); cx = x; cy = y; }
  return { from, dirs, face: dirTo(cx, cy, c.pinnacle.x, c.pinnacle.y), path };
}
