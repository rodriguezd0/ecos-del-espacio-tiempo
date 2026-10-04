// Coordenadas del Bloque 14 — Pilar de los Ecos (docs/CAMPANA.md «B14», §1.4 Arrecife del Eco y Fondo del Mar del Sur,
// §2.3 C077–C084). FUENTE ÚNICA de posiciones: la usan los mapas, los eventos, los tests (tests/b14_*.test.mjs) y el
// recorrido E2E (tools/e2e_b14.mjs). Módulo PURO.
//
// Mazmorra de Antea: 4 salas; cada sala existe en varias capas temporales como MAPAS GEMELOS del mismo tamaño y con las
// mismas coordenadas (antea_<n>_<capa>): presente sumergido (tileset 15, se bucea), Antea seca (salas 1–2 en tileset 7,
// ciudad al aire; salas 3–4 en tileset 2, barrio alto de piedra) y era primigenia (salas 3–4, tileset 7 con helechos).
// Las caracolas del eco están en la misma casilla en todas las capas de su sala.

export const ERAS = Object.freeze(['presente', 'antea', 'primigenia']);
export const ERA_LABEL = Object.freeze({ presente: 'El presente', antea: 'Antea', primigenia: 'La era primigenia' });

/** Id del mapa de una sala en una capa. */
export const roomMap = (room, era) => `antea_${room}_${era}`;

/** Sala y capa de un id de mapa de Antea ('antea_3_primigenia' → { room: 3, era: 'primigenia' }) o null. */
export function parseRoomMap(id) {
  const m = /^antea_(\d)_(presente|antea|primigenia)$/.exec(String(id || ''));
  return m ? { room: Number(m[1]), era: m[2] } : null;
}

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

/**
 * Salas de Antea. `eras`: capas que existen (salas 1–2: presente ↔ Antea; salas 3–4: las tres).
 * `caracolas`: { id, x, y (casilla del objeto, sólida), stand (casilla desde la que se golpea) }.
 * `south`/`north`: puertas (door = casilla del warp; arrival = llegada al entrar por ella).
 */
export const ROOMS = Object.freeze({
  1: Object.freeze({
    n: 1, name: 'Plaza de la Caracola', w: 32, h: 24, eras: ['presente', 'antea'],
    caracolas: [Object.freeze({ id: 'caracola_1', x: 16, y: 13, stand: P(16, 14, 8) })],
    south: Object.freeze({ door: P(16, 22), arrival: P(16, 21, 8) }),
    north: Object.freeze({ door: P(16, 3), arrival: P(16, 5, 2) }),
  }),
  2: Object.freeze({
    n: 2, name: 'Calle de los Pescadores', w: 32, h: 24, eras: ['presente', 'antea'],
    caracolas: [Object.freeze({ id: 'caracola_2', x: 8, y: 17, stand: P(8, 16, 2) })],
    south: Object.freeze({ door: P(16, 22), arrival: P(16, 21, 8) }),
    north: Object.freeze({ door: P(16, 3), arrival: P(16, 5, 2) }),
  }),
  3: Object.freeze({
    n: 3, name: 'Barrio Alto', w: 32, h: 26, eras: ['presente', 'antea', 'primigenia'],
    caracolas: [
      Object.freeze({ id: 'caracola_3a', x: 16, y: 18, stand: P(16, 19, 8) }),
      Object.freeze({ id: 'caracola_3b', x: 24, y: 7, stand: P(24, 8, 8) }),
    ],
    south: Object.freeze({ door: P(16, 24), arrival: P(16, 23, 8) }), // solo en el presente (sala 2)
    north: Object.freeze({ door: P(16, 3), arrival: P(16, 5, 2) }),
    /** Era primigenia: salida norte por la senda del bosque (pulsar arriba en la casilla). */
    northPrimal: Object.freeze({ tile: P(16, 4), dirTrigger: 8 }),
  }),
  4: Object.freeze({
    n: 4, name: 'Puerta de la Fosa', w: 32, h: 26, eras: ['presente', 'antea', 'primigenia'],
    caracolas: [Object.freeze({ id: 'caracola_4', x: 16, y: 19, stand: P(16, 20, 8) })],
    south: Object.freeze({ door: P(16, 24), arrival: P(16, 23, 8) }),
    /** Era primigenia: salida sur por la senda del bosque (pulsar abajo en la casilla). */
    southPrimal: Object.freeze({ tile: P(16, 23), dirTrigger: 2 }),
    north: Object.freeze({ door: P(16, 3), arrival: P(16, 5, 2) }), // presente: boca de la Fosa
  }),
});

