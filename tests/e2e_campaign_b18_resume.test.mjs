import test from 'node:test';
import assert from 'node:assert/strict';
import {runB18} from '../tools/e2e_campaign_b18.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {ROOM_PLACES,VESTIBULO,CAIDA,RIO,CRUCE,NUCLEO} from '../game/src/content/maps/b18/cruce_layout.js';
import {F} from '../game/src/content/events/b18_common.js';
import {cruceResume,completeCruceRooms,recordCruceControls} from '../tools/e2e_campaign_b18_resume.mjs';
import {solveAxisRoom,stepResult,AXIS_VAR} from '../game/src/world/axis/logic.js';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';

async function stepsB18() {
 let steps;
 await runB18({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
  stages:async(block,value)=>{assert.equal(block,'B18');steps=value;}});
 return steps;
}

test('campaign B18: resume Río from the observed cell and axis without returning to the bridge or repeating solved rooms',async()=>{
 const state={map:'camara_cruce',x:RIO.ox+6,y:RIO.oy+1,flags:{[F.chamberIn]:true,[F.room1]:true}},before=structuredClone(state);
 const checkpoint=Error('isolated fixture reached the real remaining plan');
 const d={snapState:async()=>state,settle:async()=>state,axis:async()=> 'time',
  walkTo:async()=>assert.fail('The player is already inside the Río grid.'),
  playRoom:async(place,plan,from)=>{
   assert.equal(place,RIO);assert.deepEqual(from,{x:6,y:1,mode:'time'});
   assert.deepEqual(plan.actions.map(a=>a.dir),[4,4,4,4,8]);throw checkpoint;
  }};
 await assert.rejects(()=>(stepsB18().then(s=>s.cruce(d))),e=>e===checkpoint);
 assert.deepEqual(state,before);
});

const allFlags={[F.chamberIn]:true,[F.tutorial]:true,[F.room1]:true,[F.room2]:true,[F.room3]:true};
const inRoom=(place,point=place.entry,flags=allFlags)=>({map:'camara_cruce',x:point.x,y:point.y,flags:{...flags}});

test('campaign B18: reject unrelated maps, walls, missing previous doors and unknown axes',()=>{
 const rio=inRoom(RIO,{x:RIO.ox+6,y:RIO.oy+1});
 assert.throws(()=>cruceResume({...rio,flags:{}},'time'),/sin llegada/);
 assert.throws(()=>cruceResume(rio,'future'),/eje desconocido/);
 for(const invalid of [{map:'puente_convergencia'}, {x:0,y:0}, {map:'camara_cruce_nucleo',x:0,y:0}])
  assert.throws(()=>cruceResume({...rio,...invalid},'time'),/fuera de las salas/);
 assert.throws(()=>cruceResume({...rio,flags:{[F.chamberIn]:true}},'time'),/puerta previa/);
 const crystal=RIO.grid.crystals[0];
 assert.throws(()=>cruceResume(inRoom(RIO,{x:RIO.ox+crystal.x,y:RIO.oy+crystal.y}),'time'),/no transitable/);
 assert.throws(()=>cruceResume(inRoom(RIO,{x:RIO.room.x,y:RIO.room.y}),'time'),/fuera de la rejilla/);
 const debris=CRUCE.grid.debris[0];
 assert.throws(()=>cruceResume(inRoom(CRUCE,{x:CRUCE.ox+debris.x,y:CRUCE.oy+debris.y}),null),/no transitable/);
});

test('campaign B18: recognize real stairs, the open exit and the core only after all rooms',()=>{
 for(const [index,p] of ROOM_PLACES.entries())assert.deepEqual(cruceResume(inRoom(p,p.stairs.arrive),'time'),{index,from:null});
 assert.deepEqual(cruceResume(inRoom(RIO,RIO.gate.warp),'time'),{index:2,from:null,atGate:true});
 assert.deepEqual(cruceResume(inRoom(VESTIBULO,VESTIBULO.gate.warp),null),{index:0,from:null,atGate:true});
 const core={map:'camara_cruce_nucleo',...NUCLEO.arrival,flags:allFlags};
 assert.deepEqual(cruceResume(core,'space'),{index:4,from:null});
 assert.throws(()=>cruceResume({...core,flags:{...allFlags,[F.room3]:false}},'space'),/puerta previa/);
});

function fixture(start,axis='time') {
 let state=structuredClone(start),mode=axis;
 const played=[],walked=[],gates=[];
 const d={snapState:async()=>state,settle:async()=>state,axis:async()=>mode,
  walkTo:async(x,y)=>{walked.push([x,y]);state={...state,x,y};},
  playRoom:async(p,plan,from)=>{
   const index=ROOM_PLACES.indexOf(p);played.push({name:p.name,from});
   const expected=solveAxisRoom(p.grid,{from,mode});assert.deepEqual(plan,expected);
   mode=plan.end.mode;state={...state,x:p.ox+plan.end.x,y:p.oy+plan.end.y,
    flags:{...state.flags,...(index?{[[null,F.room1,F.room2,F.room3][index]]:true}:{[F.tutorial]:true})}};
   return plan.end;
  },expectSaid:async()=>{},milestone:async(name,check)=>assert.equal(check(state),null,name),
  pushUntil:async(dir,predicate)=>{
   gates.push(dir);const current=ROOM_PLACES.findIndex(p=>state.x>=p.room.x&&state.x<p.room.x+p.room.w&&state.y>=p.room.y&&state.y<p.room.y+p.room.h);
   const next=ROOM_PLACES[current+1];state=next?{...state,...next.stairs.arrive}:{...state,map:'camara_cruce_nucleo',...NUCLEO.stairs.arrive};
   assert.ok(predicate(state));
  }};
 return {d,played,walked,gates,state:()=>state};
}

