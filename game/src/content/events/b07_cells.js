// Células de Zygarde del Bloque 7 (docs/CAMPANA.md §2.3): C035 (etapa D) en el bancal alto de la Cantería, al que
// solo se sube cruzando el barro (Terreno complicado), y C056 (etapa E) en la repisa de la pared del cañón (Trepar,
// al volver). Claves = las del registro global content/zygarde/cells.js; casillas en maps/b07/layout.js.
import { cellEvent } from './b01_cells.js';
import { RUTA6, CANTERIA } from '../maps/b07/layout.js';

export const B07_CELLS = Object.freeze([
  { id: 'cell_ruta_6_1', code: 'C035', map: 'ruta_6', x: CANTERIA.cell.x, y: CANTERIA.cell.y, stage: 'D', required: false, where: 'bancal alto de la Cantería, tras el barro' },
  { id: 'cell_ruta_6_2', code: 'C056', map: 'ruta_6', x: RUTA6.wallLedge.cell.x, y: RUTA6.wallLedge.cell.y, stage: 'E', required: false, where: 'repisa de la pared del cañón (Trepar)' },
].map((c) => Object.freeze(c)));

export function b07CellsOf(mapId) {
  return B07_CELLS.filter((c) => c.map === mapId);
}

export function b07CellEvents(mapId) {
  return b07CellsOf(mapId).map((c) => cellEvent(c));
}
