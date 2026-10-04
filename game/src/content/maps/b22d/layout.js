// Coordenadas del Bloque 22d (FUENTE ÚNICA para mapas, eventos, pruebas y E2E). Módulo puro.
// Mapas propios: Cueva Sellada del Pico (mina_galena_sellada), bodega y Cueva Sellada de la Escarcha
// (boreal_cueva_sellada), túneles viejos de Lúmina y Cueva Sellada del Engranaje (lumina_tuneles), Cámara del Coloso
// (archivo_coloso), la pesadilla de Villa Alba (alba_pesadilla) e Instalación Cierzo (instalacion_cierzo,
// cierzo_laboratorio, cierzo_nucleo). Casillas en mapas de otros bloques: HOOKS (cambios aditivos, ver README).
// Salas de cueva: rectángulos de SUELO (x0..x1, y0..y1) del pincel `sala<variante>` (maps/b08/cave_kit.js).

const R = (x0, y0, x1, y1) => Object.freeze({ x0, y0, x1, y1 });
const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

// ───────────────────────────── Cueva Sellada del Pico (Regirock) ─────────────────────────────

export const PICO = Object.freeze({
  id: 'mina_galena_sellada', width: 32, height: 24,
  rooms: Object.freeze({ vestibulo: R(20, 9, 27, 14), nave: R(4, 9, 15, 20) }),
  tunnel: Object.freeze({ x0: 16, x1: 19, y: 9 }),
  exitStamp: Object.freeze({ x: 27, y: 10 }), // boca_este (4×4): puerta en (28,12)
  exit: Object.freeze({ x: 28, y: 12 }),
  arrive: P(27, 12, 4),
  dais: R(7, 10, 11, 12),
  regirock: P(9, 11, 2),
  battle: P(9, 14, 8),
  stele: Object.freeze({ x: 13, y: 10 }), // estela Unown 2×2 (se lee desde (13,12) o (14,12))
  items: Object.freeze([
    Object.freeze({ id: 'objeto_pico_1', x: 4, y: 20, item: 'STARPIECE' }),
    Object.freeze({ id: 'objeto_pico_2', x: 26, y: 14, item: 'RARECANDY', hidden: true }),
    Object.freeze({ id: 'objeto_pico_3', x: 15, y: 19, item: 'HARDSTONE' }),
  ]),
});

// ───────────────────────────── Bodega del hielo y Cueva Sellada de la Escarcha (Regice) ─────────────────────────────

export const ESCARCHA = Object.freeze({
  id: 'boreal_cueva_sellada', width: 36, height: 22,
  rooms: Object.freeze({ bodega: R(3, 6, 16, 17), camara: R(23, 6, 32, 18) }),
  tunnel: Object.freeze({ x0: 17, x1: 22, y: 6 }),
  ladder: Object.freeze({ x: 5, y: 4 }), // escalera_mano (1×2): puerta en (5,5)
  exit: Object.freeze({ x: 5, y: 5 }),
  arrive: P(5, 6, 2),
  /** Bloques de hielo en bruto (rejilla 3×3; índice = fila × 3 + columna). */
  knobs: Object.freeze([9, 11, 13].flatMap((y) => [9, 11, 13].map((x) => Object.freeze({ x, y })))),
  model: Object.freeze({ x: 5, y: 13 }), // la talla vieja (el modelo)
  rosendo: P(7, 8, 6),
  wall: Object.freeze({ x: 17, y: 6 }), // muro de hielo en la boca del túnel
  regice: P(28, 10, 2),
  battle: P(28, 13, 8),
  stele: Object.freeze({ x: 31, y: 9 }),
  items: Object.freeze([
    Object.freeze({ id: 'objeto_escarcha_1', x: 32, y: 18, item: 'NEVERMELTICE' }),
    Object.freeze({ id: 'objeto_escarcha_2', x: 16, y: 17, item: 'PPUP', hidden: true }),
    Object.freeze({ id: 'objeto_escarcha_3', x: 29, y: 16, item: 'MAXREVIVE' }),
  ]),
});

// ───────────────────────────── Túneles viejos de Lúmina y Cueva Sellada del Engranaje (Registeel) ─────────────

