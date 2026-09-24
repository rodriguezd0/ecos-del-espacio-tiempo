// Objetos equipados: defensa, golpes recibidos, fin de movimiento, EXP/EV, clima, fin de ronda…
// (034_Other battle code/010_Battle_ItemEffects, segunda parte).
import { ItemEffects as I } from './registry.js';
import { Effectiveness } from '../typeChart.js';
import { BATTLE_STATS } from '../constants.js';
import { totalPP } from '../pokemon.js';
import { evolutionCount } from './heldItems.js';

const nameOf = (battle, item) => battle.itemName(item);

// ---------------------------------------------------------------- DamageCalcFromTarget
const T = I.DamageCalcFromTarget;
const WEAKENING_BERRIES = {
  BABIRIBERRY: 'STEEL', CHARTIBERRY: 'ROCK', CHILANBERRY: 'NORMAL', CHOPLEBERRY: 'FIGHTING', COBABERRY: 'FLYING',
  COLBURBERRY: 'DARK', HABANBERRY: 'DRAGON', KASIBBERRY: 'GHOST', KEBIABERRY: 'POISON', OCCABERRY: 'FIRE',
  PASSHOBERRY: 'WATER', PAYAPABERRY: 'PSYCHIC', RINDOBERRY: 'GRASS', ROSELIBERRY: 'FAIRY', SHUCABERRY: 'GROUND',
  TANGABERRY: 'BUG', WACANBERRY: 'ELECTRIC', YACHEBERRY: 'ICE',
};
for (const [berry, berryType] of Object.entries(WEAKENING_BERRIES)) {
  T.add(berry, (i, user, target, move, mults, power, type) => target.pbMoveTypeWeakeningBerry(berryType, type, mults));
}
T.add('ASSAULTVEST', (i, u, t, move, mults) => { if (move.specialMove()) mults.defense_multiplier *= 1.5; });
T.add('DEEPSEASCALE', (i, u, target, move, mults) => { if (target.isSpecies('CLAMPERL') && move.specialMove()) mults.defense_multiplier *= 2; });
T.add('EVIOLITE', (i, u, target, m, mults) => { if (evolutionCount(target) > 0) mults.defense_multiplier *= 1.5; });
T.add('SUPEREVIOLITE', (i, u, target, m, mults) => { if (evolutionCount(target) > 1) mults.defense_multiplier *= 1.5; }); // Añil
T.add('METALPOWDER', (i, u, target, m, mults) => {
  if (target.isSpecies('DITTO') && !target.effects.Transform) mults.defense_multiplier *= 1.5;
});
// SOULDEW como defensa solo aplica si SOUL_DEW_POWERS_UP_TYPES es falso (en Añil es verdadero).

// ---------------------------------------------------------------- Críticos
I.CriticalCalcFromUser.add('LUCKYPUNCH', (i, user, t, c) => (user.isSpecies('CHANSEY') ? c + 2 : undefined));
I.CriticalCalcFromUser.add('RAZORCLAW', (i, u, t, c) => c + 1);
I.CriticalCalcFromUser.copy('RAZORCLAW', 'SCOPELENS');
I.CriticalCalcFromUser.add('LEEK', (i, user, t, c) => (user.isSpecies('FARFETCHD') || user.isSpecies('SIRFETCHD') ? c + 2 : undefined));
I.CriticalCalcFromUser.copy('LEEK', 'STICK');

