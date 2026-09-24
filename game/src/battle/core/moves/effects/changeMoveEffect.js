// Efectos que cambian o llaman a otros movimientos (030_Move/013_MoveEffects_ChangeMoveEffect).
import { Move, parseFunctionCode } from '../move.js';
import { FixedDamageMove, PledgeMove } from '../baseEffects.js';
import { registerMoves, createMove } from '../registry.js';
import { targetData } from '../../constants.js';
import { totalPP } from '../../pokemon.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');
const codeOf = (battle, moveId) => {
  const d = battle.db.moves[moveId];
  return d ? parseFunctionCode(d.functionCode).code : null;
};

// Listas negras compartidas (Essentials 21.1 + Añil gen 9).
const STARMOBILE = ['StarmobileBurnTarget', 'StarmobileParalyzeTarget', 'StarmobileConfuseTarget', 'StarmobilePoisonTarget',
  'StarmobileSleepTarget'];
const PROTECTION = ['ProtectUser', 'ProtectUserSideFromPriorityMoves', 'ProtectUserSideFromMultiTargetDamagingMoves',
  'UserEnduresFaintingThisTurn', 'ProtectUserSideFromDamagingMovesIfUserFirstTurn', 'ProtectUserSideFromStatusMoves',
  'ProtectUserFromDamagingMovesKingsShield', 'ProtectUserFromDamagingMovesObstruct', 'ProtectUserFromTargetingMovesSpikyShield',
  'ProtectUserBanefulBunker'];
const CALLERS = ['UseLastMoveUsedByTarget', 'UseLastMoveUsed', 'UseMoveTargetIsAboutToUse', 'UseMoveDependingOnEnvironment',
  'UseRandomUserMoveIfAsleep', 'UseRandomMoveFromUserParty', 'UseRandomMove'];
const REDIRECT = ['BounceBackProblemCausingStatusMoves', 'StealAndUseBeneficialStatusMove', 'RedirectAllMovesToUser',
  'RedirectAllMovesToTarget'];
const KO_SETUP = ['ReduceAttackerMovePPTo0IfUserFaints', 'AttackerFaintsIfUserFaints'];
const ITEM_MOVING = ['UserTakesTargetItem', 'UserTargetSwapItems', 'TargetTakesUserItem'];
const FOCUSING = ['FailsIfUserDamagedThisTurn', 'UsedAfterUserTakesPhysicalDamage', 'BurnAttackerBeforeUserActs'];
const MOVESET = ['ReplaceMoveThisBattleWithTargetLastMoveUsed', 'ReplaceMoveWithTargetLastMoveUsed', 'TransformUserIntoTarget'];
const COUNTERS = ['CounterPhysicalDamage', 'CounterSpecialDamage', 'CounterDamagePlusHalf'];
const TWO_TURN = ['TwoTurnAttack', 'TwoTurnAttackOneTurnInSun', 'TwoTurnAttackParalyzeTarget', 'TwoTurnAttackBurnTarget',
  'TwoTurnAttackFlinchTarget', 'TwoTurnAttackChargeRaiseUserDefense1', 'TwoTurnAttackInvulnerableInSky',
  'TwoTurnAttackInvulnerableUnderground', 'TwoTurnAttackInvulnerableUnderwater', 'TwoTurnAttackInvulnerableInSkyParalyzeTarget',
  'TwoTurnAttackInvulnerableRemoveProtections', 'TwoTurnAttackInvulnerableInSkyTargetCannotAct',
  'AllBattlersLoseHalfHPUserSkipsNextTurn', 'TwoTurnAttackRaiseUserSpAtkSpDefSpd2'];

const COPYCAT_BLACKLIST = new Set(['Struggle', 'FailsIfUserNotConsumedBerry', ...MOVESET, ...COUNTERS, 'PowerUpAllyMove',
  'RemoveProtections', ...PROTECTION, ...CALLERS, ...REDIRECT, ...KO_SETUP, ...ITEM_MOVING, ...FOCUSING,
  'DoesNothingFailsIfNoAlly', 'DoesNothingCongratulations', ...STARMOBILE, 'ProtectUserBurningBulwark',
  'ProtectUserFromDamagingMovesSilkTrap', 'TerapagosCategoryDependsOnHigherDamage', 'SwitchOutTargetStatusMove',
  'SwitchOutTargetDamagingMove']);
