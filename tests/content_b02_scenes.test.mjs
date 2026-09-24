// Bloque 2 — Pilar del Umbral (docs/CAMPANA.md B02): puzzle de la Galería de los Dinteles (D08) y escenas con un
// ctx simulado sobre un GameState real (sin navegador): entrada con Casilda y C009, Geodude, combate de la Guardiana
// con reintento sin pérdida, núcleo con restorePillar/Arca/verso I y salida con el 10 %, el Consorcio y la Libreta.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { loadDb } from '../tools/validate_content_lib.mjs';
import { storyApi } from '../game/src/content/story/api.js';
import { clueStatus } from '../game/src/content/story/clueLogic.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { F } from '../game/src/content/events/b02_common.js';
import {
  STONES, ROTATION, START_DIR, nextDir, turnStone, applyTurn, stoneDir, isSolved, allSolved, coreNear, CORE_RANGE,
} from '../game/src/content/events/b02_puzzle.js';
import { stoneScript, stoneIntro } from '../game/src/content/events/b02_ruinas_salas.js';
import { EXPLANADA_DOOR } from '../game/src/content/maps/b02/explanada_umbral_layout.js';
import { explanadaEvents, toDusk, T01_TEXT } from '../game/src/content/events/b02_explanada.js';
import { guardianBattle, holdToPull, PULL_FRAMES } from '../game/src/content/events/b02_ruinas_camara.js';
import { nucleoEvents } from '../game/src/content/events/b02_ruinas_nucleo.js';
import { casildaEvents, ROOM, ROOM_VAR, casildaSpot, HEAL_SPOT } from '../game/src/content/events/b02_ruinas_casilda.js';
import { ANTESALA } from '../game/src/content/maps/b02/ruinas_dintel_layout.js';

const db = loadDb();
const KEY_POCKET = 8;

/** ctx de guiones simulado: registra diálogos, objetos y saltos; el estado es un GameState real. */
function mockCtx(state, { core = null, events = [], battle = 'win', input = null } = {}) {
  const said = [];
  const world = { core, events, input, player: { x: 15, y: 12, direction: 8 } };
  const ctx = {
    state, world, said, db, audio: null, ui: { toast() {} }, event: null,
    get player() { return world.player; },
    say: async (t, o = {}) => { said.push({ t: String(t), who: o.telepathy ? 'Core' : (o.speaker || '') }); },
    confirm: async () => true, choice: async () => 0,
    wait: async () => {}, fade: async () => {}, flash: async () => {}, shake: async () => {}, tone: async () => {},
    se() {}, me() {}, bgm() {}, cry() {}, emote: async () => {}, face() {}, turnToPlayer() {}, approach: async () => {},
    move: async () => {}, jump: async () => {}, erase() {}, requestRefresh() {}, heal() { ctx.healed = true; },
    effect: () => ({ remove() {} }), camera: { pan: async () => {}, reset: async () => {} },
    directionTo: () => 8, facingTile: () => ({ x: 35, y: 20 }),
    flag: (k) => state.flag(k), setFlag: (k, v = true) => state.setFlag(k, v),
    var: (k, d) => state.var(k, d), setVar: (k, v) => state.setVar(k, v),
    selfSwitch: () => true, setSelfSwitch() {},
    async giveItem(id, n = 1) {
      const it = db.items[id];
      assert.ok(it, `objeto ${id}`);
      if (it.pocket === KEY_POCKET) state.addKeyItem(id); else state.addItem(id, n);
    },
    async givePokemon(spec) { const p = createPokemon(db, spec.species, spec.level); state.addPokemon(p); return p; },
    async battle(cfg) { ctx.lastBattle = cfg; return battle; },
    async warp(...a) { ctx.warped = a; },
  };
  ctx.story = storyApi(ctx);
  return ctx;
}

const newState = (...flags) => {
  const s = GameState.create({ name: 'Prueba' });
  for (const f of flags) s.setFlag(f);
  return s;
};
const pageScript = (events, id, state) => {
  const ev = events.find((e) => e.id === id);
  const pages = ev.pages || [ev];
  for (let i = pages.length - 1; i >= 0; i--) if (!pages[i].when || pages[i].when(state, { selfSwitch: () => false })) return pages[i].script || ev.script;
  return ev.script;
};

