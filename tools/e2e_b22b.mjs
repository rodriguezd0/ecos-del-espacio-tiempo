// Nueve encuentros, condiciones, captura real, KO/descanso, derrota y retornos con teclas.
// node tools/e2e_b22b.mjs [--only=nubes|aves|bestias] [--base=http://localhost:8080]
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
import {Driver} from './e2e_b16_driver.mjs';
import {installB22bHelpers} from './e2e_b22b_page.mjs';
import {LEGENDS} from '../game/src/content/events/b22b_common.js';
import {LOCATIONS,SIGHTINGS,LAKE} from '../game/src/content/maps/b22b/layout.js';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const OUT=path.join(ROOT,'tools/cache/screens'); fs.mkdirSync(OUT,{recursive:true});
const arg=(k,d)=>process.argv.find((a)=>a.startsWith(`--${k}=`))?.split('=').slice(1).join('=')||d;
const BASE=arg('base','http://localhost:8080'), ONLY=arg('only','');
const flags=['b01_woke','b01_starter_chosen','b01_core_found','b01_dex_received','b01_left_town',
  'game_cleared','b21_fin','b21_creditos',...Array.from({length:10},(_,i)=>`p${i+1}_restored`)];
for(const id of ['b04','b05','b06','b07','b08','b09a','b13','b15','b16']){
  const mod=await import(`../game/src/content/events/${id}_common.js`);
  flags.push(...Object.values(mod.F||{}).filter((v)=>typeof v==='string'));
}
const fieldTeam=[['CHARIZARD',100,['FLAMETHROWER','ROCKSLIDE']],['LAPRAS',100,['SURF','ICEBEAM']]];