// ---------------------------------------------------------------- OnBeingHit
const B = I.OnBeingHit;
const raiseOnTypeHit = (hitType, stat) => (item, user, target, move, battle) => {
  if (move.calcType !== hitType || !target.pbCanRaiseStatStage(stat, target)) return;
  battle.pbCommonAnimation('UseItem', target);
  target.pbRaiseStatStageByCause(stat, 1, target, target.itemName());
  target.pbHeldItemTriggered(item);
};
B.add('ABSORBBULB', raiseOnTypeHit('WATER', 'SPECIAL_ATTACK'));
B.add('CELLBATTERY', raiseOnTypeHit('ELECTRIC', 'ATTACK'));
B.add('LUMINOUSMOSS', raiseOnTypeHit('WATER', 'SPECIAL_DEFENSE'));
B.add('SNOWBALL', raiseOnTypeHit('ICE', 'ATTACK'));
B.add('AIRBALLOON', (item, user, target, move, battle) => {
  battle.pbDisplay(`¡${target.itemName()} de ${target.pbThis(true)} ha explotado!`);
  target.pbConsumeItem(false, true);
  target.pbSymbiosis();
});
B.add('ENIGMABERRY', (item, user, target, move, battle) => {
  const ds = target.damageState;
  if (ds.substitute || ds.disguise || ds.iceFace || !Effectiveness.superEffective(ds.typeMod)) return;
  if (I.triggerOnBeingHitPositiveBerry(item, target, battle, false)) target.pbHeldItemTriggered(item);
});
const positiveOn = (cond) => (item, user, target, move, battle) => {
  if (!cond(move)) return;
  if (I.triggerOnBeingHitPositiveBerry(item, target, battle, false)) target.pbHeldItemTriggered(item);
};
B.add('KEEBERRY', positiveOn((m) => m.physicalMove()));
B.add('MARANGABERRY', positiveOn((m) => m.specialMove()));
const retaliationBerry = (cond) => (item, user, target, move, battle) => {
  if (!target.canConsumeBerry() || !cond(move) || !user.takesIndirectDamage()) return;
  let amt = Math.floor(user.totalhp / 8);
  const ripening = target.hasActiveAbility('RIPEN');
  if (ripening) {
    battle.pbShowAbilitySplash(target);
    amt *= 2;
  }
  battle.pbCommonAnimation('EatBerry', target);
  if (ripening) battle.pbHideAbilitySplash(target);
  user.pbReduceHP(amt, false);
  battle.pbDisplay(`¡${target.pbThis()} ha consumido su ${target.itemName()} y ha dañado a ${user.pbThis(true)}!`);
  target.pbHeldItemTriggered(item);
};
B.add('JABOCABERRY', retaliationBerry((m) => m.physicalMove()));
B.add('ROWAPBERRY', retaliationBerry((m) => m.specialMove()));
B.add('ROCKYHELMET', (item, user, target, move, battle) => {
  if (!move.pbContactMove(user) || !user.affectedByContactEffect() || !user.takesIndirectDamage()) return;
  user.pbReduceHP(Math.floor(user.totalhp / 6), false);
  battle.pbDisplay(`¡${target.itemName()} ha dañado a ${user.pbThis(true)}!`);
});
B.add('STICKYBARB', (item, user, target, move, battle) => {
  if (!move.pbContactMove(user) || !user.affectedByContactEffect() || user.isFainted() || user.item) return;
  user.item = target.item;
  target.item = null;
  if (target.hasActiveAbility('UNBURDEN')) target.effects.Unburden = true;
  if (battle.wildBattle() && !user.opposes() && !user.initialItem && user.item === target.initialItem) {
    user.setInitialItem(user.item);
    target.setInitialItem(null);
  }
  battle.pbDisplay(`¡${user.itemName()} de ${target.pbThis(true)} pasó a ${user.pbThis(true)}!`);
});
B.add('WEAKNESSPOLICY', (item, user, target, move, battle) => {
  const ds = target.damageState;
  if (ds.disguise || ds.iceFace || !Effectiveness.superEffective(ds.typeMod)) return;
  if (!target.pbCanRaiseStatStage('ATTACK', target) && !target.pbCanRaiseStatStage('SPECIAL_ATTACK', target)) return;
  battle.pbCommonAnimation('UseItem', target);
  let showAnim = true;
  if (target.pbCanRaiseStatStage('ATTACK', target)) {
    target.pbRaiseStatStageByCause('ATTACK', 2, target, target.itemName(), showAnim);
    showAnim = false;
  }
  if (target.pbCanRaiseStatStage('SPECIAL_ATTACK', target)) {
    target.pbRaiseStatStageByCause('SPECIAL_ATTACK', 2, target, target.itemName(), showAnim);
  }
  battle.pbDisplay(`${target.itemName()} ha desaparecido al haber cumplido su función.`);
  target.pbHeldItemTriggered(item);
});

