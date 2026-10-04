import fs from 'node:fs';
import path from 'node:path';
import {ROOM_PLACES,NUCLEO} from '../game/src/content/maps/b18/cruce_layout.js';
import {F} from '../game/src/content/events/b18_common.js';
import {AXIS_MODES,solveAxisRoom,walkableAt} from '../game/src/world/axis/logic.js';

const ROOM_FLAGS=[null,F.room1,F.room2,F.room3];
const inside=(s,r)=>s.x>=r.x&&s.x<r.x+r.w&&s.y>=r.y&&s.y<r.y+r.h;

/** La reanudación usa la sala y el eje observados; nunca da por superada una puerta sin su flag real. */
export function cruceResume(s,mode) {
 if(!s.flags[F.chamberIn])throw Error('Cámara sin llegada registrada');
 if(!AXIS_MODES.includes(mode))throw Error(`eje desconocido: ${mode}`);
 const index=s.map==='camara_cruce_nucleo'&&inside(s,NUCLEO.room)?ROOM_PLACES.length:
  s.map==='camara_cruce'?ROOM_PLACES.findIndex(p=>inside(s,p.room)):-1;
 if(index<0)throw Error(`fuera de las salas del Cruce: ${s.map} (${s.x},${s.y})`);
 for(const flag of ROOM_FLAGS.slice(1,index))if(!s.flags[flag])throw Error(`puerta previa sin superar: ${flag}`);
 if(index===ROOM_PLACES.length)return {index,from:null};
 const place=ROOM_PLACES[index],from={x:s.x-place.ox,y:s.y-place.oy,mode};
 if(from.x>=0&&from.x<place.grid.w&&from.y>=0&&from.y<place.grid.h) {
  if(!walkableAt(place.grid,from.x,from.y,mode))throw Error(`${place.name}: casilla actual no transitable`);
  return {index,from};
 }
 const stairs=place.stairs.stamp;
 if(inside(s,{...stairs,w:3,h:3}))return {index,from:null};
 if(place.gate&&s.flags[ROOM_FLAGS[index]||F.tutorial]&&place.gate.hollow.some(p=>p.x===s.x&&p.y===s.y))return {index,from:null,atGate:true};
 throw Error(`${place.name}: fuera de la rejilla o de su escalera`);
}

export async function completeCruceRooms(d) {
 const start=await d.settle(),first=cruceResume(start,await d.axis());
 for(let i=first.index;i<ROOM_PLACES.length;i++) {
  const place=ROOM_PLACES[i];
  let current=cruceResume(await d.snapState(),await d.axis());
  if(current.index!==i)throw Error(`sala observada distinta de ${place.name}`);
  if(!current.atGate) {
   if(!current.from) {
    await d.walkTo(place.entry.x,place.entry.y);
    current=cruceResume(await d.settle(),await d.axis());
    if(current.index!==i||!current.from)throw Error(`${place.name}: no se llegó a su rejilla`);
   }
   const plan=solveAxisRoom(place.grid,{from:current.from,mode:current.from.mode});
   if(!plan)throw Error(`${place.name}: sin solución desde la casilla observada`);
   await d.playRoom(place,plan,current.from);
  }
  if(i===0)await d.expectSaid(/El cristal vibra con la Cadena Roja/,'el tutorial del primer cristal');
  await d.milestone(`sala_${place.name}`,s=>!ROOM_FLAGS[i]||s.flags[ROOM_FLAGS[i]]?null:`${place.name} sin superar`);
  const next=ROOM_PLACES[i+1],r=next?.room||NUCLEO.room,map=next?'camara_cruce':'camara_cruce_nucleo';
  await d.pushUntil('up',s=>s.map===map&&inside(s,r),`cruzar la puerta de ${place.name}`);
 }
}

/** Diagnóstico de solo lectura, separado de los controles que ejecutan el puzzle. */
export async function recordCruceControls(d,label) {
 if(!d.outDir)return;
 const observed=await d.eval(()=>{
  const world=window.__campaign.map().world,p=world.player;
  return {map:world.current.def.id,x:p.x,y:p.y,axis:world.state.var('cadena_eje',null),
   direction:p.direction,lastDir:p.lastDir,lastDirTime:p.lastDirTime,time:p.time,
   moving:p.moving(),busy:p.busy(),iceSliding:p.iceSliding,moveRouteForcing:p.moveRouteForcing,
   mirror:Boolean(world.current.def.mirrorControls),scriptBusy:world.scriptBusy(),inputEnabled:world.inputEnabled(),
   passableLeft:p.passable(p.x,p.y,4),targetEvents:world.events.filter(e=>e.x===p.x-1&&e.y===p.y)
    .map(e=>({id:e.id,x:e.x,y:e.y,active:e.active,through:e.through,solid:e.solid,noOver:e.noOver})),
   keys:[...world.input.keyDown],buttons:structuredClone(world.input.state)};
 });
 fs.writeFileSync(path.join(d.outDir,`campaign_b18_controls_${label}.json`),JSON.stringify(observed,null,2));
}
