// Coordenadas del Archivo Hondo (B10, Pilar de la Memoria; docs/CAMPANA.md «Mazmorra: Archivo Hondo»): una espiral
// descendente de SEIS estancias, sin plantas, en un solo mapa (tileset 11 + kit de Pilar, tinte sepia). Plataformas de
// enlosado sobre el vacío; toda puerta entre estancias es un dintel con losa (o la puerta glífica) en un paso N–S.
//   1 Suelo Olvidado (arriba izquierda) → 2 Dos Manos (arriba derecha) ↓ 3 Lectura (derecha) ↓ 4 Rollos (abajo)
//   ↑ 5 Sala del Mural (izquierda) → 6 Cámara del núcleo (centro).
// FUENTE ÚNICA para el mapa, los eventos, la lógica de los puzles y las pruebas. Módulo puro.

export const W = 46;
export const H = 38;

const R = (x, y, w, h) => Object.freeze({ x, y, w, h });

/** Plataformas (rectángulos de enlosado). La unión de todas es el suelo pisable del mapa. */
export const FLOORS = Object.freeze({
  entrada: R(1, 1, 9, 6), // rellano de la escalera + losa del Suelo Olvidado
  sueloSalida: R(19, 1, 4, 6),
  pasillo12: R(23, 3, 5, 3),
  manos: R(28, 1, 17, 8),
  pasillo23: R(40, 9, 3, 3),
  lectura: R(32, 12, 13, 11),
  pasillo34a: R(38, 23, 3, 7),
  pasillo34b: R(31, 30, 9, 3),
  rollos: R(2, 28, 29, 9),
  bajoDintel45: R(5, 27, 5, 1),
  pasillo45: R(7, 21, 1, 6),
  mural: R(1, 11, 18, 10),
  pasillo56a: R(14, 8, 5, 3),
  pasillo56b: R(18, 8, 8, 2),
  pasillo56c: R(24, 10, 3, 1),
  antesala: R(24, 11, 3, 2), // columnas en x 24 y 26: solo se pasa por (25,12), donde espera Olvido
  nucleo: R(21, 13, 10, 12),
});

/** Estancia 1 — Suelo Olvidado: rejilla de suelo invisible entre el rellano y la salida. */
export const SUELO = Object.freeze({
  grid: R(10, 2, 9, 5),
  // Recorrido del custodio (el único seguro), de oeste a este, en coordenadas del mapa.
  path: Object.freeze([
    [10, 4], [11, 4], [12, 4], [13, 4], [13, 3], [13, 2], [14, 2], [15, 2], [15, 3], [15, 4], [15, 5], [16, 5], [17, 5],
    [17, 4], [18, 4],
  ]),
  start: Object.freeze({ x: 9, y: 4, dir: 6 }), // borde del rellano: vuelta tras caer
  exit: Object.freeze({ x: 19, y: 4 }),
  losa: Object.freeze({ x: 6, y: 3 }), // losa de recuerdo 2×2 (casillas x 6–7, y 3–4)
});

/** Estancia 2 — Dos Manos: dos palancas de 4 posiciones y la losa del dintel sur. */
export const MANOS = Object.freeze({
  levers: Object.freeze([Object.freeze({ x: 31, y: 2 }), Object.freeze({ x: 41, y: 2 })]),
  losa: Object.freeze({ x: 35, y: 5 }),
  dintel: Object.freeze({ x: 39, y: 5 }), // stamp pilar_dintel (5×4): hueco x 40–42, filas 7–8
  gate: Object.freeze({ x: 41, y: 8 }),
  custodios: Object.freeze([Object.freeze({ x: 33, y: 6, dir: 8 }), Object.freeze({ x: 38, y: 6, dir: 8 })]),
});

/** Estancia 3 — Lectura: estela donde lee la custodia y la puerta glífica del dintel sur. */
export const LECTURA = Object.freeze({
  stele: Object.freeze({ x: 34, y: 13 }), // pilar_placa_unown 2×2 (lectura desde y 15)
  reader: Object.freeze({ x: 35, y: 15, dir: 8 }),
  losa: Object.freeze({ x: 40, y: 14 }),
  dintel: Object.freeze({ x: 37, y: 19 }), // hueco x 38–40, filas 21–22 (el umbral glífico mide 3×1)
  door: Object.freeze({ x: 39, y: 22 }),
});

