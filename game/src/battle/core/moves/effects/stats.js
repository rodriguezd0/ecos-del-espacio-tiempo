// Efectos de movimientos: estadísticas (030_Move/007_MoveEffects_BattlerStats).
import { Move } from '../move.js';
import {
  StatUpMove, MultiStatUpMove, TargetStatDownMove, statUp, multiStatUp, statDown, targetStatDown,
  targetMultiStatDown, statLabel,
} from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { BATTLE_STATS, MAIN_BATTLE_STATS, STAT_STAGE_MAXIMUM, TERRAIN_END_MESSAGES } from '../../constants.js';

const fail = (move) => { move.battle.pbDisplay('¡Pero ha fallado!'); return true; };

class RaiseUserAttackIfTargetFaints extends Move {
  pbEffectAfterAllHits(user, target) {
    if (!target.damageState.fainted) return;
    if (!user.pbCanRaiseStatStage(this.statUp[0], user, this)) return;
    user.pbRaiseStatStage(this.statUp[0], this.statUp[1], user);
  }
}

class MaxUserAttackLoseHalfOfTotalHP extends Move {
  constructor(...a) { super(...a); this.statUp = ['ATTACK', 12]; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    const loss = Math.max(Math.floor(user.totalhp / 2), 1);
    if (user.hp <= loss) return fail(this);
    return !user.pbCanRaiseStatStage('ATTACK', user, this, true);
  }
  pbEffectGeneral(user) {
    user.pbReduceHP(Math.max(Math.floor(user.totalhp / 2), 1), false, false);
    if (user.hasActiveAbility('CONTRARY')) {
      user.stages.ATTACK = -STAT_STAGE_MAXIMUM;
      user.statsLoweredThisRound = true;
      user.statsDropped = true;
      this.battle.pbDisplay(`¡${user.pbThis()} redujo sus PS y bajó al mínimo su Ataque!`);
    } else {
      user.stages.ATTACK = STAT_STAGE_MAXIMUM;
      user.statsRaisedThisRound = true;
      this.battle.pbDisplay(`¡${user.pbThis()} redujo sus PS y subió al máximo su Ataque!`);
    }
    user.pbItemHPHealCheck();
  }
}

class RaiseUserDefense1CurlUpUser extends statUp('DEFENSE', 1) {
  pbEffectGeneral(user) {
    user.effects.DefenseCurl = true;
    super.pbEffectGeneral(user);
  }
}

class RaiseUserSpDef1PowerUpElectricMove extends statUp('SPECIAL_DEFENSE', 1) {
  pbEffectGeneral(user) {
    user.effects.Charge = 2;
    this.battle.pbDisplay(`¡${user.pbThis()} ha comenzado a acumular energía!`);
    super.pbEffectGeneral(user);
  }
}

class RaiseUserSpeed2LowerUserWeight extends statUp('SPEED', 2) {
  pbEffectGeneral(user) {
    if (user.pbWeight() + user.effects.WeightChange > 1) {
      user.effects.WeightChange -= 1000;
      this.battle.pbDisplay(`¡${user.pbThis()} es ahora más ligero!`);
    }
    super.pbEffectGeneral(user);
  }
}

class RaiseUserEvasion2MinimizeUser extends statUp('EVASION', 2) {
  pbEffectGeneral(user) {
    user.effects.Minimize = true;
    super.pbEffectGeneral(user);
  }
}

class RaiseUserCriticalHitRate2 extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return user.effects.FocusEnergy >= 2 ? fail(this) : false; }
  pbEffectGeneral(user) {
    user.effects.FocusEnergy = 2;
    this.battle.pbDisplay(`¡${user.pbThis()} se está preparando para luchar!`);
  }
}

class RaiseUserAtkSpAtk1Or2InSun extends multiStatUp(['ATTACK', 1, 'SPECIAL_ATTACK', 1]) {
  pbOnStartUse(user) {
    const inc = ['Sun', 'HarshSun'].includes(user.effectiveWeather()) ? 2 : 1;
    this.statUp[1] = inc;
    this.statUp[3] = inc;
  }
}

