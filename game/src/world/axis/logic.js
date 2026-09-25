// Tensión de ejes con la Cadena Roja (docs/CAMPANA.md B18 «Cámara del Cruce»; reutilizable en B20, tramo 9 de la Senda
// del Origen: «cascada detenida y pliegue»). Lógica PURA (sin DOM ni motor): reglas, salas ASCII y solucionador.
//
//   · La Cadena se «tensa» en un cristal de cambio hacia uno de los dos ejes (var AXIS_VAR, global de la partida):
//       'time'  hacia Dialga: lo que se mueve se congela. Los escombros que caen se quedan en el aire y sirven de
//               peldaños; las corrientes se vuelven cristal pisable; los pliegues se cierran.
//       'space' hacia Palkia: los pliegues (pares de marcas violetas) conectan casillas lejanas; todo lo que se movía
//               vuelve a moverse.
//       null    sin tensar (antes del primer cristal): todo se mueve y los pliegues están cerrados.
//   · Moverse (null o 'space'): pisar una corriente arrastra al jugador en su sentido hasta que sale de ella; si la
//     corriente desemboca en el vacío, cae (vuelve al punto seguro de la sala, sin daño).
//   · Si se tensa hacia 'space' con el jugador sobre un escombro, cae; sobre una corriente, la corriente lo arrastra.
//
// Salas ASCII (una fila por cadena, todas del mismo ancho; ver AXIS_LEGEND). El mapa pinta y crea los eventos a partir
// de la misma sala (world/axis/roomEvents.js), así que el solucionador y los tests usan exactamente la geometría real.

/** Variable global con la tensión de la Cadena Roja ('time' | 'space' | null). */
export const AXIS_VAR = 'cadena_eje';
export const AXIS_TIME = 'time';
export const AXIS_SPACE = 'space';
/** Modos posibles (null = sin tensar). */
export const AXIS_MODES = Object.freeze([null, AXIS_TIME, AXIS_SPACE]);

/** Colores de los destellos y luces de cada eje (tiempo: azul acero de Dialga; espacio: violeta de Palkia). */
export const AXIS_COLORS = Object.freeze({ time: Object.freeze([118, 172, 255]), space: Object.freeze([222, 128, 255]) });

/** Leyenda de las salas ASCII. */
export const AXIS_LEGEND = Object.freeze({
  '#': 'muro u obstáculo (bloquea)',
  '.': 'suelo',
  ' ': 'vacío (bloquea; se ve el abismo)',
  D: 'escombro sobre el vacío (peldaño solo con el tiempo tensado)',
  C: 'cristal de cambio (bloquea; se usa desde una casilla vecina)',
  E: 'entrada de la sala (suelo; punto seguro)',
  X: 'salida de la sala (suelo)',
  o: 'suelo con un objeto',
  '^ v < >': 'corriente en ese sentido (se pisa; arrastra salvo con el tiempo tensado)',
  '1-9': 'pliegue: las dos casillas con la misma cifra se conectan con el espacio tensado',
});

const CURRENT_DIRS = Object.freeze({ v: 2, '<': 4, '>': 6, '^': 8 });
const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
export const DIRS = Object.freeze([2, 4, 6, 8]);
export const stepOf = (dir) => DV[dir] || [0, 0];

export function normalizeAxis(v) {
  return v === AXIS_TIME || v === AXIS_SPACE ? v : null;
}
/** Tensión actual de la Cadena en la partida. */
export function axisMode(state, varName = AXIS_VAR) {
  return normalizeAxis(state?.var?.(varName, null));
}
/** ¿Está congelado lo que se mueve? (tiempo tensado) */
export const isFrozen = (mode) => mode === AXIS_TIME;
/** ¿Están abiertos los pliegues? (espacio tensado) */
export const foldsOpen = (mode) => mode === AXIS_SPACE;

// ───────────────────────────── tono del mapa según el eje ─────────────────────────────

/** Desplazamiento de tono [r, g, b, gris] que se suma al tono base del mapa según el eje tensado. */
export const AXIS_TONE_DELTA = Object.freeze({
  time: Object.freeze([-20, -6, 26, 40]),
  space: Object.freeze([24, -18, 30, 0]),
});

