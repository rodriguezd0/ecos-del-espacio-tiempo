// Bloque 20 — Pilar del Origen (P10): FUENTE ÚNICA de coordenadas de todos los mapas del bloque (docs/CAMPANA.md B20).
// La usan las definiciones de mapa, los eventos (content/events/b20_*.js), las pruebas (tests/b20_*.test.mjs) y el
// recorrido E2E (tools/e2e_b20*.mjs). Módulo PURO. Coordenadas en casillas (x → derecha, y → abajo).
//
// Senda del Origen: nueve tramos de 24×18 (CAMPANA), cada uno con el mismo marco de cueva (suelo interior x 3–20,
// y 4–16; paredes de 3 a los lados, 4 arriba y 1 abajo), llegada abajo en (12,16) y salida por la boca norte (12,2).
// Cada tramo se dibuja con una rejilla de 18×13 (interior) con esta leyenda:
//   ' ' abismo (negro del fondo de la Sima, bloquea)   '.' enlosado   ',' roca natural   '#' roca alzada (bloquea)
//   'g' grava (Correr)   '~' agua honda (Nadar)   'w' estanque quieto (bloquea)   'm' barro (Terreno)
//   'i' hielo   'o' Suelo Olvidado (sin tiles; se pisa)   'p' plataforma que sube (tramo 4)
//   'S' llegada   'X' salida (bajo la boca norte)
// El tramo 9 es una sala de ejes y usa la leyenda de world/axis/logic.js (AXIS_LEGEND).

export const TRAMO_W = 24;
export const TRAMO_H = 18;
/** Esquina del interior de un tramo (la columna/fila 0 de la rejilla). */
export const INNER = Object.freeze({ x: 3, y: 4, w: 18, h: 13 });
/** Casilla de mapa de la columna c y la fila r de la rejilla interior. */
export const cell = (c, r) => ({ x: c + INNER.x, y: r + INNER.y });
export const ARRIVE = Object.freeze({ x: 12, y: 16, dir: 8 }); // llegada desde el tramo anterior
export const EXIT_TOP = Object.freeze({ x: 12, y: 2 }); // warp de la boca norte
export const EXIT_STAND = Object.freeze({ x: 12, y: 4, dir: 2 }); // llegada al volver desde el tramo siguiente
export const BACK = Object.freeze({ x: 12, y: 17 }); // warp de la salida sur (claridad)

export const tramoId = (n) => `senda_origen_${n}`;
export const TRAMOS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9]);

/** Pilar del que es eco cada tramo y capacidad que pide (CAMPANA B20, «Senda del Origen»). */
export const ECHO = Object.freeze({
  1: { pillar: 'P1', name: 'Umbral', ability: 'run', label: 'dinteles giratorios y cuesta de grava' },
  2: { pillar: 'P2', name: 'Corriente', ability: 'swim', label: 'estanques y compuerta' },
  3: { pillar: 'P3', name: 'Impulso', ability: 'ram', label: 'ráfagas con veleta' },
  4: { pillar: 'P4', name: 'Masa', ability: 'terrain', label: 'placa de contrapeso' },
  5: { pillar: 'P5', name: 'Memoria', ability: 'climb', label: 'losa de recuerdo que se sigue' },
  6: { pillar: 'P6', name: 'Invertido', ability: null, label: 'arista de giro con Ancla' },
  7: { pillar: 'P7', name: 'Ecos', ability: 'dive', label: 'caracola del eco en una cisterna' },
  8: { pillar: 'P8', name: 'Alma', ability: null, label: 'tres voces a la vez' },
  9: { pillar: 'P9', name: 'Convergencia', ability: 'rebuild', label: 'cascada detenida y pliegue' },
});

const row = (s) => { if (s.length !== INNER.w) throw new Error(`b20 layout: fila de ${s.length} (se esperaban ${INNER.w}): «${s}»`); return s; };
const grid = (rows) => { if (rows.length !== INNER.h) throw new Error(`b20 layout: ${rows.length} filas (se esperaban ${INNER.h})`); return Object.freeze(rows.map(row)); };

