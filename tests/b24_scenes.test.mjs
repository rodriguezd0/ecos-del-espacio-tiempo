import test from 'node:test';import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';import{World}from '../game/src/world/world.js';
import{buildMap,createEntry}from '../game/src/world/mapLoader.js';import{loadLibrary,tilesetDB,isEmptyFor}from '../tools/lib/map_node.mjs';
import{fieldCtx,runEvent,db,DV,NAME_DIR}from './b18_helpers.mjs';import{createPokemon}from '../game/src/battle/core/pokemon.js';
import{SITES,definition}from '../game/src/content/maps/b24/sites.js';import{activate,EXPEDITIONS}from '../game/src/content/events/b24_registry.js';
import{openRegistry}from '../game/src/content/events/b24_registry_ui.js';
import{ULTRA_SPECIES}from '../game/src/content/events/b24_conditions.js';
async function context(id,opts={}){
 const def=definition(id),ts=tilesetDB().tilesets[def.tileset],l=await loadLibrary(def.tileset),s=GameState.create();
 for(const f of['game_cleared','b21_fin','dlc2_registro_abierto'])s.setFlag(f);
 for(const e of EXPEDITIONS.slice(0,12))s.setFlag(`dlc2_${e.id}_hallazgo`);
 const q=SITES[id].quest;if(q){s.setFlag(`dlc2_${q}_hallazgo`,false);activate(s,q);s.setFlag(`dlc2_${q}_confirmada`);s.setFlag(`dlc2_${q}_indicio`);}
 const w=new World({state:s});w.setCurrent(createEntry(def,buildMap(def,{library:l.library,paintBrush:l.paintBrush,isEmpty:isEmptyFor(ts)}),ts));w.player.moveTo(13,22);
 const c=fieldCtx({w,p:w.player,state:s,map:w.map},opts);c.db=db;c.moves=[];
 c.move=async(who,route)=>{const ch=typeof who==='string'?(who==='player'?w.player:w.events.find(e=>e.id===who)):who;assert.ok(ch);for(const step of route){const d=NAME_DIR[step];if(d){assert.ok(ch.map.passable(ch.x,ch.y,d,ch),'NPC pasa por suelo');ch.moveTo(ch.x+DV[d][0],ch.y+DV[d][1]);}}c.moves.push({who,route});};
 c.state.setParty([createPokemon(db,'MEW',80,{moves:['SURF','EMBER','SING']})]);return {c,def,w};
}
for(const id of Object.keys(SITES))test('B24: páginas activas de '+id+' se alcanzan y dan pista/retorno reales',async()=>{
 const{c,w,def}=await context(id,{choices:[8]});await def.onEnter(c);
 const reached=new Set([`${w.player.x},${w.player.y}`]),queue=[[w.player.x,w.player.y]];
 while(queue.length){const[x,y]=queue.shift();for(const[d,dx,dy]of[[2,0,1],[4,-1,0],[6,1,0],[8,0,-1]]){const k=`${x+dx},${y+dy}`;if(!reached.has(k)&&w.player.passable(x,y,d)){reached.add(k);queue.push([x+dx,y+dy]);}}}
 for(const e of w.events.filter(e=>e.page))assert.ok([[0,1],[0,-1],[1,0],[-1,0]].some(([dx,dy])=>reached.has(`${e.x+dx},${e.y+dy}`)),`${id}: ${e.id}`);
 if(SITES[id].quest)await runEvent(c,'dlc2_pista');if(SITES[id].quest?.startsWith('ultra_'))await runEvent(c,'dlc2_regla');
 await runEvent(c,'dlc2_regreso');assert.equal(c.log.warps.at(-1).mapId,SITES[id].returnTo.map);
});
for(const q of['cobalion','virizion'])test('B24: '+q+' acompaña a los tres rescatados andando y conserva su posición al volver',async()=>{
 const id=q==='cobalion'?'b24_canteria_justicia':'b24_claro_justicia';const{c,w,def}=await context(id);
 for(let i=0;i<3;i++)await runEvent(c,`dlc2_justicia_${i}`);assert.equal(c.moves.length,3);assert.ok(c.flag(`dlc2_${q}_prueba`));
 await def.onEnter(c);for(let i=0;i<3;i++){const e=w.events.find(e=>e.id===`${q==='cobalion'?'dlc2_timburr':'dlc2_justicia'}_${i}`);assert.deepEqual([e.x,e.y],[11+i,18]);}
});
test('B24: Carbink recorre cada galería sin desaparecer, también con un guardado de etapa2',async()=>{const{c,w,def}=await context('b24_mina_diamante');for(let i=0;i<3;i++){await runEvent(c,'dlc2_carbink');assert.deepEqual([w.events.find(e=>e.id==='dlc2_carbink').x,w.events.find(e=>e.id==='dlc2_carbink').y],[13,16-i*4]);}assert.equal(c.moves.length,3);c.state.setVar('dlc2_diancie_escolta',2);await def.onEnter(c);assert.deepEqual([w.events.find(e=>e.id==='dlc2_carbink').x,w.events.find(e=>e.id==='dlc2_carbink').y],[13,12]);});

