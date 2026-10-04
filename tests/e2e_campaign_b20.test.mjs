import test from 'node:test';
import assert from 'node:assert/strict';
import {runB20} from '../tools/e2e_campaign_b20.mjs';
import {tramoId} from '../game/src/content/maps/b20/layout.js';

async function stages() {
 let result;
 await runB20({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
  stages:async(block,s)=>{assert.equal(block,'B20');result=s;},travel:async()=>{}});
 return result;
}

for(const riding of [false,true])test(`campaign B20: climb gravel through normal mount controls (already riding=${riding})`,async()=>{
 let state={map:tramoId(1),x:12,y:12,riding},mounts=0;
 const stop=Error('actual gravel controls reached');
 const d={settle:async()=>state,snapState:async()=>state,walkTo:async(x,y)=>{state={...state,x,y};},
  interact:async()=>{},expectSaid:async()=>{},mount:async()=>{assert.deepEqual([state.x,state.y],[12,12]);mounts++;state={...state,riding:true};},
  pushUntil:async(dir)=>{assert.equal(dir,'up');assert.equal(state.riding,true,'gravel requires real mounting');throw stop;}};
 await assert.rejects(()=>(stages().then(s=>s.t1(d))),e=>e===stop);
 assert.equal(mounts,riding?0:1);
});
