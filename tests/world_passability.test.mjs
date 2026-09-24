import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapFromRows, T } from './world_helpers.mjs';
import { dirBit } from '../game/src/world/gameMap.js';

test('bits de dirección RMXP (2→1, 4→2, 6→4, 8→8; otros 0)', () => {
  assert.deepEqual([2, 4, 6, 8, 0, 10].map(dirBit), [1, 2, 4, 8, 0, 0]);
});

test('muro 0x0F bloquea entrar desde cualquier lado; césped pasa', () => {
  const m = mapFromRows(['...', '.#.', '...']);
  const player = { isPlayer: true };
  assert.equal(m.passable(1, 1, 8, player), false);
  assert.equal(m.passable(1, 1, 2, player), false);
  assert.equal(m.passable(0, 0, 6, player), true);
});

test('prioridad > 0 no corta la búsqueda: la capa inferior decide', () => {
  const m = mapFromRows(['t']);
  // copa de árbol (prioridad 1, pasable) sobre césped → pasable
  assert.equal(m.passable(0, 0, 2, { isPlayer: true }), true);
  // copa sobre un muro en capa 0 → el muro bloquea
  m.layers[0][0] = T.WALL;
  assert.equal(m.passable(0, 0, 2, { isPlayer: true }), false);
});

test('prioridad 0 corta la búsqueda (tile de capa superior manda)', () => {
  const m = mapFromRows(['.']);
  m.layers[0][0] = T.WALL;
  m.layers[2][0] = T.GRASS; // césped (prio 0, pasable) en capa 2 sobre muro
  assert.equal(m.passable(0, 0, 2, { isPlayer: true }), true);
});

test('bit direccional: ^ impide salir hacia arriba pero no hacia abajo', () => {
  const m = mapFromRows(['.', '^', '.']);
  const p = { isPlayer: true };
  assert.equal(m.passable(0, 1, 8, p), false);
  assert.equal(m.passable(0, 1, 2, p), true);
});

test('arbusto (0x40) y arbusto profundo con terrain tag de hierba alta', () => {
  const m = mapFromRows(['gG.']);
  assert.equal(m.bush(0, 0), true);
  assert.equal(m.deepBush(0, 0), false);
  assert.equal(m.deepBush(1, 0), true);
  assert.equal(m.bush(2, 0), false);
});

test('mostrador (0x80) y terrain tags por capas', () => {
  const m = mapFromRows(['cwL']);
  assert.equal(m.counter(0, 0), true);
  assert.equal(m.terrainTagAt(1, 0).canSurf, true);
  assert.equal(m.terrainTagAt(2, 0).ledge, true);
  assert.equal(m.terrainTagAt(0, 0).id, 'None');
});

test('agua: bloquea a pie, pasable surfeando', () => {
  const m = mapFromRows(['.w']);
  const p = { isPlayer: true };
  assert.equal(m.passable(1, 0, 4, p, { surfing: false }), false);
  assert.equal(m.passable(1, 0, 4, p, { surfing: true }), true);
});

test('los NPC no pisan salientes ni hielo', () => {
  const m = mapFromRows(['.', 'L', 'i']);
  const npc = { x: 0, y: 0 };
  assert.equal(m.passable(0, 0, 2, npc), false, 'no entra en saliente');
  const npc2 = { x: 0, y: 1 };
  assert.equal(m.passable(0, 2, 8, npc2), false, 'no pisa hielo');
});

test('passableStrict exige casilla libre en todas direcciones', () => {
  const m = mapFromRows(['.^']);
  assert.equal(m.passableStrict(0, 0), true);
  assert.equal(m.passableStrict(1, 0), false);
});

test('setTile notifica a los oyentes', () => {
  const m = mapFromRows(['..']);
  const calls = [];
  m.onTileChange((...a) => calls.push(a));
  m.setTile(1, 0, 1, T.WALL);
  assert.deepEqual(calls, [[1, 0, 1, T.WALL]]);
  assert.equal(m.passable(0, 0, 6, { isPlayer: true }) && m.passable(1, 0, 4, { isPlayer: true }), false);
});
