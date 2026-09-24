// Habilidades: bloqueo e inmunidad a movimientos, tipo del movimiento, precisión, daño y críticos
// (034_Other battle code/009_Battle_AbilityEffects, segunda parte).
import { AbilityEffects as A } from './registry.js';
import { Effectiveness } from '../typeChart.js';

const splash = (battle, b, fn) => {
  battle.pbShowAbilitySplash(b);
  fn();
  battle.pbHideAbilitySplash(b);
};
const noEffect = (battle, target) => battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
const sunny = (b) => ['Sun', 'HarshSun'].includes(b.effectiveWeather());

A.OnFlinch.add('STEADFAST', (a, battler) => { battler.pbRaiseStatStageByAbility('SPEED', 1, battler); });

// ---------------------------------------------------------------- MoveBlocking
A.MoveBlocking.add('DAZZLING', (a, bearer, user, targets, move, battle) => {
  if (battle.choices[user.index].priority <= 0) return false;
  if (!bearer.opposes(user)) return false;
  return targets.some((b) => b.opposes(user));
});
A.MoveBlocking.copy('DAZZLING', 'QUEENLYMAJESTY', 'ARMORTAIL');

// ---------------------------------------------------------------- MoveImmunity
const blocksIf = (cond) => (a, user, target, move, type, battle, show) => {
  if (!cond(user, target, move, type)) return false;
  if (show) splash(battle, target, () => noEffect(battle, target));
  return true;
};
A.MoveImmunity.add('BULLETPROOF', blocksIf((u, t, m) => m.bombMove()));
A.MoveImmunity.add('COMMANDER', (a, user, target, move, type, battle, show) => {
  if (!target.isCommander()) return false;
  if (show) battle.pbDisplay(`¡${target.pbThis()} esquivó el ataque!`);
  return true;
});
A.MoveImmunity.add('EARTHEATER', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityHealingAbility(user, move, type, 'GROUND', show));
A.MoveImmunity.add('FLASHFIRE', (a, user, target, move, type, battle, show) => {
  if (user.index === target.index || type !== 'FIRE') return false;
  if (show) {
    splash(battle, target, () => {
      if (!target.effects.FlashFire) {
        target.effects.FlashFire = true;
        battle.pbDisplay(`¡El poder de los ataques de tipo Fuego de ${target.pbThis(true)} aumentó!`);
      } else {
        noEffect(battle, target);
      }
    });
  }
  return true;
});
A.MoveImmunity.add('GOODASGOLD', blocksIf((u, t, m) => m.statusMove() && u.index !== t.index));
A.MoveImmunity.add('LIGHTNINGROD', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityStatRaisingAbility(user, move, type, 'ELECTRIC', 'SPECIAL_ATTACK', 1, show));
A.MoveImmunity.add('MOTORDRIVE', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityStatRaisingAbility(user, move, type, 'ELECTRIC', 'SPEED', 1, show));
A.MoveImmunity.add('SAPSIPPER', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityStatRaisingAbility(user, move, type, 'GRASS', 'ATTACK', 1, show));
A.MoveImmunity.add('SOUNDPROOF', blocksIf((u, t, m) => m.soundMove() && u.index !== t.index));
A.MoveImmunity.add('STORMDRAIN', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityStatRaisingAbility(user, move, type, 'WATER', 'SPECIAL_ATTACK', 1, show));
A.MoveImmunity.add('TELEPATHY', (a, user, target, move, type, battle, show) => {
  if (move.statusMove() || user.index === target.index || target.opposes(user)) return false;
  if (show) splash(battle, target, () => battle.pbDisplay(`¡${target.pbThis()} esquiva ataques de su Pokémon aliado!`));
  return true;
});
A.MoveImmunity.add('VOLTABSORB', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityHealingAbility(user, move, type, 'ELECTRIC', show));
A.MoveImmunity.add('WATERABSORB', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityHealingAbility(user, move, type, 'WATER', show));
A.MoveImmunity.copy('WATERABSORB', 'DRYSKIN');
A.MoveImmunity.add('WELLBAKEDBODY', (a, user, target, move, type, battle, show) =>
  target.pbMoveImmunityStatRaisingAbility(user, move, type, 'FIRE', 'DEFENSE', 2, show));
