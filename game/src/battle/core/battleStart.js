// Battle: inicio, bucle principal, final, dinero y juicio (028_Battle/003).
import { Battle } from './battle.js';
import { Battler } from './battler.js';
import { newPosition } from './effects.js';
import { DECISION_OUTCOME } from './constants.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { makeUnmega } from './pokemonUtil.js';
import { evolutionTarget, calcStats } from './pokemon.js';

const MAX_ROUNDS = 1000;

/** Nombre completo de entrenador ("Entrenadora Lía"). */
export function trainerFullName(battle, t) {
  if (!t) return '';
  const tt = t.trainerType && battle.db.trainerTypes ? battle.db.trainerTypes[t.trainerType] : null;
  return tt && tt.name ? `${tt.name} ${t.name}`.trim() : t.name;
}

Object.assign(Battle.prototype, {
  /** Ajusta el tamaño de cada bando a los Pokémon disponibles. */
  pbEnsureParticipants() {
    const wildCount = this.party2.filter((p) => this.able(p)).length;
    if (this.wildBattle()) {
      const n = Math.min(Math.max(wildCount, 1), 2);
      if (this.sideSizes[0] === this.sideSizes[1]) this.sideSizes = [n, n];
      else this.sideSizes[1] = n;
    }
    for (const side of [0, 1]) {
      if (side === 1 && this.wildBattle()) continue;
      const counts = this.pbAbleTeamCounts(side);
      const trainers = side === 0 ? this.player : this.opponent;
      if (counts.every((c) => c === 0)) throw new Error(`El bando ${side} no tiene Pokémon capaces de combatir`);
      if (trainers.length > 1) {
        counts.forEach((c, i) => { if (c === 0) throw new Error(`El entrenador ${trainers[i].name} no tiene Pokémon válidos`); });
        this.sideSizes[side] = Math.max(this.sideSizes[side], trainers.length);
      } else {
        this.sideSizes[side] = Math.min(this.sideSizes[side], counts[0]);
      }
    }
    // Como Essentials: en combates contra entrenadores ambos bandos se reducen por igual.
    if (this.trainerBattle() && this.player.length === 1 && this.opponent.length === 1) {
      const m = Math.min(...this.sideSizes);
      this.sideSizes = [m, m];
    }
    if (this.pbAbleCount(0) === 0) throw new Error('El jugador no tiene Pokémon capaces de combatir');
  },

  pbCreateBattler(idxBattler, pkmn, idxParty) {
    this.battlers[idxBattler] = new Battler(this, idxBattler);
    this.positions[idxBattler] = newPosition();
    this.pbClearChoice(idxBattler);
    this.battlers[idxBattler].pbInitialize(pkmn, idxParty);
  },

  pbSetUpSides() {
    const ret = [[], []];
    for (const side of [0, 1]) {
      if (side === 1 && this.wildBattle()) {
        let n = 0;
        this.pbParty(1).forEach((pkmn, i) => {
          if (n >= this.sideSizes[1] || !this.able(pkmn)) return;
          this.pbCreateBattler(2 * n + 1, pkmn, i);
          this.pbSetSeen(this.battlers[2 * n + 1]);
          this.usedInBattle[1][i] = true;
          n += 1;
        });
        continue;
      }
      const trainers = side === 0 ? this.player : this.opponent;
      const requireds = [];
      for (let i = 0; i < this.sideSizes[side]; i++) {
        const t = this.pbGetOwnerIndexFromBattlerIndex(i * 2 + side);
        requireds[t] = (requireds[t] || 0) + 1;
      }
      let battlerNumber = 0;
      const order = this.pbPartyOrder(side);
      const starts = this.pbPartyStarts(side);
      trainers.forEach((_t, idxTrainer) => {
        ret[side][idxTrainer] = [];
        const done = () => ret[side][idxTrainer].length >= (requireds[idxTrainer] || 0);
        this.eachInTeam(side, idxTrainer, (pkmn, idxPkmn) => {
          if (done() || !this.able(pkmn)) return;
          const idxBattler = 2 * battlerNumber + side;
          this.pbCreateBattler(idxBattler, pkmn, idxPkmn);
          ret[side][idxTrainer].push(idxBattler);
          const idxOther = starts[idxTrainer] + ret[side][idxTrainer].length - 1;
          if (idxPkmn !== idxOther) [order[idxPkmn], order[idxOther]] = [order[idxOther], order[idxPkmn]];
          battlerNumber += 1;
        });
      });
    }
    return ret;
  },

  pbStartBattleSendOut(sendOuts) {
    if (this.wildBattle()) {
      const foes = this.battlers.filter((b, i) => b && i % 2 === 1).map((b) => b.name);
      if (foes.length === 1) this.pbDisplayPaused(`¡Un ${foes[0]} salvaje te corta el paso!`);
      else this.pbDisplayPaused(`¡Un ${foes[0]} y un ${foes[1]} salvajes te cortan el paso!`);
    } else {
      const names = this.opponent.map((t) => trainerFullName(this, t));
      this.pbDisplayPaused(names.length === 1 ? `¡${names[0]} te desafía!` : `¡${names[0]} y ${names[1]} te desafían!`);
    }
    for (const side of [1, 0]) {
      if (side === 1 && this.wildBattle()) continue;
      const trainers = side === 0 ? this.player : this.opponent;
      const toSendOut = [];
      const msgs = [];
      trainers.forEach((t, i) => {
        if (side === 0 && i === 0) return;
        const sent = sendOuts[side][i] || [];
        const names = sent.map((idx) => this.battlers[idx].name);
        if (names.length) msgs.push(`¡${trainerFullName(this, t)} saca a ${names.join(' y ')}!`);
        toSendOut.push(...sent);
      });
      if (side === 0) {
        const sent = sendOuts[0][0] || [];
        const names = sent.map((idx) => this.battlers[idx].name);
        if (names.length) msgs.push(`¡Adelante, ${names.join(' y ')}!`);
        toSendOut.push(...sent);
      }
      for (const m of msgs) this.pbDisplayBrief(m);
      this.pbSendOut(toSendOut, true);
    }
  },

  /** Punto de entrada: ejecuta el combate completo y devuelve el resultado. */
  async run() {
    try {
      this.pbEnsureParticipants();
      await this.pbStartBattleCore();
    } catch (err) {
      await this.flush().catch(() => {});
      throw err;
    }
    const result = this.buildResult();
    await this.flush();
    if (typeof this.ui.end === 'function') await this.ui.end(result);
    return result;
  },

  async pbStartBattleCore() {
    const sendOuts = this.pbSetUpSides();
    if (this.ai && this.ai.createAIObjects) this.ai.createAIObjects();
    this.queueEvent('start', this.snapshot());
    this.pbStartBattleSendOut(sendOuts);
    if (this.weatherStartMessage(this.field.weather)) this.pbDisplay(this.weatherStartMessage(this.field.weather));
    if (this.terrainStartMessage(this.field.terrain)) this.pbDisplay(this.terrainStartMessage(this.field.terrain));
    await this.pbOnAllBattlersEnteringBattle();
    await this.pbBattleLoop();
  },

  async pbBattleLoop() {
    this.turnCount = 0;
    for (;;) {
      if (this.turnCount >= MAX_ROUNDS) {
        this.decision = this.pbDecisionOnTime();
        break;
      }
      await this.pbCommandPhase();
      if (this.decision > 0) break;
      await this.pbAttackPhase();
      if (this.decision > 0) break;
      await this.pbEndOfRoundPhase();
      if (this.decision > 0) break;
      this.turnCount += 1;
      await this.flush();
    }
    await this.pbEndOfBattle();
  },

  pbGainMoney() {
    if (!this.internalBattle || !this.moneyGain) return;
    if (this.trainerBattle()) {
      let tMoney = 0;
      this.opponent.forEach((t, i) => {
        const base = t.baseMoney ?? (t.trainerType && this.db.trainerTypes && this.db.trainerTypes[t.trainerType]
          ? this.db.trainerTypes[t.trainerType].baseMoney : 30);
        tMoney += this.pbMaxLevelInTeam(1, i) * base;
      });
      if (this.field.effects.AmuletCoin) tMoney *= 2;
      if (this.field.effects.HappyHour) tMoney *= 2;
      const gained = this.addPlayerMoney(tMoney);
      if (gained > 0) this.pbDisplayPaused(`¡Has ganado ${gained.toLocaleString('es-ES')}$ por vencer!`);
    }
    if (this.field.effects.PayDay > 0) {
      let payDay = this.field.effects.PayDay;
      if (this.field.effects.AmuletCoin) payDay *= 2;
      if (this.field.effects.HappyHour) payDay *= 2;
      const gained = this.addPlayerMoney(payDay);
      if (gained > 0) this.pbDisplayPaused(`¡Has recogido ${gained.toLocaleString('es-ES')}$!`);
    }
  },

  addPlayerMoney(n) {
    const p = this.player[0];
    const old = p.money;
    p.money = Math.max(0, Math.min(Settings.MAX_MONEY, p.money + n));
    this.moneyChange += p.money - old;
    return p.money - old;
  },

  pbLoseMoney() {
    if (!this.internalBattle || !this.moneyGain || this.rules.noMoneyLoss) return;
    const maxLevel = this.pbMaxLevelInTeam(0, 0);
    const multiplier = [8, 16, 24, 36, 48, 64, 80, 100, 120];
    const idx = Math.min(this.player[0].badges || 0, multiplier.length - 1);
    let tMoney = maxLevel * multiplier[idx];
    if (tMoney > this.player[0].money) tMoney = this.player[0].money;
    const lost = -this.addPlayerMoney(-tMoney);
    if (lost > 0) {
      this.pbDisplayPaused(this.trainerBattle()
        ? `Has pagado ${lost.toLocaleString('es-ES')}$ por haber perdido el combate.`
        : `Te has desconcentrado y se te han caído ${lost.toLocaleString('es-ES')}$...`);
    }
  },

  async pbEndOfBattle() {
    const oldDecision = this.decision;
    if (this.decision === 1 && this.wildBattle() && this.caughtPokemon.length > 0) this.decision = 4;
    if (oldDecision === 1) {
      if (this.trainerBattle()) {
        const names = this.opponent.map((t) => trainerFullName(this, t));
        this.pbDisplayPaused(names.length === 1 ? `¡${names[0]} ha perdido!` : `¡${names.join(' y ')} han perdido!`);
        for (const t of this.opponent) {
          this.queueEvent('showOpponent', t.name);
          this.pbDisplayPaused((t.loseText || '...').replace(/\\[Pp][Nn]/g, this.player[0].name).replace(/\\[Nn]/g, '\n'));
        }
      }
      if (this.decision !== 4) this.pbGainMoney();
    } else if (oldDecision === 2 || oldDecision === 5) {
      this.pbDisplayPaused('¡No te quedan Pokémon!');
      if (this.trainerBattle()) {
        const names = this.opponent.map((t) => trainerFullName(this, t));
        this.pbDisplayPaused(`¡Has perdido contra ${names.join(' y ')}!`);
      }
      this.pbLoseMoney();
      if (!this.canLose) this.pbDisplayPaused('¡Estás fuera de combate!');
    }
    if (this.decision === 4) this.pbGainMoney();
    for (const b of this.battlers) {
      if (!b) continue;
      this.pbCancelChoice(b.index);
      if (b.pokemon && b.abilityActive()) AbilityEffects.triggerOnSwitchOut(b.ability, b, true);
    }
    this.party1.forEach((pkmn, i) => {
      if (!pkmn) return;
      makeUnmega(this.db, pkmn);
      const max = calcStats(this.db, pkmn).hp;
      if (pkmn.hp > max) pkmn.hp = max;
      pkmn.heldItem = this.initialItems[0][i];
      if (pkmn.status === 'POISON' && pkmn.statusCount > 0) pkmn.statusCount = 0; // tóxico pasa a veneno
    });
  },

  pbDecisionOnTime() {
    const counts = [0, 0];
    const hp = [0, 0];
    for (const side of [0, 1]) {
      for (const p of this.pbParty(side)) {
        if (!this.able(p)) continue;
        counts[side] += 1;
        hp[side] += p.hp;
      }
    }
    if (counts[0] > counts[1]) return 1;
    if (counts[0] < counts[1]) return 2;
    if (hp[0] > hp[1]) return 1;
    if (hp[0] < hp[1]) return 2;
    return 5;
  },

  pbJudge() {
    const f1 = this.pbAllFainted(0);
    const f2 = this.pbAllFainted(1);
    if (f1 && f2) this.decision = 5;
    else if (f1) this.decision = 2;
    else if (f2) this.decision = 1;
  },

  /** Resultado del combate para el llamador (equipos actualizados, dinero, captura…). */
  buildResult() {
    const playerCount = this.party1starts.length > 1 ? this.party1starts[1] : this.party1.length;
    const playerParty = this.party1.slice(0, playerCount);
    const pendingEvolutions = [];
    const levelUps = [];
    playerParty.forEach((pkmn, i) => {
      if (!pkmn) return;
      const before = this.levelsBefore[i];
      if (pkmn.level > before) levelUps.push({ partyIndex: i, from: before, to: pkmn.level });
      const canCheck = Settings.CHECK_EVOLUTION_AFTER_ALL_BATTLES || this.decision === 1;
      if (!canCheck || pkmn.level <= before) return;
      if (pkmn.hp <= 0 && !Settings.CHECK_EVOLUTION_FOR_FAINTED_POKEMON) return;
      const target = evolutionTarget(this.db, pkmn, { trigger: 'level', isDay: this.config.isDay });
      if (target) pendingEvolutions.push({ partyIndex: i, species: target });
    });
    return {
      outcome: DECISION_OUTCOME[this.decision] || 'forfeit',
      decision: this.decision,
      turns: this.turnCount,
      playerParty,
      allyParty: this.party1starts.length > 1 ? this.party1.slice(playerCount) : null,
      caught: this.caughtPokemon[0] || null,
      caughtAll: [...this.caughtPokemon],
      moneyChange: this.moneyChange,
      money: this.player[0].money,
      bag: { ...this.bag },
      itemsUsed: { ...this.itemsUsed },
      pendingEvolutions,
      levelUps,
      seen: [...this.seen],
      defeated: [...this.defeated],
      phase: { ...this.phaseState },
      log: [...this.log],
    };
  },
});
