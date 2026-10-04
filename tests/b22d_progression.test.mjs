// B22d: secuencias jugables, requisitos y recuperación; los guiones actúan sobre GameState real.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { applyRest } from '../game/src/world/rest.js';
import { F, LEGENDS, legendPresent } from '../game/src/content/events/b22d_common.js';
import { dreamEligible, homeBedEvents, momPostgameTalk, nightmareEvents, lumbreEvents } from '../game/src/content/events/b22d_suenos.js';
import { giveMagmaStone, heatranCraterEvents } from '../game/src/content/events/b22d_heatran.js';
import { prototypeBattle, cierzoHallEvents, cierzoCoreEvents } from '../game/src/content/events/b22d_cierzo.js';
import { casildaHint, umbralShadowEvents } from '../game/src/content/events/b22d_marshadow.js';
import { b22dGalenaEvents, b22dMinaEvents, picoEvents } from '../game/src/content/events/b22d_regirock.js';
import { b22dTalleresEvents, escarchaEvents } from '../game/src/content/events/b22d_regice.js';
import { b22dGaleriaEvents, b22dTallerEvents, tunelesEvents } from '../game/src/content/events/b22d_registeel.js';
import { b22dHondoEvents, colosoEvents } from '../game/src/content/events/b22d_regigigas.js';
import { HOOKS, PESADILLA } from '../game/src/content/maps/b22d/layout.js';

const noop = async () => {};
function context(outcome = 'run') {
  const state = GameState.create({ name: 'Prueba' });
  state.setFlag('game_cleared'); state.setFlag('b21_fin'); state.setFlag('b01_left_town');
  const ctx = { state, map: { id: 'casa_prota_2f' }, player: { x: 8, y: 6 }, requests: [], warps: [], texts: [], heals: 0,
    flag: (f) => state.flag(f), var: (v, d) => state.var(v, d),
    setFlag: (f, value = true) => state.setFlag(f, value), setVar: (v, n) => state.setVar(v, n),
    say: async (t) => { ctx.texts.push(t); }, confirm: async () => true, choice: async () => 1,
    battle: async (request) => { ctx.requests.push(request); return outcome; },
    warp: async (...a) => { ctx.warps.push(a); }, heal: () => { ctx.heals++; },
    giveItem: async (id, count = 1) => { state.addItem(id, count); },
    face: noop, emote: noop, move: noop, se: noop, me: noop, cry: noop, flash: noop, shake: noop,
    wait: noop, fade: noop, requestRefresh: noop, camera: { pan: noop, reset: noop },
    rest: async (opts) => { applyRest(state, opts); return { rested: true, mode: opts.mode }; },
  };
  return ctx;
}
function page(events, id, state) {
  const ev = events.find((e) => e.id === id);
  assert.ok(ev, id);
  if (!ev.pages) return (!ev.when || ev.when(state)) ? ev : null;
  return ev.pages.filter((p) => !p.when || p.when(state)).at(-1) || null;
}

test('B22d: Fermín y el relieve abren el Pico sin exigir encargos opcionales anteriores', async () => {
  const ctx = context('caught');
  assert.ok(!ctx.flag('b08_cooperativa'));
  await page(b22dGalenaEvents(), 'b22d_fermin_aviso', ctx.state).script(ctx);
  assert.ok(ctx.flag(F.ferminAsk));
  const events = b22dMinaEvents();
  await page(events, 'b22d_marca_pico', ctx.state).script(ctx);
  assert.equal(ctx.state.var('b22d_relieve_paso', 0), 0, 'el minero debe leerlo primero');
  await page(events, 'b22d_relieve', ctx.state).script(ctx);
  await page(events, 'b22d_fermin_relieve', ctx.state).script(ctx);
  ctx.confirm = async () => false;
  await page(events, 'b22d_marca_pico', ctx.state).script(ctx);
  assert.equal(ctx.state.var('b22d_relieve_paso', 0), 0, 'cancelar no da un golpe');
  ctx.confirm = async () => true;
  for (const sign of ['pico', 'casco', 'pico', 'lampara', 'vagoneta']) await page(events, `b22d_marca_${sign}`, ctx.state).script(ctx);
  assert.ok(ctx.flag(F.picoOpen));
  await page(events, 'b22d_relieve', ctx.state).script(ctx);
  assert.equal(ctx.warps.at(-1)[0], 'mina_galena_sellada');
  await page(picoEvents(), 'regirock', ctx.state).script(ctx);
  assert.equal(ctx.requests.at(-1).wild.species, 'REGIROCK');
  assert.ok(ctx.flag(LEGENDS.regirock.caught));
});

