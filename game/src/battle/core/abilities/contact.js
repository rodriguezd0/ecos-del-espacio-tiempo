// Habilidades al recibir o asestar golpes y al terminar de usar un movimiento
// (034_Other battle code/009_Battle_AbilityEffects, tercera parte).
import { AbilityEffects as A } from './registry.js';
import { STAT_STAGE_MAXIMUM, STAT_NAMES, MAIN_BATTLE_STATS } from '../constants.js';

const splash = (battle, b, fn) => {
  battle.pbShowAbilitySplash(b);
  fn();
  battle.pbHideAbilitySplash(b);
};
const contact = (move, user) => move.pbContactMove(user);
const faintedCount = (targets) => targets.filter((b) => b.damageState.fainted).length;

// ---------------------------------------------------------------- OnBeingHit
const H = A.OnBeingHit;

H.add('AFTERMATH', (a, user, target, move, battle) => {
  if (!target.isFainted() || !contact(move, user)) return;
  battle.pbShowAbilitySplash(target);
  if (!battle.moldBreaker) {
    const damp = battle.pbCheckGlobalAbility('DAMP');
    if (damp) {
      splash(battle, damp, () => battle.pbDisplay(`¡${target.pbThis()} no puede usar la habilidad ${target.abilityName()}!`));
      battle.pbHideAbilitySplash(target);
      return;
    }
  }
  if (user.takesIndirectDamage(true) && user.affectedByContactEffect(true)) {
    user.pbReduceHP(Math.floor(user.totalhp / 4), false);
    battle.pbDisplay(`¡${user.pbThis()} fue atrapado en las consecuencias!`);
  }
  battle.pbHideAbilitySplash(target);
});

H.add('ANGERPOINT', (a, user, target, move, battle) => {
  if (!target.damageState.critical || !target.pbCanRaiseStatStage('ATTACK', target)) return;
  splash(battle, target, () => {
    target.stages.ATTACK = STAT_STAGE_MAXIMUM;
    target.statsRaisedThisRound = true;
    battle.pbCommonAnimation('StatUp', target);
    battle.queueEvent('animateStat', target.view(), 'ATTACK', STAT_STAGE_MAXIMUM);
    battle.pbDisplay(`¡${target.pbThis()} subió al máximo su ${STAT_NAMES.ATTACK}!`);
  });
});

H.add('COTTONDOWN', (a, user, target, move, battle) => {
  if (!battle.allBattlers().some((b) => b.index !== target.index && b.pbCanLowerStatStage('SPEED', target))) return;
  splash(battle, target, () => {
    for (const b of battle.allBattlers()) if (b.index !== target.index) b.pbLowerStatStageByAbility('SPEED', 1, target, false);
  });
});

H.add('CURSEDBODY', (a, user, target, move, battle) => {
  if (user.isFainted() || user.effects.Disable > 0) return;
  const regular = user.moves.find((m) => m.id === user.lastRegularMoveUsed);
  if (!regular || (regular.pp === 0 && regular.totalPP > 0)) return;
  if (battle.pbRandom(100) >= 30) return;
  battle.pbShowAbilitySplash(target);
  if (!move.pbMoveFailedAromaVeil(target, user, true)) {
    user.effects.Disable = 3;
    user.effects.DisableMove = regular.id;
    battle.pbDisplay(`¡${regular.name} de ${user.pbThis(true)} fue anulado!`);
    battle.pbHideAbilitySplash(target);
    user.pbItemStatusCureCheck();
  }
  battle.pbHideAbilitySplash(target);
});

H.add('CUTECHARM', (a, user, target, move, battle) => {
  if (target.isFainted() || !contact(move, user) || battle.pbRandom(100) >= 30) return;
  splash(battle, target, () => {
    if (user.pbCanAttract(target, true) && user.affectedByContactEffect(true)) user.pbAttract(target);
  });
});

H.add('EFFECTSPORE', (a, user, target, move, battle) => {
  if (!contact(move, user) || battle.pbRandom(100) >= 30) return;
  const r = battle.pbRandom(3);
  if ((r === 0 && user.asleep()) || (r === 1 && user.poisoned()) || (r === 2 && user.paralyzed())) return;
  splash(battle, target, () => {
    if (!user.affectedByPowder(true) || !user.affectedByContactEffect(true)) return;
    if (r === 0 && user.pbCanSleep(target, true)) user.pbSleep();
    else if (r === 1 && user.pbCanPoison(target, true)) user.pbPoison(target);
    else if (r === 2 && user.pbCanParalyze(target, true)) user.pbParalyze(target);
  });
});

