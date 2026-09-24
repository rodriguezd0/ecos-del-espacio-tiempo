// Punto de entrada para iniciar combates desde el mundo y los guiones.
// CONTRATO ESTABLE. Implementación real: battle/scene (fase 2). Stub: victoria inmediata.

/**
 * @param {object} config  ver docs/ARCHITECTURE.md §7 (type, format, opponent, rules, battleback, bgm…)
 * @returns {Promise<{ outcome: 'win'|'lose'|'run'|'caught'|'forfeit', caught?: object }>}
 */
export async function startBattle(config) {
  console.info('[battle stub]', config);
  return { outcome: 'win' };
}

let impl = null;
export function installBattle(fn) {
  impl = fn;
}
export function battle(config) {
  return impl ? impl(config) : startBattle(config);
}
