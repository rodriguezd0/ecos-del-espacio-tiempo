// Habilidades al entrar en combate (Battle::AbilityEffects::OnSwitchIn de Añil).
import { AbilityEffects as A } from './registry.js';
import {
  BATTLE_STATS, STAT_NAMES, STAT_STAGE_MAXIMUM, STAT_STAGE_MULTIPLIERS, STAT_STAGE_DIVISORS, OHKO_CODES, TERRAIN_END_MESSAGES,
} from '../constants.js';
import { Effectiveness, calculateEffectiveness } from '../typeChart.js';
import { hiddenPowerType } from '../pokemonUtil.js';
import { ItemEffects } from '../items/registry.js';

const S = A.OnSwitchIn;
const splash = (battle, b, fn) => {
  battle.pbShowAbilitySplash(b);
  fn();
  battle.pbHideAbilitySplash(b);
};
const announce = (text) => (a, battler, battle) => splash(battle, battler, () => battle.pbDisplay(text(battler)));

S.add('AIRLOCK', announce(() => 'El tiempo atmosférico ya no ejerce ninguna influencia.'));
S.copy('AIRLOCK', 'CLOUDNINE');
S.add('AURABREAK', announce((b) => `¡${b.pbThis()} ha invertido todas las auras!`));
S.add('COMATOSE', announce((b) => `¡${b.pbThis()} está sumido en un profundo letargo!`));
S.add('DARKAURA', announce((b) => `¡${b.pbThis()} irradia un aura oscura!`));
S.add('FAIRYAURA', announce((b) => `¡${b.pbThis()} irradia un aura feérica!`));
S.add('MOLDBREAKER', announce((b) => `¡${b.pbThis()} rompe el molde!`));
S.add('PRESSURE', announce((b) => `¡${b.pbThis()} ejerce presión!`));
S.add('TERAVOLT', announce((b) => `¡${b.pbThis()} desprende un aura chisporroteante!`));
S.add('TURBOBLAZE', announce((b) => `¡${b.pbThis()} desprende un aura llameante!`));
S.add('UNNERVE', announce((b) => `¡${b.pbOpposingTeam()} está muy nervioso y no puede comer bayas!`));
S.add('ACOMETIDA', announce((b) => `¡${b.pbThis()} entra a combatir con furia desmedida!`)); // Añil

