// Cámara de los Contrapesos (Pilar de la Masa, docs/CAMPANA.md B08): trazado y reglas PURAS del puzle. Lo usan el
// mapa (content/maps/b08/camara_contrapesos*.js), los eventos (b08_camara.js), los tests (tests/b08_*.test.mjs) y el
// recorrido E2E (tools/e2e_b08.mjs), así lo que se pinta, lo que se juega y lo que se prueba es lo mismo.
//
// Reglas (CAMPANA, literal): a pie el jugador pesa 1; montado en el 10 %, 3; un bloque de basalto, 2; una piedra
// suelta, 1. Las placas bajan con 3 o más y suben plataformas vinculadas. El suelo quebradizo se rompe con 3 o más
// (montado): el jugador cae a la galería inferior sin daño (C039) y tiene rampa de vuelta. La arena profunda solo se
// cruza montado. La Gran Balanza: tres platillos que deben pesar lo mismo, con el jugador sobre el C (donde está la
// palanca); 3 bloques y 3 piedras. Solución: A = bloque + bloque (4); B = bloque + piedra + piedra (4); C = piedra +
// jugador montado (1 + 3 = 4). Palanca de retorno en la entrada: devuelve bloques y piedras.
//
// Decisiones de implementación (README del bloque):
//   · Bloques y piedras se EMPUJAN caminando contra ellos y se pueden TIRAR de ellos (A delante): así un error no
//     deja el puzle bloqueado; la palanca de retorno lo devuelve todo a su sitio (también las losas rotas).
//   · La placa, una vez hundida, queda enclavada (la plataforma no vuelve a bajar).
//   · El contrapeso central solo cede si los tres platillos pesan lo mismo Y cargan con todo el peso de la cámara
//     (los seis contrapesos y el jugador): 4 + 4 + 4. Sin esa condición bastaría (1, 1, 1) a pie y la montura no
//     sería «imprescindible» como pide el guion. Los platillos tienen 2, 3 y 2 huecos (en C, uno es el del jugador),
//     así que la única solución es la de CAMPANA.
// El suelo quebradizo roto queda como agujero: el jugador cae por él (a pie o montado); los contrapesos no pasan.

export const CAMARA_W = 40;
export const CAMARA_H = 35;

/** Pesos (sin cifras en pantalla: la estela los cuenta con palabras). */
export const WEIGHT = Object.freeze({ stone: 1, block: 2, foot: 1, mounted: 3 });
/** Peso con el que se hunde una placa o se rompe el suelo quebradizo. */
export const PRESS = 3;
/** Peso que debe cargar cada platillo para que ceda el contrapeso central. */
export const PAN_TARGET = 4;

// Tipos de casilla del trazado.
export const CELL = Object.freeze({
  VOID: '#', FLOOR: '.', LOW: ',', ONLY_PLAYER: 'q', FRAGILE: 'F', SAND: 'S', PLATE: 'P', PIT: '_',
  STAIRS: '^', GATE: 'g', LEVER: 'L', SOLID: 'x', SOLID_LOW: 'y',
});
const PAN_CHARS = new Set(['A', 'B', 'C']);

/**
 * Trazado por rectángulos (inclusivos), en orden: los posteriores pisan a los anteriores. Coordenadas del mapa
 * camara_contrapesos (40×35; suelo de la sala x 3–36, y 4–33; alrededor, paredes del pincel `sala_gris`).
 */
