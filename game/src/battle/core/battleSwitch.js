// Battle: cambios de Pokémon, entrada en combate y trampas de entrada (028_Battle/006).
import { Battle } from './battle.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { calculateEffectiveness, Effectiveness } from './typeChart.js';
import { trainerFullName } from './battleStart.js';

const MAX_PARTY_ATTEMPTS = 25;

Object.assign(Battle.prototype, {
  pbCanSwitchIn(idxBattler, idxParty, showMessages = false) {
    if (idxParty < 0) return true;
    const party = this.pbParty(idxBattler);
    const pkmn = party[idxParty];
    if (idxParty >= party.length || !pkmn) return false;
    if (!this.pbIsOwner(idxBattler, idxParty)) {
      if (showMessages) this.pbDisplay('¡No puedes cambiar un Pokémon de otro entrenador por uno de los tuyos!');
      return false;
    }
    if (pkmn.hp <= 0) {
      if (showMessages) this.pbDisplay(`¡A ${this.pokemonName(pkmn)} no le quedan energías para luchar!`);
      return false;
    }
    if (this.pbFindBattler(idxParty, idxBattler)) {
      if (showMessages) this.pbDisplay(`¡${this.pokemonName(pkmn)} ya está en combate!`);
      return false;
    }
    // Retirado por un efecto (Retirada, Mochila Escape…) y aún sin sustituto: no puede volver a entrar.
    if (this.battlers.some((b) => b && b.recalled && b.pokemonIndex === idxParty && !this.opposes(b.index, idxBattler))) {
      if (showMessages) this.pbDisplay(`¡${this.pokemonName(pkmn)} acaba de retirarse!`);
      return false;
    }
    return true;
  },

  pbCanSwitchOut(idxBattler, showMessages = false) {
    const b = this.battlers[idxBattler];
    if (b.isFainted()) return true;
    if (b.abilityActive() && AbilityEffects.triggerCertainSwitching(b.ability, b, this)) return true;
    if (b.itemActive() && ItemEffects.triggerCertainSwitching(b.item, b, this)) return true;
    if (Settings.MORE_TYPE_EFFECTS && b.pbHasType('GHOST')) return true;
    if (b.trappedInBattle()) {
      if (showMessages) this.pbDisplay(`¡${b.pbThis()} no puede ser cambiado!`);
      return false;
    }
    for (const o of this.allOtherSideBattlers(idxBattler)) {
      if (o.abilityActive() && AbilityEffects.triggerTrappingByTarget(o.ability, b, o, this)) {
        if (showMessages) this.pbDisplay(`¡${o.abilityName()} de ${o.pbThis(true)} impide el cambio!`);
        return false;
      }
    }
    for (const o of this.allOtherSideBattlers(idxBattler)) {
      if (o.itemActive() && ItemEffects.triggerTrappingByTarget(o.item, b, o, this)) {
        if (showMessages) this.pbDisplay(`¡${o.itemName()} de ${o.pbThis(true)} impide el cambio!`);
        return false;
      }
    }
    return true;
  },

  pbCanSwitch(idxBattler, idxParty = -1, showMessages = false) {
    if (!this.pbCanSwitchIn(idxBattler, idxParty, showMessages)) return false;
    for (const b of this.allSameSideBattlers(idxBattler)) {
      const ch = this.choices[b.index];
      if (ch.action === 'SwitchOut' && ch.partyIndex === idxParty) {
        if (showMessages) this.pbDisplay(`${this.pokemonName(this.pbParty(idxBattler)[idxParty])} ya ha sido seleccionado.`);
        return false;
      }
    }
    const ret = this.pbCanSwitchOut(idxBattler, showMessages);
    if (ret && this.battlers[idxBattler].effects.Commander) {
      if (showMessages) this.pbDisplay(`¡${this.battlers[idxBattler].pbThis()} no puede ser cambiado!`);
      return false;
    }
    return ret;
  },

  pbCanChooseNonActive(idxBattler) {
    return this.pbParty(idxBattler).some((_p, i) => this.pbCanSwitchIn(idxBattler, i));
  },

  pbRegisterSwitch(idxBattler, idxParty) {
    if (!this.pbCanSwitch(idxBattler, idxParty)) return false;
    this.choices[idxBattler] = { action: 'SwitchOut', partyIndex: idxParty, move: null, target: -1, priority: 0 };
    return true;
  },

  partyOptions(idxBattler) {
    const party = this.pbParty(idxBattler);
    return party.map((p, i) => {
      if (!p) return null;
      const active = !!this.pbFindBattler(i, idxBattler);
      const chosen = this.allSameSideBattlers(idxBattler).some((b) => {
        const ch = this.choices[b.index];
        return ch && ch.action === 'SwitchOut' && ch.partyIndex === i;
      });
      return {
        partyIndex: i,
        pokemon: JSON.parse(JSON.stringify(p)),
        name: this.pokemonName(p),
        able: this.able(p),
        fainted: p.hp <= 0,
        active,
        chosen,
        owned: this.pbIsOwner(idxBattler, i),
      };
    }).filter(Boolean);
  },

  /** Pantalla de equipo (UI) hasta obtener una elección válida o cancelar. */
  async pbPartyScreen(idxBattler, checkLaxOnly = false, canCancel = false, shouldRegister = false, reason = 'command') {
    const b = this.battlers[idxBattler];
    for (let attempt = 0; attempt < MAX_PARTY_ATTEMPTS; attempt++) {
      const idxParty = await this.ask('chooseSwitch', {
        battler: b && b.pokemon ? b.view() : null,
        reason,
        canCancel,
        party: this.partyOptions(idxBattler),
      });
      if (idxParty == null || idxParty < 0) {
        if (canCancel) return -1;
        continue;
      }
      if (checkLaxOnly ? !this.pbCanSwitchIn(idxBattler, idxParty, true) : !this.pbCanSwitch(idxBattler, idxParty, true)) continue;
      if (shouldRegister && !this.pbRegisterSwitch(idxBattler, idxParty)) continue;
      return idxParty;
    }
    if (canCancel) return -1;
    // Último recurso: primer Pokémon válido.
    return this.pbParty(idxBattler).findIndex((_p, i) => this.pbCanSwitchIn(idxBattler, i));
  },

  /** Elección de sustituto en mitad de algo (Ida y Vuelta, Relevo, debilitado). */
  async pbSwitchInBetween(idxBattler, checkLaxOnly = false, canCancel = false, reason = 'replace') {
    if (!this.controlPlayer && this.pbOwnedByPlayer(idxBattler)) {
      return this.pbPartyScreen(idxBattler, checkLaxOnly, canCancel, false, reason);
    }
    return this.ai ? this.ai.pbDefaultChooseNewEnemy(idxBattler) : this.pbGetReplacementPokemonIndexRandom(idxBattler);
  },

  pbGetReplacementPokemonIndexRandom(idxBattler) {
    const choices = [];
    this.eachInTeamFromBattlerIndex(idxBattler, (_p, i) => { if (this.pbCanSwitchIn(idxBattler, i)) choices.push(i); });
    return choices.length ? choices[this.pbRandom(choices.length)] : -1;
  },

  async pbGetReplacementPokemonIndex(idxBattler, random = false, reason = 'replace') {
    if (random) return this.pbGetReplacementPokemonIndexRandom(idxBattler);
    return this.pbSwitchInBetween(idxBattler, true, false, reason);
  },

  /** Rellena los huecos de debilitados al final de la ronda. */
  async pbEORSwitch(favorDraws = false) {
    if (this.decision > 0 && !favorDraws) return;
    if (this.decision === 5 && favorDraws) return;
    this.pbJudge();
    if (this.decision > 0) return;
    for (;;) {
      const switched = [];
      for (const b of [...this.battlers]) {
        if (!b || !b.isFainted()) continue;
        const idxBattler = b.index;
        if (!this.pbCanChooseNonActive(idxBattler)) continue;
        if (!this.pbOwnedByPlayer(idxBattler)) {
          if (b.wild()) continue;
          const idxNew = await this.pbSwitchInBetween(idxBattler);
          if (idxNew < 0) continue;
          if (this.switchStyle && this.trainerBattle() && this.pbSideSize(0) === 1 && this.opposes(idxBattler) &&
              !this.battlers[0].isFainted() && !switched.includes(0) && this.pbCanChooseNonActive(0) &&
              this.battlers[0].effects.Outrage === 0) {
            const owner = this.pbGetOwnerFromBattlerIndex(idxBattler);
            const newName = this.pokemonName(this.pbParty(idxBattler)[idxNew]);
            if (await this.pbDisplayConfirm(`${trainerFullName(this, owner)} va a sacar a ${newName}. ¿Quieres cambiar de Pokémon?`)) {
              const idxPlayer = await this.pbSwitchInBetween(0, false, true, 'replace');
              if (idxPlayer >= 0) {
                this.pbMessageOnRecall(this.battlers[0]);
                this.pbRecallAndReplace(0, idxPlayer);
                switched.push(0);
              }
            }
          }
          this.pbRecallAndReplace(idxBattler, idxNew);
          switched.push(idxBattler);
        } else if (this.trainerBattle()) {
          const idxNew = await this.pbGetReplacementPokemonIndex(idxBattler);
          if (idxNew < 0) continue;
          this.pbRecallAndReplace(idxBattler, idxNew);
          switched.push(idxBattler);
        } else {
          let doSwitch = false;
          if (await this.pbDisplayConfirm('¿Quieres sacar a otro Pokémon?')) {
            doSwitch = true;
          } else {
            doSwitch = (await this.pbRun(idxBattler, true)) <= 0;
          }
          if (this.decision > 0) return;
          if (doSwitch) {
            const idxNew = await this.pbGetReplacementPokemonIndex(idxBattler);
            if (idxNew < 0) continue;
            this.pbRecallAndReplace(idxBattler, idxNew);
            switched.push(idxBattler);
          }
        }
      }
      if (switched.length === 0) break;
      await this.pbOnBattlerEnteringBattle(switched);
      if (this.decision > 0) break;
    }
  },

  pbRecallAndReplace(idxBattler, idxParty, randomReplacement = false, batonPass = false) {
    const b = this.battlers[idxBattler];
    if (!b.isFainted()) this.queueEvent('switchOut', b.view());
    b.pbAbilitiesOnSwitchOut();
    if (!randomReplacement) this.pbMessagesOnReplace(idxBattler, idxParty);
    this.pbReplace(idxBattler, idxParty, batonPass);
  },

  pbMessageOnRecall(b) {
    if (b.pbOwnedByPlayer()) {
      if (b.hp <= Math.floor(b.totalhp / 4)) this.pbDisplayBrief(`¡Buen trabajo, ${b.name}! ¡Regresa!`);
      else if (b.hp <= Math.floor(b.totalhp / 2)) this.pbDisplayBrief(`¡Bien, ${b.name}! ¡Regresa!`);
      else if (b.turnCount >= 5) this.pbDisplayBrief(`¡${b.name}, es suficiente! ¡Regresa!`);
      else if (b.turnCount >= 2) this.pbDisplayBrief(`¡${b.name}, regresa!`);
      else this.pbDisplayBrief(`¡${b.name}, cambia! ¡Regresa!`);
    } else {
      this.pbDisplayBrief(`¡${trainerFullName(this, this.pbGetOwnerFromBattlerIndex(b.index))} retiró a ${b.name}!`);
    }
  },

  pbMessagesOnReplace(idxBattler, idxParty) {
    const party = this.pbParty(idxBattler);
    let newName = this.pokemonName(party[idxParty]);
    if (party[idxParty].ability === 'ILLUSION' && !this.pbCheckGlobalAbility('NEUTRALIZINGGAS')) {
      const n = this.pbLastInTeam(idxBattler);
      if (n >= 0 && n !== idxParty) newName = this.pokemonName(party[n]);
    }
    if (this.pbOwnedByPlayer(idxBattler)) {
      const opp = this.battlers[idxBattler].pbDirectOpposing();
      if (!opp || opp.isFainted() || opp.hp === opp.totalhp) this.pbDisplayBrief(`¡Te toca, ${newName}!`);
      else if (opp.hp >= Math.floor(opp.totalhp / 2)) this.pbDisplayBrief(`¡Adelante, ${newName}!`);
      else if (opp.hp >= Math.floor(opp.totalhp / 4)) this.pbDisplayBrief(`¡Solo un poco más! ¡Aguanta, ${newName}!`);
      else this.pbDisplayBrief(`¡Tu oponente está débil! ¡A por ellos, ${newName}!`);
    } else {
      this.pbDisplayBrief(`¡${trainerFullName(this, this.pbGetOwnerFromBattlerIndex(idxBattler))} sacó a ${newName}!`);
    }
  },

  pbReplace(idxBattler, idxParty, batonPass = false) {
    const party = this.pbParty(idxBattler);
    const b = this.battlers[idxBattler];
    const idxOld = b.pokemonIndex;
    b.pbInitialize(party[idxParty], idxParty, batonPass);
    const order = this.pbPartyOrder(idxBattler);
    if (idxOld >= 0) [order[idxParty], order[idxOld]] = [order[idxOld], order[idxParty]];
    this.pbSendOut([idxBattler]);
    if (Settings.RECALCULATE_TURN_ORDER_AFTER_SPEED_CHANGES) this.pbCalculatePriority(false, [idxBattler]);
  },

  pbSendOut(indices, startBattle = false) {
    for (const idx of indices) {
      const b = this.battlers[idx];
      this.queueEvent('switchIn', b.view(), { startBattle });
      this.pbSetSeen(b);
      this.usedInBattle[idx & 1][b.pokemonIndex] = true;
    }
  },

  async pbOnAllBattlersEnteringBattle() {
    this.pbCalculatePriority(true);
    await this.pbOnBattlerEnteringBattle(this.allBattlers().map((b) => b.index));
    this.pbCalculatePriority();
    for (const b of this.allBattlers()) b.pbCheckForm();
  },

  /** Efectos al entrar: trampas de entrada, habilidades (Intimidación…), objetos. */
  async pbOnBattlerEnteringBattle(indices, skipEventReset = false) {
    const list = [indices].flat();
    if (!skipEventReset) {
      for (const b of this.allBattlers()) {
        b.droppedBelowHalfHP = false;
        b.droppedBelowThirdHP = false;
        b.statsDropped = false;
      }
    }
    for (const b of this.pbPriority(true)) {
      if (!list.includes(b.index) || b.isFainted()) continue;
      this.pbRecordBattlerAsParticipated(b);
      this.pbEffectsOnBattlerEnteringPosition(b);
      this.pbEntryHazards(b);
      if (b.isFainted()) {
        b.pbFaint();
        await this.pbGainExp();
        this.pbJudge();
        continue;
      }
      b.pbCheckForm();
      b.pbContinualAbilityChecks(true);
      if ((!b.isFainted() && b.unstoppableAbility()) || b.abilityActive()) {
        AbilityEffects.triggerOnSwitchIn(b.ability, b, this, true);
      }
      this.pbEndPrimordialWeather();
      if (b.itemActive()) ItemEffects.triggerOnSwitchIn(b.item, b, this);
      b.pbHeldItemTriggerCheck();
      b.pbAbilityStatusCureCheck();
    }
    for (const b of this.pbPriority(true)) {
      if (b.pbItemOnStatDropped()) break;
      if (b.pbAbilitiesOnDamageTaken()) break;
    }
    for (const b of this.allBattlers()) {
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
      b.statsDropped = false;
    }
    await this.pbProcessPendingReplacements();
  },

  pbRecordBattlerAsParticipated(battler) {
    if (!battler.opposes() && ['AMULETCOIN', 'LUCKINCENSE'].includes(battler.item)) this.field.effects.AmuletCoin = true;
    for (const b of this.allBattlers()) b.pbUpdateParticipants();
  },

  pbEffectsOnBattlerEnteringPosition(battler) {
    const pos = this.positions[battler.index];
    if (pos.effects.HealingWish && (battler.canHeal() || battler.status !== 'NONE')) {
      this.pbCommonAnimation('HealingWish', battler);
      this.pbDisplay(`¡El deseo de curación se hizo realidad para ${battler.pbThis(true)}!`);
      battler.pbRecoverHP(battler.totalhp);
      battler.pbCureStatus(false);
      pos.effects.HealingWish = false;
    }
    if (pos.effects.LunarDance) {
      const fullPP = battler.moves.every((m) => m.pp >= m.totalPP);
      if (battler.canHeal() || battler.status !== 'NONE' || !fullPP) {
        this.pbCommonAnimation('LunarDance', battler);
        this.pbDisplay(`¡Un místico halo de luz de luna envuelve a ${battler.pbThis(true)}!`);
        battler.pbRecoverHP(battler.totalhp);
        battler.pbCureStatus(false);
        for (const m of battler.moves) battler.pbSetPP(m, m.totalPP);
        pos.effects.LunarDance = false;
      }
    }
  },

  pbEntryHazards(battler) {
    const side = battler.pbOwnSide().effects;
    const boots = battler.hasActiveItem('HEAVYDUTYBOOTS');
    if (side.StealthRock && battler.takesIndirectDamage() && !boots) {
      const eff = calculateEffectiveness(this.db.types, 'ROCK', battler.pbTypes(true));
      if (!Effectiveness.ineffective(eff)) {
        battler.pbReduceHP(Math.floor((battler.totalhp * eff) / 8), false);
        this.pbDisplay(`¡Unas piedras puntiagudas han dañado a ${battler.pbThis(true)}!`);
        battler.pbItemHPHealCheck();
      }
    }
    if (side.Spikes > 0 && battler.takesIndirectDamage() && !battler.airborne() && !boots) {
      const div = [8, 6, 4][side.Spikes - 1];
      battler.pbReduceHP(Math.floor(battler.totalhp / div), false);
      this.pbDisplay(`¡Las púas han herido a ${battler.pbThis(true)}!`);
      battler.pbItemHPHealCheck();
    }
    if (side.ToxicSpikes > 0 && !battler.isFainted() && !battler.airborne()) {
      if (battler.pbHasType('POISON')) {
        side.ToxicSpikes = 0;
        this.pbDisplay(`¡Las púas tóxicas lanzadas a ${battler.pbTeam(true)} han desaparecido!`);
      } else if (battler.pbCanPoison(null, false) && !boots) {
        if (side.ToxicSpikes === 2) battler.pbPoison(null, `¡${battler.pbThis()} ha sido gravemente envenenado por las púas tóxicas!`, true);
        else battler.pbPoison(null, `¡${battler.pbThis()} ha sido envenenado por las púas tóxicas!`);
      }
    }
    if (side.StickyWeb && !battler.isFainted() && !battler.airborne() && !boots) {
      this.pbDisplay(`¡${battler.pbThis()} ha caído en una red viscosa!`);
      if (battler.pbCanLowerStatStage('SPEED')) {
        battler.pbLowerStatStage('SPEED', 1, null);
        battler.pbItemStatRestoreCheck();
      }
    }
  },

  // ---------------------------------------------------------------- sustitutos diferidos
  /**
   * Un efecto síncrono (Retirada, Mochila Escape…) ha retirado a un combatiente fuera del final de
   * ronda: se elige y envía su sustituto en el siguiente punto asíncrono.
   */
  pbRequestReplacement(idxBattler) {
    if (!this.pendingReplacements.includes(idxBattler)) this.pendingReplacements.push(idxBattler);
  },

  /**
   * Retira a un combatiente desde un contexto síncrono (Retirada, Botón Escape, Mochila Escape…).
   * Al final de ronda solo se retira (el hueco lo rellena pbEORSwitch); si no, se pide sustituto diferido.
   */
  pbRecallForReplacement(idxBattler) {
    const b = this.battlers[idxBattler];
    if (!b.isFainted()) this.queueEvent('switchOut', b.view());
    b.pbAbilitiesOnSwitchOut();
    b.recalled = true;
    if (!this.endOfRound) this.pbRequestReplacement(idxBattler);
  },

  async pbProcessPendingReplacements() {
    while (this.pendingReplacements.length > 0 && this.decision === 0) {
      const idx = this.pendingReplacements.shift();
      const b = this.battlers[idx];
      if (!b || !b.isFainted()) continue;
      if (!this.pbCanChooseNonActive(idx)) continue;
      const idxNew = await this.pbGetReplacementPokemonIndex(idx);
      if (idxNew < 0) continue;
      // Ya se retiró (pbRecallForReplacement): solo se envía el sustituto.
      this.pbMessagesOnReplace(idx, idxNew);
      this.pbReplace(idx, idxNew);
      this.pbClearChoice(idx);
      await this.pbOnBattlerEnteringBattle(idx);
    }
  },
});
