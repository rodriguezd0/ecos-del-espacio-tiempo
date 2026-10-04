// Jugar en equipo (online): dos jugadores de la sala forman equipo y, cuando un entrenador de la historia reta a uno
// de ellos con el compañero en el MISMO mapa y libre, el combate es doble: los dos contra ese entrenador, con su
// equipo real de la historia. El combate cuenta de verdad para los dos (experiencia, dinero, movimientos, evolución,
// entrenador derrotado en las dos partidas; si perdéis, cada uno vuelve a su punto de cura).
// Si el compañero está en otro mapa u ocupado, el combate es individual como siempre.
//
// Mensajes (directos, sesión `s`): anfitrión → { k: 'invite', mode: 'coopBattle', trainer, seed, env, mark, me }
//   compañero → { k: 'accept', me } | { k: 'decline' } · anfitrión → { k: 'start' } · luego 'cmd'/'sw'/'lm' del combate.
import { net } from './netClient.js';
import { LinkChannel } from './linkSession.js';
import { pokemonFromSpec } from '../battle/scene/setup.js';
import { evolutionTarget } from '../battle/core/pokemon.js';
import { isExpShareOn } from '../ui/logic/expShare.js';
import { isNightHour } from '../render/dayNight.js';

export const COOP_ANSWER_MS = 5000; // lo que espera el anfitrión antes de combatir solo
export const COOP_START_MS = 8000;
const MEGA_KEY_ITEMS = ['MEGARING', 'MEGABRACELET', 'KEYSTONE', 'MEGACUFF', 'MEGACHARM'];

// ------------------------------------------------------------ equipo
const listeners = new Set();
export const team = { partnerId: null, partnerName: null };

export function setTeam(peer) {
  team.partnerId = peer?.id || null;
  team.partnerName = peer?.name || null;
  for (const fn of listeners) fn(team);
}

export function onTeamChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Deshace el equipo (y avisa al compañero si `notify`). */
export function leaveTeam({ notify = true, client = net } = {}) {
  if (notify && team.partnerId) client.send({ t: 'dm', to: team.partnerId, b: { k: 'team_leave' } });
  setTeam(null);
}

let wired = false;
/** Escucha la salida del compañero (de la sala o del equipo). Idempotente. */
export function wireTeam(client = net, { toast = () => {} } = {}) {
  if (wired) return;
  wired = true;
  client.on('leave', (m) => { if (m.id === team.partnerId) { toast(`${team.partnerName} ha salido de la sala: el equipo se deshace.`); setTeam(null); } });
  client.on('status', (s) => { if (s === 'off') setTeam(null); });
  client.on('dm', (m) => {
    if (m.b?.k === 'team_leave' && m.from === team.partnerId) { toast(`${team.partnerName} ha deshecho el equipo.`); setTeam(null); }
  });
}

// ------------------------------------------------------------ elegibilidad y equipos
/** Equipo que se lleva al combate: los Pokémon que no son huevo (índices en la partida para devolverlos luego). */
export function battleParty(state) {
  const slots = [];
  const party = [];
  state.party.forEach((p, i) => { if (p && !p.egg) { slots.push(i); party.push(JSON.parse(JSON.stringify(p))); } });
  return { party, slots };
}

export function playerContribution(state) {
  const { party, slots } = battleParty(state);
  return {
    name: state.player.name,
    gender: state.player.gender,
    id: state.player.id,
    party,
    slots,
    megaRing: MEGA_KEY_ITEMS.some((k) => (state.data.bag?.[k] || 0) > 0),
    expAll: isExpShareOn(state),
  };
}

/** ¿Este combate (petición de ctx.battle) puede jugarse en equipo? */
export function coopEligible(config) {
  if (!config || config.noCoop) return false;
  const isTrainer = config.type === 'trainer' || Boolean(config.trainer);
  if (!isTrainer || config.wild) return false;
  if (Array.isArray(config.trainers) || config.ally || (config.phases && config.phases.length)) return false;
  return (config.format ?? 'single') === 'single';
}

/** Compañero de equipo en el mismo mapa (o null). */
export function partnerHere(mapId, client = net) {
  if (!client.online || !team.partnerId) return null;
  const peer = client.peers.get(team.partnerId);
  return peer && peer.av?.m === mapId ? peer : null;
}

/**
 * Definición de entrenador completa y serializable (equipo ya creado), la misma para las dos simulaciones.
 * config: petición de ctx.battle ({ trainer: id | def, opponent: { name, party } }).
 */
export function resolveCoopTrainer(config, { db, state, getTrainer }) {
  let def;
  if (typeof config.trainer === 'string') def = { ...getTrainer(config.trainer, state), id: config.trainer };
  else if (config.trainer && typeof config.trainer === 'object') def = { ...config.trainer };
  else def = { id: 'npc', name: config.opponent?.name || 'Entrenador', class: '', party: config.opponent?.party || [], sprite: config.trainerSprite || null };
  if (config.opponent?.party && typeof config.trainer === 'string') def.party = config.opponent.party;
  return { ...def, party: (def.party || []).map((spec) => JSON.parse(JSON.stringify(pokemonFromSpec(db, spec)))) };
}

