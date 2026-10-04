import { F, V, MUSIC, SPRITE, postgame } from './b22e_common.js';
import { BASTION as B, RECEPTION as R, ARENA as A } from '../maps/b22e/bastion_layout.js';
import { bastionRequest, enrollmentError, enrolledSlots, recordMatch, PRIZES, exchangePrize } from './b22e_bastion_logic.js';

const say = (ctx, t) => ctx.say(t, { speaker: 'Recepcionista' });
const name = (ctx, p) => p.nickname || ctx.db.species[p.species]?.name || p.species;

export async function enrollTeam(ctx) {
  const available = ctx.state.party.map((p, i) => ({ p, i })).filter(({ p }) => !p.egg && p.hp > 0);
  if (available.length < 3) { await say(ctx, 'Necesitas tres Pokémon en condiciones de combatir. El Centro está al lado del patio.'); return false; }
  const slots = [];
  while (slots.length < 3) {
    const list = available.filter(({ i }) => !slots.includes(i));
    const labels = list.map(({ p }) => `${name(ctx, p)} · Nv.${p.level}`);
    const i = await ctx.choice([...labels, 'Cancelar'], { message: `Elige el Pokémon ${slots.length + 1} de 3.`, cancel: labels.length });
    if (i < 0 || i >= list.length) return false;
    slots.push(list[i].i);
  }
  const error = enrollmentError(ctx.state, slots);
  if (error) { await say(ctx, error); return false; }
  if (!(await ctx.confirm(`¿Inscribir a ${slots.map((i) => name(ctx, ctx.state.party[i])).join(', ')}?`))) return false;
  ctx.setVar(V.equipo, slots.map((i) => ctx.state.party[i].uid));
  ctx.setVar(V.semilla, (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  ctx.setVar(V.racha, 0);
  return true;
}

export async function bastionRound(ctx) {
  if (!postgame(ctx.state)) { await say(ctx, 'El Bastión aún no ha abierto sus inscripciones.'); return; }
  const slots = enrolledSlots(ctx.state);
  if (!slots) { await say(ctx, 'Trae los tres Pokémon inscritos en tu equipo, o inicia una nueva racha.'); return; }
  const streak = Number(ctx.var(V.racha, 0)) || 0;
  const count = 7 - streak % 7;
  await say(ctx, `Racha actual: ${streak}. Esta ronda tiene ${count} combates; las copias se recuperan entre ellos.`);
  await ctx.warp('bastion_arena', A.entry.x, A.entry.y, A.entry.dir);
  for (let i = 0; i < count; i++) {
    const n = Number(ctx.var(V.racha, 0)) || 0;
    const request = bastionRequest(ctx.db, ctx.state, slots, { seed: ctx.var(V.semilla, 1), streak: n });
    await ctx.say(`Combate ${n + 1}: ${request.trainer.name}.`, { speaker: 'Árbitro' });
    const outcome = await ctx.battle(request);
    const match = recordMatch(ctx.state, typeof outcome === 'object' ? outcome.outcome : outcome);
    if (!match.streak) {
      await ctx.say('La racha termina aquí. Tu récord y tus Puntos de Batalla se conservan.', { speaker: 'Árbitro' });
      break;
    }
    await ctx.say(`Victoria ${match.streak}. Has ganado ${match.points} PB.`, { speaker: 'Árbitro' });
    if (match.round) await ctx.say(match.streak >= 21
      ? 'Tres rondas seguidas. El Bastión reconoce tu dominio de la arena.'
      : 'Ronda de siete completada. Puedes descansar antes de continuar.', { speaker: 'Árbitro' });
  }
  await ctx.warp('bastion_recepcion', R.front.x, R.front.y, R.front.dir);
}

async function rules(ctx) {
  ctx.setFlag(F.bastionReglas);
  await say(ctx, 'Combates individuales, tres Pokémon por participante. Se usan copias curadas a nivel 50. Sus movimientos y objetos equipados se conservan.');
  await say(ctx, 'No se usa la Mochila. Los combates no dan experiencia ni dinero y no alteran a tus Pokémon. Cada ronda tiene siete rivales.');
  await say(ctx, 'Puedes salir entre rondas y continuar con los mismos tres Pokémon. Una derrota termina la racha; el récord y los PB quedan guardados. El canje está a la derecha.');
}
async function reception(ctx) {
  const s = ctx.state;
  const hasTeam = Boolean(enrolledSlots(s));
  const options = [...(hasTeam ? ['Continuar la racha'] : []), 'Inscribir equipo', 'Reglas', 'Salir'];
  const i = await ctx.choice(options, { message: `Bastión Axis · racha ${s.var(V.racha, 0)} · récord ${s.var(V.record, 0)} · ${s.var(V.puntos, 0)} PB`, cancel: options.length - 1 });
  if (options[i] === 'Reglas') { await rules(ctx); return; }
  if (options[i] === 'Continuar la racha') { await bastionRound(ctx); return; }
  if (options[i] === 'Inscribir equipo') {
    if (s.var(V.racha, 0) > 0 && !(await ctx.confirm('Inscribir otro equipo reiniciará la racha actual. ¿Continuar?'))) return;
    if (await enrollTeam(ctx)) await bastionRound(ctx);
  }
}
async function exchange(ctx) {
  const options = PRIZES.map((p) => `${p.name} · ${p.cost} PB`);
  const i = await ctx.choice([...options, 'Salir'], { message: `Canje · ${ctx.var(V.puntos, 0)} PB disponibles`, cancel: options.length });
  if (!PRIZES[i]) return;
  if (!exchangePrize(ctx.state, PRIZES[i].id)) { await ctx.say('Todavía no tienes suficientes PB.', { speaker: 'Encargado de canje' }); return; }
  ctx.se('Mining item get'); await ctx.say(`Has recibido ${PRIZES[i].name}.`, { speaker: 'Encargado de canje' });
}

export function bastionSeaEvents() {
  return [{ id: 'b22e_barca_bastion', ...B.sea, sprite: 'anil:marinero', solid: true, trigger: 'action',
    script: async (ctx) => {
      if (!postgame(ctx.state)) { await ctx.say('La fortaleza del sureste se está preparando para recibir entrenadores. Cuando abra, mi barca llevará hasta allí.'); return; }
      if (await ctx.confirm('¿Tomar la barca hasta el Bastión Axis?')) await ctx.warp('bastion_axis', B.arrival.x, B.arrival.y, B.arrival.dir);
    } }];
}
export function bastionOutsideEvents() {
  return [
    { id: 'barquero_bastion', ...B.returnBoat, sprite: 'anil:marinero', solid: true, trigger: 'action', script: async (ctx) => {
      if (await ctx.confirm('¿Volver al banco de basalto del Mar del Sur?')) await ctx.warp('mar_del_sur', B.sea.x - 1, B.sea.y, 2);
    } },
    { id: 'guia_bastion', x: 21, y: 22, sprite: 'anil:veterano', solid: true, trigger: 'action', script: async (ctx) => {
      await ctx.say('El viejo bastión protegía esta costa. Hoy abrimos las puertas a los entrenadores. Recepción arriba; el Centro Pokémon está al oeste del patio.');
    } },
    { id: 'cartel_bastion', x: 18, y: 14, sprite: null, solid: true, trigger: 'action', script: async (ctx) => {
      await ctx.say('BASTIÓN AXIS\nArena individual · tres Pokémon · nivel 50\nSiete combates por ronda.');
    } },
  ];
}
export function bastionReceptionEvents() {
  return [
    { id: 'recepcion_bastion', ...R.clerk, sprite: SPRITE.recepcion, solid: true, trigger: 'action', script: reception },
    { id: 'canje_bastion', ...R.canje, sprite: SPRITE.canje, solid: true, dir: 4, trigger: 'action', script: exchange },
    { id: 'reglas_bastion', ...R.rules, sprite: 'anil:veterana', solid: true, trigger: 'action', script: rules },
    { id: 'record_bastion', ...R.record, sprite: null, solid: true, trigger: 'action', script: async (ctx) => {
      await ctx.say(`Registro del Bastión\nMejor racha: ${ctx.var(V.record, 0)}\nRacha en curso: ${ctx.var(V.racha, 0)}\nPuntos de Batalla: ${ctx.var(V.puntos, 0)}${ctx.flag(F.bastionMaestro) ? '\nTítulo: Maestro del Bastión' : ''}`);
    } },
  ];
}
export async function bastionArrival(ctx) {
  if (ctx.flag(F.bastionLlegada)) return;
  ctx.setFlag(F.bastionLlegada);
  await ctx.say('La vieja fortaleza ha vuelto a abrir sus puertas. En la explanada llegan entrenadores de toda Axis.');
}