// ---------------------------------------------------------------- OnBeingHitPositiveBerry (también por Picoteo/Lanzamiento)
const P = I.OnBeingHitPositiveBerry;
P.add('ENIGMABERRY', (item, b, battle, forced) => {
  if (!b.canHeal() || (!forced && !b.canConsumeBerry())) return false;
  let amt = Math.floor(b.totalhp / 4);
  const ripening = b.hasActiveAbility('RIPEN');
  if (ripening) {
    battle.pbShowAbilitySplash(b, forced);
    amt *= 2;
  }
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  if (ripening) battle.pbHideAbilitySplash(b);
  b.pbRecoverHP(amt);
  battle.pbDisplay(forced ? `¡${b.pbThis()} ha recuperado PS!` : `¡${b.pbThis()} ha restaurado su salud con ${nameOf(battle, item)}!`);
  return true;
});
const defenseBerry = (stat) => (item, b, battle, forced) => {
  if (!forced && !b.canConsumeBerry()) return false;
  if (!b.pbCanRaiseStatStage(stat, b)) return false;
  let amt = 1;
  const ripening = b.hasActiveAbility('RIPEN');
  if (ripening) {
    battle.pbShowAbilitySplash(b, forced);
    amt *= 2;
  }
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  if (ripening) battle.pbHideAbilitySplash(b);
  if (!forced) return b.pbRaiseStatStageByCause(stat, amt, b, nameOf(battle, item));
  return b.pbRaiseStatStage(stat, amt, b);
};
P.add('KEEBERRY', defenseBerry('DEFENSE'));
P.add('MARANGABERRY', defenseBerry('SPECIAL_DEFENSE'));

// ---------------------------------------------------------------- AfterMoveUseFromTarget (contexto asíncrono)
I.AfterMoveUseFromTarget.add('EJECTBUTTON', async (item, battler, user, move, switched, battle) => {
  if (switched.length > 0 || battle.pbAllFainted(battler.idxOpposingSide()) || !battle.pbCanChooseNonActive(battler.index)) return;
  battle.pbCommonAnimation('UseItem', battler);
  battle.pbDisplay(`¡${battler.pbThis()} regresa gracias a ${battler.itemName()}!`);
  battler.pbConsumeItem(true, false);
  const newPkmn = await battle.pbGetReplacementPokemonIndex(battler.index);
  if (newPkmn < 0) return;
  battle.pbRecallAndReplace(battler.index, newPkmn);
  battle.pbClearChoice(battler.index);
  switched.push(battler.index);
  if (battler.index === user.index) battle.moldBreaker = false;
  await battle.pbOnBattlerEnteringBattle(battler.index);
});
I.AfterMoveUseFromTarget.add('REDCARD', async (item, battler, user, move, switched, battle) => {
  if (switched.length > 0 || user.isFainted()) return;
  const newPkmn = await battle.pbGetReplacementPokemonIndex(user.index, true);
  if (newPkmn < 0) return;
  battle.pbCommonAnimation('UseItem', battler);
  battle.pbDisplay(`¡${battler.pbThis()} ha sacado ${battler.itemName()} a ${user.pbThis(true)}!`);
  battler.pbConsumeItem();
  if (user.hasActiveAbility(['SUCTIONCUPS', 'GUARDDOG']) && !battle.moldBreaker) {
    battle.pbShowAbilitySplash(user);
    battle.pbDisplay(`¡${user.pbThis()} se aferró!`);
    battle.pbHideAbilitySplash(user);
    return;
  }
  if (user.effects.Ingrain) {
    battle.pbDisplay(`¡${user.pbThis()} se aferró con sus raíces!`);
    return;
  }
  battle.pbRecallAndReplace(user.index, newPkmn, true);
  battle.pbDisplay(`¡${user.pbThis()} fue arrastrado al combate!`);
  battle.pbClearChoice(user.index);
  switched.push(user.index);
  battle.moldBreaker = false;
  await battle.pbOnBattlerEnteringBattle(user.index);
});

// ---------------------------------------------------------------- AfterMoveUseFromUser
I.AfterMoveUseFromUser.add('LIFEORB', (item, user, targets, move, numHits, battle) => {
  if (!user.takesIndirectDamage() || !move.pbDamagingMove() || numHits === 0) return;
  if (!targets.some((b) => !b.damageState.unaffected && !b.damageState.substitute)) return;
  user.pbReduceHP(Math.floor(user.totalhp / 10));
  battle.pbDisplay(`¡${user.pbThis()} ha perdido algunos PS!`);
  user.pbItemHPHealCheck();
  if (user.isFainted()) user.pbFaint();
});
I.AfterMoveUseFromUser.add('SHELLBELL', (item, user, targets, move, numHits, battle) => {
  if (!user.canHeal()) return;
  const total = targets.reduce((s, b) => s + b.damageState.totalHPLost, 0);
  if (total <= 0) return;
  user.pbRecoverHP(Math.floor(total / 8));
  battle.pbDisplay(`¡${user.pbThis()} ha recuperado unos pocos PS con ${user.itemName()}!`);
});
I.AfterMoveUseFromUser.add('THROATSPRAY', (item, user, targets, move, numHits, battle) => {
  if (battle.pbAllFainted(user.idxOwnSide()) || battle.pbAllFainted(user.idxOpposingSide())) return;
  if (!move.soundMove() || numHits === 0 || !user.pbCanRaiseStatStage('SPECIAL_ATTACK', user)) return;
  battle.pbCommonAnimation('UseItem', user);
  user.pbRaiseStatStage('SPECIAL_ATTACK', 1, user);
  user.pbConsumeItem();
});

