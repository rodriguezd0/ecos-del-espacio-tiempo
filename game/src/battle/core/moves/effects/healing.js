// Efectos de movimientos: curación, drenaje, autodestrucción (030_Move/011_MoveEffects_Healing).
import { Move } from '../move.js';
import { HealingMove, FixedDamageMove, TargetMultiStatDownMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS } from '../../constants.js';
import { BurnTarget } from './status.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');
const restoredMsg = (battle, b) => battle.pbDisplay(`Los PS de ${b.pbThis(true)} han sido restaurados.`);

const heal = (fn) => class extends HealingMove { pbHealAmount(user) { return fn(user); } };
const half = (u) => Math.round(u.totalhp / 2.0);

class HealUserFullyAndFallAsleep extends HealingMove {
  pbMoveFailed(user, targets) {
    if (user.asleep() || user.hasActiveAbility('PURIFYINGSALT')) { failMsg(this.battle); return true; }
    if (!user.pbCanSleep(user, true, this, true)) return true;
    return super.pbMoveFailed(user, targets);
  }
  pbHealAmount(user) { return user.totalhp - user.hp; }
  pbEffectGeneral(user) {
    user.pbSleepSelf(`¡${user.pbThis()} se ha recuperado tras descansar un poco!`, 2);
    super.pbEffectGeneral(user);
  }
}

class HealUserDependingOnWeather extends HealingMove {
  pbOnStartUse(user) {
    switch (user.effectiveWeather()) {
      case 'Sun': case 'HarshSun': this.healAmount = Math.round((user.totalhp * 2) / 3.0); break;
      case 'None': case 'StrongWinds': this.healAmount = half(user); break;
      default: this.healAmount = Math.round(user.totalhp / 4.0);
    }
  }
  pbHealAmount(user) { return this.healAmount ?? half(user); }
}

class HealUserHalfOfTotalHPLoseFlyingTypeThisTurn extends heal(half) {
  pbEffectGeneral(user) {
    super.pbEffectGeneral(user);
    user.effects.Roost = true;
    this.battle.queueRefresh(user);
  }
}

class CureTargetStatusHealUserHalfOfTotalHP extends heal(half) {
  canSnatch() { return false; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.status === 'NONE') {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) { target.pbCureStatus(); }
}

class HealUserByTargetAttackLowerTargetAttack1 extends Move {
  constructor(...a) { super(...a); this.statDown = ['ATTACK', 1]; }
  healingMove() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const stat = this.statDown[0];
    const atLimit = !this.battle.moldBreaker && target.hasActiveAbility('CONTRARY') ? target.statStageAtMax(stat) : target.statStageAtMin(stat);
    if (atLimit && show) failMsg(this.battle);
    return atLimit;
  }
  pbEffectAgainstTarget(user, target) {
    const stage = target.stages[this.statDown[0]] + STAT_STAGE_MAXIMUM;
    let healAmt = Math.floor((target.attack * STAT_STAGE_MULTIPLIERS[stage]) / STAT_STAGE_DIVISORS[stage]);
    if (target.pbCanLowerStatStage(this.statDown[0], user, this)) target.pbLowerStatStage(this.statDown[0], this.statDown[1], user);
    if (target.hasActiveAbility('LIQUIDOOZE', true)) {
      this.battle.pbShowAbilitySplash(target);
      user.pbReduceHP(healAmt);
      this.battle.pbDisplay(`¡${user.pbThis()} ha absorbido el lodo líquido!`);
      this.battle.pbHideAbilitySplash(target);
      user.pbItemHPHealCheck();
    } else if (user.canHeal()) {
      if (user.hasActiveItem('BIGROOT')) healAmt = Math.floor(healAmt * 1.3);
      if (user.hasActiveAbility('STURDYROOT')) healAmt = Math.floor(healAmt * 1.3);
      user.pbRecoverHP(healAmt);
      restoredMsg(this.battle, user);
    }
  }
}

/** Drena una fracción del daño causado. */
const drain = (fraction, Base = Move, condition = null) => class extends Base {
  healingMove() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (condition && !condition(target)) {
      if (show) this.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
      return true;
    }
    return super.pbFailsAgainstTarget(user, target, show);
  }
  pbEffectAgainstTarget(user, target) {
    if (target.damageState.hpLost <= 0) return;
    user.pbRecoverHPFromDrain(Math.round(target.damageState.hpLost * fraction), target);
    super.pbEffectAgainstTarget(user, target);
  }
};

class HealUserAndAlliesQuarterOfTotalHP extends Move {
  healingMove() { return true; }
  pbMoveFailed(user) {
    if (!this.battle.allSameSideBattlers(user.index).some((b) => b.canHeal())) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target) { return !target.canHeal(); }
  pbEffectAgainstTarget(user, target) {
    target.pbRecoverHP(Math.floor(target.totalhp / 4));
    restoredMsg(this.battle, target);
  }
}

