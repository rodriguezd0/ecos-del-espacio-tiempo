import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { fieldWorld, fieldCtx, entryState, runEvent, DV, key, db } from './b18_helpers.mjs';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { F, LEGENDS, gateFor } from '../game/src/content/events/b22c_common.js';
import { SITES, HOOKS, LATIOS_ROUTE, LUGIA_ROUTE } from '../game/src/content/maps/b22c/layout.js';
import { configureGuide, guideMode } from '../game/src/content/events/b22c_lugia.js';
import { applyRest } from '../game/src/world/rest.js';

const pokemon=(sp,moves=[])=>createPokemon(db,sp,80,{moves,rng:()=>0.5});
const state=()=>{
 const s=entryState();s.setFlag('game_cleared');s.setFlag('b21_fin');s.setFlag(F.ramon);s.setFlag(F.rain);s.setFlag(F.sun);
 s.addItem('BLUEORB',1);s.addItem('REDORB',1);s.addItem('SOULDEW',1);s.setParty([pokemon('KYOGRE'),pokemon('GROUDON')]);
 s.setVar('rest_storm_until',s.playTimeFrames+3600);return s;
};
function reachable(t,start=t.def.start) {
 const seen=new Set([key(start.x,start.y)]),q=[[start.x,start.y]];
 for(let i=0;i<q.length;i++) for(const[d,[dx,dy]]of Object.entries(DV)) {
  const[x,y]=q[i],nx=x+dx,ny=y+dy;if(!t.map.valid(nx,ny)||seen.has(key(nx,ny)))continue;
  t.p.moveTo(x,y);if(t.p.passable(x,y,+d)){seen.add(key(nx,ny));q.push([nx,ny]);}
 }
 return seen;
}

test('B22c: nuevos recintos usan piezas válidas, tienen caminos reales al encuentro y salida antes/después de capturar',async()=>{
 for(const[keyName,S]of Object.entries(SITES)) {
  const built=await buildMapNode(S.id);assert.deepEqual(built.warnings,[],S.id);
  if(built.def.panorama)assert.ok(built.def.panorama.image||['sima','distorsion'].includes(built.def.panorama.shader),'el panorama existe en el renderizador');
  for(const caught of [false,true]) {
   const s=state();s.setFlag(LEGENDS[keyName].caught,caught);
   const t=await fieldWorld(S.id,{state:s}),r=reachable(t);
   assert.ok(r.has(key(S.stand.x,S.stand.y)),`${S.id}: no se llega al encuentro`);
   assert.ok(r.has(key(S.exit.x,S.exit.y)),`${S.id}: no se llega al regreso`);
   assert.ok(!t.map.isVoid(S.exit.x,S.exit.y),'retorno pintado');
   const back=await fieldWorld(S.back.map,{state:s});assert.ok(back.map.playerPassable(S.back.x,S.back.y,0,{}));
  }
 }
});

test('B22c: los accesos del mundo respetan Buceo/pista, objetos reales y el epílogo; siempre permiten regresar',async()=>{
 for(const[keyName,S]of Object.entries(SITES)) {
  const s=state(),t=await fieldWorld(S.access.map,{state:s}),c=fieldCtx(t);
  if(keyName==='kyogre') await runEvent(c,'fosa_abisal_2');else await runEvent(c,`b22c_acceso_${keyName}`);
  assert.deepEqual(c.log.warps.at(-1),{mapId:S.id,...S.entry});
  s.setFlag('b21_fin',false);const room=await fieldWorld(S.id,{state:s}),guard=fieldCtx(room);
  await room.def.onEnter(guard);assert.deepEqual(guard.log.warps.at(-1),{mapId:S.back.map,x:S.back.x,y:S.back.y,dir:S.back.dir});
 }
 const s=state();s.setFlag(F.ramon,false);const t=await fieldWorld('fondo_mar_sur',{state:s}),c=fieldCtx(t);
 await runEvent(c,'b22c_acceso_lugia');assert.deepEqual(c.log.warps,[]);
 s.setFlag(F.ramon);s.setZygardeAbility('dive',false);await runEvent(c,'b22c_acceso_lugia');assert.deepEqual(c.log.warps,[]);
});

