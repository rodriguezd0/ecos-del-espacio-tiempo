// Constantes y utilidades del Bloque 22d — Postgame IV: sellos, sueños y laboratorios (docs/CAMPANA.md §8 «B22»:
// Regirock, Regice, Registeel, Regigigas, Heatran, Darkrai, Cresselia, Mewtwo y Marshadow). Módulo PURO (se importa en
// Node desde las definiciones de mapa y los tests): flags, variables, hablantes, gráficos, música y ayudas de guion.
// Reglas comunes del postgame (CAMPANA B22): todo en solitario; las condiciones de captura se explican en pantalla; un
// intento bloqueado no gasta objeto ni turno; un legendario debilitado reaparece al descansar (var `rest_count` de
// world/rest.js; Darkrai, en el siguiente «dormir profundamente»).
import { getCharacter } from '../characters.js';

/** Entrada del postgame (B21): cielo restablecido y despertar en el cuarto. */
export const ENTRY = Object.freeze({ cleared: 'game_cleared', awake: 'b21_fin' });

/** Flags del bloque (prefijo b22d_). Los de captura los consultan otros mapas (README). */
export const F = Object.freeze({
  // Regirock (Mina Galena · Fermín)
  ferminAsk: 'b22d_fermin_relieve', // Fermín cuenta lo del relieve y baja a la mina
  reliefSeen: 'b22d_relieve_visto', // el jugador ha mirado el relieve
  reliefRead: 'b22d_relieve_leido', // Fermín lo ha leído junto al jugador
  picoOpen: 'b22d_pico_abierto', // la Cueva Sellada del Pico está abierta
  // Regice (Villa Boreal · Rosendo)
  rosendoAsk: 'b22d_rosendo_bodega', // Rosendo cuenta lo de la bodega y abre la trampilla
  carvingModel: 'b22d_talla_modelo', // el jugador ha examinado la talla vieja (el modelo)
  escarchaOpen: 'b22d_escarcha_abierta', // la talla está terminada: el muro de hielo se abre
  // Registeel (Lúmina · Rosalía)
  rosaliaAsk: 'b22d_rosalia_tuneles', // Rosalía cuenta lo del reloj y baja al sótano
  liftOpen: 'b22d_montacargas', // Rosalía abre el montacargas viejo del muelle (y baja detrás)
  clockSeen: 'b22d_reloj_visto', // el jugador ha visto el reloj parado (Rosalía pide las piezas)
  clockRestored: 'b22d_reloj_restaurado', // el reloj funciona: la puerta del Engranaje se abre
  tunnelRocks: 'b22d_tuneles_derrumbe', // cascotes del túnel sur rotos (Embestida)
  // Regigigas (Archivo Hondo)
  colosoOpen: 'b22d_coloso_abierto', // el sello de los tres se ha abierto
  // Heatran (Tizón · Brasa)
  magmaStone: 'b22d_piedra_magma', // Brasa ha entregado la Piedra Magma
  causeway: 'b22d_calzada_magma', // el magma se ha abierto hasta la boca del cráter
  heatranite: 'b22d_heatranita', // Brasa entrega la Heatranita (tras capturar a Heatran)
  // Darkrai y Cresselia (Villa Alba · Mamá)
  rumor: 'b22d_mama_rumor', // «Tienes mala cara, ¿duermes bien?»
  nightmare: 'b22d_pesadilla_activa', // el jugador está dentro del sueño
  nightmareIntro: 'b22d_pesadilla_intro', // escena de llegada del sueño vista (esta noche)
  darkraiMet: 'b22d_darkrai_visto', // primer encuentro con Darkrai (Mamá teje el Atrapasueños)
  dreamcatcher: 'b22d_atrapasuenos', // Mamá ha entregado el Atrapasueños
  darkranite: 'b22d_darkrainita', // la piedra junto a la almohada
  // Mewtwo (Instalación Cierzo)
  cierzoOpen: 'b22d_cierzo_abierta', // la verja del islote se abre (300 especies vistas)
  // Marshadow (Pilar del Umbral · Casilda)
  casildaWarn: 'b22d_casilda_aviso', // aviso de Casilda
  shadowFound: 'b22d_sombra_vista', // el jugador ha distinguido la sombra que se mueve a destiempo
});

