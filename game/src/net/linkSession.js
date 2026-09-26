// Sesiones entre dos jugadores de la sala (combate 1 contra 1 o doble en equipo): invitación, aceptación, reparto de
// equipos y semilla, y el canal ordenado de mensajes que usa battle/link/linkBattle.js durante el combate.
//
// Invitación (mensajes directos 'dm', campo `s` = id de sesión):
//   A → B { k: 'invite', mode }                 B → A { k: 'accept', party, megaRing, gender } | { k: 'decline', why }
//   A → B { k: 'start', seed, party, megaRing, foes? }   (A es el anfitrión: posición canónica 0)
//   durante el combate: { k: 'cmd' | 'sw', … } en los dos sentidos · { k: 'abort' } si algo falla al empezar
import { net } from './netClient.js';
import { linkParty } from '../battle/link/linkBattle.js';
import { coopTrainers, coopLevel } from './coopTrainers.js';

export const INVITE_TIMEOUT_MS = 30000;
export const MODES = Object.freeze({
  pvp: { label: 'un combate', short: 'Combate 1 contra 1' },
  coop: { label: 'un combate doble en equipo contra entrenadores expertos', short: 'Combate doble en equipo' },
});
const HUMAN_SPRITE = { M: 'anil:aspirante', F: 'anil:aspirante_f' };
const MEGA_KEY_ITEMS = ['MEGARING', 'MEGABRACELET', 'KEYSTONE', 'MEGACUFF', 'MEGACHARM'];

const randomId = () => Math.floor(Math.random() * 0x7fffffff).toString(36);
const randomSeed = () => Math.floor(Math.random() * 0xffffffff) >>> 0;

/** Canal FIFO de mensajes de UNA sesión con UN jugador. next() → siguiente mensaje o { gone: true }. */
export class LinkChannel {
  constructor(client, peerId, sessionId) {
    this.client = client;
    this.peerId = peerId;
    this.sessionId = sessionId;
    this.queue = [];
    this.waiters = [];
    this.closed = false;
    this.offs = [
      client.on('dm', (m) => { if (m.from === peerId && m.b?.s === sessionId) this.push(m.b); }),
      client.on('leave', (m) => { if (m.id === peerId) this.push({ gone: true }); }),
      client.on('status', (st) => { if (st === 'off') this.push({ gone: true }); }),
    ];
  }

  push(msg) {
    const waiter = this.waiters.shift();
    if (waiter) waiter(msg);
    else this.queue.push(msg);
  }

  send(body) {
    this.client.send({ t: 'dm', to: this.peerId, b: { ...body, s: this.sessionId } });
  }

  next({ timeoutMs = 0 } = {}) {
    if (this.queue.length) return Promise.resolve(this.queue.shift());
    return new Promise((resolve) => {
      let timer = null;
      const waiter = (msg) => { clearTimeout(timer); resolve(msg); };
      this.waiters.push(waiter);
      if (timeoutMs > 0) {
        timer = setTimeout(() => {
          this.waiters = this.waiters.filter((w) => w !== waiter);
          resolve({ timeout: true });
        }, timeoutMs);
      }
    });
  }

  close() {
    for (const off of this.offs) off();
    this.offs = [];
    this.closed = true;
  }
}

export const hasMegaRing = (state) => MEGA_KEY_ITEMS.some((k) => (state.data.bag?.[k] || 0) > 0);

/** Motivo por el que este jugador no puede combatir online, o null. */
export function cannotBattle(state) {
  return state.party.some((p) => p && !p.egg && p.hp > 0) ? null : 'No tienes Pokémon en condiciones de combatir.';
}

/** Lo que cada jugador aporta al combate (equipo curado, Mega Aro, aspecto). */
function contribution(state, db) {
  return { party: linkParty(db, state.party), megaRing: hasMegaRing(state), gender: state.player.gender, name: state.player.name };
}

/**
 * Petición de combate para world/battleFlow + battle/scene/runner (request.link activa battle/link/linkBattle.js).
 * role: 'host' | 'guest'. me/peer: { name, gender, party, megaRing }.
 */
