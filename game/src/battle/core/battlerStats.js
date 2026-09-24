// Battler: etapas de estadísticas (029_Battler/006).
import { Battler } from './battler.js';
import { BATTLE_STATS, STAT_NAMES, STAT_STAGE_MAXIMUM } from './constants.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';

const UP_TEXT = ['ha aumentado', 'ha aumentado mucho', 'ha aumentado muchísimo'];
const DOWN_TEXT = ['ha disminuido', 'ha disminuido mucho', 'ha disminuido muchísimo'];
const statName = (s) => STAT_NAMES[s] || s;
const FEMININE = new Set(['DEFENSE', 'SPECIAL_DEFENSE', 'SPEED', 'ACCURACY', 'EVASION']);
/** "El Ataque", "La Defensa"… para empezar una frase. */
const theStat = (s) => `${FEMININE.has(s) ? 'La' : 'El'} ${statName(s)}`;
const theStatLower = (s) => `${FEMININE.has(s) ? 'la' : 'el'} ${statName(s)}`;

Object.assign(Battler.prototype, {
  statStageAtMax(stat) { return this.stages[stat] >= STAT_STAGE_MAXIMUM; },
  statStageAtMin(stat) { return this.stages[stat] <= -STAT_STAGE_MAXIMUM; },

  pbCanRaiseStatStage(stat, user = null, move = null, showFailMsg = false, ignoreContrary = false) {
    if (this.isFainted()) return false;
    if (this.hasActiveAbility('CONTRARY') && !ignoreContrary && !this.battle.moldBreaker) {
      return this.pbCanLowerStatStage(stat, user, move, showFailMsg, true);
    }
    if (this.statStageAtMax(stat)) {
      if (showFailMsg) this.battle.pbDisplay(`¡${theStat(stat)} de ${this.pbThis(true)} no puede subir más!`);
      return false;
    }
    return true;
  },

  pbRaiseStatStageBasic(stat, increment, ignoreContrary = false) {
    if (!this.battle.moldBreaker) {
      if (this.hasActiveAbility('CONTRARY') && !ignoreContrary) return this.pbLowerStatStageBasic(stat, increment, true);
      if (this.hasActiveAbility('SIMPLE')) increment *= 2;
    }
    increment = Math.min(increment, STAT_STAGE_MAXIMUM - this.stages[stat]);
    if (increment > 0) {
      this.stages[stat] += increment;
      this.statsRaisedThisRound = true;
    }
    return increment;
  },

  pbRaiseStatStage(stat, increment, user, showAnim = true, ignoreContrary = false) {
    if (this.hasActiveAbility('CONTRARY') && !ignoreContrary && !this.battle.moldBreaker) {
      return this.pbLowerStatStage(stat, increment, user, showAnim, true);
    }
    increment = this.pbRaiseStatStageBasic(stat, increment, ignoreContrary);
    if (increment <= 0) return false;
    this.battle.queueEvent('animateStat', this.view(), stat, increment, showAnim);
    this.battle.pbDisplay(`¡${theStat(stat)} de ${this.pbThis(true)} ${UP_TEXT[Math.min(increment - 1, 2)]}!`);
    if (this.abilityActive()) AbilityEffects.triggerOnStatGain(this.ability, this, stat, user);
    if (!this.mirrorHerbUsed) this.addSideStatUps(stat, increment);
    return true;
  },

  pbRaiseStatStageByCause(stat, increment, user, cause, showAnim = true, ignoreContrary = false) {
    if (this.hasActiveAbility('CONTRARY') && !ignoreContrary && !this.battle.moldBreaker) {
      return this.pbLowerStatStageByCause(stat, increment, user, cause, showAnim, true);
    }
    increment = this.pbRaiseStatStageBasic(stat, increment, ignoreContrary);
    if (increment <= 0) return false;
    this.battle.queueEvent('animateStat', this.view(), stat, increment, showAnim);
    const t = UP_TEXT[Math.min(increment - 1, 2)];
    if (user.index === this.index) {
      this.battle.pbDisplay(`¡${cause} de ${this.pbThis(true)} ${t} su ${statName(stat)}!`);
    } else {
      this.battle.pbDisplay(`¡${cause} de ${user.pbThis(true)} ${t} ${theStatLower(stat)} de ${this.pbThis(true)}!`);
    }
    if (this.abilityActive()) AbilityEffects.triggerOnStatGain(this.ability, this, stat, user);
    if (!this.mirrorHerbUsed) this.addSideStatUps(stat, increment);
    return true;
  },

  pbRaiseStatStageByAbility(stat, increment, user, splashAnim = true) {
    if (this.isFainted()) return false;
    let ret = false;
    if (splashAnim) this.battle.pbShowAbilitySplash(user);
    if (this.pbCanRaiseStatStage(stat, user, null, true)) ret = this.pbRaiseStatStage(stat, increment, user);
    if (splashAnim) this.battle.pbHideAbilitySplash(user);
    this.pbMirrorStatUpsOpposing();
    return ret;
  },

  pbCanLowerStatStage(stat, user = null, move = null, showFailMsg = false, ignoreContrary = false, ignoreMirrorArmor = false) {
    if (this.isFainted()) return false;
    const battle = this.battle;
    const selfInflicted = !!(user && user.index === this.index);
    if (!selfInflicted && this.itemActive() &&
        ItemEffects.triggerStatLossImmunity(this.item, this, stat, battle, showFailMsg)) return false;
    if (!battle.moldBreaker) {
      if (this.hasActiveAbility('CONTRARY') && !ignoreContrary) {
        return this.pbCanRaiseStatStage(stat, user, move, showFailMsg, true);
      }
      if (this.hasActiveAbility('MIRRORARMOR') && !ignoreMirrorArmor && user && !selfInflicted && !this.statStageAtMin(stat)) {
        return true;
      }
    }
    if (!selfInflicted) {
      if (this.effects.Substitute > 0 && (ignoreMirrorArmor || !(move && move.ignoresSubstitute(user)))) {
        if (showFailMsg) battle.pbDisplay(`¡El sustituto recibe el daño en lugar de ${this.pbThis(true)}!`);
        return false;
      }
      if (this.pbOwnSide().effects.Mist > 0 && !(user && user.hasActiveAbility('INFILTRATOR'))) {
        if (showFailMsg) battle.pbDisplay(`¡Los efectos de la Neblina han protegido a ${this.pbThis(true)}!`);
        return false;
      }
      if (this.abilityActive()) {
        if (!battle.moldBreaker && AbilityEffects.triggerStatLossImmunity(this.ability, this, stat, battle, showFailMsg)) return false;
        if (AbilityEffects.triggerStatLossImmunityNonIgnorable(this.ability, this, stat, battle, showFailMsg)) return false;
      }
      if (!battle.moldBreaker) {
        for (const b of this.allAllies()) {
          if (!b.abilityActive()) continue;
          if (AbilityEffects.triggerStatLossImmunityFromAlly(b.ability, b, this, stat, battle, showFailMsg)) return false;
        }
      }
    }
    if (this.statStageAtMin(stat)) {
      if (showFailMsg) battle.pbDisplay(`¡${theStat(stat)} de ${this.pbThis(true)} no puede bajar más!`);
      return false;
    }
    return true;
  },

  pbLowerStatStageBasic(stat, increment, ignoreContrary = false) {
    if (!this.battle.moldBreaker) {
      if (this.hasActiveAbility('CONTRARY') && !ignoreContrary) return this.pbRaiseStatStageBasic(stat, increment, true);
      if (this.hasActiveAbility('SIMPLE')) increment *= 2;
    }
    increment = Math.min(increment, STAT_STAGE_MAXIMUM + this.stages[stat]);
    if (increment > 0) {
      this.stages[stat] -= increment;
      this.statsLoweredThisRound = true;
      this.statsDropped = true;
    }
    return increment;
  },

  pbLowerStatStage(stat, increment, user, showAnim = true, ignoreContrary = false, mirrorArmorSplash = 0, ignoreMirrorArmor = false) {
    const battle = this.battle;
    if (!battle.moldBreaker) {
      if (this.hasActiveAbility('CONTRARY') && !ignoreContrary) return this.pbRaiseStatStage(stat, increment, user, showAnim, true);
      if (this.hasActiveAbility('MIRRORARMOR') && !ignoreMirrorArmor && user && user.index !== this.index && !this.statStageAtMin(stat)) {
        if (mirrorArmorSplash < 2) battle.pbShowAbilitySplash(this);
        let ret = false;
        if (user.pbCanLowerStatStage(stat, this, null, true, ignoreContrary, true)) {
          ret = user.pbLowerStatStage(stat, increment, this, showAnim, ignoreContrary, mirrorArmorSplash, true);
        }
        if (mirrorArmorSplash % 2 === 0) battle.pbHideAbilitySplash(this);
        return ret;
      }
    }
    increment = this.pbLowerStatStageBasic(stat, increment, ignoreContrary);
    if (increment <= 0) return false;
    battle.queueEvent('animateStat', this.view(), stat, -increment, showAnim);
    battle.pbDisplay(`¡${theStat(stat)} de ${this.pbThis(true)} ${DOWN_TEXT[Math.min(increment - 1, 2)]}!`);
    if (this.abilityActive()) AbilityEffects.triggerOnStatLoss(this.ability, this, stat, user);
    return true;
  },

  pbLowerStatStageByCause(stat, increment, user, cause, showAnim = true, ignoreContrary = false, ignoreMirrorArmor = false) {
    const battle = this.battle;
    if (!battle.moldBreaker) {
      if (this.hasActiveAbility('CONTRARY') && !ignoreContrary) return this.pbRaiseStatStageByCause(stat, increment, user, cause, showAnim, true);
      if (this.hasActiveAbility('MIRRORARMOR') && !ignoreMirrorArmor && user && user.index !== this.index && !this.statStageAtMin(stat)) {
        battle.pbShowAbilitySplash(this);
        let ret = false;
        if (user.pbCanLowerStatStage(stat, this, null, true, ignoreContrary, true)) {
          ret = user.pbLowerStatStageByCause(stat, increment, this, this.abilityName(), showAnim, ignoreContrary, true);
        }
        battle.pbHideAbilitySplash(this);
        return ret;
      }
    }
    increment = this.pbLowerStatStageBasic(stat, increment, ignoreContrary);
    if (increment <= 0) return false;
    battle.queueEvent('animateStat', this.view(), stat, -increment, showAnim);
    const t = DOWN_TEXT[Math.min(increment - 1, 2)];
    if (user.index === this.index) {
      battle.pbDisplay(`¡${cause} de ${this.pbThis(true)} ${t} su ${statName(stat)}!`);
    } else {
      battle.pbDisplay(`¡${cause} de ${user.pbThis(true)} ${t} ${theStatLower(stat)} de ${this.pbThis(true)}!`);
    }
    if (this.abilityActive()) AbilityEffects.triggerOnStatLoss(this.ability, this, stat, user);
    return true;
  },

  pbLowerStatStageByAbility(stat, increment, user, splashAnim = true, checkContact = false) {
    if (this.hasActiveAbility('GUARDDOG') && user.ability === 'INTIMIDATE') {
      return this.pbRaiseStatStageByAbility(stat, increment, this, true);
    }
    let ret = false;
    if (splashAnim) this.battle.pbShowAbilitySplash(user);
    if (this.pbCanLowerStatStage(stat, user, null, true) && (!checkContact || this.affectedByContactEffect(true))) {
      ret = this.pbLowerStatStage(stat, increment, user);
    }
    if (splashAnim) this.battle.pbHideAbilitySplash(user);
    return ret;
  },

  /** Intimidación (y su gemela especial Espanto de Añil). */
  pbLowerStatStageIntimidate(user, stat = 'ATTACK') {
    if (this.isFainted()) return false;
    const battle = this.battle;
    if (!this.hasActiveAbility('CONTRARY') && this.effects.Substitute === 0 && this.itemActive() &&
        ItemEffects.triggerStatLossImmunity(this.item, this, stat, battle, true)) return false;
    if (this.effects.Substitute > 0) {
      battle.pbDisplay(`¡El sustituto recibe el efecto en lugar de ${this.pbThis(true)}!`);
      return false;
    }
    if (this.hasActiveAbility(['OBLIVIOUS', 'OWNTEMPO', 'INNERFOCUS', 'SCRAPPY'])) {
      battle.pbShowAbilitySplash(this);
      battle.pbDisplay(`¡${theStat(stat)} de ${this.pbThis(true)} no puede bajar!`);
      battle.pbHideAbilitySplash(this);
      return false;
    }
    return this.pbLowerStatStageByAbility(stat, 1, user, false);
  },

  pbLowerAttackStatStageIntimidate(user) { return this.pbLowerStatStageIntimidate(user, 'ATTACK'); },

  hasAlteredStatStages() { return BATTLE_STATS.some((s) => this.stages[s] !== 0); },
  hasRaisedStatStages() { return BATTLE_STATS.some((s) => this.stages[s] > 0); },
  hasLoweredStatStages() { return BATTLE_STATS.some((s) => this.stages[s] < 0); },

  pbResetStatStages() {
    for (const s of BATTLE_STATS) {
      if (this.stages[s] > 0) {
        this.statsLoweredThisRound = true;
        this.statsDropped = true;
      } else if (this.stages[s] < 0) {
        this.statsRaisedThisRound = true;
      }
      this.stages[s] = 0;
    }
  },

  // ---- Oportunista / Hierba Copia (gen 9)
  addSideStatUps(stat, increment) {
    const ups = this.battle.sideStatUps[this.idxOwnSide()];
    ups[stat] = (ups[stat] || 0) + increment;
  },

  pbItemOpposingStatGainCheck(statUps, itemToUse = null) {
    if (this.isFainted()) return;
    if (!itemToUse && !this.itemActive()) return;
    const itm = itemToUse || this.item;
    if (ItemEffects.triggerOnOpposingStatGain(itm, this, this.battle, statUps, !itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, false);
    }
  },

  pbMirrorStatUpsOpposing() {
    const statUps = this.battle.sideStatUps[this.idxOwnSide()];
    if (this.isFainted() || Object.keys(statUps).length === 0) return;
    for (const b of this.battle.allOtherSideBattlers(this.index)) {
      if (b.abilityActive()) AbilityEffects.triggerOnOpposingStatGain(b.ability, b, this.battle, statUps);
      if (b.itemActive()) b.pbItemOpposingStatGainCheck(statUps);
    }
    for (const k of Object.keys(statUps)) delete statUps[k];
  },
});
