// Coordenadas del Bloque 12 — Pilar Invertido (P6). FUENTE ÚNICA para mapas, eventos, pruebas y E2E (README.md).
// Módulo puro. Las salas de La Cara Vuelta están en ./rooms.js (rejillas físicas de dos orientaciones).

/** Rectángulo de casillas [x0..x1] × [y0..y1] (bordes incluidos). */
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
/** Segmento recto de casillas (horizontal o vertical). */
export const segment = ([x0, y0], [x1, y1]) => {
  if (x0 !== x1 && y0 !== y1) throw new Error(`segment: (${x0},${y0})→(${x1},${y1}) no es recto`);
  const out = [];
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) out.push([x0 + Math.sign(x1 - x0) * i, y0 + Math.sign(y1 - y0) * i]);
  return out;
};

// ───────────────────────────── Monte del Portal (montana_portal, B01 ampliado) ─────────────────────────────

/**
 * Añadidos del B12 al mapa del prólogo (mismas coordenadas: el prólogo no se toca). El mapa crece 6 columnas al
 * este (44 → 50): macizo más ancho con la repisa de la cascada (Trepar), poza mayor (C076, Nadar) y la gruta.
 */
export const MONTE = Object.freeze({
  width: 50,
  arrival: Object.freeze({ x: 17, y: 48, dir: 8 }), // llegada desde el campamento (B11) — no cambia
  aljibeFront: Object.freeze({ x: 17, y: 11, dir: 8 }), // delante del brocal
  returnSpot: Object.freeze({ x: 17, y: 12, dir: 2 }), // al volver del Mundo Distorsión
  massif: Object.freeze({ x0: 33, y0: -1, w: 17, h: 38 }), // acantilado (antes 12 de ancho)
  pool: Object.freeze({ x: 34, y: 37, w: 11, h: 6 }), // poza al pie de la cascada (antes 9×6); la fila 43 sigue siendo orilla
  // Pared de raíces al este de la poza: del pie (47, 37) a lo alto del macizo (47, 33); la cara ocupa las filas 34–36.
  climb: Object.freeze({ foot: Object.freeze([47, 37]), top: Object.freeze([47, 33]) }),
  // Repisa de la cascada (cima del macizo, al este del salto): gruta y hierba de montaña.
  ledge: Object.freeze({ x0: 41, y0: 3, x1: 48, y1: 33 }),
  grutaMouth: Object.freeze({ x: 43, y: 10 }), // stamp `boquete` (4×3)
  grutaDoor: Object.freeze({ x: 44, y: 11 }), // boca de la gruta (warp)
  grutaArrival: Object.freeze({ x: 44, y: 13, dir: 2 }),
  cells: Object.freeze({
    C050: Object.freeze({ x: 26, y: 46 }), // explanada quemada
    C051: Object.freeze({ x: 17, y: 21 }), // mitad de la escalinata (entre el 2.º y el 3.er tramo)
    C076: Object.freeze({ x: 39, y: 41 }), // poza al pie de la gran cascada (Nadar)
  }),
  // Explanada: marcas de la batalla del prólogo, piedras quemadas y pozos de sondeo de Genesis (tras b11_exp03).
  scorch: Object.freeze([[11, 42], [19, 45], [24, 39], [8, 45], [29, 47], [16, 38], [27, 45]]),
  charred: Object.freeze([[7, 39], [25, 43], [30, 41], [12, 48]]),
  claws: Object.freeze([[18, 42], [15, 46], [23, 47]]),
  drillHoles: Object.freeze([[10, 42], [22, 42], [14, 45], [20, 48], [28, 39]]),
  // Alrededor del aljibe: estacas de medición a distancia (Genesis midió desde fuera) y huellas que se dan la vuelta.
  stakes: Object.freeze([[12, 9], [22, 9], [12, 12], [22, 12]]),
  sensor: Object.freeze({ x: 13, y: 13 }),
  boots: Object.freeze([[18, 13], [17, 14]]),
  hiker: Object.freeze({ x: 9, y: 40, dir: 6 }),
  // Hierba alta (encuentros de la tabla «Ruta 10 alta y Monte del Portal»): laterales de las terrazas y repisa.
  grass: Object.freeze([
    Object.freeze({ x: 4, y: 31, w: 5, h: 4 }), Object.freeze({ x: 25, y: 32, w: 6, h: 3 }),
    Object.freeze({ x: 9, y: 20, w: 5, h: 5 }), Object.freeze({ x: 20, y: 21, w: 6, h: 4 }),
    Object.freeze({ x: 42, y: 20, w: 5, h: 6 }), Object.freeze({ x: 42, y: 6, w: 4, h: 4 }),
  ]),
  items: Object.freeze([
    Object.freeze({ id: 'objeto_repisa_monte', x: 47, y: 5, item: 'ULTRABALL', count: 2 }),
    Object.freeze({ id: 'objeto_terraza', x: 4, y: 29, item: 'HYPERPOTION' }),
    Object.freeze({ id: 'objeto_oculto_explanada', x: 31, y: 48, item: 'REVIVE', hidden: true }),
  ]),
});

