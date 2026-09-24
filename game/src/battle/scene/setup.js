// Construcción de la configuración del motor a partir de lo que envía el mundo (world/battleFlow.js).
// Módulo PURO (sin DOM): se prueba con node --test.
//   - Resuelve entrenadores por id (content/trainers) → rival del motor + datos de presentación.
//   - Traduce el clima del mapa ('rain', 'snow'…) al del motor ('Rain', 'Hail'…).
//   - Elige el fondo de combate de Añil (Graphics/Battlebacks/<nombre>_bg.png) por mapa/entorno.
//   - Rellena los datos del jugador desde GameState (dinero, Pokédex, Mega Aro, PC lleno).
import { createPokemon } from '../core/pokemon.js';

const ENGINE_WEATHERS = ['None', 'Sun', 'Rain', 'Sandstorm', 'Hail', 'HarshSun', 'HeavyRain', 'StrongWinds'];
const ENGINE_TERRAINS = ['None', 'Electric', 'Grassy', 'Misty', 'Psychic'];

/** Clima del overworld (render/weather.js) → clima del motor. */
export const OVERWORLD_WEATHER = Object.freeze({
  rain: 'Rain', storm: 'Rain', heavyRain: 'Rain', snow: 'Hail', blizzard: 'Hail', sandstorm: 'Sandstorm', sun: 'Sun',
});

/** Clima del motor → clima visual (WeatherLayer) y potencia. */
export const BATTLE_WEATHER_FX = Object.freeze({
  Rain: ['rain', 6], HeavyRain: ['heavyRain', 8], Sun: ['sun', 6], HarshSun: ['sun', 9],
  Sandstorm: ['sandstorm', 6], Hail: ['snow', 6], StrongWinds: ['none', 0], None: ['none', 0],
});

export function battleWeather(value) {
  if (!value) return 'None';
  if (ENGINE_WEATHERS.includes(value)) return value;
  return OVERWORLD_WEATHER[value] || 'None';
}

export function battleTerrain(value) {
  return ENGINE_TERRAINS.includes(value) ? value : 'None';
}

// Fondos disponibles en Añil (nombre → extensión). Los alias permiten usar nombres genéricos en los mapas.
const BACKDROP_EXT = { Desierto: 'jpg' };
export const BACKDROP_ALIASES = Object.freeze({
  field: 'Pradera', grass: 'Pradera', route: 'Pradera', meadow: 'Pradera', pradera: 'Pradera',
  indoor: 'Interior', interior: 'Interior', house: 'Interior', casa: 'Interior',
  lab: 'Laboratorio', laboratorio: 'Laboratorio',
  cave: 'Cueva', cueva: 'Cueva', darkcave: 'CuevaOscura',
  water: 'water', sea: 'water', agua: 'water', river: 'water_rio', lake: 'water',
  forest: 'Bosque', bosque: 'Bosque', town: 'Pueblo', pueblo: 'Pueblo', village: 'Pueblo',
  city: 'Ciudad', ciudad: 'Ciudad', beach: 'Playa', playa: 'Playa', snow: 'snow', nieve: 'snow',
  mountain: 'Monte', monte: 'Monte', desert: 'Desierto', desierto: 'Desierto', volcano: 'Volcan',
  distortion: 'MundoDistorsion', sky: 'Cielo', temple: 'Templo', ruins: 'Templo', bridge: 'PuenteMadera',
});

const ENV_BACKDROP = Object.freeze({
  Grass: 'Pradera', TallGrass: 'Pradera', Sand: 'Playa', Rock: 'Monte', Ice: 'snow', Snow: 'snow',
  Cave: 'Cueva', Volcano: 'Volcan', Forest: 'Bosque', Puddle: 'Pradera',
});

/**
 * Fondo de combate. `battleback` del mapa (alias o nombre de Añil), entorno del terreno pisado,
 * hora y si se está nadando. Devuelve { name, file, night }.
 */
export function resolveBackdrop({ battleback = null, environment = null, time = 'day', cave = false } = {}) {
  const alias = battleback ? BACKDROP_ALIASES[String(battleback).toLowerCase()] || battleback : null;
  let name = alias;
  const water = environment === 'MovingWater' || environment === 'StillWater' || environment === 'Underwater';
  if (water) name = cave || name === 'Cueva' ? 'water_cueva' : 'water';
  if (!name) name = cave ? 'Cueva' : ENV_BACKDROP[environment] || 'Pradera';
  const ext = BACKDROP_EXT[name] || 'png';
  return { name, file: `Graphics/Battlebacks/${name}_bg.${ext}`, night: time === 'night' };
}

