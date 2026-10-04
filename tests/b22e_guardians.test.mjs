import test from 'node:test';
import assert from 'node:assert/strict';
import { GUARDIANS, rematchRequest, rematchReady, guardianRematch } from '../game/src/content/events/b22e_guardians.js';
import { fieldWorld, fieldCtx, entryState, db, DV, key } from './b18_helpers.mjs';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';

const state = () => { const s = entryState(); s.setFlag('game_cleared'); s.setFlag('b21_fin'); return s; };
test('las cinco revanchas conservan familias/equipo y usan niveles72–75; postgame individual', () => {
  const s = state(); assert.equal(GUARDIANS.length, 5);
  for (const g of GUARDIANS) {
    const r = rematchRequest(g.key), { config } = buildBattleConfig(r, { db });
    assert.equal(r.noCoop, true); assert.ok(config.opponent.party.length >= 3);
    assert.ok(config.opponent.party.every((p) => p.level >= 72 && p.level <= 75));
    assert.equal(rematchReady(s, g.key), true);
    s.setFlag('b21_fin', false); assert.equal(rematchReady(s, g.key), false); s.setFlag('b21_fin');
  }
  assert.deepEqual(rematchRequest('casilda').trainer.party.map((p) => p.species), ['SUDOWOODO', 'GARGANACL', 'HIPPOWDON']);
});

test('victoria espera al siguiente descanso, derrota permite repetir sin dinero/punto de cura', async () => {
  const t = await fieldWorld('anillo_vientos_nucleo', { state: state() });
  const ctx = fieldCtx(t, { battles: ['lose', 'win'] });
  const money = t.state.player.money, heal = t.state.healPoint;
  assert.equal(await guardianRematch(ctx, 'abril'), false);
  assert.equal(rematchReady(t.state, 'abril'), true); assert.equal(ctx.log.heals, 1);
  assert.equal(t.state.player.money, money); assert.deepEqual(t.state.healPoint, heal);
  assert.equal(await guardianRematch(ctx, 'abril'), true); assert.equal(rematchReady(t.state, 'abril'), false);
  const before = ctx.log.battles.length; await guardianRematch(ctx, 'abril'); assert.equal(ctx.log.battles.length, before);
  t.state.setVar('rest_count', 1); assert.equal(rematchReady(t.state, 'abril'), true);
});

test('tras la despedida vuelven a los cinco núcleos, sin duplicados y accesibles desde la escalera', async () => {
  for (const g of GUARDIANS) {
    const t = await fieldWorld(g.map, { state: state() });
    for (const f of ['b02_ruinas_salida', 'b04_leandro_se_fue', 'b06_abril_despedida', 'b08_fermin_se_fue']) t.state.setFlag(f);
    t.w.refreshEvents();
    const ev = t.w.events.find((e) => e.id === `b22e_guardian_${g.key}` && e.page);
    assert.ok(ev, `${g.key}: vuelve tras restaurar el Pilar`);
    const q = [[t.def.start.x, t.def.start.y]], seen = new Set([key(...q[0])]);
    for (let i = 0; i < q.length; i++) for (const [d, [dx, dy]] of Object.entries(DV)) {
      const [x, y] = q[i], nx = x + dx, ny = y + dy;
      if (!t.map.valid(nx, ny) || seen.has(key(nx, ny))) continue;
      t.p.moveTo(x, y);
      if (t.p.passable(x, y, +d)) { seen.add(key(nx, ny)); q.push([nx, ny]); }
    }
    assert.ok(Object.values(DV).some(([dx, dy]) => seen.has(key(ev.x + dx, ev.y + dy))), `${g.key}: se puede hablar`);
    assert.equal(t.w.events.filter((e) => g.old.includes(e.id) && e.page).length, 0, 'no queda el Guardián anterior duplicado');
    t.state.setFlag('b21_fin', false); t.w.refreshEvents(); assert.equal(ev.page, null);
  }
});

test('Casilda da su aviso de Marshadow también cuando ya dejó las ruinas al terminar la historia', async () => {
  const t = await fieldWorld('ruinas_dintel_nucleo', { state: state() });
  const ctx = fieldCtx(t, { confirms: [false] });
  await guardianRematch(ctx, 'casilda');
  assert.equal(t.state.flag('b22d_casilda_aviso'), true);
  assert.equal(ctx.log.battles.length, 0);
});
