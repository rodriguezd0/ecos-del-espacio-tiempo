import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapFromRows, miniWorld, step } from './world_helpers.mjs';
import { Character, moveTimeFor, commandDelayFor } from '../game/src/world/character.js';
import { Player, WALK_SPEED, TURN_HOLD_SECONDS } from '../game/src/world/player.js';
import { MapEvent, normalizeEventDef } from '../game/src/world/mapEvent.js';
import { Follower } from '../game/src/world/follower.js';

test('tiempos de Essentials: velocidad 3 = 0.25 s, 4 = 0.125 s, 5 = 0.1 s, 6 = 0.05 s', () => {
  assert.equal(moveTimeFor(3), 0.25);
  assert.equal(moveTimeFor(4), 0.125);
  assert.equal(moveTimeFor(5), 0.1);
  assert.equal(moveTimeFor(6), 0.05);
  assert.ok(Math.abs(moveTimeFor(3.5) - 0.1768) < 0.001, 'andar de Añil (3.5)');
  assert.equal(commandDelayFor(6), 0);
  assert.ok(Math.abs(commandDelayFor(3) - 2.55) < 1e-9);
});

test('un paso interpola realX y termina en la casilla destino en moveTime', () => {
  const map = mapFromRows(['....']);
  const w = miniWorld(map);
  const c = new Character(w, { map, x: 0, y: 0, speed: 3 });
  assert.equal(c.moveGeneric(6), true);
  step(c, 8); // 8/60 s ≈ 0.133 s de 0.25
  assert.ok(c.realX > 0 && c.realX < 32, `a mitad de paso (${c.realX})`);
  step(c, 8);
  assert.equal(c.moving(), false);
  assert.equal(c.x, 1);
  assert.equal(c.realX, 32);
});

test('el patrón de paso avanza al empezar a moverse y vuelve al original al parar', () => {
  const map = mapFromRows(['....']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0, speed: 3 });
  c.moveGeneric(6);
  step(c, 1);
  assert.equal(c.pattern, 1);
  step(c, 20);
  step(c, 1);
  assert.equal(c.pattern, 0);
});

test('un muro impide moverse y el choque no desplaza', () => {
  const map = mapFromRows(['.#']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0 });
  assert.equal(c.moveGeneric(6), false);
  assert.equal(c.x, 0);
  assert.equal(c.direction, 6, 'gira hacia el muro');
});

test('salto: desplaza 2 casillas con arco y aterriza', () => {
  const map = mapFromRows(['.', '.', '.']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0 });
  assert.equal(c.jump(0, 2), true);
  assert.equal(c.y, 2);
  step(c, 5);
  assert.ok(c.jumpOffset() < 0, 'en el aire');
  step(c, 30);
  assert.equal(c.jumping(), false);
  assert.equal(c.realY, 64);
});

test('salto bloqueado si la casilla de aterrizaje es un muro', () => {
  const map = mapFromRows(['.', '.', '#']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0 });
  assert.equal(c.jump(0, 2), false);
  assert.equal(c.y, 0);
});

function playerWorld(rows, input) {
  const map = mapFromRows(rows);
  const w = miniWorld(map);
  const sounds = [];
  Object.assign(w, {
    input,
    inputEnabled: () => true,
    playSE: (n) => sounds.push(n),
    terrainAt: (ch, x, y) => map.terrainTagAt(x, y),
    checkPlayerTouch: () => false,
  });
  const p = new Player(w, { sprite: 'x' });
  p.map = map;
  w.player = p;
  return { map, w, p, sounds };
}

function fakeInput() {
  const st = { dir: 0, run: false };
  return { st, dir4: () => st.dir, held: (b) => (b === 'RUN' ? st.run : false), pressed: () => false };
}

test('jugador: pulsar una dirección nueva brevemente solo gira', () => {
  const input = fakeInput();
  const { p } = playerWorld(['...', '...', '...'], input);
  p.moveTo(1, 1);
  p.direction = 2;
  input.st.dir = 6;
  step(p, 2); // < 0.075 s
  assert.equal(p.direction, 6);
  assert.equal(p.x, 1);
  input.st.dir = 0;
  step(p, 2);
  assert.equal(p.moving(), false);
});

test('jugador: mantener la dirección tras el giro empieza a andar a velocidad de Añil', () => {
  const input = fakeInput();
  const { p } = playerWorld(['...', '...', '...'], input);
  p.moveTo(1, 1);
  p.direction = 2;
  input.st.dir = 6;
  step(p, Math.ceil(TURN_HOLD_SECONDS * 60) + 2);
  assert.equal(p.x, 2);
  assert.equal(p.moveSpeed, WALK_SPEED);
});

test('jugador: RUN aumenta la velocidad', () => {
  const input = fakeInput();
  const { p } = playerWorld(['......'], input);
  p.moveTo(0, 0);
  p.direction = 6;
  p.lastDir = 6;
  p.lastDirTime = -1;
  input.st.dir = 6;
  input.st.run = true;
  step(p, 2);
  assert.ok(p.moveSpeed > WALK_SPEED);
});

test('jugador: chocar contra un muro suena y no avanza', () => {
  const input = fakeInput();
  const { p, sounds } = playerWorld(['.#'], input);
  p.moveTo(0, 0);
  p.direction = 6;
  p.lastDir = 6;
  p.lastDirTime = -1;
  input.st.dir = 6;
  step(p, 3);
  assert.equal(p.x, 0);
  assert.ok(sounds.includes('Player bump'));
});