const ME_FIRST_BLACKLIST = new Set(['UserTakesTargetItem', 'Struggle', 'FailsIfUserNotConsumedBerry', ...COUNTERS, ...FOCUSING,
  ...STARMOBILE]);
const METRONOME_BLACKLIST = new Set(['FlinchTargetFailsIfUserNotAsleep', 'TargetActsNext', 'TargetActsLast',
  'TargetUsesItsLastUsedMoveAgain', 'Struggle', 'FailsIfUserNotConsumedBerry', ...MOVESET, ...COUNTERS, 'PowerUpAllyMove',
  'RemoveProtections', ...PROTECTION, 'ProtectUserFromDamagingMovesSilkTrap', 'ProtectUserBurningBulwark', ...CALLERS,
  ...REDIRECT, ...KO_SETUP, ...ITEM_MOVING, ...FOCUSING, 'DoesNothingFailsIfNoAlly', 'DoesNothingCongratulations']);
const ASSIST_BLACKLIST = new Set(['Struggle', 'FailsIfUserNotConsumedBerry', ...MOVESET, ...COUNTERS, 'PowerUpAllyMove',
  'RemoveProtections', ...PROTECTION, 'ProtectUserFromDamagingMovesSilkTrap', 'ProtectUserBurningBulwark', ...CALLERS,
  ...REDIRECT, ...KO_SETUP, 'SwitchOutTargetDamagingMove', ...ITEM_MOVING, ...FOCUSING, 'DoesNothingFailsIfNoAlly',
  'DoesNothingCongratulations', ...STARMOBILE, 'TerapagosCategoryDependsOnHigherDamage', ...TWO_TURN,
  'SwitchOutTargetStatusMove']);
const SLEEP_TALK_BLACKLIST = new Set(['MultiTurnAttackPreventSleeping', 'MultiTurnAttackBideThenReturnDoubleDamage', 'Struggle',
  'FailsIfUserNotConsumedBerry', 'ReplaceMoveThisBattleWithTargetLastMoveUsed', 'ReplaceMoveWithTargetLastMoveUsed',
  ...CALLERS, ...TWO_TURN, ...FOCUSING, ...STARMOBILE]);
const MIMIC_BLACKLIST = new Set(['UseRandomMove', 'Struggle', ...MOVESET, ...STARMOBILE, 'TerapagosCategoryDependsOnHigherDamage']);
const SKETCH_BLACKLIST = new Set(['ReplaceMoveWithTargetLastMoveUsed', 'Struggle', 'SleepTargetIfUserDarkrai',
  'HoopaRemoveProtectionsBypassSubstituteLowerUserDef1', 'TypeDependsOnUserMorpekoFormRaiseUserSpeed1', ...STARMOBILE,
  'RevivePokemonHalfHP', 'TerapagosCategoryDependsOnHigherDamage']);

class RedirectAllMovesToUser extends Move {
  pbEffectGeneral(user) {
    user.effects.FollowMe = 1;
    for (const b of user.allAllies()) {
      if (b.effects.FollowMe < user.effects.FollowMe) continue;
      user.effects.FollowMe = b.effects.FollowMe + 1;
    }
    if (this.powderMove()) user.effects.RagePowder = true;
    this.battle.pbDisplay(`¡${user.pbThis()} se ha convertido en el centro de atención!`);
  }
}

class RedirectAllMovesToTarget extends Move {
  canMagicCoat() { return true; }
  pbEffectAgainstTarget(user, target) {
    target.effects.Spotlight = 1;
    for (const b of target.allAllies()) {
      if (b.effects.Spotlight < target.effects.Spotlight) continue;
      target.effects.Spotlight = b.effects.Spotlight + 1;
    }
    this.battle.pbDisplay(`¡${target.pbThis()} se ha convertido en el centro de atención!`);
  }
}

class CannotBeRedirected extends Move {
  cannotRedirect() { return true; }
}

class RandomlyDamageOrHealTarget extends Move {
  pbOnStartUse() {
    const r = this.battle.pbRandom(100);
    this.presentDmg = r < 40 ? 40 : r < 70 ? 80 : r < 80 ? 120 : 0;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (this.presentDmg > 0) return false;
    if (!target.canHeal()) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbDamagingMove() { return this.presentDmg === 0 ? false : super.pbDamagingMove(); }
  pbBaseDamage() { return this.presentDmg; }
  pbEffectAgainstTarget(user, target) {
    if (this.presentDmg > 0) return;
    target.pbRecoverHP(Math.floor(target.totalhp / 4));
    this.battle.pbDisplay(`Los PS de ${target.pbThis(true)} han sido restaurados.`);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, this.presentDmg === 0 ? 1 : hitNum, showAnimation);
  }
}

