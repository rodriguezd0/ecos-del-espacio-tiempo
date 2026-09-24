// Efectos de movimientos: golpes múltiples, dos turnos y multiturno (030_Move/010_MoveEffects_MultiHit).
import { Move } from '../move.js';
import { FixedDamageMove, TwoTurnMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { PoisonTarget, FlinchTarget } from './status.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');

/** Subclase que golpea `n` veces. */
const hits = (n, Base = Move) => class extends Base {
  multiHitMove() { return true; }
  pbNumHits() { return n; }
};

class HitTwoTimesTargetThenTargetAlly extends Move {
  pbNumHits() { return 1; }
  pbRepeatHit() { return true; }
  pbModifyTargets(targets, user) {
    if (targets.length !== 1) return;
    const choices = [];
    for (const b of targets[0].allAllies()) user.pbAddTarget(choices, user, b, this);
    if (choices.length === 0) return;
    const idx = choices.length > 1 ? this.battle.pbRandom(choices.length) : 0;
    user.pbAddTarget(targets, user, choices[idx], this, !this.pbTarget(user).canChooseDistantTarget);
  }
  pbShowFailMessages(targets) {
    if (targets.length > 1) return targets.filter((b) => !b.isFainted() && !b.damageState.unaffected).length <= 1;
    return true;
  }
  pbDesignateTargetsForHit(targets, hitNum) {
    const valid = targets.filter((b) => !b.damageState.unaffected);
    if (valid[1] && hitNum === 1) return [valid[1]];
    return valid[0] ? [valid[0]] : [];
  }
}

/** Triple Patada / Triple Axel: potencia acumulada y precisión por golpe. */
const powersUpEachHit = (Base) => class extends hits(3, Base) {
  successCheckPerHit() { return this.accCheckPerHit; }
  pbOnStartUse(user, targets) {
    this.calcBaseDmg = 0;
    this.accCheckPerHit = !user.hasActiveAbility('SKILLLINK') && !user.hasActiveItem('LOADEDDICE');
    if (super.pbOnStartUse) return super.pbOnStartUse(user, targets);
    return undefined;
  }
  pbBaseDamage(bd) {
    if (this.calcBaseDmg == null) return bd;
    this.calcBaseDmg += bd;
    return this.calcBaseDmg;
  }
};

const HIT_CHANCES = [2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 5, 5, 5];

class HitTwoToFiveTimes extends Move {
  multiHitMove() { return true; }
  pbNumHits(user) {
    const r = this.battle.pbRandom(HIT_CHANCES.length);
    if (user.hasActiveAbility('SKILLLINK')) return HIT_CHANCES[HIT_CHANCES.length - 1];
    if (user.hasActiveItem('LOADEDDICE')) {
      const last = HIT_CHANCES.slice(-6);
      return last[this.battle.pbRandom(last.length)];
    }
    return HIT_CHANCES[r];
  }
}

class HitTwoToFiveTimesOrThreeForAshGreninja extends HitTwoToFiveTimes {
  pbNumHits(user, targets) {
    if (user.hasActiveItem('LOADEDDICE')) return 4 + this.battle.pbRandom(2);
    if (user.isSpecies('GRENINJA') && user.form === 2) return 3;
    return super.pbNumHits(user, targets);
  }
  pbBaseDamage(bd, user, target) {
    if (user.isSpecies('GRENINJA') && user.form === 2) return 20;
    return super.pbBaseDamage(bd, user, target);
  }
}

class HitTwoToFiveTimesRaiseUserSpd1LowerUserDef1 extends HitTwoToFiveTimes {
  pbEffectAfterAllHits(user, target) {
    if (target.damageState.unaffected) return;
    if (user.pbCanLowerStatStage('DEFENSE', user, this)) user.pbLowerStatStage('DEFENSE', 1, user);
    if (user.pbCanRaiseStatStage('SPEED', user, this)) user.pbRaiseStatStage('SPEED', 1, user);
  }
}

