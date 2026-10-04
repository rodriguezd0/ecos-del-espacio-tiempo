import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { db, mon } from './battle_helpers.mjs';
import { bastionRequest, enrollmentError, recordMatch, canContinueTeam, PRIZES, exchangePrize } from '../game/src/content/events/b22e_bastion_logic.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';

const state = () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setFlag('game_cleared'); s.setFlag('b21_fin');
  s.setParty([mon('PIKACHU', 80, ['THUNDERBOLT']), mon('CHARIZARD', 75, ['FLAMETHROWER']), mon('BLASTOISE', 73, ['SURF'])]);
  return s;
};

test('Bastión inscribe tres miembros distintos y rechaza huevos, caídos y selecciones inválidas', () => {
  const s = state();
  assert.equal(enrollmentError(s, [0, 1, 2]), null);
  for (const slots of [[0, 0, 1], [0, 1], [0, 1, 6], [0, 1, -1]]) assert.ok(enrollmentError(s, slots));
  s.party[2].egg = true; assert.ok(enrollmentError(s, [0, 1, 2]));
  s.party[2].egg = false; s.party[2].hp = 0; assert.ok(enrollmentError(s, [0, 1, 2]));
});

test('la ronda usa copias curadas a nivel50, IA120, sin Mochila/experiencia/dinero y no cambia el equipo original', () => {
  const s = state(), before = JSON.stringify(s.data);
  const r = bastionRequest(db, s, [0, 1, 2], { seed: 2026, streak: 6 });
  const { config } = buildBattleConfig(r, { db });
  assert.equal(r.exhibition, true); assert.equal(r.noCoop, true);
  assert.equal(config.player.party.length, 3);
  assert.ok(config.player.party.every((p) => p.level === 50 && p.hp > 0));
  assert.equal(config.opponent.skill, 120);
  assert.equal(config.rules.expGain, false); assert.equal(config.rules.moneyGain, false);
  assert.ok(config.rules.sealedBag); assert.equal(config.rules.canLose, true);
  assert.equal(JSON.stringify(s.data), before);
  assert.deepEqual(bastionRequest(db, s, [0, 1, 2], { seed: 2026, streak: 6 }), r, 'la misma racha tiene los mismos rivales');
});

test('se guardan victorias individuales, rondas de siete, récord y puntos; derrota reinicia solo la racha', () => {
  const s = state();
  for (let i = 0; i < 21; i++) recordMatch(s, 'win');
  assert.equal(s.var('b22e_bastion_racha'), 21);
  assert.equal(s.var('b22e_bastion_record'), 21);
  assert.ok(s.var('b22e_bastion_pb') > 0);
  assert.equal(s.flag('b22e_bastion_ronda'), true); assert.equal(s.flag('b22e_bastion_maestro'), true);
  const points = s.var('b22e_bastion_pb');
  recordMatch(s, 'lose');
  assert.equal(s.var('b22e_bastion_racha'), 0);
  assert.equal(s.var('b22e_bastion_record'), 21); assert.equal(s.var('b22e_bastion_pb'), points);
  const loaded = new GameState(JSON.parse(JSON.stringify(s.data)));
  assert.equal(loaded.var('b22e_bastion_record'), 21);
});

test('la inscripción guardada necesita los mismos tres Pokémon; canje no descuenta puntos si faltan', () => {
  const s = state();
  s.setVar('b22e_bastion_equipo', s.party.map((p) => p.uid));
  assert.equal(canContinueTeam(s), true);
  s.setParty(s.party.slice(0, 2)); assert.equal(canContinueTeam(s), false);
  const p = PRIZES[0];
  assert.equal(exchangePrize(s, p.id), false);
  assert.equal(s.itemCount(p.id), 0);
  s.setVar('b22e_bastion_pb', p.cost);
  assert.equal(exchangePrize(s, p.id), true);
  assert.equal(s.var('b22e_bastion_pb'), 0); assert.equal(s.itemCount(p.id), 1);
});

test('el flujo real de mapa conserva partida y selección cuando el combate de exhibición se pierde', async () => {
  globalThis.location ||= { search: '' };
  const [{ engine }, { runBattle }, { installBattle }] = await Promise.all([
    import('../game/src/core/engine.js'), import('../game/src/world/battleFlow.js'), import('../game/src/battle/api.js'),
  ]);
  const s = state(); engine.state = s; engine.data = db;
  const before = JSON.stringify(s.data); let sent;
  const request = bastionRequest(db, s, [0, 1, 2], { seed: 1, streak: 0 });
  installBattle(async (r) => {
    sent = r;
    return { outcome: 'lose', canLose: true, stored: false, playerParty: r.player.party.map((p) => ({ ...p, hp: 0 })), bag: {}, moneyChange: -9999 };
  });
  const scene = { world: { current: { def: { outdoor: false, battleback: 'indoor' } },
    player: { x: 0, y: 0, realX: 0, realY: 0, terrainTag: () => ({ battleEnvironment: 'None' }) },
    encounters: { hasBase: () => false, reset: () => {} } },
    weather: { type: 'none' }, camera: { renderX: 0, renderY: 0 }, runner: { wait: async () => {} },
    fx: { fadeTo: async () => {}, playTransition: async () => {}, clearTransition: () => {}, fadeIn: async () => {} }, refreshFollower: () => {},
  };
  try {
    assert.equal((await runBattle(scene, request)).outcome, 'lose');
    assert.ok(sent.player.party.every((p) => p.level === 50), 'no sustituye las copias por el equipo real');
    assert.equal(JSON.stringify(s.data), before, 'no aplica PS, niveles, Mochila ni dinero del combate de práctica');
  } finally { installBattle(null); engine.state = null; engine.data = null; }
});

test('pulsar Mochila en el Bastión vuelve al menú sin abrir ni consumir objetos', async () => {
  const { config } = buildBattleConfig(bastionRequest(db, state(), [0, 1, 2]), { db });
  class UI extends HeadlessBattleUI {
    async chooseAction(...args) { if (!this.attempted) { this.attempted = true; return 'bag'; } return super.chooseAction(...args); }
    async chooseItem() { this.opened = true; return null; }
  }
  const ui = new UI(); await new Battle(config, ui).run();
  assert.equal(ui.attempted, true); assert.ok(!ui.opened, 'la regla del Bastión bloquea el menú de objetos');
  assert.ok(ui.messages.some((m) => /Bastión.*Mochila|Mochila.*Bastión/.test(m)));
});

test('la UI sin partida usa su inventario de combate sin sincronizar la partida global', async () => {
  globalThis.location ||= { search: '' };
  const [{ engine }, { SceneBattleUI }, { ui }] = await Promise.all([
    import('../game/src/core/engine.js'), import('../game/src/battle/scene/sceneUI.js'), import('../game/src/ui/api.js'),
  ]);
  const s = state(); s.addItem('POTION', 7); s.addItem('MASTERBALL', 2); engine.state = s; engine.data = db;
  const original = JSON.stringify(s.data.bag), open = ui.openBag;
  let globalMenu = false, fallback = false;
  ui.openBag = async () => { globalMenu = true; return null; };
  const sceneUI = new SceneBattleUI({ meta: {} }, { state: null }); sceneUI.battle = { bag: {} };
  sceneUI.chooseItemFallback = async () => { fallback = true; return null; };
  try {
    assert.equal(await sceneUI.chooseItem({ partyIndex: 0 }, { bag: [], party: [] }), null);
    assert.equal(JSON.stringify(s.data.bag), original);
    assert.equal(globalMenu, false); assert.equal(fallback, true);
  } finally { ui.openBag = open; engine.state = null; engine.data = null; }
});
