import {DUEL} from '../game/src/content/maps/b19/calzada_layout.js';
import {F} from '../game/src/content/events/b19_common.js';

const TAG='b19_casandra';
const lastDuel=s=>s.battles.findLast(b=>b.tag===TAG);
const money=n=>Number.isSafeInteger(n)&&n>=0;

export function casandraResultError(s) {
 const battle=lastDuel(s);
 return s.flags[F.casandraBeaten]&&battle?.trainer===TAG&&battle.outcome==='win'?null:'Casandra sin victoria real registrada';
}

/** La derrota del guion devuelve al tramo y cura; errores ajenos no autorizan otro combate. */
export function casandraRetryError(s) {
 if(![F.span1,F.span2,F.span3,F.casandraArrived].every(f=>s.flags[f]))return 'reintento sin Calzada alzada o sin Casandra';
 if(s.map!=='calzada_rey'||s.x!==DUEL.retry.x||s.y!==DUEL.retry.y)return 'reintento fuera de la llegada canónica de derrota';
 const b=s.battles.at(-1);
 if(b?.tag!==TAG||b.trainer!==TAG||b.outcome!=='lose'||b.canLose!==true||b.noMoneyLoss!==true)return 'reintento sin derrota protegida de Casandra';
 if(!money(b.moneyBefore)||!money(b.moneyAfter)||b.moneyBefore!==b.moneyAfter)return 'dinero de derrota ausente o alterado';
 if(!s.pokemon.length||!s.pokemon.every(p=>Number.isSafeInteger(p.maxHP)&&p.maxHP>0&&p.hp===p.maxHP&&!p.status))return 'equipo sin cura observada';
 return null;
}

export async function finishCasandra(d) {
 let before=await d.settle();
 if(before.flags[F.casandraBeaten]) {
  const error=casandraResultError(before);if(error)throw Error(error);return before;
 }
 for(let attempt=0;attempt<3;attempt++) {
  const error=casandraRetryError(before);if(error)throw Error(error);
  const [x,y]=DUEL.strip[1];
  await d.walkTo(x,y+1,{face:'up'});await d.step(8);
  const after=await d.settle();
  if(after.battles.length<=before.battles.length||after.battles.at(-1)?.tag!==TAG)throw Error('el reintento no produjo un combate nuevo de Casandra');
  if(after.flags[F.casandraBeaten]) {
   const error=casandraResultError(after);if(error)throw Error(error);return after;
  }
  before=after;
 }
 const error=casandraRetryError(before);if(error)throw Error(error);
 throw Error('Tres derrotas nuevas contra Casandra; hace falta preparar el equipo por menús normales.');
}
