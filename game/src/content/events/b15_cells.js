// Células de Zygarde del Bloque 15 (docs/CAMPANA.md §2.3, etapa H «tras P7»): C089–C090 en la nieve de la vertiente
// (Ruta 11), C091–C092 en la nieve profunda de la Ruta 13, C093 en el tejado del Observatorio Boreal, C094 en el lago
// helado de la Gruta Escarcha y C096 en un témpano del Mar Boreal. (C095 y C097–C100 son del B16.) Claves = las del
// registro global content/zygarde/cells.js. Los layouts son módulos puros sin eventos: no hay ciclos. Módulo puro.
import { cellEvent, collectCell } from './b01_cells.js';
import { RUTA11 } from '../maps/b15/layout_ruta11.js';
import { RUTA13 } from '../maps/b15/layout_ruta13.js';
import { TERRAZA } from '../maps/b15/layout_boreal.js';
import { ESCARCHA, MAR } from '../maps/b15/layout_escarcha.js';

export const B15_CELLS = Object.freeze([
  { id: 'cell_ruta_11_1', code: 'C089', map: 'ruta_11', ...RUTA11.cells.c089, stage: 'H', required: false, where: 'rincón de nieve honda del tramo bajo' },
  { id: 'cell_ruta_11_2', code: 'C090', map: 'ruta_11', ...RUTA11.cells.c090, stage: 'H', required: false, where: 'repisa alta, tras la roca nevada agrietada (Embestida)' },
  { id: 'cell_ruta_13_1', code: 'C091', map: 'ruta_13', ...RUTA13.cells.c091, stage: 'H', required: false, where: 'nieve honda del este, en el valle alto' },
  { id: 'cell_ruta_13_2', code: 'C092', map: 'ruta_13', ...RUTA13.cells.c092, stage: 'H', required: false, where: 'nieve honda del oeste, en el valle alto' },
  // El tejado del Observatorio es su terraza (mapa propio): el registro global lo sitúa en boreal_observatorio_terraza.
  { id: 'cell_boreal_1', code: 'C093', map: 'boreal_observatorio_terraza', ...TERRAZA.cell, stage: 'H', required: false, where: 'tejado del Observatorio Boreal (terraza de la cúpula)' },
  { id: 'cell_escarcha_1', code: 'C094', map: 'gruta_escarcha', ...ESCARCHA.cell, stage: 'H', required: false, where: 'repisa del lago helado (Nadar)' },
  { id: 'cell_mar_boreal_1', code: 'C096', map: 'mar_boreal', ...MAR.cell, stage: 'H', required: false, where: 'témpano grande del Mar Boreal (Nadar)' },
].map((c) => Object.freeze(c)));

export function b15CellsOf(mapId) {
  return B15_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b15CellEvents(mapId) {
  return b15CellsOf(mapId).map((c) => cellEvent(c));
}

export { collectCell };
