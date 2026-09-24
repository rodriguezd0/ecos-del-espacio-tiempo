// Células de Zygarde del Bloque 9a (docs/CAMPANA.md §2.3): C041 bajo el andén abandonado de la Ruta 7 (etapa D, barro:
// Terreno complicado), C042 en el Parque de las Eras de Lúmina (D), C043 en el huerto de la Reserva del Delta (D),
// C071 en la laguna de la Reserva (F, Nadar) y C088 en el fondo de la laguna (G, Buceo; mapa `reserva_fondo`).
// Claves = las del registro global content/zygarde/cells.js. Ninguna es obligatoria.
import { cellEvent, collectCell } from './b01_cells.js';

export const B09A_CELLS = Object.freeze([
  { id: 'cell_ruta_7_1', code: 'C041', map: 'ruta_7', x: 38, y: 11, stage: 'D', required: false, where: 'bajo el andén abandonado, tras el barro' },
  { id: 'cell_lumina_1', code: 'C042', map: 'ciudad_lumina', x: 5, y: 42, stage: 'D', required: false, where: 'Parque de las Eras, entre la hierba alta junto a las estatuas' },
  { id: 'cell_reserva_1', code: 'C043', map: 'ruta_14_reserva', x: 51, y: 42, stage: 'D', required: false, where: 'huerto de la Reserva, bajo el manzano viejo' },
  { id: 'cell_reserva_2', code: 'C071', map: 'ruta_14_reserva', x: 45, y: 13, stage: 'F', required: false, where: 'laguna de la Reserva (Nadar)' },
  { id: 'cell_reserva_3', code: 'C088', map: 'reserva_fondo', x: 14, y: 6, stage: 'G', required: false, where: 'fondo de la laguna (Buceo)' },
].map((c) => Object.freeze(c)));

export function b09aCellsOf(mapId) {
  return B09A_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b09aCellEvents(mapId) {
  return b09aCellsOf(mapId).map((c) => cellEvent(c));
}

/** Casillas con célula de un mapa (para no poner otros eventos encima). */
export function b09aCellTiles(mapId) {
  return new Set(b09aCellsOf(mapId).map((c) => `${c.x},${c.y}`));
}

export { collectCell };
