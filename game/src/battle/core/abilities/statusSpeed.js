// Habilidades: velocidad, peso, estados, bajadas de características y prioridad
// (034_Other battle code/009_Battle_AbilityEffects, primera parte).
import { AbilityEffects as A } from './registry.js';
import { STAT_NAMES } from '../constants.js';

const splash = (battle, b, fn) => {
  battle.pbShowAbilitySplash(b);
  fn();
  battle.pbHideAbilitySplash(b);
};
const inWeather = (b, ...ws) => ws.includes(b.effectiveWeather());

// ---------------------------------------------------------------- SpeedCalc
A.SpeedCalc.add('CHLOROPHYLL', (a, b, mult) => (inWeather(b, 'Sun', 'HarshSun') ? mult * 2 : undefined));
A.SpeedCalc.add('PROTOSYNTHESIS', (a, b, mult) => {
  if (b.effects.Transform) return mult;
  return b.effects.ParadoxStat === 'SPEED' ? mult * 1.5 : undefined;
});
A.SpeedCalc.copy('PROTOSYNTHESIS', 'QUARKDRIVE');
A.SpeedCalc.add('QUICKFEET', (a, b, mult) => (b.pbHasAnyStatus() ? mult * 1.5 : undefined));
A.SpeedCalc.add('SANDRUSH', (a, b, mult) => (inWeather(b, 'Sandstorm') ? mult * 2 : undefined));
A.SpeedCalc.add('SLOWSTART', (a, b, mult) => (b.effects.SlowStart > 0 ? mult / 2 : undefined));
// Añil: Acometida (×1.5 el primer turno en combate).
A.SpeedCalc.add('ACOMETIDA', (a, b, mult) => (b.turnCount === 0 ? mult * 1.5 : undefined));
A.SpeedCalc.add('SLUSHRUSH', (a, b, mult) => (inWeather(b, 'Hail') ? mult * 2 : undefined));
// Añil: Poder Gélido (como Quitanieves).
A.SpeedCalc.add('PODERGELIDO', (a, b, mult) => (inWeather(b, 'Hail') ? mult * 2 : undefined));
A.SpeedCalc.add('SURGESURFER', (a, b, mult) => (b.battle.field.terrain === 'Electric' ? mult * 2 : undefined));
A.SpeedCalc.add('SWIFTSWIM', (a, b, mult) => (inWeather(b, 'Rain', 'HeavyRain') ? mult * 2 : undefined));
A.SpeedCalc.add('UNBURDEN', (a, b, mult) => (b.effects.Unburden && !b.item ? mult * 2 : undefined));

// ---------------------------------------------------------------- WeightCalc
A.WeightCalc.add('HEAVYMETAL', (a, b, w) => w * 2);
A.WeightCalc.add('LIGHTMETAL', (a, b, w) => Math.max(Math.floor(w / 2), 1));

// ---------------------------------------------------------------- OnHPDroppedBelowHalf
A.OnHPDroppedBelowHalf.add('WIMPOUT', (a, battler, moveUser, battle) => {
  if (battler.effects.SkyDrop >= 0 || battler.inTwoTurnAttack('TwoTurnAttackInvulnerableInSkyTargetCannotAct')) return false;
  if (battle.wildBattle()) {
    if (battler.opposes() && battle.pbSideBattlerCount(battler.index) > 1) return false;
    if (!battle.pbCanRun(battler.index)) return false;
    battle.pbShowAbilitySplash(battler, true);
    battle.pbHideAbilitySplash(battler);
    battle.pbDisplay(`¡${battler.pbThis()} ha huido!`);
    battle.decision = 3;
    return true;
  }
  if (battle.pbAllFainted(battler.idxOpposingSide())) return false;
  if (!battle.pbCanSwitchOut(battler.index) || !battle.pbCanChooseNonActive(battler.index)) return false;
  battle.pbShowAbilitySplash(battler, true);
  battle.pbHideAbilitySplash(battler);
  battle.pbDisplay(`¡${battler.pbThis()} regresó con ${battle.pbGetOwnerName(battler.index)}!`);
  if (moveUser && battler.index === moveUser.index) battle.moldBreaker = false;
  battle.pbRecallForReplacement(battler.index);
  return true;
});
// Nota: Añil deja comentada la copia a EMERGENCYEXIT; se mantiene igual (Huida sin efecto propio).

