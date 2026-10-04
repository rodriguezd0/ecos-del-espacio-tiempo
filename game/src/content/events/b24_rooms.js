import { expedition, registryReady, isActive, flag, phase } from './b24_registry.js';
import { legendEvent, BLOCKED_TEXT } from './b24_encounters.js';
import { openRegistry } from './b24_registry_ui.js';
import { offerBerry, collectManaphy, rescueCosmog, chooseIdeal, fieldAction, justiceAction, escortCarbink } from './b24_actions.js';
import { ULTRA_RULES, ultraAction, counterweights, pushCounterweight, resetFortress, enterUltra } from './b24_ultra.js';
import { restSpotEvent } from '../services/inn.js';
import { ULTRA_SPECIES, capturedFlag } from './b24_conditions.js';
const action=(id,x,y,script,opts={})=>({id,x,y,trigger:'action',solid:true,noOver:true,sprite:'asset:objects/b24_hitos.png',dir:2,script,...opts});
const portalCoords=[[5,18],[8,18],[11,18],[15,18],[18,18],[21,18],[13,15]];
export function expeditionEvents(id,S){
 const e=S.quest&&expedition(S.quest);
 const events=[action('dlc2_regreso',13,23,ctx=>ctx.warp(S.returnTo.map,S.returnTo.x,S.returnTo.y,S.returnTo.dir),{solid:false,noOver:false,sprite:'FlechaSalida',dir:8,through:true,shadow:false}),
  {...restSpotEvent('dlc2_campamento',16,21,{kind:'camp',message:'¿Descansar en el campamento? Los visitantes que se retiraron volverán.'}),sprite:'asset:objects/b24_hitos.png',dir:8}];
 if(id==='b24_aduana_vieja')return[...events,
  action('dlc2_sabela',13,9,openRegistry,{sprite:'anil:cientifica',dir:2,name:'Sabela Ferreiro',age:34,provisionalSprite:true}),
  action('dlc2_registro',9,12,openRegistry,{name:'Registro de Expediciones'}),
  action('dlc2_cartografia',17,12,async ctx=>ctx.say('Sabela: Los mapas incompletos sirven para hacerse preguntas. El mío no exige acertar a la primera.'))];
 if(e)events.push(action('dlc2_pista',10,21,async ctx=>{
  if(!registryReady(ctx.state)){await ctx.say(BLOCKED_TEXT.story);return;}
  if(isActive(ctx.state,e.id))ctx.setFlag(flag(e.id,'indicio'));
  await ctx.say(e.hint);if(!ctx.state.flag(flag(e.id,'confirmada')))await ctx.say('Marca tu hipótesis en el mapa del Registro de Sabela antes de resolver el encuentro.');
 }));
 for(const[ i,species]of S.species.entries())events.push(legendEvent(species,{x:S.species.length===1?13:i===0?10:16,y:7},{before:species==='CELEBI'?offerBerry:null}));
 if(S.quest==='manaphy')events.push(action('dlc2_cuna',13,8,collectManaphy,{sprite:'asset:objects/b24_cuna.png'}));
 if(S.quest==='cosmog'){
  events.push(action('dlc2_rescate_cosmog',13,6,rescueCosmog,{sprite:'follower:COSMOG:0:0',when:s=>!s.flag('dlc2_cosmog_rescatado')}));
  for(const[i,key]of Object.keys(ULTRA_RULES).entries())events.push(action(`dlc2_portal_${key}`,portalCoords[i][0],portalCoords[i][1],ctx=>enterUltra(ctx,key),{sprite:'asset:objects/b24_umbral.png',when:s=>registryReady(s)&&Boolean(phase(s,key))}));
  events.push(legendEvent('NECROZMA',{x:13,y:10},{before:async ctx=>{await ctx.say('La luz se apaga solo dentro del cráter. Necrozma aparece en su centro. El regreso permanece abierto.');return true;}}));
 }
 if(['cobalion','terrakion','virizion'].includes(S.quest)){
  for(let i=0;i<3;i++){
   const x=[7,13,19][i],y=13;
   if(S.quest==='cobalion')events.push(action(`dlc2_timburr_${i}`,x,y+1,ctx=>justiceAction(ctx,S.quest,i),{sprite:'follower:TIMBURR:0:0'}));
   events.push(action(`dlc2_justicia_${i}`,x,y,ctx=>justiceAction(ctx,S.quest,i),S.quest==='virizion'?{sprite:'follower:PETILIL:0:0'}:{}));
  }
 }
 if(S.quest==='ideales')events.push(action('dlc2_crisol',13,12,chooseIdeal));
 if(S.quest==='diancie')events.push(action('dlc2_carbink',13,20,escortCarbink,{sprite:'follower:CARBINK:0:0'}));
 if(S.quest==='volcanion')events.push(action('dlc2_agua',9,17,ctx=>fieldAction(ctx,'water'),{dir:4}),action('dlc2_fuego',18,12,ctx=>fieldAction(ctx,'fire'),{dir:6}));
 if(S.quest?.startsWith('ultra_')){
  const rule=ULTRA_RULES[S.quest];events.push(action('dlc2_regla',7,21,ctx=>ctx.say(rule.text)));
  if(rule.kind==='weights'){
   for(let i=0;i<3;i++)events.push(action(`dlc2_peso_${i}`,[8,13,18][i],[16,14,16][i],ctx=>pushCounterweight(ctx,i),{sprite:'asset:objects/b22c_placa.png'}));
   events.push(action('dlc2_reinicio',19,21,resetFortress));
  }else{
   const coords=S.quest==='ultra_veneno'?[[7,16],[19,12],[7,8]]:rule.kind==='ends'?[[7,7],[19,7]]:[[7,12],[13,12],[19,12]];
   for(const[i,[x,y]]of coords.entries())events.push(action(`dlc2_regla_${i}`,x,y,ctx=>ultraAction(ctx,S.quest,i),{sprite:'asset:objects/b22c_prismas.png'}));
  }
 }
 return events;
}
export async function expeditionEnter(ctx,id,S){
 if(id==='b24_crater_lucero'){
  const crisis=registryReady(ctx.state)&&ULTRA_SPECIES.every(sp=>ctx.state.data.dex.caught[sp])&&!ctx.flag(capturedFlag('NECROZMA'));
  ctx.setFlag('dlc2_necrozma_crisis',crisis);if(ctx.scene)ctx.scene.darkness=crisis?{amount:0.72,radius:140}:null;
 }
 if(isActive(ctx.state,S.quest))ctx.setFlag(flag(S.quest,'indicio'));
 if(S.quest==='ultra_fortaleza')for(const[i,p]of counterweights(ctx.state).entries())ctx.world.events.find(e=>e.id===`dlc2_peso_${i}`)?.moveTo(p.x,p.y);
 if(S.quest==='diancie'){
  const n=Math.max(0,Math.min(3,Number(ctx.var('dlc2_diancie_escolta',0))||0));ctx.world.events.find(e=>e.id==='dlc2_carbink')?.moveTo(13,n===0?20:20-n*4);
 }
 if(['cobalion','virizion'].includes(S.quest)){
  const raw=ctx.var(flag(S.quest,'rescates'),[]);
  for(const i of Array.isArray(raw)?raw:[])if(Number.isInteger(i)&&i>=0&&i<3)ctx.world.events.find(e=>e.id===`${S.quest==='cobalion'?'dlc2_timburr':'dlc2_justicia'}_${i}`)?.moveTo(11+i,18);
 }
 ctx.requestRefresh?.();
}
