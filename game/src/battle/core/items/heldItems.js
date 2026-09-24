// Objetos equipados: velocidad, peso, bayas de PS/estado, prioridad, precisión y daño
// (034_Other battle code/010_Battle_ItemEffects, primera parte).
import { ItemEffects as I } from './registry.js';
import { AbilityEffects } from '../abilities/registry.js';
import { Effectiveness } from '../typeChart.js';
import { MAIN_BATTLE_STATS, OHKO_CODES } from '../constants.js';
import { speciesData } from '../pokemon.js';

const nameOf = (battle, item) => battle.itemName(item);
/** Número de evoluciones directas de la especie/forma (get_evolutions de Essentials). */
const evolutionCount = (battler) => {
  if (!battler.pokemon) return 0;
  const sp = speciesData(battler.db, battler.pokemon.species, battler.pokemon.form || 0);
  return (sp.evolutions || []).filter(([target]) => !!battler.db.species[target]).length;
};

// ---------------------------------------------------------------- SpeedCalc / WeightCalc
I.SpeedCalc.add('CHOICESCARF', (i, b, mult) => mult * 1.5);
I.SpeedCalc.add('IRONBALL', (i, b, mult) => mult / 2);
I.SpeedCalc.add('MACHOBRACE', (i, b, mult) => mult / 2);
I.SpeedCalc.copy('MACHOBRACE', 'POWERANKLET', 'POWERBAND', 'POWERBELT', 'POWERBRACER', 'POWERLENS', 'POWERWEIGHT');
I.SpeedCalc.add('QUICKPOWDER', (i, b, mult) => (b.isSpecies('DITTO') && !b.effects.Transform ? mult * 2 : undefined));
// Añil: Supermineral Evolutivo (×1.5 si la especie tiene más de una evolución).
I.SpeedCalc.add('SUPEREVIOLITE', (i, b, mult) => (evolutionCount(b) > 1 ? mult * 1.5 : undefined));
I.WeightCalc.add('FLOATSTONE', (i, b, w) => Math.max(Math.floor(w / 2), 1));

// ---------------------------------------------------------------- HPHeal
const H = I.HPHeal;
const confusionBerry = (stat, flavor) => (item, b, battle, forced) =>
  b.pbConfusionBerry(item, forced, stat, `¡La ${nameOf(battle, item)} estaba demasiado ${flavor} para ${b.pbThis(true)}!`);
H.add('AGUAVBERRY', confusionBerry('SPECIAL_DEFENSE', 'amarga'));
H.add('FIGYBERRY', confusionBerry('ATTACK', 'picante'));
H.add('IAPAPABERRY', confusionBerry('DEFENSE', 'ácida'));
H.add('MAGOBERRY', confusionBerry('SPEED', 'dulce'));
H.add('WIKIBERRY', confusionBerry('SPECIAL_ATTACK', 'seca'));

const statBerry = (stat) => (item, b, battle, forced) => b.pbStatIncreasingBerry(item, forced, stat);
H.add('APICOTBERRY', statBerry('SPECIAL_DEFENSE'));
H.add('GANLONBERRY', statBerry('DEFENSE'));
H.add('LIECHIBERRY', statBerry('ATTACK'));
H.add('PETAYABERRY', statBerry('SPECIAL_ATTACK'));
H.add('SALACBERRY', statBerry('SPEED'));
H.add('STARFBERRY', (item, b, battle, forced) => {
  const stats = MAIN_BATTLE_STATS.filter((s) => b.pbCanRaiseStatStage(s, b));
  if (stats.length === 0) return false;
  return b.pbStatIncreasingBerry(item, forced, stats[battle.pbRandom(stats.length)], 2);
});

H.add('BERRYJUICE', (item, b, battle, forced) => {
  if (!b.canHeal()) return false;
  if (!forced && b.hp > Math.floor(b.totalhp / 2)) return false;
  if (!forced) battle.pbCommonAnimation('UseItem', b);
  b.pbRecoverHP(20);
  battle.pbDisplay(forced ? `¡${b.pbThis()} ha recuperado PS!` : `¡${b.pbThis()} ha recuperado PS con ${nameOf(battle, item)}!`);
  return true;
});

