// Células de Zygarde del Bloque 6 (docs/CAMPANA.md §2.3, etapa C): C028 en la Ruta 5 tras los troncos,
// C029–C032 liberadas por guion al romper el Colector del Parque Eólico, C033 en la Galería de las Flechas y
// C034 en la Sala de las Campanas. Claves = las del registro global content/zygarde/cells.js.
// Las casillas de C033/C034 salen de las salas ASCII (content/events/b06_wind_rooms.js).
import { cellEvent, collectCell } from './b01_cells.js';
import { FLECHAS, CAMPANAS, marksInMap } from './b06_wind_rooms.js';
import { GALERIAS, ANILLO } from '../maps/b06/layout.js';

const [c033] = marksInMap(FLECHAS, 'C', GALERIAS.flechas.ox, GALERIAS.flechas.oy);
const [c034] = marksInMap(CAMPANAS, 'C', ANILLO.sala.ox, ANILLO.sala.oy);

export const B06_CELLS = Object.freeze([
  { id: 'cell_ruta_5_1', code: 'C028', map: 'ruta_5', x: 41, y: 5, stage: 'C', required: false, where: 'hondonada del norte, tras un tronco rajado' },
  { id: 'cell_impulso_1', code: 'C033', map: 'galerias_soplo', x: c033[0], y: c033[1], stage: 'C', required: true, where: 'Galería de las Flechas, único paso al río de viento' },
  { id: 'cell_impulso_2', code: 'C034', map: 'anillo_vientos', x: c034[0], y: c034[1], stage: 'C', required: true, where: 'Sala de las Campanas, camino de la campana Norte' },
].map((c) => Object.freeze(c)));

/** Células del Colector (C029–C032): se entregan por guion al romperse la esfera. */
export const COLECTOR_CELLS = Object.freeze(['cell_colector_1', 'cell_colector_2', 'cell_colector_3', 'cell_colector_4']);

export function b06CellsOf(mapId) {
  return B06_CELLS.filter((c) => c.map === mapId);
}

/** Eventos de célula de un mapa del bloque. */
export function b06CellEvents(mapId) {
  return b06CellsOf(mapId).map((c) => cellEvent(c));
}

/** Entrega por guion las cuatro células del Colector (sin reacción del Core entre medias). → nuevas */
export async function collectColectorCells(ctx) {
  let n = 0;
  for (const id of COLECTOR_CELLS) {
    if (ctx.state.hasCell(id)) continue;
    ctx.state.addCell(id);
    n += 1;
  }
  ctx.requestRefresh?.();
  return n;
}

export { collectCell };
