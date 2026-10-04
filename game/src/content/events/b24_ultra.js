// Siete reglas locales independientes; la salida nunca forma parte de los cierres del puzzle.
import { readyAction } from './b24_actions.js';
import { partyHas } from './b24_conditions.js';
import { flag, registryReady, isActive } from './b24_registry.js';
import { BLOCKED_TEXT } from './b24_encounters.js';

export const ULTRA_RULES = Object.freeze({
 ultra_cristal: { kind: 'prisms', target: [1, 2, 0], text: 'Tres prismas: este, sur, norte. Gira cada uno hasta orientar su luz. Norte=0, este=1, sur=2.' },
 ultra_selva: { kind: 'ends', target: [0, 1], text: 'Dos rastros, uno en cada claro. Recorre ambos caminos.' },
 ultra_tormenta: { kind: 'order', target: [2, 0, 1], text: 'Las descargas marcan el orden: tercer conductor, primero, segundo.' },
 ultra_cielo: { kind: 'ends', target: [0, 1], text: 'Dos corrientes sostienen las plataformas. Abre el ancla de cada extremo.' },
 ultra_abismo: { kind: 'order', target: [0, 2, 1], text: 'El eco responde: primero, tercero, segundo. Sigue sus voces.' },
 ultra_veneno: { kind: 'order', target: [0, 1, 2], text: 'Cruza la niebla por los refugios: inferior izquierdo, central derecho, superior izquierdo. No sufres daño al equivocarte.' },
 ultra_fortaleza: { kind: 'weights', target: [], text: 'Empuja los tres contrapesos a sus bases. La palanca de la entrada reinicia todos antes de resolverlo.' },
});
const initialWeights = Object.freeze([{ x: 8, y: 16 }, { x: 13, y: 14 }, { x: 18, y: 16 }].map(Object.freeze));
export const WEIGHT_PADS = Object.freeze([{ x: 8, y: 10 }, { x: 13, y: 8 }, { x: 18, y: 10 }].map(Object.freeze));
const same = (a, b) => a.x === b.x && a.y === b.y;
const refresh = (ctx) => ctx.requestRefresh?.();
export function counterweights(state) {
  const raw = state.var('dlc2_ultra_fortaleza_pesos', null);
  if (!Array.isArray(raw) || raw.length !== 3 || raw.some((p) => !p || !Number.isInteger(p.x) || !Number.isInteger(p.y) || p.x < 3 || p.x > 23 || p.y < 3 || p.y > 22) || new Set(raw.map((p) => `${p.x},${p.y}`)).size !== 3) return initialWeights.map((p) => ({ ...p }));
  return raw.map((p) => ({ x: p.x, y: p.y }));
}
function solvedWeights(ctx) {
  if (counterweights(ctx.state).every((p, i) => same(p, WEIGHT_PADS[i]))) { ctx.setFlag('dlc2_ultra_fortaleza_prueba'); refresh(ctx); return true; }
  return false;
}
export async function ultraAction(ctx, id, index) {
  const rule = typeof id === 'string' && Object.hasOwn(ULTRA_RULES, id) ? ULTRA_RULES[id] : null;
  if (!rule || !readyAction(ctx, id, [`b24_${id}`]) || !Number.isInteger(index) || index < 0 || index >= (rule.kind === 'ends' ? 2 : 3)) return false;
  if (ctx.flag(flag(id, 'prueba'))) { await ctx.say('El camino permanece abierto. La puerta de regreso sigue en la entrada.'); return true; }
  const key = flag(id, 'regla'); const raw = ctx.var(key, []); const values = Array.isArray(raw) ? raw : [];
  let next, done;
  if (rule.kind === 'prisms') {
    next = [0, 1, 2].map((n) => Number.isInteger(values[n]) && values[n] >= 0 && values[n] <= 2 ? values[n] : 0);
    next = next.map((v, n) => n === index ? (v + 1) % 3 : v); done = next.every((v, n) => v === rule.target[n]);
    await ctx.say(`Prisma ${index + 1}: ${['norte', 'este', 'sur'][next[index]]}. ${rule.text}`);
  } else if (rule.kind === 'ends') {
    next = [...new Set([...values.filter((n) => n === 0 || n === 1), index])]; done = next.length === 2;
    await ctx.say(rule.kind === 'ends' && id === 'ultra_cielo' ? 'El ancla dirige la corriente hacia la plataforma.' : 'El rastro queda registrado junto al claro.');
  } else if (rule.kind === 'order') {
    const valid = values.length <= rule.target.length && values.every((n, i) => n === rule.target[i]) ? values : [];
    next = index === rule.target[valid.length] ? [...valid, index] : []; done = next.length === rule.target.length;
    await ctx.say(next.length ? `Tramo ${next.length} de 3. El siguiente sigue abierto.` : `La secuencia vuelve al inicio. ${rule.text}`);
  } else return false;
  ctx.setVar(key, next);
  if (done) { ctx.setFlag(flag(id, 'prueba')); await ctx.say('La regla está resuelta. Puedes acercarte al visitante y usar tus Poké Balls.'); }
  refresh(ctx); return done;
}
export async function pushCounterweight(ctx, index) {
  if (!readyAction(ctx, 'ultra_fortaleza', ['b24_ultra_fortaleza']) || !Number.isInteger(index) || index < 0 || index > 2) return false;
  if (solvedWeights(ctx) || ctx.flag('dlc2_ultra_fortaleza_prueba')) return true;
  const positions = counterweights(ctx.state); const p = positions[index]; const d = ctx.player.direction;
  const dx = d === 6 ? 1 : d === 4 ? -1 : 0, dy = d === 2 ? 1 : d === 8 ? -1 : 0;
  if (!dx && !dy || ctx.player.x + dx !== p.x || ctx.player.y + dy !== p.y) return false;
  const to = { x: p.x + dx, y: p.y + dy };
  const occupied = (ctx.world?.events || []).some(e => e !== ctx.event && e.page && !e.erased && !e.through && e.at?.(to.x, to.y) && (e.characterName || e.solid || e.page.noOver));
  if (to.x < 3 || to.x > 23 || to.y < 3 || to.y > 22 || occupied || !ctx.map.passable(p.x, p.y, d, ctx.event) || !ctx.map.passable(to.x, to.y, 10 - d, ctx.event) || positions.some((q, i) => i !== index && same(q, to))) { await ctx.say('El peso no cabe allí. La palanca de la entrada permite empezar de nuevo.'); return false; }
  ctx.setVar('dlc2_ultra_fortaleza_pesos', positions.map((q, i) => i === index ? to : q)); ctx.event?.moveTo?.(to.x, to.y);
  ctx.se?.('PRSFX- Rock Smash'); solvedWeights(ctx); refresh(ctx); return true;
}
export async function resetFortress(ctx) {
  if (!readyAction(ctx, 'ultra_fortaleza', ['b24_ultra_fortaleza'])) return false;
  if (solvedWeights(ctx) || ctx.flag('dlc2_ultra_fortaleza_prueba')) { await ctx.say('Los pesos encajados mantienen abiertas las dos galerías.'); return true; }
  if (!await ctx.confirm('¿Devolver los tres contrapesos a su posición inicial?')) return false;
  ctx.setVar('dlc2_ultra_fortaleza_pesos', initialWeights.map((p) => ({ ...p })));
  for (let i = 0; i < 3; i++) ctx.world.events.find((e) => e.id === `dlc2_peso_${i}`)?.moveTo?.(initialWeights[i].x, initialWeights[i].y);
  refresh(ctx); await ctx.say('Todos los pesos vuelven al inicio. Puedes salir cuando quieras.'); return true;
}
export async function enterUltra(ctx, id) {
  if (typeof id !== 'string' || !Object.hasOwn(ULTRA_RULES, id) || ctx.map?.id !== 'b24_crater_lucero' || !registryReady(ctx.state) || !ctx.flag(flag(id, 'confirmada')) || !(isActive(ctx.state, id) || ctx.flag(flag(id, 'hallazgo')))) return false;
  if (!partyHas(ctx.state, 'SOLGALEO') && !partyHas(ctx.state, 'LUNALA')) { await ctx.say(BLOCKED_TEXT.traveler); return false; }
  if (!await ctx.confirm(`¿Viajar a ${id.replace('ultra_', 'Ultrazona ')}? El regreso permanece abierto aunque tu compañero se debilite.`)) return false;
  await ctx.warp(`b24_${id}`, 13, 22, 8); return true;
}