/** Baya que cura PS (Aranja: fijo; Zidra: 1/4). */
const healBerry = (amountFn, msg) => (item, b, battle, forced) => {
  if (!b.canHeal()) return false;
  if (!forced && !b.canConsumePinchBerry(false)) return false;
  let amt = amountFn(b);
  const ripening = b.hasActiveAbility('RIPEN');
  if (ripening) {
    battle.pbShowAbilitySplash(b, forced);
    amt *= 2;
  }
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  if (ripening) battle.pbHideAbilitySplash(b);
  b.pbRecoverHP(amt);
  battle.pbDisplay(forced ? `¡${b.pbThis()} ha recuperado PS!` : msg(b, nameOf(battle, item)));
  return true;
};
H.add('ORANBERRY', healBerry(() => 10, (b, n) => `¡${b.pbThis()} ha recuperado unos pocos PS con ${n}!`));
H.add('SITRUSBERRY', healBerry((b) => Math.floor(b.totalhp / 4), (b, n) => `¡${b.pbThis()} ha restaurado su salud con ${n}!`));

H.add('LANSATBERRY', (item, b, battle, forced) => {
  if (!forced && !b.canConsumePinchBerry()) return false;
  if (b.effects.FocusEnergy >= 2) return false;
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  b.effects.FocusEnergy = 2;
  const n = nameOf(battle, item);
  battle.pbDisplay(forced ? `¡${b.pbThis()} se ha entusiasmado con ${n}!` : `¡${b.pbThis()} ha usado ${n} y se ha entusiasmado!`);
  return true;
});

H.add('MICLEBERRY', (item, b, battle, forced) => {
  if (!forced && !b.canConsumePinchBerry()) return false;
  // Essentials/Añil comprueban `!MicleBerry` (nunca se activaría); se corrige a "si ya está activa".
  if (b.effects.MicleBerry) return false;
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  b.effects.MicleBerry = true;
  battle.pbDisplay(forced ? `¡${b.pbThis()} ha aumentado la precisión de su próximo ataque!`
    : `¡${b.pbThis()} ha aumentado la precisión de su próximo ataque con ${nameOf(battle, item)}!`);
  return true;
});

// ---------------------------------------------------------------- OnStatLoss (Mochila Escape)
I.OnStatLoss.add('EJECTPACK', (item, battler, moveUser, battle) => {
  if (battler.effects.SkyDrop >= 0 || battler.inTwoTurnAttack('TwoTurnAttackInvulnerableInSkyTargetCannotAct')) return false;
  if (battle.pbAllFainted(battler.idxOpposingSide()) || battler.wild()) return false;
  if (!battle.pbCanSwitchOut(battler.index) || !battle.pbCanChooseNonActive(battler.index)) return false;
  battle.pbCommonAnimation('UseItem', battler);
  battle.pbDisplay(`¡${battler.pbThis()} regresa gracias a ${battler.itemName()}!`);
  battler.pbConsumeItem(true, false);
  if (moveUser && battler.index === moveUser.index) battle.moldBreaker = false;
  battle.pbRecallForReplacement(battler.index);
  return true;
});

// ---------------------------------------------------------------- StatusCure
const cureBerry = (statuses, msg) => (item, b, battle, forced) => {
  if (!forced && !b.canConsumeBerry()) return false;
  if (!statuses.includes(b.status)) return false;
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  b.pbCureStatus(forced);
  if (!forced) battle.pbDisplay(msg(b, nameOf(battle, item)));
  return true;
};
const C = I.StatusCure;
C.add('ASPEARBERRY', cureBerry(['FROZEN', 'FROSTBITE'], (b, n) => `¡${b.pbThis()} se ha descongelado con ${n}!`));
C.add('CHERIBERRY', cureBerry(['PARALYSIS'], (b, n) => `¡${b.pbThis()} se ha curado de la parálisis con ${n}!`));
C.add('CHESTOBERRY', cureBerry(['SLEEP'], (b, n) => `¡${b.pbThis()} se ha despertado con ${n}!`));
C.add('PECHABERRY', cureBerry(['POISON'], (b, n) => `¡${b.pbThis()} se ha curado del envenenamiento con ${n}!`));
C.add('RAWSTBERRY', cureBerry(['BURN'], (b, n) => `¡${b.pbThis()} se ha curado de las quemaduras con ${n}!`));

