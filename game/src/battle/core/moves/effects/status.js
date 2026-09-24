// Efectos de movimientos: estados, tipos y habilidades (030_Move/008_MoveEffects_BattlerOther).
import { Move } from '../move.js';
import { registerMoves } from '../registry.js';
import { SUPER_EFFECTIVE, NORMAL_EFFECTIVE, Effectiveness, typeMultiplier } from '../../typeChart.js';
import { Settings } from '../../settings.js';
import { targetStatDown } from '../baseEffects.js';

const fail = (m) => { m.battle.pbDisplay('¡Pero ha fallado!'); return true; };
const failT = (m, show) => { if (show) m.battle.pbDisplay('¡Pero ha fallado!'); return true; };
const inSky = (t) => t.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
  'TwoTurnAttackInvulnerableInSkyTargetCannotAct') || t.effects.SkyDrop >= 0;

/** Plantilla para movimientos que infligen un estado (daño con efecto secundario o de estado puro). */
function statusMove(canFn, doFn) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbFailsAgainstTarget(user, target, show) {
      if (this.damagingMove()) return false;
      return !canFn(target, user, show, this);
    }
    pbEffectAgainstTarget(user, target) {
      if (this.damagingMove()) return;
      doFn(target, user, this);
    }
    pbAdditionalEffect(user, target) {
      if (target.damageState.substitute) return;
      if (canFn(target, user, false, this)) doFn(target, user, this);
    }
  };
}

export const SleepTarget = statusMove((t, u, s, m) => t.pbCanSleep(u, s, m), (t) => t.pbSleep());
export const PoisonTarget = statusMove((t, u, s, m) => t.pbCanPoison(u, s, m), (t, u) => t.pbPoison(u, null, false));
export const ParalyzeTarget = statusMove((t, u, s, m) => t.pbCanParalyze(u, s, m), (t, u) => t.pbParalyze(u));
export const BurnTarget = statusMove((t, u, s, m) => t.pbCanBurn(u, s, m), (t, u) => t.pbBurn(u));
export const FreezeTarget = statusMove((t, u, s, m) => t.pbCanFreeze(u, s, m), (t, u) => t.pbFreeze(null, u));
export const FrostbiteTarget = statusMove((t, u, s, m) => t.pbCanFrostbite(u, s, m), (t, u) => t.pbFrostbite(u));
export const ConfuseTarget = statusMove((t, u, s, m) => t.pbCanConfuse(u, s, m), (t) => t.pbConfuse());

class BadPoisonTarget extends statusMove((t, u, s, m) => t.pbCanPoison(u, s, m), (t, u) => t.pbPoison(u, null, true)) {
  pbOverrideSuccessCheckPerHit(user) {
    return Settings.MORE_TYPE_EFFECTS && this.statusMove() && user.pbHasType('POISON');
  }
}

class SleepTargetChangeUserMeloettaForm extends SleepTarget {
  pbEndOfMoveUsageEffect(user, targets, numHits) {
    if (numHits === 0 || user.isFainted() || user.effects.Transform || !user.isSpecies('MELOETTA')) return;
    if (user.hasActiveAbility('SHEERFORCE') && this.addlEffect > 0) return;
    user.pbChangeForm((user.form + 1) % 2, `¡${user.pbThis()} se transformó!`);
  }
}

class SleepTargetNextTurn extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Yawn > 0) return failT(this, show);
    return !target.pbCanSleep(user, true, this);
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Yawn = 2;
    this.battle.pbDisplay(`¡${user.pbThis()} ha adormecido a ${target.pbThis(true)}!`);
  }
}

class ParalyzeTargetIfNotTypeImmune extends ParalyzeTarget {
  pbFailsAgainstTarget(user, target, show) {
    if (Effectiveness.ineffective(target.damageState.typeMod)) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    return super.pbFailsAgainstTarget(user, target, show);
  }
}

function weatherAccuracy(Base, { rain = 0, sun = null, hail = null } = {}) {
  return class extends Base {
    pbBaseAccuracy(user, target) {
      const w = target.effectiveWeather();
      if (sun !== null && (w === 'Sun' || w === 'HarshSun')) return sun;
      if (rain !== null && (w === 'Rain' || w === 'HeavyRain')) return rain;
      if (hail !== null && w === 'Hail') return hail;
      return super.pbBaseAccuracy(user, target);
    }
  };
}

