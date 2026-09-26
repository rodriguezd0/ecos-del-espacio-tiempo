// Coordenadas del Islote Lumbre y de la Gruta de la Luna (docs/CAMPANA.md §1.4: islote de cerezos y farolillos, 24×24,
// tileset 9, Pokeflauta; TABLILLAS T11). El islote cuelga del borde sur del Mar del Sur (x 20–43 del mar = x 0–23 de
// aquí): se llega nadando desde el norte a la playa. Módulo puro.
//   Torii en la playa del norte · prado con el corro de ocho piedras (baile de los Clefairy, b13_dance_logic.js) ·
//   farolillos · cuatro cerezos · la peña de la luna que cierra la gruta (sur) · banco en la playa del sur.
import { stoneAt } from '../../events/b13_dance_logic.js';

export const W = 24;
export const H = 24;

/** Borde norte: conexión simétrica con el Mar del Sur (su x 20 cae en nuestra x 0). */
export const SEA_LINK = Object.freeze({ to: 'mar_del_sur', offset: -20 });

/** Isla (rectángulo: el pincel `playa` redondea las esquinas con espuma) y prado interior. */
export const ISLAND = Object.freeze({ x: 2, y: 4, w: 20, h: 17 });
export const MEADOW = Object.freeze({ x: 4, y: 6, w: 16, h: 13 });

/** Corro de piedras del baile (centro) y el Clefairy que dirige. */
export const RING_CENTER = Object.freeze({ x: 11, y: 12 });
export const STONES = Object.freeze(Array.from({ length: 8 }, (_, i) => stoneAt(RING_CENTER.x, RING_CENTER.y, i)));

/**
 * Peña de la luna (sprite 3×3) que cierra la gruta; la boca da al SUR (a la playa): se entra desde (11, 19) y se sale a
 * ella. El cuerpo de la roca (x 10–12, y 16–18) no se pisa.
 */
export const MOON_ROCK = Object.freeze({ x: 11, y: 18, w: 3 });
export const MOON_ROCK_FRONT = Object.freeze({ x: 11, y: 19, dir: 2 });
export const GROTTO_ENTRY = Object.freeze({ x: 9, y: 12 }); // llegada en lumbre_gruta

export const TORII = Object.freeze({ stamp: 'torii_rosa', x: 8, y: 2 });
export const LANTERNS = Object.freeze([[8, 8], [15, 8], [8, 15], [15, 15], [8, 18], [14, 18]]);
/** Cerezos simétricos (5×6) en dos pisos que no se tocan (filas 7–12 y 13–18), junto a los farolillos y sin pisarlos. */
export const TREES = Object.freeze([['cerezo', 3, 7], ['cerezo', 16, 7], ['cerezo', 3, 13], ['cerezo', 16, 13]]);
export const GRASS = Object.freeze([[4, 6, 3, 1], [17, 6, 3, 1], [8, 17, 1, 1]]);
/** Flores sueltas del prado (1×1, pisables): sin «corros» de pétalos en cuadro, que dejaban un marco rosa. */
export const FLOWERS = Object.freeze([
  ['flores_rosas', 8, 11], ['flores_rosas', 15, 9], ['flores_rosas', 8, 16], ['flores_rosas', 14, 16], ['flores_rosas', 15, 13],
  ['flores_rosas', 10, 8], ['flores_blancas', 8, 10], ['flores_blancas', 15, 10], ['flores_blancas', 9, 8], ['flores_blancas', 13, 17],
]);
export const STONE_LANTERNS = Object.freeze([[5, 5], [18, 5], [3, 19], [20, 19]]);
export const BENCH = Object.freeze({ x: 14, y: 19 }); // banco 3×1 en la playa del sur (x 14–16)

/** Barca de remos de Lucía varada en la playa del oeste (hasta que vuelve a Caleta). */
export const ROWBOAT = Object.freeze({ x: 0, y: 11 });

export const TRAINER = Object.freeze({ id: 'dama_hortensia', trainer: 'b13_dama_hortensia', name: 'Dama Hortensia', x: 16, y: 11, dir: 4, sight: 3 });
export const ITEMS = Object.freeze([
  { id: 'objeto_lumbre_1', x: 18, y: 19, item: 'MOONSTONE', hidden: true }, // junto al farol de piedra del sureste
  { id: 'objeto_lumbre_2', x: 7, y: 17, item: 'STARDUST' },
]);

export const START = Object.freeze({ x: 11, y: 6, dir: 2 });

// ── Gruta de la Luna (lumbre_gruta, tileset 14) ────────────────────────────────────────────
export const GROTTO = Object.freeze({
  width: 18, height: 15,
  room: { x: 3, y: 4, w: 12, h: 9 }, // suelo x 3–14, y 4–12 (paredes alrededor)
  exit: { x: 9, y: 12 }, // salida de luz en la pared sur (casilla del warp: y 13)
  pool: { x: 5, y: 6, w: 4, h: 3 },
  pedestal: { x: 11, y: 6 }, // pedestal con la Tabla Duende
  lucia: { x: 7, y: 10, dir: 8 },
  cell: { key: 'cell_lumbre_1', x: 13, y: 10 },
  moonbeam: { x: 7, y: 7 },
});
