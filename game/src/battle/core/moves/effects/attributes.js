// Efectos de movimientos: potencia, tipo, daño fijo, protecciones (030_Move/009_MoveEffects_MoveAttributes).
import { Move } from '../move.js';
import { FixedDamageMove, ProtectMove, RecoilMove, StatDownMove, statUp } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { BATTLE_STATS, STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS } from '../../constants.js';
import { Effectiveness, typeMultiplier } from '../../typeChart.js';
import { hiddenPowerType } from '../../pokemonUtil.js';
import { PoisonTarget, FlinchTarget } from './status.js';

const fail = (m) => { m.battle.pbDisplay('¡Pero ha fallado!'); return true; };
const failT = (m, show) => { if (show) m.battle.pbDisplay('¡Pero ha fallado!'); return true; };
const staged = (v, s) => Math.floor((v * STAT_STAGE_MULTIPLIERS[s + STAT_STAGE_MAXIMUM]) / STAT_STAGE_DIVISORS[s + STAT_STAGE_MAXIMUM]);
const inSky = (t) => t.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
  'TwoTurnAttackInvulnerableInSkyTargetCannotAct') || t.effects.SkyDrop >= 0;
const subOk = (m, user, target) => target.effects.Substitute === 0 || m.ignoresSubstitute(user);

// ---- Daño fijo
const fixed = (fn) => class extends FixedDamageMove { pbFixedDamage(u, t) { return fn.call(this, u, t); } };

class LowerTargetHPToUserHP extends FixedDamageMove {
  pbFailsAgainstTarget(user, target, show) { return user.hp >= target.hp ? failT(this, show) : false; }
  pbNumHits() { return 1; }
  pbFixedDamage(user, target) { return target.hp - user.hp; }
}

class OHKO extends FixedDamageMove {
  pbFailsAgainstTarget(user, target, show) {
    if (target.level > user.level) {
      if (show) this.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
      return true;
    }
    if (target.hasActiveAbility('STURDY') && !this.battle.moldBreaker) {
      if (show) {
        this.battle.pbShowAbilitySplash(target);
        this.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
        this.battle.pbHideAbilitySplash(target);
      }
      return true;
    }
    return false;
  }
  ohkoAccuracy(user, target) { return this.accuracy + user.level - target.level; }
  pbAccuracyCheck(user, target) {
    if (target.isCommander()) return false;
    if (target.effects.GlaiveRush > 0) return true;
    return this.battle.pbRandom(100) < this.ohkoAccuracy(user, target);
  }
  pbFixedDamage(user, target) { return target.totalhp; }
  pbHitEffectivenessMessages(user, target, numTargets) {
    super.pbHitEffectivenessMessages(user, target, numTargets);
    if (target.isFainted()) this.battle.pbDisplay('¡K.O. de un golpe!');
  }
}

class OHKOIce extends OHKO {
  pbFailsAgainstTarget(user, target, show) {
    if (target.pbHasType('ICE')) return failT(this, show);
    return super.pbFailsAgainstTarget(user, target, show);
  }
  ohkoAccuracy(user, target) { return super.ohkoAccuracy(user, target) - (user.pbHasType('ICE') ? 0 : 10); }
}

class OHKOHitsUndergroundTarget extends OHKO {
  hitsDiggingTargets() { return true; }
}

class DamageTargetAlly extends Move {
  pbEffectWhenDealingDamage(user, target) {
    const hit = [];
    for (const b of target.allAllies()) {
      if (!b.near(target.index) || !b.takesIndirectDamage()) continue;
      hit.push(b);
      b.pbReduceHP(Math.floor(b.totalhp / 16), false);
    }
    for (const b of hit) this.battle.pbDisplay(`¡Las chispas también alcanzaron a ${b.pbThis(true)}!`);
    for (const b of hit) b.pbItemHPHealCheck();
  }
}

// ---- Potencia variable
const powerFn = (fn, Base = Move) => class extends Base { pbBaseDamage(bd, u, t) { return fn.call(this, bd, u, t); } };

