// Intercambio online entre dos jugadores (simétrico: los dos lados hacen lo mismo):
//   1) cada uno elige qué ofrecer → { k: 'offer', p }       (o { k: 'cancel' })
//   2) cada uno ve la oferta del otro (puede ver sus datos) → { k: 'decide', ok }
//   3) solo si los dos aceptan, cada uno aplica el cambio, evoluciona si toca y guarda la partida en el acto
//      (así no se puede duplicar un Pokémon recargando).
import { engine } from '../core/engine.js';
import { SaveSystem } from '../core/state.js';
import { ui } from '../ui/api.js';
import { net } from './netClient.js';
import { LinkChannel, INVITE_TIMEOUT_MS } from './linkSession.js';
import { cannotOffer, validateTradePokemon, applyTrade } from './tradeLogic.js';
import { displayName } from '../battle/core/pokemon.js';

const LAST_SLOT_KEY = 'ecos.lastSlot';
const randomId = () => Math.floor(Math.random() * 0x7fffffff).toString(36);

const describe = (db, p) => (p.egg ? 'un Huevo' : `${displayName(db, p)} (Nv. ${p.level})`);

/** Invita a intercambiar. Devuelve el canal si acepta; lanza Error con el motivo si no. */
export async function inviteToTrade({ peer, client = net }) {
  const channel = new LinkChannel(client, peer.id, randomId());
  channel.send({ k: 'invite', mode: 'trade' });
  const reply = await channel.next({ timeoutMs: INVITE_TIMEOUT_MS });
  if (reply.k === 'accept') return channel;
  channel.close();
  if (reply.timeout) throw new Error(`${peer.name} no ha respondido.`);
  if (reply.gone) throw new Error(`${peer.name} ya no está en la sala.`);
  throw new Error(`${peer.name} no quiere intercambiar ahora.`);
}

/** Responde a una invitación de intercambio. Devuelve el canal si se acepta, o null. */
export function answerTradeInvite({ invite, accepted, client = net }) {
  const channel = new LinkChannel(client, invite.from, invite.s);
  channel.send({ k: accepted ? 'accept' : 'decline' });
  if (accepted) return channel;
  channel.close();
  return null;
}

/** Guarda en la última ranura usada si la partida ya se había guardado alguna vez. */
function autosave(state) {
  if (!state.data.savedAt) return false;
  let slot = 1;
  try { slot = Number(localStorage.getItem(LAST_SLOT_KEY)) || 1; } catch { /* sin almacenamiento */ }
  SaveSystem.save(slot, state);
  return true;
}

/** Elige qué ofrecer (null si cancela). */
async function chooseOffer(state) {
  for (;;) {
    const index = await ui.openParty({ mode: 'select', message: '¿Qué Pokémon quieres ofrecer?' });
    if (index === null || index === undefined || index < 0) return null;
    const why = cannotOffer(state, index);
    if (!why) return index;
    await ui.message(why);
  }
}

/** ¿Acepta el jugador la oferta? (con opción de ver sus datos). */
async function reviewOffer(db, peerName, received, given) {
  for (;;) {
    const pick = await ui.choice(['Intercambiar', 'Ver sus datos', 'Cancelar'], {
      message: `${peerName} ofrece ${describe(db, received)} a cambio de ${describe(db, given)}.`,
      cancel: 2,
    });
    if (pick === 1) { await ui.openSummary(received); continue; }
    return pick === 0;
  }
}

/** Sesión completa de intercambio (los dos jugadores la ejecutan a la vez). */
export async function runTrade(ctx, channel, peerName) {
  const state = ctx.state;
  const db = engine.data;
  try {
    const index = await chooseOffer(state);
    if (index === null) {
      channel.send({ k: 'cancel' });
      await ui.message('Has cancelado el intercambio.');
      return false;
    }
    const given = state.party[index];
    channel.send({ k: 'offer', p: given });
    ui.toast(`Esperando la oferta de ${peerName}…`);
    const offer = await channel.next();
    if (offer.gone) { await ui.message(`${peerName} se ha desconectado.`); return false; }
    if (offer.k !== 'offer') { await ui.message(`${peerName} ha cancelado el intercambio.`); return false; }
    let received;
    try {
      received = validateTradePokemon(db, offer.p);
    } catch (err) {
      channel.send({ k: 'decide', ok: false });
      await ui.message(`La oferta no es válida: ${err.message}`);
      return false;
    }
    const ok = await reviewOffer(db, peerName, received, given);
    channel.send({ k: 'decide', ok });
    ui.toast(`Esperando a ${peerName}…`);
    const decision = await channel.next();
    if (!ok) { await ui.message('Has cancelado el intercambio.'); return false; }
    if (decision.gone || decision.k !== 'decide' || !decision.ok) {
      await ui.message(decision.gone ? `${peerName} se ha desconectado.` : `${peerName} ha cancelado el intercambio.`);
      return false;
    }
    const result = applyTrade(state, db, index, received);
    await ui.message(`¡Has intercambiado ${describe(db, given)} por ${describe(db, received)}!`);
    if (result.evolveTo) {
      const { evolvePartyMember } = await import('../ui/screens/progression.js');
      await evolvePartyMember(index, result.evolveTo);
    }
    if (autosave(state)) await ui.message('Se ha guardado la partida.');
    return true;
  } finally {
    channel.close();
  }
}
