// Movimiento en combate (Battle::Move de Essentials 21.1, 030_Move/002-003).
// Las subclases por código de función (functionCode) sobrescriben los métodos pb*.
// Los cálculos de tipo, precisión y daño están en moveCalc.js (mixin).
import { targetData } from '../constants.js';
import { Settings } from '../settings.js';
import { totalPP as pokemonTotalPP } from '../pokemon.js';
import { AbilityEffects } from '../abilities/registry.js';
import { Effectiveness } from '../typeChart.js';

const CATEGORY = { Physical: 0, Special: 1, Status: 2 };
export const CRITICAL_HIT_RATIOS = Settings.NEW_CRITICAL_HIT_RATE_MECHANICS ? [24, 8, 2, 1] : [16, 8, 4, 3, 2];

/** Divide "Code,Flag" (errata de datos, p. ej. Remolino) en código y banderas extra. */
export function parseFunctionCode(raw) {
  const [code, ...extraFlags] = String(raw || 'None').split(',').map((s) => s.trim()).filter(Boolean);
  return { code: code || 'None', extraFlags };
}

export class Move {
  /**
   * @param {object} battle
   * @param {{id: string, pp: number, ppUps?: number}|null} pkmnMove  movimiento del Pokémon (se modifica su PP)
   * @param {object} [data]  datos de moves.json (por defecto db.moves[id])
   * @param {{detached?: boolean, special?: boolean}} [opts]
   */
  constructor(battle, pkmnMove, data = null, opts = {}) {
    this.battle = battle;
    const d = data || battle.db.moves[pkmnMove.id];
    if (!d) throw new Error(`Movimiento desconocido: ${pkmnMove && pkmnMove.id}`);
    const { code, extraFlags } = parseFunctionCode(d.functionCode);
    this.realMove = opts.detached ? null : pkmnMove;
    this.id = d.id;
    this.name = d.name;
    this.functionCode = code;
    this.power = d.power || 0;
    this.type = d.type;
    this.category = CATEGORY[d.category] ?? 2;
    this.accuracy = d.accuracy || 0;
    this.target = d.target || 'NearOther';
    this.priority = d.priority || 0;
    this.flags = [...(d.flags || []), ...extraFlags];
    this.addlEffect = d.effectChance || 0;
    this.description = d.description || '';
    this.calcType = null;
    this.powerBoost = false;
    this.snatched = false;
    this._pp = opts.special ? -1 : (pkmnMove && pkmnMove.pp != null ? pkmnMove.pp : d.pp);
    this.totalPPOverride = null;
    this.baseTotalPP = d.pp || 0;
    this.ppUps = pkmnMove ? pkmnMove.ppUps || 0 : 0;
  }

  get pp() { return this.realMove ? this.realMove.pp : this._pp; }
  set pp(v) {
    if (this.realMove) this.realMove.pp = v;
    else this._pp = v;
  }

  get totalPP() {
    if (this.totalPPOverride && this.totalPPOverride > 0) return this.totalPPOverride;
    return pokemonTotalPP(this.battle.db, { id: this.id, ppUps: this.ppUps });
  }

  get db() { return this.battle.db; }

  // ---------------------------------------------------------------- atributos
  pbTarget() { return targetData(this.target); }
  physicalMove() { return this.category === 0; }
  specialMove() { return this.category === 1; }
  damagingMove() { return this.category !== 2; }
  statusMove() { return this.category === 2; }
  pbPriority() { return this.priority; }

  usableWhenAsleep() { return false; }
  unusableInGravity() { return false; }
  healingMove() { return false; }
  recoilMove() { return false; }
  flinchingMove() { return false; }
  callsAnotherMove() { return false; }
  multiHitMove() { return false; }
  chargingTurnMove() { return false; }
  successCheckPerHit() { return false; }
  hitsFlyingTargets() { return false; }
  hitsDiggingTargets() { return false; }
  hitsDivingTargets() { return false; }
  ignoresReflect() { return false; }
  targetsPosition() { return false; }
  cannotRedirect() { return false; }
  worksWithNoTargets() { return false; }
  damageReducedByBurn() { return true; }
  canSnatch() { return false; }
  canMagicCoat() { return false; }
  get isFixedDamage() { return false; }
  get isPledgeMove() { return false; }
  get isConfusion() { return false; }

