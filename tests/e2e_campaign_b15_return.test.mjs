import test from 'node:test';
import assert from 'node:assert/strict';
import {GameState} from '../game/src/core/state.js';
import {World} from '../game/src/world/world.js';
import {GameMap} from '../game/src/world/gameMap.js';
import {canSurfFreely} from '../game/src/world/terrain.js';
import {canOfferSwim} from '../game/src/world/waterAccess.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';
import {installB13Observer} from '../tools/e2e_campaign_b13_page.mjs?shore=6';
import {Driver as SeaDriver} from '../tools/e2e_b13_driver.mjs';
import {returnFromNorthSea} from '../tools/e2e_campaign_b15_return.mjs';
import {runB15} from '../tools/e2e_campaign_b15.mjs';

async function fixture(check) {
 const prior=globalThis.window,state=GameState.create({name:'ISOLATED-NORTH-RETURN'});state.data.zygarde.form='50';
 for(const key of ['run','terrain','ram','swim','climb'])state.setZygardeAbility(key,true);
 state.setFlag('p7_restored');state.data.zygarde.cells=['cell_escarcha_1','cell_mar_boreal_1'];
 const world=new World({state,hooks:{encountersEnabled:()=>false}}),{entry}=await buildMapNode('mar_boreal');
 world.setCurrent({...entry,events:null});const boreal=(await buildMapNode('villa_boreal')).entry;
 world.addNeighbor({...boreal,offset:{x:50,y:0},events:null});world.player.moveTo(27,19);world.player.surfing=true;
 globalThis.window={__map:{world},__campaign:{engine:{state},canSurfFreely,canOfferSwim,map:()=>({world})}};
 const page={evaluate:async fn=>fn()};await installB13Observer(page);
 const tick=()=>{for(let i=0;i<180;i++)world.update(1/60);};
 const snap=async()=>({map:world.current.id,x:world.player.x,y:world.player.y,surfing:world.player.surfing,
  top:'MapScene',ready:true,busy:false,playerBusy:world.player.busy(),cells:[...state.data.zygarde.cells]});
 const actions=[],d={page,snap,snapState:snap,eval:async(fn,arg)=>fn(arg),settle:snap,wait:async()=>tick(),
  until:async fn=>{tick();assert.ok(fn(await snap()));return snap();},
  turn:async dir=>world.player.turnGeneric(typeof dir==='number'?dir:{up:8,down:2,left:4,right:6}[dir]),
  step:async dir=>{actions.push(['step',dir]);assert.equal(world.player.moveGeneric(dir),true);tick();},
  interact:async()=>{actions.push(['swim']);assert.ok(canOfferSwim(world));assert.ok(world.player.startSurf());tick();},
  crossEdge:async(dir,to)=>{actions.push(['cross',dir,to]);await d.step(dir);assert.equal(world.current.id,to);},
 };
 d.walkTo=(x,y,opts={})=>SeaDriver.prototype.walkTo.call(d,x,y,{...opts,router:(x,y)=>window.__b13.routeMixed(x,y)});
 try {await check({world,state,d,actions});}finally{globalThis.window=prior;}
}

test('campaign B15: the mixed route follows actual Surf retention across the C096 floe',async()=>{
 await fixture(async({world,d})=>{
  assert.equal(window.__b13.isWater(27,19),false);assert.ok(Array.isArray(window.__b13.routeMixed(49,18)));
  await returnFromNorthSea(d);
  assert.equal(world.current.id,'villa_boreal');assert.equal(world.player.surfing,false);
 });
});
test('campaign B15: returning uses the existing Surf state and a passable edge without collecting anything twice',async()=>{
 await fixture(async({state,d,actions})=>{
  const cells=[...state.data.zygarde.cells];await returnFromNorthSea(d);
  assert.deepEqual(state.data.zygarde.cells,cells);assert.ok(!actions.some(a=>a[0]==='swim'));
  assert.ok(actions.some(a=>a[0]==='cross'&&a[1]===6&&a[2]==='villa_boreal'));
  const n=actions.length;await returnFromNorthSea(d);assert.equal(actions.length,n);
 });
});

test('campaign B15: a team on the floe can start swimming normally before using the coastal return',async()=>{
 await fixture(async({world,d,actions})=>{
  world.player.moveTo(26,19);world.player.surfing=false;
  await returnFromNorthSea(d);
  assert.ok(actions.some(a=>a[0]==='swim'));assert.equal(world.current.id,'villa_boreal');assert.equal(world.player.surfing,false);
 });
});
test('campaign B15: without a loaded passable neighbor the return stops before issuing movement',async()=>{
 await fixture(async({world,d,actions})=>{
  world.neighbors=[];await assert.rejects(()=>returnFromNorthSea(d),/No hay borde navegable/);
  assert.equal(world.current.id,'mar_boreal');assert.deepEqual(actions,[]);
 });
});
test('campaign B15: reentering the optional stage after both pickups completes only the outstanding return',async()=>{
 let stages;await runB15({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,stages:async(_block,value)=>stages=value});
 await fixture(async({world,d})=>{
  d.travel=async()=>assert.fail('Both cells are already collected: do not start another excursion.');
  await stages.opcionalesNorte(d);assert.equal(world.current.id,'villa_boreal');assert.equal(world.player.surfing,false);
 });
});

test('campaign water route: an elevated bridge ends Surf exactly as Player, so the water beyond it is not traversable on foot',async()=>{
 const prior=globalThis.window,state=GameState.create({name:'ISOLATED-BRIDGE'}),world=new World({state});
 const map=new GameMap({id:'bridge_fixture',built:{width:3,height:1,layers:[[1,1,1],[0,2,0],[0,0,0]]},
  tileset:{passages:[0,15,0],priorities:[0,0,0],terrainTags:[0,7,15]}});
 world.setCurrent({id:map.id,def:{events:[]},map});world.bridge=1;world.player.moveTo(0,0);world.player.surfing=true;
 globalThis.window={__map:{world},__campaign:{engine:{state},canSurfFreely,canOfferSwim}};
 try {
  await installB13Observer({evaluate:fn=>fn()});
  assert.equal(map.terrainTagAt(1,0).id,'Water');assert.equal(world.terrainAt(world.player,1,0).id,'Bridge');
  assert.deepEqual(window.__b13.routeMixed(1,0),[6]);assert.equal(window.__b13.routeMixed(2,0),null);
  assert.equal(world.player.moveGeneric(6),true);for(let i=0;i<180;i++)world.update(1/60);
  assert.equal(world.player.surfing,false);assert.equal(world.player.passable(1,0,6),false);
 }finally{globalThis.window=prior;}
});
