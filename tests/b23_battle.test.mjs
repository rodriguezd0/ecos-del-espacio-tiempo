import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, mon, play } from './battle_helpers.mjs';
import { megaFormFor } from '../game/src/battle/core/pokemonUtil.js';
import { GameState } from '../game/src/core/state.js';
import { hoopaRequest } from '../game/src/content/events/b23_hoopa.js';
import { pokemonFromSpec } from '../game/src/battle/scene/setup.js';

globalThis.location ??= { search: '' };
const { createContext } = await import('../game/src/script/context.js');
const { engine } = await import('../game/src/core/engine.js');

test('Almenara: la Zygardita responde a la Forma Completa y respeta las otras formas', () => {
  for (const form of [0, 1]) assert.equal(megaFormFor(db, mon('ZYGARDE', 80, ['THOUSANDARROWS'], { form, heldItem: 'ZYGARDITE' })), 0);
  assert.equal(megaFormFor(db, mon('ZYGARDE', 80, ['THOUSANDARROWS'], { form: 2, heldItem: 'ZYGARDITE' })), 4);
});

test('Almenara: una megaevolución real queda en el resultado después de volver a la forma original', async () => {
  const { result, ui } = await play({ type: 'wild',
    player: { party: [mon('ZYGARDE', 80, ['THOUSANDARROWS'], { form: 2, heldItem: 'ZYGARDITE' })] },
    opponent: { party: [mon('RATTATA', 3, ['TAILWHIP'])] },
  }, { script: [{ action: 'fight', move: 'THOUSANDARROWS', mega: true }] });
  assert.ok(ui.events.some((e) => e.type === 'changeForm' && e.species === 'ZYGARDE' && e.form === 4));
  assert.equal(result.outcome, 'win');
  assert.equal(result.playerParty[0].form, 2);
  assert.deepEqual(result.megaEvolutions, [{ species: 'ZYGARDE', form: 4, side: 0, owner: 0, partyIndex: 0 }]);
});

test('Hoopa: el motor bloquea una Ball antes de Mega sin gastarla ni avanzar de turno', async () => {
  const s = GameState.create(); s.addKeyItem('PRISONBOTTLE'); const request = hoopaRequest(s);
  const { battle, ui, stopped } = await play({ type: 'wild', rules: request.rules,
    player: { party: [mon('ZYGARDE', 100, ['SPLASH'], { form: 2, heldItem: 'ZYGARDITE' })], bag: { MASTERBALL: 1 } },
    opponent: { party: [pokemonFromSpec(db, request.wild)] },
  }, { script: [{ action: 'item', item: 'MASTERBALL' }], stopAfterScript: true });
  assert.ok(stopped); assert.equal(battle.bag.MASTERBALL, 1); assert.equal(battle.turnCount, 0);
  assert.ok(ui.messages.some(m => /Primero debes calmarlo con Mega Zygarde/.test(m)));
  assert.ok(!ui.events.some(e => e.type === 'throwBall'));
});

test('Hoopa: una Mega real permite capturarlo desatado y después vuelve al Pokémon a su forma inicial', async () => {
  const s = GameState.create(); s.addKeyItem('PRISONBOTTLE'); const request = hoopaRequest(s);
  const { result } = await play({ type: 'wild', rules: request.rules,
    player: { party: [mon('ZYGARDE', 100, ['SPLASH'], { form: 2, heldItem: 'ZYGARDITE' })], bag: { MASTERBALL: 1 } },
    opponent: { party: [pokemonFromSpec(db, { ...request.wild, moves: ['SPLASH'] })] },
  }, { script: [{ action: 'fight', move: 'SPLASH', mega: true }, { action: 'item', item: 'MASTERBALL' }] });
  assert.equal(result.outcome, 'caught'); assert.equal(result.caught.species, 'HOOPA'); assert.equal(result.caught.form, 1);
  assert.equal(result.bag.MASTERBALL, undefined); assert.equal(result.playerParty[0].form, 2);
  assert.ok(result.megaEvolutions.some(m => m.species === 'ZYGARDE' && m.side === 0));
});

test('los guiones pueden consultar el resultado completo y battle conserva su respuesta habitual', async () => {
  const previousState = engine.state, previousData = engine.data;
  engine.state = GameState.create(); engine.data = db;
  try {
    const result = { outcome: 'win', turns: 7, megaEvolutions: [{ species: 'ZYGARDE', side: 0 }] };
    const seen = [];
    const ctx = createContext({ world: {}, startBattle: async (config) => { seen.push(config); return result; } });
    assert.equal(await ctx.battle({ trainer: 'a' }), 'win');
    assert.equal(await ctx.battleResult({ trainer: 'b' }), result);
    assert.deepEqual(seen, [{ trainer: 'a' }, { trainer: 'b' }]);
  } finally { engine.state = previousState; engine.data = previousData; }
});
