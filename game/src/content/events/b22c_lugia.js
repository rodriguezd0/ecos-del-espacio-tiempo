import { postgame } from './b22c_common.js';
import { SITES, LUGIA_ROUTE } from '../maps/b22c/layout.js';

const options=['Destellos de Aerochorro','Destellos largos y marcas visibles','Guía sonora y marcas visibles','Marcas visibles sin destellos'];
export const guideMode=s=>{const n=Number(s.var('b22c_lugia_guia',0));return Number.isInteger(n)&&n>=0&&n<4?n:0;};
export async function configureGuide(ctx) {
  const i=await ctx.choice([...options,'Cancelar'],{message:'¿Cómo quieres seguir el Aerochorro?',cancel:4});
  if(i<0||i>=4) return;
  ctx.setVar('b22c_lugia_guia',i);ctx.setVar('b22c_lugia_senales',0);ctx.requestRefresh?.();
  if(i===2) await ctx.say('Las marcas quedan iluminadas. Un tono grave señala el oeste; uno agudo, el este. Dos tonos señalan el norte. Puedes cambiar de guía al volver a esta placa.');
  else await ctx.say(i===3?'Las marcas permanecen iluminadas, sin destellos. La vuelta sigue las mismas corrientes.':'Cada golpe de Aerochorro señala la siguiente corriente. Puedes cambiar la guía en esta placa.');
}
const direction=(a,b)=>Math.abs(b.x-a.x)>Math.abs(b.y-a.y)?b.x<a.x?4:6:b.y<a.y?8:2;
export function lugiaGuides() {
  return [{id:'b22c_lugia_guia',...SITES.lugia.guide,sprite:'asset:objects/b22c_placa.png',solid:true,trigger:'action',script:configureGuide},
    ...LUGIA_ROUTE.map((p,i)=>{
      const next=LUGIA_ROUTE[i+1]||SITES.lugia.legend,dir=direction(p,next);
      const modePage=visible=>({when:visible?s=>guideMode(s)>0:undefined,sprite:'asset:objects/b22c_corriente.png',dir,directionFix:true,walkAnime:false,through:true,
        opacity:visible?255:55,light:visible?{radius:88,intensity:0.7}:undefined,trigger:'touch',script:async ctx=>{
          const mode=guideMode(ctx.state), bit=1<<i, seen=Number(ctx.var('b22c_lugia_senales',0));
          if(seen&bit) return;ctx.setVar('b22c_lugia_senales',seen|bit);
          if(mode===0||mode===1) {ctx.se?.('PRSFX- Aeroblast');await ctx.flash?.([160,210,255],mode===1?90:15,80);}
          if(mode===2) {ctx.se?.('Mining ping',{pitch:dir===4?65:dir===6?140:105});if(dir===8){await ctx.wait?.(12);ctx.se?.('Mining ping',{pitch:105});}}
          ctx.ui?.toast?.(`La corriente sigue hacia ${dir===4?'el oeste':dir===6?'el este':'el norte'}.`);
        }});
      return {id:`b22c_aerochorro_${i}`,...p,pages:[modePage(false),modePage(true)]};
    })];
}
export async function marineEnter(ctx) {
  if(!postgame(ctx.state)) {const b=SITES.lugia.back;await ctx.warp(b.map,b.x,b.y,b.dir);return;}
  if(ctx.flag('b22c_sima_marina_llegada')) return;
  ctx.setFlag('b22c_sima_marina_llegada');
  await ctx.say('La Sima Marina se extiende bajo Talasa. El Aerochorro de Lugia ilumina las corrientes a golpes. La placa de entrada ofrece marcas permanentes y guía sonora.');
  await configureGuide(ctx);
}