/** Tono del mapa (`def.tone`) con el eje: base + delta (el compositor lo suma a día/noche y clima). */
export function axisTone(base = [0, 0, 0, 0], mode = null) {
  const d = AXIS_TONE_DELTA[normalizeAxis(mode)];
  const b = [0, 1, 2, 3].map((i) => Number(base?.[i]) || 0);
  if (!d) return b;
  return b.map((v, i) => (i === 3 ? Math.max(0, Math.min(255, v + d[i])) : v + d[i]));
}

// Caché del eje de la partida en curso para los `get tone()` de los mapas (no ven el estado). La actualizan
// world/axis/actions.js al tensar y al entrar en el mapa (syncAxis). En Node vale null salvo que un test la fije.
let axisCache = null;
export function setAxisCache(mode) { axisCache = normalizeAxis(mode); return axisCache; }
export function cachedAxis() { return axisCache; }

// ───────────────────────────── salas ASCII ─────────────────────────────

/**
 * Sala a partir de filas ASCII → { w, h, rows, entry, exits, crystals, debris, currents, folds, items, at(x, y) }.
 * Lanza un error claro si la sala está mal formada (anchos distintos, sin entrada, pliegue sin pareja…).
 */
export function parseAxisRoom(rows, { name = 'sala' } = {}) {
  if (!Array.isArray(rows) || !rows.length) throw new Error(`${name}: sala vacía`);
  const w = rows[0].length;
  rows.forEach((r, y) => { if (r.length !== w) throw new Error(`${name}: la fila ${y} mide ${r.length} (se esperaban ${w})`); });
  const out = { name, w, h: rows.length, rows: Object.freeze([...rows]), entry: null, exits: [], crystals: [], debris: [], currents: [], folds: [], items: [] };
  const foldCells = new Map();
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === 'E') { if (out.entry) throw new Error(`${name}: dos entradas`); out.entry = Object.freeze({ x, y }); }
    else if (ch === 'X') out.exits.push(Object.freeze({ x, y }));
    else if (ch === 'C') out.crystals.push(Object.freeze({ x, y }));
    else if (ch === 'D') out.debris.push(Object.freeze({ x, y }));
    else if (ch === 'o') out.items.push(Object.freeze({ x, y }));
    else if (CURRENT_DIRS[ch]) out.currents.push(Object.freeze({ x, y, dir: CURRENT_DIRS[ch] }));
    else if (/[1-9]/.test(ch)) foldCells.set(ch, [...(foldCells.get(ch) || []), Object.freeze({ x, y })]);
    else if (!['#', '.', ' '].includes(ch)) throw new Error(`${name}: carácter desconocido «${ch}» en (${x},${y})`);
  }));
  if (!out.entry) throw new Error(`${name}: falta la entrada E`);
  for (const [id, cells] of [...foldCells.entries()].sort()) {
    if (cells.length !== 2) throw new Error(`${name}: el pliegue ${id} tiene ${cells.length} marcas (deben ser 2)`);
    out.folds.push(Object.freeze({ id, a: cells[0], b: cells[1] }));
  }
  out.at = (x, y) => (x >= 0 && y >= 0 && x < w && y < out.h ? rows[y][x] : '#');
  return Object.freeze(out);
}

/** Sentido de la corriente de una casilla (0 si no es corriente). */
export const currentAt = (room, x, y) => CURRENT_DIRS[room.at(x, y)] || 0;
/** Pareja de un pliegue (o null si la casilla no es pliegue). */
export function foldPair(room, x, y) {
  for (const f of room.folds) {
    if (f.a.x === x && f.a.y === y) return f.b;
    if (f.b.x === x && f.b.y === y) return f.a;
  }
  return null;
}

/** ¿Es vacío la casilla con ese eje? (el vacío y los escombros que caen) */
export function isVoidAt(room, x, y, mode) {
  const c = room.at(x, y);
  return c === ' ' || (c === 'D' && !isFrozen(mode));
}

/** ¿Se puede pisar (x, y) con ese eje? */
export function walkableAt(room, x, y, mode) {
  const c = room.at(x, y);
  if (c === '#' || c === 'C' || c === ' ') return false;
  if (c === 'D') return isFrozen(mode);
  return true;
}

const MAX_SLIDE = 200;

