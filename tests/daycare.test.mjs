// Guardería y crianza (world/daycare.js): port de DayCare/EggGenerator de Essentials 21.1 (Añil, MECHANICS_GENERATION 9):
// compatibilidad, especie del huevo (bebés y descendencia alternativa: Manaphy+Ditto → Phione), herencia (IV, naturaleza,
// habilidad, movimientos huevo, Poké Ball), contador de pasos (cada 256 pasos, 20/50/70 % o 40/80/88 % con el Amuleto
// Oval), depósito/retirada puros y coste.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPokemon, STATS } from '../game/src/battle/core/pokemon.js';
import { createRng } from '../game/src/world/prng.js';
import {
  emptyDaycare, depositPokemon, withdrawPokemon, daycareCount, compatibility, babySpecies, eggSpeciesFor,
  canProduce, generateEgg, stepDaycare, withdrawCost, eggChance, EGG_CHECK_STEPS, DAYCARE_SLOTS, collectEgg,
  shareEggMove, compatibilityText,
} from '../game/src/world/daycare.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = { species: load('species.json'), moves: load('moves.json') };
const OT_A = { name: 'Ana', id: 111 };
const OT_B = { name: 'Beto', id: 222 };

const mon = (species, level, opts = {}) => createPokemon(db, species, level, { rng: createRng(7), ot: OT_A, ...opts });
const pairCare = (a, b) => depositPokemon(db, depositPokemon(db, emptyDaycare(), a), b);

test('especie del bebé: retrocede por las preevoluciones (gen 9 no exige incienso)', () => {
  assert.equal(babySpecies(db, 'RAICHU'), 'PICHU');
  assert.equal(babySpecies(db, 'MARILL'), 'AZURILL');
  assert.equal(babySpecies(db, 'VENUSAUR'), 'BULBASAUR');
  assert.equal(babySpecies(db, 'MANAPHY'), 'MANAPHY');
});

test('especie del huevo: descendencia alternativa (Manaphy → Phione, Nidoran ♀/♂)', () => {
  const rng = createRng(3);
  assert.equal(eggSpeciesFor(db, 'MANAPHY', rng), 'PHIONE');
  const nidos = new Set(Array.from({ length: 40 }, () => eggSpeciesFor(db, 'NIDOQUEEN', rng)));
  assert.deepEqual([...nidos].sort(), ['NIDORANfE', 'NIDORANmA']);
  assert.equal(canProduce(db, 'MANAPHY', 'PHIONE'), true);
  assert.equal(canProduce(db, 'PIKACHU', 'PICHU'), true);
  assert.equal(canProduce(db, 'DITTO', 'PICHU'), false);
});

test('compatibilidad: 3 misma especie y distinto entrenador, 2 misma especie, 1 otro grupo, 0 incompatibles', () => {
  const f = mon('PIKACHU', 20, { gender: 'F' });
  const m = mon('PIKACHU', 20, { gender: 'M' });
  const mOther = mon('PIKACHU', 20, { gender: 'M', ot: OT_B });
  const eevee = mon('EEVEE', 20, { gender: 'M' });
  assert.equal(compatibility(db, pairCare(f, mOther)), 3);
  assert.equal(compatibility(db, pairCare(f, m)), 2);
  assert.equal(compatibility(db, pairCare(f, eevee)), 1);
  assert.equal(compatibility(db, pairCare(m, eevee)), 0, 'dos machos');
  assert.equal(compatibility(db, pairCare(mon('MANAPHY', 50), mon('DITTO', 30))), 1, 'sin género con Ditto');
  assert.equal(compatibility(db, pairCare(mon('DITTO', 30), mon('DITTO', 30))), 0, 'Ditto con Ditto');
  assert.equal(compatibility(db, pairCare(mon('MEWTWO', 70), mon('DITTO', 30))), 0, 'grupo Desconocido');
  assert.equal(compatibility(db, pairCare(f, mon('GEODUDE', 20, { gender: 'M' }))), 0, 'sin grupo común');
  assert.equal(compatibility(db, depositPokemon(db, emptyDaycare(), f)), 0, 'solo uno');
  assert.match(compatibilityText(3), /muy bien/);
  assert.match(compatibilityText(0), /no/i);
});

test('depósito y retirada puros: cura al dejarlo, ocupa dos plazas, cobra 100 por nivel ganado + 100', () => {
  const hurt = { ...mon('EEVEE', 12), hp: 1, status: 'PAR' };
  const care = depositPokemon(db, emptyDaycare(), hurt);
  assert.equal(daycareCount(care), 1);
  assert.equal(care.slots[0].pokemon.status, null);
  assert.ok(care.slots[0].pokemon.hp > 1);
  assert.equal(hurt.hp, 1, 'no muta la entrada');
  assert.equal(withdrawCost(care.slots[0]), 100);
  const full = depositPokemon(db, care, mon('PIKACHU', 5));
  assert.equal(daycareCount(full), DAYCARE_SLOTS);
  assert.throws(() => depositPokemon(db, full, mon('PIDGEY', 3)), /no hay sitio/i);
  assert.throws(() => depositPokemon(db, emptyDaycare(), { ...mon('PIDGEY', 3), egg: true }), /huevo/i);
  const grown = { ...full, slots: [{ ...full.slots[0], pokemon: { ...full.slots[0].pokemon, level: 15 } }, full.slots[1]] };
  assert.equal(withdrawCost(grown.slots[0]), 400);
  const out = withdrawPokemon(grown, 0);
  assert.equal(out.pokemon.species, 'EEVEE');
  assert.equal(daycareCount(out.daycare), 1);
  assert.equal(out.daycare.eggReady, false);
  assert.throws(() => withdrawPokemon(out.daycare, 0), /vacía/i);
});

