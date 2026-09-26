// Multijugador de extremo a extremo: servidor HTTP real con WebSocket (server/multiplayer.mjs) y dos NetClient
// del juego conectados con la librería ws. Mide también la latencia de reenvío en local.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import WebSocket from 'ws';
import { attachMultiplayer } from '../server/multiplayer.mjs';
import { NetClient } from '../game/src/net/netClient.js';
import { NET_PATH } from '../game/src/net/protocol.js';

async function startServer() {
  const server = http.createServer((_req, res) => res.writeHead(404).end());
  const mp = attachMultiplayer(server, { log: () => {} });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const url = `ws://127.0.0.1:${server.address().port}${NET_PATH}`;
  const close = async () => {
    for (const ws of mp.wss.clients) ws.terminate();
    await new Promise((resolve) => server.close(resolve));
  };
  return { url, close };
}

const next = (client, type) => new Promise((resolve) => { const off = client.on(type, (m) => { off(); resolve(m); }); });

test('dos jugadores: sala, se ven, pasos reenviados en pocos ms, salida', async () => {
  const srv = await startServer();
  const a = new NetClient({ WebSocketImpl: WebSocket, url: srv.url });
  const b = new NetClient({ WebSocketImpl: WebSocket, url: srv.url });
  try {
    const room = await a.join('', { name: 'Ana', gender: 'F' });
    assert.equal(a.status, 'online');
    const joined = next(a, 'join');
    assert.equal(await b.join(room, { name: 'Beto', gender: 'M' }), room);
    assert.equal((await joined).peer.name, 'Beto');
    assert.equal(b.peers.size, 1);

    const samples = [];
    for (let i = 0; i < 20; i++) {
      const got = next(a, 'st');
      const t0 = performance.now();
      b.send({ t: 'st', m: 'villa_alba', x: i, y: 2, d: 6, s: 3.5, k: 'walk', j: false });
      const msg = await got;
      samples.push(performance.now() - t0);
      assert.equal(msg.x, i);
    }
    samples.sort((x, y) => x - y);
    const median = samples[Math.floor(samples.length / 2)];
    assert.ok(median < 20, `reenvío en local: mediana ${median.toFixed(2)} ms`);

    const left = next(a, 'leave');
    b.leave();
    assert.equal((await left).id !== undefined, true);
    assert.equal(a.peers.size, 0);
  } finally {
    a.leave();
    b.leave();
    await srv.close();
  }
});

test('unirse a una sala que no existe: error claro y sin conexión colgada', async () => {
  const srv = await startServer();
  const c = new NetClient({ WebSocketImpl: WebSocket, url: srv.url });
  try {
    await assert.rejects(c.join('ZZZZ', { name: 'X', gender: 'M' }), /No existe la sala ZZZZ/);
    assert.equal(c.status, 'off');
  } finally {
    c.leave();
    await srv.close();
  }
});

test('el servidor rechaza rutas WebSocket distintas de NET_PATH', async () => {
  const srv = await startServer();
  try {
    const ws = new WebSocket(srv.url.replace(NET_PATH, '/otra'));
    await new Promise((resolve) => { ws.on('error', resolve); ws.on('close', resolve); });
    assert.notEqual(ws.readyState, WebSocket.OPEN);
  } finally {
    await srv.close();
  }
});