/** Estancia 4 — Rollos: estantería de cuatro huecos, cesta y losa; el dintel del noroeste sube al Mural. */
export const ROLLOS = Object.freeze({
  cubbies: Object.freeze([[13, 28], [14, 28], [15, 28], [16, 28]].map(([x, y]) => Object.freeze({ x, y }))),
  basket: Object.freeze({ x: 20, y: 29 }),
  losa: Object.freeze({ x: 22, y: 32 }),
  custodio: Object.freeze({ x: 20, y: 30, dir: 8 }),
  dintel: Object.freeze({ x: 5, y: 25 }), // hueco x 6–8, filas 27–28
  gate: Object.freeze({ x: 7, y: 28 }),
  cell: Object.freeze({ x: 7, y: 23 }), // C046: pasillo de una casilla tras la losa
});

/** Estancia 5 — Sala del Mural: seis paneles en la pared norte y el dintel del noreste hacia el núcleo. */
export const MURAL = Object.freeze({
  panels: Object.freeze([2, 4, 6, 8, 10, 12].map((x) => Object.freeze({ x, y: 11 }))), // fila de arriba; se leen desde la 12
  dintel: Object.freeze({ x: 14, y: 8 }), // hueco x 15–17, filas 10–11
  gate: Object.freeze({ x: 16, y: 11 }),
  spring: Object.freeze({ x: 13, y: 16 }), // pilar_manantial 3×3 (cura; se usa desde la fila 19 o los lados)
  springUse: Object.freeze([[14, 19], [12, 17], [16, 17]]),
});

/** Estancia 6 — Cámara del núcleo: Olvido en la antesala, pedestal en la cámara de núcleo y la escalera de vuelta. */
export const NUCLEO = Object.freeze({
  olvido: Object.freeze({ x: 25, y: 12, dir: 8 }), // en la antesala de una casilla (tapa el paso)
  olvidoAside: Object.freeze({ x: 27, y: 15, dir: 4 }),
  battleSpot: Object.freeze({ x: 25, y: 11, dir: 2 }), // reintento: antes de la antesala
  camara: Object.freeze({ x: 23, y: 17 }), // pilar_camara_nucleo 5×5
  pedestal: Object.freeze({ x: 25, y: 19 }), // base del pilar_pedestal (1×2); se usa desde (25,20)
  front: Object.freeze({ x: 25, y: 20, dir: 8 }),
  stairsUp: Object.freeze({ x: 29, y: 22 }), // escalera de los custodios (tras el P5): sube al Archivo de papel
});

/** Rellano de llegada, escalinata de subida (warp) y vuelta desde el Archivo de papel. */
export const ENTRY = Object.freeze({
  arrival: Object.freeze({ x: 4, y: 4, dir: 2 }),
  stairs: Object.freeze({ x: 3, y: 1 }), // pilar_escalinata 3×3
  exitTiles: Object.freeze([[3, 1], [4, 1], [5, 1]]),
});

/** Objetos del Archivo Hondo. */
export const HONDO_ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_hondo_1', x: 44, y: 1, item: 'SPELLTAG' }),
  Object.freeze({ id: 'objeto_hondo_2', x: 43, y: 21, item: 'FULLHEAL', hidden: true }),
  Object.freeze({ id: 'objeto_hondo_3', x: 3, y: 35, item: 'ULTRABALL', count: 3 }),
  Object.freeze({ id: 'objeto_hondo_4', x: 1, y: 17, item: 'TWISTEDSPOON' }), // junto a las vitrinas (no sobre la columna)
  Object.freeze({ id: 'objeto_hondo_5', x: 30, y: 24, item: 'MAXREPEL', hidden: true }),
]);

/** Entrenadores (casilla, dirección, visión). */
export const HONDO_TRAINERS = Object.freeze([
  Object.freeze({ id: 'b10_investigadora_leonor', x: 43, y: 4, dir: 4, sight: 3 }),
  Object.freeze({ id: 'b10_cerebrito_ismael', x: 43, y: 17, dir: 4, sight: 3 }),
  Object.freeze({ id: 'b10_medium_remigio', x: 27, y: 34, dir: 4, sight: 4 }),
]);

export const HONDO = Object.freeze({ floors: FLOORS, suelo: SUELO, manos: MANOS, lectura: LECTURA, rollos: ROLLOS, mural: MURAL, nucleo: NUCLEO, entry: ENTRY });

/** Casillas de un rectángulo. */
export function rectCells({ x, y, w, h }) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Casillas trampa del Suelo Olvidado (la rejilla menos el recorrido seguro). */
export function sueloTraps() {
  const safe = new Set(SUELO.path.map(([x, y]) => `${x},${y}`));
  return rectCells(SUELO.grid).filter(([x, y]) => !safe.has(`${x},${y}`));
}
