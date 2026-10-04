import test from 'node:test';
import assert from 'node:assert/strict';
import {runB19} from '../tools/e2e_campaign_b19.mjs';
import {DUEL,PENA} from '../game/src/content/maps/b19/calzada_layout.js';
import {NICHE} from '../game/src/content/maps/b19/taller_layout.js';
import {TALLER_TEXT} from '../game/src/content/events/b19_taller.js';
import {SIMA_TEXT} from '../game/src/content/events/b19_sima.js';
import {UMBRAL,GAP_FINAL} from '../game/src/content/maps/b19/sima_layout.js';
import {F} from '../game/src/content/events/b19_common.js';
import {finishCasandra,casandraResultError,casandraRetryError} from '../tools/e2e_campaign_b19_retry.mjs';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';

const loss={tag:'b19_casandra',trainer:'b19_casandra',outcome:'lose',canLose:true,noMoneyLoss:true,moneyBefore:84600,moneyAfter:84600};
const retryState=()=>({map:'calzada_rey',...DUEL.retry,flags:{[F.span1]:true,[F.span2]:true,[F.span3]:true,[F.casandraArrived]:true},
 battles:[structuredClone(loss)],pokemon:[{species:'TORTERRA',hp:195,maxHP:195,status:null}]});

test('campaign B19: resume after a real Casandra loss at the raised span, without repeating its puzzle',async()=>{
 let steps;await runB19({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
  stages:async(block,s)=>{assert.equal(block,'B19');steps=s;}});
 const state=retryState(),before=structuredClone(state),stop=Error('real retry controls reached');
 const [sx,sy]=DUEL.strip[1];
 const d={snapState:async()=>state,settle:async()=>state,walkTo:async(x,y)=>{
  assert.deepEqual([x,y],[sx,sy+1]);throw stop;
 }};
 await assert.rejects(()=>steps.tramo3(d),e=>e===stop);assert.deepEqual(state,before);
});

async function b19Steps() {
 let steps;await runB19({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,stages:async(_,s)=>{steps=s;}});return steps;
}

function descentModel(map='calzada_rey',flags={[F.tablet]:true}) {
 let state={map,x:5,y:5,flags:{...flags}};const walked=[],exits=[];let interactions=0;
 const d={want:[],snapState:async()=>state,settle:async()=>state,
  walkTo:async(x,y)=>{walked.push([x,y]);state={...state,x,y};
   if(x===UMBRAL.landing[1][0]&&y===UMBRAL.landing[1][1])state={...state,flags:{...state.flags,[F.exit]:true}};},
  exitTo:async(dir,next)=>{assert.equal(dir,'up');exits.push(next);state={...state,map:next};},
  interact:async()=>{interactions++;state={...state,flags:{...state.flags,[F.finalGap]:true}};},
  expectSaid:async re=>assert.ok(SIMA_TEXT.umbral.some(t=>re.test(t))),eval:async()=>true,
  milestone:async(_,check)=>{const error=await check(state);if(error)throw Error(error);}};
 return {d,walked,exits,state:()=>state,interactions:()=>interactions};
}

test('campaign B19: fresh descent uses the workshop exit, reconstruction and current column entrance',async()=>{
 const f=descentModel();await (await b19Steps()).bajada(f.d);
 assert.deepEqual(f.walked,[[PENA.bajada.front.x,PENA.bajada.front.y],[GAP_FINAL.socket.x+1,GAP_FINAL.socket.y],
  UMBRAL.landing[1],[UMBRAL.arrive.x,UMBRAL.arrive.y]]);
 assert.deepEqual(f.exits,['sima_eje','puerta_quince']);assert.equal(f.interactions(),1);
 assert.equal(f.state().map,'puerta_quince');
});

test('campaign B19: already entered Puerta is accepted only with completed Calzada; other maps or missing tablet fail',async()=>{
 const steps=await b19Steps(),f=descentModel('puerta_quince',{[F.tablet]:true,[F.finalGap]:true,[F.exit]:true});
 await steps.bajada(f.d);assert.equal(f.walked.length,0);assert.equal(f.exits.length,0);
 for(const flag of [F.finalGap,F.exit]) {
  const bad=descentModel('puerta_quince',{[F.tablet]:true,[F.finalGap]:true,[F.exit]:true,[flag]:false});
  await assert.rejects(()=>steps.bajada(bad.d),/entrada sin salida/);
 }
 await assert.rejects(()=>steps.bajada(descentModel('sima_eje',{}).d),/sin Tabla Draco/);
 await assert.rejects(()=>steps.bajada(descentModel('ruta_7').d),/desde otro mapa/);
});

