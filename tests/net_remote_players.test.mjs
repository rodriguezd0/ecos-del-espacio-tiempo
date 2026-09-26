// Multijugador: avatares de los demás jugadores (net/remotePlayers.js) y el envío de pasos (net/mapSync.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../game/src/world/world.js';
import { GameState } from '../game/src/core/state.js';
import { RemotePlayers } from '../game/src/net/remotePlayers.js';
import { MapNetSync, playerSnapshot, hudText } from '../game/src/net/mapSync.js';
import { mapFromRows } from './world_helpers.mjs';

const ROWS = Array.from({ length: 8 }, () => '..........');
const DT = 1 / 60;

function makeWorld(id = 'mapa_a') {
  const state = GameState.create({ name: 'Prueba' });
  const world = new World({ state, rng: () => 0.5 });
  world.setCurrent({ id, def: { id, outdoor: true, events: [] }, map: mapFromRows(ROWS), offset: { x: 0, y: 0 }, events: null });
  return world;
}

const peer = (av) => ({ id: 'p2', name: 'Beto', gender: 'M', av });
const run = (fn, frames) => { for (let i = 0; i < frames; i++) fn(DT); };

test('avatar remoto: se coloca, anda el paso anunciado y termina en la casilla', () => {
  const world = makeWorld();
  const remote = new RemotePlayers(world);
  const av = remote.addPeer(peer({ m: 'mapa_a', x: 2, y: 3, d: 2, k: 'walk' }));
  assert.equal(av.x, 2);
  assert.equal(av.through, true, 'fantasma: no bloquea');
  remote.applyStep('p2', { m: 'mapa_a', x: 3, y: 3, d: 6, s: 4.5, k: 'run', j: false });
  remote.update(DT);
  assert.equal(av.x, 3);
  assert.ok(av.busy(), 'el paso empieza en el mismo fotograma en que llega');
  assert.equal(av.direction, 6);
  run((dt) => remote.update(dt), 60);
  assert.ok(!av.busy());
  assert.equal(av.realX, 3 * 32);
});

test('avatar remoto: con pasos acumulados acelera, y si se desfasa mucho salta al último', () => {
  const world = makeWorld();
  const remote = new RemotePlayers(world);
  const av = remote.addPeer(peer({ m: 'mapa_a', x: 0, y: 0, d: 6, k: 'walk' }));
  for (let x = 1; x <= 3; x++) remote.applyStep('p2', { m: 'mapa_a', x, y: 0, d: 6, s: 3.5, k: 'walk', j: false });
  remote.update(DT);
  assert.equal(av.moveSpeed, 4.5, 'alcanza con +1 de velocidad');
  for (let x = 4; x <= 12; x++) remote.applyStep('p2', { m: 'mapa_a', x: Math.min(x, 9), y: x > 9 ? x - 9 : 0, d: 2, s: 3.5, k: 'walk', j: false });
  assert.ok(av.queue.length <= 6, 'la cola nunca crece sin límite: salta al último paso conocido');
  run((dt) => remote.update(dt), 600);
  assert.deepEqual([av.x, av.y, av.queue.length], [9, 3, 0], 'acaba donde está su dueño');
});

test('avatar remoto: un salto se reproduce como salto; un cambio de mapa no cargado lo coloca', () => {
  const world = makeWorld();
  const remote = new RemotePlayers(world);
  const av = remote.addPeer(peer({ m: 'mapa_a', x: 2, y: 2, d: 2, k: 'walk' }));
  remote.applyStep('p2', { m: 'mapa_a', x: 2, y: 4, d: 2, s: 3.5, k: 'walk', j: true });
  remote.update(DT);
  assert.ok(av.jumping());
  run((dt) => remote.update(dt), 90);
  remote.applyStep('p2', { m: 'otro_mapa', x: 7, y: 1, d: 8, s: 3.5, k: 'walk', j: false });
  remote.update(DT);
  assert.equal(av.mapId, 'otro_mapa');
  assert.deepEqual([av.x, av.y], [7, 1]);
  assert.equal(remote.renderList().length, 0, 'en un mapa que no está cargado aquí no se dibuja');
});

test('avatar remoto: al cruzar a un mapa conectado se traduce la posición y el paso sigue siendo continuo', () => {
  const world = makeWorld('mapa_a');
  const b = { id: 'mapa_b', def: { id: 'mapa_b', events: [] }, map: mapFromRows(ROWS), offset: { x: 10, y: 0 }, events: null };
  world.addNeighbor(b);
  const remote = new RemotePlayers(world);
  const av = remote.addPeer(peer({ m: 'mapa_a', x: 9, y: 4, d: 6, k: 'walk' }));
  av.setCharsets({ walk: 'trchar000' });
  remote.applyStep('p2', { m: 'mapa_b', x: 0, y: 4, d: 6, s: 3.5, k: 'walk', j: false });
  remote.update(DT);
  assert.equal(av.mapId, 'mapa_b');
  assert.ok(av.moving(), 'anda por la costura en vez de teletransportarse');
  assert.equal(av.moveInitialX, -1);
  const [item] = remote.renderList();
  assert.equal(item.ox, 10 * 32, 'se dibuja con el desplazamiento del mapa vecino');
});

function fakeNet() {
  const handlers = new Map();
  return {
    online: true, status: 'online', room: 'ABCD', peers: new Map(), rtt: 42, sent: [],
    on(t, fn) { handlers.set(t, fn); return () => handlers.delete(t); },
    fire(t, m) { handlers.get(t)?.(m); },
    send(m) { this.sent.push(m); },
  };
}

test('sincronía: el paso propio se anuncia en el fotograma en que empieza, con la velocidad final', () => {
  const world = makeWorld();
  world.player.moveTo(4, 4);
  const client = fakeNet();
  const sync = new MapNetSync({ world }, { client });
  sync.update(DT);
  assert.equal(client.sent.at(-1).t, 'at', 'al entrar se anuncia la posición');
  world.player.startStep(6);
  world.player.setMoveSpeed(4.5);
  sync.update(DT);
  assert.deepEqual(client.sent.at(-1), { t: 'st', m: 'mapa_a', x: 5, y: 4, d: 2, s: 4.5, k: 'walk', j: false });
  const count = client.sent.length;
  sync.update(DT);
  assert.equal(client.sent.length, count, 'sin cambios no se envía nada');
  client.fire('join', { peer: peer({ m: 'mapa_a', x: 1, y: 1, d: 2, k: 'walk' }) });
  assert.equal(world.remote.list.length, 1);
  client.fire('leave', { id: 'p2' });
  assert.equal(world.remote.list.length, 0);
  sync.dispose();
  assert.equal(world.remote, null);
});

test('indicador de sala', () => {
  const client = fakeNet();
  assert.equal(hudText(client), 'Sala ABCD · 1 jugador · 42 ms');
  client.peers.set('p2', {});
  assert.equal(hudText({ ...client, status: 'online' }), 'Sala ABCD · 2 jugadores · 42 ms');
  assert.equal(hudText({ ...client, status: 'connecting' }), 'Sala ABCD · conectando…');
  const world = makeWorld();
  world.player.surfing = true;
  assert.equal(playerSnapshot(world).k, 'surf');
});
