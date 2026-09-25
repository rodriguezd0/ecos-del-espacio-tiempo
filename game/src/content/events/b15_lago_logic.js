// Reglas puras del Lago Viejo de Villa Boreal (docs/TABLILLAS.md T13 «La torre de hielo»: «hielo resbaladizo con
// grietas: cada casilla aguanta dos pasadas. Hay que planificar el camino y romper bloques con Embestida para sacar el
// bloque antiguo»; reintento: «el lago se reinicia»). Sin DOM ni motor: lo usan los eventos, los tests y el E2E.
//
// Plano ASCII (fila 0 arriba):
//   '.' placa de hielo (resbala; aguanta dos pasadas: a la tercera se hunde y se cae al agua)
//   '#' roca nevada (para el deslizamiento)      'B' bloque de hielo (para; se rompe con Embestida → placa nueva)
//   'A' bloque antiguo (para; desde una casilla vecina, mirándolo, se saca)
//   'S' orilla de nieve (no resbala ni se agrieta)   'X' fuera del lago (ribera, no se pisa)
// Movimiento: al pasar a una placa se resbala en la misma dirección hasta que la siguiente casilla bloquea (roca,
// bloque, bloque antiguo, ribera) o es orilla (se para en ella). Cada placa pisada o cruzada cuenta una pasada.

// Diseño elegido con el solucionador de abajo (13 acciones, 3 embestidas, varias placas pisadas dos veces): el bloque
// antiguo queda en el rincón noroeste, tras un bloque de hielo, y solo se llega a la casilla de delante subiendo por la
// columna 2; para entrar en ella hay que dar la vuelta por el este rompiendo otros dos bloques que sirven de tope.
export const LAKE_ROWS = Object.freeze([
  'X#A#XXXXXXX',
  'X.B.......X',
  'X.....#.#BX',
  'X#........X',
  'X.....#.B.X',
  'X......#..X',
  'X.........X',
  'X...#..#..X',
  'XXXXSSSXXXX',
]);

export const PASSES = 2; // pasadas que aguanta cada placa

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

/** Plano → { w, h, at(x, y), ice: [[x, y]…], iceIndex(x, y), blocks: [[x, y]…], blockIndex(x, y), ancient, shore } */
export function parseLake(rows = LAKE_ROWS) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 'X' : (rows[y][x] || 'X'));
  const ice = []; const blocks = []; const shore = []; let ancient = null;
  const iceIdx = new Map(); const blockIdx = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c === '.' || c === 'B') { iceIdx.set(`${x},${y}`, ice.length); ice.push([x, y]); }
      if (c === 'B') { blockIdx.set(`${x},${y}`, blocks.length); blocks.push([x, y]); }
      if (c === 'S') shore.push([x, y]);
      if (c === 'A') ancient = [x, y];
    }
  }
  return {
    rows, w, h, at, ice, blocks, shore, ancient,
    iceIndex: (x, y) => iceIdx.get(`${x},${y}`) ?? -1,
    blockIndex: (x, y) => blockIdx.get(`${x},${y}`) ?? -1,
  };
}

export const LAKE = parseLake();

/** Estado inicial: en la orilla central, sin pasadas y sin bloques rotos. */
export function initialState(lake = LAKE) {
  const s = lake.shore[Math.floor(lake.shore.length / 2)];
  return { x: s[0], y: s[1], counts: new Array(lake.ice.length).fill(0), broken: 0, fell: false, solved: false };
}

/** ¿Qué hay en (x, y) con el estado? 'ice' | 'shore' | 'block' | 'rock' | 'ancient' | 'out'. */
export function cellKind(lake, st, x, y) {
  const c = lake.at(x, y);
  if (c === 'S') return 'shore';
  if (c === '#') return 'rock';
  if (c === 'A') return 'ancient';
  if (c === 'B') return (st.broken & (1 << lake.blockIndex(x, y))) ? 'ice' : 'block';
  if (c === '.') return 'ice';
  return 'out';
}

/**
 * Mueve hacia `dir` (2/4/6/8). → { state, path: [[x, y]…] (casillas recorridas), fell: bool, moved: bool }.
 * No modifica la entrada. Si una placa ya tenía dos pasadas, se hunde: `fell` y el recorrido acaba ahí.
 */
export function move(lake, st, dir) {
  const [dx, dy] = DV[dir];
  const counts = st.counts.slice();
  let { x, y } = st;
  const path = [];
  let fell = false;
  for (;;) {
    const nx = x + dx; const ny = y + dy;
    const k = cellKind(lake, st, nx, ny);
    if (k === 'shore') { x = nx; y = ny; path.push([x, y]); break; }
    if (k !== 'ice') break;
    x = nx; y = ny; path.push([x, y]);
    const i = lake.iceIndex(x, y);
    if (counts[i] >= PASSES) { fell = true; counts[i] += 1; break; }
    counts[i] += 1;
  }
  const state = { ...st, x, y, counts, fell: st.fell || fell };
  return { state, path, fell, moved: path.length > 0 };
}

