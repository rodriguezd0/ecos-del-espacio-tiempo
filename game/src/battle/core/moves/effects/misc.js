// Efectos de movimientos varios: clima, campos, trampas, sustituto… (030_Move/006_MoveEffects_Misc).
import { Move } from '../move.js';
import { StatUpMove, WeatherMove, TerrainMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { TERRAIN_END_MESSAGES } from '../../constants.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');

class DoesNothingCongratulations extends Move {
  pbEffectGeneral(user) {
    if (user.wild()) this.battle.pbDisplay(`¡Felicidades de ${user.pbThis(true)}!`);
    else this.battle.pbDisplay(`¡Felicidades, ${this.battle.pbGetOwnerName(user.index)}!`);
  }
}

class DoesNothingFailsIfNoAlly extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (user.allAllies().length === 0) { failMsg(this.battle); return true; }
    return false;
  }
}

class DoesNothingUnusableInGravity extends Move {
  unusableInGravity() { return true; }
  pbEffectGeneral() { this.battle.pbDisplay('¡Pero no tuvo ningún efecto!'); }
}

class AddMoneyGainedFromBattle extends Move {
  pbEffectGeneral(user) {
    if (user.pbOwnedByPlayer()) this.battle.field.effects.PayDay += 5 * user.level;
    this.battle.pbDisplay('¡Hay monedas por todas partes!');
  }
}

class DoubleMoneyGainedFromBattle extends Move {
  pbEffectGeneral(user) {
    if (!user.opposes()) this.battle.field.effects.HappyHour = true;
    this.battle.pbDisplay('¡La felicidad se respira en el aire!');
  }
}

class FailsIfNotUserFirstTurn extends Move {
  pbMoveFailed(user) {
    if (user.turnCount > 1) { failMsg(this.battle); return true; }
    return false;
  }
}

