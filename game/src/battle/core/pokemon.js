// Modelo de Pokémon (puro, serializable). Portado de Essentials 21.1 (043_Pokemon).
// Un Pokémon es un objeto JSON plano; las funciones reciben la base de datos `db`
// ({ species, moves, abilities, items, ... }) y devuelven valores o copias nuevas.

export const STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
export const STAT_NAMES = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spa: 'At. Esp.', spd: 'Def. Esp.', spe: 'Velocidad' };
export const MAX_LEVEL = 100;
export const MAX_IV = 31;
export const MAX_EV_TOTAL = 510;
export const MAX_EV_STAT = 252;

// Provisionales (D29 pendiente): ver docs/DECISIONES.md
export const SHINY_CHANCE = 1 / 4096;
export const ALPHA_CHANCE = 0.03;

// Naturalezas en orden de Essentials: índice i → sube NATURE_STAT[floor(i/5)], baja NATURE_STAT[i%5]
const NATURE_STAT = ['atk', 'def', 'spe', 'spa', 'spd'];
export const NATURES = [
  ['HARDY', 'Fuerte'], ['LONELY', 'Huraña'], ['BRAVE', 'Audaz'], ['ADAMANT', 'Firme'], ['NAUGHTY', 'Pícara'],
  ['BOLD', 'Osada'], ['DOCILE', 'Dócil'], ['RELAXED', 'Plácida'], ['IMPISH', 'Agitada'], ['LAX', 'Floja'],
  ['TIMID', 'Miedosa'], ['HASTY', 'Activa'], ['SERIOUS', 'Seria'], ['JOLLY', 'Alegre'], ['NAIVE', 'Ingenua'],
  ['MODEST', 'Modesta'], ['MILD', 'Afable'], ['QUIET', 'Mansa'], ['BASHFUL', 'Tímida'], ['RASH', 'Alocada'],
  ['CALM', 'Serena'], ['GENTLE', 'Amable'], ['SASSY', 'Grosera'], ['CAREFUL', 'Cauta'], ['QUIRKY', 'Rara'],
].map(([id, name], i) => {
  const up = NATURE_STAT[Math.floor(i / 5)];
  const down = NATURE_STAT[i % 5];
  return { id, name, up: up === down ? null : up, down: up === down ? null : down };
});
export const NATURE_BY_ID = Object.fromEntries(NATURES.map((n) => [n.id, n]));

const GENDER_THRESHOLD = {
  AlwaysMale: -1, AlwaysFemale: 256, Genderless: null,
  FemaleOneEighth: 32, Female25Percent: 64, Female50Percent: 128, Female75Percent: 192, FemaleSevenEighths: 224,
};

/** Experiencia total necesaria para alcanzar `level` según la curva de crecimiento. */
export function expForLevel(growthRate, level) {
  const n = Math.min(Math.max(level, 1), MAX_LEVEL);
  if (n <= 1) return 0;
  const n3 = n ** 3;
  switch (growthRate) {
    case 'Fast': return Math.floor((4 * n3) / 5);
    case 'Slow': return Math.floor((5 * n3) / 4);
    case 'Parabolic': return Math.floor((6 * n3) / 5 - 15 * n * n + 100 * n - 140);
    case 'Erratic':
      if (n <= 50) return Math.floor((n3 * (100 - n)) / 50);
      if (n <= 68) return Math.floor((n3 * (150 - n)) / 100);
      if (n <= 98) return Math.floor((n3 * Math.floor((1911 - 10 * n) / 3)) / 500);
      return Math.floor((n3 * (160 - n)) / 100);
    case 'Fluctuating':
      if (n <= 15) return Math.floor((n3 * (Math.floor((n + 1) / 3) + 24)) / 50);
      if (n <= 36) return Math.floor((n3 * (n + 14)) / 50);
      return Math.floor((n3 * (Math.floor(n / 2) + 32)) / 50);
    case 'Medium':
    default:
      return n3;
  }
}

