// Regresión dinámica de C059 con la Estación Talasa y el motor reales.
// Fixture aislado: vuelta del despacho, compuerta abierta, tarjeta obtenida y N4 pendiente.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { cellByKey } from '../game/src/content/zygarde/cells.js';
import { F } from '../game/src/content/events/b13_common.js';
import { CELLS, BUILDINGS } from '../game/src/content/maps/b13/talasa_layout.js';
import { db, mon } from './battle_helpers.mjs';

globalThis.location ??= { search: '' };
const { engine } = await import('../game/src/core/engine.js');
const { createContext } = await import('../game/src/script/context.js');
const { runBattle } = await import('../game/src/world/battleFlow.js');
const DV = Object.freeze({ 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] });
const TRAINER = 'tecnica_laboratorio', CELL = 'cell_talasa_1';
const OFFICE_RETURN = Object.freeze({ x: 32, y: 33 });

async function talasaFixture(check, { beforeCard = false, start = OFFICE_RETURN } = {}) {
  const previous = { state: engine.state, data: engine.data, audio: engine.audio };
  const state = GameState.create({ name: 'C059_FIXTURE', playerId: 59 });
  for (const f of [F.p6, F.swimForm, F.marCall, F.talArrival, F.talGreenhouse]) state.setFlag(f);
  if (!beforeCard) state.setFlag(F.talCard);
  state.setZygardeAbility('swim', true);
  for (const id of ['tecnico_control', 'tecnica_cubierta', 'tecnico_torre']) state.setSelfSwitch('estacion_talasa', id, 'A', true);
  state.setParty([mon('AMPHAROS', 80, ['THUNDERBOLT'])]);
  const { entry, warnings } = await buildMapNode('estacion_talasa');
  assert.deepEqual(warnings, []);
  const world = new World({ state, rng: () => 0.99, hooks: { encountersEnabled: () => false } });
  world.setCurrent({ ...entry, events: null });
  world.player.moveTo(start.x, start.y);
  let busy = false;
  world.scriptBusyFn = () => busy;
  const log = { battles: [], said: [], approaches: [] };
  const until = async predicate => {
    for (let frame = 0; frame < 1200; frame++) { if (predicate()) return; world.update(1 / 60); }
    assert.fail('El movimiento real no terminó en 1200 fotogramas');
  };
  const scene = { world, weather: { type: 'none' }, camera: { renderX: 0, renderY: 0 },
    runner: { until, wait: async () => {} }, emote: async () => {}, refreshFollower: () => {},
    fx: { fadeTo: async () => {}, playTransition: async () => {}, clearTransition: () => {},
      fadeIn: async () => {}, flashScreen: async () => {} },
    startBattle: async request => {
      const ev = world.events.find(e => e.id === TRAINER);
      log.approaches.push([ev.x, ev.y]);
      const result = await runBattle(scene, { ...request, db, seed: 59 });
      log.battles.push({ request, result });
      return result;
    } };
  Object.assign(engine, { state, data: db, audio: null });
  const execute = async event => {
    busy = true; event.lock();
    const ctx = createContext(scene, event);
    ctx.say = async text => log.said.push(text);
    ctx.choice = async () => 0;
    try { await event.script(ctx); } finally { event.unlock(); busy = false; world.refreshEvents(); }
  };
  const drain = async () => {
    for (let n = 0; n < 20; n++) {
      const event = world.takeStartingEvent();
      if (!event) return;
      await execute(event);
    }
    assert.fail('Los eventos del mapa no terminaron');
  };
  try { await check({ world, state, log, until, drain }); }
  finally { Object.assign(engine, previous); }
}

/** Busca ruta sobre suelo y NPC actuales; la proyección solo se usa para planificar. */
function footRoute(world, target, { avoidCell = false } = {}) {
  const player = world.player, key = (x, y) => `${x},${y}`;
  const previous = new Map([[key(player.x, player.y), null]]), queue = [[player.x, player.y]];
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
      if (previous.has(k) || (avoidCell && nx === CELLS.c059.x && ny === CELLS.c059.y)
        || !view.passable(x, y, Number(dir))) continue;
      previous.set(k, [key(x, y), Number(dir)]); queue.push([nx, ny]);
    }
  }
  return null;
}

async function walkTo(t, target, opts) {
  const route = footRoute(t.world, target, opts);
  assert.ok(route, `Sin ruta a (${target.x},${target.y}) tras el acercamiento del entrenador`);
  for (const dir of route) {
    assert.equal(t.world.player.moveGeneric(dir), true);
    await t.until(() => !t.world.player.busy()); await t.drain();
  }
  t.world.checkHere(['touch']); await t.drain();
}

function assertWin(t, moneyBefore) {
  assert.equal(t.log.battles.length, 1);
  const { request, result } = t.log.battles[0];
  assert.equal(request.trainer, 'b13_tecnica_laboratorio');
  assert.equal(result.outcome, 'win');
  assert.ok(result.turns > 0, 'se ejecutó el motor de combate');
  assert.equal(result.moneyChange, 1920, 'premio canónico de Nerea: base 40, nivel máximo 48');
  assert.equal(t.state.player.money, moneyBefore + 1920);
  assert.equal(t.state.selfSwitch('estacion_talasa', TRAINER, 'A'), true);
  assert.equal(t.world.events.find(e => e.id === TRAINER).trigger, 'action');
  assert.equal(t.state.flag(F.talCard), true);
  assert.equal(t.state.flag(F.talBattle), false, 'la victoria de Nerea no sustituye la del laboratorio');
  assert.equal(t.state.flag(F.talN4), false, 'N4 sigue pendiente');
  assert.equal(t.state.flag(F.core4), false);
}

