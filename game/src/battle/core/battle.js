// Combate (Battle de Essentials 21.1, 028_Battle/002). Núcleo: estado, equipos, posiciones,
// clima/campo, cola de mensajes y decisiones. El resto de fases se añade como mixins en
// battleStart.js, battleCommand.js, battleAttack.js, battleSwitch.js, battleEndOfRound.js,
// battleExp.js, battleItems.js, battleCatch.js y bossPhases.js.
import { normalizeConfig } from './battleConfig.js';
import { newField, newSide } from './effects.js';
import { randomInt } from './rng.js';
import { speciesData } from './pokemon.js';
import { ItemEffects } from './items/registry.js';
import { createStruggle } from './moves/registry.js';
import { WEATHER_NAMES } from './constants.js';
import { BattleAI } from './ai/battleAI.js';
import { contractArticles } from '../../shared/spanish.js';

const WEATHER_START = {
  Sun: '¡El sol pega fuerte!',
  Rain: '¡Ha empezado a llover!',
  Sandstorm: '¡Se ha desatado una tormenta de arena!',
  Hail: '¡Ha empezado a nevar!',
  HarshSun: '¡El sol que hace ahora es realmente abrasador!',
  HeavyRain: '¡Ha empezado a diluviar!',
  StrongWinds: '¡Las misteriosas turbulencias protegen a los Pokémon de tipo Volador!',
};
const TERRAIN_START = {
  Electric: '¡Se ha formado un campo de corriente eléctrica en el terreno de combate!',
  Grassy: '¡El terreno de combate se ha cubierto de hierba!',
  Misty: '¡La niebla ha envuelto el terreno de combate!',
  Psychic: '¡El terreno de combate se ha vuelto muy extraño!',
};

/**
 * Corrige contracciones del castellano en mensajes generados ("de el" → "del", "a el" → "al", también con el
 * artículo de pbThis() en mayúscula: "de El Nacli rival" → "del Nacli rival"). Ver shared/spanish.js.
 */
export function fixSpanish(text) {
  return contractArticles(text);
}