export const ROOM_IDS = Object.freeze([1, 2, 3, 4]);
/** Todos los mapas de la mazmorra. */
export const ANTEA_MAPS = Object.freeze(ROOM_IDS.flatMap((n) => ROOMS[n].eras.map((e) => roomMap(n, e))));

/** Pasillos entre salas: presente siempre; las demás capas solo donde el eco lo permite (ver README). */
export const ROOM_LINKS = Object.freeze({
  // sala 1 ↔ sala 2 y sala 2 ↔ sala 3: solo en el presente (en Antea, puerta alta cerrada y aljibe).
  '1-2': ['presente'],
  '2-3': ['presente'],
  // sala 3 ↔ sala 4: por la terraza alta, en las tres capas.
  '3-4': ['presente', 'antea', 'primigenia'],
});

// ─────────────────────────────── Sala 1: la estatua ───────────────────────────────
export const ROOM1 = Object.freeze({
  /** Estatua de Antea: se empuja hacia el oeste por su ranura desde `push` (mirando al oeste). */
  statue: Object.freeze({ from: P(14, 6), to: P(10, 6), push: P(15, 6, 4) }),
  /** En el presente: estatua caída ante la boca norte (var 0) o en la hornacina (var 1). */
  fallenGate: Object.freeze([[15, 4], [16, 4], [17, 4]]), // tendida en la boca (la llegada (16,5) queda libre)
  fallenNiche: Object.freeze([[9, 6], [10, 6], [11, 6]]),
  /** Casa derrumbada del este (presente): se entra por la brecha; en Antea es una casa cerrada. */
  ruin: Object.freeze({ x0: 20, y0: 5, x1: 27, y1: 12, breach: P(21, 9) }),
  cell: P(16, 17), // C082 (en el camino)
  vents: Object.freeze([P(24, 9), P(6, 18)]),
  gearNote: P(12, 16),
});

// ─────────────────────────────── Sala 2: Fausto y la compuerta ───────────────────────────────
export const ROOM2 = Object.freeze({
  /**
   * Aljibe (presente): anillo de escombros de 2 casillas (x 11–21, y 5–11) con el interior x 13–19, y 7–9; se entra
   * por su puerta sur (16,10)–(16,11) y se sale al norte por (16,5)–(16,6) hacia la boca de la sala 3.
   */
  cistern: Object.freeze({ x0: 11, y0: 5, x1: 21, y1: 11, door: P(16, 11), inner: Object.freeze({ x0: 13, y0: 7, x1: 19, y1: 9 }) }),
  /** Corrientes que salen del aljibe (presente, compuerta abierta): empujan al sur. */
  currents: Object.freeze([{ x: 16, y: 11, length: 4 }, { x: 16, y: 10, length: 5 }, { x: 16, y: 9, length: 6 }]),
  gear: P(12, 18), // aletas y gafas de Fausto (presente)
  wheel: P(16, 10), // rueda de la compuerta (Antea, en la cara del aljibe)
  /** Rutina de Fausto (Antea): paradas en orden; `fausto` = su casilla, `player` = dónde queda el jugador. */
  stops: Object.freeze([
    Object.freeze({ key: 'fuente', label: 'La fuente', fausto: P(6, 11, 8), player: P(7, 11, 4) }),
    Object.freeze({ key: 'redes', label: 'El puesto de redes', fausto: P(26, 15, 8), player: P(27, 15, 4) }),
    Object.freeze({ key: 'compuerta', label: 'La compuerta del aljibe', fausto: P(15, 11, 8), player: P(16, 11, 8) }),
    Object.freeze({ key: 'caracola', label: 'La caracola del muelle', fausto: P(9, 17, 4), player: P(8, 16, 2) }),
  ]),
  fountain: P(4, 5), // fuente_grande 4×6 (x 4–7, y 5–10)
  stall: P(26, 14), // puesto de redes 3×2 centrado en (26,14) (x 25–27, y 13–14)
  vents: Object.freeze([P(25, 18), P(5, 8)]),
});

