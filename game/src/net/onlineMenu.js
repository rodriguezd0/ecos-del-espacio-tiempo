// Entrada «Online» del menú de pausa: crear una sala, unirse con un código, ver quién está y salir.
import { ui } from '../ui/api.js';
import { net } from './netClient.js';
import { normalizeRoomCode, ROOM_CODE_LENGTH } from './protocol.js';

export async function runOnlineMenu(state) {
  if (net.status === 'off') return offlineMenu(state);
  return roomMenu();
}

async function offlineMenu(state) {
  const pick = await ui.choice(['Crear sala', 'Unirse a una sala', 'Cancelar'], {
    message: 'Juega con otros entrenadores: crea una sala y comparte su código, o únete a la de un amigo.',
    cancel: 2,
  });
  if (pick === 0) return connect('', state);
  if (pick !== 1) return;
  const typed = await ui.textEntry({ title: 'Código de la sala', initial: '', maxLength: ROOM_CODE_LENGTH });
  if (!typed) return;
  const code = normalizeRoomCode(typed);
  if (!code) {
    await ui.message(`El código tiene ${ROOM_CODE_LENGTH} letras o números (sin O, I, 0 ni 1).`);
    return;
  }
  await connect(code, state);
}

async function connect(code, state) {
  const profile = { name: state.player.name, gender: state.player.gender };
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

async function roomMenu() {
  const names = [...net.peers.values()].map((p) => p.name);
  const who = names.length ? `Contigo: ${names.join(', ')}.` : 'Todavía no hay nadie más.';
  const pick = await ui.choice(['Seguir', 'Salir de la sala'], {
    message: `Sala ${net.room}. ${who}`,
    cancel: 0,
  });
  if (pick !== 1) return;
  if (await ui.confirm('¿Salir de la sala?')) {
    net.leave();
    ui.toast('Has salido de la sala.');
  }
}
