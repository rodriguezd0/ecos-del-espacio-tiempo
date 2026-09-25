// Torres del Anillo de Captación (docs/CAMPANA.md B17 «Torres del Anillo»: «cada torre se apaga con un puzzle breve de
// Reconstrucción y un combate de técnicos»). Reglas PURAS (Node y navegador) del puzzle «piedras sin apoyo»:
//   · Mientras la torre drena la tierra, una piedra alzada solo aguanta si queda a TRES piedras como mucho de la roca
//     firme (el borde, una peña o la plataforma de la torre), contando por los zócalos (LIMIT).
//   · Solo se alza el zócalo que el jugador tiene delante (casilla vecina), desde roca, una peña o una piedra alzada.
//   · Un tramo de vacío de más de seis zócalos entre dos rocas no se puede cruzar: hay que encontrar la ruta que pasa
//     por las peñas. La ruta directa y otra más tentadora mueren a medio camino (sin castigo: las piedras se quedan).
//   · Con la torre apagada la tierra vuelve a sostener cualquier piedra (sin límite).
// Salas en ASCII (fila 0 = norte), coordenadas locales; el mapa las coloca con un origen (ox, oy):
//   '#' roca (borde de la Sima) · 'E' entrada · 'o' peña · 'P' plataforma de la torre · 'X' base de la torre (bloquea;
//   consola) · 's' zócalo sobre el vacío (se alza) · '.' vacío.

export const LIMIT = 3;

const ROCK = new Set(['#', 'E', 'o', 'P']);

/**
 * Salas de las tres torres. Cada una: `rows` (ASCII), `tower` (base de la torre, 'X'), `console` (consola, sobre una
 * casilla 'P'), `stand` (casilla desde la que se usa la consola), `face` (dirección hacia la consola) y `techs`
 * (casillas de los dos técnicos, que se retiran tras el combate).
 */
export const TOWER_ROOMS = Object.freeze({
  // Torre del Viento (Senda del Mirador, espolón del oeste). La Sima queda al sur.
  viento: Object.freeze({
    name: 'viento',
    rows: Object.freeze([
      '###E######',
      '.s...s..s.',
      '.s...s..s.',
      '.s...s..o.',
      '.s...s..s.',
      '.o...s..s.',
      '.s...s..o.',
      '.s...s..s.',
      '.s.PPPsss.',
      '...PXP....',
    ]),
    tower: Object.freeze({ x: 4, y: 9 }),
    console: Object.freeze({ x: 5, y: 9 }),
    stand: Object.freeze({ x: 5, y: 8 }),
    face: 2,
    techs: Object.freeze([Object.freeze({ x: 3, y: 8, dir: 6 }), Object.freeze({ x: 3, y: 9, dir: 6 })]),
  }),
  // Torre de la Tormenta (Senda del Mirador, espolón del este).
  tormenta: Object.freeze({
    name: 'tormenta',
    rows: Object.freeze([
      '######E###',
      '.s..s...s.',
      '.s..s...s.',
      '.o..s...s.',
      '.s..s...s.',
      '.s..s..so.',
      '.s..s..s..',
      '.s..s..s..',
      '.ss.PPPs..',
      '....PXP...',
    ]),
    tower: Object.freeze({ x: 5, y: 9 }),
    console: Object.freeze({ x: 6, y: 9 }),
    stand: Object.freeze({ x: 6, y: 8 }),
    face: 2,
    techs: Object.freeze([Object.freeze({ x: 4, y: 8, dir: 6 }), Object.freeze({ x: 4, y: 9, dir: 6 })]),
  }),
  // Torre del Temblor (Mirador Sur, espolón del este). La Sima queda al norte: la plataforma está arriba.
  temblor: Object.freeze({
    name: 'temblor',
    rows: Object.freeze([
      '...PXP....',
      '..sPPPs...',
      '..s...s...',
      '.os...s...',
      '.s....s...',
      '.s....s...',
      '.s....s...',
      '.s....s.s.',
      '.s....s.o.',
      '######E###',
    ]),
    tower: Object.freeze({ x: 4, y: 0 }),
    console: Object.freeze({ x: 5, y: 0 }),
    stand: Object.freeze({ x: 5, y: 1 }),
    face: 8,
    techs: Object.freeze([Object.freeze({ x: 3, y: 0, dir: 2 }), Object.freeze({ x: 4, y: 1, dir: 4 })]),
  }),
});

export const TOWER_IDS = Object.freeze(Object.keys(TOWER_ROOMS));

const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });

/**
 * Sala parseada: { name, w, h, cells, sockets: [{ i, x, y, d }], entry, rock(x, y), socketAt(x, y), isPlatform(x, y) }.
 * `d` = distancia (en zócalos, contando el propio) a la roca firme más cercana.
 */