class ParalyzeTargetAlwaysHitsInRainHitsDecreasesInSunTargetInSky extends weatherAccuracy(ParalyzeTarget, { rain: 0, sun: 50 }) {
  hitsFlyingTargets() { return true; }
}
class ConfuseTargetAlwaysHitsInRainHitsTargetInSky extends weatherAccuracy(ConfuseTarget, { rain: 0, sun: 50 }) {
  hitsFlyingTargets() { return true; }
}
const FreezeTargetAlwaysHitsInHail = weatherAccuracy(FreezeTarget, { rain: null, hail: 0 });

function statusFlinch(canFn, doFn) {
  return class extends Move {
    flinchingMove() { return true; }
    pbAdditionalEffect(user, target) {
      if (target.damageState.substitute) return;
      const chance = this.pbAdditionalEffectChance(user, target, 10);
      if (chance === 0) return;
      if (canFn(target, user, this) && this.battle.pbRandom(100) < chance) doFn(target, user);
      if (this.battle.pbRandom(100) < chance) target.pbFlinch(user);
    }
  };
}

class FreezeTargetSuperEffectiveAgainstWater extends FreezeTarget {
  pbCalcTypeModSingle(moveType, defType, user, target) {
    if (defType === 'WATER') return SUPER_EFFECTIVE;
    return super.pbCalcTypeModSingle(moveType, defType, user, target);
  }
}

class SuperEffectiveAgainstBug extends Move {
  pbCalcTypeModSingle(moveType, defType, user, target) {
    if (defType === 'BUG') return SUPER_EFFECTIVE;
    return super.pbCalcTypeModSingle(moveType, defType, user, target);
  }
}

class ParalyzeBurnOrFreezeTarget extends Move {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    switch (this.battle.pbRandom(3)) {
      case 0: if (target.pbCanBurn(user, false, this)) target.pbBurn(user); break;
      case 1: if (target.pbCanFreeze(user, false, this)) target.pbFreeze(null, user); break;
      default: if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user); break;
    }
  }
}

class PoisonParalyzeOrSleepTarget extends Move {
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    switch (this.battle.pbRandom(3)) {
      case 0: if (target.pbCanSleep(user, false, this)) target.pbSleep(); break;
      case 1: if (target.pbCanPoison(user, false, this)) target.pbPoison(user); break;
      default: if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user); break;
    }
  }
}

class GiveUserStatusToTarget extends Move {
  pbMoveFailed(user) { return user.status === 'NONE' ? fail(this) : false; }
  pbFailsAgainstTarget(user, target, show) {
    return !target.pbCanInflictStatus(user.status, user, false, this) ? failT(this, show) : false;
  }
  pbEffectAgainstTarget(user, target) {
    let msg = '';
    switch (user.status) {
      case 'SLEEP': target.pbSleep(); msg = `${user.pbThis()} se despertó.`; break;
      case 'POISON': target.pbPoison(user, null, user.statusCount !== 0); msg = `${user.pbThis()} se curó del envenenamiento.`; break;
      case 'BURN': target.pbBurn(user); msg = `La quemadura de ${user.pbThis(true)} se curó.`; break;
      case 'PARALYSIS': target.pbParalyze(user); msg = `${user.pbThis()} se curó de la parálisis.`; break;
      case 'FROZEN':
      case 'FROSTBITE': target.pbFreeze(null, user); msg = `${user.pbThis()} se descongeló.`; break;
      default: break;
    }
    if (msg) {
      user.pbCureStatus(false);
      this.battle.pbDisplay(msg);
    }
  }
}

class CureUserBurnPoisonParalysis extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return ['BURN', 'POISON', 'PARALYSIS'].includes(user.status) ? false : fail(this); }
  pbEffectGeneral(user) {
    const old = user.status;
    user.pbCureStatus(false);
    if (old === 'BURN') this.battle.pbDisplay(`La quemadura de ${user.pbThis(true)} se curó.`);
    else if (old === 'POISON') this.battle.pbDisplay(`${user.pbThis()} se curó del envenenamiento.`);
    else this.battle.pbDisplay(`${user.pbThis()} se curó de la parálisis.`);
  }
}

