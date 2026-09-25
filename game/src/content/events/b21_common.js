// Constantes y utilidades del Bloque 21 — Final: Salto de Convergencia, Columna Lanza, Arceus en tres fases y epílogo
// (docs/CAMPANA.md B21; D21–D24). Módulo PURO (se importa en Node desde las definiciones de mapa): flags, variables,
// hablantes, gráficos, música y pequeñas ayudas de guion. Los textos están en b21_texts.js.
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';

/**
 * Flags del bloque, en orden de historia. Globales sin prefijo: `game_cleared` (fin del juego base: cielo
 * restablecido, content/story/crisis.js; también es el hito `anchor` de Zygarde) y `arceus_caught` (opcional).
 */
export const F = Object.freeze({
  // Entrada (B20)
  p10Restored: 'p10_restored',
  fluteB20: 'b20_flute',
  // Salto de Convergencia (Nodo del Origen → Columna Lanza)
  jumpWarned: 'b21_nodo_aviso', // Zygarde ya avisó de que no hay vuelta
  jumpDone: 'b21_salto', // el Salto hasta Columna Lanza se completó
  lanzaArrival: 'b21_llegada', // escena de llegada vista (Zygarde vuelve a la Forma Completa)
  // Captura voluntaria de Zygarde (D21)
  zygardeAsked: 'b21_zygarde_pregunta',
  zygardeJoined: 'b21_zygarde_equipo',
  // Arceus (D22, D23)
  arceusAwake: 'b21_flauta', // Arceus despierto
  arceusDone: 'b21_arceus_superado', // victoria (debilitado en la fase 3) o captura
  arceusFainted: 'b21_arceus_debilitado', // quedó en Columna Lanza para el postgame (CAMPANA §8.1)
  arceusCaught: 'arceus_caught', // global (salida opcional)
  // Resolución
  tabletsComplete: 'b21_tablillas', // las dieciocho completas
  axisRepaired: 'b21_eje_reparado', // el eje que no se eligió en el P9 queda reparado
  finalResolved: 'b21_resolucion',
  gameCleared: 'game_cleared', // global
  // Epílogo (D24)
  epilogueBack: 'b21_regreso', // Salto de vuelta al nodo del Laberinto
  epilogueOlmedo: 'b21_olmedo',
  epilogueMom: 'b21_mama',
  alerceKeyGiven: 'b21_llave', // Alerce entrega ALERCEKEY
  montageDone: 'b21_montaje',
  momInside: 'b21_mama_casa', // Mamá entra en casa: fin de la parte guiada del pueblo
  momGaelHint: 'b21_mama_aviso', // en casa, Mamá recuerda la puerta abierta de Gael
  gaelHouseSeen: 'b21_casa_gael_vista',
  gaelNoteRead: 'b21_nota_gael',
  gaelEggGiven: 'b21_huevo_gael',
  gaelEggWaiting: 'b21_huevo_espera',
  tvNews: 'b21_tele',
  creditsDone: 'b21_creditos',
  epilogueEnd: 'b21_fin', // despertar en el cuarto: empieza el postgame
});

/** Variables del bloque (y las de otros bloques que se leen). */
export const V = Object.freeze({
  phase: 'b21_arceus_fase', // 0 Tierra · 1 Fantasma · 2 Normal (fase alcanzada; se guarda al perder)
  tries: 'b21_arceus_intentos',
  p9Choice: 'p9_choice', // B18: 'DIALGA' | 'PALKIA' (el elegido; el otro es el eje que repara Arceus)
  gaelStarter: 'gael_starter', // B01: inicial de Gael (huevo del epílogo)
  mespritAnswer: 'b16_mesprit_respuesta',
});

/** Flags de otros bloques que se consultan: el Círculo del Jardín en pie (X26, content/events/b17_common.js F.circle). */
export const EXTERNAL = Object.freeze({
  circle: Object.freeze(['b17_circulo']),
});