/** Nivel correspondiente a una cantidad de experiencia. */
export function levelForExp(growthRate, exp) {
  let lv = 1;
  while (lv < MAX_LEVEL && expForLevel(growthRate, lv + 1) <= exp) lv += 1;
  return lv;
}

/** Datos efectivos de especie+forma (la forma sobrescribe campos de la especie). */
export function speciesData(db, speciesId, form = 0) {
  const sp = db.species[speciesId];
  if (!sp) throw new Error(`Especie desconocida: ${speciesId}`);
  if (!form || !sp.forms || !sp.forms[form]) return sp;
  return { ...sp, ...sp.forms[form], id: sp.id, num: sp.num, forms: sp.forms };
}

export function calcStat(stat, base, iv, ev, level, natureId) {
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === 'hp') return base === 1 ? 1 : core + level + 10; // Shedinja
  const n = NATURE_BY_ID[natureId];
  const mod = n && n.up === stat ? 1.1 : n && n.down === stat ? 0.9 : 1;
  return Math.floor((core + 5) * mod);
}

/** Estadísticas calculadas { hp, atk, def, spa, spd, spe } (hp = PS máximos). */
export function calcStats(db, pkmn) {
  const sp = speciesData(db, pkmn.species, pkmn.form);
  const out = {};
  for (const s of STATS) out[s] = calcStat(s, sp.baseStats[s], pkmn.ivs[s], pkmn.evs[s], pkmn.level, pkmn.nature);
  return out;
}

/** Movimientos que la especie aprende por nivel hasta `level` (los 4 últimos distintos, como Essentials). */
export function defaultMoves(db, speciesId, form, level) {
  const sp = speciesData(db, speciesId, form);
  const learned = [];
  for (const [lv, move] of sp.moves || []) {
    if (lv > level) continue;
    const idx = learned.indexOf(move);
    if (idx >= 0) learned.splice(idx, 1);
    learned.push(move);
  }
  return learned.slice(-4).filter((m) => db.moves[m]).map((id) => ({ id, pp: db.moves[id].pp, ppUps: 0 }));
}

/** Movimientos nuevos al alcanzar exactamente `level`. */
export function movesLearnedAtLevel(db, speciesId, form, level) {
  const sp = speciesData(db, speciesId, form);
  return (sp.moves || []).filter(([lv]) => lv === level).map(([, m]) => m).filter((m) => db.moves[m]);
}

let uidCounter = 0;
function makeUid(rng) {
  uidCounter += 1;
  return `${Date.now().toString(36)}${Math.floor(rng() * 1e9).toString(36)}${uidCounter}`;
}

