// Constantes y utilidades del Bloque 3 (docs/CAMPANA.md B03: Zaguán, Ruta 2 y llegada a Ciudad Caudal).
// Módulo puro: sin DOM ni engine (se importa desde las definiciones de mapa, también en Node).
import { getCharacter } from '../characters.js';
import { collectCell, cellFoundText, afterCell } from './b01_cells.js';

/** Flags del bloque (prefijo b03_) y estados globales que lee (CAMPANA §3.2). */
export const F = Object.freeze({
  // Entrada (los pone B02)
  p1: 'p1_restored',
  libreta: 'b02_libreta',
  // T01 «La Arboleda de los Nombres» (TABLILLAS T01)
  t01Gardener: 'b03_t01_jardinero', // segunda pista (el jardinero)
  t01View: 'b03_t01_vista', // vista cenital desde el campanario
  t01Done: 'b03_t01_tablilla', // Tabla Pradal excavada: el árbol se recupera
  t01Seed: 'b03_t01_semilla', // Mirta regala la Semilla Milagro
  // Lía y el Repartir Exp (Centro de Zaguán)
  lia: 'b03_lia_repartir',
  // Ciudad Caudal
  arrived: 'b03_caudal_llegada',
  gael: 'b03_gael_b2', // salida del bloque (CAMPANA B03)
  gaelWon: 'b03_gael_b2_ganado', // el jugador ganó el B2 (cambia la frase de Gael después)
  alerce: 'b03_llamada_alerce',
  anselmo: 'b03_anselmo_t02',
  oldRod: 'b03_cana_vieja',
  gyarados: 'b03_gyaradosita', // el pescador regala la Gyaradosita cuando ya hay Nadar (POKEDEX §7.7)
  // Estados de bloques posteriores que este bloque consulta (cambios en el mundo)
  p2: 'p2_restored',
  p4: 'p4_restored',
});

/** Variables del bloque. */
export const V = Object.freeze({
  honey: 'b03_miel_ruta2', // rest_count a partir del cual el árbol de miel tiene un Pokémon (0 = sin untar)
  restCount: 'rest_count',
});

/** Hablantes (nombres fijados en CAMPANA/X07/TABLILLAS; el resto, genéricos). */
export const SPEAKER = Object.freeze({
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  lia: 'Lía',
  anselmo: 'Anselmo',
  leandro: 'Leandro',
  mirta: 'Mirta',
  gardener: 'Jardinero',
  council: 'Concejal',
  fisher: 'Pescador',
});

/** Sprite registrado o, si aún no existe, el de reserva de Añil. */
export const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

export const SPRITE = Object.freeze({
  gael: 'gael',
  alerce: 'profesor',
  lia: spriteOr('lia', 'ayudante'),
  anselmo: spriteOr('anselmo', 'anciano'),
  leandro: spriteOr('leandro', 'anil:marinero'),
  mirta: spriteOr('nina', 'anil:nina'),
  gardener: 'anil:anciano2',
  council: 'anil:empresario',
  fisher: 'anil:pescador',
  objects: 'asset:objects/b03_objetos.png',
  wheel: 'asset:objects/noria.png',
  gate: 'asset:objects/compuerta.png',
});

/** Filas (dirección del evento) y columnas (pattern) de b03_objetos.png (tools/b03_assets.mjs). */
export const OBJ = Object.freeze({
  dryGrass: (v = 0) => ({ dir: 2, pattern: v % 4 }),
  benchL: { dir: 4, pattern: 0 },
  benchM: { dir: 4, pattern: 1 },
  benchR: { dir: 4, pattern: 2 },
  sandbags: () => ({ dir: 4, pattern: 3 }),
  mound: { dir: 6, pattern: 0 },
  hole: { dir: 6, pattern: 1 },
  holeGlint: { dir: 6, pattern: 2 },
  sprout: { dir: 6, pattern: 3 },
  puddle: (v = 0) => ({ dir: 8, pattern: v % 2 }),
  rope: { dir: 8, pattern: 2 },
  newGrass: { dir: 8, pattern: 3 },
});

/** Evento decorativo con un objeto de b03_objetos.png (sin animación). */
export function objectEvent(id, x, y, obj, extra = {}) {
  return {
    id, x, y, sprite: SPRITE.objects, dir: obj.dir, pattern: obj.pattern,
    directionFix: true, walkAnime: false, stepAnime: false, shadow: false, through: true, ...extra,
  };
}

/** Evalúa flags: all(['a']) y none(['b']) → when(state). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

export const say = (ctx, speaker, text) => ctx.say(text, { speaker });
export const core = (ctx, text) => ctx.say(text, { telepathy: true });

/** El compañero de Zygarde (si acompaña y está visible) reacciona con una emoción. */
export async function zygardeEmote(ctx, kind = '!') {
  const c = ctx.world?.core;
  if (!c?.visible) return;
  c.turnToward?.(ctx.player);
  await ctx.emote(c, kind);
}

/**
 * Células del Bloque 3 (CAMPANA §2.3; claves del registro content/zygarde/cells.js). Aquí se fijan las casillas.
 * stage: A sin capacidad · B Correr · F Nadar.
 */
export const B03_CELLS = Object.freeze([
  { id: 'cell_ruta_2_1', code: 'C013', map: 'ruta_2', x: 16, y: 18, stage: 'A', where: 'bajo el puente del arroyo, en la orilla de guijarros' },
  { id: 'cell_ruta_2_2', code: 'C015', map: 'ruta_2', x: 4, y: 38, stage: 'B', where: 'alto de la rampa de grava (Correr)' },
  { id: 'cell_zaguan_3', code: 'C070', map: 'ruta_2', x: 23, y: 31, stage: 'F', where: 'estanque de la Ruta 2 (Nadar)' },
  { id: 'cell_caudal_1', code: 'C014', map: 'ciudad_caudal', x: 39, y: 11, stage: 'A', where: 'pasarela de la Esclusa mayor (la célula que se le escapó a Gael)' },
  { id: 'cell_caudal_2', code: 'C068', map: 'ciudad_caudal', x: 33, y: 42, stage: 'F', where: 'canal del Mercado, bajo el tercer puente (Nadar)' },
]);

export function cellsOf(mapId) {
  return B03_CELLS.filter((c) => c.map === mapId);
}

/** Evento de célula (tipo `zygardeCell`, reacción del Core al recogerla). */
export function cellEvent(cell, extra = {}) {
  return { id: cell.id, type: 'zygardeCell', x: cell.x, y: cell.y, cell: cell.id, onFound: afterCell, ...extra };
}

export { collectCell, cellFoundText };

/** Enlace cerrado: aviso neutro y un paso atrás (`back` = dirección de retroceso, `face` = hacia dónde mira). */
export function blockedLink(prefix, cells, text, back, face) {
  const script = async (ctx) => {
    ctx.face('player', face);
    await ctx.say(text);
    await ctx.move('player', [back], { through: false });
  };
  return cells.map(([x, y]) => ({ id: `${prefix}_${x}_${y}`, x, y, trigger: 'touch', script }));
}
