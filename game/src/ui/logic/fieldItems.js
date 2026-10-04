// Uso de objetos fuera de combate (curar, revivir, PP, vitaminas, caramelos, piedras, MT). Módulo PURO:
// devuelve copias nuevas del Pokémon y mensajes; la pantalla decide la interfaz y confirma en GameState.
import {
  calcStats, displayName, evolutionTarget, speciesData, withEVs, withExp, expForLevel, movesLearnedAtLevel,
  totalPP, MAX_LEVEL,
} from '../../battle/core/pokemon.js';

const HP_ITEMS = {
  POTION: 20, SUPERPOTION: 60, HYPERPOTION: 120, FRESHWATER: 30, SODAPOP: 50, LEMONADE: 70,
  MOOMOOMILK: 100, ENERGYPOWDER: 60, ENERGYROOT: 120, BERRYJUICE: 20, ORANBERRY: 10,
};
const FULL_HP = ['MAXPOTION', 'FULLRESTORE'];
const FULL_STATUS = [
  'FULLHEAL', 'FULLRESTORE', 'HEALPOWDER', 'LAVACOOKIE', 'OLDGATEAU', 'CASTELIACONE', 'LUMIOSEGALETTE',
  'SHALOURSABLE', 'BIGMALASADA', 'PEWTERCRUNCHIES', 'RAGECANDYBAR', 'LUMBERRY', 'JUBILIFEMUFFIN',
];
const STATUS_ITEMS = {
  ANTIDOTE: 'POISON', PECHABERRY: 'POISON', PARALYZEHEAL: 'PARALYSIS', CHERIBERRY: 'PARALYSIS',
  AWAKENING: 'SLEEP', CHESTOBERRY: 'SLEEP', BURNHEAL: 'BURN', RAWSTBERRY: 'BURN', ICEHEAL: 'FROZEN', ASPEARBERRY: 'FROZEN',
};
const REVIVES = { REVIVE: 0.5, MAXREVIVE: 1, REVIVALHERB: 1 };
const PP_ONE = { ETHER: 10, MAXETHER: Infinity, LEPPABERRY: 10 };
const PP_ALL = { ELIXIR: 10, MAXELIXIR: Infinity };
const VITAMINS = { HPUP: 'hp', PROTEIN: 'atk', IRON: 'def', CALCIUM: 'spa', ZINC: 'spd', CARBOS: 'spe' };
const FEATHERS = {
  HEALTHFEATHER: 'hp', MUSCLEFEATHER: 'atk', RESISTFEATHER: 'def', GENIUSFEATHER: 'spa', CLEVERFEATHER: 'spd', SWIFTFEATHER: 'spe',
};
const EXP_CANDIES = { EXPCANDYXS: 100, EXPCANDYS: 800, EXPCANDYM: 3000, EXPCANDYL: 10000, EXPCANDYXL: 30000 };
const STATUS_NAMES = { POISON: 'envenenamiento', PARALYSIS: 'parálisis', SLEEP: 'sueño', BURN: 'quemaduras', FROZEN: 'congelación' };
const REPELS = { REPEL: 100, SUPERREPEL: 200, MAXREPEL: 250 };

/** ¿Cómo se usa en el campo? 'pokemon' (elige Pokémon), 'move' (Pokémon + movimiento), 'world', 'repel' o null. */
export function fieldUseKind(item) {
  if (!item) return null;
  const id = item.id;
  if (item.fieldUse === 'TM' || item.fieldUse === 'HM' || item.fieldUse === 'TR') return 'pokemon';
  if (PP_ONE[id] || id === 'PPUP' || id === 'PPMAX') return 'move';
  if (REPELS[id]) return 'repel';
  if (item.fieldUse === 'OnPokemon') return 'pokemon';
  if (item.fieldUse === 'Direct') return 'world';
  if ((item.flags || []).includes('KeyItem')) return 'world';
  return null;
}

export function repelSteps(itemId) {
  return REPELS[itemId] || 0;
}

const maxHpOf = (db, p) => calcStats(db, p).hp;

/**
 * Aplica un objeto a un Pokémon.
 * @returns {{ ok: boolean, pokemon: object, message: string, consumed: boolean,
 *            levelsGained?: number[], evolveTo?: string, teach?: string }}
 *   ok=false → "No tendría ningún efecto." (no se consume)
 */