test('campaign B19: missing registered Puerta warp is a failure, never a skipped success',async()=>{
 const f=descentModel('sima_eje',{[F.tablet]:true,[F.finalGap]:true,[F.exit]:true});f.d.eval=async()=>false;
 await assert.rejects(()=>(b19Steps().then(s=>s.bajada(f.d))),/sin warp registrado/);
 assert.equal(f.exits.length,0);assert.equal(f.interactions(),0);
});

test('campaign B19: resume at the reached Umbral without repeating the descent or reconstruction',async()=>{
 let steps;await runB19({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,stages:async(_,s)=>{steps=s;}});
 let state={map:'sima_eje',x:24,y:42,flags:{[F.tablet]:true,[F.finalGap]:true,[F.exit]:true}};
 const stop=Error('normal current column entry reached'),seen=[];
 const d={snapState:async()=>state,settle:async()=>state,walkTo:async(x,y)=>{
  assert.deepEqual([x,y],[UMBRAL.arrive.x,UMBRAL.arrive.y]);throw stop;},
  expectSaid:async(pattern)=>{assert.ok(SIMA_TEXT.umbral.some(text=>pattern.test(text)));},
  milestone:async(name,check)=>{seen.push(name);assert.equal(await check(state),null);},
  eval:async()=>true};
 await assert.rejects(()=>steps.bajada(d),e=>e===stop);assert.deepEqual(seen,['umbral']);
});

test('campaign B19: resume inside the real workshop and recognize its current entrance narration',async()=>{
 let steps;await runB19({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,stages:async(_,s)=>{steps=s;}});
 const state={map:'calzada_taller',x:9,y:12,flags:{[F.casandraBeaten]:true,[F.tallerSeen]:true}},before=structuredClone(state);
 const stop=Error('actual tablet interaction reached');let recognized=false;
 const d={snapState:async()=>state,walkTo:async()=>assert.fail('Already inside calzada_taller'),
  expectSaid:async(pattern)=>{assert.ok(pattern.test(TALLER_TEXT.enter));recognized=true;},
  talk:async(x,y,face)=>{assert.deepEqual([x,y,face],[NICHE.stand.x,NICHE.stand.y,'up']);throw stop;}};
 await assert.rejects(()=>steps.taller(d),e=>e===stop);
 assert.ok(recognized);assert.deepEqual(state,before);
});

test('campaign B19: retry requires a protected real loss, canonical arrival, observed healing and all three spans',()=>{
 const valid=retryState();assert.equal(casandraRetryError(valid),null);
 for(const flag of [F.span1,F.span2,F.span3,F.casandraArrived])
  assert.match(casandraRetryError({...valid,flags:{...valid.flags,[flag]:false}}),/sin Calzada/);
 for(const change of [{map:'ruta_7'},{x:DUEL.retry.x+1},{y:DUEL.retry.y+1}])
  assert.match(casandraRetryError({...valid,...change}),/fuera de la llegada/);
 for(const change of [{tag:'wild'},{trainer:'other'},{outcome:'win'},{canLose:false},{noMoneyLoss:false}])
  assert.match(casandraRetryError({...valid,battles:[{...loss,...change}]}),/sin derrota protegida/);
 assert.match(casandraRetryError({...valid,battles:[]}),/sin derrota protegida/);
 for(const change of [{moneyBefore:undefined},{moneyAfter:undefined},{moneyBefore:NaN},{moneyAfter:'84600'},
  {moneyBefore:-1},{moneyAfter:84601}])assert.match(casandraRetryError({...valid,battles:[{...loss,...change}]}),/dinero/);
 for(const pokemon of [[],[{hp:0,maxHP:195}],[{hp:195,maxHP:195,status:'POISON'}],[{hp:0,maxHP:0}]])
  assert.match(casandraRetryError({...valid,pokemon}),/sin cura/);
});

test('campaign B19: victory must match the flag and Casandra battle outcome, even after a historical loss',()=>{
 const s=retryState();assert.match(casandraResultError(s),/sin victoria real/);
 const won={...s,flags:{...s.flags,[F.casandraBeaten]:true},battles:[loss,{...loss,outcome:'win'}]};
 assert.equal(casandraResultError(won),null);
 for(const battles of [[],[loss],[{...loss,outcome:'win',trainer:'other'}]])
  assert.match(casandraResultError({...won,battles}),/sin victoria real/);
 assert.match(casandraResultError({...won,flags:{}}),/sin victoria real/);
});

