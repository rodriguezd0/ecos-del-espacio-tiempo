// B22d: requisitos de los sellos y persistencia de los nueve encuentros de postgame.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { F, LEGENDS, legendPresent, recordLegendOutcome, isNight, postgame } from '../game/src/content/events/b22d_common.js';
import { strikeRelief, RELIEF_ORDER, toggleKnob, carvingDone, CARVE_TARGET, addPart, clockComplete,
  hasRegiTrio, PROTOTYPES, cierzoEligible } from '../game/src/content/events/b22d_logic.js';
import { legendRequest, legendBattle, prototypeRequest } from '../game/src/content/events/b22d_battle.js';
import { applyRest } from '../game/src/world/rest.js';

function state() { const s = GameState.create({ name: 'Prueba' }); s.setFlag('game_cleared'); s.setFlag('b21_fin'); return s; }

test('B22d: el epílogo termina antes de abrir rumores, sellos o la instalación', () => {
  const s = state();
  s.data.dex.seen = Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`ESPECIE_${i}`, true]));
  s.setFlag('b21_fin', false);
  assert.equal(postgame(s), false);
  assert.equal(cierzoEligible(s), false);
  for (const key of Object.keys(LEGENDS)) assert.equal(legendPresent(s, key), false, key);
});

test('B22d: los nueve legendarios reaparecen después del descanso, nunca después de captura', () => {
  assert.equal(Object.keys(LEGENDS).length, 9);
  for (const key of Object.keys(LEGENDS)) {
    const s = state();
    assert.ok(legendPresent(s, key));
    recordLegendOutcome(s, key, 'run');
    assert.ok(legendPresent(s, key), 'huir permite reintentar');
    recordLegendOutcome(s, key, 'win');
    assert.ok(!legendPresent(s, key), 'KO espera a descansar');
    applyRest(s);
    assert.ok(legendPresent(s, key));
    recordLegendOutcome(s, key, 'caught');
    applyRest(s);
    assert.ok(!legendPresent(s, key), 'capturado no se duplica');
    assert.ok(s.flag(LEGENDS[key].caught));
  }
  assert.equal(legendPresent(GameState.create(), 'regirock'), false, 'solo postgame');
});

test('B22d: perder contra un legendario cura, conserva dinero/punto de cura y permite reintentar', async () => {
  const s = state();
  const money = s.player.money;
  const point = structuredClone(s.healPoint);
  let healed = 0;
  let request;
  let warp;
  const ctx = { state: s, map: { id: 'mina_galena_sellada' },
    battle: async (r) => { request = r; return 'lose'; }, heal: () => { healed++; },
    warp: async (...a) => { warp = a; }, say: async () => {}, requestRefresh: () => {} };
  assert.equal(await legendBattle(ctx, 'regirock', { species: 'REGIROCK', level: 70 }, { retry: { x: 9, y: 14, dir: 8 } }), 'lose');
  assert.equal(healed, 1);
  assert.deepEqual(warp.slice(0, 4), ['mina_galena_sellada', 9, 14, 8]);
  assert.equal(request.rules.canLose, true);
  assert.equal(request.rules.noMoneyLoss, true);
  assert.equal(s.player.money, money);
  assert.deepEqual(s.healPoint, point);
  assert.ok(legendPresent(s, 'regirock'));
});

test('B22d: relieve con error reversible y talla con los 512 estados recuperables', () => {
  let step = 0;
  for (const sign of RELIEF_ORDER) step = strikeRelief(step, sign).step;
  assert.equal(strikeRelief(step, 'casco').done, true);
  assert.equal(strikeRelief(2, 'casco').step, 0);
  for (let m = 0; m < 512; m++) {
    let next = m;
    for (let i = 0; i < 9; i++) if (Boolean(m & (1 << i)) !== CARVE_TARGET.includes(i)) next = toggleKnob(next, i);
    assert.ok(carvingDone(next));
  }
  let parts = 0;
  for (const p of ['pendulo', 'rueda', 'pesa']) parts = addPart(parts, p);
  assert.ok(clockComplete(parts));
  assert.ok(!clockComplete(3));
});

test('B22d: Regigigas exige los tres Regis en el equipo y no admite huevos', () => {
  const trio = ['REGIROCK', 'REGICE', 'REGISTEEL'].map((species) => ({ species }));
  assert.ok(hasRegiTrio(trio));
  assert.ok(!hasRegiTrio(trio.slice(0, 2)));
  assert.ok(!hasRegiTrio(trio.map((p, i) => ({ ...p, egg: i === 1 }))));
});

test('B22d: Cierzo exige 300 especies vistas reales y no depende de capturas', () => {
  const s = state();
  for (let i = 0; i < 299; i++) s.registerSeen(`SPECIES_${i}`);
  assert.ok(!cierzoEligible(s));
  s.registerSeen('SPECIES_299');
  assert.ok(cierzoEligible(s));
  assert.equal(s.caughtCount(), 0);
  s.setFlag('game_cleared', false);
  assert.ok(!cierzoEligible(s));
});

test('B22d: los prototipos son combates sin captura con perfiles distintos; el original permite Balls', () => {
  assert.deepEqual(PROTOTYPES.map((p) => p.profile), ['ataque', 'defensa', 'tipo']);
  for (const p of PROTOTYPES) {
    const request = prototypeRequest(p.spec, 'Prototipo fallido: no se puede capturar.');
    assert.equal(request.type, 'wild');
    assert.equal(request.rules.canCatch, false);
    assert.match(request.rules.catchReason, /no se puede capturar/);
  }
  assert.equal(PROTOTYPES[2].spec.ability, 'PROTEAN');
  const original = legendRequest({ species: 'MEWTWO', level: 80 });
  assert.equal(original.rules?.canCatch, undefined);
});

test('B22d: noche coincide con el reloj del mundo, sin esperar tiempo real', () => {
  const s = state();
  for (const h of [0, 5, 20, 23]) { s.data.clock.minutes = h * 60; assert.ok(isNight(s)); }
  for (const h of [6, 12, 19]) { s.data.clock.minutes = h * 60; assert.ok(!isNight(s)); }
});
