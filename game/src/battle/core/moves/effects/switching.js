// Efectos de cambio, atrapamiento y orden de actuación (030_Move/014_MoveEffects_SwitchingActing).
import { Move, parseFunctionCode } from '../move.js';
import { TargetMultiStatDownMove, WeatherMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');
const failT = (move, show) => { if (show) failMsg(move.battle); return true; };
const codeOf = (battle, moveId) => {
  const d = moveId ? battle.db.moves[moveId] : null;
  return d ? parseFunctionCode(d.functionCode).code : null;
};

/** Retira al combatiente y saca al sustituto elegido por su dueño (Ida y Vuelta, Relevo…). */
async function switchOutBattler(battle, battler, switched, { batonPass = false, announce = true, keepMoldBreaker = false } = {}) {
  if (announce) battle.pbDisplay(`¡${battler.pbThis()} volvió con ${battle.pbGetOwnerName(battler.index)}!`);
  await battle.pbPursuit(battler.index);
  if (battler.isFainted()) return false;
  const newPkmn = await battle.pbGetReplacementPokemonIndex(battler.index);
  if (newPkmn < 0) return false;
  battle.pbRecallAndReplace(battler.index, newPkmn, false, batonPass);
  battle.pbClearChoice(battler.index);
  if (!keepMoldBreaker) battle.moldBreaker = false;
  await battle.pbOnBattlerEnteringBattle(battler.index);
  switched.push(battler.index);
  return true;
}

/** Arrastra a un objetivo y saca uno aleatorio (Rugido, Cola Dragón). */
async function dragOutTarget(battle, b, switched) {
  const newPkmn = await battle.pbGetReplacementPokemonIndex(b.index, true);
  if (newPkmn < 0) return false;
  battle.pbRecallAndReplace(b.index, newPkmn, true);
  battle.pbDisplay(`¡${b.pbThis()} fue arrastrado al combate!`);
  battle.pbClearChoice(b.index);
  await battle.pbOnBattlerEnteringBattle(b.index);
  switched.push(b.index);
  return true;
}

const clingsOn = (move, b) => b.hasActiveAbility(['SUCTIONCUPS', 'GUARDDOG']) && !move.battle.moldBreaker;

class FleeFromBattle extends Move {
  pbMoveFailed(user) {
    if (!this.battle.pbCanRun(user.index) || (user.wild() && user.allAllies().length > 0)) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    this.battle.pbDisplay(`¡${user.pbThis()} ha huido del combate!`);
    this.battle.decision = 3;
  }
}

class SwitchOutUserStatusMove extends Move {
  pbMoveFailed(user) {
    if (user.wild()) {
      if (!this.battle.pbCanRun(user.index) || user.allAllies().length > 0) { failMsg(this.battle); return true; }
    } else if (!this.battle.pbCanChooseNonActive(user.index)) {
      failMsg(this.battle);
      return true;
    }
    return false;
  }
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    if (user.wild()) return;
    await switchOutBattler(this.battle, user, switched);
  }
  pbEffectGeneral(user) {
    if (!user.wild()) return;
    this.battle.pbDisplay(`¡${user.pbThis()} ha huido del combate!`);
    this.battle.decision = 3;
  }
}

class SwitchOutUserDamagingMove extends Move {
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    if (user.isFainted() || numHits === 0 || this.battle.pbAllFainted(user.idxOpposingSide())) return;
    if (targets.length > 0 && targets.every((b) => switched.includes(b.index))) return;
    if (!this.battle.pbCanChooseNonActive(user.index)) return;
    await switchOutBattler(this.battle, user, switched);
  }
}

class LowerTargetAtkSpAtk1SwitchOutUser extends TargetMultiStatDownMove {
  constructor(...a) { super(...a); this.statDown = ['ATTACK', 1, 'SPECIAL_ATTACK', 1]; }
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    let switcher = user;
    for (const b of targets) {
      if (switched.includes(b.index)) continue;
      if (b.effects.MagicCoat || b.effects.MagicBounce) switcher = b;
    }
    if (switcher.isFainted() || numHits === 0) return;
    if (!this.battle.pbCanChooseNonActive(switcher.index)) return;
    await switchOutBattler(this.battle, switcher, switched, { keepMoldBreaker: switcher.index !== user.index });
  }
}