class LowerUserDefSpDef1RaiseUserAtkSpAtkSpd2 extends Move {
  constructor(...a) {
    super(...a);
    this.statUp = ['ATTACK', 2, 'SPECIAL_ATTACK', 2, 'SPEED', 2];
    this.statDown = ['DEFENSE', 1, 'SPECIAL_DEFENSE', 1];
  }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    for (let i = 0; i < this.statUp.length; i += 2) if (user.pbCanRaiseStatStage(this.statUp[i], user, this)) return false;
    for (let i = 0; i < this.statDown.length; i += 2) if (user.pbCanLowerStatStage(this.statDown[i], user, this)) return false;
    this.battle.pbDisplay(`¡Las características de ${user.pbThis(true)} no pueden alterarse más!`);
    return true;
  }
  pbEffectGeneral(user) {
    let showAnim = true;
    for (let i = 0; i < this.statDown.length; i += 2) {
      if (!user.pbCanLowerStatStage(this.statDown[i], user, this)) continue;
      if (user.pbLowerStatStage(this.statDown[i], this.statDown[i + 1], user, showAnim)) showAnim = false;
    }
    showAnim = true;
    for (let i = 0; i < this.statUp.length; i += 2) {
      if (!user.pbCanRaiseStatStage(this.statUp[i], user, this)) continue;
      if (user.pbRaiseStatStage(this.statUp[i], this.statUp[i + 1], user, showAnim)) showAnim = false;
    }
  }
}

class RaiseUserMainStats1LoseThirdOfTotalHP extends multiStatUp(['ATTACK', 1, 'DEFENSE', 1, 'SPECIAL_ATTACK', 1, 'SPECIAL_DEFENSE', 1, 'SPEED', 1]) {
  pbMoveFailed(user, targets) {
    if (user.hp <= Math.max(Math.floor(user.totalhp / 3), 1)) return fail(this);
    return super.pbMoveFailed(user, targets);
  }
  pbEffectGeneral(user) {
    super.pbEffectGeneral(user);
    user.pbReduceHP(Math.max(Math.floor(user.totalhp / 3), 1), false);
    user.pbItemHPHealCheck();
  }
}

const RaiseUserMainStats1 = multiStatUp(['ATTACK', 1, 'DEFENSE', 1, 'SPECIAL_ATTACK', 1, 'SPECIAL_DEFENSE', 1, 'SPEED', 1]);
class RaiseUserMainStats1TrapUserInBattle extends RaiseUserMainStats1 {
  pbMoveFailed(user, targets) {
    if (user.effects.NoRetreat) return fail(this);
    return super.pbMoveFailed(user, targets);
  }
  pbEffectGeneral(user) {
    super.pbEffectGeneral(user);
    if (!user.trappedInBattle()) {
      user.effects.NoRetreat = true;
      this.battle.pbDisplay(`¡${user.pbThis()} no puede escapar porque ha usado ${this.name}!`);
    }
  }
}

class StartRaiseUserAtk1WhenDamaged extends Move {
  pbEffectGeneral(user) { user.effects.Rage = true; }
}

class RaiseTargetAttack1 extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user, targets) {
    if (this.damagingMove()) return false;
    if (targets.some((b) => b.pbCanRaiseStatStage('ATTACK', user, this))) return false;
    return fail(this);
  }
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    return !target.pbCanRaiseStatStage('ATTACK', user, this, show);
  }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    target.pbRaiseStatStage('ATTACK', 1, user);
  }
  pbAdditionalEffect(user, target) {
    if (target.pbCanRaiseStatStage('ATTACK', user, this)) target.pbRaiseStatStage('ATTACK', 1, user);
  }
}

function raiseTargetConfuse(stat, n) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbMoveFailed(user, targets) {
      if (targets.some((b) => b.pbCanRaiseStatStage(stat, user, this) || b.pbCanConfuse(user, false, this))) return false;
      return fail(this);
    }
    pbEffectAgainstTarget(user, target) {
      if (target.pbCanRaiseStatStage(stat, user, this)) target.pbRaiseStatStage(stat, n, user);
      if (target.pbCanConfuse(user, false, this)) target.pbConfuse();
    }
  };
}

