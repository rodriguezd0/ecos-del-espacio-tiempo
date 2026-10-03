import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { db } from './battle_helpers.mjs';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { applyRest } from '../game/src/world/rest.js';
import { F, LEGENDS, isPostgame, legendReady, arceusReady } from '../game/src/content/events/b22a_common.js';
import { giratinaRequest, arceusRematchRequest, trioRequest, unchosenRequest, legendBattle } from '../game/src/content/events/b22a_legends.js';
import { platformState } from '../game/src/content/events/b22a_columna.js';
import { uxieQuestion, reflectionsTouch } from '../game/src/content/events/b22a_trio.js';
import { nodeKnown, redDestinations } from '../game/src/content/events/b22a_red.js';
import { RED_NODES, CORAZON } from '../game/src/content/maps/b22a/layout.js';
import { faceVar, heartReady, patternCells, anchoredOf } from '../game/src/content/events/b22a_faces_logic.js';

const postgame = () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag(F.gameCleared);
  s.setFlag(F.postgame);
  return s;
};

test('postgame empieza tras terminar la campaña y despertar del epílogo', () => {
  const s = GameState.create({});
  assert.equal(isPostgame(s), false);
  s.setFlag(F.gameCleared);
  assert.equal(isPostgame(s), false);
  s.setFlag(F.postgame);
  assert.equal(isPostgame(s), true);
});

test('cada legendario debilitado espera un descanso; capturado no vuelve al cargar', () => {
  for (const [key, legend] of Object.entries(LEGENDS)) {
    const s = postgame();
    assert.equal(legendReady(s, key), true, key);
    s.setVar('rest_count', 4);
    s.setVar(legend.rest, 4);
    assert.equal(legendReady(s, key), false, key);
    applyRest(s, { slot: 'morning' });
    assert.equal(legendReady(s, key), true, key);
    s.setFlag(legend.caught);
    const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
    assert.equal(legendReady(loaded, key), false, key);
  }
});

test('el no elegido requiere su orbe y el elegido en el equipo, sin huevos', () => {
  for (const choice of ['DIALGA', 'PALKIA']) {
    const s = postgame();
    s.setVar('p9_choice', choice);
    assert.equal(platformState(s), 'noOrb');
    s.addItem(choice === 'DIALGA' ? 'LUSTROUSORB' : 'ADAMANTORB');
    assert.equal(platformState(s), 'notCaught');
    s.setVar('p9_chosen_caught', true);
    assert.equal(platformState(s), 'notInParty');
    const p = createPokemon(db, choice, 70, { rng: () => 0.5 });
    s.setParty([{ ...p, egg: true }]);
    assert.equal(platformState(s), 'notInParty');
    s.setParty([p]);
    assert.equal(platformState(s), 'ready');
    s.setVar(LEGENDS.otro.rest, 0);
    assert.equal(platformState(s), 'resting');
    s.setVar('rest_count', 1);
    assert.equal(platformState(s), 'ready');
    assert.notEqual(unchosenRequest(choice).wild.species, choice);
  }
});

test('Arceus de postgame tiene una sola fase Normal y espera el descanso del final', () => {
  const s = postgame();
  assert.equal(arceusReady(s), false);
  s.setFlag(F.arceusFainted);
  s.setVar(LEGENDS.arceus.rest, 0);
  assert.equal(arceusReady(s), false);
  applyRest(s, { slot: 'morning' });
  assert.equal(arceusReady(s), true);
  const req = arceusRematchRequest(db);
  assert.equal(req.wild.species, 'ARCEUS');
  assert.equal(req.wild.level, 75);
  assert.equal(req.wild.form || 0, 0);
  assert.equal(req.phases, undefined);
  assert.equal(req.rules.catchCondition({ battlers: [null, { hp: 50, totalhp: 100 }] }).allowed, false);
  assert.equal(req.rules.catchCondition({ battlers: [null, { hp: 49, totalhp: 100 }] }).allowed, true);
});