/**
 * Arrastre de una corriente desde (x, y) (el jugador ya está encima). → { x, y, fell, path: [dir…] }.
 * Sigue el sentido de cada casilla de corriente; se detiene al salir de la corriente o ante un muro/cristal; si la
 * siguiente casilla es vacío, cae.
 */
export function slideFrom(room, x, y, mode) {
  const path = [];
  let px = x;
  let py = y;
  const seen = new Set();
  for (let i = 0; i < MAX_SLIDE; i++) {
    const d = currentAt(room, px, py);
    if (!d || isFrozen(mode)) break;
    const key = `${px},${py}`;
    if (seen.has(key)) break; // bucle cerrado de corrientes: se queda
    seen.add(key);
    const [ox, oy] = stepOf(d);
    const nx = px + ox;
    const ny = py + oy;
    if (isVoidAt(room, nx, ny, mode)) { path.push(d); return { x: nx, y: ny, fell: true, path }; }
    if (!walkableAt(room, nx, ny, mode)) break;
    path.push(d);
    px = nx;
    py = ny;
  }
  return { x: px, y: py, fell: false, path };
}

/**
 * Resultado de dar un paso desde (x, y) hacia `d` con ese eje. → null (no se puede) | { x, y, fell, via }
 * via: 'walk' | 'current' (arrastrado) | 'fold' (pliegue). La casilla de destino dispara corriente o pliegue.
 */
export function stepResult(room, x, y, d, mode) {
  const [ox, oy] = stepOf(d);
  const tx = x + ox;
  const ty = y + oy;
  if (!walkableAt(room, tx, ty, mode)) return null;
  if (currentAt(room, tx, ty) && !isFrozen(mode)) {
    const s = slideFrom(room, tx, ty, mode);
    return { x: s.x, y: s.y, fell: s.fell, via: 'current' };
  }
  const pair = foldsOpen(mode) ? foldPair(room, tx, ty) : null;
  if (pair) return { x: pair.x, y: pair.y, fell: false, via: 'fold' };
  return { x: tx, y: ty, fell: false, via: 'walk' };
}

/** Qué le pasa al jugador en (x, y) al cambiar el eje a `mode`. → { x, y, fell } */
export function afterTension(room, x, y, mode) {
  if (room.at(x, y) === 'D' && !isFrozen(mode)) return { x, y, fell: true };
  if (currentAt(room, x, y) && !isFrozen(mode)) {
    const s = slideFrom(room, x, y, mode);
    return { x: s.x, y: s.y, fell: s.fell };
  }
  return { x, y, fell: false };
}

/** Cristales vecinos (4 direcciones) de (x, y) → [{ x, y, dir }] con la dirección a la que hay que mirar. */
export function crystalsNear(room, x, y) {
  const out = [];
  for (const d of DIRS) {
    const [ox, oy] = stepOf(d);
    if (room.at(x + ox, y + oy) === 'C') out.push({ x: x + ox, y: y + oy, dir: d });
  }
  return out;
}

// ───────────────────────────── solucionador ─────────────────────────────

const skey = (x, y, m) => `${x},${y},${m ?? '-'}`;

/** Sucesores de un estado: [{ state: { x, y, mode }, action }] (acciones: move / tense). */
export function successors(room, s) {
  const out = [];
  const safe = room.entry;
  for (const d of DIRS) {
    const r = stepResult(room, s.x, s.y, d, s.mode);
    if (!r) continue;
    const to = r.fell ? { x: safe.x, y: safe.y, mode: s.mode } : { x: r.x, y: r.y, mode: s.mode };
    out.push({ state: to, action: { type: 'move', dir: d, via: r.via, fell: r.fell } });
  }
  for (const c of crystalsNear(room, s.x, s.y)) {
    for (const m of [AXIS_TIME, AXIS_SPACE]) {
      if (m === s.mode) continue;
      const r = afterTension(room, s.x, s.y, m);
      const to = r.fell ? { x: safe.x, y: safe.y, mode: m } : { x: r.x, y: r.y, mode: m };
      out.push({ state: to, action: { type: 'tense', mode: m, face: c.dir, crystal: { x: c.x, y: c.y }, fell: r.fell } });
    }
  }
  return out;
}

