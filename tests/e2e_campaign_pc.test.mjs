import test from 'node:test';
import assert from 'node:assert/strict';
import {GameState} from '../game/src/core/state.js';
import {pcSwapError,withdrawFromPC,prepareB16} from '../tools/e2e_campaign_pc.mjs';

const copy=value=>JSON.parse(JSON.stringify(value));
const pokemon=(species,uid)=>({species,uid,level:58,hp:110,maxHP:170,moves:[{id:'BITE',pp:17}],ivs:{ATK:21}});
function game() {
 const s=GameState.create({name:'QA PC'});
 s.setParty([pokemon('TORTERRA','starter'),pokemon('RAMPARDOS','fossil'),pokemon('ROTOM','gift')]);
 s.setBoxPokemon(0,4,pokemon('TOGEPI','egg'));
 s.setBoxPokemon(1,14,pokemon('ROARINGMOON','alpha'));
 return s;
}
function exchanged() {
 const s=game(),before=copy(s.data);
 s.depositPokemon(1,0);s.withdrawPokemon(1,14);
 return {before,after:copy(s.data)};
}

test('campaign PC: the ordinary deposit/withdraw preserves every Pokemon record and UID',()=>{
 const {before,after}=exchanged();assert.equal(pcSwapError(before,after,'RAMPARDOS','ROARINGMOON'),null);
});
test('campaign PC: missing, duplicated or altered Pokemon cannot certify a successful exchange',()=>{
 const {before,after}=exchanged();
 for(const mutate of [
  s=>s.boxes[0][0]=null,
  s=>s.boxes[0][1]=copy(s.party.at(-1)),
  s=>s.party.at(-1).uid='other-alpha',
  s=>s.party.at(-1).moves[0].pp=0,
  s=>s.boxes[0][4].ivs.ATK=31,
  s=>{s.boxes[0][5]=s.boxes[0][4];s.boxes[0][4]=null;},
 ]) {
  const broken=copy(after);mutate(broken);
  assert.match(pcSwapError(before,broken,'RAMPARDOS','ROARINGMOON')||'',/UID|Pokémon|caja|equipo/i);
 }
});
test('campaign PC: both selected Pokemon must move to their intended destinations',()=>{
 const {before,after}=exchanged();
 assert.match(pcSwapError(before,before,'RAMPARDOS','ROARINGMOON')||'',/equipo|caja|Pokémon/);
 const reversed=copy(after);reversed.party.reverse();
 assert.match(pcSwapError(before,reversed,'RAMPARDOS','ROARINGMOON')||'',/equipo/);
});