S.add('ANTICIPATION', (a, battler, battle) => {
  if (!battler.pbOwnedByPlayer()) return;
  const types = battler.pbTypes(true);
  const found = battle.allOtherSideBattlers(battler.index).some((b) => b.moves.some((m) => {
    if (m.statusMove()) return false;
    if (OHKO_CODES.includes(m.functionCode)) return true;
    let moveType = m.type;
    if (m.functionCode === 'TypeDependsOnUserIVs' && b.pokemon) moveType = hiddenPowerType(battle.db, b.pokemon);
    const eff = calculateEffectiveness(battle.db.types, moveType, ...types);
    return !Effectiveness.ineffective(eff) && Effectiveness.superEffective(eff);
  }));
  if (found) splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbThis()} se ha estremecido!`));
});

S.add('ASONECHILLINGNEIGH', (a, battler, battle) => {
  splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbThis()} tiene dos habilidades!`));
  battler.ability = 'UNNERVE';
  splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbOpposingTeam()} está muy nervioso y no puede comer bayas!`));
  battler.ability = a;
});
S.copy('ASONECHILLINGNEIGH', 'ASONEGRIMNEIGH');

S.add('COMMANDER', (a, battler, battle) => {
  if (battler.effects.Commander) return;
  let showAnim = true;
  for (const b of battler.allAllies()) {
    if (!b.near(battler) || b.isFainted() || !b.isSpecies('DONDOZO') || b.effects.Commander) continue;
    battle.pbShowAbilitySplash(battler);
    battle.pbClearChoice(battler.index);
    battle.pbDisplay(`¡${battler.pbThis()} entra en la boca de ${b.pbThis(true)}!`);
    battle.queueEvent('commander', battler.view(), b.view());
    b.effects.Commander = [battler.index, battler.form];
    battler.effects.Commander = [b.index];
    for (const stat of ['ATTACK', 'DEFENSE', 'SPECIAL_ATTACK', 'SPECIAL_DEFENSE', 'SPEED']) {
      if (!b.pbCanRaiseStatStage(stat, b)) continue;
      if (b.pbRaiseStatStage(stat, 2, b, showAnim)) showAnim = false;
    }
    battle.pbHideAbilitySplash(battler);
    break;
  }
});

S.add('COSTAR', (a, battler, battle) => {
  const b = battler.allAllies().find((x) => x.hasAlteredStatStages() || x.effects.FocusEnergy > 0);
  if (!b) return;
  splash(battle, battler, () => {
    battler.effects.FocusEnergy = b.effects.FocusEnergy;
    for (const s of BATTLE_STATS) battler.stages[s] = b.stages[s];
    battle.pbDisplay(`¡${battler.pbThis()} copió los cambios de características de ${b.pbThis(true)}!`);
  });
});

S.add('CURIOUSMEDICINE', (a, battler, battle) => {
  if (!battler.allAllies().some((b) => b.hasAlteredStatStages())) return;
  splash(battle, battler, () => {
    for (const b of battler.allAllies()) {
      if (!b.hasAlteredStatStages()) continue;
      b.pbResetStatStages();
      battle.pbDisplay(`¡Los cambios en las características de ${b.pbThis(true)} han sido restaurados!`);
    }
  });
});

const oncePerBattleBoost = (stat) => (a, battler, battle) => {
  if (battler.abilityTriggered()) return;
  battler.pbRaiseStatStageByAbility(stat, 1, battler);
  battle.pbSetAbilityTrigger(battler);
};
S.add('DAUNTLESSSHIELD', oncePerBattleBoost('DEFENSE'));
S.add('INTREPIDSWORD', oncePerBattleBoost('ATTACK'));

S.add('DELTASTREAM', (a, b, battle) => battle.pbStartWeatherAbility('StrongWinds', b, true));
S.add('DESOLATELAND', (a, b, battle) => battle.pbStartWeatherAbility('HarshSun', b, true));
S.add('PRIMORDIALSEA', (a, b, battle) => battle.pbStartWeatherAbility('HeavyRain', b, true));
S.add('DRIZZLE', (a, b, battle) => battle.pbStartWeatherAbility('Rain', b));
S.add('DROUGHT', (a, b, battle) => battle.pbStartWeatherAbility('Sun', b));
S.add('SANDSTREAM', (a, b, battle) => battle.pbStartWeatherAbility('Sandstorm', b));
S.add('SNOWWARNING', (a, b, battle) => battle.pbStartWeatherAbility('Hail', b));

const surge = (terrain) => (a, battler, battle) => {
  if (battle.field.terrain === terrain) return;
  battle.pbShowAbilitySplash(battler);
  battle.pbStartTerrain(battler, terrain); // pbStartTerrain oculta el splash
};
S.add('ELECTRICSURGE', surge('Electric'));
S.add('GRASSYSURGE', surge('Grassy'));
S.add('MISTYSURGE', surge('Misty'));
S.add('PSYCHICSURGE', surge('Psychic'));

S.add('DOWNLOAD', (a, battler, battle) => {
  let oDef = 0;
  let oSpDef = 0;
  for (const b of battle.allOtherSideBattlers(battler.index)) {
    oDef += b.defense;
    oSpDef += b.spdef;
  }
  battler.pbRaiseStatStageByAbility(oDef < oSpDef ? 'ATTACK' : 'SPECIAL_ATTACK', 1, battler);
});

const embody = (stat) => (a, battler, battle) => {
  if (!battler.isSpecies('OGERPON') || battler.effects.OneUseAbility === a) return;
  battle.pbDisplay(`¡La máscara de ${battler.pbThis(true)} brilló con fuerza!`);
  battler.pbRaiseStatStageByAbility(stat, 1, battler);
  battler.effects.OneUseAbility = a;
};
S.add('EMBODYASPECT', embody('SPEED'));
S.add('EMBODYASPECT_1', embody('SPECIAL_DEFENSE'));
S.add('EMBODYASPECT_2', embody('ATTACK'));
S.add('EMBODYASPECT_3', embody('DEFENSE'));

const FOREWARN_POWER = {
  // Essentials asigna 150 a PowerHigherWithUserHP y después 80 al mismo código: prevalece 80.
  OHKO: 160, OHKOIce: 160, OHKOHitsUndergroundTarget: 160, PowerHigherWithUserHP: 80, CounterPhysicalDamage: 120,
  CounterSpecialDamage: 120, CounterDamagePlusHalf: 120, FixedDamage20: 80, FixedDamage40: 80, FixedDamageUserLevel: 80,
  LowerTargetHPToUserHP: 80, FixedDamageUserLevelRandom: 80, PowerHigherWithUserHappiness: 80, PowerLowerWithUserHappiness: 80,
  PowerHigherWithTargetFasterThanUser: 80, TypeAndPowerDependOnUserBerry: 80, PowerHigherWithLessPP: 80,
  PowerLowerWithUserHP: 80, PowerHigherWithTargetWeight: 80,
};
S.add('FOREWARN', (a, battler, battle) => {
  if (!battler.pbOwnedByPlayer()) return;
  let highest = 0;
  let names = [];
  for (const b of battle.allOtherSideBattlers(battler.index)) {
    for (const m of b.moves) {
      const power = FOREWARN_POWER[m.functionCode] ?? m.power;
      if (power < highest) continue;
      if (power > highest) names = [];
      names.push(m.name);
      highest = power;
    }
  }
  if (names.length === 0) return;
  const name = names[battle.pbRandom(names.length)];
  splash(battle, battler, () => battle.pbDisplay(`¡Se ha detectado el movimiento ${name} de ${battler.pbOpposingTeam(true)}!`));
});

S.add('FRISK', (a, battler, battle) => {
  if (!battler.pbOwnedByPlayer()) return;
  const foes = battle.allOtherSideBattlers(battler.index).filter((b) => b.item);
  if (foes.length === 0) return;
  splash(battle, battler, () => {
    for (const b of foes) battle.pbDisplay(`¡${battler.pbThis()} ha cacheado a ${b.pbThis(true)} y ha hallado ${b.itemName()}!`);
  });
});

S.add('HADRONENGINE', (a, battler, battle) => {
  battle.pbShowAbilitySplash(battler);
  if (battle.field.terrain === 'Electric') {
    battle.pbDisplay(`¡${battler.pbThis()} usó el Campo Eléctrico para energizar su motor futurista!`);
    battle.pbHideAbilitySplash(battler);
  } else {
    battle.pbStartTerrain(battler, 'Electric');
    battle.pbDisplay(`¡${battler.pbThis()} electrificó el terreno para energizar su motor futurista!`);
  }
});

S.add('ORICHALCUMPULSE', (a, battler, battle) => {
  if (['Sun', 'HarshSun'].includes(battler.effectiveWeather())) {
    splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbThis()} absorbió la luz solar e incrementó su ataque!`));
  } else {
    battle.pbStartWeatherAbility('Sun', battler);
    battle.pbDisplay(`¡${battler.pbThis()} invocó el sol e incrementó su ataque!`);
  }
});