test('pasos: cada 256 se tira el huevo (70 % con compatibilidad 3; nunca con 0); el Amuleto Oval sube la probabilidad', () => {
  assert.equal(EGG_CHECK_STEPS, 256);
  assert.deepEqual([0, 1, 2, 3].map((c) => eggChance(c, false)), [0, 20, 50, 70]);
  assert.deepEqual([0, 1, 2, 3].map((c) => eggChance(c, true)), [0, 40, 80, 88]);
  let care = pairCare(mon('PIKACHU', 20, { gender: 'F' }), mon('PIKACHU', 20, { gender: 'M', ot: OT_B }));
  const low = () => 0.01;
  for (let i = 0; i < 255; i++) care = stepDaycare(db, care, { rng: low });
  assert.equal(care.eggReady, false);
  care = stepDaycare(db, care, { rng: low });
  assert.equal(care.eggReady, true);
  assert.equal(care.stepCounter, 0);
  let never = pairCare(mon('PIKACHU', 20, { gender: 'M' }), mon('EEVEE', 20, { gender: 'M' }));
  for (let i = 0; i < 1024; i++) never = stepDaycare(db, never, { rng: low });
  assert.equal(never.eggReady, false);
});

test('huevo: especie bebé, nivel 1, pasos de eclosión, Poké Ball del progenitor de la familia y ≥3 IV heredados', () => {
  const mother = mon('RAICHU', 40, { gender: 'F', ball: 'ULTRABALL', ivs: Object.fromEntries(STATS.map((s) => [s, 31])) });
  // Ditto no es de la familia de Pichu: no transmite su Poké Ball.
  const father = mon('DITTO', 40, { ot: OT_B, ball: 'QUICKBALL', ivs: Object.fromEntries(STATS.map((s) => [s, 30])) });
  const egg = generateEgg(db, mother, father, { rng: createRng(11), ot: OT_A });
  assert.equal(egg.egg, true);
  assert.equal(egg.species, 'PICHU');
  assert.equal(egg.level, 1);
  assert.equal(egg.eggSteps, db.species.PICHU.hatchSteps);
  assert.equal(egg.ball, 'ULTRABALL');
  const inherited = STATS.filter((s) => egg.ivs[s] === 31 || egg.ivs[s] === 30).length;
  assert.ok(inherited >= 3, `IV heredados: ${inherited}`);
});

test('huevo: Lazo Destino pasa 5 IV, Piedra Eterna fija la naturaleza y los objetos recios fijan su estadística', () => {
  const ivsOf = (v) => Object.fromEntries(STATS.map((s) => [s, v]));
  for (let seed = 1; seed <= 12; seed++) {
    const mother = mon('EEVEE', 30, { gender: 'F', nature: 'TIMID', heldItem: 'EVERSTONE', ivs: ivsOf(31) });
    const father = mon('EEVEE', 30, { gender: 'M', heldItem: 'DESTINYKNOT', ivs: ivsOf(31) });
    const egg = generateEgg(db, mother, father, { rng: createRng(seed) });
    assert.equal(egg.nature, 'TIMID');
    assert.ok(STATS.filter((s) => egg.ivs[s] === 31).length >= 5);
  }
  const power = mon('EEVEE', 30, { gender: 'F', heldItem: 'POWERANKLET', ivs: { ...ivsOf(0), spe: 29 } });
  const plain = mon('EEVEE', 30, { gender: 'M', ivs: ivsOf(0) });
  for (let seed = 1; seed <= 8; seed++) assert.equal(generateEgg(db, power, plain, { rng: createRng(seed) }).ivs.spe, 29);
});

test('huevo: Manaphy + Ditto da un Huevo de Phione; hereda movimientos huevo del padre', () => {
  const egg = generateEgg(db, mon('DITTO', 40), mon('MANAPHY', 50), { rng: createRng(5) });
  assert.equal(egg.species, 'PHIONE');
  const eggMove = db.species.PICHU.eggMoves?.[0] || db.species.PIKACHU.eggMoves?.[0];
  assert.ok(eggMove, 'Pichu tiene movimientos huevo');
  const father = mon('PIKACHU', 30, { gender: 'M', moves: [eggMove, 'THUNDERSHOCK'] });
  const baby = generateEgg(db, mon('PIKACHU', 30, { gender: 'F' }), father, { rng: createRng(9) });
  assert.ok(baby.moves.some((m) => m.id === eggMove), `debería saber ${eggMove}`);
  assert.ok(baby.moves.length <= 4);
});

test('compartir movimiento huevo entre dos de la misma especie (gen 8+)', () => {
  const eggMove = db.species.EEVEE.eggMoves[0];
  const a = mon('EEVEE', 20, { gender: 'F', moves: ['TACKLE', eggMove] });
  const b = mon('EEVEE', 20, { gender: 'M', moves: ['TACKLE'] });
  const shared = shareEggMove(db, pairCare(a, b), () => 0.1);
  assert.ok(shared.slots[1].pokemon.moves.some((m) => m.id === eggMove));
});

test('recoger el huevo: lo entrega al equipo si cabe y reinicia el contador; sin huevo listo no hace nada', () => {
  let care = pairCare(mon('PIKACHU', 20, { gender: 'F' }), mon('PIKACHU', 20, { gender: 'M' }));
  assert.equal(collectEgg(db, care, { rng: createRng(1) }), null);
  care = { ...care, eggReady: true };
  const got = collectEgg(db, care, { rng: createRng(1), ot: OT_A });
  assert.equal(got.egg.egg, true);
  assert.equal(got.daycare.eggReady, false);
  assert.equal(got.daycare.stepCounter, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(got.daycare)), got.daycare, 'estado serializable');
});