export function useItemOnPokemon(db, itemId, p, opts = {}) {
  const item = db.items[itemId];
  if (!item) return fail(p, 'Ese objeto no existe.');
  const name = displayName(db, p);
  const max = maxHpOf(db, p);
  const noEffect = () => fail(p, 'No tendría ningún efecto.');

  if (item.fieldUse === 'TM' || item.fieldUse === 'HM' || item.fieldUse === 'TR') return teachMachine(db, item, p, name);

  if (REVIVES[itemId] !== undefined) {
    if (p.hp > 0) return noEffect();
    const hp = Math.max(1, Math.floor(max * REVIVES[itemId]));
    return ok({ ...p, hp, status: null, statusCount: 0 }, `${name} se ha recuperado.`);
  }
  if (p.hp <= 0 && !['RARECANDY'].includes(itemId) && !VITAMINS[itemId] && !FEATHERS[itemId] && !EXP_CANDIES[itemId]
    && !(item.flags || []).includes('EvolutionStone')) return noEffect();

  const heal = HP_ITEMS[itemId] ?? (FULL_HP.includes(itemId) ? Infinity : itemId === 'SITRUSBERRY' ? Math.floor(max / 4) : null);
  const cureAll = FULL_STATUS.includes(itemId);
  const cures = STATUS_ITEMS[itemId];
  if (heal !== null || cureAll || cures) {
    let next = p;
    const msgs = [];
    if (heal !== null && p.hp < max) {
      const hp = Math.min(max, p.hp + heal);
      next = { ...next, hp };
      msgs.push(`${name} ha recuperado ${hp - p.hp} PS.`);
    }
    if ((cureAll && p.status) || (cures && (p.status === cures || (cures === 'POISON' && p.status === 'TOXIC')))) {
      const which = STATUS_NAMES[p.status === 'TOXIC' ? 'POISON' : p.status] || 'problema de estado';
      next = { ...next, status: null, statusCount: 0 };
      msgs.push(heal !== null ? `${name} se ha recuperado.` : `${name} se ha curado de ${which}.`);
    }
    if (next === p) return noEffect();
    return ok(next, msgs.length > 1 ? `${name} se ha recuperado por completo.` : msgs[0]);
  }
  if (PP_ALL[itemId]) {
    let changed = false;
    const moves = p.moves.map((m) => {
      const tot = totalPP(db, m);
      if (m.pp >= tot) return m;
      changed = true;
      return { ...m, pp: Math.min(tot, m.pp + PP_ALL[itemId]) };
    });
    return changed ? ok({ ...p, moves }, 'Se han restaurado los PP.') : noEffect();
  }
  if (PP_ONE[itemId] || itemId === 'PPUP' || itemId === 'PPMAX') return usePPItem(db, itemId, p, opts.moveIndex ?? 0);
  if (VITAMINS[itemId] || FEATHERS[itemId]) {
    const stat = VITAMINS[itemId] || FEATHERS[itemId];
    const next = withEVs(p, { [stat]: VITAMINS[itemId] ? 10 : 1 });
    if (next.evs[stat] === p.evs[stat]) return noEffect();
    const statName = { hp: 'PS', atk: 'Ataque', def: 'Defensa', spa: 'Ataque Especial', spd: 'Defensa Especial', spe: 'Velocidad' }[stat];
    return ok(recalcHp(db, p, next), `${statName} de ${name} ha aumentado.`);
  }
  if (itemId === 'RARECANDY' || EXP_CANDIES[itemId]) {
    if (p.level >= MAX_LEVEL) return noEffect();
    const sp = speciesData(db, p.species, p.form);
    const amount = itemId === 'RARECANDY' ? expForLevel(sp.growthRate, p.level + 1) - p.exp : EXP_CANDIES[itemId];
    const { pokemon, levelsGained } = withExp(db, p, amount);
    const next = p.hp > 0 ? pokemon : { ...pokemon, hp: 0 };
    const res = ok(next, levelsGained.length ? `¡${name} ha subido al nivel ${next.level}!` : `${name} ha ganado experiencia.`);
    res.levelsGained = levelsGained;
    res.newMoves = levelsGained.flatMap((lv) => movesLearnedAtLevel(db, next.species, next.form, lv))
      .filter((m) => !next.moves.some((k) => k.id === m));
    const evo = levelsGained.length ? evolutionTarget(db, next, { trigger: 'level', isDay: opts.isDay }) : null;
    if (evo) res.evolveTo = evo;
    return res;
  }
  if ((item.flags || []).includes('EvolutionStone')) {
    const evo = evolutionTarget(db, p, { trigger: 'item', item: itemId, isDay: opts.isDay });
    if (!evo) return noEffect();
    return { ok: true, pokemon: p, message: '', consumed: true, evolveTo: evo };
  }
  return fail(p, 'No se puede usar aquí.');
}