A.MoveImmunity.add('WINDRIDER', (a, user, target, move, type, battle, show) => {
  if (!move.windMove() || user.index === target.index) return false;
  if (show) {
    splash(battle, target, () => {
      if (target.pbCanRaiseStatStage('ATTACK', user, move)) target.pbRaiseStatStage('ATTACK', 1, user);
      else noEffect(battle, target);
    });
  }
  return true;
});
A.MoveImmunity.add('WONDERGUARD', blocksIf((u, t, m, type) =>
  !m.statusMove() && !!type && !Effectiveness.superEffective(t.damageState.typeMod)));

// ---------------------------------------------------------------- ModifyMoveBaseType
const convertNormal = (newType) => (a, user, move, type) => {
  if (type !== 'NORMAL' || !user.battle.db.types[newType]) return undefined;
  move.powerBoost = true;
  return newType;
};
const soundTo = (newType) => (a, user, move) => {
  if (!user.battle.db.types[newType] || !move.soundMove()) return undefined;
  move.powerBoost = true;
  return newType;
};
A.ModifyMoveBaseType.add('AERILATE', convertNormal('FLYING'));
A.ModifyMoveBaseType.add('GALVANIZE', convertNormal('ELECTRIC'));
A.ModifyMoveBaseType.add('PIXILATE', convertNormal('FAIRY'));
A.ModifyMoveBaseType.add('REFRIGERATE', convertNormal('ICE'));
A.ModifyMoveBaseType.add('PIELMALDITA', convertNormal('GHOST'));   // Añil
A.ModifyMoveBaseType.add('PIELHERBACEA', convertNormal('GRASS'));  // Añil
A.ModifyMoveBaseType.add('LIQUIDVOICE', soundTo('WATER'));
A.ModifyMoveBaseType.add('TINTINEO', soundTo('PSYCHIC'));          // Añil
A.ModifyMoveBaseType.add('NORMALIZE', (a, user, move) => {
  move.powerBoost = true;
  return 'NORMAL';
});

// ---------------------------------------------------------------- Precisión
A.AccuracyCalcFromUser.add('COMPOUNDEYES', (a, mods) => { mods.accuracy_multiplier *= 1.3; });
A.AccuracyCalcFromUser.add('HUSTLE', (a, mods, user, target, move) => {
  if (move.physicalMove() || move.specialMove()) mods.accuracy_multiplier *= 0.8;
});
A.AccuracyCalcFromUser.add('KEENEYE', (a, mods) => { if (mods.evasion_stage > 0) mods.evasion_stage = 0; });
A.AccuracyCalcFromUser.copy('KEENEYE', 'MINDSEYE');
A.AccuracyCalcFromUser.add('NOGUARD', (a, mods) => { mods.base_accuracy = 0; });
A.AccuracyCalcFromUser.add('UNAWARE', (a, mods, user, target, move) => { if (move.damagingMove()) mods.evasion_stage = 0; });
A.AccuracyCalcFromUser.add('VICTORYSTAR', (a, mods) => { mods.accuracy_multiplier *= 1.1; });
A.AccuracyCalcFromAlly.add('VICTORYSTAR', (a, mods) => { mods.accuracy_multiplier *= 1.1; });

A.AccuracyCalcFromTarget.add('LIGHTNINGROD', (a, mods, u, t, m, type) => { if (type === 'ELECTRIC') mods.base_accuracy = 0; });
A.AccuracyCalcFromTarget.add('NOGUARD', (a, mods) => { mods.base_accuracy = 0; });
A.AccuracyCalcFromTarget.add('SANDVEIL', (a, mods, u, t) => { if (t.effectiveWeather() === 'Sandstorm') mods.evasion_multiplier *= 1.25; });
A.AccuracyCalcFromTarget.add('SNOWCLOAK', (a, mods, u, t) => { if (t.effectiveWeather() === 'Hail') mods.evasion_multiplier *= 1.25; });
A.AccuracyCalcFromTarget.add('STORMDRAIN', (a, mods, u, t, m, type) => { if (type === 'WATER') mods.base_accuracy = 0; });
A.AccuracyCalcFromTarget.add('TANGLEDFEET', (a, mods, u, t) => { if (t.effects.Confusion > 0) mods.accuracy_multiplier /= 2; });
A.AccuracyCalcFromTarget.add('UNAWARE', (a, mods, u, t, move) => { if (move.damagingMove()) mods.accuracy_stage = 0; });
A.AccuracyCalcFromTarget.add('WONDERSKIN', (a, mods, user, target, move) => {
  if (move.statusMove() && user.opposes(target) && mods.base_accuracy > 50) mods.base_accuracy = 50;
});