// ───────────────────────────── Tramo 1 · Umbral: dinteles giratorios y grava ─────────────────────────────

export const T1 = Object.freeze({
  grid: grid([
    '        .X.       ',
    '  www.. ... ....  ',
    '  www...........  ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '     ggggggggg    ',
    '     ggggggggg    ',
    '     .........    ',
    '     .........    ',
    '     .........    ',
    '     .........    ',
    '     ....S....    ',
  ]),
  /** Dintel de salida (pilar_dintel 5×4) y su losa: se pasa por debajo (x 11–13) tras encender las tres piedras. */
  dintel: Object.freeze({ x: 10, y: 4 }),
  slab: Object.freeze({ x: 12, y: 7, blockers: Object.freeze([[11, 7], [13, 7]]) }),
  /**
   * Piedras giratorias (arte y reglas de B02, content/events/b02_puzzle.js): empiezan mirando a la pared (norte).
   * «El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien entra.»
   */
  stones: Object.freeze([
    Object.freeze({ id: 'a', n: 1, x: 16, y: 6, answer: 6 }), // al alba: el cristal que brilla al este
    Object.freeze({ id: 'b', n: 2, x: 8, y: 6, answer: 4 }), // al agua quieta del oeste
    Object.freeze({ id: 'c', n: 3, x: 12, y: 9, answer: 2 }), // hacia quien entra: la grava y la llegada
  ]),
  crystal: Object.freeze({ x: 18, y: 5 }), // gota de cristal luminosa (el «alba»)
  pool: Object.freeze({ x: 5, y: 5, w: 3, h: 2 }),
  stele: Object.freeze({ x: 14, y: 12 }), // pilar_placa_unown (2×2): la inscripción, en la llegada
  item: Object.freeze({ x: 18, y: 9, item: 'ULTRABALL', count: 3 }),
});

// ───────────────────────────── Tramo 2 · Corriente: estanques y compuerta ─────────────────────────────

export const T2 = Object.freeze({
  grid: grid([
    '        .X.       ',
    '  #######.######  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~...~  ',
    '  ~~~~~~~~~~...~  ',
    '  ~~~~~~~~~~...~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '     .........    ',
    '     .........    ',
    '     .........    ',
    '     ....S....    ',
  ]),
  gate: Object.freeze({ x: 12, y: 5 }), // compuerta del dique (cerrada: sólida)
  lever: Object.freeze({ x: 16, y: 7 }), // mando de la compuerta, en el islote (se usa desde (16,8) mirando arriba)
  leverStand: Object.freeze({ x: 16, y: 8, dir: 8 }),
  pond: Object.freeze({ x0: 5, y0: 6, x1: 18, y1: 12 }), // vaso del estanque (agua honda hasta abrir la compuerta)
  islet: Object.freeze({ x0: 15, y0: 7, x1: 17, y1: 9 }),
  stele: Object.freeze({ x: 8, y: 13 }),
  item: Object.freeze({ x: 5, y: 12, item: 'MAXREVIVE', hidden: true }), // en el fondo: aparece al vaciarse
});

// ───────────────────────────── Tramo 3 · Impulso: ráfagas con veleta y Embestida ─────────────────────────────

/**
 * Sala de viento (leyenda de content/events/b06_wind_logic.js; aquí '#' es abismo o roca). La cinta de ráfagas fuertes
 * (fila 3) no se cruza; el canal del este (sector a) sopla hacia el sur: con la veleta girada dos veces sopla al norte y
 * sube al jugador. La veleta está en un nicho tapado por una roca agrietada (R: Embestida).
 */