class HitOncePerUserTeamMember extends Move {
  multiHitMove() { return true; }
  pbMoveFailed(user) {
    this.beatUpList = [];
    this.battle.eachInTeamFromBattlerIndex(user.index, (pkmn, i) => {
      if (!this.battle.able(pkmn) || pkmn.status) return;
      this.beatUpList.push(i);
    });
    if (this.beatUpList.length === 0) { failMsg(this.battle); return true; }
    return false;
  }
  pbNumHits() { return this.beatUpList.length; }
  pbBaseDamage(bd, user) {
    const i = this.beatUpList.shift();
    const pkmn = this.battle.pbParty(user.index)[i];
    const atk = pkmn ? this.battle.speciesOf(pkmn).baseStats.atk : 0;
    return 5 + Math.floor(atk / 10);
  }
}

class AttackAndSkipNextTurn extends Move {
  pbEffectGeneral(user) {
    user.effects.HyperBeam = 2;
    user.currentMove = this.id;
  }
}

/** Movimiento de dos turnos con mensaje de carga propio. */
const twoTurn = (msg, Base = TwoTurnMove) => class extends Base {
  pbChargingTurnMessage(user, targets) { this.battle.pbDisplay(msg(user, targets)); }
};

class TwoTurnAttackOneTurnInSun extends twoTurn((u) => `¡${u.pbThis()} ha absorbido luz solar!`) {
  pbIsChargingTurn(user) {
    const ret = super.pbIsChargingTurn(user);
    if (!user.effects.TwoTurnAttack && ['Sun', 'HarshSun'].includes(user.effectiveWeather())) {
      this.powerHerb = false;
      this.chargingTurn = true;
      this.damagingTurn = true;
      return false;
    }
    return ret;
  }
  pbBaseDamageMultiplier(mult, user) {
    return ['None', 'Sun', 'HarshSun'].includes(user.effectiveWeather()) ? mult : mult / 2;
  }
}

class TwoTurnAttackParalyzeTarget extends twoTurn((u) => `¡${u.pbThis()} ha quedado envuelto en una luz fría!`) {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user);
  }
}

class TwoTurnAttackBurnTarget extends twoTurn((u) => `¡${u.pbThis()} ha quedado envuelto en aire gélido!`) {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanBurn(user, false, this)) target.pbBurn(user);
  }
}

class TwoTurnAttackFlinchTarget extends twoTurn((u) => `¡${u.pbThis()} está rodeado de una luz brillante!`) {
  flinchingMove() { return true; }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    target.pbFlinch(user);
  }
}

class TwoTurnAttackRaiseUserSpAtkSpDefSpd2 extends twoTurn((u) => `¡${u.pbThis()} está acumulando energía!`) {
  constructor(...a) { super(...a); this.statUp = ['SPECIAL_ATTACK', 2, 'SPECIAL_DEFENSE', 2, 'SPEED', 2]; }
  pbMoveFailed(user) {
    if (user.effects.TwoTurnAttack) return false;
    for (let i = 0; i < this.statUp.length; i += 2) if (user.pbCanRaiseStatStage(this.statUp[i], user, this)) return false;
    this.battle.pbDisplay(`¡Las características de ${user.pbThis(true)} no pueden aumentar más!`);
    return true;
  }
  pbEffectGeneral(user) {
    if (!this.damagingTurn) return;
    let showAnim = true;
    for (let i = 0; i < this.statUp.length; i += 2) {
      if (!user.pbCanRaiseStatStage(this.statUp[i], user, this)) continue;
      if (user.pbRaiseStatStage(this.statUp[i], this.statUp[i + 1], user, showAnim)) showAnim = false;
    }
  }
}

const chargeRaise = (stat, msg) => class extends twoTurn(msg) {
  constructor(...a) { super(...a); this.statUp = [stat, 1]; }
  pbChargingTurnEffect(user) {
    if (user.pbCanRaiseStatStage(this.statUp[0], user, this)) user.pbRaiseStatStage(this.statUp[0], this.statUp[1], user);
  }
};

class TwoTurnAttackInvulnerableInSky extends twoTurn((u) => `¡${u.pbThis()} ha volado muy alto!`) {
  unusableInGravity() { return true; }
}

class TwoTurnAttackInvulnerableInSkyParalyzeTarget extends twoTurn((u) => `¡${u.pbThis()} ha saltado muy alto!`) {
  unusableInGravity() { return true; }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user);
  }
}

