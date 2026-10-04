// Contratos funcionales de P9 vertical: tres plantas, progresión, retornos y guardados anteriores.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import puente from '../game/src/content/maps/b18/puente_convergencia.js';
import cruce from '../game/src/content/maps/b18/camara_cruce.js';
import senda from '../game/src/content/maps/b17/senda_mirador.js';
import sur from '../game/src/content/maps/b17/mirador_sur.js';
import { F, V } from '../game/src/content/events/b18_common.js';
import { CRUCE, NUCLEO, SHORTCUT, ENTRY } from '../game/src/content/maps/b18/cruce_layout.js';
import { MOUTH } from '../game/src/content/maps/b18/puente_layout.js';
import { entryState, fieldWorld, fieldCtx, runEvent, DV, NAME_DIR, key } from './b18_helpers.mjs';

const coreDef = async () => (await import('../game/src/content/maps/b18/camara_cruce_nucleo.js')).default;
const allFlags = [F.arrival, F.gap1, F.gap2, F.gap3, F.bridge, F.casia, F.garrido, F.vertice, F.irruption, F.scene];

function reachable(t, start) {
  const seen = new Set([key(...start)]), q = [start];
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    t.p.moveTo(x, y);
    for (const d of [2, 4, 6, 8]) {
      const nx = x + DV[d][0], ny = y + DV[d][1], k = key(nx, ny);
      if (t.w.events.some((e) => e.page && e.x === nx && e.y === ny && e.id.startsWith('paso_agente_puente_'))) continue;
      if (seen.has(k) || !t.map.valid(nx, ny) || !t.p.passable(x, y, d)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

test('P9: puente, puzzles y legendarios ocupan tres plantas interiores distintas', async () => {
  const core = await coreDef();
  for (const [def, floor] of [[puente, 1], [cruce, 2], [core, 3]]) {
    assert.deepEqual(def.pillar, { id: 'P9', floor });
    assert.equal(def.outdoor, false);
  }
  assert.ok(!cruce.events.some((e) => ['dialga', 'palkia', 'nucleo_p9'].includes(e.id)));
  assert.ok(core.events.some((e) => e.id === 'nucleo_p9'));
  assert.deepEqual(core.start, { x: NUCLEO.stairs.arrive.x, y: NUCLEO.stairs.arrive.y, dir: 8 });
});

test('P9: salida del puzzle y atajo suben al núcleo; bajar vuelve fuera del disparador', async () => {
  const core = await coreDef();
  for (const p of [CRUCE.gate.warp, SHORTCUT.warp]) {
    const up = cruce.warps.find((w) => w.x === p.x && w.y === p.y);
    assert.equal(up?.to, core.id);
    assert.deepEqual([up.tx, up.ty], [NUCLEO.stairs.arrive.x, NUCLEO.stairs.arrive.y]);
  }
  for (const p of NUCLEO.stairs.exits) {
    const down = core.warps.find((w) => w.x === p.x && w.y === p.y);
    assert.equal(down?.to, cruce.id);
    assert.deepEqual([down.tx, down.ty], [SHORTCUT.front.x, SHORTCUT.front.y]);
    assert.ok(!cruce.warps.some((w) => w.x === down.tx && w.y === down.ty));
  }
});

test('P9: los guardados dentro del núcleo antiguo migran sin alterar elección, orbe, descanso ni switches', async () => {
  const s = entryState();
  s.setPosition(cruce.id, NUCLEO.coreFront.x, NUCLEO.coreFront.y, 8);
  for (const f of [F.scene, F.nucleus, F.bound, F.orb, F.restored]) s.setFlag(f);
  s.setVar(V.choice, 'PALKIA'); s.setVar(V.chosenRest, 4); s.setVar(V.restCount, 5);
  s.setSelfSwitch(cruce.id, 'nucleo_p9', 'A', true);
  const before = JSON.stringify({ flags: s.data.flags, vars: s.data.vars, money: s.player.money });
  const t = await fieldWorld(cruce.id, { state: s });
  t.p.moveTo(NUCLEO.coreFront.x, NUCLEO.coreFront.y); t.p.direction = 8;
  const ctx = fieldCtx(t);
  await cruce.onEnter(ctx);
  assert.deepEqual(ctx.log.warps, [{ mapId: 'camara_cruce_nucleo', x: NUCLEO.coreFront.x, y: NUCLEO.coreFront.y, dir: 8 }]);
  assert.equal(s.selfSwitch('camara_cruce_nucleo', 'nucleo_p9', 'A'), true);
  assert.equal(JSON.stringify({ flags: s.data.flags, vars: s.data.vars, money: s.player.money }), before);
});

test('P9: guardar en el piso del puzzle no mueve al jugador al núcleo', async () => {
  const t = await fieldWorld(cruce.id, { flags: [F.scene, F.chamberIn] });
  t.p.moveTo(ENTRY.x, ENTRY.y);
  const ctx = fieldCtx(t);
  await cruce.onEnter(ctx);
  assert.deepEqual(ctx.log.warps, []);
});

test('P9: la llegada antigua se redirige antes de buscar la casilla libre del mapa del puzzle', async () => {
  globalThis.location ??= { search: '', href: 'http://localhost/' };
  globalThis.window ??= {};
  const { default: MapScene } = await import('../game/src/world/mapScene.js');
  const { buildMapNode } = await import('../tools/lib/map_node.mjs');
  const s = entryState();
  const t = await fieldWorld('camara_cruce', { state: s });
  const loaded = [];
  const scene = Object.assign(Object.create(MapScene.prototype), {
    state: s, world: t.w, visible: new Map(),
    worldView: { clearMaps() {}, addMap() {} },
    camera: { setBounds() {}, follow() {}, snapToTarget() {} },
    refreshFollower() {}, announce() {}, runScript() {},
    loadNeighbors: async () => {}, applyEnvironment: async () => {},
    loadEntry: async (id) => { loaded.push(id); return (await buildMapNode(id)).entry; },
  });
  await scene.enterMap('camara_cruce', 48, 10, 8);
  assert.equal(s.player.mapId, 'camara_cruce_nucleo');
  assert.deepEqual([s.player.x, s.player.y], [48, 10]);
  assert.ok(loaded.includes('camara_cruce_nucleo'));
});

test('P9: los switches del núcleo antiguo también llegan al subir desde un guardado en otra sala', async () => {
  const s = entryState();
  s.setSelfSwitch('camara_cruce', 'nucleo_llegada_48', 'B', true);
  s.setSelfSwitch('camara_cruce', 'objeto_vestibulo', 'A', true);
  const t = await fieldWorld('camara_cruce_nucleo', { state: s, flags: [F.scene] });
  t.p.moveTo(NUCLEO.stairs.arrive.x, NUCLEO.stairs.arrive.y);
  await t.def.onEnter(fieldCtx(t));
  assert.equal(s.selfSwitch('camara_cruce_nucleo', 'nucleo_llegada_48', 'B'), true);
  assert.equal(s.selfSwitch('camara_cruce_nucleo', 'objeto_vestibulo', 'A'), false);
});

test('P9: Alerce camina hasta el jugador y vuelve tras Casia sin teleportarse ni pisar vacío', async () => {
  const t = await fieldWorld(puente.id, { flags: [F.arrival, F.gap1, F.gap2, F.gap3, F.bridge] });
  t.p.moveTo(20, 32);
  const ctx = fieldCtx(t, { battles: ['win'] });
  const al = t.w.events.find((e) => e.id === 'alerce_borde');
  const originalMove = ctx.move;
  const originalPosition = al.moveTo.bind(al);
  let walking = false, steps = 0;
  al.moveTo = (x, y) => {
    assert.ok(walking, 'Alerce cambia de casilla fuera de una ruta');
    assert.ok(!t.map.isVoid(x, y) && t.map.playerPassable(x, y, 0, {}), `Alerce pisa (${x},${y})`);
    originalPosition(x, y); steps++;
  };
  ctx.move = async (who, route, opts) => {
    if (who === al) { walking = true; try { await originalMove(who, route, opts); } finally { walking = false; } }
    else await originalMove(who, route, opts);
  };
  await runEvent(ctx, 'casia');
  assert.ok(steps >= 4 && t.state.flag(F.heal1));
  assert.deepEqual([al.x, al.y], [15, 31]);
});

test('P9: la escalinata al puzzle queda sellada por todos sus lados hasta la irrupción', async () => {
  const before = await fieldWorld(puente.id, { flags: allFlags.filter((f) => f !== F.irruption && f !== F.scene) });
  const blocked = reachable(before, [20, 31]);
  assert.ok(![[20, 41], [19, 41], [21, 41], [20, 40]].some(([x, y]) => blocked.has(key(x, y))));
  const after = await fieldWorld(puente.id, { flags: allFlags });
  assert.ok(reachable(after, [20, 31]).has(key(MOUTH.warp.x, MOUTH.warp.y)));
});

test('P9: la columna visible tiene entrada alcanzable y no permite saltarse la Vigilia', async () => {
  const open = await fieldWorld(senda.id);
  assert.ok(senda.warps.some((w) => w.x === 20 && w.y === 48 && w.to === puente.id));
  const route = reachable(open, [20, 37]);
  assert.ok(route.has('20,49'), 'no se alcanza la puerta desde la explanada');
  assert.ok(!open.map.isVoid(20, 49), 'el retorno exterior queda sobre el vacío');
  assert.ok(!open.map.isVoid(20, 40), 'la columna no se ve sobre la Sima');
  assert.ok(!open.map.playerPassable(20, 40, 0, {}), 'se camina a través de la columna');
  const closedState = entryState(); closedState.setFlag('b17_vigilia', false);
  const closed = await fieldWorld(senda.id, { state: closedState });
  const early = reachable(closed, [20, 37]);
  assert.ok(!early.has('20,49'), 'el nuevo rellano rodea el cordón policial');
});

test('P9: ambos Miradores se enlazan al puente por warps y pueden volver antes/después del P9', async () => {
  assert.ok(!puente.connections?.length);
  assert.ok(!senda.connections.some((c) => c.to === puente.id));
  assert.ok(!sur.connections.some((c) => c.to === puente.id));
  const north = puente.warps.find((w) => w.y === 0 && w.dirTrigger === 8);
  const south = puente.warps.find((w) => w.y === 59 && w.dirTrigger === 2);
  assert.equal(north?.to, senda.id);
  assert.deepEqual([north.tx, north.ty], [20, 49]);
  assert.equal(south?.to, sur.id);
  assert.ok(sur.warps.some((w) => w.y === 0 && w.dirTrigger === 8 && w.to === puente.id));
  for (const flags of [allFlags, [...allFlags, F.restored, 'game_cleared', 'b21_fin']]) {
    const t = await fieldWorld(puente.id, { flags });
    const r = reachable(t, [20, 31]);
    assert.ok(r.has('20,0'));
    assert.equal(r.has('20,59'), flags.includes(F.restored));
  }
});
