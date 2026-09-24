// Constantes y utilidades de las escenas de Villa Alba (bloque 1). Guion: docs/bloques/B01_apertura.md.
// Módulo puro: sin DOM ni engine (se importa desde las definiciones de mapa, también en Node).

/** Flags de historia del bloque 1 (orden del guion §3) y auxiliares propios del pueblo. */
export const F = Object.freeze({
  woke: 'b01_woke',
  metMom: 'b01_met_mom',
  starter: 'b01_starter_chosen',
  signal: 'b01_signal_heard',
  policeIn: 'b01_police_entered',
  coreFound: 'b01_core_found',
  escorted: 'b01_escorted',
  duel: 'b01_gael_duel_done',
  dex: 'b01_dex_received',
  leftTown: 'b01_left_town',
  // auxiliares (no forman parte de la cadena principal)
  labIntro: 'b01_lab_intro_seen',
  momGift: 'b01_mom_gift',
});

/** Variables del bloque 1. */
export const V = Object.freeze({ starter: 'starter', gaelStarter: 'gael_starter' });

/** Iniciales por orden de la máquina (izquierda → derecha) y el de ventaja que elige Gael (D05). */
export const STARTERS = Object.freeze(['TURTWIG', 'LITTEN', 'SOBBLE']);
export const ADVANTAGE = Object.freeze({ TURTWIG: 'LITTEN', LITTEN: 'SOBBLE', SOBBLE: 'TURTWIG' });
export const STARTER_LEVEL = 5;

/** Nombres del elenco secundario (X07, docs/CAMPANA.md «B01 — ajustes DECIDIDO-DEV»). */
export const CAST = Object.freeze({
  police: 'Agente Olmedo', // el policía del acceso al Laberinto
  owners: 'Arenzana', // familia dueña del Laberinto de la Profundidad
  assistant: 'Lía', // ayudante del laboratorio (mujer joven)
});

export const SPEAKER = Object.freeze({
  mom: 'Mamá',
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  police: CAST.police,
  assistant: CAST.assistant,
});

/** Gráficos de los personajes (content/characters.js o charsets de Añil). */
export const SPRITE = Object.freeze({
  mom: 'mama',
  gael: 'gael',
  alerce: 'profesor',
  police: 'policia',
  assistant: 'ayudante',
  ball: 'Object ball',
});

/** Canción/ME del catálogo de audio (nombres semánticos, provisionales X04). */
export const AUDIO = Object.freeze({
  town: 'town_start',
  lab: 'lab',
  rival: 'battle_rival',
  heal: 'heal',
  pokemonGet: 'pokemon_get',
  keyItem: 'key_item_get',
});

/** Gael elige el inicial con ventaja de tipo sobre el del jugador (D05). */
export function gaelStarterFor(playerStarter) {
  const pick = ADVANTAGE[playerStarter];
  if (!pick) throw new Error(`Inicial desconocido: ${playerStarter}`);
  return pick;
}

/** Pronombre del protagonista para los textos de Gael ("¿Por qué él/ella?"). */
export function playerPronoun(state) {
  return state?.player?.gender === 'F' ? 'ella' : 'él';
}

/** Evalúa flags con una lista: all(['a','b']) y none(['c']) → función when(state). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Punto de cura de casa (la madre): destino tras perder y de la Cuerda Huida (state.healPoint). */
export const HOME_HEAL_POINT = Object.freeze({ mapId: 'casa_prota_1f', x: 4, y: 6, dir: 8 });

/** Fija la casa como punto de cura con la API de guiones (ctx.setHealPoint, ARCHITECTURE §6). */
export function setHomeHealPoint(ctx) {
  if (!ctx || typeof ctx.setHealPoint !== 'function') return;
  const { mapId, x, y, dir } = HOME_HEAL_POINT;
  ctx.setHealPoint(x, y, dir, mapId);
}