/** Personalidad persistente; los guardados anteriores derivan una semilla de su UID sin alterarse. */
function evolutionPersonality(p) {
  if (Number.isInteger(p.personality) && p.personality >= 0 && p.personality <= 0xffffffff) return p.personality;
  let hash = 2166136261;
  for (const ch of String(p.uid || `${p.species}:${p.ot?.id || 0}:${p.metMap || ''}:${p.metLevel || 1}`)) hash = Math.imul(hash ^ ch.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

/**
 * Crea un Pokémon nuevo.
 * opts: { form, gender, nature, shiny, alpha, ivs, evs, moves:[ids], ability, abilityIndex, heldItem,
 *         nickname, ot:{name,id}, ball, metMap, rng, shinyChance, obtainedMode, personality }
 */
export function createPokemon(db, speciesId, level, opts = {}) {
  if (opts.personality != null && (!Number.isInteger(opts.personality) || opts.personality < 0 || opts.personality > 0xffffffff)) throw new Error('Personalidad inválida: se requiere un entero de 32 bits sin signo');
  const rng = opts.rng || Math.random;
  const form = opts.form || 0;
  const sp = speciesData(db, speciesId, form);
  const randIV = () => Math.floor(rng() * (MAX_IV + 1));
  const ivs = Object.fromEntries(STATS.map((s) => [s, opts.ivs?.[s] ?? randIV()]));
  const evs = Object.fromEntries(STATS.map((s) => [s, opts.evs?.[s] ?? 0]));
  const nature = opts.nature || NATURES[Math.floor(rng() * NATURES.length)].id;
  let gender = opts.gender;
  if (gender === undefined) {
    const th = GENDER_THRESHOLD[sp.genderRatio];
    gender = th === null || th === undefined ? null : Math.floor(rng() * 256) < th ? 'F' : 'M';
  }
  const abilityIndex = opts.abilityIndex ?? (sp.abilities && sp.abilities.length > 1 ? Math.floor(rng() * 2) : 0);
  const ability = opts.ability || abilityFor(sp, abilityIndex);
  const moves = opts.moves
    ? opts.moves.filter((m) => db.moves[m]).slice(0, 4).map((id) => ({ id, pp: db.moves[id].pp, ppUps: 0 }))
    : defaultMoves(db, speciesId, form, level);
  const pkmn = {
    uid: makeUid(rng),
    species: speciesId,
    form,
    nickname: opts.nickname || null,
    level,
    exp: expForLevel(sp.growthRate, level),
    gender,
    nature,
    ability,
    abilityIndex,
    shiny: opts.shiny ?? rng() < (opts.shinyChance ?? SHINY_CHANCE),
    alpha: opts.alpha ?? false,
    ivs,
    evs,
    moves,
    hp: 0,
    status: null,
    statusCount: 0,
    heldItem: opts.heldItem || null,
    happiness: sp.happiness ?? 70,
    ball: opts.ball || 'POKEBALL',
    ot: opts.ot || null,
    metMap: opts.metMap || null,
    metLevel: level,
    obtainedMode: opts.obtainedMode || 'met',
  };
  if (opts.personality != null || (sp.evolutions || []).some(([, method]) => method === 'Silcoon' || method === 'Cascoon')) pkmn.personality = opts.personality ?? (Math.floor(rng() * 0x100000000) >>> 0);
  pkmn.hp = calcStats(db, pkmn).hp;
  return pkmn;
}

export function abilityFor(sp, index) {
  if (index >= 2) return (sp.hiddenAbilities && sp.hiddenAbilities[index - 2]) || sp.abilities[0];
  return (sp.abilities && (sp.abilities[index] || sp.abilities[0])) || null;
}

export const displayName = (db, p) => p.nickname || speciesData(db, p.species, p.form).name;
export const maxHP = (db, p) => calcStats(db, p).hp;
export const isFainted = (p) => p.hp <= 0;
export const types = (db, p) => speciesData(db, p.species, p.form).types;

/** Copia curada por completo (PS, PP y estado). */
export function healed(db, p) {
  return {
    ...p,
    hp: maxHP(db, p),
    status: null,
    statusCount: 0,
    moves: p.moves.map((m) => ({ ...m, pp: totalPP(db, m) })),
  };
}

export function totalPP(db, move) {
  const base = db.moves[move.id]?.pp || 0;
  return base + Math.floor((base * (move.ppUps || 0)) / 5);
}

/**
 * Añade experiencia y devuelve { pokemon, levelsGained: [n...] } (sin aprender movimientos;
 * eso lo decide quien llama con movesLearnedAtLevel). Ajusta PS proporcionalmente como Essentials.
 */
export function withExp(db, p, amount) {
  const sp = speciesData(db, p.species, p.form);
  const cap = expForLevel(sp.growthRate, MAX_LEVEL);
  const exp = Math.min(p.exp + Math.max(0, amount), cap);
  const newLevel = levelForExp(sp.growthRate, exp);
  const levelsGained = [];
  for (let lv = p.level + 1; lv <= newLevel; lv++) levelsGained.push(lv);
  const oldMax = maxHP(db, p);
  const next = { ...p, exp, level: newLevel };
  const newMax = maxHP(db, next);
  next.hp = p.hp > 0 ? Math.min(newMax, p.hp + (newMax - oldMax)) : 0;
  return { pokemon: next, levelsGained };
}

/** Añade EVs respetando límites (252 por estadística, 510 total). */
export function withEVs(p, gains) {
  const evs = { ...p.evs };
  let total = STATS.reduce((a, s) => a + evs[s], 0);
  for (const s of STATS) {
    const g = gains[s] || 0;
    if (!g) continue;
    const add = Math.max(0, Math.min(g, MAX_EV_STAT - evs[s], MAX_EV_TOTAL - total));
    evs[s] += add;
    total += add;
  }
  return { ...p, evs };
}

/**
 * Comprueba si el Pokémon evoluciona por nivel/felicidad/objeto tras subir de nivel.
 * Devuelve el ID de la especie destino o null. `ctx` = { item, isDay, mapId, partySpecies, trigger: 'level'|'item'|'trade' }.
 * Cubre los métodos comunes de Essentials; los especiales se amplían en battle/core/evolution.js.
 */
export function evolutionTarget(db, p, ctx = {}) {
  const sp = speciesData(db, p.species, p.form);
  const trigger = ctx.trigger || 'level';
  for (const [target, method, param] of sp.evolutions || []) {
    if (!db.species[target]) continue;
    const lvParam = param != null ? Number(param) : 0;
    switch (method) {
      case 'Level':
        if (trigger === 'level' && p.level >= lvParam) return target;
        break;
      case 'LevelMale':
        if (trigger === 'level' && p.level >= lvParam && p.gender === 'M') return target;
        break;
      case 'LevelFemale':
        if (trigger === 'level' && p.level >= lvParam && p.gender === 'F') return target;
        break;
      case 'LevelDay':
        if (trigger === 'level' && p.level >= lvParam && ctx.isDay) return target;
        break;
      case 'LevelNight':
        if (trigger === 'level' && p.level >= lvParam && ctx.isDay === false) return target;
        break;
      case 'Silcoon':
      case 'Cascoon': {
        // Essentials 21.1: residuo decimal de los 16 bits altos, fijado al nacer.
        const silcoon = ((evolutionPersonality(p) >>> 16) % 10) < 5;
        if (trigger === 'level' && p.level >= lvParam && silcoon === (method === 'Silcoon')) return target;
        break;
      }
      case 'AttackGreater':
      case 'DefenseGreater':
      case 'AtkDefEqual': {
        if (trigger !== 'level' || p.level < lvParam) break;
        const st = calcStats(db, p);
        if (method === 'AttackGreater' && st.atk > st.def) return target;
        if (method === 'DefenseGreater' && st.atk < st.def) return target;
        if (method === 'AtkDefEqual' && st.atk === st.def) return target;
        break;
      }
      case 'Happiness':
        if (trigger === 'level' && p.happiness >= 220) return target;
        break;
      case 'HappinessDay':
        if (trigger === 'level' && p.happiness >= 220 && ctx.isDay) return target;
        break;
      case 'HappinessNight':
        if (trigger === 'level' && p.happiness >= 220 && ctx.isDay === false) return target;
        break;
      case 'HasMove':
        if (trigger === 'level' && p.moves.some((m) => m.id === param)) return target;
        break;
      case 'HoldItem':
        if (trigger === 'level' && p.heldItem === param) return target;
        break;
      case 'DayHoldItem':
        if (trigger === 'level' && p.heldItem === param && ctx.isDay === true) return target;
        break;
      case 'NightHoldItem':
        if (trigger === 'level' && p.heldItem === param && ctx.isDay === false) return target;
        break;
      case 'Item':
        if (trigger === 'item' && ctx.item === param) return target;
        break;
      case 'ItemMale':
        if (trigger === 'item' && ctx.item === param && p.gender === 'M') return target;
        break;
      case 'ItemFemale':
        if (trigger === 'item' && ctx.item === param && p.gender === 'F') return target;
        break;
      case 'Trade':
      case 'TradeItem':
        // Biblia §15: el Cordón Unión permite evoluciones por intercambio en solitario.
        if (trigger === 'trade' && (method === 'Trade' || p.heldItem === param)) return target;
        break;
      default:
        break;
    }
  }
  return null;
}
