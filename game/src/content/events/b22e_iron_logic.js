// Reglas PURAS del Taller de hierro de la Grieta del Porvenir (docs/CAMPANA.md B22: «Ferropalmas — hay que embestir
// tres bloques de hierro hasta su plataforma»). Sin DOM ni motor: las usan los eventos (b22e_grieta_taller.js), las
// pruebas (tests/b22e_content.test.mjs) y el E2E (plan del solucionador).
//
// Sala ASCII (una fila por cadena, misma geometría para el mapa, las pruebas y el E2E):
//   #  borde (vacío de la Sima: ni el jugador ni los bloques)   o  columna de hierro (muro)
//   .  suelo de chapa                         B  bloque de hierro (posición inicial)
//   S  zócalo vacío de la plataforma (el jugador no lo pisa)    F  estrado de Ferropalmas (muro)
//   E  entrada (punto seguro)                 L  palanca de retorno (muro con evento)
//   k  pasillo: el jugador pasa, los bloques no (nunca tapan la salida)
// Embestida: el jugador, junto a un bloque y mirándolo, lo embiste; el bloque se desliza por la chapa en esa dirección
// hasta chocar (muro, estrado, otro bloque, zócalo ya lleno, pasillo o borde) o hasta caer en un zócalo vacío, donde
// encaja y ya no se mueve. Con los tres zócalos llenos, Ferropalmas despierta. La palanca de la entrada devuelve los
// bloques sueltos a su sitio (los encajados se quedan).

export const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
export const DIRS = Object.freeze([2, 4, 6, 8]);
const key = (x, y) => `${x},${y}`;

/**
 * Sala a partir de su ASCII. `ox`, `oy`: casilla del mapa de la esquina superior izquierda.
 * → { w, h, ox, oy, rows, walls: Set, keep: Set, sockets: [[x, y]], blocks: [[x, y]], entry: [x, y], dais: [[x, y]] }
 * (coordenadas del mapa).
 */
export function parseIronRoom(rows, ox = 0, oy = 0) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const walls = new Set();
  const keep = new Set();
  const sockets = [];
  const blocks = [];
  const dais = [];
  const pillars = [];
  const border = [];
  let entry = null;
  let lever = null;
  rows.forEach((row, y) => {
    [...row.padEnd(w, '#')].forEach((c, x) => {
      const X = ox + x;
      const Y = oy + y;
      if (c === '#') { walls.add(key(X, Y)); border.push([X, Y]); } else if (c === 'o') { walls.add(key(X, Y)); pillars.push([X, Y]); } else if (c === 'L') { walls.add(key(X, Y)); lever = [X, Y]; } else if (c === 'F') { walls.add(key(X, Y)); dais.push([X, Y]); } else if (c === 'S') sockets.push([X, Y]);
      else if (c === 'B') blocks.push([X, Y]);
      else if (c === 'k') keep.add(key(X, Y));
      else if (c === 'E') { entry = [X, Y]; keep.add(key(X, Y)); } else if (c !== '.') throw new Error(`Sala de hierro: carácter desconocido «${c}» en (${x},${y})`);
    });
  });
  if (!entry) throw new Error('Sala de hierro: falta la entrada E');
  if (sockets.length !== blocks.length) throw new Error(`Sala de hierro: ${blocks.length} bloques para ${sockets.length} zócalos`);
  return Object.freeze({ w, h, ox, oy, rows, walls, keep, sockets, blocks, entry, dais, pillars, border, lever });
}

/** ¿Es tierra la casilla (x, y) del mapa? (todo lo que no es borde de vacío) */
export function roomLand(room, x, y) {
  if (!inside(room, x, y)) return false;
  return !room.border.some(([bx, by]) => bx === x && by === y);
}

const inside = (room, x, y) => x >= room.ox && y >= room.oy && x < room.ox + room.w && y < room.oy + room.h;
const isSocket = (room, x, y) => room.sockets.some(([sx, sy]) => sx === x && sy === y);

/** Estado inicial: posiciones de los bloques (en orden) y ninguno encajado. */
export function initialState(room) {
  return Object.freeze({ blocks: room.blocks.map(([x, y]) => [x, y]) });
}