/** Nivel de IA de un entrenador (número 0–100 o { skill }). */
function aiSkill(ai) {
  if (typeof ai === 'number') return ai;
  if (ai && typeof ai.skill === 'number') return ai.skill;
  return 32;
}

/** Pokémon de una definición ({ species, level, moves, item… }) o un Pokémon ya creado (uid). */
export function pokemonFromSpec(db, spec, extra = {}) {
  if (spec?.uid) return spec;
  if (!spec?.species) throw new Error(`Pokémon de entrenador inválido: ${JSON.stringify(spec)}`);
  if (!db.species[spec.species]) throw new Error(`Especie desconocida en un entrenador: ${spec.species}`);
  return createPokemon(db, spec.species, spec.level ?? 5, {
    form: spec.form, shiny: spec.shiny ?? false, nature: spec.nature, ivs: spec.ivs, evs: spec.evs,
    moves: spec.moves, ability: spec.ability, abilityIndex: spec.abilityIndex, heldItem: spec.item || spec.heldItem,
    gender: spec.gender, nickname: spec.nickname, ...extra,
  });
}

/**
 * Rival del motor a partir de una definición de content/trainers.
 * @returns {{ opponent: object, trainerType: object, meta: object }}
 */
export function resolveTrainer(def, db, id = def?.id || 'trainer') {
  if (!def) throw new Error(`Entrenador desconocido: ${id}`);
  if (!Array.isArray(def.party) || def.party.length === 0) throw new Error(`El entrenador ${id} no tiene Pokémon`);
  const typeId = `AXIS:${id}`;
  const party = def.party.map((spec) => pokemonFromSpec(db, spec));
  return {
    opponent: {
      name: def.name || 'Entrenador', trainerType: typeId, id, party,
      items: [...(def.items || [])], skill: aiSkill(def.ai), baseMoney: def.money ?? null,
      loseText: def.loseText || null, winText: def.winText || null, megaRing: Boolean(def.megaRing),
    },
    trainerType: { [typeId]: { name: def.class || '', baseMoney: def.money ?? 30 } },
    meta: {
      id, name: def.name || 'Entrenador', className: def.class || '', sprite: def.sprite || null,
      bgm: def.bgm || null, victoryBgm: def.victoryBGM || def.victoryBgm || null, format: def.format || null,
      canLose: Boolean(def.canLose), intro: def.intro || null,
    },
  };
}

const MEGA_KEY_ITEMS = ['MEGARING', 'MEGABRACELET', 'KEYSTONE', 'MEGACUFF', 'MEGACHARM'];
const DEFAULT_BGM = ['Entrenador', 'Salvaje']; // valores por defecto de battleFlow: se pueden refinar

/** ¿Están llenos el equipo y todas las cajas? */
export function storageFull(state) {
  if (!state?.data) return false;
  if ((state.data.party || []).length < 6) return false;
  return (state.data.boxes || []).every((box) => box.every(Boolean));
}

/**
 * Música del combate: la pedida explícitamente, la del entrenador o la genérica del catálogo.
 * @param {object} request  config de ctx.battle / battleFlow
 * @param {object|null} trainerMeta  meta de resolveTrainer
 */
export function battleBgmFor(request = {}, trainerMeta = null) {
  const isTrainer = request.type === 'trainer' || Boolean(request.trainer);
  const explicit = request.bgm && !DEFAULT_BGM.includes(request.bgm) ? request.bgm : null;
  return explicit || trainerMeta?.bgm || (isTrainer ? 'battle_trainer' : 'battle_wild');
}

/**
 * Configuración completa del motor + datos de presentación.
 * @param {object} request  lo que envía battleFlow (type, trainer, opponent, player, rules, weather…)
 * @param {{ db: object, state?: object, getTrainer?: (id, state) => object }} deps
 * @returns {{ config: object, meta: object }}
 */
