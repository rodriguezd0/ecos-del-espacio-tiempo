import { bossBattle } from '../common/bossBattle.js';
import { F, LEGENDS, available, gateFor, recordOutcome, latiosSite } from './b22c_common.js';
import { SITES } from '../maps/b22c/layout.js';

export function requestFor(key) {
  const L=LEGENDS[key];if(!L) throw new Error(`B22c: encuentro desconocido ${key}`);
  return {type:'wild',noCoop:true,wild:{species:L.species,level:L.level,moves:[...L.moves]},bgm:'Legendario mayor',
    battleback:{lugia:'Sub',hooh:'Monte',kyogre:'Agua',groudon:'Volcan',rayquaza:'CimaNevada',latias:'Agua',latios:'Agua'}[key]};
}
export async function fightLegend(ctx,key) {
  const L=LEGENDS[key];if(!L) throw new Error(`B22c: encuentro desconocido ${key}`);
  const blocked=gateFor(ctx.state,key);
  if(blocked) {await ctx.say(blocked);return 'blocked';}
  if(!available(ctx.state,key)) {await ctx.say(ctx.flag(L.caught)?'Ya capturaste a este Pokémon.':'Se está recuperando. Volverá después de descansar.');return 'absent';}
  if(key==='latias') ctx.setFlag(F.latiasSeen);
  ctx.cry?.(L.species);
  const request=requestFor(key);
  const retry=SITES[key]?.stand || null;
  const outcome=await bossBattle(ctx,request,retry,{loseText:'Tu equipo ha recuperado fuerzas. Puedes volver a intentarlo sin perder dinero.'});
  const result=recordOutcome(ctx.state,key,outcome);
  if(result==='beaten') await ctx.say('Se ha retirado para recuperarse. Descansa en una cama, Centro o campamento y vuelve.');
  if(key==='latios' && result!=='caught') ctx.setVar('b22c_latios_ruta',(latiosSite(ctx.state)+1)%3);
  if(['latias','latios'].includes(key) && ['caught','beaten'].includes(result)) {
    const flag=key==='latias'?F.latiasite:F.latiosite;
    if(!ctx.flag(flag)) {await ctx.giveItem(key==='latias'?'LATIASITE':'LATIOSITE',1);ctx.setFlag(flag);}
  }
  ctx.requestRefresh?.();return result;
}
