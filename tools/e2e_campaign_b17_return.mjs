import {GAP} from '../game/src/content/maps/b17/senda_layout.js';
import {EXTERIOR,p9ExteriorWarps} from '../game/src/content/maps/b18/vertical_layout.js';
import {F} from '../game/src/content/events/b17_common.js';

export const P9_ENTRY=Object.freeze(p9ExteriorWarps()[0]);

/** Solo admite el rellano exterior o la llegada exacta del warp registrado, con la salida abierta. */
export function sendaExitError(s) {
 if(!s.flags[F.vigil]||!s.flags[F.sendaGap])return 'salida sin Vigilia o sin tramo reconstruido';
 if(s.map==='senda_mirador'&&s.x===EXTERIOR.arrive.x&&s.y===EXTERIOR.arrive.y)return null;
 if(s.map===P9_ENTRY.to&&s.x===P9_ENTRY.tx&&s.y===P9_ENTRY.ty)return null;
 return `salida fuera del enlace canónico: ${s.map} (${s.x},${s.y})`;
}

/** Completa los controles pendientes; al reanudar en el Puente no repite ni mueve nada. */
export async function finishSendaExit(d) {
 const initial=await d.snapState();
 if(!['senda_mirador',P9_ENTRY.to].includes(initial.map))throw Error(`salida desde otro mapa: ${initial.map}`);
 if(!initial.flags[F.vigil])throw Error('salida sin Vigilia');
 if(initial.map==='senda_mirador') {
  if(!initial.flags[F.sendaGap]) {
   const sock=GAP.sockets[0];
   await d.walkTo(sock.x,sock.y-1,{face:'down'});await d.interact();
   await d.until(s=>Boolean(s.flags[F.sendaGap]),{timeout:20000,what:'reconstruir el tramo derrumbado'});
   await d.settle();await d.milestone('tramo',s=>s.flags[F.sendaGap]?null:'sin tramo');
  }
  await d.walkTo(EXTERIOR.arrive.x,EXTERIOR.arrive.y,{stopWhen:s=>s.map===P9_ENTRY.to});
 }
 await d.milestone('salida',sendaExitError);
 if((await d.snapState()).map!==P9_ENTRY.to) {
  await d.pushUntil('up',s=>s.map===P9_ENTRY.to,'entrar por la columna del Pilar 9');
  await d.settle();
 }
 await d.milestone('puente_b18',s=>sendaExitError(s)||(s.map===P9_ENTRY.to?null:'no se cruzó la puerta del Pilar'));
}
