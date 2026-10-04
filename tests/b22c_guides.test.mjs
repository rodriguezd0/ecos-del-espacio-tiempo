import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { fieldWorld, fieldCtx, entryState, runEvent, db } from './b18_helpers.mjs';
import { F, LEGENDS } from '../game/src/content/events/b22c_common.js';
import { configureGuide, guideMode, marineEnter } from '../game/src/content/events/b22c_lugia.js';
import { roomEnter } from '../game/src/content/events/b22c_rooms.js';
import { enterLegendRoom } from '../game/src/content/events/b22c_maps.js';
import { fightLegend, requestFor } from '../game/src/content/events/b22c_encounters.js';

const state = () => { const s = entryState(); s.setFlag('game_cleared'); s.setFlag('b21_fin'); s.setFlag(F.ramon); return s; };
async function context(map, s = state(), opts = {}) { const t = await fieldWorld(map, { state: s }); const c = fieldCtx(t, opts); c.db = db; return c; }

test('B22c: destellos normales/largos, tonos direccionales y cancelación usan recursos reales y conservan preferencias', async () => {
  const audio = JSON.parse(fs.readFileSync('game/data/audio_index.json', 'utf8')).se;
  for (const mode of [0, 1, 2, 3]) {
    const c = await context('sima_marina', state(), { choices: [mode, 4] }), flashes = [], sounds = [];
    c.flash = async (...args) => flashes.push(args); c.se = name => sounds.push(name);
    await configureGuide(c); await runEvent(c, 'b22c_aerochorro_0'); await runEvent(c, 'b22c_aerochorro_1');
    assert.equal(guideMode(c.state), mode);
    assert.equal(flashes.length, mode < 2 ? 2 : 0);
    if (mode < 2) assert.equal(flashes[0][1], mode === 1 ? 90 : 15);
    for (const name of sounds) assert.ok(audio.some(file => file.replace(/\.[^.]+$/, '') === name), name);
    assert.equal(sounds.length, mode === 2 ? 3 : mode < 2 ? 2 : 0);
    const seen = c.var('b22c_lugia_senales'); await configureGuide(c);
    assert.equal(guideMode(c.state), mode); assert.equal(c.var('b22c_lugia_senales'), seen);
  }
});

test('B22c: las introducciones se ven una vez, se puede cancelar el acceso y entrar sin equipo a leer el balcón', async () => {
  const c = await context('sima_marina', state(), { choices: [3] }); await marineEnter(c);
  const count = c.said.length; await marineEnter(c); assert.equal(c.said.length, count);
  const ray = await context('balcon_cielo'); await roomEnter('rayquaza')(ray);
  assert.match(ray.said.at(-1).text, /equipo.*tormenta/); const said = ray.said.length;
  await roomEnter('rayquaza')(ray); assert.equal(ray.said.length, said);
  const entry = await context('cumbre_azur', state(), { confirms: [false, true] });
  await enterLegendRoom(entry, 'rayquaza'); assert.deepEqual(entry.log.warps, []);
  await enterLegendRoom(entry, 'rayquaza'); assert.equal(entry.log.warps.at(-1).mapId, 'balcon_cielo');
  entry.state.setFlag('b21_fin', false); await enterLegendRoom(entry, 'rayquaza'); assert.equal(entry.log.warps.length, 1);
});

test('B22c: placa de Ascenso Draco enseña en equipo, permite cancelar o reemplazar, y no cobra', async () => {
  const c = await context('balcon_cielo'), money = c.state.player.money;
  await runEvent(c, 'b22c_ascenso_draco'); assert.match(c.said.at(-1).text, /Trae a Rayquaza/);
  c.state.setParty([createPokemon(db, 'RAYQUAZA', 78, { moves: ['DRAGONPULSE'], rng: () => 0.5 })]);
  await runEvent(c, 'b22c_ascenso_draco'); assert.ok(c.state.party[0].moves.some(m => m.id === 'DRAGONASCENT'));
  await runEvent(c, 'b22c_ascenso_draco'); assert.match(c.said.at(-1).text, /ya sabe/);
  c.state.setParty([createPokemon(db, 'RAYQUAZA', 78, { moves: ['DRAGONPULSE', 'FLY', 'EXTREMESPEED', 'HYPERBEAM'], rng: () => 0.5 })]);
  c.ui.learnMove = async () => null; await runEvent(c, 'b22c_ascenso_draco'); assert.ok(!c.state.party[0].moves.some(m => m.id === 'DRAGONASCENT'));
  c.ui.learnMove = async () => 3; await runEvent(c, 'b22c_ascenso_draco'); assert.equal(c.state.party[0].moves[3].id, 'DRAGONASCENT');
  assert.equal(c.state.player.money, money);
});

test('B22c: scripts vuelven a comprobar gates y recuperación sin iniciar batallas o duplicar megapiedras', async () => {
  const c = await context('lagos_alma'); assert.equal(await fightLegend(c, 'latias'), 'blocked'); assert.equal(c.log.battles.length, 0);
  c.state.addItem('SOULDEW', 1); c.state.setFlag(LEGENDS.latias.caught);
  assert.equal(await fightLegend(c, 'latias'), 'absent'); assert.equal(c.state.itemCount('LATIASITE'), 0);
  c.state.setFlag(LEGENDS.latias.caught, false); c.state.setFlag(LEGENDS.latias.beaten); c.setVar(LEGENDS.latias.rest, 0);
  assert.equal(await fightLegend(c, 'latias'), 'absent'); assert.equal(c.log.battles.length, 0);
  await assert.rejects(() => fightLegend(c, 'missing'), /desconocido/); assert.throws(() => requestFor('missing'), /desconocido/);
});
