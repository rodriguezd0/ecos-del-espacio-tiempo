import fs from 'node:fs';
import path from 'node:path';
import * as MAR from '../game/src/content/maps/b13/mar_layout.js';
import {prefer} from './e2e_b13_driver.mjs';

/** Tras registrar el bloqueo, volver por Buceo reconstruye el mapa y conserva la victoria del entrenador. */
export async function recoverC065ByDive(d) {
 const s=await d.snap();if(s.cells.includes(MAR.CELLS.c065.key))return;
 if(s.map==='mar_del_sur') {
  const occupied=await d.eval(c=>window.__campaign.map().world.events.some(e=>e.id!==c.key&&!e.erased&&!e.through&&e.at(c.x,c.y)&&(e.characterName||e.solid)),MAR.CELLS.c065);
  if(!occupied)return;
  await d.swimTo(138,36);await d.interact({choose:prefer('Sí')});
  await d.until(s=>s.map==='fondo_mar_sur'&&s.ready,{what:'retorno natural por Buceo'});await d.settle();
 }
 if((await d.snap()).map==='fondo_mar_sur') {
  await d.interact({choose:prefer('Sí')});
  await d.until(s=>s.map==='mar_del_sur'&&s.ready,{what:'emerger para volver al mismo mar'});await d.settle();
  await d.milestone('c065_regreso_natural',s=>s.map==='mar_del_sur'&&s.x===138&&s.y===36&&s.surfing?null:'no volvió por el punto equivalente');
 }
}

/** Prueba controles ordinarios ante C065 y registra NPC/colisión, sin tocar posiciones ni progreso. */
export async function probeC065(d) {
 const s=await d.snap(),c=MAR.CELLS.c065;
 if(s.map!=='mar_del_sur'||s.cells.includes(c.key))return;
 const observe=()=>d.eval(c=>{
  const w=window.__campaign.map().world,p=w.player;
  return {player:{x:p.x,y:p.y,dir:p.direction,surfing:p.surfing},
   events:w.events.filter(e=>e.at(c.x,c.y)).map(e=>({id:e.id,x:e.x,y:e.y,dir:e.direction,erased:e.erased,
    active:Boolean(e.page),through:e.through,solid:e.solid,graphic:e.characterName,trigger:e.trigger}))};
 },c);
 const before=await observe();
 if(!before.events.some(e=>e.id!==c.key&&!e.erased&&!e.through&&(e.solid||e.graphic)))return;
 const report={cell:c,before,attempts:[]};await d.shot('c065_npc_antes');
 for(const [x,y,face] of [[c.x-1,c.y,6],[c.x,c.y-1,2],[c.x+1,c.y,4],[c.x,c.y+1,8]]) {
  const position=await d.snap();
  const route=await d.eval(([x,y])=>window.__b13.routeMixed(x,y),[x,y]);
  if(!route&&(position.x!==x||position.y!==y)) {report.attempts.push({x,y,face,reachable:false});continue;}
  await d.walkTo(x,y,{router:(tx,ty)=>d.eval(([x,y])=>window.__b13.routeMixed(x,y),[tx,ty])});
  await d.turn(face);await d.interact();await d.tap(face);
  report.attempts.push({x,y,face,reachable:true,after:await observe(),picked:(await d.snap()).cells.includes(c.key)});
  if((await d.snap()).cells.includes(c.key))break;
 }
 report.picked=(await d.snap()).cells.includes(c.key);
 fs.writeFileSync(path.join(d.outDir,'campaign_c065_npc_probe.json'),JSON.stringify(report,null,2));
 await d.shot(report.picked?'c065_npc_recogida':'c065_npc_bloqueada');
 if(!report.picked)throw Error('C065 sigue bloqueada por el NPC tras las interacciones normales; evidencia campaign_c065_npc_probe.json');
}