/** Variables del bloque. */
export const V = Object.freeze({
  restCount: 'rest_count', // world/rest.js
  reliefStep: 'b22d_relieve_paso', // golpes acertados seguidos en las marcas del relieve (0–3)
  carving: 'b22d_talla', // máscara de los nueve bloques tallados (bits 0–8)
  clockParts: 'b22d_reloj_piezas', // máscara de las piezas del reloj recogidas (bits 0–2)
  sleepNight: 'b22d_dormir_noche', // 1 = el sueño profundo empezó de noche (lo pone la cama de casa)
  shadowStep: 'b22d_sombra_paso', // punto de la ruta de la sombra alcanzado (0–n)
  protoBeaten: 'b22d_prototipos', // prototipos vencidos (0–3)
});

/** Legendarios del bloque: clave → { species, flags de captura/derrota y var del descanso }. */
export const LEGENDS = Object.freeze(Object.fromEntries(
  ['regirock', 'regice', 'registeel', 'regigigas', 'heatran', 'darkrai', 'cresselia', 'mewtwo', 'marshadow'].map((k) => [k, Object.freeze({
    key: k,
    species: k.toUpperCase(),
    caught: `b22d_${k}_capturado`,
    beaten: `b22d_${k}_vencido`,
    rest: `b22d_${k}_descanso`,
  })]),
));

export const SPEAKER = Object.freeze({
  mom: 'Mamá',
  fermin: 'Fermín',
  rosendo: 'Rosendo',
  rosalia: 'Rosalía',
  brasa: 'Brasa',
  casilda: 'Casilda',
  terminal: 'Terminal',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js, Graphics/Characters de Añil o arte propio de tools/b22d_assets.mjs). */
export const SPRITE = Object.freeze({
  mom: spriteOr('mama', 'anil:mujer1'),
  fermin: spriteOr('fermin', 'anil:minero'),
  rosendo: spriteOr('rosendo', 'anciano2'),
  rosalia: spriteOr('rosalia', 'anil:empresariaa'),
  casilda: spriteOr('guardiana', 'anil:anciana1'),
  regirock: 'REGIROCK',
  regice: 'REGICE',
  registeel: 'REGISTEEL',
  regigigas: 'REGIGIGAS',
  heatran: 'HEATRAN',
  darkrai: 'DARKRAI',
  cresselia: 'CRESSELIA',
  mewtwo: 'follower:MEWTWO:0:0',
  marshadow: 'MARSHADOW',
});

/** Hojas de objetos propias (4×4; la fila la elige `dir`). Ver tools/b22d_assets.mjs. */
export const OBJ = Object.freeze({
  relief: 'asset:objects/b22d_relieve.png', // 96×64: 2 sellado · 4 signos encendidos · 6 grieta
  marks: 'asset:objects/b22d_marcas.png', // 32×32: 2 pico · 4 lámpara · 6 vagoneta · 8 casco (col 1–3: brillo)
  knob: 'asset:objects/b22d_hielo.png', // 32×64: 2 bloque en bruto · 4 bloque tallado · 6 talla vieja · 8 muro de hielo
  hatch: 'asset:objects/b22d_trampilla.png', // 32×32: 2 trampilla de madera · 4 abierta · 6 montacargas · 8 abierto
  clock: 'asset:objects/b22d_reloj.png', // 96×128: 2 parado · 4 en marcha (anima) · 6 sin maquinaria
  parts: 'asset:objects/b22d_piezas.png', // 32×32: 2 péndulo · 4 rueda de escape · 6 pesa
  steelDoor: 'asset:objects/b22d_puerta_acero.png', // 32×64: 2 cerrada · 4 abriéndose · 6 abierta
  seal: 'asset:objects/b22d_sello.png', // 96×32: 2 sello apagado · 4 tres luces · 6 escalera abierta
  shadow: 'asset:objects/b22d_sombra.png', // 64×32: sombras alargadas (4 fotogramas de vaivén)
  lab: 'asset:objects/b22d_cierzo.png', // 32×64: 2 puerta roja · 4 puerta verde · 6 tanque roto · 8 terminal
  magma: 'asset:objects/b22d_magma.png', // 32×32: 2 losa de basalto · 4 basalto que brilla · 6 boca de magma
});

/** Música (nombres de Añil, provisionales X04/X20; CAMPANA §1.8). */
export const MUSIC = Object.freeze({
  legend: 'Legendario',
  legendMajor: 'Legendario mayor',
  proto: 'PrismaBoss',
  mewtwo: 'CombateMewtwo',
  cierzo: 'Laboratorio',
  cierzoCore: 'Mewtwo',
  dream: 'Lugar Fantasmal',
  sealed: 'Cueva',
  shadow: 'Lugar Fantasmal',
});

export const TELEPATHY = Object.freeze({ telepathy: true });
export const GREEN = Object.freeze([185, 255, 102]);

/** ¿Ha empezado el postgame? (el cielo está restablecido) */
export const postgame = (s) => Boolean(s?.flag?.(ENTRY.cleared));
/** Postgame con el epílogo ya terminado (para las escenas en la casa de Villa Alba). */
export const postgameAwake = (s) => postgame(s) && Boolean(s.flag(ENTRY.awake));

/** Noche del reloj de juego (mismo tramo que render/dayNight.js#isNightHour). */
export function isNight(state) {
  const h = state?.hour ?? 12;
  return h < 6 || h >= 20;
}

/** Texto según el género del protagonista (state.player.gender 'M' | 'F'). */
export function byGender(state, male, female) {
  return state?.player?.gender === 'F' ? female : male;
}

/** Condición de página a partir de flags: all / none (+ test opcional). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || Boolean(test(s)));
}

/** Dice varias líneas seguidas con el mismo hablante (se admiten funciones del estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const text of [].concat(list)) {
    const t = typeof text === 'function' ? text(ctx.state) : text;
    await ctx.say(t, speaker ? { speaker, ...extra } : extra);
  }
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state?.data?.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(typeof text === 'function' ? text(ctx.state) : text, TELEPATHY);
}

/** Espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** Evento del mapa por id (o null). */
export function eventById(ctx, id) {
  return ctx.world?.events?.find((e) => e.id === id) || null;
}

/** Examinar: evento de acción sin gráfico con uno o varios textos. */
export function examine(id, x, y, text, extra = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, ...extra,
    script: async (ctx) => { for (const t of [].concat(text)) await ctx.say(typeof t === 'function' ? t(ctx.state) : t); },
  };
}

