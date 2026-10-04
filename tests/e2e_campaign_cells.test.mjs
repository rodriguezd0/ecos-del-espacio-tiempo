import test from 'node:test';
import assert from 'node:assert/strict';
import { collectLandCells, collectWaterCells, collectDiveCells } from '../tools/e2e_campaign_cells.mjs';

function pilot({ cells = [], route = [6], climb = null, riding = false, collect = true } = {}) {
  const calls = [];
  const state = { cells: [...cells], riding, abilities: { run: true } };
  const d = {
    snap: async () => state,
    travel: async map => calls.push(['travel', map]),
    eval: async (_fn, arg) => typeof arg === 'string' ? { id: 'real_cell', x: 24, y: 32 }
      : arg?.tx !== undefined ? climb : route,
    mount: async () => { calls.push(['mount']); state.riding = true; },
    talk: async id => calls.push(['talk', id]),
    walkTo: async (x, y) => { calls.push(['walk', x, y]); if (collect) state.cells.push('cell_ruta_1_5'); },
    settle: async () => calls.push(['settle']),
    milestone: async (name, check) => { calls.push(['milestone', name]); const error = check(state); if (error) throw Error(error); },
  };
  return { d, calls };
}

test('campaign cells: already collected cells never travel or repeat a gift', async () => {
  const { d, calls } = pilot({ cells: ['cell_ruta_1_5', 'cell_zaguan_2'] });
  await collectLandCells(d, ['cell_ruta_1_5', 'cell_zaguan_2']);
  assert.deepEqual(calls, []);
});

test('campaign cells: collect by walking onto the actual event and verify the observed save', async () => {
  const { d, calls } = pilot();
  await collectLandCells(d, ['cell_ruta_1_5']);
  assert.deepEqual(calls, [['travel', 'ruta_1'], ['walk', 24, 32], ['settle'], ['milestone', 'celula_C006']]);
});

test('campaign cells: blocked ground uses the real mount and climb controls', async () => {
  const { d, calls } = pilot({ route: null, climb: ['pared_real'] });
  await collectLandCells(d, ['cell_ruta_1_5']);
  assert.deepEqual(calls.slice(0, 4), [['travel', 'ruta_1'], ['mount'], ['talk', 'pared_real'], ['walk', 24, 32]]);
});

test('campaign cells: missing collection is reported, with no fallback gift', async () => {
  const { d } = pilot({ collect: false, riding: true, route: null });
  await assert.rejects(collectLandCells(d, ['cell_ruta_1_5']), /C006.*sin recoger/);
  await assert.rejects(collectLandCells(d, ['missing']), /desconocida/);
  await assert.rejects(collectLandCells(d, ['cell_zaguan_2']), /guion/);
  d.eval = async () => null;
  await assert.rejects(collectLandCells(d, ['cell_ruta_1_5']), /No existe.*C006/);
});

test('campaign cells: browser observers read event coordinates without moving the player', async () => {
  const original = globalThis.window, player = { x: 1, y: 2 };
  const { d, calls } = pilot();
  globalThis.window = { __campaign: {
    map: () => ({ world: { player, events: [{ id: 'cell_event', x: 24, y: 32, def: { type: 'zygardeCell', cell: 'cell_ruta_1_5' } }] } }),
    route: () => null,
    fieldPlan: target => { assert.deepEqual(target, { tx: 24, ty: 32 }); return ['pared_real']; },
  } };
  d.eval = async (fn, arg) => fn(arg);
  try {
    await collectLandCells(d, ['cell_ruta_1_5']);
    assert.deepEqual(player, { x: 1, y: 2 });
    assert.ok(calls.some(c => c[0] === 'talk' && c[1] === 'pared_real'));
  } finally { globalThis.window = original; }
});