const LUM_MSG = {
  SLEEP: 'se ha despertado', POISON: 'se ha curado del envenenamiento', BURN: 'se ha curado de las quemaduras',
  PARALYSIS: 'se ha curado de la parálisis', FROZEN: 'se ha descongelado', FROSTBITE: 'se ha descongelado',
};
C.add('LUMBERRY', (item, b, battle, forced) => {
  if (!forced && !b.canConsumeBerry()) return false;
  if (b.status === 'NONE' && b.effects.Confusion === 0) return false;
  const n = nameOf(battle, item);
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  const oldStatus = b.status;
  const oldConfusion = b.effects.Confusion > 0;
  b.pbCureStatus(forced);
  b.pbCureConfusion();
  if (forced) {
    if (oldConfusion) battle.pbDisplay(`¡${b.pbThis()} ya no está confuso!`);
  } else {
    if (LUM_MSG[oldStatus]) battle.pbDisplay(`¡${b.pbThis()} ${LUM_MSG[oldStatus]} con ${n}!`);
    if (oldConfusion) battle.pbDisplay(`¡${b.pbThis()} ya no está confuso gracias a ${n}!`);
  }
  return true;
});
C.add('PERSIMBERRY', (item, b, battle, forced) => {
  if (!forced && !b.canConsumeBerry()) return false;
  if (b.effects.Confusion === 0) return false;
  if (!forced) battle.pbCommonAnimation('EatBerry', b);
  b.pbCureConfusion();
  battle.pbDisplay(forced ? `¡${b.pbThis()} ya no está confuso!` : `¡${b.pbThis()} ya no está confuso gracias a ${nameOf(battle, item)}!`);
  return true;
});
C.add('MENTALHERB', (item, b, battle, forced) => {
  const e = b.effects;
  if (e.Attract === -1 && e.Taunt === 0 && e.Encore === 0 && !e.Torment && e.Disable === 0 && e.HealBlock === 0) return false;
  if (!forced) battle.pbCommonAnimation('UseItem', b);
  if (e.Attract >= 0) {
    battle.pbDisplay(forced ? `¡${b.pbThis()} se ha liberado del enamoramiento!`
      : `¡${b.pbThis()} se ha liberado del enamoramiento con ${nameOf(battle, item)}!`);
    b.pbCureAttract();
  }
  if (e.Taunt > 0) battle.pbDisplay(`¡${b.pbThis()} ya se ha olvidado de la mofa!`);
  e.Taunt = 0;
  if (e.Encore > 0) battle.pbDisplay(`¡${b.pbThis()} ya no sufre los efectos de Otra Vez!`);
  e.Encore = 0;
  e.EncoreMove = null;
  if (e.Torment) battle.pbDisplay(`¡Tormento ya no surte efecto en ${b.pbThis(true)}!`);
  e.Torment = false;
  if (e.Disable > 0) battle.pbDisplay(`¡El movimiento de ${b.pbThis(true)} ya no está anulado!`);
  e.Disable = 0;
  if (e.HealBlock > 0) battle.pbDisplay(`¡Se han pasado los efectos de Anticura en ${b.pbThis(true)}!`);
  e.HealBlock = 0;
  return true;
});

// ---------------------------------------------------------------- Prioridad
I.PriorityBracketChange.add('CUSTAPBERRY', (i, b) => (b.canConsumePinchBerry() ? 1 : undefined));
I.PriorityBracketChange.add('LAGGINGTAIL', () => -1);
I.PriorityBracketChange.copy('LAGGINGTAIL', 'FULLINCENSE');
I.PriorityBracketChange.add('QUICKCLAW', (i, b, battle) => {
  if (b.hasActiveAbility('MYCELIUMMIGHT')) {
    const pri = AbilityEffects.triggerPriorityBracketChange(b.ability, b, battle);
    if (pri !== 0) return pri;
  }
  return battle.pbRandom(100) < 20 ? 1 : undefined;
});
I.PriorityBracketUse.add('CUSTAPBERRY', (i, b, battle) => {
  battle.pbCommonAnimation('EatBerry', b);
  battle.pbDisplay(`¡${b.pbThis()} se mueve primero gracias a ${b.itemName()}!`);
  b.pbConsumeItem();
});
I.PriorityBracketUse.add('QUICKCLAW', (i, b, battle) => {
  battle.pbCommonAnimation('UseItem', b);
  battle.pbDisplay(`¡${b.pbThis()} se mueve primero gracias a ${b.itemName()}!`);
});

