// Guardería y crianza: port de DayCare / DayCare::EggGenerator de Essentials 21.1 tal como lo configura Añil
// (MECHANICS_GENERATION 9): los Pokémon depositados no ganan experiencia al caminar, dos de la misma especie se
// enseñan movimientos huevo entre sí, no se heredan MT, la madre también pasa movimientos huevo y el incienso no
// influye en la especie del bebé. Cada 256 pasos se tira el huevo (20/50/70 % según compatibilidad; 40/80/88 % con el
// Amuleto Oval). Todo es puro (devuelve objetos nuevos; `rng` inyectable): tests/daycare.test.mjs.
// Estado serializable en GameState (`state.daycare`): { slots: [{ pokemon, initialLevel } | null ×2], eggReady,
// stepCounter }. Integración en el mapa: `daycareStep(scene)`; NPC: content/services/daycare.js.
import { speciesData, healed, abilityFor, withExp, movesLearnedAtLevel, STATS, SHINY_CHANCE } from '../battle/core/pokemon.js';
import { createEgg } from './eggs.js';

export const DAYCARE_SLOTS = 2;
export const EGG_CHECK_STEPS = 256;
export const COST_PER_LEVEL = 100;
const EGG_CHANCE = Object.freeze([0, 20, 50, 70]);
const EGG_CHANCE_OVAL = Object.freeze([0, 40, 80, 88]);
const SHARE_EGG_MOVE_CHANCE = 50;
const MAX_MOVES = 4;
const BASE_IV_INHERIT = 3;
const DESTINY_KNOT_IV_INHERIT = 5;
const HIDDEN_ABILITY_CHANCE = 60;
const SAME_ABILITY_CHANCE = 80;
const SHINY_CHARM_RETRIES = 2;
const POWER_ITEMS = Object.freeze({
  POWERWEIGHT: 'hp', POWERBRACER: 'atk', POWERBELT: 'def', POWERLENS: 'spa', POWERBAND: 'spd', POWERANKLET: 'spe',
});
const NON_INHERITABLE_BALLS = new Set(['MASTERBALL', 'CHERISHBALL']);

const COMPATIBILITY_TEXT = Object.freeze([
  'No parecen llevarse nada bien: prefieren jugar con otros Pokémon.',
  'Se toleran, pero no parecen tenerse demasiado cariño.',
  'Parece que se llevan bien.',
  'Parece que se llevan muy bien.',
]);

/** Guardería vacía. */
export function emptyDaycare() {
  return { slots: Array(DAYCARE_SLOTS).fill(null), eggReady: false, stepCounter: 0 };
}

/** Normaliza un estado guardado (o ausente) de la guardería. */
export function normalizeDaycare(raw) {
  if (!raw || !Array.isArray(raw.slots)) return emptyDaycare();
  const slots = Array.from({ length: DAYCARE_SLOTS }, (_, i) => {
    const s = raw.slots[i];
    return s?.pokemon ? { pokemon: s.pokemon, initialLevel: Number(s.initialLevel) || s.pokemon.level } : null;
  });
  return { slots, eggReady: Boolean(raw.eggReady), stepCounter: Math.max(0, Number(raw.stepCounter) || 0) };
}

export const daycareCount = (dc) => dc.slots.filter(Boolean).length;
export const eggChance = (compat, hasOvalCharm = false) => (hasOvalCharm ? EGG_CHANCE_OVAL : EGG_CHANCE)[compat] || 0;
export const compatibilityText = (compat) => COMPATIBILITY_TEXT[compat] || COMPATIBILITY_TEXT[0];
export const levelGain = (slot) => (slot ? slot.pokemon.level - slot.initialLevel : 0);
export const withdrawCost = (slot) => (levelGain(slot) + 1) * COST_PER_LEVEL;
const resetEgg = (dc) => ({ ...dc, eggReady: false, stepCounter: 0 });
const randInt = (rng, n) => Math.floor(rng() * n);
const sample = (rng, list) => list[randInt(rng, list.length)];

