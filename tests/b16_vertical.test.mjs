// P8: escaleras, partidas del antiguo santuario y continuidad del Trío en el postgame.
import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { CELLS } from '../game/src/content/zygarde/cells.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { PATIO, SABER, SENTIR, QUERER, TELAR } from '../game/src/content/maps/b16/santuario_layout.js';
import { F } from '../game/src/content/events/b16_common.js';

const FLOORS = ['santuario_alma', 'santuario_alma_sentir', 'santuario_alma_querer'];
async function setup(id, state = GameState.create({ name: 'Prueba' })) {
  const built = await buildMapNode(id);
  assert.deepEqual(built.warnings, [], `${id}: construcción limpia`);
  const world = new World({ state });
  world.setCurrent({ ...built.entry, events: null });
  world.player.moveTo(40, 57);
  return { ...built, state, world, player: world.player, map: built.entry.map };
}

function reaches(env, start) {
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [[start.x, start.y]];
  for (let i = 0; i < queue.length; i++) for (const [d, dx, dy] of [[2, 0, 1], [4, -1, 0], [6, 1, 0], [8, 0, -1]]) {
    const [x, y] = queue[i];
    const [nx, ny] = [x + dx, y + dy];
    const key = `${nx},${ny}`;
    if (seen.has(key) || !env.map.valid(nx, ny)) continue;
    env.player.moveTo(x, y);
    if (!env.player.passable(x, y, d)) continue;
    seen.add(key); queue.push([nx, ny]);
  }
  return (x, y) => seen.has(`${x},${y}`);
}

test('P8 reparte Uxie, Mesprit y Azelf/Telar entre tres pisos con coordenadas históricas', async () => {
  for (const [i, id] of FLOORS.entries()) {
    const { def } = await setup(id);
    assert.deepEqual(def.pillar, { id: 'P8', floor: i + 1 });
    const expected = i === 0 ? ['uxie'] : i === 1 ? ['mesprit'] : ['azelf', 'telar_alma'];
    assert.deepEqual(def.events.filter((e) => ['uxie', 'mesprit', 'azelf', 'telar_alma'].includes(e.id)).map((e) => e.id), expected);
  }
});

test('P8: el acceso exterior a la columna usa pinceles disponibles y conserva puerta y retorno', async () => {
  const built = await buildMapNode('lagos_alma');
  assert.deepEqual(built.warnings, [], 'la explanada se pinta con el atlas exterior real');
  assert.ok(built.def.warps.some((w) => w.x === 28 && w.y === 19 && w.to === FLOORS[0]));
});

test('P8: todas las escaleras permiten subir y regresar a los Lagos sin restaurar ni volver a resolver puzzles', async () => {
  for (const restored of [false, true]) for (const [i, id] of FLOORS.entries()) {
    const s = GameState.create({ name: 'Prueba' });
    s.setFlag(F.sanctuaryIntro);
    if (restored) s.setFlag(F.restored);
    const env = await setup(id, s);
    const has = reaches(env, env.def.start);
    const down = env.def.warps.find((w) => w.to === (i ? FLOORS[i - 1] : 'lagos_alma'));
    assert.ok(down && has(down.x, down.y), `${id}: descenso alcanzable`);
    assert.ok(!down.dirTrigger, 'se baja al pisar la escalera, también desde una partida guardada debajo');
    if (i < 2) {
      const up = env.def.warps.find((w) => w.to === FLOORS[i + 1]);
      assert.ok(up && has(up.x, up.y), `${id}: ascenso alcanzable`);
      const next = await setup(up.to, s);
      assert.ok(next.map.passableStrict(up.tx, up.ty), 'llegada firme');
      const back = next.def.warps.find((w) => w.to === id);
      assert.notDeepEqual([back.tx, back.ty], [up.x, up.y], 'no rebota al piso superior');
    }
  }
});

test('P8: C097–C100 conservan ID y coordenadas y se obtienen solo en su piso', async () => {
  const state = GameState.create({ name: 'Prueba' });
  for (const [key, id, point] of [
    ['cell_alma_1', FLOORS[0], SABER.cell], ['cell_alma_2', FLOORS[1], SENTIR.cell],
    ['cell_alma_3', FLOORS[2], QUERER.wind.cell], ['cell_alma_4', FLOORS[2], TELAR.cell],
  ]) {
    const cell = CELLS.find((c) => c.key === key);
    assert.equal(cell.id, `C${String(96 + Number(key.at(-1))).padStart(3, '0')}`);
    assert.equal(cell.map, id);
    const { def } = await setup(id, state);
    const event = def.events.find((e) => e.cell === key);
    assert.ok(event, `${id}: célula real`);
    assert.deepEqual([event.x, event.y], [point.x, point.y]);
    const page = expandEventDef(event).pages[0];
    await page.script({ state, se: () => {}, requestRefresh: () => {}, say: async () => {} });
    assert.ok(state.hasCell(key));
    assert.ok(!page.when(state), 'al cargar no se puede obtener dos veces');
    for (const other of FLOORS.filter((f) => f !== id)) assert.ok(!(await setup(other)).def.events.some((e) => e.cell === key));
  }
});

