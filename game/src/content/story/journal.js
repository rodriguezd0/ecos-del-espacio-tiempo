// Diario de la Libreta (docs/TABLILLAS.md §4.2: «hechos del viaje»). Módulo PURO de datos: hitos ya vividos a
// partir de los flags de salida de cada bloque (docs/CAMPANA.md, «Salida» de B01–B21). Entradas GENÉRICAS
// (PROVISIONAL): una por etapa completada y una por Pilar restaurado (content/story/fragments.js); los guiones de
// bloque pueden sustituirlas por textos propios más adelante.
import { FRAGMENTS } from './fragments.js';

/** Etapas sin Pilar (los bloques de Pilar los cubren sus entradas de Pilar, flag `pN_restored`). */
export const JOURNAL_BLOCKS = Object.freeze([
  { block: 'B01', flag: 'b01_left_town', title: 'Salida de Villa Alba', where: 'Con la Pokédex y el Core de Zygarde, rumbo al Umbral.' },
  { block: 'B03', flag: 'b03_gael_b2', title: 'Interludio 1', where: 'Zaguán, Ruta 2 y llegada a Caudal.' },
  { block: 'B05', flag: 'b05_brontia', title: 'Interludio 2', where: 'El Molino del Diezmo, Ruta 4 y Villa Brontia.' },
  { block: 'B07', flag: 'b07_megaring', title: 'Interludio 3', where: 'Ruta 6 y la Cantería Solano.' },
  { block: 'B09', flag: 'b09_gala', title: 'Interludio 4', where: 'Lúmina, el museo, la Reserva, la Marisma, Nexo y Caleta Sonda.' },
  { block: 'B11', flag: 'b11_gael_b4', title: 'Interludio 5', where: 'Bosque Neblino, el Monte y la casa.' },
  { block: 'B13', flag: 'b13_talasa', title: 'Interludio 6', where: 'Estación Talasa, Islote Lumbre y Volcán Tizón.' },
  { block: 'B15', flag: 'b15_n5', title: 'Interludio 7', where: 'El norte, Villa Boreal y el quinto núcleo.' },
  { block: 'B17', flag: 'b17_vigilia', title: 'Interludio 8', where: 'Axis en eclipse.' },
  { block: 'B19', flag: 'b19_calzada', title: 'Interludio 9', where: 'La Calzada del Rey.' },
  { block: 'B21', flag: 'game_cleared', title: 'Columna Lanza', where: 'El cielo de Axis vuelve a estar en calma.' },
].map((b) => Object.freeze(b)));

/** Número total de hitos del Diario (etapas + Pilares). */
export const JOURNAL_TOTAL = JOURNAL_BLOCKS.length + FRAGMENTS.length;

const blockNumber = (id) => Number(String(id).replace(/\D/g, '')) || 0;

/** Nombre corto de un Pilar para la lista («Pilar del Umbral» → «Umbral»). */
function pillarShort(name) {
  return name.replace(/^Pilar (del |de la |de los |de las )?/, '').replace(/^./, (c) => c.toUpperCase());
}

function pillarEntry(fr) {
  return {
    id: fr.flag, kind: 'pillar', block: fr.block, flag: fr.flag, n: fr.n,
    label: `P${fr.n} · ${pillarShort(fr.name)}`,
    title: fr.name,
    lines: [`${fr.place}.`, `Fragmento Azur ${fr.n} recuperado.`, fr.localEffect].filter(Boolean),
  };
}

function blockEntry(b) {
  return { id: b.flag, kind: 'block', block: b.block, flag: b.flag, n: null, label: b.title, title: b.title, lines: [b.where] };
}

/** Todas las entradas posibles, en orden de bloque (B01, P1/B02, B03, P2/B04…). */
export const JOURNAL_ENTRIES = Object.freeze(
  [...JOURNAL_BLOCKS.map(blockEntry), ...FRAGMENTS.map(pillarEntry)]
    .sort((a, b) => blockNumber(a.block) - blockNumber(b.block))
    .map((e) => Object.freeze({ ...e, lines: Object.freeze(e.lines) })),
);

/** Entradas ya vividas (su flag está activo), en orden de bloque. */
export function livedJournal(state) {
  return JOURNAL_ENTRIES.filter((e) => state.flag(e.flag));
}