// ---------------------------------------------------------------- Fin de movimiento
I.OnEndOfUsingMove.add('LEPPABERRY', (item, b, battle, forced) => {
  if (!forced && !b.canConsumeBerry()) return false;
  const moves = (b.pokemon && b.pokemon.moves) || [];
  const empty = [];
  const partial = [];
  moves.forEach((m, i) => {
    const max = totalPP(battle.db, m);
    if (max <= 0 || m.pp === max) return;
    (m.pp === 0 ? empty : partial).push(i);
  });
  if (empty.length === 0 && (!forced || partial.length === 0)) return false;
  let amt = 10;
  const ripening = b.hasActiveAbility('RIPEN');
  if (ripening) {
    battle.pbShowAbilitySplash(b, forced);
    amt *= 2;
  }
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  if (ripening) battle.pbHideAbilitySplash(b);
  const choice = empty.length > 0 ? empty[0] : partial[0];
  const pm = moves[choice];
  pm.pp = Math.min(pm.pp + amt, totalPP(battle.db, pm));
  if (b.moves[choice] && b.moves[choice].id === pm.id) b.moves[choice].pp = pm.pp;
  const moveName = battle.moveName(pm.id);
  battle.pbDisplay(forced ? `¡${b.pbThis()} ha recuperado los PP de ${moveName}!`
    : `¡${b.pbThis()} ha recuperado los PP de ${moveName} gracias a ${nameOf(battle, item)}!`);
  return true;
});
I.OnEndOfUsingMove.copy('LEPPABERRY', 'HOPOBERRY');
I.OnEndOfUsingMoveStatRestore.add('WHITEHERB', (item, b, battle, forced) => {
  let reduced = false;
  for (const s of BATTLE_STATS) {
    if (b.stages[s] >= 0) continue;
    b.stages[s] = 0;
    b.statsRaisedThisRound = true;
    reduced = true;
  }
  if (!reduced) return false;
  if (!forced) battle.pbCommonAnimation('UseItem', b);
  battle.pbDisplay(forced ? `¡Se han restaurado las características de ${b.pbThis(true)}!`
    : `¡${nameOf(battle, item)} ha restaurado las características de ${b.pbThis(true)}!`);
  battle.queueRefresh(b);
  return true;
});

// ---------------------------------------------------------------- EXP y EV
I.ExpGainModifier.add('LUCKYEGG', (item, pkmn, exp) => Math.floor((exp * 3) / 2));
I.EVGainModifier.add('MACHOBRACE', (item, pkmn, ev) => { for (const k of Object.keys(ev)) ev[k] *= 2; });
const POWER_ITEM_STAT = { POWERANKLET: 'spe', POWERBAND: 'spd', POWERBELT: 'def', POWERBRACER: 'atk', POWERLENS: 'spa', POWERWEIGHT: 'hp' };
for (const [item, stat] of Object.entries(POWER_ITEM_STAT)) {
  I.EVGainModifier.add(item, (i, pkmn, ev) => { ev[stat] += 8; }); // MORE_EVS_FROM_POWER_ITEMS
}

// ---------------------------------------------------------------- Clima y campo
const ROCKS = { DAMPROCK: 'Rain', HEATROCK: 'Sun', ICYROCK: 'Hail', SMOOTHROCK: 'Sandstorm' };
for (const [item, w] of Object.entries(ROCKS)) I.WeatherExtender.add(item, (i, weather) => (weather === w ? 8 : undefined));
I.TerrainExtender.add('TERRAINEXTENDER', () => 8);
const SEEDS = { ELECTRICSEED: ['Electric', 'DEFENSE'], GRASSYSEED: ['Grassy', 'DEFENSE'], MISTYSEED: ['Misty', 'SPECIAL_DEFENSE'],
  PSYCHICSEED: ['Psychic', 'SPECIAL_DEFENSE'] };
