import test from 'node:test';
import assert from 'node:assert/strict';
import { installB13Observer } from '../tools/e2e_campaign_b13_page.mjs';
import { canSurfFreely, TERRAIN_NONE, TERRAIN_BY_ID } from '../game/src/world/terrain.js';
import { canOfferSwim } from '../game/src/world/waterAccess.js';
import * as campaignB13 from '../tools/e2e_campaign_b13.mjs';
import { POND } from '../game/src/content/maps/b10/mnemos_layout.js';

async function withIslet({ followers = [], bridge = false } = {}, check) {
  const original = globalThis.window;
  const map = {
    width: 3, height: 3, def: {}, valid: (x, y) => x >= 0 && y >= 0 && x < 3 && y < 3,
    terrainTagAt: (x, y) => x === 1 && y === 1 ? bridge ? TERRAIN_BY_ID.Bridge : TERRAIN_NONE : TERRAIN_BY_ID.StillWater,
    playerPassable: (x, y) => x === 1 && y === 1,
  };
  const player = { x: 1, y: 1, direction: 8, surfing: false,
    passable(x, y, dir) {
      const [dx, dy] = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[dir];
      return map.valid(x + dx, y + dy) && (this.surfing || map.playerPassable(x + dx, y + dy));
    },
  };
  const world = { map, player, followers, events: [], bridge: 0, env() { return { surfing: this.player.surfing, bridge: this.bridge }; } };
  globalThis.window = { __map: { world }, __campaign: { engine: {}, canSurfFreely, canOfferSwim, battles: [] } };
  try {
    await installB13Observer({ evaluate: async fn => fn() });
    await check({ world, player, observer: window.__b13 });
  } finally { globalThis.window = original; }
}

const follower = (x, y, visible = true) => ({ x, y, visible, busy: () => false });

test('campaign B13: an islet departure chooses water free of the visible follower that receives A', async () => {
  await withIslet({ followers: [follower(1, 2)] }, ({ player, observer }) => {
    const before = { ...player };
    assert.deepEqual(observer.shoreFor(1, 3), { x: 1, y: 1, face: 4, score: 3 });
    assert.deepEqual(player, before, 'planning does not move or turn the real player');
  });
});

test('campaign B13: invisible followers do not obstruct the ordinary departure', async () => {
  await withIslet({ followers: [follower(1, 2, false)] }, ({ observer }) => {
    assert.deepEqual(observer.shoreFor(1, 3), { x: 1, y: 1, face: 2, score: 1 });
  });
});

test('campaign B13: a bridge cannot be selected as an ordinary swimming shore', async () => {
  await withIslet({ bridge: true }, ({ observer }) => assert.equal(observer.shoreFor(1, 3), null));
});

test('campaign B13: no interaction-free departure is reported when companions cover every water side', async () => {
  await withIslet({ followers: [follower(1, 2), follower(0, 1), follower(2, 1), follower(1, 0)] }, ({ observer }) => {
    assert.equal(observer.shoreFor(1, 3), null);
  });
});

test('campaign B13: mixed routes require actual swimming and keep hypothetical positions separate', async () => {
  await withIslet({}, ({ player, observer }) => {
    assert.equal(observer.routeMixed(0, 0), null);
    player.surfing = true; // separate unit fixture; the QA browser is not involved
    const before = { ...player };
    const path = observer.routeMixed(0, 0);
    assert.equal(path.length, 2);
    assert.deepEqual(player, before);
  });
});

test('campaign B13: retry after the cell pickup leaves the Mnemos islet with the normal swim controls', async () => {
  const state = { map: 'aldea_mnemos', x: POND.islet.x, y: POND.islet.y, surfing: false }, calls = [];
  const d = {
    snap: async () => ({ ...state }),
    swimTo: async (x, y) => { calls.push(['swim', x, y]); state.x = x; state.y = y; state.surfing = false; },
    settle: async () => state,
    milestone: async (name, check) => { assert.equal(check(state), null); calls.push(['milestone', name]); },
  };
  await campaignB13.recoverMnemosIslet(d);
  assert.deepEqual(calls, [['swim', POND.islet.x, POND.y - 1], ['milestone', 'mnemos_regreso_islote']]);
});

test('campaign B13: islet recovery leaves every other real position alone', async () => {
  for (const state of [{ map: 'ruta_4', x: POND.islet.x, y: POND.islet.y }, { map: 'aldea_mnemos', x: 15, y: 24 }]) {
    await campaignB13.recoverMnemosIslet({ snap: async () => state, swimTo: async () => assert.fail('unexpected swim') });
  }
});