function model(results) {
 let state=retryState();const calls=[];
 const d={settle:async()=>state,snapState:async()=>state,
  walkTo:async(x,y)=>{calls.push(['walk',x,y]);state={...state,x,y};},
  step:async(dir)=>{
   calls.push(['step',dir]);assert.equal(dir,8);
   const outcome=results.shift();
   const flags={...state.flags,...(outcome==='win'?{[F.casandraBeaten]:true}:{})};
   state={...state,...DUEL.retry,flags,battles:[...state.battles,{...loss,outcome}]};
  }};
 return {d,calls,get:()=>state,set:s=>{state=s;}};
}

test('campaign B19: retry by normal controls, distinguish a new loss and succeed on a new victory',async()=>{
 const f=model(['lose','win']);const s=await finishCasandra(f.d);
 const [x,y]=DUEL.strip[1];
 assert.deepEqual(f.calls,[['walk',x,y+1],['step',8],['walk',x,y+1],['step',8]]);
 assert.equal(s.battles.length,3);assert.equal(casandraResultError(s),null);
 const done=model([]);done.set(s);assert.equal(await finishCasandra(done.d),s);assert.equal(done.calls.length,0);
});

test('campaign B19: reject stale defeat history, unrelated errors and a flag without a real victory',async()=>{
 const stale=model([]);stale.d.step=async()=>{stale.set({...stale.get(),...DUEL.retry});};
 await assert.rejects(()=>finishCasandra(stale.d),/no produjo un combate nuevo/);
 const wrong=model([]);wrong.d.step=async()=>{const s=wrong.get();wrong.set({...s,battles:[...s.battles,{...loss,tag:'wild'}]});};
 await assert.rejects(()=>finishCasandra(wrong.d),/no produjo un combate nuevo/);
 const wrongFlag=model(['lose']);wrongFlag.d.step=async()=>{const s=wrongFlag.get();wrongFlag.set({...s,flags:{...s.flags,[F.casandraBeaten]:true},battles:[...s.battles,loss]});};
 await assert.rejects(()=>finishCasandra(wrongFlag.d),/sin victoria real/);
 const oldFlag=model([]);oldFlag.set({...oldFlag.get(),flags:{[F.casandraBeaten]:true}});
 await assert.rejects(()=>finishCasandra(oldFlag.d),/sin victoria real/);
 const unrelated=model(['win']),error=Error('unrelated path error');unrelated.d.walkTo=async()=>{throw error;};
 await assert.rejects(()=>finishCasandra(unrelated.d),e=>e===error);assert.equal(unrelated.get().battles.length,1);
 const uncured=model([]);uncured.set({...uncured.get(),pokemon:[]});await assert.rejects(()=>finishCasandra(uncured.d),/sin cura/);
});

test('campaign B19: stop after exactly three new losses and reject damaged loss metadata at the limit',async()=>{
 const f=model(['lose','lose','lose']);await assert.rejects(()=>finishCasandra(f.d),/Tres derrotas nuevas/);
 assert.equal(f.get().battles.length,4);assert.equal(f.calls.filter(c=>c[0]==='step').length,3);
 const damaged=model(['lose','lose','lose']),step=damaged.d.step;
 damaged.d.step=async dir=>{await step(dir);if(damaged.get().battles.length===4)damaged.set({...damaged.get(),map:'ruta_7'});};
 await assert.rejects(()=>finishCasandra(damaged.d),/fuera de la llegada/);
});

test('campaign B19: the retry step touches Casandra in the real Calzada and World',async()=>{
 const state=GameState.create({name:'ISOLATED-CASANDRA-RETRY'});
 for(const flag of [...Object.keys(retryState().flags),F.p9,F.intro,'p8_restored','zyg_complete'])state.setFlag(flag,true);
 const {entry,warnings}=await buildMapNode('calzada_rey');assert.deepEqual(warnings,[]);
 const world=new World({state,hooks:{encountersEnabled:()=>false}});
 world.setCurrent(entry);const [x,y]=DUEL.strip[1];world.player.moveTo(x,y+1);
 assert.equal(world.player.passable(x,y+1,8),true);assert.ok(world.player.moveGeneric(8));
 for(let n=0;n<60;n++)world.update(1/60);
 assert.deepEqual([world.player.x,world.player.y],[x,y]);
 const event=world.events.find(e=>e.id==='duelo_casandra_1');
 assert.equal(event.starting,true);assert.equal(typeof event.script,'function');
 assert.equal(state.flag(F.casandraBeaten),false);
});
