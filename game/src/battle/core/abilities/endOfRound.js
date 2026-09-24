// Habilidades: final de ronda, atrapar, cambios, debilitamiento y ganchos gen 9
// (034_Other battle code/009_Battle_AbilityEffects, cuarta parte).
import { AbilityEffects as A } from './registry.js';
import { MAIN_BATTLE_STATS } from '../constants.js';
import { NOT_VERY_EFFECTIVE, NORMAL_EFFECTIVE } from '../typeChart.js';

const splash = (battle, b, fn) => {
  battle.pbShowAbilitySplash(b);
  fn();
  battle.pbHideAbilitySplash(b);
};
const restored = (battle, b) => battle.pbDisplay(`Los PS de ${b.pbThis(true)} han sido restaurados.`);

// ---------------------------------------------------------------- EndOfRoundWeather
A.EndOfRoundWeather.add('DRYSKIN', (a, weather, battler, battle) => {
  if (['Sun', 'HarshSun'].includes(weather)) {
    if (!battler.takesIndirectDamage()) return;
    splash(battle, battler, () => {
      battler.pbReduceHP(Math.floor(battler.totalhp / 8), false);
      battle.pbDisplay(`¡${battler.pbThis()} fue herido por la luz solar!`);
    });
    battler.pbItemHPHealCheck();
  } else if (['Rain', 'HeavyRain'].includes(weather)) {
    if (!battler.canHeal()) return;
    splash(battle, battler, () => {
      battler.pbRecoverHP(Math.floor(battler.totalhp / 8));
      restored(battle, battler);
    });
  }
});
const weatherHeal = (weathers, div) => (a, weather, battler, battle) => {
  if (!weathers.includes(weather) || !battler.canHeal()) return;
  splash(battle, battler, () => {
    battler.pbRecoverHP(Math.floor(battler.totalhp / div));
    restored(battle, battler);
  });
};
A.EndOfRoundWeather.add('ICEBODY', weatherHeal(['Hail'], 16));
A.EndOfRoundWeather.add('RAINDISH', weatherHeal(['Rain', 'HeavyRain'], 16));
A.EndOfRoundWeather.add('ICEFACE', (a, weather, battler, battle) => {
  if (weather !== 'Hail' || !battler.canRestoreIceFace || battler.form !== 1) return;
  splash(battle, battler, () => battler.pbChangeForm(0, `¡${battler.pbThis()} se transformó!`));
});
A.EndOfRoundWeather.add('SOLARPOWER', (a, weather, battler, battle) => {
  if (!['Sun', 'HarshSun'].includes(weather) || !battler.takesIndirectDamage()) return;
  splash(battle, battler, () => {
    battler.pbReduceHP(Math.floor(battler.totalhp / 8), false);
    battle.pbDisplay(`¡${battler.pbThis()} fue herido por la luz solar!`);
  });
  battler.pbItemHPHealCheck();
});

// ---------------------------------------------------------------- EndOfRoundHealing
A.EndOfRoundHealing.add('HEALER', (a, battler, battle) => {
  if (battle.pbRandom(100) >= 30) return;
  for (const b of battler.allAllies()) {
    if (b.status === 'NONE') continue;
    splash(battle, battler, () => b.pbCureStatus(true));
  }
});
A.EndOfRoundHealing.add('HYDRATION', (a, battler, battle) => {
  if (battler.status === 'NONE' || !['Rain', 'HeavyRain'].includes(battler.effectiveWeather())) return;
  splash(battle, battler, () => battler.pbCureStatus(true));
});
A.EndOfRoundHealing.add('SHEDSKIN', (a, battler, battle) => {
  if (battler.status === 'NONE' || battle.pbRandom(100) >= 30) return;
  splash(battle, battler, () => battler.pbCureStatus(true));
});

// ---------------------------------------------------------------- EndOfRoundEffect
A.EndOfRoundEffect.add('BADDREAMS', (a, battler, battle) => {
  for (const b of battle.allOtherSideBattlers(battler.index)) {
    if (!b.near(battler) || !b.asleep()) continue;
    battle.pbShowAbilitySplash(battler);
    if (!b.takesIndirectDamage(true)) {
      battle.pbHideAbilitySplash(battler);
      continue;
    }
    b.pbTakeEffectDamage(Math.floor(b.totalhp / 8), true, () => {
      battle.pbDisplay(`¡${b.pbThis()} está inmerso en un sueño agitado!`);
      battle.pbHideAbilitySplash(battler);
    });
  }
});
A.EndOfRoundEffect.add('CUDCHEW', (a, battler, battle) => {
  if (battler.item || !battler.recycleItem || !battle.isBerry(battler.recycleItem)) return;
  if (battler.effects.CudChew === 0) {
    battler.effects.CudChew += 1;
    return;
  }
  battler.effects.CudChew = 0;
  battle.pbShowAbilitySplash(battler, true);
  battle.pbHideAbilitySplash(battler);
  battler.pbHeldItemTriggerCheck(battler.recycleItem, true);
  battler.setRecycleItem(null);
});
A.EndOfRoundEffect.add('MOODY', (a, battler, battle) => {
  const up = MAIN_BATTLE_STATS.filter((s) => battler.pbCanRaiseStatStage(s, battler));
  let down = MAIN_BATTLE_STATS.filter((s) => battler.pbCanLowerStatStage(s, battler));
  if (up.length === 0 && down.length === 0) return;
  battle.pbShowAbilitySplash(battler);
  if (up.length > 0) {
    const s = up[battle.pbRandom(up.length)];
    battler.pbRaiseStatStageByAbility(s, 2, battler, false);
    down = down.filter((d) => d !== s);
  }
  if (down.length > 0) battler.pbLowerStatStageByAbility(down[battle.pbRandom(down.length)], 1, battler, false);
  battle.pbHideAbilitySplash(battler);
  if (down.length > 0) battler.pbItemStatRestoreCheck();
  battler.pbItemOnStatDropped();
});
A.EndOfRoundEffect.add('SPEEDBOOST', (a, battler, battle) => {
  if (battler.turnCount > 0 && battle.choices[battler.index].action !== 'Run' && battler.pbCanRaiseStatStage('SPEED', battler)) {
    battler.pbRaiseStatStageByAbility('SPEED', 1, battler);
  }
});