class RaiseTargetSpDef1 extends Move {
  ignoresSubstitute() { return true; }
  pbFailsAgainstTarget(user, target, show) { return !target.pbCanRaiseStatStage('SPECIAL_DEFENSE', user, this, show); }
  pbEffectAgainstTarget(user, target) { target.pbRaiseStatStage('SPECIAL_DEFENSE', 1, user); }
}

class RaiseTargetRandomStat2 extends Move {
  pbFailsAgainstTarget(user, target, show) {
    this.statArray = BATTLE_STATS.filter((s) => target.pbCanRaiseStatStage(s, user, this));
    if (this.statArray.length === 0) {
      if (show) this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} no pueden aumentar más!`);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.pbRaiseStatStage(this.statArray[this.battle.pbRandom(this.statArray.length)], 2, user);
  }
}

class RaiseTargetAtkSpAtk2 extends Move {
  pbMoveFailed(user, targets) {
    if (targets.some((b) => b.pbCanRaiseStatStage('ATTACK', user, this) || b.pbCanRaiseStatStage('SPECIAL_ATTACK', user, this))) return false;
    return fail(this);
  }
  pbEffectAgainstTarget(user, target) {
    let showAnim = true;
    if (target.pbCanRaiseStatStage('ATTACK', user, this) && target.pbRaiseStatStage('ATTACK', 2, user, showAnim)) showAnim = false;
    if (target.pbCanRaiseStatStage('SPECIAL_ATTACK', user, this)) target.pbRaiseStatStage('SPECIAL_ATTACK', 2, user, showAnim);
  }
}

class LowerTargetAttack1BypassSubstitute extends targetStatDown('ATTACK', 1) {
  ignoresSubstitute() { return true; }
}

class LowerTargetDefense1PowersUpInGravity extends targetStatDown('DEFENSE', 1) {
  pbBaseDamage(baseDmg) {
    return this.battle.field.effects.Gravity > 0 ? Math.floor((baseDmg * 3) / 2) : baseDmg;
  }
}

class LowerTargetSpAtk2IfCanAttract extends targetStatDown('SPECIAL_ATTACK', 2) {
  pbFailsAgainstTarget(user, target, show) {
    if (super.pbFailsAgainstTarget(user, target, show)) return true;
    if (this.damagingMove()) return false;
    if (user.gender === 2 || target.gender === 2 || user.gender === target.gender) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    if (target.hasActiveAbility('OBLIVIOUS') && !this.battle.moldBreaker) {
      if (show) {
        this.battle.pbShowAbilitySplash(target);
        this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
        this.battle.pbHideAbilitySplash(target);
      }
      return true;
    }
    return false;
  }
  pbAdditionalEffect(user, target) {
    if (user.gender === 2 || target.gender === 2 || user.gender === target.gender) return;
    if (target.hasActiveAbility('OBLIVIOUS') && !this.battle.moldBreaker) return;
    super.pbAdditionalEffect(user, target);
  }
}

class LowerTargetSpeed1WeakerInGrassyTerrain extends targetStatDown('SPEED', 1) {
  pbBaseDamage(baseDmg) { return this.battle.field.terrain === 'Grassy' ? Math.round(baseDmg / 2) : baseDmg; }
}

class LowerTargetSpeed1MakeTargetWeakerToFire extends targetStatDown('SPEED', 1) {
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.TarShot) return super.pbFailsAgainstTarget(user, target, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    super.pbEffectAgainstTarget(user, target);
    if (!target.effects.TarShot) {
      target.effects.TarShot = true;
      this.battle.pbDisplay(`¡${target.pbThis()} se ha vuelto débil ante el fuego!`);
    }
  }
}

const TERRAIN_END = TERRAIN_END_MESSAGES;

class LowerTargetEvasion1RemoveSideEffects extends targetStatDown('EVASION', 1) {
  ignoresSubstitute() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const s = target.pbOwnSide().effects;
    const o = target.pbOpposingSide().effects;
    if (s.AuroraVeil > 0 || s.LightScreen > 0 || s.Reflect > 0 || s.Mist > 0 || s.Safeguard > 0) return false;
    if (s.StealthRock || s.Spikes > 0 || s.ToxicSpikes > 0 || s.StickyWeb) return false;
    if (o.StealthRock || o.Spikes > 0 || o.ToxicSpikes > 0 || o.StickyWeb) return false;
    if (this.battle.field.terrain !== 'None') return false;
    return super.pbFailsAgainstTarget(user, target, show);
  }
  pbEffectAgainstTarget(user, target) {
    const battle = this.battle;
    const oldTerrain = battle.field.terrain;
    if (target.pbCanLowerStatStage('EVASION', user, this)) target.pbLowerStatStage('EVASION', 1, user);
    const s = target.pbOwnSide().effects;
    const o = target.pbOpposingSide().effects;
    const team = target.pbTeam(true);
    for (const [k, n] of [['AuroraVeil', 'Velo Aurora'], ['LightScreen', 'Pantalla de Luz'], ['Reflect', 'Reflejo'], ['Mist', 'Neblina'], ['Safeguard', 'Velo Sagrado']]) {
      if (s[k] > 0) {
        s[k] = 0;
        battle.pbDisplay(`El efecto de ${n} en ${team} se ha disipado.`);
      }
    }
    if (s.StealthRock || o.StealthRock) {
      s.StealthRock = false;
      o.StealthRock = false;
      battle.pbDisplay('Las piedras puntiagudas han desaparecido.');
    }
    if (s.Spikes > 0 || o.Spikes > 0) {
      s.Spikes = 0;
      o.Spikes = 0;
      battle.pbDisplay('Las púas han desaparecido.');
    }
    if (s.ToxicSpikes > 0 || o.ToxicSpikes > 0) {
      s.ToxicSpikes = 0;
      o.ToxicSpikes = 0;
      battle.pbDisplay('Las púas tóxicas han desaparecido.');
    }
    if (s.StickyWeb || o.StickyWeb) {
      s.StickyWeb = false;
      o.StickyWeb = false;
      battle.pbDisplay('La red viscosa ha desaparecido.');
    }
    if (battle.field.terrain !== 'None') {
      battle.pbDisplay(TERRAIN_END[battle.field.terrain]);
      battle.field.terrain = 'None';
      battle.queueEvent('terrain', 'None');
    }
    if (oldTerrain !== 'None') for (const b of battle.allBattlers()) b.pbAbilityOnTerrainChange();
  }
}

class LowerPoisonedTargetAtkSpAtkSpd1 extends Move {
  constructor(...a) { super(...a); this.statDown = ['ATTACK', 1, 'SPECIAL_ATTACK', 1, 'SPEED', 1]; }
  canMagicCoat() { return true; }
  pbMoveFailed(user, targets) {
    this.validTargets = [];
    for (const b of targets) {
      if (!b || b.isFainted() || !b.poisoned()) continue;
      for (let i = 0; i < this.statDown.length; i += 2) {
        if (b.pbCanLowerStatStage(this.statDown[i], user, this)) {
          this.validTargets.push(b.index);
          break;
        }
      }
    }
    return this.validTargets.length === 0 ? fail(this) : false;
  }
  pbEffectAgainstTarget(user, target) {
    if (!this.validTargets.includes(target.index)) return;
    let showAnim = true;
    for (let i = 0; i < this.statDown.length; i += 2) {
      if (!target.pbCanLowerStatStage(this.statDown[i], user, this)) continue;
      if (target.pbLowerStatStage(this.statDown[i], this.statDown[i + 1], user, showAnim)) showAnim = false;
    }
  }
}

/** Sube estadísticas a aliados que cumplan una condición (Coaching, Engranaje, Flujo Magnético…). */
function raiseAllies({ stats, includeUser = false, filter = () => true, statusMoveOnlyFoes = false }) {
  return class extends Move {
    ignoresSubstitute() { return true; }
    canSnatch() { return true; }
    pbMoveFailed(user) {
      this.validTargets = this.battle.allSameSideBattlers(user.index).filter((b) =>
        (includeUser || b.index !== user.index) && filter(b) && stats.some((s) => b.pbCanRaiseStatStage(s, user, this)));
      return this.validTargets.length === 0 ? fail(this) : false;
    }
    pbFailsAgainstTarget(user, target, show) {
      if (this.validTargets.some((b) => b.index === target.index)) return false;
      if (show) this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} no pueden aumentar más!`);
      return true;
    }
    pbEffectAgainstTarget(user, target) {
      let showAnim = true;
      for (const s of stats) {
        if (target.pbCanRaiseStatStage(s, user, this) && target.pbRaiseStatStage(s, 1, user, showAnim)) showAnim = false;
      }
    }
    get statusMoveOnlyFoes() { return statusMoveOnlyFoes; }
  };
}