export const T3 = Object.freeze({
  rows: grid([
    '#########X########',
    '####...........###',
    '####............##',
    '####2222222222#2##',
    '####..........#2##',
    '####..........#2##',
    '####..........#2##',
    '####..........#2##',
    '##..............##',
    '####............##',
    '##VR............##',
    '####............##',
    '####.....S......##',
  ]),
  sectors: grid([
    '..................',
    '..................',
    '..................',
    '...............a..',
    '...............a..',
    '...............a..',
    '...............a..',
    '...............a..',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
  ]),
  vane: Object.freeze([2, 10]), // en la rejilla
  rock: Object.freeze([3, 10]),
  stele: Object.freeze({ x: 8, y: 9 }), // pilar_placa_unown 2×2 (casillas de mapa)
  item: Object.freeze({ x: 5, y: 12, item: 'MAXELIXIR' }), // rincón del oeste (fila 8 de la rejilla)
});

// ───────────────────────────── Tramo 4 · Masa: barro y placa de contrapeso ─────────────────────────────

export const T4 = Object.freeze({
  grid: grid([
    '        .X.       ',
    '        ppp       ',
    '        ppp       ',
    '        ppp       ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '  mmmmmmmmmmmmmm  ',
    '  mmmmmmmmmmmmmm  ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '  .......S......  ',
  ]),
  plate: Object.freeze({ x: 6, y: 9 }),
  spring: Object.freeze({ x: 5, y: 13, stand: Object.freeze({ x: 6, y: 16, dir: 8 }) }), // manantial 3×3 (esquina)
  stele: Object.freeze({ x: 15, y: 8 }),
  weights: Object.freeze([[3, 6], [20, 7], [4, 10], [19, 14]]), // contrapesos colgando sobre el abismo (decorado)
  item: Object.freeze({ x: 18, y: 10, item: 'PPUP' }),
});

// ───────────────────────────── Tramo 5 · Memoria: Suelo Olvidado y Trepar ─────────────────────────────

export const T5 = Object.freeze({
  grid: grid([
    '       ..X..      ',
    '       .....      ',
    '  ##############  ',
    '  ##############  ',
    '  oooooooooooooo  ',
    '  oooooooooooooo  ',
    '  oooooooooooooo  ',
    '  oooooooooooooo  ',
    '  oooooooooooooo  ',
    '     .........    ',
    '     .........    ',
    '     .........    ',
    '     ....S....    ',
  ]),
  /** Único camino seguro por el Suelo Olvidado (casillas de mapa), de la llegada al pie de la pared. */
  path: Object.freeze([
    [10, 12], [10, 11], [9, 11], [8, 11], [8, 10], [8, 9], [9, 9], [10, 9], [11, 9], [11, 10], [12, 10], [13, 10],
    [14, 10], [14, 9], [14, 8], [13, 8], [12, 8],
  ].map((c) => Object.freeze(c))),
  losa: Object.freeze({ x: 14, y: 14 }), // pilar_losa_eco 2×2 (la losa de recuerdo)
  ecoHome: Object.freeze({ x: 10, y: 13, dir: 8 }),
  fallBack: Object.freeze({ x: 11, y: 13, dir: 8 }), // al caer, el borde de la llegada
  climb: Object.freeze({ x: 12, y: 7, to: Object.freeze([12, 5]) }), // pared con vetas: de (12,8) a (12,5)
  climbDown: Object.freeze({ x: 12, y: 6, to: Object.freeze([12, 8]) }),
  item: Object.freeze({ x: 14, y: 4, item: 'RARECANDY' }),
});

// ───────────────────────────── Tramo 6 · Invertido: arista de giro con Ancla ─────────────────────────────

/**
 * Rejilla FÍSICA de dos orientaciones (leyenda de world/impossible/logic.js#FACET_CHARS). Base 24×18 con margen de 2;
 * el gemelo (girado 90° horario) mide 18×24. Solución: arista del oeste (al gemelo), la pared violeta es suelo, arista del
 * este (a la base), repisa del norte → salida.
 */
