// Efectos de movimientos: intercambio/copia/reinicio de etapas, estadísticas base y efectos de gen 9
// (030_Move/007_MoveEffects_BattlerStats, segunda parte; separado de stats.js por tamaño).
import { Move } from '../move.js';
import { TwoTurnMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { BATTLE_STATS } from '../../constants.js';

const fail = (move) => { move.battle.pbDisplay('¡Pero ha fallado!'); return true; };

function swapStages(stats, msg) {
  return class extends Move {
    ignoresSubstitute() { return true; }
    pbEffectAgainstTarget(user, target) {
      for (const s of stats) {
        if (user.stages[s] > target.stages[s]) {
          user.statsLoweredThisRound = true;
          user.statsDropped = true;
          target.statsRaisedThisRound = true;
        } else if (user.stages[s] < target.stages[s]) {
          user.statsRaisedThisRound = true;
          target.statsLoweredThisRound = true;
          target.statsDropped = true;
        }
        [user.stages[s], target.stages[s]] = [target.stages[s], user.stages[s]];
      }
      this.battle.pbDisplay(msg(user));
    }
  };
}

class UserCopyTargetStatStages extends Move {
  ignoresSubstitute() { return true; }
  pbEffectAgainstTarget(user, target) {
    for (const s of BATTLE_STATS) {
      if (user.stages[s] > target.stages[s]) {
        user.statsLoweredThisRound = true;
        user.statsDropped = true;
      } else if (user.stages[s] < target.stages[s]) {
        user.statsRaisedThisRound = true;
      }
      user.stages[s] = target.stages[s];
    }
    user.effects.FocusEnergy = target.effects.FocusEnergy;
    user.effects.LaserFocus = target.effects.LaserFocus;
    this.battle.pbDisplay(`¡${user.pbThis()} ha copiado los cambios en las características de ${target.pbThis(true)}!`);
  }
}

class UserStealTargetPositiveStatStages extends Move {
  ignoresSubstitute() { return true; }
  pbCalcDamage(user, target, numTargets) {
    if (target.hasRaisedStatStages()) {
      this.battle.pbDisplay(`¡${user.pbThis()} se ha apropiado de las mejoras en las características del rival!`);
      let showAnim = true;
      for (const s of BATTLE_STATS) {
        if (target.stages[s] <= 0) continue;
        if (user.pbCanRaiseStatStage(s, user, this) && user.pbRaiseStatStage(s, target.stages[s], user, showAnim)) showAnim = false;
        target.statsLoweredThisRound = true;
        target.statsDropped = true;
        target.stages[s] = 0;
      }
    }
    super.pbCalcDamage(user, target, numTargets);
  }
}

class InvertTargetStatStages extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.hasAlteredStatStages()) {
      if (show) this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    for (const s of BATTLE_STATS) {
      if (target.stages[s] > 0) {
        target.statsLoweredThisRound = true;
        target.statsDropped = true;
      } else if (target.stages[s] < 0) {
        target.statsRaisedThisRound = true;
      }
      target.stages[s] *= -1;
    }
    this.battle.pbDisplay(`¡Se han invertido los cambios en las características de ${target.pbThis(true)}!`);
  }
}

