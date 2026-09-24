// Servicios de pueblo (content/services): Centro Pokémon (plantilla, curación con máquina y punto de cura),
// tiendas con stock por progreso, posada, tutor y recordador de movimientos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  pokemonCenterMap, pokemonCenterHeal, nurseEvent, CENTER_LAYOUT, CENTER_ENTRY,
} from '../game/src/content/services/pokecenter.js';
import { ballsFrame, ballCount, playHealMachine } from '../game/src/content/services/healMachine.js';
import { shopStock, STOCK_TABLES, openMart, clerkEvent, shopMap, SHOP_LAYOUT } from '../game/src/content/services/shop.js';
import { runInn, runRest, innkeeperEvent, restSpotEvent } from '../game/src/content/services/inn.js';
import {
  relearnableMoves, tutorCanLearn, tutorAnnotation, costLabel, canAfford, payCost, runMoveTutor, runMoveReminder,
  moveTutorEvent, moveReminderEvent, withLearnedMove,
} from '../game/src/content/services/moveTeaching.js';
import { restoredPillars, meetsProgress, campaignProgress } from '../game/src/content/services/stages.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { GameState } from '../game/src/core/state.js';
import { createPokemon, maxHP } from '../game/src/battle/core/pokemon.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}.json`, import.meta.url)));
const db = { species: load('species'), moves: load('moves'), items: { ...load('items'), ...load('items_axis') } };
const rng = () => 0.3;
const mk = (sp, lv, extra = {}) => ({ ...createPokemon(db, sp, lv, { rng }), ...extra });

/** Contexto de guion falso: registra textos, responde a confirm/choice y simula el runner. */
function fakeCtx(state, { confirms = [], choices = [], party = null, extra = {} } = {}) {
  const said = [];
  const spawned = [];
  const removed = [];
  const heal = [];
  const ctx = {
    state, db, said, spawned, removed, heal,
    player: { x: CENTER_LAYOUT.front.x, y: CENTER_LAYOUT.front.y, direction: 8 },
    world: {
      spawnEvent: (def) => { const ev = { ...def }; spawned.push(ev); return ev; },
      removeEvent: (ev) => removed.push(ev),
    },
    scene: { runner: { until: async (pred) => { for (let i = 0; i < 5000 && !pred(); i++); } } },
    say: async (t) => { said.push(t); },
    confirm: async (t) => { said.push(t); return confirms.length ? confirms.shift() : true; },
    choice: async (items, opts = {}) => { said.push(opts.message || ''); return choices.length ? choices.shift() : 0; },
    wait: async () => {},
    se: () => {},
    me: () => undefined,
    face: () => {},
    turnToPlayer: () => {},
    heal: () => state.setParty(state.party.map((p) => ({ ...p, hp: maxHP(db, p) }))),
    setHealPoint: (x, y, dir = 2, mapId = 'centro_prueba') => { heal.push({ x, y, dir }); state.setHealPoint(mapId, x, y, dir); },
    ui: {
      openShop: async (items, opts) => { ctx.shop = { items, opts }; },
      openParty: async () => (party === null ? 0 : party),
      learnMove: async (p) => (p.moves.length < 4 ? p.moves.length : 0),
    },
    ...extra,
  };
  return ctx;
}

function stateWith(...mons) {
  const st = GameState.create({ name: 'Prueba' });
  for (const m of mons) st.addPokemon(m);
  return st;
}

// ------------------------------------------------------------ progreso
test('progreso: Pilares restaurados y requisitos', () => {
  const st = GameState.create({ name: 'Prueba' });
  assert.equal(restoredPillars(st), 0);
  st.setFlag('p1_restored');
  st.setFlag('p3_restored');
  assert.equal(restoredPillars(st), 2);
  assert.equal(meetsProgress(st, { pillars: 2 }), true);
  assert.equal(meetsProgress(st, { pillars: 3 }), false);
  assert.equal(meetsProgress(st, { cleared: true }), false);
  assert.deepEqual(campaignProgress(null), { pillars: 0, cleared: false });
});

// ------------------------------------------------------------ tiendas
test('tienda: el stock general crece con los Pilares y admite extra/remove/lista fija', () => {
  const st = GameState.create({ name: 'Prueba' });
  assert.deepEqual(shopStock(st), ['POKEBALL', 'POTION', 'ANTIDOTE', 'PARALYZEHEAL', 'AWAKENING']);
  ['p1_restored', 'p2_restored', 'p3_restored'].forEach((f) => st.setFlag(f));
  const three = shopStock(st);
  assert.ok(three.includes('GREATBALL') && three.includes('SUPERREPEL') && three.includes('REVIVE'));
  assert.ok(!three.includes('ULTRABALL'));
  assert.ok(shopStock(st, { pillars: 8 }).includes('FULLRESTORE'));
  assert.deepEqual(shopStock(st, { items: ['POTION', 'POTION', 'REPEL'], remove: ['REPEL'] }), ['POTION']);
  assert.deepEqual(shopStock(st, { list: 'fishing', extra: ['POKEBALL'] }), ['NETBALL', 'DIVEBALL', 'LUREBALL', 'POKEBALL']);
  assert.throws(() => shopStock(st, { list: 'nada' }), /desconocida/);
});

