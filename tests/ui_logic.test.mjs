// Pruebas de lógica pura de la UI: formatos, PC de almacenamiento, datos de presentación y mapa.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { formatNumber, formatMoney, formatPlayTime, pad, formatHeight, formatClock } from '../game/src/ui/logic/format.js';
import * as S from '../game/src/ui/logic/storageLogic.js';
import { pokemonView, characteristic, fieldMovesOf } from '../game/src/ui/logic/pokemonInfo.js';
import { REGION_MAP, pointAt, canFlyTo } from '../game/src/ui/logic/regionMapData.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}.json`, import.meta.url)));
const db = { species: load('species'), moves: load('moves'), items: load('items'), abilities: load('abilities') };
const rng = () => 0.3;
const mk = (sp, lv, extra = {}) => ({ ...createPokemon(db, sp, lv, { rng }), ...extra });

test('formatos de número, dinero, tiempo y medidas', () => {
  assert.equal(formatNumber(1234567), '1.234.567');
  assert.equal(formatNumber(-50), '-50');
  assert.equal(formatMoney(3000), '3.000 $');
  assert.equal(formatPlayTime(60 * 60 * 95), '1:35');
  assert.equal(pad(7, 3), '007');
  assert.equal(formatHeight(0.4), '0,4 m');
  assert.equal(formatClock(9 * 60 + 5), '09:05');
});

test('PC: coger y dejar intercambia sin mutar las cajas', () => {
  const a = mk('PIKACHU', 5);
  const b = mk('EEVEE', 5);
  const boxes = [[a, null, b], [null, null, null]];
  const t = S.takeFromBox(boxes, 0, 0);
  assert.equal(t.held, a);
  assert.equal(t.boxes[0][0], null);
  assert.equal(boxes[0][0], a, 'original intacto');
  const p = S.placeInBox(t.boxes, 0, 2, t.held);
  assert.equal(p.boxes[0][2], a);
  assert.equal(p.held, b, 'el que había pasa a la mano');
});

test('PC: nunca se deja el equipo sin un Pokémon capaz', () => {
  const alive = mk('TURTWIG', 5);
  const ko = mk('SHINX', 5, { hp: 0 });
  assert.equal(S.canRemoveFromParty([alive], 0), false);
  assert.equal(S.canRemoveFromParty([alive, ko], 0), false);
  assert.equal(S.canRemoveFromParty([alive, ko], 1), true);
  assert.throws(() => S.takeFromParty([alive, ko], 0), /último/);
  assert.throws(() => S.releaseFromParty([alive], 0), /último/);
});

test('PC: depositar busca hueco en la caja siguiente y retirar respeta el límite', () => {
  const party = [mk('TURTWIG', 5), mk('LITTEN', 5)];
  const full = Array(3).fill(mk('GASTLY', 3));
  const boxes = [full, [null, null, null]];
  const r = S.depositFromParty(party, boxes, 1, 0);
  assert.equal(r.box, 1);
  assert.equal(r.party.length, 1);
  assert.equal(r.boxes[1][0].species, 'LITTEN');
  const six = Array.from({ length: 6 }, () => mk('RIOLU', 5));
  assert.throws(() => S.withdrawToParty(six, r.boxes, 1, 0), /completo/);
  const w = S.withdrawToParty(r.party, r.boxes, 1, 0);
  assert.equal(w.party.length, 2);
  assert.equal(w.boxes[1][0], null);
});

test('pokemonView calcula PS, EXP y tipos', () => {
  const p = mk('TURTWIG', 14, { hp: 10 });
  const v = pokemonView(db, p);
  assert.equal(v.name, 'Turtwig');
  assert.deepEqual(v.types, ['GRASS']);
  assert.equal(v.hp, 10);
  assert.ok(v.maxHp > 10);
  assert.ok(v.expFraction >= 0 && v.expFraction <= 1);
  assert.ok(v.expToNext > 0);
  assert.equal(typeof characteristic(p), 'string');
});

test('movimientos de campo conocidos', () => {
  const p = mk('SHINX', 20, { moves: [{ id: 'FLASH', pp: 20, ppUps: 0 }, { id: 'TACKLE', pp: 35, ppUps: 0 }] });
  assert.deepEqual(fieldMovesOf(p).map((m) => m.id), ['FLASH']);
});

test('mapa de región provisional: formato y vuelo', () => {
  assert.equal(REGION_MAP.provisional, 'X02');
  assert.equal(REGION_MAP.grid.length, 20);
  assert.ok(REGION_MAP.grid.every((row) => row.length === 30));
  const p = REGION_MAP.points[0];
  assert.equal(pointAt(REGION_MAP, p.x, p.y), p);
  assert.equal(canFlyTo(p, []), false);
  assert.equal(canFlyTo(p, [p.id]), true);
});