test('B24: apartarse del destino permite rescatar sin recolocar a Timburr ni marcar un camino bloqueado',async()=>{
 const {c,w}=await context('b24_canteria_justicia');const actor=w.events.find(e=>e.id==='dlc2_timburr_0');const before=[actor.x,actor.y];w.player.moveTo(11,18);
 await runEvent(c,'dlc2_justicia_0');assert.deepEqual([actor.x,actor.y],before);assert.deepEqual(c.var('dlc2_cobalion_rescates',[]),[]);
 w.player.moveTo(10,18);await runEvent(c,'dlc2_justicia_0');assert.deepEqual([actor.x,actor.y],[11,18]);assert.deepEqual(c.var('dlc2_cobalion_rescates'),[0]);
});

test('B24: Carbink espera si el jugador ocupa su destino después de vencer al Sableye',async()=>{
 const {c,w}=await context('b24_mina_diamante');const actor=w.events.find(e=>e.id==='dlc2_carbink');w.player.moveTo(13,16);
 await runEvent(c,'dlc2_carbink');assert.equal(c.var('dlc2_diancie_escolta',0),0);assert.deepEqual([actor.x,actor.y],[13,20]);
});

test('B24: Fortaleza permite empujar los tres contrapesos hasta sus bases sobre el mapa real',async()=>{
 const {c,w}=await context('b24_ultra_fortaleza');for(const [i,x,y,to] of [[0,8,16,10],[1,13,14,8],[2,18,16,10]]){
 for(let yy=y;yy>to;yy--){w.player.moveTo(x,yy+1);w.player.direction=8;await runEvent(c,`dlc2_peso_${i}`);assert.equal(c.var('dlc2_ultra_fortaleza_pesos')[i].y,yy-1);}}
 assert.ok(c.flag('dlc2_ultra_fortaleza_prueba'));
});

test('B24: un contrapeso no puede pisar el campamento; la palanca sigue recuperando el puzzle',async()=>{
 const{c,w}=await context('b24_ultra_fortaleza');const saved=[{x:16,y:20},{x:13,y:14},{x:18,y:16}];c.setVar('dlc2_ultra_fortaleza_pesos',saved);w.events.find(e=>e.id==='dlc2_peso_0').moveTo(16,20);w.player.moveTo(16,19);w.player.direction=2;
 await runEvent(c,'dlc2_peso_0');assert.deepEqual(c.var('dlc2_ultra_fortaleza_pesos'),saved);await runEvent(c,'dlc2_reinicio');assert.deepEqual(c.var('dlc2_ultra_fortaleza_pesos'),[{x:8,y:16},{x:13,y:14},{x:18,y:16}]);
});

test('B24: tras once Ultraentes la oscuridad de Necrozma es local al cráter y termina al capturarlo',async()=>{
 const{c,def}=await context('b24_crater_lucero');c.scene={darkness:null};await def.onEnter(c);assert.equal(c.scene.darkness,null);
 for(const sp of ULTRA_SPECIES)c.state.registerCaught(sp);await def.onEnter(c);assert.ok(c.scene.darkness?.amount>0);assert.ok(c.flag('dlc2_necrozma_crisis'));
 c.setFlag('dlc2_necrozma_capturado');await def.onEnter(c);assert.equal(c.scene.darkness,null);assert.equal(c.flag('dlc2_necrozma_crisis'),false);
});
test('B24: Registro entero activa, limita, pausa y vende provisiones con sus menús reales',async()=>{
 const{c}=await context('b24_aduana_vieja');let choices=[0,3,8];c.choice=async()=>choices.shift()??8;c.confirm=async()=>true;await openRegistry(c);assert.ok(c.state.var('dlc2_activas').length===1);
 choices=[6,0,1,7,8];let shop;c.ui.openShop=async o=>{shop=o;};await openRegistry(c);assert.deepEqual(c.state.var('dlc2_activas'),[]);assert.ok(shop.items.includes('BEASTBALL'));
});