export const TUNELES = Object.freeze({
  id: 'lumina_tuneles', width: 46, height: 30,
  rooms: Object.freeze({
    anden: R(3, 5, 12, 10),
    reloj: R(18, 5, 27, 12),
    galeria1: R(4, 16, 12, 23),
    galeria2: R(18, 18, 27, 25),
    galeria3: R(33, 18, 42, 25),
    engranaje: R(34, 5, 42, 12),
  }),
  tunnels: Object.freeze([
    Object.freeze({ x0: 13, x1: 17, y: 5 }), // andén ↔ reloj
    Object.freeze({ x0: 28, x1: 33, y: 5 }), // reloj ↔ engranaje (la puerta de acero)
    Object.freeze({ x0: 28, x1: 32, y: 18 }), // galería 2 ↔ galería 3
  ]),
  passages: Object.freeze([
    Object.freeze({ x: 6, rows: [11, 15] }), // andén ↔ galería 1
    Object.freeze({ x: 21, rows: [13, 17] }), // reloj ↔ galería 2 (cascotes)
  ]),
  ladder: Object.freeze({ x: 5, y: 3 }), // escalerilla del montacargas: puerta en (5,4)
  exit: Object.freeze({ x: 5, y: 4 }),
  arrive: P(5, 5, 2),
  clock: Object.freeze({ x: 22, y: 4 }), // reloj en la pared norte (96×128: x 21–23)
  clockFront: P(22, 5, 8),
  rosalia: P(24, 6, 4),
  rubble: Object.freeze([[21, 15], [22, 15], [23, 15]]), // cascotes (Embestida, se rompen juntos)
  door: Object.freeze({ x: 29, y: 5 }), // puerta de acero del Engranaje
  parts: Object.freeze({ pendulo: Object.freeze({ x: 5, y: 22 }), rueda: Object.freeze({ x: 27, y: 25 }), pesa: Object.freeze({ x: 42, y: 19 }) }),
  registeel: P(38, 8, 2),
  battle: P(38, 11, 8),
  stele: Object.freeze({ x: 40, y: 6 }),
  rails: Object.freeze({ y: 9, x0: 3, x1: 12 }),
  items: Object.freeze([
    Object.freeze({ id: 'objeto_tuneles_1', x: 12, y: 6, item: 'MAXELIXIR', hidden: true }),
    Object.freeze({ id: 'objeto_tuneles_2', x: 33, y: 25, item: 'METALCOAT' }),
    Object.freeze({ id: 'objeto_tuneles_3', x: 12, y: 17, item: 'ULTRABALL', count: 3 }),
  ]),
});

// ───────────────────────────── Cámara del Coloso (Regigigas) ─────────────────────────────

export const COLOSO = Object.freeze({
  id: 'archivo_coloso', width: 23, height: 24,
  floor: R(3, 1, 19, 21),
  stairs: Object.freeze({ x: 10, y: 19 }), // pilar_escalinata 3×3 (x 10–12, y 19–21): sube al Archivo Hondo
  exitTiles: Object.freeze([[10, 21], [11, 21], [12, 21]]),
  arrive: P(11, 18, 8),
  regigigas: P(11, 7, 2),
  emblem: Object.freeze({ x: 9, y: 4 }), // emblema_suelo 5×5 bajo el coloso
  battle: P(11, 10, 8),
  niches: Object.freeze([P(6, 6, 2), P(11, 2, 2), P(16, 6, 2)]), // roca · acero · hielo (pedestales)
  items: Object.freeze([
    Object.freeze({ id: 'objeto_coloso_1', x: 4, y: 20, item: 'PPMAX' }),
  ]),
});

// ───────────────────────────── Pesadilla de Villa Alba (Darkrai) ─────────────────────────────