test('jugador: saliente → salta 2 casillas con sonido', () => {
  const input = fakeInput();
  const { p, sounds } = playerWorld(['.', 'L', '.'], input);
  p.moveTo(0, 0);
  p.direction = 2;
  p.lastDir = 2;
  p.lastDirTime = -1;
  input.st.dir = 2;
  step(p, 2);
  assert.equal(p.y, 2);
  assert.ok(p.jumping());
  assert.ok(sounds.includes('Player jump'));
  input.st.dir = 0;
  step(p, 40);
  assert.equal(p.realY, 64);
});

test('jugador: no puede subir un saliente desde abajo', () => {
  const input = fakeInput();
  const { p } = playerWorld(['.', 'L', '.'], input);
  p.moveTo(0, 2);
  p.direction = 8;
  p.lastDir = 8;
  p.lastDirTime = -1;
  input.st.dir = 8;
  step(p, 10);
  assert.equal(p.y, 2);
});

test('profundidad de arbusto: 12 px en hierba parado, 32 en hierba alta profunda', () => {
  const map = mapFromRows(['gG']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0 });
  c.calculateBushDepth();
  assert.equal(c.bushDepth, 12);
  c.moveTo(1, 0);
  assert.equal(c.bushDepth, 32);
});

test('evento: páginas con condición (gana la última que se cumple) y self switch', () => {
  const map = mapFromRows(['...']);
  const store = {};
  const state = {
    selfSwitch: (m, e, l) => Boolean(store[`${m}:${e}:${l}`]),
    setSelfSwitch: (m, e, l, v) => { store[`${m}:${e}:${l}`] = v; },
  };
  const w = { ...miniWorld(map), state, requestRefresh() {} };
  const def = normalizeEventDef({
    id: 'npc', x: 1, y: 0,
    pages: [
      { sprite: 'a', script: async () => {} },
      { when: (_s, ev) => ev.selfSwitch('A'), sprite: 'b', trigger: 'action' },
    ],
  });
  const ev = new MapEvent(w, map, def);
  ev.refresh();
  assert.equal(ev.characterName, 'a');
  ev.setSelfSwitch('A', true);
  ev.refresh();
  assert.equal(ev.characterName, 'b');
});

test('entrenador: línea de visión (pbEventCanReachPlayer) con obstáculos', () => {
  const map = mapFromRows(['......', '......']);
  const w = miniWorld(map);
  const def = normalizeEventDef({ id: 'tr', x: 0, y: 0, dir: 6, sprite: 'x', trigger: 'eventTouch', sight: 4, script: async () => {} });
  const ev = new MapEvent(w, map, def);
  ev.refresh();
  const player = { x: 4, y: 0, width: 1, height: 1 };
  assert.equal(ev.canReachPlayer(player, 4), true);
  assert.equal(ev.canReachPlayer({ x: 5, y: 0 }, 4), false, 'fuera de alcance');
  assert.equal(ev.canReachPlayer({ x: 3, y: 1 }, 4), false, 'otra fila');
  map.layers[1][2] = 385; // muro en medio
  assert.equal(ev.canReachPlayer(player, 4), false, 'muro en medio');
});

test('seguidor individual: separación global y movimiento interpolado por la trayectoria', () => {
  const map = mapFromRows(['.'.repeat(20)]);
  const w = miniWorld(map);
  const leader = new Character(w, { map, x: 10, y: 0, speed: 4, dir: 6 });
  const f = new Follower(w, { map, x: 0, y: 0 });
  f.setPokemon({ species: 'PIKACHU', form: 0, shiny: false });
  f.placeBehind(leader);
  assert.equal(f.x, 7);
  leader.moveGeneric(6);
  f.follow(leader);
  assert.equal(f.x, 8);
  assert.equal(f.realX, 7 * 32, 'no se recoloca en el destino');
  step(f, 20);
  assert.equal(f.realX, 8 * 32);
});

test('ruta forzada: se resuelve al terminar y admite saltos y esperas', async () => {
  const map = mapFromRows(['.....']);
  const c = new Character(miniWorld(map), { map, x: 0, y: 0, speed: 4 });
  let done = false;
  c.forceMoveRoute(['right', { wait: 3 }, 'right', 'turn_left']).then(() => { done = true; });
  for (let i = 0; i < 120 && !done; i++) { step(c, 1); await Promise.resolve(); }
  assert.equal(done, true);
  assert.equal(c.x, 2);
  assert.equal(c.direction, 4);
});

test('un seguidor nunca se dibuja delante del jugador (el Zygarde grande no lo tapa), aunque vaya por debajo', () => {
  const map = mapFromRows(['....', '....', '....']);
  const w = miniWorld(map);
  const player = new Player(w, { map, x: 1, y: 0 });
  w.player = player;
  const below = new Follower(w, { map, x: 1, y: 1 });
  const beside = new Follower(w, { map, x: 2, y: 0 });
  const tall = 96;
  assert.ok(below.screenZ(tall) < player.screenZ(64), 'seguidor una casilla por debajo');
  assert.ok(beside.screenZ(tall) < player.screenZ(64), 'seguidor en la misma fila');
  const npc = new Character(w, { map, x: 1, y: 1 });
  assert.ok(npc.screenZ(64) > player.screenZ(64), 'un NPC por debajo sí va delante');
});
