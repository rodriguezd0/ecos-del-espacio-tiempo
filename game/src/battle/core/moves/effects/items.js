// Efectos de movimientos relacionados con objetos (030_Move/012_MoveEffects_Items).
import { Move } from '../move.js';
import { StatUpMove } from '../baseEffects.js';
import { registerMoves } from '../registry.js';
import { ItemEffects } from '../../items/registry.js';

const failMsg = (battle) => battle.pbDisplay('¡Pero ha fallado!');
const stickyHold = (move, target) => target.hasActiveAbility('STICKYHOLD') && !move.battle.moldBreaker;
const isGem = (battle, item) => battle.itemHasFlag(item, 'TypeGem');

function stickyHoldMessage(move, target, show) {
  if (!show) return;
  move.battle.pbShowAbilitySplash(target);
  move.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
  move.battle.pbHideAbilitySplash(target);
}

class UserTakesTargetItem extends Move {
  pbEffectAfterAllHits(user, target) {
    const battle = this.battle;
    if (user.wild() || user.isFainted()) return;
    if (target.damageState.unaffected || target.damageState.substitute) return;
    if (!target.item || (user.item && !target.wild())) return;
    if (target.unlosableItem(target.item) || user.unlosableItem(target.item)) return;
    if (stickyHold(this, target)) return;
    const item = target.item;
    const itemName = target.itemName();
    if (!target.wild()) user.item = item;
    if (target.wild() && item === target.initialItem) {
      // Gen 9 (Añil): los objetos robados a Pokémon salvajes van a la mochila.
      battle.bag[item] = (battle.bag[item] || 0) + 1;
      target.pbRemoveItem();
      battle.pbDisplay(`¡${user.pbThis()} robó ${itemName} a ${target.pbThis(true)}! ¡El objeto está en la mochila!`);
    } else {
      target.pbRemoveItem(false);
      battle.pbDisplay(`¡${user.pbThis()} robó ${itemName} a ${target.pbThis(true)}!`);
    }
    user.pbHeldItemTriggerCheck();
  }
}

class TargetTakesUserItem extends Move {
  ignoresSubstitute() { return true; }
  pbMoveFailed(user) {
    if (!user.item || user.unlosableItem(user.item)) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if (target.item || target.unlosableItem(user.item)) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    const itemName = user.itemName();
    target.item = user.item;
    if (user.wild() && !target.initialItem && user.item === user.initialItem) {
      target.setInitialItem(user.item);
      user.pbRemoveItem();
    } else {
      user.pbRemoveItem(false);
    }
    this.battle.pbDisplay(`¡${target.pbThis()} ha recibido ${itemName} de ${user.pbThis(true)}!`);
    target.pbHeldItemTriggerCheck();
  }
}

const keepsChoiceLock = (b) => b.hasActiveAbility('GORILLATACTICS') || b.hasActiveAbility('PODERSABIO');

