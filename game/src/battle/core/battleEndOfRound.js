// Battle: fase de final de ronda (028_Battle/012).
import { Battle } from './battle.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { TERRAIN_END_MESSAGES } from './constants.js';

const WEATHER_END = {
  Sun: 'El sol vuelve a brillar como siempre.',
  Rain: 'Ha dejado de llover.',
  Sandstorm: 'La tormenta de arena ha amainado.',
  Hail: 'Ha dejado de nevar.',
};
const WEATHER_CONTINUE = {
  Sun: 'El sol pega fuerte.',
  Rain: 'Sigue lloviendo.',
  Sandstorm: 'La tormenta de arena arrecia.',
  Hail: 'Sigue nevando.',
  HarshSun: 'El sol es realmente abrasador.',
  HeavyRain: 'La lluvia está siendo muy intensa.',
  StrongWinds: 'El aire está lleno de turbulencias.',
};
const TERRAIN_END = TERRAIN_END_MESSAGES;
const TRAPPING_ANIMS = { BIND: 'Bind', CLAMP: 'Clamp', FIRESPIN: 'FireSpin', MAGMASTORM: 'MagmaStorm', SANDTOMB: 'SandTomb', WRAP: 'Wrap', INFESTATION: 'Infestation' };

const hp = (n) => Math.floor(n);

