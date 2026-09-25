// Células de Zygarde del Bloque 12 (docs/CAMPANA.md §2.3): C050–C051 en el Monte del Portal (explanada quemada;
// mitad de la escalinata, obligatoria), C052–C053 en el Pilar Invertido (La Cara Vuelta, en el gemelo girado de la
// segunda sala; El Sumidero) y C076 en la poza al pie de la gran cascada (etapa F: Nadar). Claves = las del registro
// global content/zygarde/cells.js. Módulo puro.
import { cellEvent } from './b01_cells.js';
import { MONTE, SUMIDERO } from '../maps/b12/layout.js';
import { facetRoom, facetMapId, MARGIN } from '../maps/b12/rooms.js';
import { facetMasks } from '../../world/impossible/logic.js';

/** Casilla de C052 en el mapa gemelo de la segunda sala (la célula está en la repisa que solo existe girada). */
function caraCell() {
  const room = facetRoom('cara_2');
  const [x, y] = facetMasks(room, room.cellOrient, MARGIN).map(room.cell.x, room.cell.y);
  return { map: facetMapId('cara_2', room.cellOrient), x, y };
}

const C052 = caraCell();

export const B12_CELLS = Object.freeze([
  { id: 'cell_monte_1', code: 'C050', map: 'montana_portal', ...MONTE.cells.C050, stage: 'E', required: false, where: 'explanada quemada, entre las marcas del combate del prólogo' },
  { id: 'cell_monte_2', code: 'C051', map: 'montana_portal', ...MONTE.cells.C051, stage: 'E', required: true, where: 'mitad de la escalinata, entre el segundo y el tercer tramo' },
  { id: 'cell_invertido_1', code: 'C052', map: C052.map, x: C052.x, y: C052.y, stage: 'E', required: true, where: 'La Cara Vuelta: repisa de la segunda sala que solo existe en el gemelo girado' },
  { id: 'cell_invertido_2', code: 'C053', map: 'pilar_invertido_sumidero', ...SUMIDERO.cell, stage: 'E', required: true, where: 'El Sumidero: isla alta, junto al tercer pulsador' },
  { id: 'cell_monte_3', code: 'C076', map: 'montana_portal', ...MONTE.cells.C076, stage: 'F', required: false, where: 'poza al pie de la gran cascada (Nadar)' },
].map((c) => Object.freeze(c)));

export function b12CellsOf(mapId) {
  return B12_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque (opts.when: condición extra de aparición). */
export function b12CellEvents(mapId, extra = {}) {
  return b12CellsOf(mapId).map((c) => cellEvent(c, extra));
}
