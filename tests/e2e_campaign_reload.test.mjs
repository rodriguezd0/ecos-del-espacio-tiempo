import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { GameState, SaveSystem, saveKey } from '../game/src/core/state.js';
import { isPostgame } from '../game/src/content/events/b22a_common.js';
import { postgame } from '../game/src/content/events/b22d_common.js';
import { reloadProofError, reloadCompletedCampaign } from '../tools/e2e_campaign_reload.mjs';

const saved = () => ({ playerName: 'QA', map: 'casa_prota_2f', x: 4, y: 5,
  flags: { game_cleared: true, b21_fin: true, b21_huevo_gael: true, b21_huevo_espera: false }, cells: Array(100).fill('cell'), cores: ['N1','N2','N3','N4','N5'],
  fragments: Array.from({ length: 10 }, (_, i) => `F${String(i + 1).padStart(2, '0')}`), pokemon: [{ species: 'ZYGARDE', level: 70 }], tablets: Array(18).fill('plate'),
  partyFull: [{ species: 'ZYGARDE', egg: false }, { species: 'LITTEN', egg: true, eggSteps: 1000 }],
  boxedPokemon: [{ species: 'TORTERRA', level: 70, egg: false }], vars: { gael_starter: 'LITTEN', p9_choice: 'DIALGA' },
  money: 1000, bag: { POTION: 2 }, keyItems: ['ZYGARDECUBE'],
  zygarde: { form: 'complete', jump: true, anchor: true }, abilities: { jump: true, anchor: true },
  saveData: { player: { name: 'QA', id: 12345 }, party: [{ species: 'ZYGARDE', uid: 'zygarde-real', exp: 343000 }],
    boxes: [[{ species: 'TORTERRA', uid: 'torterra-real', level: 70, exp: 343000, moves: [{ id: 'EARTHQUAKE', pp: 5 }], iv: { atk: 21 } }, null]],
    flags: { game_cleared: true, b21_fin: true }, selfSwitches: { 'mar_del_sur:marinero_ezequiel:A': true },
    clues: [{ id: 'T11', step: 3, status: 'solved' }], healPoint: { mapId: 'villa_alba', x: 4, y: 7 },
    flyPoints: ['villa_alba', 'caleta_sonda'], daycare: { slots: [null, null], egg: null }, dex: { caught: { ZYGARDE: true } },
    clock: { minutes: 480 }, playTimeFrames: 100 },
});

test('campaign reload: the rival egg, stored Pokémon and real axis choice survive loading', () => {
  const before = saved();
  for (const change of [s => { s.flags.b21_huevo_gael = false; }, s => { s.flags.b21_huevo_espera = true; },
    s => { s.partyFull[1].egg = false; }, s => { s.partyFull[1].species = 'SOBBLE'; },
    s => { s.boxedPokemon.push({ species: 'LITTEN', egg: true }); },
    s => { s.vars.gael_starter = 'SOBBLE'; }, s => { s.vars.p9_choice = 'PALKIA'; }]) {
    const after = structuredClone(before); change(after);
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject a changed epilogue or stored gift');
  }
});

test('campaign reload: nine unchanged fragments cannot certify the complete campaign', () => {
  const before = saved(); before.fragments.pop();
  assert.match(reloadProofError(before, structuredClone(before), 'QA') || '', /fragmentos/i);
});

test('campaign reload: final save preserves the collection, inventory, team and capabilities', () => {
  const before = saved();
  assert.equal(reloadProofError(before, structuredClone(before), 'QA'), null);
  for (const change of [s => { s.playerName = 'another'; }, s => { s.flags.b21_fin = false; },
    s => { s.x++; }, s => { s.cells.pop(); }, s => { s.cores.pop(); },
    s => { s.fragments.push('F02'); }, s => { s.pokemon[0].level--; }, s => { s.tablets.pop(); },
    s => { s.money--; }, s => { s.bag.POTION--; }, s => { s.keyItems.pop(); },
    s => { s.zygarde.form = '50'; }, s => { s.zygarde.jump = false; }, s => { s.zygarde.anchor = false; },
    s => { s.abilities.jump = false; }]) {
    const after = structuredClone(before); change(after);
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject a changed saved field');
  }
});

test('campaign reload: complete saved data preserves identity, Pokémon UIDs, PC slots and every persistent subsystem', () => {
  const before = saved();
  for (const change of [
    d => { d.player.id++; }, d => { d.party[0].uid = 'another-zygarde'; },
    d => { d.boxes[0][0].uid = 'another-torterra'; }, d => { d.boxes[0][0].exp++; },
    d => { d.boxes[0][0].moves[0].pp--; }, d => { d.boxes[0][0].iv.atk++; },
    d => { d.boxes[0].reverse(); }, d => { d.selfSwitches['mar_del_sur:marinero_ezequiel:A'] = false; },
    d => { d.clues[0].status = 'active'; }, d => { d.healPoint.x++; }, d => { d.flyPoints.pop(); },
    d => { d.daycare.egg = { species: 'TOGEPI' }; }, d => { d.dex.caught.ZYGARDE = false; },
  ]) {
    const after = structuredClone(before); change(after.saveData);
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject a changed persistent field absent from the UI summary');
  }
  const missing = saved(); delete missing.saveData;
  assert.ok(reloadProofError(before, missing, 'QA'), 'missing complete save evidence must fail');
});

