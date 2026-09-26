// Entrada «Online» del menú de pausa: crear una sala, unirse con un código, retar a otro jugador (1 contra 1 o
// doble en equipo contra entrenadores expertos) y salir. Devuelve null o una acción para el mapa
// ({ type: 'online', op: 'battle', mode, peerId }, la ejecuta net/linkFlow.js ya con el menú cerrado).
import { ui } from '../ui/api.js';
import { net } from './netClient.js';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from './protocol.js';
import { MODES, cannotBattle } from './linkSession.js';

export async function runOnlineMenu(state) {
  if (net.status === 'off') { await offlineMenu(state); return null; }
  return roomMenu(state);
}

async function offlineMenu(state) {
  const pick = await ui.choice(['Crear sala', 'Unirse a una sala', 'Cancelar'], {
    message: 'Juega con otros entrenadores: crea una sala y comparte su código, o únete a la de un amigo.',
    cancel: 2,
  });
  if (pick === 0) return connect('', state);
  if (pick !== 1) return undefined;
  const typed = await ui.textEntry({ title: 'Código de la sala', initial: '', maxLength: ROOM_CODE_LENGTH });
  if (!typed) return undefined;
  const code = normalizeRoomCode(typed);
  if (!code) {
    await ui.message(`El código tiene ${ROOM_CODE_LENGTH} letras o números (sin O, I, 0 ni 1).`);
    return undefined;
  }
  return connect(code, state);
}

async function connect(code, state) {
  // Desde el título aún no hay partida: nombre provisional; el mapa lo actualiza al empezar (net.updateProfile).
  const profile = state?.player?.name ? { name: state.player.name, gender: state.player.gender } : { name: 'Entrenador', gender: 'M' };
  ui.toast('Conectando…');
  try {
    const room = await net.join(code, profile);
    await ui.message(code
      ? `Has entrado en la sala ${room}.`
      : `Sala creada. Código: ${room}\nDíselo a tus amigos para que se unan desde Online.`);
  } catch (err) {
    await ui.message(err.message || 'No se pudo conectar.');
  }
}

/** Menú Online de la pantalla de título: entrar en una sala antes de empezar o cargar la partida. */
export async function runTitleOnlineMenu() {
  if (net.status === 'off') { await offlineMenu(null); return; }
  const names = [...net.peers.values()].map((p) => p.name);
  const who = names.length ? `Contigo: ${names.join(', ')}.` : 'Todavía no hay nadie más.';
  const pick = await ui.choice(['Seguir', 'Salir de la sala'], { message: `Sala ${net.room}. ${who} Empieza o carga tu partida y os veréis en el mapa.`, cancel: 0 });
  if (pick === 1) { net.leave(); ui.toast('Has salido de la sala.'); }
}

/** Elige a otro jugador de la sala (directo si solo hay uno). null si cancela o no hay nadie. */
async function pickPeer(prompt) {
  const peers = [...net.peers.values()];
  if (!peers.length) { await ui.message('Todavía no hay nadie más en la sala.'); return null; }
  if (peers.length === 1) return peers[0];
  const i = await ui.choice([...peers.map((p) => p.name), 'Cancelar'], { message: prompt, cancel: peers.length });
  return peers[i] || null;
}

async function roomMenu(state) {
  const names = [...net.peers.values()].map((p) => p.name);
  const who = names.length ? `Contigo: ${names.join(', ')}.` : 'Todavía no hay nadie más.';
  const options = [MODES.pvp.short, MODES.coop.short, 'Intercambiar', 'Salir de la sala', 'Seguir'];
  const pick = await ui.choice(options, { message: `Sala ${net.room}. ${who} (Tecla E: globos y chat.)`, cancel: 4 });
  if (pick === 2) {
    const peer = await pickPeer('¿Con quién quieres intercambiar?');
    return peer ? { type: 'online', op: 'trade', peerId: peer.id } : null;
  }
  if (pick === 0 || pick === 1) {
    const why = cannotBattle(state);
    if (why) { await ui.message(why); return null; }
    const mode = pick === 0 ? 'pvp' : 'coop';
    const peer = await pickPeer(pick === 0 ? '¿A quién quieres retar?' : '¿Con quién quieres formar equipo?');
    return peer ? { type: 'online', op: 'battle', mode, peerId: peer.id } : null;
  }
  if (pick === 3 && await ui.confirm('¿Salir de la sala?')) {
    net.leave();
    ui.toast('Has salido de la sala.');
  }
  return null;
}