// ─────────────────────────────── Sala 3: el helecho y la raíz ───────────────────────────────
export const ROOM3 = Object.freeze({
  /** Muro que separa el barrio bajo (y 13–23) de la terraza alta (y 5–9). */
  wall: Object.freeze({ y0: 10, y1: 12 }),
  soil: P(9, 13), // tierra húmeda al pie del risco (primigenia); se planta mirando arriba desde (9,14)
  sprout: P(27, 19), // brote de helecho en la arboleda del este (primigenia); se coge desde (26,19)
  /** Raíz de Antea: trepar desde (9,13) hasta (9,9); bajar desde (9,9) hasta (9,13). */
  root: Object.freeze({ up: P(9, 12), from: P(9, 13, 8), top: P(9, 9, 2), down: P(9, 10) }),
  cell: P(6, 6), // C083, terraza alta del presente
  vents: Object.freeze([P(26, 15), P(20, 6), P(5, 20)]),
});

// ─────────────────────────────── Sala 4: la Puerta de la Fosa ───────────────────────────────
export const ROOM4 = Object.freeze({
  /** Balcón del aliviadero (Antea): x 4–9, y 5–8; se sube por la raíz desde (7,12). */
  balcony: Object.freeze({ x0: 4, y0: 5, x1: 9, y1: 8 }),
  lever: P(5, 6), // palanca del aliviadero (Antea); se acciona desde (6,6) mirando al oeste
  leverFrom: P(6, 6, 4),
  soil: P(7, 12), // primigenia; se planta desde (7,13) mirando arriba
  sprout: P(26, 13), // primigenia; se coge desde (25,13)
  root: Object.freeze({ up: P(7, 11), from: P(7, 12, 8), top: P(7, 8, 2), down: P(7, 9) }),
  /** Corrientes de la boca de la Fosa (presente, aliviadero abierto): cubren su umbral (x 15–17, y 4) y empujan al sur. */
  currents: Object.freeze([
    { x: 15, y: 4, length: 4 }, { x: 16, y: 4, length: 4 }, { x: 17, y: 4, length: 4 }, { x: 16, y: 6, length: 4 },
  ]),
  spring: P(20, 8), // pilar_manantial 3×3 (x 20–22, y 8–10); el evento está en (21,10)
  springEvent: P(21, 10),
  springStand: P(21, 11, 8), // casilla de reintento tras perder contra la Bramaluna
  cell: P(16, 10), // C084, ante la boca de la Fosa
  vents: Object.freeze([P(26, 21), P(6, 20)]),
});

// ─────────────────────────────── Bramaluna Alfa (era primigenia) ───────────────────────────────
/** Cono de visión (casillas en línea recta) y ritmo de la patrulla (fotogramas por casilla). */
export const BRAMALUNA = Object.freeze({ sight: 5, stepFrames: 24, warnRange: 8 });
/**
 * Patrullas deterministas (world/… no: content/events/b14_bramaluna.js#patrolAt): posición = f(fotograma del mapa).
 * `route`: [dir, casillas] para andar o { turn: dir, wait } para girarse y esperar.
 */
