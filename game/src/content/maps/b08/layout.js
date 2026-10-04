// Coordenadas compartidas del Bloque 8 — Pilar de la Masa (docs/CAMPANA.md B08). FUENTE ÚNICA: los mapas
// (content/maps/b08/*.js), los guiones (content/events/b08_*.js), los tests y el recorrido E2E leen de aquí, así un
// cambio de trazado mantiene coherentes warps, escenas y pruebas. Módulo puro. La Cámara de los Contrapesos tiene su
// trazado en content/events/b08_balance_logic.js (lo comparten mapa, reglas y tests).

/**
 * Ciudad Estrato (56×48, tileset 5): ciudad minera en un cañón escalonado. Tres rellanos: el alto (y 0–11, cara
 * y 12–14), el de la plaza (y 15–29, cara y 30–32) y el bajo (y 33–47). Salidas: N Ruta 6 (B07) · O Ruta 7 (B09a) ·
 * E Dunas de Ceniza.
 */
export const ESTRATO = Object.freeze({
  width: 56,
  height: 48,
  /** Camino norte (y 0), x 26–30 = x 13–17 de la Ruta 6 (propuesta de B07: offset 13 / −13). */
  north: Object.freeze({ y: 0, x0: 26, x1: 30 }),
  /** Salida oeste (x 0), filas 22–25 = y 16–19 de la Ruta 7 (propuesta de B09a: offset 6 / −6). Vía en la fila 11. */
  west: Object.freeze({ x: 0, y0: 22, y1: 25 }),
  rail: Object.freeze({ y: 11, x0: 0, x1: 4 }),
  /** Salida este (x 55), filas 38–41 = filas 20–23 de las Dunas (offset 18 / −18). */
  east: Object.freeze({ x: 55, y0: 38, y1: 41 }),
  /** Caras de los rellanos (3 filas cada una) y escaleras anchas (5×3). */
  upperFace: 12,
  middleFace: 30,
  stairsUp: Object.freeze({ x: 26, y: 12 }),
  stairsDown: Object.freeze({ x: 30, y: 30 }),
  /** Macizo del este (la mina está en su cara sur) y paredes del cañón. */
  eastCliff: Object.freeze({ x0: 46, y0: 0, x1: 55, y1: 24 }),
  westCliff: Object.freeze({ x0: 0, y0: 26, x1: 3, y1: 47 }),
  /** Edificios: stamp, esquina y casilla de la puerta (warp exterior → interior). */
  buildings: Object.freeze({
    estacion: Object.freeze({ stamp: 'estacion_tren', x: 5, y: 1, door: Object.freeze({ x: 8, y: 9 }) }),
    galena: Object.freeze({ stamp: 'cabana_roja', x: 16, y: 2, door: Object.freeze({ x: 19, y: 7 }) }),
    escuela: Object.freeze({ stamp: 'mansion_ladrillo', x: 34, y: -2, door: Object.freeze({ x: 39, y: 8 }) }),
    casa_norte: Object.freeze({ stamp: 'casa_cupula', x: 42, y: 5, door: Object.freeze({ x: 44, y: 9 }) }),
    centro: Object.freeze({ stamp: 'centro_pokemon', x: 5, y: 13, door: Object.freeze({ x: 8, y: 21 }) }),
    tienda: Object.freeze({ stamp: 'casa_turquesa_grande', x: 35, y: 15, door: Object.freeze({ x: 38, y: 20 }) }),
    consorcio: Object.freeze({ stamp: 'estacion_cupula', x: 6, y: 34, door: Object.freeze({ x: 9, y: 40 }) }),
    casa_sur: Object.freeze({ stamp: 'casa_cupula', x: 17, y: 35, door: Object.freeze({ x: 19, y: 39 }) }),
  }),
  /** Boca de la Mina Galena (stamp entrada_mina 3×4 en la cara del macizo del este). */
  mine: Object.freeze({ x: 49, y: 21, door: Object.freeze({ x: 50, y: 23 }), front: Object.freeze({ x: 50, y: 25, dir: 2 }) }),
  /** Plaza y Losa del Pulso (sprite de 2×1 casillas; se toca desde abajo). */
  plaza: Object.freeze({ x0: 17, y0: 17, x1: 33, y1: 28 }),
  losa: Object.freeze({ x: 25, y: 21, front: Object.freeze({ x: 25, y: 22, dir: 8 }) }),
  /** Mercado de minerales (caravana 6×5; abre tras el P4) y su mercader. */
  market: Object.freeze({ x: 21, y: 33, vendor: Object.freeze({ x: 24, y: 38, dir: 2 }) }),
  /** Llegada del tren (delante de la estación) y punto de Vuelo (delante del Centro). */
  trainArrival: Object.freeze({ x: 8, y: 10, dir: 2 }),
  flyPoint: Object.freeze({ x: 8, y: 22, dir: 2 }),
  /** Escena de la discusión ante la mina (Fermín, Sol y la representante del Consorcio, a la vista). */
  argument: Object.freeze({
    fermin: Object.freeze({ x: 50, y: 26, dir: 4 }),
    sol: Object.freeze({ x: 48, y: 27, dir: 6 }),
    rep: Object.freeze({ x: 46, y: 25, dir: 6 }),
  }),
  /** Escena de la cooperativa (tras el P4) en la plaza. */
  coop: Object.freeze({
    player: Object.freeze({ x: 25, y: 25, dir: 8 }),
    fermin: Object.freeze({ x: 24, y: 23, dir: 2 }),
    sol: Object.freeze({ x: 26, y: 23, dir: 2 }),
    rep: Object.freeze({ x: 28, y: 25, dir: 4 }),
    miners: Object.freeze([[21, 24, 6], [22, 26, 6], [29, 23, 4]]),
  }),
  /** Torneo del Pulso (T05) y defensa nocturna de la Losa. */
  tournament: Object.freeze({
    herminia: Object.freeze({ x: 22, y: 21, dir: 6 }),
    rival: Object.freeze({ x: 25, y: 20, dir: 2 }),
    player: Object.freeze({ x: 25, y: 22, dir: 8 }),
    waiting: Object.freeze([[21, 18, 2], [23, 17, 2], [28, 17, 2], [29, 19, 4]]),
    thieves: Object.freeze([[24, 20, 2], [26, 20, 2]]),
    solNight: Object.freeze({ x: 28, y: 22, dir: 4 }),
  }),
});

