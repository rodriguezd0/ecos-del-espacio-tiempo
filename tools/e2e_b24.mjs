// Registro B24 en Chrome: hipótesis en MAPA real, condiciones de campo, capturas normales y retornos.
// node tools/e2e_b24.mjs [--only=registro|wave1|phione|wave2|wave3|wave4|finale|islandmap] [--resume=checkpoint.json]
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import{fileURLToPath}from 'node:url';
import{chromium}from 'playwright-core';import{Driver}from './e2e_b16_driver.mjs';import{installB24Helpers}from './e2e_b24_page.mjs';
import{EXPEDITIONS}from '../game/src/content/events/b24_registry.js';import{SITES}from '../game/src/content/maps/b24/sites.js';
import{ACCESS,GEAR_SITES}from '../game/src/content/events/b24_maps.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),OUT=path.join(ROOT,'tools/cache/screens');fs.mkdirSync(OUT,{recursive:true});
const arg=(k,d='')=>process.argv.find(a=>a.startsWith(`--${k}=`))?.split('=').slice(1).join('=')||d;
const BASE=arg('base','http://localhost:8080'),ONLY=arg('only'),RESUME=arg('resume'),PREFIX=arg('prefix','e2e_b24');
const flags=['game_cleared','b21_fin','b21_creditos','b01_woke','b01_starter_chosen','b01_core_found','b01_dex_received','b01_left_town',...Array.from({length:10},(_,i)=>`p${i+1}_restored`)];
for(const id of ['b02','b08','b09a','b09b','b10','b11','b13','b14','b15','b16','b18','b20']){const m=await import(`../game/src/content/events/${id}_common.js`);flags.push(...Object.values(m.F||{}).filter(f=>typeof f==='string'));}
class ExpeditionDriver extends Driver{
 constructor(...args){super(...args);this.carry=null;this.history=[];this.completed=[];this.selectPlace=null;this.selectParty=null;}
 snapState(){return this.eval(()=>({...window.__e2e.snap(),...window.__b24.snap(),choices:window.__b24.choices()}));}
 pickChoice(s,choose){if(this.want.length){const want=this.want[0],i=s.choices?.findIndex(t=>t.toLowerCase().startsWith(want.toLowerCase()));if(i>=0){this.want.shift();return i;}}return super.pickChoice(s,choose);}
 async checkpoint(){this.carry=await this.eval(()=>JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));this.history=(await this.snapState()).battles;fs.writeFileSync(path.join(OUT,`${this.prefix}_checkpoint.json`),JSON.stringify({state:this.carry,battles:this.history,completed:this.completed,milestones:this.milestones}));}
 async milestone(name,check){const s=await super.milestone(name,check);await this.checkpoint();return s;}
 async load(map,x=13,y=22,dir=8){
  if(this.loaded){await this.checkpoint();}
  const carried=Object.entries(this.carry?.flags||{}).filter(([,v])=>v).map(([k])=>k);
  const params=new URLSearchParams({debug:1,scene:'map',map,x,y,dir,noenc:1,party:'MEWTWO:100',core:1,fragments:10,zform:'complete',zcells:100,zcores:5,
   zygarde:'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor',flags:[...new Set([...flags,...carried])].join(',')});
  await this.page.goto(`${BASE}/?${params}`,{waitUntil:'load'});await this.page.waitForFunction(()=>window.__map?.ready,null,{timeout:45000});
  await installB24Helpers(this.page,{carry:this.carry,battles:this.history});this.loaded=true;await this.settle();await this.turn(dir);
 }
 async settle(opts={}){
  const end=Date.now()+(opts.timeout||300000);let calm=0,stuck=0;
  while(Date.now()<end){const s=await this.snapState();
   if(s.top==='PartyScene'&&this.selectParty){const i=s.party.findIndex(p=>p.species===this.selectParty&&!p.egg);if(i<0)throw new Error('Equipo sin '+this.selectParty);if(s.partyIndex===i){await this.press('KeyZ');this.selectParty=null;}else await this.press(s.partyIndex<i?'ArrowRight':'ArrowLeft');continue;}
   if(s.top==='RegionMapScene'&&s.region&&this.selectPlace){
    const p=s.region.places.find(p=>p.id===this.selectPlace);if(!p)throw new Error('Lugar ausente '+this.selectPlace);
    for(let guard=0;guard<80;guard++){const now=(await this.snapState()).region;if(now.x===p.x&&now.y===p.y){await this.shot('hipotesis_mapa');await this.press('KeyZ');this.selectPlace=null;break;}await this.press(now.x!==p.x?(now.x<p.x?'ArrowRight':'ArrowLeft'):(now.y<p.y?'ArrowDown':'ArrowUp'),160);}
    if(this.selectPlace)throw new Error('No se pudo marcar '+this.selectPlace);continue;
   }
   if(['MessageScene','VerseScene','TravelScene','ObtainScene','CaptionScene','PictureScene'].includes(s.top)){calm=0;stuck=0;await this.press('KeyZ',160);continue;}
   if(s.top==='ChoiceScene'){calm=0;const want=this.pickChoice(s,opts.choose);for(let i=s.choiceIndex;i<want;i++)await this.press('ArrowDown',120);for(let i=s.choiceIndex;i>want;i--)await this.press('ArrowUp',120);await this.press('KeyZ',250);continue;}
   if(s.top==='MapScene'&&s.ready&&!s.busy&&!s.playerBusy){if(++calm>=4)return s;}else calm=0;
   if(!['MapScene','BattleScene','BattleTransitionScene'].includes(s.top)&&++stuck>20){stuck=0;await this.press('KeyZ',200);}
   await this.wait(150);
  }throw new Error('Mapa ocupado: '+JSON.stringify(await this.snapState()));
 }
 async talkEvent(id){const under=await this.eval(id=>window.__map.world.events.find(e=>e.id===id)?.overTrigger(),id);if(under){const pos=await this.eval(id=>window.__e2e.eventPos(id),id);await this.walkTo(pos.x,pos.y);}else await this.faceEvent(id);return this.interact();}
 async prepare(id,map,x=13,y=22){await this.load(map,x,y);await this.eval(id=>window.__b24.quest(id),id);await this.checkpoint();}
 async mode(mode){await this.eval(m=>window.__b24.mode(m),mode);}
 async use(item,species){this.selectParty=species;await this.eval(id=>window.__b24.use(id),item);await this.settle();}
 async wild(species,mode='win'){await this.mode(mode);await this.eval(species=>{void window.__b24.wild(species);},species);await this.settle();}
 async captured(species){await this.milestone(species.toLowerCase()+'_captura',s=>!s.flags[`dlc2_${species.toLowerCase()}_capturado`]||!s.caught.includes(species)||!s.battles.some(b=>b.species===species&&b.outcome==='caught')?'falta captura normal':null);}
 async exit(id){const S=SITES[id];await this.walkTo(13,22);await this.exitTo('down',S.returnTo.map);await this.milestone(id+'_regreso',s=>s.map!==S.returnTo.map?'retorno incorrecto':null);}
 async enter(id){const A=ACCESS[id],R=SITES[id].returnTo;await this.prepare(SITES[id].quest,A.map,R.x,R.y);await this.talkEvent(`dlc2_acceso_${SITES[id].quest}`);await this.milestone(id+'_entrada',s=>s.map!==id?'no entró':null);}
 async island(id){await this.prepare(SITES[id].quest,'ciudad_nexo',26,39);this.want.push(id==='b24_isla_petalo'?'Isla Pétalo':'Isla Estandarte');await this.talkEvent('marinero_ferri');await this.milestone(id+'_ferri',s=>s.map!==id?'no llegó por el ferri':null);}
 async rest(){this.want.push('Descansar','Mañana');await this.talkEvent('dlc2_campamento');await this.milestone('descanso_real',s=>!(s.vars.rest_count>0)?'sin descanso':null);}
}
async function registro(d){
 await d.load('ciudad_nexo',38,31);await d.talkEvent('puerta_aduana');
 d.want.push('Anomalías','El impostor','Sí','Salir');await d.talkEvent('dlc2_sabela');await d.milestone('sabela_rumor',s=>s.quests[0]!=='mew'||!s.flags.dlc2_mew_rumor?'no abrió Rumor':null);
 for(const[map,x,y]of[['ruta_1',8,17],['ruta_2',27,33],['ruta_4',9,20]]){await d.load(map,x,y);await d.talkEvent('dlc2_bidoof');}
 await d.milestone('tres_informes',s=>s.vars.dlc2_mew_informes.length!==3?'faltan informes distintos':null);
 await d.load('b24_aduana_vieja');const before=await d.snapState();d.selectPlace='ciudad_lumina';d.want.push('Activas','El impostor','Marcar','Salir');await d.talkEvent('dlc2_sabela');
 await d.milestone('error_gratuito',s=>s.money!==before.money||s.flags.dlc2_mew_confirmada?'hipótesis equivocada alteró recursos':null);
 d.selectPlace='ruta_1';d.want.push('Activas','El impostor','Marcar','Salir');await d.talkEvent('dlc2_sabela');await d.milestone('hipotesis_confirmada',s=>!s.flags.dlc2_mew_confirmada?'el MAPA no confirmó Ruta1':null);
 await d.load('ruta_1',8,17);await d.talkEvent('dlc2_mew');await d.captured('MEW');d.completed.push('registro');
}
async function islandmap(d){
 await d.load('b24_aduana_vieja');d.want.push('Sueños','Flores sobre el mar','Sí','Salir');await d.talkEvent('dlc2_sabela');
 await d.load('ciudad_nexo',26,39);await d.walkTo(26,40);await d.walkTo(26,39);await d.load('b24_aduana_vieja');d.selectPlace='isla_petalo';d.want.push('Activas','Flores sobre el mar','Marcar','Salir');await d.talkEvent('dlc2_sabela');
 await d.milestone('isla_petalo_hipotesis_real',s=>!s.flags.dlc2_shaymin_confirmada?'no confirmó Isla Pétalo':null);
 d.want.push('Ruinas','El estandarte','Sí','Salir');await d.talkEvent('dlc2_sabela');await d.load('ciudad_nexo',26,39);await d.walkTo(26,40);await d.walkTo(26,39);await d.load('b24_aduana_vieja');d.selectPlace='isla_estandarte';d.want.push('Activas','El estandarte','Marcar','Salir');await d.talkEvent('dlc2_sabela');
 await d.milestone('isla_estandarte_hipotesis_real',s=>!s.flags.dlc2_victini_confirmada?'no confirmó Isla Estandarte':null);d.completed.push('islandmap');
}
async function wave1(d){
 await d.enter('b24_santuario_neblino');await d.eval(()=>window.__e2e.engine.state.addItem('ORANBERRY',1));
 for(const[x,y]of[[11,20],[11,16],[13,16],[13,14]])await d.walkTo(x,y);await d.talkEvent('dlc2_celebi');await d.captured('CELEBI');await d.exit('b24_santuario_neblino');
 await d.prepare('jirachi','mesa_vientos',18,19);await d.eval(()=>{window.__b24.hour(22);window.__e2e.engine.state.addItem('STARPIECE',1);});await d.talkEvent('dlc2_jirachi');await d.captured('JIRACHI');
 await d.island('b24_isla_petalo');await d.mode('lose');const before=await d.snapState();await d.talkEvent('dlc2_shaymin');
 await d.milestone('derrota_real_segura',s=>s.money!==before.money||s.health.some(p=>p.hp!==p.maxHP)||!s.battles.some(b=>b.species==='SHAYMIN'&&b.outcome==='lose')?'derrota no recuperada':null);
 await d.eval(()=>window.__b24.combatTeam());await d.mode('win');await d.talkEvent('dlc2_shaymin');await d.milestone('ko_sin_hallazgo',s=>s.flags.dlc2_shaymin_hallazgo?'KO completó Hallazgo':null);
 await d.rest();await d.mode('capture');await d.talkEvent('dlc2_shaymin');await d.captured('SHAYMIN');await d.exit('b24_isla_petalo');await d.talkEvent('dlc2_florista');
 await d.island('b24_isla_estandarte');await d.talkEvent('dlc2_victini');await d.captured('VICTINI');await d.exit('b24_isla_estandarte');
 await d.enter('b24_cuna_coral');await d.talkEvent('dlc2_cuna');await d.milestone('manaphy_huevo_real',s=>!s.party.some(p=>p.species==='MANAPHY'&&p.egg&&p.eggSteps>0)?'no recibió Huevo real':null);await d.exit('b24_cuna_coral');d.completed.push('wave1');
}
async function wave2(d){
 for(const[id,species]of[['b24_canteria_justicia','COBALION'],['b24_cueva_dunas','TERRAKION'],['b24_claro_justicia','VIRIZION']]){await d.enter(id);for(let i=0;i<3;i++)await d.talkEvent('dlc2_justicia_'+i);await d.talkEvent('dlc2_'+species.toLowerCase());await d.captured(species);await d.exit(id);}
 await d.prepare('keldeo','garganta_albo',19,11);await d.eval(()=>window.__b24.capturedParty(['COBALION','TERRAKION','VIRIZION']));await d.talkEvent('dlc2_keldeo');await d.captured('KELDEO');
 await d.enter('b24_dos_ideales');await d.talkEvent('dlc2_crisol');await d.talkEvent('dlc2_reshiram');await d.captured('RESHIRAM');await d.exit('b24_dos_ideales');
 await d.load('volcan_tizon',22,20);await d.talkEvent('dlc2_forja_crisol');await d.load('b24_dos_ideales');await d.talkEvent('dlc2_crisol');await d.talkEvent('dlc2_zekrom');await d.captured('ZEKROM');await d.exit('b24_dos_ideales');
 await d.prepare('kyurem','gruta_escarcha_2',25,19);await d.eval(()=>window.__b24.capturedParty(['RESHIRAM','ZEKROM']));await d.talkEvent('dlc2_kyurem');await d.captured('KYUREM');
 await d.prepare('meloetta','aldea_mnemos',9,24);await d.eval(()=>{window.__b24.fieldTeam();window.__b24.hour(18);});await d.talkEvent('dlc2_meloetta');await d.captured('MELOETTA');
 for(const[map,a]of Object.entries(GEAR_SITES)){await d.prepare('magearna',map,a.x,a.y+1);await d.talkEvent('dlc2_engranaje');}
 await d.load('lumina_trastos',9,9);await d.talkEvent('dlc2_reparacion');await d.talkEvent('dlc2_magearna');await d.captured('MAGEARNA');
 await d.prepare('zeraora','brontia_subestacion',15,8);await d.eval(()=>window.__b24.fieldTeam());await d.talkEvent('dlc2_danza_lluvia');await d.talkEvent('dlc2_trueno');await d.talkEvent('dlc2_zeraora');await d.captured('ZERAORA');d.completed.push('wave2');
}
async function phione(d){
 await d.prepare('phione','b24_aduana_vieja',3,18);
 await d.page.keyboard.down('ShiftLeft');let loops=0;
 try{while((await d.snapState()).party.some(p=>p.species==='MANAPHY'&&p.egg)&&loops++<100){await d.walkTo(23,18);await d.walkTo(3,18);if(loops%10===0)console.log('  Manaphy: pasos pendientes '+(await d.snapState()).party.find(p=>p.species==='MANAPHY')?.eggSteps);}}finally{await d.page.keyboard.up('ShiftLeft');}
 await d.milestone('manaphy_eclosion_real',s=>!s.party.some(p=>p.species==='MANAPHY'&&!p.egg)?'el Huevo no eclosionó andando':null);
 await d.wild('DITTO','capture');await d.load('lumina_guarderia',9,6);
 for(const species of ['MANAPHY','DITTO']){d.selectParty=species;d.want.push('Dejar un Pokémon','Nada, gracias');await d.talkEvent('criadora');}
 await d.milestone('manaphy_ditto_guarderia',s=>s.daycare?.slots.filter(Boolean).length!==2?'faltan los progenitores depositados':null);
 await d.load('b24_aduana_vieja',3,18);await d.page.keyboard.down('ShiftLeft');loops=0;
 try{while(!(await d.snapState()).daycare?.eggReady&&loops++<130){await d.walkTo(23,18);await d.walkTo(3,18);}}finally{await d.page.keyboard.up('ShiftLeft');}
 await d.load('lumina_guarderia',9,6);d.want.push('Nada, gracias');await d.talkEvent('criadora');await d.walkTo(8,6);
 await d.milestone('phione_huevo_guarderia',s=>!s.party.some(p=>p.species==='PHIONE'&&p.egg)||!s.flags.dlc2_phione_hallazgo?'el Huevo real no completa el Registro':null);d.completed.push('phione');
}
async function wave3(d){
 await d.prepare('xerneas','ruta_14_reserva',24,23);let n=0;while(((await d.snapState()).vars.dlc2_xerneas_pasos||0)<300&&n++<200){await d.walkTo(22,23);await d.walkTo(26,23);if(n%10===0)console.log('  Reserva: pasos reales '+(await d.snapState()).vars.dlc2_xerneas_pasos);}await d.talkEvent('dlc2_xerneas');await d.captured('XERNEAS');
 await d.prepare('yveltal','sima_eje',18,16);await d.eval(()=>window.__b24.combatTeam());for(let i=0;i<10;i++){await d.wild('RATTATA');console.log('  Yveltal: victoria salvaje real '+(i+1)+'/10');}await d.milestone('yveltal_diez_victorias',s=>s.vars.dlc2_yveltal_racha!==10?'no registró diez victorias salvajes':null);await d.mode('capture');await d.load('calzada_rey',25,41);await d.talkEvent('dlc2_yveltal');await d.captured('YVELTAL');
 await d.enter('b24_mina_diamante');await d.mode('win');for(let i=0;i<3;i++)await d.talkEvent('dlc2_carbink');await d.mode('capture');await d.talkEvent('dlc2_diancie');await d.captured('DIANCIE');await d.exit('b24_mina_diamante');
 await d.enter('b24_termas_tizon');await d.eval(()=>window.__b24.fieldTeam());await d.talkEvent('dlc2_agua');await d.talkEvent('dlc2_fuego');await d.talkEvent('dlc2_volcanion');await d.captured('VOLCANION');await d.exit('b24_termas_tizon');
 await d.enter('b24_crater_lucero');await d.talkEvent('dlc2_rescate_cosmog');await d.milestone('cosmog_rescatado',s=>!s.caught.includes('COSMOG')||!s.flags.dlc2_cosmog_hallazgo?'rescate no aplicado':null);await d.exit('b24_crater_lucero');
 await d.prepare('soluna','cumbre_azur',16,18);await d.eval(()=>window.__e2e.engine.state.addItem('RARECANDY',3));for(let i=0;i<3;i++)await d.use('RARECANDY','COSMOG');await d.milestone('cosmoem_evolucion_real',s=>!s.party.some(p=>p.species==='COSMOEM'&&p.level===43)?'no evolucionó con los caramelos':null);
 await d.use('SHINYSTONE','COSMOEM');await d.milestone('solgaleo_piedra_real',s=>!s.party.some(p=>p.species==='SOLGALEO')?'la Piedra Día no produjo Solgaleo':null);
 await d.eval(()=>window.__b24.hour(22));await d.talkEvent('dlc2_lunala');await d.captured('LUNALA');d.completed.push('wave3');
}
async function wave4(d){
 const rules={ultra_cristal:[0,1,1],ultra_selva:[0,1],ultra_tormenta:[2,0,1],ultra_cielo:[0,1],ultra_abismo:[0,2,1],ultra_veneno:[0,1,2]};
 for(const[id,steps]of Object.entries(rules)){
  await d.prepare(id,'b24_crater_lucero');await d.eval(()=>window.__b24.capturedParty(['SOLGALEO']));await d.talkEvent('dlc2_portal_'+id);
  for(const i of steps)await d.talkEvent('dlc2_regla_'+i);for(const sp of SITES['b24_'+id].species){await d.talkEvent('dlc2_'+sp.toLowerCase());await d.captured(sp);}await d.exit('b24_'+id);
 }
 await d.prepare('ultra_fortaleza','b24_crater_lucero');await d.eval(()=>window.__b24.capturedParty(['SOLGALEO']));await d.talkEvent('dlc2_portal_ultra_fortaleza');
 for(const[i,x,y,padY]of[[0,8,16,10],[1,13,14,8],[2,18,16,10]]){for(let yy=y;yy>padY;yy--){await d.walkTo(x,yy+1,{face:8});await d.interact();}}
 for(const sp of ['STAKATAKA','BLACEPHALON']){await d.talkEvent('dlc2_'+sp.toLowerCase());await d.captured(sp);}await d.exit('b24_ultra_fortaleza');
 await finale(d);
}
async function finale(d){
 if(!d.loaded)await d.load('b24_crater_lucero');
 if(!(await d.snapState()).party.some(p=>p.species==='NAGANADEL')){await d.eval(()=>{window.__b24.capturedParty(['POIPOLE','SOLGALEO']);window.__e2e.engine.state.addItem('RARECANDY',1);});await d.use('RARECANDY','POIPOLE');}
 await d.milestone('naganadel_evolucion_real',s=>!s.party.some(p=>p.species==='NAGANADEL'&&p.level===50)?'Poipole no evolucionó al nivel50':null);
 // La recarga del fixture restaura el estado después de onEnter. Salir y entrar por
 // la puerta real permite comprobar la crisis con las capturas/evolución acumuladas.
 await d.exit('b24_crater_lucero');await d.talkEvent('dlc2_acceso_cosmog');await d.eval(()=>window.__b24.quest('necrozma'));
 await d.milestone('necrozma_crisis_local',s=>!s.flags.dlc2_necrozma_crisis||!s.darkness?'no activó oscuridad local':null);await d.talkEvent('dlc2_necrozma');await d.captured('NECROZMA');await d.milestone('necrozma_luz_restaurada',s=>s.flags.dlc2_necrozma_crisis||s.darkness?'la captura no restauró la luz':null);await d.exit('b24_crater_lucero');await d.milestone('registro_todos_hallazgos',s=>s.hallazgos!==EXPEDITIONS.length?'faltan expedientes: '+s.hallazgos+'/'+EXPEDITIONS.length:null);d.completed.push('wave4');
}
const chrome=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync),errors=[];
const browser=await chromium.launch({executablePath:chrome,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});let d;
try{const page=await browser.newPage({viewport:{width:1024,height:768}});page.on('pageerror',e=>errors.push(String(e.stack||e)));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 d=new ExpeditionDriver(page,errors,{root:ROOT,outDir:OUT,prefix:PREFIX});if(RESUME){const saved=JSON.parse(fs.readFileSync(RESUME,'utf8'));d.carry=saved.state;d.history=saved.battles;d.completed=saved.completed;d.milestones=saved.milestones;}
 for(const[name,fn]of Object.entries(ONLY==='islandmap'?{islandmap}:ONLY==='finale'?{finale}:{registro,wave1,phione,wave2,wave3,wave4})){if(ONLY&&ONLY!==name||d.completed.includes(name))continue;await fn(d);await d.checkpoint();}
 assert.deepEqual(errors,[],'sin errores de página ni recursos');console.log('B24 Chrome: '+d.completed.join(', '));
}catch(e){await d?.checkpoint().catch(()=>{});await d?.shot('fallo').catch(()=>{});throw e;}finally{await browser.close();}