class LegendDriver extends Driver{
  constructor(...args){super(...args);this.carry=null;this.history=[];this.transcript=[];this.completed=[];this.logCursor=0;}
  snapState(){return this.eval(()=>({...window.__e2e.snap(),...window.__b22b.snap(),choices:window.__b22b.choices()}));}
  async save(){if(await this.eval(()=>Boolean(window.__b22b))){
    this.carry=await this.eval(()=>JSON.parse(JSON.stringify(window.__e2e.engine.state.data)));
    this.history=(await this.snapState()).battles;
    const log=await this.log();this.transcript.push(...log.slice(this.logCursor));this.logCursor=log.length;
  }}
  async checkpoint(){
    await this.save();
    fs.writeFileSync(path.join(OUT,`e2e_b22b_${ONLY||'all'}_checkpoint.json`),JSON.stringify({
      carry:this.carry,history:this.history,transcript:this.transcript,milestones:this.milestones,completed:this.completed,
    }));
  }
  async load(map,x,y,dir=8){
    if(this.loaded)await this.save();
    const savedFlags=Object.entries(this.carry?.flags||{}).filter(([,v])=>v).map(([k])=>k);
    const params=new URLSearchParams({debug:1,scene:'map',map,x,y,dir,noenc:1,party:'BLISSEY:100',
      fragments:10,core:1,zygarde:'run,ram,terrain,climb,swim,detect,dive,fly,rebuild,jump,anchor',zform:'complete',zcells:100,zcores:5,
      flags:[...new Set([...flags,...savedFlags])].join(','),vars:'rest_count:0'});
    await this.page.goto(`${BASE}/?${params}`,{waitUntil:'load'});
    await this.page.waitForFunction(()=>window.__map?.ready,null,{timeout:45000});
    await installB22bHelpers(this.page,{carry:this.carry,battles:this.history});this.loaded=true;
    this.logCursor=0;
    await this.settle();await this.turn(dir);
  }
  async talkEvent(id,opts){
    const ground=await this.eval((id)=>{
      const e=window.__map?.world?.events.find((e)=>e.id===id);
      return e?.overTrigger()?{x:e.x,y:e.y}:null;
    },id);
    if(ground)await this.walkTo(ground.x,ground.y);else await this.faceEvent(id);
    await this.interact(opts);
  }
  async team(team){await this.eval((team)=>window.__b22b.team(team),team);}
  async mode(mode){await this.eval((mode)=>window.__b22b.mode(mode),mode);}
  async captured(key){await this.milestone(`${key}_capturado`,(s)=>!s.flags[LEGENDS[key].caught]||!s.caught.includes(LEGENDS[key].species)?'captura no aplicada a la partida':null);}
  async catchWind(){
    await this.walkTo(25,27,{face:8});
    const before=(await this.log()).length;
    for(let n=0;n<160;n++){
      const at=await this.eval(()=>window.__e2e.eventPos('b22b_tornadus'));
      if(at?.x===25&&at.y===26){await this.interact();if((await this.log()).length>before)return;}
      await this.wait(80);
    }
    throw new Error('el vendaval no pasa junto al jugador');
  }
}
async function nubes(d){
  await d.load('meseta_impulso',25,27);
  await d.catchWind();await d.expectSaid(/Habla con Abril/,'pista requerida');
  await d.milestone('sin_pista',(s)=>s.battles.length?'se inició sin pista':null);
  await d.load('villa_brontia',25,23);await d.talkEvent('abril');
  await d.milestone('pistas_abril',(s)=>!s.flags.b22b_pista_tornadus||!s.flags.b22b_pista_zapdos?'faltan pistas de Abril':null);
  await d.load('meseta_impulso',25,27);await d.catchWind();await d.expectSaid(/Monta en Zygarde/,'montura requerida');
  await d.press('KeyE',300);await d.until((s)=>Boolean(s.mounted),{what:'montar con E'});
  await d.shot('vendaval_montado');await d.catchWind();await d.captured('tornadus');
  await d.load('cerro_plomo',14,24);await d.talkEvent('b22b_temblores_0');
  await d.milestone('landorus_espera',(s)=>s.active.includes('b22b_landorus')?'Landorus sin ambas capturas':null);
  await d.expectSaid(/capturar a Tornadus y a Thundurus/,'ambas capturas requeridas');
  await d.load('estrato_casa_galena',7,9);
  await d.milestone('pista_fermin',(s)=>!s.flags.b22b_pista_thundurus?'no entregó pista antes de ir a la Mina':null);
  await d.load('dunas_ceniza',35,26);await d.talkEvent('b22b_rayo_3');
  await d.milestone('rayos_en_orden',(s)=>(s.vars.b22b_rayos||0)!==0?'tercero saltó primeras marcas':null);
  for(let i=1;i<=3;i++)await d.talkEvent(`b22b_rayo_${i}`);
  await d.shot('tres_rayos');await d.talkEvent('b22b_thundurus');await d.captured('thundurus');
  await d.load('cerro_plomo',14,24);await d.talkEvent('b22b_landorus');await d.captured('landorus');
}
async function aves(d){
  if(!d.loaded){await d.load('villa_brontia',25,23);await d.talkEvent('abril');}
  await d.load('parque_eolico',23,9);await d.team([['BLISSEY',100,['SOFTBOILED','PSYCHIC']]]);
  const before=(await d.snapState()).battles.length;
  await d.talkEvent('b22b_zapdos');await d.expectSaid(/Ningún Pokémon despierto/,'movimiento propio requerido');
  await d.milestone('fulgurita_sin_movimiento',(s)=>s.flags[LEGENDS.zapdos.open]||s.battles.length!==before?'rompió sin movimiento':null);
  await d.team([['CHARIZARD',1,['ROCKSLIDE']]]);await d.mode('lose');
  const loss=await d.snapState();await d.talkEvent('b22b_zapdos');
  await d.milestone('zapdos_derrota_curada',(s)=>s.battles.at(-1)?.outcome!=='lose'||s.map!=='parque_eolico'||s.health.some((p)=>p.hp!==p.maxHP)||s.money!==loss.money||JSON.stringify(s.heal)!==JSON.stringify(loss.heal)||s.flags.b22b_zapdos_capturado?'derrota insegura o falsa':null);
  await d.mode('ko');await d.team([['RHYPERIOR',100,['SMACKDOWN']]]);await d.talkEvent('b22b_zapdos');
  await d.milestone('zapdos_ko',(s)=>s.battles.at(-1)?.outcome!=='win'||s.vars.b22b_zapdos_descanso!==s.vars.rest_count||s.active.includes('b22b_zapdos')?'KO no espera descanso':null);
  const rest=(await d.snapState()).vars.rest_count;
  await d.load('brontia_posada',4,7);await d.talkEvent('posadero');
  await d.milestone('descanso_real',(s)=>!(s.vars.rest_count>rest)?'posada no incrementó descanso':null);
  await d.load('parque_eolico',23,9);await d.mode('capture');await d.talkEvent('b22b_zapdos');await d.captured('zapdos');
  await d.load('boreal_talleres',7,9);
  await d.milestone('pista_rosendo',(s)=>!s.flags.b22b_pista_articuno?'Rosendo no dio pista antes de ir a la Gruta':null);
  await d.load('gruta_escarcha_2',22,20);await d.talkEvent('b22b_lago_acceso');
  await d.milestone('lago_interior',(s)=>s.map!==LAKE.map?'no se entra al lago':null);
  await d.team(fieldTeam);await d.talkEvent('b22b_articuno');await d.captured('articuno');
  await d.walkTo(LAKE.exit.x,LAKE.exit.y,{stopWhen:(s)=>s.map!==LAKE.map});await d.settle();
  await d.milestone('retorno_escarcha',(s)=>s.map!==LAKE.return.map||s.x!==LAKE.return.x||s.y!==LAKE.return.y?'retorno incorrecto':null);
  await d.load('volcan_tizon',20,28);await d.talkEvent('brasa');
  await d.milestone('pista_brasa',(s)=>!s.flags.b22b_pista_moltres?'Brasa no dio pista':null);
  await d.load('tizon_crater',9,36);await d.team(fieldTeam);await d.talkEvent('b22b_moltres');await d.captured('moltres');
}
async function bestias(d){
  for(const key of ['raikou','entei','suicune']){
    for(const site of SIGHTINGS[key].slice(0,3)){
      if(d.carry?.vars[`b22b_${key}_avistamientos`]?.includes(site.id))continue;
      await d.load(site.map,site.x,site.y+1);
      await d.talkEvent(`b22b_avistamiento_${key}_${site.id}`);
      await d.milestone(`${key}_visto_${site.id}`,(s)=>!s.vars[`b22b_${key}_avistamientos`]?.includes(site.id)||s.active.includes(`b22b_avistamiento_${key}_${site.id}`)?'avistamiento no persistió':null);
    }
    const at=LOCATIONS[key];await d.load(at.map,at.x,at.y+1);
    if(!(await d.snapState()).flags[LEGENDS[key].caught]){await d.talkEvent(`b22b_${key}`);await d.captured(key);}
    if(key==='entei'){
      await d.walkTo(8,11,{face:2});await d.step(2);await d.settle();
      await d.milestone('retorno_canteria',(s)=>s.map!=='ruta_6'?'sin retorno de Cantería':null);
    }
  }
}

