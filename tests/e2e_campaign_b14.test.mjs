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