/** Interiores de Estrato: llegada (sobre el felpudo, mirando arriba). */
export const ESTRATO_INTERIORS = Object.freeze({
  estrato_estacion: Object.freeze({ x: 13, y: 15 }),
  estrato_casa_galena: Object.freeze({ x: 6, y: 9 }),
  estrato_escuela: Object.freeze({ x: 8, y: 12 }),
  estrato_casa_norte: Object.freeze({ x: 5, y: 9 }),
  estrato_consorcio: Object.freeze({ x: 9, y: 12 }),
  estrato_casa_sur: Object.freeze({ x: 5, y: 9 }),
});

/**
 * Mina Galena (tileset 2, 44×35): seis salas talladas en la roca (pincel `sala`) unidas por pasos. Salas en
 * rectángulos de SUELO (x0..x1, y0..y1).
 */
export const MINA = Object.freeze({
  width: 44,
  height: 35,
  rooms: Object.freeze({
    vestibulo: Object.freeze({ x0: 12, y0: 27, x1: 31, y1: 32 }),
    galeria: Object.freeze({ x0: 16, y0: 16, x1: 27, y1: 22 }),
    veta: Object.freeze({ x0: 3, y0: 16, x1: 11, y1: 22 }),
    lateral: Object.freeze({ x0: 32, y0: 16, x1: 40, y1: 22 }),
    pozo: Object.freeze({ x0: 32, y0: 4, x1: 40, y1: 10 }),
    montacargas: Object.freeze({ x0: 18, y0: 4, x1: 25, y1: 10 }),
  }),
  /** Pasos verticales (3 de ancho) y túneles horizontales pegados a la pared norte. */
  passages: Object.freeze([
    Object.freeze({ x: 20, rows: [23, 26] }), // vestíbulo ↔ galería
    Object.freeze({ x: 20, rows: [11, 15] }), // galería ↔ montacargas
    Object.freeze({ x: 35, rows: [11, 15] }), // pozo lateral ↔ fondo del pozo
  ]),
  tunnels: Object.freeze([
    Object.freeze({ x0: 12, x1: 15, y: 16 }), // galería ↔ veta de cristal
    Object.freeze({ x0: 28, x1: 31, y: 16 }), // galería ↔ pozo lateral (lo guardan los técnicos)
  ]),
  /** Salida de luz a Estrato (claridad en la pared sur del vestíbulo). */
  exit: Object.freeze({ stamp: Object.freeze({ x: 20, y: 32 }), warp: Object.freeze({ x: 21, y: 33 }), arrive: Object.freeze({ x: 21, y: 32, dir: 8 }) }),
  /** Técnicos del pozo lateral (en el túnel) y Fermín, que discute con ellos. */
  techs: Object.freeze([Object.freeze({ x: 29, y: 16, dir: 4 }), Object.freeze({ x: 31, y: 16, dir: 4 })]),
  ferminTunnel: Object.freeze({ x: 26, y: 17, dir: 6 }),
  /** Garrido y la perforadora del fondo del pozo; franja que dispara la escena. */
  drill: Object.freeze({ x: 36, y: 6 }),
  garrido: Object.freeze({ x: 36, y: 8, dir: 2 }),
  garridoStrip: Object.freeze([[35, 10], [36, 10], [37, 10]]),
  garridoRetry: Object.freeze({ x: 36, y: 12, dir: 8 }),
  ferminShaft: Object.freeze({ x: 35, y: 11, dir: 6 }),
  /** Montacargas a la galería honda (cerrado por cascotes hasta el P4). */
  lift: Object.freeze({ x: 21, y: 5, front: Object.freeze({ x: 21, y: 6, dir: 8 }) }),
  liftArrival: Object.freeze({ x: 21, y: 6, dir: 2 }),
  cell: Object.freeze({ x: 5, y: 18 }), // C036, al pie de la veta de cristal
});