const RECTS = Object.freeze([
  ['q', 4, 4, 12, 8], // cámara del núcleo (noroeste)
  ['q', 5, 9, 9, 12], // paso al núcleo (bajo un dintel)
  ['g', 6, 10, 8, 10], // losa sellada: baja cuando la Balanza cede
  ['.', 5, 13, 34, 17], // terraza de la Gran Balanza
  ['A', 11, 12, 12, 12], // platillo A (oeste): 2 huecos
  ['B', 17, 12, 19, 12], // platillo B (centro): 3 huecos
  ['C', 24, 12, 25, 12], // platillo C (el de la palanca): 2 huecos
  ['L', 25, 11, 25, 11], // palanca de la Balanza (solo se alcanza desde el hueco este del C)
  ['F', 17, 18, 19, 21], // puente de suelo quebradizo sobre la sima
  ['.', 10, 22, 25, 29], // sala de entrada
  ['q', 13, 30, 15, 33], // pasillo de entrada (sin contrapesos: no se tapa la salida)
  ['S', 26, 23, 29, 26], // arena profunda (solo montado) hacia el ala este
  ['.', 30, 20, 35, 27], // ala este
  ['_', 31, 18, 33, 19], // foso: la plataforma sube con la placa
  ['P', 34, 21, 34, 21], // placa
  ['^', 31, 28, 33, 30], // escalinata entre el ala este y la galería inferior
  [',', 21, 31, 35, 33], // galería inferior (debajo de la sima)
]);

/**
 * Decoración con base que bloquea (se pinta en el build y se marca sólida aquí). stamp = nombre en Cueva1;
 * `solid` = casillas [dx, dy] del stamp que bloquean.
 */
export const DECOR = Object.freeze([
  // Paso al núcleo: dintel con sus dos pilares a los lados de la losa.
  { stamp: 'pilar_dintel', x: 5, y: 8, solid: [[0, 2], [0, 3], [4, 2], [4, 3]] },
  // Cámara del núcleo: columnas a los lados de la cámara hexagonal.
  { stamp: 'pilar_columna', x: 4, y: 4, solid: [[0, 2]] },
  { stamp: 'pilar_columna', x: 12, y: 4, solid: [[0, 2]] },
  { stamp: 'pilar_arista', x: 4, y: 7, solid: [[0, 1]] },
  { stamp: 'pilar_arista_grande', x: 11, y: 7, solid: [[0, 1], [1, 1]] },
  // Terraza: monolitos en los extremos y columnas junto a la sima.
  { stamp: 'pilar_monolito', x: 5, y: 13, solid: [[0, 2], [1, 2]] },
  { stamp: 'pilar_columna', x: 34, y: 13, solid: [[0, 2]] },
  { stamp: 'pilar_columna_quebrada', x: 14, y: 16, solid: [[0, 1]] },
  { stamp: 'pilar_columna_quebrada', x: 22, y: 16, solid: [[0, 1]] },
  // Sala de entrada: estela con las reglas (lectura desde abajo o de lado) y columnas.
  { stamp: 'pilar_placa_unown', x: 16, y: 28, solid: [[0, 1], [1, 1]], id: 'estela' },
  { stamp: 'pilar_columna', x: 10, y: 22, solid: [[0, 2]] },
  { stamp: 'pilar_columna', x: 25, y: 22, solid: [[0, 2]] },
  { stamp: 'pilar_arista', x: 24, y: 28, solid: [[0, 1]] },
  // Ala este y galería inferior.
  { stamp: 'pilar_columna_quebrada', x: 35, y: 26, solid: [[0, 1]] },
  { stamp: 'pilar_arista', x: 30, y: 26, solid: [[0, 1]] },
  { stamp: 'roca_grande_gris', x: 34, y: 31, solid: [[0, 1], [1, 1], [0, 2], [1, 2]], low: true },
  { stamp: 'roca_peque_gris', x: 21, y: 32, solid: [[0, 1]], low: true },
]);

/** Eventos sólidos fijos (objetos en el suelo): cuentan como roca para el puzle. */
export const SOLID_EVENTS = Object.freeze([
  Object.freeze({ id: 'objeto_camara', x: 33, y: 33, low: true }),
]);