function usePPItem(db, itemId, p, idx) {
  const m = p.moves[idx];
  if (!m) return fail(p, 'No tendría ningún efecto.');
  const tot = totalPP(db, m);
  const moveName = db.moves[m.id]?.name || m.id;
  if (itemId === 'PPUP' || itemId === 'PPMAX') {
    if ((m.ppUps || 0) >= 3 || (db.moves[m.id]?.pp || 0) < 5) return fail(p, 'No tendría ningún efecto.');
    const ppUps = itemId === 'PPMAX' ? 3 : (m.ppUps || 0) + 1;
    const nm = { ...m, ppUps };
    nm.pp = m.pp + (totalPP(db, nm) - tot);
    return ok({ ...p, moves: p.moves.map((x, i) => (i === idx ? nm : x)) }, `Han aumentado los PP de ${moveName}.`);
  }
  if (m.pp >= tot) return fail(p, 'No tendría ningún efecto.');
  const pp = Math.min(tot, m.pp + PP_ONE[itemId]);
  return ok({ ...p, moves: p.moves.map((x, i) => (i === idx ? { ...x, pp } : x)) }, `Se han restaurado los PP de ${moveName}.`);
}

/** ¿Puede aprender el movimiento de la MT? (movimientos de tutor/MT o por nivel de la especie). */
export function canLearnMachine(db, p, moveId) {
  const sp = speciesData(db, p.species, p.form);
  return (sp.tutorMoves || []).includes(moveId) || (sp.moves || []).some(([, m]) => m === moveId) || (sp.eggMoves || []).includes(moveId);
}

function teachMachine(db, item, p, name) {
  const move = item.move;
  const moveName = db.moves[move]?.name || move;
  if (!move || !db.moves[move]) return fail(p, 'Esta máquina está vacía.');
  if (p.moves.some((m) => m.id === move)) return fail(p, `${name} ya conoce ${moveName}.`);
  if (!canLearnMachine(db, p, move)) return fail(p, `${name} no puede aprender ${moveName}.`);
  return { ok: true, pokemon: p, message: '', consumed: item.fieldUse === 'TR', teach: move };
}

/** Enseña un movimiento en el hueco `slot` (o al final si hay sitio). */
export function withMove(db, p, moveId, slot = p.moves.length) {
  const nm = { id: moveId, pp: db.moves[moveId]?.pp || 0, ppUps: 0 };
  const moves = p.moves.slice();
  if (slot >= moves.length) moves.push(nm);
  else moves[slot] = nm;
  return { ...p, moves: moves.slice(0, 4) };
}

/** Texto APTO / NO APTO / APRENDIDO para el equipo al usar una MT (anotaciones de la pantalla de equipo). */
export function machineAnnotation(db, p, moveId) {
  if (p.moves.some((m) => m.id === moveId)) return 'APRENDIDO';
  return canLearnMachine(db, p, moveId) ? 'APTO' : 'NO APTO';
}

/**
 * Copia del Pokémon evolucionado a `target` (mantiene el daño recibido y el índice de habilidad).
 * @returns {{ pokemon: object, newMoves: string[] }} newMoves = movimientos de evolución / de su nivel
 */
export function evolvedPokemon(db, p, target) {
  const sp = speciesData(db, target, 0);
  const idx = p.abilityIndex ?? 0;
  const ability = idx >= 2 ? (sp.hiddenAbilities?.[idx - 2] || sp.abilities[0]) : (sp.abilities?.[idx] || sp.abilities?.[0] || p.ability);
  const consumeHeld = (speciesData(db, p.species, p.form).evolutions || []).some(([to, method, item]) => to === target && ['DayHoldItem', 'NightHoldItem'].includes(method) && p.heldItem === item);
  const next = recalcHp(db, p, { ...p, species: target, form: 0, ability, heldItem: consumeHeld ? null : p.heldItem });
  const known = new Set(next.moves.map((m) => m.id));
  const newMoves = [...movesLearnedAtLevel(db, target, 0, 0), ...movesLearnedAtLevel(db, target, 0, p.level)]
    .filter((m, i, a) => !known.has(m) && a.indexOf(m) === i);
  return { pokemon: next, newMoves };
}

function recalcHp(db, before, after) {
  const oldMax = maxHpOf(db, before);
  const newMax = maxHpOf(db, after);
  if (before.hp <= 0) return after;
  return { ...after, hp: Math.min(newMax, before.hp + (newMax - oldMax)) };
}

function ok(pokemon, message) {
  return { ok: true, pokemon, message, consumed: true };
}

function fail(pokemon, message) {
  return { ok: false, pokemon, message, consumed: false };
}