S.add('HOSPITALITY', (a, battler, battle) => {
  if (!battler.allAllies().some((b) => b.hp < b.totalhp)) return;
  splash(battle, battler, () => {
    for (const b of battler.allAllies()) {
      if (b.hp === b.totalhp) continue;
      b.pbRecoverHP(Math.floor(b.totalhp / 4));
      battle.pbDisplay(`¡${b.pbThis()} bebió todo el té que ${battler.pbThis(true)} preparó!`);
    }
  });
});

S.add('ICEFACE', (a, battler, battle) => {
  if (!battler.isSpecies('EISCUE') || battler.form !== 1 || battler.effectiveWeather() !== 'Hail') return;
  splash(battle, battler, () => battler.pbChangeForm(0, `¡${battler.pbThis()} se ha transformado!`));
});

S.add('IMPOSTER', (a, battler, battle, switchIn) => {
  if (!switchIn || battler.effects.Transform) return;
  const choice = battler.pbDirectOpposing();
  if (!choice || choice.isFainted()) return;
  if (choice.effects.Transform || choice.effects.Illusion || choice.effects.Substitute > 0 || choice.effects.SkyDrop >= 0 ||
      choice.semiInvulnerable()) return;
  battle.pbShowAbilitySplash(battler, true);
  battle.pbHideAbilitySplash(battler);
  battle.pbAnimation('TRANSFORM', battler, choice);
  battler.pbTransform(choice);
});