/** Puntos con nombre. */
export const SPOTS = Object.freeze({
  entry: Object.freeze({ x: 14, y: 33, dir: 8 }), // llegada desde el Cerro Plomo
  exitWarp: Object.freeze({ x: 14, y: 34 }), // claridad de la salida (pared sur)
  resetLever: Object.freeze({ x: 12, y: 28 }),
  plaque: Object.freeze({ x: 16, y: 29 }), // casilla baja de la estela (la de la izquierda)
  landing: Object.freeze({ x: 23, y: 32 }), // donde se cae desde el suelo quebradizo
  lever: Object.freeze({ x: 25, y: 11 }),
  leverFrom: Object.freeze({ x: 25, y: 12, dir: 8 }),
  gate: Object.freeze([[6, 10], [7, 10], [8, 10]]),
  gateFront: Object.freeze([[6, 11], [7, 11], [8, 11]]), // Fermín reta aquí (antes de la losa)
  fermin: Object.freeze({ x: 7, y: 11, dir: 2 }),
  ferminRetry: Object.freeze({ x: 7, y: 14, dir: 8 }),
  pedestal: Object.freeze({ x: 8, y: 6 }),
  pedestalFront: Object.freeze({ x: 8, y: 7, dir: 8 }),
  c039: Object.freeze({ x: 22, y: 31 }),
  c040: Object.freeze({ x: 21, y: 13 }),
  pivot: Object.freeze({ x: 18, y: 10 }), // eje de la Gran Balanza (sobre la sima, detrás del platillo B)
});

/** Posiciones iniciales de los contrapesos. */
export const PIECES = Object.freeze({
  b1: Object.freeze({ kind: 'block', x: 18, y: 24 }),
  b2: Object.freeze({ kind: 'block', x: 13, y: 26 }),
  b3: Object.freeze({ kind: 'block', x: 22, y: 27 }),
  o1: Object.freeze({ kind: 'stone', x: 25, y: 32 }),
  o2: Object.freeze({ kind: 'stone', x: 28, y: 32 }),
  o3: Object.freeze({ kind: 'stone', x: 32, y: 32 }),
});
export const PIECE_IDS = Object.freeze(Object.keys(PIECES));

export const PANS = Object.freeze({
  A: Object.freeze([[11, 12], [12, 12]]),
  B: Object.freeze([[17, 12], [18, 12], [19, 12]]),
  C: Object.freeze([[24, 12], [25, 12]]),
});
export const PAN_NAMES = Object.freeze({ A: 'del oeste', B: 'del centro', C: 'de la palanca' });

const key = (x, y) => `${x},${y}`;
const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
export const DIR_NAME = Object.freeze({ 2: 'down', 4: 'left', 6: 'right', 8: 'up' });

/** Rejilla de caracteres [y][x] del trazado (decoración incluida). */
export function buildGrid() {
  const g = Array.from({ length: CAMARA_H }, () => Array(CAMARA_W).fill(CELL.VOID));
  for (const [ch, x0, y0, x1, y1] of RECTS) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = ch;
  }
  for (const d of DECOR) for (const [dx, dy] of d.solid) g[d.y + dy][d.x + dx] = d.low ? CELL.SOLID_LOW : CELL.SOLID;
  for (const e of SOLID_EVENTS) g[e.y][e.x] = e.low ? CELL.SOLID_LOW : CELL.SOLID;
  g[SPOTS.resetLever.y][SPOTS.resetLever.x] = CELL.SOLID;
  g[SPOTS.pedestal.y][SPOTS.pedestal.x] = CELL.SOLID;
  return g;
}

export const GRID = Object.freeze(buildGrid().map((row) => Object.freeze(row)));

export function cellAt(x, y) {
  if (x < 0 || y < 0 || x >= CAMARA_W || y >= CAMARA_H) return CELL.VOID;
  return GRID[y][x];
}

/** Casillas de un tipo. */
export function cellsOf(ch) {
  const out = [];
  for (let y = 0; y < CAMARA_H; y++) for (let x = 0; x < CAMARA_W; x++) if (GRID[y][x] === ch) out.push([x, y]);
  return out;
}

