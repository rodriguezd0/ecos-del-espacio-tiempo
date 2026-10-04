import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { b21CasaGaelEvents, gaelEggSpecies } from '../game/src/content/events/b21_epilogo.js';
import { F, V } from '../game/src/content/events/b21_common.js';
import { RESOLUTION_TEXT } from '../game/src/content/events/b21_texts.js';
import { gael, resolutionLine } from '../tools/e2e_campaign_b21.mjs';
import { db } from './battle_helpers.mjs';

function fixture(starter, size = 6) {
  let state = GameState.create({ name: 'Fixture' });
  state.setVar(V.gaelStarter, starter);
  const species = ['ZYGARDE', 'TORTERRA', 'GRAVELER', 'INTELEON', 'ROTOM', 'CRANIDOS'];
  for (const [i, sp] of species.slice(0, size).entries()) state.addPokemon(createPokemon(db, sp, 70 - i * 6, { rng: () => 0.5 }));
  const actions = [], note = b21CasaGaelEvents().find(e => e.id === 'b21_nota_gael').pages[0].script;
  let map = 'villa_alba', interactions = 0;
  const snap = () => ({ map, flags: { ...state.data.flags }, vars: { ...state.data.vars },
    partyList: state.party.map(p => p.species),
    partyFull: state.party.map(p => ({ species: p.species, egg: Boolean(p.egg) })),
    boxedPokemon: state.boxes.flat().filter(Boolean).map(p => ({ species: p.species, egg: Boolean(p.egg) })),
    pokemon: state.party.map(p => ({ species: p.species, level: p.level })),
  });
  const d = {
    snap: async () => snap(),
    travel: async to => { actions.push(['travel', to]); map = to; },
    depositAtPC: async sp => { assert.equal(map, 'zaguan_centro'); actions.push(['deposit', sp]); state.depositPokemon(state.party.findIndex(p => p.species === sp), 0); },
    walkTo: async () => {}, pushUntil: async () => { map = 'casa_gael'; },
    interact: async () => { interactions++; await note({ state, db, flag: f => state.flag(f), setFlag: (f, v = true) => state.setFlag(f, v), say: async () => {}, me() {} }); },
    expectSaid: async () => {}, exitTo: async () => { map = 'villa_alba'; },
    milestone: async (_name, check) => { const s = snap(); assert.equal(await check(s), null); return s; },
  };
  return { get state() { return state; }, d, actions, snap, interactions: () => interactions,
    reload: () => { state = new GameState(JSON.parse(JSON.stringify(state.data))); } };
}

test('campaign epilogue: a full real party makes room through the PC and receives the rival starter egg once', async () => {
  for (const starter of ['LITTEN', 'SOBBLE', 'TURTWIG']) {
    const f = fixture(starter);
    await gael(f.d);
    assert.ok(f.actions.some(a => a[0] === 'deposit'), 'el piloto debe usar el PC antes de leer la nota');
    assert.ok(f.state.flag(F.gaelEggGiven));
    assert.equal(f.state.flag(F.gaelEggWaiting), false);
    assert.equal(f.state.party.filter(p => p.egg && p.species === starter).length, 1);
    assert.ok(f.state.party.some(p => p.species === 'ZYGARDE'), 'Zygarde continúa en el equipo');
    assert.ok(f.interactions() >= 2, 'volver a leer la nota acredita la entrega única');
  }
});

test('campaign epilogue: spare room and a later loaded visit need no further deposit or duplicate gift', async () => {
  const f = fixture('SOBBLE', 5);
  await gael(f.d);
  assert.equal(f.actions.filter(a => a[0] === 'deposit').length, 0);
  const saved = JSON.parse(JSON.stringify(f.state.data));
  assert.equal(saved.flags[F.gaelEggGiven], true);
  assert.equal(gaelEggSpecies(f.state), 'SOBBLE');
  f.reload();
  await gael(f.d);
  assert.equal(f.actions.filter(a => a[0] === 'deposit').length, 0, 'la visita con el huevo ya entregado conserva el equipo lleno');
  assert.equal(f.state.party.filter(p => p.egg && p.species === 'SOBBLE').length, 1);
  assert.ok(f.interactions() >= 4);
});

test('campaign epilogue: the repaired axis evidence follows the actual P9 choice', () => {
  for (const choice of ['DIALGA', 'PALKIA']) assert.equal(resolutionLine({ vars: { [V.p9Choice]: choice } }), RESOLUTION_TEXT.axis[choice]);
  assert.throws(() => resolutionLine({ vars: {} }), /elección|P9/);
});
