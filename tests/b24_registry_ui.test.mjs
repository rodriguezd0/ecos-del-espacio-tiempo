import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { activate, noteIndicio } from '../game/src/content/events/b24_registry.js';
import { confirmHypothesis, openRegistry } from '../game/src/content/events/b24_registry_ui.js';
const fixture=()=>{const state=GameState.create({name:'Axis'});for(const f of['game_cleared','b21_fin','dlc2_registro_abierto'])state.setFlag(f);const said=[];return{state,said,say:async(t)=>said.push(t),ui:{},setFlag:(f,v)=>state.setFlag(f,v)};};
test('B24: la hipótesis abre el mapa real en selección y acepta el placeId',async()=>{
  const c=fixture();activate(c.state,'mew');noteIndicio(c.state,'mew','ruta_1');let options;
  c.ui.openRegionMap=async(o)=>{options=o;return'ruta_1';};assert.equal(await confirmHypothesis(c,'mew'),'correct');assert.equal(options.mode,'select');assert.ok(c.state.flag('dlc2_mew_confirmada'));
});
test('B24: mapa equivocado y cancelación no gastan ni cambian progreso y ofrecen otra pista',async()=>{
  const c=fixture();activate(c.state,'mew');noteIndicio(c.state,'mew','ruta_1');const before=JSON.stringify(c.state.data);
  c.ui.openRegionMap=async()=> 'ciudad_lumina';assert.equal(await confirmHypothesis(c,'mew'),'wrong');assert.ok(c.said.some((t)=>/Bidoof/.test(t)));
  c.ui.openRegionMap=async()=>null;assert.equal(await confirmHypothesis(c,'mew'),'cancel');assert.equal(JSON.stringify(c.state.data),before);
});
test('B24: no abre el selector sin Indicio y no inicia el Registro antes del epílogo',async()=>{
  const c=fixture();activate(c.state,'mew');let opened=false;c.ui.openRegionMap=async()=>{opened=true;return'ruta_1';};
  assert.equal(await confirmHypothesis(c,'mew'),'indicio');assert.equal(opened,false);
  const s=GameState.create({name:'Axis'});await openRegistry({...c,state:s});assert.ok(!s.flag('dlc2_registro_abierto'));
});
test('B24: Sabela abre un Registro nuevo, presenta su oficio y salir no activa misiones',async()=>{
  const c=fixture();c.state.setFlag('dlc2_registro_abierto',false);c.choice=async()=>8;
  await openRegistry(c);assert.ok(c.state.flag('dlc2_registro_abierto'));assert.ok(c.said.some((t)=>/autoridad portuaria/.test(t)));assert.deepEqual(c.state.var('dlc2_activas',[]),[]);
});
