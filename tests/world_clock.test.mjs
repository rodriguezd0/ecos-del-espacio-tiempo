import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';

globalThis.location ||= { search: '' };
const { default: MapScene, CLOCK_FRAMES_PER_MINUTE } = await import('../game/src/world/mapScene.js');

test('el cambio de hora actualiza páginas diurnas/nocturnas sin salir del mapa, incluido medianoche', () => {
  for (const minute of [5 * 60 + 59, 19 * 60 + 59, 23 * 60 + 59]) {
    const state = GameState.create({ name: 'Reloj' }); state.data.clock.minutes = minute;
    let refresh = 0;
    const scene = { state, clockFrames: CLOCK_FRAMES_PER_MINUTE - 1,
      world: { scriptBusy: () => false, requestRefresh: () => refresh++ } };
    MapScene.prototype.tickClock.call(scene);
    assert.equal(state.data.clock.minutes, (minute + 1) % 1440);
    assert.equal(refresh, 1, 'actualiza encuentros de la nueva hora');
  }
});

test('el reloj espera durante guiones y no reconstruye eventos en cada minuto de la misma hora', () => {
  const state = GameState.create({ name: 'Reloj' }); state.data.clock.minutes = 12 * 60;
  let refresh = 0, busy = true;
  const scene = { state, clockFrames: CLOCK_FRAMES_PER_MINUTE - 1,
    world: { scriptBusy: () => busy, requestRefresh: () => refresh++ } };
  MapScene.prototype.tickClock.call(scene); assert.equal(state.hour, 12); assert.equal(scene.clockFrames, 59);
  busy = false; MapScene.prototype.tickClock.call(scene);
  assert.equal(state.data.clock.minutes, 721); assert.equal(refresh, 0);
});
