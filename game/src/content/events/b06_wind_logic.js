// Lógica PURA de las ráfagas del Pilar del Impulso (docs/CAMPANA.md B06, «Mazmorra: Anillo de los Vientos y
// Galerías del Soplo»). Sin DOM ni motor: la usan los mapas (para crear los eventos), los guiones (para
// empujar al jugador) y los tests (solucionador BFS que demuestra que cada sala tiene solución y que la
// solución exige exactamente lo que dice el guion).
//
// Reglas (CAMPANA, literal): «Las casillas de ráfaga empujan una casilla por paso. Las de fuerza 1 solo se
// remontan montado; las de fuerza 2, nunca. Cada veleta cambia la dirección de las ráfagas de su sector en ciclo
// N→E→S→O.» Interpretación de juego:
//   · Al pisar una ráfaga, el viento empuja una casilla en su dirección; si la casilla de llegada es otra ráfaga,
//     vuelve a empujar (se encadenan) hasta dejar al jugador en una casilla en calma.
//   · Si el viento no encuentra salida (el empuje choca con la roca o la cadena se muerde la cola en un bucle), el
//     remolino DEVUELVE al jugador a la casilla desde la que entró: nunca se queda atrapado sobre una ráfaga.
//   · Remontar = entrar en una ráfaga caminando justo contra ella. Con fuerza 1 y montado en el 10 % no hay
//     empuje (el jugador se queda sobre ella y puede seguir subiendo); a pie, o con fuerza 2, el viento lo devuelve.
//   · Veleta: gira 90° en el sentido N→E→S→O todas las ráfagas de su sector.
//
// Salas en ASCII (una cadena por fila):
//   '#' roca/columna   '.' suelo en calma   '^ > v <' ráfaga de fuerza 1 (N, E, S, O)
//   '8 6 2 4' ráfaga de fuerza 2 (N, E, S, O, como el teclado numérico)   'S' entrada   'X' salida
//   'C' célula   'V' veleta (sólida; se usa desde una casilla vecina)   'E' otra marca libre (suelo)
// Sectores: capa ASCII opcional del mismo tamaño con letras minúsculas sobre las ráfagas.

export const DIR_VEC = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
export const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });
/** Ciclo de la veleta: N → E → S → O. */
export const VANE_CYCLE = Object.freeze([8, 6, 2, 4]);
export const DIR_LABEL = Object.freeze({ 8: 'norte', 6: 'este', 2: 'sur', 4: 'oeste' });

const GUST_CHARS = Object.freeze({
  '^': [8, 1], '>': [6, 1], v: [2, 1], '<': [4, 1],
  8: [8, 2], 6: [6, 2], 2: [2, 2], 4: [4, 2],
});
const FLOOR_CHARS = new Set(['.', 'S', 'X', 'C', 'E']);

export const opposite = (d) => 10 - d;

/** Gira una dirección k pasos del ciclo N→E→S→O. */
export function rotateDir(dir, k = 0) {
  const i = VANE_CYCLE.indexOf(dir);
  if (i < 0) throw new Error(`rotateDir: dirección inválida ${dir}`);
  return VANE_CYCLE[(((i + k) % 4) + 4) % 4];
}

/**
 * Interpreta una sala ASCII. → { w, h, rows, gusts: [{ x, y, dir, force, sector }], marks: { S, X, C, V: [] },
 *   blocked(x, y), gustAt(x, y) }
 */
export function parseRoom(rows, sectorRows = null) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('parseRoom: sala vacía');
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const gusts = [];
  const byKey = new Map();
  const marks = { S: [], X: [], C: [], V: [], E: [] };
  const solid = new Set();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = rows[y][x] ?? '#';
      const key = `${x},${y}`;
      if (GUST_CHARS[ch]) {
        const [dir, force] = GUST_CHARS[ch];
        const sc = sectorRows?.[y]?.[x];
        const sector = sc && /[a-z]/.test(sc) ? sc : null;
        const g = Object.freeze({ x, y, dir, force, sector });
        gusts.push(g);
        byKey.set(key, g);
      } else if (FLOOR_CHARS.has(ch)) {
        if (marks[ch]) marks[ch].push([x, y]);
      } else if (ch === 'V') {
        marks.V.push([x, y]);
        solid.add(key);
      } else if (ch === '#') {
        solid.add(key);
      } else {
        throw new Error(`parseRoom: carácter desconocido "${ch}" en (${x},${y})`);
      }
    }
  }
  return {
    w, h, rows, gusts, marks,
    blocked: (x, y) => x < 0 || y < 0 || x >= w || y >= h || solid.has(`${x},${y}`),
    gustAt: (x, y) => byKey.get(`${x},${y}`) || null,
  };
}

/** Dirección efectiva de una ráfaga con la configuración de veletas { sector: giros }. */
export function gustDir(gust, vanes = {}) {
  return gust.sector ? rotateDir(gust.dir, vanes[gust.sector] || 0) : gust.dir;
}