class SwitchOutUserPassOnEffects extends Move {
  pbMoveFailed(user) {
    if (!this.battle.pbCanChooseNonActive(user.index)) { failMsg(this.battle); return true; }
    return false;
  }
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    if (user.isFainted() || numHits === 0 || !this.battle.pbCanChooseNonActive(user.index)) return;
    await switchOutBattler(this.battle, user, switched, { batonPass: true, announce: false });
  }
}

class SwitchOutTargetStatusMove extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const battle = this.battle;
    if (target.isCommander()) return failT(this, show);
    if (clingsOn(this, target)) {
      if (show) {
        battle.pbShowAbilitySplash(target);
        battle.pbDisplay(`¡${target.pbThis()} se aferró!`);
        battle.pbHideAbilitySplash(target);
      }
      return true;
    }
    if (target.effects.Ingrain) {
      if (show) battle.pbDisplay(`¡${target.pbThis()} se aferró con sus raíces!`);
      return true;
    }
    if (target.wild() && target.allAllies().length === 0 && battle.canRun) {
      if (target.level > user.level) return failT(this, show);
    } else if (!target.wild()) {
      let canSwitch = false;
      battle.eachInTeamFromBattlerIndex(target.index, (_p, i) => { if (!canSwitch) canSwitch = battle.pbCanSwitchIn(target.index, i); });
      if (!canSwitch) return failT(this, show);
    } else {
      return failT(this, show);
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (target.wild()) this.battle.decision = 3;
  }
  async pbSwitchOutTargetEffect(user, targets, numHits, switched) {
    if (switched.length > 0 || user.isFainted() || numHits === 0) return;
    for (const b of targets) {
      if (b.isFainted() || b.damageState.unaffected || b.wild() || b.effects.Ingrain || clingsOn(this, b)) continue;
      if (await dragOutTarget(this.battle, b, switched)) break;
    }
  }
}

class SwitchOutTargetDamagingMove extends Move {
  pbEffectAgainstTarget(user, target) {
    if (target.wild() && target.allAllies().length === 0 && this.battle.canRun && target.level <= user.level &&
        (target.effects.Substitute === 0 || this.ignoresSubstitute(user))) {
      this.battle.decision = 3;
    }
  }
  async pbSwitchOutTargetEffect(user, targets, numHits, switched) {
    if (switched.length > 0 || user.isFainted() || numHits === 0) return;
    for (const b of targets) {
      if (b.isFainted() || b.damageState.unaffected || b.damageState.substitute || b.wild()) continue;
      if (b.effects.Ingrain || clingsOn(this, b) || b.isCommander()) continue;
      if (await dragOutTarget(this.battle, b, switched)) break;
    }
  }
}

const BIND_MESSAGES = {
  BIND: (u, t) => `¡Atadura de ${u.pbThis(true)} oprime a ${t.pbThis(true)}!`,
  CLAMP: (u, t) => `¡${u.pbThis()} atenazó a ${t.pbThis(true)}!`,
  INFESTATION: (u, t) => `¡${t.pbThis()} es presa del acoso de ${u.pbThis(true)}!`,
  MAGMASTORM: (u, t) => `¡Lluvia Ígnea atrapó a ${t.pbThis(true)}!`,
  SANDTOMB: (u, t) => `¡Bucle Arena atrapó a ${t.pbThis(true)}!`,
  WRAP: (u, t) => `¡${t.pbThis()} fue atrapado por ${u.pbThis(true)}!`,
};

class BindTarget extends Move {
  pbEffectAgainstTarget(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.effects.Trapping > 0) return;
    target.effects.Trapping = user.hasActiveItem('GRIPCLAW') ? 8 : 5 + this.battle.pbRandom(2);
    target.effects.TrappingMove = this.id;
    target.effects.TrappingUser = user.index;
    const msg = BIND_MESSAGES[this.id];
    this.battle.pbDisplay(msg ? msg(user, target) : `¡${target.pbThis()} fue atrapado en el torbellino!`);
  }
}

class BindTargetDoublePowerIfTargetUnderwater extends BindTarget {
  hitsDivingTargets() { return true; }
  pbModifyDamage(mult, user, target) {
    return target.inTwoTurnAttack('TwoTurnAttackInvulnerableUnderwater') ? mult * 2 : mult;
  }
}

