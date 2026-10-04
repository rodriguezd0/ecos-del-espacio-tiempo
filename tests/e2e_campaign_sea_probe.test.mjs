import test from 'node:test';
import assert from 'node:assert/strict';
import * as probe from '../tools/e2e_campaign_sea_probe.mjs';

test('campaign C065: a blocked NPC is cleared only by an actual diving and surfacing trip',async()=>{
 const state={map:'mar_del_sur',cells:[],ready:true,x:135,y:15,surfing:false},calls=[];
 const d={snap:async()=>state,eval:async()=>true,
  swimTo:async(x,y)=>{calls.push(['swim',x,y]);state.x=x;state.y=y;state.surfing=true;},
  interact:async()=>{calls.push(['action',state.map]);state.map=state.map==='mar_del_sur'?'fondo_mar_sur':'mar_del_sur';},
  until:async check=>assert.ok(check(state)),settle:async()=>state,
  milestone:async(name,check)=>{assert.equal(check(state),null);calls.push(['milestone',name]);}};
 await probe.recoverC065ByDive(d);
 assert.deepEqual(calls,[['swim',138,36],['action','mar_del_sur'],['action','fondo_mar_sur'],['milestone','c065_regreso_natural']]);
 assert.deepEqual(state.cells,[],'the map trip cannot grant the cell');
});

test('campaign C065: a collected cell or unoccupied destination needs no map trip',async()=>{
 for(const cells of [[],['cell_mar_sur_5']]) {
  const d={snap:async()=>({map:'mar_del_sur',cells}),eval:async()=>false,swimTo:async()=>assert.fail('unnecessary trip')};
  await probe.recoverC065ByDive(d);
 }
});
