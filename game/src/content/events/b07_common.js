// Constantes y utilidades del Bloque 7 — Interludio 3: Ruta 6 y la Cantería Solano (docs/CAMPANA.md B07;
// TABLILLAS T04). Módulo puro (se importa en Node desde las definiciones de mapa): flags, variables, hablantes,
// gráficos y ayudas de guion comunes. Los combates de guion usan el helper común `bossBattle` (docs/BALANCE.md).
import { getCharacter } from '../characters.js';

export { bossBattle } from '../common/bossBattle.js';

/** Flags del bloque (en orden de la historia) y estados globales que consulta. */
export const F = Object.freeze({
  p3: 'p3_restored', // B06: cesan los vendavales (Brontia abre su salida sur)
  llegada: 'b07_llegada', // la voladura y Bea Solano: segunda pista de T04
  tecnicos: 'b07_tecnicos', // técnicos de la voladura vencidos
  garrido: 'b07_garrido', // Ulises Garrido se retira cuando los canteros lo señalan
  alerce: 'b07_alerce', // Alerce llega en persona y enseña la regla de los estratos (abre las galerías)
  timburr1: 'b07_timburr_1',
  timburr2: 'b07_timburr_2',
  timburr3: 'b07_timburr_3',
  quino: 'b07_quino', // Quino Solano rescatado
  tablilla: 'b07_tablilla', // Tabla Pétrea (STONEPLATE)
  piedra: 'b07_piedra', // Quino arranca un trozo de la veta de piedra activadora
  rescate: 'b07_rescate', // la cuadrilla, fuera: los canteros lo celebran
  denuncia: 'b07_denuncia', // los canteros denuncian en público al Consorcio (aviso en el camión y el tablón)
  megaring: 'b07_megaring', // SALIDA DEL BLOQUE: Mega Aro (MEGARING)
  ruta: 'b07_ruta_despejada', // el derrumbe del camino de Estrato, despejado por los canteros y los Timburr
  // auxiliares
  llamada: 'b07_llamada_derrumbe', // Alerce llamó por la Pokédex tras el primer derrumbe
  galerias: 'b07_galerias_vistas',
  sala3: 'b07_sala3_vista', // Quino grita al llegar a la última sala
  alerceFuera: 'b07_alerce_se_fue',
});

/** Timburr de la cuadrilla por sala: [flags] en el orden de las marcas T de la sala ASCII. */
export const TIMBURR_FLAGS = Object.freeze({ 1: [F.timburr1], 2: [F.timburr2, F.timburr3], 3: [] });

export const V = Object.freeze({
  /** Máscara de rocas rotas de la sala n (bit i = roca i de la sala ASCII). */
  sala: (n) => `b07_sala_${n}`,
  derrumbes: 'b07_derrumbes', // derrumbes provocados (pistas)
  tecnico: (i) => `b07_tecnico_${i}`, // 1 = técnico i vencido
  perimetro: 'b07_perimetro', // 1 = los técnicos ya dieron el alto (el reintento no repite la escena)
});

export const SPEAKER = Object.freeze({
  bea: 'Bea',
  quino: 'Quino',
  alerce: 'Prof. Alerce',
  garrido: 'Garrido',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  cantero: 'Cantero',
  cantera: 'Cantera',
  canteros: 'Canteros',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js; alias de CAMPANA) con reserva de Añil. */
export const SPRITE = Object.freeze({
  bea: spriteOr('bea', 'anil:minera'),
  quino: spriteOr('quino', 'anil:operario'),
  alerce: spriteOr('alerce', 'profesor'),
  garrido: spriteOr('garrido', 'anil:cientifico'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  cantero: 'minero',
  cantera: 'minera',
  timburr: 'follower:TIMBURR:0:0',
  smoke: 'humo',
});

/** Arte propio del bloque (tools/b07_assets.mjs). */
export const OBJ = Object.freeze({
  strata: 'asset:objects/b07_estratos.png', // fila 2 ocre · 4 gris · 6 roja · 8 negra
  rubble: 'asset:objects/b07_escombros.png',
  corte: 'asset:objects/b07_corte.png', // 2 normal · 4 franjas resaltadas
  tablet: 'asset:objects/b07_tablilla.png',
  vein: 'asset:objects/b07_veta.png', // 2 dormida · 4 despierta · 6 arrancada
  forge: 'asset:objects/b07_fragua.png', // 2 brasas · 4 a pleno fuego
  anvil: 'asset:objects/b07_yunque.png', // 2 solo · 4 con el Mega Aro
  blocks: 'asset:objects/b07_sillares.png',
  charge: 'asset:objects/b07_carga.png',
  shaft: 'asset:objects/b07_pozo.png', // 2 tapado · 4 abierto · 6 cuerda
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  route: 'PrismaRuta2',
  cave: 'Cueva',
  tension: 'Amenaza',
  grunt: 'EncuentroRocket',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** when() a partir de flags: all / none y una prueba extra. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

export const say = (ctx, speaker, text) => ctx.say(text, { speaker });

/** Dice varias líneas seguidas con el mismo hablante. */
export async function lines(ctx, speaker, list) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker } : {});
}

/** Línea telepática de Zygarde (solo si acompaña al jugador): voz sobria (CAMPANA §3.2). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** «chaval» / «chavala»… para las voces de los canteros. */
export const kid = (s) => byGender(s, 'chaval', 'chavala');

/** Llamada de Alerce por la Pokédex (mismo formato que B03). `list` = sus líneas. */
export async function alerceCall(ctx, list) {
  ctx.me('Register phone');
  await ctx.say('¡La Pokédex está sonando!\nEs una llamada del Prof. Alerce.');
  ctx.se('GUI pokedex open');
  await lines(ctx, SPEAKER.alerce, list);
  ctx.se('GUI pokedex open');
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Busca un evento del mapa actual por id (o null). */
export const eventById = (ctx, id) => ctx.world?.events?.find((e) => e.id === id) || null;

/** Ruta ortogonal (primero horizontal) de (x0, y0) a (x1, y1) como pasos de ctx.move. */
export function routeTo(x0, y0, x1, y1) {
  const out = [];
  for (let x = x0; x < x1; x++) out.push('right');
  for (let x = x0; x > x1; x--) out.push('left');
  for (let y = y0; y < y1; y++) out.push('down');
  for (let y = y0; y > y1; y--) out.push('up');
  return out;
}

/** Objeto interactivo invisible (texto al pulsar A delante). */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); },
  };
}
