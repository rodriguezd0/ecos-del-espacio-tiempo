import {installB13Observer} from './e2e_campaign_b13_page.mjs?shore=6';
import {Driver as SeaDriver} from './e2e_b13_driver.mjs';
import {MAR} from '../game/src/content/maps/b15/layout_escarcha.js';

/** Regreso por el borde transitable real; no vuelve a recorrer las células ya recogidas. */
export async function returnFromNorthSea(d) {
 await installB13Observer(d.page);
 const swim=(x,y)=>SeaDriver.prototype.walkTo.call(d,x,y,{router:(x,y)=>d.eval(([x,y])=>window.__b13.routeMixed(x,y),[x,y])});
 let state=await d.snap();
 if(state.map==='mar_boreal') {
  if(!state.surfing)await SeaDriver.prototype.startSwim.call(d,MAR.width-1,18);
  const edge=await d.eval(()=>{
   const w=window.__campaign.map().world,p=w.player,x=w.map.width-1;let best=null;
   for(let y=0;y<w.map.height;y++) {
    const view=Object.create(p);Object.defineProperties(view,{x:{value:x},y:{value:y}});
    if(!view.passable(x,y,6))continue;
    const route=p.x===x&&p.y===y?[]:window.__b13.routeMixed(x,y);
    if(route&&(!best||route.length<best.length))best={x,y,length:route.length};
   }
   return best;
  });
  if(!edge)throw Error('No hay borde navegable de Mar Boreal hacia Villa Boreal.');
  await swim(edge.x,edge.y);await d.crossEdge(6,'villa_boreal');state=await d.snap();
 }
 if(state.map!=='villa_boreal')throw Error(`Regreso del Mar Boreal en un mapa inesperado: ${state.map}`);
 if(state.surfing) {
  const land=await d.eval(()=>window.__b13.shoreFor(20,18));
  if(!land)throw Error('No hay regreso a tierra en Villa Boreal.');
  await swim(land.x,land.y);await d.settle();
 }
 await d.until(s=>s.map==='villa_boreal'&&!s.surfing,{what:'desembarcar en Villa Boreal'});
}