// ───────────────────────────── Gruta del Monte ─────────────────────────────

export const GRUTA = Object.freeze({
  width: 26,
  height: 20,
  floor: Object.freeze({ x0: 3, y0: 5, x1: 22, y1: 16 }),
  entry: Object.freeze({ x: 12, y: 16, dir: 8 }), // llegada desde la boca de la repisa
  door: Object.freeze({ x: 12, y: 17 }), // claridad de la salida (empujar abajo)
  items: Object.freeze([
    Object.freeze({ id: 'objeto_gruta_1', x: 3, y: 5, item: 'DUSKSTONE' }),
    Object.freeze({ id: 'objeto_gruta_2', x: 21, y: 5, item: 'MAXREPEL' }), // en el suelo, no en la pared (fila 4)
    Object.freeze({ id: 'objeto_gruta_oculto', x: 19, y: 12, item: 'RARECANDY', hidden: true }),
  ]),
});

// ───────────────────────────── La explanada interior (pilar_invertido) ─────────────────────────────

export const VESTIBULO = Object.freeze({
  width: 40,
  height: 34,
  // Rellano bajo el aljibe (llegada) y cuello hacia la plaza.
  landing: Object.freeze({ x0: 14, y0: 5, x1: 25, y1: 9 }),
  neck: Object.freeze({ x0: 18, y0: 10, x1: 21, y1: 11 }),
  plaza: Object.freeze({ x0: 6, y0: 12, x1: 33, y1: 24 }),
  // Islote del portal hacia La Cara Vuelta (este) y pasarela de piedra.
  eastPath: Object.freeze({ x0: 34, y0: 17, x1: 35, y1: 19 }),
  portalIsle: Object.freeze({ x0: 36, y0: 15, x1: 38, y1: 21 }),
  rocks: Object.freeze([[14, 5], [24, 5], [6, 12], [32, 12], [6, 23], [32, 23]]), // peñas de 2×2 (esquina sup-izq)
  arrival: Object.freeze({ x: 19, y: 7, dir: 2 }),
  aljibe: Object.freeze({ x: 19, y: 5 }), // el aljibe visto desde abajo (anillo en el techo del rellano)
  anchor: Object.freeze({ x: 21, y: 8 }),
  portalCara: Object.freeze({ x: 37, y: 18 }),
  // Llegada al volver del núcleo (tras restaurar) y portal de regreso.
  returnArrival: Object.freeze({ x: 20, y: 15, dir: 8 }),
  columns: Object.freeze([[10, 14], [10, 19], [14, 14], [14, 19], [25, 14], [25, 19], [29, 14], [29, 19]]),
  broken: Object.freeze([[18, 13], [21, 22], [8, 22], [31, 16]]),
  monoliths: Object.freeze([[7, 15], [31, 20]]),
  claws: Object.freeze([[17, 17], [22, 18], [19, 20]]),
  enlosado: Object.freeze([
    Object.freeze({ x: 9, y: 16, w: 6, h: 3 }), Object.freeze({ x: 25, y: 16, w: 6, h: 3 }), Object.freeze({ x: 17, y: 15, w: 6, h: 3 }),
  ]),
  placa: Object.freeze({ x: 19, y: 22 }), // estela Unown (2×2)
  items: Object.freeze([Object.freeze({ id: 'objeto_plaza', x: 9, y: 23, item: 'HYPERPOTION' })]),
});

