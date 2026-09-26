// Modo desarrollador: dar Pokémon y objetos, cambiar niveles y curar. Módulo PURO (GameState + base de datos).
import { createPokemon, expForLevel, healed, maxHP, speciesData, MAX_LEVEL } from '../battle/core/pokemon.js';
import { KEY_POCKET } from './devSearch.js';

export const MIN_LEVEL = 1;

/** Nivel entero dentro de 1–100. */
export function clampLevel(level) {
  const n = Math.round(Number(level));
  if (!Number.isFinite(n)) return MIN_LEVEL;
  return Math.max(MIN_LEVEL, Math.min(MAX_LEVEL, n));
}

/** Crea un Pokémon del jugador (entrenador original = el jugador). spec: { species, form, level, shiny }. */
export function createDevPokemon(db, state, { species, form = 0, level = 5, shiny = false } = {}) {
  if (!db?.species?.[species]) throw new Error(`Especie desconocida: ${species}`);
  const sp = db.species[species];
  const validForm = form && sp.forms?.[form] ? Number(form) : 0;
  return createPokemon(db, species, clampLevel(level), {
    form: validForm,
    shiny: Boolean(shiny),
    ot: { name: state.player.name, id: state.player.id },
    obtainedMode: 'gift',
  });
}

/**
 * Da un Pokémon: al equipo o, si está lleno, a la primera caja con hueco (GameState#addPokemon).
 * Devuelve { pokemon, where: 'party'|'box'|'none', box, slot }.
 */
export function giveDevPokemon(state, db, spec) {
  const pokemon = createDevPokemon(db, state, spec);
  const where = state.addPokemon(pokemon);
  return { pokemon, ...where };
}

/** Texto para avisar de dónde ha ido el Pokémon. */
export function givenText(db, result) {
  const name = speciesData(db, result.pokemon.species, result.pokemon.form).name;
  const lv = result.pokemon.level;
  const shiny = result.pokemon.shiny ? ' ★' : '';
  if (result.where === 'party') return `${name}${shiny} nv ${lv} → equipo`;
  if (result.where === 'box') return `${name}${shiny} nv ${lv} → caja ${result.box + 1}`;
  return 'Equipo y cajas llenos: no se ha añadido.';
}

/**
 * Da objetos (también los de items_axis.json). Los objetos clave no se acumulan (cantidad 1).
 * Devuelve la cantidad que queda en la Mochila.
 */
export function giveDevItem(state, db, itemId, count = 1) {
  const it = db?.items?.[itemId];
  if (!it) throw new Error(`Objeto desconocido: ${itemId}`);
  const n = Math.max(1, Math.floor(Number(count) || 1));
  if (it.pocket === KEY_POCKET) state.addKeyItem(itemId);
  else state.addItem(itemId, n);
  return state.itemCount(itemId);
}

/** Copia del Pokémon al nivel dado: experiencia mínima del nivel y PS en la misma proporción (llenos si lo estaban). */
export function withLevel(db, pokemon, level) {
  const lv = clampLevel(level);
  const sp = speciesData(db, pokemon.species, pokemon.form);
  const oldMax = maxHP(db, pokemon);
  const next = { ...pokemon, level: lv, exp: expForLevel(sp.growthRate, lv) };
  const newMax = maxHP(db, next);
  const ratio = oldMax > 0 ? pokemon.hp / oldMax : 1;
  return { ...next, hp: pokemon.hp <= 0 ? 0 : Math.max(1, Math.min(newMax, Math.round(newMax * ratio))) };
}

/** Cambia el nivel de un miembro del equipo. Devuelve el Pokémon nuevo. */
export function setMemberLevel(state, db, index, level) {
  const current = state.party[index];
  if (!current) throw new Error(`No hay Pokémon en la posición ${index + 1} del equipo`);
  if (current.egg) throw new Error('Un huevo no tiene nivel.');
  const next = withLevel(db, current, level);
  state.setPartyMember(index, next);
  return next;
}

/** Variocolor sí/no de un miembro del equipo. */
export function setMemberShiny(state, index, shiny) {
  const current = state.party[index];
  if (!current) throw new Error(`No hay Pokémon en la posición ${index + 1} del equipo`);
  state.setPartyMember(index, { ...current, shiny: Boolean(shiny) });
}

/** Cura todo el equipo (PS, PP y estado; los huevos no se tocan). */
export function healParty(state, db) {
  state.setParty(state.party.map((p) => (p.egg ? p : healed(db, p))));
}

/** Suma (o resta) dinero dentro de los límites del juego. Devuelve el dinero final. */
export function giveMoney(state, amount) {
  const n = Math.trunc(Number(amount) || 0);
  state.addMoney(n);
  return state.player.money;
}