export function parseRoom(room) {
  const rows = room.rows;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const cells = rows.map((r) => [...r.padEnd(w, '.')]);
  const raw = [];
  let entry = null;
  cells.forEach((row, y) => row.forEach((c, x) => {
    if (c === 's') raw.push({ i: raw.length, x, y });
    if (c === 'E') entry = Object.freeze({ x, y });
  }));
  if (!entry) throw new Error(`Sala ${room.name}: falta la entrada 'E'`);
  const inside = (x, y) => x >= 0 && y >= 0 && x < w && y < h;
  const rock = (x, y) => inside(x, y) && ROCK.has(cells[y][x]);
  const byPos = new Map(raw.map((s) => [`${s.x},${s.y}`, s]));
  // BFS multiorigen desde la roca por los zócalos
  const dist = new Map();
  const queue = [];
  for (const s of raw) {
    if (Object.values(DV).some(([dx, dy]) => rock(s.x + dx, s.y + dy))) { dist.set(s.i, 1); queue.push(s); }
  }
  while (queue.length) {
    const s = queue.shift();
    for (const [dx, dy] of Object.values(DV)) {
      const n = byPos.get(`${s.x + dx},${s.y + dy}`);
      if (n && !dist.has(n.i)) { dist.set(n.i, dist.get(s.i) + 1); queue.push(n); }
    }
  }
  const sockets = raw.map((s) => Object.freeze({ ...s, d: dist.get(s.i) ?? Infinity }));
  const socketMap = new Map(sockets.map((s) => [`${s.x},${s.y}`, s]));
  return Object.freeze({
    name: room.name, w, h, cells, sockets: Object.freeze(sockets), entry, rock,
    socketAt: (x, y) => socketMap.get(`${x},${y}`) || null,
    isPlatform: (x, y) => inside(x, y) && cells[y][x] === 'P',
  });
}

/** Conjunto de zócalos alzados ↔ texto de variable ('3,1,5'; '' = ninguno). */
export function decodeRaised(value) {
  if (Array.isArray(value)) return [...new Set(value.map(Number).filter((n) => Number.isInteger(n) && n >= 0))];
  if (value === null || value === undefined || value === '' || value === 0) return [];
  return [...new Set(String(value).split(',').map((s) => Number(s)).filter((n) => Number.isInteger(n) && n >= 0))];
}
export function encodeRaised(list) {
  return [...list].sort((a, b) => a - b).join(',');
}

/** ¿Se puede pisar (x, y) con estas piedras alzadas? */
export function standable(room, raised, x, y) {
  if (room.rock(x, y)) return true;
  const s = room.socketAt(x, y);
  return Boolean(s && raised.includes(s.i));
}

/** ¿Aguanta el zócalo `i`? (a LIMIT de la roca o con la torre apagada) */
export function holds(room, i, { unlimited = false } = {}) {
  const s = room.sockets[i];
  return Boolean(s) && (unlimited || s.d <= LIMIT);
}

/**
 * Intento de alzar el zócalo `i` estando en (px, py). → { ok, raised, reason }
 * reason: 'raised' (ya estaba) · 'far' (no está al lado) · 'loose' (demasiado lejos de la roca: no aguantaría).
 */
export function raise(room, raised, i, px, py, opts = {}) {
  const s = room.sockets[i];
  if (!s) return { ok: false, raised, reason: 'far' };
  if (raised.includes(i)) return { ok: false, raised, reason: 'raised' };
  if (Math.abs(s.x - px) + Math.abs(s.y - py) !== 1) return { ok: false, raised, reason: 'far' };
  if (!holds(room, i, opts)) return { ok: false, raised, reason: 'loose' };
  return { ok: true, raised: [...raised, i], reason: null };
}

/**
 * Solucionador: ruta más corta desde `from` (la entrada) hasta pisar la plataforma, alzando lo que haga falta.
 * → [{ move: dir } | { raise: i, face: dir }] o null. Sirve para las pruebas y el E2E.
 */
export function solveRoom(room, { from = null, raised: r0 = [], unlimited = false } = {}) {
  const start = from || room.entry;
  const key = (x, y) => `${x},${y}`;
  const prev = new Map([[key(start.x, start.y), null]]);
  const queue = [[start.x, start.y]];
  while (queue.length) {
    const [x, y] = queue.shift();
    if (room.isPlatform(x, y)) {
      const out = [];
      let k = key(x, y);
      while (prev.get(k)) { const [pk, actions] = prev.get(k); out.unshift(...actions); k = pk; }
      return out;
    }
    for (const d of [2, 4, 6, 8]) {
      const nx = x + DV[d][0]; const ny = y + DV[d][1];
      if (prev.has(key(nx, ny))) continue;
      let actions = null;
      if (standable(room, r0, nx, ny)) actions = [{ move: d }];
      else {
        const s = room.socketAt(nx, ny);
        if (s && holds(room, s.i, { unlimited })) actions = [{ raise: s.i, face: d }, { move: d }];
      }
      if (!actions) continue;
      prev.set(key(nx, ny), [key(x, y), actions]);
      queue.push([nx, ny]);
    }
  }
  return null;
}

/** Zócalos que usa la solución (en orden): quedan alzados para la vuelta al apagar la torre. */
export function solutionSockets(room) {
  const sol = solveRoom(room) || [];
  return sol.filter((a) => a.raise !== undefined).map((a) => a.raise);
}

/** Zócalos que no aguantan con la torre encendida (los que cortan las rutas tentadoras). */
export function looseSockets(room) {
  return room.sockets.filter((s) => s.d > LIMIT).map((s) => s.i);
}