/** Platillo de una casilla ('A' | 'B' | 'C' | null). */
export function panAt(x, y) {
  const c = cellAt(x, y);
  return PAN_CHARS.has(c) ? c : null;
}

// ───────────────────────────── Estado ─────────────────────────────

/** Estado inicial: contrapesos en su sitio, sin agujeros, placa arriba, Balanza sin resolver. */
export function initialPuzzle() {
  const pieces = {};
  for (const id of PIECE_IDS) pieces[id] = [PIECES[id].x, PIECES[id].y];
  return { pieces, holes: [], plate: false, solved: false };
}

/** Normaliza un estado guardado (tolerante con partidas antiguas o datos incompletos). Nuevo objeto. */
export function normalizePuzzle(raw) {
  const base = initialPuzzle();
  if (!raw || typeof raw !== 'object') return base;
  const pieces = { ...base.pieces };
  for (const id of PIECE_IDS) {
    const p = raw.pieces?.[id];
    if (Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1])) pieces[id] = [p[0], p[1]];
  }
  const holes = Array.isArray(raw.holes) ? raw.holes.filter((h) => typeof h === 'string' && cellAt(...h.split(',').map(Number)) === CELL.FRAGILE) : [];
  return { pieces, holes: [...new Set(holes)], plate: Boolean(raw.plate), solved: Boolean(raw.solved) };
}

export const isHole = (st, x, y) => st.holes.includes(key(x, y));
export const pieceAt = (st, x, y) => PIECE_IDS.find((id) => st.pieces[id][0] === x && st.pieces[id][1] === y) || null;
export const pieceWeight = (id) => WEIGHT[PIECES[id].kind];
export const playerWeightOf = (mounted) => (mounted ? WEIGHT.mounted : WEIGHT.foot);

/** ¿Puede estar el jugador en (x, y)? (sin contar el efecto de caer). */
export function playerCanStand(st, x, y, mounted) {
  const c = cellAt(x, y);
  if (pieceAt(st, x, y)) return false;
  switch (c) {
    case CELL.FLOOR: case CELL.LOW: case CELL.ONLY_PLAYER: case CELL.PLATE: case CELL.STAIRS: return true;
    case CELL.FRAGILE: return true; // montado se rompe (ver step)
    case CELL.SAND: return mounted;
    case CELL.PIT: return st.plate;
    case CELL.GATE: return st.solved;
    default: return PAN_CHARS.has(c);
  }
}

/** ¿Puede entrar un contrapeso en (x, y)? */
export function pieceCanEnter(st, x, y) {
  const c = cellAt(x, y);
  if (pieceAt(st, x, y)) return false;
  switch (c) {
    case CELL.FLOOR: case CELL.LOW: case CELL.PLATE: case CELL.STAIRS: return true;
    case CELL.FRAGILE: return !isHole(st, x, y);
    case CELL.PIT: return st.plate;
    default: return PAN_CHARS.has(c);
  }
}

/** Casilla libre más cercana a la de caída (por si hay una piedra encima). */
export function landingSpot(st) {
  const { x, y } = SPOTS.landing;
  if (playerCanStand(st, x, y, false)) return [x, y];
  const low = cellsOf(CELL.LOW).filter(([cx, cy]) => playerCanStand(st, cx, cy, false));
  low.sort((a, b) => (Math.abs(a[0] - x) + Math.abs(a[1] - y)) - (Math.abs(b[0] - x) + Math.abs(b[1] - y)));
  return low[0] || [x, y];
}

/**
 * Consecuencia de que el jugador quede en (x, y) con ese peso: la placa se enclava, el suelo quebradizo se rompe y
 * se cae (o se cae por un agujero). → { state, fell, broke, pressed, at: [x, y] }
 */