export const T6 = Object.freeze({
  margin: 2,
  rows: Object.freeze([
    '        .X.         ',
    '       aaaaa        ',
    '       aaAaa        ',
    '       aaaaa        ',
    '       aaaaaaaaa    ',
    '    BBBBBBBBBBB*    ',
    '    BB   ##         ',
    '    B               ',
    '    B    ##         ',
    '    B               ',
    '   .*.....          ',
    '   ......@..        ',
    '     ....S..        ',
    '        ...         ',
  ]),
  back: Object.freeze([9, 13]), // grieta de vuelta al tramo 5 (rejilla física)
  item: Object.freeze({ x: 5, y: 6, orient: 1, item: 'FULLRESTORE' }), // en un rincón de la pared violeta: solo existe girada
  /** Casillas del MAPA BASE (rejilla física + margen): llegada desde el tramo 5 y llegada al volver del tramo 7. */
  arrive: Object.freeze({ x: 11, y: 14, dir: 8 }),
  exitStand: Object.freeze({ x: 11, y: 3, dir: 2 }),
});

// ───────────────────────────── Tramo 7 · Ecos: caracola del eco en una cisterna (Buceo) ─────────────────────────────

export const T7 = Object.freeze({
  surface: grid([
    '        .X.       ',
    '        ~~~       ',
    '  ##############  ',
    '  ##############  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ~~~~~~~~~~~~~~  ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '  .......S......  ',
  ]),
  /** Fondo de la cisterna (presente sumergido) y su eco seco: mismas coordenadas. */
  bottom: grid([
    '                  ',
    '        ...       ',
    '         .        ',
    '         .        ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '  ..............  ',
    '                  ',
    '                  ',
    '                  ',
    '                  ',
  ]),
  dive: Object.freeze({ x: 12, y: 10 }), // remolino del centro de la cisterna
  surfaceSpot: Object.freeze({ x: 12, y: 5 }), // bajo el pozo norte: se emerge aquí
  wellDive: Object.freeze({ x: 11, y: 5 }), // remolino del pozo norte (vuelta desde el tramo 8); no delante de la repisa (12,4)
  grate: Object.freeze({ x: 12, y: 7 }), // reja del túnel (presente: caída; eco: en pie)
  masonry: Object.freeze({ x: 12, y: 6 }), // en el eco el túnel aún no está abierto
  crank: Object.freeze({ x: 13, y: 8 }), // manivela de la reja (eco), junto a la boca del túnel
  crankStand: Object.freeze({ x: 13, y: 9, dir: 8 }),
  caracola: Object.freeze({ x: 6, y: 10, stand: Object.freeze({ x: 7, y: 10, dir: 4 }) }),
  vents: Object.freeze([[15, 9], [12, 5]]),
  spring: Object.freeze({ x: 5, y: 13, stand: Object.freeze({ x: 6, y: 16, dir: 8 }) }),
  cistern: Object.freeze({ x0: 5, y0: 8, x1: 18, y1: 12 }),
  northPool: Object.freeze({ x0: 11, y0: 5, x1: 13, y1: 5 }),
  item: Object.freeze({ x: 17, y: 12, item: 'DIVEBALL', count: 3 }), // en el fondo
});

// ───────────────────────────── Tramo 8 · Alma: tres voces a la vez ─────────────────────────────

/**
 * Pasillo en serpentina (controles en espejo en todo el mapa; el viento devuelve a la última losa clara a quien se
 * para fuera de ellas). Leyenda: '#' canal de resonancia · '.' suelo · 'R' losa clara (se puede parar) · 'S' llegada.
 * Fila 0 = pasillo de las puertas (en calma). Las tres puertas están en la pared de arriba.
 */
export const T8 = Object.freeze({
  rows: grid([
    '  RRRRRRRRRRRRRR  ',
    '  .#############  ',
    '  .............R  ',
    '  #############.  ',
    '  R.............  ',
    '  .#############  ',
    '  .............R  ',
    '  #############.  ',
    '  R.............  ',
    '  .#############  ',
    '  ...........R..  ',
    '  ###########.##  ',
    '     ....S....    ',
  ]),
  doors: Object.freeze([Object.freeze({ n: 1, x: 7, y: 3 }), Object.freeze({ n: 2, x: 12, y: 3 }), Object.freeze({ n: 3, x: 17, y: 3 })]),
  voices: Object.freeze([
    Object.freeze({ id: 'saber', x: 7, y: 14, row: 0 }),
    Object.freeze({ id: 'sentir', x: 12, y: 13, row: 1 }),
    Object.freeze({ id: 'querer', x: 17, y: 14, row: 2 }),
  ]),
});

