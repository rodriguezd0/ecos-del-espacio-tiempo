// Coordenadas de la Cueva del Tizón (docs/TABLILLAS.md T12: «la Cueva Volcán»; CAMPANA §1.4 Volcán Tizón, 3 mapas,
// tileset 13): vestíbulo y tres galerías de coladas (reglas y salas en content/events/b13_lava_logic.js), unidas por
// túneles (warps dentro del mismo mapa). Módulo puro.
import { ROOMS } from '../../events/b13_lava_logic.js';

export const W = 40;
export const H = 50;

/** Vestíbulo de entrada (suelo) y salas de las coladas (suelo, de b13_lava_logic.js). */
export const HALL = Object.freeze({ x0: 25, y0: 41, w: 10, h: 6 });
export const FLOORS = Object.freeze({ hall: HALL, 1: ROOMS[1].floor, 2: ROOMS[2].floor, 3: ROOMS[3].floor });

/**
 * Bocas y salidas (stamp de Cueva1 en la variante volcánica, esquina, casilla del warp) y a dónde llevan.
 * `arrive` = casilla de llegada en este mapa (o en otro con `map`).
 */
export const EXITS = Object.freeze({
  hallSouth: { stamp: 'salida_luz_sur_volcan', x: 29, y: 46, door: { x: 30, y: 47 }, map: 'volcan_tizon', arrive: { x: 21, y: 6, dir: 2 } },
  hallWest: { stamp: 'boca_oeste_volcan', x: 22, y: 43, door: { x: 24, y: 45 }, arrive: { x: 18, y: 43, dir: 4 } },
  r1East: { stamp: 'boca_este_volcan', x: 18, y: 41, door: { x: 19, y: 43 }, arrive: { x: 25, y: 45, dir: 6 } },
  r1North: { stamp: 'boca_norte_volcan', x: 10, y: 35, door: { x: 11, y: 37 }, arrive: { x: 8, y: 30, dir: 6 } },
  r2West: { stamp: 'boca_oeste_volcan', x: 5, y: 28, door: { x: 7, y: 30 }, arrive: { x: 11, y: 39, dir: 2 } },
  r2North: { stamp: 'boca_norte_volcan', x: 19, y: 18, door: { x: 20, y: 20 }, arrive: { x: 10, y: 14, dir: 6 } },
  r3West: { stamp: 'boca_oeste_volcan', x: 7, y: 12, door: { x: 9, y: 14 }, arrive: { x: 20, y: 22, dir: 2 } },
  r3North: { stamp: 'salida_luz_norte_volcan', x: 27, y: 1, door: { x: 28, y: 3 }, map: 'tizon_crater', arrive: { x: 20, y: 44, dir: 8 } },
});

/** En qué sala cae cada llegada (para reiniciar las demás al entrar: «se reinician al salir de la sala»). */
export function roomAt(x, y) {
  for (const [k, f] of Object.entries(FLOORS)) {
    if (x >= f.x0 - 1 && x <= f.x0 + f.w && y >= f.y0 - 1 && y <= f.y0 + f.h) return k === 'hall' ? 'hall' : Number(k);
  }
  return null;
}

/** Técnica de la perforación en el vestíbulo y objetos de la cueva. */
export const TECH = Object.freeze({ id: 'tecnica_perforacion', trainer: 'b13_tecnica_perforacion', name: 'Técnica Olaia', x: 28, y: 42, dir: 2, sight: 4 });
export const ITEMS = Object.freeze([
  { id: 'objeto_cueva_1', x: 30, y: 41, item: 'CHARCOAL' },
  { id: 'objeto_cueva_2', x: 17, y: 46, item: 'MAXREVIVE', hidden: true },
  { id: 'objeto_cueva_3', x: 30, y: 23, item: 'MAGMARIZER' },
  { id: 'objeto_cueva_4', x: 28, y: 6, item: 'FIRESTONE' },
]);

export const START = Object.freeze({ x: 30, y: 46, dir: 8 });
