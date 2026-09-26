// Combates online en paso a paso (battle/link/linkBattle.js): dos motores REALES, cada uno con su interfaz que elige
// al azar (movimientos, cambios, a veces rendirse), unidos por un canal en memoria. Deben ir siempre a la par (misma
// suma de control cada turno) y terminar con resultados coherentes: 1 contra 1 con los bandos cambiados en cada lado,
// y dobles en equipo contra la IA con la misma simulación en los dos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { db as baseDb } from './battle_helpers.mjs';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { createRng } from '../game/src/battle/core/rng.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { installLink, battleChecksum, linkParty } from '../game/src/battle/link/linkBattle.js';
import { linkBattleRequest } from '../game/src/net/linkSession.js';
import { coopTrainers, coopLevel, coopSpeciesPool } from '../game/src/net/coopTrainers.js';

const db = { ...baseDb, dex: JSON.parse(fs.readFileSync(new URL('../game/data/dex_axis.json', import.meta.url))) };

/** Dos extremos de un canal en memoria (mensajes asíncronos, en orden). */
function channelPair() {
  const make = () => ({ queue: [], waiters: [] });
  const a = make();
  const b = make();
  const endpoint = (me, other) => ({
    sent: 0,
    send(msg) {
      this.sent += 1;
      const copy = JSON.parse(JSON.stringify(msg)); // como por la red
      setImmediate(() => { const w = other.waiters.shift(); if (w) w(copy); else other.queue.push(copy); });
    },
    next() { return me.queue.length ? Promise.resolve(me.queue.shift()) : new Promise((r) => me.waiters.push(r)); },
  });
  return [endpoint(a, b), endpoint(b, a)];
}

/** Interfaz que decide al azar (con su propio generador: las decisiones humanas no dependen del motor). */
class RandomUI extends HeadlessBattleUI {
  constructor(seed, { switchRate = 0.15, forfeitTurn = -1 } = {}) {
    super({});
    this.rand = createRng(seed);
    this.switchRate = switchRate;
    this.forfeitTurn = forfeitTurn;
    this.actions = 0;
  }

  async chooseAction() {
    this.actions += 1;
    if (this.actions === this.forfeitTurn) return 'run';
    return this.rand() < this.switchRate ? 'pokemon' : 'fight';
  }

  async chooseMove(_b, moves) {
    const ok = moves.filter((m) => m.selectable);
    const pick = ok[Math.floor(this.rand() * ok.length)] || moves[0];
    return { index: pick.index, mega: false };
  }

  async chooseTarget(_b, _m, candidates) {
    return candidates[Math.floor(this.rand() * candidates.length)].index;
  }

  async chooseSwitch(ctx) {
    const able = ctx.party.filter((p) => p.able && !p.active && !p.chosen && p.owned);
    if (!able.length) return -1;
    return able[Math.floor(this.rand() * able.length)].partyIndex;
  }

  async confirm() { return true; }
}

const SPECIES = ['GARCHOMP', 'LUCARIO', 'GYARADOS', 'TORTERRA', 'ALAKAZAM', 'GENGAR', 'SNORLAX', 'MAGNEZONE', 'TOXICROAK', 'WEAVILE'];

function team(seed, size, level) {
  const rng = createRng(seed);
  return Array.from({ length: size }, (_, i) => createPokemon(db, SPECIES[(seed + i * 3) % SPECIES.length], level, { rng }));
}

function human(name, gender, party) {
  return { name, gender, party: linkParty(db, party), megaRing: false };
}