  hasFlag(f) { return this.flags.includes(f); }
  contactMove() { return this.hasFlag('Contact'); }
  canProtectAgainst() { return this.hasFlag('CanProtect'); }
  canMirrorMove() { return this.hasFlag('CanMirrorMove'); }
  thawsUser() { return this.hasFlag('ThawsUser'); }
  highCriticalRate() { return this.hasFlag('HighCriticalHitRate'); }
  bitingMove() { return this.hasFlag('Biting'); }
  punchingMove() { return this.hasFlag('Punching'); }
  kickingMove() { return this.hasFlag('Kicking'); }
  soundMove() { return this.hasFlag('Sound'); }
  powderMove() { return this.hasFlag('Powder'); }
  pulseMove() { return this.hasFlag('Pulse'); }
  bombMove() { return this.hasFlag('Bomb'); }
  danceMove() { return this.hasFlag('Dance'); }
  tramplesMinimize() { return this.hasFlag('TramplesMinimize'); }
  windMove() { return this.hasFlag('Wind'); }
  slicingMove() { return this.hasFlag('Slicing'); }

  nonLethal() { return false; }
  preventsBattlerConsumingHealingBerry() { return false; }

  ignoresSubstitute(user) {
    if (this.soundMove()) return true;
    return !!(user && user.hasActiveAbility('INFILTRATOR'));
  }

  // ---------------------------------------------------------------- uso
  pbCanChooseMove() { return true; }
  pbDisplayChargeMessage() {}
  pbOnStartUse() {}
  pbAddTarget() {}
  pbModifyTargets() {}

  pbChangeUsageCounters(user) {
    user.effects.FuryCutter = 0;
    user.effects.ParentalBond = 0;
    user.effects.ProtectRate = 1;
    this.battle.field.effects.FusionBolt = false;
    this.battle.field.effects.FusionFlare = false;
    user.proteanTrigger = true;
    user.effects.GlaiveRush = 0;
    if (user.effects.SuccessiveMove !== this.id) user.effects.SuccessiveMove = null;
  }

  pbDisplayUseMessage(user) {
    this.battle.pbDisplayBrief(`¡${user.pbThis()} ha usado ${this.name}!`);
  }

  pbShowFailMessages() { return true; }
  pbMissMessage() { return false; }

  pbIsChargingTurn() { return false; }
  pbDamagingMove() { return this.damagingMove(); }

  pbContactMove(user) {
    if (user.hasActiveAbility('LONGREACH')) return false;
    if (user.hasActiveItem('PUNCHINGGLOVE') && this.punchingMove()) return false;
    return this.contactMove();
  }

  pbNumHits(user, targets) {
    if (user.hasActiveAbility('PARENTALBOND') && this.pbDamagingMove() && !this.chargingTurnMove() && targets.length === 1) {
      user.effects.ParentalBond = 3;
      return 2;
    }
    return 1;
  }

