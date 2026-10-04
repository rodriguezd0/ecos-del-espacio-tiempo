// Plan de viaje de QA sobre definiciones reales. Solo calcula accesos; no ejecuta guiones ni altera partidas.
import {loadMapDefinition} from '../game/src/content/maps/index.js';

export async function findTravelPath(from,target,load=loadMapDefinition) {
  const destination=await load(target);
  // Una salida con door:true conserva la casilla exterior desde la que se empuja la puerta de entrada.
  const doors=(destination.warps||[]).filter(w=>w.door&&w.to!==target&&Number.isFinite(w.tx)&&Number.isFinite(w.ty));
  const queue=[[from,[]]],seen=new Set([from]);
  while(queue.length) {
    const [id,path]=queue.shift();if(id===target)return path;
    const def=await load(id);
    const edges=[...(def.connections||[]),...(def.warps||[]),...doors.filter(w=>w.to===id).map(()=>({to:target}))];
    for(const edge of edges) {
      if(!edge.to||seen.has(edge.to))continue;
      seen.add(edge.to);queue.push([edge.to,[...path,edge.to]]);
    }
  }
  return null;
}
