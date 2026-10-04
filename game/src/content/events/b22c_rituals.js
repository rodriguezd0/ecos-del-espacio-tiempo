import { F, postgame, partyMove, atDawn, relicMissing } from './b22c_common.js';
import { HOOKS } from '../maps/b22c/layout.js';

export async function takeRelic(ctx,key) {
  const relic={blue:['BLUEORB',F.blue,'El Prisma Azul late con el mar. Úsalo con Danza Lluvia en el remolino del sudeste del Mar del Sur.'],
    dew:['SOULDEW',F.dew,'Rocío Bondad. Su luz se refleja en el Lago del Sentir, en los Lagos del Alma.'],
    red:['REDORB',F.red,'El Prisma Rojo conserva el calor de la mina. Busca la Veta Magmática bajo Tizón y lleva Día Soleado.']}[key];
  if(!relic || !postgame(ctx.state) || ctx.map.id!==HOOKS[key].map) return;
  if(ctx.flag(relic[1])) {await ctx.say('La hornacina está vacía. La reliquia ya está contigo.');return;}
  await ctx.say(relic[2]);await ctx.giveItem(relic[0],1);ctx.setFlag(relic[1]);ctx.requestRefresh?.();
}
async function invoke(ctx,{item,move,flag,name,surface=false}) {
  if(!postgame(ctx.state)) return;
  if(surface && ctx.map.id!=='mar_del_sur') {await ctx.say('Danza Lluvia debe usarse en la superficie del Mar del Sur.');return;}
  if(!ctx.state.hasItem(item)) {await ctx.say(relicMissing(ctx.state,item,item==='BLUEORB'?'el Prisma Azul del eco de Antea':'el Prisma Rojo de la galería honda de Mina Galena'));return;}
  const index=partyMove(ctx.state,move);
  if(index===null) {await ctx.say(`Lleva en el equipo un Pokémon consciente que sepa ${name}. Los huevos y los Pokémon del PC no pueden hacerlo.`);return;}
  if(!await ctx.confirm(`¿Usar ${name} para despertar la resonancia del prisma?`)) return;
  ctx.se?.(move==='RAINDANCE'?'PRSFX- Rain':'PRSFX- Sunny Day');
  if(surface) await ctx.weather?.('rain',5); else await ctx.flash?.([255,190,90],30,90);
  ctx.setFlag(flag);ctx.requestRefresh?.();
  await ctx.say(surface?'La lluvia cae sobre el remolino del sudeste. En el fondo, la Fosa Abisal responde al Prisma Azul.':'La veta se ilumina. El Prisma Rojo reconoce el sol y Groudon sale de la roca.');
}
export const callRain=ctx=>invoke(ctx,{item:'BLUEORB',move:'RAINDANCE',flag:F.rain,name:'Danza Lluvia',surface:true});
export const callSun=ctx=>invoke(ctx,{item:'REDORB',move:'SUNNYDAY',flag:F.sun,name:'Día Soleado'});
export async function lightBrazier(ctx) {
  if(!postgame(ctx.state)) {await ctx.say('El brasero antiguo conserva cenizas frías.');return;}
  if(!atDawn(ctx.state)) {await ctx.say('El brasero espera el amanecer, entre las seis y las nueve. Puedes descansar hasta la mañana.');return;}
  if(ctx.flag(F.brazier)) {await ctx.say('La llama vuelve a encenderse con el amanecer. Ho-Oh regresará después de descansar.');return;}
  if(!ctx.state.hasItem('SACREDASH')) {await ctx.say('El brasero pide Ceniza Sagrada. Olvido la conserva en el Pilar de la Memoria.');return;}
  if(!await ctx.confirm('¿Encender el brasero con la Ceniza Sagrada?')) return;
  ctx.state.removeItem('SACREDASH',1);ctx.setFlag(F.brazier);ctx.requestRefresh?.();
  ctx.se?.('PRSFX- Ember');await ctx.say('La Ceniza Sagrada prende con la primera luz. Ho-Oh desciende sobre el Cerro del Alba.');
}
