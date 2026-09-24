// Salas de viento del Pilar del Impulso (docs/CAMPANA.md B06, «Mazmorra: Anillo de los Vientos y Galerías del
// Soplo»). Datos PUROS: las tres secciones en ASCII (leyenda en content/events/b06_wind_logic.js), sus veletas y
// su posición dentro de cada mapa. Los mapas pintan las pasarelas y crean un evento por ráfaga a partir de aquí;
// tests/b06_wind.test.mjs demuestra con el solucionador que cada sala se resuelve como dice el guion.
//
//   (a) Galería de las Flechas (galerias_soplo, abajo): encadenar ráfagas hasta la salida. Para llegar a la
//       salida hay que remontar montado una rampa de fuerza 1; la célula C033 queda en el único paso al río.
//   (b) Galería del Remolino (galerias_soplo, arriba): un bucle de fuerza 2 que devuelve al jugador; solo se abre
//       en línea girando DOS veletas (la de la compuerta del remolino y la del pasillo de salida).
//   (c) Sala de las Campanas (anillo_vientos, en lo alto de la terraza): llegar a las campanas Norte, Este y Oeste
//       entre ráfagas. C034 en el único paso hacia la campana Norte. El vendaval del sur solo deja salir.
import { parseRoom } from './b06_wind_logic.js';

/** (a) Galería de las Flechas: 22×14. S = llegada desde el Anillo, X = paso al Remolino, C = célula C033. */
export const FLECHAS = Object.freeze({
  id: 'flechas',
  rows: Object.freeze([
    '######################',
    '##########XX##########',
    '##########vv##########',
    '##########vv##########',
    '#....#####vv#####....#',
    '#...C66666..#####....#',
    '#....#####..#####....#',
    '#....#####..#####....#',
    '##^########2#####^#v##',
    '##^########2#####^#v##',
    '##^#######.2.####^#v##',
    '##^<<<<<...E.>>>>^#v##',
    '#####...S...........##',
    '######################',
  ]),
  sectors: null,
  vanes: Object.freeze({}),
});

/**
 * (b) Galería del Remolino: 22×13. Bucle de fuerza 2 alrededor de la piedra del remolino; `a` = compuerta del
 * bucle (lado oeste, (4,8)), `b` = última casilla del pasillo antes del rellano de salida ((5,3)).
 * Veletas (sólidas, 'V'): a en (11,8) junto al remolino, b en (6,5) bajo el pasillo.
 */
export const REMOLINO = Object.freeze({
  id: 'remolino',
  rows: Object.freeze([
    '######################',
    '#####X################',
    '####...###############',
    '##6664################',
    '##8###################',
    '##8#..V..............#',
    '##8#.................#',
    '##8#666662...........#',
    '##848####2.V.........#',
    '####8####2...........#',
    '####844444...........#',
    '####.....S...........#',
    '######################',
  ]),
  sectors: Object.freeze([
    '......................',
    '......................',
    '......................',
    '.....b................',
    '......................',
    '......................',
    '......................',
    '......................',
    '....a.................',
    '......................',
    '......................',
    '......................',
    '......................',
  ]),
  vanes: Object.freeze({ a: Object.freeze([11, 8]), b: Object.freeze([6, 5]) }),
});

/**
 * (c) Sala de las Campanas: 19×16 (fila 0 = borde norte de la terraza, filas 1–11 = lo alto, filas 12–14 = cara
 * sur con la escalera, fila 15 = pie de la escalera, ya en el anillo exterior). Campanas (sólidas, 'V'): Norte
 * (9,0), Oeste (0,8), Este (18,6). En el centro, el estrado del núcleo (terraza x 4–14, y 2–8 con escalera en
 * x 8–10) y el pedestal (9,4). S = llegada desde el Remolino (losa 'E' al lado, para volver a bajar). El vendaval
 * sur (x 8–10, filas 11–14) sopla escalera abajo: solo deja salir hasta que suenan las campanas.
 */
