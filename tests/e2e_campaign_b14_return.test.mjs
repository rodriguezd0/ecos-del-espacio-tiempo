import test from 'node:test';
import assert from 'node:assert/strict';
import * as route from '../tools/e2e_campaign_b14_return.mjs';
import {FONDO,ARRECIFE} from '../game/src/content/maps/b14/layout.js';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';

async function model(map='arrecife_eco') {
 const {entry}=await buildMapNode('arrecife_eco'),world=new World({state:GameState.create({name:'QA-return'})});
 world.setCurrent({...entry,events:null});
 const state={map,x:24,y:19,surfing:false,ready:true},calls=[];
 const d={snap:async()=>({...state}),travel:async to=>{calls.push(['travel',to]);state.map=to;},
  eval:async fn=>{const desc=Object.getOwnPropertyDescriptor(globalThis,'window');Object.defineProperty(globalThis,'window',{configurable:true,value:{__campaign:{map:()=>({world})}}});try{return fn();}finally{if(desc)Object.defineProperty(globalThis,'window',desc);else delete globalThis.window;}},
  walkTo:async(x,y)=>{calls.push(['walk',x,y]);state.x=x;state.y=y;},
  interact:async()=>{assert.equal(state.x,ARRECIFE.arrival.x);assert.equal(state.y,ARRECIFE.arrival.y);calls.push(['surface']);state.map='caleta_sonda';state.surfing=true;},
  until:async check=>assert.ok(check(state)),toLand:async()=>{calls.push(['land']);state.surfing=false;}};
 return {state,calls,d,world};
}

test('campaign B14: after all five cells the return follows the registered surface event, not the Fosa current',async()=>{
 const {state,calls,d,world}=await model();
 const spot=world.events.find(e=>e.def.type==='diveSpot'&&e.def.surface&&e.def.to==='caleta_sonda');
 assert.equal(spot.x,22);assert.equal(spot.y,31);assert.ok(spot.page);
 await route.returnFromFondo(d);
 assert.deepEqual(calls,[['walk',spot.x,spot.y],['surface'],['land']]);
 assert.equal(state.map,'caleta_sonda');assert.equal(state.surfing,false);
 const cells=Object.keys(FONDO.cells).map(k=>`cell_${k}`);
 assert.equal(route.fondoCollected({cells}),true);assert.equal(route.fondoCollected({cells:cells.slice(1)}),false);
});

test('campaign B14: return from the sea floor crosses the actual reef connection before surfacing',async()=>{
 const {calls,d}=await model('fondo_mar_sur');await route.returnFromFondo(d);
 assert.deepEqual(calls,[['travel','arrecife_eco'],['walk',22,31],['surface'],['land']]);
});

test('campaign B14: an observed return already on Caleta only lands if still swimming',async()=>{
 const {calls,d,state}=await model('caleta_sonda');state.surfing=true;await route.returnFromFondo(d);
 assert.deepEqual(calls,[['land']]);calls.length=0;await route.returnFromFondo(d);assert.deepEqual(calls,[]);
});

test('campaign B14: missing surface event or an unrelated map stops without inventing a return',async()=>{
 const {calls,d,state}=await model();d.eval=async()=>null;
 await assert.rejects(route.returnFromFondo(d),/salida de superficie/);assert.deepEqual(calls,[]);
 state.map='antea_4_presente';await assert.rejects(route.returnFromFondo(d),/Regreso del Fondo/);assert.deepEqual(calls,[]);
});