class TwoTurnAttackInvulnerableInSkyTargetCannotAct extends TwoTurnMove {
  unusableInGravity() { return true; }
  pbIsChargingTurn(user) {
    this.powerHerb = false;
    this.chargingTurn = !user.effects.TwoTurnAttack;
    this.damagingTurn = !!user.effects.TwoTurnAttack;
    return !this.damagingTurn;
  }
  pbFailsAgainstTarget(user, target, show) {
    const fail = !target.opposes(user) ||
      (target.effects.Substitute > 0 && !this.ignoresSubstitute(user)) ||
      target.pbWeight() >= 2000 ||
      target.semiInvulnerable() || (target.effects.SkyDrop >= 0 && this.chargingTurn) ||
      (target.effects.SkyDrop !== user.index && this.damagingTurn);
    if (fail && show) failMsg(this.battle);
    return fail;
  }
  pbCalcTypeMod(moveType, user, target) {
    if (target.pbHasType('FLYING')) return 0;
    return super.pbCalcTypeMod(moveType, user, target);
  }
  pbChargingTurnMessage(user, targets) {
    this.battle.pbDisplay(`¡${user.pbThis()} se ha llevado a ${targets[0].pbThis(true)} por los aires!`);
  }
  pbAttackingTurnMessage(user, targets) {
    this.battle.pbDisplay(`¡${targets[0].pbThis()} se ha liberado de Caída Libre!`);
  }
  pbChargingTurnEffect(user, target) { target.effects.SkyDrop = user.index; }
  pbEffectAfterAllHits(user, target) { if (this.damagingTurn) target.effects.SkyDrop = -1; }
}

class TwoTurnAttackInvulnerableRemoveProtections extends twoTurn((u) => `¡${u.pbThis()} desaparece en un abrir y cerrar de ojos!`) {
  pbAttackingTurnEffect(user, target) {
    const e = target.effects;
    e.BurningBulwark = false;
    e.SilkTrap = false;
    e.BanefulBunker = false;
    e.KingsShield = false;
    e.Obstruct = false;
    e.Protect = false;
    e.SpikyShield = false;
    const s = target.pbOwnSide().effects;
    s.CraftyShield = false;
    s.MatBlock = false;
    s.QuickGuard = false;
    s.WideGuard = false;
  }
}

class MultiTurnAttackPreventSleeping extends Move {
  pbEffectGeneral(user) {
    if (user.effects.Uproar > 0) return;
    user.effects.Uproar = 3;
    user.currentMove = this.id;
    this.battle.pbDisplay(`¡${user.pbThis()} ha montado un alboroto!`);
    for (const b of this.battle.pbPriority(true)) {
      if (b.isFainted() || b.status !== 'SLEEP' || b.hasActiveAbility('SOUNDPROOF')) continue;
      b.pbCureStatus();
    }
  }
}

class MultiTurnAttackConfuseUserAtEnd extends Move {
  pbEffectAfterAllHits(user, target) {
    if (!target.damageState.unaffected && user.effects.Outrage === 0) {
      user.effects.Outrage = 2 + this.battle.pbRandom(2);
      user.currentMove = this.id;
    }
    if (user.effects.Outrage > 0) {
      user.effects.Outrage -= 1;
      if (user.effects.Outrage === 0 && user.pbCanConfuseSelf(false)) {
        user.pbConfuse(`¡${user.pbThis()} se confundió debido a la fatiga!`);
      }
    }
  }
}

class MultiTurnAttackPowersUpEachTurn extends Move {
  pbNumHits() { return 1; }
  pbBaseDamage(bd, user) {
    let shift = 5 - user.effects.Rollout;
    if (user.effects.Rollout === 0) shift = 0;
    if (user.effects.DefenseCurl) shift += 1;
    return bd * 2 ** shift;
  }
  pbEffectAfterAllHits(user, target) {
    if (!target.damageState.unaffected && user.effects.Rollout === 0) {
      user.effects.Rollout = 5;
      user.currentMove = this.id;
    }
    if (user.effects.Rollout > 0) user.effects.Rollout -= 1;
  }
}

