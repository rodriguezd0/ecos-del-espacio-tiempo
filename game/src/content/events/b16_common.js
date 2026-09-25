// Constantes y utilidades del Bloque 16 — Pilar del Alma (P8) (docs/CAMPANA.md B16; D17). Módulo PURO (se importa en
// Node desde las definiciones de mapa): flags, variables, hablantes, sprites, arte propio, música y ayudas de guion.
// Los combates de guion usan el helper común del proyecto (content/common/bossBattle.js, docs/BALANCE.md).
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';

/**
 * Flags del bloque, en orden de historia. Globales sin prefijo: p8_restored (Pilar; también es el hito `complete`
 * de Zygarde, content/zygarde/thresholds.js), verse_8, zyg_complete.
 */
export const F = Object.freeze({
  // Lagos del Alma
  arrival: 'b16_llegada', // primera llegada a los lagos (vecinos de Boreal en el mirador)
  sanctuaryIntro: 'b16_santuario_visto', // primera entrada al patio: el trío habla desde las alas
  // Ala del Saber (Uxie)
  glyphs: 'b16_saber_glifos', // ronda 1: los siete glifos en su relieve
  doors3: 'b16_saber_tres', // ronda 2: tres puertas
  doors4: 'b16_saber_cuatro', // ronda 3: cuatro puertas
  saber: 'b16_hebra_saber', // Uxie entrega la Hebra del Saber
  // Ala del Sentir (Mesprit)
  mirror1: 'b16_sentir_espejo_1', // el orgullo de Leandro
  mirror2: 'b16_sentir_espejo_2', // la carga de Fermín
  mirror3: 'b16_sentir_espejo_3', // el miedo de Fausto
  memory: 'b16_recuerdo_gael', // el último espejo: el día de Gael (sala del recuerdo)
  sentir: 'b16_hebra_sentir', // Mesprit pregunta «¿Qué le dirías?» y entrega la Hebra del Sentir
  // Ala del Querer (Azelf)
  wind: 'b16_querer_viento', // pasillo del viento superado
  azelfWarned: 'b16_azelf_sello', // Azelf ya explicó el sello de la Mochila
  azelf: 'b16_azelf_vencido',
  querer: 'b16_hebra_querer',
  // Telar del Alma
  telarOpen: 'b16_telar_abierto', // las tres Hebras abren el hexágono del patio
  telar: 'b16_telar', // ritual de las tres pulsaciones: Cadena Roja
  restored: 'p8_restored', // global (content/story/fragments.js)
  // Hito de la Forma Completa (salida)
  milestoneScene: 'b16_hito_escena', // primera parte de la escena vista (el cielo, el puente, la Forma Completa)
  milestone: 'b16_hito', // escena del puente de hielo terminada (completa o parcial)
  milestonePartial: 'b16_hito_parcial', // faltaban células: Zygarde sostuvo el puente a medias
  bridgeBroken: 'b16_puente_roto', // el tramo de la orilla se hundió (hueco B)
  bridgeA: 'b16_puente_a', // hueco A (junto al islote) reconstruido
  bridgeB: 'b16_puente_b', // hueco B (junto a la orilla) reconstruido
  radio: 'b16_radio', // los Guardianes por radio
  genesis: 'b16_genesis_registro', // Genesis se va con lo que registró desde fuera del P8 (B17 lo usa)
  bond: 'b16_vinculo', // vuelve el vínculo de los Pokémon del norte (la Snorunt de Marta)
  flyHint: 'b16_vuelo_aviso', // Zygarde explicó el Vuelo
  // T14 (tras el P8, en Correos de Nexo)
  letter: 'b16_t14_carta', // Don Evaristo enseña la carta sin destino (pista T14)
  // auxiliares
  genesisMet: 'b16_genesis_visto',
  observer: 'b16_observadora',
  windHint: 'b16_viento_aviso',
});

/** Variables del bloque. */
export const V = Object.freeze({
  carried: 'b16_saber_glifo', // glifo que lleva el jugador (0 = ninguno, 1–7 = Pilar)
  placed: 'b16_saber_relieves', // máscara de glifos colocados (bit n-1 = Pilar n)
  variant3: 'b16_saber_variante_3', // variante de la ronda de tres puertas (cambia con cada «olvido»)
  variant4: 'b16_saber_variante_4',
  forgot: 'b16_saber_olvidos', // veces que Uxie ha hecho olvidar (sin castigo)
  /**
   * Respuesta a Mesprit («¿Qué le dirías?», CAMPANA B16 y §6.4): 'culpa' («No fue culpa tuya») · 'lejos' («Tú también
   * llegaste lejos») · 'permiso' («Deberías haber entrado sin pedir permiso»). B20 la usa para la línea de Gael.
   */
  answer: 'b16_mesprit_respuesta',
  azelfTries: 'b16_azelf_intentos',
  weaves: 'b16_telar_hebras', // hebras tejidas en el ritual (0–3; vuelve a 0 si se sale)
  restCount: 'rest_count', // world/rest.js
});

