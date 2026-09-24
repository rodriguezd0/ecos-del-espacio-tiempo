// Guardería (lógica pura en world/daycare.js): la encargada deja y devuelve Pokémon, cuenta cómo se llevan y entrega
// el Huevo cuando la pareja lo ha puesto. Como la Guardería de Essentials pero con una sola encargada (sin el anciano
// de la puerta). Uso en un mapa: daycareEvent({ x: 5, y: 3 })  (p. ej. la guardería de Lúmina, B09a).
import { displayName } from '../../battle/core/pokemon.js';
import { formatMoney } from '../../ui/logic/format.js';
import {
  normalizeDaycare, depositPokemon, withdrawPokemon, daycareCount, compatibility, compatibilityText, collectEgg,
  withdrawCost, DAYCARE_SLOTS,
} from '../../world/daycare.js';
import { addEggToParty } from '../../world/eggs.js';

const PARTY_MAX = 6;

export const DAYCARE_TEXT = Object.freeze({
  welcome: '¡Hola! Esto es la Guardería. Cuidamos de tus Pokémon mientras viajas.',
  menu: '¿Qué deseas hacer?',
  options: ['Dejar un Pokémon', 'Recoger un Pokémon', '¿Cómo están?', 'Nada, gracias'],
  eggFound: '¡Ah, estás aquí! Mientras cuidábamos a tus Pokémon apareció un Huevo. No sabemos de dónde salió, pero es tuyo. ¿Lo quieres?',
  eggNoRoom: 'Llevas el equipo lleno. Vuelve cuando tengas un hueco y te daremos el Huevo.',
  eggKept: 'Entonces nos lo quedamos nosotros. Quizá lo cuide otro entrenador.',
  eggReceived: '¡\\PN ha recibido el Huevo de la Guardería!',
  full: 'Ya cuidamos de dos Pokémon tuyos. No tenemos sitio para más.',
  lastOne: 'Si me lo dejas, te quedarás sin Pokémon con los que viajar.',
  choose: '¿Qué Pokémon nos dejas?',
  deposited: (name) => `Cuidaremos bien de ${name}. Vuelve cuando quieras.`,
  none: 'Ahora mismo no cuidamos de ningún Pokémon tuyo.',
  one: (name) => `Estamos cuidando de ${name}. Se porta de maravilla.`,
  pick: '¿A cuál quieres llevarte?',
  cost: (name, cost) => `Recoger a ${name} te costará ${formatMoney(cost)}. ¿De acuerdo?`,
  poor: 'Vaya, no te llega el dinero.',
  partyFull: 'Llevas el equipo lleno. Deja sitio y vuelve a por él.',
  returned: (name) => `Aquí tienes a ${name}. ¡Ha sido un placer!`,
  bye: '¡Vuelve cuando quieras!',
});

const say = (ctx, speaker) => (text) => ctx.say(text, speaker ? { speaker } : {});
const daycareOf = (ctx) => normalizeDaycare(ctx.state.daycare);
const ableCount = (party) => party.filter((p) => !p.egg).length;

function slotLabel(db, slot) {
  const p = slot.pokemon;
  const gender = p.gender === 'M' ? ' ♂' : p.gender === 'F' ? ' ♀' : '';
  return `${displayName(db, p)}${gender} (Nv. ${p.level})`;
}

/** Entrega el Huevo si la pareja lo ha puesto. → true si lo ha entregado. */
async function offerEgg(ctx, talk) {
  const dc = daycareOf(ctx);
  if (!dc.eggReady || daycareCount(dc) < DAYCARE_SLOTS) return false;
  if (!(await ctx.confirm(DAYCARE_TEXT.eggFound))) {
    ctx.state.setDaycare({ ...dc, eggReady: false, stepCounter: 0 });
    await talk(DAYCARE_TEXT.eggKept);
    return false;
  }
  if (ctx.state.party.length >= PARTY_MAX) {
    await talk(DAYCARE_TEXT.eggNoRoom);
    return false;
  }
  const ot = { name: ctx.state.player.name, id: ctx.state.player.id };
  const got = collectEgg(ctx.db, dc, { ot, metMap: ctx.map?.id ?? null, hasShinyCharm: ctx.state.hasItem('SHINYCHARM') });
  if (!got || !addEggToParty(ctx.state, got.egg)) return false;
  ctx.state.setDaycare(got.daycare);
  ctx.me?.('Pkmn get');
  await ctx.say(DAYCARE_TEXT.eggReceived);
  return true;
}

