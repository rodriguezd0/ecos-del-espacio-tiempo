import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { createPokemon, healed } from '../game/src/battle/core/pokemon.js';
import { db as baseDb } from './battle_helpers.mjs';
import axisItems from '../game/data/items_axis.json' with { type: 'json' };
const db = { ...baseDb, items: { ...baseDb.items, ...axisItems } };
import { EXPEDITIONS, activate } from '../game/src/content/events/b24_registry.js';
import { reportImpostor, offerBerry, offerStar, collectManaphy, rescueCosmog, chooseIdeal, forgeIdeal, collectGear, repairMagearna, fieldAction, justiceAction, escortCarbink } from '../game/src/content/events/b24_actions.js';
import { observeStep } from '../game/src/content/events/b24_observers.js';
import { useItemOnPokemon, evolvedPokemon } from '../game/src/ui/logic/fieldItems.js';

export function fixture(id,map) {
 const state=GameState.create({name:'Expedición'});
 for(const f of ['game_cleared','b21_fin','dlc2_registro_abierto'])state.setFlag(f);
 for(const e of EXPEDITIONS.slice(0,12))state.setFlag(`dlc2_${e.id}_hallazgo`);
 state.setFlag(`dlc2_${id}_hallazgo`,false);activate(state,id);state.setFlag(`dlc2_${id}_indicio`);state.setFlag(`dlc2_${id}_confirmada`);
 state.setParty([createPokemon(db,'MEWTWO',90,{rng:()=>0.5})]);
 const ctx={state,db,map:{id:map},player:{},world:{},ui:{},said:[],choices:[],requests:[],
 say:async(t)=>ctx.said.push(t),choice:async()=>ctx.choices.length?ctx.choices.shift():0,confirm:async()=>true,
 flag:(k)=>state.flag(k),setFlag:(k,v)=>state.setFlag(k,v),var:(k,d)=>state.var(k,d),setVar:(k,v)=>state.setVar(k,v),
 giveItem:async(id,n=1)=>{if(db.items[id].pocket===8)state.addKeyItem(id);else state.addItem(id,n);},
 givePokemon:async(p)=>{const mon=createPokemon(db,p.species,p.level,{rng:()=>0.5});state.addPokemon(mon);return mon;},
 battle:async(r)=>{ctx.requests.push(r);return 'win';},heal:()=>state.setParty(state.party.map(p=>healed(db,p))),
 requestRefresh(){},se(){},flash:async()=>{},cry(){}};return ctx;
}
test('B24: Bidoof exige tres informes de rutas distintas, sin falsificar lugares',async()=>{
 const c=fixture('mew','ruta_1');await reportImpostor(c);await reportImpostor(c);assert.deepEqual(c.state.var('dlc2_mew_informes'),['ruta_1']);
 c.map.id='ruta_2';await reportImpostor(c);c.map.id='ciudad_nexo';await reportImpostor(c);c.map.id='ruta_4';await reportImpostor(c);assert.equal(c.state.var('dlc2_mew_informes').length,3);
});
test('B24: baya y estrella solo se gastan después de las condiciones y la confirmación',async()=>{
 const c=fixture('celebi','b24_santuario_neblino');c.state.addItem('ORANBERRY',2);await offerBerry(c);assert.equal(c.state.itemCount('ORANBERRY'),2);
 c.state.setVar('dlc2_celebi_sigilo',8);c.confirm=async()=>false;await offerBerry(c);assert.equal(c.state.itemCount('ORANBERRY'),2);
 c.confirm=async()=>true;await offerBerry(c);await offerBerry(c);assert.equal(c.state.itemCount('ORANBERRY'),1);assert.ok(c.state.flag('dlc2_celebi_baya'));
 const j=fixture('jirachi','mesa_vientos');j.state.addItem('STARPIECE',1);j.state.data.clock.minutes=12*60;await offerStar(j);assert.equal(j.state.itemCount('STARPIECE'),1);
 j.state.data.clock.minutes=23*60;await offerStar(j);await offerStar(j);assert.equal(j.state.itemCount('STARPIECE'),0);assert.ok(j.state.flag('dlc2_jirachi_estrella'));
});

