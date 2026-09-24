// Encargada de la Guardería (content/services/daycare.js) con un ctx simulado: dejar, consultar, recoger pagando y
// entregar el Huevo; además, el gancho de paso del mapa (world/daycare.js#daycareStep).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { createRng } from '../game/src/world/prng.js';
import { runDaycare, daycareEvent, DAYCARE_TEXT } from '../game/src/content/services/daycare.js';
import { daycareStep, EGG_CHECK_STEPS, normalizeDaycare } from '../game/src/world/daycare.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = { species: load('species.json'), moves: load('moves.json') };

function newState() {
  const state = GameState.create({ name: 'Ana', gender: 'F', playerId: 4321 });
  const ot = { name: 'Ana', id: 4321 };
  state.setParty([
    createPokemon(db, 'PIKACHU', 20, { gender: 'F', ot, rng: createRng(1) }),
    createPokemon(db, 'PIKACHU', 22, { gender: 'M', ot: { name: 'Leo', id: 9 }, rng: createRng(2) }),
    createPokemon(db, 'EEVEE', 15, { gender: 'M', ot, rng: createRng(3) }),
  ]);
  return state;
}

/** ctx con guion: `choices` (índices del menú, en orden), `parties` (índices del equipo), `confirms`. */
function scriptedCtx(state, { choices = [], parties = [], confirms = [] } = {}) {
  const said = [];
  return {
    state, db, said, map: { id: 'lumina_guarderia' },
    say: async (t) => { said.push(t); },
    choice: async () => (choices.length ? choices.shift() : 3),
    confirm: async (t) => { said.push(t); return confirms.length ? confirms.shift() : true; },
    ui: { openParty: async () => (parties.length ? parties.shift() : null) },
    se() {}, me() {},
    scene: { refreshFollower() {} },
  };
}

test('dejar dos Pokémon, consultar la compatibilidad y no dejar al jugador sin equipo', async () => {
  const state = newState();
  await runDaycare(scriptedCtx(state, { choices: [0, 0, 2, 0, 3], parties: [0, 0] }));
  assert.equal(state.party.length, 1);
  assert.equal(state.party[0].species, 'EEVEE');
  const dc = normalizeDaycare(state.daycare);
  assert.deepEqual(dc.slots.map((s) => s.pokemon.species), ['PIKACHU', 'PIKACHU']);
  const ctx = scriptedCtx(state, { choices: [2, 0, 3] });
  await runDaycare(ctx);
  assert.ok(ctx.said.includes('Parece que se llevan muy bien.'), 'misma especie y distinto entrenador');
  assert.ok(ctx.said.includes(DAYCARE_TEXT.full));
});

test('el último Pokémon no se puede dejar', async () => {
  const state = newState();
  state.setParty([state.party[0]]);
  const ctx = scriptedCtx(state, { choices: [0, 3], parties: [0] });
  await runDaycare(ctx);
  assert.equal(state.party.length, 1);
  assert.ok(ctx.said.includes(DAYCARE_TEXT.lastOne));
});

test('recoger cobra 100 $ (sin niveles ganados) y devuelve el Pokémon al equipo', async () => {
  const state = newState();
  await runDaycare(scriptedCtx(state, { choices: [0, 3], parties: [2] }));
  const money = state.player.money;
  await runDaycare(scriptedCtx(state, { choices: [1, 3], confirms: [true] }));
  assert.equal(state.player.money, money - 100);
  assert.equal(state.party.at(-1).species, 'EEVEE');
  assert.equal(normalizeDaycare(state.daycare).slots.filter(Boolean).length, 0);
});

test('el gancho de paso pone el Huevo y la encargada lo entrega; con el equipo lleno espera', async () => {
  const state = newState();
  await runDaycare(scriptedCtx(state, { choices: [0, 0, 3], parties: [0, 0] }));
  const scene = { state, engine: { data: db } };
  for (let i = 0; i < EGG_CHECK_STEPS * 20 && !state.daycare.eggReady; i++) daycareStep(scene);
  assert.equal(state.daycare.eggReady, true, 'compatibilidad 3: en 20 tiradas sale casi seguro');
  const full = [...state.party];
  while (state.party.length < 6) state.setParty([...state.party, createPokemon(db, 'PIDGEY', 5, { rng: createRng(state.party.length) })]);
  const waiting = scriptedCtx(state, { choices: [3], confirms: [true] });
  await runDaycare(waiting);
  assert.ok(waiting.said.includes(DAYCARE_TEXT.eggNoRoom));
  assert.equal(state.daycare.eggReady, true, 'el Huevo sigue esperando');
  state.setParty(full);
  const got = scriptedCtx(state, { choices: [3], confirms: [true] });
  await runDaycare(got);
  const egg = state.party.at(-1);
  assert.equal(egg.egg, true);
  assert.equal(egg.species, 'PICHU');
  assert.deepEqual(egg.ot, { name: 'Ana', id: 4321 });
  assert.equal(state.daycare.eggReady, false);
});

test('Lúmina: la criadora da sus regalos y, tras T06, abre la guardería (X29)', async () => {
  const { daycareEvents } = await import('../game/src/content/events/b09a_shops.js');
  const criadora = daycareEvents().find((e) => e.id === 'criadora');
  const state = newState();
  const given = [];
  const ctxFor = (opts) => ({
    ...scriptedCtx(state, opts),
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    giveItem: async (id) => { given.push(id); },
  });
  await criadora.script(ctxFor({}));
  assert.deepEqual(given, ['OVALSTONE']);
  const closed = ctxFor({ choices: [0] });
  await criadora.script(closed);
  assert.equal(normalizeDaycare(state.daycare).slots.filter(Boolean).length, 0, 'antes de T06 no admite Pokémon');
  state.setFlag('b09_t06_tablilla');
  await criadora.script(ctxFor({}));
  assert.deepEqual(given, ['OVALSTONE', 'AUDINITE']);
  await criadora.script(ctxFor({ choices: [0, 3], parties: [2] }));
  assert.equal(normalizeDaycare(state.daycare).slots[0].pokemon.species, 'EEVEE');
});

test('daycareEvent valida coordenadas y sin nadie depositado el paso no crea estado', () => {
  assert.throws(() => daycareEvent({}), /enteros/);
  assert.equal(daycareEvent({ x: 3, y: 4 }).id, 'guarderia');
  const state = newState();
  daycareStep({ state, engine: { data: db } });
  assert.equal(state.daycare, null);
});
