// Células de Zygarde del Bloque 10 (docs/CAMPANA.md §2.3): C045 en el bambú tras la casa de té (etapa D), C046 en la
// Estancia de los Rollos del Archivo Hondo (etapa D, obligatoria) y C074 en el estanque de lotos (etapa F: solo se
// llega nadando). Claves = las del registro global content/zygarde/cells.js.
import { cellEvent, collectCell } from './b01_cells.js';
import { BAMBOO, POND } from '../maps/b10/mnemos_layout.js';
import { HONDO } from '../maps/b10/hondo_layout.js';

export const B10_CELLS = Object.freeze([
  { id: 'cell_mnemos_1', code: 'C045', map: 'aldea_mnemos', x: BAMBOO.clearing.x, y: BAMBOO.clearing.y, stage: 'D', required: false, where: 'claro del bambú, tras la casa de té' },
  { id: 'cell_memoria_1', code: 'C046', map: 'archivo_hondo', x: HONDO.rollos.cell.x, y: HONDO.rollos.cell.y, stage: 'D', required: true, where: 'Estancia de los Rollos, paso tras la estantería' },
  { id: 'cell_mnemos_2', code: 'C074', map: 'aldea_mnemos', x: POND.islet.x, y: POND.islet.y, stage: 'F', required: false, where: 'islote del estanque de lotos (Nadar)' },
].map((c) => Object.freeze(c)));

export function b10CellsOf(mapId) {
  return B10_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b10CellEvents(mapId) {
  return b10CellsOf(mapId).map((c) => cellEvent(c));
}

export { collectCell };