export function buildBattleConfig(request = {}, { db, state = null, getTrainer = null } = {}) {
  if (!db?.species) throw new Error('buildBattleConfig: falta la base de datos (engine.data)');
  const isTrainer = request.type === 'trainer' || Boolean(request.trainer);
  let opponent = request.opponent ? { ...request.opponent } : {};
  let trainerMeta = null;
  let trainerTypes = db.trainerTypes || {};
  if (isTrainer && typeof request.trainer === 'string') {
    if (typeof getTrainer !== 'function') throw new Error('buildBattleConfig: no se pueden resolver entrenadores por id');
    const res = resolveTrainer(getTrainer(request.trainer, state), db, request.trainer);
    opponent = { ...res.opponent, ...(request.opponent?.party ? { party: request.opponent.party } : {}) };
    trainerMeta = res.meta;
    trainerTypes = { ...trainerTypes, ...res.trainerType };
  } else if (isTrainer && request.trainer && typeof request.trainer === 'object') {
    const res = resolveTrainer(request.trainer, db, request.trainer.id || 'custom');
    opponent = res.opponent;
    trainerMeta = res.meta;
    trainerTypes = { ...trainerTypes, ...res.trainerType };
  }
  // Varios entrenadores rivales (dobles 2 contra 2, aditivo B06): request.trainers = ['id' | def, …].
  let rivalSprites = null;
  if (isTrainer && Array.isArray(request.trainers) && request.trainers.length) {
    if (typeof getTrainer !== 'function' && request.trainers.some((t) => typeof t === 'string')) {
      throw new Error('buildBattleConfig: no se pueden resolver entrenadores por id');
    }
    const list = request.trainers.map((t) => (typeof t === 'string'
      ? resolveTrainer(getTrainer(t, state), db, t)
      : resolveTrainer(t, db, t.id || 'custom')));
    opponent = list.map((r) => r.opponent);
    trainerMeta = { ...list[0].meta, name: list.map((r) => r.meta.name).join(' y ') };
    for (const r of list) trainerTypes = { ...trainerTypes, ...r.trainerType };
    rivalSprites = list.map((r) => r.meta.sprite);
  }
  if (Array.isArray(opponent.party)) opponent.party = opponent.party.map((p) => pokemonFromSpec(db, p));
  // Compañero en dobles (aditivo B06): request.ally = { name, party: [spec…], skill? }.
  const ally = request.ally && Array.isArray(request.ally.party)
    ? { ...request.ally, party: request.ally.party.map((spec) => pokemonFromSpec(db, spec)) }
    : null;
  const p = request.player || {};
  const bag = p.bag || state?.data?.bag || {};
  const caught = Object.keys(state?.data?.dex?.caught || {});
  const canLose = Boolean(request.canLose || request.rules?.canLose || trainerMeta?.canLose);
  const format = request.format && request.format !== 'single' ? request.format : trainerMeta?.format || request.format || 'single';
  const time = request.time || 'day';
  const config = {
    db: { ...db, trainerTypes },
    seed: request.seed,
    rng: request.rng,
    type: isTrainer ? 'trainer' : 'wild',
    format,
    player: {
      name: p.name || state?.player?.name || 'Axis',
      id: p.id ?? state?.player?.id,
      party: p.party || state?.party || [],
      bag,
      money: p.money ?? state?.player?.money ?? 0,
      dexCaught: caught.length,
      caughtSpecies: caught,
      hasPokedex: state?.hasPokedex ? state.hasPokedex() : true,
      megaRing: p.megaRing ?? MEGA_KEY_ITEMS.some((k) => (bag[k] || 0) > 0),
      badges: p.badges || 0,
    },
    opponent,
    rules: {
      canRun: !isTrainer,
      canCatch: !isTrainer,
      expGain: true,
      ...(request.rules || {}),
      canLose,
      storageFull: request.rules?.storageFull ?? storageFull(state),
    },
    weather: battleWeather(request.weather),
    terrain: battleTerrain(request.terrain),
    environment: request.environment || 'None',
    time,
    battleback: request.battleback || null,
    phases: request.phases,
    phaseTarget: request.phaseTarget,
  };
  if (!config.phases) delete config.phases;
  if (config.phaseTarget === undefined) delete config.phaseTarget;
  if (ally) config.ally = ally;
  const backdrop = resolveBackdrop({ battleback: request.battleback, environment: request.environment, time, cave: Boolean(request.cave) });
  const meta = {
    isTrainer,
    canLose,
    trainer: trainerMeta,
    trainerSprites: isTrainer ? (rivalSprites || [trainerMeta?.sprite || request.trainerSprite || null]) : [],
    playerGender: p.gender || state?.player?.gender || 'M',
    backdrop,
    bgm: battleBgmFor(request, trainerMeta),
    victoryBgm: trainerMeta?.victoryBgm || (isTrainer ? 'victory_trainer' : 'victory_wild'),
    auto: request.auto || null, // piloto automático (solo desarrollo)
  };
  return { config, meta };
}
