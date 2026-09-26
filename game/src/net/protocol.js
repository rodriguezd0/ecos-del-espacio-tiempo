// Protocolo del multijugador (salas online). Compartido por el servidor (server/rooms.mjs) y el cliente
// (net/netClient.js): mensajes JSON cortos por WebSocket, sin compresión, para la menor latencia posible.
//
// Cliente → servidor
//   { t: 'hello', v, room, name, gender }   room: código de 4 letras para unirse, '' para crear una sala
//   { t: 'st', m, x, y, d, s, k, j }        el jugador EMPIEZA un paso (o salto) hacia (x, y) del mapa m
//   { t: 'at', m, x, y, d, k }              posición/orientación en reposo (warp, giro, cambio de modo)
//   { t: 'ping', c }                        c: marca del cliente, se devuelve tal cual en 'pong'
//   { t: 'me', name, gender }               cambia tu nombre/aspecto (p. ej. te uniste desde el título y luego creaste la partida)
//   { t: 'dm', to, b }                      mensaje directo a otro jugador de la sala (b: objeto; combates, intercambios)
// Servidor → cliente
//   { t: 'welcome', id, room, peers: [peer] }  peer: { id, name, gender, av }
//   { t: 'join', peer } · { t: 'leave', id } · { t: 'st'|'at', id, ...avatar } · { t: 'pong', c }
//   { t: 'dm', from, b } · { t: 'peer', peer }  (otro jugador cambió de nombre o aspecto)
//   { t: 'error', code, msg }

export const PROTOCOL_VERSION = 1;
export const NET_PATH = '/__net';
export const MAX_ROOM_PLAYERS = 8;
export const ROOM_CODE_LENGTH = 4;
// Sin letras/dígitos que se confunden al dictarlos (O/0, I/1).
export const ROOM_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const MAX_NAME_LENGTH = 12;
// Un equipo completo viaja en un mensaje directo (combates, intercambios): unos 1–5 KB.
export const MAX_MESSAGE_BYTES = 32 * 1024;

const DIRS = new Set([2, 4, 6, 8]);
const KINDS = new Set(['walk', 'run', 'surf']);
const MAP_ID = /^[a-z0-9_]{1,64}$/;
const COORD_LIMIT = 4096;
const MIN_SPEED = 1;
const MAX_SPEED = 8;

/** Código de sala normalizado (mayúsculas, solo el alfabeto) o null si no es válido. */
export function normalizeRoomCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.trim().toUpperCase();
  if (code.length !== ROOM_CODE_LENGTH) return null;
  return [...code].every((ch) => ROOM_ALPHABET.includes(ch)) ? code : null;
}

/** Nombre visible: sin caracteres de control, recortado; «Entrenador» si queda vacío. */
export function sanitizeName(raw) {
  const clean = typeof raw === 'string' ? raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH) : '';
  return clean || 'Entrenador';
}

export function sanitizeGender(raw) {
  return raw === 'F' ? 'F' : 'M';
}

const isCoord = (v) => Number.isInteger(v) && Math.abs(v) <= COORD_LIMIT;

/**
 * Avatar validado a partir de un mensaje 'st' o 'at' (null si no es válido). Nunca confía en el cliente:
 * solo copia los campos conocidos.
 */
export function sanitizeAvatar(msg, { step = false } = {}) {
  if (!msg || typeof msg !== 'object') return null;
  if (typeof msg.m !== 'string' || !MAP_ID.test(msg.m)) return null;
  if (!isCoord(msg.x) || !isCoord(msg.y) || !DIRS.has(msg.d)) return null;
  const avatar = { m: msg.m, x: msg.x, y: msg.y, d: msg.d, k: KINDS.has(msg.k) ? msg.k : 'walk' };
  if (!step) return avatar;
  const s = Number(msg.s);
  return { ...avatar, s: Number.isFinite(s) ? Math.min(MAX_SPEED, Math.max(MIN_SPEED, s)) : 3.5, j: msg.j === true };
}

/** Parsea un mensaje de texto recibido; null si no es JSON de objeto con `t` o supera el tamaño. */
export function parseMessage(text) {
  if (typeof text !== 'string' || text.length > MAX_MESSAGE_BYTES) return null;
  try {
    const msg = JSON.parse(text);
    return msg && typeof msg === 'object' && typeof msg.t === 'string' ? msg : null;
  } catch {
    return null;
  }
}

/** Código de sala aleatorio (random: () => [0, 1)). */
export function randomRoomCode(random = Math.random) {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_ALPHABET[Math.floor(random() * ROOM_ALPHABET.length)];
  return code;
}