// ---------------------------------------------------------------- DamageCalcFromUser
const D = A.DamageCalcFromUser;
const attackIf = (factor, cond) => (a, user, target, move, mults, power, type) => {
  if (cond(user, target, move, type)) mults.attack_multiplier *= factor;
};
const powerIf = (factor, cond) => (a, user, target, move, mults, power, type) => {
  if (cond(user, target, move, type)) mults.power_multiplier *= factor;
};
const finalIf = (factor, cond) => (a, user, target, move, mults, power, type) => {
  if (cond(user, target, move, type)) mults.final_damage_multiplier *= factor;
};
const pinch = (pinchType) => attackIf(1.5, (u, t, m, type) => u.hp <= Math.floor(u.totalhp / 3) && type === pinchType);

D.add('AERILATE', powerIf(1.2, (u, t, m) => m.powerBoost));
D.add('ROCKYPAYLOAD', attackIf(1.5, (u, t, m, type) => type === 'ROCK'));
D.add('SHARPNESS', powerIf(1.5, (u, t, m) => m.slicingMove()));
D.add('SUPREMEOVERLORD', (a, user, target, move, mults) => {
  const bonus = user.effects.SupremeOverlord;
  if (bonus > 0) mults.power_multiplier *= 1 + 0.1 * bonus;
});
// Añil copia el manejador de Piel Celeste a todas las habilidades que convierten el tipo.
D.copy('AERILATE', 'GALVANIZE', 'LIQUIDVOICE', 'NORMALIZE', 'PIXILATE', 'REFRIGERATE', 'PIELMALDITA', 'PIELELECTRICA',
  'PIELHERBACEA', 'TINTINEO');