/** ¿Se levantó el Círculo del Jardín (B17, opcional)? */
export function circleRaised(state) {
  return EXTERNAL.circle.some((k) => state?.flag?.(k));
}

export const SPEAKER = Object.freeze({
  arceus: 'Arceus',
  mom: 'Mamá',
  alerce: 'Prof. Alerce',
  olmedo: 'Agente Olmedo',
  vertice: 'Dr. Vértice',
  tv: 'Televisión',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js, Graphics/Characters de Añil o arte propio). */
export const SPRITE = Object.freeze({
  arceus: 'ARCEUS', // Graphics/Characters/ARCEUS.png (128×128)
  zygardeComplete: 'asset:objects/b16_zygarde_completo.png', // arte de B16 (solo lectura)
  mom: spriteOr('mama', 'anil:mujer1'),
  alerce: spriteOr('profesor', 'anil:cientifico'),
  olmedo: spriteOr('policia', 'anil:policia'),
  vertice: spriteOr('vertice', 'anil:caballero'),
  casilda: spriteOr('guardiana', 'anil:anciana1'),
  leandro: spriteOr('leandro', 'anil:marinero'),
  abril: spriteOr('abril', 'anil:chavala1'),
  fermin: spriteOr('fermin', 'anil:minero'),
  olvido: spriteOr('olvido', 'anil:anciana1'),
  clefairy: 'follower:CLEFAIRY:0:0',
  egg: 'huevosAves', // hoja de Añil: fila 2 azul · fila 4 marrón · fila 6 roja (fotograma 0)
  rock: 'asset:objects/b21_roca.png',
  objects: 'asset:objects/b21_objetos.png', // fila 2 Honor Ball · 4 nota · 6 Honor Ball abierta · 8 destello
});

/** Color del huevo del inicial de Gael (hoja huevosAves): dirección de la fila. */
export const EGG_ROW = Object.freeze({ LITTEN: 6, SOBBLE: 2, TURTWIG: 4 });

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.8). */
export const MUSIC = Object.freeze({
  columna: 'Final2',
  flute: 'Pokeflauta',
  battle: 'Legendario mayor', // fases 1–2
  battleFinal: 'PrismaBossFinal', // fase 3
  resolution: 'Final',
  montage: 'LeyendaPrisma',
  ship: 'Barco',
  credits: 'Creditos',
  village: 'town_start',
});

/** Fondos de combate (CAMPANA §1.8: ColumnaLanza en las fases 1–2, Arceus en la 3). */
export const BATTLEBACK = Object.freeze({ phases12: 'ColumnaLanza', phase3: 'Arceus' });

export const GREEN = Object.freeze([185, 255, 102]);
export const GOLD = Object.freeze([255, 226, 150]);
export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Dice varias líneas seguidas con el mismo hablante (funciones del estado permitidas). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(typeof text === 'function' ? text(ctx.state) : text, TELEPATHY);
}

/** Espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id) || null;
}

/** Recoloca al jugador en (x, y) del mapa actual y su cadena de seguidores detrás (sin fundido). */
export function placePlayer(ctx, x, y, dir = 2) {
  const p = ctx.player;
  if (!p) return;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  placeChainBehind(p, ctx.world?.followers || []);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** Opacidad del jugador y de sus seguidores (escenas en las que el jugador «no está»: montaje, carguero, créditos). */
export function setActorsVisible(ctx, visible) {
  const v = visible ? 255 : 0;
  for (const c of [ctx.player, ...(ctx.world?.followers || [])]) if (c) c.opacity = v;
}

/** Fija la hora del reloj de juego (minutos desde las 0:00) avanzando lo necesario. */
export function setClock(state, hour, minute = 0) {
  const target = (((hour * 60 + minute) % 1440) + 1440) % 1440;
  const now = state.data.clock?.minutes ?? 0;
  const delta = (target - now + 1440) % 1440;
  if (delta) state.advanceMinutes(delta);
}

/** Copia profunda de datos JSON (equipo, mochila). */
export const cloneJson = (v) => JSON.parse(JSON.stringify(v));
