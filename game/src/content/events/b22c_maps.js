// Hooks aditivos de mundo. Conservan los eventos de campaña y los de B22a/b/d/e.
import { F, postgame, available, gateFor, latiosSite } from './b22c_common.js';
import { fightLegend } from './b22c_encounters.js';
import { callRain, callSun, lightBrazier, takeRelic } from './b22c_rituals.js';
import { SITES, HOOKS, LATIOS_ROUTE } from '../maps/b22c/layout.js';

export async function enterLegendRoom(ctx,key) {
  if(!postgame(ctx.state)) return;
  if(key==='groudon') {
    if(!ctx.state.hasItem('REDORB')) {await ctx.say(gateFor(ctx.state,key));return;}
    if(!ctx.flag(F.sun)) await callSun(ctx);
  }
  if(key!=='rayquaza') {const reason=gateFor(ctx.state,key);if(reason){await ctx.say(reason);return;}}
  const S=SITES[key];
  if(await ctx.confirm(`¿Entrar en ${key==='lugia'?'la Sima Marina':key==='kyogre'?'la Fosa Abisal':key==='groudon'?'la Veta Magmática':'el Balcón del Cielo'}?`)) {
    await ctx.warp(S.id,S.entry.x,S.entry.y,S.entry.dir,{fade:true});
  }
}
const access=key=>({id:`b22c_acceso_${key}`,x:SITES[key].access.x,y:SITES[key].access.y,
  pages:[{when:postgame,sprite:'asset:objects/b22c_umbral.png',dir:key==='groudon'?4:2,solid:true,trigger:'action',script:ctx=>enterLegendRoom(ctx,key)}]});
const relic=key=>({id:`b22c_reliquia_${key}`,x:HOOKS[key].x,y:HOOKS[key].y,
  pages:[{when:postgame,sprite:'asset:objects/b22c_prismas.png',dir:{blue:2,red:4,dew:6}[key],solid:true,trigger:'action',script:ctx=>takeRelic(ctx,key)}]});

export function withB22cEvents(map,events) {
  let out=[...events];
  if(map==='fondo_mar_sur') {
    out=out.map(e=>!e.id.startsWith('fosa_abisal_')?e:{...e,script:async ctx=>{
      if(postgame(ctx.state)) await enterLegendRoom(ctx,'kyogre');else await e.script(ctx);
    }});
    out.push(access('lugia'));
  }
  if(map==='tizon_cueva') out.push(access('groudon'));
  if(map==='cumbre_azur') out.push(access('rayquaza'));
  if(map==='antea_2_antea') out.push(relic('blue'),relic('dew'));
  if(map==='mina_galena_honda') out.push(relic('red'));
  if(map==='cerro_alba') {
    out=out.map(e=>e.id!=='brasero_alba'?e:{...e,script:async ctx=>{
      if(postgame(ctx.state)) await lightBrazier(ctx);else await e.script(ctx);
    }});
    out.push({id:'b22c_hooh',x:13,y:4,pages:[{when:s=>available(s,'hooh')&&!gateFor(s,'hooh'),sprite:'follower:HOOH:0:0',dir:2,solid:true,trigger:'action',script:ctx=>fightLegend(ctx,'hooh')}]});
  }
  if(map==='lagos_alma') out.push({id:'b22c_reflejo_latias',x:HOOKS.latias.x,y:HOOKS.latias.y,pages:[
    {when:postgame,sprite:'asset:objects/b22c_reflejo.png',dir:2,through:true,trigger:'action',script:ctx=>fightLegend(ctx,'latias')},
    {when:s=>available(s,'latias')&&!gateFor(s,'latias'),sprite:'follower:LATIAS:0:0',dir:4,solid:true,trigger:'action',script:ctx=>fightLegend(ctx,'latias')},
  ]});
  if(map==='mar_del_sur') {
    out.push({id:'b22c_lluvia_superficie',x:HOOKS.rain.x,y:HOOKS.rain.y,pages:[{when:postgame,sprite:'asset:objects/b22c_corriente.png',dir:2,through:true,stepAnime:true,trigger:'action',script:callRain}]});
    out.push(...LATIOS_ROUTE.map((p,i)=>({id:`b22c_latios_${i}`,...p,pages:[{when:s=>available(s,'latios')&&!gateFor(s,'latios')&&latiosSite(s)===i,
      sprite:'follower:LATIOS:0:0',dir:4,solid:true,trigger:'action',script:ctx=>fightLegend(ctx,'latios')}]})));
    out.push({id:'b22c_rastro_latios',x:48,y:24,pages:[{when:postgame,sprite:'asset:objects/b22c_reflejo.png',dir:4,through:true,trigger:'action',script:async ctx=>{
      await ctx.say(gateFor(ctx.state,'latios')||`Latios cruza el Mar del Sur. Ahora vuela en el sector ${['oeste','central','este'][latiosSite(ctx.state)]}. Tras un encuentro cambia de sector.`);
    }}]});
  }
  return out;
}