  pbQuickChargingMove() {}
  pbOverrideSuccessCheckPerHit() { return false; }
  pbCrashDamage() {}
  pbInitialEffect() {}
  pbDesignateTargetsForHit(targets) { return targets; }
  pbRepeatHit() { return false; }

  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    if (!showAnimation) return;
    if (user.effects.ParentalBond === 1) this.battle.pbCommonAnimation('ParentalBond', user, targets);
    else this.battle.pbAnimation(id, user, targets, hitNum);
  }

  pbSelfKO() {}
  pbEffectWhenDealingDamage() {}
  pbEffectAgainstTarget() {}
  pbEffectGeneral() {}
  pbAdditionalEffect() {}
  pbEffectAfterAllHits() {}
  pbSwitchOutTargetEffect() {}
  pbEndOfMoveUsageEffect() {}

  pbImmunityByAbility(user, target, showMessage) {
    if (this.battle.moldBreaker) return false;
    if (!target.abilityActive()) return false;
    return !!AbilityEffects.triggerMoveImmunity(target.ability, user, target, this, this.calcType, this.battle, showMessage);
  }

  pbMoveFailed() { return false; }
  pbFailsAgainstTarget() { return false; }

  pbMoveFailedLastInRound(user, showMessage = true) {
    const unmoved = this.battle.allBattlers().some((b) =>
      b.index !== user.index && ['UseMove', 'Shift'].includes(this.battle.choices[b.index].action) && !b.movedThisRound());
    if (!unmoved) {
      if (showMessage) this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }

  pbMoveFailedTargetAlreadyMoved(target, showMessage = true) {
    const act = this.battle.choices[target.index].action;
    if ((act !== 'UseMove' && act !== 'Shift') || target.movedThisRound()) {
      if (showMessage) this.battle.pbDisplay('¡Pero ha fallado!');
      return true;
    }
    return false;
  }

  pbMoveFailedAromaVeil(user, target, showMessage = true) {
    if (this.battle.moldBreaker) return false;
    const veil = target.hasActiveAbility('AROMAVEIL') ? target : target.allAllies().find((b) => b.hasActiveAbility('AROMAVEIL'));
    if (!veil) return false;
    if (showMessage) {
      this.battle.pbShowAbilitySplash(veil);
      this.battle.pbDisplay(`No afecta a ${target.pbThis(true)}...`);
      this.battle.pbHideAbilitySplash(veil);
    }
    return true;
  }

  // ---------------------------------------------------------------- daño
  pbCheckDamageAbsorption(user, target) {
    if (target.effects.Substitute > 0 && !this.ignoresSubstitute(user) && (!user || user.index !== target.index)) {
      target.damageState.substitute = true;
      return;
    }
    if (!this.battle.moldBreaker && target.isSpecies('EISCUE') && target.form === 0 && target.ability === 'ICEFACE' && this.physicalMove()) {
      target.damageState.iceFace = true;
      return;
    }
    if (!this.battle.moldBreaker && target.isSpecies('MIMIKYU') && target.form === 0 && target.ability === 'DISGUISE') {
      target.damageState.disguise = true;
    }
  }

  pbReduceDamage(user, target) {
    let damage = target.damageState.calcDamage;
    const ds = target.damageState;
    if (ds.substitute) {
      if (damage > target.effects.Substitute) damage = target.effects.Substitute;
      ds.hpLost = damage;
      ds.totalHPLost += damage;
      return;
    }
    if (ds.disguise || ds.iceFace) return;
    if (damage >= target.hp) {
      damage = target.hp;
      if (this.nonLethal(user, target)) {
        damage -= 1;
      } else if (target.effects.Endure) {
        ds.endured = true;
        damage -= 1;
      } else if (damage === target.totalhp) {
        if (target.hasActiveAbility('STURDY') && !this.battle.moldBreaker) {
          ds.sturdy = true;
          damage -= 1;
        } else if (target.hasActiveItem('FOCUSSASH') && target.hp === target.totalhp) {
          ds.focusSash = true;
          damage -= 1;
        } else if (target.hasActiveItem('FOCUSBAND') && this.battle.pbRandom(100) < 10) {
          ds.focusBand = true;
          damage -= 1;
        }
      }
    }
    if (damage < 0) damage = 0;
    ds.hpLost = damage;
    ds.totalHPLost += damage;
  }

  pbInflictHPDamage(target) {
    if (target.damageState.substitute) {
      target.effects.Substitute -= target.damageState.hpLost;
    } else if (target.damageState.hpLost > 0) {
      target.pbReduceHP(target.damageState.hpLost, false, true, false);
    }
  }

  pbAnimateHitAndHPLost(user, targets) {
    const entries = [];
    for (const side of [0, 1]) {
      for (const b of targets) {
        if (b.damageState.unaffected || b.damageState.hpLost === 0) continue;
        if ((side === 0 && b.opposes(user)) || (side === 1 && !b.opposes(user))) continue;
        let oldHP = b.hp;
        if (!b.damageState.substitute) oldHP += b.damageState.hpLost;
        let effectiveness = 0;
        if (!this.isFixedDamage) {
          if (Effectiveness.resistant(b.damageState.typeMod)) effectiveness = 1;
          else if (Effectiveness.superEffective(b.damageState.typeMod)) effectiveness = 2;
        }
        entries.push({ battler: b.view(), from: oldHP, to: b.hp, effectiveness, substitute: b.damageState.substitute });
      }
    }
    if (entries.length > 0) this.battle.queueEvent('animateDamage', entries);
  }

  pbEffectivenessMessage(user, target, numTargets = 1) {
    if (this.isFixedDamage) return;
    if (target.damageState.disguise || target.damageState.iceFace) return;
    const tm = target.damageState.typeMod;
    if (Effectiveness.superEffective(tm)) {
      this.battle.pbDisplay(numTargets > 1 ? `¡Es supereficaz contra ${target.pbThis(true)}!` : '¡Es supereficaz!');
    } else if (Effectiveness.notVeryEffective(tm)) {
      this.battle.pbDisplay(numTargets > 1 ? `No es muy eficaz contra ${target.pbThis(true)}...` : 'No es muy eficaz...');
    }
  }

  pbHitEffectivenessMessages(user, target, numTargets = 1) {
    const ds = target.damageState;
    if (ds.disguise || ds.iceFace) return;
    if (ds.substitute) this.battle.pbDisplay(`¡El sustituto recibió el daño por ${target.pbThis(true)}!`);
    if (ds.critical) {
      this.battle.pbDisplay(numTargets > 1 ? `¡${target.pbThis()} recibió un golpe crítico!` : '¡Un golpe crítico!');
    }
    if (!this.multiHitMove() && user.effects.ParentalBond === 0) this.pbEffectivenessMessage(user, target, numTargets);
    if (ds.substitute && target.effects.Substitute <= 0) {
      target.effects.Substitute = 0;
      this.battle.pbDisplay(`¡El sustituto de ${target.pbThis(true)} cayó!`);
    }
  }

  pbEndureKOMessage(target) {
    const ds = target.damageState;
    const battle = this.battle;
    if (ds.disguise) {
      battle.pbShowAbilitySplash(target);
      battle.pbDisplay('¡El disfraz ha actuado como señuelo!');
      battle.pbHideAbilitySplash(target);
      target.pbChangeForm(1, `¡El disfraz de ${target.pbThis(true)} se ha roto!`);
      target.pbReduceHP(Math.floor(target.totalhp / 8), false);
    } else if (ds.iceFace) {
      battle.pbShowAbilitySplash(target);
      target.pbChangeForm(1, `¡${target.pbThis()} se transformó!`);
      battle.pbHideAbilitySplash(target);
    } else if (ds.endured) {
      battle.pbDisplay(`¡${target.pbThis()} ha aguantado el golpe!`);
    } else if (ds.sturdy) {
      battle.pbShowAbilitySplash(target);
      battle.pbDisplay(`¡${target.pbThis()} ha aguantado el golpe!`);
      battle.pbHideAbilitySplash(target);
    } else if (ds.focusSash) {
      battle.pbCommonAnimation('UseItem', target);
      battle.pbDisplay(`¡${target.pbThis()} ha usado la Banda Aguante y ha logrado resistir!`);
      target.pbConsumeItem();
    } else if (ds.focusBand) {
      battle.pbCommonAnimation('UseItem', target);
      battle.pbDisplay(`¡${target.pbThis()} ha usado la Cinta Aguante y ha logrado resistir!`);
    }
  }

  /** Registra el daño para Contraataque, Manto Espejo, Venganza, Buena Baza… */
  pbRecordDamageLost(user, target) {
    const damage = target.damageState.hpLost;
    const moveTypeIsPhysical = this.functionCode === 'TypeDependsOnUserIVs' ? false : this.physicalMove();
    if (!target.damageState.substitute) {
      if (moveTypeIsPhysical) {
        target.effects.Counter = damage;
        target.effects.CounterTarget = user.index;
      } else if (this.specialMove()) {
        target.effects.MirrorCoat = damage;
        target.effects.MirrorCoatTarget = user.index;
      }
    }
    if (target.effects.Bide > 0) {
      target.effects.BideDamage += damage;
      target.effects.BideTarget = user.index;
    }
    if (target.isFainted()) target.damageState.fainted = true;
    target.lastHPLost = damage;
    if (damage > 0 && !target.damageState.substitute) target.tookMoveDamageThisRound = true;
    if (damage > 0) target.tookDamageThisRound = true;
    target.lastAttacker.push(user.index);
    if (target.opposes(user)) {
      target.lastHPLostFromFoe = damage;
      target.lastFoeAttacker.push(user.index);
    }
  }
}