const PowerHigherWithUserHP = powerFn((bd, u) => Math.max(Math.floor((150 * u.hp) / u.totalhp), 1));
const PowerLowerWithUserHP = powerFn((bd, u) => {
  const n = Math.floor((48 * u.hp) / u.totalhp);
  if (n < 2) return 200;
  if (n < 5) return 150;
  if (n < 10) return 100;
  if (n < 17) return 80;
  if (n < 33) return 40;
  return 20;
});
const PowerHigherWithTargetHP = powerFn((bd, u, t) => Math.max(Math.floor((120 * t.hp) / t.totalhp), 1));
const PowerHigherWithTargetHP100PowerRange = powerFn((bd, u, t) => Math.max(Math.floor((100 * t.hp) / t.totalhp), 1));
const PowerHigherWithUserHappiness = powerFn((bd, u) => Math.max(Math.floor((u.happiness * 2) / 5), 1));
const PowerLowerWithUserHappiness = powerFn((bd, u) => Math.max(Math.floor(((255 - u.happiness) * 2) / 5), 1));
const PowerHigherWithUserPositiveStatStages = powerFn((bd, u) => 20 * (1 + BATTLE_STATS.reduce((a, s) => a + Math.max(0, u.stages[s]), 0)));
const PowerHigherWithTargetPositiveStatStages = powerFn((bd, u, t) => Math.min(20 * (3 + BATTLE_STATS.reduce((a, s) => a + Math.max(0, t.stages[s]), 0)), 200));
const PowerHigherWithUserFasterThanTarget = powerFn((bd, u, t) => {
  const n = Math.floor(u.pbSpeed() / t.pbSpeed());
  if (n >= 4) return 150;
  if (n >= 3) return 120;
  if (n >= 2) return 80;
  if (n >= 1) return 60;
  return 40;
});
const PowerHigherWithTargetFasterThanUser = powerFn((bd, u, t) => Math.max(Math.min(Math.floor((25 * t.pbSpeed()) / u.pbSpeed()), 150), 1));
const PowerHigherWithLessPP = powerFn(function () {
  const dmgs = [200, 80, 60, 50, 40];
  return dmgs[Math.min(Math.max(this.pp, 0), dmgs.length - 1)];
});
const PowerHigherWithTargetWeight = powerFn((bd, u, t) => {
  const w = t.pbWeight();
  if (w >= 2000) return 120;
  if (w >= 1000) return 100;
  if (w >= 500) return 80;
  if (w >= 250) return 60;
  if (w >= 100) return 40;
  return 20;
});
const PowerHigherWithUserHeavierThanTarget = powerFn((bd, u, t) => {
  const n = Math.floor(u.pbWeight() / t.pbWeight());
  if (n >= 5) return 120;
  if (n >= 4) return 100;
  if (n >= 3) return 80;
  if (n >= 2) return 60;
  return 40;
});

class PowerHigherWithConsecutiveUse extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    const old = user.effects.FuryCutter;
    super.pbChangeUsageCounters(user, specialUsage);
    let maxMult = 1;
    while ((this.power << (maxMult - 1)) < 160) maxMult += 1;
    user.effects.FuryCutter = old >= maxMult ? maxMult : old + 1;
  }
  pbBaseDamage(bd, user) { return bd << (user.effects.FuryCutter - 1); }
}

class PowerHigherWithConsecutiveUseOnUserSide extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    const side = user.pbOwnSide().effects;
    const old = side.EchoedVoiceCounter;
    super.pbChangeUsageCounters(user, specialUsage);
    if (!side.EchoedVoiceUsed) side.EchoedVoiceCounter = old >= 5 ? 5 : old + 1;
    side.EchoedVoiceUsed = true;
  }
  pbBaseDamage(bd, user) { return bd * user.pbOwnSide().effects.EchoedVoiceCounter; }
}

class RandomPowerDoublePowerIfTargetUnderground extends Move {
  hitsDiggingTargets() { return true; }
  pbOnStartUse() {
    const base = [10, 30, 50, 70, 90, 110, 150];
    const mags = [4, 5, 5, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 9, 9, 10];
    const m = mags[this.battle.pbRandom(mags.length)];
    this.magnitudeDmg = base[m - 4];
    this.battle.pbDisplay(`¡Magnitud ${m}!`);
  }
  pbBaseDamage() { return this.magnitudeDmg || 70; }
  pbModifyDamage(mult, user, target) {
    if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderground')) mult *= 2;
    if (this.battle.field.terrain === 'Grassy') mult /= 2;
    return mult;
  }
}

const DoublePowerIfTargetHPLessThanHalf = powerFn((bd, u, t) => (t.hp <= Math.floor(t.totalhp / 2) ? bd * 2 : bd));