/**
 * Petición de combate doble en equipo para las dos simulaciones. El anfitrión es el entrenador 0 del bando 0
 * (posición 0) y el compañero el 1 (posición 2) en las dos; `role` decide quién es «el jugador» en esta pantalla.
 */
export function coopStoryRequest({ role, host, guest, trainer, seed, env = {}, canLose = false, channel }) {
  const isHost = role === 'host';
  const me = isHost ? host : guest;
  const other = isHost ? guest : host;
  return {
    type: 'trainer',
    format: 'double',
    seed,
    trainer,
    canLose,
    bgm: env.bgm || undefined,
    battleback: env.battleback || null,
    environment: env.environment || null,
    weather: env.weather || null,
    time: env.time || 'day',
    player: { name: host.name, gender: me.gender, id: host.id, party: host.party, bag: {}, megaRing: host.megaRing, expAll: host.expAll },
    ally: { name: guest.name, id: guest.id, party: guest.party, megaRing: guest.megaRing, expAll: guest.expAll, skill: 0 },
    rules: { canRun: false, canCatch: false, expGain: true, moneyGain: true, canLose },
    link: {
      mode: 'coop', mirror: false, localOwner: isHost ? 0 : 1, localIdx: isHost ? 0 : 2, remoteIdx: isHost ? 2 : 0,
      remoteName: other.name, send: (b) => channel.send(b), next: () => channel.next(),
    },
  };
}

/**
 * Aplica el resultado del combate en equipo a MI partida: mi parte del equipo (respetando huevos y posiciones),
 * dinero y vistos. Devuelve las evoluciones pendientes [{ index, species }].
 */
export function applyCoopResult(state, db, { result, role, slots, levelsBefore, time }) {
  const mine = (role === 'host' ? result.playerParty : result.allyParty) || [];
  const party = state.party.slice();
  slots.forEach((stateIndex, i) => { if (mine[i]) party[stateIndex] = mine[i]; });
  state.setParty(party);
  const delta = Number(result.moneyChange) || 0;
  if (delta > 0) state.addMoney(delta);
  else if (delta < 0) state.addMoney(-Math.min(state.player.money, -delta));
  for (const sp of result.seen || []) state.registerSeen(sp);
  const evolutions = [];
  // Los dos motores usaron el horario del anfitrión; los relojes de las partidas pueden ser distintos.
  const isDay = time ? time !== 'night' : !isNightHour(state.hour);
  slots.forEach((stateIndex, i) => {
    const p = party[stateIndex];
    if (!p || p.hp <= 0 || !(p.level > levelsBefore[i])) return;
    const target = evolutionTarget(db, p, { trigger: 'level', isDay });
    if (target) evolutions.push({ index: stateIndex, species: target });
  });
  return { evolutions };
}

const randomId = () => Math.floor(Math.random() * 0x7fffffff).toString(36);
const randomSeed = () => (Math.floor(Math.random() * 0xffffffff) >>> 0);

/**
 * Anfitrión: si hay compañero en el mapa, le pide unirse. Devuelve { request, channel, contribution } o null
 * (sin compañero, no contesta a tiempo o no puede: se combate solo).
 */
export async function hostCoopBattle({ config, state, db, getTrainer, mapId, env, client = net }) {
  if (!coopEligible(config)) return null;
  const partner = partnerHere(mapId, client);
  if (!partner) return null;
  const me = playerContribution(state);
  if (!me.party.some((p) => p.hp > 0)) return null;
  const trainer = resolveCoopTrainer(config, { db, state, getTrainer });
  const seed = randomSeed();
  const channel = new LinkChannel(client, partner.id, randomId());
  channel.send({ k: 'invite', mode: 'coopBattle', trainer, seed, env, mark: config.coopMark || null, canLose: Boolean(config.canLose), me });
  const reply = await channel.next({ timeoutMs: COOP_ANSWER_MS });
  if (reply.k !== 'accept' || !reply.me?.party?.some((p) => p.hp > 0)) {
    channel.close();
    return null;
  }
  channel.send({ k: 'start' });
  const request = coopStoryRequest({ role: 'host', host: me, guest: reply.me, trainer, seed, env, canLose: Boolean(config.canLose), channel });
  return { request, channel, contribution: me };
}

/** Compañero: acepta automáticamente si puede. Devuelve { request, channel, contribution, mark } o null. */
export async function joinCoopBattle({ invite, state, client = net }) {
  const channel = new LinkChannel(client, invite.from, invite.s);
  const me = playerContribution(state);
  if (!me.party.some((p) => p.hp > 0)) {
    channel.send({ k: 'decline' });
    channel.close();
    return null;
  }
  channel.send({ k: 'accept', me });
  const start = await channel.next({ timeoutMs: COOP_START_MS });
  if (start.k !== 'start') { channel.close(); return null; }
  const b = invite.body;
  const request = coopStoryRequest({ role: 'guest', host: b.me, guest: me, trainer: b.trainer, seed: b.seed, env: b.env, canLose: b.canLose, channel });
  return { request, channel, contribution: me, mark: b.mark };
}
