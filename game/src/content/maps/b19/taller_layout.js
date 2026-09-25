// Taller del Rey (docs/TABLILLAS.md T15: «La última tabla está donde el rey trabajó»): una sala excavada en la Peña del
// Rey, tileset 2 (Cueva1), 19×15. FUENTE ÚNICA de coordenadas del mapa `calzada_taller`. Módulo PURO.
// Suelo x 3–15, y 4–12 (paredes: 3 a los lados, 4 arriba, 1 abajo). Salida por la claridad del sur (empujar abajo).

export const W = 19;
export const H = 15;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });

export const FLOOR = Object.freeze({ x0: 3, y0: 4, x1: 15, y1: 12 });
/** Llegada desde la Peña y claridad de la salida (warp; se empuja hacia abajo desde la llegada). */
export const ENTRY = P(9, 12, 8);
export const DOOR = Object.freeze({ x: 9, y: 13 });

/** La hornacina de la Tabla Draco, en la pared norte (se lee desde (9,4) mirando arriba). */
export const NICHE = Object.freeze({ x: 9, y: 3, stand: P(9, 4, 8) });

/**
 * Piezas del taller (hoja b19_taller.png: índice = fila·4 + columna; fila por dirección 2/4/6/8). `wall`: en la pared
 * norte (se examinan desde la casilla de debajo).
 */
export const PIECES = Object.freeze([
  Object.freeze({ id: 'taller_cama_cabecera', piece: 4, x: 4, y: 5, look: 'cama' }),
  Object.freeze({ id: 'taller_cama_pies', piece: 5, x: 4, y: 6, look: 'cama' }),
  Object.freeze({ id: 'taller_banco_1', piece: 0, x: 12, y: 5, look: 'banco' }),
  Object.freeze({ id: 'taller_banco_2', piece: 1, x: 13, y: 5, look: 'banco' }),
  Object.freeze({ id: 'taller_sillares', piece: 2, x: 14, y: 8, look: 'sillares' }),
  Object.freeze({ id: 'taller_losa', piece: 3, x: 6, y: 3, look: 'losa', wall: true }),
  Object.freeze({ id: 'taller_cantaro', piece: 6, x: 3, y: 8, look: 'cantaro' }),
  Object.freeze({ id: 'taller_herramientas', piece: 7, x: 12, y: 3, look: 'herramientas', wall: true }),
]);

/** Casandra entra detrás del jugador (tras el combate de la Peña). */
export const CASANDRA = P(10, 11, 8);

/** Enlosado bajo la zona de trabajo (pilar_enlosado) y manchas de polvo de piedra. */
export const SLABS = Object.freeze({ x0: 7, y0: 4, x1: 11, y1: 7 });