test('P8: un guardado antiguo en cada ala migra al piso correcto conservando la respuesta y los objetos recogidos', async () => {
  for (const [point, target, item] of [
    [SENTIR.mesprit.arrive, FLOORS[1], 'objeto_alma_3'],
    [QUERER.azelf.entry.arrive, FLOORS[2], 'objeto_alma_4'],
    [TELAR.spot, FLOORS[2], 'objeto_alma_4'],
  ]) {
    const state = GameState.create({ name: 'Prueba' });
    state.setFlag(F.sanctuaryIntro); state.setFlag(F.sentir);
    state.setVar('b16_mesprit_respuesta', 'entiendo');
    state.setSelfSwitch(FLOORS[0], item, 'A');
    const env = await setup(FLOORS[0], state);
    env.player.moveTo(point.x, point.y);
    const warps = [];
    await env.def.onEnter({ ...env, warp: async (...args) => warps.push(args) });
    assert.deepEqual(warps[0].slice(0, 3), [target, point.x, point.y]);
    assert.ok(state.selfSwitch(target, item, 'A'), 'recogidas anteriores conservadas antes del cambio de mapa');
    assert.equal(state.var('b16_mesprit_respuesta'), 'entiendo');
    assert.ok(state.flag(F.sentir));
  }
});

test('P8: las páginas postgame de Uxie/Azelf y los espejos de Mesprit existen en sus pisos correspondientes', async () => {
  for (const [i, id] of FLOORS.entries()) {
    const { def } = await setup(id);
    const reflections = def.events.filter((e) => e.id.startsWith('b22a_reflejo_'));
    assert.equal(reflections.length, i === 1 ? 3 : 0, 'los reflejos están en las salas transitables del piso 2');
    for (const npc of ['uxie', 'azelf'].filter((e) => def.events.some((x) => x.id === e))) {
      assert.ok(def.events.find((e) => e.id === npc).pages.length > 1, 'captura normal postgame conservada');
    }
  }
});

test('P8: el sello del Telar está en el tercer piso y sigue exigiendo las tres Hebras', async () => {
  const { def } = await setup(FLOORS[2]);
  const event = def.events.find((e) => e.id === 'sello_telar');
  assert.ok(event);
  const state = GameState.create({ name: 'Prueba' });
  const warps = [];
  await event.pages[0].script({ state, flag: (f) => state.flag(f), say: async () => {}, warp: async (...args) => warps.push(args) });
  assert.deepEqual(warps, []);
  assert.ok(!state.flag(F.telarOpen));
  assert.deepEqual([event.x, event.y], [PATIO.seal.x, PATIO.seal.y]);
});

test('P8: las partidas restauradas pueden volver al Telar aunque procedan de una versión sin el flag del sello', async () => {
  const { def } = await setup(FLOORS[2]);
  const seal = def.events.find((e) => e.id === 'sello_telar');
  const state = GameState.create({ name: 'Prueba' });
  state.setFlag(F.restored);
  const open = seal.pages.at(-1);
  assert.ok(open.when(state), 'la restauración ya implica que se abrió el Telar');
  const warps = [];
  await open.script({ state, say: async () => {}, confirm: async () => true, se: () => {}, map: { id: FLOORS[2] }, warp: async (...args) => warps.push(args) });
  assert.deepEqual(warps[0].slice(0, 3), [FLOORS[2], TELAR.entry.arrive.x, TELAR.entry.arrive.y]);
  assert.equal(state.itemCount('REDCHAIN'), 0, 'volver no vuelve a dar premios');
});

test('P8: MapScene conserva las coordenadas antiguas antes de buscar suelo en una planta remodelada', async () => {
  globalThis.location ??= { search: '', href: 'http://localhost/' };
  globalThis.window ??= {};
  const { default: MapScene } = await import('../game/src/world/mapScene.js');
  for (const [point, target] of [[SENTIR.mirrors[0].entry, FLOORS[1]], [SENTIR.cell, FLOORS[1]], [QUERER.azelf.entry.arrive, FLOORS[2]], [TELAR.spot, FLOORS[2]]]) {
    const env = await setup(FLOORS[0]);
    const scene = Object.assign(Object.create(MapScene.prototype), {
      state: env.state, world: env.world, visible: new Map(),
      worldView: { clearMaps() {}, addMap() {} }, camera: { setBounds() {}, follow() {}, snapToTarget() {} },
      refreshFollower() {}, announce() {}, runScript() {},
      loadNeighbors: async () => {}, applyEnvironment: async () => {},
      loadEntry: async (id) => (await buildMapNode(id)).entry,
    });
    await scene.enterMap(FLOORS[0], point.x, point.y, 8);
    assert.deepEqual([env.state.player.mapId, env.state.player.x, env.state.player.y], [target, point.x, point.y]);
  }
});

test('P8: al subir desde otra sala, las recogidas antiguas desaparecen de la planta nueva antes de poder repetirse', async () => {
  const state = GameState.create({ name: 'Prueba' });
  state.setSelfSwitch(FLOORS[0], 'objeto_alma_3', 'A');
  const env = await setup(FLOORS[1], state);
  const item = env.world.events.find((e) => e.id === 'objeto_alma_3');
  assert.ok(item.page);
  await env.def.onEnter({ ...env, requestRefresh: () => env.world.refreshEvents() });
  assert.ok(!item.page, 'la recogida migrada se aplica a la página visible');
});