async function depositFlow(ctx, talk) {
  const dc = daycareOf(ctx);
  if (daycareCount(dc) >= DAYCARE_SLOTS) return talk(DAYCARE_TEXT.full);
  if (ableCount(ctx.state.party) <= 1) return talk(DAYCARE_TEXT.lastOne);
  const index = await ctx.ui.openParty({ mode: 'select', message: DAYCARE_TEXT.choose, filter: (p) => !p.egg });
  if (!Number.isInteger(index) || index < 0) return undefined;
  const pokemon = ctx.state.party[index];
  if (!pokemon || pokemon.egg) return undefined;
  ctx.state.setDaycare(depositPokemon(ctx.db, dc, pokemon));
  ctx.state.removePartyMember(index);
  if (index === 0) ctx.scene?.refreshFollower?.();
  return talk(DAYCARE_TEXT.deposited(displayName(ctx.db, pokemon)));
}

async function withdrawFlow(ctx, talk) {
  const dc = daycareOf(ctx);
  const filled = dc.slots.map((s, i) => (s ? i : -1)).filter((i) => i >= 0);
  if (!filled.length) return talk(DAYCARE_TEXT.none);
  if (ctx.state.party.length >= PARTY_MAX) return talk(DAYCARE_TEXT.partyFull);
  let index = filled[0];
  if (filled.length > 1) {
    const labels = [...filled.map((i) => slotLabel(ctx.db, dc.slots[i])), 'Cancelar'];
    const pick = await ctx.choice(labels, { message: DAYCARE_TEXT.pick, cancel: labels.length - 1 });
    if (!Number.isInteger(pick) || pick < 0 || pick >= filled.length) return undefined;
    index = filled[pick];
  }
  const slot = dc.slots[index];
  const name = displayName(ctx.db, slot.pokemon);
  const cost = withdrawCost(slot);
  if (!(await ctx.confirm(DAYCARE_TEXT.cost(name, cost)))) return undefined;
  if (ctx.state.player.money < cost) return talk(DAYCARE_TEXT.poor);
  const out = withdrawPokemon(dc, index);
  ctx.state.addMoney(-cost);
  ctx.state.setDaycare(out.daycare);
  ctx.state.setParty([...ctx.state.party, out.pokemon]);
  ctx.se?.('Mart buy item');
  return talk(DAYCARE_TEXT.returned(name));
}

async function statusFlow(ctx, talk) {
  const dc = daycareOf(ctx);
  const count = daycareCount(dc);
  if (count === 0) return talk(DAYCARE_TEXT.none);
  if (count === 1) return talk(DAYCARE_TEXT.one(displayName(ctx.db, dc.slots.find(Boolean).pokemon)));
  return talk(compatibilityText(compatibility(ctx.db, dc)));
}

/** Guion de la encargada de la Guardería. opts: { speaker, greeting }. */
export async function runDaycare(ctx, { speaker = null, greeting = null } = {}) {
  const talk = say(ctx, speaker);
  await talk(greeting || DAYCARE_TEXT.welcome);
  await offerEgg(ctx, talk);
  for (;;) {
    const cancel = DAYCARE_TEXT.options.length - 1;
    const pick = await ctx.choice(DAYCARE_TEXT.options, { message: DAYCARE_TEXT.menu, cancel });
    if (pick === 0) await depositFlow(ctx, talk);
    else if (pick === 1) await withdrawFlow(ctx, talk);
    else if (pick === 2) await statusFlow(ctx, talk);
    else break;
  }
  await talk(DAYCARE_TEXT.bye);
}

/** Evento de la encargada. opts: { id, x, y, dir, sprite, speaker, greeting, when }. */
export function daycareEvent({ id = 'guarderia', x, y, dir = 2, sprite = 'anil:dama', when, ...opts } = {}) {
  if (!Number.isInteger(x) || !Number.isInteger(y)) throw new Error(`daycareEvent(${id}): x/y enteros obligatorios`);
  return { id, x, y, dir, sprite, move: 'still', when, script: (ctx) => runDaycare(ctx, opts) };
}
