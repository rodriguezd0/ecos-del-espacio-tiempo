import test from 'node:test';
import assert from 'node:assert/strict';
import * as routes from '../tools/e2e_campaign_routes.mjs';
import {loadMapDefinition} from '../game/src/content/maps/index.js';
import {DESCENT_GAP} from '../game/src/content/maps/b17/mirador_layout.js';
import {F} from '../game/src/content/events/b17_common.js';
import {F as B19} from '../game/src/content/events/b19_common.js';
import {GameState} from '../game/src/core/state.js';
import {buildMapNode} from '../tools/lib/map_node.mjs';
import {World} from '../game/src/world/world.js';
import {CampaignDriver} from '../tools/e2e_campaign_driver.mjs';
import {BOREAL} from '../game/src/content/maps/b15/layout_boreal.js';

test('campaign travel: the B15 return from Mirador to the Garganta uses the open south connection',async()=>{
 const staticPath=await routes.findTravelPath('mirador_sur','garganta_albo');
 assert.equal(staticPath[0],'sima_eje');
 const path=await routes.findTravelPath('mirador_sur','garganta_albo',loadMapDefinition,{flags:{p7_restored:true}});
 assert.equal(path[0],'ciudad_lumina');assert.ok(!path.includes('sima_eje'));assert.ok(!path.includes('puente_convergencia'));
 assert.equal(path.at(-1),'garganta_albo');
});

test('campaign travel: the actual Mirador reconstruction flag opens its descent, without granting it',async()=>{
 const {entry}=await buildMapNode('mirador_sur'),state=GameState.create({name:'QA-gates'}),world=new World({state});
 world.setCurrent({...entry,events:null});
 const socket=world.events.find(e=>e.def.type==='rebuildGap'&&e.def.flag===DESCENT_GAP.flag);
 assert.ok(socket);assert.equal(routes.travelEdgeOpen('mirador_sur','sima_eje',state.data.flags),false);
 state.setFlag(socket.def.flag);
 assert.equal(routes.travelEdgeOpen('mirador_sur','sima_eje',state.data.flags),true);
 const path=await routes.findTravelPath('mirador_sur','garganta_albo',loadMapDefinition,{flags:state.data.flags});
 assert.equal(path[0],'sima_eje');assert.equal(state.flag(socket.def.flag),true);assert.equal(state.flag(F.p9),false);
});

test('campaign travel: the south bridge follows its real P9 barrier and leaves ordinary connections available',async()=>{
 const {entry}=await buildMapNode('mirador_sur'),state=GameState.create({name:'QA-bridge'}),world=new World({state});
 world.setCurrent({...entry,events:null});assert.ok(world.events.find(e=>e.id==='barrera_estribo_0').page);
 assert.equal(routes.travelEdgeOpen('mirador_sur','puente_convergencia',state.data.flags),false);
 state.setFlag(F.p9);world.refreshEvents();assert.equal(world.events.find(e=>e.id==='barrera_estribo_0').page,null);
 assert.equal(routes.travelEdgeOpen('mirador_sur','puente_convergencia',state.data.flags),true);
 assert.equal(routes.travelEdgeOpen('mirador_sur','ciudad_lumina',{}),true);
 assert.equal(routes.travelEdgeOpen('ciudad_caudal','ruta_3',{}),true);
});

test('campaign travel: a closed descent cannot produce a path when it is the only connection',async()=>{
 const maps={mirador_sur:{id:'mirador_sur',warps:[{to:'sima_eje'}]},sima_eje:{id:'sima_eje'}};
 assert.equal(await routes.findTravelPath('mirador_sur','sima_eje',async id=>maps[id],{flags:{}}),null);
 assert.deepEqual(await routes.findTravelPath('mirador_sur','mirador_sur',async id=>maps[id],{flags:{}}),[]);
});

test('campaign travel: an early Calzada visit is allowed but its three unfinished spans are not a shortcut to the Sima',()=>{
 assert.equal(routes.travelEdgeOpen('ruta_7','calzada_rey',{}),true);
 assert.equal(routes.travelEdgeOpen('calzada_rey','sima_eje',{}),false);
 assert.equal(routes.travelEdgeOpen('calzada_rey','sima_eje',{[B19.span1]:true,[B19.span2]:true}),false);
 assert.equal(routes.travelEdgeOpen('calzada_rey','sima_eje',{[B19.span1]:true,[B19.span2]:true,[B19.span3]:true}),true);
});