class MultiTurnAttackBideThenReturnDoubleDamage extends FixedDamageMove {
  pbAddTarget(targets, user) {
    if (user.effects.Bide !== 1) return;
    const idx = user.effects.BideTarget;
    const t = idx >= 0 ? this.battle.battlers[idx] : null;
    if (!user.pbAddTarget(targets, user, t, this, false)) user.pbAddTargetRandomFoe(targets, user, this, false);
  }
  pbMoveFailed(user, targets) {
    if (user.effects.Bide !== 1) return false;
    if (user.effects.BideDamage === 0) {
      failMsg(this.battle);
      user.effects.Bide = 0;
      return true;
    }
    if (targets.length === 0) {
      this.battle.pbDisplay('Pero no había objetivo...');
      user.effects.Bide = 0;
      return true;
    }
    return false;
  }
  pbOnStartUse(user) { this.damagingTurn = user.effects.Bide === 1; }
  pbDisplayUseMessage(user) {
    if (user.effects.Bide === 1) this.battle.pbDisplayBrief(`¡${user.pbThis()} liberó energía!`);
    else if (user.effects.Bide > 1) this.battle.pbDisplayBrief(`¡${user.pbThis()} está acumulando energía!`);
    else super.pbDisplayUseMessage(user);
  }
  pbDamagingMove() { return this.damagingTurn ? super.pbDamagingMove() : false; }
  pbFixedDamage(user) { return user.effects.BideDamage * 2; }
  pbEffectGeneral(user) {
    if (user.effects.Bide === 0) {
      user.effects.Bide = 3;
      user.effects.BideDamage = 0;
      user.effects.BideTarget = -1;
      user.currentMove = this.id;
    }
    user.effects.Bide -= 1;
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, this.damagingTurn ? hitNum : 1, showAnimation);
  }
}

class HitTenTimes extends Move {
  multiHitMove() { return true; }
  pbNumHits(user) {
    if (user.hasActiveItem('LOADEDDICE')) return 4 + this.battle.pbRandom(7);
    return 10;
  }
  successCheckPerHit() { return this.accCheckPerHit; }
  pbOnStartUse(user) {
    this.accCheckPerHit = !user.hasActiveAbility('SKILLLINK') && !user.hasActiveItem('LOADEDDICE');
  }
}

registerMoves({
  HitTwoTimes: hits(2),
  HitTwoTimesPoisonTarget: hits(2, PoisonTarget),
  HitTwoTimesFlinchTarget: hits(2, FlinchTarget),
  HitTwoTimesTargetThenTargetAlly,
  HitThreeTimesPowersUpWithEachHit: powersUpEachHit(Move),
  HitThreeTimesPowersUpWithEachHitFlinchTarget: powersUpEachHit(FlinchTarget),
  HitThreeTimesAlwaysCriticalHit: class extends hits(3) { pbCritialOverride() { return 1; } },
  HitThreeTimes: hits(3),
  HitTwoToFiveTimes,
  HitTwoToFiveTimesOrThreeForAshGreninja,
  HitTwoToFiveTimesRaiseUserSpd1LowerUserDef1,
  HitOncePerUserTeamMember,
  HitTenTimes,
  AttackAndSkipNextTurn,
  TwoTurnAttack: twoTurn((u) => `¡${u.pbThis()} ha provocado un remolino!`),
  TwoTurnAttackOneTurnInSun,
  TwoTurnAttackParalyzeTarget,
  TwoTurnAttackBurnTarget,
  TwoTurnAttackFlinchTarget,
  TwoTurnAttackRaiseUserSpAtkSpDefSpd2,
  TwoTurnAttackChargeRaiseUserDefense1: chargeRaise('DEFENSE', (u) => `¡${u.pbThis()} ha agachado la cabeza!`),
  TwoTurnAttackChargeRaiseUserSpAtk1: chargeRaise('SPECIAL_ATTACK', (u) => `¡${u.pbThis()} rebosa energía cósmica!`),
  TwoTurnAttackInvulnerableUnderground: twoTurn((u) => `¡${u.pbThis()} se ha ocultado bajo tierra!`),
  TwoTurnAttackInvulnerableUnderwater: twoTurn((u) => `¡${u.pbThis()} se ha ocultado bajo el agua!`),
  TwoTurnAttackInvulnerableInSky,
  TwoTurnAttackInvulnerableInSkyParalyzeTarget,
  TwoTurnAttackInvulnerableInSkyTargetCannotAct,
  TwoTurnAttackInvulnerableRemoveProtections,
  MultiTurnAttackPreventSleeping,
  MultiTurnAttackConfuseUserAtEnd,
  MultiTurnAttackPowersUpEachTurn,
  MultiTurnAttackBideThenReturnDoubleDamage,
});

export { HitTwoToFiveTimes, twoTurn };
