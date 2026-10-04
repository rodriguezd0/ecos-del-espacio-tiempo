// P10 conserva sus salas y guardados, pero se recorre en tres plantas explícitas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import sima from '../game/src/content/maps/b19/sima_eje.js';
import { PUERTA, CIELO, TERRAZA, NUCLEO, LINKS, EXIT_TOP, EXIT_STAND } from '../game/src/content/maps/b20/layout.js';
import { F } from '../game/src/content/events/b20_common.js';
import { fieldWorld, fieldCtx, entryState, runEvent, DV, NAME_DIR } from './b18_helpers.mjs';

const definition = async (id) => (await import(`../game/src/content/maps/b20/${id}.js`)).default;
const paths = fs.readdirSync(new URL('../game/src/content/maps/b20/', import.meta.url))
  .filter((name) => /^senda_origen_\d.*\.js$/.test(name)).map((name) => name.slice(0, -3));

test('P10: todas las variantes de la Senda y Puerta Quince son salas de la planta 1; Cielo es 2 y Gael/núcleo son 3', async () => {
  for (const id of ['puerta_quince', ...paths]) assert.deepEqual((await definition(id)).pillar, { id: 'P10', floor: 1 }, id);
  assert.deepEqual((await definition('cielo_interior')).pillar, { id: 'P10', floor: 2 });
  for (const id of ['terraza_ultimo_sello', 'nucleo_origen']) assert.deepEqual((await definition(id)).pillar, { id: 'P10', floor: 3 }, id);
});

test('P10: columna completa sobre la Sima conserva puerta, llegada, descenso y T15', async () => {
  const t = await fieldWorld('sima_eje');
  assert.deepEqual(sima.puertaQuinceArrival, { x: 18, y: 38, dir: 2 });
  assert.ok(!t.map.isVoid(18, 28) && !t.map.isVoid(18, 36));
  assert.ok(t.map.playerPassable(18, 38, 0, {}));
  const tower = await import('../game/src/content/stamps/baked/Exterior1.js');
  assert.equal(t.map.data(18, 28, 2), tower.default.stamps.pilar_torre.layers[2][3]);
  assert.ok(sima.warps.some((w) => w.to === 'calzada_rey'));
  assert.ok(sima.warps.some((w) => w.to === 'senda_mirador'));
  assert.ok(sima.warps.some((w) => w.to === 'mirador_sur'));
});

test('P10: se puede regresar de Puerta Quince a la Sima antes y después de abrir y reconstruir el camino', async () => {
  for (const flags of [[], [F.doorOpen], [F.doorOpen, F.path]]) {
    const t = await fieldWorld('puerta_quince', { flags });
    t.p.moveTo(PUERTA.arrive.x, PUERTA.arrive.y);
    while (t.p.y < PUERTA.back.y) {
      assert.ok(t.p.passable(t.p.x, t.p.y, 2), `salida sur bloqueada en (${t.p.x},${t.p.y + 1}), flags ${flags}`);
      t.p.moveTo(t.p.x, t.p.y + 1);
    }
    const ctx = fieldCtx(t);
    await runEvent(ctx, 'puerta_sima');
    assert.deepEqual(ctx.log.warps, [{ mapId: 'sima_eje', ...sima.puertaQuinceArrival }]);
    assert.equal(t.state.flag(F.doorOpen), flags.includes(F.doorOpen));
    assert.equal(t.state.flag(F.path), flags.includes(F.path));
  }
});

test('P10: al terminar la Senda se sube por escalera real y la vuelta deja fuera de su warp', async () => {
  const senda = await definition('senda_origen_9');
  const up = senda.warps.find((w) => w.x === EXIT_TOP.x && w.y === EXIT_TOP.y);
  assert.deepEqual([up.to, up.tx, up.ty], [LINKS.sendaToCielo.map, CIELO.arrive.x, CIELO.arrive.y]);
  assert.ok(!senda.warps.some((w) => w.x === EXIT_STAND.x && w.y === EXIT_STAND.y));
  const t = await fieldWorld(senda.id, { flags: ['b20_tramo_9', 'b20_t9_reconstruido'] });
  const baked = (await import('../game/src/content/stamps/baked/Cueva1.js')).default;
  assert.equal(t.map.data(EXIT_TOP.x, EXIT_TOP.y, 2), baked.stamps.pilar_escalinata.layers[2][4]);
});