class FailsIfUserHasUnusedMove extends Move {
  pbFailsAgainstTarget(user, target, show) {
    const hasThis = user.moves.some((m) => m.id === this.id);
    const others = user.moves.filter((m) => m.id !== this.id);
    const hasUnused = others.some((m) => !user.movesUsed.includes(m.id));
    if (!hasThis || others.length === 0 || hasUnused) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
}

class FailsIfUserNotConsumedBerry extends Move {
  pbCanChooseMove(user, commandPhase, showMessages) {
    if (user.belched()) return true;
    if (showMessages) {
      const msg = `¡${user.pbThis()} debe comerse una baya equipada para poder eructar!`;
      if (commandPhase) this.battle.pbDisplayPaused(msg);
      else this.battle.pbDisplay(msg);
    }
    return false;
  }
  pbMoveFailed(user) {
    if (!user.belched()) { failMsg(this.battle); return true; }
    return false;
  }
}

class FailsIfTargetHasNoItem extends Move {
  pbFailsAgainstTarget(user, target, show) {
    if (!target.item || !target.itemActive()) {
      if (show) failMsg(this.battle);
      return true;
    }
    this.battle.pbDisplay(`¡${target.pbThis()} es atacado por ${target.itemName()}!`);
    return false;
  }
}

class FailsUnlessTargetSharesTypeWithUser extends Move {
  pbFailsAgainstTarget(user, target, show) {
    const targetTypes = target.pbTypes(true);
    if (!user.pbTypes(true).some((t) => targetTypes.includes(t))) {
      if (show) this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      return true;
    }
    return false;
  }
}

class FailsIfUserDamagedThisTurn extends Move {
  pbDisplayChargeMessage(user) {
    user.effects.FocusPunch = true;
    this.battle.pbCommonAnimation('FocusPunch', user);
    this.battle.pbDisplay(`¡${user.pbThis()} está reforzando su concentración!`);
  }
  pbDisplayUseMessage(user) {
    if (!user.effects.FocusPunch || !user.tookMoveDamageThisRound) super.pbDisplayUseMessage(user);
  }
  pbMoveFailed(user) {
    if (user.effects.FocusPunch && user.tookMoveDamageThisRound) {
      this.battle.pbDisplay(`¡${user.pbThis()} perdió la concentración y no pudo atacar!`);
      return true;
    }
    return false;
  }
}

class FailsIfTargetActed extends Move {
  pbFailsAgainstTarget(user, target, show) {
    const ch = this.battle.choices[target.index];
    const oppMove = ch.action === 'UseMove' ? ch.move : null;
    if (!oppMove || (oppMove.functionCode !== 'UseMoveTargetIsAboutToUse' && (target.movedThisRound() || oppMove.statusMove()))) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
}

const weather = (type) => class extends WeatherMove {
  constructor(...a) { super(...a); this.weatherType = type; }
};
const terrain = (type) => class extends TerrainMove {
  constructor(...a) { super(...a); this.terrainType = type; }
};

function removeTerrain(battle) {
  const msg = TERRAIN_END_MESSAGES[battle.field.terrain];
  if (msg) battle.pbDisplay(msg);
  battle.field.terrain = 'None';
  battle.field.terrainDuration = 0;
  battle.queueEvent('terrain', 'None');
}

class RemoveTerrain extends Move {
  pbMoveFailed() {
    if (this.battle.field.terrain === 'None') { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral() { removeTerrain(this.battle); }
}

class RemoveTerrainIceSpinner extends Move {
  pbEffectGeneral() {
    if (this.battle.field.terrain === 'None') return;
    removeTerrain(this.battle);
    for (const b of this.battle.allBattlers()) b.pbAbilityOnTerrainChange();
  }
}

/** Trampa de entrada en el bando rival. */
function hazard(effect, max, msg) {
  return class extends Move {
    canMagicCoat() { return true; }
    pbMoveFailed(user) {
      const v = user.pbOpposingSide().effects[effect];
      if ((typeof v === 'boolean' && v) || (typeof v === 'number' && v >= max)) { failMsg(this.battle); return true; }
      return false;
    }
    pbEffectGeneral(user) {
      const e = user.pbOpposingSide().effects;
      e[effect] = typeof e[effect] === 'boolean' ? true : e[effect] + 1;
      this.battle.queueEvent('refresh');
      this.battle.pbDisplay(msg(user));
    }
  };
}

const SIDE_NUMBER_EFFECTS = ['AuroraVeil', 'LightScreen', 'Mist', 'Rainbow', 'Reflect', 'Safeguard', 'SeaOfFire', 'Spikes',
  'Swamp', 'Tailwind', 'ToxicSpikes'];
const SIDE_BOOLEAN_EFFECTS = ['StealthRock', 'StickyWeb'];

class SwapSideEffects extends Move {
  pbMoveFailed() {
    const has = this.battle.sides.some((s) => SIDE_NUMBER_EFFECTS.some((e) => s.effects[e] !== 0) ||
      SIDE_BOOLEAN_EFFECTS.some((e) => s.effects[e]));
    if (!has) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    const [s0, s1] = this.battle.sides;
    for (const e of [...SIDE_NUMBER_EFFECTS, ...SIDE_BOOLEAN_EFFECTS]) [s0.effects[e], s1.effects[e]] = [s1.effects[e], s0.effects[e]];
    this.battle.queueEvent('refresh');
    this.battle.pbDisplay(`¡${user.pbThis()} ha intercambiado los efectos del campo de combate!`);
  }
}

class UserMakeSubstitute extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.effects.Substitute > 0) {
      this.battle.pbDisplay(`¡${user.pbThis()} ya tiene un sustituto!`);
      return true;
    }
    this.subLife = Math.max(Math.floor(user.totalhp / 4), 1);
    if (user.hp <= this.subLife) {
      this.battle.pbDisplay('¡Está demasiado débil para crear un sustituto!');
      return true;
    }
    return false;
  }
  pbOnStartUse(user) {
    user.pbReduceHP(this.subLife, false, false);
    user.pbItemHPHealCheck();
  }
  pbEffectGeneral(user) {
    user.effects.Trapping = 0;
    user.effects.TrappingMove = null;
    user.effects.Substitute = this.subLife;
    this.battle.queueEvent('substitute', user.view(), true);
    this.battle.pbDisplay(`¡${user.pbThis()} ha creado un sustituto!`);
  }
}

/** Giro Rápido / Giro Mortal: libera al usuario de ataduras, drenadoras y trampas de su bando. */
export function clearUserBindingAndHazards(battle, user) {
  if (user.effects.Trapping > 0) {
    const trapUser = battle.battlers[user.effects.TrappingUser];
    const trapName = battle.moveName(user.effects.TrappingMove);
    battle.pbDisplay(`¡${user.pbThis()} se liberó de ${trapName} de ${trapUser ? trapUser.pbThis(true) : 'su rival'}!`);
    user.effects.Trapping = 0;
    user.effects.TrappingMove = null;
    user.effects.TrappingUser = -1;
  }
  if (user.effects.LeechSeed >= 0) {
    user.effects.LeechSeed = -1;
    battle.pbDisplay(`¡${user.pbThis()} se curó de las drenadoras!`);
  }
  const side = user.pbOwnSide().effects;
  const team = user.pbTeam(true);
  if (side.StealthRock) { side.StealthRock = false; battle.pbDisplay(`Las piedras puntiagudas lanzadas a ${team} han desaparecido.`); }
  if (side.Spikes > 0) { side.Spikes = 0; battle.pbDisplay(`Las púas lanzadas a ${team} han desaparecido.`); }
  if (side.ToxicSpikes > 0) { side.ToxicSpikes = 0; battle.pbDisplay(`Las púas tóxicas lanzadas a ${team} han desaparecido.`); }
  if (side.StickyWeb) { side.StickyWeb = false; battle.pbDisplay(`La red viscosa lanzada a ${team} ha desaparecido.`); }
  battle.queueEvent('refresh');
}

class RemoveUserBindingAndEntryHazards extends StatUpMove {
  constructor(...a) { super(...a); this.statUp = ['SPEED', 1]; }
  pbEffectAfterAllHits(user, target) {
    if (user.isFainted() || target.damageState.unaffected) return;
    clearUserBindingAndHazards(this.battle, user);
  }
}

class AttackTwoTurnsLater extends Move {
  targetsPosition() { return true; }
  pbDamagingMove() { return this.battle.futureSight ? super.pbDamagingMove() : false; }
  pbAccuracyCheck(user, target) { return this.battle.futureSight ? super.pbAccuracyCheck(user, target) : true; }
  pbDisplayUseMessage(user) { if (!this.battle.futureSight) super.pbDisplayUseMessage(user); }
  pbFailsAgainstTarget(user, target, show) {
    if (!this.battle.futureSight && this.battle.positions[target.index].effects.FutureSightCounter > 0) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (this.battle.futureSight) return;
    const e = this.battle.positions[target.index].effects;
    e.FutureSightCounter = 3;
    e.FutureSightMove = this.id;
    e.FutureSightUserIndex = user.index;
    e.FutureSightUserPartyIndex = user.pokemonIndex;
    if (this.id === 'DOOMDESIRE') this.battle.pbDisplay(`¡Deseo Oculto de ${user.pbThis(true)} se cumplirá más adelante!`);
    else this.battle.pbDisplay(`¡${user.pbThis()} previó un ataque!`);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, this.battle.futureSight ? hitNum : 1, showAnimation);
  }
}