class CureUserPartyStatus extends Move {
  canSnatch() { return true; }
  worksWithNoTargets() { return true; }
  pbMoveFailed(user) {
    const has = this.battle.allSameSideBattlers(user.index).some((b) => b.status !== 'NONE') ||
      this.battle.pbParty(user.index).some((p) => this.battle.able(p) && p.status);
    return has ? false : fail(this);
  }
  pbFailsAgainstTarget(user, target) { return target.status === 'NONE'; }
  aromatherapyHeal(pkmn, battler = null) {
    const old = battler ? battler.status : pkmn.status;
    const name = battler ? battler.pbThis() : this.battle.pokemonName(pkmn);
    if (battler) battler.pbCureStatus(false);
    else {
      pkmn.status = null;
      pkmn.statusCount = 0;
    }
    const msgs = { SLEEP: `${name} se despertó.`, POISON: `${name} se curó del envenenamiento.`, BURN: `La quemadura de ${name} se curó.`, PARALYSIS: `${name} se curó de la parálisis.`, FROZEN: `${name} se descongeló.`, FROSTBITE: `${name} se descongeló.` };
    if (msgs[old]) this.battle.pbDisplay(msgs[old]);
  }
  pbEffectAgainstTarget(user, target) { this.aromatherapyHeal(target.pokemon, target); }
  pbEffectGeneral(user) {
    this.battle.pbParty(user.index).forEach((p, i) => {
      if (!this.battle.able(p) || !p.status) return;
      if (this.battle.pbFindBattler(i, user.index)) return;
      this.aromatherapyHeal(p);
    });
  }
  pbShowAnimation(id, user, targets, hitNum, showAnimation) {
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
    if (this.id === 'AROMATHERAPY') this.battle.pbDisplay('¡Un balsámico aroma impregnó la zona!');
    else if (this.id === 'HEALBELL') this.battle.pbDisplay('¡Ha repicado una campana!');
  }
}

class DamageAndCureUserPartyStatus extends CureUserPartyStatus {
  pbMoveFailed() { return false; }
  pbFailsAgainstTarget() { return false; }
  pbEffectAgainstTarget() {}
  pbEffectGeneral(user) {
    this.battle.pbParty(user.index).forEach((p, i) => {
      if (!this.battle.able(p) || !p.status) return;
      this.aromatherapyHeal(p, this.battle.pbFindBattler(i, user.index));
    });
  }
}

class CureTargetBurn extends Move {
  pbAdditionalEffect(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.status !== 'BURN') return;
    target.pbCureStatus();
  }
}

class StartUserSideImmunityToInflictedStatus extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) { return user.pbOwnSide().effects.Safeguard > 0 ? fail(this) : false; }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.Safeguard = 5;
    this.battle.pbDisplay(`¡${user.pbTeam()} se protegió con Velo Sagrado!`);
  }
}

export class FlinchTarget extends Move {
  flinchingMove() { return true; }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    target.pbFlinch(user);
  }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    target.pbFlinch(user);
  }
}

class FlinchTargetFailsIfUserNotAsleep extends FlinchTarget {
  usableWhenAsleep() { return true; }
  pbMoveFailed(user) { return !user.asleep() ? fail(this) : false; }
}

class FlinchTargetFailsIfNotUserFirstTurn extends FlinchTarget {
  pbMoveFailed(user) { return user.turnCount > 1 ? fail(this) : false; }
}

class FlinchTargetDoublePowerIfTargetInSky extends FlinchTarget {
  hitsFlyingTargets() { return true; }
  pbBaseDamage(baseDmg, user, target) { return inSky(target) ? baseDmg * 2 : baseDmg; }
}

class ConfuseTargetIfTargetStatsRaisedThisTurn extends ConfuseTarget {
  pbAdditionalEffect(user, target) { if (target.statsRaisedThisRound) super.pbAdditionalEffect(user, target); }
}

class BurnTargetIfTargetStatsRaisedThisTurn extends BurnTarget {
  pbAdditionalEffect(user, target) { if (target.statsRaisedThisRound) super.pbAdditionalEffect(user, target); }
}

