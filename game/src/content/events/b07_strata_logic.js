// Reglas PURAS del rescate estratigráfico de la Cantería Solano (docs/TABLILLAS.md T04; CAMPANA B07): «Nunca
// rompas la capa que sostiene a otra». Las rocas del derrumbe tienen el color de su estrato; se rompen con
// Embestida de arriba abajo. Una roca SOSTIENE a otra si se tocan (vecinas en cruz) y la otra es de un estrato
// más alto (más joven). Romper una roca que sostiene otra provoca un pequeño derrumbe y la sala se reinicia.
// Sin DOM ni motor: lo usan los eventos (content/events/b07_galerias.js), el mapa y los tests (solucionador).
//
// Salas ASCII (content/events/b07_strata_rooms.js), una fila por cadena:
//   '#' escombro macizo (no se rompe)   '.' suelo   'a'–'d' roca de estrato (a = arriba … d = abajo)
//   'S' llegada a la sala   'E' salida (paso a la sala siguiente)   'T' Timburr atrapado   'Q' Quino
//   'X' casilla de la Tablilla (aparece al romper la última roca del último estrato)
//   'o' objeto a la vista (ocupa su casilla hasta cogerlo: el solucionador lo trata como pared)
//   'v' saliente (solo se salta hacia el sur)   ' ' fuera de la sala

/** Estratos de arriba (joven) abajo (antiguo): letra de la sala, nombre y color de la hoja de arte. */
export const STRATA = Object.freeze([
  Object.freeze({ key: 'a', n: 1, name: 'arenisca ocre', short: 'ocre', row: 2 }),
  Object.freeze({ key: 'b', n: 2, name: 'caliza gris', short: 'gris', row: 4 }),
  Object.freeze({ key: 'c', n: 3, name: 'arcilla roja', short: 'roja', row: 6 }),
  Object.freeze({ key: 'd', n: 4, name: 'pizarra negra', short: 'negra', row: 8 }),
]);
const BY_KEY = Object.fromEntries(STRATA.map((s) => [s.key, s]));

export const stratumOf = (key) => BY_KEY[key] || null;

const DIRS = Object.freeze([[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]);
const FLOOR_MARKS = new Set(['.', 'S', 'E', 'X']);

/**
 * Sala ASCII → { w, h, rows, rocks[{ i, x, y, key, n }], marks{ S:[[x,y]], E, T, Q, X, o, v }, solid(x,y), ledge(x,y) }.
 * `rocks[i].i` es el bit de la roca en la variable de la sala (orden de lectura: filas y luego columnas).
 */
export function parseRoom(ascii) {
  const rows = ascii.map((r) => r.replace(/\s+$/, ''));
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const rocks = [];
  const marks = { S: [], E: [], T: [], Q: [], X: [], o: [], v: [] };
  const cell = (x, y) => (y >= 0 && y < h ? rows[y][x] ?? ' ' : ' ');
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = cell(x, y);
      if (BY_KEY[ch]) rocks.push({ i: rocks.length, x, y, key: ch, n: BY_KEY[ch].n });
      else if (marks[ch]) marks[ch].push([x, y]);
    }
  }
  const walkable = (x, y) => {
    const ch = cell(x, y);
    return FLOOR_MARKS.has(ch) || Boolean(BY_KEY[ch]) || ch === 'T' || ch === 'Q';
  };
  return {
    w, h, rows, rocks, marks,
    cell,
    /** Casilla de suelo (aunque tenga una roca o un Pokémon encima). */
    floor: walkable,
    ledge: (x, y) => cell(x, y) === 'v',
  };
}

/** Casilla → roca de `rocks` (lista de las que quedan) o null. */
function rockAt(rocks, x, y) {
  return rocks.find((r) => r.x === x && r.y === y) || null;
}

/** Rocas de `remaining` que `rock` sostiene: vecinas en cruz de un estrato más alto (n menor). */
export function supported(remaining, rock) {
  return DIRS.map(([, dx, dy]) => rockAt(remaining, rock.x + dx, rock.y + dy))
    .filter((q) => q && q.n < rock.n);
}

