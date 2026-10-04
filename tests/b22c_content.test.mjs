import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { fieldCtx, fieldWorld, db } from './b18_helpers.mjs';
import { F, LEGENDS, available, gateFor } from '../game/src/content/events/b22c_common.js';
import { ramonHint, olvidoGift } from '../game/src/content/events/b22c_hints.js';
import { callRain, callSun, lightBrazier, takeRelic } from '../game/src/content/events/b22c_rituals.js';
import { fightLegend } from '../game/src/content/events/b22c_encounters.js';

const state=()=>{const s=GameState.create({name:'Prueba'});s.setFlag('game_cleared');s.setFlag('b21_fin');return s;};
const pokemon=(sp,moves=[])=>createPokemon(db,sp,80,{moves,rng:()=>0.5});
async function context(map='cerro_alba',s=state(),opts={}) { const t=await fieldWorld(map,{state:s});const c=fieldCtx(t,opts);c.db=db;return c; }

test('B22c: Ramón orienta a Lugia; Olvido entrega ceniza y repone una consumida sin duplicar regalos',async()=>{
 const c=await context('caleta_faro');c.state.setFlag('b21_fin',false);await ramonHint(c);await olvidoGift(c);
 assert.ok(!c.flag(F.ramon));assert.equal(c.state.itemCount('SACREDASH'),0);
 c.state.setFlag('b21_fin');await ramonHint(c);await ramonHint(c);assert.ok(c.flag(F.ramon));
 await olvidoGift(c);await olvidoGift(c);assert.equal(c.state.itemCount('SACREDASH'),1);
 c.state.removeItem('SACREDASH',1);await olvidoGift(c);assert.equal(c.state.itemCount('SACREDASH'),1);
});

test('B22c: reliquias se recogen solo una vez en sus lugares naturales y se conservan al cargar',async()=>{
 const c=await context('antea_2_antea');
 for(const key of ['blue','dew']) {await takeRelic(c,key);await takeRelic(c,key);}
 assert.equal(c.state.itemCount('BLUEORB'),1);assert.equal(c.state.itemCount('SOULDEW'),1);
 const r=await context('mina_galena_honda',c.state);await takeRelic(r,'red');await takeRelic(r,'red');
 assert.equal(c.state.itemCount('REDORB'),1);const saved=new GameState(JSON.parse(JSON.stringify(c.state.data)));assert.equal(saved.itemCount('BLUEORB'),1);
});

test('B22c: Danza Lluvia exige prisma y movimiento del equipo en superficie; Día Soleado abre la veta',async()=>{
 const c=await context('mar_del_sur');c.state.setParty([pokemon('KYOGRE',['RAINDANCE'])]);
 await callRain(c);assert.ok(!c.flag(F.rain));c.state.addItem('BLUEORB',1);
 c.state.setParty([{...pokemon('KYOGRE',['RAINDANCE']),egg:true}]);await callRain(c);assert.ok(!c.flag(F.rain));
 c.state.setParty([pokemon('KYOGRE',['RAINDANCE'])]);await callRain(c);assert.ok(c.flag(F.rain));assert.equal(c.state.itemCount('BLUEORB'),1);
 const under=await context('fondo_mar_sur');under.state.addItem('BLUEORB',1);under.state.setParty([pokemon('KYOGRE',['RAINDANCE'])]);await callRain(under);assert.ok(!under.flag(F.rain));
 const sun=await context('tizon_cueva');sun.state.setParty([pokemon('GROUDON',['SUNNYDAY'])]);await callSun(sun);assert.ok(!sun.flag(F.sun));
 sun.state.addItem('REDORB',1);await callSun(sun);assert.ok(sun.flag(F.sun));assert.equal(sun.state.itemCount('REDORB'),1);
});

test('B22c: brasero exige Ceniza Sagrada al amanecer; cancelar y horas incorrectas no gastan ceniza',async()=>{
 const c=await context();c.state.addItem('SACREDASH',1);c.state.data.clock.minutes=12*60;
 await lightBrazier(c);assert.ok(!c.flag(F.brazier));assert.equal(c.state.itemCount('SACREDASH'),1);
 c.state.data.clock.minutes=6*60;const cancel=await context('cerro_alba',c.state,{confirms:[false]});await lightBrazier(cancel);assert.ok(!cancel.flag(F.brazier));assert.equal(c.state.itemCount('SACREDASH'),1);
 await lightBrazier(c);assert.ok(c.flag(F.brazier));assert.equal(c.state.itemCount('SACREDASH'),0);await lightBrazier(c);assert.equal(c.state.itemCount('SACREDASH'),0);
});

test('B22c: Rayquaza requiere ambos en equipo y tormenta; PC y huevos no sustituyen ese requisito',()=>{
 const s=state(), ky=pokemon('KYOGRE'),gr=pokemon('GROUDON');s.setBoxPokemon(0,0,ky);s.setParty([gr]);
 s.setVar('rest_storm_until',s.playTimeFrames+3600);assert.match(gateFor(s,'rayquaza'),/equipo/);
 s.setParty([{...ky,egg:true},gr]);assert.ok(gateFor(s,'rayquaza'));s.setParty([ky,gr]);assert.equal(gateFor(s,'rayquaza'),null);
 s.setVar('rest_storm_until',0);assert.match(gateFor(s,'rayquaza'),/tormenta/);
 assert.ok(LEGENDS.rayquaza.moves.includes('DRAGONASCENT'));
});

test('B22c: una reliquia equipada se debe retirar a la Mochila, también cuando el Pokémon está en el PC',async()=>{
 const s=state();s.setParty([{...pokemon('KYOGRE'),heldItem:'BLUEORB'}]);
 assert.match(gateFor(s,'kyogre'),/retira.*Mochila/i);
 s.setBoxPokemon(0,0,{...pokemon('GROUDON'),heldItem:'REDORB'});
 assert.match(gateFor(s,'groudon'),/retira.*Mochila/i);
 const c=await context('mar_del_sur',s);await callRain(c);assert.match(c.said.at(-1).text,/retira.*Mochila/i);
 s.addItem('BLUEORB',1);s.setFlag(F.rain);assert.equal(gateFor(s,'kyogre'),null);
});

test('B22c: captura normal, derrota segura sin dinero ni punto de cura perdido y KO conserva recompensa única',async()=>{
 const c=await context('cerro_alba',state(),{battles:['lose','win','caught']});c.state.setFlag(F.brazier);c.state.data.clock.minutes=7*60;
 const money=c.state.player.money,heal=c.state.healPoint;
 assert.equal(await fightLegend(c,'hooh'),'lose');assert.equal(c.log.heals,1);assert.equal(c.state.player.money,money);assert.deepEqual(c.state.healPoint,heal);
 assert.ok(available(c.state,'hooh'));assert.equal(await fightLegend(c,'hooh'),'beaten');assert.ok(!available(c.state,'hooh'));
 c.state.setVar('rest_count',1);assert.equal(await fightLegend(c,'hooh'),'caught');assert.ok(c.flag(LEGENDS.hooh.caught));
 const request=c.log.battles[0].request;assert.equal(request.noCoop,true);assert.equal(request.wild.level,75);assert.notEqual(request.rules.canCatch,false);assert.ok(request.rules.noMoneyLoss);
});
