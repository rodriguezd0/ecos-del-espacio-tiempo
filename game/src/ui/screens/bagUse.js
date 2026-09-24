// Usar un objeto de la mochila en el campo (elige Pokémon/movimiento, aplica efecto, evoluciones, MT).
import { engine } from '../../core/engine.js';
import { displayName } from '../../battle/core/pokemon.js';
import { fieldUseKind, useItemOnPokemon, repelSteps, machineAnnotation, withMove } from '../logic/fieldItems.js';
import { message, confirm } from './common.js';
import { teachMoves, evolvePartyMember } from './progression.js';
import { ui } from '../api.js';

const REPEL_VAR = 'repelSteps';

/**
 * Usa el objeto. Devuelve { returnToWorld: true } si el mundo debe encargarse (Cuerda Huida, objetos clave…).
 */
export async function useBagItem(itemId) {
  const s = engine.state;
  const db = engine.data;
  const item = db.items[itemId];
  const kind = fieldUseKind(item);
  if (itemId === 'TOWNMAP') { await ui.openRegionMap({}); return {}; }
  if (kind === 'world') return { returnToWorld: true };
  if (kind === 'repel') {
    if (s.var(REPEL_VAR, 0) > 0) { await message('Aún tiene efecto el repelente anterior.'); return {}; }
    s.setVar(REPEL_VAR, repelSteps(itemId));
    s.removeItem(itemId, 1);
    await message(`Has usado ${item.name}. Los Pokémon salvajes débiles no se acercarán durante un tiempo.`);
    return {};
  }
  if (kind !== 'pokemon' && kind !== 'move') { await message('No se puede usar aquí.'); return {}; }
  if (!s.party.length) { await message('No tienes Pokémon.'); return {}; }

  const isMachine = item.fieldUse === 'TM' || item.fieldUse === 'HM' || item.fieldUse === 'TR';
  if (isMachine) {
    const moveName = db.moves[item.move]?.name || item.move;
    await message(`Has encendido la ${item.name}.\\nContiene ${moveName}.`);
    if (!(await confirm(`¿Enseñar ${moveName} a un Pokémon?`))) return {};
  }
  const annotations = isMachine ? s.party.map((p) => machineAnnotation(db, p, item.move)) : undefined;
  const idx = await ui.openParty({ mode: 'select', message: '¿En qué Pokémon quieres usarlo?', annotations });
  if (!Number.isInteger(idx)) return {};
  const p = s.party[idx];
  let moveIndex = 0;
  if (kind === 'move') {
    const names = p.moves.map((m) => db.moves[m.id]?.name || m.id);
    moveIndex = await ui.choice([...names, 'Cancelar'], { message: '¿Qué movimiento quieres restaurar?', cancel: names.length });
    if (moveIndex < 0 || moveIndex >= names.length) return {};
  }
  const r = useItemOnPokemon(db, itemId, p, { moveIndex, isDay: s.isDay() });
  if (!r.ok) { await message(r.message); return {}; }
  if (r.teach) { await teachMachine(idx, r.teach, item); return {}; }
  if (r.consumed) s.removeItem(itemId, 1);
  if (r.evolveTo && !r.levelsGained) {
    await evolvePartyMember(idx, r.evolveTo);
    return {};
  }
  s.setPartyMember(idx, r.pokemon);
  if (r.message) await message(r.message);
  if (r.newMoves && r.newMoves.length) await teachMoves(idx, r.newMoves);
  if (r.evolveTo) await evolvePartyMember(idx, r.evolveTo);
  return {};
}

async function teachMachine(idx, move, item) {
  const s = engine.state;
  const db = engine.data;
  const p = s.party[idx];
  const name = displayName(db, p);
  const moveName = db.moves[move]?.name || move;
  if (p.moves.length < 4) {
    s.setPartyMember(idx, withMove(db, p, move));
    await message(`¡${name} ha aprendido ${moveName}!`);
  } else {
    const slot = await ui.learnMove(p, move);
    if (slot === null || slot === undefined) return;
    s.setPartyMember(idx, withMove(db, s.party[idx], move, slot));
  }
  if (item.fieldUse === 'TR') s.removeItem(item.id, 1);
}