const chargeOnHit = (cond) => (a, user, target, move, battle) => {
  if (!cond(target, move) || target.effects.Charge > 0) return;
  splash(battle, target, () => {
    target.effects.Charge = 2;
    battle.pbDisplay(`¡Ser golpeado por ${move.name} cargó de energía a ${target.pbThis(true)}!`);
  });
};
H.add('ELECTROMORPHOSIS', chargeOnHit((t) => !t.isFainted()));
H.add('WINDPOWER', chargeOnHit((t, m) => m.windMove()));

/** 30 % de estado al contacto (Cuerpo Llama, Punto Tóxico, Elec. Estática). */
const contactStatus = (has, can, inflict) => (a, user, target, move, battle) => {
  if (!contact(move, user) || has(user) || battle.pbRandom(100) >= 30) return;
  splash(battle, target, () => {
    if (can(user, target) && user.affectedByContactEffect(true)) inflict(user, target);
  });
};
H.add('FLAMEBODY', contactStatus((u) => u.burned(), (u, t) => u.pbCanBurn(t, true), (u, t) => u.pbBurn(t)));
H.add('POISONPOINT', contactStatus((u) => u.poisoned(), (u, t) => u.pbCanPoison(t, true), (u, t) => u.pbPoison(t)));
H.add('STATIC', contactStatus((u) => u.paralyzed(), (u, t) => u.pbCanParalyze(t, true), (u, t) => u.pbParalyze(t)));

H.add('GOOEY', (a, user, target, move) => {
  if (contact(move, user)) user.pbLowerStatStageByAbility('SPEED', 1, target, true, true);
});
H.copy('GOOEY', 'TANGLINGHAIR');

H.add('ILLUSION', (a, user, target, move, battle) => {
  if (!target.effects.Illusion) return;
  battle.pbCommonAnimation('Illusion', target);
  target.effects.Illusion = null;
  battle.queueEvent('changeForm', target.view());
  battle.pbDisplay(`¡La ilusión de ${target.pbThis(true)} se ha desvanecido!`);
  battle.pbSetSeen(target);
  battle.queueRefresh(target);
});

H.add('INNARDSOUT', (a, user, target, move, battle) => {
  if (!target.isFainted() || user.dummy) return;
  splash(battle, target, () => {
    if (!user.takesIndirectDamage(true)) return;
    user.pbReduceHP(target.damageState.hpLost, false);
    battle.pbDisplay(`¡${user.pbThis()} sufrió daño!`);
  });
});

H.add('IRONBARBS', (a, user, target, move, battle) => {
  if (!contact(move, user)) return;
  splash(battle, target, () => {
    if (!user.takesIndirectDamage(true) || !user.affectedByContactEffect(true)) return;
    user.pbReduceHP(Math.floor(user.totalhp / 8), false);
    battle.pbDisplay(`¡${user.pbThis()} sufrió daño!`);
  });
});
H.copy('IRONBARBS', 'ROUGHSKIN');

const raiseOnType = (types, stat, n) => (a, user, target, move) => {
  if (types.includes(move.calcType)) target.pbRaiseStatStageByAbility(stat, n, target);
};
H.add('JUSTIFIED', raiseOnType(['DARK'], 'ATTACK', 1));
H.add('RATTLED', raiseOnType(['BUG', 'DARK', 'GHOST'], 'SPEED', 1));
H.add('THERMALEXCHANGE', raiseOnType(['FIRE'], 'ATTACK', 1));
H.add('WATERCOMPACTION', raiseOnType(['WATER'], 'DEFENSE', 2));
H.add('STAMINA', (a, user, target) => { target.pbRaiseStatStageByAbility('DEFENSE', 1, target); });

H.add('MUMMY', (a, user, target, move, battle) => {
  if (!contact(move, user) || user.isFainted()) return;
  if (user.unstoppableAbility() || user.ability === a || ['MUMMY', 'LINGERINGAROMA'].includes(user.ability)) return;
  let oldAbil = null;
  const foes = user.opposes(target);
  if (foes) battle.pbShowAbilitySplash(target);
  if (user.affectedByContactEffect(true)) {
    oldAbil = user.ability;
    if (foes) battle.pbShowAbilitySplash(user, true);
    user.ability = a;
    if (foes) battle.pbReplaceAbilitySplash(user);
    battle.pbDisplay(a === 'LINGERINGAROMA' ? `¡Un olor persistente se aferra a ${user.pbThis(true)}!`
      : `¡La habilidad de ${user.pbThis(true)} se convirtió en ${user.abilityName()}!`);
    if (foes) battle.pbHideAbilitySplash(user);
  }
  if (foes) battle.pbHideAbilitySplash(target);
  user.pbOnLosingAbility(oldAbil);
  user.pbTriggerAbilityOnGainingIt();
});
H.copy('MUMMY', 'LINGERINGAROMA');

