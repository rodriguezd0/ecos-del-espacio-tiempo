// Reintentos acotados de Arceus: decisiones de UI y cura por el manantial, sin cambiar la partida.
import {F,V} from '../game/src/content/events/b21_common.js';
import {BATTLE_TEXT} from '../game/src/content/events/b21_texts.js';
import {COLUMNA} from '../game/src/content/maps/b21/layout.js';

const phaseOf=s=>s.vars?.[V.phase]??0;
const validPhase=n=>Number.isInteger(n)&&n>=0&&n<=2;
const validMoney=n=>Number.isSafeInteger(n)&&n>=0;

export function arceusLossError(b) {
  if(b?.species!=='ARCEUS'||b.level!==75||b.outcome!=='lose'||b.canLose!==true||b.noMoneyLoss!==true)
    return 'sin derrota protegida real de Arceus';
  if(!validMoney(b.moneyBefore)||!validMoney(b.moneyAfter)||b.moneyBefore!==b.moneyAfter)
    return 'dinero de Arceus ausente o cambiado';
  return null;
}

export function arceusHealedError(s) {
  if(!s.pokemon?.length||s.pokemon.some(p=>!Number.isSafeInteger(p.maxHP)||p.maxHP<=0||p.hp!==p.maxHP||p.status))
    return 'sin cura completa observada';
  return null;
}

export function arceusResultError(s) {
  const battle=s.battles.filter(b=>b.species==='ARCEUS').at(-1);
  if(!s.flags?.[F.arceusDone]||!battle||!['win','caught'].includes(battle.outcome)
    ||battle.level!==75||battle.canLose!==true||battle.noMoneyLoss!==true)
    return 'sin victoria real de Arceus';
  if(!validMoney(battle.moneyBefore)||!validMoney(battle.moneyAfter)||battle.moneyBefore!==battle.moneyAfter)
    return 'dinero de la victoria de Arceus ausente o cambiado';
  return null;
}

export function arceusRetreatError(before,after) {
  if(after.map!=='columna_lanza'||after.x!==COLUMNA.retreat.x||after.y!==COLUMNA.retreat.y)
    return 'fuera de la retirada de Columna Lanza';
  if(!after.flags?.[F.zygardeJoined]||!after.flags?.[F.arceusAwake]||after.flags?.[F.arceusDone]
    ||!validPhase(phaseOf(before))||!validPhase(phaseOf(after))||phaseOf(after)<phaseOf(before))
    return 'fase o progreso de Arceus perdido en la retirada';
  if(after.battles.length<=before.battles.length)return 'sin derrota nueva de Arceus';
  const loss=arceusLossError(after.battles.at(-1));if(loss)return loss;
  if(!validMoney(before.money)||before.money!==after.money)return 'dinero cambiado durante la retirada';
  return arceusHealedError(after);
}

/** El primer fallo permite comprobar Reintentar fase; el siguiente elige Retirarse. */
export function arceusRetryChoice(before) {
  const choices=new Map();
  return s=>{
    if(!BATTLE_TEXT.options.every(option=>s.choices?.includes(option)))return 0;
    const count=s.battles.length;
    if(count<=before.battles.length)throw Error('Elección de Arceus sin derrota nueva.');
    const error=arceusLossError(s.battles.at(-1));if(error)throw Error(error);
    if(!choices.has(count))choices.set(count,choices.size===0?0:1);
    return choices.get(count);
  };
}

async function healAtSpring(d,before) {
  await d.talk('b21_manantial_2_1');
  await d.milestone('arceus_manantial',s=>{
    if(s.map!=='columna_lanza'||phaseOf(s)!==phaseOf(before)||s.money!==before.money)
      return 'el manantial cambió fase, lugar o dinero';
    return arceusHealedError(s);
  });
}

export async function completeArceus(d,options={}) {
  d.arceusRetreats??=new Map();
  for(;;) {
    let before=await d.snap();
    if(before.flags?.[F.arceusDone]) {
      const error=arceusResultError(before);if(error)throw Error(error);return;
    }
    if(before.map!=='columna_lanza'||!validPhase(phaseOf(before))||!validMoney(before.money))throw Error('Arceus fuera de su columna, fase o dinero válido.');
    if(arceusHealedError(before)) {await healAtSpring(d,before);before=await d.snap();}
    if((d.arceusRetreats.get(phaseOf(before))||0)>=3)throw Error('Tres retiradas reales en esta fase de Arceus; hace falta preparar el equipo.');
    d.want=before.flags?.[F.zygardeJoined]?['Sí']:['Sí','Sí'];
    await d.walkTo(COLUMNA.flute.x,COLUMNA.flute.y,{face:8});
    await d.interact({...options,choose:arceusRetryChoice(before)});
    const after=await d.snap();
    if(after.flags?.[F.arceusDone]) {
      const error=arceusResultError(after);if(error)throw Error(error);return;
    }
    const error=arceusRetreatError(before,after);if(error)throw Error(error);
    const phase=phaseOf(after),count=(d.arceusRetreats.get(phase)||0)+1;
    d.arceusRetreats.set(phase,count);
    await d.milestone(`arceus_retirada_${phase}_${count}`,s=>arceusRetreatError(before,s));
    console.log(`RETIRADA REAL de Arceus: fase ${phase}, equipo curado y dinero ${after.money} intacto.`);
  }
}
