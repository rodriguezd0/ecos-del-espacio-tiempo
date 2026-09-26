// Modo desarrollador: dar Pokémon (especies y formas), niveles, variocolor, curar, objetos, dinero y búsquedas.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, newState } from './dev_helpers.mjs';
import { createPokemon, maxHP } from '../game/src/battle/core/pokemon.js';
import { PARTY_MAX } from '../game/src/core/state.js';
import {
  clampLevel, createDevPokemon, giveDevPokemon, givenText, giveDevItem, setMemberLevel, setMemberShiny, healParty, giveMoney,
} from '../game/src/dev/devPokemon.js';
import { normalize, searchList, speciesEntries, searchSpecies, itemEntries, searchItems } from '../game/src/dev/devSearch.js';

test('clampLevel deja el nivel en 1–100 y entero', () => {
  assert.equal(clampLevel(0), 1);
  assert.equal(clampLevel(250), 100);
  assert.equal(clampLevel('37'), 37);
  assert.equal(clampLevel('abc'), 1);
});

test('dar Pokémon: especie, forma, nivel y variocolor; entrenador original = el jugador', () => {
  const st = newState('Rodri');
  const r = giveDevPokemon(st, db, { species: 'ZYGARDE', form: 2, level: 70, shiny: true });
  assert.equal(r.where, 'party');
  assert.equal(st.party.length, 1);
  const p = st.party[0];
  assert.equal(p.species, 'ZYGARDE');
  assert.equal(p.form, 2);
  assert.equal(p.level, 70);
  assert.equal(p.shiny, true);
  assert.equal(p.ot.name, 'Rodri');
  assert.equal(p.hp, maxHP(db, p));
  assert.ok(st.data.dex.caught.ZYGARDE, 'queda registrado en la Pokédex');
  assert.match(givenText(db, r), /nv 70 → equipo/);
});

test('dar Pokémon: una forma inexistente cae a la forma base y una especie desconocida falla', () => {
  const st = newState();
  assert.equal(createDevPokemon(db, st, { species: 'PIKACHU', form: 99, level: 5 }).form, 0);
  assert.throws(() => giveDevPokemon(st, db, { species: 'NOEXISTE', level: 5 }), /Especie desconocida/);
});

test('dar Pokémon con el equipo lleno lo manda a la caja', () => {
  const st = newState();
  for (let i = 0; i < PARTY_MAX; i++) giveDevPokemon(st, db, { species: 'BIDOOF', level: 3 });
  const r = giveDevPokemon(st, db, { species: 'MEWTWO', level: 100 });
  assert.equal(r.where, 'box');
  assert.equal(st.boxPokemon(r.box, r.slot).species, 'MEWTWO');
  assert.match(givenText(db, r), /caja 1/);
});

test('cambiar nivel mantiene la proporción de PS y pone la experiencia mínima del nivel', () => {
  const st = newState();
  st.addPokemon(createPokemon(db, 'TURTWIG', 5, { rng: () => 0.5 }));
  const before = st.party[0];
  const next = setMemberLevel(st, db, 0, 50);
  assert.equal(next.level, 50);
  assert.equal(st.party[0].level, 50);
  assert.equal(st.party[0].hp, maxHP(db, st.party[0]), 'con PS llenos sigue lleno');
  assert.equal(before.level, 5, 'el objeto anterior no se muta');
  assert.throws(() => setMemberLevel(st, db, 3, 10), /No hay Pokémon/);
});

test('variocolor y curar el equipo', () => {
  const st = newState();
  st.addPokemon(createPokemon(db, 'SHINX', 20, { shiny: false }));
  setMemberShiny(st, 0, true);
  assert.equal(st.party[0].shiny, true);
  st.setPartyMember(0, { ...st.party[0], hp: 1, status: 'PARALYSIS' });
  healParty(st, db);
  assert.equal(st.party[0].hp, maxHP(db, st.party[0]));
  assert.equal(st.party[0].status, null);
});

test('dar objetos (también de items_axis) y objetos clave sin acumular', () => {
  const st = newState();
  assert.equal(giveDevItem(st, db, 'POTION', 5), 5);
  assert.equal(giveDevItem(st, db, 'POTION', 2), 7);
  const axisKey = Object.values(db.items).find((it) => it.pocket === 8 && it.id === 'CLUENOTEBOOK');
  assert.ok(axisKey, 'CLUENOTEBOOK es objeto clave de items_axis');
  giveDevItem(st, db, 'CLUENOTEBOOK', 5);
  giveDevItem(st, db, 'CLUENOTEBOOK', 5);
  assert.equal(st.itemCount('CLUENOTEBOOK'), 1);
  assert.throws(() => giveDevItem(st, db, 'NOEXISTE', 1), /Objeto desconocido/);
});

test('dinero: suma y resta dentro de los límites', () => {
  const st = newState();
  const start = st.player.money;
  assert.equal(giveMoney(st, 1000), start + 1000);
  assert.equal(giveMoney(st, -1e9), 0);
});

test('búsquedas: sin tildes, por número y por forma; objetos por nombre o id', () => {
  assert.equal(normalize('Poción ÑANDÚ'), 'pocion ñandu');
  const entries = speciesEntries(db);
  assert.ok(entries.length > Object.keys(db.species).length, 'incluye las formas');
  assert.equal(searchSpecies(db, 'pikachu', entries)[0].species, 'PIKACHU');
  assert.equal(searchSpecies(db, '25', entries)[0].num, 25);
  assert.ok(searchSpecies(db, 'zygarde completa', entries).every((e) => e.species === 'ZYGARDE' && e.form > 0));
  const items = itemEntries(db);
  assert.equal(searchItems(db, 'pocion', items)[0].id, 'POTION');
  assert.equal(searchItems(db, 'CLUENOTEBOOK', items)[0].id, 'CLUENOTEBOOK');
  assert.deepEqual(searchList(['b', 'ab', 'a'], 'a', (s) => [s]), ['a', 'ab']);
});
