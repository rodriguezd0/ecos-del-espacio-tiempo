// Coordenadas compartidas del Bloque 11 (Interludio 5: Bosque Neblino, el Monte y la casa). FUENTE ÚNICA: los
// mapas (content/maps/b11/*.js), los guiones (content/events/b11_*.js), los tests y el E2E leen de aquí, así un
// cambio de trazado mantiene coherentes warps, conexiones y escenas. Módulo puro. Ver README.md.

/**
 * Ruta 10 (60×40, tileset 7; CAMPANA §1.4 «Faldas del Monte»: E Ruta 1 · O Monte · S Neblino).
 * Tramo bajo (filas 17–39, libre desde el cruce oeste de la Ruta 1) y tramo alto (terraza de las filas 0–16,
 * solo con Trepar). El Albo baja del campamento por el oeste (filas 20–23) y gira al sur hacia el Neblino.
 */
export const RUTA10 = Object.freeze({
  width: 60,
  height: 40,
  /** Salida este → Ruta 1 (filas 20–21 = filas 16–17 de la Ruta 1: su enlace pendiente, offset −4). */
  east: Object.freeze({ x: 59, y0: 20, y1: 21, offset: 4 }),
  /** Salida sur → Ruta 9 y Bosque Neblino (x 20–23 = x 20–23 del Neblino, offset 0). */
  south: Object.freeze({ y: 39, x0: 20, x1: 23, offset: 0 }),
  /** Salida oeste del tramo alto → campamento del Monte (filas 6–8, offset 0). */
  west: Object.freeze({ x: 0, y0: 6, y1: 8, offset: 0 }),
  /** Tramo alto: terraza con cara sur en las filas 14–16 (x 0–53). */
  alto: Object.freeze({ x0: -2, y0: -1, x1: 53, y1: 16, faceTop: 14 }),
  /** Zona de encuentros del tramo alto (tablas de nivel 40–45). */
  altoZone: Object.freeze({ x0: 0, y0: 0, x1: 59, y1: 13 }),
  /** Pared de raíces principal (Trepar): se sube desde (30,17) y se baja desde (30,13). */
  climb: Object.freeze({ x: 30, bottom: 16, top: 14, from: [30, 17], to: [30, 13] }),
  /** Punto seguro del sigilo (lo alto de la pared) y hacia dónde se mira al volver. */
  safe: Object.freeze({ x: 31, y: 13, dir: 6 }),
  /** Cornisa del nordeste (terraza alta, cara 4–6): la cuadrilla y el dormidero de Honchkrow. */
  cornisa: Object.freeze({ x0: 42, y0: -1, x1: 51, y1: 6, wall: 46, from: [46, 7], to: [46, 3] }),
  /** Cuadrilla atrapada en la cornisa (T10). */
  crew: Object.freeze([{ x: 44, y: 2, dir: 2 }, { x: 45, y: 1, dir: 2 }]),
  /** Dormidero: el Honchkrow Alfa y la Tablilla. */
  roost: Object.freeze({ alfa: { x: 49, y: 1, dir: 4 }, plate: { x: 49, y: 2 } }),
  /** Repisa de la pared de raíces (C049), al noroeste del tramo alto. */
  ledge: Object.freeze({ x0: 12, y0: -1, x1: 18, y1: 5, wall: 15, from: [15, 6], to: [15, 2] }),
  /** El Albo: entra por el oeste (filas 20–23) y baja al sur por x 7–10. */
  river: Object.freeze({ west: [0, 20, 10, 23], south: [7, 20, 10, 39] }),
  start: Object.freeze({ x: 57, y: 20, dir: 4 }),
});

/**
 * Ruta 9 y Bosque Neblino (50×60, tileset 7; CAMPANA §1.4: S Mnemos · N Ruta 10; niebla del olvido en bucle
 * hasta p5_restored). El Albo entra por el norte (x 7–10), baja con meandros y cruza al este bajo un puente (su
 * cauce exacto: ruta_9_neblino_build.js#RIVER_CELLS).
 */
export const NEBLINO = Object.freeze({
  width: 50,
  height: 60,
  /** Borde norte → Ruta 10 (x 20–23). */
  north: Object.freeze({ y: 0, x0: 20, x1: 23 }),
  /** Borde sur → Aldea Mnemos (B10): x 22–24 del Neblino = calle norte de Mnemos x 22–24 (offset 0). */
  south: Object.freeze({ y: 59, x0: 22, x1: 24, offset: 0 }),
  /**
   * Franjas donde la niebla devuelve al lindero antes del P5 (y de vuelta al punto de llegada). Cubren todo el
   * ancho transitable del bosque: no hay forma de rodearlas.
   */
  loopNorth: Object.freeze({ y: 5, x0: 1, x1: 48, back: { x: 21, y: 1, dir: 8 } }),
  loopSouth: Object.freeze({ y: 50, x0: 1, x1: 48, back: { x: 23, y: 58, dir: 2 } }),
  /** Puente de troncos sobre el Albo (x 23–25, filas 29–33; el río pasa por debajo en las filas 30–32). */
  bridge: Object.freeze({ x0: 23, x1: 25, y0: 29, y1: 33 }),
  /** Escondite de Nilo (de noche). */
  nilo: Object.freeze({ x: 13, y: 17, dir: 2 }),
  /** Claro de acampada: hoguera (descanso) y tronco. */
  camp: Object.freeze({ fire: { x: 31, y: 42 }, x0: 27, y0: 39, x1: 35, y1: 46 }),
  /** Loma del tronco hueco (C047): terraza con cara 8–10 y el tronco en lo alto. */
  hollow: Object.freeze({ x0: 32, y0: 2, x1: 38, y1: 10, wall: 35, from: [35, 11], to: [35, 7] }),
  /** Repisa de cristal (C048): terraza con cara 40–42. */
  crystal: Object.freeze({ x0: 38, y0: 35, x1: 45, y1: 42, wall: 41, from: [41, 43], to: [41, 39] }),
  /** Claro del santuario (decorado) y la Lopunnita escondida. */
  shrine: Object.freeze({ x: 13, y: 46 }),
  start: Object.freeze({ x: 21, y: 1, dir: 2 }),
});

