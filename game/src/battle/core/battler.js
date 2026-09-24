// Combatiente activo (Battle::Battler de Essentials 21.1, 029_Battler/002-003).
// Envuelve un objeto Pokémon (copia del combate) y añade etapas, efectos y consultas.
// Los métodos de estado, estadísticas, uso de movimientos, etc. se añaden como mixins
// (battlerStatus.js, battlerStats.js, …) para mantener los archivos pequeños.
import { speciesData, calcStats, NATURE_BY_ID } from './pokemon.js';
import { BATTLE_STATS, STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS } from './constants.js';
import { BATTLER_EFFECTS, BATON_PASS_EFFECTS, DamageState } from './effects.js';
import { Settings } from './settings.js';
import { createMove } from './moves/registry.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { alphaStats, isMegaPokemon, megaFormFor } from './pokemonUtil.js';

const UNSTOPPABLE_ABILITIES = new Set([
  'BATTLEBOND', 'DISGUISE', 'GULPMISSILE', 'ICEFACE', 'MULTITYPE', 'POWERCONSTRUCT', 'SCHOOLING', 'SHIELDSDOWN',
  'STANCECHANGE', 'ZENMODE', 'ZEROTOHERO', 'TERASHIFT', 'ASONECHILLINGNEIGH', 'ASONEGRIMNEIGH', 'COMATOSE', 'RKSSYSTEM',
]);
const UNGAINABLE_ABILITIES = new Set([
  'BATTLEBOND', 'DISGUISE', 'FLOWERGIFT', 'FORECAST', 'GULPMISSILE', 'ICEFACE', 'MULTITYPE', 'POWERCONSTRUCT',
  'SCHOOLING', 'SHIELDSDOWN', 'STANCECHANGE', 'ZENMODE', 'ILLUSION', 'IMPOSTER', 'ASONECHILLINGNEIGH',
  'ASONEGRIMNEIGH', 'COMATOSE', 'RKSSYSTEM', 'NEUTRALIZINGGAS', 'WONDERGUARD', 'HUNGERSWITCH', 'COMMANDER',
  'PROTOSYNTHESIS', 'QUARKDRIVE', 'ZEROTOHERO', 'TERASHIFT', 'TERAFORMZERO', 'POISONPUPPETEER',
]);

export class Battler {
  constructor(battle, index) {
    this.battle = battle;
    this.index = index;
    this.captured = false;
    this.dummy = false;
    this.stages = {};
    this.effects = {};
    this.damageState = new DamageState();
    this.pbInitBlank();
    this.pbInitEffects(false);
  }

  get db() { return this.battle.db; }

  // ---------------------------------------------------------------- creación
  pbInitBlank() {
    this.name = '';
    this.species = null;
    this._form = 0;
    this._level = 0;
    this._hp = 0;
    this.totalhp = 0;
    this.types = [];
    this.abilityId = null;
    this.itemId = null;
    this.attack = this._defense = this.spatk = this._spdef = this.speed = 0;
    this._status = 'NONE';
    this._statusCount = 0;
    this.pokemon = null;
    this.pokemonIndex = -1;
    this.participants = [];
    this.moves = [];
    this.fainted = true;
  }

  /** Solo para Premonición cuando el usuario ya no está en combate. */
  pbInitDummyPokemon(pkmn, idxParty) {
    this.pbInitPokemon(pkmn, idxParty);
    this.abilityId = null;
    this.itemId = null;
    this.moves = [];
    this.dummy = true;
  }

  pbInitialize(pkmn, idxParty, batonPass = false) {
    this.recalled = false;
    this.pbInitPokemon(pkmn, idxParty);
    this.pbInitEffects(batonPass);
    this.damageState.reset();
  }