test('campaign travel: the actual driver supplies the observed flags and executes the ordinary south route',async()=>{
 const state={map:'mirador_sur',flags:{p7_restored:true},abilities:{},riding:false},moves=[];
 const d=new CampaignDriver({},[],{outDir:'.',root:'.'});
 d.snap=async()=>structuredClone(state);
 d.eval=async(_fn,arg)=>{
  if(typeof arg==='string'){
   const def=await loadMapDefinition(state.map),edge=def.connections?.find(c=>c.to===arg);
   return edge?{dir:{north:8,south:2,west:4,east:6}[edge.dir]}:null;
  }
  return typeof arg==='number'?{x:0,y:0}:[6];
 };
 d.walkTo=async()=>{};d.settle=async()=>{};
 d.crossEdge=async(dir,to)=>{moves.push([dir,to]);state.map=to;};
 d.exitTo=async to=>{moves.push(['warp',to]);state.map=to;};
 await d.travel('garganta_albo');
 assert.deepEqual(moves[0],[2,'ciudad_lumina']);assert.equal(state.map,'garganta_albo');
 assert.ok(!moves.some(([,map])=>['sima_eje','puente_convergencia','calzada_rey'].includes(map)));
 assert.deepEqual(state.flags,{p7_restored:true});
});

test('campaign travel: the real Escarcha cave opens from the west, while the assumed south approach is rock',async()=>{
 const {entry}=await buildMapNode('villa_boreal'),state=GameState.create({name:'QA-cave-door'}),world=new World({state});
 state.setFlag('p7_restored');world.setCurrent({...entry,events:null});
 const warp=entry.def.warps.find(w=>w.to==='gruta_escarcha');
 assert.deepEqual([warp.x,warp.y],[BOREAL.cave.door.x,BOREAL.cave.door.y]);
 assert.equal(world.map.passable(warp.x,warp.y+1,8,world.player,world.env()),false);
 assert.deepEqual(routes.scriptEntrance('villa_boreal','gruta_escarcha'),
  {to:'gruta_escarcha',x:BOREAL.cave.arrival.x,y:BOREAL.cave.arrival.y,dir:6});
});

test('campaign travel: the continuous driver reenters Escarcha by pressing right at its actual arrival',async()=>{
 const state={map:'villa_boreal',flags:{p7_restored:true}},actions=[],d=new CampaignDriver({},[],{outDir:'.',root:'.'});
 d.snap=async()=>structuredClone(state);d.walkTo=async(x,y)=>actions.push(['walk',x,y]);
 d.pushUntil=async(dir,predicate)=>{actions.push(['push',dir]);state.map='gruta_escarcha';assert.ok(predicate(state));};
 d.eval=async()=>null;d.exitTo=async()=>assert.fail('The south-door fallback must not run for this lateral cave.');
 await d.travel('gruta_escarcha');
 assert.deepEqual(actions,[['walk',41,17],['push',6]]);assert.equal(state.map,'gruta_escarcha');
});

function reachable(world,map,start,goal) {
 const queue=[start],seen=new Set([start.join(',')]),dirs=[[2,0,1],[4,-1,0],[6,1,0],[8,0,-1]];
 for(let i=0;i<queue.length;i++) {
  const [x,y]=queue[i];world.player.x=x;world.player.y=y;
  for(const [dir,dx,dy] of dirs) {
   let nx=x+dx,ny=y+dy;if(!map.valid(nx,ny)||!world.player.passable(x,y,dir))continue;
   if(map.terrainTagAt(nx,ny,0).ledge){nx+=dx;ny+=dy;}
   const key=`${nx},${ny}`;if(!map.valid(nx,ny)||seen.has(key))continue;seen.add(key);queue.push([nx,ny]);
  }
 }
 return seen.has(goal.join(','));
}

for(const [from,to,opened,goal] of [
 ['sima_eje','mirador_sur',[DESCENT_GAP.flag],[14,38]],
 ['puente_convergencia','mirador_sur',[F.p9],[14,38]],
 ['sima_eje','calzada_rey',[B19.span1,B19.span2,B19.span3],[3,60]],
])test(`campaign travel: every ${from} arrival into ${to} is isolated until its actual exit gate opens`,async()=>{
 const arrivals=(await loadMapDefinition(from)).warps.filter(w=>w.to===to);assert.ok(arrivals.length);
 for(const arrival of arrivals)for(const open of [false,true]) {
  const state=GameState.create({name:'isolated-inverse-gate'});
  for(const flag of ['p1_restored','p2_restored','p3_restored','p4_restored','p5_restored','p6_restored','p7_restored','p8_restored','zyg_complete',...(open?opened:[])])state.setFlag(flag);
  const {entry}=await buildMapNode(to),world=new World({state});world.setCurrent({...entry,events:null});
  assert.equal(reachable(world,entry.map,[arrival.tx,arrival.ty],goal),open,`${from} arrival ${arrival.tx},${arrival.ty}`);
  assert.equal(routes.travelEdgeOpen(from,to,state.data.flags),open);
 }
});
