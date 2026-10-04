import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState, PARTY_MAX } from '../game/src/core/state.js';
import { createPokemon } from '../game/src/battle/core/pokemon.js';
import { MAPS } from '../game/src/content/maps/index.js';
import { db } from './battle_helpers.mjs';
import { F as B2 } from '../game/src/content/events/b02_common.js';
import { F as B1 } from '../game/src/content/events/b01_town_common.js';
import { F as B4 } from '../game/src/content/events/b04_common.js';
import { F as B9 } from '../game/src/content/events/b09a_common.js';
import { F as B13 } from '../game/src/content/events/b13_common.js';
globalThis.location ??= {search:''};
const {engine}=await import('../game/src/core/engine.js');
const {createContext}=await import('../game/src/script/context.js');

function filled({boxes=true}={}) {
  const s=GameState.create({name:'Ana'}), p=createPokemon(db,'PIKACHU',10,{rng:()=>0.5});
  s.setParty(Array.from({length:PARTY_MAX},()=>p));
  if(boxes)s.setBoxes(s.boxes.map(box=>box.map(()=>p)));
  s.data.clock.minutes=22*60;
  return s;
}
const count=(s,sp)=>[...s.party,...s.boxes.flat()].filter(p=>p?.species===sp).length;
const reload=s=>new GameState(JSON.parse(JSON.stringify(s.data)));
const active=(def,s)=>def.pages?(def.pages.findLast(p=>!p.when||p.when(s))||null):(!def.when||def.when(s)?def:null);

async function context(state,mapId,eventId) {
  const map=(await MAPS[mapId]()).default, event=map.events.find(e=>e.id===eventId);
  if(!event)throw new Error('Evento ausente: '+mapId+'/'+eventId);
  engine.state=state;engine.data=db;engine.audio=null;
  const actor=def=>({...def,moveTo(x,y){this.x=x;this.y=y;}});
  const world={map:{id:mapId},events:[],followers:[],player:actor({x:0,y:0}),requestRefresh(){},spawnEvent(def){const e=actor(def);this.events.push(e);return e;}};
  const scene={world,refreshFollower(){},runner:{wait:async()=>{}}};
  const ctx=createContext(scene,event),said=[],tablets=[];
  ctx.say=async t=>{said.push(String(t));};ctx.confirm=async()=>true;ctx.choice=async()=>0;
  for(const k of ['fade','flash','move','face','emote','approach','turnToPlayer'])ctx[k]=async()=>{};
  ctx.erase=()=>{};ctx.story={giveTablet:async id=>{tablets.push(id);},openClue:async()=>{}};
  return {ctx,event,map,said,tablets,run:async()=>{const p=active(event,state);if(p?.script)await p.script(ctx);}};
}

test('addPokemon sin capacidad no marca la Pokédex ni altera equipo/cajas', () => {
  const s=filled(),before=JSON.stringify(s.data),p=createPokemon(db,'MILCERY',15);
  assert.deepEqual(s.addPokemon(p),{where:'none'});
  assert.equal(JSON.stringify(s.data),before);
});

test('givePokemon devuelve null sin emitir éxito cuando no cabe; con un hueco lo envía al PC', async () => {
  const s=filled(),c=await context(s,'lumina_pasteleria','milcery');
  assert.equal(await c.ctx.givePokemon({species:'MILCERY',level:15}),null);
  assert.equal(count(s,'MILCERY'),0);assert.equal(s.data.dex.caught.MILCERY,undefined);
  s.setBoxPokemon(0,0,null);
  const p=await c.ctx.givePokemon({species:'MILCERY',level:15});
  assert.equal(p.species,'MILCERY');assert.equal(s.boxPokemon(0,0).uid,p.uid);assert.equal(s.data.dex.caught.MILCERY,true);
});

for(const [map,event,sp,flag,prepare]of[
  ['lumina_pasteleria','milcery','MILCERY',B9.milcery,()=>{}],
  ['lumina_trastos','tele_vieja','ROTOM',B9.rotom,()=>{}],
  ['estacion_talasa','nilo_regalo','PORYGON',B13.talPorygon,s=>{s.setFlag(B13.talDone);s.setFlag(B13.niloDeserted);}],
  ['ruinas_dintel','geodude','GEODUDE',B2.geodudeGift,s=>s.setFlag(B2.geodudeFree)],
])test(`regalo ${sp}: espera con PC lleno, persiste al cargar y se recoge una sola vez`, async()=>{
  let s=filled();prepare(s);
  await (await context(s,map,event)).run();
  assert.equal(s.flag(flag),false);assert.equal(count(s,sp),0);assert.equal(s.data.dex.caught[sp],undefined);
  s=reload(s);s.setBoxPokemon(0,0,null);
  await (await context(s,map,event)).run();
  assert.equal(s.flag(flag),true);assert.equal(count(s,sp),1);
  await (await context(s,map,event)).run();assert.equal(count(s,sp),1);
});