class CrashDamageIfFailsConfuseTarget extends ConfuseTarget {
  recoilMove() { return true; }
  pbCrashDamage(user) {
    if (!user.takesIndirectDamage()) return;
    this.battle.pbDisplay(`¡${user.pbThis()} ha fallado y se ha caído al suelo!`);
    user.pbReduceHP(Math.floor(user.totalhp / 2), false);
    user.pbItemHPHealCheck();
    if (user.isFainted()) user.pbFaint();
  }
}

class AttractTarget extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    return !target.pbCanAttract(user, show);
  }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    target.pbAttract(user);
  }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (target.pbCanAttract(user, false)) target.pbAttract(user);
  }
}

// ---- Tipos
const TERRAIN_TYPES = { Electric: 'ELECTRIC', Grassy: 'GRASS', Misty: 'FAIRY', Psychic: 'PSYCHIC' };
export const ENVIRONMENT_TYPES = {
  None: 'NORMAL', Grass: 'GRASS', TallGrass: 'GRASS', MovingWater: 'WATER', StillWater: 'WATER', Puddle: 'WATER',
  Underwater: 'WATER', Cave: 'ROCK', Rock: 'GROUND', Sand: 'GROUND', Forest: 'BUG', ForestGrass: 'BUG', Snow: 'ICE',
  Ice: 'ICE', Volcano: 'FIRE', Graveyard: 'GHOST', Sky: 'FLYING', Space: 'DRAGON', UltraSpace: 'PSYCHIC',
};

class SetUserTypesBasedOnEnvironment extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (!user.canChangeType()) return fail(this);
    this.newType = TERRAIN_TYPES[this.battle.field.terrain] || ENVIRONMENT_TYPES[this.battle.environment] || 'NORMAL';
    if (!user.pbHasOtherType(this.newType)) return fail(this);
    return false;
  }
  pbEffectGeneral(user) {
    user.pbChangeTypes(this.newType);
    this.battle.pbDisplay(`¡${user.pbThis()} ha cambiado a tipo ${this.battle.typeName(this.newType)}!`);
  }
}

class SetUserTypesToResistLastAttack extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) { return !user.canChangeType() ? fail(this) : false; }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.lastMoveUsed || !target.lastMoveUsedType) return failT(this, show);
    const types = this.battle.db.types;
    this.newTypes = Object.values(types).filter((t) => !t.pseudo && !user.pbHasType(t.id) &&
      typeMultiplier(types, target.lastMoveUsedType, t.id) < NORMAL_EFFECTIVE).map((t) => t.id);
    return this.newTypes.length === 0 ? failT(this, show) : false;
  }
  pbEffectGeneral(user) {
    if (!this.newTypes || !this.newTypes.length) return;
    const t = this.newTypes[this.battle.pbRandom(this.newTypes.length)];
    user.pbChangeTypes(t);
    this.battle.pbDisplay(`¡${user.pbThis()} ha cambiado a tipo ${this.battle.typeName(t)}!`);
  }
}

class SetUserTypesToTargetTypes extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) { return !user.canChangeType() ? fail(this) : false; }
  pbFailsAgainstTarget(user, target, show) {
    const nt = target.pbTypes(true);
    if (nt.length === 0) return failT(this, show);
    if (JSON.stringify(user.pbTypes()) === JSON.stringify(target.pbTypes()) && user.effects.ExtraType === target.effects.ExtraType) {
      return failT(this, show);
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    user.pbChangeTypes(target);
    this.battle.pbDisplay(`¡${user.pbThis()} ahora es del mismo tipo que ${target.pbThis(true)}!`);
  }
}

class SetUserTypesToUserMoveType extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (!user.canChangeType()) return fail(this);
    const userTypes = user.pbTypes(true);
    this.newTypes = [];
    const m = user.moves[0];
    if (m && !userTypes.includes(m.type)) this.newTypes.push(m.type);
    return this.newTypes.length === 0 ? fail(this) : false;
  }
  pbEffectGeneral(user) {
    const t = this.newTypes[this.battle.pbRandom(this.newTypes.length)];
    user.pbChangeTypes(t);
    this.battle.pbDisplay(`¡${user.pbThis()} ha cambiado a tipo ${this.battle.typeName(t)}!`);
  }
}