// ─────────────────────────────────────────────────────────────── puzzle (D08)

test('piedras: giro horario, empiezan mirando a la pared y cada una tiene su respuesta', () => {
  assert.deepEqual(ROTATION, [8, 6, 2, 4]);
  assert.equal(nextDir(4), 8);
  assert.equal(START_DIR, 8);
  const byId = Object.fromEntries(STONES.map((s) => [s.id, s]));
  assert.equal(byId.piedra_alba.answer, 6, 'el primero mira al alba (este, tragaluz)');
  assert.equal(byId.piedra_agua.answer, 4, 'el segundo, al estanque quieto del oeste');
  assert.equal(byId.piedra_entrada.answer, 2, 'el tercero, a la puerta de la antesala (sur)');
  assert.ok(STONES.every((s) => s.answer !== START_DIR), 'ninguna empieza resuelta');
});

test('una piedra solo se enciende si apunta bien y el Core está a 3 casillas o menos; fallar no penaliza', () => {
  const s = newState();
  const st = STONES.find((x) => x.id === 'piedra_alba');
  const far = { x: st.x + CORE_RANGE + 1, y: st.y };
  assert.equal(coreNear(far, st), false);
  assert.equal(coreNear({ x: st.x, y: st.y + 2 }, st), true);
  // Core lejos: gira a la respuesta pero no se enciende
  let r = turnStone(s, st, { coreClose: false });
  assert.deepEqual([r.dir, r.correct, r.lit], [6, true, false]);
  applyTurn(s, st, r);
  assert.equal(isSolved(s, st), false);
  // sigue girando sin castigo y vuelve a la respuesta con el Core cerca
  for (let i = 0; i < 3; i++) applyTurn(s, st, turnStone(s, st, { coreClose: false }));
  assert.equal(stoneDir(s, st), 8);
  r = turnStone(s, st, { coreClose: true });
  applyTurn(s, st, r);
  assert.ok(r.lit && isSolved(s, st));
  assert.equal(turnStone(s, st, { coreClose: true }).already, true, 'resuelta: ya no gira');
});

test('guion de la piedra: resolver las tres desliza la losa (b02_dinteles) con 1, 3 y 2 giros', async () => {
  const s = newState(F.casildaJoined);
  s.setVar(ROOM_VAR, ROOM.galeria);
  for (const [id, presses] of [['piedra_alba', 1], ['piedra_agua', 3], ['piedra_entrada', 2]]) {
    const st = STONES.find((x) => x.id === id);
    const ctx = mockCtx(s, { core: { x: st.x, y: st.y + 2, visible: true } });
    ctx.selfSwitch = () => true;
    for (let i = 0; i < presses; i++) await stoneScript(ctx, st);
    assert.ok(isSolved(s, st), `${id} encendida`);
  }
  assert.ok(allSolved(s));
  assert.ok(s.flag(F.dinteles), 'la losa se ha deslizado');
});

// ─────────────────────────────────────────────────────────────── explanada: entrada con Casilda (C009)

test('explanada: Gael espera, Casilda cede cuando brilla el dintel y entrega C009', async () => {
  const s = newState(F.leftTown);
  const events = explanadaEvents();
  const ctx = mockCtx(s, { core: { x: 15, y: 13, visible: true } });
  await pageScript(events, 'casilda', s)(ctx);
  const text = ctx.said.map((l) => l.t).join('\n');
  assert.match(text, /Llegué antes\. No me ha dejado pasar\./);
  assert.match(text, /Aquí no entra nadie a hacer turismo\./);
  assert.match(text, /…Voy contigo\. Para que no te abras la cabeza\./);
  assert.match(text, /Esto brillaba en el patio\. Lo guardé en un tarro, no sé por qué/);
  assert.ok(s.hasCell('cell_zaguan_2'), 'C009');
  assert.ok(s.flag(F.casildaJoined) && s.flag(F.gaelWaits));
  assert.equal(s.var(ROOM_VAR, 0), ROOM.antesala);
});

