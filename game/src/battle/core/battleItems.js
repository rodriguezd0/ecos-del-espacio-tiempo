// Battle: uso de objetos de la mochila (028_Battle/007 y menú de la fase de comandos).
import { Battle } from './battle.js';
import { BagItems } from './items/bagItems.js';

const MAX_ITEM_ATTEMPTS = 25;

Object.assign(Battle.prototype, {
  pbItemUsesAllActions(item) { return this.isPokeBall(item); },

  bagQty(item) { return this.bag[item] || 0; },

  pbConsumeItemInBag(item, idxBattler) {
    if (!item) return;
    if (this.pbOwnedByPlayer(idxBattler)) {
      if (!this.bag[item]) throw new Error(`Se intentó consumir ${item}, que no está en la mochila`);
      this.bag[item] -= 1;
      if (this.bag[item] <= 0) delete this.bag[item];
      this.itemsUsed[item] = (this.itemsUsed[item] || 0) + 1;
    } else {
      const items = this.pbGetOwnerItems(idxBattler);
      const i = items.indexOf(item);
      if (i >= 0) items.splice(i, 1);
    }
  },

  pbReturnUnusedItemToBag(item, idxBattler) {
    if (!item) return;
    if (this.pbOwnedByPlayer(idxBattler)) {
      this.bag[item] = (this.bag[item] || 0) + 1;
      this.itemsUsed[item] = Math.max(0, (this.itemsUsed[item] || 0) - 1);
      if (this.itemsUsed[item] === 0) delete this.itemsUsed[item];
    } else {
      this.pbGetOwnerItems(idxBattler).push(item);
    }
  },

  pbRegisterItem(idxBattler, item, target = -1, idxMove = -1) {
    this.choices[idxBattler] = { action: 'UseItem', item, itemTarget: target, itemMove: idxMove, move: null, target: -1, priority: 0 };
    this.pbConsumeItemInBag(item, idxBattler);
    return true;
  },

  pbCanUseItemOnPokemon(item, pkmn, battler, showMessages = true) {
    if (!pkmn || pkmn.egg) {
      if (showMessages) this.pbDisplay('No tendrá ningún efecto.');
      return false;
    }
    if (battler && battler.effects.Embargo > 0) {
      if (showMessages) this.pbDisplay(`¡El efecto de Embargo impide usar objetos en ${battler.pbThis(true)}!`);
      return false;
    }
    return true;
  },

  itemContext(item, userBattler, target, idxMove, firstAction, showMessages) {
    const data = this.itemData(item);
    const use = data ? data.battleUse : null;
    let pokemon = null;
    let battler = null;
    if (use === 'OnPokemon' || use === 'OnMove' || use === 'OnBattler') {
      pokemon = this.pbParty(userBattler.index)[target] || null;
      battler = pokemon ? this.pbFindBattler(target, userBattler.index) : null;
    } else if (use === 'Direct') {
      battler = userBattler;
      pokemon = userBattler.pokemon;
    }
    return { battle: this, item, pokemon, battler, moveIndex: idxMove, firstAction, showMessages, userBattler };
  },

  /** Valida el uso de un objeto (antes de registrarlo). */
  pbCanUseItemInBattle(item, userBattler, target, idxMove, firstAction, showMessages = true) {
    const data = this.itemData(item);
    if (!data || !data.battleUse) {
      if (showMessages) this.pbDisplay('No se puede usar ese objeto ahora.');
      return false;
    }
    if (this.isPokeBall(item)) return this.pbCanThrowBall(item, userBattler, firstAction, showMessages);
    const handler = BagItems[item];
    if (!handler) {
      if (showMessages) this.pbDisplay('No se puede usar ese objeto ahora.');
      return false;
    }
    const ctx = this.itemContext(item, userBattler, target, idxMove, firstAction, showMessages);
    if (data.battleUse === 'OnBattler' && !ctx.battler) {
      if (showMessages) this.pbDisplay('Ese objeto solo puede usarse con un Pokémon en combate.');
      return false;
    }
    if (data.battleUse !== 'Direct' && !this.pbCanUseItemOnPokemon(item, ctx.pokemon, ctx.battler, showMessages)) return false;
    return handler.canUse(ctx);
  },

  /** Menú de mochila del jugador en la fase de comandos. */
  async pbItemMenu(idxBattler, firstAction) {
    if (!this.internalBattle) {
      this.pbDisplay('Aquí no se pueden usar objetos.');
      return false;
    }
    const b = this.battlers[idxBattler];
    for (let attempt = 0; attempt < MAX_ITEM_ATTEMPTS; attempt++) {
      const bag = Object.entries(this.bag).filter(([id, q]) => q > 0 && this.itemData(id) && this.itemData(id).battleUse)
        .map(([id, qty]) => ({ id, qty, name: this.itemName(id), battleUse: this.itemData(id).battleUse, pocket: this.itemData(id).pocket }));
      const res = await this.ask('chooseItem', b.view(), { bag, party: this.partyOptions(idxBattler), firstAction });
      if (!res || !res.item) return false;
      const item = res.item;
      if (this.bagQty(item) <= 0) {
        this.pbDisplay('No te queda ese objeto.');
        continue;
      }
      const target = res.target ?? b.pokemonIndex;
      const idxMove = res.move ?? -1;
      if (!this.pbCanUseItemInBattle(item, b, target, idxMove, firstAction, true)) continue;
      return this.pbRegisterItem(idxBattler, item, target, idxMove);
    }
    return false;
  },

  pbUseItemMessage(item, trainerName) {
    this.pbDisplayBrief(`${trainerName} ha usado ${this.itemName(item)}.`);
  },

  /** Ejecuta la elección UseItem en la fase de ataque. */
  async pbUseItemChoice(userBattler, ch) {
    const item = ch.item;
    const data = this.itemData(item);
    if (this.isPokeBall(item)) {
      ch.item = null;
      await this.pbThrowPokeBall(userBattler.index, item);
      return;
    }
    const handler = BagItems[item];
    const trainerName = this.pbOwnedByPlayer(userBattler.index) ? this.player[0].name : this.pbGetOwnerName(userBattler.index);
    this.pbUseItemMessage(item, trainerName);
    const ctx = this.itemContext(item, userBattler, ch.itemTarget, ch.itemMove, true, true);
    if (!handler || (data.battleUse === 'OnBattler' && !ctx.battler)) {
      this.pbDisplay('¡Pero no tuvo efecto!');
      this.pbReturnUnusedItemToBag(item, userBattler.index);
      ch.item = null;
      return;
    }
    if (handler.canUse({ ...ctx, showMessages: false })) {
      handler.use(ctx);
      if (ctx.battler) {
        this.queueRefresh(ctx.battler);
        if (data.battleUse === 'OnBattler') ctx.battler.pbItemOnStatDropped();
      }
      ch.item = null;
      return;
    }
    this.pbDisplay('¡Pero no tuvo efecto!');
    this.pbReturnUnusedItemToBag(item, userBattler.index);
    ch.item = null;
  },
});
