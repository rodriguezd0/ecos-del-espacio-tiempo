// Flujos de interfaz tras cambios de un Pokémon del equipo: aprender movimientos, evolucionar y dar objetos.
import { engine } from '../../core/engine.js';
import { displayName } from '../../battle/core/pokemon.js';
import { evolvedPokemon, withMove } from '../logic/fieldItems.js';
import { message, confirm } from './common.js';
import { ui } from '../api.js';

/** Enseña una lista de movimientos al Pokémon del equipo `index` (preguntando si hay que olvidar). */
export async function teachMoves(index, moves) {
  const s = engine.state;
  const db = engine.data;
  for (const move of moves) {
    const p = s.party[index];
    if (!p || p.moves.some((m) => m.id === move)) continue;
    const name = displayName(db, p);
    const moveName = db.moves[move]?.name || move;
    if (p.moves.length < 4) {
      s.setPartyMember(index, withMove(db, p, move));
      await message(`¡${name} ha aprendido ${moveName}!`, { se: 'Pkmn move learnt' });
      continue;
    }
    const slot = await ui.learnMove(p, move);
    if (slot !== null && slot !== undefined) s.setPartyMember(index, withMove(db, s.party[index], move, slot));
  }
}

/** Secuencia de evolución del Pokémon `index` a `target`; aplica el cambio si no se cancela. */
export async function evolvePartyMember(index, target) {
  const s = engine.state;
  const db = engine.data;
  const p = s.party[index];
  if (!p || !db.species[target]) return false;
  const done = await ui.evolve(p, target);
  if (!done) return false;
  const { pokemon, newMoves } = evolvedPokemon(db, p, target);
  s.setPartyMember(index, pokemon);
  s.registerCaught(target);
  await teachMoves(index, newMoves);
  return true;
}

/** Da un objeto de la mochila al Pokémon `index` (con intercambio si ya lleva uno). */
export async function giveItemTo(index, itemId) {
  const s = engine.state;
  const db = engine.data;
  const p = s.party[index];
  const name = displayName(db, p);
  const itemName = db.items[itemId]?.name || itemId;
  if (p.heldItem) {
    const oldName = db.items[p.heldItem]?.name || p.heldItem;
    if (!(await confirm(`${name} ya lleva ${oldName}. ¿Quieres cambiarlo por ${itemName}?`))) return false;
    s.addItem(p.heldItem, 1);
    await message(`Has guardado ${oldName} en la Mochila y le has dado ${itemName} a ${name}.`);
  } else {
    await message(`${name} ahora lleva ${itemName}.`);
  }
  s.removeItem(itemId, 1);
  s.setPartyMember(index, { ...s.party[index], heldItem: itemId });
  return true;
}