// ───────────────────────────── La Mirada ─────────────────────────────

export const MIRADA = Object.freeze({
  width: 30,
  height: 26,
  islands: Object.freeze([
    Object.freeze({ id: 'I0', x0: 4, y0: 19, x1: 6, y1: 21 }), // llegada
    Object.freeze({ id: 'I1', x0: 4, y0: 14, x1: 6, y1: 16 }),
    Object.freeze({ id: 'I3', x0: 4, y0: 4, x1: 6, y1: 6 }), // islote del norte (objeto)
    Object.freeze({ id: 'P1', x0: 15, y0: 15, x1: 15, y1: 15 }),
    Object.freeze({ id: 'I2', x0: 14, y0: 10, x1: 16, y1: 12 }),
    Object.freeze({ id: 'P2', x0: 15, y0: 5, x1: 15, y1: 5 }),
    Object.freeze({ id: 'I5', x0: 21, y0: 3, x1: 27, y1: 7 }), // salida
    Object.freeze({ id: 'P4', x0: 21, y0: 11, x1: 21, y1: 11 }),
    Object.freeze({ id: 'P5', x0: 21, y0: 17, x1: 22, y1: 17 }),
  ]),
  bridges: Object.freeze([
    Object.freeze({ id: 'b01', from: [5, 18], to: [5, 17] }),
    Object.freeze({ id: 'b12', from: [7, 15], to: [14, 15] }),
    Object.freeze({ id: 'bP1', from: [15, 14], to: [15, 13] }),
    Object.freeze({ id: 'b2P', from: [15, 9], to: [15, 6] }),
    Object.freeze({ id: 'bP5', from: [16, 5], to: [20, 5] }),
    Object.freeze({ id: 'b13', from: [5, 13], to: [5, 7] }),
    Object.freeze({ id: 'b24', from: [17, 11], to: [20, 11] }),
    Object.freeze({ id: 'b45', from: [21, 12], to: [21, 16] }),
  ]),
  start: Object.freeze({ x: 5, y: 20, dir: 8 }),
  anchors: Object.freeze([Object.freeze({ id: 'ancla_i1', x: 6, y: 16, symbol: 'ojo' }), Object.freeze({ id: 'ancla_i2', x: 16, y: 12 })]),
  exit: Object.freeze({ x: 26, y: 5 }),
  items: Object.freeze([
    Object.freeze({ id: 'objeto_islote_norte', x: 4, y: 4, item: 'PPUP' }),
    Object.freeze({ id: 'objeto_islote_sur', x: 22, y: 17, item: 'ULTRABALL', count: 3 }),
  ]),
});

// ───────────────────────────── El Sumidero ─────────────────────────────

