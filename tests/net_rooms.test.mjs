// Multijugador: protocolo compartido y salas del servidor (server/rooms.mjs), sin sockets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RoomHub } from '../server/rooms.mjs';
import {
  PROTOCOL_VERSION, MAX_ROOM_PLAYERS, normalizeRoomCode, sanitizeAvatar, sanitizeName, parseMessage, randomRoomCode,
} from '../game/src/net/protocol.js';

function fakeClient(id) {
  const inbox = [];
  return { id, inbox, send: (m) => inbox.push(m), last: (t) => [...inbox].reverse().find((m) => m.t === t) };
}

const hello = (room = '', name = 'Ana') => ({ t: 'hello', v: PROTOCOL_VERSION, room, name, gender: 'F' });

test('protocolo: códigos de sala, nombres y avatares se validan', () => {
  assert.equal(normalizeRoomCode(' abcd '), 'ABCD');
  assert.equal(normalizeRoomCode('AB0D'), null, 'sin 0');
  assert.equal(normalizeRoomCode('ABC'), null);
  assert.equal(sanitizeName('  Rojo\u0000  '), 'Rojo');
  assert.equal(sanitizeName(''), 'Entrenador');
  assert.equal(sanitizeName('x'.repeat(40)).length, 12);
  assert.deepEqual(sanitizeAvatar({ m: 'villa_alba', x: 3, y: 4, d: 2, k: 'run', extra: 'no' }), { m: 'villa_alba', x: 3, y: 4, d: 2, k: 'run' });
  assert.equal(sanitizeAvatar({ m: '../x', x: 1, y: 1, d: 2 }), null);
  assert.equal(sanitizeAvatar({ m: 'a', x: 1.5, y: 1, d: 2 }), null);
  assert.equal(sanitizeAvatar({ m: 'a', x: 1, y: 1, d: 5 }), null);
  assert.deepEqual(sanitizeAvatar({ m: 'a', x: 1, y: 1, d: 2, s: 99, j: 1 }, { step: true }), { m: 'a', x: 1, y: 1, d: 2, k: 'walk', s: 8, j: false });
  assert.equal(parseMessage('{"t":"ping"}').t, 'ping');
  assert.equal(parseMessage('[1]'), null);
  assert.equal(parseMessage('no json'), null);
  const code = randomRoomCode(() => 0);
  assert.equal(normalizeRoomCode(code), code);
});

test('salas: crear, unirse, ver a los demás y salir', () => {
  const hub = new RoomHub({ random: () => 0.1 });
  const a = fakeClient('p1');
  const b = fakeClient('p2');
  hub.handle(a, hello(''));
  const room = a.last('welcome').room;
  assert.equal(normalizeRoomCode(room), room);
  assert.deepEqual(a.last('welcome').peers, []);
  hub.handle(a, { t: 'at', m: 'villa_alba', x: 5, y: 6, d: 2, k: 'walk' });
  hub.handle(b, hello(room.toLowerCase(), 'Beto'));
  const peers = b.last('welcome').peers;
  assert.equal(peers.length, 1);
  assert.equal(peers[0].name, 'Ana');
  assert.deepEqual(peers[0].av, { m: 'villa_alba', x: 5, y: 6, d: 2, k: 'walk' }, 'el recién llegado ve dónde está cada uno');
  assert.equal(a.last('join').peer.name, 'Beto');
  hub.handle(b, { t: 'st', m: 'villa_alba', x: 7, y: 6, d: 6, s: 4.5, k: 'run', j: false });
  assert.deepEqual(a.last('st'), { t: 'st', id: 'p2', m: 'villa_alba', x: 7, y: 6, d: 6, k: 'run', s: 4.5, j: false });
  assert.equal(b.inbox.filter((m) => m.t === 'st').length, 0, 'no se reenvía al emisor');
  hub.leave(b);
  assert.equal(a.last('leave').id, 'p2');
  hub.leave(a);
  assert.equal(hub.rooms.size, 0, 'la sala vacía desaparece');
});

test('salas: errores claros (versión, código, inexistente, llena, sin sala)', () => {
  const hub = new RoomHub();
  const c = fakeClient('p1');
  hub.handle(c, { ...hello(''), v: 0 });
  assert.equal(c.last('error').code, 'version');
  hub.handle(c, hello('A0'));
  assert.equal(c.last('error').code, 'bad_code');
  hub.handle(c, hello('ZZZZ'));
  assert.equal(c.last('error').code, 'not_found');
  hub.handle(c, { t: 'st', m: 'a', x: 1, y: 1, d: 2 });
  assert.equal(c.last('error').code, 'no_room');
  const host = fakeClient('h');
  hub.handle(host, hello(''));
  const room = host.last('welcome').room;
  for (let i = 1; i < MAX_ROOM_PLAYERS; i++) hub.handle(fakeClient(`g${i}`), hello(room));
  const late = fakeClient('late');
  hub.handle(late, hello(room));
  assert.equal(late.last('error').code, 'full');
});

test('salas: quien entra desde el título cambia luego de nombre y aspecto; los mensajes directos no salen de la sala', () => {
  const hub = new RoomHub();
  const a = fakeClient('a');
  const b = fakeClient('b');
  const outsider = fakeClient('x');
  hub.handle(a, hello('', 'Entrenador'));
  hub.handle(b, hello(a.last('welcome').room));
  hub.handle(outsider, hello(''));
  hub.handle(a, { t: 'me', name: 'Ana', gender: 'F' });
  assert.deepEqual(b.last('peer').peer, { id: 'a', name: 'Ana', gender: 'F', av: null });
  hub.handle(a, { t: 'dm', to: 'b', b: { k: 'hola' } });
  assert.deepEqual(b.last('dm'), { t: 'dm', from: 'a', b: { k: 'hola' } });
  hub.handle(a, { t: 'dm', to: 'x', b: { k: 'hola' } });
  assert.equal(outsider.last('dm'), undefined, 'otra sala');
});

test('salas: avatares inválidos no se reenvían; ping responde con la misma marca', () => {
  const hub = new RoomHub();
  const a = fakeClient('a');
  const b = fakeClient('b');
  hub.handle(a, hello(''));
  hub.handle(b, hello(a.last('welcome').room));
  hub.handle(b, { t: 'st', m: 'Mapa Malo', x: 1, y: 1, d: 2 });
  assert.equal(a.last('st'), undefined);
  hub.handle(a, { t: 'ping', c: 123.5 });
  assert.deepEqual(a.last('pong'), { t: 'pong', c: 123.5 });
});