function setTargetType(type) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbFailsAgainstTarget(user, target, show) {
      if (!target.canChangeType() || !target.pbHasOtherType(type)) return failT(this, show);
      return false;
    }
    pbEffectAgainstTarget(user, target) {
      target.pbChangeTypes(type);
      this.battle.pbDisplay(`¡${target.pbThis()} ha cambiado a tipo ${this.battle.typeName(type)}!`);
    }
  };
}

function addTargetType(type) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbFailsAgainstTarget(user, target, show) {
      if (!target.canChangeType() || target.pbHasType(type)) return failT(this, show);
      return false;
    }
    pbEffectAgainstTarget(user, target) {
      target.effects.ExtraType = type;
      this.battle.pbDisplay(`¡${target.pbThis()} ahora también es de tipo ${this.battle.typeName(type)}!`);
      this.battle.queueRefresh(target);
    }
  };
}

function loseType(type, flag, msg) {
  return class extends Move {
    pbMoveFailed(user) { return !user.pbHasType(type) ? fail(this) : false; }
    pbEffectAfterAllHits(user, target) {
      if (!user.effects[flag] && !target.damageState.unaffected) {
        user.effects[flag] = true;
        this.battle.pbDisplay(msg(user));
        this.battle.queueRefresh(user);
      }
    }
  };
}

// ---- Habilidades
function setTargetAbility(abil, verb) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbFailsAgainstTarget(user, target, show) {
      if (target.unstoppableAbility() || ['TRUANT', abil].includes(target.abilityId)) return failT(this, show);
      if (target.hasActiveItem('ABILITYSHIELD')) {
        if (show) this.battle.pbDisplay(`¡La habilidad de ${target.pbThis(true)} está protegida por el Escudo Habilidad!`);
        return true;
      }
      return false;
    }
    pbEffectAgainstTarget(user, target) {
      this.battle.pbShowAbilitySplash(target, true);
      const old = target.ability;
      target.ability = abil;
      this.battle.pbReplaceAbilitySplash(target);
      this.battle.pbDisplay(verb(target));
      this.battle.pbHideAbilitySplash(target);
      target.pbOnLosingAbility(old);
      target.pbTriggerAbilityOnGainingIt();
    }
  };
}

class SetUserAbilityToTargetAbility extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (user.hasActiveItem('ABILITYSHIELD') || user.unstoppableAbility()) return fail(this);
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.ability || user.ability === target.ability) return failT(this, show);
    if (target.ungainableAbility() || ['POWEROFALCHEMY', 'RECEIVER', 'TRACE', 'WONDERGUARD'].includes(target.abilityId)) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    this.battle.pbShowAbilitySplash(user, true);
    const old = user.ability;
    user.ability = target.ability;
    this.battle.pbReplaceAbilitySplash(user);
    this.battle.pbDisplay(`¡${user.pbThis()} ha copiado la habilidad ${target.abilityName()} de ${target.pbThis(true)}!`);
    this.battle.pbHideAbilitySplash(user);
    user.pbOnLosingAbility(old);
    user.pbTriggerAbilityOnGainingIt();
  }
}

class SetTargetAbilityToUserAbility extends Move {
  canMagicCoat() { return true; }
  pbMoveFailed(user) {
    if (!user.ability || user.ungainableAbility() || ['POWEROFALCHEMY', 'RECEIVER', 'TRACE'].includes(user.abilityId)) return fail(this);
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (target.unstoppableAbility() || target.ability === 'TRUANT' || target.hasActiveItem('ABILITYSHIELD')) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    this.battle.pbShowAbilitySplash(target, true);
    const old = target.ability;
    target.ability = user.ability;
    this.battle.pbReplaceAbilitySplash(target);
    this.battle.pbDisplay(`¡La habilidad de ${target.pbThis(true)} ha cambiado a ${target.abilityName()}!`);
    this.battle.pbHideAbilitySplash(target);
    target.pbOnLosingAbility(old);
    target.pbTriggerAbilityOnGainingIt();
  }
}

