// Helper común de combates de guion (content/common/bossBattle.js; docs/BALANCE.md «Combates de guion», CAMPANA §2.6):
// sin pérdida de dinero, equipo curado, casilla de reintento y sin tocar el punto de cura. Incluye la comprobación con
// el motor real (sin «¡Estás fuera de combate!» ni «Has pagado…») y los jefes de B04–B05 adaptados.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { bossBattle, bossBattleRequest, recoverAfterLoss, scriptedBattle, BOSS_RULES } from '../game/src/content/common/bossBattle.js';
import { scriptedBattle as b06ScriptedBattle } from '../game/src/content/events/b06_common.js';
import { leandroBattle } from '../game/src/content/events/b04_pilar_core.js';
import { millEvents, MILL, MILL_ID } from '../game/src/content/events/b05_t02.js';
import { GameState } from '../game/src/core/state.js';
import { buildBattleConfig } from '../game/src/battle/scene/setup.js';
import { Battle, HeadlessBattleUI } from '../game/src/battle/core/index.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { BLACKOUT_TEXT } from '../game/src/battle/core/constants.js';
import { getTrainer } from '../game/src/content/trainers/index.js';

const load = (f) => JSON.parse(fs.readFileSync(new URL(`../game/data/${f}`, import.meta.url), 'utf8'));
const db = {
  species: load('species.json'), moves: load('moves.json'), abilities: load('abilities.json'), types: load('types.json'),
  items: { ...load('items.json'), ...load('items_axis.json') }, trainerTypes: load('trainer_types.json'),
};

/** ctx simulado que registra lo que hace el guion (orden de llamadas incluido). */
function mockCtx(state, { outcome = 'lose', mapId = 'mapa_prueba', ...extra } = {}) {
  const log = [];
  const ctx = {
    state, log, said: [], request: null, warpArgs: null,
    map: { id: mapId },
    battle: async (req) => { ctx.request = req; log.push('battle'); if (outcome instanceof Error) throw outcome; return outcome; },
    heal: () => { log.push('heal'); },
    warp: async (...args) => { ctx.warpArgs = args; log.push('warp'); },
    fade: async (dir) => { log.push(`fade:${dir}`); },
    say: async (text, opts = {}) => { ctx.said.push({ text, speaker: opts.speaker ?? null }); log.push('say'); },
    scene: { refreshFollower: () => { log.push('follower'); } },
    flag: (k) => state.flag(k),
    setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d = 0) => state.var(k, d),
    setVar: (k, v) => { state.setVar(k, v); log.push(`setVar:${k}`); },
    face: () => {}, emote: async () => {}, move: async () => {}, wait: async () => {}, se: () => {}, me: () => {},
    turnToPlayer: () => {}, requestRefresh: () => {},
    world: { events: [] },
    player: { x: 5, y: 5 },
    ...extra,
  };
  return ctx;
}

function stateWithHealPoint() {
  const s = GameState.create({ name: 'P' });
  s.setHealPoint('villa_zaguan', 7, 9, 2);
  return s;
}

test('bossBattleRequest: fuerza canLose y noMoneyLoss sin modificar la petición', () => {
  const req = Object.freeze({ trainer: 'leandro', format: 'double', rules: Object.freeze({ canRun: false, canLose: false }) });
  const out = bossBattleRequest(req);
  assert.equal(out.trainer, 'leandro');
  assert.equal(out.format, 'double');
  assert.equal(out.canLose, true);
  assert.deepEqual(out.rules, { canRun: false, canLose: true, noMoneyLoss: true });
  assert.deepEqual(req.rules, { canRun: false, canLose: false }, 'la entrada no cambia');
  assert.deepEqual(BOSS_RULES, { canLose: true, noMoneyLoss: true });
});

test('derrota con casilla de reintento: cura, onLose, warp y frase; el punto de cura no cambia', async () => {
  const s = stateWithHealPoint();
  const ctx = mockCtx(s, { outcome: 'lose' });
  const out = await bossBattle(ctx, { trainer: 'x' }, { x: 3, y: 4, dir: 6 }, {
    onLose: (c) => c.setVar('reintentos', 1), loseText: ['Otra vez.', 'Te espero.'], speaker: 'Jefa',
  });
  assert.equal(out, 'lose');
  assert.deepEqual(ctx.warpArgs, ['mapa_prueba', 3, 4, 6]);
  assert.deepEqual(ctx.log, ['battle', 'heal', 'setVar:reintentos', 'warp', 'say', 'say']);
  assert.deepEqual(ctx.said, [{ text: 'Otra vez.', speaker: 'Jefa' }, { text: 'Te espero.', speaker: 'Jefa' }]);
  assert.deepEqual(s.healPoint, { mapId: 'villa_zaguan', x: 7, y: 9, dir: 2 });
});

test('reintento en otro mapa y dirección por defecto (arriba); opciones de warp opcionales', async () => {
  const ctx = mockCtx(stateWithHealPoint());
  await bossBattle(ctx, { trainer: 'x' }, { map: 'otro_mapa', x: 1, y: 2 }, { warp: { fade: false } });
  assert.deepEqual(ctx.warpArgs, ['otro_mapa', 1, 2, 8, { fade: false }]);
});

