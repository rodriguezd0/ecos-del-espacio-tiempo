import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as source from '../tools/axis_dex_source.mjs';
globalThis.location ??= { search: '' };
const { dexList } = await import('../game/src/ui/screens/pokedex.js');

const load = (name) => JSON.parse(fs.readFileSync(new URL(`../game/data/${name}.json`, import.meta.url), 'utf8'));
const species = load('species');
const dex = load('dex_axis');
const additions = ['DITTO', 'SABLEYE', 'CHINCHOU', 'LANTURN', 'RELICANTH', 'CLAMPERL', 'HUNTAIL', 'GOREBYSS', 'SKRELP', 'DRAGALGE', 'ROARINGMOON', 'LATIAS', 'LATIOS'];

test('Axis incluye las 425 especies de D28, sin entradas duplicadas ni IDs ausentes', () => {
  assert.equal(dex.entries.length, 425);
  assert.equal(new Set(dex.entries.map((e) => e.id)).size, 425);
  assert.deepEqual(dex.counts, { general: 346, paradox: 8, ultra: 11, legendary: 60 });
  assert.deepEqual(dex.pendingReconciliation, []);
  assert.doesNotMatch(dex.note, /candidato|pendiente/i);
  for (const entry of dex.entries) assert.ok(species[entry.id], entry.id);
  assert.deepEqual(new Set(dex.entries.slice(412).map((e) => e.id)), new Set(additions));
});

test('las reconciliaciones conservan la numeración de las 412 entradas anteriores', () => {
  assert.equal(dex.entries[0].id, 'TURTWIG');
  assert.equal(dex.entries[336].id, 'IRONTREADS');
  assert.equal(dex.entries[343].id, 'NIHILEGO');
  assert.equal(dex.entries[354].id, 'ARTICUNO');
  assert.equal(dex.entries[411].id, 'ZERAORA');
  assert.deepEqual(dex.entries.map((e) => e.n), Array.from({ length: 425 }, (_, i) => i + 1));
});

test('el generador de datos reproduce el catálogo completo publicado', () => {
  assert.equal(typeof source.buildAxisDex, 'function');
  const { problems, ...generated } = source.buildAxisDex(species);
  assert.deepEqual(problems, []);
  assert.deepEqual(generated, dex);
});

test('la Pokédex presenta las 13 especies reconciliadas con sus datos de visto y capturado', () => {
  const list = dexList({ species, dex }, { seen: { LATIAS: true, DITTO: true }, caught: { LATIAS: true } });
  assert.equal(list.length, 425);
  for (const id of additions) assert.ok(list.some((e) => e.id === id), id);
  assert.deepEqual(list.find((e) => e.id === 'LATIAS'), { n: 424, id: 'LATIAS', name: 'Latias', seen: true, caught: true });
  assert.equal(list.find((e) => e.id === 'DITTO').caught, false);
});
