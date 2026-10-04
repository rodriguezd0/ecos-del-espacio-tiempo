import test from 'node:test';
import assert from 'node:assert/strict';
import { fieldWorld, fieldCtx } from './b18_helpers.mjs';
import { F } from '../game/src/content/events/b23_common.js';
import { technician, repairLighthouse, restoreOasis, takeVessel, recording, isolate, regionArrival } from '../game/src/content/events/b23_world.js';
async function context(map = 'puerto_almenara', opts = {}) {
  const t = await fieldWorld(map), c = fieldCtx(t, opts);
  for (const f of ['game_cleared', 'b21_fin', F.letter]) c.setFlag(f);
  return c;
}
test('Almenara: cancelar o perder ante un técnico conserva el extractor y las recompensas', async () => {
  const c = await context('ruta_a1', { confirms: [false, true], battles: ['lose'] });
  await technician(c, 'bomba'); assert.equal(c.log.battles.length, 0);
  await technician(c, 'bomba'); assert.equal(c.flag(F.pump), false);
  assert.equal(c.flag('dlc1_tecnico_bomba'), false); assert.equal(c.log.heals, 1);
  assert.equal(c.log.battles[0].request.noCoop, true);
});
test('Almenara: cada técnico se combate una vez y sus equipos tienen movimientos válidos', async () => {
  const c = await context('ruta_a1');
  for (const k of ['bomba', 'salinas', 'crisol_o', 'crisol_e']) {
    await technician(c, k); const n = c.log.battles.length; await technician(c, k);
    assert.equal(c.log.battles.length, n); assert.ok(c.flag(`dlc1_tecnico_${k}`));
  }
  assert.ok(c.flag(F.pump)); assert.ok(c.flag(F.salinas));
  const { db } = await import('./battle_helpers.mjs');
  for (const { request } of c.log.battles) for (const p of request.trainer.party) {
    assert.ok(db.species[p.species]); assert.ok(p.level >= 75 && p.level <= 77);
    for (const move of p.moves) assert.ok(db.moves[move], `${p.species}: ${move}`);
  }
});
test('Almenara: el faro exige cortar la toma y respeta la cancelación', async () => {
  const c = await context('puerto_almenara', { confirms: [false, true] });
  await repairLighthouse(c); assert.equal(c.flag(F.lighthouse), false);
  c.setFlag(F.pump); await repairLighthouse(c); assert.equal(c.flag(F.lighthouse), false);
  await repairLighthouse(c); assert.ok(c.flag(F.lighthouse));
  await repairLighthouse(c); assert.equal(c.log.choices.length, 2);
});
test('Almenara: el oasis recupera agua pasable con Nadar y entrega una sola Vasija', async () => {
  const c = await context('oasis_vaso', { confirms: [false, true] });
  await takeVessel(c); assert.equal(c.state.itemCount('PRISONBOTTLE'), 0);
  await restoreOasis(c); assert.equal(c.flag(F.oasis), false);
  c.setFlag(F.salinas); await restoreOasis(c); assert.equal(c.flag(F.oasis), false);
  await restoreOasis(c); assert.ok(c.flag(F.oasis));
  assert.ok(c.map.terrainTagAt(15, 14).canSurf);
  await restoreOasis(c); await takeVessel(c); await takeVessel(c);
  assert.equal(c.state.itemCount('PRISONBOTTLE'), 1); assert.ok(c.flag(F.vessel));
});
test('Almenara: el terminal y las tres válvulas exigen resolver el Crisol en orden', async () => {
  const c = await context('el_crisol');
  await recording(c); await isolate(c, 0); assert.equal(c.flag(F.recording), false);
  c.setFlag('dlc1_tecnico_crisol_o'); await recording(c); assert.equal(c.flag(F.recording), false);
  c.setFlag('dlc1_tecnico_crisol_e'); await recording(c); assert.ok(c.flag(F.recording));
  assert.ok(c.said.some(s => s.text === 'No necesito su permiso.'));
  await recording(c);
  for (let i = 0; i < 3; i++) { await isolate(c, i); assert.equal(c.flag(F.crisol), i === 2); }
});
for (const [map, required, back] of [
  ['ruta_a2', [F.pump], 'ruta_a1'], ['oasis_vaso', [F.salinas], 'ruta_a2'],
  ['monte_candil', [F.oasis, F.lighthouse, F.vessel], 'oasis_vaso'],
  ['el_crisol', [F.oasis, F.lighthouse, F.vessel], 'monte_candil'], ['torre_crisol', [F.crisol], 'el_crisol'],
]) test(`Almenara: ${map} no permite saltarse sus requisitos ni bloquea el acceso posterior`, async () => {
  const c = await context(map); await regionArrival(c); assert.equal(c.log.warps.at(-1).mapId, back);
  for (const f of required) c.setFlag(f); const n = c.log.warps.length;
  await regionArrival(c); assert.equal(c.log.warps.length, n);
});
test('Almenara: la llegada se anuncia una vez y el agua persiste al volver al Oasis', async () => {
  const c = await context(); await regionArrival(c); const n = c.said.length;
  await regionArrival(c); assert.equal(c.said.length, n); assert.ok(c.flag(F.arrival));
  const oasis = await context('oasis_vaso'); oasis.setFlag(F.salinas); oasis.setFlag(F.oasis);
  await regionArrival(oasis); assert.ok(oasis.map.terrainTagAt(15, 14).canSurf);
});