H.add('PERISHBODY', (a, user, target, move, battle) => {
  if (!contact(move, user) || user.isFainted()) return;
  if (user.effects.PerishSong > 0 || target.effects.PerishSong > 0) return;
  splash(battle, target, () => {
    if (!user.affectedByContactEffect(true)) return;
    user.effects.PerishSong = 4;
    user.effects.PerishSongUser = target.index;
    target.effects.PerishSong = 4;
    target.effects.PerishSongUser = target.index;
    battle.pbDisplay('¡Ambos Pokémon se debilitarán en tres turnos!');
  });
});

H.add('SANDSPIT', (a, user, target, move, battle) => { battle.pbStartWeatherAbility('Sandstorm', target); });
H.add('SEEDSOWER', (a, user, target, move, battle) => {
  if (!move.damagingMove() || battle.field.terrain === 'Grassy') return;
  battle.pbShowAbilitySplash(target);
  battle.pbStartTerrain(target, 'Grassy');
});

H.add('TOXICDEBRIS', (a, user, target, move, battle) => {
  if (!move.physicalMove() || target.damageState.substitute) return;
  const side = target.pbOpposingSide().effects;
  if (side.ToxicSpikes >= 2) return;
  splash(battle, target, () => {
    side.ToxicSpikes += 1;
    battle.pbAnimation('TOXICSPIKES', target, target.pbDirectOpposing());
    battle.pbDisplay(`¡Unas púas tóxicas se esparcieron alrededor de ${target.pbOpposingTeam(true)}!`);
  });
});

H.add('WANDERINGSPIRIT', (a, user, target, move, battle) => {
  if (!contact(move, user)) return;
  if (user.ungainableAbility() || ['RECEIVER', 'WONDERGUARD'].includes(user.ability) || user.uncopyableAbility()) return;
  if (user.hasActiveItem('ABILITYSHIELD') || target.hasActiveItem('ABILITYSHIELD')) return;
  let oldUserAbil = null;
  let oldTargetAbil = null;
  const foes = user.opposes(target);
  if (foes) battle.pbShowAbilitySplash(target);
  if (user.affectedByContactEffect(true)) {
    if (foes) battle.pbShowAbilitySplash(user, true);
    oldUserAbil = user.ability;
    oldTargetAbil = target.ability;
    user.ability = oldTargetAbil;
    target.ability = oldUserAbil;
    if (foes) {
      battle.pbReplaceAbilitySplash(user);
      battle.pbReplaceAbilitySplash(target);
    }
    battle.pbDisplay(`¡${target.pbThis()} ha intercambiado habilidades con ${user.pbThis(true)}!`);
    if (foes) {
      battle.pbHideAbilitySplash(user);
      battle.pbHideAbilitySplash(target);
    }
  }
  if (foes) battle.pbHideAbilitySplash(target);
  user.pbOnLosingAbility(oldUserAbil);
  target.pbOnLosingAbility(oldTargetAbil);
  user.pbTriggerAbilityOnGainingIt();
  target.pbTriggerAbilityOnGainingIt();
});

H.add('WEAKARMOR', (a, user, target, move, battle) => {
  if (!move.physicalMove()) return;
  if (!target.pbCanLowerStatStage('DEFENSE', target) && !target.pbCanRaiseStatStage('SPEED', target)) return;
  splash(battle, target, () => {
    target.pbLowerStatStageByAbility('DEFENSE', 1, target, false);
    target.pbRaiseStatStageByAbility('SPEED', 2, target, false);
  });
});

// ---------------------------------------------------------------- OnDealingHit
const touchStatus = (needsContact, can, inflict) => (a, user, target, move, battle) => {
  if (needsContact && !move.contactMove()) return;
  if (battle.pbRandom(100) >= 30 || target.hasActiveItem('COVERTCLOAK')) return;
  splash(battle, user, () => {
    if (target.hasActiveAbility('SHIELDDUST') && !battle.moldBreaker) {
      splash(battle, target, () => {});
    } else if (can(target, user)) {
      inflict(target, user);
    }
  });
};
A.OnDealingHit.add('POISONTOUCH', touchStatus(true, (t, u) => t.pbCanPoison(u, true), (t, u) => t.pbPoison(u)));
A.OnDealingHit.add('BURNTOUCH', touchStatus(true, (t, u) => t.pbCanBurn(u, true), (t, u) => t.pbBurn(u)));
A.OnDealingHit.add('TOXICCHAIN', touchStatus(false, (t, u) => t.pbCanPoison(u, true), (t, u) => t.pbPoison(u, null, true)));

