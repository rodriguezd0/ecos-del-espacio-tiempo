// Online desde el mapa: la acción { type: 'online' } del menú de pausa (retar, intercambiar, formar equipo) y las
// invitaciones que llegan (MapNetSync las pasa aquí cuando el jugador está libre).
//   · Combate 1 contra 1: escena real que NO toca la partida (equipos curados en copia, sin experiencia ni dinero).
//   · En equipo (net/coopBattle.js): cuando un entrenador de la historia reta a uno con el compañero en el mismo
//     mapa, combate doble de los dos contra él, que cuenta de verdad para las dos partidas.
import { engine } from '../core/engine.js';
import { ui } from '../ui/api.js';
import { registerFieldAction } from '../world/fieldActions.js';
import { battleIntro, whiteout } from '../world/battleFlow.js';
import { finalizeBattleResult } from '../battle/scene/results.js';
import { getTrainer } from '../content/trainers/index.js';
import { isNightHour } from '../render/dayNight.js';
import { net } from './netClient.js';
import { LinkChannel, INVITE_TIMEOUT_MS, inviteToBattle, answerInvite, MODES } from './linkSession.js';
import { inviteToTrade, answerTradeInvite, runTrade } from './trade.js';
import { team, setTeam, wireTeam, hostCoopBattle, joinCoopBattle, applyCoopResult } from './coopBattle.js';

const PVP_TEXT = { win: '¡Has ganado el combate!', lose: 'Has perdido el combate.', draw: 'El combate ha terminado en empate.' };
const randomId = () => Math.floor(Math.random() * 0x7fffffff).toString(36);

wireTeam(net, { toast: (t) => ui.toast(t) });

/** Transición, música y escena de combate (sin aplicar nada a la partida). Devuelve el resultado del motor o null. */
async function playLinkedBattle(scene, request, channel) {
  const audio = engine.audio;
  audio?.pushBGM?.();
  audio?.playBGM?.(request.bgm || 'battle_trainer');
  await battleIntro(scene, { trainer: true });
  scene.inBattle = true;
  let result = null;
  try {
    const { runSceneBattle } = await import('../battle/scene/runner.js');
    result = await runSceneBattle(request, { state: null, db: engine.data });
  } catch (err) {
    console.error('[online] combate', err);
    engine.reportError?.(err);
    channel.send({ k: 'abort' });
  } finally {
    channel.close();
    scene.inBattle = false;
  }
  audio?.resumeBGM?.(20);
  scene.fx.clearTransition();
  scene.fx.fadeAmount = 1;
  scene.fx.fadeColor = [0, 0, 0];
  return result;
}

/** Combate 1 contra 1 (no toca la partida). */
export async function runLinkBattle(scene, { request, channel }) {
  const result = await playLinkedBattle(scene, request, channel);
  await scene.fx.fadeIn(24);
  if (result && PVP_TEXT[result.outcome]) await ui.message(PVP_TEXT[result.outcome]);
  return result;
}

/**
 * Combate en equipo contra un entrenador de la historia: aplica a MI partida mi parte del resultado (equipo,
 * experiencia, dinero, evoluciones), marca el entrenador como derrotado y, si perdemos sin poder perder, vuelvo a mi
 * punto de cura. Devuelve el resultado con el contrato de world/battleFlow ({ outcome, party, stored: true }).
 */
export async function runCoopBattle(scene, { request, channel, contribution, mark = null, role }) {
  const state = scene.state;
  const levelsBefore = contribution.party.map((p) => p.level);
  const raw = await playLinkedBattle(scene, request, channel);
  const result = raw || { outcome: 'draw', playerParty: null, allyParty: null };
  const { evolutions } = raw ? applyCoopResult(state, engine.data, { result: raw, role, slots: contribution.slots, levelsBefore, time: request.time }) : { evolutions: [] };
  if (result.outcome === 'win' && mark) {
    state.setSelfSwitch(mark.mapId, mark.eventId, 'A', true);
    scene.world.requestRefresh();
  }
  if (evolutions.length) {
    const { evolvePartyMember } = await import('../ui/screens/progression.js');
    for (const ev of evolutions) await evolvePartyMember(ev.index, ev.species);
  }
  scene.refreshFollower();
  if (result.outcome === 'lose' && !request.canLose) await whiteout(scene, result);
  else await scene.fx.fadeIn(24);
  return finalizeBattleResult({ ...result, party: state.party.slice() }, { stored: true, canLose: Boolean(request.canLose) });
}

/** Condiciones del mapa del anfitrión (las dos simulaciones deben usar las mismas). */
function battleEnv(scene, config) {
  const def = scene.world.current.def;
  return {
    battleback: config.battleback || def.battleback || null,
    environment: config.environment || scene.world.player.terrainTag().battleEnvironment || null,
    weather: config.weather || (scene.weather.type !== 'none' ? scene.weather.type : null),
    time: isNightHour(scene.state.hour) ? 'night' : 'day',
    bgm: config.bgm || null,
  };
}