test('B22c: guía de Lugia ofrece alternativa persistente sin destellos y señales recorribles en ambos sentidos',async()=>{
 const t=await fieldWorld('sima_marina',{state:state()}),c=fieldCtx(t,{choices:[3]}),flashes=[];
 c.flash=(...args)=>flashes.push(args);await configureGuide(c);assert.equal(guideMode(t.state),3);
 const saved=new GameState(JSON.parse(JSON.stringify(t.state.data)));assert.equal(guideMode(saved),3);
 const r=reachable(t);for(const p of LUGIA_ROUTE)assert.ok(r.has(key(p.x,p.y)),`corriente${p.x},${p.y}`);
 for(let i=0;i<LUGIA_ROUTE.length;i++)await runEvent(c,`b22c_aerochorro_${i}`);
 assert.deepEqual(flashes,[]);assert.ok(t.w.events.filter(e=>e.id.startsWith('b22c_aerochorro')).every(e=>e.page.light));
 assert.ok(reachable(t,SITES.lugia.stand).has(key(SITES.lugia.exit.x,SITES.lugia.exit.y)));
});

test('B22c: cambiar la guía permite volver a oír las corrientes ya visitadas',async()=>{
 const t=await fieldWorld('sima_marina',{state:state()}),c=fieldCtx(t,{choices:[2]}),sounds=[];
 t.state.setVar('b22c_lugia_senales',127);c.se=(name,opts)=>sounds.push({name,opts});
 await configureGuide(c);await runEvent(c,'b22c_aerochorro_0');
 assert.equal(guideMode(t.state),2);assert.ok(sounds.length>0,'la guía nueva debe sonar');
 assert.equal(t.state.var('b22c_lugia_senales'),1);
});

test('B22c: los hooks preservan Suicune, Bastión, las caracolas de Antea y las revanchas de Olvido',async()=>{
 const s=state();s.setFlag('p5_restored');
 const lake=await fieldWorld('lagos_alma',{state:s});assert.ok(lake.w.events.some(e=>e.id.includes('suicune')));assert.ok(lake.w.events.some(e=>e.id==='b22c_reflejo_latias'));
 const sea=await fieldWorld('mar_del_sur',{state:s});assert.ok(sea.def.events.some(e=>e.id.includes('bastion')));
 const echo=await fieldWorld('antea_2_antea',{state:s});assert.ok(echo.w.events.some(e=>e.id.includes('caracola')));
 const core=await fieldWorld('archivo_hondo_nucleo',{state:s}),c=fieldCtx(core,{confirms:[false]});
 await runEvent(c,'b22e_guardian_olvido');assert.equal(s.itemCount('SACREDASH'),1);assert.equal(c.log.battles.length,0);
});

test('B22c: Latias abre Latios tras verla; sus megapiedras son únicas y la itinerancia persiste después de huir y descansar',async()=>{
 const s=state(),t=await fieldWorld('lagos_alma',{state:s}),c=fieldCtx(t,{battles:['run','win']});
 await runEvent(c,'b22c_reflejo_latias');assert.ok(s.flag(F.latiasSeen));assert.equal(gateFor(s,'latios'),null);
 await runEvent(c,'b22c_reflejo_latias');assert.equal(s.itemCount('LATIASITE'),1);
 const sea=await fieldWorld('mar_del_sur',{state:s}),sc=fieldCtx(sea,{battles:['run','win']});
 await runEvent(sc,'b22c_latios_0');assert.equal(s.var('b22c_latios_ruta'),1);
 await runEvent(sc,'b22c_latios_1');assert.equal(s.itemCount('LATIOSITE'),1);assert.equal(s.var('b22c_latios_ruta'),2);
 const loaded=new GameState(JSON.parse(JSON.stringify(s.data)));applyRest(loaded);
 const again=await fieldWorld('mar_del_sur',{state:loaded}),ac=fieldCtx(again,{battles:['caught']});
 await runEvent(ac,'b22c_latios_2');assert.equal(loaded.itemCount('LATIOSITE'),1);assert.ok(loaded.flag(LEGENDS.latios.caught));
 assert.equal(LATIOS_ROUTE.length,3);
});
