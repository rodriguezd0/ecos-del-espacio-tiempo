// Constantes y utilidades del Bloque 19 — Interludio 9: la Calzada del Rey (docs/CAMPANA.md B19; TABLILLAS.md T15).
// Módulo puro (se importa en Node desde las definiciones de mapa): flags, variables, hablantes, sprites, música y
// ayudas de guion. Los combates de guion usan el helper común del proyecto (docs/BALANCE.md): bossBattle.
import { getCharacter } from '../characters.js';
import { bossBattle } from '../common/bossBattle.js';
import { spanFlag } from './b19_spans_logic.js';

export { bossBattle };

/**
 * Flags del bloque. Globales sin prefijo: p9_restored (B18). Las claves son únicas en el proyecto (el validador
 * resuelve `F.clave` por nombre de clave).
 */
export const F = Object.freeze({
  p9: 'p9_restored',
  // Llegada y presentación
  arrivalEarly: 'b19_llegada_antes', // visita antes del P9: los Peregrinos esperan
  arrival: 'b19_llegada', // bienvenida de Leocadia tras el P9
  intro: 'b19_casandra_intro', // Casandra cuenta el mito y deja cruzar (segunda pista de T15)
  // Tramos (estabilizados con la Reconstrucción auténtica)
  span1: spanFlag(1),
  span2: spanFlag(2),
  span3: spanFlag(3),
  spanTutorial: 'b19_tramo_tutorial', // Zygarde explica las piedras forzadas la primera vez
  firstCollapse: 'b19_derrumbe_visto',
  // Casandra en la Peña
  casandraArrived: 'b19_casandra_llega',
  casandraBeaten: 'b19_casandra_vencida',
  // Taller del Rey y Tabla Draco
  tallerSeen: 'b19_taller_visto',
  tablet: 'b19_tablilla',
  salamencite: 'b19_salamencita',
  resonatorOff: 'b19_resonador_apagado',
  caretakers: 'b19_cuidadores', // parte de los Peregrinos se queda a cuidar la Calzada
  // Alerce, antes de la bajada
  alerce: 'b19_alerce',
  // Salamence Alfa de la cima
  alfaBeaten: 'b19_alfa',
  alfaCaught: 'b19_alfa_capturado',
  // Sima del Eje
  simaIntro: 'b19_sima_llegada',
  simaGap: 'b19_sima_paso', // hueco del sendero del oeste (Reconstrucción)
  simaDeadEnd: 'b19_sima_camino_incompleto', // la Calzada se corta: falta la última Crónica
  simaWayKnown: 'b19_sima_camino_completo', // con la Tabla Draco, el zócalo del borde brilla: se sabe por dónde sigue
  finalGap: 'b19_sima_ultimo_tramo', // último tramo de la Calzada (con la Tabla Draco)
  exit: 'b19_calzada', // SALIDA del bloque (content/story/journal.js): la Calzada llega a la Puerta de las Quince
});

/** Variables del bloque. */
export const V = Object.freeze({
  restCount: 'rest_count',
  alfaRest: 'b19_alfa_descanso', // rest_count cuando se venció al Alfa (reaparece al descansar)
  collapses: 'b19_derrumbes', // veces que se ha derrumbado un tramo
});

export const SPEAKER = Object.freeze({
  casandra: 'Casandra',
  leocadia: 'Leocadia',
  tadeo: 'Tadeo',
  tarsicio: 'Tarsicio',
  cocinera: 'Peregrina',
  nino: 'Niño peregrino',
  mercader: 'Peregrino',
  alerce: 'Prof. Alerce',
  peregrino: 'Peregrino',
  peregrina: 'Peregrina',
});

const spriteOr = (id, fallback) => (getCharacter(id) ? id : fallback);

/** Gráficos de mapa (content/characters.js) con reserva de Añil. */
export const SPRITE = Object.freeze({
  casandra: 'anil:veterana',
  leocadia: 'anil:excursionista_f',
  tadeo: 'anil:montanero',
  tarsicio: spriteOr('anciano', 'anil:veterano'),
  cocinera: spriteOr('vecina', 'anil:dama'),
  nino: spriteOr('nino', 'chaval1'),
  mercader: 'anil:excursionista',
  alerce: spriteOr('profesor', 'anil:cientifico'),
  peregrino: 'anil:excursionista',
  peregrina: 'anil:excursionista_f',
  noivern: 'follower:NOIVERN:0:0',
  salamence: 'follower:SALAMENCE:0:0',
});