D.add('ANALYTIC', powerIf(1.3, (u, t, m) => m.pbMoveFailedLastInRound(u, false)));
D.add('BLAZE', pinch('FIRE'));
D.add('OVERGROW', pinch('GRASS'));
D.add('TORRENT', pinch('WATER'));
D.add('SWARM', pinch('BUG'));
D.add('SOBRECARGA', pinch('ELECTRIC')); // Añil
D.add('DEFEATIST', (a, user, target, move, mults) => { if (user.hp <= Math.floor(user.totalhp / 2)) mults.attack_multiplier /= 2; });
D.add('DRAGONSMAW', attackIf(1.5, (u, t, m, type) => type === 'DRAGON'));
D.add('FLAREBOOST', powerIf(1.5, (u, t, m) => u.burned() && m.specialMove()));
D.add('FLASHFIRE', attackIf(1.5, (u, t, m, type) => u.effects.FlashFire && type === 'FIRE'));
D.add('FLOWERGIFT', attackIf(1.5, (u, t, m) => m.physicalMove() && sunny(u)));
D.add('GORILLATACTICS', attackIf(1.5, (u, t, m) => m.physicalMove()));
D.add('PODERSABIO', attackIf(1.5, (u, t, m) => m.specialMove())); // Añil
D.add('GUTS', attackIf(1.5, (u, t, m) => u.pbHasAnyStatus() && m.physicalMove()));
D.add('HADRONENGINE', attackIf(4 / 3.0, (u, t, m) => m.specialMove() && u.battle.field.terrain === 'Electric'));
D.add('HUGEPOWER', attackIf(2, (u, t, m) => m.physicalMove()));
D.copy('HUGEPOWER', 'PUREPOWER');
D.add('HUSTLE', attackIf(1.5, (u, t, m) => m.physicalMove() || m.specialMove()));
D.add('IRONFIST', powerIf(1.2, (u, t, m) => m.punchingMove()));
D.add('CAMORRISTA', powerIf(1.2, (u, t, m) => m.kickingMove())); // Añil
D.add('MEGALAUNCHER', powerIf(1.5, (u, t, m) => m.pulseMove()));
D.add('MINUS', attackIf(1.5, (u, t, m) => m.specialMove() && u.allAllies().some((b) => b.hasActiveAbility(['MINUS', 'PLUS']))));
D.copy('MINUS', 'PLUS');
D.add('NEUROFORCE', finalIf(1.25, (u, t) => Effectiveness.superEffective(t.damageState.typeMod)));
D.add('ORICHALCUMPULSE', attackIf(4 / 3.0, (u, t, m) => m.physicalMove() && sunny(u)));
D.add('PROTOSYNTHESIS', (a, user, target, move, mults) => {
  if (user.effects.Transform) return;
  const stat = user.effects.ParadoxStat;
  if (move.physicalMove() && stat === 'ATTACK') mults.attack_multiplier *= 1.3;
  if (move.specialMove() && stat === 'SPECIAL_ATTACK') mults.attack_multiplier *= 1.3;
});
D.copy('PROTOSYNTHESIS', 'QUARKDRIVE');
D.add('PUNKROCK', attackIf(1.3, (u, t, m) => m.soundMove()));
D.add('RECKLESS', powerIf(1.2, (u, t, m) => m.recoilMove()));
// Añil: Rivalidad solo potencia contra el mismo género (sin penalización).
D.add('RIVALRY', powerIf(1.25, (u, t) => u.gender !== 2 && t.gender !== 2 && u.gender === t.gender));
D.add('SANDFORCE', powerIf(1.3, (u, t, m, type) => u.effectiveWeather() === 'Sandstorm' && ['ROCK', 'GROUND', 'STEEL'].includes(type)));
D.add('SHEERFORCE', powerIf(1.3, (u, t, m) => m.addlEffect > 0));
D.add('SLOWSTART', (a, user, target, move, mults) => { if (user.effects.SlowStart > 0 && move.physicalMove()) mults.attack_multiplier /= 2; });
D.add('ACOMETIDA', attackIf(1.3, (u) => u.turnCount === 0)); // Añil
D.add('SNIPER', finalIf(1.5, (u, t) => t.damageState.critical));
D.add('SOLARPOWER', attackIf(1.5, (u, t, m) => m.specialMove() && sunny(u)));
D.add('STAKEOUT', attackIf(2, (u, t) => t.battle.choices[t.index].action === 'SwitchOut'));
D.add('STEELWORKER', attackIf(1.5, (u, t, m, type) => type === 'STEEL'));
D.add('COLEOPTERO', attackIf(1.5, (u, t, m, type) => type === 'BUG'));   // Añil
D.add('INFLAMABLE', attackIf(1.5, (u, t, m, type) => type === 'FIRE'));  // Añil
D.add('ALBINISMO', attackIf(1.5, (u, t, m, type) => type === 'ICE'));    // Añil
D.add('SILVANO', attackIf(1.3, (u) => u.battle.field.terrain === 'Grassy')); // Añil
// Añil compara con :HAIL (nunca coincide con :Hail); se corrige para que funcione con nieve.
D.add('PODERGELIDO', attackIf(1.5, (u, t, m, type) => type === 'ICE' && u.effectiveWeather() === 'Hail'));
D.add('FLORACION', attackIf(1.5, (u, t, m, type) => type === 'GRASS'));  // Añil
D.add('REALEZA', attackIf(1.5, (u, t, m, type) => !u.types.includes(type))); // Añil
D.add('STEELYSPIRIT', finalIf(1.5, (u, t, m, type) => type === 'STEEL'));
D.add('STRONGJAW', powerIf(1.5, (u, t, m) => m.bitingMove()));
D.add('TECHNICIAN', (a, user, target, move, mults, power) => {
  if (user.index !== target.index && move && move.functionCode !== 'Struggle' && power * mults.power_multiplier <= 60) {
    mults.power_multiplier *= 1.5;
  }
});
D.add('TINTEDLENS', finalIf(2, (u, t) => Effectiveness.resistant(t.damageState.typeMod)));
D.add('TOUGHCLAWS', powerIf(4 / 3.0, (u, t, m) => m.contactMove()));
D.add('TOXICBOOST', powerIf(1.5, (u, t, m) => u.poisoned() && m.physicalMove()));
D.add('TRANSISTOR', attackIf(1.3, (u, t, m, type) => type === 'ELECTRIC')); // gen 9: ×1.3
D.add('WATERBUBBLE', attackIf(2, (u, t, m, type) => type === 'WATER'));

