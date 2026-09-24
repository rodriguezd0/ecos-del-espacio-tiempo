// Pruebas de la mochila (bolsillos, filtros y ordenación) y del uso de objetos en el campo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  POCKETS, pocketEntries, sortEntries, pocketCounts, nextPocket, machineNumber, isKeyItem, sellPrice, BAG_FILTERS,
} from '../game/src/ui/logic/bagLogic.js';
import { useItemOnPokemon, fieldUseKind, evolvedPokemon, withMove, canLearnMachine } from '../game/src/ui/logic/fieldItems.js';
import { createPokemon, calcStats } from '../game/src/battle/core/pokemon.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}.json`, import.meta.url)));
const db = { species: load('species'), moves: load('moves'), items: load('items'), abilities: load('abilities') };
const rng = () => 0.5;

test('hay 8 bolsillos con los nombres de Añil', () => {
  assert.equal(POCKETS.length, 8);
  assert.equal(POCKETS[1].name, 'Medicinas');
});

test('pocketEntries filtra por bolsillo y conserva el orden de obtención', () => {
  const bag = { SUPERPOTION: 2, POKEBALL: 5, POTION: 3, ANTIDOTE: 1 };
  const med = pocketEntries(bag, db.items, 2);
  assert.deepEqual(med.map((e) => e.id), ['SUPERPOTION', 'POTION', 'ANTIDOTE']);
  assert.equal(med[1].qty, 3);
  assert.deepEqual(pocketEntries(bag, db.items, 3).map((e) => e.id), ['POKEBALL']);
});

test('ordenación por nombre (español) y por número', () => {
  const bag = { SUPERPOTION: 1, POTION: 1, ANTIDOTE: 1 };
  const byName = pocketEntries(bag, db.items, 2, { sort: 'name' }).map((e) => e.item.name);
  assert.deepEqual(byName, [...byName].sort((a, b) => a.localeCompare(b, 'es')));
  const order = Object.keys(db.items);
  const byNum = sortEntries(pocketEntries(bag, db.items, 2), 'number', order).map((e) => e.id);
  assert.deepEqual(byNum, [...byNum].sort((a, b) => order.indexOf(a) - order.indexOf(b)));
});

test('las MT se ordenan siempre por número de máquina', () => {
  const tms = Object.keys(db.items).filter((k) => db.items[k].pocket === 4).slice(0, 12).reverse();
  const bag = Object.fromEntries(tms.map((k) => [k, 1]));
  const nums = pocketEntries(bag, db.items, 4, { sort: 'obtained' }).map((e) => machineNumber(e.item));
  assert.deepEqual(nums, [...nums].sort((a, b) => a - b));
  assert.equal(machineNumber({ name: 'MT05' }), 5);
  assert.equal(machineNumber({ name: 'MO02' }), 1002);
});

test('sortEntries no muta la lista original', () => {
  const list = [{ id: 'B', item: { name: 'B' } }, { id: 'A', item: { name: 'A' } }];
  const sorted = sortEntries(list, 'name');
  assert.equal(list[0].id, 'B');
  assert.equal(sorted[0].id, 'A');
});

test('pocketCounts + nextPocket saltan bolsillos vacíos con filtro', () => {
  const bag = { POTION: 1, POKEBALL: 2, XATTACK: 1 };
  const counts = pocketCounts(bag, db.items, BAG_FILTERS.battle);
  assert.equal(counts[2], 1);
  assert.equal(counts[3], 1);
  assert.equal(nextPocket(2, 1, counts, true), 3);
  assert.equal(nextPocket(3, -1, counts, true), 2);
  assert.equal(nextPocket(1, 1, counts, false), 2);
});

test('objetos clave y precios de venta', () => {
  assert.equal(isKeyItem(db.items.TOWNMAP || { pocket: 8 }), true);
  assert.equal(isKeyItem(db.items.POTION), false);
  assert.equal(sellPrice(db.items.POTION), Math.floor(db.items.POTION.price / 2));
});

test('Poción cura 20 PS y no se consume si no hay efecto', () => {
  const p = createPokemon(db, 'TURTWIG', 20, { rng });
  const max = calcStats(db, p).hp;
  const hurt = { ...p, hp: max - 30 };
  const r = useItemOnPokemon(db, 'POTION', hurt);
  assert.equal(r.ok, true);
  assert.equal(r.pokemon.hp, max - 10);
  assert.equal(hurt.hp, max - 30, 'el original no se modifica');
  const full = useItemOnPokemon(db, 'POTION', p);
  assert.equal(full.ok, false);
  assert.equal(full.consumed, false);
});

test('Antídoto cura el veneno; Revivir solo funciona debilitado', () => {
  const p = { ...createPokemon(db, 'SHINX', 15, { rng }), status: 'POISON' };
  assert.equal(useItemOnPokemon(db, 'ANTIDOTE', p).pokemon.status, null);
  assert.equal(useItemOnPokemon(db, 'REVIVE', p).ok, false);
  const fainted = { ...p, hp: 0 };
  const r = useItemOnPokemon(db, 'REVIVE', fainted);
  assert.equal(r.ok, true);
  assert.equal(r.pokemon.hp, Math.floor(calcStats(db, p).hp / 2));
});

test('Caramelo Raro sube un nivel e informa de evoluciones', () => {
  const p = createPokemon(db, 'TURTWIG', 17, { rng });
  const r = useItemOnPokemon(db, 'RARECANDY', p);
  assert.equal(r.pokemon.level, 18);
  assert.deepEqual(r.levelsGained, [18]);
  assert.equal(r.evolveTo, 'GROTLE');
});

test('Piedra evolutiva devuelve la especie destino', () => {
  const eevee = createPokemon(db, 'EEVEE', 20, { rng });
  const r = useItemOnPokemon(db, 'FIRESTONE', eevee);
  assert.equal(r.evolveTo, 'FLAREON');
  assert.equal(useItemOnPokemon(db, 'FIRESTONE', createPokemon(db, 'SHINX', 5, { rng })).ok, false);
});

test('evolvedPokemon mantiene el daño y cambia la especie', () => {
  const p = createPokemon(db, 'TURTWIG', 18, { rng });
  const hurt = { ...p, hp: p.hp - 5 };
  const { pokemon } = evolvedPokemon(db, hurt, 'GROTLE');
  assert.equal(pokemon.species, 'GROTLE');
  assert.equal(calcStats(db, pokemon).hp - pokemon.hp, 5);
});

test('MT: compatibilidad y enseñanza sin mutar', () => {
  const tm = Object.values(db.items).find((i) => i.fieldUse === 'TM' && i.move);
  assert.ok(tm, 'hay alguna MT en los datos');
  assert.equal(fieldUseKind(tm), 'pokemon');
  const p = createPokemon(db, 'SHINX', 10, { rng, moves: ['TACKLE'] });
  const learned = withMove(db, p, 'THUNDERBOLT');
  assert.equal(learned.moves.length, 2);
  assert.equal(p.moves.length, 1);
  assert.equal(typeof canLearnMachine(db, p, tm.move), 'boolean');
});