/**
 * Resuelve el viento tras pasar de (fromX, fromY) a (x, y) caminando en la dirección `arrived`.
 * `passable(x, y, d)` dice si se puede pasar de (x, y) a la vecina en `d`; `gustAt(x, y)` → ráfaga o null.
 * → { x, y, path: [[x, y]…] casillas recorridas empujado, ejected: bool (vuelve a from), climbing: bool,
 *     reason: 'calm'|'climb'|'blocked'|'loop'|'none' }.
 */
export function settleWind({ x, y, fromX, fromY, arrived, mounted = false, vanes = {}, gustAt, passable, maxSteps = 200 }) {
  const first = gustAt(x, y);
  if (!first) return { x, y, path: [], ejected: false, climbing: false, reason: 'none' };
  if (mounted && first.force === 1 && arrived === opposite(gustDir(first, vanes))) {
    return { x, y, path: [], ejected: false, climbing: true, reason: 'climb' };
  }
  const seen = new Set([`${x},${y}`]);
  const path = [];
  const eject = (reason) => ({ x: fromX ?? x, y: fromY ?? y, path, ejected: true, climbing: false, reason });
  for (let i = 0; i < maxSteps; i++) {
    const g = gustAt(x, y);
    if (!g) return { x, y, path, ejected: false, climbing: false, reason: 'calm' };
    const d = gustDir(g, vanes);
    if (!passable(x, y, d)) return eject('blocked');
    x += DIR_VEC[d][0];
    y += DIR_VEC[d][1];
    path.push([x, y]);
    const key = `${x},${y}`;
    if (seen.has(key)) return eject('loop');
    seen.add(key);
  }
  return eject('loop');
}

/**
 * Solucionador BFS de una sala (tests y diseño). Acciones: andar en 4 direcciones (con viento), montar/bajar
 * (si `canMount`) y girar una veleta desde una casilla vecina. `sectors` = { letra: [x, y] de su veleta }.
 * → { reachable: Set('x,y'), path: [acciones] | null, states } hasta `goal` ([x, y]) desde `start`.
 * opts: { start, goal, canMount = true, sectors = {}, initialVanes = {}, maxVaneTurns = Infinity, via = [] }
 * `via`: casillas que deben pisarse (p. ej. la célula) — el objetivo solo cuenta tras visitarlas todas.
 */
export function solveRoom(room, opts) {
  const { start, goal, canMount = true, sectors = {}, initialVanes = {}, maxVaneTurns = Infinity, via = [] } = opts;
  const letters = Object.keys(sectors).sort();
  const countTurns = Number.isFinite(maxVaneTurns);
  const viaKeys = via.map(([vx, vy]) => `${vx},${vy}`);
  const passable = (x, y, d) => !room.blocked(x + DIR_VEC[d][0], y + DIR_VEC[d][1]);
  const encode = (s) => `${s.x},${s.y},${s.m ? 1 : 0},${letters.map((l) => s.v[l] || 0).join('')},${s.t},${s.seen}`;
  const initVia = (x, y) => viaKeys.reduce((acc, k, i) => (k === `${x},${y}` ? acc | (1 << i) : acc), 0);
  const full = (1 << viaKeys.length) - 1;
  const first = { x: start[0], y: start[1], m: false, v: { ...initialVanes }, t: 0, seen: initVia(start[0], start[1]), path: [] };
  const queue = [first];
  const visited = new Set([encode(first)]);
  const reachable = new Set([`${first.x},${first.y}`]);
  while (queue.length) {
    const s = queue.shift();
    if (s.x === goal[0] && s.y === goal[1] && s.seen === full) return { reachable, path: s.path, states: visited.size };
    const next = [];
    for (const d of [2, 4, 6, 8]) {
      const nx = s.x + DIR_VEC[d][0];
      const ny = s.y + DIR_VEC[d][1];
      if (room.blocked(nx, ny)) continue;
      const r = settleWind({ x: nx, y: ny, fromX: s.x, fromY: s.y, arrived: d, mounted: s.m, vanes: s.v, gustAt: room.gustAt, passable });
      next.push({ ...s, x: r.x, y: r.y, seen: s.seen | initVia(r.x, r.y), path: [...s.path, DIR_NAME[d]] });
    }
    if (canMount && !room.gustAt(s.x, s.y)) next.push({ ...s, m: !s.m, path: [...s.path, s.m ? 'bajar' : 'montar'] });
    if (s.t < maxVaneTurns) {
      for (const l of letters) {
        const [vx, vy] = sectors[l];
        if (Math.abs(vx - s.x) + Math.abs(vy - s.y) !== 1) continue;
        next.push({ ...s, v: { ...s.v, [l]: ((s.v[l] || 0) + 1) % 4 }, t: countTurns ? s.t + 1 : 0, path: [...s.path, `veleta_${l}`] });
      }
    }
    for (const n of next) {
      const k = encode(n);
      if (visited.has(k)) continue;
      visited.add(k);
      reachable.add(`${n.x},${n.y}`);
      queue.push(n);
    }
  }
  return { reachable, path: null, states: visited.size };
}

/** ¿Hay solución cambiando solo las veletas de `only` (el resto fijas en su valor inicial)? */
export function solvableWith(room, opts, only) {
  const sectors = Object.fromEntries(Object.entries(opts.sectors || {}).filter(([l]) => only.includes(l)));
  return Boolean(solveRoom(room, { ...opts, sectors }).path);
}
