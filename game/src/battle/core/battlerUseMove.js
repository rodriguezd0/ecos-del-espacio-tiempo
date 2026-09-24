// Battler: procesado del turno y uso de movimientos (029_Battler/008).
// pbUseMove/pbProcessMoveHit son async porque algunos efectos piden decisiones (Ida y Vuelta,
// aprender movimientos al ganar experiencia) o llaman a otros movimientos (Metrónomo).
import { Battler } from './battler.js';
import { Settings } from './settings.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';
import { createMove, createConfusionMove } from './moves/registry.js';

Object.assign(Battler.prototype, {
  async pbProcessTurn(choice, tryFlee = true) {
    const battle = this.battle;
    if (this.isFainted()) return false;
    if (tryFlee && this.wild() && battle.rules.alwaysFlee && battle.pbCanRun(this.index)) {
      this.pbBeginTurn(choice);
      battle.pbDisplay(`¡${this.pbThis()} ha huido del combate!`);
      battle.decision = 3;
      this.pbEndTurn(choice);
      return true;
    }
    if (choice.action === 'Shift') {
      let idxOther = -1;
      if (battle.pbSideSize(this.index) === 2) idxOther = (this.index + 2) % 4;
      if (idxOther >= 0) {
        battle.pbSwapBattlers(this.index, idxOther);
        battle.pbDisplay(`¡${this.pbThis()} se ha desplazado!`);
      }
      this.pbBeginTurn(choice);
      this.pbCancelMoves();
      this.lastRoundMoved = battle.turnCount;
      return true;
    }
    if (choice.action !== 'UseMove') {
      this.pbBeginTurn(choice);
      this.pbEndTurn(choice);
      return false;
    }
    await this.pbUseMove(choice, choice.move === battle.struggle);
    battle.pbJudge();
    if (Settings.RECALCULATE_TURN_ORDER_AFTER_SPEED_CHANGES) battle.pbCalculatePriority();
    return true;
  },

  pbBeginTurn() {
    const e = this.effects;
    e.DestinyBondPrevious = e.DestinyBond;
    e.DestinyBond = false;
    e.Grudge = false;
    e.MoveNext = false;
    e.Quash = 0;
    if (e.Encore > 0 && this.pbEncoredMoveIndex() < 0) {
      e.Encore = 0;
      e.EncoreMove = null;
    }
  },

  /** Cancela movimientos de varios turnos (no Hiperrayo). */
  pbCancelMoves(fullCancel = false) {
    const e = this.effects;
    if (e.Outrage === 1 && this.pbCanConfuseSelf(false) && !fullCancel) {
      this.pbConfuse(`¡El cansancio ha terminado confundiendo a ${this.pbThis(true)}!`);
    }
    e.TwoTurnAttack = null;
    e.Rollout = 0;
    e.Outrage = 0;
    e.Uproar = 0;
    e.Bide = 0;
    if (e.HyperBeam === 0) this.currentMove = null;
    e.FuryCutter = 0;
  },

  pbEndTurn() {
    this.lastRoundMoved = this.battle.turnCount;
    const e = this.effects;
    if (!e.ChoiceBand && (this.hasActiveItem(['CHOICEBAND', 'CHOICESPECS', 'CHOICESCARF']) ||
        this.hasActiveAbility(['GORILLATACTICS', 'PODERSABIO']))) {
      if (this.lastMoveUsed && this.pbHasMove(this.lastMoveUsed)) e.ChoiceBand = this.lastMoveUsed;
      else if (this.lastRegularMoveUsed && this.pbHasMove(this.lastRegularMoveUsed)) e.ChoiceBand = this.lastRegularMoveUsed;
    }
    e.BeakBlast = false;
    if (e.Charge === 1) e.Charge = 0;
    e.GemConsumed = null;
    e.ShellTrap = false;
    for (const b of this.battle.allBattlers()) b.pbContinualAbilityChecks();
  },

  pbConfusionDamage(msg) {
    this.damageState.reset();
    const move = createConfusionMove(this.battle);
    move.calcType = move.pbCalcType(this);
    this.damageState.typeMod = move.pbCalcTypeMod(move.calcType, this, this);
    move.pbCheckDamageAbsorption(this, this);
    move.pbCalcDamage(this, this);
    move.pbReduceDamage(this, this);
    const old = this.hp;
    this.hp = this.hp - this.damageState.hpLost;
    this.battle.queueEvent('animateDamage', [{ battler: this.view(), from: old, to: this.hp, effectiveness: 0 }]);
    this.battle.pbDisplay(msg);
    move.pbRecordDamageLost(this, this);
    move.pbEndureKOMessage(this);
    if (this.isFainted()) this.pbFaint();
    this.pbItemHPHealCheck();
  },

  /** Uso de un movimiento llamado por otro (Metrónomo, Premonición…). */
  async pbUseMoveSimple(moveID, target = -1, idxMove = -1, specialUsage = true) {
    const choice = { action: 'UseMove', moveIndex: idxMove, target, priority: 0 };
    if (idxMove >= 0) {
      choice.move = this.moves[idxMove];
    } else {
      choice.move = createMove(this.battle, { id: moveID, pp: -1, ppUps: 0 }, { detached: true, special: true });
    }
    await this.pbUseMove(choice, specialUsage);
  },

  /** Método maestro de uso de movimientos. */
  async pbUseMove(choice, specialUsage = false) {
    const battle = this.battle;
    const skipAccuracyCheck = specialUsage && choice.move !== battle.struggle;
    this.pbBeginTurn(choice);
    if (!battle.futureSight) {
      if (this.usingMultiTurnAttack()) {
        choice.move = createMove(battle, { id: this.currentMove, pp: -1, ppUps: 0 }, { detached: true, special: true });
        specialUsage = true;
      } else if (this.effects.Encore > 0 && choice.moveIndex >= 0 && battle.pbCanShowCommands(this.index)) {
        const idxEnc = this.pbEncoredMoveIndex();
        if (idxEnc >= 0 && choice.moveIndex !== idxEnc && battle.pbCanChooseMove(this.index, idxEnc, false)) {
          choice.moveIndex = idxEnc;
          choice.move = this.moves[idxEnc];
          choice.target = -1;
        }
      }
    }
    let move = choice.move;
    if (!move) return;
    this.lastMoveFailed = false;
    if (!this.pbTryUseMove(choice, move, specialUsage, skipAccuracyCheck)) {
      this.lastMoveUsed = null;
      this.lastMoveUsedType = null;
      if (!specialUsage) {
        this.lastRegularMoveUsed = null;
        this.lastRegularMoveTarget = -1;
      }
      await battle.pbGainExp();
      this.pbCancelMoves();
      this.pbEndTurn(choice);
      return;
    }
    move = choice.move;
    if (!move) return;
    if (!specialUsage && !this.pbReducePP(move)) {
      battle.pbDisplay(`¡${this.pbThis()} ha usado ${move.name}!`);
      battle.pbDisplay('¡Pero al movimiento no le quedan PP!');
      this.lastMoveUsed = null;
      this.lastMoveUsedType = null;
      this.lastRegularMoveUsed = null;
      this.lastRegularMoveTarget = -1;
      this.lastMoveFailed = true;
      this.pbCancelMoves();
      this.pbEndTurn(choice);
      return;
    }
    if (this.isSpecies('AEGISLASH') && this.ability === 'STANCECHANGE') {
      if (move.damagingMove()) this.pbChangeForm(1, `¡${this.pbThis()} cambió a Forma Filo!`);
      else if (move.id === 'KINGSSHIELD') this.pbChangeForm(0, `¡${this.pbThis()} cambió a Forma Escudo!`);
    }
    move.calcType = move.pbCalcType(this);
    battle.moldBreaker = this.hasMoldBreaker();
    if (move.pbIsChargingTurn(this)) {
      this.effects.TwoTurnAttack = move.id;
      this.currentMove = move.id;
    } else {
      this.effects.TwoTurnAttack = null;
    }
    move.pbChangeUsageCounters(this, specialUsage);
    if (this.hasActiveItem('METRONOME') && !move.callsAnotherMove()) {
      if (this.lastMoveUsed && this.lastMoveUsed === move.id && !this.lastMoveFailed) this.effects.Metronome += 1;
      else this.effects.Metronome = 0;
    }
    this.lastMoveUsed = move.id;
    this.lastMoveUsedType = move.calcType;
    if (!specialUsage) {
      this.lastRegularMoveUsed = move.id;
      this.lastRegularMoveTarget = choice.target;
      if (!this.movesUsed.includes(move.id)) this.movesUsed.push(move.id);
    }
    battle.lastMoveUsed = move.id;
    battle.lastMoveUser = this.index;
    let user = this.pbFindUser(choice, move);
    user = this.pbChangeUser(choice, move, user);
    let targets = this.pbFindTargets(choice, move, user);
    targets = this.pbChangeTargets(move, user, targets);
    // Presión
    if (!specialUsage) {
      for (const b of targets) {
        if (b.opposes(user) && b.hasActiveAbility('PRESSURE')) user.pbReducePP(move);
      }
      if (move.pbTarget(user).affectsFoeSide) {
        for (const b of battle.allOtherSideBattlers(user.index)) if (b.hasActiveAbility('PRESSURE')) user.pbReducePP(move);
      }
    }
    // Deslumbrar / Regia Presencia / Cola Armadura
    for (const b of battle.pbPriority(true)) {
      if (!b || !b.abilityActive()) continue;
      if (AbilityEffects.triggerMoveBlocking(b.ability, b, user, targets, move, battle)) {
        battle.pbDisplayBrief(`¡${user.pbThis()} ha usado ${move.name}!`);
        battle.pbShowAbilitySplash(b);
        battle.pbDisplay(`¡${user.pbThis()} no puede usar ${move.name}!`);
        battle.pbHideAbilitySplash(b);
        user.lastMoveFailed = true;
        this.pbCancelMoves();
        this.pbEndTurn(choice);
        return;
      }
    }
    move.pbDisplayUseMessage(this);
    if (move.snatched) {
      this.lastMoveFailed = true;
      battle.pbDisplay(`¡${user.pbThis()} ha robado el movimiento de ${this.pbThis(true)}!`);
    }
    if (move.pbMoveFailed(user, targets)) {
      user.lastMoveFailed = true;
      this.pbCancelMoves();
      this.pbEndTurn(choice);
      return;
    }
    await move.pbOnStartUse(user, targets);
    if (user.status === 'FROZEN' && move.thawsUser()) {
      user.pbCureStatus(false);
      battle.pbDisplay(`¡${user.pbThis()} derritió el hielo!`);
    }
    if (user.effects.Powder && move.calcType === 'FIRE') {
      battle.pbCommonAnimation('Powder', user);
      battle.pbDisplay('¡El polvo ha reaccionado con el movimiento y ha explotado!');
      user.lastMoveFailed = true;
      if (!['Rain', 'HeavyRain'].includes(user.effectiveWeather()) && user.takesIndirectDamage()) {
        user.pbTakeEffectDamage(Math.round(user.totalhp / 4), false, () => battle.pbDisplay(`¡${user.pbThis()} ha sido dañado por el polvo!`));
        await battle.pbGainExp();
      }
      this.pbCancelMoves();
      this.pbEndTurn(choice);
      return;
    }
    if (move.damagingMove()) {
      const w = battle.pbWeather();
      if (w === 'HeavyRain' && move.calcType === 'FIRE') {
        battle.pbDisplay('¡El diluvio impide todos los ataques de tipo Fuego!');
        user.lastMoveFailed = true;
        this.pbCancelMoves();
        this.pbEndTurn(choice);
        return;
      }
      if (w === 'HarshSun' && move.calcType === 'WATER') {
        battle.pbDisplay('¡El sol brilla con tanta intensidad que los movimientos de tipo Agua no tienen efecto!');
        user.lastMoveFailed = true;
        this.pbCancelMoves();
        this.pbEndTurn(choice);
        return;
      }
    }
    // Mutatipo / Líbero
    if (user.hasActiveAbility(['LIBERO', 'PROTEAN']) && !move.callsAnotherMove() && !move.snatched &&
        move.calcType && user.pbHasOtherType(move.calcType)) {
      battle.pbShowAbilitySplash(user);
      user.pbChangeTypes(move.calcType);
      battle.pbDisplay(`¡${user.pbThis()} ha cambiado a tipo ${battle.typeName(move.calcType)}!`);
      battle.pbHideAbilitySplash(user);
      if (move.functionCode === 'CurseTargetOrLowerUserSpd1RaiseUserAtkDef1' && targets.length === 0) {
        choice.target = -1;
        targets = this.pbFindTargets(choice, move, user);
      }
    }
    move.pbQuickChargingMove(user, targets);
    let magicCoater = -1;
    let magicBouncer = -1;
    let realNumHits = 0;
    if (targets.length === 0 && move.pbTarget(user).numTargets > 0 && !move.worksWithNoTargets()) {
      battle.pbDisplay('Pero no había objetivo...');
      user.lastMoveFailed = true;
    } else {
      for (const b of battle.allBattlers()) {
        b.droppedBelowHalfHP = false;
        b.droppedBelowThirdHP = false;
        b.statsDropped = false;
      }
      for (const b of targets) {
        b.damageState.reset();
        if (this.pbSuccessCheckAgainstTarget(move, user, b, targets)) continue;
        b.damageState.unaffected = true;
      }
      if (targets.length === 0 && move.statusMove() && move.canMagicCoat()) {
        for (const b of battle.pbPriority(true)) {
          if (b.isFainted() || !b.opposes(user) || b.semiInvulnerable()) continue;
          if (b.effects.MagicCoat) {
            magicCoater = b.index;
            b.effects.MagicCoat = false;
            break;
          }
          if (b.hasActiveAbility('MAGICBOUNCE') && !battle.moldBreaker && !b.effects.MagicBounce) {
            magicBouncer = b.index;
            b.effects.MagicBounce = true;
            break;
          }
        }
      }
      const numHits = move.pbNumHits(user, targets);
      for (let i = 0; i < numHits; i++) {
        if (magicCoater >= 0 || magicBouncer >= 0) break;
        const success = await this.pbProcessMoveHit(move, user, targets, i, skipAccuracyCheck);
        if (!success) {
          if (i === 0 && targets.length > 0) {
            let hasFailed = false;
            for (const t of targets) {
              if (t.damageState.protected) continue;
              hasFailed = t.damageState.unaffected;
              if (!t.damageState.unaffected) break;
            }
            user.lastMoveFailed = hasFailed;
          }
          break;
        }
        realNumHits += 1;
        if (user.isFainted()) break;
        if (['SLEEP', 'FROZEN'].includes(user.status)) break;
        if (targets.every((t) => t.isFainted())) break;
      }
      if (numHits > 1) {
        if (move.damagingMove()) {
          for (const b of targets) {
            if (b.damageState.unaffected || b.damageState.substitute) continue;
            move.pbEffectivenessMessage(user, b, targets.length);
          }
        }
        if (realNumHits === 1) battle.pbDisplay('¡Golpeó una vez!');
        else if (realNumHits > 1) battle.pbDisplay(`N.º de golpes: ${realNumHits}.`);
      }
      // Capa Mágica / Espejo Mágico (con objetivos)
      for (const b of targets) {
        if (b.isFainted()) continue;
        if (!b.damageState.magicCoat && !b.damageState.magicBounce) continue;
        if (b.damageState.magicBounce) battle.pbShowAbilitySplash(b);
        battle.pbDisplay(`¡${b.pbThis()} hizo rebotar ${move.name}!`);
        if (b.damageState.magicBounce) battle.pbHideAbilitySplash(b);
        const newChoice = { ...choice, target: user.index };
        let newTargets = this.pbFindTargets(newChoice, move, b);
        newTargets = this.pbChangeTargets(move, b, newTargets);
        let success = false;
        if (!move.pbMoveFailed(b, newTargets)) {
          newTargets = newTargets.filter((nt) => {
            if (this.pbSuccessCheckAgainstTarget(move, b, nt, newTargets)) {
              success = true;
              return true;
            }
            return false;
          });
        }
        if (success) await this.pbProcessMoveHit(move, b, newTargets, 0, false);
        else b.lastMoveFailed = true;
        for (const o of targets) if (o.isFainted()) o.pbFaint();
        if (user.isFainted()) user.pbFaint();
      }
      // Capa Mágica / Espejo Mágico (sin objetivos)
      if (magicCoater >= 0 || magicBouncer >= 0) {
        const mc = battle.battlers[magicCoater >= 0 ? magicCoater : magicBouncer];
        if (!mc.isFainted()) {
          user.lastMoveFailed = true;
          if (magicBouncer >= 0) battle.pbShowAbilitySplash(mc);
          battle.pbDisplay(`¡${mc.pbThis()} hizo rebotar ${move.name}!`);
          if (magicBouncer >= 0) battle.pbHideAbilitySplash(mc);
          let success = false;
          if (!move.pbMoveFailed(mc, [])) success = await this.pbProcessMoveHit(move, mc, [], 0, false);
          if (!success) mc.lastMoveFailed = true;
          for (const b of targets) if (b.isFainted()) b.pbFaint();
          if (user.isFainted()) user.pbFaint();
        }
      }
      for (const b of targets) await move.pbEffectAfterAllHits(user, b);
      for (const b of targets) if (b.isFainted()) b.pbFaint();
      if (user.isFainted()) user.pbFaint();
      await this.pbEffectsAfterMove(user, targets, move, realNumHits);
      for (const b of battle.allBattlers()) {
        b.droppedBelowHalfHP = false;
        b.droppedBelowThirdHP = false;
        b.statsDropped = false;
      }
    }
    battle.moldBreaker = false;
    await battle.pbGainExp();
    this.pbEndTurn(choice);
    await battle.pbProcessPendingReplacements();
    if (battle.decision > 0) return;
    // Mandato (Instruct)
    for (const b of battle.allBattlers()) {
      if (!b.effects.Instruct || !b.lastMoveUsed) continue;
      b.effects.Instruct = false;
      const idxMove = b.moves.findIndex((m) => m.id === b.lastMoveUsed);
      if (idxMove < 0) continue;
      const oldLastRoundMoved = b.lastRoundMoved;
      battle.pbDisplay(`¡${b.pbThis()} sigue el mandato de ${user.pbThis(true)} y repite su último movimiento!`);
      b.effects.Instructed = true;
      if (b.pbCanChooseMove(b.moves[idxMove], false)) {
        await b.pbUseMoveSimple(b.lastMoveUsed, b.lastRegularMoveTarget, idxMove, false);
        b.lastRoundMoved = oldLastRoundMoved;
        battle.pbJudge();
        if (battle.decision > 0) return;
      }
      b.effects.Instructed = false;
    }
    // Pareja de Baile (Dancer)
    if (!this.effects.Dancer && !user.lastMoveFailed && realNumHits > 0 && !move.snatched && magicCoater < 0 &&
        battle.pbCheckGlobalAbility('DANCER') && move.danceMove()) {
      const dancers = battle.pbPriority(true).filter((b) => b.index !== user.index && b.hasActiveAbility('DANCER'));
      while (dancers.length > 0) {
        const nextUser = dancers.pop();
        const oldLastRoundMoved = nextUser.lastRoundMoved;
        const oldOutrage = nextUser.effects.Outrage;
        if (nextUser.effects.Outrage > 0) nextUser.effects.Outrage += 1;
        const oldCurrentMove = nextUser.currentMove;
        let preTarget = choice.target;
        if (nextUser.opposes(user) || !nextUser.opposes(preTarget)) preTarget = user.index;
        battle.pbShowAbilitySplash(nextUser, true);
        battle.pbHideAbilitySplash(nextUser);
        nextUser.effects.Dancer = true;
        if (nextUser.pbCanChooseMove(move, false)) {
          await nextUser.pbUseMoveSimple(move.id, preTarget);
          nextUser.lastRoundMoved = oldLastRoundMoved;
          nextUser.effects.Outrage = oldOutrage;
          nextUser.currentMove = oldCurrentMove;
          battle.pbJudge();
          if (battle.decision > 0) return;
        }
        nextUser.effects.Dancer = false;
      }
    }
  },

  /** Procesa un golpe contra los objetivos. Devuelve false si falló contra todos. */
  async pbProcessMoveHit(move, user, targets, hitNum, skipAccuracyCheck) {
    const battle = this.battle;
    if (user.isFainted()) return false;
    move.pbInitialEffect(user, targets, hitNum);
    let numTargets = 0;
    if (user.effects.ParentalBond > 0) user.effects.ParentalBond -= 1;
    if (hitNum === 0 || move.successCheckPerHit()) {
      for (const b of targets) {
        b.damageState.missed = false;
        if (b.damageState.unaffected) continue;
        if (this.pbSuccessCheckPerHit(move, user, b, skipAccuracyCheck)) {
          numTargets += 1;
        } else {
          b.damageState.missed = true;
          b.damageState.unaffected = true;
        }
      }
      if (targets.length > 0 && numTargets === 0 && !move.worksWithNoTargets()) {
        for (const b of targets) {
          if (!b.damageState.missed || b.damageState.magicCoat) continue;
          this.pbMissMessage(move, user, b);
          if (user.itemActive()) ItemEffects.triggerOnMissingTarget(user.item, user, b, move, hitNum, battle);
          if (move.pbRepeatHit()) break;
        }
        move.pbCrashDamage(user);
        user.pbItemHPHealCheck();
        this.pbCancelMoves();
        return false;
      }
    }
    const allTargets = targets;
    targets = move.pbDesignateTargetsForHit(targets, hitNum);
    for (const b of targets) b.damageState.resetPerHit();
    if (move.pbDamagingMove()) {
      for (const b of targets) {
        if (b.damageState.unaffected) continue;
        move.pbCheckDamageAbsorption(user, b);
        move.pbCalcDamage(user, b, targets.length);
        move.pbReduceDamage(user, b);
      }
    }
    if (user.effects.GemConsumed && hitNum === 0) {
      battle.pbCommonAnimation('UseItem', user);
      battle.pbDisplay(`¡${battle.itemName(user.effects.GemConsumed)} refuerza el poder de ${move.name}!`);
    }
    move.pbShowAnimation(move.id, user, targets, hitNum);
    if (!move.pbRepeatHit()) {
      for (const b of targets) {
        if (!b.damageState.missed) continue;
        this.pbMissMessage(move, user, b);
        if (user.itemActive()) ItemEffects.triggerOnMissingTarget(user.item, user, b, move, hitNum, battle);
      }
    }
    if (move.pbDamagingMove()) {
      for (const b of targets) if (!b.damageState.unaffected) move.pbInflictHPDamage(b);
      move.pbAnimateHitAndHPLost(user, targets);
    }
    if (hitNum === 0) move.pbSelfKO(user);
    if (user.isFainted()) user.pbFaint();
    if (move.pbDamagingMove()) {
      for (const b of targets) {
        if (b.damageState.unaffected) continue;
        move.pbHitEffectivenessMessages(user, b, targets.length);
        move.pbRecordDamageLost(user, b);
      }
      for (const b of targets) {
        if (b.damageState.unaffected) continue;
        await move.pbEffectWhenDealingDamage(user, b);
      }
      for (const b of targets) {
        if (b.damageState.unaffected) continue;
        this.pbEffectsOnMakingHit(move, user, b);
      }
      for (const b of targets) {
        if (b.damageState.unaffected) continue;
        move.pbEndureKOMessage(b);
      }
      for (const b of battle.pbPriority(true)) {
        if (move.preventsBattlerConsumingHealingBerry(b, targets)) continue;
        b.pbItemHPHealCheck();
      }
      for (const b of battle.pbPriority(true)) if (b.isFainted()) b.pbFaint();
    }
    for (const b of targets) {
      if (b.damageState.unaffected) continue;
      await move.pbEffectAgainstTarget(user, b);
    }
    await move.pbEffectGeneral(user);
    for (const b of targets) if (b.isFainted()) b.pbFaint();
    if (user.isFainted()) user.pbFaint();
    if (!user.hasActiveAbility('SHEERFORCE')) {
      for (const b of targets) {
        if (b.damageState.calcDamage === 0) continue;
        const chance = move.pbAdditionalEffectChance(user, b);
        if (chance <= 0) continue;
        if (battle.pbRandom(100) < chance) await move.pbAdditionalEffect(user, b);
      }
    }
    for (const b of targets) {
      if (b.isFainted()) continue;
      if (b.damageState.calcDamage === 0 || b.damageState.substitute) continue;
      const chance = move.pbFlinchChance(user, b);
      if (chance <= 0) continue;
      if (battle.pbRandom(100) < chance) b.pbFlinch(user);
    }
    for (const b of targets) {
      if (b.damageState.unaffected || !b.damageState.berryWeakened) continue;
      battle.pbDisplay(`¡${b.itemName()} redujo el daño de ${b.pbThis(true)}!`);
      b.pbConsumeItem();
    }
    if (['FIRE', 'WATER'].includes(move.calcType)) {
      for (const b of targets) {
        if (b.damageState.unaffected || b.damageState.calcDamage === 0 || b.damageState.substitute) continue;
        if (!b.hasActiveAbility('STEAMENGINE')) continue;
        if (b.pbCanRaiseStatStage('SPEED', b)) b.pbRaiseStatStageByAbility('SPEED', 6, b);
      }
    }
    for (const b of targets) if (b.isFainted()) b.pbFaint();
    if (user.isFainted()) user.pbFaint();
    if (move.pbRepeatHit() && hitNum === 0 && targets.some((b) => !b.isFainted() && !b.damageState.unaffected)) {
      await this.pbProcessMoveHit(move, user, allTargets, 1, skipAccuracyCheck);
    }
    return true;
  },
});
