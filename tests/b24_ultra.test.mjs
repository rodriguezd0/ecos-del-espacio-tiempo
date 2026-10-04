import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { db } from './battle_helpers.mjs';
import { EXPEDITIONS, activate } from '../game/src/content/events/b24_registry.js';
import { ultraAction, pushCounterweight, resetFortress, counterweights, enterUltra } from '../game/src/content/events/b24_ultra.js';
function ctx(id){const state=GameState.create();for(const f of['game_cleared','b21_fin','dlc2_registro_abierto'])state.setFlag(f);for(const e of EXPEDITIONS.slice(0,12))state.setFlag(`dlc2_${e.id}_hallazgo`);activate(state,id);state.setFlag(`dlc2_${id}_confirmada`);state.setParty([createPokemon(db,'SOLGALEO',80)]);const warps=[];return{state,db,map:{id:'b24_'+id,valid:()=>true,passable:()=>true},player:{direction:8,x:8,y:17},world:{events:[]},event:{id:'dlc2_peso_0',moveTo(){}},warps,
 say:async()=>{},confirm:async()=>true,warp:async(...args)=>warps.push(args),requestRefresh(){},se(){},flag:k=>state.flag(k),setFlag:(k,v)=>state.setFlag(k,v),var:(k,d)=>state.var(k,d),setVar:(k,v)=>state.setVar(k,v)};}
test('B24: Cristal necesita orientar tres prismas; persistencia sin entrada falsa',async()=>{const c=ctx('ultra_cristal');await ultraAction(c,'ultra_cristal',0);await ultraAction(c,'ultra_cristal',1);assert.ok(!c.flag('dlc2_ultra_cristal_prueba'));await ultraAction(c,'ultra_cristal',1);assert.ok(c.flag('dlc2_ultra_cristal_prueba'));const before=JSON.stringify(c.state.data);await ultraAction(c,'__proto__',0);assert.equal(JSON.stringify(c.state.data),before);});
for(const[id,sequence]of[['ultra_tormenta',[2,0,1]],['ultra_abismo',[0,2,1]],['ultra_veneno',[0,1,2]]])test('B24: '+id+' exige su orden; equivocarse deja regresar y volver a empezar',async()=>{const c=ctx(id);await ultraAction(c,id,1);assert.ok(!c.flag(`dlc2_${id}_prueba`));for(const n of sequence)await ultraAction(c,id,n);assert.ok(c.flag(`dlc2_${id}_prueba`));});
for(const id of['ultra_selva','ultra_cielo'])test('B24: '+id+' requiere sus dos extremos, sin repetir el primero',async()=>{const c=ctx(id);await ultraAction(c,id,0);await ultraAction(c,id,0);assert.ok(!c.flag(`dlc2_${id}_prueba`));await ultraAction(c,id,1);assert.ok(c.flag(`dlc2_${id}_prueba`));});
test('B24: contrapesos se empujan físicamente; pared y otro peso bloquean sin perder estado',async()=>{const c=ctx('ultra_fortaleza');const before=counterweights(c.state);c.map.passable=()=>false;await pushCounterweight(c,0);assert.deepEqual(counterweights(c.state),before);c.map.passable=()=>true;await pushCounterweight(c,0);assert.equal(counterweights(c.state)[0].y,before[0].y-1);});
test('B24: palanca de Fortaleza recupera cualquier esquina antes de resolver y conserva lo resuelto',async()=>{const c=ctx('ultra_fortaleza');c.setVar('dlc2_ultra_fortaleza_pesos',[{x:3,y:3},{x:13,y:8},{x:23,y:3}]);await resetFortress(c);assert.deepEqual(counterweights(c.state),[{x:8,y:16},{x:13,y:14},{x:18,y:16}]);c.setVar('dlc2_ultra_fortaleza_pesos',[{x:8,y:10},{x:13,y:8},{x:18,y:10}]);await pushCounterweight(c,0);assert.ok(c.flag('dlc2_ultra_fortaleza_prueba'));await resetFortress(c);assert.deepEqual(counterweights(c.state),[{x:8,y:10},{x:13,y:8},{x:18,y:10}]);});
test('B24: viaje requiere propio Solgaleo/Lunala despierto; cancelar no viaja; retorno no depende de él',async()=>{const c=ctx('ultra_selva');c.map.id='b24_crater_lucero';c.state.party[0].hp=0;await enterUltra(c,'ultra_selva');assert.equal(c.warps.length,0);c.state.party[0].hp=1;c.confirm=async()=>false;await enterUltra(c,'ultra_selva');assert.equal(c.warps.length,0);c.confirm=async()=>true;await enterUltra(c,'ultra_selva');assert.deepEqual(c.warps[0],['b24_ultra_selva',13,22,8]);});

test('B24: una Ultrazona descubierta se puede volver a visitar después del Hallazgo',async()=>{
 const c=ctx('ultra_selva');c.map.id='b24_crater_lucero';c.setFlag('dlc2_ultra_selva_hallazgo');c.setVar('dlc2_activas',[]);
 assert.equal(await enterUltra(c,'ultra_selva'),true);assert.equal(c.warps[0][0],'b24_ultra_selva');
 c.setFlag('game_cleared',false);assert.equal(await enterUltra(c,'ultra_selva'),false);assert.equal(c.warps.length,1);
});

test('B24: una secuencia guardada corrupta no permite resolver omitiendo su primer conductor',async()=>{
 const c=ctx('ultra_tormenta');c.setVar('dlc2_ultra_tormenta_regla',[99,0,1]);await ultraAction(c,'ultra_tormenta',1);
 assert.ok(!c.flag('dlc2_ultra_tormenta_prueba'));assert.deepEqual(c.var('dlc2_ultra_tormenta_regla'),[]);
 for(const i of[2,0,1])await ultraAction(c,'ultra_tormenta',i);assert.ok(c.flag('dlc2_ultra_tormenta_prueba'));
});
