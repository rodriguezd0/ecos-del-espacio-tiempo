// Manejadores de habilidades por evento (Battle::AbilityEffects de Essentials 21.1).
// Los archivos abilities/*.js añaden manejadores: AbilityEffects.OnSwitchIn.add('INTIMIDATE', fn).
import { makeHandlerSet, orDefault } from '../handlers.js';

const H = makeHandlerSet('AbilityEffects', [
  'SpeedCalc', 'WeightCalc', 'OnHPDroppedBelowHalf', 'StatusCheckNonIgnorable', 'StatusImmunity',
  'StatusImmunityNonIgnorable', 'StatusImmunityFromAlly', 'OnStatusInflicted', 'StatusCure', 'StatLossImmunity',
  'StatLossImmunityNonIgnorable', 'StatLossImmunityFromAlly', 'OnStatGain', 'OnStatLoss', 'PriorityChange',
  'PriorityBracketChange', 'PriorityBracketUse', 'OnFlinch', 'MoveBlocking', 'MoveImmunity', 'ModifyMoveBaseType',
  'AccuracyCalcFromUser', 'AccuracyCalcFromAlly', 'AccuracyCalcFromTarget', 'DamageCalcFromUser',
  'DamageCalcFromAlly', 'DamageCalcFromTarget', 'DamageCalcFromTargetNonIgnorable', 'DamageCalcFromTargetAlly',
  'CriticalCalcFromUser', 'CriticalCalcFromTarget', 'OnBeingHit', 'OnDealingHit', 'OnEndOfUsingMove',
  'AfterMoveUseFromTarget', 'EndOfRoundWeather', 'EndOfRoundHealing', 'EndOfRoundEffect', 'EndOfRoundGainItem',
  'CertainSwitching', 'TrappingByTarget', 'OnSwitchIn', 'OnSwitchOut', 'ChangeOnBattlerFainting',
  'OnBattlerFainting', 'OnTerrainChange', 'OnIntimidated', 'CertainEscapeFromBattle', 'OnTypeChange',
  'OnOpposingStatGain', 'ModifyTypeEffectiveness', 'OnMoveSuccessCheck', 'OnInflictingStatus',
]);

const trig = (hash, id, args, ret = false) => orDefault(hash.trigger(id, ...args), ret);