  pbInitPokemon(pkmn, idxParty) {
    this.pokemon = pkmn;
    this.pokemonIndex = idxParty;
    this.name = this.battle.pokemonName(pkmn);
    this.species = pkmn.species;
    this._form = pkmn.form || 0;
    this._level = pkmn.level;
    const st = this.calcPokemonStats();
    this.totalhp = st.hp;
    if (pkmn.hp > st.hp) pkmn.hp = st.hp;
    this._hp = pkmn.hp;
    this.types = [...speciesData(this.db, pkmn.species, this._form).types];
    this.abilityId = pkmn.ability || null;
    this.itemId = pkmn.heldItem || null;
    this.attack = st.atk;
    this._defense = st.def;
    this.spatk = st.spa;
    this._spdef = st.spd;
    this.speed = st.spe;
    this._status = pkmn.status || 'NONE';
    this._statusCount = pkmn.statusCount || 0;
    this.participants = [];
    this.moves = (pkmn.moves || []).map((m) => createMove(this.battle, m));
  }

  calcPokemonStats() {
    return alphaStats(calcStats(this.db, this.pokemon), this.pokemon);
  }

  refreshMoves() {
    this.moves = (this.pokemon.moves || []).map((m) => createMove(this.battle, m));
  }

  pbInitEffects(batonPass) {
    const e = this.effects;
    if (batonPass) {
      e.LaserFocus = e.LaserFocus > 0 ? 2 : 0;
      e.LockOn = e.LockOn > 0 ? 2 : 0;
      if (e.PowerTrick) [this.attack, this._defense] = [this._defense, this.attack];
      if (this.unstoppableAbility()) e.GastroAcid = false;
    } else {
      for (const s of BATTLE_STATS) this.stages[s] = 0;
      Object.assign(e, BATON_PASS_EFFECTS);
    }
    this.fainted = this._hp === 0;
    this.lastAttacker = [];
    this.lastFoeAttacker = [];
    this.lastHPLost = 0;
    this.lastHPLostFromFoe = 0;
    this.droppedBelowHalfHP = false;
    this.droppedBelowThirdHP = false;
    this.statsDropped = false;
    this.tookMoveDamageThisRound = false;
    this.tookDamageThisRound = false;
    this.tookPhysicalHit = false;
    this.statsRaisedThisRound = false;
    this.statsLoweredThisRound = false;
    this.canRestoreIceFace = false;
    this.lastMoveUsed = null;
    this.lastMoveUsedType = null;
    this.lastRegularMoveUsed = null;
    this.lastRegularMoveTarget = -1;
    this.lastRoundMoved = -1;
    this.lastMoveFailed = false;
    this.lastRoundMoveFailed = false;
    this.movesUsed = [];
    this.turnCount = 0;
    this.currentMove = null;
    for (const [k, v] of Object.entries(BATTLER_EFFECTS)) e[k] = v;
    const others = this.battle.allBattlers ? this.battle.allBattlers() : [];
    for (const b of others) {
      if (b === this) continue;
      if (b.effects.Attract === this.index) b.effects.Attract = -1;
      if (b.effects.JawLock === this.index) b.effects.JawLock = -1;
      if (b.effects.MeanLook === this.index) b.effects.MeanLook = -1;
      if (b.effects.Octolock === this.index) b.effects.Octolock = -1;
      if (b.effects.SkyDrop === this.index) b.effects.SkyDrop = -1;
      if (b.effects.LockOn > 0 && b.effects.LockOnPos === this.index) {
        b.effects.LockOn = 0;
        b.effects.LockOnPos = -1;
      }
      if (b.effects.TrappingUser === this.index) {
        b.effects.Trapping = 0;
        b.effects.TrappingUser = -1;
      }
      if (b.effects.SyrupyUser === this.index) {
        b.effects.Syrupy = 0;
        b.effects.SyrupyUser = -1;
      }
    }
    if (this.pokemon && this.hasActiveAbility('ILLUSION')) {
      const idxLast = this.battle.pbLastInTeam(this.index);
      if (idxLast >= 0 && idxLast !== this.pokemonIndex) e.Illusion = this.battle.pbParty(this.index)[idxLast];
    }
    this.proteanTrigger = false;
    this.mirrorHerbUsed = false;
  }

