import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB13Observer} from './e2e_campaign_b13_page.mjs?shore=5';
import {Driver as SeaDriver} from './e2e_b13_driver.mjs';
import {mar,talasaArrival,talasa,caleta,swimAcross} from './e2e_b13_steps.mjs';
import {buceo,lumbre,tizon} from './e2e_b13_islands.mjs';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import {collectWaterCells} from './e2e_campaign_cells.mjs?shore=5';
import {collectEasternSea,returnToCaleta} from './e2e_campaign_sea.mjs';
import {POND} from '../game/src/content/maps/b10/mnemos_layout.js';
import {PILOTES} from '../game/src/content/maps/b13/talasa_pilotes.js';
import {probeC065,recoverC065ByDive} from './e2e_campaign_sea_probe.mjs?reentry=2';

/** Reanuda el regreso si la célula ya quedó recogida antes de una pausa en el islote. */
export async function recoverMnemosIslet(d) {
 const s=await d.snap();
 if(s.map!=='aldea_mnemos'||s.x!==POND.islet.x||s.y!==POND.islet.y)return;
 await d.swimTo(POND.islet.x,POND.y-1); await d.settle();
 await d.milestone('mnemos_regreso_islote',s=>!s.surfing&&s.x===POND.islet.x&&s.y===POND.y-1?null:'no regresó a la orilla');
}

/** Las derrotas de los técnicos curan en Caleta: se vuelve nadando, conservando todo lo obtenido. */
export function talasaResultError(s) {
 if(!['b13_talasa','b13_talasa_n4','zyg_core_4','b13_nilo_porygon'].every(k=>s.flags[k]))return 'salida o N4/Porygon incompletos';
 if(!s.party.some(p=>p.startsWith('PORYGON:40'))||s.hour<19)return 'regalo u hora de salida distintos';
 if(![TAL.CELLS.c059.key,TAL.CELLS.c060.key].every(k=>s.cells.includes(k)))return 'faltan células de Talasa';
 if(!s.battles.some(b=>['b13_casia','b13_garrido'].every(t=>b.trainers?.includes(t))&&b.format==='double'&&b.ally==='Alerce'&&b.phases===1&&b.outcome==='win'))return 'falta victoria doble real con Alerce';
 return null;
}
export async function completeTalasa(d,{run=talasa}={}) {
 if((await d.snap()).flags?.b13_talasa_n4) {
  await d.milestone('talasa_salida',talasaResultError);return;
 }
 for(let attempt=0;attempt<3;attempt++) {
  const position=await d.snap();
  if(position.map==='caleta_centro')await d.talk('enfermera');
  if(['caleta_centro','caleta_sonda'].includes(position.map)) {
   await d.travel('caleta_sonda');
   await swimAcross(d,CL.DIVERS.resonance.x+8,31,'down','mar_del_sur');
  }
  if((await d.snap()).map==='mar_del_sur') {
   const link=MAR.LINKS.south.find(l=>l.to==='estacion_talasa');
   await swimAcross(d,link.offset+TAL.JETTY.x+1,MAR.H-1,'down','estacion_talasa');
   await d.swimTo(TAL.JETTY.x+1,TAL.JETTY.y);await d.settle();
  }
  const before=await d.snap();
  const battlesBefore=before.battles.length;
  try {await run(d,{retry:false});await d.milestone('talasa_salida',talasaResultError);return;}
  catch(error) {
   const after=await d.snap();
   if(after.battles.length<=battlesBefore||after.battles.at(-1)?.outcome!=='lose'||!d.whiteout(before,after))throw error;
   console.log('DERROTA REAL en Talasa: regreso desde Caleta por el mar y reintento.');
  }
 }
 throw Error('Tres derrotas reales en Talasa; hace falta preparar el equipo.');
}

