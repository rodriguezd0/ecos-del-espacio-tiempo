import test from 'node:test';
import assert from 'node:assert/strict';
import * as campaign from '../tools/e2e_campaign_b14.mjs';
import {shopStock} from '../game/src/content/services/shop.js';

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