export class Battle {
  /**
   * @param {object} config  ver battleConfig.js / ARCHITECTURE §7 (incluye config.db y config.rng|seed)
   * @param {import('./battleUI.js').BattleUI} ui
   */
  constructor(config, ui) {
    if (!ui || typeof ui.message !== 'function') throw new Error('Battle necesita una BattleUI (ver battle/core/battleUI.js)');
    const cfg = normalizeConfig(config);
    this.config = cfg;
    this.db = cfg.db;
    this.rng = cfg.rng;
    this.ui = ui;
    this.rules = cfg.rules;
    this.field = newField();
    this.sides = [newSide(), newSide()];
    this.positions = [];
    this.battlers = [];
    this.sideSizes = cfg.format === 'double' ? [2, 2] : [1, 1];
    this.environment = cfg.environment;
    this.time = cfg.time;
    this.turnCount = 0;
    this.decision = 0;
    this.caughtPokemon = [];
    this.internalBattle = true;
    // Combate enlazado (online, battle/link/linkBattle.js): qué entrenador del bando 0 es «el jugador» en ESTA pantalla.
    this.localOwner = 0;
    this.link = null;
    this.canRun = cfg.rules.canRun !== false;
    this.canLose = !!cfg.rules.canLose;
    this.canSwitch = cfg.rules.canSwitch !== false;
    this.switchStyle = true;
    this.controlPlayer = !!cfg.rules.controlPlayer;
    this.expGain = cfg.rules.expGain !== false;
    this.moneyGain = cfg.rules.moneyGain !== false;
    this.disablePokeBalls = !!cfg.rules.disablePokeBalls;
    // Entrenadores y equipos (bando 0: jugador [+ aliado]; bando 1: rivales o salvajes)
    this.player = [{ ...cfg.player, isPlayer: true }];
    this.party1 = [...cfg.player.party];
    this.party1starts = [0];
    if (cfg.ally) {
      this.player.push({ ...cfg.ally, isPlayer: false });
      this.party1starts.push(this.party1.length);
      this.party1.push(...cfg.ally.party);
    }
    this.opponent = cfg.type === 'trainer' ? cfg.opponents.map((o) => ({ ...o })) : null;
    this.party2 = [];
    this.party2starts = [];
    for (const o of cfg.opponents) {
      this.party2starts.push(this.party2.length);
      this.party2.push(...o.party);
    }
    this.party1order = this.party1.map((_, i) => i);
    this.party2order = this.party2.map((_, i) => i);
    this.bag = cfg.player.bag;
    this.itemsUsed = {};
    this.items = this.opponent ? this.opponent.map((o) => [...o.items]) : null;
    this.initialItems = [this.party1.map((p) => p.heldItem || null), this.party2.map((p) => p.heldItem || null)];
    this.recycleItems = [this.party1.map(() => null), this.party2.map(() => null)];
    this.belch = [this.party1.map(() => false), this.party2.map(() => false)];
    this.corrosiveGas = [this.party1.map(() => false), this.party2.map(() => false)];
    this.usedInBattle = [this.party1.map(() => false), this.party2.map(() => false)];
    this.abilsTriggered = [this.party1.map(() => false), this.party2.map(() => false)];
    this.rageHitCount = [this.party1.map(() => 0), this.party2.map(() => 0)];
    this.battleBond = [this.party1.map(() => false), this.party2.map(() => false)];
    this.faintedCount = [0, 0];
    this.sideStatUps = [{}, {}];
    this.levelsBefore = this.party1.map((p) => p.level);
    this.choices = [];
    this.megaEvolution = [this.player.map(() => -1), (this.opponent || [null]).map(() => -1)];
    this.priority = [];
    this.priorityTrickRoom = false;
    this.lastMoveUsed = null;
    this.lastMoveUser = -1;
    this.firstPokeBall = null;
    this.pokeBallFailed = false;
    this.switching = false;
    this.futureSight = false;
    this.commandPhase = false;
    this.endOfRound = false;
    this.moldBreaker = false;
    this.runCommand = 0;
    this._nextPickupUse = 0;
    this.pendingReplacements = [];
    this.struggle = createStruggle(this);
    this.queue = [];
    this.moneyChange = 0;
    this.phaseState = { index: 0, total: cfg.phases.length, target: cfg.phaseTarget };
    this.log = [];
    this.field.weather = cfg.weather;
    this.field.defaultWeather = 'None';
    this.field.weatherDuration = cfg.weather !== 'None' ? -1 : 0;
    this.field.terrain = cfg.terrain;
    this.field.terrainDuration = cfg.terrain !== 'None' ? -1 : 0;
    if (cfg.rules.defaultWeather) this.defaultWeather = cfg.rules.defaultWeather;
    this.ai = new BattleAI(this);
  }

  // ---------------------------------------------------------------- aleatoriedad
  pbRandom(n) { return randomInt(this.rng, n); }
  pbAIRandom(n) { return randomInt(this.rng, n); }

  // ---------------------------------------------------------------- nombres y datos
  pokemonName(pkmn) {
    if (!pkmn) return '';
    return pkmn.nickname || (this.db.species[pkmn.species] ? this.db.species[pkmn.species].name : pkmn.species);
  }
  abilityName(id) { return id ? (this.db.abilities && this.db.abilities[id] ? this.db.abilities[id].name : id) : ''; }
  itemName(id) { return id ? (this.db.items[id] ? this.db.items[id].name : id) : ''; }
  typeName(id) { return id ? (this.db.types[id] ? this.db.types[id].name : id) : ''; }
  moveName(id) { return id ? (this.db.moves[id] ? this.db.moves[id].name : id) : ''; }
  itemData(id) { return id ? this.db.items[id] || null : null; }
  itemHasFlag(id, flag) { const d = this.itemData(id); return !!(d && (d.flags || []).includes(flag)); }
  isBerry(id) { return this.itemHasFlag(id, 'Berry'); }
  isPokeBall(id) { return this.itemHasFlag(id, 'PokeBall'); }
  isMegaStone(id) { return this.itemHasFlag(id, 'MegaStone'); }
  speciesOf(pkmn) { return speciesData(this.db, pkmn.species, pkmn.form || 0); }