// ---------------------------------------------------------------- OnEndOfUsingMove
const E = A.OnEndOfUsingMove;

// Añil: Salida de Emergencia saca al usuario tras usar un movimiento de tipo Bicho (como Ida y Vuelta).
E.add('EMERGENCYEXIT', async (a, user, targets, move, battle, switched) => {
  if (move.calcType !== 'BUG') return undefined;
  if (battle.wildBattle() && user.opposes()) {
    if (!battle.pbCanRun(user.index)) return false;
    battle.pbShowAbilitySplash(user, true);
    battle.pbHideAbilitySplash(user);
    battle.pbDisplay(`¡${user.pbThis()} ha huido!`);
    battle.decision = 3;
    return true;
  }
  if (battle.pbAllFainted(user.idxOpposingSide())) return false;
  if (!battle.pbCanSwitchOut(user.index) || !battle.pbCanChooseNonActive(user.index)) return false;
  battle.pbShowAbilitySplash(user, true);
  battle.pbHideAbilitySplash(user);
  battle.pbDisplay(`¡${user.pbThis()} regresó con ${battle.pbGetOwnerName(user.index)}!`);
  await battle.pbPursuit(user.index);
  if (user.isFainted()) return false;
  if (battle.endOfRound) {
    battle.pbRecallForReplacement(user.index);
    return true;
  }
  const newPkmn = await battle.pbGetReplacementPokemonIndex(user.index);
  if (newPkmn < 0) return false;
  battle.pbRecallAndReplace(user.index, newPkmn);
  battle.pbClearChoice(user.index);
  battle.moldBreaker = false;
  switched.push(user.index);
  await battle.pbOnBattlerEnteringBattle(user.index);
  return true;
});

E.add('BATTLEBOND', (a, user, targets, move, battle) => {
  if (user.isFainted() || battle.pbAllFainted(user.idxOpposingSide())) return;
  if (!user.isSpecies('GRENINJA') || user.effects.Transform) return;
  if (battle.battleBond[user.index & 1][user.pokemonIndex]) return;
  if (faintedCount(targets) === 0) return;
  splash(battle, user, () => {
    battle.battleBond[user.index & 1][user.pokemonIndex] = true;
    battle.pbDisplay(`¡${user.pbThis()} se cargó completamente por el lazo con su entrenador!`);
  });
  let showAnim = true;
  for (const stat of ['ATTACK', 'SPECIAL_ATTACK', 'SPEED']) {
    if (!user.pbCanRaiseStatStage(stat, user)) continue;
    if (user.pbRaiseStatStage(stat, 1, user, showAnim)) showAnim = false;
  }
  if (showAnim) battle.pbDisplay(`¡Las características de ${user.pbThis(true)} no pueden subir más!`);
});

E.add('BEASTBOOST', (a, user, targets, move, battle) => {
  if (battle.pbAllFainted(user.idxOpposingSide())) return;
  const n = faintedCount(targets);
  if (n === 0) return;
  const stats = user.plainStats();
  const highest = Math.max(...Object.values(stats));
  const stat = MAIN_BATTLE_STATS.find((s) => stats[s] >= highest);
  if (stat && user.pbCanRaiseStatStage(stat, user)) user.pbRaiseStatStageByAbility(stat, n, user);
});

/** Relincho Blanco/Negro y Moxie: suben una característica al debilitar. */
const koBoost = (stat, splashAbility = null) => (a, user, targets, move, battle) => {
  if (battle.pbAllFainted(user.idxOpposingSide())) return;
  const n = faintedCount(targets);
  if (n === 0 || !user.pbCanRaiseStatStage(stat, user)) return;
  if (splashAbility) user.ability = splashAbility;
  user.pbRaiseStatStageByAbility(stat, splashAbility ? 1 : n, user);
  if (splashAbility) user.ability = a;
};
E.add('CHILLINGNEIGH', koBoost('ATTACK', 'CHILLINGNEIGH'));
E.copy('CHILLINGNEIGH', 'ASONECHILLINGNEIGH');
E.add('GRIMNEIGH', koBoost('SPECIAL_ATTACK', 'GRIMNEIGH'));
E.copy('GRIMNEIGH', 'ASONEGRIMNEIGH');
E.add('MOXIE', koBoost('ATTACK'));

