// Constantes y utilidades del Bloque 20 — Pilar del Origen (P10) (docs/CAMPANA.md B20; D19, D20; §6.3–6.4 Gael).
// Módulo PURO (se importa en Node desde las definiciones de mapa y las pruebas): flags, variables, hablantes, gráficos,
// música y ayudas de guion. Los combates de guion usan el helper común (content/common/bossBattle.js, docs/BALANCE.md).
import { getCharacter } from '../characters.js';
import { placeChainBehind } from '../../world/follower.js';
import { bossBattle } from '../common/bossBattle.js';

export { bossBattle };

/**
 * Flags del bloque, en orden de historia. Globales sin prefijo: p10_restored (lo pone restorePillar(10)), verse_10.
 * Salida del bloque (CAMPANA B20): p10_restored y b20_flute.
 */
export const F = Object.freeze({
  // Puerta de las Quince
  arrival: 'b20_puerta_llegada', // primera llegada al fondo de la Sima
  missingSeen: 'b20_puerta_faltan', // la puerta ya dijo lo que falta (al menos una vez)
  doorOpen: 'b20_puerta_abierta', // quince Tablillas + nueve Fragmentos: la losa se hunde y el camino se proyecta
  path: 'b20_camino', // la Reconstrucción alza las quince piedras del camino
  // Senda del Origen (9 tramos)
  tramo: (n) => `b20_tramo_${n}`, // tramo n superado (se pisa su salida)
  t1Slab: 'b20_t1_losa', // tramo 1: las tres piedras giratorias abren la losa del dintel
  t2Gate: 'b20_t2_compuerta', // tramo 2: la compuerta abierta vacía el estanque
  t3Hint: 'b20_t3_pista', // tramo 3: Zygarde ya habló de la veleta
  t4Plate: 'b20_t4_placa', // tramo 4: la placa hundida alza la plataforma
  t4Hint: 'b20_t4_pista', // tramo 4: la placa ya dijo que hace falta más peso
  t5Crossed: 'b20_t5_suelo', // tramo 5: Suelo Olvidado cruzado
  t5Fall: 'b20_t5_caida', // tramo 5: primera caída (aviso de Zygarde)
  t6Fall: 'b20_t6_caida', // tramo 6: primera caída al vacío
  t6Anchor: 'b20_t6_ancla', // tramo 6: primer poste tocado
  t7Grate: 'b20_t7_reja', // tramo 7: la reja alzada en el eco (sigue alzada en el presente)
  t7Echo: 'b20_t7_eco_visto', // tramo 7: primera vez en el eco de la cisterna
  t8Intro: 'b20_t8_voces', // tramo 8: las tres voces
  t8Door: 'b20_t8_puerta', // tramo 8: la puerta verdadera
  t9Crystal: 'b20_t9_cristal', // tramo 9: primer cristal de cambio usado (explicación del eco del Cruce)
  t9Frozen: 'b20_t9_cascada', // tramo 9: la Cadena tensada hacia el tiempo por primera vez (la cascada se detiene)
  t9Fold: 'b20_t9_pliegue', // tramo 9: la Cadena tensada hacia el espacio por primera vez (los pliegues se abren)
  t9Gap: 'b20_t9_hueco', // tramo 9: el tramo roto de la repisa alta reconstruido
  custodios: 'b20_custodios', // verso X y último mensaje de los Custodios leídos en la pared
  spring: (n) => `b20_manantial_${n}`, // manantial del Origen n usado (punto de control)
  // Cielo Interior y Trío de las Nubes
  skyArrival: 'b20_cielo_llegada',
  tornadus: 'b20_tornadus', // vencido (captura desactivada: «No es momento: es un sello»)
  thundurus: 'b20_thundurus',
  landorus: 'b20_landorus',
  trio: 'b20_trio', // la pregunta respondida: Zygarde responde por el protagonista; el Trío se retira al cielo
  // Terraza del Último Sello: Gael
  gaelHeal: 'b20_gael_cura', // Gael cura con su botiquín
  gaelB6: 'b20_gael_b6', // combate B6 ganado (obligatorio)
  gaelTalk: 'b20_gael_charla', // conversación del verso X (§6.4)
  gaelGone: 'b20_gael_se_va', // se va por la Senda sin llevarse nada
  // Núcleo
  restored: 'p10_restored', // global (content/story/fragments.js)
  flute: 'b20_flute', // salida del bloque: la Flauta Azur
  prophecy: 'b20_profecia', // la profecía entera leída de corrido
  calm: 'b20_falsa_calma', // D19: falsa calma (Zygarde: «El Eje está entero…»)
});

/** Variables del bloque. */
export const V = Object.freeze({
  niches: 'b20_nichos', // máscara de Tablillas colocadas en sus nichos (bit n−1 = T0n)
  stone: (id) => `b20_t1_piedra_${id}`, // orientación de las piedras giratorias del tramo 1
  t8Variant: 'b20_t8_variante', // inscripciones vigentes de las tres puertas (cambia con cada «olvido»)
  t9Axis: 'b20_t9_eje', // tramo 9: tensión de la Cadena Roja en el eco del Cruce ('time' | 'space'; world/axis)
  trioAnswer: 'b20_trio_respuesta', // 'cielo' · 'fuerza' · 'zygarde'
  gaelTries: 'b20_gael_intentos', // derrotas contra Gael (vuelve a curar)
  mesprit: 'b16_mesprit_respuesta', // B16: 'culpa' · 'lejos' · 'permiso' (línea de Gael en §6.4)
  restCount: 'rest_count',
});

