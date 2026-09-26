// Battle: experiencia, EV y aprendizaje de movimientos (028_Battle/004).
// Fórmula escalada de gen 5/7+ (SCALED_EXP_FORMULA) sin reparto (gen 6+) y Repartir Exp. tipo gen 6+.
import { Battle } from './battle.js';
import { Settings } from './settings.js';
import { ItemEffects } from './items/registry.js';
import {
  speciesData, expForLevel, levelForExp, calcStats, movesLearnedAtLevel, MAX_LEVEL, MAX_EV_STAT, MAX_EV_TOTAL, STATS,
} from './pokemon.js';
import { evYield } from './pokemonUtil.js';

Object.assign(Battle.prototype, {
  /**
   * Entrenadores del bando 0 que ganan experiencia: el jugador; en un combate en equipo online (battle.link) también
   * el compañero humano, en las dos simulaciones por igual.
   */
  expOwners() {
    return this.link?.mode === 'coop' ? this.player.map((_t, i) => i) : [0];
  },

  async pbGainExp() {
    if (!this.internalBattle || !this.expGain) return;
    for (const b of this.battlers) {
      if (!b || !b.opposes()) continue;
      if (b.participants.length === 0) continue;
      if (!(b.isFainted() || b.captured)) continue;
      if (!b.pokemon) continue;
      for (const owner of this.expOwners()) await this.pbGainExpFrom(b, owner);
      b.participants = [];
    }
  },

  /** Experiencia del rival derrotado `b` para el equipo del entrenador `owner` del bando 0. */
  async pbGainExpFrom(b, owner) {
    const p1 = this.pbParty(0);
    const expAll = !!this.player[owner].expAll || (owner === 0 && (this.bag.EXPALL || 0) > 0);
    const ownsParty = (idx) => this.pbGetOwnerIndexFromPartyIndex(0, idx) === owner;
    let numPartic = 0;
    for (const idx of b.participants) if (this.able(p1[idx]) && ownsParty(idx)) numPartic += 1;
    const expShare = [];
    if (!expAll) {
      this.eachInTeam(0, owner, (pkmn, i) => {
        if (!this.able(pkmn)) return;
        if (pkmn.heldItem !== 'EXPSHARE' && this.initialItems[0][i] !== 'EXPSHARE') return;
        expShare.push(i);
      });
    }
    if (numPartic === 0 && expShare.length === 0 && !expAll) return;
    const gainers = [];
    this.eachInTeam(0, owner, (pkmn, i) => {
      if (!this.able(pkmn)) return;
      if (!b.participants.includes(i) && !expShare.includes(i)) return;
      gainers.push(i);
    });
    for (const i of gainers) {
      this.pbGainEVsOne(i, b);
      await this.pbGainExpOne(i, b, numPartic, expShare, expAll, b.participants.includes(i), owner);
    }
    const mine = owner === this.localOwner;
    if (mine && expShare.length > numPartic && p1.length > 1) {
      this.pbDisplayPaused('¡Tus otros Pokémon también ganaron puntos de experiencia!');
    }
    if (!expAll) return;
    let showMessage = mine;
    const others = [];
    this.eachInTeam(0, owner, (pkmn, i) => {
      if (!this.able(pkmn) || b.participants.includes(i) || expShare.includes(i)) return;
      others.push(i);
    });
    for (const i of others) {
      if (showMessage) this.pbDisplayPaused('¡Tus otros Pokémon también ganaron puntos de experiencia!');
      showMessage = false;
      this.pbGainEVsOne(i, b);
      await this.pbGainExpOne(i, b, numPartic, expShare, expAll, false, owner);
    }
  },

  pbGainEVsOne(idxParty, defeated) {
    const pkmn = this.pbParty(0)[idxParty];
    const yieldEv = evYield(this.db, defeated.pokemon);
    if (!ItemEffects.triggerEVGainModifier(pkmn.heldItem, pkmn, yieldEv)) {
      ItemEffects.triggerEVGainModifier(this.initialItems[0][idxParty], pkmn, yieldEv);
    }
    if (pkmn.pokerus) for (const k of Object.keys(yieldEv)) yieldEv[k] *= 2;
    let total = STATS.reduce((a, s) => a + (pkmn.evs[s] || 0), 0);
    const evs = { ...pkmn.evs };
    for (const s of STATS) {
      let gain = Math.max(0, Math.min(yieldEv[s] || 0, MAX_EV_STAT - (evs[s] || 0)));
      gain = Math.max(0, Math.min(gain, MAX_EV_TOTAL - total));
      evs[s] = (evs[s] || 0) + gain;
      total += gain;
    }
    pkmn.evs = evs;
  },

  async pbGainExpOne(idxParty, defeated, numPartic, expShare, expAll, showMessages = true, owner = 0) {
    const pkmn = this.pbParty(0)[idxParty];
    const sp = speciesData(this.db, pkmn.species, pkmn.form);
    const maxExp = expForLevel(sp.growthRate, MAX_LEVEL);
    const battler = this.pbFindBattler(idxParty);
    if (pkmn.exp >= maxExp) {
      if (battler) battler.pbUpdate(false);
      return;
    }
    const isPartic = defeated.participants.includes(idxParty);
    const hasExpShare = expShare.includes(idxParty);
    const level = defeated.level;
    const baseExp = speciesData(this.db, defeated.pokemon.species, defeated.pokemon.form).baseExp || 0;
    let exp = 0;
    const a = level * baseExp;
    if (expShare.length > 0 && (isPartic || hasExpShare)) {
      if (numPartic === 0) exp = Math.floor(a / (Settings.SPLIT_EXP_BETWEEN_GAINERS ? expShare.length : 1));
      else if (Settings.SPLIT_EXP_BETWEEN_GAINERS) {
        if (isPartic) exp = Math.floor(a / (2 * numPartic));
        if (hasExpShare) exp += Math.floor(a / (2 * expShare.length));
      } else {
        exp = isPartic ? a : Math.floor(a / 2);
      }
    } else if (isPartic) {
      exp = Math.floor(a / (Settings.SPLIT_EXP_BETWEEN_GAINERS ? numPartic : 1));
    } else if (expAll) {
      exp = Math.floor(a / 2);
    }
    if (exp <= 0) return;
    if (Settings.MORE_EXP_FROM_TRAINER_POKEMON && this.trainerBattle()) exp = Math.floor(exp * 1.5);
    if (Settings.SCALED_EXP_FORMULA) {
      exp = Math.floor(exp / 5);
      let levelAdjust = (2 * level + 10.0) / (pkmn.level + level + 10.0);
      levelAdjust = Math.sqrt(levelAdjust ** 5);
      exp = Math.floor(exp * levelAdjust);
      if (isPartic || hasExpShare) exp += 1;
    } else {
      exp = Math.floor(exp / 7);
    }
    const playerId = this.player[owner]?.id;
    const isOutsider = !!(pkmn.ot && playerId != null && pkmn.ot.id != null && pkmn.ot.id !== playerId);
    if (isOutsider) exp = Math.floor(exp * 1.5);
    if (owner === 0 && (this.bag.EXPCHARM || 0) > 0) exp = Math.floor((exp * 3) / 2);
    let mod = ItemEffects.triggerExpGainModifier(pkmn.heldItem, pkmn, exp);
    if (mod < 0) mod = ItemEffects.triggerExpGainModifier(this.initialItems[0][idxParty], pkmn, exp);
    if (mod >= 0) exp = mod;
    const expFinal = Math.min(pkmn.exp + exp, maxExp);
    const expGained = expFinal - pkmn.exp;
    if (expGained <= 0) return;
    if (showMessages) {
      this.pbDisplayPaused(isOutsider
        ? `¡${this.pokemonName(pkmn)} ha ganado ${expGained} puntos de experiencia extra!`
        : `¡${this.pokemonName(pkmn)} ha ganado ${expGained} puntos de experiencia!`);
    }
    let curLevel = pkmn.level;
    const newLevel = levelForExp(sp.growthRate, expFinal);
    let tempExp1 = pkmn.exp;
    for (;;) {
      const levelMinExp = expForLevel(sp.growthRate, curLevel);
      const levelMaxExp = expForLevel(sp.growthRate, curLevel + 1);
      const tempExp2 = levelMaxExp < expFinal ? levelMaxExp : expFinal;
      pkmn.exp = tempExp2;
      this.queueEvent('expGain', this.pokemonView(pkmn), battler ? battler.view() : null, tempExp1, tempExp2, levelMinExp, levelMaxExp);
      tempExp1 = tempExp2;
      curLevel += 1;
      if (curLevel > newLevel) {
        if (battler) battler.pbUpdate(false);
        break;
      }
      // Subida de nivel
      const oldStats = calcStats(this.db, pkmn);
      const oldMax = oldStats.hp;
      pkmn.level = curLevel;
      this.changeHappiness(pkmn, 'levelup');
      const newStats = calcStats(this.db, pkmn);
      if (pkmn.hp > 0) pkmn.hp = Math.min(newStats.hp, pkmn.hp + (newStats.hp - oldMax));
      if (battler) {
        battler.pbUpdate(false);
        this.queueRefresh(battler);
      }
      this.pbDisplayPaused(`¡${this.pokemonName(pkmn)} ha subido al nivel ${curLevel}!`);
      this.queueEvent('levelUp', this.pokemonView(pkmn), battler ? battler.view() : null, oldStats, newStats);
      for (const moveId of movesLearnedAtLevel(this.db, pkmn.species, pkmn.form, curLevel)) {
        await this.pbLearnMove(idxParty, moveId);
      }
    }
  },

  /** Copia plana del Pokémon para la UI. */
  pokemonView(pkmn) {
    return JSON.parse(JSON.stringify(pkmn));
  },

  async pbLearnMove(idxParty, newMove) {
    const pkmn = this.pbParty(0)[idxParty];
    if (!pkmn || !this.db.moves[newMove]) return;
    const name = this.pokemonName(pkmn);
    const moveName = this.moveName(newMove);
    const battler = this.pbFindBattler(idxParty);
    if (pkmn.moves.some((m) => m.id === newMove)) return;
    const newEntry = () => ({ id: newMove, pp: this.db.moves[newMove].pp, ppUps: 0 });
    if (pkmn.moves.length < 4) {
      pkmn.moves.push(newEntry());
      this.pbDisplay(`¡${name} ha aprendido ${moveName}!`);
      if (battler) {
        battler.refreshMoves();
        battler.pbCheckFormOnMovesetChange();
      }
      return;
    }
    this.pbDisplayPaused(`${name} quiere aprender ${moveName}, pero ya conoce cuatro movimientos.`);
    const forget = await this.ask('learnMove', this.pokemonView(pkmn), newMove);
    if (forget != null && forget >= 0 && forget < pkmn.moves.length) {
      const oldName = this.moveName(pkmn.moves[forget].id);
      pkmn.moves[forget] = newEntry();
      if (battler) battler.refreshMoves();
      this.pbDisplayPaused('1, 2 y... ... ... ¡puf!');
      this.pbDisplayPaused(`${name} ha olvidado cómo usar ${oldName}. Y...`);
      this.pbDisplay(`¡${name} ha aprendido ${moveName}!`);
      if (battler) battler.pbCheckFormOnMovesetChange();
    } else {
      this.pbDisplay(`${name} no ha aprendido ${moveName}.`);
    }
  },
});
