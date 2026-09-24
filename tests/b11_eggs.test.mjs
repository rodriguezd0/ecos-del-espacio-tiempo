// Sistema mínimo de huevos (world/eggs.js, añadido por B11 para el huevo de Togepi de Mamá): creación, pasos,
// eclosión (escena con ctx simulado), paso de la escena del mapa y entrega de Mamá (espera si el equipo está lleno).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import {
  createEgg, hatchSteps, stepPartyEggs, hatchedPokemon, addEggToParty, eggStep, hatchReadyEggs, EGG_NAME, HATCH_HAPPINESS,
} from '../game/src/world/eggs.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = { species: load('species.json'), moves: load('moves.json') };
const rng = () => 0.42;

function fakeCtx(state, { confirm = false } = {}) {
  const said = [];
  return {
    state, db, said,
    say: async (t) => { said.push(t); },
    confirm: async () => confirm,
    se() {}, shake() {}, flash: async () => {}, cry() {}, me() {},
    ui: { textEntry: async () => '' },
    scene: { refreshFollower() {} },
  };
}

test('createEgg: huevo de Togepi con los pasos del PBS, sin mote de especie y marcado como huevo', () => {
  const egg = createEgg(db, 'TOGEPI', { rng });
  assert.equal(egg.egg, true);
  assert.equal(egg.species, 'TOGEPI');
  assert.equal(egg.level, 1);
  assert.equal(egg.eggSteps, hatchSteps(db, 'TOGEPI'));
  assert.equal(egg.eggSteps, 2560);
  assert.equal(egg.nickname, EGG_NAME);
  assert.throws(() => createEgg(db, 'NOEXISTE'), /especie desconocida/);
});

test('stepPartyEggs: descuenta sin mutar y avisa de los listos', () => {
  const mon = createPokemon(db, 'PIKACHU', 10, { rng });
  const egg = createEgg(db, 'TOGEPI', { rng, steps: 2 });
  const party = [mon, egg];
  const a = stepPartyEggs(party);
  assert.equal(party[1].eggSteps, 2, 'la entrada no cambia');
  assert.equal(a.party[1].eggSteps, 1);
  assert.equal(a.party[0], mon, 'los que no son huevo se conservan');
  assert.deepEqual(a.ready, []);
  const b = stepPartyEggs(a.party);
  assert.deepEqual(b.ready, [1]);
  assert.equal(b.party[1].eggSteps, 0);
});

test('hatchedPokemon: sin marca de huevo, sin mote y con la amistad de eclosión', () => {
  const baby = hatchedPokemon(createEgg(db, 'TOGEPI', { rng, steps: 0 }));
  assert.equal(baby.egg, undefined);
  assert.equal(baby.eggSteps, undefined);
  assert.equal(baby.nickname, null);
  assert.equal(baby.happiness, HATCH_HAPPINESS);
  assert.equal(baby.species, 'TOGEPI');
});

test('addEggToParty: no registra la especie en la Pokédex y respeta el equipo lleno', () => {
  const s = GameState.create({ name: 'Prueba' });
  s.addPokemon(createPokemon(db, 'PIKACHU', 10, { rng }));
  assert.equal(addEggToParty(s, createEgg(db, 'TOGEPI', { rng })), true);
  assert.equal(s.party.length, 2);
  assert.ok(!s.data.dex.caught.TOGEPI, 'un huevo no cuenta como capturado');
  while (s.party.length < 6) s.addPokemon(createPokemon(db, 'BIDOOF', 3, { rng }));
  assert.equal(addEggToParty(s, createEgg(db, 'TOGEPI', { rng })), false);
});

test('eggStep + hatchReadyEggs: el último paso lanza la eclosión y el bebé entra en la Pokédex', async () => {
  const s = GameState.create({ name: 'Prueba' });
  s.addPokemon(createPokemon(db, 'PIKACHU', 10, { rng }));
  addEggToParty(s, createEgg(db, 'TOGEPI', { rng, steps: 3 }));
  const scripts = [];
  const scene = { state: s, runScript: (fn) => scripts.push(fn) };
  eggStep(scene);
  eggStep(scene);
  assert.equal(scripts.length, 0);
  assert.equal(s.party[1].eggSteps, 1);
  eggStep(scene);
  assert.equal(scripts.length, 1, 'se lanza un guion de eclosión');
  const ctx = fakeCtx(s);
  await hatchReadyEggs(ctx);
  assert.equal(s.party[1].egg, undefined);
  assert.equal(s.party[1].species, 'TOGEPI');
  assert.ok(s.data.dex.caught.TOGEPI);
  assert.ok(ctx.said.some((t) => /Del Huevo ha salido un Togepi/.test(t)), ctx.said.join(' | '));
  // Sin huevos, un paso no hace nada.
  eggStep(scene);
  assert.equal(scripts.length, 1);
});

test('Mamá entrega el huevo de Togepi (B11) y lo guarda si el equipo está lleno', async () => {
  const { b11HomeEvents } = await import('../game/src/content/events/b11_home.js');
  const ev = b11HomeEvents()[0];
  const s = GameState.create({ name: 'Prueba' });
  for (let i = 0; i < 6; i++) s.addPokemon(createPokemon(db, 'BIDOOF', 5, { rng }));
  assert.equal(ev.when(s), false, 'antes del P5 no hay escena');
  s.setFlag('p5_restored');
  assert.equal(ev.when(s), true);
  const said = [];
  const ctx = {
    ...fakeCtx(s), said, db, world: { events: [] }, player: { x: 4, y: 7 },
    say: async (t) => { said.push(t); }, emote: async () => {}, move: async () => {}, approach: async () => {}, face() {},
    directionTo: () => 2, flag: (k) => s.flag(k), setFlag: (k, v = true) => s.setFlag(k, v),
  };
  await ev.script(ctx);
  assert.ok(said.includes('Una Togepi puso un huevo en el jardín y no ha vuelto. Creo que es para ti.'));
  assert.ok(s.flag('b11_huevo_aviso') && !s.flag('b11_huevo'), 'equipo lleno: lo guarda');
  assert.equal(ev.when(s), false, 'no se repite con el equipo lleno');
  s.removePartyMember(5);
  assert.equal(ev.when(s), true, 'con sitio vuelve a salir');
  await ev.script(ctx);
  assert.ok(s.flag('b11_huevo'));
  assert.ok(s.party.some((p) => p.egg && p.species === 'TOGEPI'));
});