class DoublePowerIfUserPoisonedBurnedParalyzed extends Move {
  damageReducedByBurn() { return false; }
  pbBaseDamage(bd, u) { return u.poisoned() || u.burned() || u.paralyzed() ? bd * 2 : bd; }
}

class DoublePowerIfTargetAsleepCureTarget extends Move {
  pbBaseDamage(bd, u, t) { return t.asleep() && subOk(this, u, t) ? bd * 2 : bd; }
  pbEffectAfterAllHits(user, target) {
    if (target.isFainted() || target.damageState.unaffected || target.damageState.substitute) return;
    if (target.status === 'SLEEP') target.pbCureStatus();
  }
}

class DoublePowerIfTargetParalyzedCureTarget extends Move {
  pbBaseDamage(bd, u, t) { return t.paralyzed() && subOk(this, u, t) ? bd * 2 : bd; }
  pbEffectAfterAllHits(user, target) {
    if (target.isFainted() || target.damageState.unaffected || target.damageState.substitute) return;
    if (target.status === 'PARALYSIS') target.pbCureStatus();
  }
}

const DoublePowerIfTargetPoisoned = class extends Move {
  pbBaseDamage(bd, u, t) { return t.poisoned() && subOk(this, u, t) ? bd * 2 : bd; }
};
const DoublePowerIfTargetStatusProblem = class extends Move {
  pbBaseDamage(bd, u, t) { return t.pbHasAnyStatus() && subOk(this, u, t) ? bd * 2 : bd; }
};

class DoublePowerIfUserHasNoItem extends Move {
  pbBaseDamageMultiplier(mult, user) { return !user.item || user.effects.GemConsumed ? mult * 2 : mult; }
}

class DoublePowerIfTargetUnderwater extends Move {
  hitsDivingTargets() { return true; }
  pbModifyDamage(mult, u, t) { return t.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderwater') ? mult * 2 : mult; }
}

class DoublePowerIfTargetUnderground extends Move {
  hitsDiggingTargets() { return true; }
  pbModifyDamage(mult, u, t) {
    if (t.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderground')) mult *= 2;
    if (this.battle.field.terrain === 'Grassy') mult /= 2;
    return mult;
  }
}

class DoublePowerIfTargetInSky extends Move {
  hitsFlyingTargets() { return true; }
  pbBaseDamage(bd, u, t) { return inSky(t) ? bd * 2 : bd; }
}

const DoublePowerInElectricTerrain = class extends Move {
  pbBaseDamage(bd, u, t) { return this.battle.field.terrain === 'Electric' && t.affectedByTerrain() ? bd * 2 : bd; }
};
const DoublePowerIfUserLastMoveFailed = powerFn((bd, u) => (u.lastRoundMoveFailed ? bd * 2 : bd));
const DoublePowerIfAllyFaintedLastTurn = class extends Move {
  pbBaseDamage(bd, u) {
    const lrf = u.pbOwnSide().effects.LastRoundFainted;
    return lrf >= 0 && lrf === this.battle.turnCount - 1 ? bd * 2 : bd;
  }
};
const DoublePowerIfUserLostHPThisTurn = powerFn((bd, u, t) => (u.lastAttacker.includes(t.index) ? bd * 2 : bd));
const DoublePowerIfTargetLostHPThisTurn = powerFn((bd, u, t) => (t.tookDamageThisRound ? bd * 2 : bd));
const DoublePowerIfUserStatsLoweredThisTurn = powerFn((bd, u) => (u.statsLoweredThisRound ? bd * 2 : bd));
const DoublePowerIfTargetActed = class extends Move {
  pbBaseDamage(bd, u, t) {
    const act = this.battle.choices[t.index].action;
    return act !== 'None' && ((act !== 'UseMove' && act !== 'Shift') || t.movedThisRound()) ? bd * 2 : bd;
  }
};
const DoublePowerIfTargetNotActed = class extends Move {
  pbBaseDamage(bd, u, t) {
    const act = this.battle.choices[t.index].action;
    return act === 'None' || (['UseMove', 'Shift'].includes(act) && !t.movedThisRound()) ? bd * 2 : bd;
  }
};
const IncreasePowerEachTimeHit = class extends Move {
  pbBaseDamage(bd, u) { return Math.min(bd + 50 * this.battle.pbRageHitCount(u), 350); }
};
const IncreasePowerSuperEffective = class extends Move {
  pbBaseDamage(bd, u, t) { return Effectiveness.superEffective(t.damageState.typeMod) ? (bd * 4) / 3.0 : bd; }
};

class AlwaysCriticalHit extends Move {
  pbCritialOverride() { return 1; }
}

class EnsureNextCriticalHit extends Move {
  canSnatch() { return true; }
  pbEffectGeneral(user) {
    user.effects.LaserFocus = 2;
    this.battle.pbDisplay(`¡${user.pbThis()} se concentra para que su próximo golpe sea crítico!`);
  }
}

class StartPreventCriticalHitsAgainstUserSide extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return user.pbOwnSide().effects.LuckyChant > 0 ? fail(this) : false; }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.LuckyChant = 5;
    this.battle.pbDisplay(`¡El conjuro protege a ${user.pbTeam(true)} de los golpes críticos!`);
  }
}