const ghostImmune = (t) => t.pbHasType('GHOST');

class TrapTargetInBattle extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    if (target.effects.MeanLook >= 0) return failT(this, show);
    if (ghostImmune(target)) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    return false;
  }
  trap(user, target) {
    target.effects.MeanLook = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede escapar!`);
  }
  pbEffectAgainstTarget(user, target) {
    if (!this.damagingMove()) this.trap(user, target);
  }
  pbAdditionalEffect(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.effects.MeanLook >= 0 || ghostImmune(target)) return;
    this.trap(user, target);
  }
}

class TrapTargetInBattleMainEffect extends Move {
  canMagicCoat() { return true; }
  pbEffectAgainstTarget(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.effects.MeanLook >= 0 || ghostImmune(target)) return;
    target.effects.MeanLook = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede escapar!`);
  }
}

class TrapTargetInBattleLowerTargetDefSpDef1EachTurn extends Move {
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    if (target.effects.Octolock >= 0) return failT(this, show);
    if (ghostImmune(target)) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Octolock = user.index;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede escapar debido a ${this.name}!`);
  }
}

class TrapUserAndTargetInBattle extends Move {
  pbEffectAgainstTarget(user, target) {
    if (user.isFainted() || target.isFainted() || target.damageState.substitute || ghostImmune(target)) return;
    if (user.trappedInBattle() || target.trappedInBattle()) return;
    target.effects.JawLock = user.index;
    this.battle.pbDisplay('¡Ningún Pokémon puede huir!');
  }
}

class TrapAllBattlersInBattleForOneTurn extends Move {
  pbMoveFailed() {
    if (this.battle.field.effects.FairyLock > 0) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral() {
    this.battle.field.effects.FairyLock = 2;
    this.battle.pbDisplay('Nadie podrá huir durante el próximo turno.');
  }
}

class PursueSwitchingFoe extends Move {
  pbAccuracyCheck(user, target) { return this.battle.switching ? true : super.pbAccuracyCheck(user, target); }
  pbBaseDamage(bd) { return this.battle.switching ? bd * 2 : bd; }
}

class UsedAfterUserTakesPhysicalDamage extends Move {
  pbDisplayChargeMessage(user) {
    user.effects.ShellTrap = true;
    this.battle.pbCommonAnimation('ShellTrap', user);
    this.battle.pbDisplay(`¡${user.pbThis()} preparó una trampa!`);
  }
  pbDisplayUseMessage(user) { if (user.tookPhysicalHit) super.pbDisplayUseMessage(user); }
  pbMoveFailed(user) {
    if (!user.effects.ShellTrap) { failMsg(this.battle); return true; }
    if (!user.tookPhysicalHit) {
      this.battle.pbDisplay(`¡La trampa de ${user.pbThis(true)} no funcionó!`);
      return true;
    }
    return false;
  }
}

class UsedAfterAllyRoundWithDoublePower extends Move {
  pbBaseDamage(bd, user) { return user.pbOwnSide().effects.Round ? bd * 2 : bd; }
  pbEffectGeneral(user) {
    user.pbOwnSide().effects.Round = true;
    for (const b of user.allAllies()) {
      const ch = this.battle.choices[b.index];
      if (ch.action !== 'UseMove' || b.movedThisRound() || !ch.move) continue;
      if (ch.move.functionCode !== this.functionCode) continue;
      b.effects.MoveNext = true;
      b.effects.Quash = 0;
      break;
    }
  }
}

class TargetActsNext extends Move {
  ignoresSubstitute() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.pbMoveFailedTargetAlreadyMoved(target, show)) return true;
    if (target.effects.MoveNext || !this.battle.choices[target.index].move) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.MoveNext = true;
    target.effects.Quash = 0;
    this.battle.pbDisplay(`¡${target.pbThis()} ha decidido aceptar la oportunidad!`);
  }
}

const highestQuash = (battle) => battle.allBattlers().reduce((m, b) => Math.max(m, b.effects.Quash), 0);

class TargetActsLast extends Move {
  pbFailsAgainstTarget(user, target, show) {
    if (this.pbMoveFailedTargetAlreadyMoved(target, show)) return true;
    if (!this.battle.choices[target.index].move) return failT(this, show);
    const hq = highestQuash(this.battle);
    if (hq > 0 && target.effects.Quash === hq) return failT(this, show);
    const order = this.battle.pbPriority();
    if (hq === 0 && order.length && order[order.length - 1].index === target.index) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Quash = highestQuash(this.battle) + 1;
    target.effects.MoveNext = false;
    this.battle.pbDisplay(`¡${target.pbThis()} ha retrasado su turno!`);
  }
}

const INSTRUCT_BLACKLIST = new Set(['MultiTurnAttackBideThenReturnDoubleDamage', 'ProtectUserFromDamagingMovesKingsShield',
  'TargetUsesItsLastUsedMoveAgain', 'Struggle', 'ReplaceMoveThisBattleWithTargetLastMoveUsed', 'ReplaceMoveWithTargetLastMoveUsed',
  'TransformUserIntoTarget', 'UseLastMoveUsedByTarget', 'UseLastMoveUsed', 'UseMoveTargetIsAboutToUse',
  'UseMoveDependingOnEnvironment', 'UseRandomUserMoveIfAsleep', 'UseRandomMoveFromUserParty', 'UseRandomMove',
  'AttackAndSkipNextTurn', 'TwoTurnAttack', 'TwoTurnAttackOneTurnInSun', 'TwoTurnAttackParalyzeTarget', 'TwoTurnAttackBurnTarget',
  'TwoTurnAttackFlinchTarget', 'TwoTurnAttackChargeRaiseUserDefense1', 'TwoTurnAttackInvulnerableInSky',
  'TwoTurnAttackInvulnerableUnderground', 'TwoTurnAttackInvulnerableUnderwater', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
  'TwoTurnAttackInvulnerableRemoveProtections', 'TwoTurnAttackInvulnerableInSkyTargetCannotAct',
  'AllBattlersLoseHalfHPUserSkipsNextTurn', 'TwoTurnAttackRaiseUserSpAtkSpDefSpd2', 'FailsIfUserDamagedThisTurn',
  'UsedAfterUserTakesPhysicalDamage', 'BurnAttackerBeforeUserActs', 'StarmobileBurnTarget', 'StarmobileParalyzeTarget',
  'StarmobileConfuseTarget', 'StarmobilePoisonTarget', 'StarmobileSleepTarget']);
const FOCUS_CODES = ['FailsIfUserDamagedThisTurn', 'UsedAfterUserTakesPhysicalDamage', 'BurnAttackerBeforeUserActs'];

class TargetUsesItsLastUsedMoveAgain extends Move {
  ignoresSubstitute() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const last = target.lastRegularMoveUsed;
    if (!last || !target.pbHasMove(last) || !this.battle.db.moves[last] || target.usingMultiTurnAttack()) return failT(this, show);
    const tm = this.battle.choices[target.index].move;
    if (tm && FOCUS_CODES.includes(tm.functionCode)) return failT(this, show);
    if (INSTRUCT_BLACKLIST.has(codeOf(this.battle, last))) return failT(this, show);
    const m = target.pbGetMoveWithID(last);
    if (m.pp === 0 && m.totalPP > 0) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) { target.effects.Instruct = true; }
}

class StartSlowerBattlersActFirst extends Move {
  pbEffectGeneral(user) {
    const f = this.battle.field.effects;
    f.TrickRoom = f.TrickRoom > 0 ? 0 : 5;
    this.battle.queueEvent('trickRoom', f.TrickRoom > 0);
    this.battle.pbDisplay(`¡${user.pbThis()} alteró las dimensiones!`);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    if (this.battle.field.effects.TrickRoom > 0) return;
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
  }
}

const priorityInTerrain = (terrain) => class extends Move {
  pbPriority(user) {
    let ret = super.pbPriority(user);
    if (this.battle.field.terrain === terrain && user.affectedByTerrain()) ret += 1;
    return ret;
  }
};

function lowerLastMovePP(move, target, amount) {
  const last = target.pbGetMoveWithID(target.lastRegularMoveUsed);
  if (!last || last.pp === 0 || last.totalPP <= 0) return false;
  const reduction = Math.min(amount, last.pp);
  target.pbSetPP(last, last.pp - reduction);
  move.battle.pbDisplay(`¡El movimiento ${last.name} de ${target.pbThis(true)} ha perdido ${reduction} PP!`);
  return true;
}

class LowerPPOfTargetLastMoveBy3 extends Move {
  pbAdditionalEffect(user, target) {
    if (target.isFainted() || target.damageState.substitute) return;
    lowerLastMovePP(this, target, 3);
  }
}

class LowerPPOfTargetLastMoveBy4 extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const last = target.pbGetMoveWithID(target.lastRegularMoveUsed);
    if (!last || last.pp === 0 || last.totalPP <= 0) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) { lowerLastMovePP(this, target, 4); }
}

const hasUsableLastMove = (target) => target.moves.some((m) => m.id === target.lastRegularMoveUsed && !(m.pp === 0 && m.totalPP > 0));

class DisableTargetLastMoveUsed extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Disable > 0 || !target.lastRegularMoveUsed) return failT(this, show);
    if (this.pbMoveFailedAromaVeil(user, target, show)) return true;
    if (!hasUsableLastMove(target)) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Disable = 5;
    target.effects.DisableMove = target.lastRegularMoveUsed;
    this.battle.pbDisplay(`¡Se ha anulado el movimiento ${this.battle.moveName(target.lastRegularMoveUsed)} de ${target.pbThis(true)}!`);
    target.pbItemStatusCureCheck();
  }
}

class DisableTargetUsingSameMoveConsecutively extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Torment) return failT(this, show);
    return this.pbMoveFailedAromaVeil(user, target, show);
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Torment = true;
    this.battle.pbDisplay(`¡${target.pbThis()} es víctima de un Tormento!`);
    target.pbItemStatusCureCheck();
  }
}

const ENCORE_BLACKLIST = new Set(['DisableTargetUsingDifferentMove', 'Struggle', 'ReplaceMoveThisBattleWithTargetLastMoveUsed',
  'ReplaceMoveWithTargetLastMoveUsed', 'TransformUserIntoTarget', 'UseLastMoveUsedByTarget', 'StarmobileBurnTarget',
  'StarmobileParalyzeTarget', 'StarmobileConfuseTarget', 'StarmobilePoisonTarget', 'StarmobileSleepTarget', 'UseLastMoveUsed',
  'UseMoveTargetIsAboutToUse', 'UseMoveDependingOnEnvironment', 'UseRandomUserMoveIfAsleep', 'UseRandomMoveFromUserParty',
  'UseRandomMove']);

class DisableTargetUsingDifferentMove extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Encore > 0) return failT(this, show);
    const last = target.lastRegularMoveUsed;
    if (!last || !this.battle.db.moves[last] || ENCORE_BLACKLIST.has(codeOf(this.battle, last))) return failT(this, show);
    if (target.effects.ShellTrap) return failT(this, show);
    if (this.pbMoveFailedAromaVeil(user, target, show)) return true;
    if (!hasUsableLastMove(target)) return failT(this, show);
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Encore = 4;
    target.effects.EncoreMove = target.lastRegularMoveUsed;
    this.battle.pbDisplay(`¡${target.pbThis()} sufrió los efectos de Otra Vez!`);
    target.pbItemStatusCureCheck();
  }
}

class DisableTargetStatusMoves extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Taunt > 0) return failT(this, show);
    if (this.pbMoveFailedAromaVeil(user, target, show)) return true;
    if (target.hasActiveAbility('OBLIVIOUS') && !this.battle.moldBreaker) {
      if (show) {
        this.battle.pbShowAbilitySplash(target);
        failMsg(this.battle);
        this.battle.pbHideAbilitySplash(target);
      }
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Taunt = 4;
    this.battle.pbDisplay(`¡${target.pbThis()} se dejó engañar por Mofa!`);
    target.pbItemStatusCureCheck();
  }
}

class DisableTargetHealingMoves extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.HealBlock > 0) return failT(this, show);
    return this.pbMoveFailedAromaVeil(user, target, show);
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.HealBlock = 5;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede curarse!`);
    target.pbItemStatusCureCheck();
  }
}