export const PATROLS = Object.freeze({
  antea_3_primigenia: Object.freeze({
    start: P(12, 15, 6),
    route: Object.freeze([
      [6, 9], { turn: 2, wait: 70 }, { turn: 6, wait: 30 }, [4, 9], { turn: 2, wait: 70 }, { turn: 4, wait: 30 },
    ]),
  }),
  antea_4_primigenia: Object.freeze({
    start: P(10, 16, 6),
    route: Object.freeze([
      [6, 13], { turn: 2, wait: 70 }, { turn: 6, wait: 30 }, [4, 13], { turn: 2, wait: 70 }, { turn: 4, wait: 30 },
    ]),
  }),
});

// ─────────────────────────────── Fosa del Eco (cámara del núcleo) ───────────────────────────────
export const FOSA = Object.freeze({
  w: 30, h: 26,
  arrival: P(15, 23, 8),
  door: P(15, 24), // salida sur → antea_4_presente, boca de la Fosa
  back: P(16, 5, 2), // llegada al volver a la sala 4 (presente)
  chamber: P(13, 10), // pilar_camara_nucleo 5×5 (centro (15,12))
  core: P(15, 12),
  nest: P(15, 6), // nido: Bramaluna eco (antes del P7) y real (después)
  echoBoss: P(15, 7, 2),
  trigger: Object.freeze({ y: 16, x0: 3, x1: 26 }), // franja (todo el ancho) que despierta a la Bramaluna eco
  battleSpot: P(15, 13, 8),
  upcurrent: P(24, 19), // corriente ascendente (tras el P7): sube a Caleta Sonda
  inscription: P(18, 11), // placa con la inscripción de T13
});

// ─────────────────────────────── Arrecife del Eco ───────────────────────────────
export const ARRECIFE = Object.freeze({
  w: 44, h: 36,
  arrival: P(22, 31, 8), // desde el remolino de Caleta Sonda (y salida a la superficie en la misma casilla)
  gate: Object.freeze({ door: P(22, 13), arrival: P(22, 14, 2) }), // Columna de Antea → primer piso
  /** Cabezal de la draga de Genesis: tapa la puerta hasta que la jefa lo aparta. */
  dredge: P(22, 14), dredgeBlock: Object.freeze([[21, 14], [23, 14], [21, 13], [23, 13]]), // encajado en la boca
  dredgeAside: P(28, 8), dredgeAsideBlock: Object.freeze([[27, 7], [28, 7], [29, 7], [27, 8], [29, 8]]),
  /** Campana de dragado de Genesis (exterior) y su escotilla. */
  bell: P(8, 12), bellBlock: Object.freeze([[7, 11], [8, 11], [9, 11], [7, 12], [9, 12]]),
  hatch: P(8, 13),
  /** Paso al Fondo del Mar del Sur por el borde este (filas 14–20). */
  east: Object.freeze({ x: 43, y0: 14, y1: 20 }),
  vents: Object.freeze([P(12, 21), P(33, 27), P(22, 16), P(36, 15)]),
  /** Decorado con evento (el constructor no pone roca encima): corales [x, y, fila], cajas [x, y, abierta?], columna. */
  corals: Object.freeze([
    [6, 15, 2], [5, 17, 4], [11, 23, 6], [16, 25, 8], [24, 28, 2], [27, 29, 4], [31, 27, 6], [38, 24, 8], [39, 13, 2],
    [36, 17, 4], [30, 12, 6], [9, 30, 8], [4, 22, 2], [20, 22, 4], [33, 31, 2], [15, 31, 6], [40, 27, 4], [26, 21, 8],
  ]),
  crates: Object.freeze([[12, 16], [13, 16, true], [19, 14], [26, 9]]),
  column: P(12, 21),
  /** Buceadores (casilla, mirada) y objetos del suelo. */
  trainers: Object.freeze({ casimiro: P(14, 24, 6), rocio: P(34, 18, 4) }),
  items: Object.freeze([
    { id: 'objeto_arrecife_red', x: 29, y: 31, item: 'NETBALL', count: 2 },
    { id: 'objeto_arrecife_buceo', x: 6, y: 19, item: 'DIVEBALL', count: 3 },
    { id: 'objeto_arrecife_perla', x: 39, y: 11, item: 'PEARL', hidden: true },
    { id: 'objeto_arrecife_perla_grande', x: 10, y: 31, item: 'BIGPEARL', hidden: true },
    { id: 'objeto_arrecife_concha', x: 18, y: 27, item: 'SHOALSHELL' },
  ]),
});