class CannotMakeTargetFaint extends Move {
  nonLethal() { return true; }
}

class UserEnduresFaintingThisTurn extends ProtectMove {
  constructor(...a) { super(...a); this.effect = 'Endure'; }
  pbProtectMessage(user) { this.battle.pbDisplay(`¡${user.pbThis()} se prepara para resistir los ataques!`); }
}

function sportMove(field, msg) {
  return class extends Move {
    pbMoveFailed() { return this.battle.field.effects[field] > 0 ? fail(this) : false; }
    pbEffectGeneral() {
      this.battle.field.effects[field] = 5;
      this.battle.pbDisplay(msg);
    }
  };
}

function screenMove(effect, msg, requireHail = false) {
  return class extends Move {
    canSnatch() { return true; }
    pbMoveFailed(user) {
      if (requireHail && user.effectiveWeather() !== 'Hail') return fail(this);
      return user.pbOwnSide().effects[effect] > 0 ? fail(this) : false;
    }
    pbEffectGeneral(user) {
      user.pbOwnSide().effects[effect] = user.hasActiveItem('LIGHTCLAY') ? 8 : 5;
      this.battle.pbDisplay(msg(this, user));
    }
  };
}

function damageAndScreen(effect, msg) {
  return class extends Move {
    canSnatch() { return true; }
    pbEffectWhenDealingDamage(user) {
      if (user.pbOwnSide().effects[effect] > 0) return;
      user.pbOwnSide().effects[effect] = user.hasActiveItem('LIGHTCLAY') ? 8 : 5;
      this.battle.pbDisplay(msg(this, user));
    }
  };
}

const REFLECT_MSG = (m, u) => `¡${m.name} ha aumentado la resistencia de ${u.pbTeam(true)} ante los ataques físicos!`;
const LIGHTSCREEN_MSG = (m, u) => `¡${m.name} ha aumentado la resistencia de ${u.pbTeam(true)} ante los ataques especiales!`;

export class RemoveScreens extends Move {
  ignoresReflect() { return true; }
  pbEffectGeneral(user) {
    const o = user.pbOpposingSide().effects;
    const team = user.pbOpposingTeam(true);
    if (o.LightScreen > 0) { o.LightScreen = 0; this.battle.pbDisplay(`¡El efecto de Pantalla de Luz en ${team} se ha disipado!`); }
    if (o.Reflect > 0) { o.Reflect = 0; this.battle.pbDisplay(`¡El efecto de Reflejo en ${team} se ha disipado!`); }
    if (o.AuroraVeil > 0) { o.AuroraVeil = 0; this.battle.pbDisplay(`¡El efecto de Velo Aurora en ${team} se ha disipado!`); }
  }
}

const protect = (effect, sided = false) => class extends ProtectMove {
  constructor(...a) { super(...a); this.effect = effect; this.sidedEffect = sided; }
  canSnatch() { return sided; }
};

class ProtectUserSideFromDamagingMovesIfUserFirstTurn extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.turnCount > 1) return fail(this);
    return this.pbMoveFailedLastInRound(user);
  }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.MatBlock = true;
    this.battle.pbDisplay(`¡${user.pbThis()} va a usar un tatami para bloquear ataques!`);
  }
}