// ------------------------------------------------------------------ familias y especie del huevo

const prevoCache = new WeakMap();
function prevolutions(db) {
  let map = prevoCache.get(db.species);
  if (!map) {
    map = new Map();
    for (const [id, sp] of Object.entries(db.species)) {
      for (const [to] of sp.evolutions || []) if (!map.has(to)) map.set(to, id);
    }
    prevoCache.set(db.species, map);
  }
  return map;
}

/** Preevolución directa (o la propia especie si no tiene). */
export const previousSpecies = (db, species) => prevolutions(db).get(species) || species;

/** Especie bebé de la familia (gen 9: sin requisito de incienso). */
export function babySpecies(db, species) {
  let cur = species;
  const seen = new Set([cur]);
  for (;;) {
    const prev = previousSpecies(db, cur);
    if (prev === cur || seen.has(prev)) return cur;
    seen.add(prev);
    cur = prev;
  }
}

/** Todas las especies de la familia evolutiva (bebé primero). */
export function familySpecies(db, species) {
  const baby = babySpecies(db, species);
  const out = [baby];
  for (let i = 0; i < out.length; i++) {
    for (const [to] of db.species[out[i]]?.evolutions || []) if (db.species[to] && !out.includes(to)) out.push(to);
  }
  return out;
}

/** ¿Puede `parentSpecies` dar crías de la familia de `otherSpecies`? (Essentials: breeding_can_produce?) */
export function canProduce(db, parentSpecies, otherSpecies) {
  const family = familySpecies(db, otherSpecies);
  const offspring = db.species[parentSpecies]?.offspring || [];
  if (offspring.length) return family.some((s) => offspring.includes(s));
  return family.includes(parentSpecies);
}

/** Especie del huevo a partir del progenitor que la determina (bebé + descendencia alternativa). */
export function eggSpeciesFor(db, parentSpecies, rng = Math.random) {
  const baby = babySpecies(db, parentSpecies);
  const offspring = db.species[baby]?.offspring || [];
  return offspring.length ? sample(rng, offspring) : baby;
}

/** Movimientos huevo de la especie (o de su preevolución si no declara ninguno). */
export function eggMovesOf(db, species, form = 0) {
  let cur = species;
  for (let guard = 0; guard < 8; guard++) {
    const moves = speciesData(db, cur, form).eggMoves || [];
    const prev = previousSpecies(db, cur);
    if (moves.length || prev === cur) return moves;
    cur = prev;
  }
  return [];
}

// ------------------------------------------------------------------ compatibilidad

const eggGroups = (db, p) => speciesData(db, p.species, p.form).eggGroups || [];
const isDitto = (db, p) => eggGroups(db, p).includes('Ditto');
const isMale = (p) => p.gender === 'M';
const isFemale = (p) => p.gender === 'F';
const isGenderless = (p) => p.gender !== 'M' && p.gender !== 'F';
const otId = (p) => p.ot?.id ?? null;

function pokemonPair(dc) {
  const filled = dc.slots.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  return filled.length === DAYCARE_SLOTS ? filled : null;
}

function compatibleGender(db, a, b) {
  if ((isFemale(a) && isMale(b)) || (isMale(a) && isFemale(b))) return true;
  return isDitto(db, a) !== isDitto(db, b);
}

/** Compatibilidad de la pareja depositada: 0 (no crían) … 3 (misma especie y distinto entrenador). */
export function compatibility(db, dc) {
  const pair = pokemonPair(dc);
  if (!pair) return 0;
  const [a, b] = pair.map((i) => dc.slots[i].pokemon);
  const g1 = eggGroups(db, a);
  const g2 = eggGroups(db, b);
  if (g1.includes('Undiscovered') || g2.includes('Undiscovered')) return 0;
  if (!g1.includes('Ditto') && !g2.includes('Ditto') && !g1.some((g) => g2.includes(g))) return 0;
  if (!compatibleGender(db, a, b)) return 0;
  return 1 + (a.species === b.species ? 1 : 0) + (otId(a) !== otId(b) ? 1 : 0);
}