test('P10: la planta 2 conserva el sello del Trío, regreso a la Senda y llegada desde planta 3', async () => {
  const t = await fieldWorld('cielo_interior');
  const gate = t.w.events.find((e) => e.id === 'cielo_arco');
  assert.ok(gate.page.solid && !gate.through);
  t.state.setFlag(F.trio); t.w.refreshEvents();
  assert.ok(gate.through && typeof gate.page.script === 'function');
  t.p.moveTo(CIELO.gateStand.x, CIELO.gateStand.y);
  const ctx = fieldCtx(t);
  await runEvent(ctx, 'cielo_arco');
  assert.deepEqual(ctx.log.warps.at(-1), { mapId: 'terraza_ultimo_sello', ...TERRAZA.arrive });
  await runEvent(ctx, 'cielo_vuelta');
  assert.deepEqual(ctx.log.warps.at(-1), { mapId: 'senda_origen_9', x: EXIT_STAND.x, y: EXIT_STAND.y, dir: EXIT_STAND.dir });
  const upTile = (await import('../game/src/content/stamps/baked/Cueva1.js')).default.stamps.pilar_escalinata.layers[2][4];
  assert.equal(t.map.data(CIELO.gate.x, CIELO.gate.y, 2), upTile);
  assert.equal(t.map.data(CIELO.back.x, CIELO.back.y, 2), upTile);
});

test('P10: tercera planta mantiene a Gael como llave y el núcleo/nodo postgame en 10,12', async () => {
  const t = await fieldWorld('terraza_ultimo_sello');
  assert.ok(t.w.events.filter((e) => e.id.startsWith('terraza_paso_')).every((e) => e.page?.solid));
  t.state.setFlag(F.gaelB6); t.w.refreshEvents();
  assert.ok(t.w.events.filter((e) => e.id.startsWith('terraza_paso_')).every((e) => !e.page));
  const core = await definition('nucleo_origen');
  assert.deepEqual(core.start, NUCLEO.arrive);
  assert.ok(core.events.some((e) => e.x === 10 && e.y === 12 && e.id === 'nucleo_origen'));
  const back = core.warps[0];
  assert.deepEqual([back.to, back.tx, back.ty], ['terraza_ultimo_sello', 12, 5]);
});

test('P10: guardados en variantes de Senda, Cielo, Gael y núcleo conservan mapa, switches y decisiones', async () => {
  for (const id of [...paths, 'cielo_interior', 'terraza_ultimo_sello', 'nucleo_origen']) {
    const s = entryState();
    for (const f of [F.skyArrival, F.gaelGone, F.restored]) s.setFlag(f);
    for (let n = 1; n <= 9; n++) s.setFlag(F.tramo(n));
    s.setVar('p9_choice', 'PALKIA'); s.setVar('gael_starter', 'LITTEN');
    s.setSelfSwitch(id, 'objeto', 'A', true);
    const def = await definition(id);
    s.setPosition(id, def.start.x, def.start.y, def.start.dir);
    const t = await fieldWorld(id, { state: s });
    const ctx = fieldCtx(t);
    if (typeof def.onEnter === 'function') await def.onEnter(ctx);
    assert.equal(s.player.mapId, id);
    assert.equal(s.selfSwitch(id, 'objeto', 'A'), true);
    assert.equal(s.var('p9_choice'), 'PALKIA');
    assert.deepEqual(ctx.log.warps, []);
  }
});

test('P10: Gael recorre suelo transitable hasta el verso y baja por la escalinata antes de desaparecer', async () => {
  const t = await fieldWorld('terraza_ultimo_sello', { flags: [F.gaelHeal, F.gaelB6] });
  t.p.moveTo(TERRAZA.battleStand.x, TERRAZA.battleStand.y);
  const ctx = fieldCtx(t);
  const ga = t.w.events.find((e) => e.id === 'gael');
  const positions = [];
  ctx.movePlayerTo = async (x, y) => { t.p.moveTo(x, y); };
  ctx.move = async (who, route, opts = {}) => {
    const actor = who === 'player' ? t.p : who;
    if (actor === ga) assert.equal(opts.through, false, 'Gael atraviesa paredes/eventos durante su ruta');
    for (const step of route) {
      const d = NAME_DIR[step];
      if (!d) continue;
      const x = actor.x + DV[d][0], y = actor.y + DV[d][1];
      if (actor === ga) {
        assert.ok(!t.map.isVoid(x, y) && t.map.playerPassable(x, y, 0, {}), `Gael pisa (${x},${y})`);
        assert.equal(t.state.flag(F.gaelGone), false, 'Gael se oculta antes de terminar de andar');
        positions.push([x, y]);
      }
      actor.moveTo(x, y);
    }
  };
  await runEvent(ctx, 'gael');
  assert.ok(positions.some(([x, y]) => x === TERRAZA.gaelStele.x && y === TERRAZA.gaelStele.y));
  assert.deepEqual(positions.at(-1), [TERRAZA.back.x, TERRAZA.back.y]);
  assert.ok(t.state.flag(F.gaelGone) && t.state.flag(F.gaelTalk));
});