test('campaign B18: solve every room from its real arrival and enter the separate core',async()=>{
 const f=fixture(inRoom(VESTIBULO,VESTIBULO.stairs.arrive,{[F.chamberIn]:true}),null);
 await completeCruceRooms(f.d);
 assert.deepEqual(f.played.map(p=>p.name),ROOM_PLACES.map(p=>p.name));
 assert.equal(f.walked.length,4);assert.equal(f.gates.length,4);
 assert.equal(f.state().map,'camara_cruce_nucleo');
});

test('campaign B18: resume at an open Río gate, skipping its solved puzzle and preceding rooms',async()=>{
 const f=fixture(inRoom(RIO,RIO.gate.warp));await completeCruceRooms(f.d);
 assert.deepEqual(f.played.map(p=>p.name),['cruce']);assert.equal(f.gates.length,2);
 const core=fixture({map:'camara_cruce_nucleo',...NUCLEO.arrival,flags:allFlags});
 await completeCruceRooms(core.d);assert.equal(core.played.length,0);assert.equal(core.walked.length,0);
});

test('campaign B18: reject a failed arrival or travel to another room',async()=>{
 const f=fixture(inRoom(CAIDA,CAIDA.stairs.arrive));f.d.walkTo=async()=>{};
 await assert.rejects(()=>completeCruceRooms(f.d),/no se llegó/);
 const wrong=fixture(inRoom(CAIDA,CAIDA.stairs.arrive));
 wrong.d.pushUntil=async()=>{await wrong.d.walkTo(CRUCE.entry.x,CRUCE.entry.y);};
 await assert.rejects(()=>completeCruceRooms(wrong.d),/sala observada distinta/);
});

test('campaign B18: the five remaining Río moves reach its exit in the real map and World',async()=>{
 const state=GameState.create({name:'ISOLATED-P9-RESUME'});
 for(const [flag,value] of Object.entries(allFlags))state.setFlag(flag,value);
 state.setVar(AXIS_VAR,'time');state.addItem('REDCHAIN');
 const {entry,warnings}=await buildMapNode('camara_cruce');assert.deepEqual(warnings,[]);
 const world=new World({state,hooks:{encountersEnabled:()=>false}});world.setCurrent(entry);
 world.player.moveTo(RIO.ox+6,RIO.oy+1);
 let from={x:6,y:1,mode:'time'};
 const plan=solveAxisRoom(RIO.grid,{from,mode:'time'});
 assert.deepEqual(plan.actions.map(a=>a.dir),[4,4,4,4,8]);
 for(const action of plan.actions) {
  const next=stepResult(RIO.grid,from.x,from.y,action.dir,from.mode);
  assert.ok(world.player.moveGeneric(action.dir));
  for(let n=0;n<60;n++)world.update(1/60);
  assert.deepEqual([world.player.x,world.player.y],[RIO.ox+next.x,RIO.oy+next.y]);
  assert.equal(world.player.busy(),false);from={x:next.x,y:next.y,mode:from.mode};
 }
 assert.deepEqual(from,{...RIO.grid.exits[0],mode:'time'});
});

test('campaign B18: record input and movement diagnostics without changing the observed world',async()=>{
 let called=false;await recordCruceControls({eval:async()=>{called=true;}},'no_path');assert.equal(called,false);
 const folder=fs.mkdtempSync(path.join(os.tmpdir(),'ecos-cruce-controls-'));
 const previous=Object.getOwnPropertyDescriptor(globalThis,'window');
 const state=GameState.create({name:'ISOLATED-READONLY'});state.setVar(AXIS_VAR,'time');
 const player={x:28,y:6,direction:4,lastDir:4,lastDirTime:1,time:2,moving:()=>false,busy:()=>false,passable:()=>true};
 const world={state,player,events:[],current:{def:{id:'camara_cruce'}},scriptBusy:()=>false,inputEnabled:()=>true,
  input:{keyDown:new Set(),state:{LEFT:{down:false,frames:0}}}};
 const before=JSON.stringify(state.data);
 Object.defineProperty(globalThis,'window',{configurable:true,value:{__campaign:{map:()=>({world})}}});
 try {
  await recordCruceControls({outDir:folder,eval:fn=>fn()},'fixture');
  const saved=JSON.parse(fs.readFileSync(path.join(folder,'campaign_b18_controls_fixture.json'),'utf8'));
  assert.deepEqual({x:saved.x,y:saved.y,axis:saved.axis,keys:saved.keys,buttons:saved.buttons},
   {x:28,y:6,axis:'time',keys:[],buttons:{LEFT:{down:false,frames:0}}});
  assert.equal(JSON.stringify(state.data),before);
 } finally {
  if(previous)Object.defineProperty(globalThis,'window',previous);else delete globalThis.window;
  fs.rmSync(folder,{recursive:true,force:true});
 }
});
