// Battle: elección de acciones, prioridad y fase de comandos (028_Battle/005 y 010).
import { Battle } from './battle.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';

const MAX_MENU_ATTEMPTS = 25;
const CATEGORY_NAME = ['Physical', 'Special', 'Status'];

Object.assign(Battle.prototype, {
  // ---------------------------------------------------------------- elecciones
  pbClearChoice(idx) {
    this.choices[idx] = { action: 'None', moveIndex: 0, move: null, target: -1, priority: 0 };
  },

  pbCancelChoice(idx) {
    const ch = this.choices[idx];
    if (ch && ch.action === 'UseItem' && ch.item) this.pbReturnUnusedItemToBag(ch.item, idx);
    this.pbUnregisterMegaEvolution(idx);
    this.pbClearChoice(idx);
  },

  pbCanChooseMove(idxBattler, idxMove, showMessages, sleepTalk = false) {
    const b = this.battlers[idxBattler];
    const move = b.moves[idxMove];
    if (!move) return false;
    if (move.pp === 0 && move.totalPP > 0 && !sleepTalk) {
      if (showMessages) this.pbDisplayPaused('¡No quedan PP para este movimiento!');
      return false;
    }
    if (b.effects.Encore > 0) {
      const enc = b.pbEncoredMoveIndex();
      if (enc >= 0 && idxMove !== enc) return false;
    }
    return b.pbCanChooseMove(move, true, showMessages, sleepTalk);
  },

  pbCanChooseAnyMove(idxBattler, sleepTalk = false) {
    const b = this.battlers[idxBattler];
    return b.moves.some((m, i) => {
      if (m.pp === 0 && m.totalPP > 0 && !sleepTalk) return false;
      if (b.effects.Encore > 0) {
        const enc = b.pbEncoredMoveIndex();
        if (enc >= 0 && i !== enc) return false;
      }
      return b.pbCanChooseMove(m, true, false, sleepTalk);
    });
  },

  /** Otra Vez o Forcejeo cuando no puede elegir movimiento. */
  async pbAutoChooseMove(idxBattler, showMessages = true) {
    const b = this.battlers[idxBattler];
    if (b.isFainted()) {
      this.pbClearChoice(idxBattler);
      return true;
    }
    const enc = b.pbEncoredMoveIndex();
    if (enc >= 0 && this.pbCanChooseMove(idxBattler, enc, false)) {
      const move = b.moves[enc];
      this.choices[idxBattler] = { action: 'UseMove', moveIndex: enc, move, target: -1, priority: 0 };
      if (this.singleBattle()) return true;
      if (this.pbOwnedByPlayer(idxBattler)) {
        if (showMessages) this.pbDisplayPaused(`¡${b.name} tiene que usar ${move.name}!`);
        return this.pbChooseTarget(b, move);
      }
      return true;
    }
    if (this.pbOwnedByPlayer(idxBattler) && showMessages) this.pbDisplayPaused(`¡A ${b.name} no le quedan movimientos!`);
    this.choices[idxBattler] = { action: 'UseMove', moveIndex: -1, move: this.struggle, target: -1, priority: 0 };
    return true;
  },

  pbRegisterMove(idxBattler, idxMove, showMessages = true) {
    const b = this.battlers[idxBattler];
    if (!this.pbCanChooseMove(idxBattler, idxMove, showMessages)) return false;
    this.choices[idxBattler] = { action: 'UseMove', moveIndex: idxMove, move: b.moves[idxMove], target: -1, priority: 0 };
    return true;
  },

  pbChoseMove(idxBattler, moveID) {
    const b = this.battlers[idxBattler];
    if (!b || b.isFainted()) return false;
    const ch = this.choices[idxBattler];
    return ch.action === 'UseMove' && !!ch.move && ch.move.id === moveID;
  },

  pbChoseMoveFunctionCode(idxBattler, code) {
    const b = this.battlers[idxBattler];
    if (!b || b.isFainted()) return false;
    const ch = this.choices[idxBattler];
    return ch.action === 'UseMove' && !!ch.move && ch.move.functionCode === code;
  },

  pbRegisterTarget(idxBattler, idxTarget) {
    this.choices[idxBattler].target = idxTarget;
  },

  /** ¿Puede un movimiento con `td` (targetData) del usuario idxUser apuntar a idxTarget? */
  pbMoveCanTarget(idxUser, idxTarget, td) {
    if (td.numTargets === 0) return false;
    switch (td.id) {
      case 'NearAlly':
        return !this.opposes(idxUser, idxTarget) && this.nearBattlers(idxUser, idxTarget);
      case 'UserOrNearAlly':
        if (idxUser === idxTarget) return true;
        return !this.opposes(idxUser, idxTarget) && this.nearBattlers(idxUser, idxTarget);
      case 'AllAllies':
        return idxUser !== idxTarget && !this.opposes(idxUser, idxTarget);
      case 'UserAndAllies':
        return !this.opposes(idxUser, idxTarget);
      case 'NearFoe':
      case 'RandomNearFoe':
      case 'AllNearFoes':
        return this.opposes(idxUser, idxTarget) && this.nearBattlers(idxUser, idxTarget);
      case 'Foe':
      case 'AllFoes':
        return this.opposes(idxUser, idxTarget);
      case 'NearOther':
      case 'AllNearOthers':
        return this.nearBattlers(idxUser, idxTarget);
      case 'Other':
        return idxUser !== idxTarget;
      default:
        return true;
    }
  },

  // ---------------------------------------------------------------- prioridad
  pbCalculatePriority(fullCalc = false, indexArray = null) {
    let needRearranging = false;
    if (fullCalc) {
      this.priorityTrickRoom = this.field.effects.TrickRoom > 0;
      const randomOrder = Array.from({ length: this.maxBattlerIndex() + 1 }, (_, i) => i);
      for (let i = 0; i < randomOrder.length - 1; i++) {
        const r = i + this.pbRandom(randomOrder.length - i);
        [randomOrder[i], randomOrder[r]] = [randomOrder[r], randomOrder[i]];
      }
      this.priority = [];
      for (let i = 0; i <= this.maxBattlerIndex(); i++) {
        const b = this.battlers[i];
        if (!b) continue;
        const entry = { battler: b, speed: b.pbSpeed(), subAbility: 0, subItem: 0, sub: 0, pri: 0, tie: randomOrder[i] };
        const ch = this.choices[b.index];
        if (ch.action === 'UseMove' || ch.action === 'Shift') {
          if (ch.action === 'UseMove') {
            let pri = ch.move.pbPriority(b);
            if (b.abilityActive()) pri = AbilityEffects.triggerPriorityChange(b.ability, b, ch.move, pri);
            if (b.itemActive()) pri = ItemEffects.triggerPriorityChange(b.item, b, ch.move, pri);
            entry.pri = pri;
            ch.priority = pri;
          }
          if (b.abilityActive()) entry.subAbility = AbilityEffects.triggerPriorityBracketChange(b.ability, b, this);
          if (b.itemActive()) entry.subItem = ItemEffects.triggerPriorityBracketChange(b.item, b, this);
        }
        this.priority.push(entry);
      }
      needRearranging = true;
    } else {
      if ((this.field.effects.TrickRoom > 0) !== this.priorityTrickRoom) {
        needRearranging = true;
        this.priorityTrickRoom = this.field.effects.TrickRoom > 0;
      }
      for (const entry of this.priority) {
        if (indexArray && !indexArray.includes(entry.battler.index)) continue;
        const newSpeed = entry.battler.pbSpeed();
        if (newSpeed !== entry.speed) needRearranging = true;
        entry.speed = newSpeed;
        const ch = this.choices[entry.battler.index];
        if (ch && ch.action === 'UseMove' && ch.move) {
          let pri = ch.move.pbPriority(entry.battler);
          if (entry.battler.abilityActive()) pri = AbilityEffects.triggerPriorityChange(entry.battler.ability, entry.battler, ch.move, pri);
          if (entry.battler.itemActive()) pri = ItemEffects.triggerPriorityChange(entry.battler.item, entry.battler, ch.move, pri);
          if (pri !== entry.pri) needRearranging = true;
          entry.pri = pri;
          ch.priority = pri;
        }
      }
    }
    for (const entry of this.priority) {
      entry.battler.effects.PriorityAbility = false;
      entry.battler.effects.PriorityItem = false;
      let sub = entry.subAbility;
      if ((sub === 0 && entry.subItem !== 0) || (sub < 0 && entry.subItem >= 1)) {
        sub = entry.subItem;
        entry.battler.effects.PriorityItem = true;
      } else if (sub !== 0) {
        entry.battler.effects.PriorityAbility = true;
      }
      entry.sub = sub;
    }
    if (needRearranging) {
      this.priority.sort((a, b) => {
        if (a.pri !== b.pri) return b.pri - a.pri;
        if (a.sub !== b.sub) return b.sub - a.sub;
        if (this.priorityTrickRoom) return a.speed === b.speed ? b.tie - a.tie : a.speed - b.speed;
        return a.speed === b.speed ? b.tie - a.tie : b.speed - a.speed;
      });
    }
  },

  /** Combatientes en orden de actuación (o solo por velocidad). */
  pbPriority(onlySpeedSort = false) {
    if (onlySpeedSort) {
      return [...this.priority]
        .sort((a, b) => (a.speed === b.speed ? b.tie - a.tie : b.speed - a.speed))
        .map((e) => e.battler)
        .filter((b) => this.battlers[b.index] === b);
    }
    return this.priority.map((e) => e.battler).filter((b) => !b.isFainted() && this.battlers[b.index] === b);
  },

  // ---------------------------------------------------------------- fase de comandos
  pbCanShowCommands(idx) {
    const b = this.battlers[idx];
    if (!b || b.isFainted()) return false;
    if (b.isCommander()) return false;
    return !b.usingMultiTurnAttack();
  },

  pbCanShowFightMenu(idx) {
    const b = this.battlers[idx];
    if (b.effects.Encore > 0) return false;
    return b.moves.some((_m, i) => this.pbCanChooseMove(idx, i, false));
  },

  moveOptions(b) {
    return b.moves.map((m, i) => ({
      index: i,
      id: m.id,
      name: m.name,
      type: m.pbBaseType ? m.pbBaseType(b) : m.type,
      category: CATEGORY_NAME[m.category],
      power: m.power,
      accuracy: m.accuracy,
      pp: m.pp,
      totalPP: m.totalPP,
      selectable: this.pbCanChooseMove(b.index, i, false),
    }));
  },

  async pbFightMenu(idx) {
    if (!this.pbCanShowFightMenu(idx)) return this.pbAutoChooseMove(idx);
    const b = this.battlers[idx];
    for (let attempt = 0; attempt < MAX_MENU_ATTEMPTS; attempt++) {
      const canMega = this.pbCanMegaEvolve(idx);
      const res = await this.ask('chooseMove', b.view(), this.moveOptions(b), { canMega });
      if (!res) return false;
      const i = res.index;
      if (i < 0 || !b.moves[i]) return false;
      if (!this.pbRegisterMove(idx, i, true)) continue;
      if (res.mega && canMega) this.pbRegisterMegaEvolution(idx);
      if (!this.singleBattle() && !(await this.pbChooseTarget(b, b.moves[i]))) {
        this.pbCancelChoice(idx);
        continue;
      }
      return true;
    }
    return this.pbAutoChooseMove(idx, false);
  },

  /** Pide objetivo si el movimiento apunta a un único combatiente elegible. */
  async pbChooseTarget(battler, move) {
    const td = move.pbTarget(battler);
    if (td.numTargets !== 1) return true;
    const candidates = [];
    for (let i = 0; i <= this.maxBattlerIndex(); i++) {
      const b = this.battlers[i];
      if (!b || b.isFainted()) continue;
      if (!this.pbMoveCanTarget(battler.index, i, td)) continue;
      candidates.push({ index: i, battler: b.view() });
    }
    if (candidates.length === 0) return true;
    if (candidates.length === 1 || td.id === 'RandomNearFoe') {
      this.pbRegisterTarget(battler.index, candidates[0].index);
      return true;
    }
    const opt = this.moveOptions(battler).find((m) => m.id === move.id) || { id: move.id, name: move.name };
    const idxTarget = await this.ask('chooseTarget', battler.view(), opt, candidates);
    if (idxTarget < 0 || !candidates.some((c) => c.index === idxTarget)) return false;
    this.pbRegisterTarget(battler.index, idxTarget);
    return true;
  },

  async pbPartyMenu(idx) {
    const ret = await this.pbPartyScreen(idx, false, true, true, 'command');
    return ret >= 0;
  },

  async pbRunMenu(idx) {
    return (await this.pbRun(idx)) !== 0;
  },

  async pbCommandMenu(idx, firstAction) {
    const b = this.battlers[idx];
    return this.ask('chooseAction', b.view(), {
      firstAction,
      canRun: firstAction && this.wildBattle() && this.canRun,
      canSwitch: this.canSwitch,
      canUseItems: this.internalBattle,
      wild: this.wildBattle(),
    });
  },

  async pbCommandPhase() {
    this.commandPhase = true;
    this.battlers.forEach((b, i) => { if (b && this.pbCanShowCommands(i)) this.pbClearChoice(i); });
    for (const side of [0, 1]) {
      this.megaEvolution[side] = this.megaEvolution[side].map((v) => (v >= 0 ? -1 : v));
    }
    await this.pbCommandPhaseLoop(true);
    if (this.decision !== 0) {
      this.commandPhase = false;
      return;
    }
    await this.pbCommandPhaseLoop(false);
    this.commandPhase = false;
  },

  async pbCommandPhaseLoop(isPlayer) {
    const actioned = [];
    let idx = -1;
    let guard = 0;
    for (;;) {
      if (this.decision !== 0) break;
      idx += 1;
      if (idx >= this.battlers.length) break;
      const b = this.battlers[idx];
      if (!b || this.pbOwnedByPlayer(idx) !== isPlayer) continue;
      if (this.choices[idx].action !== 'None' || !this.pbCanShowCommands(idx)) continue;
      if (this.controlPlayer || !this.pbOwnedByPlayer(idx)) {
        if (this.ai) this.ai.pbDefaultChooseEnemyCommand(idx);
        else await this.pbAutoChooseMove(idx, false);
        continue;
      }
      actioned.push(idx);
      let commandsEnd = false;
      for (;;) {
        guard += 1;
        // Salvaguarda contra UIs que nunca eligen nada válido (un humano no llega a tantas vueltas).
        if (guard > MAX_MENU_ATTEMPTS * 40) {
          await this.pbAutoChooseMove(idx, false);
          break;
        }
        const cmd = await this.pbCommandMenu(idx, actioned.length === 1);
        if (cmd !== 'fight' && cmd !== 'cancel' && b.effects.SkyDrop >= 0) {
          this.pbDisplay(`¡Caída Libre no deja cambiar a ${b.pbThis(true)}!`);
          continue;
        }
        if (cmd === 'fight') {
          if (await this.pbFightMenu(idx)) break;
        } else if (cmd === 'bag') {
          if (await this.pbItemMenu(idx, actioned.length === 1)) {
            if (this.pbItemUsesAllActions(this.choices[idx].item)) commandsEnd = true;
            break;
          }
        } else if (cmd === 'pokemon') {
          if (await this.pbPartyMenu(idx)) break;
        } else if (cmd === 'run') {
          if (await this.pbRunMenu(idx)) {
            commandsEnd = true;
            break;
          }
        } else if (cmd === 'cancel') {
          if (actioned.length <= 1) continue;
          actioned.pop();
          idx = actioned[actioned.length - 1] - 1;
          this.pbCancelChoice(idx + 1);
          actioned.pop();
          break;
        }
        this.pbCancelChoice(idx);
      }
      if (commandsEnd) break;
    }
  },
});