// ───────────────────────────── Tramo 9 · Convergencia: cascada detenida, pliegue y Reconstrucción ─────────────────────────────

/**
 * Eco de la Cámara del Cruce (B18): una sala de ejes de world/axis (logic.js#parseAxisRoom) con su leyenda propia
 * (AXIS_LEGEND: ' ' vacío · '#' bloquea · 'C' cristal de cambio · 'D' escombro · 'v' corriente · '1' pliegue · 'E' entrada
 * · 'X' salida · 'o' objeto), colocada en el interior del tramo (columna 0 = x 3, fila 0 = y 4). La cascada baja por el
 * canal de la columna 3 desde la pared norte hasta la plataforma de llegada: con la Cadena tensada hacia el tiempo se
 * detiene y se sube por ella a la repisa del oeste; hacia el espacio se abre el pliegue que lleva a la repisa alta del
 * este, y el tramo roto de esa repisa (`gap`, suelo en esta rejilla) se reconstruye para llegar a la pared escrita y a
 * la salida. La rejilla es la de DESPUÉS de reconstruir; la de antes sale de b20_logic.js#t9Room.
 */
export const T9 = Object.freeze({
  room: grid([
    '.1.v  ##.X.##  .# ',
    '...v  C.......... ',
    'C..v  .......  .1 ',
    '...v              ',
    '...v              ',
    '   v              ',
    '   v              ',
    '   v              ',
    '   v              ',
    '   v..C.......    ',
    '   ...........  ..',
    '   ...........DD.o',
    '   #.....E...#  ..',
  ]),
  /** Tramo roto de la repisa alta (Reconstrucción): el zócalo se usa desde (18,5) mirando al oeste. */
  gap: Object.freeze({ socket: Object.freeze({ x: 17, y: 5 }), cells: Object.freeze([[17, 5], [16, 5]]), stand: Object.freeze({ x: 18, y: 5, dir: 4 }) }),
  cascade: Object.freeze({ x: 6, y0: 1, y1: 3 }), // el agua que cae de la pared norte sobre el canal
  plaques: Object.freeze({ custodios: Object.freeze({ x: 9, y: 3 }), verse: Object.freeze({ x: 14, y: 3 }) }),
  columns: Object.freeze([[19, 4, 'pilar_columna'], [6, 16, 'pilar_columna_quebrada'], [16, 16, 'pilar_columna_quebrada']]), // bases '#' de la rejilla
  wallScene: Object.freeze([[14, 5], [15, 5], [14, 6], [15, 6]]), // al cruzar el tramo reconstruido: la pared escrita
  item: Object.freeze({ item: 'PPMAX' }), // en la isla de los escombros ('o')
});

// ───────────────────────────── Puerta de las Quince ─────────────────────────────