  // ---------------------------------------------------------------- tipo y tamaño
  wildBattle() { return this.opponent === null; }
  trainerBattle() { return this.opponent !== null; }
  singleBattle() { return this.pbSideSize(0) === 1 && this.pbSideSize(1) === 1; }
  pbSideSize(index) { return this.sideSizes[index % 2]; }
  maxBattlerIndex() {
    return this.pbSideSize(0) > this.pbSideSize(1) ? (this.pbSideSize(0) - 1) * 2 : this.pbSideSize(1) * 2 - 1;
  }

  // ---------------------------------------------------------------- dueños
  pbGetOwnerIndexFromBattlerIndex(idxBattler) {
    const trainer = this.opposes(idxBattler) ? this.opponent : this.player;
    if (!trainer) return 0;
    if (trainer.length === 2) return Math.floor(idxBattler / 2);
    return 0;
  }
  pbGetOwnerFromBattlerIndex(idxBattler) {
    const trainer = this.opposes(idxBattler) ? this.opponent : this.player;
    return trainer ? trainer[this.pbGetOwnerIndexFromBattlerIndex(idxBattler)] : null;
  }
  pbGetOwnerIndexFromPartyIndex(idxBattler, idxParty) {
    let ret = -1;
    this.pbPartyStarts(idxBattler).forEach((start, i) => { if (start <= idxParty) ret = i; });
    return ret;
  }
  pbGetOwnerName(idxBattler) {
    const t = this.pbGetOwnerFromBattlerIndex(idxBattler);
    return t ? t.name : '';
  }
  pbGetOwnerItems(idxBattler) {
    if (this.opposes(idxBattler)) return this.items ? this.items[this.pbGetOwnerIndexFromBattlerIndex(idxBattler)] || [] : [];
    return [];
  }
  pbIsOwner(idxBattler, idxParty) {
    return this.pbGetOwnerIndexFromBattlerIndex(idxBattler) === this.pbGetOwnerIndexFromPartyIndex(idxBattler, idxParty);
  }
  pbOwnedByPlayer(idxBattler) {
    if (this.opposes(idxBattler)) return false;
    return this.pbGetOwnerIndexFromBattlerIndex(idxBattler) === this.localOwner;
  }
  /**
   * Índice canónico de un combatiente: el mismo en las dos simulaciones de un combate online entre jugadores (cada una
   * se ve a sí misma en el bando 0, así que los bandos van cambiados). Fuera de línea es el mismo índice.
   */
  canonicalIndex(idx) { return this.link?.mirror ? idx ^ 1 : idx; }
  /** ¿Se anuncia la información de una habilidad (Alerta, Cacheo…)? Online, siempre: mismo azar en ambos lados. */
  pbRevealsAbilityInfo(battler) { return this.link ? true : battler.pbOwnedByPlayer(); }
  pbNumPositions(side, idxTrainer) {
    let ret = 0;
    for (let i = 0; i < this.pbSideSize(side); i++) if (this.pbGetOwnerIndexFromBattlerIndex(i * 2 + side) === idxTrainer) ret += 1;
    return ret;
  }