test('B22d: Rosendo enseña el modelo, admite deshacer y abre Escarcha al terminar la cruz', async () => {
  const ctx = context('caught');
  await page(b22dTalleresEvents(), 'b22d_rosendo_aviso', ctx.state).script(ctx);
  await page(b22dTalleresEvents(), 'b22d_trampilla', ctx.state).script(ctx);
  assert.equal(ctx.warps.at(-1)[0], 'boreal_cueva_sellada');
  const events = escarchaEvents();
  await page(events, 'b22d_bloque_0', ctx.state).script(ctx);
  assert.equal(ctx.state.var('b22d_talla', 0), 0, 'se necesita mirar el modelo');
  await page(events, 'b22d_talla_vieja', ctx.state).script(ctx);
  await page(events, 'b22d_rosendo_bodega', ctx.state).script(ctx);
  await page(events, 'b22d_bloque_0', ctx.state).script(ctx);
  await page(events, 'b22d_bloque_0', ctx.state).script(ctx);
  assert.equal(ctx.state.var('b22d_talla'), 0);
  for (const i of [1, 3, 4, 5, 7]) await page(events, `b22d_bloque_${i}`, ctx.state).script(ctx);
  assert.ok(ctx.flag(F.escarchaOpen));
  await page(events, 'regice', ctx.state).script(ctx);
  assert.equal(ctx.requests.at(-1).wild.species, 'REGICE');
  assert.ok(ctx.flag(LEGENDS.regice.caught));
});

test('B22d: Rosalía orienta desde el museo y el reloj exige las tres piezas distintas', async () => {
  const ctx = context('caught');
  assert.ok(!ctx.flag('b09_ficha_laguna'));
  await page(b22dGaleriaEvents(), 'b22d_rosalia_aviso', ctx.state).script(ctx);
  await page(b22dTallerEvents(), 'b22d_montacargas', ctx.state).script(ctx);
  assert.equal(ctx.warps.length, 0, 'el muelle aún está cerrado');
  await page(b22dTallerEvents(), 'b22d_rosalia_muelle', ctx.state).script(ctx);
  await page(b22dTallerEvents(), 'b22d_montacargas', ctx.state).script(ctx);
  assert.equal(ctx.warps.at(-1)[0], 'lumina_tuneles');
  const events = tunelesEvents();
  await page(events, 'b22d_rosalia_tuneles', ctx.state).script(ctx);
  await page(events, 'b22d_pieza_pendulo', ctx.state).script(ctx);
  await page(events, 'b22d_rosalia_tuneles', ctx.state).script(ctx);
  assert.ok(!ctx.flag(F.clockRestored));
  for (const part of ['rueda', 'pesa']) await page(events, `b22d_pieza_${part}`, ctx.state).script(ctx);
  await page(events, 'b22d_rosalia_tuneles', ctx.state).script(ctx);
  assert.ok(ctx.flag(F.clockRestored));
  await page(events, 'registeel', ctx.state).script(ctx);
  assert.equal(ctx.requests.at(-1).wild.species, 'REGISTEEL');
  assert.ok(ctx.flag(LEGENDS.registeel.caught));
});

test('B22d: el Coloso comprueba el equipo al abrir el sello y de nuevo al comenzar el combate', async () => {
  const ctx = context('caught');
  const seal = () => page(b22dHondoEvents(), 'b22d_sello_coloso', ctx.state);
  await seal().script(ctx); assert.ok(!ctx.flag(F.colosoOpen));
  const trio = ['REGIROCK', 'REGICE', 'REGISTEEL'].map((species) => ({ species, egg: false }));
  ctx.state.setParty(trio);
  await seal().script(ctx); assert.ok(ctx.flag(F.colosoOpen));
  await seal().script(ctx); assert.equal(ctx.warps.at(-1)[0], 'archivo_coloso');
  ctx.state.setParty(trio.slice(0, 2));
  await page(colosoEvents(), 'regigigas', ctx.state).script(ctx);
  assert.equal(ctx.requests.length, 0, 'guardar un Regi en PC no permite combatir');
  ctx.state.setParty(trio);
  await page(colosoEvents(), 'regigigas', ctx.state).script(ctx);
  assert.equal(ctx.requests[0].wild.level, 75);
  assert.ok(ctx.flag(LEGENDS.regigigas.caught));
});