  /** Recalcula estadísticas tras subir de nivel, cambiar de forma o megaevolucionar. */
  pbUpdate(fullChange = false) {
    if (!this.pokemon) return;
    const st = this.calcPokemonStats();
    this._level = this.pokemon.level;
    this.totalhp = st.hp;
    this._hp = Math.min(this.pokemon.hp, st.hp);
    this.pokemon.hp = this._hp;
    if (!this.effects.Transform) {
      this.attack = st.atk;
      this._defense = st.def;
      this.spatk = st.spa;
      this._spdef = st.spd;
      this.speed = st.spe;
      if (fullChange) {
        this.types = [...speciesData(this.db, this.pokemon.species, this.pokemon.form).types];
        this.abilityId = this.pokemon.ability;
      }
    }
  }

  /** Borra el combatiente de un Pokémon capturado. */
  pbReset() {
    this.pokemon = null;
    this.pokemonIndex = -1;
    this._hp = 0;
    this.pbInitEffects(false);
    this.participants = [];
    this._status = 'NONE';
    this._statusCount = 0;
    this.battle.pbClearChoice(this.index);
  }

  pbUpdateParticipants() {
    if (this.isFainted() || !this.battle.opposes(this.index)) return;
    for (const b of this.allOpposing()) {
      if (!this.participants.includes(b.pokemonIndex)) this.participants.push(b.pokemonIndex);
    }
  }

  // ---------------------------------------------------------------- accesores
  get level() { return this._level; }
  set level(v) { this._level = v; if (this.pokemon) this.pokemon.level = v; }
  get form() { return this._form; }
  set form(v) { this._form = v; if (this.pokemon) this.pokemon.form = v; }
  get ability() { return this.abilityId; }
  set ability(v) { this.abilityId = v || null; }
  get item() { return this.itemId; }
  set item(v) { this.itemId = v || null; if (this.pokemon) this.pokemon.heldItem = this.itemId; }
  get defense() { return this.battle.field.effects.WonderRoom > 0 ? this._spdef : this._defense; }
  set defense(v) { this._defense = v; }
  get spdef() { return this.battle.field.effects.WonderRoom > 0 ? this._defense : this._spdef; }
  set spdef(v) { this._spdef = v; }
  get hp() { return this._hp; }
  set hp(v) {
    this._hp = Math.trunc(v);
    if (this.pokemon) this.pokemon.hp = this._hp;
  }
  isFainted() { return this._hp <= 0; }
  get status() { return this._status; }
  set status(v) {
    if (this._status === 'SLEEP' && v !== 'SLEEP') this.effects.Truant = false;
    if (v !== 'POISON' || this._statusCount === 0) this.effects.Toxic = 0;
    this._status = v || 'NONE';
    if (this.pokemon) this.pokemon.status = this._status === 'NONE' ? null : this._status;
    if (v !== 'POISON' && v !== 'SLEEP') this.statusCount = 0;
  }
  get statusCount() { return this._statusCount; }
  set statusCount(v) {
    this._statusCount = v;
    if (this.pokemon) this.pokemon.statusCount = v;
  }

  get happiness() { return this.pokemon ? this.pokemon.happiness : 0; }
  /** 0 macho, 1 hembra, 2 sin género (convención de Essentials). */
  get gender() {
    const g = this.pokemon ? this.pokemon.gender : null;
    return g === 'M' ? 0 : g === 'F' ? 1 : 2;
  }
  get nature() { return this.pokemon ? NATURE_BY_ID[this.pokemon.nature] : null; }
  get speciesData() { return speciesData(this.db, this.species, this.form); }

  hasMega() {
    if (this.effects.Transform || !this.pokemon) return false;
    return megaFormFor(this.db, this.pokemon) > 0 && !this.mega();
  }
  mega() { return !!this.pokemon && isMegaPokemon(this.db, this.pokemon); }
  hasPrimal() { return false; }
  primal() { return false; }
  shadowPokemon() { return false; }
  inHyperMode() { return false; }
  isCommander() { return !!(this.effects.Commander && this.effects.Commander.length === 1); }
  isCommanderHost() { return !!(this.effects.Commander && this.effects.Commander.length === 2); }

