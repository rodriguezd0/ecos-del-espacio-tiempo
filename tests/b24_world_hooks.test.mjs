import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { db, mon } from './battle_helpers.mjs';
globalThis.location ??= { search: '' };
const { default: MapScene } = await import('../game/src/world/mapScene.js');
const { engine } = await import('../game/src/core/engine.js');
const { runBattle } = await import('../game/src/world/battleFlow.js');

function state() {
  const s = GameState.create();
  for (const f of ['game_cleared', 'b21_fin', 'dlc2_registro_abierto']) s.setFlag(f);
  s.setVar('dlc2_activas', ['xerneas', 'yveltal', 'celebi']);
  return s;
}
test('los pasos reales entregan mapa y estado de carrera al Registro', () => {
  const s = state();
  const scene = { state: s, world: { map: { id: 'ruta_14_reserva' }, events: [] } };
  const hooks = MapScene.prototype.worldHooks.call(scene);
  const p = { x: 8, y: 9, direction: 6, canRun: () => false };
  hooks.stepTaken(p);
  assert.equal(s.var('dlc2_xerneas_pasos'), 1);
  scene.world.map.id = 'ruta_9_neblino'; hooks.stepTaken(p);
  assert.equal(s.var('dlc2_celebi_sigilo'), 1);
  p.canRun = () => true; hooks.stepTaken(p);
  assert.equal(s.var('dlc2_celebi_sigilo'), 0);
});
test('una victoria salvaje real entrega su resultado y una exhibición no aumenta la racha', async () => {
  const before = { state: engine.state, data: engine.data, audio: engine.audio };
  const s = state(); s.setParty([mon('PIKACHU', 80, ['THUNDERBOLT'])]);
  s.setVar('dlc2_xerneas_pasos', 25);
  Object.assign(engine, { state: s, data: db, audio: null });
  const scene = {
    world: { current: { def: { id: 'sima_eje', outdoor: true } },
      player: { terrainTag: () => ({}), realX: 0, realY: 0 },
      encounters: { hasBase: () => false, reset: () => {} } },
    weather: { type: 'none' }, fx: { fadeTo: async () => {}, playTransition: async () => {}, clearTransition: () => {}, fadeIn: async () => {} },
    runner: { wait: async () => {} }, camera: { renderX: 0, renderY: 0 }, refreshFollower: () => {},
  };
  try {
    const request = { db, type: 'wild', wild: { species: 'RATTATA', level: 3, moves: ['TAILWHIP'] } };
    const result = await runBattle(scene, request);
    assert.equal(result.outcome, 'win'); assert.equal(s.var('dlc2_yveltal_racha'), 1);
    assert.equal(s.var('dlc2_xerneas_pasos'), 0);
    const exhibition = await runBattle(scene, { ...request, exhibition: true });
    assert.equal(exhibition.outcome, 'win'); assert.equal(s.var('dlc2_yveltal_racha'), 1);
  } finally { Object.assign(engine, before); }
});