test('C059: el itinerario occidental de vuelta del despacho permite victoria, premio, recogida touch y retorno', async () => {
  await talasaFixture(async t => {
    const money = t.state.player.money;
    await walkTo(t, { x: 29, y: 24 }, { avoidCell: true });
    assert.equal(t.state.hasCell(CELL), false, 'el itinerario evita recoger C059 antes del reto');
    await walkTo(t, CELLS.c059);
    assertWin(t, money);
    assert.deepEqual(t.state.data.zygarde.cells, [CELL]);
    assert.equal(t.world.events.find(e => e.id === CELL).page, null);
    assert.ok(t.log.said.some(text => /Célula.*1\/100/.test(text)));
    await walkTo(t, OFFICE_RETURN);
    assert.deepEqual([t.world.player.x, t.world.player.y], [32, 33]);
    await walkTo(t, CELLS.c059);
    assert.deepEqual(t.state.data.zygarde.cells, [CELL], 'volver no duplica la célula ni el combate');
    assert.equal(t.log.battles.length, 1);
  });
});

test('C059: todas las posiciones visibles de reto dejan libres las células, puertas y otros NPC', async () => {
  for (const distance of [1, 2, 3]) await talasaFixture(async t => {
    const trainer = t.world.events.find(e => e.id === TRAINER);
    t.world.player.moveTo(trainer.x - distance, trainer.y);
    assert.equal(t.world.map.passable(t.world.player.x, t.world.player.y, 0, t.world.player, t.world.env()), true);
    assert.equal(trainer.canReachPlayer(t.world.player, trainer.sight), true);
    const money = t.state.player.money;
    assert.equal(t.world.checkTrainersFromDistance(), true);
    t.world.checkHere(['touch']); await t.drain();
    assertWin(t, money);
    for (const c of Object.values(CELLS)) assert.equal(trainer.at(c.x, c.y), false, `reto ${distance}: ocupa ${c.key}`);
    for (const bd of Object.values(BUILDINGS)) assert.equal(trainer.at(bd.door.x, bd.door.y), false);
    assert.equal(t.world.events.some(e => e !== trainer && e.at(trainer.x, trainer.y) && !e.through && e.hasGraphic()), false);
    await walkTo(t, CELLS.c059);
    assert.equal(t.state.hasCell(CELL), true);
    await walkTo(t, CELLS.c060);
    assert.equal(t.state.hasCell(CELLS.c060.key), true);
    await walkTo(t, OFFICE_RETURN);
    assert.equal(t.log.battles.length, 1);
  });
});

test('C059: derrota persistente y regreso tras reconstrucción conservan recogidas, puerta, tarjeta y progreso', async () => {
  await talasaFixture(async t => {
    assert.equal(cellByKey(CELL).id, 'C059');
    assert.equal(cellByKey(CELL).required, true);
    const trainer = t.world.events.find(e => e.id === TRAINER);
    assert.equal(trainer.direction, 4); assert.equal(trainer.sight, 3);
    assert.equal(t.world.map.passable(trainer.x, trainer.y, 0, t.world.player, t.world.env()), true);
    await walkTo(t, { x: 29, y: 24 }, { avoidCell: true });
    await walkTo(t, CELLS.c059);
    await walkTo(t, OFFICE_RETURN);
    const { entry } = await buildMapNode('estacion_talasa');
    const state = new GameState(structuredClone(t.state.data)), restored = new World({ state });
    restored.setCurrent({ ...entry, events: null }); restored.player.moveTo(OFFICE_RETURN.x, OFFICE_RETURN.y);
    assert.equal(restored.events.find(e => e.id === TRAINER).trigger, 'action');
    const collected = restored.events.find(e => e.id === CELL);
    assert.equal(collected.trigger, null);
    assert.equal(collected.hasGraphic(), false);
    assert.equal(collected.through, true);
    assert.equal(state.flag(F.talCard), true); assert.equal(state.flag(F.talN4), false);
    assert.deepEqual(state.data.zygarde.cells, [CELL]);
    assert.ok(footRoute(restored, CELLS.c059), 'la derrota guardada no corta el regreso');
    const office = restored.warpAt(BUILDINGS.tower.door.x, BUILDINGS.tower.door.y);
    assert.equal(office.to, 'talasa_despacho');
    const { def } = await buildMapNode('talasa_despacho');
    assert.ok(def.warps.some(w => w.to === 'estacion_talasa' && w.tx === OFFICE_RETURN.x && w.ty === OFFICE_RETURN.y));
    assert.deepEqual([CELLS.c059.x, CELLS.c059.y, CELLS.c060.x, CELLS.c060.y], [30, 24, 33, 34]);
  });
});

test('Nerea: el itinerario del invernadero al despacho no adelanta su reto ni concede tarjeta o N4', async () => {
  // Variante declarada del fixture: compuerta abierta, vuelta del invernadero, tarjeta todavía pendiente.
  await talasaFixture(async t => {
    await walkTo(t, OFFICE_RETURN, { avoidCell: true });
    assert.equal(t.log.battles.length, 0);
    assert.equal(t.state.hasCell(CELL), false);
    assert.equal(t.state.flag(F.talCard), false);
    assert.equal(t.state.flag(F.talLabIn), false);
    assert.equal(t.state.flag(F.talN4), false);
    assert.equal(t.world.events.find(e => e.id === TRAINER).trigger, 'eventTouch');
  }, { beforeCard: true, start: { x: BUILDINGS.greenhouse.door.x, y: BUILDINGS.greenhouse.door.y + 1 } });
});