/** Galería honda de la Mina Galena (tras el P4; tileset 2, sala de arcilla). */
export const HONDA = Object.freeze({
  width: 30,
  height: 22,
  room: Object.freeze({ x0: 4, y0: 5, x1: 25, y1: 19 }),
  ladder: Object.freeze({ x: 14, y: 5 }), // escalera de mano de vuelta al montacargas
  arrive: Object.freeze({ x: 14, y: 6, dir: 2 }),
});

/**
 * Dunas de Ceniza (60×50, tileset 6): desierto gris con el Cerro Plomo al este. La ceniza honda (Terreno complicado)
 * corta el paso entre la mitad oeste y la del Cerro por tres vados; C037 y C038 están en campos de ceniza honda.
 */
export const DUNAS = Object.freeze({
  width: 60,
  height: 50,
  west: Object.freeze({ x: 0, y0: 20, y1: 23 }),
  /** Cresta rocosa (macizos) de norte a sur con tres vados de ceniza honda. */
  ridge: Object.freeze([
    Object.freeze([18, -3, 6, 14]), Object.freeze([18, 15, 6, 12]), Object.freeze([18, 31, 6, 9]), Object.freeze([18, 44, 6, 9]),
  ]),
  fords: Object.freeze([
    Object.freeze({ x0: 18, y0: 11, x1: 23, y1: 14 }),
    Object.freeze({ x0: 18, y0: 27, x1: 23, y1: 30 }),
    Object.freeze({ x0: 18, y0: 40, x1: 23, y1: 43 }),
  ]),
  /** Campos de ceniza honda con célula (C037 al norte, C038 al sur). */
  ashFields: Object.freeze([
    Object.freeze({ x0: 28, y0: 32, x1: 34, y1: 37, cell: Object.freeze({ x: 31, y: 34 }) }),
    Object.freeze({ x0: 52, y0: 35, x1: 57, y1: 41, cell: Object.freeze({ x: 55, y: 38 }) }),
  ]),
  /** Cerro Plomo (macizo) y su boca (entrada_mina en la cara sur). */
  cerro: Object.freeze({ x0: 36, y0: 3, x1: 56, y1: 24, door: Object.freeze({ x: 46, y: 23 }), front: Object.freeze({ x: 46, y: 25, dir: 8 }) }),
  /** Cueva de las Dunas (boquete en el suelo) al noroeste. */
  cave: Object.freeze({ x: 6, y: 6, door: Object.freeze({ x: 7, y: 7 }), front: Object.freeze({ x: 7, y: 9, dir: 8 }) }),
  /** Ruinas (zócalos gastados) junto a las que se ve a Sigilyph. */
  ruins: Object.freeze({ x0: 40, y0: 40, x1: 48, y1: 46 }),
  /** Zona de encuentros de las ruinas (matorrales del sureste, al pie del Cerro): la tabla con Sigilyph. */
  ruinsZone: Object.freeze({ x0: 36, y0: 29, x1: 52, y1: 47 }),
  start: Object.freeze({ x: 1, y: 21, dir: 6 }),
});

/** Cueva de las Dunas (tileset 2, arcilla). */
export const DUNAS_CUEVA = Object.freeze({
  width: 32,
  height: 20,
  room: Object.freeze({ x0: 3, y0: 5, x1: 28, y1: 16 }),
  exit: Object.freeze({ x: 6, y: 5 }), // escalera de mano de subida (arriba a la izquierda)
  arrive: Object.freeze({ x: 6, y: 6, dir: 2 }),
});

/** Cerro Plomo (tileset 2, gris): galerías de los Galena hasta la puerta del Pilar. */
export const CERRO = Object.freeze({
  width: 30,
  height: 30,
  rooms: Object.freeze({
    entrada: Object.freeze({ x0: 6, y0: 20, x1: 23, y1: 26 }),
    antesala: Object.freeze({ x0: 6, y0: 6, x1: 23, y1: 14 }),
  }),
  passage: Object.freeze({ x: 13, rows: [15, 19] }),
  exit: Object.freeze({ stamp: Object.freeze({ x: 13, y: 26 }), warp: Object.freeze({ x: 14, y: 27 }), arrive: Object.freeze({ x: 14, y: 26, dir: 8 }) }),
  /** Verja de la familia Galena (3 casillas, cruza el paso) y Fermín junto a la boca del paso. */
  gate: Object.freeze([[13, 17], [14, 17], [15, 17]]),
  fermin: Object.freeze({ x: 16, y: 20, dir: 4 }),
  gateFront: Object.freeze([[13, 18], [14, 18], [15, 18]]),
  /** Puerta del Pilar: boca oscura en la pared norte de la antesala (stamp boca_norte_gris 3×4). */
  doorStamp: Object.freeze({ x: 13, y: 2 }),
  door: Object.freeze({ x: 14, y: 5 }),
  arrive: Object.freeze({ x: 14, y: 6, dir: 2 }),
});

/** Pisos de entrenadores y Guardián de la columna de piedra del P4. */
export const P4_VERTICAL = Object.freeze({
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
