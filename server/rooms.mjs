// Salas del multijugador (lógica pura, sin sockets): altas/bajas, código de sala y reenvío de avatares.
// `client` es cualquier objeto con { id, send(obj) }; server/multiplayer.mjs lo conecta con WebSocket.
import {
  PROTOCOL_VERSION, MAX_ROOM_PLAYERS, normalizeRoomCode, randomRoomCode, sanitizeAvatar, sanitizeGender, sanitizeName,
} from '../game/src/net/protocol.js';

const MAX_CODE_ATTEMPTS = 50;

export class RoomHub {
  constructor({ random = Math.random } = {}) {
    this.random = random;
    this.rooms = new Map(); // código → Map(id → miembro)
    this.members = new Map(); // id de cliente → miembro { client, room, name, gender, av }
  }

  /** Procesa un mensaje ya parseado de un cliente. */
  handle(client, msg) {
    if (msg.t === 'hello') return this.join(client, msg);
    if (msg.t === 'ping') return client.send({ t: 'pong', c: msg.c });
    const member = this.members.get(client.id);
    if (!member) return client.send({ t: 'error', code: 'no_room', msg: 'No estás en ninguna sala.' });
    if (msg.t === 'st' || msg.t === 'at') return this.relayAvatar(member, msg);
    if (msg.t === 'dm') return this.direct(member, msg);
    return undefined;
  }

  /** Mensaje directo a otro jugador de la MISMA sala (el contenido lo interpreta el juego). */
  direct(member, msg) {
    const target = typeof msg.to === 'string' ? this.members.get(msg.to) : null;
    if (!target || target.room !== member.room || target === member) return;
    if (!msg.b || typeof msg.b !== 'object' || Array.isArray(msg.b)) return;
    target.client.send({ t: 'dm', from: member.client.id, b: msg.b });
  }

  join(client, msg) {
    if (msg.v !== PROTOCOL_VERSION) {
      return client.send({ t: 'error', code: 'version', msg: 'Versión del juego distinta: recarga la página.' });
    }
    this.leave(client);
    const wanted = msg.room ? normalizeRoomCode(msg.room) : null;
    if (msg.room && !wanted) return client.send({ t: 'error', code: 'bad_code', msg: 'Código de sala no válido.' });
    if (wanted && !this.rooms.has(wanted)) return client.send({ t: 'error', code: 'not_found', msg: `No existe la sala ${wanted}.` });
    const code = wanted || this.freshCode();
    if (!code) return client.send({ t: 'error', code: 'full_server', msg: 'No quedan salas libres.' });
    const room = this.rooms.get(code) || new Map();
    if (room.size >= MAX_ROOM_PLAYERS) return client.send({ t: 'error', code: 'full', msg: `La sala ${code} está llena.` });
    const member = { client, room: code, name: sanitizeName(msg.name), gender: sanitizeGender(msg.gender), av: null };
    const peers = [...room.values()].map(publicPeer);
    room.set(client.id, member);
    this.rooms.set(code, room);
    this.members.set(client.id, member);
    client.send({ t: 'welcome', id: client.id, room: code, peers });
    this.broadcast(member, { t: 'join', peer: publicPeer(member) });
    return undefined;
  }

  leave(client) {
    const member = this.members.get(client.id);
    if (!member) return;
    this.members.delete(client.id);
    const room = this.rooms.get(member.room);
    room?.delete(client.id);
    if (room && room.size === 0) this.rooms.delete(member.room);
    else this.broadcast(member, { t: 'leave', id: client.id });
  }

  relayAvatar(member, msg) {
    const av = sanitizeAvatar(msg, { step: msg.t === 'st' });
    if (!av) return;
    member.av = { m: av.m, x: av.x, y: av.y, d: av.d, k: av.k };
    this.broadcast(member, { t: msg.t, id: member.client.id, ...av });
  }

  broadcast(from, payload) {
    const room = this.rooms.get(from.room);
    if (!room) return;
    for (const other of room.values()) if (other !== from) other.client.send(payload);
  }

  freshCode() {
    for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
      const code = randomRoomCode(this.random);
      if (!this.rooms.has(code)) return code;
    }
    return null;
  }
}

function publicPeer(member) {
  return { id: member.client.id, name: member.name, gender: member.gender, av: member.av };
}
