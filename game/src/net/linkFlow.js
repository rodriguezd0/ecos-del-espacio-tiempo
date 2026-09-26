// Combates online desde el mapa: la acción { type: 'online' } del menú de pausa (retar) y las invitaciones que llegan
// (MapNetSync las pasa aquí cuando el jugador está libre). El combate usa la escena real y NO toca la partida:
// equipos curados en copia, sin experiencia, dinero ni derrota que te devuelva al Centro Pokémon.
import { engine } from '../core/engine.js';
import { ui } from '../ui/api.js';
import { registerFieldAction } from '../world/fieldActions.js';
import { battleIntro } from '../world/battleFlow.js';
import { net } from './netClient.js';
import { inviteToBattle, answerInvite, MODES } from './linkSession.js';
import { inviteToTrade, answerTradeInvite, runTrade } from './trade.js';

const OUTCOME_TEXT = {
  pvp: { win: '¡Has ganado el combate!', lose: 'Has perdido el combate.', draw: 'El combate ha terminado en empate.' },
  coop: { win: '¡Habéis ganado el combate en equipo!', lose: 'Habéis perdido el combate en equipo.', draw: 'El combate ha terminado en empate.' },
};

/** Ejecuta el combate enlazado con transición y música; devuelve el resultado (o null si falló). */
export async function runLinkBattle(scene, { request, channel }) {
  const audio = engine.audio;
  audio?.pushBGM?.();
  audio?.playBGM?.(request.bgm);
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
  await scene.fx.fadeIn(24);
  const mode = request.link.mode;
  if (result && OUTCOME_TEXT[mode][result.outcome]) await ui.message(OUTCOME_TEXT[mode][result.outcome]);
  return result;
}

/** Retar a otro jugador (acción del menú Online). */
async function challenge(ctx, action) {
  const peer = net.peers.get(action.peerId);
  if (!peer) { await ui.message('Ese jugador ya no está en la sala.'); return false; }
  ui.toast(`Esperando la respuesta de ${peer.name}…`);
  let session;
  try {
    session = await inviteToBattle({ peer, mode: action.mode, state: ctx.state, db: engine.data });
  } catch (err) {
    await ui.message(err.message);
    return false;
  }
  await runLinkBattle(ctx.scene, session);
  return true;
}

/** Proponer un intercambio (acción del menú Online). */
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

/** Invitación recibida (desde MapNetSync, con el jugador libre en el mapa). */
export async function handleInvite(ctx, invite) {
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

registerFieldAction('online', async (ctx, action) => {
  if (action.op === 'battle') return challenge(ctx, action);
  if (action.op === 'trade') return offerTrade(ctx, action);
  console.warn('[online] acción desconocida', action);
  return false;
});