/** Primer piso de la columna: vestigios de Antea, antes de las capas del tiempo. */
export const ANTEA_BASE = Object.freeze({
  w: 27, h: 25,
  down: P(13, 22), arrival: P(13, 21, 8),
  up: P(13, 5), returnFromLayers: P(13, 6, 2),
});

// ─────────────────────────────── Campana de dragado (interior de Genesis) ───────────────────────────────
export const CAMPANA_INT = Object.freeze({
  w: 17, h: 13,
  entry: P(8, 10, 8), // llegada por la escotilla (sobre el felpudo)
  exitY: 10, // felpudo de la escotilla (salida pulsando abajo en x 8–9)
  exitMat: Object.freeze([P(8, 10), P(9, 10)]),
  jefa: P(8, 3, 2),
  console: P(12, 3),
});

// ─────────────────────────────── Fondo del Mar del Sur ───────────────────────────────
/**
 * 180×50 con las mismas coordenadas que la superficie `mar_del_sur` (B13, 190×50: oeste x 0–59, centro 60–129, este
 * 130–189): el fondo cubre x 0–179 y, desde x 171, cae a la Fosa Abisal (bajo el sector este; las 10 columnas finales
 * de la superficie, junto al Volcán Tizón, no tienen remolinos). Se entra desde el Arrecife del Eco por el borde oeste
 * (filas 20–26); los remolinos de la superficie (mar_layout.js#WHIRLPOOLS) bajan a la misma (x, y) del fondo. El Islote
 * Lumbre cuelga del borde sur de la superficie en x 20–43: su raíz de roca está al pie del borde sur del fondo.
 */
export const FONDO = Object.freeze({
  w: 180, h: 50,
  west: Object.freeze({ y0: 20, y1: 26 }),
  cells: Object.freeze({
    fondo_sur_1: P(84, 18), fondo_sur_2: P(103, 37), // C077–C078 praderas de algas (centro)
    fondo_sur_3: P(32, 46), fondo_sur_4: P(43, 45), // C079–C080 bajo el Islote Lumbre (oeste, raíz del islote al sur)
    fondo_sur_5: P(163, 27), // C081 borde de la Fosa Abisal (este)
  }),
  /** Salidas a la superficie (haces de luz): suben a la misma casilla de mar_del_sur (sus remolinos). */
  surface: Object.freeze([P(20, 8), P(52, 20), P(76, 30), P(110, 12), P(138, 36), P(150, 10)]),
  vents: Object.freeze([
    P(8, 23), P(26, 20), P(40, 9), P(55, 32), P(70, 16), P(88, 30), P(98, 10), P(118, 26), P(132, 14), P(145, 30),
    P(158, 18), P(166, 38), P(32, 40),
  ]),
  abyssX: 171, // desde aquí al este: la Fosa Abisal (no se pisa)
});

// ─────────────────────────────── Caleta Sonda (B09b): añadidos del bloque ───────────────────────────────
export const CALETA = Object.freeze({
  reefDive: P(4, 28), // remolino del Arrecife del Eco (agua de la caleta, al suroeste)
  mother: P(11, 21, 2), // Carmela, madre de Fausto, en la playa mirando al mar
  fisher: P(13, 21, 4), // Tobías, el pescador que volvió con monedas (junto al farolillo de B13 en (14,21))
  faustoBeach: P(12, 22, 8), // Fausto en la playa (cuando ha vuelto)
  sceneSpot: P(12, 20, 2), // donde queda el jugador en las escenas de la playa
});
