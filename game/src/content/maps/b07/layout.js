// Coordenadas compartidas del Bloque 7 — Interludio 3: Ruta 6 y la Cantería Solano (docs/CAMPANA.md B07).
// FUENTE ÚNICA: los mapas (content/maps/b07/*.js), los guiones (content/events/b07_*.js), los tests y el recorrido
// E2E leen de aquí; así un cambio de trazado mantiene coherentes warps, escenas y pruebas. Módulo puro.

/**
 * Ruta 6 (30×70, tileset 5): cañón escalonado que baja de Villa Brontia (N) a Ciudad Estrato (S). Tres rellanos
 * anidados: el alto (y 0–14), el de la Cantería (y 18–56) y el bajo (y 60–69), separados por caras de roca con
 * escalera (terrazas que se salen del mapa: solo se ven sus caras, como estratos).
 */
export const RUTA6 = Object.freeze({
  width: 30,
  height: 70,
  /** Borde norte (y 0), x 13–17 = x 20–24 de Brontia (offset −7, maps/b05/links.js). */
  north: Object.freeze({ y: 0, x0: 13, x1: 17 }),
  /** Borde sur (y 69), x 13–17: camino de Ciudad Estrato (B08; ver ./pending_links.js). */
  south: Object.freeze({ y: 69, x0: 13, x1: 17 }),
  start: Object.freeze({ x: 15, y: 1, dir: 2 }),
  /** Rellano alto: cara sur en y 15–17 con escalera (3 de ancho) en x 20–22. */
  tier1: Object.freeze({ faceY: 15, stairs: Object.freeze({ x: 20, y: 15 }) }),
  /** Rellano medio: cara sur en y 57–59 con escalera en x 7–9. */
  tier2: Object.freeze({ faceY: 57, stairs: Object.freeze({ x: 7, y: 57 }) }),
  /** Cornisa del oeste (Absolita, Trepar al volver): macizo x ≤ 7, y 3–10; pared en (5,10) → arriba (5,6). */
  cornice: Object.freeze({ x0: 3, y0: 3, x1: 7, y1: 10, wall: Object.freeze({ x: 5, y: 10 }), foot: Object.freeze({ x: 5, y: 11 }), top: Object.freeze({ x: 5, y: 6 }), item: Object.freeze({ x: 4, y: 5 }) }),
  /** Repisa de la pared este (C056, Trepar al volver): macizo x 22–26, y 46–53; pared en (24,53) → arriba (24,49). */
  wallLedge: Object.freeze({ x0: 22, y0: 46, x1: 26, y1: 53, wall: Object.freeze({ x: 24, y: 53 }), foot: Object.freeze({ x: 24, y: 54 }), top: Object.freeze({ x: 24, y: 49 }), cell: Object.freeze({ x: 25, y: 48 }) }),
  /** Franja de llegada a la Cantería (la voladura): y 20, x 3–26. */
  arrivalY: 20,
  /** Derrumbe que corta el camino de Estrato (escombros como eventos): y 44–45, x 2–21. */
  rubble: Object.freeze({ x0: 2, x1: 21, y0: 44, y1: 45 }),
  /** Piedras sueltas por delante y por detrás de la franja del derrumbe (borde irregular). */
  rubbleEdge: Object.freeze([[4, 43], [5, 43], [9, 43], [3, 46], [4, 46], [8, 46], [9, 46], [18, 46], [19, 46]]),
  /**
   * Tras despejarlo, las piedras quedan apiladas a los lados del camino (casillas del derrumbe o de su borde, contra
   * la pared oeste y junto a la barrera del este; el paso central x 6–18 queda libre).
   */
  rubblePiles: Object.freeze([[3, 44], [4, 44], [3, 45], [4, 45], [5, 45], [3, 46], [20, 44], [21, 44], [20, 45], [21, 45], [19, 46]]),
  /** Casilla al norte del derrumbe (y la del sur) por la que se cruza una vez despejado. */
  rubbleNorth: Object.freeze({ x: 14, y: 43 }),
  rubbleSouth: Object.freeze({ x: 14, y: 46 }),
});

/**
 * La Cantería Solano dentro de la Ruta 6: dos bancales de roca al este (macizos escalonados) con la boca de las
 * galerías y el corte de los estratos en la cara del bajo; la herrería de los Solano al noroeste; el patio con el
 * camión del Consorcio.
 */