  // ---------------------------------------------------------------- equipos
  pbParty(idxBattler) { return this.opposes(idxBattler) ? this.party2 : this.party1; }
  pbOpposingParty(idxBattler) { return this.opposes(idxBattler) ? this.party1 : this.party2; }
  pbPartyOrder(idxBattler) { return this.opposes(idxBattler) ? this.party2order : this.party1order; }
  pbPartyStarts(idxBattler) { return this.opposes(idxBattler) ? this.party2starts : this.party1starts; }
  able(pkmn) { return !!pkmn && pkmn.hp > 0 && !pkmn.egg; }
  pbAbleCount(idxBattler = 0) { return this.pbParty(idxBattler).filter((p) => this.able(p)).length; }
  pbAllFainted(idxBattler = 0) { return this.pbAbleCount(idxBattler) === 0; }
  pbAbleNonActiveCount(idxBattler = 0) {
    const inBattle = this.allSameSideBattlers(idxBattler).map((b) => b.pokemonIndex);
    return this.pbParty(idxBattler).filter((p, i) => this.able(p) && !inBattle.includes(i)).length;
  }
  pbTeamIndexRangeFromBattlerIndex(idxBattler) {
    const starts = this.pbPartyStarts(idxBattler);
    const idxTrainer = this.pbGetOwnerIndexFromBattlerIndex(idxBattler);
    const start = starts[idxTrainer] ?? 0;
    const end = idxTrainer < starts.length - 1 ? starts[idxTrainer + 1] : this.pbParty(idxBattler).length;
    return [start, end];
  }
  eachInTeamFromBattlerIndex(idxBattler, fn) {
    const [start, end] = this.pbTeamIndexRangeFromBattlerIndex(idxBattler);
    this.pbParty(idxBattler).forEach((p, i) => { if (p && i >= start && i < end) fn(p, i); });
  }
  eachInTeam(side, idxTrainer, fn) {
    const party = this.pbParty(side);
    const starts = this.pbPartyStarts(side);
    const start = starts[idxTrainer] ?? 0;
    const end = idxTrainer < starts.length - 1 ? starts[idxTrainer + 1] : party.length;
    party.forEach((p, i) => { if (p && i >= start && i < end) fn(p, i); });
  }
  pbAbleTeamCounts(side) {
    const ret = [];
    const starts = this.pbPartyStarts(side);
    starts.forEach((_, t) => {
      let n = 0;
      this.eachInTeam(side, t, (p) => { if (this.able(p)) n += 1; });
      ret.push(n);
    });
    return ret;
  }
  pbLastInTeam(idxBattler) {
    const party = this.pbParty(idxBattler);
    const orders = this.pbPartyOrder(idxBattler);
    const [start, end] = this.pbTeamIndexRangeFromBattlerIndex(idxBattler);
    let ret = -1;
    party.forEach((p, i) => {
      if (i < start || i >= end || !this.able(p)) return;
      if (ret < 0 || orders[i] > orders[ret]) ret = i;
    });
    return ret;
  }
  pbMaxLevelInTeam(side, idxTrainer) {
    let ret = 1;
    this.eachInTeam(side, idxTrainer, (p) => { if (p.level > ret) ret = p.level; });
    return ret;
  }

