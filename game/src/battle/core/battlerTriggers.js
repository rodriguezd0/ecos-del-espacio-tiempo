// Battler: efectos al golpear y tras usar un movimiento (029_Battler/011).
import { Battler } from './battler.js';
import { AbilityEffects } from './abilities/registry.js';
import { ItemEffects } from './items/registry.js';

Object.assign(Battler.prototype, {
  /** Efectos por golpe (Elec. Estática, Casco Dentado, Furia…). */
  pbEffectsOnMakingHit(move, user, target) {
    const battle = this.battle;
    if (target.damageState.calcDamage > 0 && !target.damageState.substitute) {
      if (target.abilityActive(true)) {
        const oldHP = user.hp;
        AbilityEffects.triggerOnBeingHit(target.ability, user, target, move, battle);
        if (user.hp < oldHP) user.pbItemHPHealCheck();
      }
      if (user.abilityActive(true)) {
        AbilityEffects.triggerOnDealingHit(user.ability, user, target, move, battle);
        user.pbItemHPHealCheck();
      }
      if (target.itemActive(true)) {
        const oldHP = user.hp;
        ItemEffects.triggerOnBeingHit(target.item, user, target, move, battle);
        if (user.hp < oldHP) user.pbItemHPHealCheck();
      }
    }
    if (target.opposes(user)) {
      if (target.effects.Rage && !target.isFainted() && target.pbCanRaiseStatStage('ATTACK', target)) {
        battle.pbDisplay(`¡La furia de ${target.pbThis(true)} está aumentando!`);
        target.pbRaiseStatStage('ATTACK', 1, target);
      }
      if (target.effects.BeakBlast && move.pbContactMove(user) && user.affectedByContactEffect() && user.pbCanBurn(target, false)) {
        user.pbBurn(target);
      }
      if (target.effects.ShellTrap && move.physicalMove() && battle.choices[target.index].action === 'UseMove' &&
          !target.movedThisRound() && target.damageState.hpLost > 0 && !target.damageState.substitute) {
        target.tookPhysicalHit = true;
        target.effects.MoveNext = true;
        target.effects.Quash = 0;
      }
      if (target.effects.Grudge && target.isFainted()) {
        user.pbSetPP(move, 0);
        battle.pbDisplay(`¡${move.name} de ${user.pbThis(true)} perdió todos sus PP debido a Rabia!`);
      }
      if (target.effects.DestinyBond && target.isFainted() && user.effects.DestinyBondTarget < 0) {
        user.effects.DestinyBondTarget = target.index;
      }
    }
    if (target.damageState.calcDamage > 0 && !target.damageState.substitute) battle.pbAddRageHit(target);
  },

  /** Efectos tras todos los golpes (Vidasfera, Botón Escape, Ida y Vuelta…). */
  async pbEffectsAfterMove(user, targets, move, numHits) {
    const battle = this.battle;
    if (move.calcType === 'ELECTRIC') user.effects.Charge = 0;
    if (move.damagingMove()) {
      if (user.status === 'FROSTBITE' && move.thawsUser()) {
        user.pbCureStatus(false);
        battle.pbDisplay(`¡${user.pbThis()} ha entrado en calor!`);
      }
      for (const b of targets) {
        if (b.damageState.unaffected || b.damageState.substitute) continue;
        if (b.status === 'FROSTBITE' && move.thawsUser()) b.pbCureStatus();
        if (b.status === 'FROZEN' && (move.calcType === 'FIRE' || move.thawsUser())) b.pbCureStatus();
      }
    }
    if (user.effects.DestinyBondTarget >= 0 && !user.isFainted()) {
      const name = battle.battlers[user.effects.DestinyBondTarget].pbThis();
      battle.pbDisplay(`¡${name} se llevó a su rival!`);
      user.pbReduceHP(user.hp, false);
      user.pbItemHPHealCheck();
      user.pbFaint();
    }
    const switched = [];
    if (user.abilityActive()) await AbilityEffects.triggerOnEndOfUsingMove(user.ability, user, targets, move, battle, switched);
    if (!user.isFainted() && !user.effects.Transform && !battle.pbAllFainted(user.idxOpposingSide())) {
      if (user.isSpecies('CRAMORANT') && user.ability === 'GULPMISSILE' && user.form === 0 &&
          ((move.id === 'SURF' && numHits > 0) || (move.id === 'DIVE' && move.chargingTurn))) {
        user.pbChangeForm(user.hp > Math.floor(user.totalhp / 2) ? 1 : 2, null);
      }
    }
    if (move.functionCode === 'StartSlowerBattlersActFirst' && battle.field.effects.TrickRoom > 0) {
      for (const b of battle.allBattlers()) {
        if (!b.hasActiveItem('ROOMSERVICE') || !b.pbCanLowerStatStage('SPEED')) continue;
        battle.pbCommonAnimation('UseItem', b);
        b.pbLowerStatStage('SPEED', 1, null);
        b.pbConsumeItem();
      }
    }
    if (user.effects.GemConsumed) user.pbConsumeItem();
    await move.pbSwitchOutTargetEffect(user, targets, numHits, switched);
    if (!(user.hasActiveAbility('SHEERFORCE') && move.addlEffect > 0)) {
      await this.pbEffectsAfterMove2(user, targets, move, numHits, switched);
    }
    if (!switched.includes(user.index)) await move.pbEndOfMoveUsageEffect(user, targets, numHits, switched);
    if (!(user.hasActiveAbility('SHEERFORCE') && move.addlEffect > 0)) {
      await this.pbEffectsAfterMove3(user, targets, move, numHits, switched);
    }
    if (numHits > 0) for (const b of battle.allBattlers()) b.pbItemEndOfMoveCheck();
  },

  async pbEffectsAfterMove2(user, targets, move, numHits, switched) {
    const battle = this.battle;
    for (const b of battle.pbPriority(true)) {
      if (targets.some((t) => t.index === b.index) && !b.damageState.unaffected && b.damageState.calcDamage > 0 && b.itemActive()) {
        await ItemEffects.triggerAfterMoveUseFromTarget(b.item, b, user, move, switched, battle);
      }
      if (switched.length === 0 && b.index !== user.index && b.pbItemOnStatDropped(user)) switched.push(b.index);
    }
    await battle.pbProcessPendingReplacements();
    if (!switched.includes(user.index) && user.itemActive()) {
      ItemEffects.triggerAfterMoveUseFromUser(user.item, user, targets, move, numHits, battle);
    }
    for (const b of battle.pbPriority(true)) {
      if (targets.some((t) => t.index === b.index) && !b.damageState.unaffected && !switched.includes(b.index) && b.abilityActive()) {
        AbilityEffects.triggerAfterMoveUseFromTarget(b.ability, b, user, move, switched, battle);
      }
      if (switched.length === 0 && move.damagingMove() && b.index !== user.index && b.pbAbilitiesOnDamageTaken(user)) {
        switched.push(b.index);
      }
    }
    await battle.pbProcessPendingReplacements();
  },

  async pbEffectsAfterMove3(user, targets, move, numHits, switched) {
    if (switched.length === 0 && user.pbItemOnStatDropped(user)) switched.push(user.index);
    if (switched.length === 0 && move.damagingMove() && user.pbAbilitiesOnDamageTaken(user)) switched.push(user.index);
    await this.battle.pbProcessPendingReplacements();
  },
});
