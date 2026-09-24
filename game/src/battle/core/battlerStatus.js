// Battler: problemas de estado, confusión, enamoramiento y retroceso (029_Battler/005).
import { Battler } from './battler.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';

const ALREADY = {
  SLEEP: (n) => `¡${n} ya está dormido!`,
  POISON: (n) => `¡${n} ya está envenenado!`,
  BURN: (n) => `¡${n} ya está quemado!`,
  PARALYSIS: (n) => `¡${n} ya está paralizado!`,
  FROZEN: (n) => `¡${n} ya está congelado!`,
  FROSTBITE: (n) => `¡${n} ya sufre congelación!`,
};

const IMMUNE_BY_ABILITY = {
  SLEEP: (n) => `¡${n} permanece despierto!`,
  POISON: (n) => `¡${n} no puede ser envenenado!`,
  BURN: (n) => `¡${n} no puede ser quemado!`,
  PARALYSIS: (n) => `¡${n} no puede ser paralizado!`,
  FROZEN: (n) => `¡${n} no puede ser congelado!`,
  FROSTBITE: (n) => `¡${n} no puede ser congelado!`,
};

Object.assign(Battler.prototype, {
  pbHasStatus(check) {
    if (AbilityEffects.triggerStatusCheckNonIgnorable(this.ability, this, check)) return true;
    if (this.status === check) return true;
    return check === 'FROZEN' && this.status === 'FROSTBITE' && Settings.FREEZE_EFFECTS_CAUSE_FROSTBITE;
  },

  pbHasAnyStatus() {
    if (AbilityEffects.triggerStatusCheckNonIgnorable(this.ability, this, null)) return true;
    return this.status !== 'NONE';
  },

  pbCanInflictStatus(newStatus, user, showMessages, move = null, ignoreStatus = false) {
    if (newStatus === 'FROZEN' && Settings.FREEZE_EFFECTS_CAUSE_FROSTBITE) newStatus = 'FROSTBITE';
    if (this.isFainted()) return false;
    const battle = this.battle;
    const selfInflicted = !!(user && user.index === this.index);
    if (this.status === newStatus && !ignoreStatus) {
      if (showMessages) battle.pbDisplay(ALREADY[newStatus](this.pbThis()));
      return false;
    }
    if (this.status !== 'NONE' && !ignoreStatus && !(selfInflicted && move)) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    if (this.effects.Substitute > 0 && !(move && move.ignoresSubstitute(user)) && !selfInflicted) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    if (['FROZEN', 'FROSTBITE'].includes(newStatus) && ['Sun', 'HarshSun'].includes(this.effectiveWeather())) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    if (this.affectedByTerrain()) {
      if (battle.field.terrain === 'Electric' && newStatus === 'SLEEP') {
        if (showMessages) battle.pbDisplay(`¡El campo eléctrico ha protegido a ${this.pbThis(true)}!`);
        return false;
      }
      if (battle.field.terrain === 'Misty') {
        if (showMessages) battle.pbDisplay(`¡El campo de niebla ha protegido a ${this.pbThis(true)}!`);
        return false;
      }
    }
    if (newStatus === 'SLEEP' && !(this.hasActiveAbility('SOUNDPROOF') && !battle.moldBreaker)) {
      if (battle.allBattlers().some((b) => b.effects.Uproar > 0)) {
        if (showMessages) battle.pbDisplay(`¡El alboroto mantiene a ${this.pbThis(true)} despierto!`);
        return false;
      }
    }
    let immuneType = false;
    switch (newStatus) {
      case 'POISON':
        if (!(user && user.hasActiveAbility('CORROSION') && move && !move.damagingMove())) {
          immuneType = this.pbHasType('POISON') || this.pbHasType('STEEL');
        }
        break;
      case 'BURN': immuneType = this.pbHasType('FIRE'); break;
      case 'PARALYSIS': immuneType = this.pbHasType('ELECTRIC') && Settings.MORE_TYPE_EFFECTS; break;
      case 'FROZEN':
      case 'FROSTBITE': immuneType = this.pbHasType('ICE'); break;
      default: break;
    }
    if (immuneType) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    let immuneByAbility = false;
    let immAlly = null;
    const checkStatus = newStatus === 'FROSTBITE' ? 'FROZEN' : newStatus;
    if (AbilityEffects.triggerStatusImmunityNonIgnorable(this.ability, this, checkStatus)) {
      immuneByAbility = true;
    } else if (selfInflicted || !battle.moldBreaker) {
      if (this.abilityActive() && AbilityEffects.triggerStatusImmunity(this.ability, this, checkStatus)) {
        immuneByAbility = true;
      } else {
        for (const b of this.allAllies()) {
          if (!b.abilityActive()) continue;
          if (!AbilityEffects.triggerStatusImmunityFromAlly(b.ability, this, checkStatus)) continue;
          immuneByAbility = true;
          immAlly = b;
          break;
        }
      }
    }
    if (immuneByAbility) {
      if (showMessages) {
        battle.pbShowAbilitySplash(immAlly || this);
        battle.pbDisplay(IMMUNE_BY_ABILITY[newStatus](this.pbThis()));
        battle.pbHideAbilitySplash(immAlly || this);
      }
      return false;
    }
    if (this.pbOwnSide().effects.Safeguard > 0 && !selfInflicted && move &&
        !(user && user.hasActiveAbility('INFILTRATOR'))) {
      if (showMessages) battle.pbDisplay(`¡${this.pbThis()} se ha protegido con Velo Sagrado!`);
      return false;
    }
    return true;
  },

  pbCanSynchronizeStatus(newStatus, user) {
    if (this.isFainted() || this.status !== 'NONE') return false;
    if (this.battle.field.terrain === 'Misty' && this.affectedByTerrain()) return false;
    if (newStatus === 'FROZEN' && Settings.FREEZE_EFFECTS_CAUSE_FROSTBITE) newStatus = 'FROSTBITE';
    let immuneType = false;
    switch (newStatus) {
      case 'POISON':
        if (!(user && user.hasActiveAbility('CORROSION'))) immuneType = this.pbHasType('POISON') || this.pbHasType('STEEL');
        break;
      case 'BURN': immuneType = this.pbHasType('FIRE'); break;
      case 'PARALYSIS': immuneType = this.pbHasType('ELECTRIC') && Settings.MORE_TYPE_EFFECTS; break;
      case 'FROSTBITE': immuneType = this.pbHasType('ICE'); break;
      default: break;
    }
    if (immuneType) return false;
    const checkStatus = newStatus === 'FROSTBITE' ? 'FROZEN' : newStatus;
    if (AbilityEffects.triggerStatusImmunityNonIgnorable(this.ability, this, checkStatus)) return false;
    if (this.abilityActive() && AbilityEffects.triggerStatusImmunity(this.ability, this, checkStatus)) return false;
    for (const b of this.allAllies()) {
      if (b.abilityActive() && AbilityEffects.triggerStatusImmunityFromAlly(b.ability, this, checkStatus)) return false;
    }
    if (this.pbOwnSide().effects.Safeguard > 0 && !(user && user.hasActiveAbility('INFILTRATOR'))) return false;
    return true;
  },

  pbInflictStatus(newStatus, newStatusCount = 0, msg = null, user = null) {
    if (newStatus === 'FROZEN' && Settings.FREEZE_EFFECTS_CAUSE_FROSTBITE) newStatus = 'FROSTBITE';
    this.status = newStatus;
    this.statusCount = newStatusCount;
    this.effects.Toxic = 0;
    this.battle.queueEvent('animateStatus', this.view(), newStatus === 'POISON' && newStatusCount > 0 ? 'TOXIC' : newStatus);
    if (msg) {
      this.battle.pbDisplay(msg);
    } else {
      switch (newStatus) {
        case 'SLEEP': this.battle.pbDisplay(`¡${this.pbThis()} se durmió!`); break;
        case 'POISON':
          this.battle.pbDisplay(newStatusCount > 0 ? `¡${this.pbThis()} ha sido gravemente envenenado!` : `¡${this.pbThis()} se ha envenenado!`);
          break;
        case 'BURN': this.battle.pbDisplay(`¡${this.pbThis()} se ha quemado!`); break;
        case 'PARALYSIS': this.battle.pbDisplay(`¡${this.pbThis()} sufre parálisis! ¡Quizás no se pueda mover!`); break;
        case 'FROZEN': this.battle.pbDisplay(`¡${this.pbThis()} está congelado!`); break;
        case 'FROSTBITE': this.battle.pbDisplay(`¡${this.pbThis()} sufre congelación!`); break;
        default: break;
      }
    }
    this.pbCheckFormOnStatusChange();
    if (this.abilityActive()) AbilityEffects.triggerOnStatusInflicted(this.ability, this, user, newStatus);
    this.pbItemStatusCureCheck();
    this.pbAbilityStatusCureCheck();
    if (this.status === 'SLEEP' && this.effects.Outrage > 0) {
      this.effects.Outrage = 0;
      this.currentMove = null;
    }
  },

  // ---- sueño
  asleep() { return this.pbHasStatus('SLEEP'); },
  pbCanSleep(user, showMessages, move = null, ignoreStatus = false) {
    return this.pbCanInflictStatus('SLEEP', user, showMessages, move, ignoreStatus);
  },
  pbCanSleepYawn() {
    if (this.status !== 'NONE') return false;
    if (this.affectedByTerrain() && ['Electric', 'Misty'].includes(this.battle.field.terrain)) return false;
    if (!this.hasActiveAbility('SOUNDPROOF') && this.battle.allBattlers().some((b) => b.effects.Uproar > 0)) return false;
    if (AbilityEffects.triggerStatusImmunityNonIgnorable(this.ability, this, 'SLEEP')) return false;
    if (this.abilityActive() && AbilityEffects.triggerStatusImmunity(this.ability, this, 'SLEEP')) return false;
    for (const b of this.allAllies()) {
      if (b.abilityActive() && AbilityEffects.triggerStatusImmunityFromAlly(b.ability, this, 'SLEEP')) return false;
    }
    return this.pbOwnSide().effects.Safeguard <= 0;
  },
  pbSleep(msg = null) { this.pbInflictStatus('SLEEP', this.pbSleepDuration(), msg); },
  pbSleepSelf(msg = null, duration = -1) { this.pbInflictStatus('SLEEP', this.pbSleepDuration(duration), msg); },
  pbSleepDuration(duration = -1) {
    if (duration <= 0) duration = 2 + this.battle.pbRandom(3);
    if (this.hasActiveAbility('EARLYBIRD')) duration = Math.floor(duration / 2);
    return duration;
  },

  // ---- veneno
  poisoned() { return this.pbHasStatus('POISON'); },
  pbCanPoison(user, showMessages, move = null) { return this.pbCanInflictStatus('POISON', user, showMessages, move); },
  pbCanPoisonSynchronize(target) { return this.pbCanSynchronizeStatus('POISON', target); },
  pbPoison(user = null, msg = null, toxic = false) { this.pbInflictStatus('POISON', toxic ? 1 : 0, msg, user); },

  // ---- quemadura
  burned() { return this.pbHasStatus('BURN'); },
  pbCanBurn(user, showMessages, move = null) { return this.pbCanInflictStatus('BURN', user, showMessages, move); },
  pbCanBurnSynchronize(target) { return this.pbCanSynchronizeStatus('BURN', target); },
  pbBurn(user = null, msg = null) { this.pbInflictStatus('BURN', 0, msg, user); },

  // ---- congelación (Hisui)
  frostbite() { return this.pbHasStatus('FROSTBITE'); },
  pbCanFrostbite(user, showMessages, move = null) { return this.pbCanInflictStatus('FROSTBITE', user, showMessages, move); },
  pbFrostbite(user = null, msg = null) { this.pbInflictStatus('FROSTBITE', 0, msg, user); },

  // ---- parálisis
  paralyzed() { return this.pbHasStatus('PARALYSIS'); },
  pbCanParalyze(user, showMessages, move = null) { return this.pbCanInflictStatus('PARALYSIS', user, showMessages, move); },
  pbCanParalyzeSynchronize(target) { return this.pbCanSynchronizeStatus('PARALYSIS', target); },
  pbParalyze(user = null, msg = null) { this.pbInflictStatus('PARALYSIS', 0, msg, user); },

  // ---- congelado
  frozen() { return this.pbHasStatus('FROZEN'); },
  pbCanFreeze(user, showMessages, move = null) { return this.pbCanInflictStatus('FROZEN', user, showMessages, move); },
  pbFreeze(msg = null, user = null) { this.pbInflictStatus('FROZEN', 0, msg, user); },

  /** Mensaje/animación de estado persistente (el bloque opcional se ejecuta antes del mensaje). */
  pbContinueStatus(beforeMessage = null) {
    this.battle.queueEvent('animateStatus', this.view(), this.status === 'POISON' && this.statusCount > 0 ? 'TOXIC' : this.status);
    if (beforeMessage) beforeMessage();
    const n = this.pbThis();
    switch (this.status) {
      case 'SLEEP': this.battle.pbDisplay(`${n} está dormido como un tronco.`); break;
      case 'POISON': this.battle.pbDisplay(`¡El veneno resta PS a ${this.pbThis(true)}!`); break;
      case 'BURN': this.battle.pbDisplay(`¡${n} se resiente de la quemadura!`); break;
      case 'PARALYSIS': this.battle.pbDisplay(`¡${n} está paralizado! ¡No se puede mover!`); break;
      case 'FROZEN': this.battle.pbDisplay(`¡${n} está congelado!`); break;
      case 'FROSTBITE': this.battle.pbDisplay(`¡${n} se resiente de la congelación!`); break;
      default: break;
    }
  },

  pbCureStatus(showMessages = true) {
    const oldStatus = this.status;
    this.status = 'NONE';
    this.battle.queueRefresh(this);
    if (!showMessages) return;
    const n = this.pbThis();
    switch (oldStatus) {
      case 'SLEEP': this.battle.pbDisplay(`¡${n} se ha despertado!`); break;
      case 'POISON': this.battle.pbDisplay(`¡${n} se ha curado del envenenamiento!`); break;
      case 'BURN': this.battle.pbDisplay(`¡La quemadura de ${this.pbThis(true)} se ha curado!`); break;
      case 'PARALYSIS': this.battle.pbDisplay(`¡${n} se ha curado de la parálisis!`); break;
      case 'FROZEN':
      case 'FROSTBITE': this.battle.pbDisplay(`¡${n} se ha descongelado!`); break;
      default: break;
    }
  },

  // ---- confusión
  pbCanConfuse(user = null, showMessages = true, move = null, selfInflicted = false) {
    if (this.isFainted()) return false;
    const battle = this.battle;
    if (this.effects.Confusion > 0) {
      if (showMessages) battle.pbDisplay(`${this.pbThis()} ya está confuso.`);
      return false;
    }
    if (this.effects.Substitute > 0 && !(move && move.ignoresSubstitute(user)) && !selfInflicted) {
      if (showMessages) battle.pbDisplay('¡Pero ha fallado!');
      return false;
    }
    if (this.affectedByTerrain() && battle.field.terrain === 'Misty') {
      if (showMessages) battle.pbDisplay(`¡El campo de niebla ha protegido a ${this.pbThis(true)}!`);
      return false;
    }
    if ((selfInflicted || !battle.moldBreaker) && this.hasActiveAbility('OWNTEMPO')) {
      if (showMessages) {
        battle.pbShowAbilitySplash(this);
        battle.pbDisplay(`¡${this.pbThis()} no se ha confundido!`);
        battle.pbHideAbilitySplash(this);
      }
      return false;
    }
    if (this.pbOwnSide().effects.Safeguard > 0 && !selfInflicted && !(user && user.hasActiveAbility('INFILTRATOR'))) {
      if (showMessages) battle.pbDisplay(`¡${this.pbThis()} se ha protegido con Velo Sagrado!`);
      return false;
    }
    return true;
  },
  pbCanConfuseSelf(showMessages) { return this.pbCanConfuse(null, showMessages, null, true); },
  pbConfuse(msg = null) {
    this.effects.Confusion = this.pbConfusionDuration();
    this.battle.pbCommonAnimation('Confusion', this);
    this.battle.pbDisplay(msg || `¡${this.pbThis()} se ha confundido!`);
    this.pbItemStatusCureCheck();
    this.pbAbilityStatusCureCheck();
  },
  pbConfusionDuration(duration = -1) {
    return duration <= 0 ? 2 + this.battle.pbRandom(4) : duration;
  },
  pbCureConfusion() { this.effects.Confusion = 0; },

  // ---- enamoramiento
  pbCanAttract(user, showMessages = true) {
    if (this.isFainted() || !user || user.isFainted()) return false;
    const battle = this.battle;
    if (this.effects.Attract >= 0) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    const ag = user.gender;
    const og = this.gender;
    if (ag === 2 || og === 2 || ag === og) {
      if (showMessages) battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      return false;
    }
    if (!battle.moldBreaker) {
      if (this.hasActiveAbility(['AROMAVEIL', 'OBLIVIOUS'])) {
        if (showMessages) {
          battle.pbShowAbilitySplash(this);
          battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
          battle.pbHideAbilitySplash(this);
        }
        return false;
      }
      for (const b of this.allAllies()) {
        if (!b.hasActiveAbility('AROMAVEIL')) continue;
        if (showMessages) {
          battle.pbShowAbilitySplash(b);
          battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
          battle.pbHideAbilitySplash(b);
        }
        return false;
      }
    }
    return true;
  },
  pbAttract(user, msg = null) {
    this.effects.Attract = user.index;
    this.battle.pbCommonAnimation('Attract', this);
    this.battle.pbDisplay(msg || `¡${this.pbThis()} se ha enamorado!`);
    if (this.hasActiveItem('DESTINYKNOT') && user.pbCanAttract(this, false)) {
      user.pbAttract(this, `¡${user.pbThis()} se ha enamorado por el ${this.itemName()}!`);
    }
    this.pbItemStatusCureCheck();
    this.pbAbilityStatusCureCheck();
  },
  pbCureAttract() { this.effects.Attract = -1; },

  // ---- retroceso
  pbFlinch() {
    if (this.hasActiveAbility('INNERFOCUS') && !this.battle.moldBreaker) return;
    this.effects.Flinch = true;
  },
});