  // ---------------------------------------------------------------- combatientes
  allBattlers() { return this.battlers.filter((b) => b && !b.isFainted()); }
  allSameSideBattlers(idx = 0) {
    const i = typeof idx === 'object' ? idx.index : idx;
    return this.battlers.filter((b) => b && !b.isFainted() && !b.opposes(i));
  }
  allOtherSideBattlers(idx = 0) {
    const i = typeof idx === 'object' ? idx.index : idx;
    return this.battlers.filter((b) => b && !b.isFainted() && b.opposes(i));
  }
  pbSideBattlerCount(idx = 0) { return this.allSameSideBattlers(idx).length; }
  pbOpposingBattlerCount(idx = 0) { return this.allOtherSideBattlers(idx).length; }
  pbCheckGlobalAbility(abil) {
    for (const b of this.allBattlers()) if (b.hasActiveAbility(abil)) return b;
    return null;
  }
  pbCheckOpposingAbility(abil, idxBattler = 0, nearOnly = false) {
    for (const b of this.allOtherSideBattlers(idxBattler)) {
      if (nearOnly && !b.near(idxBattler)) continue;
      if (b.hasActiveAbility(abil)) return b;
    }
    return null;
  }
  pbGetOpposingIndicesInOrder(idxBattler) {
    const s0 = this.pbSideSize(0);
    const s1 = this.pbSideSize(1);
    if (s0 === 1 && s1 === 1) return this.opposes(idxBattler) ? [0] : [1];
    if (s0 === 1 && s1 === 2) return this.opposes(idxBattler) ? [0] : [3, 1];
    if (s0 === 2 && s1 === 1) return this.opposes(idxBattler) ? [0, 2] : [1];
    if (s0 === 2 && s1 === 2) return [[3, 1], [2, 0], [1, 3], [0, 2]][idxBattler];
    return [idxBattler ^ 1];
  }
  opposes(a, b = 0) {
    const i1 = typeof a === 'object' && a !== null ? a.index : a;
    const i2 = typeof b === 'object' && b !== null ? b.index : b;
    return (i1 & 1) !== (i2 & 1);
  }
  nearBattlers(i1, i2) {
    if (i1 === i2) return false;
    return true; // hasta 2 contra 2 todos son adyacentes
  }
  pbFindBattler(idxParty, idxBattlerOther = 0) {
    return this.allSameSideBattlers(idxBattlerOther).find((b) => b.pokemonIndex === idxParty) || null;
  }
  pbThisEx(idxBattler, idxParty) {
    const pk = this.pbParty(idxBattler)[idxParty];
    const n = this.pokemonName(pk);
    if (this.opposes(idxBattler)) return this.trainerBattle() ? `El ${n} rival` : `El ${n} salvaje`;
    if (!this.pbOwnedByPlayer(idxBattler)) return `El ${n} aliado`;
    return n;
  }
  pbRemoveFromParty(idxBattler, idxParty) {
    const party = this.pbParty(idxBattler);
    party[idxParty] = null;
  }
  pbSwapBattlers(idxA, idxB) {
    const A = this.battlers[idxA];
    const B = this.battlers[idxB];
    if (!A || !B || this.opposes(idxA, idxB)) return false;
    if (this.pbGetOwnerIndexFromBattlerIndex(idxA) !== this.pbGetOwnerIndexFromBattlerIndex(idxB)) return false;
    this.battlers[idxA] = B;
    this.battlers[idxB] = A;
    B.index = idxA;
    A.index = idxB;
    [this.choices[idxA], this.choices[idxB]] = [this.choices[idxB], this.choices[idxA]];
    const keys = ['Attract', 'BideTarget', 'CounterTarget', 'JawLock', 'LockOnPos', 'MeanLook', 'MirrorCoatTarget', 'Octolock', 'SkyDrop', 'TrappingUser'];
    for (const b of this.allBattlers()) {
      for (const k of keys) {
        if (b.effects[k] === idxA) b.effects[k] = idxB;
        else if (b.effects[k] === idxB) b.effects[k] = idxA;
      }
    }
    this.queueEvent('swapBattlers', idxA, idxB);
    return true;
  }
  nextPickupUse() {
    this._nextPickupUse += 1;
    return this._nextPickupUse;
  }
  pbAbilityTriggered(b) { return !!this.abilsTriggered[b.index & 1][b.pokemonIndex]; }
  pbSetAbilityTrigger(b, v = true) { this.abilsTriggered[b.index & 1][b.pokemonIndex] = v; }
  pbAddRageHit(b, v = 1) { this.rageHitCount[b.index & 1][b.pokemonIndex] += v; }
  pbRageHitCount(b) { return this.rageHitCount[b.index & 1][b.pokemonIndex]; }
  pbAddFaintedAlly(idx) { if (this.faintedCount[idx & 1] < 100) this.faintedCount[idx & 1] += 1; }
  pbFaintedAllyCount(idx) { return this.faintedCount[idx & 1]; }

  // ---------------------------------------------------------------- Pokédex
  pbSetSeen(battler) {
    const sp = battler && battler.displaySpecies ? battler.displaySpecies : battler && battler.species;
    if (sp) this.seen.add(sp);
  }
  pbSetCaught(pkmn) { if (pkmn) this.caughtSet.add(pkmn.species); }
  pbSetDefeated(battler) { if (battler) this.defeated.push(battler.species); }
  get seen() { return this._seen || (this._seen = new Set()); }
  get caughtSet() { return this._caught || (this._caught = new Set()); }
  get defeated() { return this._defeated || (this._defeated = []); }

  // ---------------------------------------------------------------- felicidad
  changeHappiness(pkmn, method) {
    if (!pkmn) return;
    const h = pkmn.happiness ?? 70;
    const range = h >= 200 ? 2 : h >= 100 ? 1 : 0;
    const table = {
      levelup: [5, 4, 3], battleitem: [1, 1, 0], faint: [-1, -1, -1], faintbad: [-5, -5, -10],
      powder: [-5, -5, -10], energyroot: [-10, -10, -15], revivalherb: [-15, -15, -20],
    };
    let gain = (table[method] || [0, 0, 0])[range];
    if (gain > 0) {
      if (pkmn.ball === 'LUXURYBALL') gain += 1;
      if (pkmn.heldItem === 'SOOTHEBELL') gain = Math.floor(gain * 1.5);
    }
    pkmn.happiness = Math.max(0, Math.min(255, h + gain));
  }