// Espesura, Mar Llamas, Torrente, Enjambre y Sobrecarga: como en Essentials, sin cartel ni mensaje (Añil
// anunciaba «¡Espesura activado!» al bajar de 1/3 y al entrar). Su efecto está en abilities/damage.js.

// ---------------------------------------------------------------- Estados
A.StatusCheckNonIgnorable.add('COMATOSE', (a, b, status) => {
  if (!b.isSpecies('KOMALA')) return false;
  return status == null || status === 'SLEEP' ? true : undefined;
});

const immuneTo = (...statuses) => (a, b, status) => (statuses.includes(status) ? true : undefined);
A.StatusImmunity.add('FLOWERVEIL', (a, b) => (b.pbHasType('GRASS') ? true : undefined));
A.StatusImmunity.add('IMMUNITY', immuneTo('POISON'));
A.StatusImmunity.copy('IMMUNITY', 'PASTELVEIL');
A.StatusImmunity.add('INSOMNIA', immuneTo('SLEEP'));
A.StatusImmunity.copy('INSOMNIA', 'SWEETVEIL', 'VITALSPIRIT');
A.StatusImmunity.add('LEAFGUARD', (a, b) => (inWeather(b, 'Sun', 'HarshSun') ? true : undefined));
A.StatusImmunity.add('LIMBER', immuneTo('PARALYSIS'));
A.StatusImmunity.add('MAGMAARMOR', immuneTo('FROZEN'));
A.StatusImmunity.add('PURIFYINGSALT', () => true);
A.StatusImmunity.add('WATERVEIL', immuneTo('BURN'));
A.StatusImmunity.copy('WATERVEIL', 'WATERBUBBLE', 'THERMALEXCHANGE');

A.StatusImmunityNonIgnorable.add('COMATOSE', (a, b) => (b.isSpecies('KOMALA') ? true : undefined));
A.StatusImmunityNonIgnorable.add('SHIELDSDOWN', (a, b) => (b.isSpecies('MINIOR') && b.form < 7 ? true : undefined));

A.StatusImmunityFromAlly.add('FLOWERVEIL', (a, b) => (b.pbHasType('GRASS') ? true : undefined));
A.StatusImmunityFromAlly.add('PASTELVEIL', immuneTo('POISON'));
A.StatusImmunityFromAlly.add('SWEETVEIL', immuneTo('SLEEP'));

A.OnStatusInflicted.add('SYNCHRONIZE', (a, battler, user, status) => {
  if (!user || user.index === battler.index) return;
  const battle = battler.battle;
  switch (status) {
    case 'POISON':
      if (user.pbCanPoisonSynchronize(battler)) splash(battle, battler, () => user.pbPoison(null, null, battler.statusCount > 0));
      break;
    case 'BURN':
      if (user.pbCanBurnSynchronize(battler)) splash(battle, battler, () => user.pbBurn(null));
      break;
    case 'PARALYSIS':
      if (user.pbCanParalyzeSynchronize(battler)) splash(battle, battler, () => user.pbParalyze(null));
      break;
    case 'FROSTBITE':
      if (user.pbCanSynchronizeStatus('FROZEN', battler)) splash(battle, battler, () => user.pbFreeze(null));
      break;
    default: break;
  }
});

/** Habilidad que cura un estado concreto al activarse. */
const cureStatus = (...statuses) => (a, battler) => {
  if (!statuses.includes(battler.status)) return;
  splash(battler.battle, battler, () => battler.pbCureStatus(true));
};
A.StatusCure.add('IMMUNITY', cureStatus('POISON'));
A.StatusCure.copy('IMMUNITY', 'PASTELVEIL');
A.StatusCure.add('INSOMNIA', cureStatus('SLEEP'));
A.StatusCure.copy('INSOMNIA', 'VITALSPIRIT');
A.StatusCure.add('LIMBER', cureStatus('PARALYSIS'));
A.StatusCure.add('MAGMAARMOR', cureStatus('FROZEN', 'FROSTBITE'));
A.StatusCure.add('WATERVEIL', cureStatus('BURN'));
A.StatusCure.copy('WATERVEIL', 'WATERBUBBLE');
A.StatusCure.add('OBLIVIOUS', (a, battler) => {
  if (battler.effects.Attract < 0 && battler.effects.Taunt === 0) return;
  const battle = battler.battle;
  splash(battle, battler, () => {
    if (battler.effects.Attract >= 0) {
      battler.pbCureAttract();
      battle.pbDisplay(`${battler.pbThis()} dejó de estar enamorado.`);
    }
    if (battler.effects.Taunt > 0) {
      battler.effects.Taunt = 0;
      battle.pbDisplay(`¡El efecto de Mofa sobre ${battler.pbThis(true)} desapareció!`);
    }
  });
});
A.StatusCure.add('OWNTEMPO', (a, battler) => {
  if (battler.effects.Confusion === 0) return;
  splash(battler.battle, battler, () => {
    battler.pbCureConfusion();
    battler.battle.pbDisplay(`${battler.pbThis()} dejó de estar confuso.`);
  });
});