/** Intimidación (Ataque) y Espanto (Añil, Ataque Especial). */
const intimidate = (stat, blockers) => (a, battler, battle) => {
  if (battler.effects.OneUseAbility === a) return;
  battle.pbShowAbilitySplash(battler);
  for (const b of battle.allOtherSideBattlers(battler.index)) {
    if (!b.near(battler)) continue;
    let checkItem = true;
    if (b.hasActiveAbility(blockers)) {
      if (b.statStageAtMax(stat)) checkItem = false;
    } else if (b.statStageAtMin(stat)) {
      checkItem = false;
    }
    const checkAbility = b.pbLowerStatStageIntimidate(battler, stat);
    if (checkAbility) b.pbAbilitiesOnIntimidated();
    if (checkItem) b.pbItemOnIntimidatedCheck();
  }
  battle.pbHideAbilitySplash(battler);
  battler.effects.OneUseAbility = a;
};
S.add('INTIMIDATE', intimidate('ATTACK', ['CONTRARY', 'GUARDDOG']));
S.add('ESPANTO', intimidate('SPECIAL_ATTACK', ['CONTRARY']));

// Añil: Iluminación baja la precisión de los rivales al entrar.
S.add('ILLUMINATE', (a, battler, battle) => {
  if (battler.effects.OneUseAbility === a) return;
  splash(battle, battler, () => {
    for (const b of battle.allOtherSideBattlers(battler.index)) {
      if (b.near(battler)) b.pbLowerStatStageByAbility('ACCURACY', 1, battler, false);
    }
  });
  battler.effects.OneUseAbility = a;
});

S.add('MIMICRY', (a, battler, battle) => {
  if (battle.field.terrain !== 'None') A.triggerOnTerrainChange(a, battler, battle, false);
});

S.add('NEUTRALIZINGGAS', (a, battler, battle) => {
  battle.pbShowAbilitySplash(battler, true);
  battle.pbHideAbilitySplash(battler);
  battle.pbDisplay('¡Un gas reactivo se propaga por toda la zona!');
  for (const b of battle.allBattlers()) {
    if (b.hasActiveItem('ABILITYSHIELD')) {
      battle.pbDisplay(`¡La habilidad de ${b.pbThis(true)} está protegida por su ${b.itemName()}!`);
      continue;
    }
    b.effects.SlowStart = 0;
    b.effects.Truant = false;
    if (!b.hasActiveItem(['CHOICEBAND', 'CHOICESPECS', 'CHOICESCARF'])) b.effects.ChoiceBand = null;
    if (b.effects.Illusion) {
      b.effects.Illusion = null;
      if (!b.effects.Transform) {
        battle.queueEvent('changeForm', b.view());
        battle.pbDisplay(`¡La ilusión de ${b.pbThis(true)} se ha desvanecido!`);
        battle.pbSetSeen(b);
      }
    }
  }
  const unnerve = ['UNNERVE', 'ASONECHILLINGNEIGH', 'ASONEGRIMNEIGH'];
  battler.ability = null;
  const hadUnnerve = battle.allBattlers().some((b) => unnerve.includes(b.ability) && b.abilityActive());
  battler.ability = 'NEUTRALIZINGGAS';
  if (hadUnnerve && !battle.allBattlers().some((b) => b.hasActiveAbility(unnerve))) {
    for (const b of battle.allBattlers()) b.pbItemsOnUnnerveEnding();
  }
});

S.add('PASTELVEIL', (a, battler, battle) => {
  if (!battler.allAllies().some((b) => b.status === 'POISON')) return;
  splash(battle, battler, () => {
    for (const b of battler.allAllies()) if (b.status === 'POISON') b.pbCureStatus(true);
  });
});