test('tienda: todos los objetos de las tablas existen y tienen precio', () => {
  for (const [name, tiers] of Object.entries(STOCK_TABLES)) {
    for (const tier of tiers) {
      for (const id of tier.items) {
        assert.ok(db.items[id], `${name}: ${id} no existe`);
        assert.ok(db.items[id].price > 0, `${name}: ${id} sin precio`);
      }
    }
  }
});

test('tienda: el dependiente abre ui.openShop con el stock y avisa si no hay nada', async () => {
  const st = GameState.create({ name: 'Prueba' });
  const ctx = fakeCtx(st);
  const ev = clerkEvent({ x: 1, y: 2, dir: 4, greeting: '¡Hola!', extra: ['NETBALL'] });
  assert.equal(ev.dir, 4);
  await ev.script(ctx);
  assert.deepEqual(ctx.shop.items, [...shopStock(st), 'NETBALL']);
  assert.equal(ctx.shop.opts.greeting, '¡Hola!');
  const empty = fakeCtx(st);
  assert.deepEqual(await openMart(empty, { items: [] }), []);
  assert.match(empty.said[0], /nada a la venta/);
  assert.throws(() => clerkEvent({ x: 1 }), /enteros/);
});

test('tienda: plantilla de interior con salida, dependiente y estanterías sólidas', async () => {
  const def = shopMap({ id: 'tienda_prueba', exit: { map: 'villa_zaguan', x: 12, y: 9 }, list: 'fishing' });
  assert.equal(def.tileset, 4);
  assert.equal(def.name, 'Villa Zaguán', 'nombre de la población de salida');
  assert.equal(def.bgm, 'PrismaVilla2', 'música de la población');
  assert.equal(def.warps.length, 3);
  for (const w of def.warps) assert.deepEqual([w.to, w.tx, w.ty, w.dirTrigger], ['villa_zaguan', 12, 9, 2]);
  const clerk = def.events.find((e) => e.id === 'dependiente');
  assert.deepEqual([clerk.x, clerk.y], [SHOP_LAYOUT.clerk.x, SHOP_LAYOUT.clerk.y]);
  assert.ok(def.events.filter((e) => e.id.startsWith('estante')).every((e) => e.solid));
  assert.throws(() => shopMap({ exit: { map: 'x', x: 1, y: 1 } }), /id/);
  assert.throws(() => shopMap({ id: 'sin_salida' }).warps, /destino/);
  const { entry } = await buildMapNode('dev_services_tienda');
  const m = entry.map;
  const c = SHOP_LAYOUT.clerk;
  assert.ok(m.counter(c.x - 1, c.y), 'mostrador entre el jugador y el dependiente');
  assert.ok(m.playerPassable(c.x - 2, c.y, 6, {}), 'el jugador puede ponerse delante del mostrador');
});

// ------------------------------------------------------------ Centro Pokémon
test('Centro: la plantilla necesita id y salida y coloca enfermera, PC, tienda y descanso', () => {
  assert.throws(() => pokemonCenterMap({ exit: { map: 'x', x: 1, y: 1 } }), /id/);
  assert.throws(() => pokemonCenterMap({ id: 'c' }), /destino/);
  const def = pokemonCenterMap({ id: 'caudal_centro', exit: { map: 'ciudad_caudal', x: 30, y: 20 } });
  assert.equal(def.name, 'Ciudad Caudal');
  assert.equal(def.bgm, 'pokecenter');
  assert.deepEqual(def.start, { x: CENTER_ENTRY.tx, y: CENTER_ENTRY.ty, dir: 8 });
  const ids = def.events.map((e) => e.id);
  assert.equal(new Set(ids).size, ids.length, 'ids de evento únicos');
  for (const id of ['enfermera', 'pc_0', 'pc_1', 'dependiente', 'descanso']) assert.ok(ids.includes(id), id);
  assert.ok(def.events.filter((e) => e.id.startsWith('pc_')).every((e) => e.solid));
  const bare = pokemonCenterMap({ id: 'c2', exit: { map: 'm', x: 1, y: 1 }, shop: false, pc: false, rest: false });
  assert.ok(!bare.events.some((e) => ['dependiente', 'pc_0', 'descanso'].includes(e.id)));
});

