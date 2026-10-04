import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldWorld, fieldCtx, entryState, db, DV, key } from './b18_helpers.mjs';
import { mon } from './battle_helpers.mjs';
import { bastionRound, enrollTeam } from '../game/src/content/events/b22e_bastion.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';

function state() {
  const s = entryState(); s.setFlag('game_cleared'); s.setFlag('b21_fin');
  s.setParty([mon('PIKACHU', 77), mon('CHARIZARD', 76), mon('BLASTOISE', 75)]);
  return s;
}
function flood(t, start) {
  const q = [start], seen = new Set([key(...start)]);
  for (let i = 0; i < q.length; i++) for (const [d, [dx, dy]] of Object.entries(DV)) {
    const [x, y] = q[i], a = [x + dx, y + dy];
    if (!t.map.valid(...a) || seen.has(key(...a))) continue;
    t.p.moveTo(x, y);
    if (t.p.passable(x, y, +d)) { seen.add(key(...a)); q.push(a); }
  }
  return { has: (x, y) => seen.has(key(x, y)), use: (x, y) => Object.values(DV).some(([dx, dy]) => seen.has(key(x + dx, y + dy))) };
}

test('Bastión: inscripción y ronda de siete vuelven a recepción sin cambiar el equipo real', async () => {
  const t = await fieldWorld('bastion_recepcion', { state: state() });
  const ctx = fieldCtx(t, { choices: [0, 0, 0], battles: Array(7).fill('win') }); ctx.db = db;
  const before = JSON.stringify(t.state.party);
  assert.equal(await enrollTeam(ctx), true);
  await bastionRound(ctx);
  assert.equal(ctx.log.battles.length, 7); assert.equal(t.state.var('b22e_bastion_racha'), 7);
  assert.equal(t.state.flag('b22e_bastion_ronda'), true);
  assert.equal(JSON.stringify(t.state.party), before);
  assert.equal(ctx.log.warps.at(-1).mapId, 'bastion_recepcion');
});

test('Bastión: una derrota termina la ronda y conserva puntos anteriores', async () => {
  const t = await fieldWorld('bastion_recepcion', { state: state() });
  const ctx = fieldCtx(t, { choices: [0, 0, 0], battles: ['win', 'lose'] }); ctx.db = db;
  t.state.setVar('b22e_bastion_pb', 9); await enrollTeam(ctx); await bastionRound(ctx);
  assert.equal(ctx.log.battles.length, 2); assert.equal(t.state.var('b22e_bastion_racha'), 0);
  assert.equal(t.state.var('b22e_bastion_pb'), 11); assert.equal(t.state.var('b22e_bastion_record'), 1);
  assert.equal(ctx.log.warps.at(-1).mapId, 'bastion_recepcion');
});

test('la costa, recepción y arena tienen caminos reales hacia servicios, accesos y salidas', async () => {
  for (const id of ['bastion_axis', 'bastion_recepcion', 'bastion_arena']) {
    assert.deepEqual((await buildMapNode(id)).warnings, [], `${id}: todas las piezas están disponibles`);
    const t = await fieldWorld(id, { state: state() }), r = flood(t, [t.def.start.x, t.def.start.y]);
    for (const w of t.def.warps || []) assert.ok(r.has(w.x, w.y) || r.use(w.x, w.y), `${id}: puerta${w.to}`);
    for (const e of t.w.events.filter((e) => e.page && e.page.script))
      assert.ok(r.has(e.x, e.y) || r.use(e.x, e.y), `${id}: ${e.id}`);
    assert.ok(t.def.events?.length, 'hay servicios/indicaciones reales');
  }
});

test('el embarcadero del sector este se abre tras el epílogo y lleva al Bastión', async () => {
  const t = await fieldWorld('mar_del_sur', { state: state() });
  const ev = t.w.events.find((e) => e.id === 'b22e_barca_bastion');
  assert.ok(ev?.page); const ctx = fieldCtx(t); await ev.page.script(ctx);
  assert.equal(ctx.log.warps.at(-1).mapId, 'bastion_axis');
  t.state.setFlag('b21_fin', false); t.w.refreshEvents();
  assert.ok(ev.page); const old = ctx.log.warps.length; await ev.page.script(ctx);
  assert.equal(ctx.log.warps.length, old, 'antes del epílogo solo da la ubicación');
});