test('B22d: primer sueño determinista solo tras rumor y sueño profundo nocturno en casa', () => {
  const { state: s } = context();
  const night = { kind: 'home', mode: 'deep', startedAtNight: true };
  assert.ok(!dreamEligible(s, night));
  s.setFlag(F.rumor);
  assert.ok(dreamEligible(s, night));
  assert.ok(!dreamEligible(s, { ...night, startedAtNight: false }));
  assert.ok(!dreamEligible(s, { ...night, mode: 'rest' }));
  assert.ok(!dreamEligible(s, { ...night, kind: 'inn' }));
  s.setFlag(F.darkraiMet);
  assert.ok(dreamEligible(s, { ...night, startedAtNight: false }), 'el siguiente sueño profundo permite el reintento');
  s.setFlag(LEGENDS.darkrai.caught);
  assert.ok(!dreamEligible(s, night), 'la captura cierra la pesadilla');
});

test('B22d: la cama conserva la noche inicial antes de avanzar el reloj; cancelar no abre sueños', async () => {
  const ctx = context();
  ctx.state.setFlag(F.rumor); ctx.state.data.clock.minutes = 22 * 60;
  const bed = homeBedEvents()[0];
  await bed.script(ctx);
  assert.equal(ctx.warps[0][0], PESADILLA.id);
  assert.ok(ctx.state.flag(F.nightmare));
  assert.equal(ctx.state.hour, 8, 'dormir profundamente avanza a la mañana del servicio de descanso');
  const cancel = context(); cancel.state.setFlag(F.rumor); cancel.choice = async () => 2;
  await bed.script(cancel);
  assert.equal(cancel.warps.length, 0);
  assert.equal(cancel.state.var('rest_count', 0), 0);
});

test('B22d: Darkrai KO espera al sueño siguiente y cualquier desenlace devuelve a la cama', async () => {
  for (const outcome of ['win', 'lose', 'run', 'caught']) {
    const ctx = context(outcome);
    ctx.map.id = PESADILLA.id; ctx.state.setFlag(F.nightmare); ctx.state.setFlag(F.rumor);
    const script = page(nightmareEvents(), 'darkrai', ctx.state).script;
    await script(ctx);
    assert.equal(ctx.requests[0].wild.level, 70);
    assert.equal(ctx.requests[0].rules?.canCatch, undefined, 'captura normal');
    assert.ok(ctx.state.flag(F.darkraiMet));
    assert.ok(!ctx.state.flag(F.nightmare));
    assert.deepEqual(ctx.warps.at(-1).slice(0, 4), ['casa_prota_2f', HOOKS.bed.wake.x, HOOKS.bed.wake.y, HOOKS.bed.wake.dir]);
    if (outcome === 'win') {
      assert.ok(!legendPresent(ctx.state, 'darkrai'));
      applyRest(ctx.state, { mode: 'deep' });
      assert.ok(legendPresent(ctx.state, 'darkrai'));
    }
    if (outcome === 'lose') assert.equal(ctx.heals, 1);
    if (outcome === 'caught') assert.ok(ctx.state.flag(LEGENDS.darkrai.caught));
  }
});

test('B22d: Mamá da rumor y Atrapasueños tras el encuentro, una sola vez; Cresselia exige objeto y noche', async () => {
  const ctx = context();
  await momPostgameTalk(ctx);
  assert.ok(ctx.state.flag(F.rumor));
  assert.ok(!ctx.state.hasItem('DREAMCATCHER'));
  ctx.state.setFlag(F.darkraiMet);
  await momPostgameTalk(ctx); await momPostgameTalk(ctx);
  assert.equal(ctx.state.itemCount('DREAMCATCHER'), 1);
  ctx.state.data.clock.minutes = 12 * 60;
  assert.ok(!page(lumbreEvents(), 'cresselia', ctx.state)?.sprite);
  ctx.state.data.clock.minutes = 22 * 60;
  const p = page(lumbreEvents(), 'cresselia', ctx.state);
  assert.ok(p.sprite);
  await p.script(ctx);
  assert.equal(ctx.requests[0].wild.species, 'CRESSELIA');
  assert.equal(ctx.requests[0].wild.level, 70);
});

