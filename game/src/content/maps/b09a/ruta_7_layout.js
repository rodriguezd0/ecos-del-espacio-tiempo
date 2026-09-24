// Ruta 7 (CAMPANA §1.4: 90×30, tileset 5 Exterior3): valle ferroviario al sur de la Sima. FUENTE ÚNICA de las
// coordenadas del mapa (camino, vía, andén abandonado, Paso del Derrumbe, salidas y personajes). La usan la
// construcción (ruta_7_build.js), la definición (ruta_7.js), los eventos (content/events/b09a_ruta7.js) y las pruebas.
//
// El camino entra desde Ciudad Lúmina por el oeste (y 20–23), serpentea por el fondo del valle y sale hacia Ciudad
// Estrato por el este (y 16–19) cruzando el Paso del Derrumbe (x 72–81), que los mineros despejan con p4_restored.
// La vía del tren corre por el norte (y 5) al pie de los riscos de la Sima; el apeadero abandonado queda al sur de la
// vía, con un hueco embarrado bajo el andén (C041, Terreno complicado). Al norte, en x 60–63, el sendero del
// Mirador de la Calzada (B19), cerrado.
import { INTERNAL, PENDING_LINKS } from './links.js';

export const W = 90;
export const H = 30;

export const EXITS = Object.freeze({
  west: { x: 0, y0: 20, y1: 23, offset: INTERNAL.ruta7ToLumina }, // Ciudad Lúmina
  east: { x: 89, y0: 16, y1: 19, offset: PENDING_LINKS.ruta_7.ciudad_estrato.offset }, // Ciudad Estrato (B08)
  north: { y: 0, x0: 60, x1: 63, offset: PENDING_LINKS.ruta_7.calzada_rey.offset, gate: { x: 60, y: 1 } }, // Calzada (B19)
});

/** Tramos del camino de tierra (rectángulos [x, y, w, h]). */
export const PATH = Object.freeze([
  [0, 20, 17, 4], [14, 15, 4, 9], [14, 15, 27, 4], [37, 15, 4, 8], [37, 19, 26, 4], [59, 12, 4, 11], [59, 16, 31, 4],
  [60, 0, 4, 12], // sendero del Mirador de la Calzada (cruza la vía por un paso a nivel)
]);

/** Riscos del norte (la Sima) y macizos del Paso del Derrumbe. [x, y, w, h] convexos para el brush `acantilado`. */
export const CLIFFS = Object.freeze([
  [0, 0, 60, 4], [64, 0, 26, 4], // pared norte (con el hueco del sendero de la Calzada)
  [72, 7, 10, 8], // macizo norte del paso
  [72, 21, 10, 9], // macizo sur del paso
]);

/** Vía del tren: fila, pasos a nivel (sin valla) y vallas a ambos lados. */
export const RAIL = Object.freeze({
  y: 5, x0: 0, x1: 89,
  crossings: [60, 61, 62, 63],
  fenceN: 4, fenceS: 6,
});

/** Apeadero abandonado: andén elevado (terraza) al sur de la vía, escalera y hueco embarrado debajo. */
export const PLATFORM = Object.freeze({
  terrace: { x: 34, y: 6, w: 14, h: 5 }, // superficie y 6–7, cara y 8–10
  stairs: { x: 44, y: 8 }, // escalera_terraza (3×3) en la cara
  mud: { x: 36, y: 11, w: 6, h: 2 }, // barro al pie del andén (Terreno complicado)
  lamps: [[35, 6], [42, 6]],
  sign: { x: 39, y: 6 },
});

/** Paso del Derrumbe: corredor entre los dos macizos y cascotes que lo cierran hasta p4_restored. */
export const PASS = Object.freeze({
  x0: 72, x1: 81, y0: 15, y1: 20,
  rubble: { x0: 76, x1: 77, y0: 15, y1: 20 },
  railRubble: [76, 77, 78],
  minersBefore: [{ x: 79, y: 17, dir: 4 }, { x: 80, y: 19, dir: 4 }],
  minersAfter: [{ x: 70, y: 16, dir: 2 }, { x: 71, y: 20, dir: 8 }],
});

/** Hierba alta (encuentros) y matas donde se agita la hierba (Audino). */
export const GRASS = Object.freeze([
  [2, 9, 10, 8], [18, 19, 16, 5], [42, 12, 15, 5], [48, 8, 6, 3], [64, 21, 7, 3], [83, 21, 6, 3], [24, 7, 8, 3],
]);
export const RUSTLE = Object.freeze([{ x: 6, y: 13 }, { x: 49, y: 14 }, { x: 66, y: 22 }]);

/** Estanque junto al camino. */
export const POND = Object.freeze({ x: 19, y: 9, w: 7, h: 4 });

export const SPOTS = Object.freeze({
  signWest: { x: 3, y: 19 },
  signEast: { x: 86, y: 15 },
  signNorth: { x: 58, y: 8 },
  railway: { x: 43, y: 12, dir: 8 }, // ferroviaria al pie del andén (el andén es de una sola fila)
});
