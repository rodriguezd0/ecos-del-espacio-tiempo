import test from 'node:test';
import assert from 'node:assert/strict';
import { SceneManager } from '../game/src/core/scenes.js';
import { db, newState } from './dev_helpers.mjs';

globalThis.location ??= {search: ''};
const {engine} = await import('../game/src/core/engine.js');
const {installDevMenuKey} = await import('../game/src/dev/devRuntime.js');

async function pressF9(overrides = {}, key = {}) {
  const previousWindow = globalThis.window;
  const original = Object.fromEntries(['scenes', 'input', 'assets', 'audio', 'data', 'reportError'].map(k => [k, engine[k]]));
  const handlers = new Map(), errors = [];
  globalThis.window = {
    addEventListener(name, fn) { if (!handlers.has(name)) handlers.set(name, new Set()); handlers.get(name).add(fn); },
    removeEventListener(name, fn) { handlers.get(name)?.delete(fn); },
  };
  const scene = {
    ready: true, runner: {busy: false}, cinematic: false, transferring: false, inBattle: false,
    devMenuOpen: false, menuOpen: false, state: newState(), runScript() {}, async transfer() {},
    ...overrides,
  };
  scene.world = {map: {id: 'villa_alba'}, player: {x: 10, y: 26, direction: 8, busy: () => Boolean(overrides.playerBusy)},
    requestRefresh() {}, scriptBusy: () => Boolean(scene.runner.busy || scene.menuOpen || overrides.scriptBusy)};
  engine.input = {flush() {}, pressed: () => false, repeat: () => false};
  engine.assets = {anil: rel => rel, tryImage: async () => ({width: 128, height: 128})};
  engine.audio = null;
  engine.data = db;
  engine.reportError = error => errors.push(error);
  engine.scenes = new SceneManager(engine);
  engine.scenes.stack.push({scene, resolve() {}});
  const remove = installDevMenuKey(scene);
  let prevented = false;
  try {
    const event = {code: 'F9', repeat: false, preventDefault() { prevented = true; }, ...key};
    for (const fn of [...handlers.get('keydown')]) fn(event);
    // La apertura carga el menú de forma asíncrona; comprueba también que no aparezca después del evento.
    if (prevented) {
      for (let n = 0; n < 200 && engine.scenes.top === scene; n++) await new Promise(r => setTimeout(r, 1));
    } else await new Promise(r => setImmediate(r));
    return {opened: engine.scenes.top !== scene, prevented, errors: [...errors], position: {...scene.state.player}};
  } finally {
    if (engine.scenes.top !== scene) {
      engine.scenes.top.close(null);
      await new Promise(r => setTimeout(r, 1));
    }
    remove();
    Object.assign(engine, original);
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
  }
}

for (const [reason, overrides] of [
  ['guion bloqueante', {runner: {busy: true}}],
  ['cinemática', {cinematic: true}],
  ['paso del jugador a medias', {playerBusy: true}],
  ['mundo ocupado', {scriptBusy: true}],
]) {
  test(`F9 espera durante ${reason} y no permite guardar una escena a medias`, async () => {
    const result = await pressF9(overrides);
    assert.equal(result.opened, false);
    assert.equal(result.prevented, false);
    assert.deepEqual(result.errors, []);
  });
}

test('F9 sigue abriendo el menú real en un mapa libre', async () => {
  const result = await pressF9();
  assert.equal(result.opened, true);
  assert.equal(result.prevented, true);
  assert.equal(result.position.mapId, 'villa_alba');
  assert.deepEqual([result.position.x, result.position.y, result.position.dir], [10, 26, 8]);
  assert.deepEqual(result.errors, []);
});

test('F9 ignora la repetición, otra tecla y las transiciones existentes', async () => {
  for (const [overrides, key] of [[{}, {repeat: true}], [{}, {code: 'F8'}], [{ready: false}, {}],
    [{transferring: true}, {}], [{inBattle: true}, {}]]) {
    const result = await pressF9(overrides, key);
    assert.equal(result.opened, false);
    assert.equal(result.prevented, false);
  }
});