class RaiseGrassBattlersDef1 extends Move {
  pbMoveFailed(user) {
    this.validTargets = this.battle.allBattlers().filter((b) => b.pbHasType('GRASS') && !b.semiInvulnerable() &&
      b.pbCanRaiseStatStage('DEFENSE', user, this)).map((b) => b.index);
    return this.validTargets.length === 0 ? fail(this) : false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (this.validTargets.includes(target.index)) return false;
    if (!target.pbHasType('GRASS') || target.semiInvulnerable()) return true;
    return !target.pbCanRaiseStatStage('DEFENSE', user, this, show);
  }
  pbEffectAgainstTarget(user, target) { target.pbRaiseStatStage('DEFENSE', 1, user); }
}

class RaiseGroundedGrassBattlersAtkSpAtk1 extends Move {
  pbMoveFailed(user) {
    this.validTargets = this.battle.allBattlers().filter((b) => b.pbHasType('GRASS') && !b.airborne() && !b.semiInvulnerable() &&
      (b.pbCanRaiseStatStage('ATTACK', user, this) || b.pbCanRaiseStatStage('SPECIAL_ATTACK', user, this))).map((b) => b.index);
    return this.validTargets.length === 0 ? fail(this) : false;
  }
  pbFailsAgainstTarget(user, target) { return !this.validTargets.includes(target.index); }
  pbEffectAgainstTarget(user, target) {
    let showAnim = true;
    if (target.pbCanRaiseStatStage('ATTACK', user, this) && target.pbRaiseStatStage('ATTACK', 1, user, showAnim)) showAnim = false;
    if (target.pbCanRaiseStatStage('SPECIAL_ATTACK', user, this)) target.pbRaiseStatStage('SPECIAL_ATTACK', 1, user, showAnim);
  }
}