/** Normaliza un estado guardado (var) contra la sala: si no cuadra, el inicial. */
export function normalizeState(room, raw) {
  const list = Array.isArray(raw?.blocks) ? raw.blocks : Array.isArray(raw) ? raw : null;
  if (!list || list.length !== room.blocks.length) return initialState(room);
  const ok = list.every((p) => Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1]) && inside(room, p[0], p[1])
    && !room.walls.has(key(p[0], p[1])) && !room.keep.has(key(p[0], p[1])));
  const distinct = new Set(list.map(([x, y]) => key(x, y))).size === list.length;
  return ok && distinct ? Object.freeze({ blocks: list.map(([x, y]) => [x, y]) }) : initialState(room);
}

/** ¿Está encajado el bloque i? (en un zócalo) */
export const isLocked = (room, st, i) => isSocket(room, st.blocks[i][0], st.blocks[i][1]);

/** ¿Están los tres zócalos llenos? */
export const isSolved = (room, st) => room.sockets.every(([x, y]) => st.blocks.some(([bx, by]) => bx === x && by === y));

const blockAt = (st, x, y) => st.blocks.findIndex(([bx, by]) => bx === x && by === y);

/** ¿Puede el jugador pisar (x, y)? (suelo, pasillo o entrada; no bloques, zócalos, muros ni fuera) */
export function walkable(room, st, x, y) {
  if (!inside(room, x, y) || room.walls.has(key(x, y))) return false;
  if (isSocket(room, x, y)) return false;
  return blockAt(st, x, y) < 0;
}

/** ¿Puede un bloque entrar en (x, y) deslizándose? → 'floor' | 'socket' | null */
function blockCell(room, st, x, y) {
  if (!inside(room, x, y) || room.walls.has(key(x, y)) || room.keep.has(key(x, y))) return null;
  if (blockAt(st, x, y) >= 0) return null;
  return isSocket(room, x, y) ? 'socket' : 'floor';
}

/**
 * Embestida del bloque i hacia `dir`. → { moved: bool, state, from, to, path: [[x, y]…], locked: bool }.
 * No se mueve si ya está encajado o si la primera casilla está ocupada.
 */
export function slide(room, st, i, dir) {
  const [dx, dy] = DV[dir];
  const from = st.blocks[i];
  if (!from || isLocked(room, st, i)) return { moved: false, state: st, from, to: from, path: [], locked: false };
  let [x, y] = from;
  const path = [];
  for (let guard = 0; guard < room.w + room.h; guard++) {
    const kind = blockCell(room, st, x + dx, y + dy);
    if (!kind) break;
    x += dx; y += dy;
    path.push([x, y]);
    if (kind === 'socket') break;
  }
  if (!path.length) return { moved: false, state: st, from, to: from, path, locked: false };
  const blocks = st.blocks.map((b, j) => (j === i ? [x, y] : [b[0], b[1]]));
  const state = Object.freeze({ blocks });
  return { moved: true, state, from, to: [x, y], path, locked: isSocket(room, x, y) };
}

/** El jugador en (px, py) mirando `dir` embiste: → resultado de slide o null si delante no hay bloque. */
export function ram(room, st, px, py, dir) {
  const [dx, dy] = DV[dir];
  const i = blockAt(st, px + dx, py + dy);
  if (i < 0) return null;
  return { index: i, ...slide(room, st, i, dir) };
}

/** Casillas que el jugador alcanza a pie desde `start` con los bloques de `st`. */
export function reachable(room, st, start = room.entry) {
  const seen = new Set([key(...start)]);
  const queue = [start];
  while (queue.length) {
    const [x, y] = queue.shift();
    for (const d of DIRS) {
      const nx = x + DV[d][0];
      const ny = y + DV[d][1];
      const k = key(nx, ny);
      if (seen.has(k) || !walkable(room, st, nx, ny)) continue;
      seen.add(k);
      queue.push([nx, ny]);
    }
  }
  return seen;
}

const stateKey = (st, region) => `${st.blocks.map(([x, y]) => key(x, y)).join('|')}#${region}`;
const regionKey = (reach) => [...reach].sort()[0];

