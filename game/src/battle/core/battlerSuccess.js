// Battler: comprobaciones de éxito al usar movimientos (029_Battler/010).
import { Battler } from './battler.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { Effectiveness } from './typeChart.js';

Object.assign(Battler.prototype, {
  /** ¿Puede elegir/usar este movimiento? (también se comprueba al ejecutarlo). */
  pbCanChooseMove(move, commandPhase, showMessages = true, specialUsage = false) {
    const battle = this.battle;
    const say = (msg) => { if (showMessages) battle.pbDisplay(msg); };
    if (!this.effects.Instructed && this.lastMoveUsed === move.id && this.effects.SuccessiveMove === move.id) {
      say(`¡${move.name} no puede ser utilizado dos veces seguidas!`);
      return false;
    }
    if (this.effects.DisableMove === move.id && !specialUsage) {
      say(`¡El movimiento ${move.name} de ${this.pbThis(true)} está anulado!`);
      return false;
    }
    if (this.effects.HealBlock > 0 && move.healingMove()) {
      say(`¡${this.pbThis()} no puede usar ${move.name} debido a los efectos de Anticura!`);
      return false;
    }
    if (battle.field.effects.Gravity > 0 && move.unusableInGravity()) {
      say(`¡${this.pbThis()} no puede usar ${move.name} debido a la fuerza de la gravedad!`);
      return false;
    }
    if (this.effects.ThroatChop > 0 && move.soundMove()) {
      say(`¡${this.pbThis()} no puede usar ${move.name} debido a los efectos de Golpe Mordaza!`);
      return false;
    }
    if (this.effects.ChoiceBand && !this.pbHasMove(this.effects.ChoiceBand)) this.effects.ChoiceBand = null;
    if (this.effects.ChoiceBand && move.id !== this.effects.ChoiceBand) {
      const choiced = battle.db.moves[this.effects.ChoiceBand];
      if (choiced) {
        if (this.hasActiveItem(['CHOICEBAND', 'CHOICESPECS', 'CHOICESCARF'])) {
          say(`¡A causa de ${this.itemName()} solo se puede usar ${choiced.name}!`);
          return false;
        }
        if (this.hasActiveAbility(['GORILLATACTICS', 'PODERSABIO'])) {
          say(`¡${this.pbThis()} solo puede usar ${choiced.name}!`);
          return false;
        }
      }
    }
    if (this.effects.Taunt > 0 && move.statusMove() && !specialUsage) {
      say(`¡${this.pbThis()} no puede usar ${move.name} debido a Mofa!`);
      return false;
    }
    if (this.effects.Torment && !this.effects.Instructed && !specialUsage && this.lastMoveUsed &&
        move.id === this.lastMoveUsed && move.id !== 'STRUGGLE') {
      say(`¡${this.pbThis()} no puede usar un movimiento dos veces seguidas debido a Tormento!`);
      return false;
    }
    if (battle.allOtherSideBattlers(this.index).some((b) => b.effects.Imprison && b.pbHasMove(move.id))) {
      say(`¡${this.pbThis()} no puede usar ${move.name} debido a Sellar!`);
      return false;
    }
    if (this.hasActiveItem('ASSAULTVEST') && move.statusMove() && move.functionCode !== 'UseMoveTargetIsAboutToUse' && commandPhase) {
      say(`¡El efecto de ${this.itemName()} impide la ejecución de movimientos de estado!`);
      return false;
    }
    return move.pbCanChooseMove(this, commandPhase, showMessages);
  },

  pbObedienceCheck(choice) {
    if (this.usingMultiTurnAttack()) return true;
    if (choice.action !== 'UseMove') return true;
    if (!this.battle.internalBattle) return true;
    // Online en equipo (battle.link): se comprueba igual para los dos humanos en las dos simulaciones (mismo azar).
    const human = this.battle.link ? !this.opposes() : this.battle.pbOwnedByPlayer(this.index);
    if (!human) return true;
    const owner = this.battle.link ? this.battle.pbGetOwnerFromBattlerIndex(this.index) : this.battle.player[0];
    const badges = owner?.badges || 0;
    const badgeLevel = badges >= 8 ? 100 : 10 * (badges + 1);
    let disobedient = false;
    const foreign = this.pokemon.ot && owner?.id != null && this.pokemon.ot.id !== owner.id;
    if (Settings.ANY_HIGH_LEVEL_POKEMON_CAN_DISOBEY || (Settings.FOREIGN_HIGH_LEVEL_POKEMON_CAN_DISOBEY && foreign)) {
      if (this.level > badgeLevel) {
        const a = Math.floor(((this.level + badgeLevel) * this.battle.pbRandom(256)) / 256);
        disobedient = a >= badgeLevel;
      }
    }
    if (!disobedient) return true;
    return this.pbDisobey(choice, badgeLevel);
  },

  pbDisobey(choice, badgeLevel) {
    const battle = this.battle;
    const move = choice.move;
    this.effects.Rage = false;
    if (this.status === 'SLEEP' && move.usableWhenAsleep()) {
      battle.pbDisplay(`¡${this.pbThis()} hace caso omiso de las órdenes y sigue durmiendo!`);
      return false;
    }
    const b = Math.floor(((this.level + badgeLevel) * battle.pbRandom(256)) / 256);
    if (b < badgeLevel) {
      battle.pbDisplay(`¡${this.pbThis()} hace caso omiso de las órdenes!`);
      if (!battle.pbCanShowFightMenu(this.index)) return false;
      const others = [];
      this.moves.forEach((_m, i) => { if (i !== choice.moveIndex && battle.pbCanChooseMove(this.index, i, false)) others.push(i); });
      if (others.length === 0) return false;
      const n = others[battle.pbRandom(others.length)];
      choice.moveIndex = n;
      choice.move = this.moves[n];
      choice.target = -1;
      return true;
    }
    const c = this.level - badgeLevel;
    let r = battle.pbRandom(256);
    if (r < c && this.pbCanSleep(this, false)) {
      this.pbSleepSelf(`¡${this.pbThis()} ha decidido echarse una siesta!`);
      return false;
    }
    r -= c;
    if (r < c && this.status !== 'SLEEP') {
      this.pbConfusionDamage(`¡${this.pbThis()} no quiere obedecer! ¡Está tan confuso que se ha herido a sí mismo!`);
      return false;
    }
    const msgs = ['no quiere obedecer', 'te da la espalda', 'está holgazaneando', 'se hace el tonto'];
    battle.pbDisplay(`¡${this.pbThis()} ${msgs[battle.pbRandom(4)]}!`);
    return false;
  },

  /** ¿Puede actuar? Incluye sueño, congelación, retroceso, confusión, parálisis y amor. */
  pbTryUseMove(choice, move, specialUsage, skipAccuracyCheck) {
    const battle = this.battle;
    if (!this.pbCanChooseMove(move, false, true, specialUsage)) {
      this.lastMoveFailed = true;
      return false;
    }
    if (this.effects.SkyDrop >= 0) return false;
    if (this.effects.HyperBeam > 0) {
      battle.pbDisplay(`¡${this.pbThis()} necesita recuperarse de su ataque!`);
      if (this.hasActiveAbility('TRUANT')) this.effects.Truant = !this.effects.Truant;
      return false;
    }
    if (skipAccuracyCheck) return true;
    if (this.status === 'SLEEP') {
      this.statusCount = this.statusCount - 1;
      if (this.statusCount <= 0) {
        this.pbCureStatus();
      } else {
        this.pbContinueStatus();
        if (!move.usableWhenAsleep()) {
          this.lastMoveFailed = true;
          return false;
        }
      }
    } else if (this.status === 'FROZEN') {
      if (!move.thawsUser()) {
        if (battle.pbRandom(100) < 20) {
          this.pbCureStatus();
        } else {
          this.pbContinueStatus();
          this.lastMoveFailed = true;
          return false;
        }
      }
    }
    if (!this.pbObedienceCheck(choice)) return false;
    if (this.hasActiveAbility('TRUANT')) {
      this.effects.Truant = !this.effects.Truant;
      if (!this.effects.Truant) {
        battle.pbShowAbilitySplash(this);
        battle.pbDisplay(`¡${this.pbThis()} está holgazaneando!`);
        this.lastMoveFailed = true;
        battle.pbHideAbilitySplash(this);
        return false;
      }
    }
    if (this.effects.Flinch) {
      battle.pbDisplay(`¡${this.pbThis()} se ha amedrentado y no puede lanzar ningún ataque!`);
      if (this.abilityActive()) AbilityEffects.triggerOnFlinch(this.ability, this, battle);
      this.lastMoveFailed = true;
      return false;
    }
    if (this.effects.Confusion > 0) {
      this.effects.Confusion -= 1;
      if (this.effects.Confusion <= 0) {
        this.pbCureConfusion();
        battle.pbDisplay(`¡${this.pbThis()} ya no está confuso!`);
      } else {
        battle.pbCommonAnimation('Confusion', this);
        battle.pbDisplay(`¡${this.pbThis()} está confuso!`);
        if (battle.pbRandom(100) < 33) {
          this.pbConfusionDamage('¡Está tan confuso que se ha herido a sí mismo!');
          this.lastMoveFailed = true;
          return false;
        }
      }
    }
    if (this.status === 'PARALYSIS' && battle.pbRandom(100) < 25) {
      this.pbContinueStatus();
      this.lastMoveFailed = true;
      return false;
    }
    if (this.effects.Attract >= 0) {
      battle.pbCommonAnimation('Attract', this);
      battle.pbDisplay(`¡${this.pbThis()} está enamorado de ${battle.battlers[this.effects.Attract].pbThis(true)}!`);
      if (battle.pbRandom(100) < 50) {
        battle.pbDisplay(`¡El amor impide a ${this.pbThis(true)} atacar!`);
        this.lastMoveFailed = true;
        return false;
      }
    }
    return true;
  },

  /** Comprobación previa contra un objetivo (protecciones, inmunidades). */
  pbSuccessCheckAgainstTarget(move, user, target, targets) {
    const battle = this.battle;
    if (!battle.moldBreaker) battle.moldBreaker = user.hasMoldBreaker() || (move.statusMove() && user.hasActiveAbility('MYCELIUMMIGHT'));
    if (target.hasActiveItem('ABILITYSHIELD')) battle.moldBreaker = false;
    const showMessage = move.pbShowFailMessages(targets);
    const say = (msg) => { if (showMessage) battle.pbDisplay(msg); };
    const typeMod = move.pbCalcTypeMod(move.calcType, user, target);
    target.damageState.typeMod = typeMod;
    if (user.effects.TwoTurnAttack) return true;
    const protectedBy = (anim) => {
      if (showMessage) {
        battle.pbCommonAnimation(anim, target);
        battle.pbDisplay(`¡${target.pbThis()} se ha protegido!`);
      }
      target.damageState.protected = true;
      return false;
    };
    const unseenFist = user.hasActiveAbility('UNSEENFIST') && move.contactMove();
    if (!unseenFist && move.canProtectAgainst()) {
      if (target.effects.SilkTrap && move.damagingMove()) {
        protectedBy('SilkTrap');
        if (move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanLowerStatStage('SPEED', target)) {
          user.pbLowerStatStage('SPEED', 1, target);
        }
        return false;
      }
      if (target.effects.BurningBulwark && move.damagingMove()) {
        protectedBy('BurningBulwark');
        if (move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanBurn(target, false)) user.pbBurn(target);
        return false;
      }
    }
    if (move.pbFailsAgainstTarget(user, target, showMessage)) return false;
    if (battle.field.terrain === 'Psychic' && target.affectedByTerrain() && target.opposes(user) &&
        (battle.choices[user.index].priority || 0) > 0) {
      say(`¡El campo psíquico ha protegido a ${target.pbThis(true)}!`);
      return false;
    }
    if (target.pbOwnSide().effects.CraftyShield && user.index !== target.index && move.statusMove() &&
        !move.pbTarget(user).targetsAll) {
      if (showMessage) {
        battle.pbCommonAnimation('CraftyShield', target);
        battle.pbDisplay(`¡Truco Defensa protege a ${target.pbThis(true)}!`);
      }
      target.damageState.protected = true;
      return false;
    }
    if (!unseenFist) {
      if (target.pbOwnSide().effects.WideGuard && user.index !== target.index && move.pbTarget(user).numTargets > 1) {
        if (showMessage) {
          battle.pbCommonAnimation('WideGuard', target);
          battle.pbDisplay(`¡Vasta Guardia protege a ${target.pbThis(true)}!`);
        }
        target.damageState.protected = true;
        return false;
      }
      if (move.canProtectAgainst()) {
        if (target.pbOwnSide().effects.QuickGuard && (battle.choices[user.index].priority || 0) > 0) {
          if (showMessage) {
            battle.pbCommonAnimation('QuickGuard', target);
            battle.pbDisplay(`¡Anticipo protege a ${target.pbThis(true)}!`);
          }
          target.damageState.protected = true;
          return false;
        }
        if (target.effects.Protect) return protectedBy('Protect');
        if (target.effects.KingsShield && move.damagingMove()) {
          protectedBy('KingsShield');
          if (move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanLowerStatStage('ATTACK', target)) {
            user.pbLowerStatStage('ATTACK', 1, target);
          }
          return false;
        }
        if (target.effects.SpikyShield) {
          protectedBy('SpikyShield');
          if (move.pbContactMove(user) && user.affectedByContactEffect() && user.takesIndirectDamage()) {
            user.pbReduceHP(Math.floor(user.totalhp / 8), false);
            battle.pbDisplay(`¡${user.pbThis()} se ha herido!`);
            user.pbItemHPHealCheck();
          }
          return false;
        }
        if (target.effects.BanefulBunker) {
          protectedBy('BanefulBunker');
          if (move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanPoison(target, false)) user.pbPoison(target);
          return false;
        }
        if (target.effects.Obstruct && move.damagingMove()) {
          protectedBy('Obstruct');
          if (move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanLowerStatStage('DEFENSE', target)) {
            user.pbLowerStatStage('DEFENSE', 2, target);
          }
          return false;
        }
        if (target.pbOwnSide().effects.MatBlock && move.damagingMove()) {
          say(`¡${move.name} fue bloqueado por el tatami!`);
          target.damageState.protected = true;
          return false;
        }
      }
    }
    if (move.statusMove() && move.canMagicCoat() && !target.semiInvulnerable() && target.opposes(user)) {
      if (target.effects.MagicCoat) {
        target.damageState.magicCoat = true;
        target.effects.MagicCoat = false;
        return false;
      }
      if (target.hasActiveAbility('MAGICBOUNCE') && !battle.moldBreaker && !target.effects.MagicBounce) {
        target.damageState.magicBounce = true;
        target.effects.MagicBounce = true;
        return false;
      }
    }
    if (move.pbImmunityByAbility(user, target, showMessage)) return false;
    if (move.pbDamagingMove() && Effectiveness.ineffective(typeMod)) {
      say(`No afecta a ${target.pbThis(true)}...`);
      return false;
    }
    if (user.effects.Prankster && target.pbHasType('DARK') && target.opposes(user)) {
      say(`No afecta a ${target.pbThis(true)}...`);
      return false;
    }
    if (move.damagingMove() && move.calcType === 'GROUND' && target.airborne() && !move.hitsFlyingTargets()) {
      if (target.hasActiveAbility('LEVITATE') && !battle.moldBreaker) {
        if (showMessage) {
          battle.pbShowAbilitySplash(target);
          battle.pbDisplay(`¡${target.pbThis()} ha evitado el ataque!`);
          battle.pbHideAbilitySplash(target);
        }
        return false;
      }
      if (target.hasActiveItem('AIRBALLOON')) {
        say(`¡${target.pbThis()} es inmune a los movimientos de tipo Tierra gracias a ${target.itemName()}!`);
        return false;
      }
      if (target.effects.MagnetRise > 0) {
        say(`¡${target.pbThis()} es inmune a los movimientos de tipo Tierra gracias a Levitón!`);
        return false;
      }
      if (target.effects.Telekinesis > 0) {
        say(`¡${target.pbThis()} es inmune a los movimientos de tipo Tierra gracias a Telequinesis!`);
        return false;
      }
    }
    if (move.powderMove()) {
      if (target.pbHasType('GRASS') && Settings.MORE_TYPE_EFFECTS) {
        say(`No afecta a ${target.pbThis(true)}...`);
        return false;
      }
      if (target.hasActiveAbility('OVERCOAT') && !battle.moldBreaker) {
        if (showMessage) {
          battle.pbShowAbilitySplash(target);
          battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
          battle.pbHideAbilitySplash(target);
        }
        return false;
      }
      if (target.hasActiveItem('SAFETYGOGGLES')) {
        say(`No afecta a ${target.pbThis(true)}...`);
        return false;
      }
    }
    if (target.effects.Substitute > 0 && move.statusMove() && !move.ignoresSubstitute(user) && user.index !== target.index) {
      say(`¡${target.pbThis()} ha evitado el ataque!`);
      return false;
    }
    AbilityEffects.triggerOnMoveSuccessCheck(target.ability, user, target, move, battle);
    return true;
  },

  /** Comprobación por golpe: semiinvulnerabilidad y precisión. */
  pbSuccessCheckPerHit(move, user, target, skipAccuracyCheck) {
    const battle = this.battle;
    if (user.effects.TwoTurnAttack) return true;
    if (user.effects.LockOn > 0 && user.effects.LockOnPos === target.index) return true;
    if (move.pbOverrideSuccessCheckPerHit(user, target)) return true;
    if (user.hasActiveAbility('NOGUARD') || target.hasActiveAbility('NOGUARD')) return true;
    let miss = false;
    const hitsInvul = battle.futureSight || move.functionCode === 'PowerUpAllyMove';
    if (!hitsInvul) {
      if (target.effects.TwoTurnAttack) {
        if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableInSky', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
          'TwoTurnAttackInvulnerableInSkyTargetCannotAct')) {
          if (!move.hitsFlyingTargets()) miss = true;
        } else if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderground')) {
          if (!move.hitsDiggingTargets()) miss = true;
        } else if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderwater')) {
          if (!move.hitsDivingTargets()) miss = true;
        } else if (target.inTwoTurnAttack('TwoTurnAttackInvulnerableRemoveProtections')) {
          miss = true;
        }
      }
      if (target.effects.SkyDrop >= 0 && target.effects.SkyDrop !== user.index && !move.hitsFlyingTargets()) miss = true;
    }
    if (miss) {
      target.damageState.invulnerable = true;
      return false;
    }
    if (skipAccuracyCheck) return true;
    return move.pbAccuracyCheck(user, target);
  },

  pbMissMessage(move, user, target) {
    if (move.pbTarget(user).numTargets > 1 || target.effects.TwoTurnAttack) {
      this.battle.pbDisplay(`¡${target.pbThis()} ha evitado el ataque!`);
    } else if (!move.pbMissMessage(user, target)) {
      this.battle.pbDisplay(`¡El ataque de ${user.pbThis(true)} ha fallado!`);
    }
  },
});