/** Key presses enact the real GameState withdrawal; eval only reads the scene/state. */
function uiDriver(state) {
 const actions=[],scene={box:0,sel:0,busy:false,partyOpen:false};let top='MapScene';
 Object.defineProperty(scene,'boxes',{get:()=>state.boxes});
 const storage={engine:{state,scenes:{get top(){return scene;}}}};
 const snap=async()=>({top,busy:false,partyList:state.party.map(p=>p.species),
  choiceItems:top==='ChoiceScene'?['Mover','Datos','Retirar','Objeto','Liberar','Cancelar']:[],choiceIndex:scene.index||0});
 const d={actions,snap,snapState:snap,
  eval:async(fn,arg)=>{const prior=globalThis.window;globalThis.window={__campaign:storage};try{return fn(arg);}finally{globalThis.window=prior;}},
  faceEvent:async id=>actions.push(['face',id]),dialogUntil:async()=>{top='ChoiceScene';},
  until:async(fn)=>{assert.ok(fn(await snap()));},settle:async()=>{top='MapScene';},shot:async()=>{},wait:async()=>{},
  press:async key=>{
   actions.push(['key',key]);
   if(top==='MapScene'&&key==='KeyZ'){top='ChoiceScene';scene.index=0;return;}
   if(top==='ChoiceScene'&&key==='KeyZ') {
    if(scene.menu==='pokemon') {assert.equal(scene.index,2);state.withdrawPokemon(scene.box,scene.sel);scene.menu=null;top='MessageScene';}
    else if(scene.menu==='system') {assert.equal(scene.index,1);top='MapScene';}
    else {top='StorageScene';}
    scene.index=0;return;
   }
   if(top==='MessageScene'&&key==='KeyZ'){top='StorageScene';return;}
   if(top==='ChoiceScene') {if(key==='ArrowDown')scene.index++;if(key==='ArrowUp')scene.index--;return;}
   if(top!=='StorageScene')return;
   if(key==='KeyE')scene.box=(scene.box+1)%state.boxes.length;
   if(key==='KeyQ')scene.box=(scene.box-1+state.boxes.length)%state.boxes.length;
   if(key==='ArrowDown')scene.sel+=6;
   if(key==='ArrowUp')scene.sel-=6;
   if(key==='ArrowRight')scene.sel++;
   if(key==='ArrowLeft')scene.sel--;
   if(key==='KeyZ'){scene.menu='pokemon';scene.index=0;top='ChoiceScene';}
   if(key==='KeyX'){scene.menu='system';scene.index=0;top='ChoiceScene';}
  },
 };
 return d;
}
test('campaign PC: navigation reaches an occupied slot outside the first box and selects Retirar',async()=>{
 const state=game(),d=uiDriver(state);await withdrawFromPC(d,'ROARINGMOON');
 assert.equal(state.party.at(-1).uid,'alpha');assert.equal(state.boxes[1][14],null);
 assert.equal(state.boxes[0][4].uid,'egg');assert.ok(d.actions.some(a=>a[1]==='KeyE'));
 assert.deepEqual(d.actions[0],['face','pc_0']);
});
test('campaign PC: missing Pokemon and a full team fail before opening any menu',async()=>{
 const state=game(),d=uiDriver(state);
 await assert.rejects(()=>withdrawFromPC(d,'MEW'),/caja|PC/);assert.deepEqual(d.actions,[]);
 state.setParty(Array.from({length:6},(_,i)=>pokemon('TORTERRA',`full${i}`)));
 await assert.rejects(()=>withdrawFromPC(d,'ROARINGMOON'),/lleno|hueco|completo/);assert.deepEqual(d.actions,[]);
});
test('campaign B16: normal PC preparation deposits the displaced Pokemon, then heals the actual team',async()=>{
 const state=game();state.setParty([...state.party,pokemon('GOLEM','golem'),pokemon('INTELEON','water'),pokemon('PORYGON2','pory')]);
 const d=uiDriver(state);d.travel=async map=>d.actions.push(['travel',map]);
 d.depositAtPC=async species=>{d.actions.push(['deposit',species]);state.depositPokemon(state.party.findIndex(p=>p.species===species),0);};
 d.talk=async id=>{d.actions.push(['talk',id]);state.party.forEach(p=>p.hp=p.maxHP);};
 await prepareB16(d);
 assert.equal(state.party.at(-1).uid,'alpha');assert.equal(state.boxes[0][0].uid,'fossil');
 assert.ok(state.party.every(p=>p.hp===p.maxHP));
 assert.equal(d.actions[0][1],'boreal_centro');assert.deepEqual(d.actions.at(-2),['talk','enfermera']);
 assert.deepEqual(d.actions.at(-1),['travel','villa_boreal']);
});

test('campaign B16: after an interrupted deposit the five-member team withdraws the same captured UID without depositing twice',async()=>{
 const state=game();state.setParty([...state.party,pokemon('GOLEM','golem'),pokemon('INTELEON','water'),pokemon('PORYGON2','pory')]);
 state.depositPokemon(1,0);const before=copy(state.data),d=uiDriver(state);
 d.travel=async map=>d.actions.push(['travel',map]);d.depositAtPC=async()=>assert.fail('Rampardos is already in the PC.');
 d.talk=async id=>d.actions.push(['talk',id]);
 await prepareB16(d);
 assert.equal(state.party.at(-1).uid,'alpha');assert.equal(state.boxes[0][0].uid,'fossil');
 assert.equal(pcSwapError(before,copy(state.data),'RAMPARDOS','ROARINGMOON'),null);
 assert.deepEqual(state.boxes[0][4],before.boxes[0][4]);
 assert.deepEqual(d.actions.at(-2),['talk','enfermera']);
 const missing=copy(state.data);missing.boxes[0][0]=null;
 assert.match(pcSwapError(before,missing,'RAMPARDOS','ROARINGMOON')||'',/Pokémon|UID/);
});

test('campaign B16: an incomplete team without the displaced Pokemon cannot be accepted as a pending deposit',async()=>{
 for(const missing of ['slot','pokemon']) {
  const state=game();state.setParty([...state.party,pokemon('GOLEM','golem'),pokemon('INTELEON','water'),pokemon('PORYGON2','pory')]);
  state.depositPokemon(1,0);if(missing==='slot')state.setParty(state.party.slice(0,4));else state.setBoxPokemon(0,0,null);
  const d=uiDriver(state);d.travel=async()=>{};
  await assert.rejects(()=>prepareB16(d),/depósito pendiente/);assert.deepEqual(d.actions,[]);
 }
});
