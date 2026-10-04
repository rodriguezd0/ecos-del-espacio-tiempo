import test from 'node:test';
import assert from 'node:assert/strict';
import { db } from './battle_helpers.mjs';
import { canToss, canSell, BAG_FILTERS, isKeyItem, showsQuantity } from '../game/src/ui/logic/bagLogic.js';
test('las reliquias de encuentros únicos se pueden equipar pero no tirar ni vender', () => {
  for (const id of ['BLUEORB', 'REDORB', 'SOULDEW', 'GRISEOUSORB', 'ADAMANTORB', 'LUSTROUSORB', 'ZYGARDITE']) {
    const item = db.items[id]; assert.ok(item, id);
    assert.equal(canToss(item), false, `${id}: tirar`);
    assert.equal(canSell(item), false, `${id}: vender`);
    assert.equal(isKeyItem(item), false, `${id}: sigue siendo equipable`);
    assert.equal(BAG_FILTERS.holdable(item), true, `${id}: dar al Pokémon`);
  }
});

test('los cinco engranajes de Magearna conservan cantidad y no se pueden perder tirándolos', async () => {
  const { db: completeDb } = await import('./b18_helpers.mjs');
  const item = completeDb.items.ANCIENTGEAR;
  assert.equal(canToss(item), false); assert.equal(canSell(item), false);
  assert.equal(isKeyItem(item), false); assert.equal(showsQuantity(item), true);
});