class DisableTargetSoundMoves extends Move {
  pbAdditionalEffect(user, target) {
    if (target.isFainted() || target.damageState.substitute || target.effects.ThroatChop !== 0) return;
    this.battle.pbDisplay(`¡El efecto de ${this.name} impide a ${target.pbThis(true)} usar ciertos movimientos!`);
    target.effects.ThroatChop = 2;
  }
}

class DisableTargetMovesKnownByUser extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Imprison) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    user.effects.Imprison = true;
    this.battle.pbDisplay(`¡${user.pbThis()} selló movimientos del oponente!`);
  }
}

class SwitchOutUserStartHailWeather extends WeatherMove {
  constructor(...a) { super(...a); this.weatherType = 'Hail'; }
  pbDisplayUseMessage(user) {
    this.battle.pbDisplayBrief(`¡${user.pbThis()} se está preparando para contar una broma que te dejará frío!`);
    super.pbDisplayUseMessage(user);
  }
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    if (user.isFainted() || numHits === 0 || !this.battle.pbCanChooseNonActive(user.index)) return;
    await switchOutBattler(this.battle, user, switched);
  }
}

class UserMakeSubstituteSwitchOut extends Move {
  pbMoveFailed(user) {
    if (user.effects.Substitute > 0) {
      this.battle.pbDisplay(`¡${user.pbThis()} ya está detrás de un sustituto!`);
      return true;
    }
    if (!this.battle.pbCanChooseNonActive(user.index)) {
      this.battle.pbDisplay('¡Pero no puede cambiar de Pokémon!');
      return true;
    }
    this.lifeCost = Math.max(Math.ceil(user.totalhp / 2), 1);
    this.subLife = Math.max(Math.ceil(this.lifeCost / 4), 1);
    if (user.hp <= this.lifeCost) {
      this.battle.pbDisplay('¡Pero no tiene suficientes PS para hacer un sustituto!');
      return true;
    }
    return false;
  }
  pbOnStartUse(user) {
    user.pbReduceHP(this.lifeCost, false, false);
    user.pbItemHPHealCheck();
  }
  pbEffectGeneral(user) {
    user.effects.Trapping = 0;
    user.effects.TrappingMove = null;
    user.effects.Substitute = this.subLife;
    this.battle.pbDisplay(`¡${user.pbThis()} mudó su cola para crear un señuelo!`);
  }
  async pbEndOfMoveUsageEffect(user, targets, numHits, switched) {
    if (user.isFainted() || numHits === 0 || !this.battle.pbCanChooseNonActive(user.index)) return;
    const oldSub = user.effects.Substitute;
    if (await switchOutBattler(this.battle, user, switched)) user.effects.Substitute = oldSub;
  }
}