class UserTargetSwapAbilities extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (user.hasActiveItem('ABILITYSHIELD') || !user.ability || user.unstoppableAbility() ||
        user.ungainableAbility() || user.ability === 'WONDERGUARD') return fail(this);
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.ability || target.unstoppableAbility() || target.ungainableAbility() || target.ability === 'WONDERGUARD' ||
        target.hasActiveItem('ABILITYSHIELD')) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (user.opposes(target)) {
      this.battle.pbShowAbilitySplash(user);
      this.battle.pbShowAbilitySplash(target, true);
    }
    const ou = user.ability;
    const ot = target.ability;
    user.ability = ot;
    target.ability = ou;
    if (user.opposes(target)) {
      this.battle.pbReplaceAbilitySplash(user);
      this.battle.pbReplaceAbilitySplash(target);
    }
    this.battle.pbDisplay(`¡${user.pbThis()} ha intercambiado su habilidad con la de su objetivo!`);
    if (user.opposes(target)) {
      this.battle.pbHideAbilitySplash(user);
      this.battle.pbHideAbilitySplash(target);
    }
    user.pbOnLosingAbility(ou);
    target.pbOnLosingAbility(ot);
    user.pbTriggerAbilityOnGainingIt();
    target.pbTriggerAbilityOnGainingIt();
  }
}

class NegateTargetAbility extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.unstoppableAbility() || target.effects.GastroAcid || target.hasActiveItem('ABILITYSHIELD')) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.GastroAcid = true;
    target.effects.Truant = false;
    this.battle.pbDisplay(`¡Se ha anulado la habilidad de ${target.pbThis(true)}!`);
    target.pbOnLosingAbility(target.ability, true);
  }
}

class NegateTargetAbilityIfTargetActed extends Move {
  pbEffectAgainstTarget(user, target) {
    if (target.hasActiveItem('ABILITYSHIELD') || target.damageState.substitute || target.effects.GastroAcid) return;
    if (target.unstoppableAbility()) return;
    const act = this.battle.choices[target.index].action;
    if (act !== 'UseItem' && !(['UseMove', 'Shift'].includes(act) && target.movedThisRound())) return;
    target.effects.GastroAcid = true;
    target.effects.Truant = false;
    this.battle.pbDisplay(`¡Se ha anulado la habilidad de ${target.pbThis(true)}!`);
    target.pbOnLosingAbility(target.ability, true);
  }
}

class IgnoreTargetAbility extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    super.pbChangeUsageCounters(user, specialUsage);
    if (!specialUsage) this.battle.moldBreaker = true;
  }
  pbOnStartUse(user, targets) {
    if (this.battle.moldBreaker && targets[0] && targets[0].hasActiveItem('ABILITYSHIELD')) this.battle.moldBreaker = false;
  }
}

// ---- En el aire / gravedad / transformación
class StartUserAirborne extends Move {
  unusableInGravity() { return true; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Ingrain || user.effects.SmackDown || user.effects.MagnetRise > 0) return fail(this);
    return false;
  }
  pbEffectGeneral(user) {
    user.effects.MagnetRise = 5;
    this.battle.pbDisplay(`¡${user.pbThis()} levita gracias al electromagnetismo!`);
  }
}

class StartTargetAirborneAndAlwaysHitByMoves extends Move {
  unusableInGravity() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Ingrain || target.effects.SmackDown || target.effects.Telekinesis > 0) return failT(this, show);
    if (['DIGLETT', 'DUGTRIO', 'SANDYGAST', 'PALOSSAND'].some((s) => target.isSpecies(s)) || (target.isSpecies('GENGAR') && target.mega())) {
      return failT(this, show);
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Telekinesis = 3;
    this.battle.pbDisplay(`¡${target.pbThis()} ha sido lanzado por los aires!`);
  }
}

class HitsTargetInSky extends Move {
  hitsFlyingTargets() { return true; }
}

class HitsTargetInSkyGroundsTarget extends Move {
  hitsFlyingTargets() { return true; }
  pbCalcTypeModSingle(moveType, defType, user, target) {
    if (moveType === 'GROUND' && defType === 'FLYING') return NORMAL_EFFECTIVE;
    return super.pbCalcTypeModSingle(moveType, defType, user, target);
  }
  pbEffectAfterAllHits(user, target) {
    if (target.isFainted() || target.damageState.unaffected || target.damageState.substitute) return;
    if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableInSkyTargetCannotAct') || target.effects.SkyDrop >= 0) return;
    const flying = target.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget');
    if (!target.airborne() && !flying) return;
    target.effects.SmackDown = true;
    if (flying) {
      target.effects.TwoTurnAttack = null;
      if (!target.movedThisRound()) this.battle.pbClearChoice(target.index);
    }
    target.effects.MagnetRise = 0;
    target.effects.Telekinesis = 0;
    this.battle.pbDisplay(`¡${target.pbThis()} ha sido derribado!`);
  }
}

