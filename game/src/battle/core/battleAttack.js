// Battle: fase de ataque, huida, llamada y megaevolución (028_Battle/008, 009, 011).
import { Battle } from './battle.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { makeMega, megaName } from './pokemonUtil.js';
import { trainerFullName } from './battleStart.js';

Object.assign(Battle.prototype, {
  // ---------------------------------------------------------------- huida
  pbCanRun(idxBattler) {
    if (this.trainerBattle()) return false;
    const b = this.battlers[idxBattler];
    if (!this.canRun && !b.opposes()) return false;
    if (b.pbHasType('GHOST') && Settings.MORE_TYPE_EFFECTS) return true;
    if (b.abilityActive() && AbilityEffects.triggerCertainEscapeFromBattle(b.ability, b)) return true;
    if (b.itemActive() && ItemEffects.triggerCertainEscapeFromBattle(b.item, b)) return true;
    if (b.trappedInBattle()) return false;
    for (const o of this.allOtherSideBattlers(idxBattler)) {
      if (o.abilityActive() && AbilityEffects.triggerTrappingByTarget(o.ability, b, o, this)) return false;
      if (o.itemActive() && ItemEffects.triggerTrappingByTarget(o.item, b, o, this)) return false;
    }
    return true;
  },

  /** -1 fallo al huir, 0 no se pudo intentar, 1 huida con éxito. */
  async pbRun(idxBattler, duringBattle = false) {
    const b = this.battlers[idxBattler];
    if (b.opposes()) {
      if (this.trainerBattle()) return 0;
      this.choices[idxBattler] = { action: 'Run', move: null, target: -1, priority: 0 };
      return -1;
    }
    if (this.trainerBattle()) {
      this.pbDisplayPaused('¡No puedes huir de un combate contra un Entrenador!');
      return 0;
    }
    if (!this.canRun) {
      this.pbDisplayPaused('¡No puedes escapar!');
      return 0;
    }
    if (!duringBattle) {
      if (b.pbHasType('GHOST') && Settings.MORE_TYPE_EFFECTS) {
        this.pbDisplayPaused('¡Escapas sin problemas!');
        this.decision = 3;
        return 1;
      }
      if (b.abilityActive() && AbilityEffects.triggerCertainEscapeFromBattle(b.ability, b)) {
        this.pbShowAbilitySplash(b, true);
        this.pbHideAbilitySplash(b);
        this.pbDisplayPaused('¡Escapas sin problemas!');
        this.decision = 3;
        return 1;
      }
      if (b.itemActive() && ItemEffects.triggerCertainEscapeFromBattle(b.item, b)) {
        this.pbDisplayPaused(`¡${b.pbThis()} escapó usando ${b.itemName()}!`);
        this.decision = 3;
        return 1;
      }
      if (b.trappedInBattle()) {
        this.pbDisplayPaused('¡No puedes huir!');
        return 0;
      }
      for (const o of this.allOtherSideBattlers(idxBattler)) {
        if (o.abilityActive() && AbilityEffects.triggerTrappingByTarget(o.ability, b, o, this)) {
          this.pbDisplayPaused(`¡${o.pbThis()} evita que se huya con ${o.abilityName()}!`);
          return 0;
        }
      }
      for (const o of this.allOtherSideBattlers(idxBattler)) {
        if (o.itemActive() && ItemEffects.triggerTrappingByTarget(o.item, b, o, this)) {
          this.pbDisplayPaused(`¡${o.pbThis()} evita que se huya con ${o.itemName()}!`);
          return 0;
        }
      }
    }
    // Fórmula de huida (velocidad sin modificar)
    if (!duringBattle) this.runCommand += 1;
    const speedPlayer = b.speed;
    let speedEnemy = 1;
    for (const o of this.allOtherSideBattlers(idxBattler)) if (o.speed > speedEnemy) speedEnemy = o.speed;
    let rate;
    if (speedPlayer > speedEnemy) {
      rate = 256;
    } else {
      rate = Math.floor((speedPlayer * 128) / speedEnemy);
      rate += this.runCommand * 30;
    }
    if (rate >= 256 || this.pbAIRandom(256) < rate) {
      this.pbDisplayPaused('¡Escapas sin problemas!');
      this.decision = 3;
      return 1;
    }
    this.pbDisplayPaused('¡No puedes huir!');
    return -1;
  },

  // ---------------------------------------------------------------- llamada / desplazar
  pbRegisterCall(idx) {
    this.choices[idx] = { action: 'Call', move: null, target: -1, priority: 0 };
    return true;
  },

  pbCall(idx) {
    const b = this.battlers[idx];
    this.pbDisplay(`¡${this.pbGetOwnerName(idx)} llamó a ${b.pbThis(true)}!`);
    this.pbDisplay(`¡${b.name}!`);
    if (b.status === 'SLEEP') b.pbCureStatus();
    else if (b.pbCanRaiseStatStage('ACCURACY', b)) b.pbRaiseStatStage('ACCURACY', 1, b);
    else this.pbDisplay('¡Pero no sucedió nada!');
  },

  // ---------------------------------------------------------------- megaevolución
  pbHasMegaRing(idx) {
    const owner = this.pbGetOwnerFromBattlerIndex(idx);
    if (!owner) return false;
    if (owner.megaRing === false) return false;
    if (this.pbOwnedByPlayer(idx)) {
      return Object.keys(this.bag).some((i) => this.itemHasFlag(i, 'MegaRing') && this.bag[i] > 0) || owner.megaRing === true;
    }
    return owner.megaRing === true || this.pbGetOwnerItems(idx).some((i) => this.itemHasFlag(i, 'MegaRing'));
  },

  pbCanMegaEvolve(idx) {
    if (this.rules.disableMega) return false;
    const b = this.battlers[idx];
    if (!b || !b.hasMega() || b.wild()) return false;
    if (b.effects.SkyDrop >= 0) return false;
    if (!this.pbHasMegaRing(idx)) return false;
    const owner = this.pbGetOwnerIndexFromBattlerIndex(idx);
    return this.megaEvolution[b.idxOwnSide()][owner] === -1;
  },

  pbRegisterMegaEvolution(idx) {
    const owner = this.pbGetOwnerIndexFromBattlerIndex(idx);
    this.megaEvolution[idx & 1][owner] = idx;
  },

  pbUnregisterMegaEvolution(idx) {
    const owner = this.pbGetOwnerIndexFromBattlerIndex(idx);
    if (this.megaEvolution[idx & 1][owner] === idx) this.megaEvolution[idx & 1][owner] = -1;
  },

  pbRegisteredMegaEvolution(idx) {
    const owner = this.pbGetOwnerIndexFromBattlerIndex(idx);
    return this.megaEvolution[idx & 1][owner] === idx;
  },

  pbMegaEvolve(idx) {
    const b = this.battlers[idx];
    if (!b || !b.pokemon || !b.hasMega() || b.mega()) return;
    const trainerName = this.pbOwnedByPlayer(idx) ? this.player[0].name : trainerFullName(this, this.pbGetOwnerFromBattlerIndex(idx));
    const oldAbility = b.abilityId;
    this.pbDisplay(`¡La ${b.itemName()} de ${b.pbThis(true)} está reaccionando al Mega Aro de ${trainerName}!`);
    this.pbCommonAnimation('MegaEvolution', b);
    makeMega(this.db, b.pokemon);
    b.form = b.pokemon.form;
    b.pbUpdate(true);
    this.queueEvent('changeForm', b.view());
    this.pbCommonAnimation('MegaEvolution2', b);
    this.pbDisplay(`¡${b.pbThis()} ha megaevolucionado a ${megaName(this.db, b.pokemon)}!`);
    this.megaEvolution[idx & 1][this.pbGetOwnerIndexFromBattlerIndex(idx)] = -2;
    b.pbOnLosingAbility(oldAbility);
    b.pbTriggerAbilityOnGainingIt();
    if (Settings.RECALCULATE_TURN_ORDER_AFTER_MEGA_EVOLUTION) this.pbCalculatePriority(false, [idx]);
  },

  // ---------------------------------------------------------------- fase de ataque
  pbAttackPhasePriorityChangeMessages() {
    for (const b of this.pbPriority()) {
      if (b.effects.PriorityAbility && b.abilityActive()) AbilityEffects.triggerPriorityBracketUse(b.ability, b, this);
      else if (b.effects.PriorityItem && b.itemActive()) ItemEffects.triggerPriorityBracketUse(b.item, b, this);
    }
  },

  pbAttackPhaseCall() {
    for (const b of this.pbPriority()) {
      if (this.choices[b.index].action !== 'Call' || b.isFainted()) continue;
      b.lastMoveFailed = false;
      this.pbCall(b.index);
    }
  },

  /** Persecución golpea a quien se retira. */
  async pbPursuit(idxSwitcher) {
    this.switching = true;
    for (const b of this.pbPriority()) {
      if (b.isFainted() || !b.opposes(idxSwitcher)) continue;
      if (b.movedThisRound() || !this.pbChoseMoveFunctionCode(b.index, 'PursueSwitchingFoe')) continue;
      const ch = this.choices[b.index];
      if (!this.pbMoveCanTarget(b.index, idxSwitcher, ch.move.pbTarget(b))) continue;
      if (!this.pbCanChooseMove(b.index, ch.moveIndex, false)) continue;
      if (['SLEEP', 'FROZEN'].includes(b.status)) continue;
      if (b.effects.SkyDrop >= 0) continue;
      if (b.hasActiveAbility('TRUANT') && b.effects.Truant) continue;
      if (!b.wild() && this.pbRegisteredMegaEvolution(b.index)) this.pbMegaEvolve(b.index);
      ch.target = idxSwitcher;
      await b.pbProcessTurn(ch, false);
      if (this.decision > 0 || this.battlers[idxSwitcher].isFainted()) break;
    }
    this.switching = false;
  },

  async pbAttackPhaseSwitch() {
    for (const b of this.pbPriority()) {
      const ch = this.choices[b.index];
      if (ch.action !== 'SwitchOut' || b.isFainted()) continue;
      const idxNew = ch.partyIndex;
      b.lastMoveFailed = false;
      this.lastMoveUser = b.index;
      this.pbMessageOnRecall(b);
      await this.pbPursuit(b.index);
      if (this.decision > 0) return;
      if (b.isFainted()) continue;
      for (const o of this.allBattlers()) {
        o.droppedBelowHalfHP = false;
        o.droppedBelowThirdHP = false;
        o.statsDropped = false;
      }
      this.pbRecallAndReplace(b.index, idxNew);
      await this.pbOnBattlerEnteringBattle(b.index, true);
    }
  },

  async pbAttackPhaseItems() {
    for (const b of this.pbPriority()) {
      const ch = this.choices[b.index];
      if (ch.action !== 'UseItem' || b.isFainted()) continue;
      b.lastMoveFailed = false;
      if (!ch.item) continue;
      await this.pbUseItemChoice(b, ch);
      if (this.decision > 0) return;
    }
    if (Settings.RECALCULATE_TURN_ORDER_AFTER_SPEED_CHANGES) this.pbCalculatePriority();
  },

  pbAttackPhaseMegaEvolution() {
    for (const b of this.pbPriority()) {
      if (b.wild()) continue;
      if (this.choices[b.index].action !== 'UseMove' || b.isFainted()) continue;
      if (this.pbRegisteredMegaEvolution(b.index)) this.pbMegaEvolve(b.index);
    }
  },

  async pbAttackPhaseMoves() {
    for (const b of this.pbPriority()) {
      const ch = this.choices[b.index];
      if (ch.action !== 'UseMove' || b.isFainted() || b.movedThisRound()) continue;
      ch.move.pbDisplayChargeMessage(b);
    }
    for (;;) {
      const priority = this.pbPriority();
      let advance = false;
      for (const b of priority) {
        if (!b.effects.MoveNext || b.isFainted()) continue;
        const ch = this.choices[b.index];
        if (!['UseMove', 'Shift'].includes(ch.action) || b.movedThisRound()) continue;
        advance = await b.pbProcessTurn(ch);
        if (advance) break;
      }
      if (this.decision > 0) return;
      if (advance) continue;
      for (const b of priority) {
        if (b.effects.Quash > 0 || b.isFainted()) continue;
        const ch = this.choices[b.index];
        if (!['UseMove', 'Shift'].includes(ch.action) || b.movedThisRound()) continue;
        advance = await b.pbProcessTurn(ch);
        if (advance) break;
      }
      if (this.decision > 0) return;
      if (advance) continue;
      for (const b of priority) {
        if (b.effects.Quash <= 0 || b.isFainted()) continue;
        const ch = this.choices[b.index];
        if (!['UseMove', 'Shift'].includes(ch.action) || b.movedThisRound()) continue;
        advance = await b.pbProcessTurn(ch);
        if (advance) break;
      }
      if (this.decision > 0) return;
      if (advance) continue;
      const pending = priority.some((b) => !b.isFainted() && !b.movedThisRound() &&
        ['UseMove', 'Shift'].includes(this.choices[b.index].action));
      if (!pending) break;
    }
  },

  async pbAttackPhase() {
    this.battlers.forEach((b, i) => {
      if (!b) return;
      if (!b.isFainted()) b.turnCount += 1;
      const act = this.choices[i].action;
      if (!['UseMove', 'Shift', 'SwitchOut'].includes(act)) {
        b.effects.DestinyBond = false;
        b.effects.Grudge = false;
      }
      if (!this.pbChoseMoveFunctionCode(i, 'StartRaiseUserAtk1WhenDamaged')) b.effects.Rage = false;
    });
    this.pbCalculatePriority(true);
    this.pbAttackPhasePriorityChangeMessages();
    this.pbAttackPhaseCall();
    await this.pbAttackPhaseSwitch();
    if (this.decision > 0) return;
    await this.pbAttackPhaseItems();
    if (this.decision > 0) return;
    this.pbAttackPhaseMegaEvolution();
    await this.pbAttackPhaseMoves();
  },
});
