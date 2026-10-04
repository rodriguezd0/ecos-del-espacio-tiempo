import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMap, createEntry } from '../game/src/world/mapLoader.js';
import { loadLibrary, tilesetDB, isEmptyFor, buildMapNode } from '../tools/lib/map_node.mjs';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { SITES, definition } from '../game/src/content/maps/b24/sites.js';
const DB=tilesetDB();
function flood(world){const p=world.player,seen=new Set([`${p.x},${p.y}`]),q=[[p.x,p.y]];while(q.length){const[x,y]=q.shift();for(const[d,dx,dy]of[[2,0,1],[4,-1,0],[6,1,0],[8,0,-1]]){const k=`${x+dx},${y+dy}`;if(seen.has(k)||!p.passable(x,y,d))continue;seen.add(k);q.push([x+dx,y+dy]);}}return seen;}
for(const id of Object.keys(SITES))test('B24: '+id+' se construye sin avisos, permite llegar y volver aunque el encargo esté pausado',async()=>{
 const def=definition(id),ts=DB.tilesets[def.tileset],lib=await loadLibrary(def.tileset),warnings=[];
 const built=buildMap(def,{library:lib.library,paintBrush:lib.paintBrush,isEmpty:isEmptyFor(ts),warn:t=>warnings.push(t)});assert.deepEqual(warnings,[],id);
 const state=GameState.create();for(const f of['game_cleared','b21_fin','dlc2_registro_abierto'])state.setFlag(f);const w=new World({state});w.setCurrent(createEntry(def,built,ts));w.player.moveTo(13,22);
 const reached=flood(w);assert.ok(reached.has('13,23'),id+' salida');for(const ev of w.events.filter(e=>e.page&&e.id!=='dlc2_regreso'))assert.ok([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>reached.has(`${ev.x+dx},${ev.y+dy}`)),`${id}: acceso ${ev.id}`);
 assert.ok(def.warps.some(w=>w.x===13&&w.y===23));assert.ok(def.warps.every(w=>!w.when),'el regreso no depende del equipo ni de flags');
});
test('B24: las siete Ultrazonas tienen reglas y especies propias, Naganadel procede de evolución',()=>{const ultras=Object.values(SITES).filter(s=>s.quest?.startsWith('ultra_'));assert.equal(ultras.length,7);assert.equal(new Set(ultras.map(s=>s.theme)).size,7);assert.ok(!ultras.flatMap(s=>s.species).includes('NAGANADEL'));});

test('B24: todos los retornos llegan sobre suelo transitable del mapa exterior real',async()=>{
 const built=new Map();for(const S of Object.values(SITES)){if(!built.has(S.returnTo.map))built.set(S.returnTo.map,await buildMapNode(S.returnTo.map));const {map}=built.get(S.returnTo.map).entry;
 assert.ok(map.passableStrict(S.returnTo.x,S.returnTo.y,0),`${S.name}: ${S.returnTo.map}(${S.returnTo.x},${S.returnTo.y})`);}
});