  // ---------------------------------------------------------------- clima
  set defaultWeather(value) {
    this.field.defaultWeather = value;
    this.field.weather = value;
    this.field.weatherDuration = -1;
  }

  pbWeather() {
    if (this.allBattlers().some((b) => b.hasActiveAbility(['CLOUDNINE', 'AIRLOCK']))) return 'None';
    return this.field.weather;
  }

  pbStartWeather(user, newWeather, fixedDuration = false, showAnim = true) {
    if (this.field.weather === newWeather) return;
    this.field.weather = newWeather;
    let duration = fixedDuration ? 5 : -1;
    if (duration > 0 && user && user.itemActive()) {
      duration = ItemEffects.triggerWeatherExtender(user.item, this.field.weather, duration, user, this);
    }
    this.field.weatherDuration = duration;
    if (showAnim) this.pbCommonAnimation(`Weather:${newWeather}`);
    if (user) this.pbHideAbilitySplash(user);
    if (WEATHER_START[newWeather]) this.pbDisplay(WEATHER_START[newWeather]);
    this.queueEvent('weather', newWeather);
    for (const b of this.allBattlers()) b.pbCheckFormOnWeatherChange();
    this.pbEndPrimordialWeather();
  }

  pbEndPrimordialWeather() {
    const old = this.field.weather;
    if (old === 'HarshSun' && !this.pbCheckGlobalAbility('DESOLATELAND')) {
      this.field.weather = 'None';
      this.pbDisplay('¡El sol vuelve a brillar como siempre!');
    } else if (old === 'HeavyRain' && !this.pbCheckGlobalAbility('PRIMORDIALSEA')) {
      this.field.weather = 'None';
      this.pbDisplay('¡Ha dejado de diluviar!');
    } else if (old === 'StrongWinds' && !this.pbCheckGlobalAbility('DELTASTREAM')) {
      this.field.weather = 'None';
      this.pbDisplay('¡Las misteriosas turbulencias han amainado!');
    }
    if (this.field.weather !== old) {
      for (const b of this.allBattlers()) b.pbCheckFormOnWeatherChange();
      if (this.field.defaultWeather !== 'None') this.pbStartWeather(null, this.field.defaultWeather);
    }
  }

  pbStartWeatherAbility(newWeather, battler, ignorePrimal = false) {
    if (!ignorePrimal && ['HarshSun', 'HeavyRain', 'StrongWinds'].includes(this.field.weather)) return;
    if (this.field.weather === newWeather) return;
    this.pbShowAbilitySplash(battler);
    const fixed = !['HarshSun', 'HeavyRain', 'StrongWinds'].includes(newWeather);
    this.pbStartWeather(battler, newWeather, fixed);
  }

  weatherName(w) { return WEATHER_NAMES[w] || w; }

  // ---------------------------------------------------------------- campo
  set defaultTerrain(value) {
    this.field.defaultTerrain = value;
    this.field.terrain = value;
    this.field.terrainDuration = -1;
  }

  pbStartTerrain(user, newTerrain, fixedDuration = true) {
    if (this.field.terrain === newTerrain) return;
    this.field.terrain = newTerrain;
    let duration = fixedDuration ? 5 : -1;
    if (duration > 0 && user && user.itemActive()) {
      duration = ItemEffects.triggerTerrainExtender(user.item, newTerrain, duration, user, this);
    }
    this.field.terrainDuration = duration;
    this.pbCommonAnimation(`Terrain:${newTerrain}`);
    if (user) this.pbHideAbilitySplash(user);
    if (TERRAIN_START[newTerrain]) this.pbDisplay(TERRAIN_START[newTerrain]);
    this.queueEvent('terrain', newTerrain);
    for (const b of this.allBattlers()) b.pbAbilityOnTerrainChange();
    for (const b of this.allBattlers()) b.pbItemTerrainStatBoostCheck();
  }

