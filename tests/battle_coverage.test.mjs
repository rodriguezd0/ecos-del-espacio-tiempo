// Tests del motor de combate: cobertura de datos y combates aleatorios deterministas (humo).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db } from './battle_helpers.mjs';
import {
  Battle, HeadlessBattleUI, createRng, implementedCodes, implementedAbilities, PASSIVE_ABILITIES, unimplementedUsed,
} from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';

const dex = JSON.parse(fs.readFileSync(new URL('../game/data/dex_axis.json', import.meta.url))).entries
  .map((e) => e.id).filter((id) => db.species[id]);

test('todos los códigos de función de moves.json tienen clase', () => {
  const impl = new Set(implementedCodes());
  const missing = [...new Set(Object.values(db.moves).map((m) => String(m.functionCode || 'None').split(',')[0].trim()))]
    .filter((c) => !impl.has(c));
  assert.deepEqual(missing, []);
});

test('todas las habilidades de las especies del inventario Axis tienen efecto', () => {
  const impl = new Set([...implementedAbilities(), ...PASSIVE_ABILITIES]);
  const missing = new Set();
  for (const id of dex) {
    const sp = db.species[id];
    for (const s of [sp, ...Object.values(sp.forms || {})]) {
      for (const a of [...(s.abilities || []), ...(s.hiddenAbilities || [])]) if (!impl.has(a)) missing.add(a);
    }
  }
  assert.deepEqual([...missing], []);
});

/** UI aleatoria (sembrada): lucha, mochila, cambios y megaevolución al azar. */
class RandomUI extends HeadlessBattleUI {
  constructor(rng) {
    super({ learnMove: () => 0 });
    this.rng = rng;
  }
  async chooseAction() {
    const r = this.rng();
    return r < 0.06 ? 'bag' : r < 0.12 ? 'pokemon' : 'fight';
  }
  async chooseMove(b, moves, ctx) {
    const ok = moves.filter((m) => m.selectable);
    const m = ok.length ? ok[Math.floor(this.rng() * ok.length)] : moves[0];
    return { index: m.index, mega: ctx.canMega && this.rng() < 0.5 };
  }
  async chooseTarget(b, move, cands) { return cands[Math.floor(this.rng() * cands.length)].index; }
  async chooseItem(b, ctx) {
    if (!ctx.bag.length) return null;
    return { item: ctx.bag[Math.floor(this.rng() * ctx.bag.length)].id, target: b.partyIndex, move: 0 };
  }
}

test('60 combates aleatorios (individuales, dobles, salvajes y de entrenador) terminan sin errores', async () => {
  const held = Object.keys(db.items).filter((k) => !(db.items[k].flags || []).includes('KeyItem') && db.items[k].pocket !== 3);
  for (let seed = 1; seed <= 60; seed++) {
    const rng = createRng(seed * 7919);
    const pick = (a) => a[Math.floor(rng() * a.length)];
    const mk = () => {
      const sp = pick(dex);
      const data = db.species[sp];
      const pool = [...new Set([...(data.moves || []).map((m) => m[1]), ...(data.tutorMoves || [])])].filter((m) => db.moves[m]);
      const moves = [];
      while (moves.length < 4 && pool.length) moves.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
      return createPokemon(db, sp, 20 + Math.floor(rng() * 50), { rng, moves, abilityIndex: Math.floor(rng() * 3), heldItem: rng() < 0.6 ? pick(held) : null });
    };
    const double = rng() < 0.4;
    const trainer = rng() < 0.5;
    const config = {
      db, seed, format: double ? 'double' : 'single', type: trainer ? 'trainer' : 'wild',
      player: { party: [mk(), mk(), mk()], bag: { POTION: 2, FULLHEAL: 1, XATTACK: 1 } },
      opponent: { name: 'Rival', party: Array.from({ length: trainer ? 3 : double ? 2 : 1 }, mk), skill: 48 },
    };
    const result = await new Battle(config, new RandomUI(rng)).run();
    assert.ok(['win', 'lose', 'run', 'caught', 'draw'].includes(result.outcome), `semilla ${seed}: ${result.outcome}`);
    assert.ok(result.turns < 1000);
  }
  assert.deepEqual([...unimplementedUsed], []);
});