test('sin casilla de reintento: se queda en su sitio, fundido mientras se cura y el seguidor vuelve', async () => {
  const s = stateWithHealPoint();
  const ctx = mockCtx(s);
  const out = await bossBattle(ctx, { trainer: 'x' }, null, { loseText: 'Vuelve a hablarme.' });
  assert.equal(out, 'lose');
  assert.equal(ctx.warpArgs, null);
  assert.deepEqual(ctx.log, ['battle', 'fade:out', 'heal', 'follower', 'fade:in', 'say']);
  assert.deepEqual(s.healPoint, { mapId: 'villa_zaguan', x: 7, y: 9, dir: 2 });
});

test('victoria (o captura) no cura ni mueve; huir de un salvaje no se trata como derrota', async () => {
  for (const outcome of ['win', 'caught', 'run']) {
    const ctx = mockCtx(stateWithHealPoint(), { outcome });
    assert.equal(await bossBattle(ctx, { wild: { species: 'PIKACHU', level: 5 } }, { x: 1, y: 1 }), outcome);
    assert.deepEqual(ctx.log, ['battle'], outcome);
  }
});

test('un combate que falla (forfeit o excepción) cuenta como derrota sin pérdida', async () => {
  for (const outcome of ['forfeit', new Error('fallo de prueba')]) {
    const ctx = mockCtx(stateWithHealPoint(), { outcome });
    const origError = console.error;
    console.error = () => {};
    try {
      assert.equal(await bossBattle(ctx, { trainer: 'x' }, { x: 2, y: 2 }), 'lose');
    } finally {
      console.error = origError;
    }
    assert.ok(ctx.log.includes('heal') && ctx.log.includes('warp'));
  }
});

test('recoverAfterLoss sin escena ni fundido (ctx mínimo) solo cura', async () => {
  const calls = [];
  await recoverAfterLoss({ heal: () => calls.push('heal') }, null);
  assert.deepEqual(calls, ['heal']);
});

test('b06_common reexporta scriptedBattle del helper común', () => {
  assert.equal(b06ScriptedBattle, scriptedBattle);
});

test('motor real: con las reglas de guion perder no cobra dinero ni da «fuera de combate»', async () => {
  const run = async (request) => {
    const party = [createPokemon(db, 'MAGIKARP', 2)];
    const { config } = buildBattleConfig({ ...request, seed: 7, player: { name: 'P', party, money: 5000 } },
      { db, getTrainer: (id) => getTrainer(id, null) });
    return new Battle(config, new HeadlessBattleUI({})).run();
  };
  const boss = await run(bossBattleRequest({ trainer: 'leandro' }));
  assert.equal(boss.outcome, 'lose');
  assert.equal(boss.moneyChange, 0, 'sin pérdida de dinero');
  assert.equal(boss.blackedOut, false);
  assert.ok(!boss.log.includes(BLACKOUT_TEXT), 'sin «¡Estás fuera de combate!»');
  assert.ok(!boss.log.some((l) => l.startsWith('Has pagado')), 'sin texto de pago');
  assert.ok(boss.log.some((l) => l.startsWith('¡Has perdido contra')), 'el motor anuncia la derrota');
  // Contraste: la misma derrota sin noMoneyLoss sí cobra (lo que pasaba antes con Leandro y los técnicos de T02).
  const plain = await run({ trainer: 'leandro', canLose: true });
  assert.ok(plain.moneyChange < 0);
});

test('B04 Leandro: perder no cobra, cura en la isla sin moverse y suma un intento', async () => {
  const s = stateWithHealPoint();
  const ctx = mockCtx(s, { outcome: 'lose', mapId: 'pilar_corriente' });
  assert.equal(await leandroBattle(ctx), false);
  assert.ok(ctx.request.canLose && ctx.request.rules.noMoneyLoss);
  assert.equal(ctx.request.trainer, 'leandro');
  assert.equal(ctx.warpArgs, null, 'se le vuelve a hablar: no hay warp');
  assert.ok(ctx.log.includes('heal'));
  assert.equal(s.var('b04_leandro_intentos', 0), 1);
  assert.deepEqual(ctx.said.slice(-2).map((l) => l.speaker), ['Leandro', 'Leandro'], 'frases de Leandro tras perder');
  assert.deepEqual(s.healPoint, { mapId: 'villa_zaguan', x: 7, y: 9, dir: 2 });
});

test('B05 T02: perder contra los técnicos devuelve a la puerta del molino, curado y sin cobrar', async () => {
  const s = stateWithHealPoint();
  s.setVar('b05_t02_visita', 1);
  const tech = millEvents().find((e) => e.id === 'tecnico_0');
  const ctx = mockCtx(s, { outcome: 'lose', mapId: MILL_ID });
  await tech.script(ctx);
  assert.ok(ctx.request.canLose && ctx.request.rules.noMoneyLoss);
  assert.deepEqual(ctx.warpArgs, [MILL_ID, MILL.door.x, MILL.door.y, 8]);
  assert.equal(s.var('b05_t02_reintento', 0), 1);
  assert.ok(ctx.said.some((l) => l.text.includes('puerta del molino')));
  assert.equal(s.var('b05_t02_tec_0', 0), 0, 'el técnico sigue sin vencer');
  assert.deepEqual(s.healPoint, { mapId: 'villa_zaguan', x: 7, y: 9, dir: 2 });
});
