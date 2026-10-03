// Coordenadas compartidas del Bloque 6 (Pilar del Impulso): entradas, salidas, conexiones y puntos de escena.
// FUENTE ÚNICA: los mapas (content/maps/b06/*.js) y los guiones (content/events/b06_*.js) leen de aquí, así
// un cambio de trazado mantiene coherentes los warps. Módulo puro (Node y navegador). Ver README.md.

/** Ruta 5 (60×40, tileset 1): oeste → Villa Brontia (B05), este → Meseta del Impulso. */
export const RUTA5 = Object.freeze({
  width: 60,
  height: 40,
  /** Camino del borde oeste (x 0) hacia Villa Brontia: filas 18–21 (= filas 18–21 de Brontia, B05, offset 0). */
  west: Object.freeze({ x: 0, y0: 18, y1: 21 }),
  /** Camino del borde este (x 59) hacia la Meseta: filas 13–16. */
  east: Object.freeze({ x: 59, y0: 13, y1: 16 }),
  /** Troncos rajados (Embestida) que cierran el paso entre las dos peñas. */
  logs: Object.freeze([[31, 15], [31, 16]]),
  /** Tronco rajado del rincón norte (hondonada de C028, ver ruta_5_build.js NOOK). */
  nookLog: Object.freeze([41, 10]),
  /**
   * Molino de viento del altiplano (base del sprite de 3×5 casillas, x 55–57, y 5–9). Tras el P3 los Drifloon
   * vuelven a él (CAMPANA B06 «Cambio en el mundo»).
   */
  mill: Object.freeze({ x: 56, y: 9 }),
  millDrifloon: Object.freeze([[54, 5], [57, 4]]),
  start: Object.freeze({ x: 2, y: 19, dir: 6 }),
});

/** Meseta del Impulso (50×50, tileset 1): oeste → Ruta 5. */
export const MESETA = Object.freeze({
  width: 50,
  height: 50,
  /** Borde oeste (x 0), filas 22–25 = filas 13–16 de la Ruta 5. */
  west: Object.freeze({ x: 0, y0: 22, y1: 25 }),
  /** Valla del Parque Eólico (rectángulo) y su puerta (3 casillas en el lado sur). */
  fence: Object.freeze({ x0: 3, y0: 3, x1: 30, y1: 19 }),
  gate: Object.freeze({ x0: 16, x1: 18, y: 19 }),
  /** Nave del Colector (stamp `central` 11×9) y su puerta. */
  colector: Object.freeze({ x: 12, y: 7, door: Object.freeze({ x: 17, y: 14 }) }),
  /** Aerogeneradores del Parque (eventos animados; giran tras el P3). */
  turbines: Object.freeze([[6, 8], [6, 16], [26, 8], [13, 18], [10, 5], [23, 5], [44, 20], [43, 26], [44, 34]]),
  /** Gael y los dos técnicos que guardan la puerta (combate doble). */
  gael: Object.freeze({ x: 14, y: 21, dir: 6 }),
  guards: Object.freeze([{ x: 16, y: 20, dir: 2 }, { x: 18, y: 20, dir: 2 }]),
  /** Casilla del jugador en el combate doble (delante de la puerta) = punto de reintento. */
  doubleSpot: Object.freeze({ x: 17, y: 22, dir: 8 }),
  /** Peña del Anillo (terraza alta) con escalinata al sur; en lo alto, bajo un dintel, se sube al Anillo. */
  mesa: Object.freeze({ x0: 32, y0: 0, x1: 49, y1: 12 }),
  ringGate: Object.freeze({ x: 39, y: 9 }),
  ringArrival: Object.freeze({ x: 39, y: 13, dir: 2 }),
  start: Object.freeze({ x: 2, y: 23, dir: 6 }),
});

/**
 * Parque Eólico, interior ocupado (tileset 4): almacén (stamp `central_almacen` en (1,1)) y sala del Colector
 * (stamp `central_generador` en (29,1)), unidos por una puerta de servicio en la pared norte del almacén.
 */