export const PUERTA = Object.freeze({
  w: 32, h: 34,
  floor: Object.freeze({ x: 3, y: 4, w: 26, h: 29 }), // sala_gris: paredes alrededor
  arrive: Object.freeze({ x: 16, y: 31, dir: 8 }), // llegada desde la Sima del Eje (B19)
  back: Object.freeze({ x: 16, y: 33 }), // claridad de la salida sur (hacia sima_eje, B19)
  plaza: Object.freeze({ x0: 4, y0: 18, x1: 27, y1: 32 }),
  wall: Object.freeze({ y0: 14, y1: 17 }), // la Puerta: muro de roca alzada con los nichos en su cara sur
  doorway: Object.freeze({ x0: 15, x1: 17 }), // hueco de la losa
  slab: Object.freeze({ x: 16, y: 17 }), // losa (96×64) + bloqueos en (15,17) y (17,17)
  /** Nichos de las quince Tablillas (T01–T15) en la cara del muro (y 17) y los tres de Arceus sobre la puerta. */
  niches: Object.freeze([5, 6, 7, 8, 9, 10, 11, 12, 20, 21, 22, 23, 24, 25, 26].map((x, i) => Object.freeze({ n: i + 1, x, y: 17 }))),
  arceus: Object.freeze([15, 16, 17].map((x) => Object.freeze({ x, y: 15 }))),
  threshold: Object.freeze({ x0: 15, x1: 17, y: 13 }),
  /** Camino proyectado sobre el vacío: una casilla por Tablilla (T01 junto a la puerta … T15 junto a la repisa). */
  path: Object.freeze([
    [16, 12], [16, 11], [17, 11], [18, 11], [18, 10], [18, 9], [17, 9], [16, 9], [15, 9], [14, 9], [14, 8], [14, 7],
    [15, 7], [16, 7], [16, 6],
  ].map((c) => Object.freeze(c))),
  abyss: Object.freeze({ y0: 6, y1: 13 }),
  ledge: Object.freeze({ y0: 4, y1: 5 }),
  exit: Object.freeze({ x: 16, y: 2 }), // boca de la Senda (warp)
  exitStand: Object.freeze({ x: 16, y: 4, dir: 2 }),
  stele: Object.freeze({ x: 9, y: 25 }), // estela con el texto de la Crónica XIII
  items: Object.freeze([
    Object.freeze({ id: 'objeto_puerta_1', x: 25, y: 29, item: 'FULLRESTORE' }),
    Object.freeze({ id: 'objeto_puerta_2', x: 6, y: 30, item: 'MAXREVIVE', hidden: true }),
  ]),
});

// ───────────────────────────── Cielo Interior ─────────────────────────────

const rect = (x0, y0, x1, y1) => Object.freeze({ x0, y0, x1, y1 });

export const CIELO = Object.freeze({
  w: 31, h: 56,
  islands: Object.freeze([
    rect(12, 2, 18, 5), // puerta a la Terraza
    rect(14, 6, 16, 7),
    rect(7, 8, 23, 14), // terraza de Landorus
    rect(14, 15, 16, 16),
    rect(10, 17, 20, 20), // manantial 2
    rect(14, 21, 16, 22),
    rect(7, 23, 23, 29), // terraza de Thundurus
    rect(14, 30, 16, 31),
    rect(10, 32, 20, 35), // manantial 1
    rect(14, 36, 16, 37),
    rect(7, 38, 23, 44), // terraza de Tornadus
    rect(14, 45, 16, 47),
    rect(10, 48, 20, 52), // llegada
  ]),
  arrive: Object.freeze({ x: 15, y: 51, dir: 8 }),
  back: Object.freeze({ x: 15, y: 52 }), // grieta de vuelta a la Senda (tramo 9)
  gate: Object.freeze({ x: 15, y: 2 }), // hacia la Terraza del Último Sello
  gateStand: Object.freeze({ x: 15, y: 3, dir: 8 }),
  springs: Object.freeze([
    Object.freeze({ n: 1, x: 11, y: 32, stand: Object.freeze({ x: 12, y: 35, dir: 8 }) }),
    Object.freeze({ n: 2, x: 17, y: 17, stand: Object.freeze({ x: 18, y: 20, dir: 8 }) }),
  ]),
  /** El Trío: casilla donde espera, franja que dispara el combate y casilla de reintento. */
  trio: Object.freeze({
    tornadus: Object.freeze({ at: Object.freeze({ x: 15, y: 40 }), strip: Object.freeze([[14, 44], [15, 44], [16, 44]]), retry: Object.freeze({ x: 15, y: 46, dir: 8 }) }),
    thundurus: Object.freeze({ at: Object.freeze({ x: 15, y: 25 }), strip: Object.freeze([[14, 29], [15, 29], [16, 29]]), retry: Object.freeze({ x: 15, y: 31, dir: 8 }) }),
    landorus: Object.freeze({ at: Object.freeze({ x: 15, y: 10 }), strip: Object.freeze([[14, 14], [15, 14], [16, 14]]), retry: Object.freeze({ x: 15, y: 16, dir: 8 }) }),
  }),
  /** Dónde se colocan los tres para la pregunta (terraza de Landorus) y Zygarde Completo junto al jugador. */
  // Landorus se queda donde combatió (15,10); Zygarde, a la izquierda y un paso por detrás, sin tapar al jugador ni al Trío
  council: Object.freeze({ player: Object.freeze({ x: 15, y: 12, dir: 8 }), tornadus: [12, 9], thundurus: [18, 9], landorus: [15, 10], zygarde: [12, 13] }),
  items: Object.freeze([
    Object.freeze({ id: 'objeto_cielo_1', x: 21, y: 42, item: 'FULLRESTORE' }),
    Object.freeze({ id: 'objeto_cielo_2', x: 8, y: 24, item: 'MAXELIXIR' }),
  ]),
});

