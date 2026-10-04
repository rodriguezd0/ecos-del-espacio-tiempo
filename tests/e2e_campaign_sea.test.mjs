import test from 'node:test';
import assert from 'node:assert/strict';
import { collectEasternSea, returnToCaleta } from '../tools/e2e_campaign_sea.mjs';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';

function sea(map) {
  const state = { map, cells: [], ready: true, surfing:false }, trace = [];
  const targets = new Map([[`${CL.CELLS.c064.x},${CL.CELLS.c064.y}`, 'cell_caleta_1'],
    ...['c065','c066'].map(id => [`${MAR.CELLS[id].x},${MAR.CELLS[id].y}`, MAR.CELLS[id].key])]);
  return { state, trace, d: {
    snap: async () => state,
    startSwim: async (x,y) => { trace.push(['confirmar Nadar',state.map,x,y]);state.surfing=true; },
    swimTo: async (x,y) => {
      trace.push(['caminar/nadar',state.map,x,y]); const key=targets.get(`${x},${y}`); if(key&&!state.cells.includes(key))state.cells.push(key);
      state.surfing=!(state.map==='caleta_sonda'&&x===CL.DIVERS.resonance.x&&y===CL.DIVERS.resonance.y||key?.startsWith('cell_mar_sur_'));
    },
    crossEdge: async (dir,to) => { trace.push(['borde',dir,to]);state.map=to; },
    until: async check => assert.ok(check(state)),
    milestone: async (name,check) => { trace.push(['hito',name]);assert.equal(check(state),null); },
  }};
}

test('campaign sea: Caleta reaches the east via swimming and collects all three physical cells',async()=>{
  const {d,state,trace}=sea('caleta_sonda'); await collectEasternSea(d);
  assert.equal(state.map,'mar_del_sur');
  assert.deepEqual(state.cells,['cell_caleta_1','cell_mar_sur_5','cell_mar_sur_6']);
  assert.ok(trace.some(t=>t[0]==='borde'&&t[1]===2&&t[2]==='mar_del_sur'));
  assert.deepEqual(trace.filter(t=>t[0]==='caminar/nadar').at(-1),['caminar/nadar','mar_del_sur',MAR.CELLS.c066.x,MAR.CELLS.c066.y]);
});

test('campaign sea: continuing in the sea or at the volcano needs no artificial Caleta reload',async()=>{
  const seaRun=sea('mar_del_sur'); await collectEasternSea(seaRun.d);
  assert.equal(seaRun.trace.some(t=>t[0]==='borde'),false);
  assert.deepEqual(seaRun.state.cells,['cell_mar_sur_5','cell_mar_sur_6']);
  const volcano=sea('volcan_tizon');await collectEasternSea(volcano.d);assert.deepEqual(volcano.trace,[]);
});

test('campaign sea: already swimming does not request Nadar again before reaching an island',async()=>{
  const {d,state,trace}=sea('mar_del_sur');state.surfing=true;await collectEasternSea(d);
  assert.equal(trace[0][0],'caminar/nadar');
  assert.equal(trace.filter(t=>t[0]==='confirmar Nadar').length,1);
});

test('campaign sea: Tizón returns through the west sea and north coast, ending on the actual dock',async()=>{
  const {d,state,trace}=sea('volcan_tizon');await returnToCaleta(d);
  assert.deepEqual(trace.filter(t=>t[0]==='borde'),[['borde',4,'mar_del_sur'],['borde',8,'caleta_sonda']]);
  assert.equal(state.map,'caleta_sonda');assert.equal(state.surfing,false);
});

test('campaign sea: a return resumed on the sea or on Caleta land preserves the current real location',async()=>{
  const mar=sea('mar_del_sur');await returnToCaleta(mar.d);
  assert.deepEqual(mar.trace.filter(t=>t[0]==='borde'),[['borde',8,'caleta_sonda']]);
  const coast=sea('caleta_sonda');await returnToCaleta(coast.d);assert.deepEqual(coast.trace,[]);
});