export function settle(st, x, y, mounted) {
  let state = st;
  let pressed = false;
  let broke = false;
  const c = cellAt(x, y);
  const w = playerWeightOf(mounted);
  if (c === CELL.PLATE && w >= PRESS && !state.plate) { state = { ...state, plate: true }; pressed = true; }
  if (c === CELL.FRAGILE && (isHole(state, x, y) || w >= PRESS)) {
    if (!isHole(state, x, y)) { state = { ...state, holes: [...state.holes, key(x, y)] }; broke = true; }
    return { state, fell: true, broke, pressed, at: landingSpot(state) };
  }
  return { state, fell: false, broke, pressed, at: [x, y] };
}

/**
 * El jugador en (px, py) avanza hacia `dir`. → { ok, kind: 'walk'|'push'|'blocked', state, at, fell, broke, pressed,
 * moved: id del contrapeso empujado }. Empujar no mueve al jugador (como la Fuerza de Essentials).
 */
export function step(st, px, py, dir, mounted) {
  const [ox, oy] = DV[dir];
  const nx = px + ox; const ny = py + oy;
  const id = pieceAt(st, nx, ny);
  if (id) {
    const tx = nx + ox; const ty = ny + oy;
    if (!pieceCanEnter(st, tx, ty)) return { ok: false, kind: 'blocked', state: st, at: [px, py] };
    const state = { ...st, pieces: { ...st.pieces, [id]: [tx, ty] } };
    return { ok: true, kind: 'push', state, at: [px, py], moved: id, fell: false, broke: false, pressed: false };
  }
  if (!playerCanStand(st, nx, ny, mounted)) return { ok: false, kind: 'blocked', state: st, at: [px, py] };
  const r = settle(st, nx, ny, mounted);
  return { ok: true, kind: 'walk', ...r };
}

/**
 * Tirar del contrapeso que hay delante (en `dir`): el contrapeso ocupa la casilla del jugador y el jugador retrocede
 * una. → mismo formato que step (kind 'pull').
 */
export function pull(st, px, py, dir, mounted) {
  const [ox, oy] = DV[dir];
  const id = pieceAt(st, px + ox, py + oy);
  const bx = px - ox; const by = py - oy;
  if (!id || !pieceCanEnter({ ...st, pieces: { ...st.pieces, [id]: [-9, -9] } }, px, py)) return { ok: false, kind: 'blocked', state: st, at: [px, py] };
  if (!playerCanStand(st, bx, by, mounted)) return { ok: false, kind: 'blocked', state: st, at: [px, py] };
  const moved = { ...st, pieces: { ...st.pieces, [id]: [px, py] } };
  const r = settle(moved, bx, by, mounted);
  return { ok: true, kind: 'pull', moved: id, ...r };
}

/** Palanca de retorno: contrapesos a su sitio y losas rotas repuestas (la placa sigue enclavada). */
export function resetPieces(st) {
  const base = initialPuzzle();
  return { ...st, pieces: base.pieces, holes: [] };
}

// ───────────────────────────── La Gran Balanza ─────────────────────────────

/** Peso de cada platillo (con el jugador si está sobre uno). → { A, B, C } */
export function panWeights(st, player = null) {
  const out = { A: 0, B: 0, C: 0 };
  for (const id of PIECE_IDS) {
    const pan = panAt(...st.pieces[id]);
    if (pan) out[pan] += pieceWeight(id);
  }
  if (player) {
    const pan = panAt(player.x, player.y);
    if (pan) out[pan] += playerWeightOf(player.mounted);
  }
  return out;
}

/**
 * Lectura de la Balanza al tirar de la palanca. → { solved, level (los tres iguales), light (iguales pero sin todo
 * el peso), heavy: [platillos más pesados], lightest: [más ligeros], weights }
 */
export function balanceReading(st, player) {
  const weights = panWeights(st, player);
  const vals = Object.values(weights);
  const max = Math.max(...vals);
  const min = Math.min(...vals);
  const level = max === min;
  const solved = level && vals.every((v) => v === PAN_TARGET);
  const heavy = Object.keys(weights).filter((k) => weights[k] === max);
  const lightest = Object.keys(weights).filter((k) => weights[k] === min);
  return { solved, level, light: level && !solved, heavy: level ? [] : heavy, lightest: level ? [] : lightest, weights };
}