class UserTargetSwapItems extends Move {
  pbMoveFailed(user) {
    if (user.wild()) { failMsg(this.battle); return true; }
    return false;
  }
  pbFailsAgainstTarget(user, target, show) {
    if ((!user.item && !target.item) || target.unlosableItem(target.item) || target.unlosableItem(user.item) ||
        user.unlosableItem(user.item) || user.unlosableItem(target.item)) {
      if (show) failMsg(this.battle);
      return true;
    }
    if (stickyHold(this, target)) {
      stickyHoldMessage(this, target, show);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    const oldUserItem = user.item;
    const oldUserItemName = user.itemName();
    const oldTargetItem = target.item;
    const oldTargetItemName = target.itemName();
    user.item = oldTargetItem;
    if (!keepsChoiceLock(user)) user.effects.ChoiceBand = null;
    if (user.hasActiveAbility('UNBURDEN')) user.effects.Unburden = !user.item && !!oldUserItem;
    target.item = oldUserItem;
    if (!keepsChoiceLock(target)) target.effects.ChoiceBand = null;
    if (target.hasActiveAbility('UNBURDEN')) target.effects.Unburden = !target.item && !!oldTargetItem;
    if (target.wild() && !user.initialItem && oldTargetItem === target.initialItem) user.setInitialItem(oldTargetItem);
    this.battle.pbDisplay(`¡${user.pbThis()} cambió objetos con su oponente!`);
    if (oldTargetItem) this.battle.pbDisplay(`${user.pbThis()} obtuvo ${oldTargetItemName}.`);
    if (oldUserItem) this.battle.pbDisplay(`${target.pbThis()} obtuvo ${oldUserItemName}.`);
    user.pbHeldItemTriggerCheck();
    target.pbHeldItemTriggerCheck();
  }
}

class RestoreUserConsumedItem extends Move {
  canSnatch() { return true; }
  pbMoveFailed(user) {
    if (!user.recycleItem || user.item) { failMsg(this.battle); return true; }
    return false;
  }
  pbEffectGeneral(user) {
    const item = user.recycleItem;
    user.item = item;
    if (this.battle.wildBattle() && !user.initialItem) user.setInitialItem(item);
    user.setRecycleItem(null);
    user.effects.PickupItem = null;
    user.effects.PickupUse = 0;
    this.battle.pbDisplay(`¡${user.pbThis()} encontró ${this.battle.itemName(item)}!`);
    user.pbHeldItemTriggerCheck();
  }
}

class RemoveTargetItem extends Move {
  pbBaseDamage(bd, user, target) {
    if (target.item && !target.unlosableItem(target.item)) return Math.round(bd * 1.5);
    return bd;
  }
  pbEffectAfterAllHits(user, target) {
    if (user.wild() || user.isFainted()) return;
    if (target.damageState.unaffected || target.damageState.substitute) return;
    if (!target.item || target.unlosableItem(target.item) || stickyHold(this, target)) return;
    const itemName = target.itemName();
    target.pbRemoveItem(false);
    this.battle.pbDisplay(`¡${target.pbThis()} dejó caer su ${itemName}!`);
  }
}

class DestroyTargetBerryOrGem extends Move {
  pbEffectWhenDealingDamage(user, target) {
    if (target.damageState.substitute || target.damageState.berryWeakened) return;
    if (!target.item || (!this.battle.isBerry(target.item) && !isGem(this.battle, target.item))) return;
    if (target.unlosableItem(target.item) || stickyHold(this, target)) return;
    const itemName = target.itemName();
    target.pbRemoveItem();
    this.battle.pbDisplay(`¡${itemName} de ${target.pbThis(true)} ha sido incinerado!`);
  }
}

class CorrodeTargetItem extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (!target.item || target.unlosableItem(target.item) || target.effects.Substitute > 0 ||
        this.battle.corrosiveGas[target.index % 2][target.pokemonIndex]) {
      if (show) this.battle.pbDisplay(`¡No afecta a ${target.pbThis(true)}!`);
      return true;
    }
    if (stickyHold(this, target)) {
      stickyHoldMessage(this, target, show);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    this.battle.corrosiveGas[target.index % 2][target.pokemonIndex] = true;
    this.battle.pbDisplay(`¡${user.pbThis()} ha corroído ${target.itemName()} de ${target.pbThis(true)}!`);
  }
}

class StartTargetCannotUseItem extends Move {
  canMagicCoat() { return true; }
  pbFailsAgainstTarget(user, target, show) {
    if (target.effects.Embargo > 0) {
      if (show) failMsg(this.battle);
      return true;
    }
    return false;
  }
  pbEffectAgainstTarget(user, target) {
    target.effects.Embargo = 5;
    this.battle.pbDisplay(`¡${target.pbThis()} no puede usar objetos!`);
  }
}

class StartNegateHeldItems extends Move {
  pbEffectGeneral() {
    const f = this.battle.field.effects;
    if (f.MagicRoom > 0) {
      f.MagicRoom = 0;
      this.battle.pbDisplay('¡El área ha vuelto a la normalidad!');
    } else {
      f.MagicRoom = 5;
      this.battle.pbDisplay('¡Se ha creado un espacio en el que los efectos de los objetos desaparecen!');
    }
  }
  pbShowAnimation(id, user, targets, hitNum = 0, showAnimation = true) {
    if (this.battle.field.effects.MagicRoom > 0) return;
    super.pbShowAnimation(id, user, targets, hitNum, showAnimation);
  }
}

class UserConsumeBerryRaiseDefense2 extends StatUpMove {
  constructor(...a) { super(...a); this.statUp = ['DEFENSE', 2]; }
  hasBerry(user) { return !!user.item && this.battle.isBerry(user.item) && user.itemActive(); }
  pbCanChooseMove(user, commandPhase, showMessages) {
    if (this.hasBerry(user)) return true;
    if (showMessages) {
      const msg = `¡${user.pbThis()} no puede usar este movimiento porque no lleva una baya!`;
      if (commandPhase) this.battle.pbDisplayPaused(msg);
      else this.battle.pbDisplay(msg);
    }
    return false;
  }
  pbMoveFailed(user, targets) {
    if (!this.hasBerry(user)) { failMsg(this.battle); return true; }
    return super.pbMoveFailed(user, targets);
  }
  pbEffectGeneral(user) {
    super.pbEffectGeneral(user);
    this.battle.pbDisplay(`¡${user.pbThis()} consumió su ${user.itemName()}!`);
    const item = user.item;
    user.pbConsumeItem(true, false);
    user.pbHeldItemTriggerCheck(item, false);
  }
}

