// Coordenadas del Santuario del Alma (B16, Pilar del Alma; docs/CAMPANA.md B16 y §1.5: «Centro y 3 alas»). Un solo
// mapa de tileset 11 (InteriorTorre) con salas solemnes (brush `sala_<color>`: pared de mármol, suelo de baldosa y
// marco) y el kit común de Pilar, con el tinte rosa pálido del P8. Las salas flotan en la oscuridad y se enlazan por
// puertas en la pared (warps que se activan empujando contra el hueco del dintel) y escalinatas de bajada:
//   Patio central (blanco): tres dinteles en la pared norte — Saber (izquierda), Sentir (centro), Querer (derecha) —,
//     el hexágono sellado del Telar en el centro, el manantial y la escalinata de salida a los Lagos.
//   Ala del Saber (dorado, columna izquierda): Glifos → Tres puertas → Cuatro puertas → Cámara de Uxie.
//   Ala del Sentir (morado): Espejo 1 → Espejo 2 → Espejo 3 → Último espejo (recuerdo de Gael) → Cámara de Mesprit.
//   Ala del Querer (azul, columna derecha): Pasillo del viento → Cámara de Azelf.
//   Telar del Alma (dorado): se entra por el hexágono del patio con las tres Hebras.
// Una sala `room: { x, y, w, h }` es el rectángulo del brush (paredes + suelo); el marco queda una casilla por fuera y
// las tres primeras filas son pared. FUENTE ÚNICA para el mapa, los eventos, la lógica y las pruebas. Módulo puro.
import { ROOM_W, ROOM_H, MIRROR_X } from '../../events/b16_mirror_logic.js';
import { CORRIDOR_W, CORRIDOR_H, START as WIND_START, EXIT as WIND_EXIT } from '../../events/b16_wind_logic.js';

export const W = 77;
export const H = 62;

const R = (x, y, w, h) => Object.freeze({ x, y, w, h });
const P = (x, y, dir = 8) => Object.freeze({ x, y, dir });
/** Primera fila de suelo de una sala (bajo las tres filas de pared). */
export const floorTop = (room) => room.y + 3;
/** Última fila de suelo. */
export const floorBottom = (room) => room.y + room.h - 1;

/**
 * Puerta en la pared norte de una sala: dintel (5×4) con la viga sobre el marco y el hueco (3 casillas) pintado de
 * negro; los warps están en la fila de pared de abajo del hueco (se activan empujando hacia arriba desde el suelo).
 */
function wallGate(room, cx) {
  return Object.freeze({
    cx,
    dintel: Object.freeze({ x: cx - 2, y: room.y - 1 }),
    hollow: Object.freeze([cx - 1, cx, cx + 1].map((x) => Object.freeze({ x, y: room.y + 2 }))),
    warp: Object.freeze({ x: cx, y: room.y + 2 }), // solo el centro: se empuja desde `front`
    front: P(cx, floorTop(room), 8),
  });
}

/** Escalinata de bajada en el suelo (3×3, al pie de la sala): warps por dirección abajo en su última fila. */
function stairs(room, cx) {
  const y = floorBottom(room);
  return Object.freeze({
    cx,
    stamp: Object.freeze({ x: cx - 1, y: y - 2 }),
    exits: Object.freeze([cx - 1, cx, cx + 1].map((x) => Object.freeze({ x, y }))),
    arrive: P(cx, y - 1, 8),
  });
}

// ─────────────────────────────── Patio central ───────────────────────────────

const PATIO_ROOM = R(28, 46, 25, 13);
export const PATIO = Object.freeze({
  room: PATIO_ROOM,
  gates: Object.freeze({
    saber: wallGate(PATIO_ROOM, 32),
    sentir: wallGate(PATIO_ROOM, 40),
    querer: wallGate(PATIO_ROOM, 48),
  }),
  exit: stairs(PATIO_ROOM, 40),
  /** Hexágono sellado del Telar (pilar_camara_nucleo 5×5 con el sello en el centro). */
  dais: Object.freeze({ x: 38, y: 51 }),
  seal: Object.freeze({ x: 40, y: 53 }),
  spring: Object.freeze({ x: 30, y: 54 }), // pilar_manantial 3×3 (cura); se usa desde abajo o los lados
  springUse: Object.freeze([[31, 57], [29, 55], [33, 55]]),
  statues: Object.freeze([[29, 49], [51, 49]]),
  zone: R(28, 49, 25, 10), // encuentros del patio (Cueva / ruina)
});

