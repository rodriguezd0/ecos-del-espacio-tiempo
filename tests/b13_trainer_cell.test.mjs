// Regresión dinámica de C065: mapa, visión, acercamiento, combate y recogida reales.
// Fixture aislado de B13: P6/Nadar ya obtenidos y Ampharos 80 para ganar el combate.
// No se usa el navegador ni el guardado de la campaña continua.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { canSurfFreely } from '../game/src/world/terrain.js';
import { swimHook } from '../game/src/world/fieldScripts.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { CELLS } from '../game/src/content/maps/b13/mar_layout.js';
import { db, mon } from './battle_helpers.mjs';

globalThis.location ??= { search: '' };
const { engine } = await import('../game/src/core/engine.js');
const { createContext } = await import('../game/src/script/context.js');
const { runBattle } = await import('../game/src/world/battleFlow.js');

const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const TRAINER = 'marinero_ezequiel';
const CELL = 'cell_mar_sur_5';

async function seaFixture(check) {
  const previous = { state: engine.state, data: engine.data, audio: engine.audio };
  const state = GameState.create({ name: 'C065_FIXTURE', playerId: 65 });
  state.setFlag('p6_restored'); state.setFlag('zyg_50'); state.setFlag('b13_mar_llamada');
  state.setZygardeAbility('swim', true);
  state.setParty([mon('AMPHAROS', 80, ['THUNDERBOLT'])]);
  const { entry, warnings } = await buildMapNode('mar_del_sur');
  assert.deepEqual(warnings, []);
  const world = new World({ state, rng: () => 0.99, hooks: { encountersEnabled: () => false } });
  world.setCurrent({ ...entry, events: null });
  let busy = false;
  world.scriptBusyFn = () => busy;
  const log = { battles: [], said: [], approach: [] };
  const until = async predicate => {
    for (let frame = 0; frame < 1200; frame++) {
      if (predicate()) return;
      world.update(1 / 60);
    }
    assert.fail('El movimiento real no terminó en 1200 fotogramas');
  };
  const scene = {
    world, weather: { type: 'none' }, camera: { renderX: 0, renderY: 0 },
    runner: { until, wait: async () => {} }, emote: async () => {}, refreshFollower: () => {},
    fx: { fadeTo: async () => {}, playTransition: async () => {}, clearTransition: () => {},
      fadeIn: async () => {}, flashScreen: async () => {} },
    startBattle: async request => {
      log.approach.push([world.events.find(e => e.id === TRAINER).x, world.events.find(e => e.id === TRAINER).y]);
      const result = await runBattle(scene, { ...request, db, seed: 65 });
      log.battles.push({ request, result });
      return result;
    },
  };
  Object.assign(engine, { state, data: db, audio: null });
  const context = event => {
    const ctx = createContext(scene, event);
    ctx.say = async text => { log.said.push(text); };
    ctx.choice = async () => 0;
    return ctx;
  };
  const execute = async event => {
    busy = true; event.lock();
    try { await event.script(context(event)); }
    finally { event.unlock(); busy = false; world.refreshEvents(); }
  };
  const drain = async () => {
    for (let n = 0; n < 20; n++) {
      const event = world.takeStartingEvent();
      if (!event) return;
      await execute(event);
    }
    assert.fail('Los eventos del mapa no terminaron');
  };
  try {
    await check({ world, state, log, until, drain, context });
  } finally { Object.assign(engine, previous); }
}

/** Ruta a pie sobre el mapa y sus NPC actuales; planifica en una vista, sin mover al jugador. */
function footRoute(world, target) {
  const player = world.player, key = (x, y) => `${x},${y}`;
  const start = key(player.x, player.y), previous = new Map([[start, null]]);
  const queue = [[player.x, player.y]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    if (x === target.x && y === target.y) {
      const route = [];
      for (let k = key(x, y); previous.get(k);) {
        const [parent, dir] = previous.get(k); route.unshift(dir); k = parent;
      }
      return route;
    }
    const view = Object.create(player);
    Object.defineProperties(view, { x: { value: x }, y: { value: y } });
    for (const [dir, [dx, dy]] of Object.entries(DV)) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (previous.has(k) || !view.passable(x, y, Number(dir))) continue;
      previous.set(k, [key(x, y), Number(dir)]); queue.push([nx, ny]);
    }
  }
  return null;
}

async function walkTo(t, target) {
  const route = footRoute(t.world, target);
  assert.ok(route, `Sin ruta a pie a (${target.x},${target.y}) tras el acercamiento del entrenador`);
  for (const dir of route) {
    assert.equal(t.world.player.moveGeneric(dir), true);
    await t.until(() => !t.world.player.busy());
    await t.drain();
  }
  t.world.checkHere(['touch']); await t.drain();
}

