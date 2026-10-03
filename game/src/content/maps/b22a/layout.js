// Coordenadas del Bloque 22a — Postgame I: el Eje y el Alma (docs/CAMPANA.md B22, tabla de legendarios y «Otros
// contenidos»; X12, X16). FUENTE ÚNICA de las casillas que usan los mapas, los eventos, las pruebas y el E2E. Módulo
// PURO (sin DOM ni motor).
//
//   · distorsion_honda    Mundo Distorsión profundo, «La Hondura» (tileset 14): islas que bajan desde la grieta nueva
//                          de la explanada del aljibe; primera losa que gira sin parar (se fija con el Anclaje).
//   · distorsion_corazon  «El Corazón» (tileset 14): tres caras (losas) que giran alrededor de un corazón de piedra
//                          cerrado; cuando las tres miran al corazón, se abre: la Griseosfera y Giratina.
//   · cumbre_azur          Cumbre Azur (tileset 1): la Senda del Lazo abierta con el Anclaje sube por encima de las
//                          nubes hasta Columna Lanza.
// Además, casillas que se añaden a mapas de otros bloques (Senda del Lazo, Columna Lanza, explanada del aljibe, nodos
// de la Red de Convergencia).

/** Rectángulo inclusivo [x0..x1] × [y0..y1] como lista de casillas. */
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const R = (x0, y0, x1, y1) => Object.freeze({ x0, y0, x1, y1 });
const P = (x, y, dir = 8) => Object.freeze({ x, y, dir });

// ───────────────────────────── La Hondura (distorsion_honda) ─────────────────────────────

export const HONDA = Object.freeze({
  width: 36,
  height: 40,
  arrival: P(17, 35, 8),
  islands: Object.freeze({
    i0: R(13, 32, 21, 37), // llegada desde la grieta de la explanada
    i1: R(8, 16, 27, 26), // la isla grande (encuentros)
    i2: R(13, 5, 21, 10), // la del portal hacia el Corazón
  }),
  /** Losa de la Hondura: barra (I) de brazos de 2 casillas; une I0 e I1 solo en vertical. */
  face: Object.freeze({ id: 'honda', cx: 17, cy: 29, shape: 'I' }),
  posts: Object.freeze([
    Object.freeze({ face: 'honda', x: 18, y: 32 }), // en I0, junto a la llegada a la losa
    Object.freeze({ face: 'honda', x: 16, y: 26 }), // en I1 (para soltarla o volver a fijarla desde arriba)
  ]),
  anchors: Object.freeze([
    Object.freeze({ id: 'ancla_honda_0', x: 15, y: 33 }),
    Object.freeze({ id: 'ancla_honda_1', x: 20, y: 18 }),
    Object.freeze({ id: 'ancla_honda_2', x: 15, y: 7 }),
  ]),
  /** Puentes de la mirada (La Mirada del B12) entre I1 e I2: x 17, y 11–15. */
  bridge: Object.freeze({ x: 17, y0: 11, y1: 15 }),
  portalBack: Object.freeze({ x: 20, y: 36 }), // grieta de vuelta a la explanada del aljibe
  portalDown: Object.freeze({ x: 17, y: 6 }), // grieta hacia el Corazón
  /** Franja de I1 donde, la primera vez, cruza la sombra de Giratina (se pisa al llegar de la losa). */
  shadowStrip: Object.freeze({ y: 25, x0: 15, x1: 19 }),
  rocks: Object.freeze([[10, 18], [24, 17], [12, 23], [23, 23], [19, 21]]), // peñas de 2×2 (esquina sup-izq)
  items: Object.freeze([
    Object.freeze({ id: 'b22a_objeto_honda_1', x: 9, y: 17, item: 'REAPERCLOTH' }),
    Object.freeze({ id: 'b22a_objeto_honda_2', x: 26, y: 25, item: 'MAXREVIVE' }),
    Object.freeze({ id: 'b22a_objeto_honda_3', x: 20, y: 8, item: 'DUSKBALL', count: 3 }),
    Object.freeze({ id: 'b22a_objeto_honda_4', x: 14, y: 20, item: 'PPMAX', hidden: true }),
  ]),
});

// ───────────────────────────── El Corazón (distorsion_corazon) ─────────────────────────────

/**
 * Tres caras (losas en L de brazos de 2 casillas) alrededor del corazón. `heart` = lado de la losa que mira al corazón.
 * Orientaciones (sentido horario desde N+E): 0 = N+E · 1 = E+S · 2 = S+W · 3 = W+N.
 */
