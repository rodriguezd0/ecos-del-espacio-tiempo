import test from 'node:test';
import assert from 'node:assert/strict';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';
import {runB17} from '../tools/e2e_campaign_b17.mjs';
import sendaDef from '../game/src/content/maps/b17/senda_mirador.js';
import {EXTERIOR,p9ExteriorWarps} from '../game/src/content/maps/b18/vertical_layout.js';
import {F} from '../game/src/content/events/b17_common.js';
import {finishSendaExit,sendaExitError} from '../tools/e2e_campaign_b17_return.mjs';

const entry=p9ExteriorWarps()[0];
async function stepsB17() {
 let steps;
 await runB17({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
  stages:async(block,value)=>{assert.equal(block,'B17');steps=value;}});
 return steps;
}
const view=(map,x,y,flags={[F.vigil]:true,[F.sendaGap]:true})=>({map,x,y,flags});
const milestones=s=>async(name,check)=>{const error=check?.(s);if(error)throw Error(error);};

test('campaign B17: resume the observed P9 arrival without rebuilding the completed gap or moving again',async()=>{
 const state=view(entry.to,entry.tx,entry.ty),before=structuredClone(state),checks=[];
 const d={snapState:async()=>state,travel:async()=>assert.fail('Do not leave the already reached P9 landing.'),
  walkTo:async()=>assert.fail('The player already crossed the registered column door.'),
  interact:async()=>assert.fail('Do not repeat the completed reconstruction.'),
  milestone:async(name,check)=>{checks.push(name);await milestones(state)(name,check);}};
 await (await stepsB17()).senda(d);
 assert.deepEqual(checks,['salida','puente_b18']);assert.deepEqual(state,before);
});

test('campaign B17: the normal departure steps up through the actual registered column warp',async()=>{
 assert.deepEqual(sendaDef.warps.find(w=>w.to===entry.to),entry);
 const state=GameState.create({name:'ISOLATED-B17-DOOR'});
 state.setFlag(F.vigil);state.setFlag(F.sendaGap);
 const north=(await buildMapNode('senda_mirador')).entry,bridge=(await buildMapNode(entry.to)).entry;
 const requests=[],world=new World({state,hooks:{encountersEnabled:()=>false,warp:warp=>{
  requests.push(warp);world.setCurrent({...bridge,events:null});world.player.moveTo(warp.tx,warp.ty);world.player.direction=warp.dir;
 }}});
 world.setCurrent({...north,events:null});world.player.moveTo(EXTERIOR.arrive.x,EXTERIOR.arrive.y);
 const snapshot=()=>view(world.current.id,world.player.x,world.player.y,state.data.flags);
 const before=structuredClone(state.data),checks=[];let approachStop;
 const d={snapState:async()=>snapshot(),settle:async()=>snapshot(),travel:async()=>{},
  walkTo:async(x,y,opts)=>{assert.deepEqual([x,y],[EXTERIOR.arrive.x,EXTERIOR.arrive.y]);approachStop=opts.stopWhen;assert.equal(approachStop(snapshot()),false);},
  interact:async()=>assert.fail('The gap was already rebuilt in this declared fixture.'),
  pushUntil:async(direction,stop)=>{
   assert.equal(direction,'up');assert.equal(world.player.moveGeneric(8),true);
   for(let i=0;i<180;i++)world.update(1/60);
   assert.equal(stop(snapshot()),true);assert.equal(approachStop(snapshot()),true);
  },
  milestone:async(name,check)=>{checks.push(name);await milestones(snapshot())(name,check);}};
 await (await stepsB17()).senda(d);
 assert.deepEqual(requests,[entry]);assert.deepEqual(checks,['salida','puente_b18']);
 assert.deepEqual([world.current.id,world.player.x,world.player.y],[entry.to,entry.tx,entry.ty]);
 assert.deepEqual(state.data,before,'The test pilot never writes campaign progress.');
});

test('campaign B17: the exit proof rejects missing progress, other maps and noncanonical coordinates',()=>{
 const valid=view(entry.to,entry.tx,entry.ty);
 assert.equal(sendaExitError(valid),null);
 assert.equal(sendaExitError(view('senda_mirador',EXTERIOR.arrive.x,EXTERIOR.arrive.y)),null);
 for(const bad of [view(entry.to,entry.tx,entry.ty,{}),view(entry.to,entry.tx,entry.ty,{[F.vigil]:true}),
  view(entry.to,entry.tx,entry.ty,{[F.sendaGap]:true}),view('mirador_sur',20,1),view(entry.to,19,1),
  view(entry.to,20,2),view('senda_mirador',20,EXTERIOR.doorY)])assert.ok(sendaExitError(bad));
});

test('campaign B17: reentering the stage with incomplete progress rejects without moving or rebuilding',async()=>{
 for(const flags of [{},{[F.vigil]:true},{[F.sendaGap]:true}]) {
  const state=view(entry.to,entry.tx,entry.ty,flags),before=structuredClone(state);
  const d={snapState:async()=>state,milestone:milestones(state),
   walkTo:async()=>assert.fail('Incomplete arrival must not move.'),interact:async()=>assert.fail('Do not manufacture the missing gap.'),
   travel:async()=>assert.fail('Do not manufacture the missing route.')};
  await assert.rejects(()=>(stepsB17().then(s=>s.senda(d))),/sin Vigilia|sin tramo/);
  assert.deepEqual(state,before);
 }
});

test('campaign B17: foreign maps and the wrong bridge landing are rejected',async()=>{
 for(const state of [view('mirador_sur',20,1),view(entry.to,19,1)]) {
  await assert.rejects(()=>finishSendaExit({snapState:async()=>state,milestone:milestones(state)}),/otro mapa|enlace canónico/);
 }
});

test('campaign B17: an unfinished reconstruction still uses the existing control before entering the column',async()=>{
 const state=view('senda_mirador',17,29,{[F.vigil]:true}),calls=[];
 const d={snapState:async()=>state,walkTo:async(x,y)=>{calls.push(['walk',x,y]);state.x=x;state.y=y;},
  interact:async()=>{calls.push(['interact']);state.flags[F.sendaGap]=true;},
  until:async(check)=>assert.equal(check(state),true),settle:async()=>{},milestone:milestones(state),
  pushUntil:async(direction,check)=>{calls.push(['push',direction]);state.map=entry.to;state.x=entry.tx;state.y=entry.ty;assert.equal(check(state),true);}};
 await finishSendaExit(d);
 assert.deepEqual(calls,[['walk',17,29],['interact'],['walk',EXTERIOR.arrive.x,EXTERIOR.arrive.y],['push','up']]);
});

test('campaign B17: a movement that did not cross the door cannot complete the bridge checkpoint',async()=>{
 const state=view('senda_mirador',EXTERIOR.arrive.x,EXTERIOR.arrive.y);
 await assert.rejects(()=>finishSendaExit({snapState:async()=>state,walkTo:async()=>{},pushUntil:async()=>{},settle:async()=>{},milestone:milestones(state)}),/no se cruzó/);
});