class ResetTargetStatStages extends Move {
  pbEffectAgainstTarget(user, target) {
    if (target.damageState.calcDamage > 0 && !target.damageState.substitute && target.hasAlteredStatStages()) {
      target.pbResetStatStages();
      this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} han vuelto a sus valores originales!`);
    }
  }
}

class ResetAllBattlersStatStages extends Move {
  pbMoveFailed() {
    return this.battle.allBattlers().some((b) => b.hasAlteredStatStages()) ? false : fail(this);
  }
  pbEffectGeneral() {
    for (const b of this.battle.allBattlers()) b.pbResetStatStages();
    this.battle.pbDisplay('¡Se han eliminado todos los cambios en las características!');
  }
}

class DamageAndResetAllBattlersStatStages extends Move {
  pbEffectWhenDealingDamage() {
    if (this.battle.allBattlers().some((b) => b.hasAlteredStatStages())) {
      for (const b of this.battle.allBattlers()) b.pbResetStatStages();
      this.battle.pbDisplay('¡Se han eliminado todos los cambios en las características!');
    }
  }
}

class StartUserSideImmunityToStatStageLowering extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return user.pbOwnSide().effects.Mist > 0 ? fail(this) : false; }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.Mist = 5;
    this.battle.pbDisplay(`¡La neblina ha cubierto a ${user.pbTeam(true)}!`);
  }
}

class UserSwapBaseAtkDef extends Move {
  canSnatch() { return true; }
  pbEffectGeneral(user) {
    [user.attack, user._defense] = [user._defense, user.attack];
    user.effects.PowerTrick = !user.effects.PowerTrick;
    this.battle.pbDisplay(`¡${user.pbThis()} ha intercambiado su Ataque y su Defensa!`);
  }
}

class UserTargetSwapBaseSpeed extends Move {
  ignoresSubstitute() { return true; }
  pbEffectAgainstTarget(user, target) {
    [user.speed, target.speed] = [target.speed, user.speed];
    this.battle.pbDisplay(`¡${user.pbThis()} ha intercambiado su Velocidad con la del objetivo!`);
  }
}

class UserTargetAverageBaseAtkSpAtk extends Move {
  pbEffectAgainstTarget(user, target) {
    const atk = Math.floor((user.attack + target.attack) / 2);
    const spa = Math.floor((user.spatk + target.spatk) / 2);
    user.attack = target.attack = atk;
    user.spatk = target.spatk = spa;
    this.battle.pbDisplay(`¡${user.pbThis()} suma su capacidad ofensiva con la del objetivo y la reparte equitativamente!`);
  }
}

class UserTargetAverageBaseDefSpDef extends Move {
  pbEffectAgainstTarget(user, target) {
    const def = Math.floor((user._defense + target._defense) / 2);
    const spd = Math.floor((user._spdef + target._spdef) / 2);
    user._defense = target._defense = def;
    user._spdef = target._spdef = spd;
    this.battle.pbDisplay(`¡${user.pbThis()} suma su capacidad defensiva con la del objetivo y la reparte equitativamente!`);
  }
}

class UserTargetAverageHP extends Move {
  pbEffectAgainstTarget(user, target) {
    const newHP = Math.floor((user.hp + target.hp) / 2);
    if (user.hp > newHP) user.pbReduceHP(user.hp - newHP, false, false);
    else if (user.hp < newHP) user.pbRecoverHP(newHP - user.hp, false);
    if (target.hp > newHP) target.pbReduceHP(target.hp - newHP, false, false);
    else if (target.hp < newHP) target.pbRecoverHP(newHP - target.hp, false);
    this.battle.pbDisplay('¡Los combatientes comparten sus PS!');
    user.pbItemHPHealCheck();
    target.pbItemHPHealCheck();
  }
}

class StartUserSideDoubleSpeed extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return user.pbOwnSide().effects.Tailwind > 0 ? fail(this) : false; }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.Tailwind = 4;
    this.battle.pbDisplay(`¡El Viento Afín sopla a favor de ${user.pbTeam(true)}!`);
    for (const b of this.battle.allSameSideBattlers(user.index)) {
      if (b.hasActiveAbility('WINDRIDER') && b.pbCanRaiseStatStage('ATTACK', b, this)) {
        b.pbRaiseStatStageByAbility('ATTACK', 1, b);
      } else if (b.hasActiveAbility('WINDPOWER') && b.effects.Charge === 0) {
        this.battle.pbShowAbilitySplash(b);
        b.effects.Charge = 2;
        this.battle.pbDisplay(`¡Al ser alcanzado por el Viento Afín, ${b.pbThis(true)} cargó energía!`);
        this.battle.pbHideAbilitySplash(b);
      }
    }
  }
}

class StartSwapAllBattlersBaseDefensiveStats extends Move {
  pbEffectGeneral() {
    const f = this.battle.field.effects;
    if (f.WonderRoom > 0) {
      f.WonderRoom = 0;
      this.battle.pbDisplay('¡Los efectos de Zona Extraña sobre la Defensa y la Defensa Especial han desaparecido!');
    } else {
      f.WonderRoom = 5;
      this.battle.pbDisplay('¡Se ha creado un espacio en el que la Defensa y la Defensa Especial se invierten!');
    }
  }
}

class LowerTargetDefense1FlinchTarget extends Move {
  flinchingMove() { return true; }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    let chance = this.pbAdditionalEffectChance(user, target, 50);
    if (this.battle.pbRandom(100) < chance && target.pbCanLowerStatStage('DEFENSE', user, this)) target.pbLowerStatStage('DEFENSE', 1, user);
    chance = this.pbAdditionalEffectChance(user, target, 30);
    if (chance > 0 && this.battle.pbRandom(100) < chance) target.pbFlinch(user);
  }
}

class IncreasePowerEachFaintedAlly extends Move {
  pbBaseDamage(baseDmg, user) { return baseDmg + 50 * user.numFaintedAllies(); }
}

class UserVulnerableUntilNextAction extends Move {
  pbEffectWhenDealingDamage(user) { user.effects.GlaiveRush = 2; }
}

class RaiseAlliesCriticalHitRate1DragonTypes2 extends Move {
  ignoresSubstitute() { return true; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    this.validTargets = this.battle.allSameSideBattlers(user.index).filter((b) => b.index !== user.index && b.effects.FocusEnergy === 0);
    return this.validTargets.length === 0 ? fail(this) : false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (this.validTargets.some((b) => b.index === target.index)) return false;
    if (show) this.battle.pbDisplay(`¡${target.pbThis()} ya está preparado!`);
    return true;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.FocusEnergy = target.pbHasType('DRAGON') ? 2 : 1;
    this.battle.pbDisplay(`¡${target.pbThis()} se está preparando para luchar!`);
  }
}

class RaiseTargetAtkLowerTargetDef2 extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    if (!target.pbCanRaiseStatStage('ATTACK', user, this) && !target.pbCanLowerStatStage('DEFENSE', user, this)) {
      if (show) this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} no pueden cambiar más!`);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    if (target.pbCanRaiseStatStage('ATTACK', user, this)) target.pbRaiseStatStage('ATTACK', 2, user);
    if (target.pbCanLowerStatStage('DEFENSE', user, this)) target.pbLowerStatStage('DEFENSE', 2, user);
  }
}

