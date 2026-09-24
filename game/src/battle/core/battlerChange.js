// Battler: cambios de PS, debilitamiento, PP, tipos, formas y Transformación (029_Battler/004).
import { Battler } from './battler.js';
import { BATTLE_STATS } from './constants.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { createMove } from './moves/registry.js';
import { makeUnmega } from './pokemonUtil.js';

Object.assign(Battler.prototype, {
  pbReduceHP(amt, anim = true, registerDamage = true, anyAnim = true) {
    amt = Math.round(amt);
    if (amt > this.hp) amt = this.hp;
    if (amt < 1 && !this.isFainted()) amt = 1;
    const oldHP = this.hp;
    this.hp = this.hp - amt;
    if (this.hp < 0) throw new Error('PS menores que 0');
    if (anyAnim && amt > 0) this.battle.queueEvent('animateHP', this.view(), oldHP, this.hp, anim);
    if (amt > 0 && registerDamage) {
      if (this.hp < Math.floor(this.totalhp / 2) && this.hp + amt >= Math.floor(this.totalhp / 2)) this.droppedBelowHalfHP = true;
      if (this.hp < Math.floor(this.totalhp / 3) && this.hp + amt >= Math.floor(this.totalhp / 3)) this.droppedBelowThirdHP = true;
      this.tookDamageThisRound = true;
      this.tookMoveDamageThisRound = true;
    }
    return amt;
  },

  pbRecoverHP(amt, anim = true, anyAnim = true) {
    amt = Math.round(amt);
    if (amt > this.totalhp - this.hp) amt = this.totalhp - this.hp;
    if (amt < 1 && this.hp < this.totalhp) amt = 1;
    const oldHP = this.hp;
    this.hp = this.hp + amt;
    if (anyAnim && amt > 0) this.battle.queueEvent('animateHP', this.view(), oldHP, this.hp, anim);
    if (this.hp >= Math.floor(this.totalhp / 2)) this.droppedBelowHalfHP = false;
    if (this.hp >= Math.floor(this.totalhp / 3)) this.droppedBelowThirdHP = false;
    return amt;
  },

  pbRecoverHPFromDrain(amt, target, msg = null) {
    if (target.hasActiveAbility('LIQUIDOOZE', true)) {
      this.battle.pbShowAbilitySplash(target);
      this.pbReduceHP(amt);
      this.battle.pbDisplay(`¡${this.pbThis()} ha absorbido el lodo líquido!`);
      this.battle.pbHideAbilitySplash(target);
      this.pbItemHPHealCheck();
      return;
    }
    this.battle.pbDisplay(msg || `¡${target.pbThis()} ha perdido energía!`);
    if (this.canHeal()) {
      if (this.hasActiveItem('BIGROOT')) amt = Math.floor(amt * 1.3);
      if (this.hasActiveAbility('STURDYROOT')) amt = Math.floor(amt * 1.3);
      this.pbRecoverHP(amt);
    }
  },

  /** Daño indirecto (veneno, drenadoras…); `showMessage` se llama tras restar PS. */
  pbTakeEffectDamage(amt, showAnim = true, showMessage = null) {
    this.droppedBelowHalfHP = false;
    this.droppedBelowThirdHP = false;
    const hpLost = this.pbReduceHP(amt, showAnim);
    if (showMessage) showMessage(hpLost);
    this.pbItemHPHealCheck();
    this.pbAbilitiesOnDamageTaken();
    if (this.isFainted()) this.pbFaint();
    this.droppedBelowHalfHP = false;
    this.droppedBelowThirdHP = false;
  },

  pbFaint(showMessage = true) {
    if (!this.isFainted()) return;
    if (this.fainted) return; // ya se debilitó correctamente
    // Fases de jefe: en lugar de debilitarse, pasa a la siguiente fase.
    if (this.battle.pbBossPhaseTransition(this)) return;
    if (showMessage) this.battle.pbDisplayBrief(`¡${this.pbThis()} se debilitó!`);
    this.battle.queueEvent('faint', this.view());
    if (this.opposes()) this.battle.pbSetDefeated(this);
    this.pbInitEffects(false);
    this.status = 'NONE';
    this.statusCount = 0;
    if (this.pokemon && this.battle.internalBattle) {
      const badLoss = this.battle.allOtherSideBattlers(this.index).some((b) => b.level >= this.level + 30);
      this.battle.changeHappiness(this.pokemon, badLoss ? 'faintbad' : 'faint');
    }
    if (this.pokemon && makeUnmega(this.db, this.pokemon)) this.pbUpdate(true);
    this.battle.pbClearChoice(this.index);
    this.pbOwnSide().effects.LastRoundFainted = this.battle.turnCount;
    this.fainted = true;
    this.pbAbilitiesOnFainting();
    this.battle.pbEndPrimordialWeather();
    this.battle.pbAddFaintedAlly(this.index);
  },

  // ---------------------------------------------------------------- PP
  pbSetPP(move, pp) {
    move.pp = pp;
  },

  pbReducePP(move) {
    if (this.usingMultiTurnAttack()) return true;
    if (move.pp < 0) return true; // usos especiales
    if (move.totalPP <= 0) return true;
    if (move.pp === 0) return false;
    this.pbSetPP(move, move.pp - 1);
    return true;
  },

  pbReducePPOther(move) {
    if (move.pp > 0) this.pbSetPP(move, move.pp - 1);
  },

  // ---------------------------------------------------------------- tipos
  pbChangeTypes(newType) {
    if (newType instanceof Battler) {
      const newTypes = newType.pbTypes();
      if (newTypes.length === 0) newTypes.push('NORMAL');
      let extra = newType.effects.ExtraType;
      if (newTypes.includes(extra)) extra = null;
      this.types = [...newTypes];
      this.effects.ExtraType = extra;
    } else {
      this.types = Array.isArray(newType) ? [...newType] : [newType];
      this.effects.ExtraType = null;
    }
    this.effects.BurnUp = false;
    this.effects.Roost = false;
    this.effects.DoubleShock = false;
    if (this.abilityActive() && this.proteanTrigger) {
      AbilityEffects.triggerOnTypeChange(this.ability, this, Array.isArray(newType) ? newType[0] : newType);
    }
    this.battle.queueRefresh(this);
  },

  pbResetTypes() {
    this.types = [...this.speciesData.types];
    this.effects.ExtraType = null;
    this.effects.BurnUp = false;
    this.effects.Roost = false;
    this.effects.DoubleShock = false;
    this.battle.queueRefresh(this);
  },

  // ---------------------------------------------------------------- formas
  pbChangeForm(newForm, msg) {
    if (this.isFainted() || this.effects.Transform || this.form === newForm) return;
    const oldDmg = this.totalhp - this.hp;
    this.form = newForm;
    this.pbUpdate(true);
    this.hp = Math.max(1, this.totalhp - oldDmg);
    if (Settings.MECHANICS_GENERATION >= 6) this.effects.WeightChange = 0;
    this.battle.queueEvent('changeForm', this.view());
    if (msg) this.battle.pbDisplay(msg);
    this.battle.pbSetSeen(this);
  },

  pbCheckFormOnStatusChange() {
    if (this.isFainted() || this.effects.Transform) return;
    if (this.isSpecies('SHAYMIN') && ['FROZEN', 'FROSTBITE'].includes(this.status)) {
      this.pbChangeForm(0, `¡${this.pbThis()} ha cambiado de forma!`);
    }
  },

  pbCheckFormOnMovesetChange() {
    if (this.isFainted() || this.effects.Transform) return;
    if (this.isSpecies('KELDEO')) this.pbChangeForm(this.pbHasMove('SECRETSWORD') ? 1 : 0, `¡${this.pbThis()} ha cambiado de forma!`);
  },

  pbCheckFormOnWeatherChange(abilityChanged = false) {
    if (this.hasActiveAbility('PROTOSYNTHESIS')) AbilityEffects.triggerOnSwitchIn(this.ability, this, this.battle, false);
    if (this.isFainted() || this.effects.Transform) return;
    if (this.isSpecies('CASTFORM')) {
      if (this.hasActiveAbility('FORECAST')) {
        let newForm = 0;
        const w = this.effectiveWeather();
        if (w === 'Sun' || w === 'HarshSun') newForm = 1;
        else if (w === 'Rain' || w === 'HeavyRain') newForm = 2;
        else if (w === 'Hail') newForm = 3;
        if (this.form !== newForm) {
          this.battle.pbShowAbilitySplash(this, true);
          this.battle.pbHideAbilitySplash(this);
          this.pbChangeForm(newForm, `¡${this.pbThis()} se ha transformado!`);
        }
      } else {
        this.pbChangeForm(0, `¡${this.pbThis()} se ha transformado!`);
      }
    }
    if (this.isSpecies('CHERRIM')) {
      if (this.hasActiveAbility('FLOWERGIFT')) {
        const newForm = ['Sun', 'HarshSun'].includes(this.effectiveWeather()) ? 1 : 0;
        if (this.form !== newForm) {
          this.battle.pbShowAbilitySplash(this, true);
          this.battle.pbHideAbilitySplash(this);
          this.pbChangeForm(newForm, `¡${this.pbThis()} se ha transformado!`);
        }
      } else {
        this.pbChangeForm(0, `¡${this.pbThis()} se ha transformado!`);
      }
    }
    if (!abilityChanged && this.isSpecies('EISCUE') && this.ability === 'ICEFACE' && this.form === 1 &&
        this.effectiveWeather() === 'Hail') {
      this.canRestoreIceFace = true;
    }
  },

  /** Comprueba formas al entrar (endOfRound=false) y al final de cada ronda. */
  pbCheckForm(endOfRound = false) {
    if (this.isFainted() || this.effects.Transform) return;
    if (!endOfRound) this.pbCheckFormOnWeatherChange();
    if (this.isSpecies('DARMANITAN') && this.ability === 'ZENMODE') {
      if (this.hp <= Math.floor(this.totalhp / 2)) {
        if (this.form % 2 === 0) {
          this.battle.pbShowAbilitySplash(this, true);
          this.battle.pbHideAbilitySplash(this);
          this.pbChangeForm(this.form + 1, `¡${this.abilityName()} activado!`);
        }
      } else if (this.form % 2 === 1) {
        this.battle.pbShowAbilitySplash(this, true);
        this.battle.pbHideAbilitySplash(this);
        this.pbChangeForm(this.form - 1, `¡${this.abilityName()} activado!`);
      }
    }
    if (this.isSpecies('MINIOR') && this.ability === 'SHIELDSDOWN') {
      if (this.hp > Math.floor(this.totalhp / 2)) {
        const newForm = this.form >= 7 ? this.form - 7 : this.form;
        if (this.form !== newForm) {
          this.battle.pbShowAbilitySplash(this, true);
          this.battle.pbHideAbilitySplash(this);
          this.pbChangeForm(newForm, `¡${this.abilityName()} desactivado!`);
        }
      } else if (this.form < 7) {
        this.battle.pbShowAbilitySplash(this, true);
        this.battle.pbHideAbilitySplash(this);
        this.pbChangeForm(this.form + 7, `¡${this.abilityName()} activado!`);
      }
    }
    if (this.isSpecies('WISHIWASHI') && this.ability === 'SCHOOLING') {
      if (this.level >= 20 && this.hp > Math.floor(this.totalhp / 4)) {
        if (this.form !== 1) {
          this.battle.pbShowAbilitySplash(this, true);
          this.battle.pbHideAbilitySplash(this);
          this.pbChangeForm(1, `¡${this.pbThis()} ha formado un banco!`);
        }
      } else if (this.form !== 0) {
        this.battle.pbShowAbilitySplash(this, true);
        this.battle.pbHideAbilitySplash(this);
        this.pbChangeForm(0, `¡El banco de ${this.pbThis(true)} se ha dispersado!`);
      }
    }
    if (this.isSpecies('ZYGARDE') && this.ability === 'POWERCONSTRUCT' && endOfRound &&
        this.hp <= Math.floor(this.totalhp / 2) && this.form < 2) {
      this.battle.pbDisplay('¡Sientes la presencia de muchos!');
      this.battle.pbShowAbilitySplash(this, true);
      this.battle.pbHideAbilitySplash(this);
      this.pbChangeForm(this.form + 2, `¡${this.pbThis()} se ha transformado en su Forma Completa!`);
    }
  },

  pbTransform(target) {
    const oldAbil = this.abilityId;
    this.effects.Transform = true;
    this.effects.TransformSpecies = target.species;
    this.pbChangeTypes(target);
    this.ability = target.ability;
    this.attack = target.attack;
    this.defense = target._defense;
    this.spatk = target.spatk;
    this.spdef = target._spdef;
    this.speed = target.speed;
    for (const s of BATTLE_STATS) this.stages[s] = target.stages[s];
    if (Settings.NEW_CRITICAL_HIT_RATE_MECHANICS) {
      this.effects.FocusEnergy = target.effects.FocusEnergy;
      this.effects.LaserFocus = target.effects.LaserFocus;
    }
    this.moves = target.moves.map((m) => {
      const mv = createMove(this.battle, { id: m.id, pp: 5, ppUps: 0 }, { detached: true });
      mv.pp = 5;
      mv.totalPPOverride = 5;
      return mv;
    });
    this.effects.Disable = 0;
    this.effects.DisableMove = null;
    this.effects.WeightChange = target.effects.WeightChange;
    this.battle.queueEvent('changeForm', { ...this.view(), transformInto: target.view() });
    this.battle.pbDisplay(`¡${this.pbThis()} se ha transformado en ${target.pbThis(true)}!`);
    this.pbOnLosingAbility(oldAbil);
  },
});