S.add('PROTOSYNTHESIS', (a, battler, battle) => {
  if (battler.effects.Transform) return;
  const fieldCheck = a === 'PROTOSYNTHESIS' ? ['Sun', 'HarshSun'].includes(battle.field.weather) : battle.field.terrain === 'Electric';
  if (!fieldCheck && !battler.effects.BoosterEnergy && battler.effects.ParadoxStat) {
    battle.pbDisplay(`¡Los efectos de ${battler.abilityName()} de ${battler.pbThis(true)} se disiparon!`);
    battler.effects.ParadoxStat = null;
  }
  if (battler.effects.ParadoxStat) return;
  if (!fieldCheck && battler.item !== 'BOOSTERENERGY') return;
  let highest = null;
  let highestVal = 0;
  for (const [stat, val] of Object.entries(battler.plainStats())) {
    const stage = battler.stages[stat] + STAT_STAGE_MAXIMUM;
    const real = Math.floor((val * STAT_STAGE_MULTIPLIERS[stage]) / STAT_STAGE_DIVISORS[stage]);
    if (real > highestVal) {
      highestVal = real;
      highest = stat;
    }
  }
  if (!highest) return;
  battle.pbShowAbilitySplash(battler);
  if (fieldCheck) {
    const cause = a === 'PROTOSYNTHESIS' ? 'El sol' : 'El Campo Eléctrico';
    battle.pbDisplay(`¡${cause} activó ${battler.abilityName()} de ${battler.pbThis(true)}!`);
  } else {
    battler.effects.BoosterEnergy = true;
    battle.pbDisplay(`¡${battler.pbThis()} usó su ${battler.itemName()} para activar ${battler.abilityName()}!`);
    battler.pbHeldItemTriggered(battler.item);
  }
  battler.effects.ParadoxStat = highest;
  battle.pbDisplay(`¡Ha aumentado ${STAT_NAMES[highest]} de ${battler.pbThis(true)}!`);
  battle.pbHideAbilitySplash(battler);
});
S.copy('PROTOSYNTHESIS', 'QUARKDRIVE');

S.add('SCREENCLEANER', (a, battler, battle) => {
  const own = battler.pbOwnSide().effects;
  const opp = battler.pbOpposingSide().effects;
  const screens = ['AuroraVeil', 'LightScreen', 'Reflect'];
  if (screens.every((s) => own[s] === 0 && opp[s] === 0)) return;
  const names = { AuroraVeil: 'Velo Aurora', LightScreen: 'Pantalla de Luz', Reflect: 'Reflejo' };
  splash(battle, battler, () => {
    for (const [side, team] of [[opp, battler.pbOpposingTeam(true)], [own, battler.pbTeam(true)]]) {
      for (const s of screens) {
        if (side[s] <= 0) continue;
        side[s] = 0;
        battle.pbDisplay(`¡El efecto de ${names[s]} en ${team} se ha disipado!`);
      }
    }
  });
});

S.add('SLOWSTART', (a, battler, battle) => {
  splash(battle, battler, () => {
    battler.effects.SlowStart = 5;
    battle.pbDisplay(`¡${battler.pbThis()} no rinde todo lo que podría!`);
  });
});

S.add('SUPERSWEETSYRUP', (a, battler, battle) => {
  if (battler.abilityTriggered()) return;
  battle.pbShowAbilitySplash(battler);
  battle.pbDisplay(`¡La cubierta de caramelo de ${battler.pbThis(true)} emana un aroma superdulce!`);
  for (const b of battle.allOtherSideBattlers(battler.index)) {
    if (!b.near(battler) || b.isFainted()) continue;
    if (b.itemActive() && !b.hasActiveAbility('CONTRARY') && b.effects.Substitute === 0 &&
        ItemEffects.triggerStatLossImmunity(b.item, b, 'EVASION', battle, true)) continue;
    b.pbLowerStatStageByAbility('EVASION', 1, battler, false);
  }
  battle.pbHideAbilitySplash(battler);
  battle.pbSetAbilityTrigger(battler);
});

S.add('SUPREMEOVERLORD', (a, battler, battle) => {
  const n = Math.min(5, battler.numFaintedAllies());
  if (n <= 0) return;
  splash(battle, battler, () => {
    battle.pbDisplay(`¡${battler.pbThis()} ganó la fuerza de sus aliados caídos!`);
    battler.effects.SupremeOverlord = n;
  });
});

const RUIN_STAT = { TABLETSOFRUIN: 'ATTACK', SWORDOFRUIN: 'DEFENSE', VESSELOFRUIN: 'SPECIAL_ATTACK', BEADSOFRUIN: 'SPECIAL_DEFENSE' };
S.add('TABLETSOFRUIN', (a, battler, battle) => {
  splash(battle, battler, () => battle.pbDisplay(
    `¡${battler.abilityName()} de ${battler.pbThis(true)} redujo ${STAT_NAMES[RUIN_STAT[a]]} de todos los Pokémon a su alrededor!`));
});
S.copy('TABLETSOFRUIN', 'SWORDOFRUIN', 'VESSELOFRUIN', 'BEADSOFRUIN');