export const CAMPANAS = Object.freeze({
  id: 'campanas',
  rows: Object.freeze([
    '#########V#########',
    '#....C....66666662#',
    '#...###########..2#',
    '#vvv##.......##..2#',
    '#vvv##...V...##..2#',
    '#vvv##.......##..2#',
    '#...####...####...V',
    '#...####...####...#',
    'V...####...####...#',
    '#.................#',
    '#.4444444444444444#',
    '#.......222.S.EE..#',
    '########222########',
    '########222########',
    '########222########',
    '########...########',
  ]),
  sectors: null,
  vanes: Object.freeze({}),
  /** Casillas desde las que se golpea cada campana (mirando a la campana) y el pedestal del núcleo. */
  bells: Object.freeze({
    N: Object.freeze({ at: [9, 0], strike: [9, 1], face: 8 }),
    E: Object.freeze({ at: [18, 6], strike: [17, 6], face: 6 }),
    W: Object.freeze({ at: [0, 8], strike: [1, 8], face: 4 }),
  }),
  pedestal: Object.freeze({ at: [9, 4], front: [9, 5] }),
  /** Las ráfagas del vendaval (hueco sur): desaparecen al sonar las campanas en orden. */
  gale: Object.freeze([8, 9, 10].flatMap((x) => [11, 12, 13, 14].map((y) => Object.freeze([x, y])))),
});

/** Orden y ritmo de las campanas (CAMPANA: largo–corto–corto; Norte, Este, Oeste). */
export const BELL_SEQUENCE = Object.freeze([
  Object.freeze({ bell: 'N', long: true }),
  Object.freeze({ bell: 'E', long: false }),
  Object.freeze({ bell: 'W', long: false }),
]);

/**
 * Siguiente estado de la secuencia de campanas: `step` = campanas acertadas (0–3). Un golpe correcto avanza; uno
 * incorrecto reinicia (0) salvo que sea el primero correcto de nuevo (vuelve a 1). → { step, ok, done }.
 */
export function strikeBell(step, bell, long) {
  const want = BELL_SEQUENCE[step];
  if (want && want.bell === bell && want.long === Boolean(long)) {
    const next = step + 1;
    return { step: next, ok: true, done: next >= BELL_SEQUENCE.length };
  }
  const first = BELL_SEQUENCE[0];
  const restart = first.bell === bell && first.long === Boolean(long);
  return { step: restart ? 1 : 0, ok: false, done: false };
}

/** Sala interpretada (cacheada) por id. */
const cache = new Map();
export function roomOf(def) {
  if (!cache.has(def.id)) cache.set(def.id, parseRoom(def.rows, def.sectors));
  return cache.get(def.id);
}

/**
 * Ráfagas de una sala en coordenadas del mapa (ox, oy = casilla del mapa de la esquina de la sala):
 * [{ id, x, y, dir, force, sector, rx, ry }].
 */
export function gustsInMap(def, ox, oy, prefix) {
  return roomOf(def).gusts.map((g) => ({
    id: `${prefix}_${g.x}_${g.y}`, x: ox + g.x, y: oy + g.y, dir: g.dir, force: g.force, sector: g.sector, rx: g.x, ry: g.y,
  }));
}

/** Casilla del mapa de una marca de la sala ('S', 'X', 'C', 'V', 'E'): lista de [x, y]. */
export function marksInMap(def, mark, ox, oy) {
  return (roomOf(def).marks[mark] || []).map(([x, y]) => [ox + x, oy + y]);
}

/**
 * Celdas de pasarela de la sala (suelo en calma, ráfagas y el pie de las veletas) en coordenadas del mapa.
 * `withVanes: false` deja fuera las casillas de las veletas.
 */
export function walkCells(def, ox, oy, { withVanes = true } = {}) {
  const room = roomOf(def);
  const vanes = new Set(withVanes ? room.marks.V.map(([x, y]) => `${x},${y}`) : []);
  const out = [];
  for (let y = 0; y < room.h; y++) {
    for (let x = 0; x < room.w; x++) if (!room.blocked(x, y) || vanes.has(`${x},${y}`)) out.push([ox + x, oy + y]);
  }
  return out;
}