// ─────────────────────────────── Ala del Saber ───────────────────────────────

const GLYPH_ROOM = R(1, 1, 21, 13);
const DOORS3_ROOM = R(1, 17, 13, 10);
const DOORS4_ROOM = R(1, 30, 17, 10);
const UXIE_ROOM = R(1, 43, 15, 11);

export const SABER = Object.freeze({
  glyphRoom: Object.freeze({
    room: GLYPH_ROOM,
    entry: stairs(GLYPH_ROOM, 11),
    gate: wallGate(GLYPH_ROOM, 11), // hacia las tres puertas (cerrada hasta colocar los siete glifos)
    /** Relieves en la fila baja de la pared (se leen desde la fila de suelo de abajo), en el orden de RELIEF_ORDER. */
    reliefs: Object.freeze([2, 4, 6, 8, 14, 16, 18].map((x) => Object.freeze({ x, y: GLYPH_ROOM.y + 2 }))),
    uxiePlaque: Object.freeze({ x: 20, y: GLYPH_ROOM.y + 2 }),
    /** Pedestales P1–P7 (pilar_pedestal 1×2: el evento va en su base). */
    pedestals: Object.freeze([5, 7, 9, 11, 13, 15, 17].map((x) => Object.freeze({ x, y: 8 }))),
  }),
  doors3: Object.freeze({
    room: DOORS3_ROOM,
    entry: stairs(DOORS3_ROOM, 7),
    doors: Object.freeze([3, 7, 11].map((x) => Object.freeze({ x, y: DOORS3_ROOM.y + 2 }))),
    stele: Object.freeze({ x: 2, y: 22 }), // pilar_placa_unown 2×2 (reglas); se lee desde la fila de abajo
  }),
  doors4: Object.freeze({
    room: DOORS4_ROOM,
    entry: stairs(DOORS4_ROOM, 9),
    doors: Object.freeze([3, 7, 11, 15].map((x) => Object.freeze({ x, y: DOORS4_ROOM.y + 2 }))),
    stele: Object.freeze({ x: 13, y: 36 }),
  }),
  uxie: Object.freeze({
    room: UXIE_ROOM,
    entry: stairs(UXIE_ROOM, 8),
    chamber: Object.freeze({ x: 6, y: 46 }), // pilar_camara_nucleo 5×5
    uxie: P(8, 48, 2),
  }),
  /** C097: delante de la puerta de la sala de los glifos (el único hueco que lleva a las puertas: paso obligatorio). */
  cell: Object.freeze({ x: 11, y: 4 }),
});

// ─────────────────────────────── Ala del Sentir ───────────────────────────────

const mirrorRoomRect = (y) => R(25, y, ROOM_W, 3 + ROOM_H);
const MIRROR_ROOMS = [mirrorRoomRect(1), mirrorRoomRect(15), mirrorRoomRect(29)];
const LAST_MIRROR_ROOM = R(45, 1, 13, 11);
const MESPRIT_ROOM = R(45, 15, 13, 11);

/** Casilla del mapa de la casilla (gx, gy) de la rejilla de una sala de espejos. */
export const mirrorCell = (room, gx, gy) => Object.freeze({ x: room.x + gx, y: floorTop(room) + gy });

