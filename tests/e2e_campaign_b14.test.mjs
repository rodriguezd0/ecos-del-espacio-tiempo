import test from 'node:test';
import assert from 'node:assert/strict';
import * as campaign from '../tools/e2e_campaign_b14.mjs';
import {shopStock} from '../game/src/content/services/shop.js';
import {GameState} from '../game/src/core/state.js';

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
