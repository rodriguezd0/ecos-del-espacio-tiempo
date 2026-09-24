// Clases base de efectos de movimientos (030_Move/005_Move_BaseEffects de Essentials).
import { Move } from './move.js';
import { Settings } from '../settings.js';
import { STAT_NAMES } from '../constants.js';

/** Código de función no implementado: los de daño golpean sin efecto; los de estado fallan. */
export class UnimplementedMove extends Move {
  pbMoveFailed() {
    if (this.statusMove()) {
      this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }
}

/** Pseudomovimiento del daño por confusión (40 de potencia, físico, sin tipo ni crítico). */
export class ConfusionMove extends Move {
  constructor(battle) {
    super(battle, null, {
      id: 'CONFUSEDAMAGE', name: '', type: null, category: 'Physical', power: 40, accuracy: 100, pp: 0,
      target: 'User', priority: 0, functionCode: 'None', flags: [], effectChance: 0,
    }, { detached: true, special: true });
  }
  get isConfusion() { return true; }
  physicalMove() { return true; }
  specialMove() { return false; }
  pbCritialOverride() { return -1; }
}

/** Forcejeo. */
export class StruggleMove extends Move {
  constructor(battle) {
    super(battle, null, {
      id: 'STRUGGLE', name: 'Forcejeo', type: null, category: 'Physical', power: 50, accuracy: 0, pp: 0,
      target: 'RandomNearFoe', priority: 0, functionCode: 'Struggle', flags: ['Contact', 'CanProtect'], effectChance: 0,
    }, { detached: true, special: true });
  }
  physicalMove() { return true; }
  specialMove() { return false; }
  pbEffectAfterAllHits(user, target) {
    if (target.damageState.unaffected) return;
    user.pbReduceHP(Math.round(user.totalhp / 4), false);
    this.battle.pbDisplay(`¡${user.pbThis()} también se ha hecho daño!`);
    user.pbItemHPHealCheck();
  }
}

/** Sube una estadística del usuario. `statUp = [stat, etapas]`. */
export class StatUpMove extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (this.damagingMove()) return false;
    return !user.pbCanRaiseStatStage(this.statUp[0], user, this, true);
  }
  pbEffectGeneral(user) {
    if (this.damagingMove()) return;
    user.pbRaiseStatStage(this.statUp[0], this.statUp[1], user);
  }
  pbAdditionalEffect(user) {
    if (user.pbCanRaiseStatStage(this.statUp[0], user, this)) user.pbRaiseStatStage(this.statUp[0], this.statUp[1], user);
  }
}

/** Sube varias estadísticas del usuario. `statUp = [stat, n, stat, n…]`. */
export class MultiStatUpMove extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (this.damagingMove()) return false;
    for (let i = 0; i < this.statUp.length; i += 2) {
      if (user.pbCanRaiseStatStage(this.statUp[i], user, this)) return false;
    }
    this.battle.pbDisplay(`¡Las características de ${user.pbThis(true)} no pueden aumentar más!`);
    return true;
  }
  raiseAll(user) {
    let showAnim = true;
    for (let i = 0; i < this.statUp.length; i += 2) {
      if (!user.pbCanRaiseStatStage(this.statUp[i], user, this)) continue;
      if (user.pbRaiseStatStage(this.statUp[i], this.statUp[i + 1], user, showAnim)) showAnim = false;
    }
  }
  pbEffectGeneral(user) {
    if (this.damagingMove()) return;
    this.raiseAll(user);
  }
  pbAdditionalEffect(user) { this.raiseAll(user); }
}

/** Baja estadísticas del usuario tras dañar (A Bocajarro, Superpoder…). */
export class StatDownMove extends Move {
  pbEffectWhenDealingDamage(user, target) {
    if (this.battle.pbAllFainted(target.idxOwnSide())) return;
    let showAnim = true;
    for (let i = 0; i < this.statDown.length; i += 2) {
      if (!user.pbCanLowerStatStage(this.statDown[i], user, this)) continue;
      if (user.pbLowerStatStage(this.statDown[i], this.statDown[i + 1], user, showAnim)) showAnim = false;
    }
  }
}

/** Baja una estadística del objetivo. */
export class TargetStatDownMove extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, showMessage) {
    if (this.damagingMove()) return false;
    return !target.pbCanLowerStatStage(this.statDown[0], user, this, showMessage);
  }
  pbEffectAgainstTarget(user, target) {
    if (this.damagingMove()) return;
    target.pbLowerStatStage(this.statDown[0], this.statDown[1], user);
  }
  pbAdditionalEffect(user, target) {
    if (target.damageState.substitute) return;
    if (!target.pbCanLowerStatStage(this.statDown[0], user, this)) return;
    target.pbLowerStatStage(this.statDown[0], this.statDown[1], user);
  }
}