// ---------------------------------------------------------------- EndOfRoundGainItem
A.EndOfRoundGainItem.add('BALLFETCH', (a, battler, battle) => {
  if (battler.item || !battle.firstPokeBall) return;
  splash(battle, battler, () => {
    battler.item = battle.firstPokeBall;
    if (!battler.initialItem) battler.setInitialItem(battler.item);
    battle.firstPokeBall = null;
    battle.pbDisplay(`¡${battler.pbThis()} ha recuperado la ${battler.itemName()} lanzada!`);
  });
  battler.pbHeldItemTriggerCheck();
});
A.EndOfRoundGainItem.add('HARVEST', (a, battler, battle) => {
  if (battler.item || !battler.recycleItem || !battle.isBerry(battler.recycleItem)) return;
  if (!['Sun', 'HarshSun'].includes(battler.effectiveWeather()) && battle.pbRandom(100) >= 50) return;
  splash(battle, battler, () => {
    battler.item = battler.recycleItem;
    battler.setRecycleItem(null);
    if (!battler.initialItem) battler.setInitialItem(battler.item);
    battle.pbDisplay(`¡${battler.pbThis()} ha cosechado una ${battler.itemName()}!`);
  });
  battler.pbHeldItemTriggerCheck();
});
A.EndOfRoundGainItem.add('PICKUP', (a, battler, battle) => {
  if (battler.item) return;
  let found = null;
  let from = null;
  let use = 0;
  for (const b of battle.allBattlers()) {
    if (b.index === battler.index || b.effects.PickupUse <= use) continue;
    found = b.effects.PickupItem;
    from = b;
    use = b.effects.PickupUse;
  }
  if (!found) return;
  splash(battle, battler, () => {
    battler.item = found;
    from.effects.PickupItem = null;
    from.effects.PickupUse = 0;
    if (from.recycleItem === found) from.setRecycleItem(null);
    if (battle.wildBattle() && !battler.initialItem && from.initialItem === found) {
      battler.setInitialItem(found);
      from.setInitialItem(null);
    }
    battle.pbDisplay(`¡${battler.pbThis()} ha encontrado ${battler.itemName()}!`);
  });
  battler.pbHeldItemTriggerCheck();
});

// ---------------------------------------------------------------- Atrapar
A.TrappingByTarget.add('ARENATRAP', (a, switcher) => (!switcher.airborne() ? true : undefined));
A.TrappingByTarget.add('MAGNETPULL', (a, switcher) => (switcher.pbHasType('STEEL') ? true : undefined));
A.TrappingByTarget.add('SHADOWTAG', (a, switcher) => (!switcher.hasActiveAbility('SHADOWTAG') ? true : undefined));

// ---------------------------------------------------------------- OnSwitchOut
const clearStatusOnSwitch = (...statuses) => (a, battler) => {
  if (statuses.includes(battler.status)) battler.status = 'NONE';
};
A.OnSwitchOut.add('IMMUNITY', clearStatusOnSwitch('POISON'));
A.OnSwitchOut.add('INSOMNIA', clearStatusOnSwitch('SLEEP'));
A.OnSwitchOut.copy('INSOMNIA', 'VITALSPIRIT');
A.OnSwitchOut.add('LIMBER', clearStatusOnSwitch('PARALYSIS'));
A.OnSwitchOut.add('MAGMAARMOR', clearStatusOnSwitch('FROZEN'));
A.OnSwitchOut.add('WATERVEIL', clearStatusOnSwitch('BURN'));
A.OnSwitchOut.copy('WATERVEIL', 'WATERBUBBLE');
A.OnSwitchOut.add('NATURALCURE', (a, battler) => { battler.status = 'NONE'; });
A.OnSwitchOut.add('REGENERATOR', (a, battler, endOfBattle) => {
  if (!endOfBattle) battler.pbRecoverHP(Math.floor(battler.totalhp / 3), false, false);
});
A.OnSwitchOut.add('ZEROTOHERO', (a, battler, endOfBattle) => {
  if (!battler.isSpecies('PALAFIN') || battler.form === 1 || endOfBattle) return;
  battler.pbChangeForm(1, '');
});