export function linkBattleRequest({ mode, role, me, peer, seed, foes = null, channel }) {
  const host = role === 'host';
  const base = {
    type: 'trainer',
    seed,
    bgm: 'battle_trainer',
    canLose: true,
    keepBgm: false,
    rules: { canRun: false, canCatch: false, expGain: false, moneyGain: false, canLose: true },
    battleback: 'Ciudad',
    time: 'day',
  };
  const link = { mode, remoteName: peer.name, send: (b) => channel.send(b), next: () => channel.next() };
  if (mode === 'pvp') {
    return {
      ...base,
      format: 'single',
      player: { name: me.name, gender: me.gender, party: me.party, bag: {}, megaRing: me.megaRing, expAll: false },
      trainer: { id: 'online', name: peer.name, class: '', sprite: HUMAN_SPRITE[peer.gender] || HUMAN_SPRITE.M, party: peer.party, megaRing: peer.megaRing, ai: 0, loseText: '¡Buen combate!' },
      link: { ...link, mirror: !host, localOwner: 0, localIdx: 0, remoteIdx: 1 },
    };
  }
  // Equipo: el anfitrión es siempre el entrenador 0 del bando 0 (posición 0) y el compañero el 1 (posición 2).
  const [first, second] = host ? [me, peer] : [peer, me];
  return {
    ...base,
    format: 'double',
    player: { name: first.name, gender: me.gender, party: first.party, bag: {}, megaRing: first.megaRing, expAll: false },
    ally: { name: second.name, party: second.party, megaRing: second.megaRing, skill: 0 },
    trainers: foes,
    link: { ...link, mirror: false, localOwner: host ? 0 : 1, localIdx: host ? 0 : 2, remoteIdx: host ? 2 : 0 },
  };
}

/**
 * Anfitrión: invita a `peer` y, si acepta, prepara el combate. Devuelve { request, channel } o lanza Error con el
 * motivo para el jugador (rechazo, sin respuesta, desconexión).
 */
export async function inviteToBattle({ peer, mode, state, db, client = net }) {
  const why = cannotBattle(state);
  if (why) throw new Error(why);
  const channel = new LinkChannel(client, peer.id, randomId());
  try {
    channel.send({ k: 'invite', mode });
    const reply = await channel.next({ timeoutMs: INVITE_TIMEOUT_MS });
    if (reply.timeout) throw new Error(`${peer.name} no ha respondido.`);
    if (reply.gone) throw new Error(`${peer.name} ya no está en la sala.`);
    if (reply.k !== 'accept') throw new Error(reply.why || `${peer.name} ha rechazado ${MODES[mode].label}.`);
    const me = contribution(state, db);
    const other = { name: peer.name, gender: reply.gender, party: reply.party, megaRing: Boolean(reply.megaRing) };
    const seed = randomSeed();
    const foes = mode === 'coop' ? coopTrainers(db, { level: coopLevel(me.party, other.party), seed: seed ^ 0x5bd1e995 }) : null;
    channel.send({ k: 'start', seed, party: me.party, megaRing: me.megaRing, gender: me.gender, foes });
    return { channel, request: linkBattleRequest({ mode, role: 'host', me, peer: other, seed, foes, channel }) };
  } catch (err) {
    channel.close();
    throw err;
  }
}

/**
 * Invitado: responde a una invitación (accepted = lo que eligió el jugador) y, si acepta, espera el inicio.
 * Devuelve { request, channel } o null si la rechazó; lanza Error si el anfitrión desaparece.
 */
export async function answerInvite({ invite, accepted, state, db, client = net }) {
  const channel = new LinkChannel(client, invite.from, invite.s);
  const why = accepted ? cannotBattle(state) : null;
  if (!accepted || why) {
    channel.send({ k: 'decline', why: why ? `${state.player.name} no tiene Pokémon en condiciones de combatir.` : null });
    channel.close();
    if (why) throw new Error(why);
    return null;
  }
  const me = contribution(state, db);
  channel.send({ k: 'accept', party: me.party, megaRing: me.megaRing, gender: me.gender });
  const start = await channel.next({ timeoutMs: INVITE_TIMEOUT_MS });
  if (start.k !== 'start') {
    channel.close();
    throw new Error(`${invite.name} ha cancelado el combate.`);
  }
  const peer = { name: invite.name, gender: start.gender, party: start.party, megaRing: Boolean(start.megaRing) };
  return { channel, request: linkBattleRequest({ mode: invite.mode, role: 'guest', me, peer, seed: start.seed, foes: start.foes, channel }) };
}
