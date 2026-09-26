// Combates online en paso a paso (battle/link/linkBattle.js): dos motores REALES, cada uno con su interfaz que elige
// al azar (movimientos, cambios, a veces rendirse), unidos por un canal en memoria. Deben ir siempre a la par (misma
// suma de control cada turno) y terminar con resultados coherentes: 1 contra 1 con los bandos cambiados en cada lado,
// y en equipo contra entrenadores REALES de la historia (IA) con la misma simulación, experiencia y movimientos.
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
import { coopStoryRequest, resolveCoopTrainer, applyCoopResult, playerContribution, coopEligible } from '../game/src/net/coopBattle.js';
import { TRAINERS, getTrainer } from '../game/src/content/trainers/index.js';
import { GameState } from '../game/src/core/state.js';

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
  const reqHost = linkBattleRequest({ mode, role: 'host', me: host, peer: guest, seed, channel: toGuest });
  const reqGuest = linkBattleRequest({ mode, role: 'guest', me: guest, peer: host, seed, channel: toHost });
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

test('1 contra 1: quien se rinde pierde y el otro gana', { timeout: 60000 }, async () => {
  const pvp = await play('pvp', 5, { forfeit: 1 });
  assert.deepEqual(pvp.results.map((r) => r.outcome), ['win', 'lose']);
  assert.deepEqual(pvp.sims.map((s) => s.linkEnd), ['remoteForfeit', 'forfeit']);
});

// ---------------------------------------------------------------- en equipo contra la historia
/** Interfaz al azar que además decide si aprende movimientos nuevos. */
class RandomLearnUI extends RandomUI {
  async learnMove(pokemon) {
    const r = Math.floor(this.rand() * (pokemon.moves.length + 1));
    return r >= pokemon.moves.length ? null : r;
  }
}

/** Entrenadores de la historia con al menos `min` Pokémon (los primeros del registro, orden estable). */
function storyTrainers(min) {
  return Object.keys(TRAINERS).filter((id) => (TRAINERS[id].party || []).length >= min).slice(0, 8);
}

function humanFromTeam(name, gender, id, list) {
  const st = GameState.create({ name, gender });
  st.player.id = id;
  for (const p of list) st.addPokemon(p);
  return { state: st, me: playerContribution(st) };
}

async function playCoop(trainerId, seed) {
  const [toGuest, toHost] = channelPair();
  const trainer = resolveCoopTrainer({ trainer: trainerId }, { db, state: null, getTrainer });
  const top = Math.max(...trainer.party.map((p) => p.level));
  const lv = Math.max(5, top - 2); // algo por debajo: suben de nivel y aprenden movimientos durante el combate
  const host = humanFromTeam('Ana', 'F', 1, team(seed, 2, lv));
  const guest = humanFromTeam('Beto', 'M', 2, team(seed + 3, 2, lv));
  const reqs = [
    coopStoryRequest({ role: 'host', host: host.me, guest: guest.me, trainer, seed, channel: toGuest }),
    coopStoryRequest({ role: 'guest', host: JSON.parse(JSON.stringify(host.me)), guest: guest.me, trainer: JSON.parse(JSON.stringify(trainer)), seed, channel: toHost }),
  ];
  const sims = reqs.map((req, i) => {
    const { config } = buildBattleConfig(req, { db });
    const battle = new Battle(config, new RandomLearnUI(seed * 10 + i, { switchRate: 0.1 }));
    installLink(battle, req.link);
    return battle;
  });
  const results = await Promise.all(sims.map((b) => b.run()));
  return { sims, results, host, guest };
}

const expOf = (party) => (party || []).reduce((a, p) => a + (p?.exp || 0), 0);

test('en equipo contra entrenadores de la historia: misma simulación, experiencia para los dos y movimientos sincronizados', { timeout: 240000 }, async () => {
  const ids = storyTrainers(1);
  assert.ok(ids.length >= 4);
  let wins = 0;
  for (const [i, id] of ids.entries()) {
    const seed = 100 + i;
    const { sims, results, host, guest } = await playCoop(id, seed);
    const [h, g] = results;
    assert.ok(!sims.some((s) => s.linkEnd === 'desync'), `${id}: desincronía`);
    assert.equal(h.outcome, g.outcome, `${id}: mismo resultado`);
    assert.equal(h.turns, g.turns, `${id}: mismos turnos`);
    assert.equal(battleChecksum(sims[0]), battleChecksum(sims[1]), `${id}: mismo estado final`);
    assert.deepEqual(h.playerParty, g.playerParty, `${id}: el equipo del anfitrión igual en las dos pantallas`);
    assert.deepEqual(h.allyParty, g.allyParty, `${id}: el del compañero también (movimientos aprendidos incluidos)`);
    assert.equal(sims[0].battlers[2].pbOwnedByPlayer(), false, 'para el anfitrión, la posición 2 es su compañero');
    assert.equal(sims[1].battlers[2].pbOwnedByPlayer(), true, 'para el compañero, la posición 2 es la suya');
    if (h.outcome === 'win') {
      wins += 1;
      assert.ok(expOf(h.playerParty) > expOf(host.me.party), `${id}: el anfitrión gana experiencia`);
      assert.ok(expOf(h.allyParty) > expOf(guest.me.party), `${id}: el compañero también`);
    }
  }
  assert.ok(wins >= 2, `se ganan varios combates (${wins})`);
});

test('en equipo: el resultado se aplica a cada partida respetando huevos y posiciones', () => {
  const st = GameState.create({ name: 'Beto' });
  const a = createPokemon(db, 'PIKACHU', 10, { rng: () => 0.5 });
  const egg = { ...createPokemon(db, 'EEVEE', 1, { rng: () => 0.5 }), egg: true };
  const b = createPokemon(db, 'MACHOP', 10, { rng: () => 0.5 });
  st.setParty([a, egg, b]);
  const { slots, party } = playerContribution(st);
  assert.deepEqual(slots, [0, 2]);
  const grown = party.map((p) => ({ ...p, level: p.level + 1, exp: p.exp + 500 }));
  const money = st.player.money;
  const { evolutions } = applyCoopResult(st, db, { result: { allyParty: grown, moneyChange: 300, seen: ['GEODUDE'] }, role: 'guest', slots, levelsBefore: [10, 10] });
  assert.equal(st.party[1].egg, true, 'el huevo sigue en su sitio');
  assert.equal(st.party[0].level, 11);
  assert.equal(st.party[2].level, 11);
  assert.equal(st.player.money, money + 300);
  assert.ok(st.data.dex.seen.GEODUDE);
  assert.deepEqual(evolutions, []);
});

test('en equipo: solo combates normales contra un entrenador (no dobles, jefes con fases ni salvajes)', () => {
  assert.equal(coopEligible({ type: 'trainer', trainer: 'x' }), true);
  assert.equal(coopEligible({ trainer: 'x', format: 'double' }), false);
  assert.equal(coopEligible({ trainer: 'x', phases: [{}] }), false);
  assert.equal(coopEligible({ trainer: 'x', trainers: ['a', 'b'] }), false);
  assert.equal(coopEligible({ type: 'wild', wild: { species: 'PIKACHU' } }), false);
  assert.equal(coopEligible({ trainer: 'x', noCoop: true }), false);
});