/**
 * Campamento del Monte (40×28, tileset 1): campamento de Genesis al pie del Monte del Portal (EXP-03). Este →
 * Ruta 10 (tramo alto, filas 6–8). Al noroeste, la senda del Monte sube a montana_portal (B01/B12).
 */
export const CAMP = Object.freeze({
  width: 40,
  height: 28,
  east: Object.freeze({ x: 39, y0: 6, y1: 8, offset: 0 }),
  /** Senda del Monte: sale por el borde norte (x 9–12) hacia la explanada del prólogo. */
  trail: Object.freeze({ x0: 9, x1: 12, y: 0, to: 'montana_portal', tx: 17, ty: 48, dir: 8 }),
  /** Perímetro de Genesis (dos barreras en la fila 8, x 9–12) y el técnico que lo guarda. */
  perimeter: Object.freeze({ y: 8, x0: 9, x1: 12, guard: { x: 13, y: 8, dir: 4 } }),
  /** Gael baja por la senda (B4) y casilla del jugador en el combate. */
  gael: Object.freeze({ x: 10, y: 3, dir: 2 }),
  gaelStop: Object.freeze({ x: 10, y: 9, dir: 2 }),
  duelSpot: Object.freeze({ x: 10, y: 11, dir: 8 }),
  /** Jefa de campo y técnicos. */
  chief: Object.freeze({ x: 25, y: 10, dir: 2 }),
  techs: Object.freeze([{ x: 16, y: 7, dir: 2 }, { x: 31, y: 7, dir: 4 }]),
  /** Cajas EXP-03 (evento con arte propio), la perforadora de muestras y el trípode que mide el aljibe. */
  crates: Object.freeze([[24, 8], [25, 8], [24, 7]]),
  rig: Object.freeze({ x: 19, y: 13 }),
  tripod: Object.freeze({ x: 12, y: 10 }),
  /** Franja de llegada desde la Ruta 10 (escena de la primera visita). */
  arrival: Object.freeze({ x: 37, y0: 6, y1: 8 }),
  start: Object.freeze({ x: 37, y: 7, dir: 4 }),
});

/** Cerro del Alba (24×30, tileset 1): cornisa con Trepar desde el mirador de la Ruta 1 (C054). */
export const CERRO = Object.freeze({
  width: 24,
  height: 30,
  /** Llegada desde la Ruta 1 y salida (empujar hacia abajo en la base, x 4–6). */
  entry: Object.freeze({ x: 5, y: 27, dir: 8 }),
  exit: Object.freeze({ y: 29, x0: 4, x1: 6 }),
  /** Terraza de la cornisa (cara 20–22; abierta por arriba) y, encima, la cima (cara 9–11, con escalera). */
  cornisa: Object.freeze({ x0: -2, y0: -1, x1: 25, y1: 22 }),
  summit: Object.freeze({ x0: 4, y0: -1, x1: 19, y1: 11, stairs: 10 }),
  /** Pared de la cornisa (Trepar): se sube desde (11,23) y se baja desde (11,19). */
  wall: Object.freeze({ x: 11, from: [11, 23], to: [11, 19] }),
  cell: Object.freeze({ x: 18, y: 15 }),
  /** Brasero de la cima (Ho-Oh, postgame: solo decorado). */
  brazier: Object.freeze({ x: 12, y: 4 }),
});

/** Acceso al Cerro del Alba en la Ruta 1 (B01): raíces en el muro este del mirador del nordeste (Correr + Trepar). */
export const RUTA1_CERRO = Object.freeze({
  wall: Object.freeze({ x: 24, y: 7 }),
  from: Object.freeze({ x: 23, y: 7, dir: 4 }),
});

/** Casa de Íker en la Aldea Mnemos (tileset 4, 15×12; la puerta exterior la pone B10). */
export const IKER = Object.freeze({
  width: 15,
  height: 12,
  door: Object.freeze({ x: 7, y: 10 }),
  iker: Object.freeze({ x: 10, y: 4, dir: 2 }),
  mother: Object.freeze({ x: 4, y: 6, dir: 6 }),
  elder: Object.freeze({ x: 3, y: 8, dir: 6 }),
  musharna: Object.freeze({ x: 12, y: 5, dir: 4 }),
  /** Dibujos de la pared (tres lugares) y el plano grande de la mesa. */
  drawings: Object.freeze([{ x: 4, y: 3 }, { x: 6, y: 3 }, { x: 8, y: 3 }]),
  plan: Object.freeze({ x: 7, y: 8 }),
});

/** Pozo de los Custodios (bajo la casa de té de Mnemos; tileset 2, 17×15). */
export const POZO = Object.freeze({
  width: 17,
  height: 15,
  entry: Object.freeze({ x: 8, y: 12, dir: 8 }),
  exit: Object.freeze({ x: 8, y: 13 }),
  plate: Object.freeze({ x: 8, y: 4 }),
});
