// Aplicación del resultado del combate a la partida (GameState). Módulo PURO: solo usa la API de GameState.
//   - equipo actualizado (PS, PP, EXP, niveles…), dinero ganado/perdido, objetos gastados,
//   - Pokédex (vistos en combates contra entrenadores) y Pokémon capturados (equipo o caja).

/**
 * Iguala la mochila de la partida a `bag` usando addItem/removeItem (sin sustituir el objeto).
 * Si `onlyIds` se indica, solo sincroniza esos objetos.
 */
export function syncBag(state, bag, onlyIds = null) {
  const current = state.data.bag || {};
  const ids = onlyIds || [...new Set([...Object.keys(current), ...Object.keys(bag || {})])];
  for (const id of ids) {
    const want = Math.max(0, bag?.[id] || 0);
    const have = state.itemCount(id);
    if (want > have) state.addItem(id, want - have);
    else if (want < have) state.removeItem(id, have - want);
  }
}

/** Nombre de la caja para los mensajes de envío al PC. */
export function boxLabel(state, box) {
  if (typeof state.boxName === 'function') return state.boxName(box);
  return state.data.boxNames?.[box] || `Caja ${box + 1}`;
}

/**
 * Aplica equipo, dinero, mochila y Pokédex vistos. No almacena capturas (ver storeCaught).
 * @returns {{ moneyChange: number }}
 */
export function applyBattleResult(state, result) {
  if (!state || !result) return { moneyChange: 0 };
  if (Array.isArray(result.playerParty)) state.setParty(result.playerParty.filter(Boolean));
  const delta = Number(result.moneyChange) || 0;
  if (delta) state.addMoney(delta);
  if (result.bag) syncBag(state, result.bag);
  for (const sp of result.seen || []) state.registerSeen(sp);
  return { moneyChange: delta };
}

/**
 * Guarda un Pokémon capturado (registra la captura en la Pokédex). Devuelve { where, box, slot, boxName }.
 * where: 'party' | 'box' | 'none' (sin espacio: no debería ocurrir porque el motor bloquea la captura).
 */
export function storeCaught(state, pokemon) {
  const r = state.addPokemon(pokemon);
  return { ...r, boxName: r.where === 'box' ? boxLabel(state, r.box) : null };
}

/** Mensaje de destino de una captura. */
export function storedMessage(name, stored) {
  if (stored.where === 'party') return `¡${name} se ha unido a tu equipo!`;
  if (stored.where === 'box') return `Tu equipo está completo: ${name} ha sido enviado al PC.\\nSe ha guardado en «${stored.boxName}».`;
  return `¡No queda espacio para ${name}!`;
}
