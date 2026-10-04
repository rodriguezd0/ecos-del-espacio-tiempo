import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState, SaveSystem } from '../game/src/core/state.js';
import { entryState, fieldWorld, fieldCtx, liveEvent } from './b18_helpers.mjs';
import { F } from '../game/src/content/events/b21_common.js';
import { EPILOGUE_TEXT } from '../game/src/content/events/b21_texts.js';
import { EPI, tvScene } from '../game/src/content/events/b21_epilogo.js';
import { isPostgame } from '../game/src/content/events/b22a_common.js';

function savedEpilogue(mapId, {tv = true, credits = false, end = false} = {}) {
  const state = entryState();
  for (const flag of [F.gameCleared, F.finalResolved, F.epilogueBack, F.momInside, F.gaelNoteRead,
    F.alerceKeyGiven, F.gaelEggGiven]) state.setFlag(flag);
  state.setFlag(F.tvNews, tv);
  state.setFlag(F.creditsDone, credits);
  state.setFlag(F.epilogueEnd, end);
  state.addKeyItem('ALERCEKEY');
  state.addPokemon({uid: 'gael-egg', species: 'LITTEN', egg: true, eggSteps: 1000});
  state.setPosition(mapId, 7, 6, 8);
  return state;
}

async function context(state, mapId) {
  let t = await fieldWorld(mapId, {state});
  t.p.moveTo(state.player.x, state.player.y);
  t.p.direction = state.player.dir;
  const ctx = fieldCtx(t);
  Object.defineProperties(ctx, {map: {get: () => t.map}, world: {get: () => t.w}, player: {get: () => t.p}});
  ctx.scene = {state, refreshFollower() {}};
  ctx.warp = async (id, x, y, dir = 2) => {
    ctx.log.warps.push({mapId: id, x, y, dir});
    t = await fieldWorld(id, {state});
    t.p.moveTo(x, y);
    t.p.direction = dir;
    state.setPosition(id, x, y, dir);
  };
  return ctx;
}

async function reload(state) {
  const originalStorage = globalThis.localStorage;
  const originalListener = SaveSystem.listener;
  const data = new Map();
  globalThis.localStorage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, String(value))};
  SaveSystem.listener = null;
  try { SaveSystem.save(1, state); return SaveSystem.load(1); }
  finally { SaveSystem.listener = originalListener; if (originalStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = originalStorage; }
}

for (const [mapId, id] of [['casa_prota_1f', 'b21_tele'], ['casa_prota_2f', 'b21_despertar']]) {
  test(`epílogo antiguo interrumpido tras la televisión se recupera al cargar ${mapId}`, async () => {
    const state = await reload(savedEpilogue(mapId));
    const before = JSON.parse(JSON.stringify(state.party));
    const ctx = await context(state, mapId);
    const event = liveEvent(ctx.world, id);
    assert.ok(event, 'el guardado antiguo debe tener un evento de recuperación');
    await event.script(ctx);
    assert.ok(state.flag(F.creditsDone) && state.flag(F.epilogueEnd));
    assert.equal(state.player.mapId, 'casa_prota_2f');
    assert.deepEqual([state.player.x, state.player.y, state.player.dir], [EPI.bed.x, EPI.bed.y, EPI.bed.dir]);
    assert.equal(state.zygardeForm, 'complete');
    assert.equal(isPostgame(state), true);
    assert.equal(state.itemCount('ALERCEKEY'), 1);
    assert.deepEqual(state.party, before, 'no repite la entrega del huevo');
    assert.ok(ctx.log.warps.some(w => w.mapId === 'carguero'), 'termina la escena pendiente');
    assert.ok(ctx.log.warps.some(w => w.mapId === 'villa_zaguan'), 'recorre los créditos');
    assert.ok(!ctx.said.some(s => EPILOGUE_TEXT.tv.includes(s.text)), 'la noticia ya vista no se repite');
    const done = await context(await reload(state), 'casa_prota_2f');
    assert.equal(liveEvent(done.world, id), null, 'el final ya concluido no se repite al cargar');
  });
}

test('créditos concluidos en la planta baja pasan al despertar sin repetir el carguero ni los créditos', async () => {
  const state = await reload(savedEpilogue('casa_prota_1f', {credits: true}));
  const ctx = await context(state, 'casa_prota_1f');
  const event = liveEvent(ctx.world, 'b21_tele');
  assert.ok(event);
  await event.script(ctx);
  assert.ok(state.flag(F.epilogueEnd));
  assert.deepEqual(ctx.log.warps.map(w => w.mapId), ['casa_prota_2f']);
});

test('el epílogo normal mantiene televisión, carguero, créditos y despertar en orden', async () => {
  const state = savedEpilogue('casa_prota_1f', {tv: false});
  const ctx = await context(state, 'casa_prota_1f');
  await tvScene(ctx);
  assert.ok(ctx.said.some(s => EPILOGUE_TEXT.tv.includes(s.text)));
  assert.ok(state.flag(F.tvNews) && state.flag(F.creditsDone) && state.flag(F.epilogueEnd));
  assert.equal(ctx.log.warps[0].mapId, 'carguero');
  assert.equal(ctx.log.warps.at(-1).mapId, 'casa_prota_2f');
  assert.equal(state.itemCount('ALERCEKEY'), 1);
  assert.equal(state.party.length, 1);
});

test('el cuarto conserva la recuperación de un despertar pendiente y no adelanta el final antes de la TV', async () => {
  const beforeTV = await context(savedEpilogue('casa_prota_2f', {tv: false}), 'casa_prota_2f');
  assert.equal(liveEvent(beforeTV.world, 'b21_despertar'), null);
  const state = new GameState(savedEpilogue('casa_prota_2f', {credits: true}).data);
  const ctx = await context(state, 'casa_prota_2f');
  await liveEvent(ctx.world, 'b21_despertar').script(ctx);
  assert.ok(state.flag(F.epilogueEnd));
  assert.deepEqual(ctx.log.warps, []);
});