export const SPEAKER = Object.freeze({
  gael: 'Gael',
  tornadus: 'Tornadus',
  thundurus: 'Thundurus',
  landorus: 'Landorus',
  trio: 'Los tres',
  saber: 'Voz del Saber',
  sentir: 'Voz del Sentir',
  querer: 'Voz del Querer',
  custodio: 'Eco del custodio',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  gael: spriteOr('gael', 'anil:guay'),
  custodio: spriteOr('archivista', 'anil:fuji'),
  tornadus: 'follower:TORNADUS:0:0',
  thundurus: 'follower:THUNDURUS:0:0',
  landorus: 'follower:LANDORUS:0:0',
});

/** Arte propio (node tools/b20_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  niche: 'asset:objects/b20_nicho.png', // 32×64: 0 vacío · 1–15 con la Tablilla T01–T15
  nicheArceus: 'asset:objects/b20_nicho_arceus.png', // 32×64: fila 2 latido tenue
  beam: 'asset:objects/b20_haz.png', // 32×32: tramo de camino proyectado
  shard: 'asset:objects/b20_fragmento.png', // 32×32: Fragmento Azur flotando
  door: 'asset:objects/b20_puerta.png', // 96×64: losa de la Puerta (0 cerrada, 1–3 hundiéndose)
  grate: 'asset:objects/b20_reja.png', // 32×64: reja de la cisterna (0 caída · 1 alzada · 2 eco bajada · 3 eco alzada)
  stone: 'asset:objects/piedra_dintel.png', // B02: piedra giratoria (dir = orientación de la ranura)
  stoneLit: 'asset:objects/piedra_dintel_viva.png', // B02: encendida
  slab: 'asset:objects/losa_dintel.png', // B02: losa de un dintel (3×3)
  gate: 'asset:objects/b04_compuerta.png', // B04: fila 2 cerrada · 4 abierta con agua · 8 abierta
  lever: 'asset:objects/b04_mando.png', // B04: fila 2 mando cerrado · 4 abierto
  gust: 'asset:objects/rafagas.png', // B06
  plate: 'asset:objects/b08_placa.png', // B08: fila 2 alzada · 4 hundida
  weight: 'asset:objects/b08_contrapeso.png', // B08: contrapeso colgante (decorado)
  caracola: 'asset:objects/b14_caracola.png', // B14: fila 2 presente · 4 Antea
  door16: 'asset:objects/b16_puerta.png', // B16: puertas con numeral (0–2 = I–III; 8 abierta; 9 sellada)
  thread: 'asset:objects/b16_hebra.png', // B16: fila 2 Saber · 4 Sentir · 6 Querer
  zygardeComplete: 'asset:objects/b16_zygarde_completo.png', // B16: Zygarde Completo (128×128)
  portal: 'asset:objects/portal_distorsion.png', // B12: grieta de salida
  barriers: 'asset:objects/barreras.png', // dir 2 roca agrietada · 6 vetas de Trepar
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  door: 'Emociones',
  path: 'Transicion',
  sky: 'Final',
  trio: 'Legendario menor', // CAMPANA §1.8
  terrace: 'Emociones',
  gael: 'CombateRival', // §6.3: «Ultimo Pokemon» con su último Pokémon
  gaelLast: 'Ultimo Pokemon',
  core: 'Emociones',
  flute: 'Pokeflauta',
});

/** Oro del P10 (content/stamps/pilar.js lo expone como pilarTone('P10')). */
export const GOLD = Object.freeze([240, 200, 88]);
export const TELEPATHY = Object.freeze({ telepathy: true });

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

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

/** Varias líneas telepáticas de Zygarde. */
export async function zygardeLines(ctx, list) {
  for (const t of list) await zygardeSays(ctx, t);
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

/** Evento que se examina (sólido o no): texto fijo, lista o función del estado. */
export function examine(id, x, y, text, { solid = true, when: cond } = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid, ...(cond ? { when: cond } : {}),
    script: async (ctx) => {
      const out = typeof text === 'function' ? text(ctx.state) : text;
      for (const t of [].concat(out)) await ctx.say(t);
    },
  };
}

/** Fotograma de una hoja 4×4 (índice = fila·4 + columna) → propiedades de página { dir, pattern }. */
export function frame(index) {
  const i = Math.max(0, Math.min(15, Math.floor(index)));
  return { dir: [2, 4, 6, 8][Math.floor(i / 4)], pattern: i % 4, directionFix: true, walkAnime: false, stepAnime: false };
}

/** Franja de disparadores `touch` (una casilla por evento) con el mismo guion y condición. */
export function strip(prefix, cells, { when: cond = null, script }) {
  return cells.map(([x, y]) => ({
    id: `${prefix}_${x}_${y}`, x, y,
    pages: [{ ...(cond ? { when: cond } : {}), through: true, trigger: 'touch', script }],
  }));
}

/** ¿Tiene el jugador la Forma Completa (Reconstrucción)? */
export const hasComplete = (s) => Boolean(s) && (s.flag('zyg_complete') || Boolean(s.zygardeAbility?.('rebuild')));