export const PESADILLA = Object.freeze({
  id: 'alba_pesadilla', width: 46, height: 36,
  arrive: P(10, 26, 2), // ante la puerta de casa (la puerta no se abre)
  door: Object.freeze({ x: 10, y: 25 }),
  darkrai: P(22, 14, 2),
  battle: P(22, 16, 8),
  /** Bordes que vuelven al pueblo (el sueño no tiene salida). */
  loops: Object.freeze([
    Object.freeze({ cells: [[22, 0], [23, 0]], to: P(22, 33, 8) }),
    Object.freeze({ cells: [[20, 35], [21, 35], [22, 35], [23, 35], [24, 35], [25, 35]], to: P(22, 2, 2) }),
  ]),
  /** Siluetas de los vecinos que se deshacen al acercarse. */
  silhouettes: Object.freeze([
    Object.freeze({ id: 'sombra_mama', x: 11, y: 27, dir: 8, who: 'mama' }),
    Object.freeze({ id: 'sombra_policia', x: 22, y: 8, dir: 2, who: 'policia' }),
    Object.freeze({ id: 'sombra_profesor', x: 37, y: 19, dir: 4, who: 'profesor' }),
    Object.freeze({ id: 'sombra_gael', x: 9, y: 13, dir: 2, who: 'gael' }),
  ]),
});

// ───────────────────────────── Instalación Cierzo (Mewtwo) ─────────────────────────────

export const CIERZO = Object.freeze({
  hall: Object.freeze({
    id: 'instalacion_cierzo', width: 28, height: 14,
    room: Object.freeze({ x: 1, y: 1, w: 26, h: 11 }), // interior (paredes arriba) del pincel habitacion_lab
    entry: P(13, 11, 8), // sobre el felpudo (salida pulsando abajo)
    doors: Object.freeze({ a: Object.freeze({ x: 5, y: 3 }), b: Object.freeze({ x: 11, y: 3 }), c: Object.freeze({ x: 17, y: 3 }), lift: Object.freeze({ x: 23, y: 3 }) }),
    terminals: Object.freeze([Object.freeze({ x: 3, y: 7 }), Object.freeze({ x: 24, y: 7 })]),
  }),
  lab: Object.freeze({
    id: 'cierzo_laboratorio', width: 41, height: 12,
    rooms: Object.freeze({ a: Object.freeze({ x: 1, y: 1, w: 11, h: 9 }), b: Object.freeze({ x: 15, y: 1, w: 11, h: 9 }), c: Object.freeze({ x: 29, y: 1, w: 11, h: 9 }) }),
    /** Llegada sobre el felpudo de cada sala (x del centro, fila inferior del suelo). */
    entries: Object.freeze({ a: P(6, 9, 8), b: P(20, 9, 8), c: P(34, 9, 8) }),
    protos: Object.freeze({ a: P(6, 5, 2), b: P(20, 5, 2), c: P(34, 5, 2) }),
    battles: Object.freeze({ a: P(6, 7, 8), b: P(20, 7, 8), c: P(34, 7, 8) }),
    tanks: Object.freeze({ a: Object.freeze({ x: 3, y: 4 }), b: Object.freeze({ x: 17, y: 4 }), c: Object.freeze({ x: 31, y: 4 }) }),
    logs: Object.freeze({ a: Object.freeze({ x: 10, y: 4 }), b: Object.freeze({ x: 24, y: 4 }), c: Object.freeze({ x: 38, y: 4 }) }),
    items: Object.freeze([
      Object.freeze({ id: 'objeto_cierzo_b', x: 24, y: 8, item: 'MEWTWONITEX' }),
      Object.freeze({ id: 'objeto_cierzo_c', x: 38, y: 8, item: 'MEWTWONITEY' }),
      Object.freeze({ id: 'objeto_cierzo_a', x: 2, y: 8, item: 'FULLRESTORE' }),
    ]),
  }),
  core: Object.freeze({
    id: 'cierzo_nucleo', width: 19, height: 15,
    room: Object.freeze({ x: 1, y: 1, w: 17, h: 12 }),
    entry: P(9, 12, 8),
    mewtwo: P(9, 6, 2),
    battle: P(9, 8, 8),
    logs: Object.freeze([Object.freeze({ x: 3, y: 5 }), Object.freeze({ x: 15, y: 5 })]),
  }),
});

// ───────────────────────────── Casillas en mapas de otros bloques ─────────────────────────────

