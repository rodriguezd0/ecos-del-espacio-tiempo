// Bastión Axis: torneo individual de tres Pokémon, copias a nivel 50 y rachas persistentes.
import { cloneJson, F, V, MUSIC } from './b22e_common.js';
import { healed, expForLevel, speciesData } from '../../battle/core/pokemon.js';
import { createRng } from '../../battle/core/rng.js';

const IVS = Object.freeze({ hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 });
const roster = Object.freeze([
  { species: 'GARCHOMP', nature: 'JOLLY', item: 'LIFEORB', evs: { atk: 252, spe: 252, hp: 4 }, moves: ['EARTHQUAKE', 'DRAGONCLAW', 'STONEEDGE', 'SWORDSDANCE'] },
  { species: 'FERROTHORN', nature: 'RELAXED', item: 'LEFTOVERS', evs: { hp: 252, def: 128, spd: 128 }, moves: ['POWERWHIP', 'GYROBALL', 'LEECHSEED', 'PROTECT'] },
  { species: 'AZUMARILL', nature: 'ADAMANT', ability: 'HUGEPOWER', item: 'CHOICEBAND', evs: { hp: 252, atk: 252, spd: 4 }, moves: ['AQUAJET', 'PLAYROUGH', 'WATERFALL', 'SUPERPOWER'] },
  { species: 'GENGAR', nature: 'TIMID', item: 'FOCUSSASH', evs: { spa: 252, spe: 252, hp: 4 }, moves: ['SHADOWBALL', 'SLUDGEBOMB', 'FOCUSBLAST', 'DESTINYBOND'] },
  { species: 'SCIZOR', nature: 'ADAMANT', ability: 'TECHNICIAN', item: 'CHOICEBAND', evs: { hp: 248, atk: 252, spd: 8 }, moves: ['BULLETPUNCH', 'UTURN', 'SUPERPOWER', 'PURSUIT'] },
  { species: 'TOGEKISS', nature: 'MODEST', ability: 'SERENEGRACE', item: 'CHOICESCARF', evs: { spa: 252, spe: 252, hp: 4 }, moves: ['AIRSLASH', 'DAZZLINGGLEAM', 'AURASPHERE', 'FLAMETHROWER'] },
  { species: 'TYRANITAR', nature: 'ADAMANT', item: 'CHOPLEBERRY', evs: { hp: 252, atk: 252, spd: 4 }, moves: ['STONEEDGE', 'CRUNCH', 'EARTHQUAKE', 'ICEPUNCH'] },
  { species: 'DRAGONITE', nature: 'ADAMANT', ability: 'MULTISCALE', item: 'LUMBERRY', evs: { atk: 252, spe: 252, hp: 4 }, moves: ['DRAGONDANCE', 'EXTREMESPEED', 'DRAGONCLAW', 'EARTHQUAKE'] },
  { species: 'VOLCARONA', nature: 'TIMID', item: 'LUMBERRY', evs: { spa: 252, spe: 252, hp: 4 }, moves: ['QUIVERDANCE', 'FIERYDANCE', 'BUGBUZZ', 'GIGADRAIN'] },
  { species: 'MILOTIC', nature: 'BOLD', item: 'LEFTOVERS', evs: { hp: 252, def: 252, spd: 4 }, moves: ['SCALD', 'ICEBEAM', 'RECOVER', 'TOXIC'] },
  { species: 'EXCADRILL', nature: 'JOLLY', ability: 'MOLDBREAKER', item: 'FOCUSSASH', evs: { atk: 252, spe: 252, hp: 4 }, moves: ['EARTHQUAKE', 'IRONHEAD', 'ROCKSLIDE', 'SWORDSDANCE'] },
  { species: 'ROTOM', form: 1, nature: 'TIMID', item: 'CHOICESPECS', evs: { spa: 252, spe: 252, hp: 4 }, moves: ['OVERHEAT', 'VOLTSWITCH', 'THUNDERBOLT', 'TRICK'] },
]);
const names = ['Nerea', 'Darío', 'Mara', 'Teo', 'Inés', 'Bruno', 'Ada', 'Simón', 'Nora', 'Héctor', 'Aina', 'Íñigo'];

