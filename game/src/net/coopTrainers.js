// Rivales del combate doble en equipo (online): dos entrenadores de IA máxima con Pokémon totalmente evolucionados
// de la Pokédex de Axis, al nivel del Pokémon más alto de los dos jugadores y con IV perfectos. Los genera el
// anfitrión con una semilla y los envía completos: el compañero no los recalcula.
import { createPokemon } from '../battle/core/pokemon.js';
import { createRng } from '../battle/core/rng.js';

export const COOP_TEAM_SIZE = 3;
export const COOP_AI_SKILL = 100;
const MIN_BASE_TOTAL = 450;
const MAX_LEVEL = 100;
const PERFECT_IVS = { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 };

const DUOS = [
  [{ name: 'Irene', class: 'Veterana', sprite: 'anil:veterana' }, { name: 'Tomás', class: 'Veterano', sprite: 'anil:veterano' }],
  [{ name: 'Nuria', class: 'Aspirante', sprite: 'anil:aspirante_f' }, { name: 'Iker', class: 'Aspirante', sprite: 'anil:aspirante' }],
  [{ name: 'Olga', class: 'Científica', sprite: 'anil:cientifica' }, { name: 'Bruno', class: 'Científico', sprite: 'anil:cientifico' }],
];

const baseTotal = (sp) => Object.values(sp.baseStats || {}).reduce((a, b) => a + b, 0);

/** Especies candidatas: generales de la Pokédex de Axis, sin evolución pendiente y con buenas estadísticas. */
export function coopSpeciesPool(db) {
  const entries = db.dex?.entries || [];
  return entries
    .filter((e) => e.group === 'general')
    .map((e) => db.species[e.id])
    .filter((sp) => sp && !(sp.evolutions || []).length && baseTotal(sp) >= MIN_BASE_TOTAL)
    .map((sp) => sp.id);
}

/** Nivel de los rivales: el del Pokémon más alto de los dos equipos. */
export function coopLevel(...parties) {
  const levels = parties.flat().filter((p) => p && !p.egg).map((p) => p.level || 1);
  return Math.min(MAX_LEVEL, Math.max(5, ...levels));
}

/** Dos definiciones de entrenador (formato de content/trainers) listas para `request.trainers`. */
export function coopTrainers(db, { level, seed }) {
  const rng = createRng(seed);
  const pool = [...coopSpeciesPool(db)];
  if (pool.length < COOP_TEAM_SIZE * 2) throw new Error('No hay suficientes especies para los rivales del combate en equipo.');
  const pick = () => pool.splice(Math.floor(rng() * pool.length), 1)[0];
  const duo = DUOS[Math.floor(rng() * DUOS.length)];
  return duo.map((who, i) => ({
    id: `coop_${i}`,
    name: who.name,
    class: who.class,
    sprite: who.sprite,
    ai: COOP_AI_SKILL,
    loseText: '¡Qué buen equipo hacéis!',
    party: Array.from({ length: COOP_TEAM_SIZE }, () => createPokemon(db, pick(), level, { rng, ivs: PERFECT_IVS, shinyChance: 0 })),
  }));
}