class AllBattlersConsumeBerry extends Move {
  hasBerry(b) { return !!b.item && this.battle.isBerry(b.item) && !b.semiInvulnerable(); }
  pbMoveFailed(user, targets) {
    if (!targets.some((b) => this.hasBerry(b))) {
      this.battle.pbDisplay('¡Pero no ocurrió nada!');
      return true;
    }
    return false;
  }
  pbOnStartUse() { this.battle.pbDisplay('¡Es hora del té! A comer bayas se ha dicho.'); }
  pbFailsAgainstTarget(user, target) { return !this.hasBerry(target); }
  pbEffectAgainstTarget(user, target) {
    this.battle.pbCommonAnimation('EatBerry', target);
    const item = target.item;
    target.pbConsumeItem(true, false);
    target.pbHeldItemTriggerCheck(item, false);
  }
}

class UserConsumeTargetBerry extends Move {
  preventsBattlerConsumingHealingBerry(battler, targets) {
    return targets.some((b) => b.index === battler.index) && !!battler.item && this.battle.isBerry(battler.item) &&
      ItemEffects.HPHeal.has(battler.item);
  }
  pbEffectAfterAllHits(user, target) {
    if (user.isFainted() || target.isFainted()) return;
    if (target.damageState.unaffected || target.damageState.substitute) return;
    if (!target.item || !this.battle.isBerry(target.item) || target.unlosableItem(target.item)) return;
    if (stickyHold(this, target)) return;
    const item = target.item;
    const itemName = target.itemName();
    user.setBelched();
    target.pbRemoveItem();
    this.battle.pbDisplay(`¡${user.pbThis()} robó y se comió ${itemName} de su objetivo!`);
    user.pbHeldItemTriggerCheck(item, false);
    user.pbSymbiosis();
  }
}

function flingPower(battle, item) {
  const d = battle.itemData(item);
  const flag = d && (d.flags || []).find((f) => /^Fling_\d+$/i.test(f));
  return flag ? Math.max(Number(flag.split('_')[1]), 10) : null;
}

class ThrowUserItemAtTarget extends Move {
  pbCheckFlingSuccess(user) {
    this.willFail = !user.item || !user.itemActive() || user.unlosableItem(user.item) ||
      (this.battle.isBerry(user.item) && !user.canConsumeBerry()) || flingPower(this.battle, user.item) == null;
  }
  pbMoveFailed() {
    if (this.willFail) { failMsg(this.battle); return true; }
    return false;
  }
  pbDisplayUseMessage(user) {
    super.pbDisplayUseMessage(user);
    this.pbCheckFlingSuccess(user);
    if (!this.willFail) this.battle.pbDisplay(`¡${user.pbThis()} tiró su ${user.itemName()}!`);
  }
  pbNumHits() { return 1; }
  pbBaseDamage(bd, user) {
    if (!user.item) return 0;
    return flingPower(this.battle, user.item) ?? 10;
  }
  pbEffectAgainstTarget(user, target) {
    if (target.damageState.substitute || target.hasActiveItem('COVERTCLOAK')) return;
    if (target.hasActiveAbility('SHIELDDUST') && !this.battle.moldBreaker) return;
    switch (user.item) {
      case 'POISONBARB': if (target.pbCanPoison(user, false, this)) target.pbPoison(user); break;
      case 'TOXICORB': if (target.pbCanPoison(user, false, this)) target.pbPoison(user, null, true); break;
      case 'FLAMEORB': if (target.pbCanBurn(user, false, this)) target.pbBurn(user); break;
      case 'LIGHTBALL': if (target.pbCanParalyze(user, false, this)) target.pbParalyze(user); break;
      case 'KINGSROCK': case 'RAZORFANG': target.pbFlinch(user); break;
      default: target.pbHeldItemTriggerCheck(user.item, true);
    }
    if (this.battle.isBerry(user.item)) target.setBelched();
  }
  pbEndOfMoveUsageEffect(user) {
    if (user.item) user.pbConsumeItem(true, true, false);
  }
}

registerMoves({
  UserTakesTargetItem,
  TargetTakesUserItem,
  UserTargetSwapItems,
  RestoreUserConsumedItem,
  RemoveTargetItem,
  DestroyTargetBerryOrGem,
  CorrodeTargetItem,
  StartTargetCannotUseItem,
  StartNegateHeldItems,
  UserConsumeBerryRaiseDefense2,
  AllBattlersConsumeBerry,
  UserConsumeTargetBerry,
  ThrowUserItemAtTarget,
});
