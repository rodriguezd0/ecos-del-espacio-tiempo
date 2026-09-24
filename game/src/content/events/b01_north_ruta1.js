// Eventos de la Ruta 1 (B01 §4.8, §6): entrenadores con visión, objetos, primeras Células de Zygarde,
// cartel del Pilar del Umbral y límite sur provisional (el bloque 2 empieza aquí).
import { coreCellReaction } from '../companion.js';

/** Total de células del juego (biblia §8). */
export const CELL_TOTAL = 100;

/** Texto al recoger una célula, con el recuento "(n/100)". */
export function cellFoundText(state) {
  const n = state?.data?.zygarde?.cells?.length ?? 0;
  return `Has encontrado una Célula de Zygarde. (${n}/${CELL_TOTAL})`;
}

/** Brillo breve y reacción del Core al recoger una célula. */
async function afterCell(ctx) {
  await ctx.flash([185, 255, 102], 12, 90);
  await coreCellReaction(ctx);
}

/**
 * [PROVISIONAL D10] Colocación de las primeras células (IDs de docs/CAMPANA.md §2.3, C002–C006).
 * Las cuatro primeras están en pasos obligados; la quinta, en el claro del este (opcional).
 */
export const RUTA1_CELLS = Object.freeze([
  { id: 'cell_ruta_1_1', x: 14, y: 19, where: 'puente de troncos del primer arroyo' },
  { id: 'cell_ruta_1_2', x: 13, y: 27, where: 'estrechamiento entre rocas junto a la hierba alta' },
  { id: 'cell_ruta_1_3', x: 11, y: 46, where: 'junto al Bichero Luis' },
  { id: 'cell_ruta_1_4', x: 16, y: 56, where: 'junto al cartel del Pilar del Umbral' },
  { id: 'cell_ruta_1_5', x: 24, y: 32, where: 'claro del este (opcional)' },
]);

function cellEvents() {
  return RUTA1_CELLS.map((c) => ({
    id: c.id, type: 'zygardeCell', x: c.x, y: c.y, cell: c.id, text: cellFoundText, onFound: afterCell,
  }));
}

/** Entrenadores (definiciones de combate en content/trainers/b01_ruta1.js). */
export const RUTA1_TRAINERS = Object.freeze([
  {
    id: 'joven_pablo', trainer: 'r1_joven_pablo', name: 'Joven Pablo', sprite: 'chaval1', x: 12, y: 11, dir: 6,
    intro: '¡Eh, tú! Ese Pokémon es nuevo, ¿verdad? ¡Veamos qué tal lo hace!',
    after: 'Entreno aquí cada mañana. Algún día mi Bidoof será enorme.',
  },
  {
    id: 'chica_nerea', trainer: 'r1_chica_nerea', name: 'Chica Nerea', sprite: 'chica1', x: 17, y: 36, dir: 4,
    intro: '¡Por fin alguien con quien combatir! No te lo pondré fácil.',
    after: 'Starly y Budew se llevan genial. Por eso los traigo juntos.',
  },
  {
    id: 'bichero_luis', trainer: 'r1_bichero_luis', name: 'Bichero Luis', sprite: 'cazabichos', x: 13, y: 48, dir: 4,
    intro: '¡Shh! Estaba buscando Pokémon bicho… ¡Pero un combate también vale!',
    after: 'Entre la hierba alta hay muchos Pokémon bicho. Mira bien por dónde pisas.',
  },
]);

function trainerEvents() {
  return RUTA1_TRAINERS.map((t) => ({ ...t, type: 'trainer', sight: 4 }));
}

/** Límite sur provisional: el camino sigue hacia el Pilar del Umbral en el bloque 2. */
async function southLimit(ctx) {
  ctx.face('player', 'up');
  await ctx.say('El sendero sigue hacia las ruinas del Pilar del Umbral.');
  await ctx.say('[PROVISIONAL] Aquí termina el bloque 1: el camino continúa en el bloque 2.');
  await ctx.move('player', ['up'], { through: false });
}

export function ruta1Events({ southRow, pathX0, pathX1 }) {
  const limits = [];
  for (let x = pathX0; x <= pathX1; x++) {
    limits.push({ id: `limite_sur_${x}`, x, y: southRow, trigger: 'touch', script: southLimit });
  }
  return [
    ...trainerEvents(),
    ...cellEvents(),
    { id: 'pocion_1', type: 'item', x: 5, y: 15, item: 'POTION' },
    { id: 'pocion_2', type: 'item', x: 5, y: 38, item: 'POTION' },
    { id: 'pokeball_1', type: 'item', x: 19, y: 32, item: 'POKEBALL' },
    { id: 'pocion_oculta', type: 'item', x: 24, y: 26, item: 'POTION', hidden: true },
    { id: 'cartel_umbral', type: 'sign', x: 18, y: 55, text: 'Pilar del Umbral — Ruinas antiguas. Se ruega respeto.' },
    ...limits,
  ];
}
