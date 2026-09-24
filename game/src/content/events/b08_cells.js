// Células de Zygarde del Bloque 8 (docs/CAMPANA.md §2.3, etapa D): C036 en la veta de cristal de la Mina Galena,
// C037–C038 en la ceniza honda de las Dunas (Terreno complicado) y C039–C040 en el Pilar de la Masa (galería inferior,
// a la que se cae desde el suelo quebradizo, y junto a la Gran Balanza). Claves = las del registro global
// content/zygarde/cells.js. Las casillas de la Cámara salen de su trazado (b08_balance_logic.js).
import { cellEvent, collectCell } from './b01_cells.js';
import { SPOTS } from './b08_balance_logic.js';
import { MINA, DUNAS } from '../maps/b08/layout.js';

export const B08_CELLS = Object.freeze([
  { id: 'cell_mina_galena_1', code: 'C036', map: 'mina_galena', x: MINA.cell.x, y: MINA.cell.y, stage: 'D', required: false, where: 'veta de cristal de la Mina Galena' },
  { id: 'cell_dunas_1', code: 'C037', map: 'dunas_ceniza', x: DUNAS.ashFields[0].cell.x, y: DUNAS.ashFields[0].cell.y, stage: 'D', required: false, where: 'campo de ceniza honda del centro' },
  { id: 'cell_dunas_2', code: 'C038', map: 'dunas_ceniza', x: DUNAS.ashFields[1].cell.x, y: DUNAS.ashFields[1].cell.y, stage: 'D', required: false, where: 'campo de ceniza honda del sureste' },
  { id: 'cell_masa_1', code: 'C039', map: 'camara_contrapesos', x: SPOTS.c039.x, y: SPOTS.c039.y, stage: 'D', required: true, where: 'galería inferior (bajo el suelo quebradizo)' },
  { id: 'cell_masa_2', code: 'C040', map: 'camara_contrapesos', x: SPOTS.c040.x, y: SPOTS.c040.y, stage: 'D', required: true, where: 'junto a la Gran Balanza' },
].map((c) => Object.freeze(c)));

export function b08CellsOf(mapId) {
  return B08_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b08CellEvents(mapId) {
  return b08CellsOf(mapId).map((c) => cellEvent(c));
}

export { collectCell };
