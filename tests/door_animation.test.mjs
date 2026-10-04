import { test } from 'node:test';
import assert from 'node:assert/strict';
import { doorScene, finish, MapScene } from './door_helpers.mjs';

test('control: la puerta conserva destino, dirección, tiles y pasabilidad', async () => {
  const t = await doorScene('villa_alba', 33, 27);
  const map = t.world.map;
  const layers = map.layers.map((l) => Array.from(l));
  const passable = map.playerPassable(33, 26, 8, {});
  const flags = JSON.stringify(t.state.data.flags);
  await finish(t.scene, t.scene.transfer('casa_vecinos_se', 6, 9, 8, { door: true, doorSource: { x: 33, y: 26 } }));
  assert.deepEqual([t.state.player.mapId, t.world.player.x, t.world.player.y, t.world.player.direction], ['casa_vecinos_se', 6, 9, 8]);
  assert.deepEqual(map.layers.map((l) => Array.from(l)), layers);
  assert.equal(map.playerPassable(33, 26, 8, {}), passable);
  assert.equal(JSON.stringify(t.state.data.flags), flags);
  assert.equal(t.scene.transferring, false);
  assert.equal(t.group.children.length, 0);
});

test('entrada: el panel se abre antes del fundido y mantiene ocupación hasta entrar', async () => {
  const t = await doorScene('villa_alba', 33, 27);
  await finish(t.scene, t.scene.transfer('casa_vecinos_se', 6, 9, 8, { door: true, doorSource: { x: 33, y: 26 } }));
  const frames = t.trace.filter((r) => r.kind === 'wait');
  assert.ok(frames.length >= 3, 'faltan los estados visuales de apertura');
  assert.ok(frames.every((r) => r.busy && r.panels.length === 1));
  assert.deepEqual(t.trace.find((r) => r.kind === 'fadeOut').panels, [1]);
  assert.deepEqual(t.trace.find((r) => r.kind === 'clear').panels, [], 'el panel anterior cruza al interior');
  assert.equal(t.group.children.length, 0);
});

test('salida: cierra el Centro después de aparecer y vuelve al mismo sitio', async () => {
  const t = await doorScene('caudal_centro', 9, 12, 2);
  await finish(t.scene, t.scene.transfer('ciudad_caudal', 20, 25, 2, { door: true, doorSource: { x: 9, y: 12 } }));
  assert.deepEqual(t.trace.find((r) => r.kind === 'fadeIn').panels, [1], 'la puerta debe estar abierta al aparecer');
  const frames = t.trace.filter((r) => r.kind === 'wait');
  assert.ok(frames.length >= 3);
  assert.ok(frames.every((r) => r.busy));
  assert.deepEqual([t.state.player.mapId, t.world.player.x, t.world.player.y, t.world.player.direction], ['ciudad_caudal', 20, 25, 2]);
  assert.equal(t.group.children.length, 0);
  assert.equal(t.scene.transferring, false);
});

test('una llegada cercana y un warp sin door no animan otro edificio', async () => {
  const t = await doorScene('caudal_centro', 9, 12, 2);
  await finish(t.scene, t.scene.transfer('ciudad_caudal', 21, 25, 2, { door: true }));
  assert.equal(t.trace.filter((r) => r.kind === 'wait').length, 0);
  await finish(t.scene, t.scene.transfer('caudal_centro', 9, 12, 8, { door: false }));
  assert.equal(t.trace.filter((r) => r.kind === 'wait').length, 0);
  assert.equal(t.group.children.length, 0);
});

test('doWarp transmite la casilla que activó la puerta, no la del jugador', async () => {
  const scene = Object.create(MapScene.prototype);
  const calls = [];
  scene.world = { player: { x: 33, y: 27, direction: 8 } };
  scene.runScript = (fn) => fn({ warp: (...args) => calls.push(args) });
  scene.doWarp({ x: 33, y: 26, to: 'casa_vecinos_se', tx: 6, ty: 9, dir: 8, door: true });
  assert.deepEqual(calls[0].slice(0, 4), ['casa_vecinos_se', 6, 9, 8]);
  assert.deepEqual(calls[0][4].doorSource, { x: 33, y: 26 });
});

test('un error de fundido limpia el panel sin consumir estado ni cambiar de mapa', async (t) => {
  const v = await doorScene('villa_alba', 33, 27);
  const { engine } = await import('../game/src/core/engine.js');
  const errors = [];
  t.mock.method(console, 'error', () => {});
  t.mock.method(engine, 'reportError', (e) => errors.push(e));
  let visible = false;
  v.scene.fx.fadeOut = async () => { visible = v.group.children.length > 0; throw new Error('fallo de prueba'); };
  await finish(v.scene, v.scene.transfer('casa_vecinos_se', 6, 9, 8, { door: true, doorSource: { x: 33, y: 26 } }));
  assert.equal(visible, true);
  assert.equal(errors.length, 1);
  assert.equal(v.group.children.length, 0);
  assert.equal(v.scene.transferring, false);
  assert.equal(v.state.player.mapId, 'villa_alba');
});

