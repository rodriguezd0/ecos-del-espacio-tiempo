// Coordenadas del bosque de algas de Caleta Sonda (docs/CAMPANA.md §2.3: C086 «Caleta Sonda · Bosque de algas»,
// etapa G, Buceo). Mapa submarino propio (como el Pozo del Albo de B04) bajo el remolino de la caleta. Módulo puro.
export const W = 28;
export const H = 20;

/** Llegada al bucear (y salida a la superficie en la misma casilla). */
export const ALGAS_ENTRY = Object.freeze({ x: 5, y: 10, dir: 6 });
/** Vuelta a la superficie: el remolino de Caleta Sonda (caleta_layout.js DIVERS.kelpDive). */
export const SURFACE = Object.freeze({ map: 'caleta_sonda', x: 31, y: 28, dir: 2 });

export const ROOM = Object.freeze({ x: 3, y: 4, w: 22, h: 13 });
export const SHALLOW = Object.freeze([[3, 8, 5, 5]]);
export const VENT = Object.freeze({ x: 14, y: 12 });
export const CELL = Object.freeze({ x: 22, y: 7 }); // C086
/** Matas de algas (mata de roca 2×2) y rocas. */
export const KELP = Object.freeze([[8, 5], [11, 7], [9, 13], [13, 5], [16, 9], [18, 13], [20, 5], [22, 11], [12, 10], [17, 6]]);
export const ROCKS = Object.freeze([[6, 5], [15, 14], [21, 14], [19, 9]]);
export const ITEMS = Object.freeze([{ id: 'perla_algas', x: 19, y: 11, item: 'BIGPEARL', hidden: true }]);