class StartGravity extends Move {
  pbMoveFailed() { return this.battle.field.effects.Gravity > 0 ? fail(this) : false; }
  pbEffectGeneral() {
    this.battle.field.effects.Gravity = 5;
    this.battle.pbDisplay('¡La gravedad se ha incrementado!');
    for (const b of this.battle.allBattlers()) {
      let show = false;
      if (b.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget', 'TwoTurnAttackInvulnerableInSkyTargetCannotAct')) {
        b.effects.TwoTurnAttack = null;
        if (!b.movedThisRound()) this.battle.pbClearChoice(b.index);
        show = true;
      }
      if (b.effects.MagnetRise > 0 || b.effects.Telekinesis > 0 || b.effects.SkyDrop >= 0) {
        b.effects.MagnetRise = 0;
        b.effects.Telekinesis = 0;
        b.effects.SkyDrop = -1;
        show = true;
      }
      if (show) this.battle.pbDisplay(`¡${b.pbThis()} no ha podido mantenerse en el aire por la gravedad!`);
    }
  }
}

class TransformUserIntoTarget extends Move {
  pbMoveFailed(user) { return user.effects.Transform ? fail(this) : false; }
  pbFailsAgainstTarget(user, target, show) {
    return target.effects.Transform || target.effects.Illusion ? failT(this, show) : false;
  }
  pbEffectAgainstTarget(user, target) { user.pbTransform(target); }
}