/** Baja varias estadísticas del objetivo. */
export class TargetMultiStatDownMove extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, showMessage) {
    if (this.damagingMove()) return false;
    for (let i = 0; i < this.statDown.length; i += 2) {
      if (target.pbCanLowerStatStage(this.statDown[i], user, this)) return false;
    }
    let canLower = false;
    if (target.hasActiveAbility('CONTRARY') && !this.battle.moldBreaker) {
      for (let i = 0; i < this.statDown.length; i += 2) if (!target.statStageAtMax(this.statDown[i])) canLower = true;
      if (!canLower && showMessage) this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} no pueden aumentar más!`);
    } else {
      for (let i = 0; i < this.statDown.length; i += 2) if (!target.statStageAtMin(this.statDown[i])) canLower = true;
      if (!canLower && showMessage) this.battle.pbDisplay(`¡Las características de ${target.pbThis(true)} no pueden disminuir más!`);
    }
    if (canLower) target.pbCanLowerStatStage(this.statDown[0], user, this, showMessage);
    return true;
  }
  pbCheckForMirrorArmor(user, target) {
    if (target.hasActiveAbility('MIRRORARMOR') && user.index !== target.index) {
      let failed = true;
      for (let i = 0; i < this.statDown.length; i += 2) {
        if (target.statStageAtMin(this.statDown[i])) continue;
        if (!user.pbCanLowerStatStage(this.statDown[i], target, this, false, false, true)) continue;
        failed = false;
        break;
      }
      if (failed) {
        this.battle.pbShowAbilitySplash(target);
        user.pbCanLowerStatStage(this.statDown[0], target, this, true, false, true);
        this.battle.pbHideAbilitySplash(target);
        return false;
      }
    }
    return true;
  }
  pbLowerTargetMultipleStats(user, target) {
    if (!this.pbCheckForMirrorArmor(user, target)) return;
    let showAnim = true;
    let showMirrorArmorSplash = true;
    for (let i = 0; i < this.statDown.length; i += 2) {
      if (!target.pbCanLowerStatStage(this.statDown[i], user, this)) continue;
      if (target.pbLowerStatStage(this.statDown[i], this.statDown[i + 1], user, showAnim, false, showMirrorArmorSplash ? 1 : 3)) {
        showAnim = false;
      }
      showMirrorArmorSplash = false;
    }
    this.battle.pbHideAbilitySplash(target);
  }
  pbEffectAgainstTarget(user, target) {
    if (!this.damagingMove()) this.pbLowerTargetMultipleStats(user, target);
  }
  pbAdditionalEffect(user, target) {
    if (!target.damageState.substitute) this.pbLowerTargetMultipleStats(user, target);
  }
}

/** Daño fijo (Tinieblas, Sísmico…). */
export class FixedDamageMove extends Move {
  get isFixedDamage() { return true; }
  pbFixedDamage() { return 1; }
  pbCalcDamage(user, target) {
    target.damageState.critical = false;
    target.damageState.calcDamage = Math.max(1, this.pbFixedDamage(user, target));
  }
}

/** Movimiento de dos turnos (Rayo Solar, Excavar…). */
export class TwoTurnMove extends Move {
  chargingTurnMove() { return true; }

  pbIsChargingTurn(user) {
    this.powerHerb = false;
    this.chargingTurn = false;
    this.damagingTurn = true;
    if (!user.effects.TwoTurnAttack) {
      this.powerHerb = user.hasActiveItem('POWERHERB');
      this.chargingTurn = true;
      this.damagingTurn = this.powerHerb;
    }
    return !this.damagingTurn;
  }

  pbDamagingMove() {
    if (!this.damagingTurn) return false;
    return super.pbDamagingMove();
  }

  pbQuickChargingMove(user, targets) {
    if (!this.chargingTurn || !this.damagingTurn) return;
    this.pbChargingTurnMessage(user, targets);
    this.pbShowAnimation(this.id, user, targets, 1);
    for (const b of targets) this.pbChargingTurnEffect(user, b);
    if (this.powerHerb) {
      this.battle.pbCommonAnimation('UseItem', user);
      this.battle.pbDisplay(`¡${user.pbThis()} ya está listo gracias a la Hierba Única!`);
      user.pbConsumeItem();
    }
  }

  pbAccuracyCheck(user, target) {
    if (!this.damagingTurn) return true;
    return super.pbAccuracyCheck(user, target);
  }

  pbInitialEffect(user, targets) {
    if (this.damagingTurn) this.pbAttackingTurnMessage(user, targets);
    else if (this.chargingTurn) this.pbChargingTurnMessage(user, targets);
  }

  pbChargingTurnMessage(user) {
    this.battle.pbDisplay(`¡${user.pbThis()} está preparándose para atacar!`);
  }

  pbAttackingTurnMessage() {}

  pbEffectAgainstTarget(user, target) {
    if (this.damagingTurn) return this.pbAttackingTurnEffect(user, target);
    if (this.chargingTurn) return this.pbChargingTurnEffect(user, target);
    return undefined;
  }

  pbChargingTurnEffect() {}
  pbAttackingTurnEffect() {}

  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    if (this.chargingTurn && !this.damagingTurn) hitNum = 1;
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
  }
}

/** Movimiento curativo del usuario. */
export class HealingMove extends Move {
  healingMove() { return true; }
  pbHealAmount() { return 1; }
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (user.hp === user.totalhp) {
      this.battle.pbDisplay(`¡Los PS de ${user.pbThis(true)} están al máximo!`);
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    user.pbRecoverHP(this.pbHealAmount(user));
    this.battle.pbDisplay(`¡${user.pbThis()} ha recuperado PS!`);
  }
}

/** Movimiento con daño de retroceso. */
export class RecoilMove extends Move {
  recoilMove() { return true; }
  pbRecoilDamage() { return 1; }
  pbEffectAfterAllHits(user, target) {
    if (target.damageState.unaffected) return;
    if (!user.takesIndirectDamage()) return;
    if (user.hasActiveAbility(['ROCKHEAD', 'ICEHEAD'])) return;
    const amt = Math.max(1, this.pbRecoilDamage(user, target));
    user.pbReduceHP(amt, false);
    this.battle.pbDisplay(`¡${user.pbThis()} también se ha hecho daño!`);
    user.pbItemHPHealCheck();
  }
}

/** Protección y variantes. `effect` = nombre del efecto; `sidedEffect` si es de bando. */
export class ProtectMove extends Move {
  constructor(battle, pkmnMove, data, opts) {
    super(battle, pkmnMove, data, opts);
    this.sidedEffect = false;
    this.effect = 'Protect';
  }
  pbChangeUsageCounters(user, specialUsage) {
    const oldVal = user.effects.ProtectRate;
    super.pbChangeUsageCounters(user, specialUsage);
    user.effects.ProtectRate = oldVal;
  }
  pbMoveFailed(user) {
    const fail = () => {
      user.effects.ProtectRate = 1;
      this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    };
    if (this.sidedEffect ? user.pbOwnSide().effects[this.effect] : user.effects[this.effect]) return fail();
    if (!this.sidedEffect && user.effects.ProtectRate > 1 && this.battle.pbRandom(user.effects.ProtectRate) !== 0) return fail();
    if (this.pbMoveFailedLastInRound(user)) {
      user.effects.ProtectRate = 1;
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    if (this.sidedEffect) user.pbOwnSide().effects[this.effect] = true;
    else user.effects[this.effect] = true;
    user.effects.ProtectRate *= 3;
    this.pbProtectMessage(user);
  }
  pbProtectMessage(user) {
    if (this.sidedEffect) this.battle.pbDisplay(`¡${this.name} protege a ${user.pbTeam(true)}!`);
    else this.battle.pbDisplay(`¡${user.pbThis()} se está protegiendo!`);
  }
}

/** Movimiento que cambia el clima. */
export class WeatherMove extends Move {
  pbMoveFailed() {
    switch (this.battle.field.weather) {
      case 'HarshSun':
        this.battle.pbDisplay('¡El calor abrasador se mantiene sin perder un ápice de intensidad!');
        return true;
      case 'HeavyRain':
        this.battle.pbDisplay('¡No parece que vaya a dejar de diluviar!');
        return true;
      case 'StrongWinds':
        this.battle.pbDisplay('¡Las misteriosas turbulencias continúan sin cesar!');
        return true;
      default:
        if (this.battle.field.weather === this.weatherType) {
          this.battle.pbDisplay('¡Pero ha fallado!');
          return true;
        }
        return false;
    }
  }
  pbEffectGeneral(user) {
    this.battle.pbStartWeather(user, this.weatherType, true, false);
  }
}

/** Movimiento que crea un campo. */
export class TerrainMove extends Move {
  pbMoveFailed() {
    if (this.battle.field.terrain === this.terrainType) {
      this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }
  pbEffectGeneral(user) {
    this.battle.pbStartTerrain(user, this.terrainType);
  }
}

/** Voto (Fuego/Agua/Planta) y sus combinaciones. `combos = [[código, efecto, tipo, anim]]`. */
export class PledgeMove extends Move {
  get isPledgeMove() { return true; }
  pbOnStartUse(user) {
    this.pledgeSetup = false;
    this.pledgeCombo = false;
    this.pledgeOtherUser = null;
    this.comboEffect = null;
    for (const c of this.combos) {
      if (c[0] !== user.effects.FirstPledge) continue;
      this.battle.pbDisplay('¡Los dos movimientos se han unido! ¡Es un movimiento combinado!');
      this.pledgeCombo = true;
      this.comboEffect = c[1];
      break;
    }
    if (this.pledgeCombo) return;
    for (const b of user.allAllies()) {
      const ch = this.battle.choices[b.index];
      if (ch.action !== 'UseMove' || b.movedThisRound() || !ch.move) continue;
      if (this.combos.some((c) => c[0] === ch.move.functionCode)) {
        this.pledgeSetup = true;
        this.pledgeOtherUser = b;
        break;
      }
    }
  }
  pbDamagingMove() {
    if (this.pledgeSetup) return false;
    return super.pbDamagingMove();
  }
  pbBaseType(user) {
    for (const c of this.combos) if (c[0] === user.effects.FirstPledge && c[2]) return c[2];
    return super.pbBaseType(user);
  }
  pbBaseDamage(baseDmg) { return this.pledgeCombo ? baseDmg * 2 : baseDmg; }
  pbEffectGeneral(user) {
    user.effects.FirstPledge = null;
    if (!this.pledgeSetup) return;
    this.battle.pbDisplay(`${user.pbThis()} está esperando a ${this.pledgeOtherUser.pbThis(true)}...`);
    this.pledgeOtherUser.effects.FirstPledge = this.functionCode;
    this.pledgeOtherUser.effects.MoveNext = true;
    user.lastMoveFailed = true;
  }
  pbEffectAfterAllHits(user) {
    if (!this.pledgeCombo) return;
    let msg = null;
    switch (this.comboEffect) {
      case 'SeaOfFire':
        if (user.pbOpposingSide().effects.SeaOfFire === 0) {
          user.pbOpposingSide().effects.SeaOfFire = 4;
          msg = `¡${user.pbOpposingTeam()} se ve rodeado por un mar de llamas!`;
        }
        break;
      case 'Rainbow':
        if (user.pbOwnSide().effects.Rainbow === 0) {
          user.pbOwnSide().effects.Rainbow = 4;
          msg = `¡Ha aparecido un arcoíris sobre ${user.pbTeam(true)}!`;
        }
        break;
      case 'Swamp':
        if (user.pbOpposingSide().effects.Swamp === 0) {
          user.pbOpposingSide().effects.Swamp = 4;
          msg = `¡Ha aparecido un pantano alrededor de ${user.pbOpposingTeam(true)}!`;
        }
        break;
      default: break;
    }
    if (msg) this.battle.pbDisplay(msg);
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    if (this.pledgeSetup) return;
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
  }
}

// ---------------------------------------------------------------- fábricas
/** Crea una subclase de StatUpMove con `statUp` fijo. */
export function statUp(stat, n, Base = StatUpMove) {
  return class extends Base {
    constructor(...a) { super(...a); this.statUp = [stat, n]; }
  };
}
export function multiStatUp(list, Base = MultiStatUpMove) {
  return class extends Base {
    constructor(...a) { super(...a); this.statUp = [...list]; }
  };
}
export function statDown(list, Base = StatDownMove) {
  return class extends Base {
    constructor(...a) { super(...a); this.statDown = [...list]; }
  };
}
export function targetStatDown(stat, n, Base = TargetStatDownMove) {
  return class extends Base {
    constructor(...a) { super(...a); this.statDown = [stat, n]; }
  };
}
export function targetMultiStatDown(list, Base = TargetMultiStatDownMove) {
  return class extends Base {
    constructor(...a) { super(...a); this.statDown = [...list]; }
  };
}

export const statLabel = (s) => STAT_NAMES[s] || s;
export { Settings };
