// Células de Zygarde del Bloque 1 (docs/CAMPANA.md §2.3, DECIDIDO-DEV D10): C001 en el parterre central de
// Villa Alba (escena forzada al salir del laboratorio con la Pokédex) y C002–C006 + C024 en la Ruta 1.
// Clave de evento persistente = id de célula (`cell_<mapa>_<n>`), la misma del registro global
// content/zygarde/cells.js (agente zygarde); aquí se fijan las CASILLAS del bloque. Los eventos usan el tipo
// `zygardeCell` (world/zygarde/eventTypes.js: texto «(n/100)» y comprobación de progresión al recoger).
// Módulo puro (se importa en Node).

/** Total de células del juego (biblia §8). */
export const CELL_TOTAL = 100;
const GREEN = [185, 255, 102];

/**
 * Catálogo del bloque: id, código del catálogo, mapa, casilla, etapa (A sin capacidad, B Correr) y si está
 * en el camino obligatorio. La escena de C001 la dirige content/events/b01_town_cell.js.
 */
export const B01_CELLS = Object.freeze([
  { id: 'cell_villa_alba_1', code: 'C001', map: 'villa_alba', x: 22, y: 16, stage: 'A', required: true, where: 'parterre central (escena forzada con la Pokédex)' },
  { id: 'cell_ruta_1_1', code: 'C002', map: 'ruta_1', x: 14, y: 19, stage: 'A', required: true, where: 'puente de troncos del primer arroyo (paso único)' },
  { id: 'cell_ruta_1_2', code: 'C003', map: 'ruta_1', x: 13, y: 27, stage: 'A', required: true, where: 'estrechamiento entre rocas junto a la hierba alta' },
  { id: 'cell_ruta_1_3', code: 'C004', map: 'ruta_1', x: 11, y: 46, stage: 'A', required: true, where: 'junto al Bichero Luis (el camino pasa a su lado)' },
  { id: 'cell_ruta_1_4', code: 'C005', map: 'ruta_1', x: 16, y: 56, stage: 'A', required: true, where: 'junto al cartel del Pilar del Umbral' },
  { id: 'cell_ruta_1_5', code: 'C006', map: 'ruta_1', x: 24, y: 32, stage: 'A', required: false, where: 'claro del este' },
  { id: 'cell_ruta_1_6', code: 'C024', map: 'ruta_1', x: 22, y: 8, stage: 'B', required: false, where: 'mirador, tras la cuesta de grava (Correr)' },
]);

/** Células del bloque en un mapa. */
export function cellsOf(mapId) {
  return B01_CELLS.filter((c) => c.map === mapId);
}

/** Texto al recoger una célula, con el recuento "(n/100)". */
export function cellFoundText(state) {
  const n = state?.data?.zygarde?.cells?.length ?? 0;
  return `Has encontrado una Célula de Zygarde. (${n}/${CELL_TOTAL})`;
}

/**
 * Destello breve de obtención al recoger una célula. Sin reacción ni gratitud del Core (autor, 25-09-2026:
 * «tampoco que cada vez que agarres una célula te diga "Una parte de mí, gracias"»).
 */
export async function afterCell(ctx) {
  await ctx.flash(GREEN, 12, 90);
}

/**
 * Evento de célula (tipo `zygardeCell`). `extra.when(state)` añade una condición de aparición (p. ej. C001
 * solo tras recibir la Pokédex). El texto con el recuento lo pone el tipo; después, el destello de obtención.
 */
export function cellEvent(cell, extra = {}) {
  return { id: cell.id, type: 'zygardeCell', x: cell.x, y: cell.y, cell: cell.id, onFound: afterCell, ...extra };
}

/** Comprobación de progresión de Zygarde (world/zygarde/scenes.js), tolerante si el sistema no está. */
async function checkProgress(ctx) {
  try {
    const mod = await import('../../world/zygarde/scenes.js');
    await mod.checkZygardeProgress?.(ctx);
  } catch (err) {
    console.warn('[b01] Progresión de Zygarde no disponible', err);
  }
}

/**
 * Recoge una célula desde un guion (escenas forzadas): mismo efecto que pisarla (texto con el recuento, destello
 * y progresión). Devuelve false si ya estaba.
 */
export async function collectCell(ctx, id) {
  if (ctx.state.hasCell(id)) return false;
  ctx.state.addCell(id);
  ctx.se('Mining item get');
  ctx.requestRefresh();
  await ctx.say(cellFoundText(ctx.state));
  await afterCell(ctx);
  await checkProgress(ctx);
  return true;
}