const CURE_MESSAGES = {
  SLEEP: (b) => `¡${b.pbThis()} se ha despertado!`,
  POISON: (b) => `¡${b.pbThis()} se ha curado del envenenamiento!`,
  BURN: (b) => `¡La quemadura de ${b.pbThis(true)} se ha curado!`,
  PARALYSIS: (b) => `¡${b.pbThis()} se ha curado de la parálisis!`,
  FROZEN: (b) => `¡${b.pbThis()} se ha descongelado!`,
  FROSTBITE: (b) => `¡${b.pbThis()} se ha curado de la congelación!`,
};

class HealUserAndAlliesQuarterOfTotalHPCureStatus extends Move {
  healingMove() { return true; }
  pbMoveFailed(user) {
    if (!this.battle.allSameSideBattlers(user.index).some((b) => b.canHeal() || b.status !== 'NONE')) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target) { return target.status === 'NONE' && !target.canHeal(); }
  pbEffectAgainstTarget(user, target) {
    if (target.canHeal()) {
      target.pbRecoverHP(Math.floor(target.totalhp / 4));
      restoredMsg(this.battle, target);
    }
    if (target.status !== 'NONE') {
      const old = target.status;
      target.pbCureStatus(false);
      if (CURE_MESSAGES[old]) this.battle.pbDisplay(CURE_MESSAGES[old](target));
    }
  }
}

const healTarget = (amountFn) => class extends Move {
  healingMove() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.hp === target.totalhp) {
      if (show) this.battle.pbDisplay(`¡Los PS de ${target.pbThis(true)} están al máximo!`);
      return true;
    }
    if (!target.canHeal()) {
      if (show) this.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.pbRecoverHP(amountFn.call(this, user, target));
    restoredMsg(this.battle, target);
  }
};

class HealUserPositionNextTurn extends Move {
  healingMove() { return true; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (this.battle.positions[user.index].effects.Wish > 0) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    const e = this.battle.positions[user.index].effects;
    e.Wish = 2;
    e.WishAmount = half(user);
    e.WishMaker = user.pokemonIndex;
  }
}

const selfEffect = (effect, msg) => class extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects[effect]) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    user.effects[effect] = true;
    this.battle.pbDisplay(msg(user));
  }
};

class StartDamageTargetEachTurnIfTargetAsleep extends Move {
  pbFailsAgainstTarget(user, target, show) {
    if (!target.asleep() || target.effects.Nightmare) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Nightmare = true;
    this.battle.pbDisplay(`¡${target.pbThis()} empezó a tener pesadillas!`);
  }
}

class StartLeechSeedTarget extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.LeechSeed >= 0) {
      if (show) this.battle.pbDisplay(`¡${target.pbThis()} esquivó el ataque!`);
      return true;
    }
    if (target.pbHasType('GRASS')) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    return false;
  }
  pbMissMessage(user, target) {
    this.battle.pbDisplay(`¡${target.pbThis()} esquivó el ataque!`);
    return true;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.LeechSeed = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} fue infectado!`);
  }
}

class UserLosesHalfOfTotalHP extends Move {
  pbEffectAfterAllHits(user) {
    if (!user.takesIndirectDamage()) return;
    user.pbReduceHP(Math.max(1, Math.ceil(user.totalhp / 2.0)), false);
    this.battle.pbDisplay(`¡${user.pbThis()} se ha dañado por el retroceso!`);
    user.pbItemHPHealCheck();
  }
}

/** Falla si hay Humedad en el campo (Explosión, Autodestrucción, Cabeza Sorpresa). */
function dampBlocks(move, user) {
  if (move.battle.moldBreaker) return false;
  const bearer = move.battle.pbCheckGlobalAbility('DAMP');
  if (!bearer) return false;
  move.battle.pbShowAbilitySplash(bearer);
  move.battle.pbDisplay(`¡${user.pbThis()} no puede usar ${move.name}!`);
  move.battle.pbHideAbilitySplash(bearer);
  return true;
}

class UserLosesHalfOfTotalHPExplosive extends Move {
  worksWithNoTargets() { return true; }
  pbMoveFailed(user) { return dampBlocks(this, user); }
  pbSelfKO(user) {
    if (!user.takesIndirectDamage()) return;
    user.pbReduceHP(half(user), false);
    user.pbItemHPHealCheck();
  }
}

const faintSelf = (user) => {
  if (user.isFainted()) return;
  user.pbReduceHP(user.hp, false);
  user.pbItemHPHealCheck();
};

class UserFaintsExplosive extends Move {
  worksWithNoTargets() { return true; }
  pbNumHits() { return 1; }
  pbMoveFailed(user) { return dampBlocks(this, user); }
  pbSelfKO(user) { faintSelf(user); }
}

class UserFaintsPowersUpInMistyTerrainExplosive extends UserFaintsExplosive {
  pbBaseDamage(bd) { return this.battle.field.terrain === 'Misty' ? Math.floor((bd * 3) / 2) : bd; }
}

class UserFaintsFixedDamageUserHP extends FixedDamageMove {
  pbNumHits() { return 1; }
  pbOnStartUse(user) { this.finalGambitDamage = user.hp; }
  pbFixedDamage() { return this.finalGambitDamage; }
  pbSelfKO(user) { faintSelf(user); }
}

class UserFaintsLowerTargetAtkSpAtk2 extends TargetMultiStatDownMove {
  constructor(...a) { super(...a); this.statDown = ['ATTACK', 2, 'SPECIAL_ATTACK', 2]; }
  canMagicCoat() { return false; }
  pbFailsAgainstTarget() { return false; }
  pbSelfKO(user) { faintSelf(user); }
}

const faintHealReplacement = (effect) => class extends Move {
  healingMove() { return true; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (!this.battle.pbCanChooseNonActive(user.index)) { failMsg(this.battle); return true; }
    return false;
  }
  pbSelfKO(user) {
    if (user.isFainted()) return;
    faintSelf(user);
    this.battle.positions[user.index].effects[effect] = true;
  }
};

class StartPerishCountsForAllBattlers extends Move {
  pbMoveFailed(user, targets) {
    if (targets.every((b) => b.effects.PerishSong > 0)) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target) { return target.effects.PerishSong > 0; }
  pbEffectAgainstTarget(user, target) {
    target.effects.PerishSong = 4;
    target.effects.PerishSongUser = user.index;
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
    this.battle.pbDisplay('¡Los Pokémon que oigan la canción se debilitarán en 3 turnos!');
  }
}

class AttackerFaintsIfUserFaints extends Move {
  pbMoveFailed(user) {
    if (user.effects.DestinyBondPrevious) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    user.effects.DestinyBond = true;
    this.battle.pbDisplay(`¡${user.pbThis()} intenta llevarse a su rival!`);
  }
}

class SetAttackerMovePPTo0IfUserFaints extends Move {
  pbEffectGeneral(user) {
    user.effects.Grudge = true;
    this.battle.pbDisplay(`¡${user.pbThis()} quiere que su rival sienta rencor!`);
  }
}

class DisableTargetHealingMoves2Turns extends Move {
  pbAdditionalEffect(user, target) {
    if (target.effects.HealBlock > 0) return;
    if (this.pbMoveFailedAromaVeil(user, target, false)) return;
    target.effects.HealBlock = 2;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede curarse!`);
    target.pbItemStatusCureCheck();
  }
}

