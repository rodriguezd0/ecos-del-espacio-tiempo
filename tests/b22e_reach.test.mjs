import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldWorld, fieldCtx, entryState, DV, key } from './b18_helpers.mjs';
import { ARRIVAL, IRON_ROOM, EXPLANADA, ITEMS, ESCARCHA, HONDONADA, CUENCA, ESPOLON, TORMENTA } from '../game/src/content/maps/b22e/grieta_layout.js';
import { solve, initialState, isSolved } from '../game/src/content/events/b22e_iron_logic.js';
import { ramBlock, ironState } from '../game/src/content/events/b22e_grieta_taller.js';
import { grietaMonitor } from '../game/src/content/events/b22e_grieta_watch.js';

const postState = () => {
  const s = entryState(); s.setFlag('game_cleared'); s.setFlag('b21_fin'); s.data.clock.minutes = 13 * 60; return s;
};
function reach(t, start) {
  const q = [start], seen = new Set([key(...start)]);
  for (let i = 0; i < q.length; i++) for (const [dir, [dx, dy]] of Object.entries(DV)) {
    const [x, y] = q[i], nx = x + dx, ny = y + dy;
    if (!t.map.valid(nx, ny) || seen.has(key(nx, ny))) continue;
    t.p.moveTo(x, y);
    if (!t.p.passable(x, y, Number(dir))) continue;
    seen.add(key(nx, ny)); q.push([nx, ny]);
  }
  return { has: (x, y) => seen.has(key(x, y)), use: (x, y) => Object.values(DV).some(([dx, dy]) => seen.has(key(x + dx, y + dy))) };
}

test('Grieta: campamento, siete zonas, objetos y retorno se alcanzan con el mapa y sus colisiones reales', async () => {
  const t = await fieldWorld('grieta_porvenir', { state: postState() });
  const r = reach(t, [ARRIVAL.x, ARRIVAL.y]);
  for (const id of ['b22e_ferrodada', 'b22e_ferrosaco', 'b22e_ferrocuello', 'b22e_ferropolilla']) {
    const ev = t.def.events.find((e) => e.id === id);
    assert.ok(t.map.passableStrict(ev.x, ev.y), `${id}: empieza sobre suelo y puede moverse`);
  }
  for (const p of [EXPLANADA.rosalia, ESCARCHA.from, HONDONADA.moth, CUENCA.start, ESPOLON.spot, TORMENTA.spot])
    assert.ok(r.has(p.x, p.y) || r.use(p.x, p.y), `zona (${p.x},${p.y})`);
  assert.ok(r.has(...IRON_ROOM.entry), 'entrada del taller');
  assert.ok(r.use(...IRON_ROOM.lever), 'palanca de rescate');
  for (const it of ITEMS) assert.ok(r.use(it.x, it.y) || r.has(it.x, it.y), `objeto ${it.id}`);
  for (const warp of t.def.warps) assert.ok(r.has(warp.x, warp.y), 'salida al Mirador');
});

test('los siete golpes del taller se ejecutan desde caras accesibles; recargar conserva bloques y salida', async () => {
  const t = await fieldWorld('grieta_porvenir', { state: postState() });
  const ctx = fieldCtx(t);
  for (const step of solve(IRON_ROOM, initialState(IRON_ROOM))) {
    const r = reach(t, IRON_ROOM.entry);
    assert.ok(r.has(...step.stand), `cara para bloque ${step.index} hacia ${step.dir}`);
    t.p.moveTo(...step.stand); t.p.direction = step.dir;
    assert.equal(await ramBlock(ctx, step.index), true);
    const st = ironState(t.state);
    assert.deepEqual(st.blocks[step.index], step.to);
    assert.ok(reach(t, step.stand).has(...IRON_ROOM.entry), 'salida tras embestir');
    const raw = JSON.parse(JSON.stringify(t.state.data));
    assert.deepEqual(raw.vars.b22e_bloques, st.blocks);
  }
  assert.equal(isSolved(IRON_ROOM, ironState(t.state)), true);
  assert.equal(t.state.flag('b22e_taller_resuelto'), true);
  const after = t.w.events.find((e) => e.id === 'b22e_ferropalmas');
  t.w.refreshEvents(); assert.ok(after.page, 'Ferropalmas aparece en suelo accesible al despertar');
  assert.ok(reach(t, IRON_ROOM.entry).use(after.x, after.y));
});

test('Ferrosaco se acerca después de cinco segundos quieto; moverse reinicia la espera', async () => {
  const t = await fieldWorld('grieta_porvenir', { state: postState() });
  t.state.data.clock.minutes = 21 * 60; t.w.refreshEvents();
  const ctx = fieldCtx(t), monitor = t.w.events.find((e) => e.id === 'b22e_grieta_monitor');
  const bundle = t.w.events.find((e) => e.id === 'b22e_ferrosaco');
  ctx.event = monitor;
  let steps = 0;
  bundle.moveTowardPlayer = () => { steps++; return true; };
  t.p.moveTo(42, 26); await grietaMonitor(ctx);
  t.state.tickPlayTime(299); await grietaMonitor(ctx); assert.equal(steps, 0);
  t.p.moveTo(42, 27); await grietaMonitor(ctx);
  t.state.tickPlayTime(299); await grietaMonitor(ctx); assert.equal(steps, 0);
  t.state.tickPlayTime(1); await grietaMonitor(ctx); assert.equal(steps, 1);
});

test('la boca del Mirador y su regreso permiten bajar tras el epílogo sin abrir el recinto antes', async () => {
  const t = await fieldWorld('mirador_sur', { state: postState() });
  const mouth = t.w.events.find((e) => e.id === 'b22e_bajada_porvenir');
  assert.ok(mouth.page);
  assert.ok(reach(t, [14, 37]).use(mouth.x, mouth.y));
  t.p.moveTo(28, 19); t.p.direction = 8;
  assert.ok(t.w.eventsInFront(['action']).includes(mouth), 'A desde el regreso mira la boca de la escalera');
  const back = reach(t, [28, 19]); assert.ok(back.has(14, 37), 'la llegada de vuelta puede bajar a Lúmina');
  t.state.setFlag('b21_fin', false); t.w.refreshEvents(); assert.equal(mouth.page, null);
});
