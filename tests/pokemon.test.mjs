import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  createPokemon, calcStats, expForLevel, levelForExp, withExp, withEVs, evolutionTarget, defaultMoves, NATURES, healed,
} from '../game/src/battle/core/pokemon.js';

const db = {
  species: JSON.parse(fs.readFileSync(new URL('../game/data/species.json', import.meta.url))),
  moves: JSON.parse(fs.readFileSync(new URL('../game/data/moves.json', import.meta.url))),
};

function seeded(seed = 42) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test('las 25 naturalezas tienen 5 neutrales', () => {
  assert.equal(NATURES.length, 25);
  assert.equal(NATURES.filter((n) => !n.up).length, 5);
  assert.deepEqual([NATURES[3].up, NATURES[3].down], ['atk', 'spa']); // Firme
});

test('curvas de experiencia coinciden con valores conocidos', () => {
  assert.equal(expForLevel('Medium', 100), 1000000);
  assert.equal(expForLevel('Parabolic', 100), 1059860);
  assert.equal(expForLevel('Fast', 100), 800000);
  assert.equal(expForLevel('Slow', 100), 1250000);
  assert.equal(expForLevel('Erratic', 100), 600000);
  assert.equal(expForLevel('Fluctuating', 100), 1640000);
  assert.equal(expForLevel('Parabolic', 5), 135);
  assert.equal(levelForExp('Medium', 125), 5);
});

test('cálculo de estadísticas estándar (Garchomp nv 100, Firme, 31 IV, 252 Atk)', () => {
  const p = createPokemon(db, 'GARCHOMP', 100, {
    nature: 'ADAMANT', ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 }, evs: { hp: 0, atk: 252, def: 0, spa: 0, spd: 0, spe: 0 }, rng: seeded(),
  });
  const st = calcStats(db, p);
  assert.equal(st.hp, 357);
  assert.equal(st.atk, 394);
  assert.equal(st.spa, 176); // Firme baja At. Esp.
});

test('los iniciales de Axis se crean con movimientos por nivel', () => {
  for (const id of ['TURTWIG', 'LITTEN', 'SOBBLE']) {
    const p = createPokemon(db, id, 5, { rng: seeded(7) });
    assert.ok(p.moves.length >= 2, `${id} tiene movimientos`);
    assert.equal(p.hp, calcStats(db, p).hp);
  }
  assert.deepEqual(defaultMoves(db, 'TURTWIG', 0, 5).map((m) => m.id), ['TACKLE', 'WITHDRAW']);
});

test('ganar experiencia sube de nivel y conserva PS relativos', () => {
  const p = createPokemon(db, 'TURTWIG', 5, { rng: seeded(1) });
  const { pokemon, levelsGained } = withExp(db, p, 500);
  assert.ok(levelsGained.length > 0);
  assert.equal(pokemon.level, levelsGained[levelsGained.length - 1]);
  assert.ok(pokemon.hp > p.hp);
});

test('EVs respetan los límites', () => {
  const p = createPokemon(db, 'SHINX', 10, { rng: seeded(2) });
  const q = withEVs(withEVs(p, { atk: 300 }), { spe: 300 });
  assert.equal(q.evs.atk, 252);
  assert.equal(q.evs.spe, 252); // tope por estadística
  assert.equal(withEVs(q, { def: 100 }).evs.def, 6); // tope total 510
});

test('evolución por nivel', () => {
  const p = { ...createPokemon(db, 'TURTWIG', 18, { rng: seeded(3) }), level: 18 };
  assert.equal(evolutionTarget(db, p), 'GROTLE');
  assert.equal(evolutionTarget(db, { ...p, level: 17 }), null);
});

test('curar restaura PS y PP', () => {
  const p = createPokemon(db, 'LITTEN', 8, { rng: seeded(4) });
  const hurt = { ...p, hp: 1, status: 'POISON', moves: p.moves.map((m) => ({ ...m, pp: 0 })) };
  const h = healed(db, hurt);
  assert.equal(h.hp, p.hp);
  assert.equal(h.status, null);
  assert.ok(h.moves.every((m) => m.pp > 0));
});