export const CANTERIA = Object.freeze({
  /** Bancal bajo (macizo: cara sur en y 38–40) y bancal alto (cara en y 29–31). */
  bench1: Object.freeze({ x0: 15, y0: 22, x1: 27, y1: 40 }),
  bench2: Object.freeze({ x0: 22, y0: 22, x1: 27, y1: 31 }),
  /** Escaleras (3 de ancho, sobre la cara) del bancal bajo y del alto. */
  bench1Stairs: Object.freeze({ x: 16, y: 38 }),
  bench2Stairs: Object.freeze({ x: 23, y: 29 }),
  /** Barro al pie de la escalera del bancal alto (Terreno complicado): hay que cruzarlo para subir (C035). */
  mud: Object.freeze({ x0: 20, y0: 32, x1: 27, y1: 34 }),
  cell: Object.freeze({ x: 25, y: 24 }),
  /**
   * Boca de la galería (stamp entrada_mina 3×4 sobre la cara del bancal bajo). La fila de abajo del marco no se pisa:
   * la puerta es un evento en (24,40) que se activa al empujar hacia arriba desde (24,41).
   */
  mine: Object.freeze({ x: 23, y: 37, door: Object.freeze({ x: 24, y: 40 }) }),
  /** Delante de la boca (llegada al salir de las galerías). */
  mineFront: Object.freeze({ x: 24, y: 41, dir: 2 }),
  /** Corte de los estratos (sprite de 3×3 casillas sobre la cara): base en (20,40). */
  corte: Object.freeze({ x: 20, y: 40 }),
  corteFront: Object.freeze({ x: 20, y: 41, dir: 8 }),
  /** Herrería de los Solano (stamp cabana_roja 6×8 en (3,23)): puerta en (6,28). */
  forge: Object.freeze({ stamp: 'cabana_roja', x: 3, y: 23, door: Object.freeze({ x: 6, y: 28 }) }),
  forgeFront: Object.freeze({ x: 6, y: 29, dir: 2 }),
  /** Camión del Consorcio (stamp caravana 6×5) y sus cargas de voladura en los bancales. */
  truck: Object.freeze({ x: 3, y: 35 }),
  charges: Object.freeze([[17, 33], [21, 27], [26, 36]]),
  /** Tablón de la Cantería (la denuncia pública al Consorcio se cuelga aquí y en el camión). */
  board: Object.freeze({ x: 11, y: 30 }),
  /** Posiciones de las escenas. */
  techs: Object.freeze([Object.freeze({ x: 23, y: 41, dir: 2 }), Object.freeze({ x: 25, y: 41, dir: 2 })]),
  techStrip: Object.freeze({ x0: 21, x1: 27, y: 42 }),
  techSpot: Object.freeze({ x: 24, y: 42, dir: 8 }),
  garrido: Object.freeze({ x: 8, y: 40, dir: 6 }),
  bea: Object.freeze({ x: 9, y: 30, dir: 2 }),
  alerceSpot: Object.freeze({ x: 19, y: 41, dir: 6 }),
  canteros: Object.freeze([Object.freeze({ x: 13, y: 39, dir: 2 }), Object.freeze({ x: 11, y: 42, dir: 4 }), Object.freeze({ x: 13, y: 41, dir: 4 })]),
  /**
   * Los canteros que señalan a Garrido: llegan por el patio (desde x = crowdFrom, fuera de cámara) y se plantan al
   * oeste de él, de modo que Garrido queda entre los canteros y el jugador.
   */
  crowd: Object.freeze([[18, 42], [17, 43], [18, 41]]),
  crowdFrom: 10,
  /** Por dónde se van Garrido y sus técnicos (el camino del patio hacia el norte, ya fuera de cámara). */
  leave: Object.freeze({ x: 14, y: 33 }),
  /** De dónde llega Alerce (el patio, fuera de cámara) cuando se marcha el Consorcio. */
  alerceFrom: Object.freeze({ x: 8, y: 41 }),
  /** La fiesta tras el rescate, alrededor de la boca de la galería: canteros y cuadrilla de Timburr. */
  party: Object.freeze({ canteros: Object.freeze([[21, 43], [23, 43], [26, 43]]), timburr: Object.freeze([[20, 42], [25, 43], [27, 42]]) }),
  /** Después: Quino y la cuadrilla en el patio (los Timburr deambulan por el suelo libre). */
  quinoAfter: Object.freeze({ x: 12, y: 33, dir: 2 }),
  timburrAfter: Object.freeze([[6, 41], [14, 43], [20, 42]]),
});

/**
 * Galerías de la Cantería Solano (tileset 2): tres salas en fila, del estrato del ocre al último estrato.
 * `ox, oy` = casilla del mapa de la esquina (0,0) de la sala ASCII (content/events/b07_strata_rooms.js).
 */
export const GALERIAS = Object.freeze({
  width: 60,
  height: 16,
  rooms: Object.freeze({
    1: Object.freeze({ ox: 3, oy: 6 }),
    2: Object.freeze({ ox: 20, oy: 4 }),
    3: Object.freeze({ ox: 41, oy: 4 }),
  }),
});

/** Herrería de los Solano (tileset 4, 15×11): fragua, yunque, catre y la mesa de Bea. */
export const HERRERIA = Object.freeze({
  width: 15,
  height: 11,
  /** Llegada sobre el felpudo (la salida son las casillas x 6–8 de la fila 9, pulsando abajo). */
  entry: Object.freeze({ x: 7, y: 9, dir: 8 }),
  /** Fragua (sprite de 3×2 casillas centrado en su base) contra la pared norte, y el yunque delante. */
  forge: Object.freeze({ x: 3, y: 4 }),
  anvil: Object.freeze({ x: 5, y: 6 }),
  bea: Object.freeze({ x: 6, y: 6, dir: 4 }),
  alerce: Object.freeze({ x: 7, y: 7, dir: 4 }),
  /** El jugador mira el yunque desde dos casillas (así su cabeza no tapa el anillo). */
  playerRing: Object.freeze({ x: 5, y: 8, dir: 8 }),
  /** Catre (stamp cama_individual en (11,6)) y la casilla desde la que se descansa. */
  bed: Object.freeze({ x: 11, y: 6 }),
  cot: Object.freeze({ x: 11, y: 7 }),
});