class UserSwapsPositionsWithAlly extends Move {
  pbChangeUsageCounters(user, specialUsage) {
    const old = user.effects.ProtectRate;
    super.pbChangeUsageCounters(user, specialUsage);
    user.effects.ProtectRate = old;
  }
  pbMoveFailed(user) {
    const battle = this.battle;
    const fail = () => { user.effects.ProtectRate = 1; failMsg(battle); return true; };
    if (user.effects.AllySwitch) return fail();
    if (user.effects.ProtectRate > 1 && battle.pbRandom(user.effects.ProtectRate) !== 0) return fail();
    const owner = battle.pbGetOwnerIndexFromBattlerIndex(user.index);
    const allies = user.allAllies().filter((b) => battle.pbGetOwnerIndexFromBattlerIndex(b.index) === owner && b.near(user));
    if (allies.length !== 1) { failMsg(battle); return true; }
    this.idxAlly = allies[0].index;
    return false;
  }
  pbEffectGeneral(user) {
    const battle = this.battle;
    user.effects.AllySwitch = true;
    user.effects.ProtectRate *= 3;
    const idxA = user.index;
    const idxB = this.idxAlly;
    if (!battle.pbSwapBattlers(idxA, idxB)) return;
    battle.pbDisplay(`¡${battle.battlers[idxB].pbThis()} y ${battle.battlers[idxA].pbThis(true)} han intercambiado sus posiciones!`);
    for (const i of [idxA, idxB]) battle.pbEffectsOnBattlerEnteringPosition(battle.battlers[i]);
  }
}

