import { available, gateFor, postgame, partyHas } from './b22c_common.js';
import { fightLegend } from './b22c_encounters.js';
import { callSun } from './b22c_rituals.js';
import { teachMove } from '../services/moveTeaching.js';
import { SITES } from '../maps/b22c/layout.js';
import { lugiaGuides, marineEnter } from './b22c_lugia.js';

export function roomEvents(key) {
  const S=SITES[key],events=[{id:`b22c_${key}`,...S.legend,pages:[{when:s=>available(s,key)&&!gateFor(s,key),sprite:`follower:${key==='rayquaza'?'RAYQUAZA':key.toUpperCase()}:0:0`,dir:2,solid:true,trigger:'action',script:ctx=>fightLegend(ctx,key)}]}];
  if(key==='lugia') events.push(...lugiaGuides());
  if(key==='groudon') events.push({id:'b22c_veta_prisma',...S.altar,sprite:'asset:objects/b22c_prismas.png',dir:4,solid:true,trigger:'action',script:callSun});
  if(key==='rayquaza') events.push({id:'b22c_ascenso_draco',...S.tutor,sprite:'asset:objects/b22c_placa.png',solid:true,trigger:'action',script:async ctx=>{
    if(!partyHas(ctx.state,'RAYQUAZA')) {await ctx.say('Los Custodios dejaron un signo de Ascenso Draco. Trae a Rayquaza en tu equipo para leerlo.');return;}
    const i=ctx.state.party.findIndex(p=>p&&!p.egg&&p.species==='RAYQUAZA');
    if(ctx.state.party[i].moves.some(m=>m.id==='DRAGONASCENT')) {await ctx.say('Rayquaza ya sabe Ascenso Draco. Ese movimiento permite su Megaevolución.');return;}
    if(await ctx.confirm('¿Enseñar Ascenso Draco a Rayquaza?')) await teachMove(ctx,i,'DRAGONASCENT');
  }});
  return events;
}
export function roomEnter(key) {
  if(key==='lugia') return marineEnter;
  return async ctx=>{
    if(!postgame(ctx.state)) {const b=SITES[key].back;await ctx.warp(b.map,b.x,b.y,b.dir);return;}
    const flag=`b22c_${key}_lugar_visto`;
    if(ctx.flag(flag)) return;ctx.setFlag(flag);
    const text=gateFor(ctx.state,key);
    await ctx.say(text||({kyogre:'El Prisma Azul reconoce la profundidad. Kyogre duerme en el centro de la Fosa Abisal.',groudon:'Una veta de magma corta la roca. La placa del prisma espera Día Soleado.',rayquaza:'El Balcón del Cielo mira al corazón de la tormenta. La placa recuerda Ascenso Draco.'}[key]));
  };
}
