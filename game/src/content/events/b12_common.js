// Constantes y utilidades del Bloque 12 — Pilar Invertido (docs/CAMPANA.md B12). Módulo puro (se importa en Node
// desde las definiciones de mapa): flags, variables, hablantes, gráficos, música y ayudas de guion.
// Voz de Zygarde: sobria, breve y telepática (CAMPANA §3.2). Zygarde habla muy poco (autor, 25-09-2026). En el P6 no hay Guardián ni combate de jefe.
import { getCharacter } from '../characters.js';

/**
 * Flags del bloque. Globales sin prefijo: p6_restored (restorePillar), zyg_50 y zyg_core_3 (sistema de Zygarde).
 * Las claves son únicas en el proyecto (el validador resuelve `F.clave` por nombre de clave).
 */
export const F = Object.freeze({
  // Monte del Portal
  monteLlegadaP6: 'b12_monte_llegada', // primera llegada a la explanada de día
  aljibeResuena: 'b12_aljibe_abierto', // el aljibe responde a Zygarde por primera vez
  repisaCascada: 'b12_repisa_vista', // lo alto del macizo de la cascada
  // Mundo Distorsión
  interiorVisto: 'b12_interior_visto', // primera llegada a la explanada interior
  primeraCaidaP6: 'b12_caida_vista', // primera caída al vacío (narración neutra)
  primeraAnclaP6: 'b12_ancla_vista', // primer poste tocado
  caraEntrada1: 'b12_cara_1_vista',
  caraEntrada2: 'b12_cara_2_vista',
  caraEntrada3: 'b12_cara_3_vista',
  caraVueltaHecha: 'b12_cara_vuelta', // salida de la tercera sala
  miradaVista: 'b12_mirada_vista',
  miradaHecha: 'b12_mirada',
  sumideroVisto: 'b12_sumidero_visto',
  pulsadorP6a: 'b12_pulsador_1',
  pulsadorP6b: 'b12_pulsador_2',
  pulsadorP6c: 'b12_pulsador_3',
  sombraGiratina: 'b12_sombra', // la sombra cruza el vacío mayor (una sola vez)
  caerParaBajar: 'b12_pista_caida', // pista: dejarse caer para volver al poste de abajo
  sumideroHecho: 'b12_sumidero',
  nucleoVisto: 'b12_nucleo_visto',
  selloCerrado: 'b12_sello', // el sello se vuelve a formar sin N3
  respuestaP6: 'b12_respuesta', // «Aquí lo empujé. Tres noches.»
  regresoMonteP6: 'b12_regreso', // de vuelta en el Monte tras restaurar
  // Mundo
  lucaritaCasilda: 'b12_lucarita', // Casilda entrega la Lucarita en Villa Zaguán
  temblorAlba: 'b12_temblor_visto', // temblores nocturnos en Villa Alba antes del P6
});

/** Variables del bloque. */
export const V = Object.freeze({
  nucleoOrden: 'b12_nucleo_orden', // Anclas del núcleo tocadas en orden (0–3)
});

/** Flags de otros bloques que el B12 consulta. */
export const EXT = Object.freeze({
  gaelB4: 'b11_gael_b4', // entrada del bloque
  exp03: 'b11_exp03', // Genesis perforó la explanada y se llevó el cristal
  leftTown: 'b01_left_town', // partida real (no el prólogo)
  restored: 'p6_restored',
  p5: 'p5_restored',
  zaguanExit: 'b02_salida', // Casilda vive en su casa desde el P1
});

export const SPEAKER = Object.freeze({
  casilda: 'Casilda',
  hiker: 'Montañera',
  vecino: 'Vecino',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

export const SPRITE = Object.freeze({
  casilda: spriteOr('casilda', spriteOr('guardiana', 'anil:dama')),
  hiker: spriteOr('montanera', 'anil:excursionista_f'),
  vecino: spriteOr('vecino', 'anil:veterano'),
});

/** Arte propio (tools/b12_assets.mjs) y reutilizado de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  monte: 'asset:objects/b12_monte.png', // fila 2 tierra quemada · 4 piedra quemada · 6 zarpazos · 8 huellas de botas
  genesis: 'asset:objects/b12_genesis.png', // fila 2 estaca · 4 caja de sensores · 6 cable
  sondeo: 'asset:objects/b11_sondeo.png', // pozo de sondeo (B11): fila 2 abierto
  seal: 'asset:objects/sello_brecha.png', // fila 2 abierto con N3 · 4 cerrándose · 6 sellado
  aljibe: 'asset:objects/aljibe.png', // el aljibe del prólogo (B01): fila 2 apagado · 4 violeta · 6 abierto
  veins: 'asset:objects/barreras.png', // vetas verdes de Trepar (dir 6)
  anchorVeta: 'asset:objects/ancla_veta.png',
  anchorOjo: 'asset:objects/ancla_ojo.png',
  anchorGota: 'asset:objects/ancla_gota.png',
  portal: 'asset:objects/portal_distorsion.png',
});

export const ANCHOR_ART = Object.freeze({ veta: OBJ.anchorVeta, ojo: OBJ.anchorOjo, gota: OBJ.anchorGota });

/** Música (catálogo semántico o archivos de Añil; provisional X04/X20). */
export const MUSIC = Object.freeze({
  monte: 'Intro', // CAMPANA §1.4: «Intro (eco del prólogo)»
  distortion: 'distortion',
  tension: 'tension',
});

/** Violeta del P6 (fragments.js: tinte del kit). */
export const VIOLET = Object.freeze([168, 104, 232]);
export const GREEN = Object.freeze([185, 255, 102]);

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Condición de página a partir de flags: all / none / test. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((key) => s.flag(key)) && none.every((key) => !s.flag(key)) && (!test || test(s));
}

/** Noche de juego (20:00–5:59). */
export const isNight = (s) => Boolean(s) && typeof s.isDay === 'function' && !s.isDay();

/** Varias líneas seguidas del mismo hablante. */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of list) await ctx.say(text, speaker ? { speaker, ...extra } : extra);
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Varias líneas telepáticas seguidas. */
export async function zygardeLines(ctx, list) {
  for (const text of list) await zygardeSays(ctx, text);
}

/** Texto según el género del jugador (state.player.gender 'F' → femenino). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento por id del mapa actual o null. */
export const eventById = (ctx, id) => ctx.world?.events?.find((e) => e.id === id) || null;
