// Constantes y utilidades del Bloque 17 — Interludio 8: Axis en eclipse (docs/CAMPANA.md B17; TABLILLAS T14; §5 Genesis).
// Módulo PURO (se importa en Node desde las definiciones de mapa): flags, variables, hablantes, sprites, arte propio,
// música y ayudas de guion. Los combates de guion usan el helper común (content/common/bossBattle.js, docs/BALANCE.md).
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';

/**
 * Flags del bloque, en orden de historia. Globales de otros bloques que se leen: p8_restored (entrada; también fase 3
 * de la crisis), p9_restored (B18: Genesis se retira del Mirador Sur), b16_t14_carta (B16: pista T14 abierta).
 */
export const F = Object.freeze({
  // T14 · La carta sin destino (Correos de Nexo → Mesa de los Vientos)
  envelope: 'b17_t14_sobre', // Don Evaristo confía la carta y lee el acertijo del sobre (segunda pista)
  riddle: 'b17_t14_acertijo', // acertijo resuelto: la Mesa aparece en el mapa de Vuelo
  mesaArrival: 'b17_mesa_llegada', // primera llegada a la Mesa (los cuidadores desconfían)
  altaria1: 'b17_altaria_1', // Altaria del prado del oeste
  altaria2: 'b17_altaria_2', // Altaria de la Aguja (Reconstrucción)
  altaria3: 'b17_altaria_3', // Altaria del alto (Trepar)
  trust: 'b17_mesa_confianza', // el rebaño está en el corral: los cuidadores confían
  aurora: 'b17_t14_aurora', // Aurora lee la carta
  journey: 'b17_t14_viaje', // Aurora y el jugador vuelan a Nexo
  reunion: 'b17_t14_reencuentro', // los hermanos se reencuentran; Tabla Cielo y Staraptorita
  // Mirador Sur ocupado y el Anillo de Captación
  mirador: 'b17_mirador_visto', // escena de la ocupación: Resonador, Cadena Sintética y las torres
  alerceCall: 'b17_alerce_llamada', // Alerce cita al jugador en Caudal (tras T14 y el Mirador)
  alerceHint: 'b17_alerce_aviso', // T14 resuelta sin haber visto el Mirador: Alerce le manda a mirar (nota en la Libreta)
  towerViento: 'b17_torre_viento',
  towerTormenta: 'b17_torre_tormenta',
  towerTemblor: 'b17_torre_temblor',
  // Círculo del Jardín (X26, Villa Alba de noche)
  momClefairy: 'b17_circulo_mama', // Mamá cuenta lo de los Clefairy
  danceSeen: 'b17_circulo_danza', // el jugador ha visto la danza
  circle: 'b17_circulo', // el Círculo queda en pie (para siempre); destino de Vuelo
  moonStones: 'b17_circulo_piedras', // los Clefairy dejan las 3 Piedras Lunares
  // Vigilia (Caudal) y salida
  vigil: 'b17_vigilia', // SALIDA DEL BLOQUE: «Van a intentarlo por la fuerza.»
  sendaGap: 'b17_senda_derrumbe', // tramo derrumbado de la Senda del Mirador reconstruido
  descentGap: 'b17_mirador_bajada', // tramo desprendido de la bajada del Mirador Sur a la Sima reconstruido (mirador_layout.js)
  // Globales de otros bloques
  p8: 'p8_restored',
  p9: 'p9_restored',
  t14Open: 'b16_t14_carta',
});

/** Variables del bloque. */
export const V = Object.freeze({
  /**
   * Torres del Anillo de Captación apagadas (0–3). LA CONSULTA B20: si es > 0, Landorus añade «Alguien apagó las
   * torres. Lo sentimos.» (CAMPANA B20). Documentada en content/maps/b17/README.md.
   */
  towersOff: 'b17_torres_apagadas',
  /** Zócalos alzados de cada torre ('3,1,5'): var `b17_torre_<id>_piedras`. */
  towerStones: (id) => `b17_torre_${id}_piedras`,
  /** Piedras del Círculo alzadas en el orden de la danza (0–6). */
  circleStep: 'b17_circulo_paso',
  /** Día de juego en que se combatió con cada Clefairy del Círculo (reaparecen al día siguiente). */
  clefairyDay: (n) => `b17_clefairy_${n}`,
  restCount: 'rest_count',
});

export const SPEAKER = Object.freeze({
  evaristo: 'Don Evaristo',
  aurora: 'Aurora',
  keeper: 'Cuidadora Brisa', // jefa de los cuidadores de Altaria
  keeperKid: 'Nube', // cuidador joven
  keeperOld: 'Cuidador Céfiro',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  genesis: 'Técnica de Genesis',
  alerce: 'Prof. Alerce',
  olmedo: 'Agente Olmedo',
  leandro: 'Leandro',
  casilda: 'Casilda',
  abril: 'Abril',
  fermin: 'Fermín',
  olvido: 'Olvido',
  mom: 'Mamá',
  elder: 'Anciano',
  agent: 'Agente',
  hiker: 'Excursionista',
  tourist: 'Visitante',
  radio: 'Radio',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  evaristo: spriteOr('evaristo', 'anil:anciano1'),
  aurora: 'anil:anciana2',
  keeper: 'anil:criadora',
  keeperOld: 'anil:criador',
  keeperKid: 'anil:chaval1',
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  alerce: spriteOr('profesor', 'anil:cientifico'),
  olmedo: spriteOr('policia', 'anil:policia'),
  agent: spriteOr('policia', 'anil:policia'),
  leandro: spriteOr('leandro', 'anil:marinero'),
  mom: spriteOr('madre', 'anil:mujer1'),
  elder: spriteOr('anciano', 'anil:anciano2'),
  hiker: 'anil:excursionista',
  tourist: 'anil:Fotografo',
  altaria: 'follower:ALTARIA:0:0',
  swablu: 'follower:SWABLU:0:0',
  clefairy: 'follower:CLEFAIRY:0:0',
});