async function play(mode, seed, { forfeit = null } = {}) {
  const [toGuest, toHost] = channelPair();
  // Espejos idénticos: la mitad de los combates con el mismo equipo a ambos lados (empates de velocidad).
  const hostTeam = team(seed, 3, 50);
  const guestTeam = seed % 2 ? team(seed, 3, 50) : team(seed + 7, 3, 50);
  const host = human('Ana', 'F', hostTeam);
  const guest = human('Beto', 'M', guestTeam);
  const foes = mode === 'coop' ? coopTrainers(db, { level: coopLevel(host.party, guest.party), seed: seed * 31 }) : null;
  const reqHost = linkBattleRequest({ mode, role: 'host', me: host, peer: guest, seed, foes, channel: toGuest });
  const reqGuest = linkBattleRequest({ mode, role: 'guest', me: guest, peer: host, seed, foes: JSON.parse(JSON.stringify(foes)), channel: toHost });
  const sims = [reqHost, reqGuest].map((req, i) => {
    const { config } = buildBattleConfig(req, { db });
    const ui = new RandomUI(seed * 10 + i, { forfeitTurn: forfeit === i ? 3 : -1 });
    const battle = new Battle(config, ui);
    installLink(battle, req.link);
    return battle;
  });
  const results = await Promise.all(sims.map((b) => b.run()));
  return { sims, results };
}

test('1 contra 1 online: 24 combates al azar, siempre a la par y con resultados opuestos', { timeout: 120000 }, async () => {
  for (let seed = 1; seed <= 24; seed++) {
    const { sims, results } = await play('pvp', seed);
    const [h, g] = results;
    assert.ok(h.turns >= 3, `semilla ${seed}: combate real (${h.turns} turnos)`);
    assert.ok(!sims.some((s) => s.linkEnd === 'desync'), `semilla ${seed}: desincronía`);
    const opposite = { win: 'lose', lose: 'win', draw: 'draw' };
    assert.equal(g.outcome, opposite[h.outcome], `semilla ${seed}: ${h.outcome} / ${g.outcome}`);
    assert.equal(h.turns, g.turns, `semilla ${seed}: mismos turnos`);
    assert.equal(battleChecksum(sims[0]), battleChecksum(sims[1]), `semilla ${seed}: mismo estado final`);
  }
});

test('dobles en equipo contra la IA: 10 combates al azar, misma simulación y mismo resultado', { timeout: 180000 }, async () => {
  for (let seed = 1; seed <= 10; seed++) {
    const { sims, results } = await play('coop', seed);
    const [h, g] = results;
    assert.ok(!sims.some((s) => s.linkEnd === 'desync'), `semilla ${seed}: desincronía`);
    assert.equal(h.outcome, g.outcome, `semilla ${seed}`);
    assert.ok(h.turns >= 2, `semilla ${seed}: combate real`);
    assert.equal(h.turns, g.turns);
    assert.equal(battleChecksum(sims[0]), battleChecksum(sims[1]));
    assert.equal(sims[0].battlers[2].pbOwnedByPlayer(), false, 'para el anfitrión, la posición 2 es su compañero');
    assert.equal(sims[1].battlers[2].pbOwnedByPlayer(), true, 'para el compañero, la posición 2 es la suya');
  }
});

test('rendirse: quien se rinde pierde; contra otro jugador, el otro gana; en equipo, pierden los dos', { timeout: 60000 }, async () => {
  const pvp = await play('pvp', 5, { forfeit: 1 });
  assert.deepEqual(pvp.results.map((r) => r.outcome), ['win', 'lose']);
  assert.deepEqual(pvp.sims.map((s) => s.linkEnd), ['remoteForfeit', 'forfeit']);
  const coop = await play('coop', 5, { forfeit: 0 });
  assert.deepEqual(coop.results.map((r) => r.outcome), ['lose', 'lose']);
});

test('rivales del combate en equipo: evolucionados, de Axis, al nivel más alto y deterministas por semilla', () => {
  const pool = coopSpeciesPool(db);
  assert.ok(pool.length >= 20);
  const a = coopTrainers(db, { level: 42, seed: 9 });
  const b = coopTrainers(db, { level: 42, seed: 9 });
  assert.deepEqual(a.map((t) => t.party.map((p) => p.species)), b.map((t) => t.party.map((p) => p.species)));
  for (const t of a) {
    assert.equal(t.ai, 100);
    for (const p of t.party) {
      assert.equal(p.level, 42);
      assert.ok(pool.includes(p.species));
      assert.equal(p.ivs.spe, 31);
    }
  }
  assert.equal(coopLevel([{ level: 12 }], [{ level: 30 }, { level: 99, egg: true }]), 30);
});