export const AbilityEffects = {
  ...H,
  triggerSpeedCalc: (a, battler, mult) => trig(H.SpeedCalc, a, [battler, mult], mult),
  triggerWeightCalc: (a, battler, w) => trig(H.WeightCalc, a, [battler, w], w),
  triggerOnHPDroppedBelowHalf: (a, user, moveUser, battle) => trig(H.OnHPDroppedBelowHalf, a, [user, moveUser, battle]),
  triggerStatusCheckNonIgnorable: (a, battler, status) => trig(H.StatusCheckNonIgnorable, a, [battler, status]),
  triggerStatusImmunity: (a, battler, status) => trig(H.StatusImmunity, a, [battler, status]),
  triggerStatusImmunityNonIgnorable: (a, battler, status) => trig(H.StatusImmunityNonIgnorable, a, [battler, status]),
  triggerStatusImmunityFromAlly: (a, battler, status) => trig(H.StatusImmunityFromAlly, a, [battler, status]),
  triggerOnStatusInflicted(a, battler, user, status) {
    if (user && user.abilityActive()) H.OnInflictingStatus.trigger(user.ability, user, battler, status);
    H.OnStatusInflicted.trigger(a, battler, user, status);
  },
  triggerStatusCure: (a, battler) => trig(H.StatusCure, a, [battler]),
  triggerStatLossImmunity: (a, battler, stat, battle, show) => trig(H.StatLossImmunity, a, [battler, stat, battle, show]),
  triggerStatLossImmunityNonIgnorable: (a, battler, stat, battle, show) => trig(H.StatLossImmunityNonIgnorable, a, [battler, stat, battle, show]),
  triggerStatLossImmunityFromAlly: (a, bearer, battler, stat, battle, show) => trig(H.StatLossImmunityFromAlly, a, [bearer, battler, stat, battle, show]),
  triggerOnStatGain: (a, battler, stat, user) => H.OnStatGain.trigger(a, battler, stat, user),
  triggerOnStatLoss: (a, battler, stat, user) => H.OnStatLoss.trigger(a, battler, stat, user),
  triggerPriorityChange: (a, battler, move, pri) => trig(H.PriorityChange, a, [battler, move, pri], pri),
  triggerPriorityBracketChange: (a, battler, battle) => trig(H.PriorityBracketChange, a, [battler, battle], 0),
  triggerPriorityBracketUse: (a, battler, battle) => H.PriorityBracketUse.trigger(a, battler, battle),
  triggerOnFlinch: (a, battler, battle) => H.OnFlinch.trigger(a, battler, battle),
  triggerMoveBlocking: (a, bearer, user, targets, move, battle) => trig(H.MoveBlocking, a, [bearer, user, targets, move, battle]),
  triggerMoveImmunity: (a, user, target, move, type, battle, show) => trig(H.MoveImmunity, a, [user, target, move, type, battle, show]),
  triggerModifyMoveBaseType: (a, user, move, type) => trig(H.ModifyMoveBaseType, a, [user, move, type], type),
  triggerAccuracyCalcFromUser: (a, mods, user, target, move, type) => H.AccuracyCalcFromUser.trigger(a, mods, user, target, move, type),
  triggerAccuracyCalcFromAlly: (a, mods, user, target, move, type) => H.AccuracyCalcFromAlly.trigger(a, mods, user, target, move, type),
  triggerAccuracyCalcFromTarget: (a, mods, user, target, move, type) => H.AccuracyCalcFromTarget.trigger(a, mods, user, target, move, type),
  triggerDamageCalcFromUser: (a, user, target, move, mults, power, type) => H.DamageCalcFromUser.trigger(a, user, target, move, mults, power, type),
  triggerDamageCalcFromAlly: (a, user, target, move, mults, power, type) => H.DamageCalcFromAlly.trigger(a, user, target, move, mults, power, type),
  triggerDamageCalcFromTarget: (a, user, target, move, mults, power, type) => H.DamageCalcFromTarget.trigger(a, user, target, move, mults, power, type),
  triggerDamageCalcFromTargetNonIgnorable: (a, user, target, move, mults, power, type) => H.DamageCalcFromTargetNonIgnorable.trigger(a, user, target, move, mults, power, type),
  triggerDamageCalcFromTargetAlly: (a, user, target, move, mults, power, type) => H.DamageCalcFromTargetAlly.trigger(a, user, target, move, mults, power, type),
  triggerCriticalCalcFromUser: (a, user, target, c) => trig(H.CriticalCalcFromUser, a, [user, target, c], c),
  triggerCriticalCalcFromTarget: (a, user, target, c) => trig(H.CriticalCalcFromTarget, a, [user, target, c], c),
  triggerOnBeingHit: (a, user, target, move, battle) => H.OnBeingHit.trigger(a, user, target, move, battle),
  triggerOnDealingHit: (a, user, target, move, battle) => H.OnDealingHit.trigger(a, user, target, move, battle),
  triggerOnEndOfUsingMove: (a, user, targets, move, battle, switched) => H.OnEndOfUsingMove.trigger(a, user, targets, move, battle, switched),
  triggerAfterMoveUseFromTarget: (a, target, user, move, switched, battle) => H.AfterMoveUseFromTarget.trigger(a, target, user, move, switched, battle),
  triggerEndOfRoundWeather: (a, weather, battler, battle) => H.EndOfRoundWeather.trigger(a, weather, battler, battle),
  triggerEndOfRoundHealing: (a, battler, battle) => H.EndOfRoundHealing.trigger(a, battler, battle),
  triggerEndOfRoundEffect: (a, battler, battle) => H.EndOfRoundEffect.trigger(a, battler, battle),
  triggerEndOfRoundGainItem: (a, battler, battle) => H.EndOfRoundGainItem.trigger(a, battler, battle),
  triggerCertainSwitching: (a, switcher, battle) => trig(H.CertainSwitching, a, [switcher, battle]),
  triggerTrappingByTarget: (a, switcher, bearer, battle) => trig(H.TrappingByTarget, a, [switcher, bearer, battle]),
  triggerOnSwitchIn(a, battler, battle, switchIn = false) {
    H.OnSwitchIn.trigger(a, battler, battle, switchIn);
    // Comandante de un aliado se activa cuando entra su compañero (Añil).
    for (const b of battle.allSameSideBattlers(battler.index)) {
      if (b === battler || !b.hasActiveAbility('COMMANDER') || b.effects.Commander) continue;
      H.OnSwitchIn.trigger(b.ability, b, battle, switchIn);
    }
  },
  triggerOnSwitchOut: (a, battler, endOfBattle) => H.OnSwitchOut.trigger(a, battler, endOfBattle),
  triggerChangeOnBattlerFainting: (a, battler, fainted, battle) => H.ChangeOnBattlerFainting.trigger(a, battler, fainted, battle),
  triggerOnBattlerFainting: (a, battler, fainted, battle) => H.OnBattlerFainting.trigger(a, battler, fainted, battle),
  triggerOnTerrainChange: (a, battler, battle, changed) => H.OnTerrainChange.trigger(a, battler, battle, changed),
  triggerOnIntimidated: (a, battler, battle) => H.OnIntimidated.trigger(a, battler, battle),
  triggerCertainEscapeFromBattle: (a, battler) => trig(H.CertainEscapeFromBattle, a, [battler]),
  triggerOnTypeChange: (a, battler, type) => H.OnTypeChange.trigger(a, battler, type),
  triggerOnOpposingStatGain: (a, battler, battle, statUps) => H.OnOpposingStatGain.trigger(a, battler, battle, statUps),
  triggerModifyTypeEffectiveness: (a, user, target, move, battle, eff) => trig(H.ModifyTypeEffectiveness, a, [user, target, move, battle, eff], eff),
  triggerOnMoveSuccessCheck: (a, user, target, move, battle) => H.OnMoveSuccessCheck.trigger(a, user, target, move, battle),
};