class HealAllyOrDamageFoe extends Move {
  pbTarget(user) {
    if (user && user.effects.HealBlock > 0) return targetData('NearFoe');
    return super.pbTarget(user);
  }
  pbOnStartUse(user, targets) { this.healing = targets.length > 0 && !user.opposes(targets[0]); }
  pbFailsAgainstTarget(user, target, show) {
    if (!this.healing) return false;
    if ((target.effects.Substitute > 0 && !this.ignoresSubstitute(user)) || !target.canHeal()) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbDamagingMove() { return this.healing ? false : super.pbDamagingMove(); }
  pbEffectAgainstTarget(user, target) {
    if (!this.healing) return;
    target.pbRecoverHP(Math.floor(target.totalhp / 2));
    this.battle.pbDisplay(`Los PS de ${target.pbThis(true)} han sido restaurados.`);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, this.healing ? 1 : hitNum, showAnimation);
  }
}

class CurseTargetOrLowerUserSpd1RaiseUserAtkDef1 extends Move {
  constructor(...a) {
    super(...a);
    this.statUp = ['ATTACK', 1, 'DEFENSE', 1];
    this.statDown = ['SPEED', 1];
  }
  ignoresSubstitute() { return true; }
  pbTarget(user) {
    if (user && user.pbHasType('GHOST')) return targetData('RandomNearFoe');
    return super.pbTarget(user);
  }
  pbMoveFailed(user) {
    if (user.pbHasType('GHOST')) return false;
    const can = user.pbCanRaiseStatStage('ATTACK', user, this) || user.pbCanRaiseStatStage('DEFENSE', user, this) ||
      user.pbCanLowerStatStage('SPEED', user, this);
    if (!can) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (user.pbHasType('GHOST') && target.effects.Curse) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    if (user.pbHasType('GHOST')) return;
    if (user.pbCanLowerStatStage('SPEED', user, this)) user.pbLowerStatStage('SPEED', 1, user);
    let showAnim = true;
    for (let i = 0; i < this.statUp.length; i += 2) {
      if (!user.pbCanRaiseStatStage(this.statUp[i], user, this)) continue;
      if (user.pbRaiseStatStage(this.statUp[i], this.statUp[i + 1], user, showAnim)) showAnim = false;
    }
  }
  pbEffectAgainstTarget(user, target) {
    if (!user.pbHasType('GHOST')) return;
    this.battle.pbDisplay(`¡${user.pbThis()} reduce sus PS y maldice a ${target.pbThis(true)}!`);
    target.effects.Curse = true;
    user.pbReduceHP(Math.floor(user.totalhp / 2), false, false);
    user.pbItemHPHealCheck();
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, user.pbHasType('GHOST') ? hitNum : 1, showAnimation);
  }
}

const SECRET_POWER_ENV = {
  Grass: 2, TallGrass: 2, Forest: 2, ForestGrass: 2, MovingWater: 5, StillWater: 5, Underwater: 5, Puddle: 6, Cave: 7,
  Rock: 8, Sand: 8, Snow: 9, Ice: 9, Volcano: 10, Graveyard: 11, Sky: 12, Space: 13, UltraSpace: 14,
};
const SECRET_POWER_TERRAIN = { Electric: 1, Grassy: 2, Misty: 3, Psychic: 4 };
const SECRET_POWER_ANIM = ['BODYSLAM', 'THUNDERSHOCK', 'VINEWHIP', 'FAIRYWIND', 'CONFUSION', 'WATERPULSE', 'MUDSHOT', 'ROCKTHROW',
  'MUDSLAP', 'ICESHARD', 'INCINERATE', 'SHADOWSNEAK', 'GUST', 'SWIFT', 'PSYWAVE'];