/** ¿Se puede romper `rock` sin que se venga abajo lo que tiene encima? */
export function canBreak(remaining, rock) {
  return supported(remaining, rock).length === 0;
}

/** Rocas que quedan a partir de la máscara de rotas (bit i = roca i rota). */
export function remainingRocks(room, brokenMask) {
  return room.rocks.filter((r) => !(brokenMask & (1 << r.i)));
}

/** Máscara con todos los bits de las rocas de la sala. */
export const fullMask = (room) => (room.rocks.length ? (1 << room.rocks.length) - 1 : 0);

// ───────────────────────────── Solucionador (tests y comprobaciones) ─────────────────────────────

/**
 * Movimientos del jugador desde (x, y) con las rocas que quedan (`broken`) y los rescatados (`freed`).
 * Devuelve [[nx, ny, dir]]: saltar un saliente cuenta como un paso que cae dos casillas al sur.
 */
function steps(room, x, y, broken, freed) {
  const out = [];
  const people = [...room.marks.T, ...room.marks.Q];
  // El pozo de salida (E) sigue tapado con tablones hasta sacar a todos los atrapados de la sala.
  const exitOpen = freed === (people.length ? (1 << people.length) - 1 : 0);
  const blocked = (nx, ny) => {
    if (!room.floor(nx, ny)) return true;
    if (!exitOpen && room.marks.E.some(([ex, ey]) => ex === nx && ey === ny)) return true;
    const rock = room.rocks.find((r) => r.x === nx && r.y === ny);
    if (rock && !(broken & (1 << rock.i))) return true;
    const k = people.findIndex(([px, py]) => px === nx && py === ny);
    return k >= 0 && !(freed & (1 << k));
  };
  for (const [d, dx, dy] of DIRS) {
    const nx = x + dx; const ny = y + dy;
    if (room.ledge(nx, ny)) {
      if (d === 2 && !blocked(nx, ny + 1)) out.push([nx, ny + 1, d]);
      continue;
    }
    if (!blocked(nx, ny)) out.push([nx, ny, d]);
  }
  return out;
}

/**
 * Meta por defecto de una sala: todos los atrapados rescatados y el jugador sobre una salida `E`; si la sala no
 * tiene salida (la última), rescatados y todas las rocas del estrato más bajo rotas (aparece la Tablilla).
 */
export function defaultGoal(room) {
  const people = [...room.marks.T, ...room.marks.Q];
  const allFreed = people.length ? (1 << people.length) - 1 : 0;
  const exits = room.marks.E;
  const deepest = Math.max(0, ...room.rocks.map((r) => r.n));
  const lastMask = room.rocks.filter((r) => r.n === deepest).reduce((m, r) => m | (1 << r.i), 0);
  if (exits.length) return (s) => s.freed === allFreed && exits.some(([ex, ey]) => ex === s.x && ey === s.y);
  return (s) => s.freed === allFreed && (s.broken & lastMask) === lastMask;
}

/**
 * Búsqueda en anchura sobre (posición, rocas rotas, rescatados) con roturas LEGALES. `goal(state)` decide el final
 * (por defecto `defaultGoal`). → { solved, actions: [{ type: 'move'|'break'|'free', x, y, dir }], states, traps }
 * donde `traps` son las rocas que el jugador llega a tener delante sin poder romperlas (se vendría abajo la sala).
 */
