// Células de Zygarde del Bloque 11 (docs/CAMPANA.md §2.3): C007 en la orilla del Albo (Ruta 10 baja, etapa A),
// C047–C048 en el Bosque Neblino (copa del tronco hueco y repisa de cristal, Trepar), C049 en la pared de raíces
// de la Ruta 10 alta y C054 en la cornisa del Cerro del Alba (etapa E). Claves = las del registro global
// content/zygarde/cells.js. Módulo puro.
import { cellEvent, collectCell } from './b01_cells.js';
import { RUTA10, NEBLINO, CERRO } from '../maps/b11/layout.js';

export const B11_CELLS = Object.freeze([
  { id: 'cell_ruta_10_1', code: 'C007', map: 'ruta_10', x: 11, y: 27, stage: 'A', required: false, where: 'orilla del Albo, junto a la pradera del tramo bajo' },
  { id: 'cell_neblino_1', code: 'C047', map: 'ruta_9_neblino', x: NEBLINO.hollow.to[0], y: NEBLINO.hollow.to[1] - 1, stage: 'E', required: false, where: 'copa del tronco hueco, en lo alto de la loma (Trepar)' },
  { id: 'cell_neblino_2', code: 'C048', map: 'ruta_9_neblino', x: 42, y: 37, stage: 'E', required: false, where: 'repisa de cristal (Trepar)' },
  { id: 'cell_ruta_10_2', code: 'C049', map: 'ruta_10', x: RUTA10.ledge.to[0] - 1, y: RUTA10.ledge.to[1] - 1, stage: 'E', required: false, where: 'repisa de la pared de raíces (Trepar)' },
  { id: 'cell_cerro_alba_1', code: 'C054', map: 'cerro_alba', x: CERRO.cell.x, y: CERRO.cell.y, stage: 'E', required: false, where: 'cornisa del Cerro del Alba (Trepar)' },
].map((c) => Object.freeze(c)));

export function b11CellsOf(mapId) {
  return B11_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b11CellEvents(mapId) {
  return b11CellsOf(mapId).map((c) => cellEvent(c));
}

export { collectCell };
