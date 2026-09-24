// Células de Zygarde del Bloque 2 (docs/CAMPANA.md §2.3, DECIDIDO-DEV D10): C008 en la calle principal de Villa
// Zaguán junto a la Arboleda, C009 la entrega Casilda por guion (no es evento del mundo) y C010–C012 en las Ruinas
// del Dintel (Antesala, Galería de los Dinteles y Cámara de Geodude). Claves = registro global
// content/zygarde/cells.js; aquí se fijan las CASILLAS. Módulo puro.
import { cellEvent } from './b01_cells.js';
import { CELL_C008 } from '../maps/b02/villa_zaguan_layout.js';
import { ANTESALA, CAMARA } from '../maps/b02/ruinas_dintel_layout.js';

export const B02_CELLS = Object.freeze([
  { id: 'cell_zaguan_1', code: 'C008', map: 'villa_zaguan', x: CELL_C008.x, y: CELL_C008.y, stage: 'A', required: true, where: 'calle principal, junto a la Arboleda' },
  { id: 'cell_umbral_1', code: 'C010', map: 'ruinas_dintel', x: ANTESALA.cell.x, y: ANTESALA.cell.y, stage: 'A', required: true, where: 'Antesala (camino de la entrada a la Galería)' },
  { id: 'cell_umbral_2', code: 'C011', map: 'ruinas_dintel', x: 5, y: 21, stage: 'A', required: true, where: 'Galería de los Dinteles (junto al estanque quieto)' },
  { id: 'cell_umbral_3', code: 'C012', map: 'ruinas_dintel', x: CAMARA.cell.x, y: CAMARA.cell.y, stage: 'A', required: true, where: 'Cámara de Geodude' },
].map(Object.freeze));

/** Célula que entrega Casilda por guion al aceptar acompañarte (C009). */
export const C009 = Object.freeze({ id: 'cell_zaguan_2', code: 'C009' });

/** Células del bloque en un mapa. */
export function b02CellsOf(mapId) {
  return B02_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula (tipo zygardeCell con la reacción del Core de B01) de un mapa. */
export function b02CellEvents(mapId) {
  return b02CellsOf(mapId).map((c) => cellEvent(c));
}
