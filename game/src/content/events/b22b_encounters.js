import { bossBattle } from '../common/bossBattle.js';
import { isRiding } from '../../world/zygarde/mount.js';
import { LEGENDS, condition, legendAvailable, encounterRequest, restCount, fieldMoves, beastSeen, isPostgame } from './b22b_common.js';

export const BLOCKED = Object.freeze({
  story: 'El lugar está en calma.', caught: 'Aquí ya no queda nadie. El encuentro terminó contigo.',
  resting: 'Se ha retirado. Volverá cuando descanses.',
  mount: 'El vendaval se te escapa a pie. Monta en Zygarde para alcanzarlo.',
  lightning: 'La tormenta seca deja tres marcas de descarga. Sigue los rayos desde el oeste.',
  clouds: 'Los temblores no convergen todavía. Primero debes capturar a Tornadus y a Thundurus.',
  sightings: 'Quedan rastros de una huida. Busca tres avistamientos distintos antes del encuentro aquí.',
  seal: 'La cáscara aún lo protege. Usa un movimiento de tu equipo para abrirla.',
});
const guardianFor = { tornadus: 'Abril, en Brontia', zapdos: 'Abril, en Brontia', thundurus: 'Fermín, en la casa Galena', articuno: 'Rosendo, en los Talleres del Hielo', moltres: 'la Maestra Brasa, en Tizón' };
/** Dos pasos de huída por suelo real, alejándose del jugador sin atravesarlo. */
export function escapeRoute(event, player) {
  if(!event?.passable)return [];
  const dirs=[[6,1,0,'right'],[4,-1,0,'left'],[8,0,-1,'up'],[2,0,1,'down']];
  const start={x:event.x,y:event.y}, candidates=[];
  const distance=(x,y)=>Math.abs(x-(player?.x??start.x))+Math.abs(y-(player?.y??start.y));
  for(const [d,dx,dy,name]of dirs){
    if(!event.passable(start.x,start.y,d))continue;
    const x=start.x+dx,y=start.y+dy;
    candidates.push({route:[name],distance:distance(x,y)});
    for(const [d2,dx2,dy2,name2]of dirs){
      const nx=x+dx2,ny=y+dy2;
      if((nx===start.x&&ny===start.y)||!event.passable(x,y,d2))continue;
      candidates.push({route:[name,name2],distance:distance(nx,ny)});
    }
  }
  return candidates.sort((a,b)=>b.route.length-a.route.length||b.distance-a.distance)[0]?.route||[];
}
export async function explainBlocked(ctx, key, reason) {
  await ctx.say(reason === 'hint' ? `Habla con ${guardianFor[key]}. Conoce lo que está ocurriendo aquí.` : BLOCKED[reason] || BLOCKED.seal);
}
export async function legendFight(ctx, key) {
  const L = LEGENDS[key];
  const reason = condition(ctx.state, key, { mounted: isRiding(ctx.world) });
  if (reason !== 'ready') { await explainBlocked(ctx, key, reason); return null; }
  await ctx.say(`${L.name} te espera. Nivel ${L.level}. Puedes usar tus objetos y capturarlo con una Poké Ball. Si lo debilitas, volverá después de descansar.`);
  if (ctx.confirm && !(await ctx.confirm(`¿Acercarte a ${L.name}?`))) return null;
  ctx.cry?.(L.species);
  const outcome = await bossBattle(ctx, encounterRequest(key), null, { loseText: `${L.name} se aparta. Tu equipo está curado; puedes volver a intentarlo aquí.` });
  if (outcome === 'caught') {
    ctx.setFlag(L.caught); ctx.setVar(L.rest, -1);
    await ctx.say(`${L.name} se queda contigo.`);
  } else if (outcome === 'win') {
    ctx.setVar(L.rest, restCount(ctx.state));
    await ctx.say(`${L.name} se retira. Cuando descanses, volverá.`);
  }
  ctx.requestRefresh?.();
  return outcome;
}
const sealText = {
  articuno: ['Un capullo de hielo encierra un aleteo. Se funde con un movimiento de Fuego.', 'El hielo se funde y el agua del lago empieza a brillar. Articuno abre las alas.'],
  zapdos: ['Una cáscara de fulgurita crepita junto a las turbinas. Se rompe con un movimiento de Roca o Hielo.', 'La fulgurita se parte. De la cáscara sale un relámpago de plumas: Zapdos.'],
  moltres: ['La costra de basalto está fría por fuera y arde por dentro. Un movimiento de Agua provoca el choque térmico.', 'El basalto cruje bajo el agua. Moltres sale de la grieta con las alas encendidas.'],
};
export async function openSeal(ctx, key) {
  const L = LEGENDS[key];
  if (!L.open) return false;
  const reason = condition(ctx.state, key);
  if (reason === 'ready') return true;
  if (reason !== 'seal') { await explainBlocked(ctx, key, reason); return false; }
  await ctx.say(sealText[key][0]);
  const options = fieldMoves(ctx.state, ctx.db, L.types);
  if (!options.length) {
    await ctx.say('Ningún Pokémon despierto de tu equipo conoce un movimiento adecuado con PP. Puedes regresar cuando lo prepares.');
    return false;
  }
  const pick = await ctx.choice([...options.map((m) => m.label), 'Ahora no'], { message: '¿Qué movimiento de tu equipo quieres usar?', cancel: options.length });
  const action = options[pick];
  if (!action) return false;
  await ctx.say(`¡${ctx.state.party[action.partyIndex].nickname || ctx.db.species[ctx.state.party[action.partyIndex].species].name} ha usado ${ctx.db.moves[action.move].name}!`);
  ctx.cry?.(ctx.state.party[action.partyIndex].species);
  ctx.se?.('PRSFX- Rock Smash');
  await ctx.flash?.(key === 'articuno' ? [255,170,110] : key === 'moltres' ? [120,190,255] : [255,245,130], 16, 150);
  ctx.setFlag(L.open); ctx.requestRefresh?.();
  await ctx.say(sealText[key][1]);
  return true;
}
export async function sighting(ctx, key, site) {
  const L = LEGENDS[key], seen = beastSeen(ctx.state, key);
  if (!L?.beast || !isPostgame(ctx.state) || ctx.state.flag(L.caught) || seen.length >= 3 || seen.includes(site)) return false;
  ctx.cry?.(L.species);
  await ctx.say(`${L.name} te mira un instante. Antes de que puedas acercarte, huye.`);
  if (ctx.event && ctx.move) await ctx.move(ctx.event, escapeRoute(ctx.event,ctx.player), { through: false, speed: 5.5 });
  ctx.setVar(`b22b_${key}_avistamientos`, [...seen, site]);
  ctx.requestRefresh?.();
  const next = { raikou: 'el Anillo de los Vientos', entei: 'la Cantería Solano', suicune: 'el Lago del Sentir' }[key];
  await ctx.say(seen.length === 2 ? `Esta vez el rastro no se pierde. Conduce a ${next}, donde ${L.name} se detiene.` : `Queda un rastro. Has visto a ${L.name} en ${seen.length + 1} de tres lugares distintos.`);
  return true;
}
/** Evento de encuentro con página vacía al capturar/KO, sin bloqueos permanentes del camino. */
export function legendEvent(key, at, { sealed = false } = {}) {
  const L = LEGENDS[key];
  const script = async (ctx) => { if (!sealed || await openSeal(ctx, key)) await legendFight(ctx, key); };
  const visible = (s) => legendAvailable(s, key) && (!L.beast || beastSeen(s, key).length >= 3);
  return {
    id: `b22b_${key}`, x: at.x, y: at.y, name: L.name,
    pages: [{ when: visible, sprite: `follower:${L.species}:0:0`, dir: 2, move: 'still', stepAnime: true, solid: true, trigger: 'action', script }],
  };
}