registerMoves({
  HealUserFullyAndFallAsleep,
  HealUserHalfOfTotalHP: heal(half),
  HealUserDependingOnWeather,
  HealUserDependingOnSandstorm: heal((u) => (u.effectiveWeather() === 'Sandstorm' ? Math.round((u.totalhp * 2) / 3.0) : half(u))),
  HealUserHalfOfTotalHPLoseFlyingTypeThisTurn,
  CureTargetStatusHealUserHalfOfTotalHP,
  HealUserByTargetAttackLowerTargetAttack1,
  HealUserByHalfOfDamageDone: drain(0.5),
  HealUserByHalfOfDamageDoneIfTargetAsleep: drain(0.5, Move, (t) => t.asleep()),
  HealUserByThreeQuartersOfDamageDone: drain(0.75),
  HealUserByHalfOfDamageDoneBurnTarget: drain(0.5, BurnTarget),
  HealUserAndAlliesQuarterOfTotalHP,
  HealUserAndAlliesQuarterOfTotalHPCureStatus,
  HealTargetHalfOfTotalHP: healTarget(function (user, target) {
    if (this.pulseMove() && user.hasActiveAbility('MEGALAUNCHER')) return Math.round((target.totalhp * 3) / 4.0);
    return half(target);
  }),
  HealTargetDependingOnGrassyTerrain: healTarget(function (user, target) {
    return this.battle.field.terrain === 'Grassy' ? Math.round((target.totalhp * 2) / 3.0) : half(target);
  }),
  HealUserPositionNextTurn,
  StartHealUserEachTurn: selfEffect('AquaRing', (u) => `¡${u.pbThis()} se rodeó de un manto de agua!`),
  StartHealUserEachTurnTrapUserInBattle: selfEffect('Ingrain', (u) => `¡${u.pbThis()} echó raíces!`),
  StartDamageTargetEachTurnIfTargetAsleep,
  StartLeechSeedTarget,
  UserLosesHalfOfTotalHP,
  UserLosesHalfOfTotalHPExplosive,
  UserFaintsExplosive,
  UserFaintsPowersUpInMistyTerrainExplosive,
  UserFaintsFixedDamageUserHP,
  UserFaintsLowerTargetAtkSpAtk2,
  UserFaintsHealAndCureReplacement: faintHealReplacement('HealingWish'),
  UserFaintsHealAndCureReplacementRestorePP: faintHealReplacement('LunarDance'),
  StartPerishCountsForAllBattlers,
  AttackerFaintsIfUserFaints,
  SetAttackerMovePPTo0IfUserFaints,
  DisableTargetHealingMoves2Turns,
});
