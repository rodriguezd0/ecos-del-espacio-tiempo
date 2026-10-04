import test from 'node:test';import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { withB24Events, enterExpedition, ACCESS } from '../game/src/content/events/b24_maps.js';
import { expedition } from '../game/src/content/events/b24_registry.js';
test('B24: los decoradores conservan campaña y no abren Aduana antes del postgame',async()=>{let original=0;const old={id:'puerta_aduana',x:38,y:30,script:async()=>original++};const s=GameState.create(),warps=[];const c={state:s,map:{id:'ciudad_nexo'},say:async()=>{},confirm:async()=>true,warp:async(...a)=>warps.push(a)};const out=withB24Events('ciudad_nexo',[old]);assert.notEqual(out,[old]);await out[0].script(c);assert.equal(original,1);assert.equal(warps.length,0);s.setFlag('game_cleared');s.setFlag('b21_fin');await out[0].script(c);assert.deepEqual(warps[0],['b24_aduana_vieja',13,22,8]);});
test('B24: acceso sin hipótesis ofrece pista; vuelta a un lugar descubierto no depende de activas',async()=>{const S=ACCESS.b24_mina_diamante,s=GameState.create(),warps=[];for(const f of['game_cleared','b21_fin','dlc2_registro_abierto'])s.setFlag(f);const c={state:s,map:{id:S.map},say:async()=>{},confirm:async()=>true,warp:async(...a)=>warps.push(a)};await enterExpedition(c,'b24_mina_diamante');assert.equal(warps.length,0);s.setFlag('dlc2_diancie_confirmada');s.setFlag('dlc2_diancie_hallazgo');await enterExpedition(c,'b24_mina_diamante');assert.equal(warps[0][0],'b24_mina_diamante');});

test('B24: el canto de Meloetta está en el camino de bambú de Mnemos y la hipótesis apunta allí',()=>{
 assert.equal(expedition('meloetta').place,'aldea_mnemos');assert.ok(expedition('meloetta').maps.includes('aldea_mnemos'));
 assert.ok(withB24Events('aldea_mnemos',[]).some(e=>e.id==='dlc2_meloetta'));assert.ok(!withB24Events('ruta_9_neblino',[]).some(e=>e.id==='dlc2_meloetta'));
});

test('B24: las hipótesis de las islas señalan la isla; Nexo sigue ofreciendo el Indicio antes de embarcar',()=>{
 for(const[id,place]of[['shaymin','isla_petalo'],['victini','isla_estandarte']]){assert.equal(expedition(id).place,place);assert.ok(expedition(id).maps.includes('ciudad_nexo'));}
});
