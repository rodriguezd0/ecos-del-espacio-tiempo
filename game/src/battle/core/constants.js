// Constantes del motor de combate (portadas de Essentials 21.1: GameData::Stat, Target, Status…).

export const STAT_STAGE_MULTIPLIERS = [2, 2, 2, 2, 2, 2, 2, 3, 4, 5, 6, 7, 8];
export const STAT_STAGE_DIVISORS = [8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 2, 2, 2];
export const ACC_EVA_STAGE_MULTIPLIERS = [3, 3, 3, 3, 3, 3, 3, 4, 5, 6, 7, 8, 9];
export const ACC_EVA_STAGE_DIVISORS = [9, 8, 7, 6, 5, 4, 3, 3, 3, 3, 3, 3, 3];
export const STAT_STAGE_MAXIMUM = 6;

/** Estadísticas con etapas en combate (orden de GameData::Stat.each_battle). */
export const BATTLE_STATS = ['ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED', 'ACCURACY', 'EVASION'];
/** Estadísticas principales (each_main_battle). */
export const MAIN_BATTLE_STATS = ['ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED'];

export const STAT_NAMES = Object.freeze({
  HP: 'PS', ATTACK: 'Ataque', DEFENSE: 'Defensa', SPECIAL_ATTACK: 'Ataque Especial',
  SPECIAL_DEFENSE: 'Defensa Especial', SPEED: 'Velocidad', ACCURACY: 'Precisión', EVASION: 'Evasión',
});

/** Clave de estadística del motor → clave del objeto Pokémon (pokemon.js). */
export const STAT_TO_PKMN = Object.freeze({
  HP: 'hp', ATTACK: 'atk', DEFENSE: 'def', SPECIAL_ATTACK: 'spa', SPECIAL_DEFENSE: 'spd', SPEED: 'spe',
});
export const PKMN_TO_STAT = Object.freeze(Object.fromEntries(Object.entries(STAT_TO_PKMN).map(([k, v]) => [v, k])));

export const STATUS_NAMES = Object.freeze({
  NONE: '', SLEEP: 'Dormido', POISON: 'Envenenado', BURN: 'Quemado', PARALYSIS: 'Paralizado',
  FROZEN: 'Congelado', FROSTBITE: 'Congelación',
});

/** Objetivos de movimiento (GameData::Target). */
export const TARGETS = Object.freeze(Object.fromEntries([
  ['None', {}],
  ['User', {}],
  ['NearAlly', { numTargets: 1 }],
  ['UserOrNearAlly', { numTargets: 1 }],
  ['AllAllies', { numTargets: 2, targetsAll: true, longRange: true }],
  ['UserAndAllies', { numTargets: 2, longRange: true }],
  ['NearFoe', { numTargets: 1, targetsFoe: true }],
  ['RandomNearFoe', { numTargets: 1, targetsFoe: true }],
  ['AllNearFoes', { numTargets: 2, targetsFoe: true }],
  ['Foe', { numTargets: 1, targetsFoe: true, longRange: true }],
  ['AllFoes', { numTargets: 2, targetsFoe: true, longRange: true }],
  ['NearOther', { numTargets: 1, targetsFoe: true }],
  ['AllNearOthers', { numTargets: 2, targetsFoe: true }],
  ['Other', { numTargets: 1, targetsFoe: true, longRange: true }],
  ['AllBattlers', { numTargets: 2, targetsFoe: true, targetsAll: true, longRange: true }],
  ['UserSide', {}],
  ['FoeSide', { affectsFoeSide: true }],
  ['BothSides', { affectsFoeSide: true }],
].map(([id, t]) => {
  const numTargets = t.numTargets || 0;
  const data = {
    id,
    numTargets,
    targetsFoe: !!t.targetsFoe,
    targetsAll: !!t.targetsAll,
    affectsFoeSide: !!t.affectsFoeSide,
    longRange: !!t.longRange,
    canChooseDistantTarget: numTargets === 1 && !!t.longRange,
    canTargetOneFoe: numTargets === 1 && !!t.targetsFoe,
  };
  return [id, Object.freeze(data)];
})));

export function targetData(id) {
  return TARGETS[id] || TARGETS.None;
}

export const WEATHER_NAMES = Object.freeze({
  None: '', Sun: 'Sol', Rain: 'Lluvia', Sandstorm: 'Tormenta de arena', Hail: 'Nieve',
  HarshSun: 'Sol abrasador', HeavyRain: 'Diluvio', StrongWinds: 'Turbulencias', ShadowSky: 'Cielo sombrío',
});

export const TERRAIN_NAMES = Object.freeze({
  None: '', Electric: 'Campo Eléctrico', Grassy: 'Campo de Hierba', Misty: 'Campo de Niebla', Psychic: 'Campo Psíquico',
});

/** Mensajes al terminar un campo. */
export const TERRAIN_END_MESSAGES = Object.freeze({
  Electric: 'El campo de corriente eléctrica ha desaparecido.',
  Grassy: 'La hierba ha desaparecido.',
  Misty: 'La niebla se ha disipado.',
  Psychic: 'Ha desaparecido la extraña sensación que se percibía en el terreno de combate.',
});

export const OHKO_CODES = Object.freeze(['OHKO', 'OHKOIce', 'OHKOHitsUndergroundTarget']);

/** Acciones posibles de un combatiente en una ronda. */
export const ACTIONS = Object.freeze({
  NONE: 'None', MOVE: 'UseMove', SWITCH: 'SwitchOut', ITEM: 'UseItem', CALL: 'Call', RUN: 'Run', SHIFT: 'Shift',
});

/** Resultado del combate (Essentials: 0 indeciso, 1 gana, 2 pierde, 3 huida, 4 captura, 5 empate). */
export const DECISION = Object.freeze({ NONE: 0, WIN: 1, LOSE: 2, RUN: 3, CAUGHT: 4, DRAW: 5 });
export const DECISION_OUTCOME = Object.freeze({ 0: 'forfeit', 1: 'win', 2: 'lose', 3: 'run', 4: 'caught', 5: 'draw' });

/** «You blacked out!» de Essentials: único aviso de derrota (el combate lo da; el mapa solo si faltó). */
export const BLACKOUT_TEXT = '¡Estás fuera de combate!';