/** Ids de la respuesta a Mesprit y el texto de cada opción (en el orden del menú). */
export const MESPRIT_ANSWERS = Object.freeze([
  Object.freeze({ id: 'culpa', text: 'No fue culpa tuya' }),
  Object.freeze({ id: 'lejos', text: 'Tú también llegaste lejos' }),
  Object.freeze({ id: 'permiso', text: 'Deberías haber entrado sin pedir permiso' }),
]);

export const SPEAKER = Object.freeze({
  uxie: 'Uxie',
  mesprit: 'Mesprit',
  azelf: 'Azelf',
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  lia: 'Lía',
  casilda: 'Casilda',
  leandro: 'Leandro',
  fermin: 'Fermín',
  abril: 'Abril',
  fausto: 'Fausto',
  observer: 'Observadora',
  marta: 'Marta',
  elder: 'Anciano de Boreal',
  kid: 'Niño de Boreal',
  neighbor: 'Vecino de Boreal',
  neighborF: 'Vecina de Boreal',
  tecnica: 'Técnica',
  tecnico: 'Técnico',
  radio: 'Radio',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  uxie: 'follower:UXIE:0:0',
  mesprit: 'follower:MESPRIT:0:0',
  azelf: 'follower:AZELF:0:0',
  gael: spriteOr('gael', 'anil:guay'),
  alerce: spriteOr('profesor', 'anil:cientifico'),
  lia: spriteOr('ayudante', 'anil:cientifica'),
  casilda: spriteOr('guardiana', 'anil:anciana1'),
  leandro: spriteOr('leandro', 'anil:marinero'),
  fermin: spriteOr('fermin', 'anil:minero'),
  fausto: spriteOr('buzo', 'anil:nadador'),
  olmedo: spriteOr('policia', 'anil:policia'),
  observer: 'anil:cientifica',
  marta: spriteOr('vecina', 'anil:chavala1'),
  elder: spriteOr('anciano', 'anil:anciano2'),
  kid: spriteOr('nino', 'anil:chaval1'),
  neighbor: spriteOr('vecino', 'anil:hombre1'),
  neighborF: 'anil:mujer1',
  tecnica: spriteOr('genesis_tecnica', 'anil:cientifica'),
  tecnico: spriteOr('genesis_tecnico', 'anil:cientifico'),
  snorunt: 'follower:SNORUNT:0:0',
  protagonistM: 'protagonista_m',
  protagonistF: 'protagonista_f',
});

/** Arte propio del bloque (node tools/b16_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  glyph: 'asset:objects/b16_glifo.png', // piedra de glifo (índice de fotograma = Pilar − 1; +8 = encendida)
  relief: 'asset:objects/b16_relieve.png', // relieve de efecto (32×64; índice = Pilar − 1; +8 = encendido)
  door: 'asset:objects/b16_puerta.png', // puerta de piedra con numeral (32×64; 0–3 = I–IV; 8 = abierta)
  mirror: 'asset:objects/b16_espejo.png', // cristal del espejo (32×64, brillo animado)
  loom: 'asset:objects/b16_telar.png', // Telar del Alma (96×128; fila 2 vacío · 4 hebras · 6 Cadena · 8 apagado)
  thread: 'asset:objects/b16_hebra.png', // hebras (fila 2 Saber · 4 Sentir · 6 Querer)
  seal: 'asset:objects/b16_sello.png', // sello hexagonal del patio (fila 2 cerrado · 4 abierto)
  zygardeComplete: 'asset:objects/b16_zygarde_completo.png', // Zygarde Completo en la escena del puente (128×128)
  tripod: 'asset:objects/tripode.png', // trípode del Consorcio (arte de B01)
  crate: 'asset:objects/b11_caja_exp03.png', // caja de instrumentos (arte de B11: fila 2 sellada)
  gust: 'asset:objects/rafagas.png', // ráfaga (arte de B06)
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  lakes: 'VinculoSupremo',
  sanctuary: 'Emociones',
  memory: 'Intro',
  legendary: 'Legendario',
  crisis: 'Climax',
  tension: 'Amenaza',
  genesis: 'GuaridaRocket',
});

/** Tinte rosa pálido del P8 (content/stamps/pilar.js lo expone como pilarTone('P8')). */
export const PINK = Object.freeze([240, 184, 200]);
export const TRIO_COLORS = Object.freeze({ saber: [255, 226, 110], sentir: [255, 150, 196], querer: [110, 170, 255] });
export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Dice varias líneas seguidas con el mismo hablante. */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(typeof text === 'function' ? text(ctx.state) : text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
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
    script: async (ctx) => { await ctx.say(typeof text === 'function' ? text(ctx.state) : text); },
  };
}

/** Fotograma de una hoja 4×4 del bloque (índice = fila·4 + columna) → propiedades de página { dir, pattern }. */
export function frame(index) {
  const i = Math.max(0, Math.min(15, Math.floor(index)));
  return { dir: [2, 4, 6, 8][Math.floor(i / 4)], pattern: i % 4, directionFix: true, walkAnime: false, stepAnime: false };
}

/** ¿Tiene el jugador las tres Hebras (o ya la Cadena)? */
export function hasAllThreads(s) {
  return Boolean(s) && s.flag(F.saber) && s.flag(F.sentir) && s.flag(F.querer);
}
