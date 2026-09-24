// Punto de entrada del motor de combate (sin DOM). Importa la clase Battle con todos sus
// mixins, los efectos de movimientos, habilidades y objetos, y expone la API pública.
//
//   import { Battle, HeadlessBattleUI } from './battle/core/index.js';
//   const result = await new Battle(config, ui).run();
//
// `config` se describe en battleConfig.js; `ui` debe cumplir la interfaz BattleUI (battleUI.js).
import { Battle } from './battle.js';
import { Battler } from './battler.js';

// Mixins de Battler
import './battlerChange.js';
import './battlerStatus.js';
import './battlerStats.js';
import './battlerAbilityItem.js';
import './battlerSuccess.js';
import './battlerTargeting.js';
import './battlerUseMove.js';
import './battlerTriggers.js';
// Mixins de Battle
import './battleStart.js';
import './battleCommand.js';
import './battleSwitch.js';
import './battleAttack.js';
import './battleEndOfRound.js';
import './battleExp.js';
import './battleItems.js';
import './battleCatch.js';
import './bossPhases.js';
// Efectos (se registran al importarse)
import './moves/effects/index.js';
import './abilities/index.js';
import './items/index.js';

import { implementedCodes, isImplemented, unimplementedUsed } from './moves/registry.js';
import { implementedAbilities, PASSIVE_ABILITIES } from './abilities/registry.js';

export { Battle, Battler };
export { HeadlessBattleUI } from './battleUI.js';
export { createRng, sequenceRng } from './rng.js';
export { Settings, ALPHA } from './settings.js';
export { normalizeConfig } from './battleConfig.js';
export { DECISION, DECISION_OUTCOME, STAT_NAMES, STATUS_NAMES, WEATHER_NAMES, TERRAIN_NAMES } from './constants.js';
export { AbilityEffects } from './abilities/registry.js';
export { ItemEffects, implementedHeldItems, BagItems, implementedBagItems, IMPLEMENTED_BALLS } from './items/index.js';
export { AI_SKILL } from './ai/battleAI.js';
export { implementedCodes, isImplemented, unimplementedUsed, implementedAbilities, PASSIVE_ABILITIES };

/** Crea y ejecuta un combate completo. Devuelve el resultado (ver Battle#buildResult). */
export async function runBattle(config, ui) {
  return new Battle(config, ui).run();
}

/** ¿Tiene la habilidad algún efecto implementado (manejador o comprobación en el motor)? */
export function isAbilityImplemented(id) {
  return PASSIVE_ABILITIES.has(id) || implementedAbilities().includes(id);
}