/** Embestida hacia `dir`: rompe el bloque de enfrente. → { state, broke: bool } */
export function ram(lake, st, dir) {
  const [dx, dy] = DV[dir];
  const bx = st.x + dx; const by = st.y + dy;
  if (cellKind(lake, st, bx, by) !== 'block') return { state: st, broke: false };
  return { state: { ...st, broken: st.broken | (1 << lake.blockIndex(bx, by)) }, broke: true };
}

/** ¿Se puede sacar el bloque antiguo mirando hacia `dir`? */
export function canExtract(lake, st, dir) {
  const [dx, dy] = DV[dir];
  const a = lake.ancient;
  return Boolean(a) && st.x + dx === a[0] && st.y + dy === a[1] && !st.fell;
}

const keyOf = (st) => `${st.x},${st.y}|${st.broken}|${st.counts.join('')}`;

/**
 * Solucionador (BFS por acciones: mover 2/4/6/8, embestir 2/4/6/8, sacar). → { steps: [{ act, dir }…] | null,
 * explored, deadEnds } donde deadEnds = estados alcanzables sin caerse desde los que ya no hay solución.
 */
export function solveLake(lake = LAKE, { limit = 400000 } = {}) {
  const start = initialState(lake);
  const seen = new Map([[keyOf(start), null]]);
  const states = new Map([[keyOf(start), start]]);
  const queue = [start];
  let goal = null;
  for (let qi = 0; qi < queue.length && qi < limit; qi++) {
    const st = queue[qi];
    const k0 = keyOf(st);
    for (const d of [2, 4, 6, 8]) {
      if (canExtract(lake, st, d)) { goal = { from: k0, act: { act: 'sacar', dir: d } }; break; }
    }
    if (goal) break;
    for (const d of [2, 4, 6, 8]) {
      for (const [act, res] of [['mover', move(lake, st, d)], ['embestir', ram(lake, st, d)]]) {
        const next = res.state;
        if (next.fell || (act === 'mover' && !res.moved) || (act === 'embestir' && !res.broke)) continue;
        const k = keyOf(next);
        if (seen.has(k)) continue;
        seen.set(k, { from: k0, act: { act, dir: d } });
        states.set(k, next);
        queue.push(next);
      }
    }
  }
  if (!goal) return { steps: null, explored: seen.size };
  const steps = [goal.act];
  let k = goal.from;
  while (seen.get(k)) { const e = seen.get(k); steps.unshift(e.act); k = e.from; }
  return { steps, explored: seen.size };
}

/** Aplica una lista de pasos. → estado final (con solved si el último es «sacar» válido). */
export function runSteps(lake, steps, st = initialState(lake)) {
  let cur = st;
  for (const s of steps) {
    if (s.act === 'mover') cur = move(lake, cur, s.dir).state;
    else if (s.act === 'embestir') cur = ram(lake, cur, s.dir).state;
    else if (s.act === 'sacar') cur = { ...cur, solved: canExtract(lake, cur, s.dir) };
    if (cur.fell) break;
  }
  return cur;
}

/** Codifica/decodifica las pasadas en una cadena de dígitos (variable de partida). */
export const encodeCounts = (counts) => counts.map((c) => Math.min(PASSES, c)).join('');
export function decodeCounts(text, lake = LAKE) {
  const out = new Array(lake.ice.length).fill(0);
  const s = typeof text === 'string' ? text : '';
  for (let i = 0; i < out.length && i < s.length; i++) out[i] = Math.max(0, Math.min(PASSES, Number(s[i]) || 0));
  return out;
}

/**
 * Variante de borde de la placa (x, y) para la hoja b15_hielo_*.png (ver tools/b15_assets.mjs, ICE_EDGES): bordes
 * donde la vecina no es hielo del lago (roca, bloque y bloque antiguo cuentan como hielo debajo).
 */
export function iceFrame(lake, x, y) {
  const lakeCell = (cx, cy) => ['.', 'B', '#', 'A'].includes(lake.at(cx, cy));
  const n = !lakeCell(x, y - 1); const s = !lakeCell(x, y + 1); const e = !lakeCell(x + 1, y); const w = !lakeCell(x - 1, y);
  const table = [
    [[0, 0, 0, 0], (x * 7 + y * 3) % 4], [[1, 0, 0, 0], 4], [[0, 1, 0, 0], 5], [[0, 0, 1, 0], 6], [[0, 0, 0, 1], 7],
    [[1, 0, 0, 1], 8], [[1, 0, 1, 0], 9], [[0, 1, 0, 1], 10], [[0, 1, 1, 0], 11], [[1, 1, 0, 0], 12], [[0, 0, 1, 1], 13],
    [[1, 1, 0, 1], 14], [[1, 1, 1, 0], 15],
  ];
  const key = [n, s, e, w].map(Number).join('');
  const hit = table.find(([edges]) => edges.join('') === key);
  const i = hit ? hit[1] : 0;
  return { dir: [2, 4, 6, 8][Math.floor(i / 4)], pattern: i % 4 };
}
