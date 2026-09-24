// Coordenadas de la Ruta 4 (B05; CAMPANA §1.4: «Vega inundable y subida a la meseta», 80×30, tileset 1).
// Fuente única para el constructor (ruta_4_build.js), los eventos (content/events/b05_ruta4.js) y el README.
// Oeste: Ciudad Caudal (B03) · río con el VADO (cerrado hasta p2_restored) · vega baja · dos terrazas (T1, T2)
// que suben a la meseta · este: Villa Brontia. Módulo puro.

export const W = 80;
export const H = 30;

/** Anchura del río por fila: [x0, x1] (el vado cruza las filas de la carretera). */
export function riverSpan(y) {
  if (y <= 7) return [9, 14];
  if (y <= 21) return [10, 15];
  if (y <= 22) return [11, 16];
  return [11, 18]; // poza del sur (C073, con Nadar)
}

/** Vado de la Ruta 4 (G2, CAMPANA §2.5): filas de la carretera sobre el río. */
export const FORD = Object.freeze({ x0: 10, x1: 15, y0: 13, y1: 16 });

/** Entrada oeste (desde Ciudad Caudal) y salida este (a Villa Brontia, sobre la terraza T2). */
export const WEST_ENTRY = Object.freeze({ x: 0, y0: 14, y1: 15, width: 6 }); // se ensancha a y 13–16 en x 6
export const EAST_EXIT = Object.freeze({ x: W - 1, y0: 4, y1: 7 });

/** Terrazas de la subida (se extienden fuera del mapa por el norte y el este: sin muro en esos bordes). */
export const T1 = Object.freeze({ x: 42, y: -3, w: W - 42 + 3, h: 23 }); // cara sur en y 17–19
export const T2 = Object.freeze({ x: 58, y: -3, w: W - 58 + 3, h: 15 }); // cara sur en y 9–11
export const STAIRS_T1 = Object.freeze({ stamp: 'escalera_terraza_ancha', x: 46, y: 17 });
export const STAIRS_T2 = Object.freeze({ stamp: 'escalera_terraza', x: 63, y: 9 });

/** Rincón del sureste tras la roca agrietada (roca de tutorial de Embestida, C026 y la Heracrossita). */
export const NOOK = Object.freeze({ x0: 71, y0: 20, x1: 79, y1: 29, rock: { x: 70, y: 24 } });
export const HOLLOW_TREE = Object.freeze({ stamp: 'arbol', x: 75, y: 20, trunk: { x: 75, y: 23 } });

/** Árbol de miel (vega sur) y hierba que se agita (Audino). */
export const HONEY_TREE = Object.freeze({ stamp: 'arbol', x: 57, y: 21, trunk: { x: 57, y: 24 } });
export const RUSTLE = Object.freeze([{ x: 62, y: 26 }, { x: 53, y: 25 }, { x: 33, y: 25 }]); // siempre en hierba alta

/** Casa de labranza de la vega (decorativa, con su huerto). */
export const FARM = Object.freeze({ stamp: 'casa_rosa', x: 33, y: 14, door: { x: 34, y: 17 } });

/** Carteles. */
export const SIGNS = Object.freeze({
  west: { x: 7, y: 11 },
  ford: { x: 17, y: 12 },
  east: { x: 76, y: 8 },
  climb: { x: 52, y: 19 },
});
