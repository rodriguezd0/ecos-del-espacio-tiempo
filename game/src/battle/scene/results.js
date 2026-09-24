// Aplicación del resultado del combate a la partida (GameState). Módulo PURO: solo usa la API de GameState.
//   - equipo actualizado (PS, PP, EXP, niveles…), dinero ganado/perdido, objetos gastados,
//   - Pokédex (vistos en combates contra entrenadores) y Pokémon capturados (equipo o caja).
import { BLACKOUT_TEXT } from '../core/constants.js';

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
 * Equipo del jugador tras el combate. CONTRATO ÚNICO hacia el mundo: `party` (ARCHITECTURE §7); el motor
 * (battle/core buildResult) lo entrega como `playerParty`. Devuelve null si el resultado no trae equipo.
 */
export function resultParty(result) {
  const list = Array.isArray(result?.party) ? result.party : (Array.isArray(result?.playerParty) ? result.playerParty : null);
  return list ? list.filter(Boolean) : null;
}

/**
 * Resultado normalizado que devuelven battle() (api.js, con o sin escena) y world/battleFlow:
 * `{ ...motor, outcome, party, caught, stored, canLose }`. `stored` = ya aplicado a la partida (equipo,
 * dinero, mochila, vistos y capturas); si es false, quien lo recibe debe aplicarlo (applyBattleResult +
 * storeCaught). No modifica la entrada.
 */
export function finalizeBattleResult(result, { stored = false, canLose = false, trainer } = {}) {
  const r = result || { outcome: 'win' };
  const caught = r.caught ?? (Array.isArray(r.caughtAll) ? r.caughtAll[0] ?? null : null);
  return {
    ...r,
    outcome: r.outcome || 'win',
    party: resultParty(r) ?? [],
    caught: caught ?? null,
    stored: Boolean(stored),
    canLose: Boolean(canLose || r.canLose),
    ...(trainer !== undefined ? { trainer } : {}),
  };
}

/**
 * Aviso de derrota que aún falta dar en el mapa (world/battleFlow.js#whiteout): ninguno si el combate ya dijo
 * «¡Estás fuera de combate!» (`blackedOut` del motor; Essentials lo da una sola vez, dentro del combate).
 */
export function whiteoutText(result) {
  return result?.blackedOut ? null : BLACKOUT_TEXT;
}

/** Pokémon capturados de un resultado (todos: el motor admite varias capturas). */
export function caughtList(result) {
  if (Array.isArray(result?.caughtAll) && result.caughtAll.length) return result.caughtAll.filter(Boolean);
  return result?.caught ? [result.caught] : [];
}

/**
 * Aplica equipo, dinero, mochila y Pokédex vistos. No almacena capturas (ver storeCaught).
 * Acepta el resultado del motor (`playerParty`) o el normalizado (`party`).
 * @returns {{ moneyChange: number }}
 */
export function applyBattleResult(state, result) {
  if (!state || !result) return { moneyChange: 0 };
  const party = resultParty(result);
  if (party?.length) state.setParty(party); // un equipo vacío nunca es válido (combate fallido): no se toca
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