  get displayName() {
    return this.effects.Illusion ? this.battle.pokemonName(this.effects.Illusion) : this.name;
  }
  get displaySpecies() { return this.effects.Illusion ? this.effects.Illusion.species : this.species; }
  get displayForm() { return this.effects.Illusion ? this.effects.Illusion.form || 0 : this.form; }
  shiny() { return this.effects.Illusion ? !!this.effects.Illusion.shiny : !!(this.pokemon && this.pokemon.shiny); }

  abilityName() { return this.battle.abilityName(this.abilityId); }
  itemName() { return this.battle.itemName(this.itemId); }

  /** Nombre para mensajes: "Pikachu", "el Pikachu salvaje", "el Pikachu rival", "el Pikachu aliado". */
  pbThis(lowerCase = false) {
    const n = this.displayName;
    if (this.opposes()) {
      if (this.battle.trainerBattle()) return lowerCase ? `el ${n} rival` : `El ${n} rival`;
      return lowerCase ? `el ${n} salvaje` : `El ${n} salvaje`;
    }
    if (!this.pbOwnedByPlayer()) return lowerCase ? `el ${n} aliado` : `El ${n} aliado`;
    return n;
  }

  pbTeam(lowerCase = false) {
    if (this.opposes()) return lowerCase ? 'el equipo rival' : 'El equipo rival';
    return lowerCase ? 'tu equipo' : 'Tu equipo';
  }

  pbOpposingTeam(lowerCase = false) {
    if (this.opposes()) return lowerCase ? 'tu equipo' : 'Tu equipo';
    return lowerCase ? 'el equipo rival' : 'El equipo rival';
  }

  // ---------------------------------------------------------------- valores calculados
  pbSpeed() {
    if (this.isFainted()) return 1;
    const stage = this.stages.SPEED + STAT_STAGE_MAXIMUM;
    const speed = Math.floor((this.speed * STAT_STAGE_MULTIPLIERS[stage]) / STAT_STAGE_DIVISORS[stage]);
    let mult = 1.0;
    if (this.abilityActive()) mult = AbilityEffects.triggerSpeedCalc(this.ability, this, mult);
    if (this.itemActive()) mult = ItemEffects.triggerSpeedCalc(this.item, this, mult);
    if (this.pbOwnSide().effects.Tailwind > 0) mult *= 2;
    if (this.pbOwnSide().effects.Swamp > 0) mult /= 2;
    if (this.status === 'PARALYSIS' && !this.hasActiveAbility('QUICKFEET')) mult /= 2;
    return Math.max(Math.round(speed * mult), 1);
  }

  /** Peso en décimas de kg (unidades de Essentials). */
  pbWeight() {
    let ret = this.pokemon ? Math.round(speciesData(this.db, this.species, this.form).weight * 10) : 500;
    ret += this.effects.WeightChange;
    if (ret < 1) ret = 1;
    if (this.abilityActive() && !this.battle.moldBreaker) ret = AbilityEffects.triggerWeightCalc(this.ability, this, ret);
    if (this.itemActive()) ret = ItemEffects.triggerWeightCalc(this.item, this, ret);
    return Math.max(ret, 1);
  }

  plainStats() {
    return { ATTACK: this.attack, DEFENSE: this.defense, SPECIAL_ATTACK: this.spatk, SPECIAL_DEFENSE: this.spdef, SPEED: this.speed };
  }

  isSpecies(species) { return !!this.pokemon && this.pokemon.species === species; }

  pbTypes(withExtraType = false) {
    let ret = [...new Set(this.types)];
    if (this.effects.BurnUp) ret = ret.filter((t) => t !== 'FIRE');
    if (this.effects.Roost) {
      ret = ret.filter((t) => t !== 'FLYING');
      if (ret.length === 0) ret.push('NORMAL');
    }
    if (withExtraType && this.effects.ExtraType && !ret.includes(this.effects.ExtraType)) ret.push(this.effects.ExtraType);
    if (this.effects.DoubleShock) ret = ret.filter((t) => t !== 'ELECTRIC');
    return ret;
  }