/** Movimientos posibles desde un estado con el jugador en la región `reach`: [{ index, dir, stand: [x, y], next }]. */
export function moves(room, st, reach) {
  const out = [];
  st.blocks.forEach(([bx, by], i) => {
    if (isLocked(room, st, i)) return;
    for (const dir of DIRS) {
      const [dx, dy] = DV[dir];
      const stand = [bx - dx, by - dy];
      if (!reach.has(key(...stand))) continue;
      const r = slide(room, st, i, dir);
      if (r.moved) out.push({ index: i, dir, stand, next: r.state, to: r.to });
    }
  });
  return out;
}

/**
 * Solucionador (BFS por estados): → lista de embestidas [{ index, dir, stand, to }] o null si no hay solución.
 * El jugador empieza en `start` (la entrada por defecto).
 */
export function solve(room, st = initialState(room), start = room.entry, { limit = 200000 } = {}) {
  const r0 = reachable(room, st, start);
  const first = { st, reach: r0, plan: [] };
  const seen = new Set([stateKey(st, regionKey(r0))]);
  const queue = [first];
  for (let n = 0; queue.length && n < limit; n++) {
    const cur = queue.shift();
    if (isSolved(room, cur.st)) return cur.plan;
    for (const m of moves(room, cur.st, cur.reach)) {
      const reach = reachable(room, m.next, m.stand);
      const k = stateKey(m.next, regionKey(reach));
      if (seen.has(k)) continue;
      seen.add(k);
      queue.push({ st: m.next, reach, plan: [...cur.plan, { index: m.index, dir: m.dir, stand: m.stand, to: m.to }] });
    }
  }
  return null;
}

/**
 * Todos los estados alcanzables desde el inicial (con la región del jugador). → [{ st, reach }]. Sirve para probar que
 * ningún estado deja al jugador sin volver a la entrada (casillas trampa) y cuáles necesitan la palanca.
 */
export function allStates(room, { limit = 200000 } = {}) {
  const st = initialState(room);
  const r0 = reachable(room, st);
  const out = [{ st, reach: r0 }];
  const seen = new Set([stateKey(st, regionKey(r0))]);
  for (let i = 0; i < out.length && i < limit; i++) {
    const cur = out[i];
    for (const m of moves(room, cur.st, cur.reach)) {
      const reach = reachable(room, m.next, m.stand);
      const k = stateKey(m.next, regionKey(reach));
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ st: m.next, reach });
    }
  }
  return out;
}

/**
 * Grafo completo de estados alcanzables y cuáles tienen salida hacia la solución. → { states: [{ st, reach }],
 * solvable: boolean[] , dead: number } (dead = estados sin solución: solo los arregla la palanca de retorno).
 */
export function stateGraph(room, { limit = 200000 } = {}) {
  const st0 = initialState(room);
  const r0 = reachable(room, st0);
  const states = [{ st: st0, reach: r0 }];
  const index = new Map([[stateKey(st0, regionKey(r0)), 0]]);
  const parents = [[]];
  for (let i = 0; i < states.length && i < limit; i++) {
    const cur = states[i];
    for (const m of moves(room, cur.st, cur.reach)) {
      const reach = reachable(room, m.next, m.stand);
      const k = stateKey(m.next, regionKey(reach));
      let j = index.get(k);
      if (j === undefined) {
        j = states.length;
        index.set(k, j);
        states.push({ st: m.next, reach });
        parents.push([]);
      }
      parents[j].push(i);
    }
  }
  const solvable = states.map((s) => isSolved(room, s.st));
  const queue = solvable.map((ok, i) => (ok ? i : -1)).filter((i) => i >= 0);
  while (queue.length) {
    const j = queue.shift();
    for (const p of parents[j]) if (!solvable[p]) { solvable[p] = true; queue.push(p); }
  }
  return { states, solvable, dead: solvable.filter((ok) => !ok).length };
}

/** Estado tras la palanca de retorno: los encajados se quedan, los sueltos vuelven a su casilla inicial si está libre. */
export function resetLoose(room, st) {
  const locked = st.blocks.map((_, i) => isLocked(room, st, i));
  const blocks = st.blocks.map((b, i) => (locked[i] ? [b[0], b[1]] : [room.blocks[i][0], room.blocks[i][1]]));
  // Un bloque encajado nunca ocupa una casilla inicial (las iniciales no son zócalos): no hay choques.
  return Object.freeze({ blocks });
}