export const HOOKS = Object.freeze({
  /** Mina Galena (B08): relieve en la pared norte de la veta de cristal y rocas marcadas. */
  mina: Object.freeze({
    relief: Object.freeze({ x: 7, y: 15 }), // boca_norte en (6,12) al abrirse; se entra pisando (7,15)
    reliefFront: P(7, 16, 8),
    boca: Object.freeze({ x: 6, y: 12 }),
    fermin: P(8, 16, 4),
    arriveBack: P(7, 16, 2),
    /** Rocas marcadas (casillas ya bloqueadas por la decoración de la veta): signo y casilla desde la que se golpea. */
    marks: Object.freeze([
      Object.freeze({ sign: 'pico', x: 10, y: 22, from: P(11, 22, 4) }),
      Object.freeze({ sign: 'lampara', x: 4, y: 17, from: P(3, 17, 6) }),
      Object.freeze({ sign: 'vagoneta', x: 5, y: 20, from: P(6, 20, 4) }),
      Object.freeze({ sign: 'casco', x: 10, y: 17, from: P(11, 17, 4) }),
    ]),
  }),
  galena: Object.freeze({ fermin: P(8, 6, 4) }),
  /** Talleres del Hielo (B15): trampilla de la bodega. */
  talleres: Object.freeze({ hatch: Object.freeze({ x: 15, y: 11 }), hatchFront: P(15, 10, 2) }),
  /** Sótano del museo de Lúmina (B09a): montacargas viejo del muelle y Rosalía esperando. */
  taller: Object.freeze({ lift: Object.freeze({ x: 17, y: 16 }), liftFront: P(17, 15, 2), rosalia: P(18, 15, 4) }),
  galeria: Object.freeze({ trigger: Object.freeze({ x: 0, y: 0 }) }),
  /** Archivo Hondo (B10): sello de los tres bajo la cámara del núcleo. */
  hondo: Object.freeze({ seal: Object.freeze({ x: 25, y: 9 }), arriveBack: P(25, 10, 8) }),
  /** Cráter del Tizón (B13): calzada de basalto hasta la boca del cráter activo. */
  crater: Object.freeze({
    shore: Object.freeze({ x: 20, y: 17 }),
    causeway: Object.freeze([[20, 16], [20, 15], [20, 14], [20, 13], [20, 12], [20, 11]]),
    vent: P(20, 10, 2),
    battle: P(20, 11, 8),
    retry: P(20, 18, 8),
  }),
  /** Volcán Tizón (B13): la forja de Brasa. */
  forja: Object.freeze({ trigger: Object.freeze({ x: 0, y: 0 }) }),
  /** Islote Lumbre (B13): Cresselia sobre el mar del sur del islote. */
  lumbre: Object.freeze({ cresselia: P(7, 20, 8), front: P(7, 19, 2), retry: P(8, 19, 2) }),
  /** Explanada del Umbral (B02): las sombras de la plaza y la ruta de la que va a destiempo. */
  explanada: Object.freeze({
    shadows: Object.freeze([
      Object.freeze({ id: 'sombra_columna_o', x: 10, y: 19 }),
      Object.freeze({ id: 'sombra_columna_e', x: 23, y: 19, odd: true }),
      Object.freeze({ id: 'sombra_monolito_o', x: 12, y: 13 }),
      Object.freeze({ id: 'sombra_monolito_e', x: 21, y: 13 }),
      Object.freeze({ id: 'sombra_quebrada', x: 20, y: 23 }),
    ]),
    route: Object.freeze([[23, 19], [25, 22], [16, 24], [5, 16], [8, 14], [15, 13]]),
    marshadow: P(15, 12, 2),
    battle: P(15, 14, 8),
  }),
  /** Mar Boreal (B15): puerta del edificio del islote de la Instalación Cierzo. */
  mar: Object.freeze({ door: Object.freeze({ x: 4, y: 5 }), front: P(4, 6, 8) }),
  /** Casa del protagonista (B01): la cama (casa_prota_2f). */
  bed: Object.freeze({ tiles: Object.freeze([[9, 6], [10, 6], [11, 6], [9, 7], [10, 7], [11, 7], [9, 8], [10, 8], [11, 8]]), wake: P(8, 6, 2) }),
});
