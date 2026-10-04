import test from 'node:test';
import assert from 'node:assert/strict';
import * as campaign from '../tools/e2e_campaign_b14.mjs';
import {shopStock} from '../game/src/content/services/shop.js';
import {GameState} from '../game/src/core/state.js';
import {CampaignDriver} from '../tools/e2e_campaign_driver.mjs';

test('campaign B14: supplies are bought from their actual shops after ordinary healing',async()=>{
 const calls=[];let map='caleta_sonda';
 const d={travel:async to=>{map=to;calls.push(['travel',to]);},talk:async id=>calls.push(['talk',id]),
  purchase:async items=>{
   const stock=shopStock(null,{list:map==='caleta_tienda'?'fishing':'general',pillars:6});
   for(const id of Object.keys(items))assert.ok(stock.includes(id),`${map} must actually sell ${id}`);
   calls.push(['buy',items]);
  }};
 await campaign.prepareB14(d);
 assert.deepEqual(calls[0],['travel','nexo_centro']);
 assert.deepEqual(calls[1],['talk','enfermera']);
 assert.deepEqual(calls.at(-1),['travel','caleta_sonda']);
 assert.deepEqual(calls.filter(c=>c[0]==='buy').map(c=>Object.keys(c[1])),[['HYPERPOTION','ULTRABALL'],['DIVEBALL']]);
});

async function caletaIntro(coins,check) {
 const original=globalThis.window,state=GameState.create({name:'QA'}),calls=[];
 state.setFlag('b14_caleta_intro',true);if(coins)state.addItem('RELICCOPPER',coins);
 const view={flags:state.data.flags,top:'MapScene',busy:false,map:'caleta_sonda',ready:true,surfing:false,x:13,y:9};
 globalThis.window={__b14:{items:id=>state.itemCount(id)}};
 const transcript='¡Otra vez la marea! A mí la marea me ha quitado a mi hijo';
 const d={until:async fn=>assert.ok(fn(view)),settle:async()=>{},expectSaid:async re=>assert.match(transcript,re),
  eval:async fn=>fn(),milestone:async(name,fn)=>{const error=fn(view);if(error)throw Error(error);calls.push(['milestone',name]);},
  swimTo:async(x,y)=>{calls.push(['swim',x,y]);Object.assign(view,{surfing:true,x,y});},
  interact:async()=>{calls.push(['dive']);view.map='arrecife_eco';}};
 try {await check({d,state,calls,view});}
 finally {if(original===undefined)delete globalThis.window;else globalThis.window=original;}
}

test('campaign B14: the observed beach intro and real coin permit swimming to the whirlpool and diving',async()=>{
 await caletaIntro(1,async({d,state,calls,view})=>{
  await campaign.caleta(d);
  assert.deepEqual(calls,[['milestone','caleta_intro'],['swim',4,28],['milestone','remolino'],['dive']]);
  assert.equal(view.map,'arrecife_eco');assert.equal(state.itemCount('RELICCOPPER'),1);
 });
});

test('campaign B14: an intro flag without its actual copper coin stops before swimming or granting progress',async()=>{
 await caletaIntro(0,async({d,state,calls})=>{
  await assert.rejects(campaign.caleta(d),/monedas 0/);
  assert.deepEqual(calls,[]);assert.equal(state.itemCount('RELICCOPPER'),0);
 });
});

function reefRecovery() {
 const state={map:'arrecife_eco',battles:[],healPoint:{mapId:'caleta_centro'},flags:{b14_caleta_intro:true}},calls=[];
 const d={snap:async()=>structuredClone(state),whiteout:CampaignDriver.prototype.whiteout,
  travel:async map=>{calls.push(['travel',map]);state.map=map;},talk:async id=>calls.push(['talk',id])};
 const enter=async()=>{calls.push(['dive',state.map]);state.map='arrecife_eco';};
 return {state,calls,d,enter};
}

test('campaign B14: a new reef loss returns by nurse, Caleta and the actual diving entry before retrying',async()=>{
 const {state,calls,d,enter}=reefRecovery();let attempts=0;
 await campaign.completeArrecife(d,{enter,run:async()=>{
  calls.push(['reef',state.map]);if(++attempts===1){state.map='caleta_centro';state.battles.push({tag:'b14_tecnica_eulalia',outcome:'lose'});throw Error('no terrestrial diving route');}
 }});
 assert.equal(attempts,2);
 assert.deepEqual(calls,[['reef','arrecife_eco'],['travel','caleta_centro'],['talk','enfermera'],['travel','caleta_sonda'],['dive','caleta_sonda'],['reef','arrecife_eco']]);
 assert.deepEqual(state.flags,{b14_caleta_intro:true});
});

