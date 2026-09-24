// Manejadores de objetos equipados por evento (Battle::ItemEffects de Essentials 21.1).
import { makeHandlerSet, orDefault } from '../handlers.js';

const H = makeHandlerSet('ItemEffects', [
  'SpeedCalc', 'WeightCalc', 'HPHeal', 'OnStatLoss', 'StatusCure', 'PriorityChange', 'PriorityBracketChange',
  'PriorityBracketUse', 'OnMissingTarget', 'AccuracyCalcFromUser', 'AccuracyCalcFromTarget', 'DamageCalcFromUser',
  'DamageCalcFromTarget', 'CriticalCalcFromUser', 'CriticalCalcFromTarget', 'OnBeingHit', 'OnBeingHitPositiveBerry',
  'AfterMoveUseFromTarget', 'AfterMoveUseFromUser', 'OnEndOfUsingMove', 'OnEndOfUsingMoveStatRestore',
  'ExpGainModifier', 'EVGainModifier', 'WeatherExtender', 'TerrainExtender', 'TerrainStatBoost', 'EndOfRoundHealing',
  'EndOfRoundEffect', 'CertainSwitching', 'TrappingByTarget', 'OnSwitchIn', 'OnIntimidated', 'CertainEscapeFromBattle',
  'OnOpposingStatGain', 'StatLossImmunity',
]);

const trig = (hash, id, args, ret = false) => orDefault(hash.trigger(id, ...args), ret);

export const ItemEffects = {
  ...H,
  triggerSpeedCalc: (i, battler, mult) => trig(H.SpeedCalc, i, [battler, mult], mult),
  triggerWeightCalc: (i, battler, w) => trig(H.WeightCalc, i, [battler, w], w),
  triggerHPHeal: (i, battler, battle, forced) => trig(H.HPHeal, i, [battler, battle, forced]),
  triggerOnStatLoss: (i, user, moveUser, battle) => trig(H.OnStatLoss, i, [user, moveUser, battle]),
  triggerStatLossImmunity: (i, battler, stat, battle, show) => trig(H.StatLossImmunity, i, [battler, stat, battle, show]),
  triggerOnOpposingStatGain: (i, battler, battle, statUps, forced) => trig(H.OnOpposingStatGain, i, [battler, battle, statUps, forced]),
  triggerStatusCure: (i, battler, battle, forced) => trig(H.StatusCure, i, [battler, battle, forced]),
  triggerPriorityChange: (i, battler, move, pri) => trig(H.PriorityChange, i, [battler, move, pri], pri),
  triggerPriorityBracketChange: (i, battler, battle) => trig(H.PriorityBracketChange, i, [battler, battle], 0),
  triggerPriorityBracketUse: (i, battler, battle) => H.PriorityBracketUse.trigger(i, battler, battle),
  triggerOnMissingTarget: (i, user, target, move, hitNum, battle) => H.OnMissingTarget.trigger(i, user, target, move, hitNum, battle),
  triggerAccuracyCalcFromUser: (i, mods, user, target, move, type) => H.AccuracyCalcFromUser.trigger(i, mods, user, target, move, type),
  triggerAccuracyCalcFromTarget: (i, mods, user, target, move, type) => H.AccuracyCalcFromTarget.trigger(i, mods, user, target, move, type),
  triggerDamageCalcFromUser: (i, user, target, move, mults, power, type) => H.DamageCalcFromUser.trigger(i, user, target, move, mults, power, type),
  triggerDamageCalcFromTarget: (i, user, target, move, mults, power, type) => H.DamageCalcFromTarget.trigger(i, user, target, move, mults, power, type),
  triggerCriticalCalcFromUser: (i, user, target, c) => trig(H.CriticalCalcFromUser, i, [user, target, c], c),
  triggerCriticalCalcFromTarget: (i, user, target, c) => trig(H.CriticalCalcFromTarget, i, [user, target, c], c),
  triggerOnBeingHit: (i, user, target, move, battle) => H.OnBeingHit.trigger(i, user, target, move, battle),
  triggerOnBeingHitPositiveBerry: (i, battler, battle, forced) => trig(H.OnBeingHitPositiveBerry, i, [battler, battle, forced]),
  triggerAfterMoveUseFromTarget: (i, battler, user, move, switched, battle) => H.AfterMoveUseFromTarget.trigger(i, battler, user, move, switched, battle),
  triggerAfterMoveUseFromUser: (i, user, targets, move, numHits, battle) => H.AfterMoveUseFromUser.trigger(i, user, targets, move, numHits, battle),
  triggerOnEndOfUsingMove: (i, battler, battle, forced) => trig(H.OnEndOfUsingMove, i, [battler, battle, forced]),
  triggerOnEndOfUsingMoveStatRestore: (i, battler, battle, forced) => trig(H.OnEndOfUsingMoveStatRestore, i, [battler, battle, forced]),
  triggerExpGainModifier: (i, pkmn, exp) => trig(H.ExpGainModifier, i, [pkmn, exp], -1),
  triggerEVGainModifier(i, pkmn, evYield) {
    if (!H.EVGainModifier.has(i)) return false;
    H.EVGainModifier.trigger(i, pkmn, evYield);
    return true;
  },
  triggerWeatherExtender: (i, weather, duration, battler, battle) => trig(H.WeatherExtender, i, [weather, duration, battler, battle], duration),
  triggerTerrainExtender: (i, terrain, duration, battler, battle) => trig(H.TerrainExtender, i, [terrain, duration, battler, battle], duration),
  triggerTerrainStatBoost: (i, battler, battle) => trig(H.TerrainStatBoost, i, [battler, battle]),
  triggerEndOfRoundHealing: (i, battler, battle) => H.EndOfRoundHealing.trigger(i, battler, battle),
  triggerEndOfRoundEffect: (i, battler, battle) => H.EndOfRoundEffect.trigger(i, battler, battle),
  triggerCertainSwitching: (i, switcher, battle) => trig(H.CertainSwitching, i, [switcher, battle]),
  triggerTrappingByTarget: (i, switcher, bearer, battle) => trig(H.TrappingByTarget, i, [switcher, bearer, battle]),
  triggerOnSwitchIn: (i, battler, battle) => H.OnSwitchIn.trigger(i, battler, battle),
  triggerOnIntimidated: (i, battler, battle) => trig(H.OnIntimidated, i, [battler, battle]),
  triggerCertainEscapeFromBattle: (i, battler) => trig(H.CertainEscapeFromBattle, i, [battler]),
};

export function implementedHeldItems() {
  const set = new Set();
  for (const hash of Object.values(H)) for (const k of hash.keys()) set.add(k);
  return [...set];
}