export const SENTIR = Object.freeze({
  mirrors: Object.freeze(MIRROR_ROOMS.map((room, i) => Object.freeze({
    n: i + 1,
    room,
    mirrorX: room.x + MIRROR_X,
    /** Entrada (P de la rejilla, abajo a la izquierda): se vuelve al patio pulsando abajo. */
    entry: mirrorCell(room, 1, ROOM_H - 1),
    exitBelow: Object.freeze({ x: room.x + 1, y: floorBottom(room) }),
    gate: wallGate(room, room.x + 4), // hacia la sala siguiente (cerrada hasta atrapar el reflejo de Mesprit)
    reset: mirrorCell(room, 1, ROOM_H - 2), // losa de eco: devuelve el reflejo a su sitio
  }))),
  lastMirror: Object.freeze({
    room: LAST_MIRROR_ROOM,
    entry: stairs(LAST_MIRROR_ROOM, 51),
    mirror: Object.freeze({ x: 51, y: LAST_MIRROR_ROOM.y + 2 }), // el gran espejo (pared norte)
    front: P(51, floorTop(LAST_MIRROR_ROOM), 8),
  }),
  mesprit: Object.freeze({
    room: MESPRIT_ROOM,
    entry: stairs(MESPRIT_ROOM, 51),
    chamber: Object.freeze({ x: 49, y: 18 }),
    mesprit: P(51, 20, 2),
    arrive: P(51, 22, 8), // vuelta del recuerdo, frente a Mesprit
  }),
  /** C098: delante de la puerta del tercer espejo (paso obligatorio hacia el último espejo). */
  cell: Object.freeze({ x: 29, y: 32 }),
});

// ─────────────────────────────── Ala del Querer ───────────────────────────────

const WIND_ROOM = R(63, 1, CORRIDOR_W, 3 + CORRIDOR_H);
const AZELF_ROOM = R(62, 25, 13, 11);
/** Casilla del mapa de la casilla (gx, gy) del pasillo. */
export const windCell = (gx, gy) => Object.freeze({ x: WIND_ROOM.x + gx, y: floorTop(WIND_ROOM) + gy });

export const QUERER = Object.freeze({
  wind: Object.freeze({
    room: WIND_ROOM,
    entry: windCell(...WIND_START),
    exitBelow: windCell(...WIND_START),
    top: windCell(...WIND_EXIT),
    gate: wallGate(WIND_ROOM, WIND_ROOM.x + WIND_EXIT[0]),
    cell: windCell(...WIND_EXIT), // C099: la repisa de arriba
  }),
  azelf: Object.freeze({
    room: AZELF_ROOM,
    entry: stairs(AZELF_ROOM, 68),
    chamber: Object.freeze({ x: 66, y: 28 }),
    azelf: P(68, 30, 2),
    battleSpot: P(68, 32, 8), // delante de Azelf (reintento)
  }),
});

// ─────────────────────────────── Telar del Alma ───────────────────────────────

const TELAR_ROOM = R(44, 29, 15, 13);
export const TELAR = Object.freeze({
  room: TELAR_ROOM,
  entry: stairs(TELAR_ROOM, 51),
  emblem: Object.freeze({ x: 49, y: 33 }), // emblema_suelo 5×5 bajo el telar
  loom: Object.freeze({ x: 51, y: 36 }), // evento del Telar (hoja 96×128, anclado abajo); ocupa x 50–52, y 35–36
  loomBlocks: Object.freeze([[50, 35], [52, 35], [50, 36], [52, 36], [51, 35]]),
  spot: P(51, 37, 8), // única casilla desde la que se alcanza el Telar: el ritual se hace aquí
  cell: Object.freeze({ x: 51, y: 37 }), // C100: en esa misma casilla (antes del ritual y del núcleo)
  trio: Object.freeze({ uxie: P(48, 35, 6), mesprit: P(54, 35, 4), azelf: P(51, 33, 2) }),
});

/** Llegada desde los Lagos (al pie de la escalinata del patio) y salida hacia ellos. */
export const ENTRY = Object.freeze({ arrive: PATIO.exit.arrive });

/** Objetos del santuario (casillas de suelo alcanzables a su tiempo). */
export const SANTUARIO_ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_alma_1', x: 20, y: 12, item: 'MAXELIXIR' }), // sala de los glifos, rincón
  Object.freeze({ id: 'objeto_alma_2', x: 14, y: 52, item: 'RARECANDY' }), // cámara de Uxie
  Object.freeze({ id: 'objeto_alma_3', x: 56, y: 24, item: 'MAXREVIVE' }), // cámara de Mesprit
  Object.freeze({ id: 'objeto_alma_4', x: 73, y: 34, item: 'FULLRESTORE' }), // cámara de Azelf (antes del combate)
  Object.freeze({ id: 'objeto_alma_5', x: 51, y: 57, item: 'PPUP', hidden: true }), // patio, junto al hexágono
]);