// ───────────────────────────── Terraza del Último Sello ─────────────────────────────

export const TERRAZA = Object.freeze({
  w: 26, h: 24,
  deck: rect(5, 6, 20, 18),
  bridge: rect(12, 19, 13, 22),
  porch: rect(9, 2, 16, 5),
  arrive: Object.freeze({ x: 12, y: 21, dir: 8 }),
  back: Object.freeze({ x: 12, y: 22 }),
  door: Object.freeze({ x: 12, y: 3 }), // hueco negro bajo el dintel: al núcleo
  dintel: Object.freeze({ x: 10, y: 2 }),
  gael: Object.freeze({ x: 12, y: 9, dir: 8 }),
  meet: Object.freeze([[11, 16], [12, 16], [13, 16], [14, 16]]), // franja que dispara el encuentro
  battleStand: Object.freeze({ x: 12, y: 12, dir: 8 }),
  stele: Object.freeze({ x: 16, y: 6 }), // estela del verso X (pilar_placa_unown 2×2)
  steleStand: Object.freeze({ x: 16, y: 8, dir: 8 }),
  gaelStele: Object.freeze({ x: 17, y: 8, dir: 8 }),
});

// ───────────────────────────── Núcleo del Origen ─────────────────────────────

export const NUCLEO = Object.freeze({
  w: 21, h: 28,
  hall: Object.freeze({ x: 4, y: 3 }), // sala_trono (13×22): suelo pisable en y 9–23
  arrive: Object.freeze({ x: 10, y: 22, dir: 8 }),
  back: Object.freeze({ x: 10, y: 23 }), // se sale pulsando abajo en la última fila de la alfombra
  core: Object.freeze({ x: 10, y: 12 }), // el emblema del suelo: el núcleo del Pilar
  coreStand: Object.freeze({ x: 10, y: 13, dir: 8 }),
  /** Emblema de la Liga de sala_trono (se tapa con alfombra lisa de la columna plainX y el hexágono del kit). */
  emblem: Object.freeze({ x0: 8, y0: 11, x1: 12, y1: 14, plainX: 7 }),
});

/** Warps entre mapas del bloque (llegadas) para eventos, pruebas y E2E. */
export const LINKS = Object.freeze({
  puertaToSenda: Object.freeze({ map: tramoId(1), ...ARRIVE }),
  sendaToPuerta: Object.freeze({ map: 'puerta_quince', ...PUERTA.exitStand }),
  sendaToCielo: Object.freeze({ map: 'cielo_interior', ...CIELO.arrive }),
  cieloToSenda: Object.freeze({ map: tramoId(9), ...EXIT_STAND }),
  cieloToTerraza: Object.freeze({ map: 'terraza_ultimo_sello', ...TERRAZA.arrive }),
  terrazaToCielo: Object.freeze({ map: 'cielo_interior', ...CIELO.gateStand, dir: 2 }),
  terrazaToNucleo: Object.freeze({ map: 'nucleo_origen', ...NUCLEO.arrive }),
  nucleoToTerraza: Object.freeze({ map: 'terraza_ultimo_sello', x: TERRAZA.door.x, y: TERRAZA.door.y + 2, dir: 2 }),
});