export const CORAZON = Object.freeze({
  width: 36,
  height: 32,
  arrival: P(18, 22, 8),
  heart: Object.freeze({ x0: 15, y0: 6, x1: 21, y1: 12, cx: 18, cy: 9 }),
  faces: Object.freeze([
    Object.freeze({ id: 'oeste', cx: 12, cy: 9, shape: 'L', heart: 'E' }),
    Object.freeze({ id: 'sur', cx: 18, cy: 15, shape: 'L', heart: 'N' }),
    Object.freeze({ id: 'este', cx: 24, cy: 9, shape: 'L', heart: 'W' }),
  ]),
  islands: Object.freeze({
    s: Object.freeze([R(16, 18, 20, 18), R(13, 19, 23, 25)]),
    so: Object.freeze([R(8, 12, 14, 17), R(15, 14, 15, 17)]),
    se: Object.freeze([R(22, 12, 28, 17), R(21, 14, 21, 17)]),
    oeste: Object.freeze([R(6, 8, 9, 10)]), // islote del oeste (losa oeste en S+W)
    este: Object.freeze([R(27, 8, 30, 10)]), // islote del este (losa este en E+S)
  }),
  posts: Object.freeze([
    Object.freeze({ face: 'sur', x: 19, y: 18 }), // isla sur
    Object.freeze({ face: 'sur', x: 15, y: 14 }), // isla suroeste
    Object.freeze({ face: 'sur', x: 21, y: 14 }), // isla sureste
    Object.freeze({ face: 'oeste', x: 13, y: 12 }), // isla suroeste
    Object.freeze({ face: 'este', x: 23, y: 12 }), // isla sureste
  ]),
  anchors: Object.freeze([
    Object.freeze({ id: 'ancla_corazon_s', x: 15, y: 21 }),
    Object.freeze({ id: 'ancla_corazon_so', x: 9, y: 14 }),
    Object.freeze({ id: 'ancla_corazon_se', x: 27, y: 14 }),
  ]),
  /** Marcas del muro del corazón (una por cara, en el lado al que mira). */
  marks: Object.freeze({ oeste: Object.freeze({ x: 15, y: 9 }), sur: Object.freeze({ x: 18, y: 12 }), este: Object.freeze({ x: 21, y: 9 }) }),
  pedestal: Object.freeze({ x: 18, y: 9 }), // la Griseosfera (se coge mirándola)
  giratina: Object.freeze({ x: 18, y: 7 }),
  exitHeart: Object.freeze({ x: 18, y: 11 }), // grieta de salida dentro del corazón (tras abrirse)
  portalBack: Object.freeze({ x: 21, y: 23 }), // grieta de vuelta a la explanada del aljibe
  /** Objetos de los islotes (el del oeste con la losa oeste en S+W; el del este con la losa este en E+S). */
  items: Object.freeze([
    Object.freeze({ id: 'b22a_objeto_corazon_1', x: 7, y: 9, item: 'RARECANDY' }),
    Object.freeze({ id: 'b22a_objeto_corazon_2', x: 29, y: 9, item: 'PPMAX' }),
  ]),
});

// ───────────────────────────── Cumbre Azur (cumbre_azur) ─────────────────────────────

/**
 * Cresta nevada por encima del mar de nubes: la base (llegada desde la Senda), dos mesetas escalonadas (caras de
 * terraza nevada como las de la Senda) y el dintel de los Custodios bajo la columna de luz, que lleva a Columna Lanza.
 */