class RaiseUserSpAtkSpDef1CureStatus extends multiStatUp(['SPECIAL_ATTACK', 1, 'SPECIAL_DEFENSE', 1]) {
  pbEffectGeneral(user) {
    super.pbEffectGeneral(user);
    if (user.pbHasAnyStatus()) user.pbCureStatus();
  }
}

// Intercambios/copias de etapas, estadísticas base y efectos de gen 9: ver statStages.js.
registerMoves({
  RaiseUserAttack1: statUp('ATTACK', 1),
  RaiseUserAttack2: statUp('ATTACK', 2),
  RaiseUserAttack3: statUp('ATTACK', 3),
  RaiseUserAttack2IfTargetFaints: class extends RaiseUserAttackIfTargetFaints { constructor(...a) { super(...a); this.statUp = ['ATTACK', 2]; } },
  RaiseUserAttack3IfTargetFaints: class extends RaiseUserAttackIfTargetFaints { constructor(...a) { super(...a); this.statUp = ['ATTACK', 3]; } },
  MaxUserAttackLoseHalfOfTotalHP,
  RaiseUserDefense1: statUp('DEFENSE', 1),
  RaiseUserDefense1CurlUpUser,
  RaiseUserDefense2: statUp('DEFENSE', 2),
  RaiseUserDefense3: statUp('DEFENSE', 3),
  RaiseUserSpAtk1: statUp('SPECIAL_ATTACK', 1),
  RaiseUserSpAtk2: statUp('SPECIAL_ATTACK', 2),
  RaiseUserSpAtk3: statUp('SPECIAL_ATTACK', 3),
  RaiseUserSpDef1: statUp('SPECIAL_DEFENSE', 1),
  RaiseUserSpDef1PowerUpElectricMove,
  RaiseUserSpDef2: statUp('SPECIAL_DEFENSE', 2),
  RaiseUserSpDef3: statUp('SPECIAL_DEFENSE', 3),
  RaiseUserSpeed1: statUp('SPEED', 1),
  RaiseUserSpeed2: statUp('SPEED', 2),
  RaiseUserSpeed2LowerUserWeight,
  RaiseUserSpeed3: statUp('SPEED', 3),
  RaiseUserAccuracy1: statUp('ACCURACY', 1),
  RaiseUserAccuracy2: statUp('ACCURACY', 2),
  RaiseUserAccuracy3: statUp('ACCURACY', 3),
  RaiseUserEvasion1: statUp('EVASION', 1),
  RaiseUserEvasion2: statUp('EVASION', 2),
  RaiseUserEvasion2MinimizeUser,
  RaiseUserEvasion3: statUp('EVASION', 3),
  RaiseUserCriticalHitRate2,
  RaiseUserAtkDef1: multiStatUp(['ATTACK', 1, 'DEFENSE', 1]),
  RaiseUserAtkDefAcc1: multiStatUp(['ATTACK', 1, 'DEFENSE', 1, 'ACCURACY', 1]),
  RaiseUserAtkSpAtk1: multiStatUp(['ATTACK', 1, 'SPECIAL_ATTACK', 1]),
  RaiseUserAtkSpAtk1Or2InSun,
  LowerUserDefSpDef1RaiseUserAtkSpAtkSpd2,
  RaiseUserAtkSpd1: multiStatUp(['ATTACK', 1, 'SPEED', 1]),
  RaiseUserAtk1Spd2: multiStatUp(['SPEED', 2, 'ATTACK', 1]),
  RaiseUserAtkAcc1: multiStatUp(['ATTACK', 1, 'ACCURACY', 1]),
  RaiseUserDefSpDef1: multiStatUp(['DEFENSE', 1, 'SPECIAL_DEFENSE', 1]),
  RaiseUserSpAtkSpDef1: multiStatUp(['SPECIAL_ATTACK', 1, 'SPECIAL_DEFENSE', 1]),
  RaiseUserSpAtkSpDefSpd1: multiStatUp(['SPECIAL_ATTACK', 1, 'SPECIAL_DEFENSE', 1, 'SPEED', 1]),
  RaiseUserMainStats1,
  RaiseUserMainStats1LoseThirdOfTotalHP,
  RaiseUserMainStats1TrapUserInBattle,
  RaiseUserAtkDefSpd1: multiStatUp(['ATTACK', 1, 'DEFENSE', 1, 'SPEED', 1]),
  RaiseUserSpAtkSpDef1CureStatus,
  StartRaiseUserAtk1WhenDamaged,
  LowerUserAttack1: statDown(['ATTACK', 1]),
  LowerUserAttack2: statDown(['ATTACK', 2]),
  LowerUserDefense1: statDown(['DEFENSE', 1]),
  LowerUserDefense2: statDown(['DEFENSE', 2]),
  LowerUserSpAtk1: statDown(['SPECIAL_ATTACK', 1]),
  LowerUserSpAtk2: statDown(['SPECIAL_ATTACK', 2]),
  LowerUserSpDef1: statDown(['SPECIAL_DEFENSE', 1]),
  LowerUserSpDef2: statDown(['SPECIAL_DEFENSE', 2]),
  LowerUserSpeed1: statDown(['SPEED', 1]),
  LowerUserSpeed2: statDown(['SPEED', 2]),
  LowerUserAtkDef1: statDown(['ATTACK', 1, 'DEFENSE', 1]),
  LowerUserDefSpDef1: statDown(['DEFENSE', 1, 'SPECIAL_DEFENSE', 1]),
  LowerUserDefSpDefSpd1: statDown(['SPEED', 1, 'DEFENSE', 1, 'SPECIAL_DEFENSE', 1]),
  RaiseTargetAttack1,
  RaiseTargetAttack2ConfuseTarget: raiseTargetConfuse('ATTACK', 2),
  RaiseTargetSpAtk1ConfuseTarget: raiseTargetConfuse('SPECIAL_ATTACK', 1),
  RaiseTargetSpDef1,
  RaiseTargetRandomStat2,
  RaiseTargetAtkSpAtk2,
  LowerTargetAttack1: targetStatDown('ATTACK', 1),
  LowerTargetAttack1BypassSubstitute,
  LowerTargetAttack2: targetStatDown('ATTACK', 2),
  LowerTargetAttack3: targetStatDown('ATTACK', 3),
  LowerTargetDefense1: targetStatDown('DEFENSE', 1),
  LowerTargetDefense1PowersUpInGravity,
  LowerTargetDefense2: targetStatDown('DEFENSE', 2),
  LowerTargetDefense3: targetStatDown('DEFENSE', 3),
  LowerTargetSpAtk1: targetStatDown('SPECIAL_ATTACK', 1),
  LowerTargetSpAtk2: targetStatDown('SPECIAL_ATTACK', 2),
  LowerTargetSpAtk2IfCanAttract,
  LowerTargetSpAtk3: targetStatDown('SPECIAL_ATTACK', 3),
  LowerTargetSpDef1: targetStatDown('SPECIAL_DEFENSE', 1),
  LowerTargetSpDef2: targetStatDown('SPECIAL_DEFENSE', 2),
  LowerTargetSpDef3: targetStatDown('SPECIAL_DEFENSE', 3),
  LowerTargetSpeed1: targetStatDown('SPEED', 1),
  LowerTargetSpeed1WeakerInGrassyTerrain,
  LowerTargetSpeed1MakeTargetWeakerToFire,
  LowerTargetSpeed2: targetStatDown('SPEED', 2),
  LowerTargetSpeed3: targetStatDown('SPEED', 3),
  LowerTargetAccuracy1: targetStatDown('ACCURACY', 1),
  LowerTargetAccuracy2: targetStatDown('ACCURACY', 2),
  LowerTargetAccuracy3: targetStatDown('ACCURACY', 3),
  LowerTargetEvasion1: targetStatDown('EVASION', 1),
  LowerTargetEvasion1RemoveSideEffects,
  LowerTargetEvasion2: targetStatDown('EVASION', 2),
  LowerTargetEvasion3: targetStatDown('EVASION', 3),
  LowerTargetAtkDef1: targetMultiStatDown(['ATTACK', 1, 'DEFENSE', 1]),
  LowerTargetAtkSpAtk1: targetMultiStatDown(['ATTACK', 1, 'SPECIAL_ATTACK', 1]),
  LowerPoisonedTargetAtkSpAtkSpd1,
  RaiseAlliesAtkDef1: raiseAllies({ stats: ['ATTACK', 'DEFENSE'] }),
  RaisePlusMinusUserAndAlliesAtkSpAtk1: raiseAllies({ stats: ['ATTACK', 'SPECIAL_ATTACK'], includeUser: true, filter: (b) => b.hasActiveAbility(['MINUS', 'PLUS']) }),
  RaisePlusMinusUserAndAlliesDefSpDef1: raiseAllies({ stats: ['DEFENSE', 'SPECIAL_DEFENSE'], includeUser: true, filter: (b) => b.hasActiveAbility(['MINUS', 'PLUS']) }),
  RaiseGroundedGrassBattlersAtkSpAtk1,
  RaiseGrassBattlersDef1,
});

export { StatUpMove, MultiStatUpMove, TargetStatDownMove, MAIN_BATTLE_STATS, statLabel };
