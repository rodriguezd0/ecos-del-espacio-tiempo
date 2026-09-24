// Posada y rincones de descanso (docs/CAMPANA.md §3.1, X25): delegan en el descanso del agente de historia
// (world/rest.js, expuesto como ctx.rest). «Descansar hasta tormenta» solo en las posadas marcadas (Brontia,
// Villa Boreal y el Hotel Mirador de Lúmina): `storm: true`.
//
// Uso: innkeeperEvent({ x: 6, y: 4, storm: true })   ·   restSpotEvent('sofa', 3, 10)  (Centro Pokémon)
import { formatMoney } from '../../ui/logic/format.js';

const TEXT = Object.freeze({
  welcome: '¡Bienvenido a la posada! Aquí puedes descansar tranquilo.',
  price: (p) => `La habitación cuesta ${formatMoney(p)} la noche. ¿Te quedas?`,
  poor: 'Vaya, no te llega el dinero para la habitación.',
  bye: '¡Que tengas buen viaje!',
  spot: '¿Quieres descansar un rato?',
  unavailable: 'Ahora mismo no se puede descansar aquí.',
});

/**
 * Descanso con el servicio de world/rest.js (ctx.rest). opts: los de rest() ({ kind, storm, message… }).
 * → { rested } (rested false si se cancela o si el descanso no está disponible).
 */
export async function runRest(ctx, opts = {}) {
  if (typeof ctx.rest !== 'function') {
    await ctx.say(TEXT.unavailable);
    return { rested: false };
  }
  return ctx.rest(opts);
}

/** Posadero: saludo, precio opcional (price, en $) y menú de descanso de posada. */
export async function runInn(ctx, { price = 0, storm = false, speaker = null, greeting = null } = {}) {
  const say = (t) => ctx.say(t, speaker ? { speaker } : {});
  await say(greeting || TEXT.welcome);
  if (price > 0) {
    if (!(await ctx.confirm(TEXT.price(price)))) { await say(TEXT.bye); return { rested: false }; }
    if (ctx.state.player.money < price) { await say(TEXT.poor); return { rested: false }; }
  }
  const r = await runRest(ctx, { kind: 'inn', storm });
  if (r?.rested && price > 0) ctx.state.addMoney(-price);
  await say(TEXT.bye);
  return r;
}

/** Evento del posadero. opts: { id, x, y, dir, sprite, price, storm, speaker, greeting, when }. */
export function innkeeperEvent({ id = 'posadero', x, y, dir = 2, sprite = 'anil:dama', when, ...opts } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`innkeeperEvent(${id}): x/y enteros obligatorios`);
  return { id, x, y, dir, sprite, move: 'still', when, script: (ctx) => runInn(ctx, opts) };
}

/** Rincón de descanso sin personaje (sofá del Centro, banco del campamento…). kind: 'center' | 'camp' | 'bed'. */
export function restSpotEvent(id, x, y, { kind = 'center', message = TEXT.spot } = {}) {
  return {
    id, x, y, trigger: 'action', noOver: true, solid: true,
    script: (ctx) => runRest(ctx, { kind, message }),
  };
}