/** Arte propio del bloque (node tools/b17_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  tower: (id) => `asset:objects/b17_torre_${id}.png`, // fila 2 encendida · 4 apagada · 6 chispas
  console: 'asset:objects/b17_consola.png', // fila 2 encendida · 4 apagada · 6 chispas
  resonator: 'asset:objects/b17_resonador.png', // 96×128, cuatro pulsos
  stone: 'asset:objects/b17_piedra.png', // fila 2 hundida · 4 hundida encendida · 6 alzada · 8 alzada con luna
  tripod: 'asset:objects/tripode.png', // trípode del Consorcio (arte de B01)
  crate: 'asset:objects/b11_caja_exp03.png', // caja de instrumentos (arte de B11)
});

/** Panorama del vacío de la Sima (render/panorama.js). */
export const SIMA_PANORAMA = Object.freeze({ image: 'assets/panoramas/b17_sima.png', parallax: 0.55, scroll: [2, -3] });

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.3–1.8 y «Música por situación»). */
export const MUSIC = Object.freeze({
  mesa: 'viento',
  sima: 'Amenaza',
  genesis: 'GuaridaRocket',
  grunt: 'EncuentroRocket',
  tension: 'Amenaza',
  reunion: 'Emociones',
  vigil: 'Emociones',
  circle: 'Pokeflauta',
});

export const TELEPATHY = Object.freeze({ telepathy: true });
export const GREEN = Object.freeze([185, 255, 102]);
export const MAGENTA = Object.freeze([240, 122, 200]);
export const MOON = Object.freeze([214, 226, 255]);

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** ¿Es de noche en el reloj de juego? (20:00–6:00, como el resto de bloques) */
export const isNight = (s) => Boolean(s) && typeof s.isDay === 'function' && !s.isDay();

/** Genesis ocupa el Mirador Sur y las torres drenan: del P8 al P9 (B18). */
export const occupied = (s) => Boolean(s) && s.flag(F.p8) && !s.flag(F.p9);

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(typeof text === 'function' ? text(ctx.state) : text, TELEPATHY);
}

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id) || null;
}

/** Recoloca al jugador en (x, y) del mapa actual (con fundido opcional) y su cadena de seguidores detrás. */
export async function placePlayer(ctx, x, y, dir = 8, { fade = true, frames = 14 } = {}) {
  if (fade) await ctx.fade('out', frames);
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  placeChainBehind(p, ctx.world?.followers || []);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
  if (fade) {
    await pause(ctx, 6);
    await ctx.fade('in', frames);
  }
}

/** Evento que se examina (sólido o no): texto fijo o función del estado. */
export function examine(id, x, y, text, { solid = true, when: cond } = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid, ...(cond ? { when: cond } : {}),
    script: async (ctx) => {
      const list = typeof text === 'function' ? text(ctx.state) : text;
      for (const t of [].concat(list)) await ctx.say(t);
    },
  };
}

/** NPC sencillo: lista de líneas (o función del estado → lista). */
export function npc(id, x, y, sprite, speaker, text, { dir = 2, move = 'look', when: cond = null } = {}) {
  return {
    id, x, y, name: speaker,
    pages: [{
      ...(cond ? { when: cond } : {}), sprite, dir, move, trigger: 'action',
      script: async (ctx) => { await lines(ctx, speaker, typeof text === 'function' ? text(ctx.state) : text); },
    }],
  };
}

/** Fotograma de una hoja 4×4 (índice = fila·4 + columna) → propiedades de página { dir, pattern }. */
export function frame(index) {
  const i = Math.max(0, Math.min(15, Math.floor(index)));
  return { dir: [2, 4, 6, 8][Math.floor(i / 4)], pattern: i % 4, directionFix: true, walkAnime: false, stepAnime: false };
}

const FRAMES_PER_GAME_DAY = 60 * 60 * 24; // 24 min reales a 60 fps (TEC-06, como b16_feebas.js)

/** Día de juego: minutos de juego jugados + descansos (cada descanso adelanta el reloj). */
export function gameDay(state) {
  const played = Math.floor((Number(state?.data?.playTimeFrames) || 0) / FRAMES_PER_GAME_DAY);
  const rests = Number(state?.var?.(V.restCount, 0)) || 0;
  return played + rests;
}

/** Torres apagadas (0–3), a partir de sus flags. */
export function towersOff(state) {
  return [F.towerViento, F.towerTormenta, F.towerTemblor].filter((f) => state?.flag(f)).length;
}

/** ¿Puede empezar la Vigilia? (T14 resuelta y la ocupación vista; las torres y el Círculo son opcionales) */
export const vigilReady = (s) => Boolean(s) && s.flag(F.reunion) && s.flag(F.mirador);