test('B22d: Piedra Magma de la Forja abre la calzada sin consumirla y permite Heatran72', async () => {
  const ctx = context();
  let gate = page(heatranCraterEvents(), 'b22d_calzada', ctx.state);
  await gate.script(ctx);
  assert.ok(!ctx.state.flag(F.causeway));
  await giveMagmaStone(ctx); await giveMagmaStone(ctx);
  assert.equal(ctx.state.itemCount('MAGMASTONE'), 1);
  gate = page(heatranCraterEvents(), 'b22d_calzada', ctx.state);
  await gate.script(ctx);
  assert.ok(ctx.state.flag(F.causeway));
  assert.equal(ctx.state.itemCount('MAGMASTONE'), 1);
  await page(heatranCraterEvents(), 'heatran', ctx.state).script(ctx);
  assert.equal(ctx.requests[0].wild.species, 'HEATRAN');
  assert.equal(ctx.requests[0].wild.level, 72);
});

test('B22d: vencer el mismo prototipo no cuenta dos veces; el original exige los tres distintos', async () => {
  const ctx = context('win');
  ctx.map.id = 'cierzo_laboratorio';
  await prototypeBattle(ctx, 'a'); await prototypeBattle(ctx, 'a');
  assert.equal(ctx.state.var('b22d_prototipos'), 1);
  let lift = page(cierzoHallEvents(), 'b22d_cierzo_ascensor', ctx.state);
  await lift.script(ctx);
  assert.ok(!ctx.warps.some((w) => w[0] === 'cierzo_nucleo'));
  await prototypeBattle(ctx, 'b'); await prototypeBattle(ctx, 'c');
  assert.equal(ctx.state.var('b22d_prototipos'), 3);
  lift = page(cierzoHallEvents(), 'b22d_cierzo_ascensor', ctx.state);
  await lift.script(ctx);
  assert.equal(ctx.warps.at(-1)[0], 'cierzo_nucleo');
  await page(cierzoCoreEvents(), 'mewtwo', ctx.state).script(ctx);
  assert.equal(ctx.requests.at(-1).wild.species, 'MEWTWO');
  assert.equal(ctx.requests.at(-1).wild.level, 80);
  assert.equal(ctx.requests.at(-1).rules.canCatch, undefined);
  assert.ok(ctx.requests.slice(0, 3).every((r) => r.rules.canCatch === false));
});

test('B22d: perder contra prototipo no abre acceso ni pierde dinero', async () => {
  const ctx = context('lose'); ctx.map.id = 'cierzo_laboratorio';
  const money = ctx.state.player.money;
  await prototypeBattle(ctx, 'b');
  assert.equal(ctx.heals, 1);
  assert.equal(ctx.state.var('b22d_prototipos', 0), 0);
  assert.equal(ctx.state.player.money, money);
  assert.equal(ctx.requests[0].rules.canCatch, false);
});

test('B22d: Casilda avisa; las sombras solo se siguen de noche y la correcta abre Marshadow70', async () => {
  const ctx = context();
  await casildaHint(ctx);
  assert.ok(ctx.state.flag(F.casildaWarn));
  ctx.state.data.clock.minutes = 12 * 60;
  assert.ok(!page(umbralShadowEvents(), 'b22d_sombra_impar', ctx.state));
  ctx.state.data.clock.minutes = 22 * 60;
  const route = HOOKS.explanada.route;
  for (let i = 0; i < route.length; i++) {
    const p = page(umbralShadowEvents(), i ? `b22d_sombra_impar_${i}` : 'b22d_sombra_impar', ctx.state);
    assert.ok(p, `sombra del paso${i}`);
    await p.script(ctx);
  }
  assert.ok(ctx.state.flag(F.shadowFound));
  await page(umbralShadowEvents(), 'marshadow', ctx.state).script(ctx);
  assert.equal(ctx.requests[0].wild.species, 'MARSHADOW');
  assert.equal(ctx.requests[0].wild.level, 70);
});