test('encuentros del Alma conservan nivel 70 y permiten objetos', () => {
  for (const key of ['uxie', 'mesprit', 'azelf']) {
    const req = trioRequest(key);
    assert.equal(req.wild.species, key.toUpperCase());
    assert.equal(req.wild.level, 70);
    assert.notEqual(req.rules?.noBag, true);
  }
  for (const choice of ['DIALGA', 'PALKIA']) {
    const s = postgame();
    s.setVar('p9_choice', choice);
    assert.equal(uxieQuestion(s).options[uxieQuestion(s).answer], choice === 'DIALGA' ? 'Dialga' : 'Palkia');
  }
  assert.equal(reflectionsTouch({ x: 1, y: 2 }, { x: 2, y: 2 }), true);
  assert.equal(reflectionsTouch({ x: 1, y: 2 }, { x: 3, y: 2 }), false);
});

test('la Red solo ofrece nodos conocidos y nunca el origen del salto', () => {
  const s = postgame();
  assert.deepEqual(redDestinations(s, 'laberinto'), []);
  for (const node of RED_NODES) {
    assert.equal(nodeKnown(s, node), false);
    s.data.visited = [...s.data.visited, node.map];
  }
  assert.deepEqual(redDestinations(s, 'laberinto').map((n) => n.id), ['aljibe', 'origen', 'columna']);
  assert.equal(RED_NODES.length, 4);
});

test('las tres caras deben estar ancladas y apuntar al corazón; persisten al cargar', () => {
  const s = postgame();
  assert.equal(heartReady(s, CORAZON.faces), false);
  const phases = [0, 0, 2];
  CORAZON.faces.forEach((f, i) => s.setVar(faceVar(f.id), phases[i]));
  assert.equal(heartReady(s, CORAZON.faces), true);
  const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
  for (const f of CORAZON.faces) assert.equal(patternCells(f, anchoredOf(loaded, f)).size, 5);
  s.setVar(faceVar('oeste'), 2);
  assert.equal(heartReady(s, CORAZON.faces), false);
});

test('captura, derrota, huida y debilitamiento aplican estados distintos', async () => {
  for (const outcome of ['caught', 'win', 'lose', 'run']) {
    const state = postgame();
    state.setVar('rest_count', 7);
    let heals = 0;
    const ctx = {
      state, map: { id: 'distorsion_corazon' }, battle: async () => outcome,
      say: async () => {}, setFlag: (...a) => state.setFlag(...a), setVar: (...a) => state.setVar(...a),
      heal: () => heals++,
    };
    assert.equal(await legendBattle(ctx, 'giratina', giratinaRequest()), outcome);
    assert.equal(state.flag(F.giratinaCaught), outcome === 'caught');
    assert.equal(legendReady(state, 'giratina'), outcome === 'lose' || outcome === 'run');
    assert.equal(heals, outcome === 'lose' ? 1 : 0);
  }
});

test('Giratina: motor real bloquea la Ball sin gastarla y permite capturar desde turno 3', async () => {
  const state = postgame();
  state.setParty([createPokemon(db, 'BLISSEY', 100, { rng: () => 0.5, moves: ['SOFTBOILED'] })]);
  state.addItem('POKEBALL', 2);
  state.addItem('MASTERBALL', 1);
  let attempts = 0;
  let battle;
  class CaptureUI extends HeadlessBattleUI {
    async chooseAction() {
      return attempts === 0 || battle.turnCount >= 2 ? 'bag' : 'fight';
    }
    async chooseItem() {
      return { item: attempts++ === 0 ? 'POKEBALL' : 'MASTERBALL', target: 0, move: -1 };
    }
  }
  const req = giratinaRequest();
  const { config } = buildBattleConfig({ ...req, opponent: { party: [req.wild] } }, { db, state });
  const ui = new CaptureUI();
  battle = new Battle({ ...config, rng: () => 0.99 }, ui);
  const result = await battle.run();
  assert.equal(result.outcome, 'caught', ui.messages.join('\n'));
  assert.equal(result.caught.species, 'GIRATINA');
  assert.equal(result.caught.form, 1);
  assert.equal(result.bag.POKEBALL, 2);
  assert.equal(result.bag.MASTERBALL || 0, 0);
  assert.ok(battle.turnCount >= 2);
});
