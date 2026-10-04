import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as checkpoint from '../tools/e2e_campaign_checkpoint_reload.mjs';
import {GameState,SaveSystem,saveKey} from '../game/src/core/state.js';
const {checkpointReloadError,reloadCheckpoint}=checkpoint;

const saved=()=>({playerName:'QA',map:'caleta_sonda',x:12,y:24,money:8000,
 pokemon:[{species:'TORTERRA',level:48,hp:80}],partyFull:[{species:'TORTERRA',egg:false}],
 boxedPokemon:[{species:'TOGEPI',level:1,egg:false}],cells:['C001'],cores:['N1'],fragments:['F01'],tablets:['MEADOWPLATE'],
 bag:{POTION:4},keyItems:['ZYGARDECUBE'],abilities:{swim:true,dive:true},zygarde:{form:'50'},flags:{p6_restored:true},vars:{gael_starter:'LITTEN'}});

test('campaign checkpoint reload: an unfinished campaign can continue with the identical save',()=>{
 const before=saved();assert.equal(checkpointReloadError(before,structuredClone(before),'QA'),null);
});

test('campaign checkpoint reload: identity, position, party, PC and every progress or inventory field must survive',()=>{
 const before=saved();
 for(const change of [s=>s.playerName='other',s=>s.map='casa_prota_2f',s=>s.x++,s=>s.y++,
  s=>s.pokemon[0].hp--,s=>s.partyFull[0].egg=true,s=>s.boxedPokemon.pop(),s=>s.cells.pop(),s=>s.cores.pop(),
  s=>s.fragments.pop(),s=>s.tablets.pop(),s=>s.money--,s=>s.bag.POTION--,s=>s.keyItems.pop(),
  s=>s.abilities.dive=false,s=>s.zygarde.form='10',s=>s.flags.p6_restored=false,s=>s.vars.gael_starter='SOBBLE']) {
  const after=structuredClone(before);change(after);assert.ok(checkpointReloadError(before,after,'QA'));
 }
});

const fullSave=()=>{
 const data=GameState.create({name:'QA',playerId:123}).data;
 data.party=[{uid:'p1',species:'TORTERRA',level:48,exp:75000,moves:[{id:'EARTHQUAKE',pp:10}],ivs:{atk:12}}];
 data.boxes[2][7]={uid:'p2',species:'TOGEPI',level:1,exp:7,moves:[{id:'GROWL',pp:40}],ivs:{atk:15}};
 data.lastHeal={mapId:'caleta_centro',x:9,y:7,dir:2};data.clues=[{id:'T13',status:'active'}];data.flyPoints=['ciudad_nexo'];
 data.selfSwitches={'mar_del_sur:marinero_ezequiel:A':true};return data;
};

test('campaign checkpoint reload: complete persistence includes identity, UIDs, every PC detail, slots, clues and travel',()=>{
 const before=fullSave();
 for(const change of [s=>s.player.id++,s=>s.party[0].uid='p-other',s=>s.boxes[2][7].uid='box-other',
  s=>s.boxes[2][7].exp++,s=>s.boxes[2][7].moves[0].pp--,s=>s.boxes[2][7].ivs.atk++,
  s=>{s.boxes[3][5]=s.boxes[2][7];s.boxes[2][7]=null;},s=>s.clues.pop(),s=>s.flyPoints.pop(),s=>s.lastHeal.x++,
  s=>s.selfSwitches={},s=>s.options.followerEnabled=false]) {
  const after=structuredClone(before);change(after);
  assert.notDeepEqual(checkpoint.persistentSaveData(before),checkpoint.persistentSaveData(after));
 }
});

test('campaign checkpoint reload: the readonly projection excludes only clock and elapsed frames, retaining array order',()=>{
 const before=fullSave(),original=structuredClone(before),after=structuredClone(before);
 after.clock.minutes++;after.playTimeFrames+=100;
 assert.deepEqual(checkpoint.persistentSaveData(before),checkpoint.persistentSaveData(after));
 assert.deepEqual(before,original,'projection cannot change the live source');
 const reordered=Object.fromEntries(Object.entries(before).reverse());
 assert.deepEqual(checkpoint.persistentSaveData(before),checkpoint.persistentSaveData(reordered));
 after.party.push({uid:'p3'});after.party.reverse();
 assert.notDeepEqual(checkpoint.persistentSaveData(before),checkpoint.persistentSaveData(after));
});