test('B24: Celebi rechaza también la montura del50% aunque se monte después de los ocho pasos a pie',async()=>{
 const c=fixture('celebi','b24_santuario_neblino');c.state.setVar('dlc2_celebi_sigilo',8);c.state.addItem('ORANBERRY',1);c.world.zygMount={form:'50'};
 assert.equal(await offerBerry(c),false);assert.equal(c.state.itemCount('ORANBERRY'),1);assert.ok(!c.flag('dlc2_celebi_baya'));
 c.world.zygMount=null;assert.equal(await offerBerry(c),true);assert.equal(c.state.itemCount('ORANBERRY'),0);
});
test('B24: Manaphy es Huevo real, necesita Buceo y hueco; el equipo lleno conserva el encuentro',async()=>{
 const c=fixture('manaphy','b24_cuna_coral');await collectManaphy(c);assert.equal(c.state.party.length,1);
 c.state.setZygardeAbility('dive',true);c.state.setParty(Array.from({length:6},()=>createPokemon(db,'EEVEE',10)));await collectManaphy(c);assert.ok(!c.state.flag('dlc2_manaphy_hallazgo'));
 c.state.setParty(c.state.party.slice(0,5));await collectManaphy(c);const egg=c.state.party.at(-1);assert.equal(egg.species,'MANAPHY');assert.ok(egg.egg);assert.equal(egg.eggSteps,db.species.MANAPHY.hatchSteps);assert.ok(!c.state.data.dex.caught.MANAPHY);await collectManaphy(c);assert.equal(c.state.party.length,6);
});
test('B24: Cosmog rescatado una sola vez y piedras para evolución real',async()=>{
 const c=fixture('cosmog','b24_crater_lucero');await rescueCosmog(c);await rescueCosmog(c);assert.equal(c.state.party.filter(p=>p.species==='COSMOG').length,1);assert.ok(c.state.hasItem('SHINYSTONE'));assert.ok(c.state.hasItem('DUSKSTONE'));
 let p=c.state.party.find(p=>p.species==='COSMOG');for(let n=0;n<3;n++){const r=useItemOnPokemon(db,'RARECANDY',p);assert.ok(r.ok);p=r.evolveTo?evolvedPokemon(db,r.pokemon,r.evolveTo).pokemon:r.pokemon;}assert.equal(p.species,'COSMOEM');assert.equal(p.level,43);
 for(const [item,target]of[['SHINYSTONE','SOLGALEO'],['DUSKSTONE','LUNALA']]){const r=useItemOnPokemon(db,item,p);assert.ok(r.ok);assert.equal(evolvedPokemon(db,r.pokemon,r.evolveTo).pokemon.species,target);}
});
test('B24: Piedra Crisol elige un ideal, se rompe y la forja permite el otro tras captura',async()=>{
 const c=fixture('ideales','b24_dos_ideales');await chooseIdeal(c);assert.equal(c.state.var('dlc2_ideales_elegido'),'RESHIRAM');assert.ok(!c.state.hasItem('CRUCIBLESTONE'));assert.ok(c.state.hasItem('CRUCIBLEFRAGMENTS'));
 c.map.id='volcan_tizon';await forgeIdeal(c);assert.ok(c.state.hasItem('CRUCIBLEFRAGMENTS'));
 c.state.setFlag('dlc2_reshiram_capturado');await forgeIdeal(c);assert.ok(c.state.hasItem('CRUCIBLESTONE'));assert.ok(!c.state.hasItem('CRUCIBLEFRAGMENTS'));
 c.map.id='b24_dos_ideales';await chooseIdeal(c);assert.equal(c.state.var('dlc2_ideales_elegido'),'ZEKROM');
});
test('B24: cinco engranajes de cinco lugares; repararlos consume las piezas y no repite regalos',async()=>{
 const c=fixture('magearna','ciudad_estrato');const places=['ciudad_estrato','estacion_talasa','villa_brontia','lumina_museo','nexo_astillero'];
 for(const map of places){c.map.id=map;await collectGear(c);await collectGear(c);}assert.equal(c.state.itemCount('ANCIENTGEAR'),5);
 c.map.id='lumina_trastos';await repairMagearna(c);assert.equal(c.state.itemCount('ANCIENTGEAR'),0);assert.ok(c.state.flag('dlc2_magearna_reparada'));await repairMagearna(c);assert.equal(c.state.itemCount('ANCIENTGEAR'),0);
});
test('B24: Agua→Fuego usa movimientos propios aprendidos; cancelación y 20 pasos no permiten activarlo',async()=>{
 const c=fixture('volcanion','b24_termas_tizon');c.state.setParty([createPokemon(db,'MEW',80,{moves:['SURF','EMBER']})]);await fieldAction(c,'water');assert.equal(c.state.var('dlc2_volcanion_agua_pasos'),20);
 for(let n=0;n<20;n++)observeStep(c.state,{mapId:c.map.id,x:13,y:15});await fieldAction(c,'fire');assert.ok(!c.state.flag('dlc2_volcanion_mecanismos'));
 await fieldAction(c,'water');await fieldAction(c,'fire');assert.ok(c.state.flag('dlc2_volcanion_mecanismos'));
});
test('B24: Danza Lluvia→Trueno, Canto y movimientos falsos/debilitados',async()=>{
 const c=fixture('zeraora','brontia_subestacion');c.state.setParty([createPokemon(db,'MEW',80,{moves:['RAINDANCE','THUNDER']})]);await fieldAction(c,'thunder');assert.ok(!c.state.flag('dlc2_zeraora_tormenta'));await fieldAction(c,'rain');await fieldAction(c,'thunder');assert.ok(c.state.flag('dlc2_zeraora_tormenta'));
 const before=JSON.stringify(c.state.data);await fieldAction(c,'__proto__');assert.equal(JSON.stringify(c.state.data),before);
});
test('B24: justicia pide tres acciones distintas y no cuenta dos veces el mismo rescate',async()=>{
 const c=fixture('terrakion','b24_cueva_dunas');for(const n of [0,0,1,2])await justiceAction(c,'terrakion',n);assert.deepEqual(c.state.var('dlc2_terrakion_rescates'),[0,1,2]);assert.ok(c.state.flag('dlc2_terrakion_prueba'));
});
test('B24: escolta Carbink tres combates; perder cura y no avanza la etapa',async()=>{
 const c=fixture('diancie','b24_mina_diamante');c.battle=async(r)=>{c.requests.push(r);return 'lose';};c.state.party[0].hp=1;await escortCarbink(c);assert.equal(c.state.var('dlc2_diancie_escolta',0),0);assert.equal(c.state.party[0].hp,healed(db,c.state.party[0]).hp);
 c.map.passable=()=>true;c.map.valid=(x,y)=>x>=0&&x<27&&y>=0&&y<25;const actor={id:'dlc2_carbink',x:13,y:20,map:c.map};c.world.events=[actor];
 c.move=async(id,route)=>{assert.equal(id,actor.id);for(const d of route){actor.x+=d==='left'?-1:d==='right'?1:0;actor.y+=d==='up'?-1:d==='down'?1:0;}};
 c.battle=async()=> 'win';for(let n=0;n<3;n++)await escortCarbink(c);assert.equal(c.state.var('dlc2_diancie_escolta'),3);assert.equal(c.requests[0].wild.species,'SABLEYE');assert.equal(c.requests[0].rules.canCatch,false);
});
