// IA de combate (versión simplificada y sensata de 032_AI de Essentials 21.1).
// - Salvajes (habilidad 0): movimiento aleatorio entre los utilizables.
// - Entrenadores: puntúa cada movimiento/objetivo (daño estimado + efectos) y decide si cambiar
//   de Pokémon o usar un objeto según su nivel de habilidad (skill: 0 bajo … 100 experto).
import { scoreMoves } from './aiMoves.js';
import { chooseSwitch, bestReplacement } from './aiSwitch.js';
import { chooseItem } from './aiItems.js';

export const AI_SKILL = Object.freeze({ MINIMUM: 0, LOW: 16, MEDIUM: 32, HIGH: 48, BEST: 100 });

export class BattleAI {
  constructor(battle) {
    this.battle = battle;
  }

  createAIObjects() {}

  /** Habilidad del entrenador que controla al combatiente. */
  skill(idx) {
    const battle = this.battle;
    const b = battle.battlers[idx];
    if (b && b.wild()) {
      const sp = battle.speciesOf(b.pokemon);
      const legendary = (sp.flags || []).some((f) => ['Legendary', 'Mythical', 'UltraBeast'].includes(f));
      return legendary ? AI_SKILL.MEDIUM : AI_SKILL.MINIMUM;
    }
    const owner = battle.pbGetOwnerFromBattlerIndex(idx);
    return owner && owner.skill != null ? owner.skill : AI_SKILL.MEDIUM;
  }

  /** Elige la acción de un combatiente controlado por la IA y la registra. */
  pbDefaultChooseEnemyCommand(idx) {
    const battle = this.battle;
    const b = battle.battlers[idx];
    const skill = this.skill(idx);
    if (!b.wild() && skill >= AI_SKILL.LOW) {
      if (chooseItem(this, b, skill)) return;
      if (chooseSwitch(this, b, skill)) return;
    }
    this.chooseMove(b, skill);
  }

  chooseMove(b, skill) {
    const battle = this.battle;
    const idx = b.index;
    if (!battle.pbCanShowFightMenu(idx)) {
      battle.pbAutoChooseMove(idx, false);
      return;
    }
    const options = scoreMoves(this, b, skill);
    if (options.length === 0) {
      battle.pbAutoChooseMove(idx, false);
      return;
    }
    let pick;
    if (skill <= AI_SKILL.MINIMUM) {
      pick = options[battle.pbAIRandom(options.length)];
    } else {
      const best = Math.max(...options.map((o) => o.score));
      const threshold = best * (skill >= AI_SKILL.HIGH ? 0.85 : 0.7);
      const pool = options.filter((o) => o.score >= threshold && o.score > 0);
      const list = pool.length ? pool : options;
      const total = list.reduce((a, o) => a + Math.max(1, o.score), 0);
      let r = battle.pbAIRandom(Math.max(1, Math.floor(total)));
      pick = list[list.length - 1];
      for (const o of list) {
        r -= Math.max(1, o.score);
        if (r < 0) {
          pick = o;
          break;
        }
      }
    }
    if (!battle.pbRegisterMove(idx, pick.moveIndex, false)) {
      battle.pbAutoChooseMove(idx, false);
      return;
    }
    if (pick.target >= 0) battle.pbRegisterTarget(idx, pick.target);
    if (battle.pbCanMegaEvolve(idx)) battle.pbRegisterMegaEvolution(idx);
  }

  /** Sustituto al debilitarse / Ida y Vuelta: índice de equipo. */
  pbDefaultChooseNewEnemy(idx) {
    return bestReplacement(this, idx);
  }
}

/** Instala la IA en un combate (lo hace index.js al crear el combate). */
export function installAI(battle) {
  battle.ai = new BattleAI(battle);
  return battle.ai;
}