test('campaign cells: optional water cell uses shore confirmation, swimming and the way back', async () => {
  const original = globalThis.window, key = 'cell_ruta_4_3', calls = [];
  const state = { map: 'ruta_4', cells: [], x: 1, y: 1, surfing: false, top: 'MapScene' };
  globalThis.window = { __campaign: { map: () => ({ world: { events: [
    { id: key, x: 3, y: 1, def: { type: 'zygardeCell', cell: key } },
  ] } }) }, __b13: {
    shoreFor: () => ({ x: 1, y: 1, face: 6 }),
    routeMixed: tx => [tx > state.x ? 6 : 4],
  } };
  const d = {
    page: { evaluate: async () => {} }, snap: async () => state, snapState: async () => state,
    travel: async map => calls.push(['travel', map]), eval: async (fn, arg) => fn(arg),
    walkTo: async (x, y, opts) => { state.x = x; state.y = y; calls.push(['shore', opts.face]); },
    interact: async () => { calls.push(['swim_confirmation']); state.surfing = true; state.x = 2; },
    until: async check => { assert.ok(check({ ...state, playerBusy: false })); return state; },
    step: async dir => { calls.push(['step', dir]); state.x += dir === 6 ? 1 : -1; if (state.x === 3) state.cells.push(key); if (state.x === 1) state.surfing = false; },
    settle: async () => state,
    milestone: async (_name, check) => assert.equal(check(state), null),
  };
  try {
    await collectWaterCells(d, [key]);
    assert.deepEqual(calls, [['travel', 'ruta_4'], ['shore', 6], ['swim_confirmation'], ['step', 6], ['step', 4], ['step', 4]]);
    assert.equal(state.surfing, false);
    await collectWaterCells(d, [key]);
    assert.equal(calls.length, 6);
    await assert.rejects(collectWaterCells(d, ['missing']), /desconocida/);
    await assert.rejects(collectWaterCells(d, ['cell_zaguan_2']), /guion/);
    window.__campaign.map = () => ({ world: { events: [] } });
    await assert.rejects(collectWaterCells(d, ['cell_caudal_2']), /No existe/);
  } finally { globalThis.window = original; }
});

test('campaign cells: underwater optional enters by whirlpool, uses an air vent and emerges normally', async () => {
  const original = globalThis.window, key = 'cell_garganta_5', calls = [];
  const state = { map: 'garganta_albo', cells: [], x: 1, y: 1, surfing: false, top: 'MapScene', ready: true };
  const event = (id,type,x,def) => ({ id,x,y:1,def:{type,...def} });
  globalThis.window = { __campaign: { map: () => ({ world: { events: state.map === 'garganta_albo'
    ? [event('whirl','diveSpot',3,{to:'pozo_albo'})]
    : [event('air','diveVent',4),event(key,'zygardeCell',6,{cell:key}),event('surface','diveSpot',3,{surface:true,to:'garganta_albo'})] } }) },
    __b13: { shoreFor: () => ({x:1,y:1,face:6}), routeMixed: tx => [tx > state.x ? 6 : 4] } };
  const d = {
    page:{evaluate:async()=>{}},snap:async()=>state,snapState:async()=>state,
    travel:async map=>calls.push(['travel',map]),eval:async(fn,arg)=>fn(arg),
    walkTo:async(x,y)=>{calls.push(['walk',state.map,x,y]);state.x=x;state.y=y;if(state.map==='pozo_albo'&&x===6)state.cells.push(key);},
    interact:async()=>{
      if(!state.surfing&&state.map==='garganta_albo'){calls.push(['swim']);state.surfing=true;state.x=2;}
      else if(state.map==='garganta_albo'){calls.push(['dive']);state.map='pozo_albo';state.surfing=false;state.x=1;}
      else{calls.push(['surface']);state.map='garganta_albo';state.surfing=true;state.x=3;}
    },
    until:async check=>{assert.ok(check({...state,playerBusy:false}));return state;},
    step:async dir=>{state.x+=dir===6?1:-1;if(state.x===1)state.surfing=false;},settle:async()=>state,
    milestone:async(_name,check)=>assert.equal(check(state),null),
  };
  try {
    await collectDiveCells(d,[key]);
    assert.ok(calls.some(c=>c[0]==='dive'));
    assert.ok(calls.some(c=>c[0]==='walk'&&c[1]==='pozo_albo'&&c[2]===4));
    assert.ok(calls.some(c=>c[0]==='surface'));
    assert.equal(state.map,'garganta_albo');assert.equal(state.surfing,false);
    const n=calls.length;await collectDiveCells(d,[key]);assert.equal(calls.length,n);
    await assert.rejects(collectDiveCells(d,['cell_ruta_1_5']),/submarina/);
  } finally {globalThis.window=original;}
});