class BurnAttackerBeforeUserActs extends Move {
  pbDisplayChargeMessage(user) {
    user.effects.BeakBlast = true;
    this.battle.pbCommonAnimation('BeakBlast', user);
    this.battle.pbDisplay(`¡${user.pbThis()} empieza a calentar su pico!`);
  }
}

class StartSaltCureTarget extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (this.damagingMove()) return false;
    if (target.effects.SaltCure) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    target.effects.SaltCure = true;
    this.battle.pbDisplay(`¡${target.pbThis()} sufre de salazón!`);
  }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute || target.effects.SaltCure) return;
    target.effects.SaltCure = true;
    this.battle.pbDisplay(`¡${target.pbThis()} sufre de salazón!`);
  }
}

class SetUserAlliesAbilityToTargetAbility extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (this.battle.allSameSideBattlers(user.index).some((b) => b.unstoppableAbility())) { failMsg(this.battle); return true; }
    if (user.hasActiveItem('ABILITYSHIELD')) {
      this.battle.pbDisplay(`¡La habilidad de ${user.pbThis(true)} está protegida por los efectos de su Escudo Habilidad!`);
      return true;
    }
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.ability || user.ability === target.ability || target.uncopyableAbility()) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    const battle = this.battle;
    for (const b of battle.allSameSideBattlers(user.index)) {
      if (b.ability === target.ability) continue;
      if (b.hasActiveItem('ABILITYSHIELD')) {
        battle.pbDisplay(`¡La habilidad de ${b.pbThis(true)} está protegida por el efecto de su Escudo Habilidad!`);
        continue;
      }
      battle.pbShowAbilitySplash(b, true);
      const oldAbil = b.ability;
      b.ability = target.ability;
      battle.pbReplaceAbilitySplash(b);
      battle.pbDisplay(`¡${b.pbThis()} copió ${target.abilityName()} de ${target.pbThis(true)}!`);
      battle.pbHideAbilitySplash(b);
      b.pbOnLosingAbility(oldAbil);
      b.pbTriggerAbilityOnGainingIt();
    }
  }
}

/** Reanima a un Pokémon debilitado del equipo con la mitad de sus PS (Plegaria Vital). */
async function reviveInParty(battle, idxBattler) {
  const party = battle.pbParty(idxBattler);
  const candidates = [];
  battle.eachInTeamFromBattlerIndex(idxBattler, (pkmn, i) => {
    if (pkmn && !pkmn.egg && pkmn.hp <= 0) candidates.push(i);
  });
  if (candidates.length === 0) return;
  let idx = -1;
  if (battle.pbOwnedByPlayer(idxBattler)) {
    idx = await battle.ask('chooseSwitch', {
      battler: battle.battlers[idxBattler].view(), reason: 'revive', canCancel: false, party: battle.partyOptions(idxBattler),
    });
    if (!candidates.includes(idx)) idx = candidates[0];
  } else {
    idx = candidates.reduce((best, i) => (party[i].level > party[best].level ? i : best), candidates[0]);
  }
  const pkmn = party[idx];
  pkmn.hp = Math.max(1, Math.floor(battle.maxHPOf(pkmn) / 2));
  pkmn.status = null;
  pkmn.statusCount = 0;
  const name = battle.pbOwnedByPlayer(idxBattler) ? battle.pokemonName(pkmn) : `El ${battle.pokemonName(pkmn)} rival`;
  battle.pbDisplay(`¡${name} ha revivido y está listo para luchar de nuevo!`);
}