test('salir de la escena durante la apertura cancela sin entrar ni dejar recursos', async () => {
  const v = await doorScene('villa_alba', 33, 27);
  v.scene.effects = { clear() {} }; v.scene.weather = { dispose() {} }; v.scene.compositor = { dispose() {} };
  v.scene.worldView.dispose = () => assert.equal(v.group.children.length, 0);
  const run = v.scene.transfer('casa_vecinos_se', 6, 9, 8, { door: true, doorSource: { x: 33, y: 26 } });
  assert.equal(v.group.children.length, 1);
  assert.equal(v.world.inputEnabled(), false);
  v.scene.exit();
  await finish(v.scene, run);
  assert.equal(v.group.children.length, 0);
  assert.equal(v.state.player.mapId, 'villa_alba');
  assert.equal(v.scene.transferring, false);
});

test('Íker: el acceso por evento abre el panel sin warp declarado y conserva su regreso', async () => {
  const v = await doorScene('aldea_mnemos', 5, 20, 8);
  const { ikerDoorEvent } = await import('../game/src/content/events/b11_t09.js');
  const ctx = { map: v.world.map, setVar: (k, value) => v.state.setVar(k, value),
    warp: (...args) => v.scene.transfer(...args) };
  const flags = structuredClone(v.state.data.flags);
  await finish(v.scene, ikerDoorEvent({ x: 5, y: 19 }).script(ctx));
  assert.ok(v.trace.some(r => r.kind === 'wait' && r.panels.length === 1), 'la puerta por evento no abre');
  assert.deepEqual([v.state.player.mapId, v.world.player.x, v.world.player.y, v.world.player.direction], ['mnemos_casa_iker', 7, 10, 8]);
  assert.equal(v.state.var('b11_t09_regreso'), 'aldea_mnemos|5|20|2');
  assert.deepEqual(v.state.data.flags, flags);
  assert.equal(v.group.children.length, 0);
});

test('Íker: retorno por guion cierra la puerta exacta y el pozo conserva su regreso sin puerta', async () => {
  const v = await doorScene('mnemos_casa_iker', 7, 10, 2);
  const { returnToMnemos } = await import('../game/src/content/events/b11_t09.js');
  v.state.setVar('b11_t09_regreso', 'aldea_mnemos|5|20|2');
  const ctx = { map: v.world.map, var: (k, fallback) => v.state.var(k, fallback), warp: (...args) => v.scene.transfer(...args) };
  await finish(v.scene, returnToMnemos(ctx));
  assert.deepEqual(v.trace.find(r => r.kind === 'fadeIn').panels, [1], 'Íker vuelve con la puerta abierta');
  assert.deepEqual([v.state.player.mapId, v.world.player.x, v.world.player.y, v.world.player.direction], ['aldea_mnemos', 5, 20, 2]);
  assert.equal(v.group.children.length, 0);
  const calls = [];
  await returnToMnemos({ map: { id: 'mnemos_pozo_custodios' }, var: () => 'aldea_mnemos|7|33|4', warp: (...args) => calls.push(args) });
  assert.deepEqual(calls[0].slice(0, 4), ['aldea_mnemos', 7, 33, 4]);
  assert.ok(!calls[0][4]?.door, 'la escalera de humo no es una puerta');
});

test('Aurora: el Vuelo y la entrada de Correos mantienen destino y llevan la puerta visual explícita', async () => {
  const { auroraCabinEvents, NEXO_LANDING } = await import('../game/src/content/events/b17_t14.js');
  const { F } = await import('../game/src/content/events/b17_common.js');
  const { GameState } = await import('../game/src/core/state.js');
  const state = GameState.create({ gender: 'M' }); state.setFlag(F.aurora);
  const calls = [], player = { x: 10, y: 8, opacity: 255, turnGeneric() {} };
  const ctx = { state, player, world: { followers: [] },
    flag: k => state.flag(k), setFlag: k => state.setFlag(k),
    say: async () => {}, confirm: async () => true, se() {}, face() {},
    effect: () => null, flash: async () => {}, fade: async () => {}, wait: async () => {},
    warp: async (...args) => { calls.push(args); player.x = args[1]; player.y = args[2]; } };
  await auroraCabinEvents({ aurora: { x: 1, y: 1, dir: 2 }, table: { x: 2, y: 2 } })[0].pages[0].script(ctx);
  assert.deepEqual(calls[0].slice(0, 4), ['ciudad_nexo', NEXO_LANDING.x, NEXO_LANDING.y, NEXO_LANDING.dir]);
  assert.deepEqual(calls[1].slice(0, 4), ['nexo_correos', 4, 9, 8]);
  assert.deepEqual(calls[1][4].doorSource, { x: NEXO_LANDING.x, y: NEXO_LANDING.y - 1 });
  assert.ok(state.flag(F.journey));
});