test('Centro: geometría construida (mostrador de la enfermera y de la tienda, casilla de cura pisable)', async () => {
  const { entry, warnings } = await buildMapNode('dev_services_centro');
  assert.deepEqual(warnings, []);
  const m = entry.map;
  const L = CENTER_LAYOUT;
  assert.ok(m.playerPassable(L.front.x, L.front.y, 8, {}), 'casilla de cura pisable');
  assert.ok(m.counter(L.front.x, L.front.y - 1), 'mostrador delante de la enfermera');
  assert.equal(L.nurse.y, L.front.y - 2, 'la enfermera queda justo detrás del mostrador');
  assert.ok(m.counter(L.clerk.x - 1, L.clerk.y), 'mostrador de la tienda');
  assert.ok(m.playerPassable(L.clerk.x - 2, L.clerk.y, 6, {}), 'delante de la tienda pisable');
  assert.ok(m.playerPassable(L.pc.x, L.pc.y + 3, 8, {}), 'delante del PC pisable');
  for (const w of entry.def.warps) assert.ok(m.valid(w.x, w.y));
});

test('Centro: curar recupera el equipo, anima la máquina y fija el punto de cura delante de la enfermera', async () => {
  const st = stateWith(mk('PIKACHU', 12, { hp: 1 }), mk('BIDOOF', 8, { hp: 0 }));
  const ctx = fakeCtx(st);
  const ok = await nurseEvent().script(ctx);
  assert.equal(ok, true);
  assert.ok(st.party.every((p) => p.hp === maxHP(db, p)), 'equipo curado');
  assert.deepEqual(st.healPoint, { mapId: 'centro_prueba', x: CENTER_LAYOUT.front.x, y: CENTER_LAYOUT.front.y, dir: 8 });
  assert.equal(ctx.spawned.length, 1, 'se crean las balls');
  assert.deepEqual([ctx.spawned[0].characterName, ctx.spawned[0].direction], ['anil:Healing balls 1', 6], 'dos balls');
  assert.deepEqual(ctx.removed, ctx.spawned, 'y se retiran');
  assert.match(ctx.said.at(-1), /volver a verte/);

  const no = stateWith(mk('PIKACHU', 12, { hp: 1 }));
  const ctxNo = fakeCtx(no, { confirms: [false] });
  assert.equal(await pokemonCenterHeal(ctxNo), false);
  assert.equal(no.party[0].hp, 1, 'sin curar si dice que no');
  assert.equal(no.healPoint, null);
  const empty = GameState.create({ name: 'Prueba' });
  assert.equal(await pokemonCenterHeal(fakeCtx(empty)), false);
});

test('Centro: fotogramas de las Poké Balls de la máquina (1–6)', async () => {
  assert.deepEqual(ballsFrame(1), { sprite: 'anil:Healing balls 1', dir: 4 });
  assert.deepEqual(ballsFrame(3), { sprite: 'anil:Healing balls 1', dir: 8 });
  assert.deepEqual(ballsFrame(4), { sprite: 'anil:Healing balls 2', dir: 4 });
  assert.deepEqual(ballsFrame(9), { sprite: 'anil:Healing balls 2', dir: 8 });
  assert.equal(ballCount(Array(8).fill({})), 6);
  assert.equal(ballCount([]), 0);
  const st = GameState.create({ name: 'Prueba' });
  const ctx = fakeCtx(st);
  let healed = 0;
  await playHealMachine(ctx, { x: 1, y: 1, count: 0, onHeal: () => { healed += 1; } });
  assert.equal(healed, 1, 'sin Pokémon no hay balls pero se cura igual');
  assert.equal(ctx.spawned.length, 0);
});

// ------------------------------------------------------------ posada y descanso
test('posada: cobra solo si se descansa y delega en ctx.rest (world/rest.js)', async () => {
  const st = GameState.create({ name: 'Prueba' });
  const calls = [];
  const rested = fakeCtx(st, { extra: { rest: async (opts) => { calls.push(opts); return { rested: true }; } } });
  await innkeeperEvent({ x: 1, y: 1, price: 100, storm: true }).script(rested);
  assert.deepEqual(calls, [{ kind: 'inn', storm: true }]);
  assert.equal(st.player.money, 2900);
  const cancelled = fakeCtx(st, { extra: { rest: async () => ({ rested: false }) } });
  await runInn(cancelled, { price: 100 });
  assert.equal(st.player.money, 2900, 'cancelar no cobra');
  st.addMoney(-st.player.money);
  const poor = fakeCtx(st, { extra: { rest: async () => ({ rested: true }) } });
  assert.deepEqual(await runInn(poor, { price: 100 }), { rested: false });
  const none = fakeCtx(st);
  assert.deepEqual(await runRest(none, { kind: 'center' }), { rested: false });
  assert.match(none.said[0], /no se puede descansar/);
  const spot = restSpotEvent('sofa', 3, 4);
  assert.equal(spot.solid, true);
  const spotCalls = [];
  await spot.script(fakeCtx(st, { extra: { rest: async (o) => { spotCalls.push(o.kind); return { rested: true }; } } }));
  assert.deepEqual(spotCalls, ['center']);
});