/** Reconoce el regreso al Centro tras una derrota; una recogida real no se repite ni se sustituye. */
export async function completePilotesTrip(d) {
 let s=await d.snap();
 if(s.map==='caleta_centro') {await d.talk('enfermera');await d.travel('caleta_sonda');s=await d.snap();}
 if(s.map==='caleta_sonda'&&s.cells.includes(PILOTES.cell.key)&&s.flags.b13_dive_resonance&&s.flags.b13_t11_ramon) {
  await d.milestone('pilotes_regreso_cura',s=>s.map==='caleta_sonda'&&s.cells.includes(PILOTES.cell.key)?null:'no regresó con C087');return;
 }
 if(s.map==='caleta_sonda') {
  await d.travel('caleta_centro');await d.talk('enfermera');await d.travel('caleta_sonda');
  const r=CL.DIVERS.resonance;
  await swimAcross(d,r.x+8,31,'down','mar_del_sur');
 }
 if((await d.snap()).map==='mar_del_sur') {
  const link=MAR.LINKS.south.find(l=>l.to==='estacion_talasa');
  await swimAcross(d,link.offset+TAL.JETTY.x+1,MAR.H-1,'down','estacion_talasa');
  await d.swimTo(TAL.JETTY.x+1,TAL.JETTY.y);
 }
 await buceo(d);await caleta(d);
}

/** Una derrota nueva en Tizón permite curarse y volver por los enlaces del mar, con los puzles guardados. */
export async function completeTizon(d,{run=tizon}={}) {
 for(let attempt=0;attempt<3;attempt++) {
  const position=await d.snap();
  if(position.map==='caleta_centro')await d.talk('enfermera');
  if(['caleta_centro','caleta_sonda'].includes(position.map)) {
   await d.travel('caleta_sonda');
   await swimAcross(d,CL.DIVERS.resonance.x+8,31,'down','mar_del_sur');
  }
  if((await d.snap()).map==='mar_del_sur')await d.swimTo(MAR.CELLS.c066.x,MAR.CELLS.c066.y);
  const before=await d.snap(),battlesBefore=before.battles.length;
  try {await run(d,{retry:false});return;}
  catch(error) {
   const after=await d.snap();
   if(after.battles.length<=battlesBefore||after.battles.at(-1)?.outcome!=='lose'||!d.whiteout(before,after))throw error;
   console.log('DERROTA REAL en Tizón: cura y regreso desde Caleta por el mar.');
  }
 }
 throw Error('Tres derrotas reales en Tizón; hace falta preparar el equipo.');
}
export async function runB13(d){
 await refreshDriver(d); await installB13Observer(d.page);
 d.snapState=()=>d.eval(()=>({...window.__campaign.snap(),party:window.__b13.party()}));
 for(const method of ['walkTo','startSwim','swimTo','tap','quickPos','expectNotSaid'])d[method]=SeaDriver.prototype[method];
 await d.stages('B13',{regresos:async d=>{await recoverMnemosIslet(d);await collectWaterCells(d,[
  'cell_zaguan_3','cell_caudal_2','cell_garganta_4','cell_ruta_4_3',
  'cell_reserva_2','cell_marisma_2','cell_mnemos_2','cell_nexo_1',
 ]);},preparar:async d=>{
  await d.travel('caleta_centro');await d.talk('enfermera');
  const s=await d.snap();if(s.partyList.length===6){
   const reserve=s.pokemon.filter(p=>!['TORTERRA','GROTLE','TURTWIG','ROTOM'].includes(p.species)).sort((a,b)=>a.level-b.level)[0];
   await d.depositAtPC(reserve.species);
  }
  await d.travel('caleta_sonda');
 },mar,talasaArrival,talasa:completeTalasa,caleta,
 buceo:completePilotesTrip,lumbre,marEste:async d=>{await recoverC065ByDive(d);await probeC065(d);await collectEasternSea(d);},tizon:completeTizon,regresoCosta:returnToCaleta});
 for(const method of ['walkTo','startSwim','swimTo','tap','quickPos','expectNotSaid','snapState'])delete d[method];
}