// ---------------------------------------------------------------- DamageCalcFromAlly
A.DamageCalcFromAlly.add('BATTERY', finalIf(1.3, (u, t, m) => m.specialMove()));
A.DamageCalcFromAlly.add('FLOWERGIFT', attackIf(1.5, (u, t, m) => m.physicalMove() && sunny(u)));
A.DamageCalcFromAlly.add('POWERSPOT', finalIf(1.3, () => true));
A.DamageCalcFromAlly.add('STEELYSPIRIT', finalIf(1.5, (u, t, m, type) => type === 'STEEL'));

// ---------------------------------------------------------------- DamageCalcFromTarget
const T = A.DamageCalcFromTarget;
const defenseIf = (factor, cond) => (a, user, target, move, mults, power, type) => {
  if (cond(user, target, move, type)) mults.defense_multiplier *= factor;
};
T.add('DRYSKIN', powerIf(1.25, (u, t, m, type) => type === 'FIRE'));
T.add('FILTER', finalIf(0.75, (u, t) => Effectiveness.superEffective(t.damageState.typeMod)));
T.copy('FILTER', 'SOLIDROCK');
T.add('FLOWERGIFT', defenseIf(1.5, (u, t, m) => m.specialMove() && sunny(t)));
T.add('FLUFFY', (a, user, target, move, mults) => {
  if (move.calcType === 'FIRE') mults.final_damage_multiplier *= 2;
  if (move.pbContactMove(user)) mults.final_damage_multiplier /= 2;
});
T.add('FURCOAT', defenseIf(2, (u, t, m) => m.physicalMove() || m.functionCode === 'UseTargetDefenseInsteadOfTargetSpDef'));
T.add('GRASSPELT', defenseIf(1.5, (u) => u.battle.field.terrain === 'Grassy'));
T.add('HEATPROOF', powerIf(0.5, (u, t, m, type) => type === 'FIRE'));
T.add('ICESCALES', finalIf(0.5, (u, t, m) => m.specialMove()));
T.add('MARVELSCALE', defenseIf(1.5, (u, t, m) => t.pbHasAnyStatus() && m.physicalMove()));
T.add('MULTISCALE', finalIf(0.5, (u, t) => t.hp === t.totalhp));
T.add('PROTOSYNTHESIS', (a, user, target, move, mults) => {
  if (target.effects.Transform) return;
  const stat = target.effects.ParadoxStat;
  if (move.physicalMove() && stat === 'DEFENSE') mults.defense_multiplier *= 1.3;
  if (move.specialMove() && stat === 'SPECIAL_DEFENSE') mults.defense_multiplier *= 1.3;
});
T.copy('PROTOSYNTHESIS', 'QUARKDRIVE');
T.add('PUNKROCK', finalIf(0.5, (u, t, m) => m.soundMove()));
T.add('THICKFAT', powerIf(0.5, (u, t, m, type) => type === 'FIRE' || type === 'ICE'));
T.add('PURIFYINGSALT', attackIf(0.5, (u, t, m, type) => type === 'GHOST'));
T.add('WATERBUBBLE', finalIf(0.5, (u, t, m, type) => type === 'FIRE'));

A.DamageCalcFromTargetNonIgnorable.add('PRISMARMOR', finalIf(0.75, (u, t) => Effectiveness.superEffective(t.damageState.typeMod)));
A.DamageCalcFromTargetNonIgnorable.add('SHADOWSHIELD', finalIf(0.5, (u, t) => t.hp === t.totalhp));
A.DamageCalcFromTargetAlly.add('FLOWERGIFT', defenseIf(1.5, (u, t, m) => m.specialMove() && sunny(t)));
A.DamageCalcFromTargetAlly.add('FRIENDGUARD', finalIf(0.75, () => true));

// ---------------------------------------------------------------- Críticos
A.CriticalCalcFromUser.add('MERCILESS', (a, user, target) => (target.poisoned() ? 99 : undefined));
A.CriticalCalcFromUser.add('SUPERLUCK', (a, user, target, c) => c + 1);
A.CriticalCalcFromTarget.add('BATTLEARMOR', () => -1);
A.CriticalCalcFromTarget.copy('BATTLEARMOR', 'SHELLARMOR');
