// Modo desarrollador: estados de entrada de bloque (B01–B21), editor de flags/variables, Zygarde y entorno.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { db, newState } from './dev_helpers.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import { BLOCK_STARTS } from '../game/src/dev/devBlocks.js';
import {
  applyBlockStart, validateBlockStart, replaceFlags, activeFlags, searchFlags, toggleFlag, parseVarValue, cleanKey, knownFlags,
} from '../game/src/dev/devProgress.js';
import {
  setCellCount, setCoreCount, setCapability, setZygardeFormDev, cycleForm, unlockAllZygarde, setFragmentCount, setTabletCount,
  unlockAllFlyPoints, registerWholeDex,
} from '../game/src/dev/devZygarde.js';
import { setClock, parseClock } from '../game/src/dev/devEnv.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';

const PRESET = Object.freeze({
  id: 'BXX', title: 'Prueba', map: 'villa_zaguan', x: 19, y: 14, dir: 4,
  flags: ['p1_restored', 'zyg_10'], vars: { starter: 'TURTWIG' },
  party: [['TURTWIG', 16], ['STARLY', 13]],
  zygarde: { abilities: ['run'], form: '10', cells: 12, cores: 1 },
  fragments: 1, tablets: 1, items: { POTION: 3 }, keyItems: ['ZYGARDECUBE'], flyPoints: [], money: 5000, pokedex: true,
});

test('saltar a un bloque deja el estado exacto y guarda el equipo anterior en el PC', () => {
  const st = newState();
  st.addPokemon(createPokemon(db, 'PIKACHU', 8));
  st.setFlag('b20_algo_futuro');
  st.setFlag('exp_share_off');
  st.setVar('otra', 3);
  const to = applyBlockStart(st, db, PRESET);
  assert.deepEqual(to, { mapId: 'villa_zaguan', x: 19, y: 14, dir: 4 });
  assert.deepEqual(activeFlags(st), ['exp_share_off', 'p1_restored', 'zyg_10', 'zyg_core_1'], 'sin flags del futuro; ajustes y flags de núcleo');
  assert.deepEqual(st.data.vars, { starter: 'TURTWIG' });
  assert.deepEqual(st.party.map((p) => [p.species, p.level]), [['TURTWIG', 16], ['STARLY', 13]]);
  assert.equal(st.boxPokemon(0, 0).species, 'PIKACHU');
  assert.equal(st.cellCount(), 12);
  assert.deepEqual(st.data.zygarde.cores, ['N1']);
  assert.equal(st.zygardeAbility('run'), true);
  assert.equal(st.zygardeForm, '10');
  assert.deepEqual(st.data.fragments, ['F01']);
  assert.equal(st.data.tablets.length, 1);
  assert.equal(st.itemCount('POTION'), 3);
  assert.equal(st.hasKeyItem('ZYGARDECUBE'), true);
  assert.equal(st.hasPokedex(), true);
  assert.equal(st.player.money, 5000);
});

test('saltar hacia atrás quita capacidades, núcleos y fragmentos de más; sin equipo se conserva el actual', () => {
  const st = newState();
  unlockAllZygarde(st);
  setFragmentCount(st, 8);
  st.addPokemon(createPokemon(db, 'LUCARIO', 60));
  applyBlockStart(st, db, { ...PRESET, party: [] });
  assert.equal(st.zygardeAbility('fly'), false);
  assert.equal(st.data.zygarde.cores.length, 1);
  assert.equal(st.data.fragments.length, 1);
  assert.equal(st.party[0].species, 'LUCARIO');
  applyBlockStart(st, db, PRESET, { party: false });
  assert.equal(st.party[0].species, 'LUCARIO', 'party: false no toca el equipo');
});

test('un estado de entrada inválido no se aplica a medias', () => {
  const st = newState();
  st.setFlag('antes');
  assert.throws(() => applyBlockStart(st, db, { ...PRESET, party: [['NOEXISTE', 5]] }), /especie desconocida/);
  assert.equal(st.flag('antes'), true);
});

test('BLOCK_STARTS: B01–B21 con mapas, especies y objetos que existen, y todos se aplican', () => {
  const ids = BLOCK_STARTS.map((b) => b.id);
  for (const n of ['B01', 'B02', 'B03', 'B10', 'B16', 'B21']) assert.ok(ids.includes(n), `falta ${n}`);
  assert.equal(new Set(ids).size, ids.length, 'ids únicos');
  const mapIds = Object.keys(MAPS);
  for (const b of BLOCK_STARTS) {
    assert.deepEqual(validateBlockStart(b, { db, mapIds }), [], b.id);
    const st = newState();
    const to = applyBlockStart(st, db, b);
    assert.equal(to.mapId, b.map);
    for (const f of b.flags) assert.ok(st.flag(f), `${b.id}: flag ${f}`);
  }
});

test('editor de flags y variables', () => {
  const st = newState();
  replaceFlags(st, ['a', 'b']);
  assert.equal(toggleFlag(st, 'a'), false);
  assert.equal(toggleFlag(st, 'c'), true);
  assert.deepEqual(searchFlags(st, 'c', ['cc']).map((f) => f.key), ['c', 'cc']);
  assert.ok(knownFlags(BLOCK_STARTS).includes('p1_restored'));
  assert.throws(() => cleanKey('con espacio'), /Clave inválida/);
  assert.equal(parseVarValue('12'), 12);
  assert.equal(parseVarValue('true'), true);
  assert.equal(parseVarValue('TURTWIG'), 'TURTWIG');
  st.setVar('x', 1);
  st.clearVar('x');
  assert.equal(st.var('x', 'def'), 'def');
});

test('Zygarde: células, núcleos, capacidades, forma, fragmentos, tablillas, Vuelo y Pokédex', () => {
  const st = newState();
  assert.equal(setCellCount(st, 30), 30);
  assert.equal(setCellCount(st, 10), 10);
  assert.equal(setCoreCount(st, 3), 3);
  assert.equal(st.flag('zyg_core_3'), true);
  assert.equal(setCoreCount(st, 1), 1);
  assert.equal(st.flag('zyg_core_3'), false);
  setCapability(st, 'swim', true);
  assert.equal(st.zygardeForm, '50');
  setCapability(st, 'swim', false);
  assert.equal(st.zygardeAbility('swim'), false);
  assert.equal(setZygardeFormDev(st, null), null);
  assert.equal(cycleForm(null), 'core');
  assert.equal(cycleForm('complete'), null);
  assert.equal(setFragmentCount(st, 3), 3);
  assert.equal(st.itemCount('AZUREFRAGMENT'), 3);
  assert.equal(setTabletCount(st, 2), 2);
  assert.ok(unlockAllFlyPoints(st) > 0);
  assert.ok(registerWholeDex(st, db) > 300);
  assert.equal(st.hasPokedex(), true);
});

test('hora del día', () => {
  const st = newState();
  assert.equal(setClock(st, 22, 30), 22 * 60 + 30);
  assert.equal(st.hour, 22);
  assert.equal(setClock(st, 25), 60);
  assert.deepEqual(parseClock('06:30'), { hour: 6, minute: 30 });
  assert.deepEqual(parseClock('7'), { hour: 7, minute: 0 });
  assert.equal(parseClock('25:00'), null);
});
