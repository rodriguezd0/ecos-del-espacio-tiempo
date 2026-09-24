// Constantes y utilidades del Bloque 4 — Pilar de la Corriente (docs/CAMPANA.md B04). Módulo PURO (sin DOM):
// flags, hablantes, gráficos, música y pequeñas ayudas de guion comunes a Ruta 3, Garganta, Pilar y Caudal.

/** Flags del bloque (orden del guion). `p2_restored` lo pone content/story (restorePillar). */
export const F = Object.freeze({
  gargantaArrival: 'b04_garganta_llegada', // el Core nota las balizas al entrar en la Garganta
  beacons: 'b04_balizas_retiradas', // las tres balizas del Consorcio retiradas
  clash: 'b04_choque', // Gael y Leandro chocan a la puerta del Pilar (y Leandro la abre)
  dare: 'b04_reto', // Leandro reta al jugador dentro del Pilar («ver si sabe dónde pisa»)
  cycle: 'b04_ciclo', // ciclo E1→E6→noria→E1 cerrado (content/events/b04_hydraulics.js CYCLE_FLAG)
  leandroBeaten: 'b04_leandro_vencido',
  inscription: 'b04_inscripcion', // inscripción junto al verso II leída (T02 paso 2, T03)
  leandroGone: 'b04_leandro_despedida', // «Mañana, en la plaza»
  thanks: 'b04_gracias', // Leandro da las gracias en la plaza al día siguiente
  starterGift: 'b04_inicial', // Alerce entrega el inicial que nadie eligió
  restored: 'p2_restored', // global: la consulta B05 (vado de la Ruta 4) y B03 (molinos de Caudal)
});

/** Variables: balizas retiradas (0–3) y puzle de la Escalera (b04_hydraulics.PUZZLE_VARS). */
export const V = Object.freeze({ beacons: 'b04_balizas' });

export const SPEAKER = Object.freeze({
  leandro: 'Leandro',
  gael: 'Gael',
  alerce: 'Prof. Alerce',
  tecnico: 'Técnico del Consorcio',
  tecnica: 'Técnica del Consorcio',
});

/** Gráficos de mapa (content/characters.js; reserva de Añil para los que no tienen arte propio). */
export const SPRITE = Object.freeze({
  leandro: 'leandro',
  gael: 'gael',
  alerce: 'profesor',
  tecnico: 'genesis_tecnico',
  tecnica: 'genesis_tecnica',
  beacon: 'asset:objects/b04_baliza.png',
  gate: 'asset:objects/b04_compuerta.png',
  lever: 'asset:objects/b04_mando.png',
  noria: 'asset:objects/b04_noria.png',
});

/** Música (nombres del catálogo o archivos de Añil; CAMPANA §1.8, X20: provisionales). */
export const AUDIO = Object.freeze({
  guardian: 'CombateLider',
  genesis: 'EncuentroRocket',
  trainer: 'PrismaEntrenador',
  plaza: 'CiudadCeleste',
  water: 'PRSFX- Surf',
  splash: 'PRSFX- Water Sport',
  lever: 'PRSFX- Shift Gear',
  gear: 'PRSFX- Gear Grind',
});

export const SAY_CORE = Object.freeze({ telepathy: true });

/** Condición when(state) a partir de flags: all(['a']) y none(['b']). */
export function when({ all = [], none = [], test = null } = {}) {
  return (s) => Boolean(s) && all.every((k) => s.flag(k)) && none.every((k) => !s.flag(k)) && (!test || test(s));
}

/** Pronombres del protagonista para los textos («chaval»/«chavala», «él»/«ella»). */
export function kid(state) {
  return state?.player?.gender === 'F' ? 'chavala' : 'chaval';
}

/** Inicial que nadie eligió (X13): el que no es del jugador ni de Gael. */
export const STARTERS = Object.freeze(['TURTWIG', 'LITTEN', 'SOBBLE']);
export const ADVANTAGE = Object.freeze({ TURTWIG: 'LITTEN', LITTEN: 'SOBBLE', SOBBLE: 'TURTWIG' });
export function unchosenStarter(state) {
  const mine = state?.var?.('starter', null) || 'TURTWIG';
  const gael = state?.var?.('gael_starter', null) || ADVANTAGE[mine] || 'LITTEN';
  return STARTERS.find((s) => s !== mine && s !== gael) || 'SOBBLE';
}
/** Nivel del inicial que regala Alerce tras el P2 (DECIDIDO-DEV: CAMPANA no lo fija). */
export const GIFT_STARTER_LEVEL = 15;

/** Evento de Pokémon del equipo de Gael que le ayuda (seguidor de Añil). */
export const follower = (species) => `follower:${species}:0:0`;
