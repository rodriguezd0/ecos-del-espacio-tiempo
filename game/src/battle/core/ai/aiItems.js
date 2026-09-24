// IA: uso de objetos por entrenadores (032_AI/004_AI_UseItem, simplificado).
import { Settings } from '../settings.js';
import { BagItems } from '../items/bagItems.js';

const R = Settings.REBALANCED_HEALING_ITEM_AMOUNTS;
const HP_HEAL = {
  POTION: 20, SUPERPOTION: R ? 60 : 50, HYPERPOTION: R ? 120 : 200, MAXPOTION: 999, BERRYJUICE: 20, SWEETHEART: 20,
  FRESHWATER: R ? 30 : 50, SODAPOP: R ? 50 : 60, LEMONADE: R ? 70 : 80, MOOMOOMILK: 100, ORANBERRY: 10, SITRUSBERRY: 1,
  ENERGYPOWDER: R ? 60 : 50, ENERGYROOT: R ? 120 : 200, FULLRESTORE: 999,
};
const STATUS_CURE = ['AWAKENING', 'CHESTOBERRY', 'ANTIDOTE', 'PECHABERRY', 'BURNHEAL', 'RAWSTBERRY', 'PARALYZEHEAL',
  'CHERIBERRY', 'ICEHEAL', 'ASPEARBERRY', 'FULLHEAL', 'LUMBERRY', 'FULLRESTORE'];
const X_ITEM = /^X(ATTACK|DEFENSE|SPATK|SPDEF|SPEED|ACCURACY)/;

function canUse(battle, item, b) {
  const handler = BagItems[item];
  if (!handler) return false;
  const ctx = { battle, item, pokemon: b.pokemon, battler: b, moveIndex: -1, firstAction: true, showMessages: false, userBattler: b };
  return battle.pbCanUseItemOnPokemon(item, b.pokemon, b, false) && handler.canUse(ctx);
}

/** Si conviene, registra el uso de un objeto del entrenador sobre el combatiente. */
export function chooseItem(ai, b, skill) {
  const battle = ai.battle;
  if (!battle.internalBattle || skill < 16) return false;
  const items = battle.pbGetOwnerItems(b.index);
  if (!items || items.length === 0) return false;
  const usable = [...new Set(items)].filter((i) => canUse(battle, i, b));
  if (usable.length === 0) return false;
  const low = b.hp <= b.totalhp / 4 || (b.hp <= b.totalhp / 2 && battle.pbAIRandom(100) < 30);
  const heals = usable.filter((i) => HP_HEAL[i] && b.hp < b.totalhp);
  if (heals.length && low) {
    const missing = b.totalhp - b.hp;
    heals.sort((x, y) => (HP_HEAL[x] === 1 ? b.totalhp / 4 : HP_HEAL[x]) - (HP_HEAL[y] === 1 ? b.totalhp / 4 : HP_HEAL[y]));
    const pick = heals.find((i) => (HP_HEAL[i] === 1 ? b.totalhp / 4 : HP_HEAL[i]) >= missing * 0.75) || heals[heals.length - 1];
    return battle.pbRegisterItem(b.index, pick, b.pokemonIndex, -1);
  }
  const cures = usable.filter((i) => STATUS_CURE.includes(i));
  if (cures.length && (['SLEEP', 'FROZEN'].includes(b.status) || (b.status !== 'NONE' && battle.pbAIRandom(100) < 40))) {
    return battle.pbRegisterItem(b.index, cures[0], b.pokemonIndex, -1);
  }
  const xs = usable.filter((i) => X_ITEM.test(i));
  if (xs.length && b.turnCount <= 1 && b.hp > b.totalhp * 0.6 && battle.pbAIRandom(100) < 30) {
    return battle.pbRegisterItem(b.index, xs[0], b.pokemonIndex, -1);
  }
  return false;
}
