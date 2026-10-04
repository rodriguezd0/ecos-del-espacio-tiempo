// Plan de viaje de QA sobre definiciones reales. Solo calcula accesos; no ejecuta guiones ni altera partidas.
import {loadMapDefinition} from '../game/src/content/maps/index.js';
import { CERRO, ESTRATO, DUNAS } from '../game/src/content/maps/b08/layout.js';

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

export async function findTravelPath(from,target,load=loadMapDefinition) {
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
      seen.add(edge.to);queue.push([edge.to,[...path,edge.to]]);
    }
  }
  return null;
}