/** Estados alcanzables desde `starts` ([{ x, y, mode }]). → Map clave → { x, y, mode } */
export function axisReach(room, starts) {
  const seen = new Map();
  const queue = [];
  for (const s of starts) { const k = skey(s.x, s.y, s.mode); if (!seen.has(k)) { seen.set(k, s); queue.push(s); } }
  while (queue.length) {
    const s = queue.shift();
    for (const { state } of successors(room, s)) {
      const k = skey(state.x, state.y, state.mode);
      if (seen.has(k)) continue;
      seen.set(k, state);
      queue.push(state);
    }
  }
  return seen;
}

/**
 * Plan más corto (número de acciones) desde `from` ({ x, y, mode }) hasta una casilla que cumpla `goal(x, y, mode)`.
 * → { actions: [{ type: 'move', dir } | { type: 'tense', mode, face, crystal }], end } | null
 */
export function solveAxis(room, from, goal) {
  const start = { x: from.x, y: from.y, mode: normalizeAxis(from.mode) };
  const prev = new Map([[skey(start.x, start.y, start.mode), null]]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift();
    if (goal(s.x, s.y, s.mode)) {
      const actions = [];
      let k = skey(s.x, s.y, s.mode);
      while (prev.get(k)) { const [pk, a] = prev.get(k); actions.unshift(a); k = pk; }
      return { actions, end: s };
    }
    for (const { state, action } of successors(room, s)) {
      const k = skey(state.x, state.y, state.mode);
      if (prev.has(k)) continue;
      prev.set(k, [skey(s.x, s.y, s.mode), action]);
      queue.push(state);
    }
  }
  return null;
}

/** Plan desde la entrada (o `from`) hasta una salida de la sala. */
export function solveAxisRoom(room, { from = room.entry, mode = null } = {}) {
  const exits = new Set(room.exits.map((e) => `${e.x},${e.y}`));
  return solveAxis(room, { x: from.x, y: from.y, mode }, (x, y) => exits.has(`${x},${y}`));
}

/**
 * Casillas trampa: estados alcanzables (desde la entrada o una salida, con cualquier eje) desde los que no se puede
 * volver a la entrada o no se puede llegar a una salida. → [{ x, y, mode, noEntry, noExit }] (vacío = sin trampas).
 */
export function axisTraps(room) {
  const starts = [room.entry, ...room.exits].flatMap((p) => AXIS_MODES.map((mode) => ({ x: p.x, y: p.y, mode })));
  const all = axisReach(room, starts);
  const out = [];
  const isEntry = (x, y) => x === room.entry.x && y === room.entry.y;
  const exits = new Set(room.exits.map((e) => `${e.x},${e.y}`));
  for (const s of all.values()) {
    const noEntry = !solveAxis(room, s, isEntry);
    const noExit = room.exits.length > 0 && !solveAxis(room, s, (x, y) => exits.has(`${x},${y}`));
    if (noEntry || noExit) out.push({ ...s, noEntry, noExit });
  }
  return out;
}

/** Recuento de una solución: pasos, tensiones y ejes usados (para tests: que la sala exija los dos ejes). */
export function planSummary(plan) {
  const tensions = (plan?.actions || []).filter((a) => a.type === 'tense');
  return {
    moves: (plan?.actions || []).filter((a) => a.type === 'move').length,
    tensions: tensions.length,
    modes: [...new Set(tensions.map((a) => a.mode))],
    folds: (plan?.actions || []).filter((a) => a.via === 'fold').length,
    currents: (plan?.actions || []).filter((a) => a.via === 'current').length,
  };
}

/** ¿Se puede resolver la sala sin tensar nunca hacia `mode`? (para probar que un eje es imprescindible) */
export function solvableWithout(room, forbidden) {
  const exits = new Set(room.exits.map((e) => `${e.x},${e.y}`));
  const start = { x: room.entry.x, y: room.entry.y, mode: null };
  const seen = new Set([skey(start.x, start.y, null)]);
  const queue = [start];
  while (queue.length) {
    const s = queue.shift();
    if (exits.has(`${s.x},${s.y}`)) return true;
    for (const { state, action } of successors(room, s)) {
      if (action.type === 'tense' && action.mode === forbidden) continue;
      const k = skey(state.x, state.y, state.mode);
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push(state);
    }
  }
  return false;
}