export function solveRoom(room, { start = room.marks.S[0], goal = null, maxStates = 400000 } = {}) {
  const people = [...room.marks.T, ...room.marks.Q];
  const isGoal = goal || defaultGoal(room);
  const key = (s) => `${s.x},${s.y},${s.broken},${s.freed}`;
  const first = { x: start[0], y: start[1], broken: 0, freed: 0 };
  const prev = new Map([[key(first), null]]);
  const queue = [first];
  const traps = new Set();
  let found = null;
  for (let qi = 0; qi < queue.length && qi < maxStates; qi++) {
    const s = queue[qi];
    if (isGoal(s)) { found = s; break; }
    const next = [];
    for (const [nx, ny, dir] of steps(room, s.x, s.y, s.broken, s.freed)) next.push([{ ...s, x: nx, y: ny }, { type: 'move', x: nx, y: ny, dir }]);
    const left = remainingRocks(room, s.broken);
    for (const [d, dx, dy] of DIRS) {
      const tx = s.x + dx; const ty = s.y + dy;
      const rock = rockAt(left, tx, ty);
      if (rock) {
        if (canBreak(left, rock)) next.push([{ ...s, broken: s.broken | (1 << rock.i) }, { type: 'break', x: tx, y: ty, dir: d }]);
        else traps.add(rock.i);
      }
      const k = people.findIndex(([px, py]) => px === tx && py === ty);
      if (k >= 0 && !(s.freed & (1 << k))) next.push([{ ...s, freed: s.freed | (1 << k) }, { type: 'free', x: tx, y: ty, dir: d }]);
    }
    for (const [ns, act] of next) {
      const k = key(ns);
      if (prev.has(k)) continue;
      prev.set(k, { from: s, act });
      queue.push(ns);
    }
  }
  const actions = [];
  for (let s = found; s && prev.get(key(s)); s = prev.get(key(s)).from) actions.unshift(prev.get(key(s)).act);
  return { solved: Boolean(found), actions, states: prev.size, traps: [...traps].sort((a, b) => a - b) };
}

/**
 * ¿Hay algún estado alcanzable (con roturas legales) desde el que ya no se puede terminar la sala? Devuelve la
 * lista de esos estados (vacía = sin callejones). Sirve para demostrar que ninguna rotura legal encierra al jugador.
 */
export function deadEnds(room, opts = {}) {
  const start = opts.start || room.marks.S[0];
  const seen = new Map();
  const people = [...room.marks.T, ...room.marks.Q];
  const key = (s) => `${s.x},${s.y},${s.broken},${s.freed}`;
  const queue = [{ x: start[0], y: start[1], broken: 0, freed: 0 }];
  seen.set(key(queue[0]), queue[0]);
  for (let qi = 0; qi < queue.length; qi++) {
    const s = queue[qi];
    const add = (ns) => { const k = key(ns); if (!seen.has(k)) { seen.set(k, ns); queue.push(ns); } };
    for (const [nx, ny] of steps(room, s.x, s.y, s.broken, s.freed)) add({ ...s, x: nx, y: ny });
    const left = remainingRocks(room, s.broken);
    for (const [, dx, dy] of DIRS) {
      const rock = rockAt(left, s.x + dx, s.y + dy);
      if (rock && canBreak(left, rock)) add({ ...s, broken: s.broken | (1 << rock.i) });
      const k = people.findIndex(([px, py]) => px === s.x + dx && py === s.y + dy);
      if (k >= 0 && !(s.freed & (1 << k))) add({ ...s, freed: s.freed | (1 << k) });
    }
  }
  // Un estado es «bueno» si alcanza la meta: se propaga hacia atrás desde los estados meta hasta el punto fijo.
  const isGoal = opts.goal || defaultGoal(room);
  const succ = new Map();
  for (const s of seen.values()) {
    const list = [];
    for (const [nx, ny] of steps(room, s.x, s.y, s.broken, s.freed)) list.push(key({ ...s, x: nx, y: ny }));
    const left = remainingRocks(room, s.broken);
    for (const [, dx, dy] of DIRS) {
      const rock = rockAt(left, s.x + dx, s.y + dy);
      if (rock && canBreak(left, rock)) list.push(key({ ...s, broken: s.broken | (1 << rock.i) }));
      const k = people.findIndex(([px, py]) => px === s.x + dx && py === s.y + dy);
      if (k >= 0 && !(s.freed & (1 << k))) list.push(key({ ...s, freed: s.freed | (1 << k) }));
    }
    succ.set(key(s), list);
  }
  const good = new Set([...seen.values()].filter(isGoal).map(key));
  let changed = true;
  while (changed) {
    changed = false;
    for (const [k, list] of succ) {
      if (good.has(k)) continue;
      if (list.some((n) => good.has(n))) { good.add(k); changed = true; }
    }
  }
  return [...seen].filter(([k]) => !good.has(k)).map(([, s]) => s);
}
