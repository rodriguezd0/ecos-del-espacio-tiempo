import { LOCATIONS, SIGHTINGS, RAYS, LAKE } from '../maps/b22b/layout.js';
import { LEGENDS, isPostgame, legendAvailable, beastSeen } from './b22b_common.js';
import { legendEvent, legendFight, openSeal, sighting } from './b22b_encounters.js';

export const OBJ = Object.freeze({ wind:'asset:objects/b22b_vendaval.png', seals:'asset:objects/b22b_sellos.png', tracks:'asset:objects/b22b_rastros.png' });
const trailDir = { raikou:2, entei:4, suicune:6 };
function sightingEvents(key, site) {
  const seen = (s) => beastSeen(s,key).includes(site.id);
  const available = (s) => isPostgame(s) && !s.flag(LEGENDS[key].caught) && !seen(s) && beastSeen(s,key).length < 3;
  const trail = (s) => isPostgame(s) && seen(s);
  const detail = async (ctx) => {
    const texts = {
      raikou:'Marcas de rayo arañan la tierra. La Detección de Zygarde las señala. Busca a Raikou en la Meseta y las Rutas 4, 5 y 11; tras tres avistamientos se detiene en el Anillo.',
      entei:'La hierba está chamuscada. El rastro pasa por la Ruta 6, las Dunas, la Ruta 7 y Tizón; tras tres avistamientos conduce a la Cantería.',
      suicune:'El agua que toca este rastro está más clara. Suicune recorre el río Albo, su gruta y el pozo. Tras tres avistamientos se detiene en el Lago del Sentir.',
    };
    await ctx.say(texts[key]);
  };
  return [{
    id:`b22b_avistamiento_${key}_${site.id}`,x:site.x,y:site.y,name:LEGENDS[key].name,
    pages:[{when:available,sprite:`follower:${LEGENDS[key].species}:0:0`,dir:4,solid:true,stepAnime:true,trigger:'action',script:(ctx)=>sighting(ctx,key,site.id)}],
  },{
    id:`b22b_rastro_${key}_${site.id}`,x:site.x,y:site.y,name:'Rastro',
    pages:[
      {when:trail,sprite:OBJ.tracks,dir:trailDir[key],directionFix:true,walkAnime:false,through:true,shadow:false,trigger:'action',script:detail},
      ...(key==='raikou'?[{when:(s)=>trail(s)&&s.zygardeAbility('detect'),sprite:OBJ.tracks,dir:2,directionFix:true,walkAnime:false,through:true,shadow:false,trigger:'action',script:detail,glow:{name:'softLight',radius:25,intensity:0.22,color:[185,255,102]}}]:[]),
    ],
  }];
}
export function rayEvents() {
  return RAYS.map((at,i)=>({id:`b22b_rayo_${i+1}`,x:at.x,y:at.y,name:'Marca de descarga',pages:[{
    when:isPostgame,sprite:OBJ.tracks,dir:2,stepAnime:true,directionFix:true,through:true,shadow:false,trigger:'action',
    script:async(ctx)=>{
      if(!ctx.flag(LEGENDS.thundurus.hint)){await ctx.say('Los rayos han dejado una marca en la arena. Fermín conoce esta tormenta seca.');return;}
      const n=Number(ctx.var('b22b_rayos',0))||0;
      if(n<i){await ctx.say('El rayo rebota hacia el oeste. Empieza por la primera marca de descarga.');return;}
      if(n>i){await ctx.say(i===2?'La tormenta converge junto a esta marca.':'Ya seguiste esta descarga. El rastro continúa hacia el este.');return;}
      ctx.se?.('PRSFX- Thunderbolt1');await ctx.flash?.([230,240,255],12,160);
      ctx.setVar('b22b_rayos',n+1);ctx.requestRefresh?.();
      await ctx.say(i===2?'Los tres rayos convergen. Thundurus aparece al este de la última marca.':'Un relámpago salta hacia la siguiente marca, al este. Sigue su rastro.');
    },
  }]}));
}
function fixedEvent(key) {
  const L=LEGENDS[key], ev=legendEvent(key,LOCATIONS[key],{sealed:Boolean(L.open)});
  if(L.open){
    const original=ev.pages[0];
    ev.pages=[{...original,when:(s)=>legendAvailable(s,key)&&!s.flag(L.open),sprite:OBJ.seals,dir:{articuno:2,zapdos:4,moltres:6}[key],walkAnime:false,directionFix:true},
      {...original,when:(s)=>legendAvailable(s,key)&&s.flag(L.open)}];
  }
  if(key==='tornadus')ev.pages=ev.pages.map(p=>({...p,sprite:OBJ.wind,dir:2,directionFix:true,speed:4.8,freq:6,move:{route:['right','right','down','left','left','up'],repeat:true}}));
  if(key==='thundurus')ev.pages=ev.pages.map(p=>({...p,when:(s)=>legendAvailable(s,key)&&s.flag(L.hint)&&Number(s.var('b22b_rayos',0))>=3}));
  if(key==='landorus')ev.pages=ev.pages.map(p=>({...p,when:(s)=>legendAvailable(s,key)&&s.flag(LEGENDS.tornadus.caught)&&s.flag(LEGENDS.thundurus.caught)}));
  return ev;
}
function tremorEvents(){
  return [[14,23],[13,21],[15,21]].map(([x,y],i)=>({id:`b22b_temblores_${i}`,x,y,pages:[{when:(s)=>isPostgame(s)&&!s.flag(LEGENDS.landorus.caught),sprite:OBJ.tracks,dir:8,through:true,shadow:false,trigger:'action',script:async(ctx)=>{
    ctx.shake?.(2,3,20);
    await ctx.say(ctx.flag(LEGENDS.tornadus.caught)&&ctx.flag(LEGENDS.thundurus.caught)?'Los temblores se juntan entre estas tres marcas. Landorus te espera en el centro.':'Dos corrientes se repelen bajo el cerro. Primero debes capturar a Tornadus y a Thundurus para que los temblores converjan.');
  }}]}));
}
function coldCraterEvents(events){
  return events.map(ev=>{
    if(ev.id==='costra_basalto')return {...ev,script:async(ctx)=>{
      if(!isPostgame(ctx.state)){await ev.script(ctx);return;}
      if(await openSeal(ctx,'moltres'))await legendFight(ctx,'moltres');
    }};
    if(!ev.id.startsWith('costra_fria_'))return ev;
    const base={...ev};delete base.id;delete base.x;delete base.y;
    return {...ev,pages:[base,{when:(s)=>isPostgame(s)&&s.flag(LEGENDS.moltres.open),sprite:null,script:null,trigger:null,solid:false,through:true}]};
  });
}
export function lakeAccessEvent(){
  return {id:'b22b_lago_acceso',x:LAKE.access.x,y:LAKE.access.y,name:'Paso al lago',pages:[{
    when:isPostgame,sprite:OBJ.seals,dir:8,directionFix:true,walkAnime:false,solid:true,trigger:'action',script:async(ctx)=>{
      if(!ctx.flag(LEGENDS.articuno.hint)){await ctx.say('El hielo viejo guarda una hendidura hacia el lago. Rosendo, en los Talleres del Hielo, sabe leerla.');return;}
      await ctx.say('La hendidura del hielo conduce al lago interior. Puedes regresar por el mismo paso.');
      if(await ctx.confirm('¿Entrar al lago interior?'))await ctx.warp(LAKE.map,LAKE.entry.x,LAKE.entry.y,LAKE.entry.dir,{fade:true});
    },
  }]};
}
/** Añade encuentros sin sustituir la geometría ni los eventos de campaña. */
export function withB22bEvents(map,events){
  let out=map==='tizon_crater'?coldCraterEvents(events):[...events];
  for(const [key,at]of Object.entries(LOCATIONS))if(at.map===map)out.push(fixedEvent(key));
  for(const [key,sites]of Object.entries(SIGHTINGS))for(const site of sites)if(site.map===map)out.push(...sightingEvents(key,site));
  if(map==='dunas_ceniza')out.push(...rayEvents());
  if(map==='cerro_plomo')out.push(...tremorEvents());
  if(map==='gruta_escarcha_2')out.push(lakeAccessEvent());
  return out;
}
