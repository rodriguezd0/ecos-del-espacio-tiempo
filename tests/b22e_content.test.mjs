import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { applyRest } from '../game/src/world/rest.js';
import { db } from './battle_helpers.mjs';
import { F, V, postgame, paradoxFlag } from '../game/src/content/events/b22e_common.js';
import { PARADOXES, paradoxPresent, cauceStep, minutesUntil, mothRadius } from '../game/src/content/events/b22e_grieta_logic.js';
import { initialState, slide, solve, isSolved, reachable, normalizeState, resetRoom } from '../game/src/content/events/b22e_iron_logic.js';
import { IRON_ROOM } from '../game/src/content/maps/b22e/grieta_layout.js';
import { paradoxRequest, paradoxBattle } from '../game/src/content/events/b22e_grieta_battle.js';

const state = () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('game_cleared'); s.setFlag('b21_fin');
  return s;
};

test('B22e espera el despertar del epílogo y conserva los siete encuentros canónicos', () => {
  const s = GameState.create({});
  s.setFlag('game_cleared'); assert.equal(postgame(s), false);
  s.setFlag('b21_fin'); assert.equal(postgame(s), true);
  assert.deepEqual(PARADOXES.map((p) => p.species), ['IRONTREADS', 'IRONBUNDLE', 'IRONHANDS', 'IRONJUGULIS', 'IRONMOTH', 'IRONTHORNS', 'IRONVALIANT']);
  for (const p of PARADOXES) {
    const r = paradoxRequest(p.key);
    assert.equal(r.wild.level, p.level);
    assert.ok(db.species[r.wild.species]);
    assert.notEqual(r.rules?.noBag, true);
    assert.equal(r.noCoop, true);
  }
});

test('horas, tormenta, cauce y los otros seis encuentros habilitan condiciones independientes', () => {
  const s = state();
  s.data.clock.minutes = 13 * 60;
  assert.equal(paradoxPresent(s, 'ferrosaco'), false);
  assert.equal(paradoxPresent(s, 'ferrodada'), false);
  assert.equal(paradoxPresent(s, 'ferropalmas'), false);
  assert.equal(paradoxPresent(s, 'ferropaladín'), false);
  assert.equal(paradoxPresent(s, 'ferropaladin'), false);
  s.setFlag(F.ferrodadaAparecida); s.setFlag(F.tallerResuelto);
  assert.equal(paradoxPresent(s, 'ferrodada'), true);
  assert.equal(paradoxPresent(s, 'ferropalmas'), true);
  for (const p of PARADOXES.filter((p) => !p.afterSix)) s.setFlag(paradoxFlag.seen(p.key));
  assert.equal(paradoxPresent(s, 'ferropaladin'), true);
  s.data.clock.minutes = 21 * 60;
  assert.equal(paradoxPresent(s, 'ferrosaco'), true);
  assert.equal(paradoxPresent(s, 'ferrocuello'), false);
  assert.equal(paradoxPresent(s, 'ferropaladin'), false);
  assert.equal(paradoxPresent(s, 'ferropuas'), false);
  assert.equal(paradoxPresent(s, 'ferropuas', { stormOn: true }), true);
  s.data.clock.minutes = 6 * 60;
  assert.equal(paradoxPresent(s, 'ferrocuello'), true);
  assert.equal(minutesUntil(21 * 60, 5 * 60), 8 * 60);
});

test('montar invalida el cauce; Destello amplía la luz sin aceptar huevos', () => {
  const begun = cauceStep('', { strip: 'sur' });
  assert.equal(cauceStep(begun.next, { riding: true }).next, '');
  assert.equal(cauceStep(begun.next, { strip: 'norte' }).done, true);
  const s = state();
  s.setParty([{ moves: [{ id: 'FLASH' }], egg: true }]);
  assert.equal(mothRadius(s), 3);
  s.setParty([{ moves: [{ id: 'FLASH' }], egg: false }]);
  assert.equal(mothRadius(s), 5);
});

test('cada Paradoja guarda captura/KO; derrota y huida permiten reintentar sin perder dinero', async () => {
  for (const p of PARADOXES) for (const outcome of ['caught', 'win', 'lose', 'run']) {
    const s = state(); let healed = 0; const money = s.player.money;
    const ctx = { state: s, map: { id: 'grieta_porvenir' },
      flag: (k) => s.flag(k), var: (k, d) => s.var(k, d), setFlag: (k, v = true) => s.setFlag(k, v), setVar: (k, v) => s.setVar(k, v),
      say: async () => {}, heal: () => healed++, requestRefresh: () => {},
      battle: async (r) => { assert.equal(r.rules.noMoneyLoss, true); return outcome; },
    };
    assert.equal(await paradoxBattle(ctx, p.key), outcome);
    assert.equal(s.player.money, money);
    assert.equal(s.flag(paradoxFlag.seen(p.key)), true);
    const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
    if (outcome === 'caught') assert.equal(loaded.flag(paradoxFlag.caught(p.key)), true);
    if (outcome === 'win') {
      assert.equal(loaded.var(paradoxFlag.rest(p.key)), loaded.var(V.restCount, 0));
      applyRest(loaded); assert.ok(loaded.var(V.restCount) > loaded.var(paradoxFlag.rest(p.key)));
    }
    assert.equal(healed, outcome === 'lose' ? 1 : 0);
  }
});

test('el taller tiene solución caminable, permite salir después de cada embestida y persiste sus zócalos', () => {
  let st = initialState(IRON_ROOM);
  const plan = solve(IRON_ROOM);
  assert.ok(plan && plan.length > 0 && plan.length <= 12);
  for (const step of plan) {
    assert.ok(reachable(IRON_ROOM, st).has(step.stand.join(',')), 'se llega a la cara que hay que golpear');
    const r = slide(IRON_ROOM, st, step.index, step.dir);
    assert.equal(r.moved, true);
    st = normalizeState(IRON_ROOM, JSON.parse(JSON.stringify(r.state)));
    assert.ok(reachable(IRON_ROOM, st, step.stand).has(IRON_ROOM.entry.join(',')), 'la salida queda libre');
  }
  assert.equal(isSolved(IRON_ROOM, st), true);
  assert.deepEqual(resetRoom(IRON_ROOM, st), st, 'resetear no borra el taller ya completado');
});

test('un guardado con coordenadas de bloques dañadas recupera el estado inicial sin romper la entrada', () => {
  for (const bad of [null, {}, [null, null, null], [false, false, false], [[1, 2], null, [3, 4]], [[1, 2], [1, 2], [3, 4]], [[1, 2, 3], [], 'x']])
    assert.deepEqual(normalizeState(IRON_ROOM, bad), initialState(IRON_ROOM));
});

test('la palanca recupera también bloques encajados que impiden completar la plataforma', () => {
  for (const blocks of [[[42, 5], [44, 10], [35, 11]], [[43, 8], [44, 10], [42, 5]]]) {
    const st = { blocks }; assert.equal(isSolved(IRON_ROOM, st), false);
    const reset = resetRoom(IRON_ROOM, st);
    assert.deepEqual(reset, initialState(IRON_ROOM), 'una colocación equivocada no se vuelve permanente');
    assert.ok(solve(IRON_ROOM, reset), 'tras reiniciar se puede resolver');
  }
});