class EffectDependsOnEnvironment extends Move {
  flinchingMove() { return [6, 10, 12].includes(this.secretPower); }
  pbOnStartUse() {
    this.secretPower = SECRET_POWER_TERRAIN[this.battle.field.terrain] ?? SECRET_POWER_ENV[this.battle.environment] ?? 0;
  }
  pbEffectAfterAllHits(user, target) {
    if (target.isFainted() || target.damageState.unaffected || target.damageState.substitute) return;
    if (user.hasActiveAbility('SHEERFORCE')) return;
    if (this.battle.pbRandom(100) >= this.pbAdditionalEffectChance(user, target)) return;
    const lower = (stat) => { if (target.pbCanLowerStatStage(stat, user, this)) target.pbLowerStatStage(stat, 1, user); };
    switch (this.secretPower) {
      case 2: if (target.pbCanSleep(user, false, this)) target.pbSleep(); break;
      case 10: if (target.pbCanBurn(user, false, this)) target.pbBurn(user); break;
      case 0: case 1: if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user); break;
      case 9: if (target.pbCanFreeze(user, false, this)) target.pbFreeze(null, user); break;
      case 5: lower('ATTACK'); break;
      case 14: lower('DEFENSE'); break;
      case 3: lower('SPECIAL_ATTACK'); break;
      case 4: case 6: case 12: lower('SPEED'); break;
      case 8: lower('ACCURACY'); break;
      case 7: case 11: case 13: target.pbFlinch(user); break;
      default: break;
    }
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    const anim = SECRET_POWER_ANIM[this.secretPower || 0];
    super.pbShowAnimation(this.battle.db.moves[anim] ? anim : 'BODYSLAM', user, targets, hitNum, showAnimation);
  }
}

class HitsAllFoesAndPowersUpInPsychicTerrain extends Move {
  boosted(user) { return this.battle.field.terrain === 'Psychic' && user.affectedByTerrain(); }
  pbTarget(user) { return user && this.boosted(user) ? targetData('AllNearFoes') : super.pbTarget(user); }
  pbBaseDamage(bd, user) { return this.boosted(user) ? Math.floor((bd * 3) / 2) : bd; }
}

class TargetNextFireMoveDamagesTarget extends Move {
  ignoresSubstitute() { return true; }
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Powder) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Powder = true;
    this.battle.pbDisplay(`¡${target.pbThis()} está cubierto de polvo!`);
  }
}

const fusion = (otherField, ownField) => class extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    this.doublePower = this.battle.field.effects[otherField];
    super.pbChangeUsageCounters(user, specialUsage);
  }
  pbBaseDamageMultiplier(mult) { return this.doublePower ? mult * 2 : mult; }
  pbEffectGeneral() { this.battle.field.effects[ownField] = true; }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    const charged = (targets.length > 0 && targets[0].damageState.critical) || this.doublePower;
    super.pbShowAnimation(id, user, targets, charged ? 1 : hitNum, showAnimation);
  }
};

class PowerUpAllyMove extends Move {
  ignoresSubstitute() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.isFainted() || target.effects.HelpingHand) {
      if (show) failMsg(this.battle);
      return true;
    }
    return this.pbMoveFailedTargetAlreadyMoved(target, show);
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.HelpingHand = true;
    this.battle.pbDisplay(`¡${user.pbThis()} está listo para ayudar a ${target.pbThis(true)}!`);
  }
}

/** Contraataque / Manto Espejo / Repr. Metal. */
const counter = (targetFn, damageFn) => class extends FixedDamageMove {
  pbAddTarget(targets, user) {
    const t = targetFn(user);
    if (t == null || t < 0 || !user.opposes(t)) return;
    user.pbAddTarget(targets, user, this.battle.battlers[t], this, false);
  }
  pbMoveFailed(user, targets) {
    if (targets.length === 0) {
      this.battle.pbDisplay('Pero no había objetivo...');
      return true;
    }
    return false;
  }
  pbFixedDamage(user) { return damageFn(user) || 1; }
};

function dropStockpile(move, user, showAnim = true) {
  let anim = showAnim;
  if (user.effects.StockpileDef > 0 && user.pbCanLowerStatStage('DEFENSE', user, move)) {
    if (user.pbLowerStatStage('DEFENSE', user.effects.StockpileDef, user, anim)) anim = false;
  }
  if (user.effects.StockpileSpDef > 0 && user.pbCanLowerStatStage('SPECIAL_DEFENSE', user, move)) {
    user.pbLowerStatStage('SPECIAL_DEFENSE', user.effects.StockpileSpDef, user, anim);
  }
}
function resetStockpile(user) {
  user.effects.Stockpile = 0;
  user.effects.StockpileDef = 0;
  user.effects.StockpileSpDef = 0;
}