// ------------------------------------------------------------------ depósito y retirada

/** Deja un Pokémon (curado) en la primera plaza libre. Lanza error si es un huevo o no hay sitio. */
export function depositPokemon(db, dc, pokemon) {
  if (!pokemon) throw new Error('depositPokemon: falta el Pokémon');
  if (pokemon.egg) throw new Error('No se puede dejar un huevo en la guardería.');
  const index = dc.slots.findIndex((s) => !s);
  if (index < 0) throw new Error('No hay sitio en la guardería.');
  const cured = healed(db, pokemon.species === 'SHAYMIN' ? { ...pokemon, form: 0 } : pokemon);
  const slots = dc.slots.map((s, i) => (i === index ? { pokemon: cured, initialLevel: pokemon.level } : s));
  return resetEgg({ ...dc, slots });
}

/** Retira el Pokémon de la plaza `index` → { daycare, pokemon, cost, levelGain }. */
export function withdrawPokemon(dc, index) {
  const slot = dc.slots[index];
  if (!slot) throw new Error(`La plaza ${index} de la guardería está vacía.`);
  const slots = dc.slots.map((s, i) => (i === index ? null : s));
  return { daycare: resetEgg({ ...dc, slots }), pokemon: slot.pokemon, cost: withdrawCost(slot), levelGain: levelGain(slot) };
}

// ------------------------------------------------------------------ movimientos

/** Aprende `moveId` como Essentials (learn_move): si ya lo sabe lo pasa al final; con 5 olvida el primero. */
function learnMove(db, moves, moveId) {
  if (!db.moves[moveId]) return moves;
  const known = moves.find((m) => m.id === moveId);
  if (known) return [...moves.filter((m) => m !== known), known];
  const next = [...moves, { id: moveId, pp: db.moves[moveId].pp, ppUps: 0 }];
  return next.length > MAX_MOVES ? next.slice(1) : next;
}

const knows = (p, moveId) => p.moves.some((m) => m.id === moveId);

/** Dos Pokémon de la misma especie se enseñan un movimiento huevo (gen 8+). */
export function shareEggMove(db, dc, rng = Math.random) {
  const pair = pokemonPair(dc);
  if (!pair) return dc;
  const [i1, i2] = pair;
  const p1 = dc.slots[i1].pokemon;
  const p2 = dc.slots[i2].pokemon;
  if (p1.species !== p2.species) return dc;
  const em1 = eggMovesOf(db, p1.species, p1.form);
  const em2 = eggMovesOf(db, p2.species, p2.form);
  const to2 = p2.moves.length < MAX_MOVES ? p1.moves.map((m) => m.id).filter((id) => em2.includes(id) && !knows(p2, id)) : [];
  const to1 = p1.moves.length < MAX_MOVES ? p2.moves.map((m) => m.id).filter((id) => em1.includes(id) && !knows(p1, id)) : [];
  let learner = null;
  if (to2.length && to1.length) learner = sample(rng, [[i1, to1[0]], [i2, to2[0]]]);
  else if (to2.length) learner = [i2, to2[0]];
  else if (to1.length) learner = [i1, to1[0]];
  if (!learner) return dc;
  const [index, moveId] = learner;
  const slots = dc.slots.map((s, i) => (i === index ? { ...s, pokemon: { ...s.pokemon, moves: learnMove(db, s.pokemon.moves, moveId) } } : s));
  return { ...dc, slots };
}