test('P2 termina su celebración y deja el inicial pendiente en Caudal hasta tener sitio', async()=>{
  let s=filled();s.setFlag(B4.restored);s.setVar('starter','TURTWIG');s.setVar('gael_starter','LITTEN');
  await (await context(s,'ciudad_caudal','b04_gracias_plaza')).run();
  assert.equal(s.flag(B4.thanks),true);assert.equal(s.flag(B4.starterGift),false);assert.equal(count(s,'SOBBLE'),0);
  s=reload(s);s.setBoxPokemon(0,0,null);
  const pending=await context(s,'ciudad_caudal','b04_gracias_plaza_inicial_pendiente');
  assert.ok(active(pending.event,s));await pending.run();
  assert.equal(s.flag(B4.starterGift),true);assert.equal(count(s,'SOBBLE'),1);assert.equal(active(pending.event,s),null);
});

test('T06 entrega la Tablilla y deja Eevee pendiente sin repetirla tras cargar', async()=>{
  let s=filled();s.setFlag(B9.t06Won);
  const first=await context(s,'lumina_museo_taller','carretilla');await first.run();
  assert.deepEqual(first.tablets,['IRONPLATE']);assert.equal(s.flag(B9.t06Done),true);assert.equal(s.flag(B9.eevee),false);
  assert.equal(count(s,'EEVEE'),0);assert.equal(s.data.dex.caught.EEVEE,undefined);
  s=reload(s);s.setBoxPokemon(0,0,null);
  const pending=await context(s,'lumina_museo_taller','carretilla');assert.ok(active(pending.event,s));await pending.run();
  assert.deepEqual(pending.tablets,[]);assert.equal(s.flag(B9.eevee),true);assert.equal(count(s,'EEVEE'),1);
  assert.equal(active(pending.event,s),null);
});

test('un fósil se conserva si no cabe el Pokémon; al recogerlo se consume exactamente uno', async()=>{
  let s=filled();s.data.clock.minutes=12*60;s.setFlag(B9.t06Done);s.addItem('SKULLFOSSIL',1);
  await (await context(s,'lumina_museo','paleontologo')).run();
  assert.equal(s.itemCount('SKULLFOSSIL'),1);assert.equal(s.flag(B9.skull),false);assert.equal(count(s,'CRANIDOS'),0);
  s=reload(s);s.setBoxPokemon(0,0,null);await (await context(s,'lumina_museo','paleontologo')).run();
  assert.equal(s.itemCount('SKULLFOSSIL'),0);assert.equal(s.flag(B9.skull),true);assert.equal(count(s,'CRANIDOS'),1);
  await (await context(s,'lumina_museo','paleontologo')).run();assert.equal(count(s,'CRANIDOS'),1);
});

test('el inicial no fija elecciones ni dispara la escena de Gael si no se puede entregar', async()=>{
  const s=filled();s.setFlag(B1.labIntro);
  await (await context(s,'laboratorio_alerce','bola_TURTWIG')).run();
  assert.equal(s.flag(B1.starter),false);assert.equal(s.var('starter',null),null);
  assert.equal(s.var('gael_starter',null),null);assert.equal(s.data.dex.caught.TURTWIG,undefined);
});

test('Cosmog espera sin consumir el rescate ni conceder piedras cuando no cabe, y luego va al PC', async()=>{
  let s=filled();
  for(const flag of ['game_cleared','b21_fin','dlc2_registro_abierto','dlc2_cosmog_confirmada'])s.setFlag(flag);
  s.setVar('dlc2_activas',['cosmog']);
  await (await context(s,'b24_crater_lucero','dlc2_rescate_cosmog')).run();
  assert.equal(s.flag('dlc2_cosmog_rescatado'),false);assert.equal(s.itemCount('SHINYSTONE'),0);assert.equal(s.data.dex.caught.COSMOG,undefined);
  s=reload(s);s.setBoxPokemon(0,0,null);await (await context(s,'b24_crater_lucero','dlc2_rescate_cosmog')).run();
  assert.equal(s.flag('dlc2_cosmog_rescatado'),true);assert.equal(count(s,'COSMOG'),1);assert.equal(s.itemCount('SHINYSTONE'),1);
  await (await context(s,'b24_crater_lucero','dlc2_rescate_cosmog')).run();assert.equal(count(s,'COSMOG'),1);assert.equal(s.itemCount('SHINYSTONE'),1);
});