Object.assign(Battle.prototype, {
  pbEOREndWeather(priority) {
    if (this.field.weatherDuration > 0) this.field.weatherDuration -= 1;
    if (this.field.weatherDuration === 0 && this.field.weather !== 'None') {
      if (WEATHER_END[this.field.weather]) this.pbDisplay(WEATHER_END[this.field.weather]);
      this.field.weather = 'None';
      this.queueEvent('weather', 'None');
      for (const b of this.allBattlers()) b.pbCheckFormOnWeatherChange();
      if (this.field.defaultWeather !== 'None') this.pbStartWeather(null, this.field.defaultWeather);
      if (this.field.weather === 'None') return;
    }
    if (this.field.weather === 'None') return;
    this.pbCommonAnimation(`Weather:${this.field.weather}`);
    if (WEATHER_CONTINUE[this.field.weather]) this.pbDisplay(WEATHER_CONTINUE[this.field.weather]);
    for (const b of priority) {
      if (b.abilityActive()) {
        AbilityEffects.triggerEndOfRoundWeather(b.ability, b.effectiveWeather(), b, this);
        if (b.isFainted()) b.pbFaint();
      }
      this.pbEORWeatherDamage(b);
    }
  },

  pbEORWeatherDamage(battler) {
    if (battler.isFainted()) return;
    const w = battler.effectiveWeather();
    if (w === 'Sandstorm') {
      if (!battler.takesSandstormDamage()) return;
      this.pbDisplay(`¡La tormenta de arena zarandea a ${battler.pbThis(true)}!`);
    } else if (w === 'Hail') {
      if (!battler.takesHailDamage()) return;
      this.pbDisplay(`¡El granizo golpea a ${battler.pbThis(true)}!`);
    } else {
      return;
    }
    battler.pbReduceHP(hp(battler.totalhp / 16), false);
    battler.pbItemHPHealCheck();
    if (battler.isFainted()) battler.pbFaint();
  },

  async pbEORUseFutureSight(position, idxPos) {
    if (!position || position.effects.FutureSightCounter === 0) return;
    position.effects.FutureSightCounter -= 1;
    if (position.effects.FutureSightCounter > 0) return;
    const target = this.battlers[idxPos];
    if (!target || target.isFainted()) return;
    const userIdx = position.effects.FutureSightUserIndex;
    let moveUser = this.allBattlers().find((b) => !b.opposes(userIdx) && b.pokemonIndex === position.effects.FutureSightUserPartyIndex);
    if (moveUser && moveUser.index === idxPos) return;
    if (!moveUser) {
      const pkmn = this.pbParty(userIdx)[position.effects.FutureSightUserPartyIndex];
      if (this.able(pkmn)) {
        const { Battler } = await import('./battler.js');
        moveUser = new Battler(this, userIdx);
        moveUser.pbInitDummyPokemon(pkmn, position.effects.FutureSightUserPartyIndex);
      }
    }
    if (!moveUser) return;
    const moveId = position.effects.FutureSightMove;
    this.pbDisplay(`¡${target.pbThis()} ha sido alcanzado por ${this.moveName(moveId)}!`);
    const lastFailed = moveUser.lastMoveFailed;
    this.futureSight = true;
    await moveUser.pbUseMoveSimple(moveId, idxPos);
    this.futureSight = false;
    moveUser.lastMoveFailed = lastFailed;
    if (target.isFainted()) target.pbFaint();
    position.effects.FutureSightCounter = 0;
    position.effects.FutureSightMove = null;
    position.effects.FutureSightUserIndex = -1;
    position.effects.FutureSightUserPartyIndex = -1;
  },

  pbEORWishHealing() {
    this.positions.forEach((pos, idx) => {
      if (!pos || pos.effects.Wish === 0) return;
      pos.effects.Wish -= 1;
      if (pos.effects.Wish > 0) return;
      const b = this.battlers[idx];
      if (!b || !b.canHeal()) return;
      const maker = this.pbThisEx(idx, pos.effects.WishMaker);
      b.pbRecoverHP(pos.effects.WishAmount);
      this.pbDisplay(`¡El deseo de ${maker} se ha hecho realidad!`);
    });
  },

  pbEORSeaOfFireDamage(priority) {
    for (const side of [0, 1]) {
      const s = this.sides[side].effects;
      if (s.SeaOfFire === 0) continue;
      s.SeaOfFire -= 1;
      if (s.SeaOfFire === 0) continue;
      for (const b of priority) {
        if (b.opposes(side) || !b.takesIndirectDamage() || b.pbHasType('FIRE')) continue;
        b.pbTakeEffectDamage(hp(b.totalhp / 8), false, () => this.pbDisplay(`¡El mar de llamas ha dañado a ${b.pbThis(true)}!`));
      }
    }
  },

  pbEORTerrainHealing(b) {
    if (b.isFainted()) return;
    if (this.field.terrain === 'Grassy' && b.affectedByTerrain() && b.canHeal()) {
      b.pbRecoverHP(hp(b.totalhp / 16));
      this.pbDisplay(`¡${b.pbThis()} ha recuperado PS!`);
    }
  },

  pbEORHealingEffects(priority) {
    for (const b of priority) {
      if (!b.effects.AquaRing || !b.canHeal()) continue;
      let gain = hp(b.totalhp / 16);
      if (b.hasActiveItem('BIGROOT')) gain = Math.floor(gain * 1.3);
      b.pbRecoverHP(gain);
      this.pbDisplay(`¡${b.pbThis()} ha recuperado algunos PS gracias al manto de agua que rodea su cuerpo!`);
    }
    for (const b of priority) {
      if (!b.effects.Ingrain || !b.canHeal()) continue;
      let gain = hp(b.totalhp / 16);
      if (b.hasActiveItem('BIGROOT')) gain = Math.floor(gain * 1.3);
      b.pbRecoverHP(gain);
      this.pbDisplay(`¡${b.pbThis()} ha absorbido nutrientes gracias a sus raíces!`);
    }
    for (const b of priority) {
      if (b.effects.LeechSeed < 0 || !b.takesIndirectDamage()) continue;
      const recipient = this.battlers[b.effects.LeechSeed];
      if (!recipient || recipient.isFainted()) continue;
      this.pbCommonAnimation('LeechSeed', recipient, b);
      b.pbTakeEffectDamage(hp(b.totalhp / 8), true, (lost) => {
        recipient.pbRecoverHPFromDrain(lost, b, `¡Las drenadoras han restado salud a ${b.pbThis(true)}!`);
        recipient.pbAbilitiesOnDamageTaken();
      });
      if (recipient.isFainted()) recipient.pbFaint();
    }
  },

  pbEORStatusProblemDamage(priority) {
    for (const b of priority) {
      if (b.isFainted() || b.status !== 'POISON') continue;
      if (b.statusCount > 0) b.effects.Toxic = Math.min(16, b.effects.Toxic + 1);
      if (b.hasActiveAbility('POISONHEAL')) {
        if (b.canHeal()) {
          this.pbShowAbilitySplash(b);
          b.pbRecoverHP(hp(b.totalhp / 8));
          this.pbDisplay(`${b.pbThis()} ha recuperado PS.`);
          this.pbHideAbilitySplash(b);
        }
      } else if (b.takesIndirectDamage()) {
        b.droppedBelowHalfHP = false;
        b.droppedBelowThirdHP = false;
        let dmg = hp(b.totalhp / 8);
        if (b.statusCount > 0) dmg = hp((b.totalhp * b.effects.Toxic) / 16);
        b.pbContinueStatus(() => b.pbReduceHP(dmg, false));
        b.pbItemHPHealCheck();
        b.pbAbilitiesOnDamageTaken();
        if (b.isFainted()) b.pbFaint();
        b.droppedBelowHalfHP = false;
        b.droppedBelowThirdHP = false;
      }
    }
    for (const b of priority) {
      if (b.status !== 'BURN' || !b.takesIndirectDamage()) continue;
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
      let dmg = hp(b.totalhp / 16);
      if (b.hasActiveAbility('HEATPROOF')) dmg = Math.round(dmg / 2);
      b.pbContinueStatus(() => b.pbReduceHP(dmg, false));
      b.pbItemHPHealCheck();
      b.pbAbilitiesOnDamageTaken();
      if (b.isFainted()) b.pbFaint();
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
    }
    for (const b of priority) {
      if (b.status !== 'FROSTBITE' || !b.takesIndirectDamage()) continue;
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
      b.pbContinueStatus(() => b.pbReduceHP(hp(b.totalhp / 16), false));
      b.pbItemHPHealCheck();
      b.pbAbilitiesOnDamageTaken();
      if (b.isFainted()) b.pbFaint();
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
    }
  },

  pbEOREffectDamage(priority) {
    for (const b of priority) {
      if (!b.asleep()) b.effects.Nightmare = false;
      if (!b.effects.Nightmare || !b.takesIndirectDamage()) continue;
      b.pbTakeEffectDamage(hp(b.totalhp / 4), true, () => this.pbDisplay(`¡${b.pbThis()} está inmerso en una pesadilla!`));
    }
    for (const b of priority) {
      if (!b.effects.Curse || !b.takesIndirectDamage()) continue;
      b.pbTakeEffectDamage(hp(b.totalhp / 4), true, () => this.pbDisplay(`¡${b.pbThis()} es víctima de una maldición!`));
    }
    for (const b of priority) {
      if (!b.effects.SaltCure || !b.takesIndirectDamage()) continue;
      this.pbCommonAnimation('SaltCure', b);
      const fraction = b.pbHasType('STEEL') || b.pbHasType('WATER') ? 4 : 8;
      b.pbTakeEffectDamage(hp(b.totalhp / fraction), true, () => this.pbDisplay(`¡${b.pbThis()} es dañado por la salazón!`));
    }
  },

  pbEORTrappingDamage(b) {
    if (b.isFainted() || b.effects.Trapping === 0) return;
    b.effects.Trapping -= 1;
    const moveName = this.moveName(b.effects.TrappingMove);
    if (b.effects.Trapping === 0) {
      this.pbDisplay(`¡${b.pbThis()} se liberó de ${moveName}!`);
      return;
    }
    this.pbCommonAnimation(TRAPPING_ANIMS[b.effects.TrappingMove] || 'Wrap', b);
    if (!b.takesIndirectDamage()) return;
    let loss = hp(b.totalhp / 8);
    const trapper = this.battlers[b.effects.TrappingUser];
    if (trapper && trapper.hasActiveItem('BINDINGBAND')) loss = hp(b.totalhp / 6);
    b.pbTakeEffectDamage(loss, false, () => this.pbDisplay(`¡${b.pbThis()} es dañado por ${moveName}!`));
  },

  pbEORCountDownBattlerEffect(priority, effect, onEnd) {
    for (const b of priority) {
      if (b.isFainted() || b.effects[effect] === 0) continue;
      b.effects[effect] -= 1;
      if (b.effects[effect] === 0 && onEnd) onEnd(b);
    }
  },

  pbEOREndBattlerEffects(priority) {
    this.pbEORCountDownBattlerEffect(priority, 'Taunt', (b) => this.pbDisplay(`¡${b.pbThis()} ya se ha olvidado de la mofa!`));
    for (const b of priority) {
      if (b.isFainted() || b.effects.Encore === 0) continue;
      const idx = b.pbEncoredMoveIndex();
      if (idx >= 0) {
        b.effects.Encore -= 1;
        if (b.effects.Encore === 0 || b.moves[idx].pp === 0) {
          b.effects.Encore = 0;
          this.pbDisplay(`¡${b.pbThis()} ya no sufre los efectos de Otra Vez!`);
        }
      } else {
        b.effects.Encore = 0;
        b.effects.EncoreMove = null;
      }
    }
    this.pbEORCountDownBattlerEffect(priority, 'Disable', (b) => {
      b.effects.DisableMove = null;
      this.pbDisplay(`¡El movimiento de ${b.pbThis(true)} ya no está anulado!`);
    });
    this.pbEORCountDownBattlerEffect(priority, 'MagnetRise', (b) => this.pbDisplay(`¡El campo electromagnético de ${b.pbThis(true)} se ha disipado!`));
    this.pbEORCountDownBattlerEffect(priority, 'Telekinesis', (b) => this.pbDisplay(`¡${b.pbThis()} se ha liberado de la telequinesis!`));
    this.pbEORCountDownBattlerEffect(priority, 'HealBlock', (b) => this.pbDisplay(`¡Se han pasado los efectos de Anticura en ${b.pbThis(true)}!`));
    this.pbEORCountDownBattlerEffect(priority, 'Embargo', (b) => {
      this.pbDisplay(`¡${b.pbThis()} ya puede usar objetos de nuevo!`);
      b.pbItemTerrainStatBoostCheck();
    });
    this.pbEORCountDownBattlerEffect(priority, 'Yawn', (b) => { if (b.pbCanSleepYawn()) b.pbSleep(); });
    for (const b of priority) {
      if (b.isFainted() || b.effects.PerishSong === 0) continue;
      b.effects.PerishSong -= 1;
      this.pbDisplay(`¡El contador de ${b.pbThis(true)} bajó a ${b.effects.PerishSong}!`);
      if (b.effects.PerishSong === 0) b.pbReduceHP(b.hp);
      b.pbItemHPHealCheck();
      if (b.isFainted()) b.pbFaint();
    }
  },

  pbEORCountDownSideEffect(side, effect, msg) {
    const s = this.sides[side].effects;
    if (s[effect] <= 0) return;
    s[effect] -= 1;
    if (s[effect] === 0) this.pbDisplay(msg);
  },

  pbEOREndSideEffects(side) {
    const team = side === 0 ? 'tu equipo' : 'el equipo rival';
    this.pbEORCountDownSideEffect(side, 'Reflect', `El efecto de Reflejo en ${team} se ha disipado.`);
    this.pbEORCountDownSideEffect(side, 'LightScreen', `El efecto de Pantalla de Luz en ${team} se ha disipado.`);
    this.pbEORCountDownSideEffect(side, 'Safeguard', `El efecto de Velo Sagrado en ${team} se ha disipado.`);
    this.pbEORCountDownSideEffect(side, 'Mist', `El efecto de Neblina en ${team} se ha disipado.`);
    this.pbEORCountDownSideEffect(side, 'Tailwind', `Ha cesado el Viento Afín de ${team}.`);
    this.pbEORCountDownSideEffect(side, 'LuckyChant', `El conjuro de ${team} se ha desvanecido.`);
    this.pbEORCountDownSideEffect(side, 'Rainbow', `El arcoíris sobre ${team} ha desaparecido.`);
    this.pbEORCountDownSideEffect(side, 'SeaOfFire', `El mar de llamas que rodeaba a ${team} ha desaparecido.`);
    this.pbEORCountDownSideEffect(side, 'Swamp', `El pantano que rodeaba a ${team} ha desaparecido.`);
    this.pbEORCountDownSideEffect(side, 'AuroraVeil', `El efecto de Velo Aurora en ${team} se ha disipado.`);
  },

  pbEORCountDownFieldEffect(effect, msg) {
    const f = this.field.effects;
    if (f[effect] <= 0) return;
    f[effect] -= 1;
    if (f[effect] > 0) return;
    this.pbDisplay(msg);
    if (effect === 'MagicRoom') for (const b of this.pbPriority(true)) b.pbItemTerrainStatBoostCheck();
  },

  pbEOREndFieldEffects() {
    this.pbEORCountDownFieldEffect('TrickRoom', 'Se han restaurado las dimensiones alteradas.');
    this.pbEORCountDownFieldEffect('Gravity', 'La gravedad ha vuelto a su estado normal.');
    this.pbEORCountDownFieldEffect('WaterSportField', 'Los efectos de Hidrochorro han desaparecido.');
    this.pbEORCountDownFieldEffect('MudSportField', 'Los efectos de Chapoteo Lodo han desaparecido.');
    this.pbEORCountDownFieldEffect('WonderRoom', '¡Los efectos de Zona Extraña sobre la Defensa y la Defensa Especial han desaparecido!');
    this.pbEORCountDownFieldEffect('MagicRoom', 'Los efectos de Zona Mágica sobre los objetos han desaparecido.');
  },

  pbEOREndTerrain() {
    if (this.field.terrainDuration > 0) this.field.terrainDuration -= 1;
    if (this.field.terrain !== 'None' && this.field.terrainDuration === 0) {
      if (TERRAIN_END[this.field.terrain]) this.pbDisplay(TERRAIN_END[this.field.terrain]);
      this.field.terrain = 'None';
      this.queueEvent('terrain', 'None');
      for (const b of this.allBattlers()) b.pbAbilityOnTerrainChange();
      if (this.field.defaultTerrain !== 'None') this.pbStartTerrain(null, this.field.defaultTerrain, false);
      if (this.field.terrain === 'None') return;
    }
  },

  pbEOREndBattlerSelfEffects(b) {
    if (b.isFainted()) return;
    if (b.effects.Uproar > 0) {
      b.effects.Uproar -= 1;
      this.pbDisplay(b.effects.Uproar === 0 ? `${b.pbThis()} se ha calmado.` : `¡${b.pbThis()} ha montado un alboroto!`);
    }
    if (b.effects.SlowStart > 0) {
      b.effects.SlowStart -= 1;
      if (b.effects.SlowStart === 0) this.pbDisplay(`¡${b.pbThis()} finalmente actúa con todo su potencial!`);
    }
    if (b.effects.Syrupy > 0) {
      this.pbCommonAnimation('Syrupy', b);
      b.effects.Syrupy -= 1;
      if (b.pbCanLowerStatStage('SPEED')) b.pbLowerStatStage('SPEED', 1, b);
      if (b.effects.Syrupy === 0) this.pbDisplay(`¡${b.pbThis()} se liberó del caramelo pegajoso!`);
    }
  },

  async pbEndOfRoundPhase() {
    this.endOfRound = true;
    this.pbCalculatePriority();
    const priority = this.pbPriority(true).filter((b) => !b.isFainted());
    this.pbEOREndWeather(priority);
    for (let i = 0; i < this.positions.length; i++) await this.pbEORUseFutureSight(this.positions[i], i);
    this.pbEORWishHealing();
    this.pbEORSeaOfFireDamage(priority);
    for (const b of priority) {
      this.pbEORTerrainHealing(b);
      if (b.abilityActive()) AbilityEffects.triggerEndOfRoundHealing(b.ability, b, this);
      if (b.itemActive()) ItemEffects.triggerEndOfRoundHealing(b.item, b, this);
    }
    this.pbEORHealingEffects(priority);
    this.pbEORStatusProblemDamage(priority);
    this.pbEOREffectDamage(priority);
    for (const b of priority) this.pbEORTrappingDamage(b);
    for (const b of priority) {
      if (b.isFainted() || b.effects.Octolock < 0) continue;
      if (b.pbCanLowerStatStage('DEFENSE')) b.pbLowerStatStage('DEFENSE', 1, null);
      if (b.pbCanLowerStatStage('SPECIAL_DEFENSE')) b.pbLowerStatStage('SPECIAL_DEFENSE', 1, null);
      b.pbItemOnStatDropped();
    }
    this.pbEOREndBattlerEffects(priority);
    if (this.decision > 0) {
      await this.pbGainExp();
      this.endOfRound = false;
      return;
    }
    this.pbEOREndSideEffects(0);
    this.pbEOREndSideEffects(1);
    this.pbEOREndFieldEffects();
    this.pbEOREndTerrain();
    for (const b of priority) {
      this.pbEOREndBattlerSelfEffects(b);
      if (b.abilityActive()) AbilityEffects.triggerEndOfRoundEffect(b.ability, b, this);
      if (b.itemActive()) ItemEffects.triggerEndOfRoundEffect(b.item, b, this);
      if (b.abilityActive()) AbilityEffects.triggerEndOfRoundGainItem(b.ability, b, this);
    }
    await this.pbGainExp();
    if (this.decision > 0) {
      this.endOfRound = false;
      return;
    }
    for (const b of priority) b.pbCheckForm(true);
    this.pendingReplacements = [];
    await this.pbEORSwitch();
    if (this.decision > 0) {
      this.endOfRound = false;
      return;
    }
    for (const b of priority) b.pbContinualAbilityChecks();
    this.resetEndOfRoundEffects();
    this.endOfRound = false;
  },

  /** Efectos de un solo turno que se reinician (sin mensajes). */
  resetEndOfRoundEffects() {
    for (const b of this.allBattlers()) {
      const e = b.effects;
      e.BanefulBunker = false;
      e.SilkTrap = false;
      e.BurningBulwark = false;
      if (e.Charge > 0) e.Charge -= 1;
      e.Counter = -1;
      e.CounterTarget = -1;
      e.Electrify = false;
      e.Endure = false;
      e.FirstPledge = null;
      e.Flinch = false;
      e.FocusPunch = false;
      e.FollowMe = 0;
      e.HelpingHand = false;
      if (e.HyperBeam > 0) e.HyperBeam -= 1;
      e.KingsShield = false;
      if (e.LaserFocus > 0) e.LaserFocus -= 1;
      if (e.LockOn > 0) {
        e.LockOn -= 1;
        if (e.LockOn === 0) e.LockOnPos = -1;
      }
      e.MagicBounce = false;
      e.MagicCoat = false;
      e.MirrorCoat = -1;
      e.MirrorCoatTarget = -1;
      e.Obstruct = false;
      e.Powder = false;
      e.Prankster = false;
      e.PriorityAbility = false;
      e.PriorityItem = false;
      e.Protect = false;
      e.RagePowder = false;
      e.Roost = false;
      e.Snatch = 0;
      e.SpikyShield = false;
      e.Spotlight = 0;
      if (e.ThroatChop > 0) e.ThroatChop -= 1;
      e.AllySwitch = false;
      b.lastHPLost = 0;
      b.lastHPLostFromFoe = 0;
      b.droppedBelowHalfHP = false;
      b.droppedBelowThirdHP = false;
      b.statsDropped = false;
      b.tookMoveDamageThisRound = false;
      b.tookDamageThisRound = false;
      b.tookPhysicalHit = false;
      b.statsRaisedThisRound = false;
      b.statsLoweredThisRound = false;
      b.canRestoreIceFace = false;
      b.lastRoundMoveFailed = b.lastMoveFailed;
      b.lastAttacker = [];
      b.lastFoeAttacker = [];
      if (e.Charge > 0) e.Charge += 1; // gen 9: la Carga dura hasta usar un movimiento eléctrico
      if (e.GlaiveRush > 0) e.GlaiveRush -= 1;
    }
    for (const side of [0, 1]) {
      const s = this.sides[side].effects;
      s.CraftyShield = false;
      if (!s.EchoedVoiceUsed) s.EchoedVoiceCounter = 0;
      s.EchoedVoiceUsed = false;
      s.MatBlock = false;
      s.QuickGuard = false;
      s.Round = false;
      s.WideGuard = false;
    }
    this.field.effects.IonDeluge = false;
    if (this.field.effects.FairyLock > 0) this.field.effects.FairyLock -= 1;
    this.field.effects.FusionBolt = false;
    this.field.effects.FusionFlare = false;
  },
});