registerMoves({
  FleeFromBattle,
  SwitchOutUserStatusMove,
  SwitchOutUserDamagingMove,
  LowerTargetAtkSpAtk1SwitchOutUser,
  SwitchOutUserPassOnEffects,
  SwitchOutTargetStatusMove,
  SwitchOutTargetDamagingMove,
  BindTarget,
  BindTargetDoublePowerIfTargetUnderwater,
  TrapTargetInBattle,
  TrapTargetInBattleMainEffect,
  TrapTargetInBattleLowerTargetDefSpDef1EachTurn,
  TrapUserAndTargetInBattle,
  TrapAllBattlersInBattleForOneTurn,
  PursueSwitchingFoe,
  UsedAfterUserTakesPhysicalDamage,
  UsedAfterAllyRoundWithDoublePower,
  TargetActsNext,
  TargetActsLast,
  TargetUsesItsLastUsedMoveAgain,
  StartSlowerBattlersActFirst,
  HigherPriorityInGrassyTerrain: priorityInTerrain('Grassy'),
  HigherPriorityInMistyTerrain: priorityInTerrain('Misty'),
  LowerPPOfTargetLastMoveBy3,
  LowerPPOfTargetLastMoveBy4,
  DisableTargetLastMoveUsed,
  DisableTargetUsingSameMoveConsecutively,
  DisableTargetUsingDifferentMove,
  DisableTargetStatusMoves,
  DisableTargetHealingMoves,
  DisableTargetSoundMoves,
  DisableTargetMovesKnownByUser,
  SwitchOutUserStartHailWeather,
  UserMakeSubstituteSwitchOut,
});

export { switchOutBattler };