class ProtectUserSideFromStatusMoves extends Move {
  pbMoveFailed(user) {
    if (user.pbOwnSide().effects.CraftyShield) return fail(this);
    return this.pbMoveFailedLastInRound(user);
  }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.CraftyShield = true;
    this.battle.pbDisplay(`¡Truco Defensa protege a ${user.pbTeam(true)}!`);
  }
}

function clearProtections(target) {
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

class RemoveProtections extends Move {
  pbEffectAgainstTarget(user, target) { clearProtections(target); }
}
class RemoveProtectionsBypassSubstitute extends RemoveProtections {
  ignoresSubstitute() { return true; }
}
class HoopaRemoveProtectionsBypassSubstituteLowerUserDef1 extends StatDownMove {
  constructor(...a) { super(...a); this.statDown = ['DEFENSE', 1]; }
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (!user.isSpecies('HOOPA')) {
      this.battle.pbDisplay(`¡Pero ${user.pbThis(true)} no puede usar este movimiento!`);
      return true;
    }
    if (user.form !== 1) {
      this.battle.pbDisplay(`¡Pero ${user.pbThis(true)} no puede usarlo en su forma actual!`);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) { clearProtections(target); }
}

const recoil = (div, Base = RecoilMove) => class extends Base {
  pbRecoilDamage(user, target) { return Math.round(target.damageState.totalHPLost / div); }
};
class RecoilThirdOfDamageDealtParalyzeTarget extends recoil(3) {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user);
  }
}
class RecoilThirdOfDamageDealtBurnTarget extends recoil(3) {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanBurn(user, false, this)) target.pbBurn(user);
  }
}
class RecoilHalfOfTotalHP extends RecoilMove {
  pbRecoilDamage(user) { return Math.ceil(user.totalhp / 2.0); }
}

class EffectivenessIncludesFlyingType extends Move {
  pbCalcTypeModSingle(moveType, defType, user, target) {
    return super.pbCalcTypeModSingle(moveType, defType, user, target) * typeMultiplier(this.battle.db.types, 'FLYING', defType);
  }
}

class CategoryDependsOnHigherDamagePoisonTarget extends PoisonTarget {
  constructor(...a) { super(...a); this.calcCategory = 1; }
  physicalMove() { return this.calcCategory === 0; }
  specialMove() { return this.calcCategory === 1; }
  contactMove() { return this.physicalMove(); }
  pbOnStartUse(user, targets) {
    const t = targets[0];
    if (!t) return;
    const phys = staged(user.attack, user.stages.ATTACK) / staged(t.defense, t.stages.DEFENSE);
    const spec = staged(user.spatk, user.stages.SPECIAL_ATTACK) / staged(t.spdef, t.stages.SPECIAL_DEFENSE);
    this.calcCategory = phys === spec ? this.battle.pbRandom(2) : phys > spec ? 0 : 1;
  }
}

class IgnoreTargetAbilityBase extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    super.pbChangeUsageCounters(user, specialUsage);
    if (!specialUsage) this.battle.moldBreaker = true;
  }
}
class CategoryDependsOnHigherDamageIgnoreTargetAbility extends IgnoreTargetAbilityBase {
  constructor(...a) { super(...a); this.calcCategory = 1; }
  physicalMove() { return this.calcCategory === 0; }
  specialMove() { return this.calcCategory === 1; }
  pbOnStartUse(user, targets) {
    this.calcCategory = staged(user.attack, user.stages.ATTACK) > staged(user.spatk, user.stages.SPECIAL_ATTACK) ? 0 : 1;
  }
}

class UseUserDefenseInsteadOfUserAttack extends Move {
  pbGetAttackStats(user) { return [user.defense, user.stages.DEFENSE + STAT_STAGE_MAXIMUM]; }
}
class UseTargetAttackInsteadOfUserAttack extends Move {
  pbGetAttackStats(user, target) {
    if (this.specialMove()) return [target.spatk, target.stages.SPECIAL_ATTACK + STAT_STAGE_MAXIMUM];
    return [target.attack, target.stages.ATTACK + STAT_STAGE_MAXIMUM];
  }
}
class UseTargetDefenseInsteadOfTargetSpDef extends Move {
  pbGetDefenseStats(user, target) { return [target.defense, target.stages.DEFENSE + STAT_STAGE_MAXIMUM]; }
}

class EnsureNextMoveAlwaysHits extends Move {
  pbEffectAgainstTarget(user, target) {
    user.effects.LockOn = 2;
    user.effects.LockOnPos = target.index;
    this.battle.pbDisplay(`¡${user.pbThis()} apuntó a ${target.pbThis(true)}!`);
  }
}

