import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { applyCoopResult } from '../game/src/net/coopBattle.js';
import { db } from './battle_helpers.mjs';

function levelUp(species, role, { time, hour, ...options }) {
  const state = GameState.create({name: 'Ana'});
  state.data.clock.minutes = hour * 60;
  const before = createPokemon(db, species, 10, {rng: () => 0.5, ...options});
  state.addPokemon(before);
  const grown = {...before, level: 11, happiness: options.happiness ?? before.happiness};
  const result = { [role === 'host' ? 'playerParty' : 'allyParty']: [grown] };
  const {evolutions} = applyCoopResult(state, db, { result, role, slots: [0], levelsBefore: [10], time });
  assert.equal(state.party[0].level, 11);
  return evolutions;
}

for (const role of ['host', 'guest']) {
  test(`cooperativo ${role}: Eevee usa el horario del combate aunque el reloj local sea distinto`, () => {
    assert.deepEqual(levelUp('EEVEE', role, {time: 'day', hour: 22, happiness: 255}), [{index: 0, species: 'ESPEON'}]);
    assert.deepEqual(levelUp('EEVEE', role, {time: 'night', hour: 12, happiness: 255}), [{index: 0, species: 'UMBREON'}]);
  });

  test(`cooperativo ${role}: Happiny con Piedra Oval evoluciona de día y espera de noche`, () => {
    assert.deepEqual(levelUp('HAPPINY', role, {time: 'day', hour: 22, heldItem: 'OVALSTONE'}), [{index: 0, species: 'CHANSEY'}]);
    assert.deepEqual(levelUp('HAPPINY', role, {time: 'night', hour: 12, heldItem: 'OVALSTONE'}), []);
    assert.deepEqual(levelUp('HAPPINY', role, {time: 'day', hour: 12}), []);
  });
}

test('aplicar un resultado sin horario explícito conserva el horario de la partida', () => {
  assert.deepEqual(levelUp('EEVEE', 'host', {hour: 12, happiness: 255}), [{index: 0, species: 'ESPEON'}]);
  assert.deepEqual(levelUp('EEVEE', 'guest', {hour: 22, happiness: 255}), [{index: 0, species: 'UMBREON'}]);
});