  pbHasType(type) { return !!type && this.pbTypes(true).includes(type); }
  pbHasOtherType(type) { return !!type && this.pbTypes(true).filter((t) => t !== type).length > 0; }

  abilityActive(ignoreFainted = false, checkAbility = null) {
    if (this.isFainted() && !ignoreFainted) return false;
    if (!this.abilityId) return false;
    if (this.proteanTrigger && this.abilityId === this.effects.OneUseAbility) {
      if (!checkAbility || checkAbility === this.abilityId) return false;
    }
    if (this.effects.GastroAcid) return false;
    if (checkAbility !== 'NEUTRALIZINGGAS' && this.abilityId !== 'NEUTRALIZINGGAS' &&
        this.battle.pbCheckGlobalAbility('NEUTRALIZINGGAS')) return false;
    return true;
  }

  hasActiveAbility(check, ignoreFainted = false) {
    if (!this.abilityActive(ignoreFainted, check)) return false;
    if (Array.isArray(check)) return check.includes(this.abilityId);
    return this.abilityId === check;
  }

  unstoppableAbility(abil = null) { return UNSTOPPABLE_ABILITIES.has(abil || this.abilityId); }
  ungainableAbility(abil = null) { return UNGAINABLE_ABILITIES.has(abil || this.abilityId); }
  uncopyableAbility(abil = null) {
    const a = abil || this.abilityId;
    return this.ungainableAbility(a) || ['POWEROFALCHEMY', 'RECEIVER', 'TRACE'].includes(a);
  }

  itemActive(ignoreFainted = false) {
    if (this.isFainted() && !ignoreFainted) return false;
    if (!this.itemId) return false;
    if (this.effects.Embargo > 0) return false;
    if (this.battle.field.effects.MagicRoom > 0) return false;
    if (this.battle.corrosiveGas[this.index & 1][this.pokemonIndex]) return false;
    if (this.hasActiveAbility('KLUTZ', ignoreFainted)) return false;
    return true;
  }

  hasActiveItem(check, ignoreFainted = false) {
    if (!this.itemActive(ignoreFainted)) return false;
    if (Array.isArray(check)) return check.includes(this.itemId);
    return this.itemId === check;
  }

  /** Objetos que no se pueden perder (megapiedra de su especie, cartas…). */
  unlosableItem(checkItem) {
    if (!checkItem) return false;
    const data = this.db.items[checkItem];
    if (!data) return false;
    if ((data.flags || []).includes('Mail')) return true;
    if (this.effects.Transform) return false;
    const sp = this.db.species[this.species];
    if (sp && sp.forms) {
      for (const f of Object.values(sp.forms)) if (f.megaStone === checkItem) return true;
    }
    if (checkItem === 'GRISEOUSORB' && this.isSpecies('GIRATINA')) return true;
    if (/PLATE$/.test(checkItem) && this.ability === 'MULTITYPE') return true;
    return false;
  }

  eachMove(fn) { this.moves.forEach(fn); }
  pbHasMove(moveId) { return !!moveId && this.moves.some((m) => m.id === moveId); }
  pbHasMoveType(type) { return !!type && this.moves.some((m) => m.type === type); }
  pbHasMoveFunction(...codes) { return this.moves.some((m) => codes.includes(m.functionCode)); }
  pbGetMoveWithID(moveId) { return this.moves.find((m) => m.id === moveId) || null; }

  hasMoldBreaker() { return this.hasActiveAbility(['MOLDBREAKER', 'TERAVOLT', 'TURBOBLAZE']); }
  canChangeType() { return !['MULTITYPE', 'RKSSYSTEM'].includes(this.abilityId); }

  airborne() {
    if (this.hasActiveItem('IRONBALL')) return false;
    if (this.effects.Ingrain || this.effects.SmackDown) return false;
    if (this.battle.field.effects.Gravity > 0) return false;
    if (this.pbHasType('FLYING')) return true;
    if (this.hasActiveAbility('LEVITATE') && !this.battle.moldBreaker) return true;
    if (this.hasActiveItem('AIRBALLOON')) return true;
    if (this.effects.MagnetRise > 0 || this.effects.Telekinesis > 0) return true;
    return false;
  }