test('campaign B14: a previous loss cannot excuse an unrelated map change in the reef',async()=>{
 const {state,d,enter}=reefRecovery();state.battles.push({outcome:'lose'});let attempts=0;
 await assert.rejects(campaign.completeArrecife(d,{enter,run:async()=>{attempts++;state.map='caleta_centro';throw Error('unrelated failure');}}),/unrelated failure/);
 assert.equal(attempts,1);
});

test('campaign B14: three new reef defeats stop without inventing a victory or puzzle progress',async()=>{
 const {state,d,enter}=reefRecovery();let attempts=0;
 await assert.rejects(campaign.completeArrecife(d,{enter,run:async()=>{
  attempts++;state.map='caleta_centro';state.battles.push({outcome:'lose'});throw Error('lost');
 }}),/Tres derrotas reales en el arrecife/);
 assert.equal(attempts,3);assert.deepEqual(state.flags,{b14_caleta_intro:true});
});

test('campaign B14: moving the draga requires recorded wins, not merely attempts, against all three technicians',()=>{
 const s={flags:{b14_jefa_vencida:true,b14_draga_apartada:true},battles:['b14_tecnico_rufino','b14_tecnica_eulalia','b14_jefa_adela'].map(id=>({id,outcome:'win'}))};
 assert.equal(campaign.reefVictoryError(s),null);
 s.battles[1].outcome='lose';assert.match(campaign.reefVictoryError(s)||'',/eulalia/);
 s.battles[1].outcome='win';s.flags.b14_draga_apartada=false;assert.ok(campaign.reefVictoryError(s));
});

test('campaign B14: the safe Adela loss retries in the same bell with the canonical healed team',async()=>{
 const {state,calls,d,enter}=reefRecovery();let attempts=0;
 await campaign.completeArrecife(d,{enter,run:async()=>{
  calls.push(['reef',state.map]);
  if(++attempts===1){state.map='arrecife_campana';state.battles.push({id:'b14_jefa_adela',outcome:'lose',canLose:true});throw Error('no victory dialogue');}
 }});
 assert.equal(attempts,2);assert.deepEqual(calls,[['reef','arrecife_eco'],['reef','arrecife_campana']]);
 assert.deepEqual(state.flags,{b14_caleta_intro:true});
});

function echoRecovery() {
 const state={map:'antea_4_presente',battles:[],flags:{b14_aliviadero:true}},calls=[];
 const d={snap:async()=>structuredClone(state),walkTo:async(x,y)=>calls.push(['walk',x,y]),
  exitTo:async(dir,map)=>{calls.push(['stairs',dir,map]);state.map=map;}};
 const loss={tag:'bramaluna_eco',outcome:'lose',canLose:true,noMoneyLoss:true,moneyBefore:34936,moneyAfter:34936};
 return {state,calls,d,loss};
}

test('campaign B14: a safe echo defeat returns through the real floor-three stairs before retrying',async()=>{
 const {state,calls,d,loss}=echoRecovery();let attempts=0;
 await campaign.completeEcho(d,{run:async()=>{
  calls.push(['echo',state.map]);
  if(++attempts===1){state.map='antea_4_presente';state.battles.push(loss);throw Error('no victory dialogue');}
 }});
 assert.equal(attempts,2);
 assert.deepEqual(calls,[['walk',16,5],['stairs','up','fosa_eco'],['echo','fosa_eco'],['walk',16,5],['stairs','up','fosa_eco'],['echo','fosa_eco']]);
 assert.deepEqual(state.flags,{b14_aliviadero:true});
});

test('campaign B14: an old echo defeat cannot excuse an unrelated failure or unexpected map',async()=>{
 const {state,d,loss}=echoRecovery();state.map='fosa_eco';state.battles.push(loss);let attempts=0;
 await assert.rejects(campaign.completeEcho(d,{run:async()=>{attempts++;state.map='antea_4_presente';throw Error('unrelated failure');}}),/unrelated failure/);
 assert.equal(attempts,1);
 state.map='caleta_sonda';
 await assert.rejects(campaign.completeEcho(d,{run:async()=>{attempts++;}}),/fuera de la Fosa/);
 assert.equal(attempts,1);
});

