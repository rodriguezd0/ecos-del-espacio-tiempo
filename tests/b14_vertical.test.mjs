// P7 vertical: ruinas, capas del tiempo y Bramaluna; rutas reales y guardados anteriores.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { ANTEA_MAPS, ARRECIFE, FOSA, ROOMS } from '../game/src/content/maps/b14/layout.js';
import { F } from '../game/src/content/events/b14_common.js';
import { arrecifeOnEnter } from '../game/src/content/events/b14_arrecife.js';

const key = (x, y) => `${x},${y}`;
async function walkable(id, start, { flags = [], blocked = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  const { def, entry, warnings } = await buildMapNode(id);
  assert.deepEqual(warnings, [], `${id}: construcción limpia`);
  const world = new World({ state });
  world.setCurrent({ ...entry, events: null });
  const denied = new Set(blocked.map(([x, y]) => key(x, y)));
  const seen = new Set([key(start.x, start.y)]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
      const [nx, ny] = [x + dx, y + dy];
      const k = key(nx, ny);
      if (seen.has(k) || denied.has(k) || !entry.map.valid(nx, ny)) continue;
      world.player.moveTo(x, y);
      if (!world.player.passable(x, y, d)) continue;
      seen.add(k); queue.push([nx, ny]);
    }
  }
  return { def, world, seen, has: (x, y) => seen.has(key(x, y)) };
}

test('P7 tiene ruinas en el primer piso, las diez capas en el segundo y Bramaluna en el tercero', async () => {
  for (const [id, floor] of [['antea_base', 1], ...ANTEA_MAPS.map((id) => [id, 2]), ['fosa_eco', 3]]) {
    const { def } = await buildMapNode(id);
    assert.deepEqual(def.pillar, { id: 'P7', floor }, id);
  }
});

test('P7: un guardado en la antigua puerta migra fuera de la columna sin alterar su progreso', async () => {
  for (const flags of [[], [F.dredgeAside], [F.restored]]) {
    const env = await walkable('arrecife_eco', ARRECIFE.arrival, { flags });
    const state = env.world.state;
    env.world.player.moveTo(22, 5);
    await arrecifeOnEnter({ state, world: env.world, player: env.world.player, map: env.world.current.map });
    const open = flags.includes(F.dredgeAside) || flags.includes(F.restored);
    assert.deepEqual([env.world.player.x, env.world.player.y], [22, open ? 14 : 15]);
    assert.deepEqual(flags.map((f) => state.flag(f)), flags.map(() => true));
    assert.equal(state.flag(F.dredgeAside), flags.includes(F.dredgeAside), 'no vence a Adela por la migración');
  }
});

test('P7: MapScene traslada la antigua puerta antes de buscar la casilla libre más cercana', async () => {
  globalThis.location ??= { search: '', href: 'http://localhost/' };
  globalThis.window ??= {};
  const { default: MapScene } = await import('../game/src/world/mapScene.js');
  for (const flags of [[], [F.dredgeAside], [F.restored]]) {
    const env = await walkable('arrecife_eco', ARRECIFE.arrival, { flags });
    const scene = Object.assign(Object.create(MapScene.prototype), {
      state: env.world.state, world: env.world, visible: new Map(),
      worldView: { clearMaps() {}, addMap() {} }, camera: { setBounds() {}, follow() {}, snapToTarget() {} },
      refreshFollower() {}, announce() {}, runScript() {},
      loadNeighbors: async () => {}, applyEnvironment: async () => {},
      loadEntry: async (id) => (await buildMapNode(id)).entry,
    });
    await scene.enterMap('arrecife_eco', 22, 5, 8);
    const open = flags.includes(F.dredgeAside) || flags.includes(F.restored);
    assert.deepEqual([env.world.state.player.mapId, env.world.player.x, env.world.player.y], ['arrecife_eco', 22, open ? 14 : 15]);
    assert.deepEqual(flags.map((f) => env.world.state.flag(f)), flags.map(() => true));
  }
});

