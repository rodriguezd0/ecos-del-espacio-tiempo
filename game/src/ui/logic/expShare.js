// Repartir Exp moderno (gen 6+, CAMPANA B03 «desactivable»): objeto clave EXPSHARE que se activa o desactiva desde
// la Mochila. Activado, los Pokémon del equipo que no participan en el combate reciben el 50 % de la experiencia
// (battle/core/battleExp.js con `player.expAll`, que rellena battle/scene/setup.js). Módulo PURO (GameState).
export const EXP_SHARE_ITEM = 'EXPSHARE';

/** Flag de GameState: presente = desactivado. Al recibirlo queda activado (como en X/Y). */
export const EXP_SHARE_OFF_FLAG = 'exp_share_off';

/** ¿Lleva el jugador el Repartir Exp en la Mochila? */
export function hasExpShare(state) {
  return Boolean(state && typeof state.hasItem === 'function' && state.hasItem(EXP_SHARE_ITEM));
}

/** ¿Reparte experiencia en los combates? (lo tiene y no lo ha desactivado) */
export function isExpShareOn(state) {
  return hasExpShare(state) && !state.flag(EXP_SHARE_OFF_FLAG);
}

/** Cambia el estado del Repartir Exp y devuelve si queda activado. Lanza si el jugador no lo tiene. */
export function toggleExpShare(state) {
  if (!hasExpShare(state)) throw new Error('No tienes el Repartir Exp.');
  const on = !isExpShareOn(state);
  state.setFlag(EXP_SHARE_OFF_FLAG, !on);
  return on;
}

/** Mensaje al activarlo/desactivarlo desde la Mochila. */
export function expShareMessage(on, itemName = 'Repartir Exp') {
  return on
    ? `Has activado el ${itemName}. Los Pokémon del equipo que no combatan recibirán la mitad de la experiencia.`
    : `Has desactivado el ${itemName}. Solo ganarán experiencia los Pokémon que combatan.`;
}

/** Etiqueta de estado para la lista de la Mochila ('ON' | 'OFF'), o null si el objeto no es el Repartir Exp. */
export function expShareLabel(state, itemId) {
  if (itemId !== EXP_SHARE_ITEM || !hasExpShare(state)) return null;
  return isExpShareOn(state) ? 'ON' : 'OFF';
}