test('campaign B14: only a new protected echo loss at its canonical retry map may be recovered',async()=>{
 for(const change of [{tag:'bramaluna_real'},{canLose:false},{noMoneyLoss:false},{outcome:'win'},{moneyAfter:1},{map:'caleta_sonda'}]){
  const {state,d,loss}=echoRecovery();state.map='fosa_eco';let attempts=0;
  await assert.rejects(campaign.completeEcho(d,{run:async()=>{
   attempts++;state.map=change.map||'antea_4_presente';state.battles.push({...loss,...change});throw Error('unsafe loss');
  }}),/unsafe loss/);
  assert.equal(attempts,1);
 }
});

test('campaign B14: missing or invalid money observations do not prove a protected echo retry',async()=>{
 for(const money of [undefined,null,'34936',NaN,-1,Number.MAX_SAFE_INTEGER+1]){
  const {state,d,loss}=echoRecovery();state.map='fosa_eco';let attempts=0;
  await assert.rejects(campaign.completeEcho(d,{run:async()=>{
   attempts++;state.map='antea_4_presente';state.battles.push({...loss,moneyBefore:money,moneyAfter:money});throw Error('missing money evidence');
  }}),/missing money evidence/);
  assert.equal(attempts,1);
 }
});

test('campaign B14: three protected echo defeats stop without granting restoration or a catch',async()=>{
 const {state,d,loss}=echoRecovery();let attempts=0;
 await assert.rejects(campaign.completeEcho(d,{run:async()=>{
  attempts++;state.map='antea_4_presente';state.battles.push({...loss});throw Error('lost');
 }}),/Tres derrotas reales contra el eco/);
 assert.equal(attempts,3);assert.deepEqual(state.flags,{b14_aliviadero:true});
});

test('campaign B14: echo victory evidence requires the actual uncapturable alpha and a recorded win',()=>{
 const s={flags:{b14_bramaluna_eco:true},battles:[{tag:'bramaluna_eco',outcome:'win',level:56,alpha:true,ability:'PROTOSYNTHESIS',item:'BOOSTERENERGY',canRun:false,catchRule:{allowed:false,reason:'Es un eco: no hay nada que atrapar'}}]};
 assert.equal(campaign.echoVictoryError(s),null);
 for(const change of [{outcome:'lose'},{level:58},{alpha:false},{ability:'PRESSURE'},{item:null},{canRun:true},{catchRule:{allowed:true}}]){
  assert.ok(campaign.echoVictoryError({...s,battles:[{...s.battles[0],...change}]}));
 }
 assert.ok(campaign.echoVictoryError({...s,flags:{}}));
});

test('campaign B14: the default echo path uses the touch encounter and checks its recorded victory',async()=>{
 const {state,calls,d}=echoRecovery();
 const win={tag:'bramaluna_eco',outcome:'win',level:56,alpha:true,ability:'PROTOSYNTHESIS',item:'BOOSTERENERGY',canRun:false,catchRule:{allowed:false,reason:'Es un eco: no hay nada que atrapar'}};
 const walk=d.walkTo;
 d.walkTo=async(x,y,opts)=>{
  await walk(x,y);
  if(x===15&&y===16){assert.equal(opts.stopWhen(state),false);state.battles.push(win);state.flags.b14_bramaluna_eco=true;assert.equal(opts.stopWhen(state),true);}
 };
 d.settle=async()=>{};
 d.expectSaid=async(re)=>{assert.match('La Bramaluna se deshace en ondas verdes',re);calls.push(['victory-dialogue']);};
 d.milestone=async(name,check)=>{assert.equal(check(state),null);calls.push(['milestone',name]);};
 await campaign.completeEcho(d);
 assert.deepEqual(calls,[['walk',16,5],['stairs','up','fosa_eco'],['walk',15,16],['victory-dialogue'],['milestone','eco_vencido']]);
 calls.length=0;
 await campaign.completeEcho(d);
 assert.deepEqual(calls,[['milestone','eco_vencido']]);
});