E.add('MAGICIAN', (a, user, targets, move, battle) => {
  if (battle.futureSight || !move.pbDamagingMove() || user.item || user.wild()) return;
  for (const b of targets) {
    if (b.damageState.unaffected || b.damageState.substitute || !b.item) continue;
    if (b.unlosableItem(b.item) || user.unlosableItem(b.item)) continue;
    battle.pbShowAbilitySplash(user);
    if (b.hasActiveAbility('STICKYHOLD')) {
      if (user.opposes(b)) battle.pbShowAbilitySplash(b);
      battle.pbDisplay(`¡El objeto de ${b.pbThis(true)} no puede ser robado!`);
      if (user.opposes(b)) battle.pbHideAbilitySplash(b);
      battle.pbHideAbilitySplash(user);
      continue;
    }
    user.item = b.item;
    b.item = null;
    if (b.hasActiveAbility('UNBURDEN')) b.effects.Unburden = true;
    if (battle.wildBattle() && !user.initialItem && user.item === b.initialItem) {
      user.setInitialItem(user.item);
      b.setInitialItem(null);
    }
    battle.pbDisplay(`¡${user.pbThis()} robó ${user.itemName()} a ${b.pbThis(true)}!`);
    battle.pbHideAbilitySplash(user);
    user.pbHeldItemTriggerCheck();
    break;
  }
});

// ---------------------------------------------------------------- AfterMoveUseFromTarget
const F = A.AfterMoveUseFromTarget;

F.add('ANGERSHELL', (a, target, user, move, switched, battle) => {
  if (!move.damagingMove() || !target.droppedBelowHalfHP) return;
  splash(battle, target, () => {
    let showAnim = true;
    for (const stat of ['ATTACK', 'SPECIAL_ATTACK', 'SPEED']) {
      if (!target.pbCanRaiseStatStage(stat, user, null, true)) continue;
      if (target.pbRaiseStatStage(stat, 1, user, showAnim)) showAnim = false;
    }
    showAnim = true;
    for (const stat of ['DEFENSE', 'SPECIAL_DEFENSE']) {
      if (!target.pbCanLowerStatStage(stat, user, null, true)) continue;
      if (target.pbLowerStatStage(stat, 1, user, showAnim)) showAnim = false;
    }
  });
});

F.add('BERSERK', (a, target, user, move) => {
  if (!move.damagingMove() || !target.droppedBelowHalfHP) return;
  if (target.pbCanRaiseStatStage('SPECIAL_ATTACK', target)) target.pbRaiseStatStageByAbility('SPECIAL_ATTACK', 1, target);
});

F.add('COLORCHANGE', (a, target, user, move, switched, battle) => {
  if (target.damageState.calcDamage === 0 || target.damageState.substitute) return;
  const t = move.calcType;
  const typeData = t ? battle.db.types[t] : null;
  if (!typeData || typeData.pseudo) return;
  if (target.pbHasType(t) && !target.pbHasOtherType(t)) return;
  splash(battle, target, () => {
    target.pbChangeTypes(t);
    battle.pbDisplay(`¡El tipo de ${target.pbThis(true)} cambió a ${battle.typeName(t)}!`);
  });
});

F.add('PICKPOCKET', (a, target, user, move, switched, battle) => {
  if (target.wild() || switched.includes(user.index) || !move.contactMove()) return;
  if (user.effects.Substitute > 0 || target.damageState.substitute) return;
  if (target.item || !user.item || user.unlosableItem(user.item) || target.unlosableItem(user.item)) return;
  battle.pbShowAbilitySplash(target);
  if (user.hasActiveAbility('STICKYHOLD')) {
    if (target.opposes(user)) battle.pbShowAbilitySplash(user);
    battle.pbDisplay(`¡El objeto de ${user.pbThis(true)} no puede ser robado!`);
    if (target.opposes(user)) battle.pbHideAbilitySplash(user);
    battle.pbHideAbilitySplash(target);
    return;
  }
  target.item = user.item;
  user.item = null;
  if (user.hasActiveAbility('UNBURDEN')) user.effects.Unburden = true;
  if (battle.wildBattle() && !target.initialItem && target.item === user.initialItem) {
    target.setInitialItem(target.item);
    user.setInitialItem(null);
  }
  battle.pbDisplay(`¡${target.pbThis()} robó ${target.itemName()} a ${user.pbThis(true)}!`);
  battle.pbHideAbilitySplash(target);
  target.pbHeldItemTriggerCheck();
});
