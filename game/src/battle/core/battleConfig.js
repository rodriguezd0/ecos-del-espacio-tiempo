// Normalización y validación de la configuración de un combate (ARCHITECTURE §7).
//
// @typedef {object} BattleConfig
// @property {object} db            { species, moves, types, items, abilities, trainerTypes } (engine.data)
// @property {'wild'|'trainer'} [type]      por defecto 'wild' (o 'trainer' si opponent.trainerType)
// @property {'single'|'double'} [format]  por defecto 'single'
// @property {number} [seed]        semilla del RNG (o `rng`: función () => [0,1))
// @property {object} player        { name, id, party: Pokémon[], bag: {ITEM: n}, money, badges, megaRing,
//                                    expAll, dexCaught, caughtSpecies }
// @property {object} [ally]        compañero en dobles: { name, party, skill }
// @property {object|object[]} opponent  { name, trainerType, party, items: [], skill, baseMoney, loseText, winText, megaRing,
//                                    megaRingName (con artículo: «el aro negro»; por defecto «el Mega Aro») }
// @property {object} [rules]       { canRun, canLose, canSwitch, expGain, moneyGain, canCatch, catchReason,
//                                    catchCondition(battle) → {allowed, reason}, storageFull, noMoneyLoss,
//                                    controlPlayer, disablePokeBalls, defaultWeather }
// @property {string} [weather]     'None'|'Sun'|'Rain'|'Sandstorm'|'Hail'(nieve)|'HarshSun'|'HeavyRain'|'StrongWinds'
// @property {string} [terrain]     'None'|'Electric'|'Grassy'|'Misty'|'Psychic'
// @property {string} [environment] entorno de Essentials (Grass, Cave, MovingWater…): Daño Secreto, Camuflaje…
// @property {'day'|'night'} [time]
// @property {object[]} [phases]    fases de jefe (ver bossPhases.js)   @property {number} [phaseTarget]
import { createRng } from './rng.js';
import { clonePokemon } from './pokemonUtil.js';

const WEATHERS = ['None', 'Sun', 'Rain', 'Sandstorm', 'Hail', 'HarshSun', 'HeavyRain', 'StrongWinds'];
const TERRAINS = ['None', 'Electric', 'Grassy', 'Misty', 'Psychic'];

function fail(msg) {
  throw new Error(`Configuración de combate inválida: ${msg}`);
}

function checkParty(db, party, who) {
  if (!Array.isArray(party) || party.length === 0) fail(`${who} no tiene Pokémon`);
  party.forEach((p, i) => {
    if (!p || !p.species) fail(`${who}: el Pokémon ${i} no es válido`);
    if (!db.species[p.species]) fail(`${who}: especie desconocida ${p.species}`);
    if (!Array.isArray(p.moves)) fail(`${who}: ${p.species} no tiene lista de movimientos`);
    for (const m of p.moves) if (!db.moves[m.id]) fail(`${who}: movimiento desconocido ${m.id}`);
  });
}

function normTrainer(t, defaults) {
  return {
    name: t.name || defaults.name,
    trainerType: t.trainerType || null,
    id: t.id ?? null,
    badges: t.badges || 0,
    baseMoney: t.baseMoney ?? null,
    loseText: t.loseText || null,
    winText: t.winText || null,
    items: [...(t.items || [])],
    skill: t.ai?.skill ?? t.skill ?? defaults.skill,
    megaRing: t.megaRing ?? defaults.megaRing,
    megaRingName: t.megaRingName || null,
  };
}

/**
 * Devuelve una configuración completa con valores por defecto. Clona los equipos (la entrada
 * no se modifica nunca): el resultado del combate devuelve las copias actualizadas.
 */
export function normalizeConfig(config) {
  if (!config || typeof config !== 'object') fail('falta el objeto de configuración');
  const db = config.db;
  if (!db || !db.species || !db.moves || !db.types || !db.items) fail('falta config.db (species, moves, types, items, abilities)');
  const type = config.type || (config.opponent && config.opponent.trainerType ? 'trainer' : 'wild');
  if (!['wild', 'trainer'].includes(type)) fail(`tipo desconocido "${type}"`);
  const format = config.format || 'single';
  if (!['single', 'double'].includes(format)) fail(`formato desconocido "${format}"`);
  const player = config.player || {};
  checkParty(db, player.party, 'El jugador');
  const opponents = Array.isArray(config.opponent) ? config.opponent : [config.opponent || {}];
  opponents.forEach((o, i) => checkParty(db, o.party, `El rival ${i + 1}`));
  if (config.ally) checkParty(db, config.ally.party, 'El aliado');
  const weather = config.weather || 'None';
  if (!WEATHERS.includes(weather)) fail(`clima desconocido "${weather}"`);
  const terrain = config.terrain || 'None';
  if (!TERRAINS.includes(terrain)) fail(`campo desconocido "${terrain}"`);
  const rules = { canRun: true, canLose: false, canSwitch: true, expGain: true, moneyGain: true, alwaysFlee: false, ...config.rules };
  if (rules.catchCondition && typeof rules.catchCondition !== 'function') fail('rules.catchCondition debe ser una función (battle) => {allowed, reason}');
  if (config.phases && !Array.isArray(config.phases)) fail('phases debe ser una lista');
  const rng = typeof config.rng === 'function' ? config.rng : createRng(config.seed ?? Date.now());
  return {
    db,
    rng,
    type,
    format,
    player: {
      ...normTrainer(player, { name: 'Axis', skill: 0, megaRing: true }),
      money: player.money ?? 0,
      dexCaught: player.dexCaught ?? 0,
      caughtSpecies: new Set(player.caughtSpecies || []),
      hasPokedex: player.hasPokedex ?? true,
      party: player.party.map(clonePokemon),
      bag: { ...(player.bag || {}) },
      expAll: player.expAll ?? rules.expAll ?? false,
      amuletCoin: !!player.amuletCoin,
    },
    ally: config.ally ? { ...normTrainer(config.ally, { name: 'Aliado', skill: 32, megaRing: false }), party: config.ally.party.map(clonePokemon) } : null,
    opponents: opponents.map((o) => ({
      ...normTrainer(o, { name: type === 'wild' ? '' : 'Entrenador', skill: type === 'wild' ? 0 : 32, megaRing: !!o.megaRing }),
      party: o.party.map(clonePokemon),
    })),
    rules,
    weather,
    terrain,
    environment: config.environment || 'None',
    time: config.time || 'day',
    isDay: config.isDay ?? (config.time ? config.time !== 'night' : true),
    battleback: config.battleback || null,
    phases: config.phases ? config.phases.map((p) => ({ ...p })) : [],
    phaseTarget: config.phaseTarget ?? 1,
    encounterType: config.encounterType || null,
  };
}