export const PARQUE = Object.freeze({
  width: 46,
  height: 21,
  almacen: Object.freeze({ x: 1, y: 1 }),
  generador: Object.freeze({ x: 29, y: 1 }),
  /** Entrada desde la Meseta (hueco sur del almacén) y salida (pulsar abajo). */
  entry: Object.freeze({ x: 10, y: 18, dir: 8 }),
  exitTiles: Object.freeze([[9, 19], [10, 19], [11, 19], [12, 19]]),
  /** Puerta de servicio del almacén (pared norte) → sala del Colector. */
  innerDoor: Object.freeze({ x: 12, y: 4 }),
  innerFront: Object.freeze({ x: 12, y: 5, dir: 8 }),
  /** Llegada a la sala del Colector y hueco de vuelta al almacén. */
  colectorEntry: Object.freeze({ x: 35, y: 13, dir: 8 }),
  colectorBack: Object.freeze([[34, 14], [35, 14], [36, 14]]),
  /** Esfera «Muestra Z-2» entre los dos generadores, Casia delante y dónde se para el jugador. */
  sphere: Object.freeze({ x: 35, y: 7 }),
  casia: Object.freeze({ x: 35, y: 9, dir: 2 }),
  facing: Object.freeze({ x: 35, y: 11, dir: 8 }),
  /** Banco de ordenadores de Genesis (stamp `lab_ordenadores` 5×4, sin pisar la pared x 29) y dónde los mira Gael. */
  screens: Object.freeze({ x: 30, y: 9 }),
  gaelScreens: Object.freeze({ x: 32, y: 13, dir: 8 }),
});

/** Anillo de los Vientos (tileset 1): la mesa, el anillo exterior y la Sala de las Campanas en la terraza. */
export const ANILLO = Object.freeze({
  width: 44,
  height: 40,
  /** Terraza de la Sala: la casilla (0,0) de la sala ASCII (content/events/b06_wind_rooms.js CAMPANAS). */
  sala: Object.freeze({ ox: 12, oy: 6 }),
  /** Llegada desde la Meseta (pie del dintel) y vuelta. */
  entry: Object.freeze({ x: 21, y: 36, dir: 8 }),
  exitTiles: Object.freeze([[20, 38], [21, 38], [22, 38]]),
  /** Boca de las Galerías del Soplo (stamp `boquete` 4×3; se entra por arriba), Abril y su campamento. */
  mouth: Object.freeze({ x: 30, y: 24 }),
  mouthTiles: Object.freeze([[31, 24], [32, 24], [31, 25], [32, 25]]),
  /** Llegada al salir de las galerías: sobre la boca, en el anillo. */
  mouthArrival: Object.freeze({ x: 31, y: 23, dir: 8 }),
  abril: Object.freeze({ x: 34, y: 23, dir: 4 }),
  tent: Object.freeze({ x: 36, y: 24 }),
  fire: Object.freeze({ x: 35, y: 27 }),
  /** Monolitos del anillo exterior: cada uno mira hacia una campana (Norte, Este, Oeste). */
  monoliths: Object.freeze({
    N: Object.freeze({ x: 20, y: 1 }),
    E: Object.freeze({ x: 36, y: 9 }),
    W: Object.freeze({ x: 5, y: 11 }),
  }),
});

/** Galerías del Soplo (tileset 2): Flechas abajo, Remolino arriba. Esquinas de las salas ASCII. */
export const GALERIAS = Object.freeze({
  width: 26,
  height: 30,
  /** Rectángulo de suelo de la cueva (el pincel `sala` pone las paredes alrededor). */
  floor: Object.freeze({ x0: 3, y0: 4, x1: 22, y1: 28 }),
  remolino: Object.freeze({ ox: 2, oy: 3 }),
  flechas: Object.freeze({ ox: 2, oy: 16 }),
  /** Pasillo entre el Remolino (arriba) y las Flechas (abajo). */
  corridor: Object.freeze([[12, 15], [13, 15], [12, 16], [13, 16]]),
  /** Llegada desde el Anillo y salida de luz al sur (warp en la fila de la pared). */
  entry: Object.freeze({ x: 10, y: 28, dir: 8 }),
  exitDoor: Object.freeze({ x: 10, y: 29 }),
});

/** Nuevos pisos primero y tercero; las galerías y las campanas comparten el segundo. */
export const P3_VERTICAL = Object.freeze({
  width: 27, height: 25,
  floor: Object.freeze({ x: 3, y: 4, w: 21, h: 19 }),
  entry: Object.freeze({ x: 13, y: 20, dir: 8 }),
  down: Object.freeze({ x: 13, y: 22 }),
  up: Object.freeze({ x: 13, y: 5 }),
  baseReturn: Object.freeze({ x: 13, y: 6, dir: 2 }),
  pedestal: Object.freeze({ x: 13, y: 6 }),
  guardian: Object.freeze({ x: 13, y: 11, dir: 2 }),
  retry: Object.freeze({ x: 13, y: 14, dir: 8 }),
  challenge: Object.freeze(Array.from({ length: 21 }, (_, i) => Object.freeze([3 + i, 12]))),
});
