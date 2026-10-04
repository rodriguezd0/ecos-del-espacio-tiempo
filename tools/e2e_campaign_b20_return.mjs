import {CIELO,TERRAZA,EXIT_STAND,tramoId} from '../game/src/content/maps/b20/layout.js';
import {F} from '../game/src/content/events/b20_common.js';

const RETURN_MAPS=[tramoId(9),'cielo_interior','terraza_ultimo_sello','nucleo_origen'];
export const RESTORED_ORIGEN_FLAGS=Object.freeze([F.restored,F.flute,F.trio,F.gaelB6,F.gaelGone]);
const inMap=id=>s=>s.map===id;

export function restoredOrigenError(s) {
 if(!RESTORED_ORIGEN_FLAGS.every(flag=>s.flags[flag]))return 'regreso sin P10, Flauta, Trío o despedida de Gael';
 if(!RETURN_MAPS.includes(s.map))return `regreso desde otro mapa: ${s.map}`;
 return null;
}

/** El arco del Cielo es un evento. Se recorre con los mismos controles que abrieron estas plantas. */
export async function returnToOrigen(d) {
 const error=restoredOrigenError(await d.settle());if(error)throw Error(error);
 if((await d.snapState()).map===tramoId(9)) {
  await d.walkTo(EXIT_STAND.x,EXIT_STAND.y,{stopWhen:inMap('cielo_interior')});
  await d.exitTo('up','cielo_interior');await d.settle();
 }
 if((await d.snapState()).map==='cielo_interior') {
  await d.walkTo(CIELO.gate.x,CIELO.gate.y,{stopWhen:inMap('terraza_ultimo_sello')});
  await d.until(s=>s.map==='terraza_ultimo_sello'&&s.ready,{timeout:15000,what:'volver por el arco a la Terraza'});
  await d.settle();
 }
 if((await d.snapState()).map==='terraza_ultimo_sello') {
  await d.walkTo(TERRAZA.door.x,TERRAZA.door.y+1,{stopWhen:inMap('nucleo_origen')});
  await d.pushUntil('up',inMap('nucleo_origen'),'volver al núcleo restaurado');await d.settle();
 }
 await d.milestone('retorno_nucleo_para_salto',s=>restoredOrigenError(s)||(s.map==='nucleo_origen'?null:'no se llegó al núcleo'));
}
