// Battle::Move: cálculo de tipo, precisión, críticos y daño (030_Move/004).
import { Move, CRITICAL_HIT_RATIOS } from './move.js';
import { Settings } from '../settings.js';
import {
  STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS, ACC_EVA_STAGE_MULTIPLIERS, ACC_EVA_STAGE_DIVISORS,
} from '../constants.js';
import { typeMultiplier, NORMAL_EFFECTIVE, Effectiveness } from '../typeChart.js';
import { AbilityEffects } from '../abilities/registry.js';
import { ItemEffects } from '../items/registry.js';

const RUIN_ABILITIES = ['TABLETSOFRUIN', 'SWORDOFRUIN', 'VESSELOFRUIN', 'BEADSOFRUIN'];

Object.assign(Move.prototype, {
  // ---------------------------------------------------------------- tipo
  pbBaseType(user) {
    let ret = this.type;
    if (ret && user.abilityActive()) ret = AbilityEffects.triggerModifyMoveBaseType(user.ability, user, this, ret);
    return ret;
  },

  pbCalcType(user) {
    this.powerBoost = false;
    let ret = this.pbBaseType(user);
    if (ret) {
      if (this.battle.field.effects.IonDeluge && ret === 'NORMAL') ret = 'ELECTRIC';
      if (user.effects.Electrify) ret = 'ELECTRIC';
    }
    return ret;
  },

  pbCalcTypeModSingle(moveType, defType, user, target) {
    const types = this.battle.db.types;
    let ret = typeMultiplier(types, moveType, defType);
    if (Effectiveness.ineffectiveType(types, moveType, defType)) {
      if (target.hasActiveItem('RINGTARGET')) ret = NORMAL_EFFECTIVE;
      if ((user.hasActiveAbility(['SCRAPPY', 'MINDSEYE']) || target.effects.Foresight) && defType === 'GHOST') ret = NORMAL_EFFECTIVE;
      if (target.effects.MiracleEye && defType === 'DARK') ret = NORMAL_EFFECTIVE;
    } else if (Effectiveness.superEffectiveType(types, moveType, defType)) {
      if (target.effectiveWeather() === 'StrongWinds' && defType === 'FLYING') ret = NORMAL_EFFECTIVE;
    }
    if (!target.airborne() && defType === 'FLYING' && moveType === 'GROUND') ret = NORMAL_EFFECTIVE;
    return ret;
  },

  pbCalcTypeMod(moveType, user, target) {
    let ret = NORMAL_EFFECTIVE;
    if (!moveType) return ret;
    if (moveType === 'GROUND' && target.pbHasType('FLYING') && target.hasActiveItem('IRONBALL')) return ret;
    for (const t of target.pbTypes(true)) ret *= this.pbCalcTypeModSingle(moveType, t, user, target);
    if (target.effects.TarShot && moveType === 'FIRE') ret *= 2;
    if (target.abilityActive()) {
      ret = AbilityEffects.triggerModifyTypeEffectiveness(target.ability, user, target, this, this.battle, ret);
    }
    return ret;
  },

  // ---------------------------------------------------------------- precisión
  pbBaseAccuracy() { return this.accuracy; },

  pbAccuracyCheck(user, target) {
    if (target.isCommander()) return false;
    if (target.effects.GlaiveRush > 0) return true;
    if (target.effects.Telekinesis > 0) return true;
    if (target.effects.Minimize && this.tramplesMinimize()) return true;
    const baseAcc = this.pbBaseAccuracy(user, target);
    if (baseAcc === 0) return true;
    const mods = {
      base_accuracy: baseAcc,
      accuracy_stage: user.stages.ACCURACY,
      evasion_stage: target.stages.EVASION,
      accuracy_multiplier: 1.0,
      evasion_multiplier: 1.0,
    };
    this.pbCalcAccuracyModifiers(user, target, mods);
    if (mods.base_accuracy === 0) return true;
    const max = STAT_STAGE_MAXIMUM;
    const accStage = Math.min(Math.max(mods.accuracy_stage, -max), max) + max;
    const evaStage = Math.min(Math.max(mods.evasion_stage, -max), max) + max;
    let accuracy = (100.0 * ACC_EVA_STAGE_MULTIPLIERS[accStage]) / ACC_EVA_STAGE_DIVISORS[accStage];
    let evasion = (100.0 * ACC_EVA_STAGE_MULTIPLIERS[evaStage]) / ACC_EVA_STAGE_DIVISORS[evaStage];
    accuracy = Math.round(accuracy * mods.accuracy_multiplier);
    evasion = Math.round(evasion * mods.evasion_multiplier);
    if (evasion < 1) evasion = 1;
    const threshold = Math.floor((mods.base_accuracy * accuracy) / evasion); // división entera como en Ruby
    return this.battle.pbRandom(100) < threshold;
  },

  pbCalcAccuracyModifiers(user, target, mods) {
    const battle = this.battle;
    if (user.abilityActive()) AbilityEffects.triggerAccuracyCalcFromUser(user.ability, mods, user, target, this, this.calcType);
    for (const b of user.allAllies()) {
      if (b.abilityActive()) AbilityEffects.triggerAccuracyCalcFromAlly(b.ability, mods, user, target, this, this.calcType);
    }
    if (target.abilityActive() && !battle.moldBreaker) {
      AbilityEffects.triggerAccuracyCalcFromTarget(target.ability, mods, user, target, this, this.calcType);
    }
    if (user.itemActive()) ItemEffects.triggerAccuracyCalcFromUser(user.item, mods, user, target, this, this.calcType);
    if (target.itemActive()) ItemEffects.triggerAccuracyCalcFromTarget(target.item, mods, user, target, this, this.calcType);
    if (battle.field.effects.Gravity > 0) mods.accuracy_multiplier *= 5 / 3.0;
    if (user.effects.MicleBerry) {
      user.effects.MicleBerry = false;
      mods.accuracy_multiplier *= 1.2;
    }
    if (target.effects.Foresight && mods.evasion_stage > 0) mods.evasion_stage = 0;
    if (target.effects.MiracleEye && mods.evasion_stage > 0) mods.evasion_stage = 0;
  },

  // ---------------------------------------------------------------- críticos
  /** -1 nunca crítico, 0 normal, 1 siempre crítico. */
  pbCritialOverride() { return 0; },

  pbIsCritical(user, target) {
    const battle = this.battle;
    if (target.pbOwnSide().effects.LuckyChant > 0) return false;
    let c = 0;
    if (c >= 0 && user.abilityActive()) c = AbilityEffects.triggerCriticalCalcFromUser(user.ability, user, target, c);
    if (c >= 0 && target.abilityActive() && !battle.moldBreaker) c = AbilityEffects.triggerCriticalCalcFromTarget(target.ability, user, target, c);
    if (c >= 0 && user.itemActive()) c = ItemEffects.triggerCriticalCalcFromUser(user.item, user, target, c);
    if (c >= 0 && target.itemActive()) c = ItemEffects.triggerCriticalCalcFromTarget(target.item, user, target, c);
    if (c < 0) return false;
    const override = this.pbCritialOverride(user, target);
    if (override === 1) return true;
    if (override === -1) return false;
    if (c > 50) return true;
    if (user.effects.LaserFocus > 0) return true;
    if (this.highCriticalRate()) c += 1;
    c += user.effects.FocusEnergy;
    const ratios = CRITICAL_HIT_RATIOS;
    if (c >= ratios.length) c = ratios.length - 1;
    if (ratios[c] === 1) return true;
    return battle.pbRandom(ratios[c]) === 0;
  },

  // ---------------------------------------------------------------- daño
  pbBaseDamage(baseDmg) { return baseDmg; },
  pbBaseDamageMultiplier(mult) { return mult; },
  pbModifyDamage(mult) { return mult; },

  pbGetAttackStats(user) {
    if (this.specialMove()) return [user.spatk, user.stages.SPECIAL_ATTACK + STAT_STAGE_MAXIMUM];
    return [user.attack, user.stages.ATTACK + STAT_STAGE_MAXIMUM];
  },

  pbGetDefenseStats(user, target) {
    if (this.specialMove()) return [target.spdef, target.stages.SPECIAL_DEFENSE + STAT_STAGE_MAXIMUM];
    return [target.defense, target.stages.DEFENSE + STAT_STAGE_MAXIMUM];
  },

  pbCalcDamage(user, target, numTargets = 1) {
    if (this.statusMove()) return;
    const ds = target.damageState;
    if (ds.disguise || ds.iceFace) {
      ds.calcDamage = 1;
      return;
    }
    const max = STAT_STAGE_MAXIMUM;
    const type = this.calcType;
    ds.critical = this.pbIsCritical(user, target);
    let baseDmg = this.pbBaseDamage(this.power, user, target);
    let [atk, atkStage] = this.pbGetAttackStats(user, target);
    if (!target.hasActiveAbility('UNAWARE') || this.battle.moldBreaker) {
      if (ds.critical && atkStage < max) atkStage = max;
      atk = Math.floor((atk * STAT_STAGE_MULTIPLIERS[atkStage]) / STAT_STAGE_DIVISORS[atkStage]);
    }
    let [defense, defStage] = this.pbGetDefenseStats(user, target);
    if (!user.hasActiveAbility('UNAWARE')) {
      if (ds.critical && defStage > max) defStage = max;
      defense = Math.floor((defense * STAT_STAGE_MULTIPLIERS[defStage]) / STAT_STAGE_DIVISORS[defStage]);
    }
    const mults = { power_multiplier: 1.0, attack_multiplier: 1.0, defense_multiplier: 1.0, final_damage_multiplier: 1.0 };
    this.pbCalcDamageMultipliers(user, target, numTargets, type, baseDmg, mults);
    baseDmg = Math.max(Math.round(baseDmg * mults.power_multiplier), 1);
    atk = Math.max(Math.round(atk * mults.attack_multiplier), 1);
    defense = Math.max(Math.round(defense * mults.defense_multiplier), 1);
    let damage = Math.floor(Math.floor((Math.floor((2.0 * user.level) / 5 + 2) * baseDmg * atk) / defense) / 50) + 2;
    damage = Math.max(Math.round(damage * mults.final_damage_multiplier), 1);
    ds.calcDamage = damage;
  },

  pbCalcDamageMultipliers(user, target, numTargets, type, baseDmg, mults) {
    const battle = this.battle;
    // "de la Ruina" (gen 9)
    RUIN_ABILITIES.forEach((abil, i) => {
      let category = i < 2 ? this.physicalMove() : this.specialMove();
      if (i % 2 === 1 && battle.field.effects.WonderRoom > 0) category = !category;
      if (!category || !battle.pbCheckGlobalAbility(abil) || user.hasActiveAbility(abil)) return;
      if (i % 2 === 0) mults.attack_multiplier *= 0.75;
      else mults.defense_multiplier *= 0.75;
    });
    // Añil compara con "IncreasePowerWhileElectricTerrain", que no existe en sus datos (errata corregida).
    if (battle.field.terrain === 'Electric' && user.affectedByTerrain() && this.functionCode === 'IncreasePowerInElectricTerrain') {
      if (type !== 'ELECTRIC') mults.power_multiplier *= 1.5;
    }
    const uw = user.effectiveWeather();
    if ((uw === 'Sun' || uw === 'HarshSun') && this.functionCode === 'IncreasePowerInSunWeather') {
      mults.final_damage_multiplier *= type === 'FIRE' ? 1 : type === 'WATER' ? 3 : 1.5;
    }
    if (uw === 'Hail' && Settings.HAIL_WEATHER_TYPE > 0 && target.pbHasType('ICE') &&
        (this.physicalMove() || this.functionCode === 'UseTargetDefenseInsteadOfTargetSpDef')) {
      mults.defense_multiplier *= 1.5;
    }
    if (user.status === 'FROSTBITE' && this.specialMove()) mults.final_damage_multiplier /= 2;
    if (target.effects.GlaiveRush > 0) mults.final_damage_multiplier *= 2;
    // Auras
    if ((battle.pbCheckGlobalAbility('DARKAURA') && type === 'DARK') || (battle.pbCheckGlobalAbility('FAIRYAURA') && type === 'FAIRY')) {
      mults.power_multiplier *= battle.pbCheckGlobalAbility('AURABREAK') ? 3 / 4.0 : 4 / 3.0;
    }
    // Habilidades
    if (user.abilityActive()) AbilityEffects.triggerDamageCalcFromUser(user.ability, user, target, this, mults, baseDmg, type);
    if (!battle.moldBreaker) {
      for (const b of user.allAllies()) {
        if (b.abilityActive()) AbilityEffects.triggerDamageCalcFromAlly(b.ability, user, target, this, mults, baseDmg, type);
      }
      if (target.abilityActive()) AbilityEffects.triggerDamageCalcFromTarget(target.ability, user, target, this, mults, baseDmg, type);
    }
    if (target.abilityActive()) AbilityEffects.triggerDamageCalcFromTargetNonIgnorable(target.ability, user, target, this, mults, baseDmg, type);
    if (!battle.moldBreaker) {
      for (const b of target.allAllies()) {
        if (b.abilityActive()) AbilityEffects.triggerDamageCalcFromTargetAlly(b.ability, user, target, this, mults, baseDmg, type);
      }
    }
    // Objetos
    if (user.itemActive()) ItemEffects.triggerDamageCalcFromUser(user.item, user, target, this, mults, baseDmg, type);
    if (target.itemActive()) ItemEffects.triggerDamageCalcFromTarget(target.item, user, target, this, mults, baseDmg, type);
    // Amor Filial: segundo golpe
    if (user.effects.ParentalBond === 1) mults.power_multiplier /= 4;
    // Otros
    if (user.effects.MeFirst) mults.power_multiplier *= 1.5;
    if (user.effects.HelpingHand && !this.isConfusion) mults.power_multiplier *= 1.5;
    if (user.effects.Charge > 0 && type === 'ELECTRIC') mults.power_multiplier *= 2;
    if (type === 'ELECTRIC') {
      if (battle.allBattlers().some((b) => b.effects.MudSport)) mults.power_multiplier /= 3;
      if (battle.field.effects.MudSportField > 0) mults.power_multiplier /= 3;
    }
    if (type === 'FIRE') {
      if (battle.allBattlers().some((b) => b.effects.WaterSport)) mults.power_multiplier /= 3;
      if (battle.field.effects.WaterSportField > 0) mults.power_multiplier /= 3;
    }
    // Campos
    const terrainMult = 1.3;
    switch (battle.field.terrain) {
      case 'Electric': if (type === 'ELECTRIC' && user.affectedByTerrain()) mults.power_multiplier *= terrainMult; break;
      case 'Grassy': if (type === 'GRASS' && user.affectedByTerrain()) mults.power_multiplier *= terrainMult; break;
      case 'Psychic': if (type === 'PSYCHIC' && user.affectedByTerrain()) mults.power_multiplier *= terrainMult; break;
      case 'Misty': if (type === 'DRAGON' && target.affectedByTerrain()) mults.power_multiplier /= 2; break;
      default: break;
    }
    // Varios objetivos
    if (numTargets > 1) mults.final_damage_multiplier *= 0.75;
    // Clima
    switch (uw) {
      case 'Sun':
      case 'HarshSun':
        if (type === 'FIRE') mults.final_damage_multiplier *= 1.5;
        else if (type === 'WATER') mults.final_damage_multiplier /= 2;
        break;
      case 'Rain':
      case 'HeavyRain':
        if (type === 'FIRE') mults.final_damage_multiplier /= 2;
        else if (type === 'WATER') mults.final_damage_multiplier *= 1.5;
        break;
      case 'Sandstorm':
        if (target.pbHasType('ROCK') && this.specialMove() && this.functionCode !== 'UseTargetDefenseInsteadOfTargetSpDef') {
          mults.defense_multiplier *= 1.5;
        }
        break;
      default: break;
    }
    // Crítico
    if (target.damageState.critical) mults.final_damage_multiplier *= Settings.NEW_CRITICAL_HIT_RATE_MECHANICS ? 1.5 : 2;
    // Variación aleatoria 85–100 %
    if (!this.isConfusion) {
      const random = 85 + battle.pbRandom(16);
      mults.final_damage_multiplier *= random / 100.0;
    }
    // STAB
    if (type && user.pbHasType(type)) mults.final_damage_multiplier *= user.hasActiveAbility('ADAPTABILITY') ? 2 : 1.5;
    // Efectividad
    mults.final_damage_multiplier *= target.damageState.typeMod;
    // Quemadura
    if (user.status === 'BURN' && this.physicalMove() && this.damageReducedByBurn() && !user.hasActiveAbility('GUTS')) {
      mults.final_damage_multiplier /= 2;
    }
    // Velo Aurora, Reflejo, Pantalla de Luz
    if (!this.ignoresReflect() && !target.damageState.critical && !user.hasActiveAbility('INFILTRATOR')) {
      const side = target.pbOwnSide().effects;
      const screenMult = battle.pbSideBattlerCount(target.index) > 1 ? 2 / 3.0 : 0.5;
      if (side.AuroraVeil > 0) mults.final_damage_multiplier *= screenMult;
      else if (side.Reflect > 0 && this.physicalMove()) mults.final_damage_multiplier *= screenMult;
      else if (side.LightScreen > 0 && this.specialMove()) mults.final_damage_multiplier *= screenMult;
    }
    // Reducción
    if (target.effects.Minimize && this.tramplesMinimize()) mults.final_damage_multiplier *= 2;
    mults.power_multiplier = this.pbBaseDamageMultiplier(mults.power_multiplier, user, target);
    mults.final_damage_multiplier = this.pbModifyDamage(mults.final_damage_multiplier, user, target);
  },

  // ---------------------------------------------------------------- efectos secundarios
  pbAdditionalEffectChance(user, target, effectChance = 0) {
    const battle = this.battle;
    if (target.hasActiveItem('COVERTCLOAK')) return 0;
    if (target.hasActiveAbility('SHIELDDUST') && !battle.moldBreaker) return 0;
    let ret = effectChance > 0 ? effectChance : this.addlEffect;
    if (ret > 100) return ret;
    if (user.hasActiveAbility('SERENEGRACE') || user.pbOwnSide().effects.Rainbow > 0) ret *= 2;
    if (ret === 0 || ret === 100) return ret;
    if (battle.pbWeather() === 'Hail' && (this.functionCode.includes('FrostbiteTarget') ||
        (Settings.FREEZE_EFFECTS_CAUSE_FROSTBITE && this.functionCode.includes('FreezeTarget')))) {
      ret *= 2;
    }
    return Math.min(ret, 100);
  },

  pbFlinchChance(user, target) {
    if (target.hasActiveItem('COVERTCLOAK')) return 0;
    if (this.flinchingMove()) return 0;
    if (target.hasActiveAbility('SHIELDDUST') && !this.battle.moldBreaker) return 0;
    let ret = 0;
    if (user.hasActiveAbility('STENCH', true) || user.hasActiveItem(['KINGSROCK', 'RAZORFANG'], true)) ret = 10;
    if (user.hasActiveAbility('SERENEGRACE') || user.pbOwnSide().effects.Rainbow > 0) ret *= 2;
    return ret;
  },
});
