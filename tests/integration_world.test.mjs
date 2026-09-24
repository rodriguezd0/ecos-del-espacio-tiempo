// Integración mundo ↔ estado ↔ guiones sin navegador: repelente en los pasos del jugador, rutas forzadas
// que se liberan al cambiar de página y acciones de campo del menú de pausa (world/fieldActions.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapFromRows } from './world_helpers.mjs';
import { World } from '../game/src/world/world.js';
import { allowEncounter } from '../game/src/world/encounters.js';
import { GameState } from '../game/src/core/state.js';
import { repelWoreOff, runFieldAction, CANT_USE } from '../game/src/world/fieldActions.js';

const mon = (species, level, hp = 20) => ({ uid: species, species, level, hp });

/** Mundo con un mapa de hierba alta y una tabla de encuentros de nivel 2 que siempre salta (rng 0). */
function grassWorld({ leadLevel = 10, repel = 0 } = {}) {
  const state = GameState.create();
  state.addPokemon(mon('LIDER', leadLevel));
  if (repel) state.startRepel('REPEL', repel);
  const calls = { encounter: [], repelExpired: 0 };
  const world = new World({
    state,
    rng: () => 0,
    hooks: {
      encounter: (enc) => calls.encounter.push(enc),
      repelExpired: () => { calls.repelExpired += 1; },
    },
  });
  const map = mapFromRows(['ggggg', 'ggggg', 'ggggg']);
  const def = { id: 'prueba', encounters: { grass: [[100, 'PIDGEY', 2, 2]] } };
  world.setCurrent({ id: 'prueba', def, map, offset: { x: 0, y: 0 }, events: null });
  world.player.moveTo(2, 1);
  return { world, state, calls };
}

test('allowEncounter: el repelente solo deja pasar salvajes de nivel ≥ al del primero del equipo', () => {
  assert.equal(allowEncounter({ level: 2 }, { repelActive: true, leadLevel: 10 }), false);
  assert.equal(allowEncounter({ level: 10 }, { repelActive: true, leadLevel: 10 }), true);
  assert.equal(allowEncounter({ level: 2 }, { repelActive: false, leadLevel: 10 }), true);
  assert.equal(allowEncounter(null), false);
});

test('sin repelente, un paso en la hierba produce el encuentro', () => {
  const { world, calls } = grassWorld();
  world.onPlayerStep();
  assert.equal(calls.encounter.length, 1);
  assert.equal(calls.encounter[0].species, 'PIDGEY');
});

test('con repelente: bloquea salvajes débiles, descuenta pasos y avisa al agotarse', () => {
  const { world, state, calls } = grassWorld({ repel: 2 });
  world.onPlayerStep();
  assert.equal(calls.encounter.length, 0, 'nivel 2 < nivel 10 del líder');
  assert.equal(state.repelSteps, 1);
  assert.equal(calls.repelExpired, 0);
  world.onPlayerStep();
  assert.equal(state.repelSteps, 0);
  assert.equal(calls.repelExpired, 1, 'aviso de fin del repelente');
  assert.equal(calls.encounter.length, 0, 'el paso en que se agota aún repele (Essentials)');
  world.onPlayerStep();
  assert.equal(calls.encounter.length, 1, 'sin repelente vuelve a haber encuentros');
});

test('con repelente, los salvajes de nivel suficiente sí aparecen', () => {
  const { world, calls } = grassWorld({ leadLevel: 2, repel: 50 });
  world.onPlayerStep();
  assert.equal(calls.encounter.length, 1);
});

test('una ruta forzada (ctx.move) se libera si el evento cambia de página', async () => {
  const { world, state } = grassWorld();
  const ev = world.spawnEvent({
    id: 'npc', x: 0, y: 0,
    pages: [{ sprite: 'npc' }, { sprite: 'npc', when: (s) => s.flag('se_va') }],
  });
  const done = ev.forceMoveRoute([{ wait: 6000 }]);
  let settled = false;
  done.then(() => { settled = true; });
  state.setFlag('se_va');
  ev.refresh();
  await Promise.race([done, new Promise((r) => setTimeout(r, 200))]);
  assert.ok(settled, 'la promesa de la ruta se resuelve al cambiar de página');
  assert.equal(ev.moveRouteForcing, false);
});