for (const [item, [terrain, stat]] of Object.entries(SEEDS)) {
  I.TerrainStatBoost.add(item, (i, b, battle) => {
    if (battle.field.terrain !== terrain || !b.pbCanRaiseStatStage(stat, b)) return false;
    battle.pbCommonAnimation('UseItem', b);
    return b.pbRaiseStatStageByCause(stat, 1, b, nameOf(battle, i));
  });
}

// ---------------------------------------------------------------- Fin de ronda
I.EndOfRoundHealing.add('BLACKSLUDGE', (item, b, battle) => {
  if (b.pbHasType('POISON')) {
    if (!b.canHeal()) return;
    battle.pbCommonAnimation('UseItem', b);
    b.pbRecoverHP(Math.floor(b.totalhp / 16));
    battle.pbDisplay(`¡${b.pbThis()} ha recuperado unos pocos PS con ${b.itemName()}!`);
  } else if (b.takesIndirectDamage()) {
    battle.pbCommonAnimation('UseItem', b);
    b.pbTakeEffectDamage(Math.floor(b.totalhp / 8), true, () => battle.pbDisplay(`¡${b.pbThis()} ha resultado dañado por ${b.itemName()}!`));
  }
});
I.EndOfRoundHealing.add('LEFTOVERS', (item, b, battle) => {
  if (!b.canHeal()) return;
  battle.pbCommonAnimation('UseItem', b);
  b.pbRecoverHP(Math.floor(b.totalhp / 16));
  battle.pbDisplay(`¡${b.pbThis()} ha recuperado unos pocos PS con ${b.itemName()}!`);
});
I.EndOfRoundEffect.add('FLAMEORB', (item, b) => {
  if (b.pbCanBurn(b, false)) b.pbBurn(null, `¡${b.pbThis()} ha sido quemado por ${b.itemName()}!`);
});
I.EndOfRoundEffect.add('TOXICORB', (item, b) => {
  if (b.pbCanPoison(b, false)) b.pbPoison(null, `¡${b.pbThis()} ha sido gravemente envenenado por ${b.itemName()}!`, true);
});
I.EndOfRoundEffect.add('STICKYBARB', (item, b, battle) => {
  if (!b.takesIndirectDamage()) return;
  b.pbTakeEffectDamage(Math.floor(b.totalhp / 8), false, () => battle.pbDisplay(`¡${b.pbThis()} ha resultado dañado por ${b.itemName()}!`));
});

// ---------------------------------------------------------------- Cambios, entrada y huida
I.CertainSwitching.add('SHEDSHELL', () => true);
I.OnSwitchIn.add('AIRBALLOON', (item, b, battle) => battle.pbDisplay(`¡${b.pbThis()} está flotando con ${b.itemName()}!`));
I.OnSwitchIn.add('ROOMSERVICE', (item, b, battle) => {
  if (battle.field.effects.TrickRoom === 0 || !b.pbCanLowerStatStage('SPEED')) return;
  battle.pbCommonAnimation('UseItem', b);
  b.pbLowerStatStage('SPEED', 1, null);
  b.pbConsumeItem();
});
I.OnIntimidated.add('ADRENALINEORB', (item, b, battle) => {
  if (!b.pbCanRaiseStatStage('SPEED', b)) return false;
  battle.pbCommonAnimation('UseItem', b);
  return b.pbRaiseStatStageByCause('SPEED', 1, b, nameOf(battle, item));
});
I.CertainEscapeFromBattle.add('SMOKEBALL', () => true);

// ---------------------------------------------------------------- Gen 9
I.StatLossImmunity.add('CLEARAMULET', (item, b, stat, battle, show) => {
  if (show) battle.pbDisplay(`¡${b.itemName()} de ${b.pbThis(true)} previene las bajadas de características!`);
  return true;
});
I.OnOpposingStatGain.add('MIRRORHERB', (item, b, battle, statUps, forced) => {
  let showAnim = true;
  b.mirrorHerbUsed = true;
  for (const [stat, inc] of Object.entries(statUps)) {
    if (!b.pbCanRaiseStatStage(stat, b)) continue;
    if (b.pbRaiseStatStage(stat, inc, b, showAnim)) showAnim = false;
  }
  b.mirrorHerbUsed = false;
  if (showAnim) return false;
  if (!forced) battle.pbCommonAnimation('UseItem', b);
  battle.pbDisplay(`¡${b.pbThis()} usó su ${nameOf(battle, item)} para copiar los cambios de características de su rival!`);
  return true;
});