test('campaign checkpoint reload: saved hour permits small elapsed time and midnight, but cannot reset or jump',()=>{
 for(const [before,after] of [[500,500],[500,503],[1435,5],[0,15]]) {
  assert.equal(checkpoint.clockReloadError({clock:{minutes:before}},{clock:{minutes:after}}),null);
 }
 for(const [before,after] of [[1380,540],[500,499],[0,16],[500,null],[500,1440],[500,1.5],[500,'500']]) {
  assert.ok(checkpoint.clockReloadError({clock:{minutes:before}},{clock:{minutes:after}}));
 }
 assert.ok(checkpoint.clockReloadError({}, {clock:{minutes:500}}));
 assert.ok(checkpoint.clockReloadError({clock:{minutes:500}},{}));
});

async function withActualSavedSlot(check) {
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),records=new Map();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,String(value))}});
 const state=new GameState(fullSave()),d={eval:async(fn,arg)=>fn(arg)};
 state.data.clock.minutes=500;
 Object.defineProperty(globalThis,'window',{configurable:true,writable:true,value:{__campaign:{engine:{state}}}});
 try {
  SaveSystem.save(1,state);localStorage.setItem('ecos.lastSlot','1');
  await check({state,d,records});
 } finally {
  if(oldWindow===undefined)delete globalThis.window;else Object.defineProperty(globalThis,'window',oldWindow);
  if(oldStorage===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',oldStorage);
 }
}

test('campaign checkpoint reload: the actual saved payload is the clock baseline after the UI resumes live time',async()=>{
 await withActualSavedSlot(async({state,d,records})=>{
  const stored=JSON.parse(records.get(saveKey(1)));state.advanceMinutes(2);state.data.playTimeFrames+=110;
  const liveBefore=structuredClone(state.data),rawBefore=records.get(saveKey(1));
  const payload=await checkpoint.readSavedSlotData(d);
  assert.equal(payload.clock.minutes,stored.clock.minutes);
  assert.equal(checkpoint.clockReloadError(payload,stored),null);
  assert.deepEqual(state.data,liveBefore,'reading the slot never rewinds the live clock or changes GameState');
  assert.equal(records.get(saveKey(1)),rawBefore,'the saved payload is read without another save');
 });
});

test('campaign checkpoint reload: stale identity, Pokémon UIDs and other payload fields fail before loading',async()=>{
 for(const change of [d=>d.player.name='another',d=>d.player.id++,d=>d.party[0].uid='other',
  d=>d.boxes[2][7].exp++,d=>d.clues=[],d=>d.lastHeal.x++,d=>d.savedAt--]) {
  await withActualSavedSlot(async({d,records})=>{
   const payload=JSON.parse(records.get(saveKey(1)));change(payload);records.set(saveKey(1),JSON.stringify(payload));
   await assert.rejects(checkpoint.readSavedSlotData(d),/identidad|payload/i);
  });
 }
});

test('campaign checkpoint reload: an absent, invalid or unreadable saved slot is rejected',async()=>{
 for(const slot of [null,'0','99','1.5','not-a-slot'])await withActualSavedSlot(async({d,records})=>{
  if(slot===null)records.delete('ecos.lastSlot');else records.set('ecos.lastSlot',slot);
  await assert.rejects(checkpoint.readSavedSlotData(d),/ranura/i);
 });
 for(const raw of [null,'broken JSON',JSON.stringify({savedAt:0}),JSON.stringify({savedAt:'123'})])await withActualSavedSlot(async({d,records})=>{
  if(raw===null)records.delete(saveKey(1));else records.set(saveKey(1),raw);
  await assert.rejects(checkpoint.readSavedSlotData(d));
 });
});