const WEATHER_END = {
  Sun: 'El sol vuelve a brillar como siempre.', Rain: 'Ha dejado de llover.', Sandstorm: 'La tormenta de arena ha amainado.',
  Hail: 'Ha dejado de nevar.', HarshSun: 'El sol vuelve a brillar como siempre.', HeavyRain: 'Ha dejado de llover.',
  StrongWinds: '¡Las misteriosas turbulencias han amainado!',
};
S.add('TERAFORMZERO', (a, battler, battle) => {
  if (battler.abilityTriggered()) return;
  battle.pbSetAbilityTrigger(battler);
  const { weather, terrain } = battle.field;
  if (weather === 'None' && terrain === 'None') return;
  let shown = false;
  if (weather !== 'None' && battle.field.defaultWeather === 'None') {
    shown = true;
    battle.pbShowAbilitySplash(battler);
    battle.field.weather = 'None';
    battle.field.weatherDuration = 0;
    battle.pbDisplay(WEATHER_END[weather] || 'El clima volvió a la normalidad.');
    battle.queueEvent('weather', 'None');
  }
  if (terrain !== 'None' && battle.field.defaultTerrain === 'None') {
    if (!shown) battle.pbShowAbilitySplash(battler);
    shown = true;
    battle.field.terrain = 'None';
    battle.field.terrainDuration = 0;
    battle.pbDisplay(TERRAIN_END_MESSAGES[terrain] || 'El terreno de combate volvió a la normalidad.');
    battle.queueEvent('terrain', 'None');
  }
  if (!shown) return;
  battle.pbHideAbilitySplash(battler);
  for (const b of battle.allBattlers()) b.pbCheckFormOnWeatherChange();
  for (const b of battle.allBattlers()) b.pbAbilityOnTerrainChange();
  for (const b of battle.allBattlers()) b.pbItemTerrainStatBoostCheck();
});

S.add('WINDRIDER', (a, battler) => {
  if (battler.pbOwnSide().effects.Tailwind <= 0 || !battler.pbCanRaiseStatStage('ATTACK', battler)) return;
  battler.pbRaiseStatStageByAbility('ATTACK', 1, battler);
});

S.add('ZEROTOHERO', (a, battler, battle) => {
  if (!battler.isSpecies('PALAFIN') || battler.form === 0 || battler.abilityTriggered()) return;
  splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbThis()} sufrió una transformación heroica!`));
  battle.pbSetAbilityTrigger(battler);
});

// Añil: Tintineo cura los problemas de estado de su bando y de su equipo al entrar.
const CURED_IN_PARTY = {
  SLEEP: (n) => `${n} se despertó.`, POISON: (n) => `${n} fue curado del envenenamiento.`,
  BURN: (n) => `La quemadura de ${n} fue curada.`, PARALYSIS: (n) => `${n} fue curado de la parálisis.`,
  FROZEN: (n) => `${n} se descongeló.`, FROSTBITE: (n) => `${n} se descongeló.`,
};
S.add('TINTINEO', (a, battler, battle) => {
  splash(battle, battler, () => battle.pbDisplay(`¡${battler.pbThis()} tintinea como una campana!`));
  for (const b of battle.allSameSideBattlers(battler.index)) if (b.status !== 'NONE') b.pbCureStatus(true);
  battle.pbParty(battler.index).forEach((pkmn, i) => {
    if (!battle.able(pkmn) || !pkmn.status) return;
    if (battle.pbFindBattler(i, battler.index)) return;
    const old = pkmn.status;
    pkmn.status = null;
    pkmn.statusCount = 0;
    if (CURED_IN_PARTY[old]) battle.pbDisplay(CURED_IN_PARTY[old](battle.pokemonName(pkmn)));
  });
});

// Espesura y similares: aviso al entrar con 1/3 o menos de PS (Añil).
S.add('OVERGROW', (a, battler, battle) => {
  if (battler.hp > Math.floor(battler.totalhp / 3)) return;
  const data = battle.db.abilities && battle.db.abilities[a];
  const flag = data && data.flags && data.flags[0];
  const typeName = flag && battle.db.types[flag] ? battle.typeName(flag) : null;
  splash(battle, battler, () => battle.pbDisplay(typeName
    ? `¡${battler.abilityName()} activado! Los ataques de tipo ${typeName} de ${battler.pbThis(true)} ahora son más potentes.`
    : `¡${battler.abilityName()} activado! Los ataques del primer tipo de ${battler.pbThis(true)} ahora son más potentes.`));
});
S.copy('OVERGROW', 'TORRENT', 'BLAZE', 'SWARM', 'SOBRECARGA');