const CHROME=['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((f)=>fs.existsSync(f));
const browser=await chromium.launch({executablePath:CHROME,headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
const errors=[];let d;
try{
  const page=await browser.newPage({viewport:{width:1024,height:768}});
  page.on('pageerror',(e)=>errors.push(e.stack||e.message));
  page.on('response',(r)=>{if(r.status()>=400&&!r.url().includes('/favicon'))errors.push(`${r.status()} ${r.url()}`);});
  page.on('console',(m)=>{if(m.type()==='error')errors.push(m.text());});
  d=new LegendDriver(page,errors,{outDir:OUT,root:ROOT,prefix:`e2e_b22b_${ONLY||'all'}`});
  if(arg('resume',''))Object.assign(d,JSON.parse(fs.readFileSync(path.resolve(ROOT,arg('resume','')),'utf8')));
  for(const [name,run]of Object.entries({nubes,aves,bestias})){
    if((ONLY&&ONLY!==name)||d.completed.includes(name))continue;
    console.log(`— ${name}`);await run(d);d.completed.push(name);await d.checkpoint();
  }
  if(!ONLY)await d.milestone('nueve_capturas',(s)=>Object.values(LEGENDS).some((L)=>!s.flags[L.caught]||!s.caught.includes(L.species))||s.bag.MASTERBALL!==11?'faltan capturas o Balls no consumidas':null);
  if(errors.length)throw new Error(errors.join('\n'));
  console.log(`✔ B22b ${d.milestones.join(' → ')}`);
}catch(e){
  await d?.shot('fallo').catch(()=>{});
  const snap=await d?.snapState().catch(()=>null);
  if(snap)console.error(JSON.stringify({...snap,flags:Object.keys(snap.flags).filter((k)=>k.startsWith('b22')),cells:undefined}));
  if(errors.length)console.error(errors.join('\n'));console.error(e.stack||e.message);process.exitCode=1;
}finally{
  await d?.checkpoint().catch(()=>{});
  const result={ok:!process.exitCode,milestones:d?.milestones,battles:d?.history,errors};
  fs.writeFileSync(path.join(OUT,`e2e_b22b_${ONLY||'all'}_resultado.json`),JSON.stringify(result,null,2));
  fs.writeFileSync(path.join(OUT,`e2e_b22b_${ONLY||'all'}_dialogos.txt`),(d?.transcript||[]).map((l)=>`${l.speaker}: ${l.text}`).join('\n'));
  await browser.close();
}