/** Lista de todas las habilidades con algún manejador registrado. */
export function implementedAbilities() {
  const set = new Set();
  for (const hash of Object.values(H)) for (const k of hash.keys()) set.add(k);
  return [...set];
}

/**
 * Habilidades cuyo efecto está escrito directamente en el motor (fuera de los manejadores) o que no
 * tienen efecto en combate. Cuentan como implementadas en docs/battle_coverage.md.
 */
export const PASSIVE_ABILITIES = new Set([
  // Sin efecto en combate (efectos de campo/mundo)
  'HONEYGATHER', 'STENCH', 'INFILTRATOR',
  // Comprobaciones en línea en el motor
  'SHIELDDUST', 'SERENEGRACE', 'MAGICGUARD', 'KLUTZ', 'SKILLLINK', 'LEVITATE', 'OVERCOAT', 'ROCKHEAD', 'MAGICBOUNCE',
  'GLUTTONY', 'RIPEN', 'CONTRARY', 'SIMPLE', 'UNAWARE', 'ADAPTABILITY', 'STURDY', 'SUCTIONCUPS', 'STICKYHOLD',
  'LONGREACH', 'PROPELLERTAIL', 'STALWART', 'LIQUIDOOZE', 'EARLYBIRD', 'OWNTEMPO', 'INNERFOCUS', 'DAMP', 'MULTITYPE',
  'DANCER', 'SYMBIOSIS', 'CHEEKPOUCH', 'MIRRORARMOR', 'CORROSION', 'PARENTALBOND', 'STANCECHANGE', 'ZENMODE',
  'SCHOOLING', 'DISGUISE', 'POWERCONSTRUCT', 'FORECAST', 'TRACE', 'TRUANT', 'POISONHEAL', 'STURDYROOT', 'GUARDDOG',
  'SCRAPPY', 'ICEHEAD', 'AROMAVEIL', 'MINDSEYE', 'SHIELDSDOWN', 'GULPMISSILE', 'HUNGERSWITCH', 'RKSSYSTEM', 'LIBERO',
  'PROTEAN', 'SANDVEIL', 'SNOWCLOAK', 'SANDFORCE', 'SANDRUSH', 'ICEFACE', 'NEUTRALIZINGGAS', 'UNNERVE', 'STEAMENGINE',
  'UNSEENFIST',
]);