export const SUMIDERO = Object.freeze({
  width: 34,
  height: 48,
  islands: Object.freeze([
    Object.freeze({ id: 'I0', x0: 12, y0: 38, x1: 20, y1: 43 }), // llegada (abajo)
    Object.freeze({ id: 'I1', x0: 3, y0: 26, x1: 14, y1: 31 }), // media izquierda
    Object.freeze({ id: 'I3', x0: 23, y0: 24, x1: 29, y1: 30 }), // media derecha
    Object.freeze({ id: 'I2', x0: 2, y0: 11, x1: 12, y1: 17 }), // alta izquierda (pulsador 3, C053, sombra)
    Object.freeze({ id: 'R', x0: 1, y0: 3, x1: 4, y1: 6 }), // rincón del Sumidero (Gengarita)
    Object.freeze({ id: 'I4', x0: 22, y0: 7, x1: 29, y1: 13 }), // alta derecha (salida al núcleo)
  ]),
  // Pasos de piedra (suelo) entre islas.
  paths: Object.freeze([
    Object.freeze({ id: 'I1-I3', x0: 15, y0: 28, x1: 22, y1: 28 }),
    Object.freeze({ id: 'I2-R', x0: 2, y0: 7, x1: 3, y1: 10 }),
  ]),
  // Cascadas invertidas: base (boca, en el borde norte de la isla de abajo) y cima (borde sur de la de arriba).
  falls: Object.freeze([
    Object.freeze({ id: 'W1', base: Object.freeze({ x: 14, y: 38 }), top: Object.freeze({ x: 14, y: 31 }), flag: 'b12_pulsador_1' }),
    Object.freeze({ id: 'W2', base: Object.freeze({ x: 8, y: 26 }), top: Object.freeze({ x: 8, y: 17 }), flag: 'b12_pulsador_2' }),
    Object.freeze({ id: 'W3', base: Object.freeze({ x: 26, y: 24 }), top: Object.freeze({ x: 26, y: 13 }), flag: 'b12_pulsador_3' }),
  ]),
  buttons: Object.freeze([
    Object.freeze({ id: 'pulsador_1', x: 18, y: 40, opens: 'W1' }),
    Object.freeze({ id: 'pulsador_2', x: 28, y: 27, opens: 'W2' }),
    Object.freeze({ id: 'pulsador_3', x: 3, y: 12, opens: 'W3' }),
  ]),
  start: Object.freeze({ x: 16, y: 42, dir: 8 }),
  anchors: Object.freeze([Object.freeze({ id: 'ancla_i0', x: 13, y: 40, symbol: 'gota' }), Object.freeze({ id: 'ancla_i1', x: 5, y: 28 })]),
  // Mitad este de I2, la que asoma al vacío mayor: la sombra de Giratina cruza una vez al pisarla. Es ancha a propósito:
  // C053 (10,12) está dentro y es obligatoria, así que nadie se va del Sumidero sin verla. `x` = borde (asomarse).
  shadowStrip: Object.freeze({ x: 12, x0: 9, y0: 11, y1: 17 }),
  cell: Object.freeze({ x: 10, y: 12 }), // C053
  gengarita: Object.freeze({ x: 2, y: 4 }),
  exit: Object.freeze({ x: 26, y: 8 }),
  items: Object.freeze([Object.freeze({ id: 'objeto_isla_derecha', x: 29, y: 30, item: 'MAXPOTION' })]),
});

// ───────────────────────────── Núcleo ─────────────────────────────

export const NUCLEO = Object.freeze({
  width: 33,
  height: 31,
  platform: Object.freeze({ x0: 9, y0: 7, x1: 23, y1: 23 }),
  entryPath: Object.freeze({ x0: 15, y0: 24, x1: 17, y1: 26 }),
  arrival: Object.freeze({ x: 16, y: 25, dir: 8 }),
  seal: Object.freeze({ x: 16, y: 15 }), // casilla ancla del sprite 5×5 (fila inferior, centro)
  // Anclas del sello en triángulo; el orden correcto es el del camino: veta → ojo → gota.
  anchors: Object.freeze([
    Object.freeze({ id: 'ancla_veta', x: 11, y: 18, symbol: 'veta', order: 1 }),
    Object.freeze({ id: 'ancla_ojo', x: 16, y: 9, symbol: 'ojo', order: 2 }),
    Object.freeze({ id: 'ancla_gota', x: 21, y: 18, symbol: 'gota', order: 3 }),
  ]),
  columns: Object.freeze([[11, 10], [21, 10], [11, 22], [21, 22]]), // base de cada columna (1×3)
  portalBack: Object.freeze({ x: 16, y: 21 }), // portal de regreso (tras restaurar)
});