test('P7: la draga cierra el acceso a la columna; apartada se entra por la base y se puede salir', async () => {
  const closed = await walkable('arrecife_eco', ARRECIFE.arrival);
  assert.ok(!closed.has(ARRECIFE.gate.door.x, ARRECIFE.gate.door.y), 'el primer piso no permite saltarse a Adela');
  const open = await walkable('arrecife_eco', ARRECIFE.arrival, { flags: [F.dredgeAside] });
  assert.ok(open.has(ARRECIFE.gate.door.x, ARRECIFE.gate.door.y), 'la puerta de la columna se alcanza');
  const entrance = open.def.warps.find((w) => w.x === ARRECIFE.gate.door.x && w.y === ARRECIFE.gate.door.y);
  assert.equal(entrance.to, 'antea_base');
  const base = await walkable(entrance.to, { x: entrance.tx, y: entrance.ty });
  const down = base.def.warps.find((w) => w.to === 'arrecife_eco');
  assert.ok(base.has(down.x, down.y), 'se puede volver a bucear antes de entrar en las capas');
  assert.deepEqual([down.tx, down.ty], [ARRECIFE.gate.arrival.x, ARRECIFE.gate.arrival.y]);
  assert.notDeepEqual([down.tx, down.ty], [entrance.x, entrance.y], 'sin rebote al primer piso');
});

test('P7: subir y volver de las capas del tiempo funciona antes y después de restaurar', async () => {
  for (const flags of [[], [F.restored, F.echoBeaten]]) {
    const { def } = await buildMapNode('antea_base');
    const base = await walkable('antea_base', def.start, { flags });
    const up = base.def.warps.find((w) => w.to === 'antea_1_presente');
    assert.ok(base.has(up.x, up.y), 'se llega andando a la escalera del segundo piso');
    assert.deepEqual([up.tx, up.ty], [ROOMS[1].south.arrival.x, ROOMS[1].south.arrival.y], 'llegada histórica');
    const layer = await walkable(up.to, { x: up.tx, y: up.ty }, { flags });
    const back = layer.def.warps.find((w) => w.x === ROOMS[1].south.door.x && w.y === ROOMS[1].south.door.y);
    assert.equal(back.to, 'antea_base');
    assert.ok(layer.has(back.x, back.y - 1), 'el antiguo guardado puede usar su salida de luz');
    const returnBase = await walkable(back.to, { x: back.tx, y: back.ty }, { flags });
    const down = returnBase.def.warps.find((w) => w.to === 'arrecife_eco');
    assert.ok(returnBase.has(down.x, down.y), 'regreso al exterior sin volver a resolver nada');
    assert.notDeepEqual([back.tx, back.ty], [up.x, up.y], 'no rebota al segundo piso');
  }
});

test('P7: la sala superior conserva la llegada anterior y no permite rodear la Bramaluna obligatoria', async () => {
  const strip = Array.from({ length: FOSA.trigger.x1 - FOSA.trigger.x0 + 1 }, (_, i) => [FOSA.trigger.x0 + i, FOSA.trigger.y]);
  const before = await walkable('fosa_eco', FOSA.arrival, { blocked: strip });
  const exit = before.def.warps.find((w) => w.to === 'antea_4_presente');
  assert.ok(before.has(exit.x, exit.y), 'se puede bajar sin luchar');
  assert.ok(!before.has(FOSA.core.x, FOSA.core.y + 1), 'todo camino al núcleo cruza el despertar del eco');
  const after = await walkable('fosa_eco', FOSA.arrival, { flags: [F.echoBeaten, F.restored] });
  assert.ok(after.has(FOSA.core.x, FOSA.core.y + 1), 'el núcleo sigue accesible en partidas restauradas');
  assert.ok(after.has(FOSA.nest.x, FOSA.nest.y + 1), 'la captura opcional real conserva su nido');
  assert.ok(after.has(FOSA.upcurrent.x, FOSA.upcurrent.y), 'se conserva la salida rápida a Caleta Sonda');
});