class UserAddStockpileRaiseDefSpDef1 extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Stockpile >= 3) {
      this.battle.pbDisplay(`¡${user.pbThis()} no puede reservar más!`);
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    user.effects.Stockpile += 1;
    this.battle.pbDisplay(`¡${user.pbThis()} reservó ${user.effects.Stockpile}!`);
    let showAnim = true;
    if (user.pbCanRaiseStatStage('DEFENSE', user, this) && user.pbRaiseStatStage('DEFENSE', 1, user, showAnim)) {
      user.effects.StockpileDef += 1;
      showAnim = false;
    }
    if (user.pbCanRaiseStatStage('SPECIAL_DEFENSE', user, this) && user.pbRaiseStatStage('SPECIAL_DEFENSE', 1, user, showAnim)) {
      user.effects.StockpileSpDef += 1;
    }
  }
}

class PowerDependsOnUserStockpile extends Move {
  pbMoveFailed(user) {
    if (user.effects.Stockpile === 0) {
      this.battle.pbDisplay('¡Pero no pudo escupir nada!');
      return true;
    }
    return false;
  }
  pbBaseDamage(bd, user) { return 100 * user.effects.Stockpile; }
  pbEffectAfterAllHits(user, target) {
    if (user.isFainted() || user.effects.Stockpile === 0 || target.damageState.unaffected) return;
    this.battle.pbDisplay(`¡Desaparecieron los efectos de la Reserva de ${user.pbThis(true)}!`);
    if (this.battle.pbAllFainted(target.idxOwnSide())) return;
    dropStockpile(this, user);
    resetStockpile(user);
  }
}

class HealUserDependingOnUserStockpile extends Move {
  healingMove() { return true; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Stockpile === 0) {
      this.battle.pbDisplay('¡Pero no pudo tragar nada!');
      return true;
    }
    if (!user.canHeal() && user.effects.StockpileDef === 0 && user.effects.StockpileSpDef === 0) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    const n = Math.max(user.effects.Stockpile, 1);
    const hpGain = n === 1 ? Math.floor(user.totalhp / 4) : n === 2 ? Math.floor(user.totalhp / 2) : user.totalhp;
    if (user.pbRecoverHP(hpGain) > 0) this.battle.pbDisplay(`Los PS de ${user.pbThis(true)} han sido restaurados.`);
    this.battle.pbDisplay(`¡Desaparecieron los efectos de la Reserva de ${user.pbThis(true)}!`);
    dropStockpile(this, user);
    resetStockpile(user);
  }
}

const pledge = (combos) => class extends PledgeMove {
  constructor(...a) { super(...a); this.combos = combos; }
};

class UseLastMoveUsed extends Move {
  callsAnotherMove() { return true; }
  pbChangeUsageCounters(user, specialUsage) {
    super.pbChangeUsageCounters(user, specialUsage);
    this.copiedMove = this.battle.lastMoveUsed;
  }
  pbMoveFailed() {
    if (!this.copiedMove || !this.battle.db.moves[this.copiedMove] || COPYCAT_BLACKLIST.has(codeOf(this.battle, this.copiedMove))) {
      failMsg(this.battle);
      return true;
    }
    return false;
  }
  async pbEffectGeneral(user) { await user.pbUseMoveSimple(this.copiedMove); }
}

class UseLastMoveUsedByTarget extends Move {
  ignoresSubstitute() { return true; }
  callsAnotherMove() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    const d = target.lastRegularMoveUsed ? this.battle.db.moves[target.lastRegularMoveUsed] : null;
    if (!d || !(d.flags || []).includes('CanMirrorMove')) {
      if (show) this.battle.pbDisplay('¡El Movimiento Espejo ha fallado!');
      return true;
    }
    return false;
  }
  async pbEffectAgainstTarget(user, target) { await user.pbUseMoveSimple(target.lastRegularMoveUsed, target.index); }
  pbShowAnimation() {}
}

class UseMoveTargetIsAboutToUse extends Move {
  ignoresSubstitute() { return true; }
  callsAnotherMove() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.pbMoveFailedTargetAlreadyMoved(target, show)) return true;
    const oppMove = this.battle.choices[target.index].move;
    if (!oppMove || oppMove.statusMove() || ME_FIRST_BLACKLIST.has(oppMove.functionCode)) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  async pbEffectAgainstTarget(user, target) {
    user.effects.MeFirst = true;
    await user.pbUseMoveSimple(this.battle.choices[target.index].move.id);
    user.effects.MeFirst = false;
  }
}