/** Objetos con arte propio (tools/b19_assets.mjs) y de otros bloques (solo lectura). */
export const OBJ = Object.freeze({
  resonator: 'asset:objects/b19_resonador.png', // fila 2 tirando de las piedras · 4 apagado y rajado
  needle: 'asset:objects/b19_aguja.png', // fila 2 dormida · 4 despierta
  banner: 'asset:objects/b19_estandarte.png',
  plate: 'asset:objects/b19_tablilla.png', // fila 2 con brillo · 4 hornacina vacía
  taller: 'asset:objects/b19_taller.png', // piezas del taller (índice = fila·4 + columna)
  stone: 'asset:objects/b19_piedra.png', // fila 2 flotando · 4 se agrieta y cae
  fire: 'asset:objects/hoguera.png', // hoguera (arte de B06)
});

/** Música (nombres de Añil, provisionales X04/X20). */
export const MUSIC = Object.freeze({
  calzada: 'CalleVictoria',
  taller: 'Emociones',
  sima: 'Amenaza',
  casandra: 'Batalla Jefe Torre',
  boss: 'PrismaBoss',
  tension: 'Amenaza',
});

export const TELEPATHY = Object.freeze({ telepathy: true });

/** Condición de página a partir de flags: all / none / test. */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Dice varias líneas seguidas con el mismo hablante (las funciones reciben el estado). */
export async function lines(ctx, speaker, list, extra = {}) {
  for (const t of list) {
    const text = typeof t === 'function' ? t(ctx.state) : t;
    await ctx.say(text, speaker ? { speaker, ...extra } : extra);
  }
}

/** Línea telepática de Zygarde (solo si acompaña al jugador). */
export async function zygardeSays(ctx, text) {
  if (!ctx.state.data.zygarde?.form) return;
  ctx.se?.('core_signal', { volume: 45 });
  await ctx.say(text, TELEPATHY);
}

/** Varias líneas telepáticas de Zygarde. */
export async function zygardeLines(ctx, list) {
  for (const t of list) await zygardeSays(ctx, t);
}

/** Texto según el género del jugador (state.player.gender 'F' → femenino). */
export const byGender = (state, masc, fem) => (state?.player?.gender === 'F' ? fem : masc);

/** Pequeña espera tolerante a guiones sin escena (tests). */
export const pause = (ctx, frames) => (typeof ctx.wait === 'function' ? ctx.wait(frames) : Promise.resolve());

/** ctx.effect sin romper el guion si el efecto no existe (tests). */
export function fx(ctx, name, opts) {
  try {
    return ctx.effect?.(name, opts) || null;
  } catch (err) {
    console.warn(`[b19] efecto ${name}`, err);
    return null;
  }
}

/** Busca un evento del mapa actual por id (o null). */
export const eventById = (ctx, id) => ctx.world?.events?.find((e) => e.id === id) || null;

/** Recoloca al jugador (y su cadena de seguidores) en una casilla del mapa actual sin warp. */
export async function placePlayer(ctx, { x, y, dir = 2 }) {
  const p = ctx.player;
  p.moveTo(x, y);
  p.direction = dir;
  p.straighten?.();
  const { placeChainBehind } = await import('../../world/follower.js');
  placeChainBehind(p, ctx.world.followers);
  ctx.scene?.camera?.snapToTarget?.();
  ctx.state.setPosition(ctx.map.id, p.x, p.y, p.direction);
}

/** ¿El Alfa de la cima está en su nido? (reaparece al descansar hasta capturarse). */
export const alfaPresent = (s) => Boolean(s) && !s.flag(F.alfaCaught)
  && (!s.flag(F.alfaBeaten) || Number(s.var(V.restCount, 0)) > Number(s.var(V.alfaRest, -1)));

/** ¿Están los Peregrinos levantando la Calzada? (tras el P9 y hasta la Crónica XV) */
export const pilgrimsForcing = (s) => Boolean(s) && s.flag(F.p9) && !s.flag(F.resonatorOff);