// ---------------------------------------------------------------- Fallo y precisión
I.OnMissingTarget.add('BLUNDERPOLICY', (item, user, target, move, hitNum, battle) => {
  if (hitNum > 0 || target.damageState.invulnerable || OHKO_CODES.includes(move.functionCode)) return;
  if (!user.pbCanRaiseStatStage('SPEED', user)) return;
  battle.pbCommonAnimation('UseItem', user);
  user.pbRaiseStatStageByCause('SPEED', 2, user, user.itemName());
  battle.pbDisplay(`${user.itemName()} ha desaparecido al haber cumplido su función.`);
  user.pbHeldItemTriggered(item);
});
I.AccuracyCalcFromUser.add('WIDELENS', (i, mods) => { mods.accuracy_multiplier *= 1.1; });
I.AccuracyCalcFromUser.add('ZOOMLENS', (i, mods, user, target) => {
  const act = target.battle.choices[target.index].action;
  if ((act !== 'UseMove' && act !== 'Shift') || target.movedThisRound()) mods.accuracy_multiplier *= 1.2;
});
I.AccuracyCalcFromTarget.add('BRIGHTPOWDER', (i, mods) => { mods.accuracy_multiplier *= 0.9; });
I.AccuracyCalcFromTarget.copy('BRIGHTPOWDER', 'LAXINCENSE');