/** Posición visible de cada platillo (sin el jugador): 'level' | 'down' | 'up'. */
export function panView(st, pan) {
  const w = panWeights(st);
  const max = Math.max(w.A, w.B, w.C);
  const min = Math.min(w.A, w.B, w.C);
  if (max === min) return 'level';
  if (w[pan] === max) return 'down';
  if (w[pan] === min) return 'up';
  return 'level';
}

/**
 * Todas las formas de repartir 3 bloques y 3 piedras en los platillos (A 2 huecos, B 3, C 1 + el jugador) con el
 * jugador a pie o montado, y cuáles resuelven. Para el test «la montura es imprescindible». → [{ A, B, C, mounted }]
 */
export function balanceSolutions() {
  const out = [];
  const counts = [];
  for (let aB = 0; aB <= 2; aB++) for (let aS = 0; aS + aB <= 2; aS++) {
    for (let bB = 0; bB + aB <= 3; bB++) for (let bS = 0; bS + bB <= 3 && bS + aS <= 3; bS++) {
      for (let cB = 0; cB + aB + bB <= 3; cB++) for (let cS = 0; cS + cB <= 1 && cS + aS + bS <= 3; cS++) {
        counts.push({ aB, aS, bB, bS, cB, cS });
      }
    }
  }
  for (const c of counts) {
    for (const mounted of [false, true]) {
      const A = c.aB * 2 + c.aS; const B = c.bB * 2 + c.bS; const C = c.cB * 2 + c.cS + playerWeightOf(mounted);
      if (A === B && B === C && A === PAN_TARGET) out.push({ ...c, mounted });
    }
  }
  return out;
}

// ───────────────────────────── Planificador (tests y E2E) ─────────────────────────────

/**
 * Ruta del jugador (sin empujar nada) hasta (tx, ty) respetando las reglas. opts: { mounted, allowFall = false }.
 * No rompe suelo: el suelo quebradizo se pisa solo a pie. → lista de direcciones o null.
 */