/** Experiencia por paso (solo si se activa: en gen 9 la guardería no entrena). Aprende lo del nivel nuevo. */
function addStepExp(db, slot) {
  const { pokemon, levelsGained } = withExp(db, slot.pokemon, 1);
  if (!levelsGained.length) return pokemon === slot.pokemon ? slot : { ...slot, pokemon };
  let moves = pokemon.moves;
  for (const lv of levelsGained) for (const m of movesLearnedAtLevel(db, pokemon.species, pokemon.form, lv)) moves = learnMove(db, moves, m);
  return { ...slot, pokemon: { ...pokemon, moves } };
}

// ------------------------------------------------------------------ pasos

/**
 * Un paso del jugador. opts: { rng, hasOvalCharm, gainExp (false en gen 9), shareEggMoves (true) }.
 * → guardería nueva (la entrada no se modifica).
 */
export function stepDaycare(db, dc, { rng = Math.random, hasOvalCharm = false, gainExp = false, shareEggMoves = true } = {}) {
  let next = { ...dc, stepCounter: dc.stepCounter + 1 };
  if (next.stepCounter >= EGG_CHECK_STEPS) {
    next = { ...next, stepCounter: 0 };
    if (!next.eggReady && daycareCount(next) === DAYCARE_SLOTS && randInt(rng, 100) < eggChance(compatibility(db, next), hasOvalCharm)) {
      next = { ...next, eggReady: true };
    }
    if (shareEggMoves && randInt(rng, 100) < SHARE_EGG_MOVE_CHANCE) next = shareEggMove(db, next, rng);
  }
  if (gainExp) next = { ...next, slots: next.slots.map((s) => (s ? addStepExp(db, s) : s)) };
  return next;
}

// ------------------------------------------------------------------ generación del huevo

function inheritedForm(db, speciesParent, parents) {
  let form = speciesData(db, speciesParent.species, speciesParent.form).flags?.includes('InheritFormFromMother') ? speciesParent.form : 0;
  for (const { p, inFamily } of parents) {
    if (!inFamily || p.heldItem !== 'EVERSTONE') continue;
    if (!speciesData(db, p.species, p.form).flags?.includes('InheritFormWithEverStone')) continue;
    form = p.form;
    break;
  }
  return form;
}

function inheritedAbilityIndex(parent, rng) {
  const idx = parent.abilityIndex || 0;
  if (idx >= 2) return randInt(rng, 100) < HIDDEN_ABILITY_CHANCE ? idx : null;
  return randInt(rng, 100) < SAME_ABILITY_CHANCE ? idx : (idx + 1) % 2;
}

function movesToInherit(db, eggSpecies, eggForm, mother, father) {
  const moveFather = father.ditto ? mother.p : father.p;
  const moveMother = father.ditto ? father.p : mother.p;
  const out = [];
  for (const [lv, move] of speciesData(db, eggSpecies, eggForm).moves || []) {
    if (lv > 1 && knows(mother.p, move) && knows(father.p, move)) out.push(move);
  }
  const eggMoves = eggMovesOf(db, eggSpecies, eggForm);
  if (!isFemale(moveFather)) for (const m of eggMoves) if (knows(moveFather, m)) out.push(m);
  if (isFemale(moveMother)) for (const m of eggMoves) if (knows(moveMother, m)) out.push(m);
  const lightBall = [mother, father].some(({ p, inFamily }) => inFamily && p.heldItem === 'LIGHTBALL');
  if (eggSpecies === 'PICHU' && lightBall && db.moves.VOLTTACKLE) out.push('VOLTTACKLE');
  // Sin duplicados conservando la última aparición; solo los 4 últimos.
  const unique = out.filter((m, i) => out.lastIndexOf(m) === i);
  return unique.slice(-MAX_MOVES);
}

