import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import p1Base from '../game/src/content/maps/b02/ruinas_dintel_base.js';
import p1Puzzle from '../game/src/content/maps/b02/ruinas_dintel.js';
import p1Core from '../game/src/content/maps/b02/ruinas_dintel_nucleo.js';
import p2Base from '../game/src/content/maps/b04/pilar_corriente_base.js';
import p2Puzzle from '../game/src/content/maps/b04/pilar_corriente.js';
import p2Core from '../game/src/content/maps/b04/pilar_corriente_nucleo.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { F as P1 } from '../game/src/content/events/b02_common.js';
import { F as P2 } from '../game/src/content/events/b04_common.js';
import { dx, dy } from '../game/src/world/gameMap.js';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../game/src/world/mapEvent.js';

function reachable(entry, state, x0, y0, avoid = []) {
  const blocked = new Set(avoid.map(({ x, y }) => `${x},${y}`));
  for (const [i, raw] of entry.def.events.entries()) {
    const ev = normalizeEventDef(expandEventDef(raw), i);
    const page = [...ev.pages].reverse().find((p) => !p.when || p.when(state, { selfSwitch: () => false }));
    for (const [x, y, layer, id] of page?.patch || []) entry.map.setTile(x, y, layer, id);
    if (page && !page.through && (page.solid || page.sprite)) blocked.add(`${ev.x},${ev.y}`);
  }
  const map = entry.map;
  const seen = new Set([`${x0},${y0}`]);
  const queue = [[x0, y0]];
  const player = { isPlayer: true };
  for (let i = 0; i < queue.length; i++) {
    const [x, y] = queue[i];
    for (const d of [2, 4, 6, 8]) {
      const nx = x + dx(d); const ny = y + dy(d); const key = `${nx},${ny}`;
      if (seen.has(key) || blocked.has(key) || !map.valid(nx, ny)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      seen.add(key); queue.push([nx, ny]);
    }
  }
  return seen;
}

for (const [id, floors, trainers, boss] of [
  ['P1', [p1Base, p1Puzzle, p1Core], 3, 'columna_hueca'],
  ['P2', [p2Base, p2Puzzle, p2Core], 4, 'nucleo'],
]) {
  test(`${id}: tres pisos, entrenadores abajo, puzzle separado del Guardián`, async () => {
    assert.deepEqual(floors.map((f) => f.pillar), [1, 2, 3].map((floor) => ({ id, floor })));
    assert.equal(floors[0].events.filter((e) => e.type === 'trainer').length, trainers);
    assert.equal(floors[1].events.filter((e) => e.type === 'trainer').length, 0);
    assert.ok(!floors[1].events.some((e) => e.id === boss));
    assert.ok(floors[2].events.some((e) => e.id === boss));
    assert.ok(floors[0].warps.some((w) => w.to === floors[1].id));
    assert.ok(floors[1].warps.some((w) => w.to === floors[0].id));
    assert.ok(floors[1].warps.some((w) => w.to === floors[2].id));
    assert.ok(floors[2].warps.some((w) => w.to === floors[1].id));
    for (const f of floors) {
      const { warnings, entry } = await buildMapNode(f.id);
      assert.deepEqual(warnings, [], `${f.id}: construcción válida`);
      assert.ok(entry.map.passableStrict(f.start.x, f.start.y), `${f.id}: llegada transitable`);
      for (const w of f.warps) assert.ok(entry.map.valid(w.x, w.y), `${f.id}: escalera dentro del mapa`);
    }
    const base = (await buildMapNode(floors[0].id)).entry;
    const cells = reachable(base, GameState.create({ name: 'Prueba' }), floors[0].start.x, floors[0].start.y);
    for (const w of floors[0].warps) assert.ok(cells.has(`${w.x},${w.y}`), `${id}: se llega a ambas escaleras`);
    for (const t of floors[0].events.filter((e) => e.type === 'trainer')) {
      assert.ok([2, 4, 6, 8].some((d) => cells.has(`${t.x + dx(d)},${t.y + dy(d)}`)), `${id}: se puede hablar con ${t.id}`);
    }
  });
  test(`${id}: entrenadores ya vencidos se conservan al cargar partidas anteriores`, async () => {
    const s = GameState.create({ name: 'Prueba' });
    const t = floors[0].events.find((e) => e.type === 'trainer');
    s.setSelfSwitch(floors[1].id, t.id, 'A');
    await floors[0].onEnter({ state: s });
    assert.ok(s.selfSwitch(floors[0].id, t.id, 'A'));
  });
}

test('P1 y P2: subir exige el puzzle, pero bajar siempre permite salir', () => {
  const s = GameState.create({ name: 'Prueba' });
  const g1 = p1Puzzle.events.find((e) => e.id === 'escalera_nucleo_cerrada');
  const g2 = p2Puzzle.events.find((e) => e.id === 'escalera_nucleo_cerrada');
  assert.ok(g1.when(s));
  assert.ok(g2.when(s));
  // Los warps sobre un tile sólido responden al empujarlo: el bloqueo tiene que consumir ese contacto.
  assert.equal(g1.trigger, 'touch');
  assert.equal(g2.trigger, 'touch');
  s.setFlag(P1.dinteles); s.setFlag(P1.rockBroken); s.setFlag(P2.cycle);
  assert.equal(g1.when(s), false);
  assert.equal(g2.when(s), false);
  assert.ok(p1Core.warps.length && p2Core.warps.length);
});

test('P1: una partida guardada en el antiguo núcleo conserva un camino de ascenso y regreso', async () => {
  const s = GameState.create({ name: 'Prueba' });
  for (const f of [P1.casildaJoined, P1.dinteles, P1.rockBroken, P1.casildaBeaten]) s.setFlag(f);
  const { entry } = await buildMapNode('ruinas_dintel');
  const cells = reachable(entry, s, 35, 21);
  assert.ok(cells.has('35,20'), 'el antiguo pedestal es ahora una escalera');
  assert.ok(cells.has('21,34'), 'se puede volver por el puzzle a la entrada');
});

test('P2: la puerta y la tercera baliza se alcanzan por escaleras a ambos lados de la columna', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag(P2.clash);
  const { entry } = await buildMapNode('garganta_albo');
  const cells = reachable(entry, s, 24, 14);
  assert.ok(cells.has('26,10'), 'pie de la puerta');
  assert.ok(cells.has('21,5'), 'tercera baliza');
  assert.ok(cells.has('31,5'), 'escalera oriental');
});

test('P2: al bajar del núcleo se sale del puzzle sin volver a pisar el warp de ascenso', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag(P2.cycle); s.setFlag(P2.restored);
  const { entry } = await buildMapNode('pilar_corriente');
  const down = p2Core.warps[0];
  const up = p2Puzzle.warps.find((w) => w.to === p2Core.id);
  const cells = reachable(entry, s, down.tx, down.ty, [up]);
  assert.ok(cells.has('20,37'), 'se llega a la salida sin rebote');
});