// ─────────────────────────────────────────────────────────────── Geodude y la Guardiana

test('tirar del Geodude: hay que mantener A (con entrada real); sin entrada (Node) se da por hecho', async () => {
  let frames = 0;
  const held = { held: () => true };
  const ctx = mockCtx(newState(), { input: held });
  ctx.wait = async () => { frames += 1; };
  assert.equal(await holdToPull(ctx), true);
  assert.equal(frames, PULL_FRAMES - 1);
  const never = mockCtx(newState(), { input: { held: () => false } });
  assert.equal(await holdToPull(never, 10), false);
  assert.equal(await holdToPull(mockCtx(newState())), true);
});

test('Casilda: si pierdes vuelves a la antesala y te cura («Otra vez. Con cabeza.»); si ganas, 3 Pociones y Cuerda Huida', async () => {
  const s = newState(F.casildaJoined, F.rockBroken);
  s.setVar(ROOM_VAR, ROOM.guardiana);
  const lost = mockCtx(s, { battle: 'lose' });
  await guardianBattle(lost);
  assert.ok(lost.lastBattle.canLose && lost.lastBattle.trainer === 'b02_casilda');
  assert.ok(s.flag(F.casildaLost));
  assert.deepEqual(lost.warped.slice(0, 3), ['ruinas_dintel', ANTESALA.heal.x, ANTESALA.heal.y]);
  assert.deepEqual(casildaSpot(s), HEAL_SPOT);
  const heal = casildaEvents().find((e) => e.id === 'escena_cura_casilda');
  assert.ok(heal.when(s));
  const hc = mockCtx(s);
  await heal.script(hc);
  assert.ok(hc.healed && !s.flag(F.casildaLost));
  assert.ok(hc.said.some((l) => l.t === 'Otra vez. Con cabeza.'));
  const win = mockCtx(s, { battle: 'win' });
  await guardianBattle(win);
  assert.ok(s.flag(F.casildaBeaten));
  assert.equal(s.itemCount('POTION'), 3);
  assert.ok(s.hasKeyItem('ESCAPEROPE'));
  assert.ok(win.said.some((l) => /capaz de defenderlo/.test(l.t)));
  assert.equal(s.var(ROOM_VAR, 0), ROOM.nucleo);
});

// ─────────────────────────────────────────────────────────────── núcleo y salida

test('núcleo: Fragmento Azur 1, Arca, verso I, «Cien. Y cinco. …Soy yo.» y el atajo abierto', async () => {
  const s = newState(F.casildaJoined, F.casildaBeaten);
  s.setVar(ROOM_VAR, ROOM.nucleo);
  const ctx = mockCtx(s);
  await nucleoEvents().find((e) => e.id === 'columna_hueca').script(ctx);
  assert.ok(s.flag(F.restored), 'p1_restored');
  assert.ok((s.data.fragments || []).includes('F01'));
  assert.ok(s.hasKeyItem('ZYGARDECUBE'), 'Arca');
  assert.ok(s.flag('verse_1'));
  assert.ok(s.flag(F.nucleo) && s.flag(F.shortcut));
  const core = ctx.said.find((l) => l.who === 'Core' && l.t === 'Cien. Y cinco. …Soy yo.');
  assert.ok(core, 'el Core lee el verso a medias');
  assert.ok(ctx.said.some((l) => l.t === 'Serán números.'));
  assert.ok(ctx.said.some((l) => /Siempre la vi cerrada/.test(l.t)));
});