function identify(effect) {
  return class extends Move {
    ignoresSubstitute() { return true; }
    canMagicCoat() { return true; }
    pbEffectAgainstTarget(user, target) {
      target.effects[effect] = true;
      this.battle.pbDisplay(`¡${target.pbThis()} ha sido identificado!`);
    }
  };
}

class IgnoreTargetDefSpDefEvaStatStages extends Move {
  pbCalcAccuracyModifiers(user, target, mods) {
    super.pbCalcAccuracyModifiers(user, target, mods);
    mods.evasion_stage = 0;
  }
  pbGetDefenseStats(user, target) {
    const [v] = super.pbGetDefenseStats(user, target);
    return [v, STAT_STAGE_MAXIMUM];
  }
}

class TypeIsUserFirstType extends Move {
  pbBaseType(user) { return user.pbTypes(true)[0] || this.type; }
}

class TypeDependsOnUserIVs extends Move {
  pbBaseType(user) { return user.pokemon ? hiddenPowerType(this.battle.db, user.pokemon) : this.type; }
}

function naturalGiftData(battle, item) {
  const d = battle.itemData(item);
  const flag = d && (d.flags || []).find((f) => /^NaturalGift_/i.test(f));
  if (!flag) return null;
  const m = flag.match(/^NaturalGift_(\w+)_(\d+)$/i);
  return m ? { type: m[1], power: Math.max(Number(m[2]), 10) } : null;
}

class TypeAndPowerDependOnUserBerry extends Move {
  pbMoveFailed(user) {
    if (!user.item || !this.battle.isBerry(user.item) || !user.itemActive() || !naturalGiftData(this.battle, user.item)) return fail(this);
    return false;
  }
  pbBaseType(user) {
    const d = user.item ? naturalGiftData(this.battle, user.item) : null;
    return d && this.battle.db.types[d.type] ? d.type : 'NORMAL';
  }
  pbBaseDamage(bd, user) {
    const d = user.item ? naturalGiftData(this.battle, user.item) : null;
    return d ? d.power : 1;
  }
  pbEndOfMoveUsageEffect(user) {
    if (user.item) user.pbConsumeItem(true, true, false);
  }
}

const PLATE_TYPES = {
  FISTPLATE: 'FIGHTING', SKYPLATE: 'FLYING', TOXICPLATE: 'POISON', EARTHPLATE: 'GROUND', STONEPLATE: 'ROCK',
  INSECTPLATE: 'BUG', SPOOKYPLATE: 'GHOST', IRONPLATE: 'STEEL', FLAMEPLATE: 'FIRE', SPLASHPLATE: 'WATER',
  MEADOWPLATE: 'GRASS', ZAPPLATE: 'ELECTRIC', MINDPLATE: 'PSYCHIC', ICICLEPLATE: 'ICE', DRACOPLATE: 'DRAGON',
  DREADPLATE: 'DARK', PIXIEPLATE: 'FAIRY',
};
export { PLATE_TYPES };

class TypeDependsOnUserPlate extends Move {
  pbBaseType(user) {
    if (user.item && user.itemActive() && PLATE_TYPES[user.item]) return PLATE_TYPES[user.item];
    return 'NORMAL';
  }
}

class TypeAndPowerDependOnWeather extends Move {
  pbBaseDamage(bd, user) { return user.effectiveWeather() !== 'None' ? bd * 2 : bd; }
  pbBaseType(user) {
    switch (user.effectiveWeather()) {
      case 'Sun': case 'HarshSun': return 'FIRE';
      case 'Rain': case 'HeavyRain': return 'WATER';
      case 'Sandstorm': return 'ROCK';
      case 'Hail': return 'ICE';
      default: return 'NORMAL';
    }
  }
}

class TypeAndPowerDependOnTerrain extends Move {
  pbBaseDamage(bd, user) { return this.battle.field.terrain !== 'None' && user.affectedByTerrain() ? bd * 2 : bd; }
  pbBaseType() {
    return { Electric: 'ELECTRIC', Grassy: 'GRASS', Misty: 'FAIRY', Psychic: 'PSYCHIC' }[this.battle.field.terrain] || 'NORMAL';
  }
}

