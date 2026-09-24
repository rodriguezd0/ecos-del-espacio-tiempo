// Punto de entrada para iniciar combates desde el mundo y los guiones.
// CONTRATO ESTABLE: battle(config) → Promise<{ outcome, party, caught, stored, … }>.
//   - En el navegador: escena de combate real (battle/scene/runner.js) con el motor de battle/core.
//   - Sin DOM (tests): el motor con HeadlessBattleUI (decide solo) y sin presentación.
// installBattle(fn) permite sustituir la implementación (pruebas, modos especiales).
import { TRAINERS } from '../content/trainers/index.js';
import { battleBgmFor } from './scene/setup.js';

const HEADLESS = typeof document === 'undefined';

/**
 * Música de un combate antes de empezarlo (world/battleFlow.js la pone durante la transición).
 * Devuelve un nombre del catálogo de audio o null.
 */
export function battleBGM(config = {}) {
  const def = typeof config.trainer === 'string' ? TRAINERS[config.trainer] : config.trainer;
  return battleBgmFor({ ...config, bgm: null }, def ? { bgm: def.bgm || null } : null);
}

/** Combate sin presentación (Node): útil para pruebas de integración del flujo. */
async function headlessBattle(config) {
  const [{ Battle, HeadlessBattleUI }, { buildBattleConfig }, { getTrainer }, { finalizeBattleResult }] = await Promise.all([
    import('./core/index.js'), import('./scene/setup.js'), import('../content/trainers/index.js'), import('./scene/results.js'),
  ]);
  const db = config.db;
  if (!db) {
    // Sin base de datos no se puede simular: se mantiene el comportamiento del stub original (victoria).
    console.info('[battle] Sin config.db: combate omitido (victoria).');
    return finalizeBattleResult({ outcome: 'win', party: [...(config.player?.party || [])] }, { canLose: Boolean(config.canLose) });
  }
  const { config: full, meta } = buildBattleConfig(config, { db, state: config.state || null, getTrainer });
  const result = await new Battle(full, new HeadlessBattleUI(config.headless || {})).run();
  // Sin escena nada se aplica a la partida: stored = false (lo aplica world/battleFlow).
  return finalizeBattleResult(result, { stored: false, canLose: meta.canLose, trainer: meta.trainer });
}

/**
 * @param {object} config  ver docs/ARCHITECTURE.md §7 (type, format, trainer | opponent | wild, rules, battleback,
 *                         environment, weather, time, bgm, canLose…)
 * @returns {Promise<{ outcome: 'win'|'lose'|'run'|'caught'|'forfeit', party: object[], caught: object|null, stored: boolean,
 *   canLose: boolean }>}  (normalizado con finalizeBattleResult de scene/results.js; stored = ya aplicado a la partida)
 */
export async function startBattle(config) {
  if (HEADLESS) return headlessBattle(config);
  const { runSceneBattle } = await import('./scene/runner.js');
  return runSceneBattle(config);
}

let impl = null;
export function installBattle(fn) {
  impl = fn;
}
export function battle(config) {
  return impl ? impl(config) : startBattle(config);
}