/** ctx falso que registra lo que el guion dice y responde a las preguntas. */
function fakeCtx(state, { confirm = true, choice = 0, extra = {} } = {}) {
  const said = [];
  const db = { items: { REPEL: { id: 'REPEL', name: 'Repelente', flags: ['Repel'] }, SUPERREPEL: { id: 'SUPERREPEL', name: 'Superrepelente', flags: ['Repel'] }, ESCAPEROPE: { id: 'ESCAPEROPE', name: 'Cuerda Huida', pocket: 8, flags: ['KeyItem'] } }, moves: {} };
  const ctx = {
    db, state, said, warps: [],
    player: { x: 1, y: 1, direction: 2 },
    world: { current: { def: { id: 'aqui' } }, map: { id: 'aqui' } },
    say: async (t) => { said.push(t); },
    confirm: async (t) => { said.push(t); return confirm; },
    choice: async (items, opts) => { said.push(opts?.message); return choice; },
    se: () => {},
    warp: async (...args) => { ctx.warps.push(args); },
    ...extra,
  };
  return ctx;
}

test('fin del repelente: sin repelentes en la Mochila solo avisa; con repelentes ofrece usar otro', async () => {
  const st = GameState.create();
  const ctx = fakeCtx(st);
  assert.equal(await repelWoreOff(ctx), false);
  assert.match(ctx.said[0], /se ha terminado/);

  st.addItem('SUPERREPEL', 2);
  const ctx2 = fakeCtx(st, { confirm: true, choice: 0 });
  assert.equal(await repelWoreOff(ctx2), true);
  assert.equal(st.repelSteps, 200);
  assert.equal(st.itemCount('SUPERREPEL'), 1);
  assert.match(ctx2.said.at(-1), /Has usado Superrepelente/);
});

test('Cuerda Huida: sin punto de cura no se usa; con él pregunta, lleva al punto y no se gasta si es objeto clave', async () => {
  const st = GameState.create();
  st.addKeyItem('ESCAPEROPE');
  const ctx = fakeCtx(st);
  assert.equal(await runFieldAction(ctx, { type: 'useItem', item: 'ESCAPEROPE' }), false);
  assert.deepEqual(ctx.said, [CANT_USE]);

  st.setHealPoint('dev_test_casa', 4, 5, 8);
  const ctx2 = fakeCtx(st);
  assert.equal(await runFieldAction(ctx2, { type: 'useItem', item: 'ESCAPEROPE' }), true);
  assert.deepEqual(ctx2.warps, [['dev_test_casa', 4, 5, 8]]);
  assert.ok(st.hasKeyItem('ESCAPEROPE'));

  const ctx3 = fakeCtx(st, { confirm: false });
  assert.equal(await runFieldAction(ctx3, { type: 'useItem', item: 'ESCAPEROPE' }), false);
  assert.deepEqual(ctx3.warps, []);
});

test('objetos clave con pantalla propia y objetos sin uso en el mundo', async () => {
  const st = GameState.create();
  const opened = [];
  const ui = { openClues: async () => opened.push('clues'), openPokedex: async () => opened.push('dex') };
  const ctx = fakeCtx(st, { extra: { ui } });
  await runFieldAction(ctx, { type: 'useItem', item: 'CLUENOTEBOOK' });
  await runFieldAction(ctx, { type: 'useItem', item: 'POKEDEXAXIS' });
  assert.deepEqual(opened, ['clues', 'dex']);
  await runFieldAction(ctx, { type: 'useItem', item: 'BICYCLE' });
  assert.deepEqual(ctx.said, [CANT_USE]);
  await runFieldAction(ctx, { type: 'fieldMove', move: 'CUT', partyIndex: 0 });
  assert.equal(ctx.said.length, 2);
});