class RaiseUserAtkSpAtkSpeed2LoseHalfOfTotalHP extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.hp <= Math.max(Math.floor(user.totalhp / 2), 1)) return fail(this);
    if (!['ATTACK', 'SPECIAL_ATTACK', 'SPEED'].some((s) => user.pbCanRaiseStatStage(s, user, this))) {
      this.battle.pbDisplay(`¡Las características de ${user.pbThis(true)} no pueden cambiar más!`);
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    user.pbReduceHP(Math.max(Math.floor(user.totalhp / 2), 1), false, false);
    let showAnim = true;
    for (const s of ['ATTACK', 'SPECIAL_ATTACK', 'SPEED']) {
      if (user.pbCanRaiseStatStage(s, user, this) && user.pbRaiseStatStage(s, 2, user, showAnim)) showAnim = false;
    }
    user.pbItemHPHealCheck();
  }
}

class LowerTargetSpeedOverTime extends Move {
  pbEffectAgainstTarget(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.effects.Syrupy > 0) return;
    target.effects.Syrupy = 3;
    target.effects.SyrupyUser = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} fue cubierto de caramelo pegajoso!`);
  }
}

class TwoTurnAttackOneTurnInRainRaiseUserSpAtk1 extends TwoTurnMove {
  pbIsChargingTurn(user) {
    const ret = super.pbIsChargingTurn(user);
    if (!user.effects.TwoTurnAttack && ['Rain', 'HeavyRain'].includes(user.effectiveWeather())) {
      this.powerHerb = false;
      this.chargingTurn = true;
      this.damagingTurn = true;
      return false;
    }
    return ret;
  }
  pbChargingTurnMessage(user) { this.battle.pbDisplay(`¡${user.pbThis()} absorbió electricidad!`); }
  pbChargingTurnEffect(user) {
    if (user.pbCanRaiseStatStage('SPECIAL_ATTACK', user, this)) user.pbRaiseStatStage('SPECIAL_ATTACK', 1, user);
  }
}

registerMoves({
  UserTargetSwapAtkSpAtkStages: swapStages(['ATTACK', 'SPECIAL_ATTACK'], (u) => `¡${u.pbThis()} ha intercambiado los cambios en el Ataque y el Ataque Especial con el objetivo!`),
  UserTargetSwapDefSpDefStages: swapStages(['DEFENSE', 'SPECIAL_DEFENSE'], (u) => `¡${u.pbThis()} ha intercambiado los cambios en la Defensa y la Defensa Especial con el objetivo!`),
  UserTargetSwapStatStages: swapStages(BATTLE_STATS, (u) => `¡${u.pbThis()} ha intercambiado los cambios de características con el objetivo!`),
  UserCopyTargetStatStages,
  UserStealTargetPositiveStatStages,
  InvertTargetStatStages,
  ResetTargetStatStages,
  ResetAllBattlersStatStages,
  DamageAndResetAllBattlersStatStages,
  StartUserSideImmunityToStatStageLowering,
  UserSwapBaseAtkDef,
  UserTargetSwapBaseSpeed,
  UserTargetAverageBaseAtkSpAtk,
  UserTargetAverageBaseDefSpDef,
  UserTargetAverageHP,
  StartUserSideDoubleSpeed,
  StartSwapAllBattlersBaseDefensiveStats,
  LowerTargetDefense1FlinchTarget,
  IncreasePowerEachFaintedAlly,
  UserVulnerableUntilNextAction,
  RaiseAlliesCriticalHitRate1DragonTypes2,
  RaiseTargetAtkLowerTargetDef2,
  RaiseUserAtkSpAtkSpeed2LoseHalfOfTotalHP,
  LowerTargetSpeedOverTime,
  TwoTurnAttackOneTurnInRainRaiseUserSpAtk1,
});
