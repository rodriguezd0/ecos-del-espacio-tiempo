// Plan de viaje de QA sobre definiciones reales. Solo calcula accesos; no ejecuta guiones ni altera partidas.
import {loadMapDefinition} from '../game/src/content/maps/index.js';
import { CERRO, ESTRATO, DUNAS } from '../game/src/content/maps/b08/layout.js';
import {DESCENT_GAP} from '../game/src/content/maps/b17/mirador_layout.js';
import {F as B17} from '../game/src/content/events/b17_common.js';
import {F as B19} from '../game/src/content/events/b19_common.js';

// Puertas de campaña que son eventos de contacto, sin warp en la definición.
const SCRIPT_DOORS = {
  cerro_plomo: [{ to: 'camara_contrapesos_base', x: CERRO.door.x, y: CERRO.door.y + 1, dir: 8 }],
};
export const scriptEntrance = (from, to) => SCRIPT_DOORS[from]?.find(e => e.to === to) || null;
export function connectionApproach(from, to) {
  if (from === 'ciudad_estrato' && to === 'dunas_ceniza') return { x: ESTRATO.east.x, y: ESTRATO.east.y0 + 1 };
  if (from === 'dunas_ceniza' && to === 'ciudad_estrato') return { x: 0, y: DUNAS.west.y0 + 1 };
  return null;
}

export function travelEdgeOpen(from,to,flags) {
  if((from==='mirador_sur'&&to==='sima_eje')||(from==='sima_eje'&&to==='mirador_sur'))return Boolean(flags[DESCENT_GAP.flag]);
  if((from==='mirador_sur'&&to==='puente_convergencia')||(from==='puente_convergencia'&&to==='mirador_sur'))return Boolean(flags[B17.p9]);
  if((from==='calzada_rey'&&to==='sima_eje')||(from==='sima_eje'&&to==='calzada_rey'))return [B19.span1,B19.span2,B19.span3].every(flag=>Boolean(flags[flag]));
  return true;
}

export async function findTravelPath(from,target,load=loadMapDefinition,{flags=null}={}) {
  const destination=await load(target);
  // Una salida con door:true conserva la casilla exterior desde la que se empuja la puerta de entrada.
  const doors=(destination.warps||[]).filter(w=>w.door&&w.to!==target&&Number.isFinite(w.tx)&&Number.isFinite(w.ty));
  const queue=[[from,[]]],seen=new Set([from]);
  while(queue.length) {
    const [id,path]=queue.shift();if(id===target)return path;
    const def=await load(id);
    const edges=[...(def.connections||[]),...(def.warps||[]),...(SCRIPT_DOORS[id]||[]),...doors.filter(w=>w.to===id).map(()=>({to:target}))];
    for(const edge of edges) {
      if(!edge.to||seen.has(edge.to))continue;
      if(flags&&!travelEdgeOpen(id,edge.to,flags))continue;
      seen.add(edge.to);queue.push([edge.to,[...path,edge.to]]);
    }
  }
  return null;
}
