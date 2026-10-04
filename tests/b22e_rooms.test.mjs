import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldWorld, fieldCtx, entryState, runEvent, db, DV, key } from './b18_helpers.mjs';
import { backRoomDoor, readArchive, talasaHatch } from '../game/src/content/events/b22e_rooms.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';

const state = () => { const s = entryState(); s.setFlag('game_cleared'); s.setFlag('b21_fin'); return s; };
test('la llave del epílogo abre el cuarto sin gastarse; antes del final la puerta continúa cerrada', async () => {
  const t = await fieldWorld('laboratorio_alerce', { state: state() }), ctx = fieldCtx(t);
  await backRoomDoor(ctx); assert.equal(ctx.log.warps.length, 0);
  t.state.addKeyItem('ALERCEKEY'); t.state.setFlag('b21_fin', false);
  await backRoomDoor(ctx); assert.equal(ctx.log.warps.length, 0);
  t.state.setFlag('b21_fin'); await backRoomDoor(ctx);
  assert.equal(ctx.log.warps.at(-1).mapId, 'alerce_cuarto_fondo'); assert.equal(t.state.itemCount('ALERCEKEY'), 1);
});
test('fotos e informes de Laguna se conservan al leer/recargar y no fuerzan una confesión', async () => {
  const t = await fieldWorld('alerce_cuarto_fondo', { state: state() }), ctx = fieldCtx(t);
  for (const id of ['foto', 'calibracion', 'fechas', 'cuaderno']) await readArchive(ctx, id);
  assert.equal(t.state.flag('b22e_cuarto_visto'), true);
  assert.equal(JSON.parse(JSON.stringify(t.state.data)).flags.b22e_cuarto_visto, true);
  const text = ctx.said.map((o) => o.text).join('\n');
  assert.match(text, /Laguna Clara/); assert.match(text, /rascado|tachado/);
  assert.doesNotMatch(text, /soy culpable|yo provoqué|yo destruí|confieso/i);
});
test('Talasa abre su mantenimiento solo en postgame; Ditto se captura normalmente y su cuarto permite volver', async () => {
  const t = await fieldWorld('estacion_talasa', { state: state() }), ctx = fieldCtx(t);
  await talasaHatch(ctx); assert.equal(ctx.log.warps.at(-1).mapId, 'ruinas_talasa');
  t.state.setFlag('b21_fin', false); const before = ctx.log.warps.length;
  await talasaHatch(ctx); assert.equal(ctx.log.warps.length, before);
  const r = await fieldWorld('ruinas_talasa', { state: state() });
  const c = fieldCtx(r, { battles: ['caught'] }); c.db = db;
  await runEvent(c, 'ditto_talasa');
  assert.equal(c.log.battles.at(-1).request.wild.species, 'DITTO');
  assert.notEqual(c.log.battles.at(-1).request.rules?.canCatch, false); assert.equal(r.state.flag('b22e_talasa_ditto'), true);
  await runEvent(c, 'alakazamita_talasa'); await runEvent(c, 'alakazamita_talasa');
  assert.equal(r.state.itemCount('ALAKAZITE'), 1, 'la megapiedra se recoge una sola vez');
});
test('los dos cuartos tienen piezas válidas y caminos reales desde su entrada hasta cada pista y salida', async () => {
  for (const id of ['alerce_cuarto_fondo', 'ruinas_talasa']) {
    assert.deepEqual((await buildMapNode(id)).warnings, []);
    const t = await fieldWorld(id, { state: state() }), q = [[t.def.start.x, t.def.start.y]], seen = new Set([key(...q[0])]);
    for (let i = 0; i < q.length; i++) for (const [d, [dx, dy]] of Object.entries(DV)) {
      const [x, y] = q[i], nx = x + dx, ny = y + dy;
      if (!t.map.valid(nx, ny) || seen.has(key(nx, ny))) continue;
      t.p.moveTo(x, y); if (t.p.passable(x, y, +d)) { seen.add(key(nx, ny)); q.push([nx, ny]); }
    }
    const use = (x, y) => seen.has(key(x, y)) || Object.values(DV).some(([dx, dy]) => seen.has(key(x + dx, y + dy)));
    for (const e of t.w.events.filter((e) => e.page?.script)) assert.ok(use(e.x, e.y), `${id}: ${e.id}`);
    for (const w of t.def.warps) assert.ok(use(w.x, w.y), `${id}: retorno`);
  }
});