test('campaign reload: elapsed clock and play time may change while every saved field stays identical', () => {
  const before = saved(), after = structuredClone(before);
  before.saveData.clock = { minutes: 480 }; before.saveData.playTimeFrames = 100;
  after.saveData.clock = { minutes: 485 }; after.saveData.playTimeFrames = 400;
  assert.equal(reloadProofError(before, after, 'QA'), null);
});

test('campaign reload: a reset, missing or invalid saved clock cannot hide inside allowed elapsed time', () => {
  const before = saved();
  for (const clock of [{ minutes: 540 }, { minutes: 479 }, { minutes: 1440 }, { minutes: '485' }, {}, null, undefined]) {
    const after = structuredClone(before); after.saveData.clock = clock;
    assert.ok(reloadProofError(before, after, 'QA'), 'must reject an invalid or discontinuous game clock');
  }
  const nearMidnight = saved(); nearMidnight.saveData.clock.minutes = 1438;
  const afterMidnight = structuredClone(nearMidnight); afterMidnight.saveData.clock.minutes = 2;
  assert.equal(reloadProofError(nearMidnight, afterMidnight, 'QA'), null);
});

async function finalReload({ corruptBox = false, postSaveAdvance = 0, loadedClock } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ecos-final-reload-'));
  const originalWindow = globalThis.window;
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const stored = new Map([['ecos.lastSlot', '1']]);
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true,
    value: { getItem: key => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, String(value)) } });
  const snapshot = saved(), state = GameState.create({ name: 'QA' }), events = [];
  Object.assign(state.data, structuredClone(snapshot.saveData));
  globalThis.window = { __campaign: { engine: { state } } };
  let screen = 'MapScene', titleStage = null;
  const d = {
    outDir: dir,
    page: { reload: async () => {
      events.push('reload'); screen = 'TitleScene'; titleStage = 'opening';
    }, evaluate: async () => {}, waitForFunction: async () => {} },
    snap: async () => ({ ...structuredClone(snapshot), top: screen, titleStage, ready: screen === 'MapScene' }),
    log: async () => [{ text: 'Final observado' }], save: async label => {
      events.push(`save ${label}`); SaveSystem.save(1, state);
      state.data.clock.minutes = (state.data.clock.minutes + postSaveAdvance) % 1440;
      state.data.playTimeFrames += postSaveAdvance * 60;
    },
    wait: async () => {}, settle: async () => {},
    press: async key => {
      assert.equal(key, 'KeyZ'); events.push(screen);
      if (screen === 'TitleScene' && titleStage === 'opening') titleStage = 'menu';
      else if (screen === 'TitleScene') screen = 'SaveLoadScene';
      else if (screen === 'SaveLoadScene') screen = 'ChoiceScene';
      else {
        screen = 'MapScene'; state.data = JSON.parse(stored.get(saveKey(1)));
        if (corruptBox) state.data.boxes[0][0].uid = 'different-after-load';
        if (loadedClock !== undefined) state.data.clock.minutes = loadedClock;
      }
    },
    until: async check => assert.ok(check(await d.snap())),
    eval: async (fn, arg) => String(fn).includes('b22a_common.js') ? isPostgame(state) && postgame(state) : fn(arg),
    milestone: async (name, check) => { const error = check(await d.snap()); if (error) throw Error(error); events.push(name); },
  };
  try {
    await reloadCompletedCampaign(d, 'QA');
    assert.deepEqual(events.slice(0, 6), ['save B21', 'reload', 'TitleScene', 'TitleScene', 'SaveLoadScene', 'ChoiceScene']);
    assert.ok(events.includes('postgame_recargado'));
    const before = JSON.parse(fs.readFileSync(path.join(dir, 'campaign_final_before_reload.json'), 'utf8'));
    const after = JSON.parse(fs.readFileSync(path.join(dir, 'campaign_final_after_reload.json'), 'utf8'));
    assert.equal(before.saveData.player.id, state.player.id);
    assert.equal(before.saveData.clock.minutes, JSON.parse(stored.get(saveKey(1))).clock.minutes, 'baseline must use the exact UI save payload');
    assert.equal(after.saveData.boxes[0][0].uid, 'torterra-real');
  } finally {
    if (d.liveTicker) clearInterval(d.liveTicker);
    if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
    if (originalStorage === undefined) delete globalThis.localStorage; else Object.defineProperty(globalThis, 'localStorage', originalStorage);
    assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(dir, { recursive: true });
  }
}

test('campaign reload: final UI loading reads complete GameState data before and after and enables real postgame gates', async () => {
  await finalReload();
});

test('campaign reload: final UI loading rejects a changed boxed UID even when the screen summary stays identical', async () => {
  await assert.rejects(finalReload({ corruptBox: true }), /datos completos.*distintos/);
});

test('campaign reload: closing the Save menus may advance the live clock after the persisted payload was written', async () => {
  await finalReload({ postSaveAdvance: 2 });
});

test('campaign reload: a clock earlier than the actual saved payload still fails after live time advances', async () => {
  await assert.rejects(finalReload({ postSaveAdvance: 2, loadedClock: 479 }), /hora guardada retrocedió/);
});
