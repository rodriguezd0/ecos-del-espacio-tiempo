// Battler: disparadores de habilidades y objetos equipados (029_Battler/007).
import { Battler } from './battler.js';
import { Settings } from './settings.js';
import { STAT_NAMES } from './constants.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { Effectiveness } from './typeChart.js';

const UNNERVE = ['UNNERVE', 'ASONECHILLINGNEIGH', 'ASONEGRIMNEIGH'];

Object.assign(Battler.prototype, {
  // ---------------------------------------------------------------- habilidades
  pbAbilitiesOnSwitchOut() {
    if (this.abilityActive()) AbilityEffects.triggerOnSwitchOut(this.ability, this, false);
    // Se trata como debilitado mientras está fuera; el Pokémon conserva sus PS (como `@hp = 0` en Ruby).
    this._hp = 0;
    this.fainted = true;
    if (this.hasActiveAbility('NEUTRALIZINGGAS', true)) this.pbAbilitiesOnNeutralizingGasEnding();
    if (this.hasActiveAbility(UNNERVE, true)) this.pbItemsOnUnnerveEnding();
    this.battle.pbEndPrimordialWeather();
  },

  pbAbilitiesOnFainting() {
    for (const b of this.battle.pbPriority(true)) {
      if (!b || !b.abilityActive()) continue;
      AbilityEffects.triggerChangeOnBattlerFainting(b.ability, b, this, this.battle);
    }
    for (const b of this.battle.pbPriority(true)) {
      if (!b || !b.abilityActive()) continue;
      AbilityEffects.triggerOnBattlerFainting(b.ability, b, this, this.battle);
    }
    if (this.hasActiveAbility('NEUTRALIZINGGAS', true)) this.pbAbilitiesOnNeutralizingGasEnding();
    if (this.hasActiveAbility(UNNERVE, true)) this.pbItemsOnUnnerveEnding();
  },

  /** Retirada/Huida (Emergency Exit/Wimp Out). Devuelve si el combatiente se ha ido. */
  pbAbilitiesOnDamageTaken(moveUser = null) {
    if (!this.droppedBelowHalfHP || !this.abilityActive()) return false;
    return !!AbilityEffects.triggerOnHPDroppedBelowHalf(this.ability, this, moveUser, this.battle);
  },

  pbAbilityOnTerrainChange(abilityChanged = false) {
    if (!this.abilityActive()) return;
    AbilityEffects.triggerOnTerrainChange(this.ability, this, this.battle, abilityChanged);
  },

  pbAbilitiesOnIntimidated() {
    if (!this.abilityActive()) return;
    AbilityEffects.triggerOnIntimidated(this.ability, this, this.battle);
  },

  pbAbilitiesOnNeutralizingGasEnding() {
    const battle = this.battle;
    if (battle.pbCheckGlobalAbility('NEUTRALIZINGGAS')) return;
    battle.pbDisplay('El gas reactivo se ha disipado.');
    battle.pbEndPrimordialWeather();
    for (const b of battle.pbPriority(true)) {
      if (b.isFainted()) continue;
      if (!b.unstoppableAbility() && !b.abilityActive()) continue;
      AbilityEffects.triggerOnSwitchIn(b.ability, b, battle);
    }
  },

  /** Al entrar, al final de cada movimiento y de cada ronda (Rastro, climas primigenios…). */
  pbContinualAbilityChecks(onSwitchIn = false) {
    const battle = this.battle;
    battle.pbEndPrimordialWeather();
    this.proteanTrigger = false;
    if (this.hasActiveAbility('TRACE')) {
      const choices = battle.allOtherSideBattlers(this.index).filter((b) =>
        !b.ungainableAbility() && !['POWEROFALCHEMY', 'RECEIVER', 'TRACE'].includes(b.abilityId));
      if (choices.length > 0) {
        const choice = choices[battle.pbRandom(choices.length)];
        battle.pbShowAbilitySplash(this);
        this.ability = choice.ability;
        battle.pbDisplay(`¡${this.pbThis()} ha copiado la habilidad ${choice.abilityName()} de ${choice.pbThis(true)}!`);
        battle.pbHideAbilitySplash(this);
        if (!onSwitchIn && (this.unstoppableAbility() || this.abilityActive())) {
          AbilityEffects.triggerOnSwitchIn(this.ability, this, battle);
        }
      }
    }
    this.pbMirrorStatUpsOpposing();
  },

  pbAbilityStatusCureCheck() {
    if (this.abilityActive()) AbilityEffects.triggerStatusCure(this.ability, this);
  },

  /** Habilidades que absorben un tipo y suben una estadística (Pararrayos, Electromotor…). */
  pbMoveImmunityStatRaisingAbility(user, move, moveType, immuneType, stat, increment, showMessage) {
    if (user.index === this.index || moveType !== immuneType) return false;
    if (showMessage) {
      this.battle.pbShowAbilitySplash(this);
      if (this.pbCanRaiseStatStage(stat, this)) {
        this.pbRaiseStatStage(stat, increment, this);
      } else {
        this.battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      }
      this.battle.pbHideAbilitySplash(this);
    }
    return true;
  },

  /** Habilidades que absorben un tipo y curan 1/4 (Absorbe Agua, Absorbe Elec…). */
  pbMoveImmunityHealingAbility(user, move, moveType, immuneType, showMessage) {
    if (user.index === this.index || moveType !== immuneType) return false;
    if (showMessage) {
      this.battle.pbShowAbilitySplash(this);
      if (this.canHeal() && this.pbRecoverHP(Math.floor(this.totalhp / 4)) > 0) {
        this.battle.pbDisplay(`Los PS de ${this.pbThis(true)} han sido restaurados.`);
      } else {
        this.battle.pbDisplay(`No afecta a ${this.pbThis(true)}...`);
      }
      this.battle.pbHideAbilitySplash(this);
    }
    return true;
  },

  pbOnLosingAbility(oldAbil, suppressed = false) {
    if (oldAbil === 'NEUTRALIZINGGAS' && (suppressed || !this.effects.GastroAcid)) {
      this.pbAbilitiesOnNeutralizingGasEnding();
    } else if (UNNERVE.includes(oldAbil) && (suppressed || !this.effects.GastroAcid)) {
      this.pbItemsOnUnnerveEnding();
    } else if (oldAbil === 'ILLUSION' && this.effects.Illusion) {
      this.effects.Illusion = null;
      if (!this.effects.Transform) {
        this.battle.queueEvent('changeForm', this.view());
        this.battle.pbDisplay(`¡La ilusión de ${this.pbThis(true)} se ha desvanecido!`);
        this.battle.pbSetSeen(this);
      }
    }
    if (this.unstoppableAbility()) this.effects.GastroAcid = false;
    if (this.ability !== 'SLOWSTART') this.effects.SlowStart = 0;
    if (this.ability !== 'TRUANT') this.effects.Truant = false;
    this.battle.pbEndPrimordialWeather();
    this.pbCheckFormOnWeatherChange(true);
    this.pbAbilityOnTerrainChange(true);
  },

  pbTriggerAbilityOnGainingIt() {
    this.pbContinualAbilityChecks(true);
    if ((!this.isFainted() && this.unstoppableAbility()) || this.abilityActive()) {
      AbilityEffects.triggerOnSwitchIn(this.ability, this, this.battle);
    }
    this.pbAbilityStatusCureCheck();
    this.battle.pbEndPrimordialWeather();
  },

  // ---------------------------------------------------------------- objetos
  canConsumeBerry() {
    return !this.battle.pbCheckOpposingAbility(UNNERVE, this.index);
  },

  canConsumePinchBerry(checkGluttony = true) {
    if (!this.canConsumeBerry()) return false;
    if (this.hp <= Math.floor(this.totalhp / 4)) return true;
    return this.hp <= Math.floor(this.totalhp / 2) && (!checkGluttony || this.hasActiveAbility('GLUTTONY'));
  },

  /** `permanent`: se pierde también tras el combate (falso para Desarme). */
  pbRemoveItem(permanent = true) {
    if (!this.hasActiveAbility(['GORILLATACTICS', 'PODERSABIO'])) this.effects.ChoiceBand = null;
    if (this.item && this.hasActiveAbility('UNBURDEN')) this.effects.Unburden = true;
    if (permanent && this.item === this.initialItem) this.setInitialItem(null);
    this.item = null;
  },

  pbConsumeItem(recoverable = true, symbiosis = true, belch = true) {
    if (recoverable) {
      this.setRecycleItem(this.itemId);
      this.effects.PickupItem = this.itemId;
      this.effects.PickupUse = this.battle.nextPickupUse();
    }
    if (belch && this.battle.isBerry(this.itemId)) this.setBelched();
    this.pbRemoveItem();
    if (symbiosis) this.pbSymbiosis();
  },

  pbSymbiosis() {
    if (this.isFainted() || this.item) return;
    for (const b of this.battle.pbPriority(true)) {
      if (b.opposes(this) || !b.hasActiveAbility('SYMBIOSIS')) continue;
      if (!b.item || b.unlosableItem(b.item) || this.unlosableItem(b.item)) continue;
      this.battle.pbShowAbilitySplash(b);
      this.battle.pbDisplay(`¡${b.pbThis()} le ha dado ${b.itemName()} a ${this.pbThis(true)}!`);
      this.item = b.item;
      b.item = null;
      if (b.hasActiveAbility('UNBURDEN')) b.effects.Unburden = true;
      this.battle.pbHideAbilitySplash(b);
      this.pbHeldItemTriggerCheck();
      break;
    }
  },

  /** Consumo tras activarse un objeto (con Carrillo). `ownItem` = lo llevaba él mismo. */
  pbHeldItemTriggered(itemToUse, ownItem = true, fling = false) {
    if (this.hasActiveAbility('CHEEKPOUCH') && this.battle.isBerry(itemToUse) && this.canHeal()) {
      this.battle.pbShowAbilitySplash(this);
      this.pbRecoverHP(Math.floor(this.totalhp / 3));
      this.battle.pbDisplay(`Los PS de ${this.pbThis(true)} han sido restaurados.`);
      this.battle.pbHideAbilitySplash(this);
    }
    if (ownItem) this.pbConsumeItem();
    if (!ownItem && !fling) this.pbSymbiosis();
  },

  pbHeldItemTriggerCheck(itemToUse = null, fling = false) {
    if (this.isFainted()) return;
    if (!itemToUse && !this.itemActive()) return;
    this.pbItemHPHealCheck(itemToUse, fling);
    this.pbItemStatusCureCheck(itemToUse, fling);
    this.pbItemEndOfMoveCheck(itemToUse, fling);
    if (itemToUse && ItemEffects.triggerOnBeingHitPositiveBerry(itemToUse, this, this.battle, true)) {
      this.pbHeldItemTriggered(itemToUse, false, fling);
    }
  },

  pbItemHPHealCheck(itemToUse = null, fling = false) {
    if (!itemToUse && !this.itemActive()) return;
    const itm = itemToUse || this.item;
    if (ItemEffects.triggerHPHeal(itm, this, this.battle, !!itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, fling);
    } else if (!itemToUse) {
      this.pbItemTerrainStatBoostCheck();
    }
  },

  pbItemStatusCureCheck(itemToUse = null, fling = false) {
    if (this.isFainted()) return;
    if (!itemToUse && !this.itemActive()) return;
    const itm = itemToUse || this.item;
    if (ItemEffects.triggerStatusCure(itm, this, this.battle, !!itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, fling);
    }
  },

  pbItemEndOfMoveCheck(itemToUse = null, fling = false) {
    if (this.isFainted()) return;
    if (!itemToUse && !this.itemActive()) return;
    const itm = itemToUse || this.item;
    if (ItemEffects.triggerOnEndOfUsingMove(itm, this, this.battle, !!itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, fling);
    } else if (ItemEffects.triggerOnEndOfUsingMoveStatRestore(itm, this, this.battle, !!itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, fling);
    }
  },

  pbItemStatRestoreCheck(itemToUse = null, fling = false) {
    if (this.isFainted()) return;
    if (!itemToUse && !this.itemActive()) return;
    const itm = itemToUse || this.item;
    if (ItemEffects.triggerOnEndOfUsingMoveStatRestore(itm, this, this.battle, !!itemToUse)) {
      this.pbHeldItemTriggered(itm, !itemToUse, fling);
    }
  },

  pbItemTerrainStatBoostCheck() {
    if (!this.itemActive()) return;
    if (ItemEffects.triggerTerrainStatBoost(this.item, this, this.battle)) this.pbHeldItemTriggered(this.item);
  },

  pbItemOnIntimidatedCheck() {
    if (!this.itemActive()) return;
    if (ItemEffects.triggerOnIntimidated(this.item, this, this.battle)) this.pbHeldItemTriggered(this.item);
  },

  /** Mochila Escape. Devuelve si el combatiente se ha ido. */
  pbItemOnStatDropped(moveUser = null) {
    if (!this.statsDropped || !this.itemActive()) return false;
    return !!ItemEffects.triggerOnStatLoss(this.item, this, moveUser, this.battle);
  },

  pbItemsOnUnnerveEnding() {
    for (const b of this.battle.pbPriority(true)) {
      if (this.battle.isBerry(b.item)) b.pbHeldItemTriggerCheck();
    }
  },

  // ---------------------------------------------------------------- efectos de objetos
  pbConfusionBerry(itemToUse, forced, confuseStat, confuseMsg) {
    if (!forced && !this.canHeal()) return false;
    if (!forced && !this.canConsumePinchBerry(Settings.MECHANICS_GENERATION >= 7)) return false;
    const usedName = this.battle.itemName(itemToUse);
    let amt = Math.floor(this.totalhp / 3);
    let ripening = false;
    if (this.hasActiveAbility('RIPEN')) {
      this.battle.pbShowAbilitySplash(this, forced);
      amt *= 2;
      ripening = true;
    }
    if (!forced) this.battle.pbCommonAnimation('EatBerry', this);
    if (ripening) this.battle.pbHideAbilitySplash(this);
    amt = this.pbRecoverHP(amt);
    if (amt > 0) {
      this.battle.pbDisplay(forced ? `¡${this.pbThis()} ha recuperado PS!` : `¡${this.pbThis()} ha recobrado la salud gracias a la ${usedName}!`);
    }
    const nat = this.nature;
    const map = { ATTACK: 'atk', DEFENSE: 'def', SPECIAL_ATTACK: 'spa', SPECIAL_DEFENSE: 'spd', SPEED: 'spe' };
    if (nat && nat.down === map[confuseStat]) {
      this.battle.pbDisplay(confuseMsg);
      if (this.pbCanConfuseSelf(false)) this.pbConfuse();
    }
    return true;
  },

  pbStatIncreasingBerry(itemToUse, forced, stat, increment = 1) {
    if (!forced && !this.canConsumePinchBerry()) return false;
    if (!this.pbCanRaiseStatStage(stat, this)) return false;
    const usedName = this.battle.itemName(itemToUse);
    let ripening = false;
    if (this.hasActiveAbility('RIPEN')) {
      this.battle.pbShowAbilitySplash(this, forced);
      increment *= 2;
      ripening = true;
    }
    if (!forced) this.battle.pbCommonAnimation('EatBerry', this);
    if (ripening) this.battle.pbHideAbilitySplash(this);
    if (!forced) return this.pbRaiseStatStageByCause(stat, increment, this, usedName);
    return this.pbRaiseStatStage(stat, increment, this);
  },

  /** Bayas que reducen el daño supereficaz de un tipo. */
  pbMoveTypeWeakeningBerry(berryType, moveType, mults) {
    if (moveType !== berryType) return;
    if (!Effectiveness.superEffective(this.damageState.typeMod) && moveType !== 'NORMAL') return;
    mults.final_damage_multiplier /= 2;
    this.damageState.berryWeakened = true;
    let ripening = false;
    if (this.hasActiveAbility('RIPEN')) {
      this.battle.pbShowAbilitySplash(this);
      mults.final_damage_multiplier /= 2;
      ripening = true;
    }
    this.battle.pbCommonAnimation('EatBerry', this);
    if (ripening) this.battle.pbHideAbilitySplash(this);
  },

  /** Gemas: potencian ×1.3 el primer movimiento de su tipo. */
  pbMoveTypePoweringUpGem(gemType, move, moveType, mults) {
    if (move.isPledgeMove) return;
    if (moveType !== gemType) return;
    this.effects.GemConsumed = this.itemId;
    mults.power_multiplier *= Settings.MECHANICS_GENERATION >= 6 ? 1.3 : 1.5;
  },

  statName(stat) { return STAT_NAMES[stat] || stat; },
});