export function walkRoute(st, from, to, { mounted = false } = {}) {
  const [sx, sy] = from;
  const seen = new Map([[key(sx, sy), null]]);
  const queue = [[sx, sy]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x === to[0] && y === to[1]) {
      const out = [];
      let k = key(x, y);
      while (seen.get(k)) { const [pk, d] = seen.get(k); out.unshift(d); k = pk; }
      return out;
    }
    for (const d of [2, 4, 6, 8]) {
      const nx = x + DV[d][0]; const ny = y + DV[d][1];
      if (seen.has(key(nx, ny)) || !playerCanStand(st, nx, ny, mounted)) continue;
      if (cellAt(nx, ny) === CELL.FRAGILE && (mounted || isHole(st, nx, ny))) continue;
      seen.set(key(nx, ny), [key(x, y), d]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

/** ¿Se puede montar (want = true) o bajar en (x, y) sin efectos (romper suelo, hundir la placa, hundirse en arena)? */
export function canToggleMount(st, x, y, want) {
  const c = cellAt(x, y);
  if (want) return c !== CELL.FRAGILE && !(c === CELL.PLATE && !st.plate);
  return c !== CELL.SAND;
}

/**
 * Lleva el contrapeso `id` hasta (tx, ty) empujando y tirando (BFS sobre jugador + contrapeso + montura; los demás
 * contrapesos quietos). Nunca rompe suelo ni cae. → { actions: ['up'|…|'pull:up'|'montar'|'bajar'], state, player }
 * o null. `player` = { x, y, mounted } de partida.
 */
/** Coste de cada acción del planificador: se prefiere empujar (como un jugador) a tirar o montar. */
const COST = Object.freeze({ move: 1, push: 1, pull: 6, mount: 3 });

export function planPiece(st, id, target, player) {
  // Estados codificados como enteros (jugador, contrapeso, montura) en arrays planos: el espacio es pequeño
  // (40×35 × 40×35 × 2) y así la búsqueda completa tarda poco incluso cuando no hay plan.
  const W = CAMARA_W;
  const N = W * CAMARA_H;
  const idx = (x, y) => y * W + x;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < CAMARA_H;
  const others = new Set(PIECE_IDS.filter((p) => p !== id).map((p) => idx(...st.pieces[p])));
  const holes = new Set(st.holes.map((h) => idx(...h.split(',').map(Number))));
  const floorFor = (c, x, y, forPiece, m) => {
    switch (c) {
      case CELL.FLOOR: case CELL.LOW: case CELL.STAIRS: return true;
      case CELL.ONLY_PLAYER: return !forPiece;
      case CELL.PLATE: return forPiece || !m || st.plate; // montado no se pisa a mitad de plan
      case CELL.FRAGILE: return !holes.has(idx(x, y)) && (forPiece || !m);
      case CELL.SAND: return !forPiece && m;
      case CELL.PIT: return st.plate;
      case CELL.GATE: return !forPiece && st.solved;
      default: return PAN_CHARS.has(c);
    }
  };
  const free = (x, y, bx, by, forPiece, m = false) => inside(x, y) && !(x === bx && y === by) && !others.has(idx(x, y))
    && floorFor(GRID[y][x], x, y, forPiece, m);
  const enc = (px, py, bx, by, m) => ((idx(px, py) * N + idx(bx, by)) << 1) | (m ? 1 : 0);
  const size = N * N * 2;
  const best = new Int32Array(size).fill(-1);
  const prevState = new Int32Array(size).fill(-1);
  const prevAction = new Uint8Array(size);
  const ACTIONS = ['down', 'left', 'right', 'up', 'pull:down', 'pull:left', 'pull:right', 'pull:up', 'montar', 'bajar'];
  const A = Object.fromEntries(ACTIONS.map((a, i) => [a, i]));
  const [b0x, b0y] = st.pieces[id];
  const start = enc(player.x, player.y, b0x, b0y, player.mounted);
  best[start] = 0;
  const buckets = [[start]];
  const decode = (s) => {
    const m = (s & 1) === 1;
    const rest = s >>> 1;
    const p = Math.floor(rest / N);
    const b = rest % N;
    return [p % W, Math.floor(p / W), b % W, Math.floor(b / W), m];
  };
  for (let cost = 0; cost < buckets.length; cost++) {
    const bucket = buckets[cost];
    if (!bucket) continue;
    for (let qi = 0; qi < bucket.length; qi++) {
      const here = bucket[qi];
      if (best[here] !== cost) continue;
      const [px, py, bx, by, m] = decode(here);
      if (bx === target[0] && by === target[1]) {
        const actions = [];
        for (let k = here; prevState[k] !== -1; k = prevState[k]) actions.unshift(ACTIONS[prevAction[k]]);
        return { actions, state: { ...st, pieces: { ...st.pieces, [id]: [bx, by] } }, player: { x: px, y: py, mounted: m } };
      }
      const add = (nx, ny, nbx, nby, nm, a, c) => {
        const k = enc(nx, ny, nbx, nby, nm);
        const nc = cost + c;
        if (best[k] !== -1 && best[k] <= nc) return;
        best[k] = nc;
        prevState[k] = here;
        prevAction[k] = A[a];
        (buckets[nc] ||= []).push(k);
      };
      // montar / bajar (sin romper suelo, sin quedarse a pie en la arena y sin hundir la placa a mitad de plan)
      if (canToggleMount(st, px, py, !m)) add(px, py, bx, by, !m, m ? 'bajar' : 'montar', COST.mount);
      for (const d of [2, 4, 6, 8]) {
        const [ox, oy] = DV[d];
        const nx = px + ox; const ny = py + oy;
        if (nx === bx && ny === by) {
          if (free(bx + ox, by + oy, -9, -9, true)) add(px, py, bx + ox, by + oy, m, DIR_NAME[d], COST.push); // empujar
          continue;
        }
        if (!free(nx, ny, bx, by, false, m)) continue;
        add(nx, ny, bx, by, m, DIR_NAME[d], COST.move);
        // tirar: el contrapeso está al otro lado (en la dirección contraria al paso)
        if (px - ox === bx && py - oy === by && free(px, py, -9, -9, true)) add(nx, ny, px, py, m, `pull:${DIR_NAME[10 - d]}`, COST.pull);
      }
    }
  }
  return null;
}

/** Aplica una lista de acciones del planificador al estado (para comprobar un plan). → { state, player } */
export function applyActions(st, player, actions) {
  let state = st;
  let p = { ...player };
  const NAME_DIR = { down: 2, left: 4, right: 6, up: 8 };
  for (const a of actions) {
    if (a === 'montar' || a === 'bajar') {
      p = { ...p, mounted: a === 'montar' };
      const r = settle(state, p.x, p.y, p.mounted);
      state = r.state;
      if (r.fell) p = { ...p, x: r.at[0], y: r.at[1] };
      continue;
    }
    const isPull = a.startsWith('pull:');
    const d = NAME_DIR[isPull ? a.slice(5) : a];
    const r = isPull ? pull(state, p.x, p.y, d, p.mounted) : step(state, p.x, p.y, d, p.mounted);
    if (!r.ok) throw new Error(`Acción imposible «${a}» desde (${p.x},${p.y})`);
    state = r.state;
    p = { ...p, x: r.at[0], y: r.at[1] };
  }
  return { state, player: p };
}

/** Destinos de la solución de referencia (CAMPANA): A = b2 + b3, B = b1 + o1 + o2, C = o3 + jugador montado. */
export const SOLUTION_TARGETS = Object.freeze([
  ['b1', [18, 12]], ['b2', [11, 12]], ['b3', [12, 12]],
  ['o1', [17, 12]], ['o2', [19, 12]], ['o3', [24, 12]],
]);

/**
 * Plan completo de referencia desde la entrada: los tres bloques a pie por el puente, montar y pisar la placa, las
 * tres piedras por la escalinata y la plataforma, y el jugador montado en el hueco de la palanca. → { actions, state,
 * player } (el estado final aún no tiene `solved`: lo pone la palanca).
 */
export function referencePlan(start = { x: SPOTS.entry.x, y: SPOTS.entry.y, mounted: false }) {
  let state = initialPuzzle();
  let player = { ...start };
  const actions = [];
  const run = (list) => {
    const r = applyActions(state, player, list);
    state = r.state;
    player = r.player;
    actions.push(...list);
  };
  const goTo = (x, y, mounted) => {
    if (player.mounted !== mounted) run([mounted ? 'montar' : 'bajar']);
    const route = walkRoute(state, [player.x, player.y], [x, y], { mounted });
    if (!route) throw new Error(`Sin ruta a (${x},${y})`);
    run(route.map((d) => DIR_NAME[d]));
  };
  for (const [id, target] of SOLUTION_TARGETS.slice(0, 3)) {
    const plan = planPiece(state, id, target, player);
    if (!plan) throw new Error(`Sin plan para ${id}`);
    run(plan.actions);
  }
  goTo(24, 24, false); // de vuelta a la sala de entrada, a pie por el puente
  goTo(33, 23, true); // al ala este por la arena, montado
  goTo(34, 21, true); // la placa: la plataforma sube
  for (const [id, target] of SOLUTION_TARGETS.slice(3)) {
    const plan = planPiece(state, id, target, player);
    if (!plan) throw new Error(`Sin plan para ${id}`);
    run(plan.actions);
  }
  goTo(SPOTS.leverFrom.x, SPOTS.leverFrom.y, true);
  return { actions, state, player };
}
