import {refreshDriver} from './e2e_campaign_refresh.mjs';
import {installB13Observer} from './e2e_campaign_b13_page.mjs';
import {Driver as SeaDriver} from './e2e_b13_driver.mjs';
import {mar,talasaArrival,talasa,caleta,swimAcross} from './e2e_b13_steps.mjs';
import {buceo,lumbre,tizon} from './e2e_b13_islands.mjs';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import * as TAL from '../game/src/content/maps/b13/talasa_layout.js';
import * as CL from '../game/src/content/maps/b09b/caleta_layout.js';
import {collectWaterCells} from './e2e_campaign_cells.mjs';
import {collectEasternSea} from './e2e_campaign_sea.mjs';
export async function runB13(d){
 await refreshDriver(d); await installB13Observer(d.page);
 d.snapState=()=>d.eval(()=>({...window.__campaign.snap(),party:window.__b13.party()}));
 for(const method of ['walkTo','startSwim','swimTo','tap','quickPos','expectNotSaid'])d[method]=SeaDriver.prototype[method];
 await d.stages('B13',{regresos:async d=>collectWaterCells(d,[
  'cell_zaguan_3','cell_caudal_2','cell_garganta_4','cell_ruta_4_3',
  'cell_reserva_2','cell_marisma_2','cell_mnemos_2','cell_nexo_1',
 ]),preparar:async d=>{
  await d.travel('caleta_centro');await d.talk('enfermera');
  const s=await d.snap();if(s.partyList.length===6){
   const reserve=s.pokemon.filter(p=>!['TORTERRA','GROTLE','TURTWIG','ROTOM'].includes(p.species)).sort((a,b)=>a.level-b.level)[0];
   await d.depositAtPC(reserve.species);
  }
  await d.travel('caleta_sonda');
 },mar,talasaArrival,talasa:d=>talasa(d,{retry:false}),caleta,
 buceo:async d=>{
  const r=CL.DIVERS.resonance;
  await d.walkTo(r.x,r.y,{face:'down'});await d.interact();
  await swimAcross(d,r.x+8,31,'down','mar_del_sur');
  const link=MAR.LINKS.south.find(l=>l.to==='estacion_talasa');
  await swimAcross(d,link.offset+TAL.JETTY.x+1,MAR.H-1,'down','estacion_talasa');
  await d.swimTo(TAL.JETTY.x+1,TAL.JETTY.y);
  await buceo(d);await caleta(d);
 },lumbre,marEste:collectEasternSea,tizon:d=>tizon(d,{retry:false})});
 for(const method of ['walkTo','startSwim','swimTo','tap','quickPos','expectNotSaid','snapState'])delete d[method];
}
