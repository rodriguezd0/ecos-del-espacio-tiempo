import { F, postgame } from './b22c_common.js';

export async function ramonHint(ctx) {
  if(!postgame(ctx.state)) return;
  if(ctx.flag(F.ramon)) { await ctx.say('Bucea bajo Talasa y busca la boca de la Sima Marina. Sus marcas ofrecen guía visible o sonora.',{speaker:'Ramón'}); return; }
  await ctx.say('Bajo Talasa hay una sima que las dragas no tocaron. La luz llega a golpes: algo lanza Aerochorros en la oscuridad.',{speaker:'Ramón'});
  await ctx.say('Necesitas Buceo. En el fondo, al sur de la plataforma, sigue las corrientes hasta la boca. Puedes elegir destellos largos, señales visibles o una guía sonora.',{speaker:'Ramón'});
  ctx.setFlag(F.ramon);
}
export async function olvidoGift(ctx) {
  if(!postgame(ctx.state)) return;
  if(!ctx.flag(F.brazier) && !ctx.state.hasItem('SACREDASH')) {
    await ctx.say('Conservé esta Ceniza Sagrada entre los calcos. En el Cerro del Alba hay un brasero; enciéndelo al amanecer, entre las seis y las nueve.',{speaker:'Olvido'});
    await ctx.giveItem('SACREDASH',1);ctx.setFlag(F.ash);
  } else await ctx.say('El brasero del Cerro del Alba responde al amanecer. Cuando Ho-Oh se retire, descansa y vuelve otra mañana.',{speaker:'Olvido'});
}
/** Envuelve las páginas finales, incluidas las revanchas, sin tocar condiciones ni coordenadas. */
export function withB22cHints(events) {
  return events.map(e=>{
    const hint=e.id==='ramon' ? ramonHint : e.id.includes('olvido') && (e.sprite || e.pages?.some(p=>p.sprite)) ? olvidoGift : null;
    if(!hint) return e;
    const wrap=script=>async ctx=>{await hint(ctx);if(typeof script==='function') await script(ctx);};
    return e.pages ? {...e,pages:e.pages.map(p=>({...p,script:wrap(p.script || e.script)}))} : {...e,script:wrap(e.script)};
  });
}