class RevivePokemonHalfHP extends Move {
  healingMove() { return true; }
  pbMoveFailed(user) {
    this.numFainted = 0;
    this.battle.eachInTeamFromBattlerIndex(user.index, (pkmn) => { if (pkmn && !pkmn.egg && pkmn.hp <= 0) this.numFainted += 1; });
    if (this.numFainted === 0) { failMsg(this.battle); return true; }
    return false;
  }
  async pbEndOfMoveUsageEffect(user) {
    if (user.isFainted() || !this.numFainted) return;
    await reviveInParty(this.battle, user.index);
  }
}

class RandomlyDealsDoubleDamage extends Move {
  pbOnStartUse(user) {
    this.allOutAttack = this.battle.pbRandom(100) < 30;
    if (this.allOutAttack) this.battle.pbDisplay(`¡${user.pbThis()} va con todo por este ataque!`);
  }
  pbBaseDamage(bd) { return this.allOutAttack ? bd * 2 : bd; }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    super.pbShowAnimation(id, user, targets, this.allOutAttack ? 1 : hitNum, showAnimation);
  }
}

registerMoves({
  None: Move,
  DoesNothingCongratulations,
  DoesNothingFailsIfNoAlly,
  DoesNothingUnusableInGravity,
  AddMoneyGainedFromBattle,
  DoubleMoneyGainedFromBattle,
  FailsIfNotUserFirstTurn,
  FailsIfUserHasUnusedMove,
  FailsIfUserNotConsumedBerry,
  FailsIfTargetHasNoItem,
  FailsUnlessTargetSharesTypeWithUser,
  FailsIfUserDamagedThisTurn,
  FailsIfTargetActed,
  StartSunWeather: weather('Sun'),
  StartRainWeather: weather('Rain'),
  StartSandstormWeather: weather('Sandstorm'),
  StartHailWeather: weather('Hail'),
  StartElectricTerrain: terrain('Electric'),
  StartGrassyTerrain: terrain('Grassy'),
  StartMistyTerrain: terrain('Misty'),
  StartPsychicTerrain: terrain('Psychic'),
  RemoveTerrain,
  RemoveTerrainIceSpinner,
  AddSpikesToFoeSide: hazard('Spikes', 3, (u) => `¡${u.pbOpposingTeam()} está rodeado de púas!`),
  AddToxicSpikesToFoeSide: hazard('ToxicSpikes', 2, (u) => `¡${u.pbOpposingTeam()} está rodeado de púas tóxicas!`),
  AddStealthRocksToFoeSide: hazard('StealthRock', 1, (u) => `¡${u.pbOpposingTeam()} está rodeado de piedras puntiagudas!`),
  AddStickyWebToFoeSide: hazard('StickyWeb', 1, (u) => `¡Una red viscosa se extiende a los pies de ${u.pbOpposingTeam(true)}!`),
  SwapSideEffects,
  UserMakeSubstitute,
  RemoveUserBindingAndEntryHazards,
  AttackTwoTurnsLater,
  UserSwapsPositionsWithAlly,
  BurnAttackerBeforeUserActs,
  StartSaltCureTarget,
  SetUserAlliesAbilityToTargetAbility,
  RevivePokemonHalfHP,
  RandomlyDealsDoubleDamage,
});

export { reviveInParty, removeTerrain };