const NATURE_POWER_TERRAIN = { Electric: 'THUNDERBOLT', Grassy: 'ENERGYBALL', Misty: 'MOONBLAST', Psychic: 'PSYCHIC' };
const NATURE_POWER_ENV = {
  Grass: 'ENERGYBALL', TallGrass: 'ENERGYBALL', Forest: 'ENERGYBALL', ForestGrass: 'ENERGYBALL', MovingWater: 'HYDROPUMP',
  StillWater: 'HYDROPUMP', Underwater: 'HYDROPUMP', Puddle: 'MUDBOMB', Cave: 'POWERGEM', Rock: 'EARTHPOWER', Sand: 'EARTHPOWER',
  Snow: 'ICEBEAM', Ice: 'ICEBEAM', Volcano: 'LAVAPLUME', Graveyard: 'SHADOWBALL', Sky: 'AIRSLASH', Space: 'DRACOMETEOR',
  UltraSpace: 'PSYSHOCK',
};

class UseMoveDependingOnEnvironment extends Move {
  callsAnotherMove() { return true; }
  pbOnStartUse() {
    const moves = this.battle.db.moves;
    const t = NATURE_POWER_TERRAIN[this.battle.field.terrain];
    const e = NATURE_POWER_ENV[this.battle.environment];
    this.npMove = 'TRIATTACK';
    if (t && moves[t]) this.npMove = t;
    else if (!t && e && moves[e]) this.npMove = e;
  }
  async pbEffectAgainstTarget(user, target) {
    this.battle.pbDisplay(`¡${this.name} se convirtió en ${this.battle.moveName(this.npMove)}!`);
    await user.pbUseMoveSimple(this.npMove, target.index);
  }
}

class UseRandomMove extends Move {
  callsAnotherMove() { return true; }
  pbMoveFailed() {
    const keys = Object.keys(this.battle.db.moves);
    this.metronomeMove = null;
    for (let i = 0; i < 1000; i++) {
      const d = this.battle.db.moves[keys[this.battle.pbRandom(keys.length)]];
      if (METRONOME_BLACKLIST.has(parseFunctionCode(d.functionCode).code)) continue;
      if ((d.flags || []).includes('CannotMetronome') || d.type === 'SHADOW') continue;
      this.metronomeMove = d.id;
      break;
    }
    if (!this.metronomeMove) { failMsg(this.battle); return true; }
    return false;
  }
  async pbEffectGeneral(user) { await user.pbUseMoveSimple(this.metronomeMove); }
}

class UseRandomMoveFromUserParty extends Move {
  callsAnotherMove() { return true; }
  pbMoveFailed(user) {
    this.assistMoves = [];
    this.battle.pbParty(user.index).forEach((pkmn, i) => {
      if (!pkmn || i === user.pokemonIndex || pkmn.egg) return;
      for (const m of pkmn.moves || []) {
        const d = this.battle.db.moves[m.id];
        if (!d || ASSIST_BLACKLIST.has(parseFunctionCode(d.functionCode).code) || d.type === 'SHADOW') continue;
        this.assistMoves.push(m.id);
      }
    });
    if (this.assistMoves.length === 0) { failMsg(this.battle); return true; }
    return false;
  }
  async pbEffectGeneral(user) {
    await user.pbUseMoveSimple(this.assistMoves[this.battle.pbRandom(this.assistMoves.length)]);
  }
}

class UseRandomUserMoveIfAsleep extends Move {
  usableWhenAsleep() { return true; }
  callsAnotherMove() { return true; }
  pbMoveFailed(user) {
    this.sleepTalkMoves = [];
    user.moves.forEach((m, i) => {
      if (SLEEP_TALK_BLACKLIST.has(m.functionCode)) return;
      if (!this.battle.pbCanChooseMove(user.index, i, false, true)) return;
      this.sleepTalkMoves.push(i);
    });
    if (!user.asleep() || this.sleepTalkMoves.length === 0) { failMsg(this.battle); return true; }
    return false;
  }
  async pbEffectGeneral(user) {
    const choice = this.sleepTalkMoves[this.battle.pbRandom(this.sleepTalkMoves.length)];
    await user.pbUseMoveSimple(user.moves[choice].id, user.pbDirectOpposing().index);
  }
}

class BounceBackProblemCausingStatusMoves extends Move {
  pbEffectGeneral(user) {
    user.effects.MagicCoat = true;
    this.battle.pbDisplay(`¡${user.pbThis()} se cubrió con Capa Mágica!`);
  }
}