function groundAt(world, x, y) {
  return !canSurfFreely(world.map.terrainTagAt(x, y))
    && world.map.passable(x, y, 0, world.player, world.env());
}

async function winSightChallenge(t, distance) {
  const { world, state, log } = t;
  const trainer = world.events.find(e => e.id === TRAINER);
  world.player.moveTo(trainer.x - distance, trainer.y);
  assert.equal(trainer.canReachPlayer(world.player, trainer.sight), true);
  assert.equal(world.checkTrainersFromDistance(), true);
  const money = state.player.money;
  await t.drain();
  assert.equal(log.battles.length, 1);
  const { request, result } = log.battles[0];
  assert.equal(request.trainer, 'b13_marinero_ezequiel');
  assert.equal(result.outcome, 'win');
  assert.ok(result.turns > 0, 'se ejecutó el motor de combate');
  assert.equal(result.moneyChange, 1104, 'premio del Marinero: base 24 y nivel máximo 46');
  assert.equal(state.player.money, money + result.moneyChange);
  assert.equal(state.selfSwitch('mar_del_sur', TRAINER, 'A'), true);
  assert.equal(trainer.trigger, 'action');
  return trainer;
}

test('C065: tras la victoria y el acercamiento más largo a pie, se recoge al pisarla y se vuelve al agua', async () => {
  await seaFixture(async t => {
    const trainer = t.world.events.find(e => e.id === TRAINER);
    const distance = [3, 2, 1].find(n => groundAt(t.world, trainer.x - n, trainer.y));
    assert.ok(distance);
    await winSightChallenge(t, distance);
    assert.equal(t.state.hasCell(CELL), false, 'la victoria no regala la célula');
    await walkTo(t, CELLS.c065);
    assert.equal(t.state.hasCell(CELL), true);
    assert.deepEqual(t.state.data.zygarde.cells, [CELL]);
    assert.equal(t.world.events.find(e => e.id === CELL).page, null);
    assert.ok(t.log.said.some(text => /Célula.*1\/100/.test(text)));
    await walkTo(t, { x: 137, y: 16 });
    t.world.player.turnGeneric(6);
    assert.equal(t.world.actionButton(), true, 'la orilla ofrece Nadar');
    await swimHook(t.context(null));
    assert.deepEqual([t.world.player.x, t.world.player.y, t.world.player.surfing], [138, 16, true]);
    assert.equal(t.world.player.moveGeneric(4), true);
    await t.until(() => !t.world.player.busy()); await t.drain();
    assert.deepEqual([t.world.player.x, t.world.player.y, t.world.player.surfing], [137, 16, false]);
    assert.deepEqual(t.state.data.zygarde.cells, [CELL], 'regresar no duplica C065');
  });
});

test('C065: todos los retos visibles desde tierra conservan el combate opcional y dejan libre la célula', async () => {
  for (const distance of [1, 2, 3]) await seaFixture(async t => {
    const trainer = t.world.events.find(e => e.id === TRAINER);
    if (!groundAt(t.world, trainer.x - distance, trainer.y)) return;
    await winSightChallenge(t, distance);
    assert.equal(trainer.at(CELLS.c065.x, CELLS.c065.y), false, `el reto a ${distance} casillas ocupa C065`);
    await walkTo(t, CELLS.c065);
    assert.equal(t.state.hasCell(CELL), true);
  });
});

test('C065: registro, clave, coordenadas, terreno y derrota del entrenador se conservan al reconstruir el mapa', async () => {
  await seaFixture(async t => {
    assert.deepEqual([CELLS.c065.key, CELLS.c065.x, CELLS.c065.y], [CELL, 135, 16]);
    assert.equal(cellByKey(CELL).id, 'C065');
    const trainer = t.world.events.find(e => e.id === TRAINER);
    assert.equal(groundAt(t.world, trainer.x, trainer.y), true, 'el entrenador está sobre suelo real');
    assert.equal(trainer.direction, 4); assert.equal(trainer.sight, 3);
    const distance = [3, 2, 1].find(n => groundAt(t.world, trainer.x - n, trainer.y));
    await winSightChallenge(t, distance);
    const { entry } = await buildMapNode('mar_del_sur');
    const restored = new World({ state: new GameState(structuredClone(t.state.data)) });
    restored.setCurrent({ ...entry, events: null });
    assert.equal(restored.events.find(e => e.id === TRAINER).trigger, 'action');
    assert.equal(restored.events.find(e => e.id === CELL).trigger, 'touch');
    assert.equal(restored.player.through, false);
  });
});
