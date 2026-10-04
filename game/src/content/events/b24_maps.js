// Decoradores aditivos. Ningún encuentro cambia las páginas, flags o accesos de la campaña.
import { isPostgame } from './b22a_common.js';
import { registryReady, isActive, phase, flag } from './b24_registry.js';
import { legendEvent, BLOCKED_TEXT } from './b24_encounters.js';
import { reportImpostor, offerStar, collectGear, repairMagearna, forgeIdeal, fieldAction } from './b24_actions.js';
import { SITES } from '../maps/b24/sites.js';
export const ACCESS=Object.freeze({
 b24_santuario_neblino:{map:'ruta_9_neblino',x:25,y:18},
 b24_claro_justicia:{map:'ruta_9_neblino',x:41,y:24},
 b24_cuna_coral:{map:'antea_2_presente',x:16,y:18},
 b24_canteria_justicia:{map:'canteria_solano',x:12,y:10},
 b24_cueva_dunas:{map:'dunas_ceniza',x:32,y:24},
 b24_mina_diamante:{map:'mina_galena',x:8,y:18},
 b24_termas_tizon:{map:'volcan_tizon',x:25,y:19},
 b24_dos_ideales:{map:'sima_eje',x:18,y:15},
 b24_crater_lucero:{map:'cerro_alba',x:16,y:7},
});
export const IMPOSTORS=Object.freeze({ruta_1:{x:8,y:18},ruta_2:{x:27,y:32},ruta_4:{x:10,y:20},ruta_5:{x:19,y:28},ruta_11:{x:19,y:24}});
export const GEAR_SITES=Object.freeze({ciudad_estrato:{x:16,y:20},estacion_talasa:{x:15,y:12},villa_brontia:{x:20,y:12},lumina_museo:{x:20,y:13},nexo_astillero:{x:14,y:12}});
const object=(id,x,y,script,when=registryReady)=>({id,x,y,pages:[{when,trigger:'action',solid:true,sprite:'asset:objects/b24_hitos.png',dir:2,directionFix:true,script}]});
export async function enterExpedition(ctx,id){
 const S=typeof id==='string'&&Object.hasOwn(SITES,id)?SITES[id]:null;
 const A=typeof id==='string'&&Object.hasOwn(ACCESS,id)?ACCESS[id]:null;
 if(!S||!A||ctx.map?.id!==A.map||!registryReady(ctx.state))return false;
 if(!ctx.state.flag(flag(S.quest,'confirmada'))){await ctx.say('Investiga este lugar y marca tu hipótesis en el mapa del Registro de Sabela.');return false;}
 if(S.quest==='manaphy'&&!ctx.state.zygardeAbility('dive')){await ctx.say('La cuna está bajo el agua. Necesitas Buceo.');return false;}
 if(!await ctx.confirm(`¿Entrar en ${S.name}? Puedes volver por el mismo paso.`))return false;
 await ctx.warp(id,13,22,8);return true;
}
export function withB24Events(map,events){
 let out=[...events];
 if(map==='ciudad_nexo'){
  out=out.map(ev=>ev.id!=='puerta_aduana'?ev:{...ev,script:async ctx=>{if(isPostgame(ctx.state)){await ctx.warp('b24_aduana_vieja',13,22,8);}else await ev.script(ctx);}});
  out.push(object('dlc2_florista',34,35,async ctx=>{
   if(!ctx.state.data.dex.caught.SHAYMIN&&!ctx.state.flag('dlc2_shaymin_capturado')){await ctx.say('La Gracídea florece en Isla Pétalo. Sabela conoce el barco que lleva allí.');return;}
   if(!ctx.state.hasItem('GRACIDEA'))await ctx.giveItem('GRACIDEA',1);else await ctx.say('Cuida la Gracídea. Puede despertar la forma que Shaymin guarda para el cielo.');
  }));
 }
 for(const[id,a]of Object.entries(ACCESS))if(a.map===map){const event=object(`dlc2_acceso_${SITES[id].quest}`,a.x,a.y,ctx=>enterExpedition(ctx,id),s=>registryReady(s)&&Boolean(phase(s,SITES[id].quest)));out.push({...event,pages:event.pages.map(p=>({...p,sprite:'asset:objects/b24_umbral.png'}))});}
 if(Object.hasOwn(IMPOSTORS,map)){
  const a=IMPOSTORS[map];out.push({id:'dlc2_bidoof',...a,pages:[{when:s=>isActive(s,'mew'),sprite:'follower:BIDOOF:0:0',solid:false,through:true,dir:6,speed:2,freq:3,move:{route:['right','left'],repeat:true},trigger:'action',script:reportImpostor}]});
 }
 if(map==='ruta_1')out.push(legendEvent('MEW',{x:8,y:16}));
 if(map==='mesa_vientos')out.push(legendEvent('JIRACHI',{x:18,y:18},{before:offerStar}));
 if(map==='garganta_albo')out.push(legendEvent('KELDEO',{x:19,y:10}));
 if(map==='gruta_escarcha_2')out.push(legendEvent('KYUREM',{x:25,y:18}));
 if(map==='aldea_mnemos')out.push(legendEvent('MELOETTA',{x:8,y:24},{before:ctx=>fieldAction(ctx,'sing')}));
 if(map==='ruta_14_reserva')out.push(legendEvent('XERNEAS',{x:24,y:22}));
 if(map==='calzada_rey')out.push(legendEvent('YVELTAL',{x:25,y:40}));
 if(map==='cumbre_azur')out.push(legendEvent('SOLGALEO',{x:14,y:17}),legendEvent('LUNALA',{x:16,y:17}));
 if(Object.hasOwn(GEAR_SITES,map)){const a=GEAR_SITES[map];const gear=object('dlc2_engranaje',a.x,a.y,collectGear,s=>registryReady(s)&&isActive(s,'magearna')&&!s.flag(`dlc2_magearna_engranaje_${map}`));out.push({...gear,pages:gear.pages.map(p=>({...p,sprite:'asset:objects/b24_engranaje.png'}))});}
 if(map==='lumina_trastos')out.push(object('dlc2_reparacion',9,8,repairMagearna,s=>registryReady(s)&&Boolean(phase(s,'magearna'))),legendEvent('MAGEARNA',{x:9,y:6}));
 if(map==='volcan_tizon')out.push(object('dlc2_forja_crisol',22,19,forgeIdeal,s=>registryReady(s)&&Boolean(phase(s,'ideales'))));
 if(map==='brontia_subestacion')out.push(object('dlc2_danza_lluvia',15,9,ctx=>fieldAction(ctx,'rain')),object('dlc2_trueno',16,9,ctx=>fieldAction(ctx,'thunder')),legendEvent('ZERAORA',{x:14,y:9}));
 if(map==='lumina_guarderia')out.push(object('dlc2_pista_phione',10,6,async ctx=>{
  if(isActive(ctx.state,'phione'))ctx.setFlag('dlc2_phione_indicio');await ctx.say('Manaphy y Ditto pueden poner un Huevo de Phione en esta Guardería. Déjalos con la encargada, camina y vuelve a recoger su Huevo.');
 }));
 return out;
}
/** Dos charcas pequeñas en claros abiertos: el impostor se ve sobre agua real en las cinco rutas. */
export function withB24Build(map,build){
 return b=>{build(b);const y=map==='ruta_5'?27:map==='ruta_11'?23:null;if(y===null)return;
  for(let yy=y;yy<y+3;yy++)for(let x=19;x<22;x++)for(let z=0;z<3;z++)b.set(z,x,yy,0);
  b.rect(null,19,y,3,3,'agua');
 };
}
