import test from 'node:test';
import assert from 'node:assert/strict';
import { crossSentinelSlope } from '../tools/e2e_campaign_b11.mjs';

function fixture(kind) {
  let state = { top: kind, busy: true, x: kind === 'BattleScene' ? 33 : 48, y: kind === 'BattleScene' ? 13 : 10 };
  const actions = [];
  const d = {
    snapState: async () => ({ ...state }),
    settle: async () => {
      actions.push('settle');
      state = { ...state, top: 'MapScene', busy: false, ...(kind === 'BattleScene' ? {} : { x: 31, y: 13 }) };
      return state;
    },
    eval: async () => state.x < 46 ? 6 : 8,
    step: async dir => { actions.push(dir); state.x += dir === 6 ? 1 : 0; state.y -= dir === 8 ? 1 : 0; },
    wait: async () => {},
  };
  return { d, actions };
}

test('campaign B11: an actual alarm settles its safe return and recalculates without skipping the slope', async () => {
  const f = fixture('MessageScene'), end = await crossSentinelSlope(f.d);
  assert.deepEqual([end.x, end.y], [46, 7]);
  assert.equal(f.actions[0], 'settle');
  assert.equal(f.actions.filter(a => a === 6).length, 15, 'camina desde el punto seguro real');
});

test('campaign B11: a random battle during stealth finishes before continuing from its actual tile', async () => {
  const f = fixture('BattleScene'), end = await crossSentinelSlope(f.d);
  assert.deepEqual([end.x, end.y], [46, 7]);
  assert.equal(f.actions[0], 'settle');
  assert.equal(f.actions.filter(a => a === 6).length, 13, 'el encuentro no avanza ni devuelve el personaje por el piloto');
});

test('campaign B11: a temporarily blocked sentinel phase waits and replans without advancing the player', async () => {
  const f = fixture('MessageScene'), plan = f.d.eval;
  let first = true;
  f.d.eval = async () => { if (first) { first = false; return null; } return plan(); };
  f.d.wait = async () => { f.actions.push('wait'); };
  const end = await crossSentinelSlope(f.d);
  assert.deepEqual([end.x, end.y], [46, 7]);
  assert.deepEqual(f.actions.slice(0, 3), ['settle', 'wait', 6]);
});