  affectedByTerrain() { return !this.airborne() && !this.semiInvulnerable(); }

  takesIndirectDamage(showMsg = false) {
    if (this.isFainted()) return false;
    if (this.hasActiveAbility('MAGICGUARD')) {
      if (showMsg) {
        this.battle.pbShowAbilitySplash(this);
        this.battle.pbDisplay(`¡No afecta a ${this.pbThis(true)}!`);
        this.battle.pbHideAbilitySplash(this);
      }
      return false;
    }
    return true;
  }

  takesSandstormDamage() {
    if (!this.takesIndirectDamage()) return false;
    if (this.pbHasType('GROUND') || this.pbHasType('ROCK') || this.pbHasType('STEEL')) return false;
    if (this.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderground', 'TwoTurnAttackInvulnerableUnderwater')) return false;
    if (this.hasActiveAbility(['OVERCOAT', 'SANDFORCE', 'SANDRUSH', 'SANDVEIL'])) return false;
    if (this.hasActiveItem('SAFETYGOGGLES')) return false;
    return true;
  }

  takesHailDamage() {
    if (Settings.HAIL_WEATHER_TYPE === 1) return false; // Nieve: no daña
    if (!this.takesIndirectDamage() || this.pbHasType('ICE')) return false;
    if (this.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderground', 'TwoTurnAttackInvulnerableUnderwater')) return false;
    if (this.hasActiveAbility(['OVERCOAT', 'ICEBODY', 'SNOWCLOAK'])) return false;
    if (this.hasActiveItem('SAFETYGOGGLES')) return false;
    return true;
  }

  effectiveWeather() {
    const w = this.battle.pbWeather();
    if (['Sun', 'Rain', 'HarshSun', 'HeavyRain'].includes(w) && this.hasActiveItem('UTILITYUMBRELLA')) return 'None';
    return w;
  }

  affectedByPowder(showMsg = false) {
    if (this.isFainted()) return false;
    if (this.pbHasType('GRASS') && Settings.MORE_TYPE_EFFECTS) {
      if (showMsg) this.battle.pbDisplay(`¡No afecta a ${this.pbThis(true)}!`);
      return false;
    }
    if (this.hasActiveAbility('OVERCOAT') && !this.battle.moldBreaker) {
      if (showMsg) {
        this.battle.pbShowAbilitySplash(this);
        this.battle.pbDisplay(`¡No afecta a ${this.pbThis(true)}!`);
        this.battle.pbHideAbilitySplash(this);
      }
      return false;
    }
    if (this.hasActiveItem('SAFETYGOGGLES')) {
      if (showMsg) this.battle.pbDisplay(`¡No afecta a ${this.pbThis(true)} gracias a su ${this.itemName()}!`);
      return false;
    }
    return true;
  }

  canHeal() {
    if (this.isFainted() || this.hp >= this.totalhp) return false;
    return this.effects.HealBlock === 0;
  }

  affectedByContactEffect(showMsg = false) {
    if (this.isFainted()) return false;
    if (this.hasActiveItem('PROTECTIVEPADS')) {
      if (showMsg) this.battle.pbDisplay(`¡${this.pbThis()} se ha protegido gracias a ${this.itemName()}!`);
      return false;
    }
    return true;
  }

  trappedInBattle() {
    const e = this.effects;
    if (e.Commander || e.Trapping > 0 || e.MeanLook >= 0 || e.JawLock >= 0 || e.Octolock >= 0 || e.Ingrain || e.NoRetreat) return true;
    if (this.battle.allBattlers().some((b) => b.effects.JawLock === this.index)) return true;
    return this.battle.field.effects.FairyLock > 0;
  }

  movedThisRound() { return this.lastRoundMoved >= 0 && this.lastRoundMoved === this.battle.turnCount; }

  usingMultiTurnAttack() {
    const e = this.effects;
    return !!(e.TwoTurnAttack || e.HyperBeam > 0 || e.Rollout > 0 || e.Outrage > 0 || e.Uproar > 0 || e.Bide > 0);
  }

  inTwoTurnAttack(...codes) {
    if (!this.effects.TwoTurnAttack) return false;
    const data = this.db.moves[this.effects.TwoTurnAttack];
    const code = data ? data.functionCode.split(',')[0] : null;
    return codes.includes(code);
  }

  semiInvulnerable() {
    return this.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableUnderground',
      'TwoTurnAttackInvulnerableUnderwater', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
      'TwoTurnAttackInvulnerableRemoveProtections', 'TwoTurnAttackInvulnerableInSkyTargetCannotAct');
  }

  pbEncoredMoveIndex() {
    if (this.effects.Encore === 0 || !this.effects.EncoreMove) return -1;
    return this.moves.findIndex((m) => m.id === this.effects.EncoreMove);
  }

  get initialItem() { return this.battle.initialItems[this.index & 1][this.pokemonIndex] || null; }
  setInitialItem(v) { this.battle.initialItems[this.index & 1][this.pokemonIndex] = v || null; }
  get recycleItem() { return this.battle.recycleItems[this.index & 1][this.pokemonIndex] || null; }
  setRecycleItem(v) { this.battle.recycleItems[this.index & 1][this.pokemonIndex] = v || null; }
  belched() { return !!this.battle.belch[this.index & 1][this.pokemonIndex]; }
  setBelched() { this.battle.belch[this.index & 1][this.pokemonIndex] = true; }
  abilityTriggered() { return this.battle.pbAbilityTriggered(this); }
  numFaintedAllies() { return this.battle.pbFaintedAllyCount(this.index); }

  // ---------------------------------------------------------------- posición
  opposes(i = 0) {
    const idx = typeof i === 'object' && i !== null ? i.index : i;
    return (this.index & 1) !== (idx & 1);
  }
  near(i) { return this.battle.nearBattlers(this.index, typeof i === 'object' ? i.index : i); }
  pbOwnedByPlayer() { return this.battle.pbOwnedByPlayer(this.index); }
  wild() { return this.battle.wildBattle() && this.opposes(); }
  idxOwnSide() { return this.index & 1; }
  idxOpposingSide() { return (this.index & 1) ^ 1; }
  pbOwnSide() { return this.battle.sides[this.idxOwnSide()]; }
  pbOpposingSide() { return this.battle.sides[this.idxOpposingSide()]; }
  allAllies() { return this.battle.allSameSideBattlers(this.index).filter((b) => b.index !== this.index); }
  allOpposing() { return this.battle.allOtherSideBattlers(this.index); }

  pbDirectOpposing(unfaintedOnly = false) {
    const order = this.battle.pbGetOpposingIndicesInOrder(this.index);
    for (const i of order) {
      const b = this.battle.battlers[i];
      if (!b) continue;
      if (unfaintedOnly && b.isFainted()) continue;
      return b;
    }
    for (const i of order) if (this.battle.battlers[i]) return this.battle.battlers[i];
    return this.battle.battlers[this.index ^ 1];
  }

  /** Instantánea para la presentación (BattlerView). */
  view() {
    const pk = this.pokemon;
    return {
      index: this.index,
      side: this.index & 1,
      ownedByPlayer: this.pbOwnedByPlayer(),
      wild: this.wild(),
      partyIndex: this.pokemonIndex,
      name: this.displayName,
      species: this.displaySpecies,
      form: this.displayForm,
      level: this.level,
      hp: this.hp,
      totalhp: this.totalhp,
      status: this.status,
      toxic: this.status === 'POISON' && this.statusCount > 0,
      gender: pk ? pk.gender : null,
      shiny: this.shiny(),
      alpha: !!(pk && pk.alpha),
      mega: this.mega(),
      types: this.pbTypes(true),
      ability: this.abilityId,
      abilityName: this.abilityName(),
      item: this.itemId,
      stages: { ...this.stages },
      fainted: this.isFainted(),
    };
  }
}