/**
 * Llamado por MapScene.startBattle antes del combate normal: si el compañero de equipo está en el mapa, el
 * combate contra este entrenador se juega en equipo. Devuelve el resultado o null (combate normal).
 */
export async function tryCoopBattle(scene, config) {
  if (!team.partnerId) return null;
  let session = null;
  try {
    session = await hostCoopBattle({
      config, state: scene.state, db: engine.data, getTrainer, mapId: scene.world.current.id, env: battleEnv(scene, config),
    });
  } catch (err) {
    console.warn('[online] combate en equipo no disponible; se combate solo', err);
    return null;
  }
  if (!session) return null;
  return runCoopBattle(scene, { ...session, role: 'host' });
}

// ------------------------------------------------------------ acciones del menú Online
async function challenge(ctx, action) {
  const peer = net.peers.get(action.peerId);
  if (!peer) { await ui.message('Ese jugador ya no está en la sala.'); return false; }
  ui.toast(`Esperando la respuesta de ${peer.name}…`);
  let session;
  try {
    session = await inviteToBattle({ peer, mode: 'pvp', state: ctx.state, db: engine.data });
  } catch (err) {
    await ui.message(err.message);
    return false;
  }
  await runLinkBattle(ctx.scene, session);
  return true;
}

async function offerTrade(ctx, action) {
  const peer = net.peers.get(action.peerId);
  if (!peer) { await ui.message('Ese jugador ya no está en la sala.'); return false; }
  ui.toast(`Esperando la respuesta de ${peer.name}…`);
  let channel;
  try {
    channel = await inviteToTrade({ peer });
  } catch (err) {
    await ui.message(err.message);
    return false;
  }
  return runTrade(ctx, channel, peer.name);
}

async function formTeam(action) {
  const peer = net.peers.get(action.peerId);
  if (!peer) { await ui.message('Ese jugador ya no está en la sala.'); return false; }
  ui.toast(`Esperando la respuesta de ${peer.name}…`);
  const channel = new LinkChannel(net, peer.id, randomId());
  channel.send({ k: 'invite', mode: 'team' });
  const reply = await channel.next({ timeoutMs: INVITE_TIMEOUT_MS });
  channel.close();
  if (reply.k !== 'accept') {
    await ui.message(reply.timeout ? `${peer.name} no ha respondido.` : `${peer.name} no quiere formar equipo ahora.`);
    return false;
  }
  setTeam(peer);
  await ui.message(TEAM_TEXT(peer.name));
  return true;
}

const TEAM_TEXT = (name) => `¡Formas equipo con ${name}! Cuando un entrenador os rete estando los dos en el mismo mapa, combatiréis juntos.`;

registerFieldAction('online', async (ctx, action) => {
  if (action.op === 'battle') return challenge(ctx, action);
  if (action.op === 'trade') return offerTrade(ctx, action);
  if (action.op === 'team') return formTeam(action);
  console.warn('[online] acción desconocida', action);
  return false;
});

// ------------------------------------------------------------ invitaciones recibidas
export async function handleInvite(ctx, invite) {
  if (invite.mode === 'coopBattle') {
    if (team.partnerId !== invite.from) return; // solo del compañero de equipo
    const session = await joinCoopBattle({ invite, state: ctx.state });
    if (!session) return;
    ui.toast(`¡Combate en equipo con ${invite.name}!`);
    await runCoopBattle(ctx.scene, { ...session, role: 'guest' });
    return;
  }
  if (invite.mode === 'team') {
    const accepted = await ui.confirm(`${invite.name} quiere formar equipo contigo: combatiréis juntos contra los entrenadores que os encontréis en el mismo mapa. ¿Aceptas?`);
    const channel = new LinkChannel(net, invite.from, invite.s);
    channel.send({ k: accepted ? 'accept' : 'decline' });
    channel.close();
    if (accepted) {
      setTeam({ id: invite.from, name: invite.name });
      await ui.message(TEAM_TEXT(invite.name));
    }
    return;
  }
  if (invite.mode === 'trade') {
    const accepted = await ui.confirm(`${invite.name} quiere intercambiar Pokémon contigo. ¿Aceptas?`);
    const channel = answerTradeInvite({ invite, accepted });
    if (channel) await runTrade(ctx, channel, invite.name);
    return;
  }
  const accepted = await ui.confirm(`${invite.name} te propone ${MODES[invite.mode]?.label || 'un combate'}. ¿Aceptas?`);
  let session;
  try {
    session = await answerInvite({ invite, accepted, state: ctx.state, db: engine.data });
  } catch (err) {
    await ui.message(err.message);
    return;
  }
  if (session) await runLinkBattle(ctx.scene, session);
}