function inheritedIVs(baseIVs, mother, father, rng) {
  const ivs = { ...baseIVs };
  const knot = mother.heldItem === 'DESTINYKNOT' || father.heldItem === 'DESTINYKNOT';
  let count = knot ? DESTINY_KNOT_IV_INHERIT : BASE_IV_INHERIT;
  let stats = [...STATS];
  const power = {};
  for (const parent of [mother, father]) {
    const stat = POWER_ITEMS[parent.heldItem];
    if (stat) (power[stat] ||= []).push(parent.ivs[stat]);
  }
  for (const [stat, values] of Object.entries(power)) {
    ivs[stat] = sample(rng, values);
    stats = stats.filter((s) => s !== stat);
    count -= 1;
  }
  for (let n = 0; n < count && stats.length; n++) {
    const stat = stats.splice(randInt(rng, stats.length), 1)[0];
    ivs[stat] = sample(rng, [mother, father]).ivs[stat];
  }
  return ivs;
}

/**
 * Huevo de la pareja (Essentials: EggGenerator.generate). opts: { rng, ot, metMap, hasShinyCharm }.
 * No comprueba la compatibilidad (eso lo hace el contador de pasos).
 */
export function generateEgg(db, parentA, parentB, { rng = Math.random, ot = null, metMap = null, hasShinyCharm = false } = {}) {
  let [m, f] = [parentA, parentB];
  if (isMale(m) || isFemale(f) || isGenderless(m)) [m, f] = [f, m];
  const mother = { p: m, ditto: isDitto(db, m) };
  const father = { p: f, ditto: isDitto(db, f) };
  const speciesParent = mother.ditto ? f : m;
  const species = eggSpeciesFor(db, speciesParent.species, rng);
  mother.inFamily = canProduce(db, m.species, species);
  father.inFamily = canProduce(db, f.species, species);

  const base = createEgg(db, species, { ot, metMap, rng });
  const form = inheritedForm(db, speciesParent, [mother, father]);
  const everstone = [m, f].filter((p) => p.heldItem === 'EVERSTONE').map((p) => p.nature);
  const nature = everstone.length ? sample(rng, everstone) : base.nature;
  const abilityParent = mother.ditto ? f : m;
  const abilityIndex = inheritedAbilityIndex(abilityParent, rng) ?? base.abilityIndex;
  let moves = base.moves;
  for (const move of movesToInherit(db, species, form, mother, father)) moves = learnMove(db, moves, move);
  const balls = [mother, father].filter((x) => x.inFamily).map((x) => x.p.ball).filter((b) => b && !NON_INHERITABLE_BALLS.has(b));
  let shiny = base.shiny;
  for (let i = 0; i < (hasShinyCharm ? SHINY_CHARM_RETRIES : 0) && !shiny; i++) shiny = rng() < SHINY_CHANCE;

  return {
    ...base,
    form,
    nature,
    abilityIndex,
    ability: abilityFor(speciesData(db, species, form), abilityIndex),
    moves,
    ivs: inheritedIVs(base.ivs, m, f, rng),
    ball: balls.length ? sample(rng, balls) : base.ball,
    shiny,
  };
}

/**
 * Recoge el huevo listo → { egg, daycare } (contador reiniciado) o null si no hay huevo o falta un progenitor.
 * opts: los de generateEgg. Quien llama comprueba antes que cabe en el equipo.
 */
export function collectEgg(db, dc, opts = {}) {
  if (!dc.eggReady) return null;
  const pair = pokemonPair(dc);
  if (!pair) return null;
  const [a, b] = pair.map((i) => dc.slots[i].pokemon);
  return { egg: generateEgg(db, a, b, opts), daycare: resetEgg(dc) };
}

// ------------------------------------------------------------------ integración con el mapa

/** Gancho de paso (MapScene): avanza la guardería si hay alguien depositado. Sin nadie, coste nulo. */
export function daycareStep(scene) {
  const state = scene?.state;
  const raw = state?.daycare;
  if (!raw || !raw.slots?.some(Boolean)) return;
  const db = scene.engine?.data;
  if (!db?.species) return;
  state.setDaycare(stepDaycare(db, normalizeDaycare(raw), { hasOvalCharm: state.hasItem('OVALCHARM') }));
}
