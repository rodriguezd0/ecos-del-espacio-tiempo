import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState, PARTY_MAX } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { sabinaTalk } from '../game/src/content/events/b10_notes.js';
import { F, noteFor } from '../game/src/content/events/b10_common.js';
import { db } from './battle_helpers.mjs';

globalThis.location ??= { search: '' };
const { engine } = await import('../game/src/core/engine.js');
const { createContext } = await import('../game/src/script/context.js');

function context(state, accepts = true) {
  engine.state = state;
  engine.data = db;
  engine.audio = null;
  const scene = {
    world: { map: { id: 'mnemos_casa_te' }, requestRefresh() {} },
    refreshFollower() {}, runner: { wait: async () => {} },
  };
  const ctx = createContext(scene);
  ctx.said = [];
  ctx.say = async (text) => { ctx.said.push(String(text)); };
  ctx.confirm = async () => accepts;
  return ctx;
}

const allPokemon = (s) => [...s.party, ...s.boxes.flat()].filter(Boolean);
const sinisteas = (s) => allPokemon(s).filter((p) => p.species === 'SINISTEA');
const reload = (s) => new GameState(JSON.parse(JSON.stringify(s.data)));

test('Sabina conserva el regalo rechazado después de P5 y de cargar la partida', async () => {
  let s = GameState.create({ name: 'Ana' });
  s.setFlag(F.olvidoMet);
  await sabinaTalk(context(s, false));
  assert.ok(s.flag(noteFor('sabina').flag), 'la nota se entrega aunque se rechace el regalo');
  assert.equal(s.flag(F.sinistea), false);
  s.setFlag(F.restored);
  s = reload(s);
  await sabinaTalk(context(s, false));
  assert.equal(s.flag(F.sinistea), false, 'rechazarlo de nuevo no lo consume');
  await sabinaTalk(context(s));
  assert.equal(sinisteas(s).length, 1, 'puede recogerse tras restaurar la Memoria');
  assert.ok(s.flag(F.sinistea));
  const afterwards = context(reload(s));
  await sabinaTalk(afterwards);
  assert.equal(sinisteas(afterwards.state).length, 1, 'no se duplica');
  assert.ok(afterwards.said.some((t) => t.includes('Esta mañana me he acordado de todo')));
});

test('el regalo pendiente de Sabina va al PC cuando los seis puestos están ocupados', async () => {
  const s = GameState.create({ name: 'Ana' });
  for (let i = 0; i < PARTY_MAX; i++) s.addPokemon(createPokemon(db, 'PIKACHU', 10));
  s.setFlag(noteFor('sabina').flag);
  s.setFlag(F.restored);
  await sabinaTalk(context(s));
  assert.equal(s.party.length, PARTY_MAX);
  assert.equal(sinisteas(s).length, 1);
  assert.equal(s.boxPokemon(0, 0).species, 'SINISTEA');
  assert.ok(s.flag(F.sinistea));
});

test('Sabina espera si también están llenas las cajas; liberar un puesto permite recogerlo', async () => {
  const s = GameState.create({ name: 'Ana' });
  const p = createPokemon(db, 'PIKACHU', 10);
  s.setParty(Array.from({ length: PARTY_MAX }, () => p));
  s.setBoxes(s.boxes.map((box) => box.map(() => p)));
  s.setFlag(noteFor('sabina').flag);
  await sabinaTalk(context(s));
  assert.equal(s.flag(F.sinistea), false, 'no se da por entregado un Pokémon que no cabe');
  assert.equal(s.data.dex.caught.SINISTEA, undefined);
  assert.equal(sinisteas(s).length, 0);
  s.setFlag(F.restored);
  s.setBoxPokemon(0, 0, null);
  await sabinaTalk(context(reload(s)));
  assert.equal(sinisteas(engine.state).length, 1);
  assert.ok(engine.state.flag(F.sinistea));
});

test('Sabina no ofrece el regalo antes de recibir su nota', async () => {
  const s = GameState.create({ name: 'Ana' });
  await sabinaTalk(context(s));
  assert.equal(sinisteas(s).length, 0);
  assert.equal(s.flag(F.sinistea), false);
});