test('campaign checkpoint reload: actual payload clock resets or large live jumps cannot pass as a save delay',async()=>{
 for(const minutes of [499,520])await withActualSavedSlot(async({state,d,records})=>{
  state.data.clock.minutes=minutes;
  await assert.rejects(checkpoint.readSavedSlotData(d),/hora guardada/);
 });
});

test('campaign checkpoint reload: the same slot loads through title and confirmation after saving',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ecos-checkpoint-')),events=[];
 const oldWindow=Object.getOwnPropertyDescriptor(globalThis,'window'),oldStorage=Object.getOwnPropertyDescriptor(globalThis,'localStorage'),records=new Map();
 Object.defineProperty(globalThis,'localStorage',{configurable:true,writable:true,value:{getItem:key=>records.get(key)??null,setItem:(key,value)=>records.set(key,String(value))}});
 const state=saved(),data=fullSave();state.ready=true;state.battles=[{tag:'a',outcome:'win'}];let screen='MapScene',titleStage=null;
 const engineState=new GameState(data);Object.defineProperty(globalThis,'window',{configurable:true,writable:true,value:{__campaign:{engine:{state:engineState}}}});
 const page={reload:async()=>{events.push('reload');screen='TitleScene';titleStage='opening';engineState.data=JSON.parse(records.get(saveKey(1)));},
  waitForFunction:async()=>{},evaluate:async()=>{},keyboard:{up:async()=>events.push('release run')}};
 const d={outDir:dir,page,snap:async()=>({...structuredClone(state),top:screen,titleStage}),log:async()=>[{text:'old evidence'}],
  save:async label=>{events.push(`save ${label}`);SaveSystem.save(1,engineState);localStorage.setItem('ecos.lastSlot','1');engineState.advanceMinutes(2);engineState.data.playTimeFrames+=110;},wait:async()=>{},
  press:async key=>{
   assert.equal(key,'KeyZ');events.push(screen);
   if(screen==='TitleScene'&&titleStage==='opening')titleStage='menu';
   else if(screen==='TitleScene')screen='SaveLoadScene';
   else if(screen==='SaveLoadScene')screen='ChoiceScene';
   else screen='MapScene';
  },until:async fn=>assert.ok(fn(await d.snap())),settle:async()=>{},
  eval:async(fn,arg)=>{if(arg&&typeof arg==='object'){assert.deepEqual(arg.battles,state.battles);events.push('evidence');return;}return fn(arg);},
  milestone:async(name,check)=>{assert.equal(check(await d.snap()),null);events.push(name);},
  configureOptions:async()=>events.push('options')};
 // The refresh updates only the driver/observer; preserve the small UI model for this isolated test.
 const ownMethods=['snap','until','settle','eval','milestone','configureOptions'];
 for(const key of ownMethods)Object.defineProperty(d,key,{value:d[key],writable:true,configurable:true});
 try {
  await reloadCheckpoint(d,'QA','B13');
  assert.deepEqual(events.slice(0,6),['save B13','reload','TitleScene','TitleScene','SaveLoadScene','ChoiceScene']);
  assert.ok(events.includes('b13_recargado'));
  const payload=JSON.parse(fs.readFileSync(path.join(dir,'campaign_b13_before_reload_slot.json')));
  const liveBefore=JSON.parse(fs.readFileSync(path.join(dir,'campaign_b13_before_reload_save.json')));
  assert.equal(liveBefore.clock.minutes-payload.clock.minutes,2,'the UI resumed time after writing the save');
  assert.equal(engineState.data.clock.minutes,payload.clock.minutes,'reload restored the clock actually saved');
  assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'campaign_b13_after_reload.json'))).playerName,'QA');
 } finally {
  if(d.liveTicker)clearInterval(d.liveTicker);
  if(oldWindow===undefined)delete globalThis.window;else Object.defineProperty(globalThis,'window',oldWindow);
  if(oldStorage===undefined)delete globalThis.localStorage;else Object.defineProperty(globalThis,'localStorage',oldStorage);
  assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true});
 }
});