// ------------------------------------------------------------ tutor y recordador
test('movimientos: quién aprende del tutor, qué se recuerda y costes', () => {
  const pika = mk('PIKACHU', 12);
  assert.equal(tutorCanLearn(db, pika, 'THUNDERPUNCH'), true);
  assert.equal(tutorCanLearn(db, pika, 'FIREPUNCH'), false);
  assert.equal(tutorCanLearn(db, pika, 'NOEXISTE'), false);
  assert.equal(tutorAnnotation(db, pika, 'FIREPUNCH'), 'NO APTO');
  const known = pika.moves.map((m) => m.id);
  assert.equal(tutorAnnotation(db, pika, known[0]), 'APRENDIDO');
  const again = relearnableMoves(db, pika);
  assert.ok(again.length > 0);
  assert.ok(again.every((m) => !known.includes(m)), 'no ofrece los que ya sabe');
  assert.ok(!again.includes('ELECTROBALL') || pika.level >= 12);
  assert.ok(!relearnableMoves(db, mk('PIKACHU', 5)).includes('DOUBLEKICK'), 'no ofrece los de nivel superior');
  assert.deepEqual(relearnableMoves(db, { ...pika, egg: true }), []);
  assert.equal(costLabel(db, { money: 2000 }), '2.000 $');
  assert.equal(costLabel(db, { item: 'HEARTSCALE', count: 2 }), `2 ${db.items.HEARTSCALE.namePlural}`);
  assert.equal(costLabel(db, null), '');
  const st = GameState.create({ name: 'Prueba' });
  assert.equal(canAfford(st, { money: 3000 }), true);
  assert.equal(canAfford(st, { item: 'HEARTSCALE' }), false);
  payCost(st, { money: 500 });
  assert.equal(st.player.money, 2500);
  const four = withLearnedMove(db, { ...pika, moves: pika.moves.slice(0, 4) }, 'THUNDERPUNCH', 1);
  assert.equal(four.moves[1].id, 'THUNDERPUNCH');
  assert.ok(four.moves.length <= 4);
});

test('tutor: enseña al Pokémon elegido y cobra; rechaza a quien no puede aprenderlo', async () => {
  const st = stateWith(mk('PIKACHU', 12, { moves: [{ id: 'TACKLE', pp: 35, ppUps: 0 }] }));
  const ctx = fakeCtx(st, { choices: [0] });
  const ok = await runMoveTutor(ctx, { moves: ['THUNDERPUNCH', { move: 'FIREPUNCH', cost: { money: 1 } }], cost: { money: 500 } });
  assert.equal(ok, true);
  assert.ok(st.party[0].moves.some((m) => m.id === 'THUNDERPUNCH'));
  assert.equal(st.player.money, 2500);
  const no = fakeCtx(st, { choices: [1] });
  assert.equal(await runMoveTutor(no, { moves: ['THUNDERPUNCH', 'FIREPUNCH'] }), false);
  assert.match(no.said.at(-1), /no puede aprender/);
  const ev = moveTutorEvent({ x: 1, y: 1, moves: ['THUNDERPUNCH'] });
  assert.equal(typeof ev.script, 'function');
  assert.throws(() => moveTutorEvent({ moves: [] }), /enteros/);
});

test('recordador: devuelve un movimiento olvidado a cambio de una Escama Corazón', async () => {
  const st = stateWith(mk('PIKACHU', 12, { moves: [{ id: 'TACKLE', pp: 35, ppUps: 0 }] }));
  const poor = fakeCtx(st);
  assert.equal(await runMoveReminder(poor, { cost: { item: 'HEARTSCALE', count: 1 } }), false);
  st.addItem('HEARTSCALE', 1);
  const target = relearnableMoves(db, st.party[0])[0];
  const ctx = fakeCtx(st, { choices: [0] });
  assert.equal(await runMoveReminder(ctx, { cost: { item: 'HEARTSCALE', count: 1 } }), true);
  assert.ok(st.party[0].moves.some((m) => m.id === target));
  assert.equal(st.itemCount('HEARTSCALE'), 0);
  assert.equal(typeof moveReminderEvent({ x: 2, y: 2 }).script, 'function');
});