// ---------------------------------------------------------------- Debilitamiento
A.ChangeOnBattlerFainting.add('POWEROFALCHEMY', (a, battler, fainted, battle) => {
  if (battler.opposes(fainted)) return;
  if (fainted.ungainableAbility() || ['POWEROFALCHEMY', 'RECEIVER', 'TRACE', 'WONDERGUARD'].includes(fainted.ability)) return;
  if (fainted.uncopyableAbility() || battler.hasActiveItem('ABILITYSHIELD')) return;
  battle.pbShowAbilitySplash(battler, true);
  battler.ability = fainted.ability;
  battle.pbReplaceAbilitySplash(battler);
  battle.pbDisplay(`¡${battler.pbThis()} ha recibido la habilidad ${fainted.abilityName()} de ${fainted.pbThis(true)}!`);
  battle.pbHideAbilitySplash(battler);
});
A.ChangeOnBattlerFainting.copy('POWEROFALCHEMY', 'RECEIVER');
A.OnBattlerFainting.add('SOULHEART', (a, battler) => { battler.pbRaiseStatStageByAbility('SPECIAL_ATTACK', 1, battler); });

// ---------------------------------------------------------------- Campo
const MIMICRY_TYPES = { Electric: 'ELECTRIC', Grassy: 'GRASS', Misty: 'FAIRY', Psychic: 'PSYCHIC' };
A.OnTerrainChange.add('MIMICRY', (a, battler, battle) => {
  if (battle.field.terrain === 'None') {
    splash(battle, battler, () => {
      battler.pbResetTypes();
      battle.pbDisplay(`¡${battler.pbThis()} ha cambiado de nuevo a su tipo normal!`);
    });
    return;
  }
  const t = MIMICRY_TYPES[battle.field.terrain];
  if (!t || !battle.db.types[t]) return;
  splash(battle, battler, () => {
    battler.pbChangeTypes(t);
    battle.pbDisplay(`¡El tipo de ${battler.pbThis(true)} cambió a ${battle.typeName(t)}!`);
  });
});
A.OnTerrainChange.add('QUARKDRIVE', (a, battler, battle, changed) => { A.triggerOnSwitchIn(a, battler, battle, changed); });

A.OnIntimidated.add('RATTLED', (a, battler) => { battler.pbRaiseStatStageByAbility('SPEED', 1, battler); });
A.CertainEscapeFromBattle.add('RUNAWAY', () => true);

// ---------------------------------------------------------------- Gen 9
A.OnTypeChange.add('PROTEAN', (a, battler, type) => {
  const data = battler.battle.db.types[type];
  if (data && data.pseudo) return;
  battler.effects.OneUseAbility = a;
});
A.OnTypeChange.copy('PROTEAN', 'LIBERO');

A.OnOpposingStatGain.add('OPPORTUNIST', (a, battler, battle, statUps) => {
  let showAnim = true;
  battle.pbShowAbilitySplash(battler);
  for (const [stat, inc] of Object.entries(statUps)) {
    if (!battler.pbCanRaiseStatStage(stat, battler)) continue;
    if (battler.pbRaiseStatStage(stat, inc, battler, showAnim)) showAnim = false;
  }
  if (showAnim) battle.pbDisplay(`¡Las características de ${battler.pbThis(true)} no pueden subir más!`);
  battle.pbHideAbilitySplash(battler);
  battler.pbItemOpposingStatGainCheck(statUps);
  if (!showAnim) {
    const opposing = battle.sideStatUps[battler.idxOwnSide()];
    for (const b of battle.allOtherSideBattlers(battler.index)) if (b.itemActive()) b.pbItemOpposingStatGainCheck(opposing);
    for (const k of Object.keys(opposing)) delete opposing[k];
  }
});

A.ModifyTypeEffectiveness.add('TERASHELL', (a, user, target, move, battle, eff) => {
  if (!move.damagingMove() || user.hasMoldBreaker() || target.hp < target.totalhp || eff < NORMAL_EFFECTIVE) return undefined;
  target.damageState.terashell = true;
  return NOT_VERY_EFFECTIVE;
});
A.OnMoveSuccessCheck.add('TERASHELL', (a, user, target, move, battle) => {
  if (!target.damageState.terashell) return;
  splash(battle, target, () => battle.pbDisplay(`¡${target.pbThis()} hizo brillar su caparazón! ¡Está distorsionando la tabla de tipos!`));
});

A.OnInflictingStatus.add('POISONPUPPETEER', (a, user, battler, status) => {
  if (!user || user.index === battler.index || status !== 'POISON' || battler.effects.Confusion > 0) return;
  splash(user.battle, user, () => { if (battler.pbCanConfuse(user, false, null)) battler.pbConfuse(); });
});