export const CUMBRE = Object.freeze({
  width: 30,
  height: 40,
  arrival: P(15, 38, 8),
  south: Object.freeze({ x0: 14, x1: 16, y: 39 }), // se baja pulsando abajo → Senda del Lazo (mirador)
  base: R(11, 30, 19, 39),
  /** Mesetas (rectángulos que salen del mapa por arriba) y fila inferior de su cara. */
  plateaus: Object.freeze([
    Object.freeze({ x0: 8, x1: 22, faceBottom: 29 }),
    Object.freeze({ x0: 10, x1: 20, faceBottom: 16 }),
  ]),
  /** Escaleras (esquina sup-izq del stamp 3×3; se sube por la columna central). */
  stairs: Object.freeze([Object.freeze({ x: 14, y: 27 }), Object.freeze({ x: 11, y: 14 })]),
  gate: Object.freeze({ x: 13, y: 1 }), // pilar_dintel 5×4: pilares en x 13 y 17 (filas 3–4)
  gateCells: Object.freeze([14, 15, 16].map((x) => Object.freeze({ x, y: 3 }))), // bajo el dintel → Columna Lanza
  light: Object.freeze({ x: 15, y: 0 }),
  curiosa: P(12, 6, 6),
  stele: Object.freeze({ x: 18, y: 18 }), // estela partida (placa Unown 2×2; la base, y 19, se lee desde abajo)
  /** Suelo pisable de cada tramo (lo demás es roca de terraza, peñas o el mar de nubes). */
  floors: Object.freeze({
    base: R(11, 30, 19, 39),
    meseta1: R(10, 17, 20, 26),
    meseta2: R(12, 3, 18, 13),
    dintel: R(14, 1, 16, 2), // bajo el dintel
  }),
  /** Camino de la subida (se deja despejado de detalles). */
  route: Object.freeze([
    [15, 39], [15, 30], [15, 26], [15, 22], [12, 22], [12, 17], [12, 13], [15, 13], [15, 4],
  ]),
  ruins: Object.freeze({
    monoliths: Object.freeze([[10, 23], [19, 23]]), // 2×3 (la base, y + 2, bloquea)
    broken: Object.freeze([[13, 20], [17, 24], [17, 7], [13, 10]]), // columna quebrada 1×2 (la base bloquea)
    glyphs: Object.freeze([[15, 22], [14, 9], [16, 33]]),
  }),
  items: Object.freeze([
    Object.freeze({ id: 'b22a_objeto_cumbre_1', x: 20, y: 17, item: 'COMETSHARD' }),
    Object.freeze({ id: 'b22a_objeto_cumbre_2', x: 18, y: 5, item: 'PPMAX' }),
    Object.freeze({ id: 'b22a_objeto_cumbre_3', x: 12, y: 36, item: 'MAXREVIVE', hidden: true }),
  ]),
});

// ───────────────────────────── Añadidos a mapas de otros bloques ─────────────────────────────

/** Senda del Lazo (B15, ruta_12_senda_lazo): el nudo del tramo alto y la subida a la Cumbre tras anclarlo. */
export const SENDA_B22A = Object.freeze({
  knot: Object.freeze({ x: 19, y: 2 }), // se usa desde (19, 3) mirando arriba
  knotStand: P(19, 3, 8),
  up: Object.freeze([18, 19, 20, 21].map((x) => Object.freeze({ x, y: 1 }))), // tras anclar: sube a la Cumbre
  back: P(20, 3, 2), // llegada al bajar de la Cumbre
});

/** Columna Lanza (B21): peldaños de nube hacia la Cumbre y plataformas del no elegido. */
export const COLUMNA_B22A = Object.freeze({
  stairs: P(14, 35, 8), // bajada a la Cumbre Azur (y llegada al subir)
  /** Plataforma del legendario que NO se eligió en el P9 (Dialga al oeste, Palkia al este). */
  platform: Object.freeze({ DIALGA: P(6, 9, 2), PALKIA: P(22, 9, 2) }),
  platformStand: Object.freeze({ DIALGA: P(7, 9, 4), PALKIA: P(21, 9, 6) }),
  arceusStand: P(14, 9, 8),
});

/** Explanada interior del aljibe (B12, pilar_invertido): la grieta nueva hacia la Hondura. */
export const EXPLANADA_B22A = Object.freeze({
  grieta: Object.freeze({ x: 26, y: 23 }),
  returnArrival: P(26, 22, 2),
});

/**
 * Nodos de la Red de Convergencia (CAMPANA §1.7, X12): solo cuatro lugares excepcionales, nunca ciudades. `x, y` =
 * llegada del Salto (y casilla del hexágono cuando se usa pisándolo). `story` = flags que prueban que ya se visitó.
 */
export const RED_NODES = Object.freeze([
  Object.freeze({ id: 'laberinto', label: 'Laberinto de la Profundidad', map: 'laberinto_profundidad', x: 20, y: 11, dir: 2, story: Object.freeze(['b01_core_found']) }),
  Object.freeze({ id: 'aljibe', label: 'Aljibe del Portal', map: 'montana_portal', x: 20, y: 11, dir: 2, story: Object.freeze(['b12_aljibe_abierto', 'p6_restored']) }),
  Object.freeze({ id: 'origen', label: 'Núcleo del Origen', map: 'nucleo_origen', x: 10, y: 13, dir: 8, story: Object.freeze(['b20_nucleo_visto', 'p10_restored']) }),
  Object.freeze({ id: 'columna', label: 'Columna Lanza', map: 'columna_lanza', x: 14, y: 31, dir: 8, story: Object.freeze(['b21_llegada']) }),
]);

export const redNode = (id) => RED_NODES.find((n) => n.id === id) || null;