/** Número de descansos (world/rest.js). */
export const restCount = (s) => Number(s?.var?.(V.restCount, 0)) || 0;

/**
 * ¿Está el legendario en su sitio? Sin capturar y, si se debilitó, tras descansar (CAMPANA §2.6).
 * `extra(s)` añade la condición propia del encuentro (noche, objeto, requisito…).
 */
export function legendPresent(s, key, extra = null) {
  const L = LEGENDS[key];
  if (!s || !L || !postgame(s) || s.flag(L.caught)) return false;
  if (s.flag(L.beaten) && restCount(s) <= Number(s.var(L.rest, -1))) return false;
  return !extra || Boolean(extra(s));
}

/** Aplica el resultado de un combate contra un legendario: captura → flag; debilitado → espera al descanso. */
export function recordLegendOutcome(state, key, outcome) {
  const L = LEGENDS[key];
  if (!L) throw new Error(`b22d: legendario desconocido «${key}»`);
  if (outcome === 'caught') {
    state.setFlag(L.caught, true);
    return 'caught';
  }
  if (outcome === 'win') {
    state.setFlag(L.beaten, true);
    state.setVar(L.rest, restCount(state));
    return 'beaten';
  }
  return outcome;
}

/** ¿Lleva el jugador a esta especie en el equipo (sin contar huevos)? */
export function partyHas(state, species) {
  return (state?.party || []).some((p) => p && !p.egg && p.species === species);
}

/** Fija la hora del reloj de juego (minutos desde las 0:00) avanzando lo necesario. */
export function setClock(state, hour, minute = 0) {
  const target = (((hour * 60 + minute) % 1440) + 1440) % 1440;
  const now = state.data.clock?.minutes ?? 0;
  const delta = (target - now + 1440) % 1440;
  if (delta) state.advanceMinutes(delta);
}
