// Efectos de movimientos de 9.ª generación añadidos por Añil en 030_Move/005, 007, 008 y 009
// que no se portaron en los otros módulos.
import { Move } from '../move.js';
import { MultiStatUpMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { targetData, STAT_STAGE_MAXIMUM } from '../../constants.js';
import { NORMAL_EFFECTIVE } from '../../typeChart.js';
import { SleepTarget, PoisonTarget, ParalyzeTarget, BurnTarget, ConfuseTarget } from './status.js';
import { clearUserBindingAndHazards } from './misc.js';

const MEMORY_TYPES = {
  FIGHTINGMEMORY: 'FIGHTING', FLYINGMEMORY: 'FLYING', POISONMEMORY: 'POISON', GROUNDMEMORY: 'GROUND', ROCKMEMORY: 'ROCK',
  BUGMEMORY: 'BUG', GHOSTMEMORY: 'GHOST', STEELMEMORY: 'STEEL', FIREMEMORY: 'FIRE', WATERMEMORY: 'WATER',
  GRASSMEMORY: 'GRASS', ELECTRICMEMORY: 'ELECTRIC', PSYCHICMEMORY: 'PSYCHIC', ICEMEMORY: 'ICE', DRAGONMEMORY: 'DRAGON',
  DARKMEMORY: 'DARK', FAIRYMEMORY: 'FAIRY',
};
const DRIVE_TYPES = { SHOCKDRIVE: 'ELECTRIC', BURNDRIVE: 'FIRE', CHILLDRIVE: 'ICE', DOUSEDRIVE: 'WATER' };

/** Tipo según el objeto equipado (Recuerdo / Disco). */
const typeFromItem = (table) => class extends Move {
  pbBaseType(user) {
    const t = user.item && user.itemActive() ? table[user.item] : null;
    return t && this.battle.db.types[t] ? t : 'NORMAL';
  }
};

class HitsFairysIgnoreTargetDefSpDefEvaStatStages extends Move {
  pbCalcAccuracyModifiers(user, target, mods) {
    super.pbCalcAccuracyModifiers(user, target, mods);
    mods.evasion_stage = 0;
  }
  pbGetDefenseStats(user, target) {
    const [v] = super.pbGetDefenseStats(user, target);
    return [v, STAT_STAGE_MAXIMUM];
  }
  pbCalcTypeModSingle(moveType, defType, user, target) {
    if (moveType === 'DRAGON' && defType === 'FAIRY') return NORMAL_EFFECTIVE;
    return super.pbCalcTypeModSingle(moveType, defType, user, target);
  }
}

class RemoveUserBindingAndEntryHazardsPoisonTarget extends PoisonTarget {
  pbEffectAfterAllHits(user, target) {
    if (user.isFainted() || target.damageState.unaffected) return;
    clearUserBindingAndHazards(this.battle, user);
  }
}

class AddMoneyGainedFromBattleLowerUserSpAtk1 extends Move {
  constructor(...a) { super(...a); this.statDown = ['SPECIAL_ATTACK', 1]; }
  pbEndOfMoveUsageEffect(user, targets) {
    if (this.battle.pbAllFainted(user.idxOpposingSide())) return;
    let hit = false;
    for (const b of targets) {
      const ds = b.damageState;
      if (ds.missed || ds.protected || ds.unaffected) continue;
      hit = true;
      if (user.pbOwnedByPlayer()) this.battle.field.effects.PayDay += 5 * user.level;
    }
    if (!hit) return;
    this.battle.pbDisplay('¡Se esparcieron monedas por todos lados!');
    if (user.pbCanLowerStatStage(this.statDown[0], user, this)) user.pbLowerStatStage(this.statDown[0], this.statDown[1], user);
  }
}

class RaiseUserStat1Commander extends Move {
  pbEffectGeneral(user) {
    if (!user.isCommanderHost()) return;
    const stat = ['ATTACK', 'DEFENSE', 'SPEED'][user.effects.Commander[1]];
    if (stat && user.pbCanRaiseStatStage(stat, user, this)) user.pbRaiseStatStage(stat, 1, user, true);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    const n = user.isCommanderHost() ? user.effects.Commander[1] + 1 : hitNum;
    super.pbShowAnimation(id, user, targets, n, showAnimation);
  }
}

const hazardsOn = (side) => side.Spikes > 0 || side.ToxicSpikes > 0 || side.StealthRock || side.StickyWeb;

class RaiseUserAtkSpd1RemoveHazardsSubstitutes extends MultiStatUpMove {
  constructor(...a) { super(...a); this.statUp = ['ATTACK', 1, 'SPEED', 1]; }
  pbMoveFailed(user) {
    const clearable = hazardsOn(user.pbOwnSide().effects) || hazardsOn(user.pbOpposingSide().effects) ||
      this.battle.allBattlers().some((b) => b.effects.Substitute > 0);
    const canRaise = user.pbCanRaiseStatStage('ATTACK', user, this) || user.pbCanRaiseStatStage('SPEED', user, this);
    if (!clearable && !canRaise) {
      this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    let showMsg = false;
    for (const [side, team] of [[user.pbOwnSide().effects, user.pbTeam(true)], [user.pbOpposingSide().effects, user.pbOpposingTeam(true)]]) {
      if (side.StealthRock) { side.StealthRock = false; this.battle.pbDisplay(`¡Las piedras puntiagudas han desaparecido del bando de ${team}!`); showMsg = true; }
      if (side.Spikes > 0) { side.Spikes = 0; this.battle.pbDisplay(`¡Las púas puntiagudas han desaparecido del bando de ${team}!`); showMsg = true; }
      if (side.ToxicSpikes > 0) { side.ToxicSpikes = 0; this.battle.pbDisplay(`¡Las púas venenosas han desaparecido del bando de ${team}!`); showMsg = true; }
      if (side.StickyWeb) { side.StickyWeb = false; this.battle.pbDisplay(`¡La red viscosa ha desaparecido del bando de ${team}!`); showMsg = true; }
    }
    for (const b of this.battle.allBattlers()) {
      if (b.effects.Substitute === 0) continue;
      b.effects.Substitute = 0;
      showMsg = true;
    }
    if (showMsg) this.battle.pbDisplay('¡Limpieza completada!');
    super.pbEffectGeneral(user);
  }
}

class TerapagosCategoryDependsOnHigherDamage extends Move {
  stellar(user) { return !!user && user.isSpecies('TERAPAGOS') && user.form === 2; }
  pbTarget(user) {
    if (this.battle.pbSideSize(0) > 1 && this.stellar(user)) return targetData('AllNearFoes');
    return targetData('NearOther');
  }
  pbBaseType(user) {
    if (this.stellar(user) && this.battle.db.types.STELLAR) return 'STELLAR';
    return 'NORMAL';
  }
  pbCalcTypeModSingle(moveType, defType, user, target) {
    if (moveType === 'STELLAR') return NORMAL_EFFECTIVE; // Sin teracristalización en Axis.
    return super.pbCalcTypeModSingle(moveType, defType, user, target);
  }
}

registerMoves({
  TypeDependsOnUserMemory: typeFromItem(MEMORY_TYPES),
  TypeDependsOnUserDrive: typeFromItem(DRIVE_TYPES),
  HitsFairysIgnoreTargetDefSpDefEvaStatStages,
  RemoveUserBindingAndEntryHazardsPoisonTarget,
  AddMoneyGainedFromBattleLowerUserSpAtk1,
  RaiseUserStat1Commander,
  RaiseUserAtkSpd1RemoveHazardsSubstitutes,
  TerapagosCategoryDependsOnHigherDamage,
  // Sus multiplicadores se aplican en moveCalc.pbCalcDamageMultipliers (Hidrovapor, Cuchilla Psíquica).
  IncreasePowerInSunWeather: Move,
  IncreasePowerInElectricTerrain: Move,
  StarmobileBurnTarget: class extends BurnTarget {},
  StarmobilePoisonTarget: class extends PoisonTarget {},
  StarmobileParalyzeTarget: class extends ParalyzeTarget {},
  StarmobileSleepTarget: class extends SleepTarget {},
  StarmobileConfuseTarget: class extends ConfuseTarget {},
});
