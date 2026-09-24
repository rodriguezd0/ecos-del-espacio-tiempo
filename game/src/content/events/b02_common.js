// Constantes y utilidades del Bloque 2 — Pilar del Umbral (docs/CAMPANA.md B02). Módulo puro: sin DOM ni motor
// (se importa desde las definiciones de mapa, también en Node). Los guiones reciben `ctx` (script/context.js).

/** Flags de historia del bloque (orden del guion) y auxiliares. */
export const F = Object.freeze({
  centroTutorial: 'b02_centro_tutorial',   // primera visita al Centro (tutorial de curación y PC)
  gaelWaits: 'b02_gael_espera',            // «Llegué antes. No me ha dejado pasar.»
  casildaJoined: 'b02_casilda_acompana',   // Casilda acepta ir contigo (entrega C009)
  antesala: 'b02_antesala',                // comentario de Casilda en la antesala
  galeria: 'b02_galeria',                  // comentario de Casilda en la Galería de los Dinteles
  dinteles: 'b02_dinteles',                // las tres piedras orientadas: se desliza la losa
  camara: 'b02_camara_geodude',            // comentario de Casilda ante el Geodude
  geodudeFree: 'b02_geodude_libre',        // el jugador lo saca de la grieta
  rockBroken: 'b02_roca_rota',             // Geodude rompe la roca del túnel
  geodudeGift: 'b02_geodude_regalo',       // el Geodude acompaña al jugador (regalo opcional)
  casildaLost: 'b02_casilda_derrota',      // pendiente: Casilda cura en la antesala tras perder
  casildaBeaten: 'b02_casilda_vencida',
  nucleo: 'b02_nucleo',                    // Fragmento 1, Arca y verso I
  shortcut: 'b02_atajo',                   // Casilda abre la losa del atajo Núcleo → Antesala
  exit: 'b02_salida',                      // salida al atardecer (10 %, Gael, Consorcio)
  gaelLeft: 'b02_gael_se_va',
  notebook: 'b02_libreta',                 // Libreta de pistas entregada (abre T01; CAMPANA «Salida»)
  restored: 'p1_restored',                 // lo pone ctx.story.restorePillar(1)
  leftTown: 'b01_left_town',               // entrada del bloque
});

/** Variables del bloque: orientación de cada piedra giratoria (dirección RMXP). */
export const V = Object.freeze({
  stone: (id) => `b02_${id}`,
});

/** Nombres y hablantes (X06, X07; CAMPANA §5.3: la científica del P1 no dice su nombre). */
export const SPEAKER = Object.freeze({
  casilda: 'Casilda',
  gael: 'Gael',
  casia: 'Científica',
  tecnico: 'Técnico',
  tecnica: 'Técnica',
  nurse: 'Enfermera',
});

/** Gráficos (content/characters.js, alias de campaña o charsets de Añil). */
export const SPRITE = Object.freeze({
  casilda: 'casilda',
  gael: 'gael',
  casia: 'casia',
  tecnico: 'genesis_tecnico',
  tecnica: 'genesis_tecnica',
  tripod: 'asset:objects/tripode.png',
  stone: 'asset:objects/piedra_dintel.png',
  stoneLit: 'asset:objects/piedra_dintel_viva.png',
  slab: 'asset:objects/losa_dintel.png',
  skylight: 'asset:objects/tragaluz.png',
  arca: 'asset:objects/arca_zygarde.png',
  bench: 'asset:objects/banco_piedra.png',
  crack: 'asset:objects/grieta_roca.png',
  geodude: 'follower:GEODUDE:0:0',
  rock: 'Object rock',
});

/** Verde de Zygarde para brillos (#B9FF66). */
export const GREEN = Object.freeze([185, 255, 102]);

/** Evalúa flags con una lista: when({ all: ['a'], none: ['b'] }) → función when(state). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Diálogo con hablante. */
export const say = (ctx, speaker, text) => ctx.say(text, { speaker });
/** Telepatía del Core (voz sobria de Zygarde). */
export const core = (ctx, text) => ctx.say(text, { telepathy: true });

/** Fila de disparadores de contacto invisibles (una casilla por punto). */
export function strip(prefix, points, extra) {
  return points.map(({ x, y }) => ({ id: `${prefix}_${x}_${y}`, x, y, trigger: 'touch', ...extra }));
}

/** Objeto interactivo invisible (muebles, carteles de pared…): texto al pulsar A delante. */
export function examine(id, x, y, text, extra = {}) {
  return { id, x, y, trigger: 'action', noOver: true, ...extra, script: async (ctx) => { await ctx.say(text); } };
}

/** Comprobación de progresión de Zygarde (world/zygarde/scenes.js), tolerante si el sistema no está (Node). */
export async function checkProgress(ctx) {
  try {
    const mod = await import('../../world/zygarde/scenes.js');
    return await mod.checkZygardeProgress(ctx);
  } catch (err) {
    console.warn('[b02] Progresión de Zygarde no disponible', err);
    return [];
  }
}

/** Hito narrativo de Zygarde (reachMilestone) tolerante (Node sin motor). */
export async function milestone(ctx, key, opts) {
  try {
    const mod = await import('../../world/zygarde/scenes.js');
    return await mod.reachMilestone(ctx, key, opts);
  } catch (err) {
    console.warn('[b02] Hito de Zygarde no disponible', err);
    if (typeof ctx.setFlag === 'function') ctx.setFlag(F.restored);
    return { unlocked: [], missing: 0 };
  }
}

/** Texto al recibir una célula de un personaje: «(n/100)». */
export function cellGivenText(state) {
  const n = state?.data?.zygarde?.cells?.length ?? 0;
  return `Has recibido una Célula de Zygarde. (${n}/100)`;
}

/**
 * Entrega una célula por guion (C009): state.addCell + aviso + reacción del Core + checkZygardeProgress.
 * Devuelve false si ya la tenía.
 */
export async function giveCell(ctx, key) {
  if (ctx.state.hasCell(key)) return false;
  ctx.state.addCell(key);
  ctx.se('Mining item get');
  ctx.requestRefresh();
  await ctx.flash(GREEN, 12, 90);
  await ctx.say(cellGivenText(ctx.state));
  await checkProgress(ctx);
  return true;
}

/** Efecto visual tolerante (tests sin capa de efectos). */
export function fx(ctx, name, opts = {}) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[b02] efecto ${name} no disponible`, err);
    return null;
  }
}

/** Minutos del reloj de juego hasta la hora `hh:mm` (siempre hacia delante). */
export function minutesUntil(state, hh, mm = 0) {
  const now = state?.data?.clock?.minutes ?? 0;
  return ((hh * 60 + mm - now) % 1440 + 1440) % 1440;
}

/** Camina un evento por una ruta (con velocidad opcional) y espera. */
export function walk(ctx, id, route, speed) {
  return ctx.move(id, route, speed ? { speed } : {});
}

/** Ruta en L (primero horizontal) desde (x0, y0) hasta (x1, y1). */
export function routeTo(x0, y0, x1, y1, { vertical = false } = {}) {
  const h = [];
  const v = [];
  for (let i = 0; i < Math.abs(x1 - x0); i++) h.push(x1 > x0 ? 'right' : 'left');
  for (let i = 0; i < Math.abs(y1 - y0); i++) v.push(y1 > y0 ? 'down' : 'up');
  return vertical ? [...v, ...h] : [...h, ...v];
}