class TargetMovesBecomeElectric extends Move {
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Electrify) return failT(this, show);
    return this.pbMoveFailedTargetAlreadyMoved(target, show);
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Electrify = true;
    this.battle.pbDisplay(`¡Electrificación hace que el siguiente movimiento de ${target.pbThis(true)} sea de tipo Eléctrico!`);
  }
}

class NormalMovesBecomeElectric extends Move {
  pbMoveFailed(user) {
    if (this.damagingMove()) return false;
    if (this.battle.field.effects.IonDeluge) return fail(this);
    return this.pbMoveFailedLastInRound(user);
  }
  pbEffectGeneral() {
    if (this.battle.field.effects.IonDeluge) return;
    this.battle.field.effects.IonDeluge = true;
    this.battle.pbDisplay('¡Una lluvia de electrones cae sobre el terreno de combate!');
  }
}

class TypeIsUserSecondTypeRemoveScreens extends RemoveScreens {
  pbBaseType(user) {
    if (!user.isSpecies('TAUROS')) return this.type;
    const t = user.speciesData.types;
    return t[1] || t[0] || this.type;
  }
}

class CrashDamageIfFailsUnusableInGravity extends Move {
  recoilMove() { return true; }
  unusableInGravity() { return true; }
  pbCrashDamage(user) {
    if (!user.takesIndirectDamage()) return;
    this.battle.pbDisplay(`¡${user.pbThis()} ha fallado y se ha caído al suelo!`);
    user.pbReduceHP(Math.floor(user.totalhp / 2), false);
    user.pbItemHPHealCheck();
    if (user.isFainted()) user.pbFaint();
  }
}
class CrashDamageIfFails extends CrashDamageIfFailsUnusableInGravity {
  unusableInGravity() { return false; }
}

class FlinchTargetFailsIfTargetNotUsingPriorityMove extends FlinchTarget {
  pbMoveFailed(user, targets) {
    const has = targets.some((b) => {
      if (b.movedThisRound()) return false;
      const ch = this.battle.choices[b.index];
      if (!ch.move || !ch.move.damagingMove()) return false;
      return ch.priority > 0 && ch.priority <= this.priority;
    });
    return has ? false : fail(this);
  }
}

