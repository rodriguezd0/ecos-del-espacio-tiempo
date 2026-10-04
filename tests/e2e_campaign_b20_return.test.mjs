import test from 'node:test';
import assert from 'node:assert/strict';
import {runB20} from '../tools/e2e_campaign_b20.mjs';
import {returnToOrigen,restoredOrigenError,RESTORED_ORIGEN_FLAGS} from '../tools/e2e_campaign_b20_return.mjs';
import {CIELO,TERRAZA,NUCLEO,EXIT_STAND,tramoId} from '../game/src/content/maps/b20/layout.js';
import {findTravelPath} from '../tools/e2e_campaign_routes.mjs';
import {loadMapDefinition} from '../game/src/content/maps/index.js';

test('campaign B20: returning for Salto is an explicit stage, without the incomplete travel graph',async()=>{
 let steps;await runB20({page:{waitForFunction:async()=>{},evaluate:async()=>{}},liveTicker:true,
  stages:async(_,s)=>{steps=s;},travel:async()=>assert.fail('the graph has no cielo_arco or cielo_vuelta')});
 assert.equal(typeof steps.salto_listo,'function');
});

const flags=Object.fromEntries(RESTORED_ORIGEN_FLAGS.map(f=>[f,true]));

function model(map=tramoId(9)) {
 let state={map,x:EXIT_STAND.x,y:EXIT_STAND.y,ready:true,flags:structuredClone(flags)};
 const controls=[],d={settle:async()=>state,snapState:async()=>state,
  walkTo:async(x,y,opts)=>{
   controls.push(['walk',state.map,x,y]);
   state={...state,x,y};
   if(state.map==='cielo_interior') {state={...state,map:'terraza_ultimo_sello',...TERRAZA.arrive};assert.ok(opts.stopWhen(state));}
  },exitTo:async(dir,next)=>{assert.equal(dir,'up');controls.push(['exit',next]);state={...state,map:next,...CIELO.arrive};},
  until:async predicate=>assert.ok(predicate(state)),
  pushUntil:async(dir,predicate)=>{assert.equal(dir,'up');controls.push(['push','nucleo_origen']);state={...state,map:'nucleo_origen',...NUCLEO.arrive};assert.ok(predicate(state));},
  milestone:async(_,check)=>{const error=check(state);if(error)throw Error(error);},
  interact:async()=>assert.fail('no repeated core reward'),travel:async()=>assert.fail('no static travel graph')};
 return {d,controls,state:()=>state,set:s=>{state=s;}};
}

test('campaign B20: return from Senda through the opened event gate and all three real floors',async()=>{
 const f=model(),before=structuredClone(f.state().flags);await returnToOrigen(f.d);
 assert.deepEqual(f.controls,[['walk',tramoId(9),EXIT_STAND.x,EXIT_STAND.y],['exit','cielo_interior'],
  ['walk','cielo_interior',CIELO.gate.x,CIELO.gate.y],['walk','terraza_ultimo_sello',TERRAZA.door.x,TERRAZA.door.y+1],['push','nucleo_origen']]);
 assert.equal(f.state().map,'nucleo_origen');assert.deepEqual([f.state().x,f.state().y],[NUCLEO.arrive.x,NUCLEO.arrive.y]);
 assert.deepEqual(f.state().flags,before);
});

test('campaign B20: resume separately from Cielo, Terraza or the already reached core',async()=>{
 for(const [map,count] of [['cielo_interior',3],['terraza_ultimo_sello',2],['nucleo_origen',0]]) {
  const f=model(map);await returnToOrigen(f.d);assert.equal(f.controls.length,count);assert.equal(f.state().map,'nucleo_origen');
 }
});

test('campaign B20: reject incomplete progress and unrelated maps without moving or repeating rewards',async()=>{
 for(const flag of RESTORED_ORIGEN_FLAGS) {
  const f=model();f.set({...f.state(),flags:{...flags,[flag]:false}});
  assert.match(restoredOrigenError(f.state()),/regreso sin/);await assert.rejects(()=>returnToOrigen(f.d),/regreso sin/);assert.equal(f.controls.length,0);
 }
 const other=model('puerta_quince');assert.match(restoredOrigenError(other.state()),/desde otro mapa/);
 await assert.rejects(()=>returnToOrigen(other.d),/desde otro mapa/);assert.equal(other.controls.length,0);
});

test('campaign B20: reject a failed return and propagate an unrelated path error',async()=>{
 const f=model('terraza_ultimo_sello');f.d.pushUntil=async()=>{};
 await assert.rejects(()=>returnToOrigen(f.d),/no se llegó al núcleo/);
 const changed=model('terraza_ultimo_sello');changed.d.pushUntil=async()=>{changed.set({...changed.state(),flags:{}});};
 await assert.rejects(()=>returnToOrigen(changed.d),/regreso sin/);
 const error=Error('unrelated path failure'),broken=model();broken.d.walkTo=async()=>{throw error;};
 await assert.rejects(()=>returnToOrigen(broken.d),e=>e===error);
});

test('campaign B20: real registered event-gate geometry explains the missing generic route',async()=>{
 assert.equal(await findTravelPath(tramoId(9),'nucleo_origen',undefined,{flags}),null);
 const [senda,cielo,terraza]=await Promise.all([loadMapDefinition(tramoId(9)),loadMapDefinition('cielo_interior'),loadMapDefinition('terraza_ultimo_sello')]);
 assert.ok(senda.warps.some(w=>w.to==='cielo_interior'&&w.tx===CIELO.arrive.x&&w.ty===CIELO.arrive.y));
 assert.deepEqual(cielo.warps,[]);
 assert.ok(cielo.events.some(e=>e.id==='cielo_arco'&&e.x===CIELO.gate.x&&e.y===CIELO.gate.y));
 assert.ok(terraza.warps.some(w=>w.to==='nucleo_origen'&&w.x===TERRAZA.door.x&&w.y===TERRAZA.door.y&&w.tx===NUCLEO.arrive.x&&w.ty===NUCLEO.arrive.y));
});