export const PRIZES = Object.freeze([
  { id: 'RARECANDY', name: 'Caramelo Raro', cost: 12 },
  { id: 'POWERANKLET', name: 'Franja Recia', cost: 16 },
  { id: 'FOCUSSASH', name: 'Banda Focus', cost: 24 },
  { id: 'LIFEORB', name: 'Vidasfera', cost: 32 },
  { id: 'CHOICEBAND', name: 'Cinta Elegida', cost: 32 },
  { id: 'CHOICESPECS', name: 'Gafas Elegidas', cost: 32 },
  { id: 'CHOICESCARF', name: 'Pañuelo Elegido', cost: 32 },
].map(Object.freeze));

export function enrollmentError(state, slots) {
  if (!Array.isArray(slots) || slots.length !== 3 || new Set(slots).size !== 3) return 'Elige tres Pokémon distintos.';
  if (slots.some((i) => !Number.isInteger(i) || i < 0 || i >= state.party.length)) return 'Ese Pokémon ya no está en tu equipo.';
  if (slots.some((i) => state.party[i]?.egg)) return 'Los huevos no pueden participar.';
  if (slots.some((i) => !state.party[i] || state.party[i].hp <= 0)) return 'Cura a los tres Pokémon antes de inscribirlos.';
  return null;
}

export function enrolledSlots(state) {
  const ids = state.var(V.equipo, []);
  if (!Array.isArray(ids) || ids.length !== 3 || new Set(ids).size !== 3 || ids.some((id) => !id)) return null;
  const slots = ids.map((id) => state.party.findIndex((p) => p?.uid === id));
  return enrollmentError(state, slots) ? null : slots;
}
export const canContinueTeam = (state) => Boolean(enrolledSlots(state));

export function bastionRequest(db, state, slots, { seed = 1, streak = 0 } = {}) {
  const error = enrollmentError(state, slots);
  if (error) throw new Error(error);
  const n = Math.max(0, Math.floor(Number(streak) || 0));
  const battleSeed = (Number(seed) + Math.imul(n + 1, 2654435761)) >>> 0;
  const rand = createRng(battleSeed);
  const available = [...roster];
  const party = Array.from({ length: 3 }, () => {
    const pick = available.splice(Math.floor(rand() * available.length), 1)[0];
    return { ...cloneJson(pick), level: 50, ivs: { ...IVS } };
  });
  return {
    type: 'trainer', format: 'single', seed: battleSeed, noCoop: true, exhibition: true,
    bgm: (n + 1) % 7 ? MUSIC.bastionBattle : MUSIC.bastionAce,
    trainer: { id: `bastion_${n + 1}`, name: names[Math.floor(rand() * names.length)], class: 'Aspirante del Bastión',
      sprite: n % 2 ? 'anil:aspirante' : 'anil:aspirante_f', ai: 120, money: 0, party, canLose: true, items: [] },
    player: { name: state.player.name, gender: state.player.gender, id: state.player.id,
      party: slots.map((i) => {
        const p = cloneJson(state.party[i]);
        return healed(db, { ...p, level: 50, exp: expForLevel(speciesData(db, p.species, p.form).growthRate, 50) });
      }), bag: {}, megaRing: ['MEGARING', 'MEGABRACELET', 'KEYSTONE'].some((id) => state.itemCount(id) > 0) },
    rules: { canRun: false, canCatch: false, expGain: false, moneyGain: false, noMoneyLoss: true,
      sealedBag: 'En el Bastión no se usan objetos de la Mochila.', canLose: true },
  };
}

export function recordMatch(state, outcome) {
  const before = Math.max(0, Number(state.var(V.racha, 0)) || 0);
  if (outcome !== 'win') { state.setVar(V.racha, 0); return { streak: 0, points: 0, round: false }; }
  const streak = before + 1, round = streak % 7 === 0;
  const points = 2 + (round ? 5 : 0);
  state.setVar(V.racha, streak);
  state.setVar(V.record, Math.max(Number(state.var(V.record, 0)) || 0, streak));
  state.setVar(V.puntos, (Number(state.var(V.puntos, 0)) || 0) + points);
  if (round) state.setFlag(F.bastionRonda);
  if (streak >= 21) state.setFlag(F.bastionMaestro);
  return { streak, points, round };
}

export function exchangePrize(state, id) {
  const prize = PRIZES.find((p) => p.id === id);
  const points = Number(state.var(V.puntos, 0)) || 0;
  if (!prize || points < prize.cost) return false;
  state.setVar(V.puntos, points - prize.cost);
  state.addItem(prize.id, 1);
  return true;
}