test('salida al atardecer: 10 % (run), Gael se va, el Consorcio, la Libreta y la pista T01', async () => {
  const s = newState(F.leftTown, F.casildaJoined, F.nucleo, F.shortcut, F.restored);
  s.addCore('N1');
  s.setZygardeForm('core');
  for (const k of ['cell_villa_alba_1', 'cell_ruta_1_1', 'cell_ruta_1_2', 'cell_ruta_1_3', 'cell_ruta_1_4', 'cell_zaguan_1', 'cell_zaguan_2', 'cell_umbral_1', 'cell_umbral_2', 'cell_umbral_3']) s.addCell(k);
  s.data.clock.minutes = 10 * 60;
  const events = explanadaEvents();
  const ctx = mockCtx(s, { core: { x: 15, y: 12, visible: true }, events: [] });
  await events.find((e) => e.id === 'escena_salida').script(ctx);
  assert.ok(s.hour >= 18 && s.hour < 20, `atardecer (${s.hour} h)`);
  assert.ok(s.zygardeAbility('run') && s.flag('zyg_10'), 'Correr y 10 %');
  assert.equal(s.data.zygarde.form, '10');
  assert.ok(s.flag(F.gaelLeft) && s.flag(F.exit) && s.flag(F.notebook));
  assert.ok(s.hasKeyItem('CLUENOTEBOOK'));
  assert.equal(clueStatus(s, 'T01'), 'active');
  const text = ctx.said.map((l) => l.t).join('\n');
  assert.match(text, /responde a un niño y no a cuarenta años de cuidados/);
  assert.match(text, /Aquí se mide con los ojos\. Fuera\./);
  assert.match(text, /Mi madre apuntaba aquí lo que decían las piedras\. Yo nunca le hice caso\./);
  assert.ok(text.includes(T01_TEXT));
  assert.equal(toDusk(s), 0, 'ya es de tarde: no vuelve a avanzar el reloj');
});

test('piedras legibles: el zócalo de cada una dice si es la primera, la segunda o la tercera (muescas)', () => {
  const byN = Object.fromEntries(STONES.map((s) => [s.n, stoneIntro(s).join(' ')]));
  assert.match(byN[1], /una sola muesca/);
  assert.match(byN[2], /dos muescas/);
  assert.match(byN[3], /tres muescas/);
});

test('salida con protagonista chica: «responde a una niña»', async () => {
  const s = GameState.create({ name: 'Prueba', gender: 'F' });
  for (const f of [F.leftTown, F.casildaJoined, F.nucleo, F.shortcut, F.restored]) s.setFlag(f);
  const ctx = mockCtx(s, { core: { x: 15, y: 12, visible: true } });
  await explanadaEvents().find((e) => e.id === 'escena_salida').script(ctx);
  const text = ctx.said.map((l) => l.t).join('\n');
  assert.match(text, /responde a una niña y no a cuarenta años de cuidados/);
});

test('salida llegando desde Zaguán (p. ej. tras la Cuerda Huida): el jugador pasa al pie del dintel', async () => {
  const s = newState(F.leftTown, F.casildaJoined, F.nucleo, F.shortcut, F.restored);
  const ctx = mockCtx(s, { core: { x: 28, y: 14, visible: true } });
  const player = { x: 29, y: 14, direction: 4, map: null, moveTo(x, y) { this.x = x; this.y = y; } };
  ctx.world.player = player;
  await explanadaEvents().find((e) => e.id === 'escena_salida').script(ctx);
  assert.deepEqual([player.x, player.y, player.direction], [EXPLANADA_DOOR.out.x, EXPLANADA_DOOR.out.y, EXPLANADA_DOOR.out.dir]);
  assert.ok(s.flag(F.exit));
});

test('salida con células de menos: el Core dice cuántas partes faltan y la historia sigue', async () => {
  const s = newState(F.leftTown, F.casildaJoined, F.nucleo, F.shortcut, F.restored);
  s.addCore('N1');
  s.setZygardeForm('core');
  for (const k of ['cell_villa_alba_1', 'cell_ruta_1_1', 'cell_zaguan_2']) s.addCell(k);
  const ctx = mockCtx(s, { core: { x: 15, y: 12, visible: true } });
  await explanadaEvents().find((e) => e.id === 'escena_salida').script(ctx);
  assert.equal(s.zygardeAbility('run'), false);
  assert.ok(ctx.said.some((l) => l.who === 'Core' && /Me faltan siete partes\./.test(l.t)));
  assert.ok(s.flag(F.exit) && s.hasKeyItem('CLUENOTEBOOK'));
});
