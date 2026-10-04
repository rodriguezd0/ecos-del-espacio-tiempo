import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { fieldWorld, fieldCtx, entryState, DV, key } from './b18_helpers.mjs';
import { F } from '../game/src/content/events/b23_common.js';
import { destinations, FERRY } from '../game/src/world/transport.js';
const maps = ['puerto_almenara', 'almenara_centro', 'ruta_a1', 'ruta_a2', 'oasis_vaso', 'monte_candil', 'el_crisol', 'torre_crisol'];

function reached(t) {
  const start = t.w.current.def.start, queue = [[start.x, start.y]], seen = new Set([key(start.x, start.y)]);
  for (let n = 0; n < queue.length; n++) for (const [d, [dx, dy]] of Object.entries(DV)) {
    const [x, y] = queue[n], nx = x + dx, ny = y + dy;
    if (!t.map.valid(nx, ny) || seen.has(key(nx, ny))) continue;
    t.p.moveTo(x, y); if (t.p.passable(x, y, +d)) { seen.add(key(nx, ny)); queue.push([nx, ny]); }
  }
  return seen;
}
test('Almenara: el ferri se abre con la carta después del epílogo y permite volver a Nexo', () => {
  const s = entryState(); s.setFlag('p7_restored');
  assert.ok(!destinations(s, FERRY, 'nexo').some((p) => p.id === 'almenara'));
  for (const flag of ['game_cleared', 'b21_fin', F.letter]) s.setFlag(flag);
  assert.ok(destinations(s, FERRY, 'nexo').some((p) => p.map === 'puerto_almenara'));
  assert.ok(destinations(s, FERRY, 'almenara').some((p) => p.id === 'nexo'));
});
for (const id of maps) test(`Almenara: ${id} construye sin avisos y tiene acceso real a salida y acciones`, async () => {
  const built = await buildMapNode(id); assert.deepEqual(built.warnings, []);
  const state = entryState(); for (const f of ['game_cleared', 'b21_fin', ...Object.values(F)]) state.setFlag(f);
  const t = await fieldWorld(id, { state }), seen = reached(t), def = t.w.current.def;
  for (const warp of def.warps || []) {
    if (seen.has(key(warp.x, warp.y))) continue;
    assert.ok(warp.door, `${id}: salida ${warp.x},${warp.y}`);
    let entered = false;
    t.w.hooks.warp = (w) => { entered = w === warp; };
    for (const [d, [dx, dy]] of Object.entries(DV)) {
      if (!seen.has(key(warp.x - dx, warp.y - dy))) continue;
      t.p.moveTo(warp.x - dx, warp.y - dy); t.w.checkPlayerTouch(+d);
      if (entered) break;
    }
    assert.ok(entered, `${id}: puerta ${warp.x},${warp.y} se abre al caminar contra ella`);
  }
  for (const e of t.w.events.filter((e) => e.page?.script)) {
    const accessible = [...seen].some((k) => {
      const [x, y] = k.split(',').map(Number); t.p.moveTo(x, y);
      return Object.keys(DV).some((d) => { t.p.direction = +d; return t.w.eventsInFront(['action']).includes(e); });
    });
    assert.ok(seen.has(key(e.x, e.y)) || accessible, `${id}: acción ${e.id}`);
  }
});
test('Almenara: llegar antes de abrir Crisol devuelve al camino y no avanza la historia', async () => {
  const s = entryState(); for (const f of ['game_cleared', 'b21_fin', F.letter]) s.setFlag(f);
  const t = await fieldWorld('el_crisol', { state: s }), ctx = fieldCtx(t);
  await t.w.current.def.onEnter(ctx);
  assert.equal(ctx.log.warps.at(-1).mapId, 'monte_candil'); assert.equal(s.flag(F.recording), false);
});