// ---- Varios gen 8/9
class DoublePowerIfTargetPoisonedPoisonTarget extends PoisonTarget {
  pbBaseDamage(baseDmg, user, target) {
    return target.poisoned() && (target.effects.Substitute === 0 || this.ignoresSubstitute(user)) ? baseDmg * 2 : baseDmg;
  }
}
class DoublePowerIfTargetStatusProblemBurnTarget extends BurnTarget {
  pbBaseDamage(baseDmg, user, target) {
    return target.pbHasAnyStatus() && (target.effects.Substitute === 0 || this.ignoresSubstitute(user)) ? baseDmg * 2 : baseDmg;
  }
}
class DamageTargetAddSpikesToFoeSide extends Move {
  pbEffectWhenDealingDamage(user, target) {
    const s = target.pbOwnSide().effects;
    if (s.Spikes >= 3) return;
    s.Spikes += 1;
    this.battle.pbDisplay(`¡Se esparcieron púas alrededor de ${user.pbOpposingTeam(true)}!`);
  }
}
class DamageTargetAddStealthRocksToFoeSide extends Move {
  pbEffectWhenDealingDamage(user, target) {
    const s = target.pbOwnSide().effects;
    if (s.StealthRock) return;
    s.StealthRock = true;
    this.battle.pbDisplay(`¡Unas piedras puntiagudas flotan alrededor de ${user.pbOpposingTeam(true)}!`);
  }
}
class DamageTargetAddLeechSeedToFoeSide extends Move {
  pbEffectWhenDealingDamage(user, target) {
    if (target.effects.LeechSeed >= 0 || target.pbHasType('GRASS')) return;
    target.effects.LeechSeed = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} ha sido infectado!`);
  }
}
class CantSelectConsecutiveTurns extends Move {
  pbEffectWhenDealingDamage(user) { user.effects.SuccessiveMove = this.id; }
}
class PoisonTargetLowerTargetSpeed1 extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.pbCanPoison(user, false, this) && !target.pbCanLowerStatStage('SPEED', user, this)) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (target.pbCanPoison(user, false, this)) target.pbPoison(user);
    if (target.pbCanLowerStatStage('SPEED', user, this)) target.pbLowerStatStage('SPEED', 1, user);
  }
}

registerMoves({
  SleepTarget,
  SleepTargetChangeUserMeloettaForm,
  SleepTargetNextTurn,
  PoisonTarget,
  PoisonTargetLowerTargetSpeed1,
  BadPoisonTarget,
  ParalyzeTarget,
  ParalyzeTargetIfNotTypeImmune,
  ParalyzeTargetAlwaysHitsInRainHitsDecreasesInSunTargetInSky,
  ParalyzeTargetAlwaysHitsInRain: weatherAccuracy(ParalyzeTarget, { rain: 0 }),
  ParalyzeFlinchTarget: statusFlinch((t, u, m) => t.pbCanParalyze(u, false, m), (t, u) => t.pbParalyze(u)),
  BurnTarget,
  BurnTargetAlwaysHitsInRain: weatherAccuracy(BurnTarget, { rain: 0 }),
  BurnTargetIfTargetStatsRaisedThisTurn,
  BurnFlinchTarget: statusFlinch((t, u, m) => t.pbCanBurn(u, false, m), (t, u) => t.pbBurn(u)),
  FrostbiteTarget,
  FreezeTarget,
  FreezeTargetSuperEffectiveAgainstWater,
  FreezeTargetAlwaysHitsInHail,
  FreezeFlinchTarget: statusFlinch((t, u, m) => t.pbCanFreeze(u, false, m), (t, u) => t.pbFreeze(null, u)),
  SuperEffectiveAgainstBug,
  ParalyzeBurnOrFreezeTarget,
  PoisonParalyzeOrSleepTarget,
  GiveUserStatusToTarget,
  CureUserBurnPoisonParalysis,
  CureUserPartyStatus,
  DamageAndCureUserPartyStatus,
  CureTargetBurn,
  StartUserSideImmunityToInflictedStatus,
  FlinchTarget,
  FlinchTargetFailsIfUserNotAsleep,
  FlinchTargetFailsIfNotUserFirstTurn,
  FlinchTargetDoublePowerIfTargetInSky,
  ConfuseTarget,
  ConfuseTargetAlwaysHitsInRainHitsTargetInSky,
  ConfuseTargetIfTargetStatsRaisedThisTurn,
  CrashDamageIfFailsConfuseTarget,
  AttractTarget,
  SetUserTypesBasedOnEnvironment,
  SetUserTypesToResistLastAttack,
  SetUserTypesToTargetTypes,
  SetUserTypesToUserMoveType,
  SetTargetTypesToPsychic: setTargetType('PSYCHIC'),
  SetTargetTypesToWater: setTargetType('WATER'),
  AddGhostTypeToTarget: addTargetType('GHOST'),
  AddGrassTypeToTarget: addTargetType('GRASS'),
  UserLosesFireType: loseType('FIRE', 'BurnUp', (u) => `¡El fuego interior de ${u.pbThis(true)} se ha extinguido!`),
  UserLosesElectricType: loseType('ELECTRIC', 'DoubleShock', (u) => `¡${u.pbThis()} ha usado toda su electricidad!`),
  SetTargetAbilityToSimple: setTargetAbility('SIMPLE', (t) => `¡La habilidad de ${t.pbThis(true)} ha cambiado a ${t.abilityName()}!`),
  SetTargetAbilityToInsomnia: setTargetAbility('INSOMNIA', (t) => `¡${t.pbThis()} ha adquirido ${t.abilityName()}!`),
  SetUserAbilityToTargetAbility,
  SetTargetAbilityToUserAbility,
  UserTargetSwapAbilities,
  NegateTargetAbility,
  NegateTargetAbilityIfTargetActed,
  IgnoreTargetAbility,
  StartUserAirborne,
  StartTargetAirborneAndAlwaysHitByMoves,
  HitsTargetInSky,
  HitsTargetInSkyGroundsTarget,
  StartGravity,
  TransformUserIntoTarget,
  DoublePowerIfTargetPoisonedPoisonTarget,
  DoublePowerIfTargetStatusProblemBurnTarget,
  DamageTargetAddSpikesToFoeSide,
  DamageTargetAddStealthRocksToFoeSide,
  DamageTargetAddLeechSeedToFoeSide,
  CantSelectConsecutiveTurns,
  LowerTargetSpeed1AlwaysHitsInRain: weatherAccuracy(targetStatDown('SPEED', 1), { rain: 0 }),
});
