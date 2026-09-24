// Células de Zygarde del Bloque 5 (docs/CAMPANA.md §2.3; claves del registro content/zygarde/cells.js).
// Aquí se fijan las CASILLAS. Etapas: C tras P2 / Embestida · F Nadar.
//   C025 cell_ruta_4_1  Ruta 4, vega sur (junto al árbol de miel; a menos de 20 casillas de la roca de tutorial de
//                       Embestida, CAMPANA §2.1: suele ser la 18.ª célula)
//   C026 cell_ruta_4_2  Ruta 4, rincón tras la roca agrietada (Embestida)
//   C027 cell_brontia_1 Villa Brontia, molino de la puerta atascada (Embestida; aparece al abrir la puerta)
//   C073 cell_ruta_4_3  Ruta 4, poza del río (Nadar)
// Módulo puro (se importa en Node).
import { afterCell } from './b01_cells.js';

export const B05_CELLS = Object.freeze([
  { id: 'cell_ruta_4_1', code: 'C025', map: 'ruta_4', x: 56, y: 26, stage: 'C', where: 'vega sur, junto al árbol de miel' },
  { id: 'cell_ruta_4_2', code: 'C026', map: 'ruta_4', x: 77, y: 27, stage: 'C', where: 'rincón tras la roca agrietada (Embestida)' },
  { id: 'cell_brontia_1', code: 'C027', map: 'villa_brontia', x: 39, y: 11, stage: 'C', where: 'molino de la puerta atascada (Embestida; sale al abrir la puerta)' },
  { id: 'cell_ruta_4_3', code: 'C073', map: 'ruta_4', x: 16, y: 26, stage: 'F', where: 'poza del río (Nadar)' },
]);

export function cellsOf(mapId) {
  return B05_CELLS.filter((c) => c.map === mapId);
}

export function cellById(id) {
  return B05_CELLS.find((c) => c.id === id) || null;
}

/** Evento de célula (tipo `zygardeCell`; reacción del Core al recogerla). `extra.when` añade una condición. */
export function cellEvent(cell, extra = {}) {
  return { id: cell.id, type: 'zygardeCell', x: cell.x, y: cell.y, cell: cell.id, onFound: afterCell, ...extra };
}