// ---------------------------------------------------------------- DamageCalcFromUser
const U = I.DamageCalcFromUser;
/** Objetos que potencian un tipo: [objeto, tipo, multiplicador]. Las Tablas son ×1.25 en Añil. */
const TYPE_BOOSTERS = [
  ['BLACKBELT', 'FIGHTING', 1.2], ['FISTPLATE', 'FIGHTING', 1.25], ['BLACKGLASSES', 'DARK', 1.2], ['DREADPLATE', 'DARK', 1.25],
  ['CHARCOAL', 'FIRE', 1.2], ['FLAMEPLATE', 'FIRE', 1.25], ['DRAGONFANG', 'DRAGON', 1.2], ['DRACOPLATE', 'DRAGON', 1.25],
  ['HARDSTONE', 'ROCK', 1.2], ['ROCKINCENSE', 'ROCK', 1.2], ['STONEPLATE', 'ROCK', 1.25], ['MAGNET', 'ELECTRIC', 1.2],
  ['ZAPPLATE', 'ELECTRIC', 1.25], ['METALCOAT', 'STEEL', 1.2], ['IRONPLATE', 'STEEL', 1.25], ['MIRACLESEED', 'GRASS', 1.2],
  ['ROSEINCENSE', 'GRASS', 1.2], ['MEADOWPLATE', 'GRASS', 1.25], ['MYSTICWATER', 'WATER', 1.2], ['SEAINCENSE', 'WATER', 1.2],
  ['WAVEINCENSE', 'WATER', 1.2], ['SPLASHPLATE', 'WATER', 1.25], ['NEVERMELTICE', 'ICE', 1.2], ['ICICLEPLATE', 'ICE', 1.25],
  ['FAIRYFEATHER', 'FAIRY', 1.2], ['PIXIEPLATE', 'FAIRY', 1.25], ['POISONBARB', 'POISON', 1.2], ['TOXICPLATE', 'POISON', 1.25],
  ['SHARPBEAK', 'FLYING', 1.2], ['SKYPLATE', 'FLYING', 1.25], ['SILKSCARF', 'NORMAL', 1.2], ['BLANKPLATE', 'NORMAL', 1.25],
  ['SILVERPOWDER', 'BUG', 1.2], ['INSECTPLATE', 'BUG', 1.25], ['SOFTSAND', 'GROUND', 1.2], ['EARTHPLATE', 'GROUND', 1.25],
  ['SPELLTAG', 'GHOST', 1.2], ['SPOOKYPLATE', 'GHOST', 1.25], ['TWISTEDSPOON', 'PSYCHIC', 1.2], ['ODDINCENSE', 'PSYCHIC', 1.2],
  ['MINDPLATE', 'PSYCHIC', 1.25],
];
for (const [item, boostType, factor] of TYPE_BOOSTERS) {
  U.add(item, (i, user, target, move, mults, power, type) => { if (type === boostType) mults.power_multiplier *= factor; });
}
for (const t of ['BUG', 'DARK', 'DRAGON', 'ELECTRIC', 'FAIRY', 'FIGHTING', 'FIRE', 'FLYING', 'GHOST', 'GRASS', 'GROUND', 'ICE',
  'NORMAL', 'POISON', 'PSYCHIC', 'ROCK', 'STEEL', 'WATER']) {
  U.add(`${t}GEM`, (i, user, target, move, mults, power, type) => user.pbMoveTypePoweringUpGem(t, move, type, mults));
}
const orb = (species, types) => (i, user, target, move, mults, power, type) => {
  if (user.isSpecies(species) && types.includes(type)) mults.power_multiplier *= 1.2;
};
U.add('ADAMANTORB', orb('DIALGA', ['DRAGON', 'STEEL']));
U.add('GRISEOUSORB', orb('GIRATINA', ['DRAGON', 'GHOST']));
U.add('LUSTROUSORB', orb('PALKIA', ['DRAGON', 'WATER']));
U.add('CHOICEBAND', (i, u, t, move, mults) => { if (move.physicalMove()) mults.power_multiplier *= 1.5; });
U.add('CHOICESPECS', (i, u, t, move, mults) => { if (move.specialMove()) mults.power_multiplier *= 1.5; });
U.add('DEEPSEATOOTH', (i, user, t, move, mults) => { if (user.isSpecies('CLAMPERL') && move.specialMove()) mults.attack_multiplier *= 2; });
U.add('EXPERTBELT', (i, u, target, m, mults) => { if (Effectiveness.superEffective(target.damageState.typeMod)) mults.final_damage_multiplier *= 1.2; });
U.add('LIFEORB', (i, u, t, move, mults) => { if (!move.isConfusion) mults.final_damage_multiplier *= 1.3; });
U.add('LIGHTBALL', (i, user, t, m, mults) => {
  if (user.isSpecies('PIKACHU')) mults.attack_multiplier *= 2;
  if (user.isSpecies('RAICHU')) mults.attack_multiplier *= 1.5; // Añil
});
U.add('METRONOME', (i, user, t, m, mults) => { mults.final_damage_multiplier *= 1 + 0.2 * Math.min(user.effects.Metronome, 5); });
U.add('MUSCLEBAND', (i, u, t, move, mults) => { if (move.physicalMove()) mults.power_multiplier *= 1.1; });
U.add('WISEGLASSES', (i, u, t, move, mults) => { if (move.specialMove()) mults.power_multiplier *= 1.1; });
U.add('PUNCHINGGLOVE', (i, u, t, move, mults) => { if (move.punchingMove()) mults.power_multiplier *= 1.1; });
U.add('SOULDEW', (i, user, t, m, mults, power, type) => {
  if (!user.isSpecies('LATIAS') && !user.isSpecies('LATIOS')) return;
  if (['DRAGON', 'PSYCHIC'].includes(type)) mults.final_damage_multiplier *= 1.2;
});
U.add('THICKCLUB', (i, user, t, move, mults) => {
  if ((user.isSpecies('CUBONE') || user.isSpecies('MAROWAK')) && move.physicalMove()) mults.attack_multiplier *= 2;
});
U.add('WELLSPRINGMASK', (i, user, t, m, mults) => { if (user.isSpecies('OGERPON')) mults.final_damage_multiplier *= 1.2; });
U.copy('WELLSPRINGMASK', 'HEARTHFLAMEMASK', 'CORNERSTONEMASK');
// Añil: Supermineral Evolutivo también potencia el ataque.
U.add('SUPEREVIOLITE', (i, user, t, m, mults) => { if (evolutionCount(user) > 1) mults.attack_multiplier *= 1.5; });

export { evolutionCount };