// ---------------------------------------------------------------- Bajadas de características
const FEMININE = new Set(['DEFENSE', 'SPECIAL_DEFENSE', 'SPEED', 'ACCURACY', 'EVASION']);
const statLossMsg = (battle, battler, stat) => battle.pbDisplay(FEMININE.has(stat)
  ? `¡La ${STAT_NAMES[stat]} de ${battler.pbThis(true)} no puede ser bajada!`
  : `¡El ${STAT_NAMES[stat]} de ${battler.pbThis(true)} no puede ser bajado!`);
const allStatsMsg = (battle, battler) => battle.pbDisplay(`¡Las estadísticas de ${battler.pbThis(true)} no pueden ser bajadas!`);
const protectsStat = (onlyStat) => (a, battler, stat, battle, show) => {
  if (stat !== onlyStat) return false;
  if (show) splash(battle, battler, () => statLossMsg(battle, battler, stat));
  return true;
};
const protectsAll = (condition = () => true) => (a, battler, stat, battle, show) => {
  if (!condition(battler)) return false;
  if (show) splash(battle, battler, () => allStatsMsg(battle, battler));
  return true;
};
A.StatLossImmunity.add('BIGPECKS', protectsStat('DEFENSE'));
A.StatLossImmunity.add('CLEARBODY', protectsAll());
A.StatLossImmunity.copy('CLEARBODY', 'WHITESMOKE');
A.StatLossImmunity.add('FLOWERVEIL', protectsAll((b) => b.pbHasType('GRASS')));
A.StatLossImmunity.add('HYPERCUTTER', protectsStat('ATTACK'));
A.StatLossImmunity.add('KEENEYE', protectsStat('ACCURACY'));
A.StatLossImmunity.copy('KEENEYE', 'MINDSEYE');
A.StatLossImmunityNonIgnorable.add('FULLMETALBODY', protectsAll());
A.StatLossImmunityFromAlly.add('FLOWERVEIL', (a, bearer, battler, stat, battle, show) => {
  if (!battler.pbHasType('GRASS')) return false;
  if (show) splash(battle, bearer, () => allStatsMsg(battle, battler));
  return true;
});

A.OnStatLoss.add('COMPETITIVE', (a, battler, stat, user) => {
  if (user && !user.opposes(battler)) return;
  battler.pbRaiseStatStageByAbility('SPECIAL_ATTACK', 2, battler);
});
A.OnStatLoss.add('DEFIANT', (a, battler, stat, user) => {
  if (user && !user.opposes(battler)) return;
  battler.pbRaiseStatStageByAbility('ATTACK', 2, battler);
});

// ---------------------------------------------------------------- Prioridad
A.PriorityChange.add('GALEWINGS', (a, b, move, pri) => (b.hp === b.totalhp && move.type === 'FLYING' ? pri + 1 : undefined));
A.PriorityChange.add('PRANKSTER', (a, b, move, pri) => {
  if (!move.statusMove()) return undefined;
  b.effects.Prankster = true;
  return pri + 1;
});
A.PriorityChange.add('TRIAGE', (a, b, move, pri) => (move.healingMove() ? pri + 3 : undefined));

A.PriorityBracketChange.add('MYCELIUMMIGHT', (a, b, battle) => {
  const ch = battle.choices[b.index];
  return ch.action === 'UseMove' && ch.move && ch.move.statusMove() ? -1 : undefined;
});
A.PriorityBracketChange.add('QUICKDRAW', (a, b, battle) => {
  const ch = battle.choices[b.index];
  if (ch.action !== 'UseMove' || !ch.move) return undefined;
  return battle.pbRandom(100) < 30 && ch.move.damagingMove() ? 1 : undefined;
});
A.PriorityBracketChange.add('STALL', () => -1);
A.PriorityBracketUse.add('QUICKDRAW', (a, b, battle) => {
  splash(battle, b, () => battle.pbDisplay(`¡${b.abilityName()} de ${b.pbThis(true)} hizo que se moviera más rápido!`));
});