registerMoves({
  FixedDamage20: fixed(() => 20),
  FixedDamage40: fixed(() => 40),
  FixedDamageHalfTargetHP: fixed((u, t) => Math.round(t.hp / 2.0)),
  FixedDamageUserLevel: fixed((u) => u.level),
  FixedDamageUserLevelRandom: fixed(function (u) {
    const min = Math.floor(u.level / 2);
    const max = Math.floor((u.level * 3) / 2);
    return min + this.battle.pbRandom(max - min + 1);
  }),
  LowerTargetHPToUserHP,
  OHKO,
  OHKOIce,
  OHKOHitsUndergroundTarget,
  DamageTargetAlly,
  PowerHigherWithUserHP,
  PowerLowerWithUserHP,
  PowerHigherWithTargetHP,
  PowerHigherWithTargetHP100PowerRange,
  PowerHigherWithUserHappiness,
  PowerLowerWithUserHappiness,
  PowerHigherWithUserPositiveStatStages,
  PowerHigherWithTargetPositiveStatStages,
  PowerHigherWithUserFasterThanTarget,
  PowerHigherWithTargetFasterThanUser,
  PowerHigherWithLessPP,
  PowerHigherWithTargetWeight,
  PowerHigherWithUserHeavierThanTarget,
  PowerHigherWithConsecutiveUse,
  PowerHigherWithConsecutiveUseOnUserSide,
  RandomPowerDoublePowerIfTargetUnderground,
  DoublePowerIfTargetHPLessThanHalf,
  DoublePowerIfUserPoisonedBurnedParalyzed,
  DoublePowerIfTargetAsleepCureTarget,
  DoublePowerIfTargetPoisoned,
  DoublePowerIfTargetParalyzedCureTarget,
  DoublePowerIfTargetStatusProblem,
  DoublePowerIfUserHasNoItem,
  DoublePowerIfTargetUnderwater,
  DoublePowerIfTargetUnderground,
  DoublePowerIfTargetInSky,
  DoublePowerInElectricTerrain,
  DoublePowerIfUserLastMoveFailed,
  DoublePowerIfAllyFaintedLastTurn,
  DoublePowerIfUserLostHPThisTurn,
  DoublePowerIfTargetLostHPThisTurn,
  DoublePowerIfUserStatsLoweredThisTurn,
  DoublePowerIfTargetActed,
  DoublePowerIfTargetNotActed,
  IncreasePowerEachTimeHit,
  IncreasePowerSuperEffective,
  AlwaysCriticalHit,
  EnsureNextCriticalHit,
  StartPreventCriticalHitsAgainstUserSide,
  CannotMakeTargetFaint,
  UserEnduresFaintingThisTurn,
  StartWeakenElectricMoves: sportMove('MudSportField', '¡Se han debilitado los ataques de tipo Eléctrico!'),
  StartWeakenFireMoves: sportMove('WaterSportField', '¡Se han debilitado los ataques de tipo Fuego!'),
  StartWeakenPhysicalDamageAgainstUserSide: screenMove('Reflect', REFLECT_MSG),
  StartWeakenSpecialDamageAgainstUserSide: screenMove('LightScreen', LIGHTSCREEN_MSG),
  StartWeakenDamageAgainstUserSideIfHail: screenMove('AuroraVeil', (m, u) => `¡${m.name} ha aumentado la resistencia de ${u.pbTeam(true)} ante los ataques físicos y especiales!`, true),
  DamageAndStartWeakenPhysicalDamageAgainstUserSide: damageAndScreen('Reflect', REFLECT_MSG),
  DamageAndStartWeakenSpecialDamageAgainstUserSide: damageAndScreen('LightScreen', LIGHTSCREEN_MSG),
  RemoveScreens,
  ProtectUser: protect('Protect'),
  ProtectUserBanefulBunker: protect('BanefulBunker'),
  ProtectUserFromDamagingMovesKingsShield: protect('KingsShield'),
  ProtectUserFromDamagingMovesObstruct: protect('Obstruct'),
  ProtectUserFromTargetingMovesSpikyShield: protect('SpikyShield'),
  ProtectUserFromDamagingMovesSilkTrap: protect('SilkTrap'),
  ProtectUserBurningBulwark: protect('BurningBulwark'),
  ProtectUserSideFromPriorityMoves: protect('QuickGuard', true),
  ProtectUserSideFromMultiTargetDamagingMoves: protect('WideGuard', true),
  ProtectUserSideFromDamagingMovesIfUserFirstTurn,
  ProtectUserSideFromStatusMoves,
  RemoveProtections,
  RemoveProtectionsBypassSubstitute,
  HoopaRemoveProtectionsBypassSubstituteLowerUserDef1,
  RecoilQuarterOfDamageDealt: recoil(4),
  RecoilThirdOfDamageDealt: recoil(3),
  RecoilThirdOfDamageDealtParalyzeTarget,
  RecoilThirdOfDamageDealtBurnTarget,
  RecoilHalfOfDamageDealt: recoil(2),
  RecoilHalfOfTotalHP,
  EffectivenessIncludesFlyingType,
  CategoryDependsOnHigherDamagePoisonTarget,
  CategoryDependsOnHigherDamageIgnoreTargetAbility,
  UseUserDefenseInsteadOfUserAttack,
  UseTargetAttackInsteadOfUserAttack,
  UseTargetDefenseInsteadOfTargetSpDef,
  EnsureNextMoveAlwaysHits,
  StartNegateTargetEvasionStatStageAndGhostImmunity: identify('Foresight'),
  StartNegateTargetEvasionStatStageAndDarkImmunity: identify('MiracleEye'),
  IgnoreTargetDefSpDefEvaStatStages,
  TypeIsUserFirstType,
  TypeDependsOnUserIVs,
  TypeAndPowerDependOnUserBerry,
  TypeDependsOnUserPlate,
  TypeAndPowerDependOnWeather,
  TypeAndPowerDependOnTerrain,
  TargetMovesBecomeElectric,
  NormalMovesBecomeElectric,
  TypeIsUserSecondTypeRemoveScreens,
  CrashDamageIfFailsUnusableInGravity,
  CrashDamageIfFails,
  FlinchTargetFailsIfTargetNotUsingPriorityMove,
  TypeDependsOnUserMorpekoFormRaiseUserSpeed1: class extends statUp('SPEED', 1) {
    pbBaseType(user) { return user.isSpecies('MORPEKO') && user.form === 1 ? 'DARK' : this.type; }
  },
});