class StealAndUseBeneficialStatusMove extends Move {
  pbEffectGeneral(user) {
    user.effects.Snatch = 1;
    for (const b of this.battle.allBattlers()) {
      if (b.effects.Snatch < user.effects.Snatch) continue;
      user.effects.Snatch = b.effects.Snatch + 1;
    }
    this.battle.pbDisplay(`¡${user.pbThis()} espera a que su rival haga algún movimiento!`);
  }
}

/** Mimético / Esquema: copia el último movimiento del objetivo. */
const copyLastMove = (blacklist, permanent) => class extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Transform || !user.pbHasMove(this.id)) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    const id = target.lastRegularMoveUsed;
    const d = id ? this.battle.db.moves[id] : null;
    if (!d || user.pbHasMove(id) || blacklist.has(parseFunctionCode(d.functionCode).code) || d.type === 'SHADOW') {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    const i = user.moves.findIndex((m) => m.id === this.id);
    if (i < 0) return;
    const id = target.lastRegularMoveUsed;
    const newMove = { id, pp: totalPP(this.battle.db, { id, ppUps: 0 }), ppUps: 0 };
    if (permanent) user.pokemon.moves[i] = newMove;
    user.moves[i] = createMove(this.battle, newMove);
    this.battle.pbDisplay(`¡${user.pbThis()} ha aprendido ${this.battle.moveName(id)}!`);
    user.pbCheckFormOnMovesetChange();
  }
};

class TypeIsUserSecondType extends Move {
  pbBaseType(user) {
    if (!user.isSpecies('OGERPON')) return this.type;
    const types = user.speciesData.types;
    return types[1] || types[0] || this.type;
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    const n = { WATER: 1, FIRE: 2, ROCK: 3 }[this.pbBaseType(user)] || 0;
    super.pbShowAnimation(id, user, targets, n, showAnimation);
  }
}

registerMoves({
  RedirectAllMovesToUser,
  RedirectAllMovesToTarget,
  CannotBeRedirected,
  RandomlyDamageOrHealTarget,
  HealAllyOrDamageFoe,
  CurseTargetOrLowerUserSpd1RaiseUserAtkDef1,
  EffectDependsOnEnvironment,
  HitsAllFoesAndPowersUpInPsychicTerrain,
  TargetNextFireMoveDamagesTarget,
  DoublePowerAfterFusionFlare: fusion('FusionFlare', 'FusionBolt'),
  DoublePowerAfterFusionBolt: fusion('FusionBolt', 'FusionFlare'),
  PowerUpAllyMove,
  CounterPhysicalDamage: counter((u) => u.effects.CounterTarget, (u) => u.effects.Counter * 2),
  CounterSpecialDamage: counter((u) => u.effects.MirrorCoatTarget, (u) => u.effects.MirrorCoat * 2),
  CounterDamagePlusHalf: counter((u) => (u.lastFoeAttacker.length ? u.lastFoeAttacker[u.lastFoeAttacker.length - 1] : -1),
    (u) => Math.floor(u.lastHPLostFromFoe * 1.5)),
  UserAddStockpileRaiseDefSpDef1,
  PowerDependsOnUserStockpile,
  HealUserDependingOnUserStockpile,
  GrassPledge: pledge([['FirePledge', 'SeaOfFire', 'FIRE'], ['WaterPledge', 'Swamp', null]]),
  FirePledge: pledge([['WaterPledge', 'Rainbow', 'WATER'], ['GrassPledge', 'SeaOfFire', null]]),
  WaterPledge: pledge([['GrassPledge', 'Swamp', 'GRASS'], ['FirePledge', 'Rainbow', null]]),
  UseLastMoveUsed,
  UseLastMoveUsedByTarget,
  UseMoveTargetIsAboutToUse,
  UseMoveDependingOnEnvironment,
  UseRandomMove,
  UseRandomMoveFromUserParty,
  UseRandomUserMoveIfAsleep,
  BounceBackProblemCausingStatusMoves,
  StealAndUseBeneficialStatusMove,
  ReplaceMoveThisBattleWithTargetLastMoveUsed: copyLastMove(MIMIC_BLACKLIST, false),
  ReplaceMoveWithTargetLastMoveUsed: copyLastMove(SKETCH_BLACKLIST, true),
  TypeIsUserSecondType,
});