  weatherStartMessage(w) { return WEATHER_START[w] || null; }
  terrainStartMessage(t) { return TERRAIN_START[t] || null; }

  // ---------------------------------------------------------------- cola de presentación
  /** Encola un evento de presentación: se entrega a la UI en orden al vaciar la cola. */
  queueEvent(type, ...args) {
    this.queue.push({ type, args });
  }

  queueRefresh(battler) {
    if (battler && battler.pokemon) this.queueEvent('refresh', battler.view());
  }

  pbDisplay(msg) {
    const text = fixSpanish(msg);
    this.log.push(text);
    this.queue.push({ type: 'message', args: [text, {}] });
  }
  pbDisplayBrief(msg) {
    const text = fixSpanish(msg);
    this.log.push(text);
    this.queue.push({ type: 'message', args: [text, { brief: true }] });
  }
  pbDisplayPaused(msg) {
    const text = fixSpanish(msg);
    this.log.push(text);
    this.queue.push({ type: 'message', args: [text, { paused: true }] });
  }

  pbAnimation(moveId, user, targets, hitNum = 0) {
    const ts = (Array.isArray(targets) ? targets : [targets]).filter(Boolean);
    this.queueEvent('animateMove', user ? user.view() : null, moveId, ts.map((t) => t.view()), hitNum);
  }

  pbCommonAnimation(name, user = null, targets = null) {
    const ts = targets ? (Array.isArray(targets) ? targets : [targets]).filter(Boolean).map((t) => t.view()) : [];
    this.queueEvent('animateCommon', name, user ? user.view() : null, ts);
  }

  pbShowAbilitySplash(battler, delay = false) {
    if (!battler) return;
    this.queueEvent('abilitySplash', battler.view(), true);
  }

  pbHideAbilitySplash(battler) {
    if (!battler) return;
    this.queueEvent('abilitySplash', battler.view(), false);
  }

  pbReplaceAbilitySplash(battler) {
    if (battler) this.queueEvent('abilitySplash', battler.view(), true);
  }

  /** Entrega a la UI todos los eventos pendientes, en orden. */
  async flush() {
    while (this.queue.length > 0) {
      const ev = this.queue.shift();
      const fn = this.ui[ev.type];
      if (typeof fn !== 'function') continue;
      try {
        await fn.apply(this.ui, ev.args);
      } catch (err) {
        console.error(`[combate] Error en la UI al procesar "${ev.type}":`, err);
      }
    }
  }

  /** Pide una decisión a la UI tras vaciar la cola. */
  async ask(method, ...args) {
    await this.flush();
    const fn = this.ui[method];
    if (typeof fn !== 'function') throw new Error(`La BattleUI no implementa ${method}()`);
    return fn.apply(this.ui, args);
  }

  async pbDisplayConfirm(msg) {
    this.pbDisplay(msg);
    return !!(await this.ask('confirm', fixSpanish(msg)));
  }

  /** Estado completo para la presentación (inicio del combate / refrescos). */
  snapshot() {
    return {
      type: this.wildBattle() ? 'wild' : 'trainer',
      format: this.config.format,
      sideSizes: [...this.sideSizes],
      battlers: this.battlers.map((b) => (b && b.pokemon ? b.view() : null)),
      player: this.player.map((t) => ({ name: t.name, trainerType: t.trainerType })),
      opponent: this.opponent ? this.opponent.map((t) => ({ name: t.name, trainerType: t.trainerType })) : null,
      weather: this.field.weather,
      terrain: this.field.terrain,
      battleback: this.config.battleback,
      turn: this.turnCount,
      partyCounts: [this.partyStatus(0), this.partyStatus(1)],
    };
  }

  /** Resumen del equipo para las bolitas de Poké Ball: 'ok' | 'status' | 'fainted' | 'empty'. */
  partyStatus(side) {
    return this.pbParty(side).map((p) => (!p ? 'empty' : p.hp <= 0 ? 'fainted' : p.status ? 'status' : 'ok'));
  }
}
