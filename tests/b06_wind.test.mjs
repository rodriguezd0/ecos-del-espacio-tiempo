// Bloque 6 — mazmorra del Pilar del Impulso: reglas del viento y solución de las tres salas (docs/CAMPANA.md B06).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseRoom, settleWind, solveRoom, solvableWith, rotateDir, gustDir, VANE_CYCLE,
} from '../game/src/content/events/b06_wind_logic.js';
import { FLECHAS, REMOLINO, CAMPANAS, roomOf, strikeBell, BELL_SEQUENCE, gustsInMap } from '../game/src/content/events/b06_wind_rooms.js';

const passableIn = (room) => (x, y, d) => {
  const v = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[d];
  return !room.blocked(x + v[0], y + v[1]);
};

test('veleta: ciclo N→E→S→O', () => {
  assert.deepEqual(VANE_CYCLE, [8, 6, 2, 4]);
  assert.equal(rotateDir(8, 1), 6);
  assert.equal(rotateDir(6, 1), 2);
  assert.equal(rotateDir(2, 1), 4);
  assert.equal(rotateDir(4, 1), 8);
  assert.equal(rotateDir(4, 4), 4);
  assert.equal(gustDir({ dir: 8, sector: 'a' }, { a: 3 }), 4);
  assert.equal(gustDir({ dir: 8, sector: null }, { a: 3 }), 8);
});

test('reglas: se encadena, fuerza 1 se remonta montado, fuerza 2 nunca, el bucle devuelve', () => {
  const room = parseRoom([
    '#######',
    '#.>>..#',
    '#.v####',
    '#.v...#',
    '#.8...#',
    '#.....#',
    '#######',
  ]);
  const pass = passableIn(room);
  // encadenar: (2,1) → este → (4,1) en calma
  let r = settleWind({ x: 2, y: 1, fromX: 1, fromY: 1, arrived: 6, gustAt: room.gustAt, passable: pass });
  assert.deepEqual([r.x, r.y, r.ejected], [4, 1, false]);
  // fuerza 1 contra corriente a pie: devuelto
  r = settleWind({ x: 2, y: 3, fromX: 2, fromY: 4, arrived: 8, gustAt: room.gustAt, passable: pass });
  assert.equal(r.x, 2);
  // montado: remonta (se queda encima)
  r = settleWind({ x: 2, y: 3, fromX: 2, fromY: 4, arrived: 8, mounted: true, gustAt: room.gustAt, passable: pass });
  assert.deepEqual([r.x, r.y, r.climbing], [2, 3, true]);
  // fuerza 2 contra corriente, montado: devuelto a la casilla de partida
  r = settleWind({ x: 2, y: 4, fromX: 2, fromY: 3, arrived: 2, mounted: true, gustAt: room.gustAt, passable: pass });
  assert.deepEqual([r.x, r.y, r.ejected], [2, 3, true]);
  // choque contra la roca: devuelto
  const wall = parseRoom(['#####', '#.>##', '#####']);
  r = settleWind({ x: 2, y: 1, fromX: 1, fromY: 1, arrived: 6, gustAt: wall.gustAt, passable: passableIn(wall) });
  assert.deepEqual([r.x, r.y, r.ejected, r.reason], [1, 1, true, 'blocked']);
  // bucle: devuelto
  const loop = parseRoom(['######', '#.>v.#', '#.^<.#', '######']);
  r = settleWind({ x: 2, y: 1, fromX: 1, fromY: 1, arrived: 6, gustAt: loop.gustAt, passable: passableIn(loop) });
  assert.deepEqual([r.x, r.y, r.ejected, r.reason], [1, 1, true, 'loop']);
});

test('(a) Galería de las Flechas: se resuelve encadenando y remontando montado; C033 es obligatoria', () => {
  const room = roomOf(FLECHAS);
  const start = room.marks.S[0];
  const goal = room.marks.X[0];
  const via = room.marks.C;
  assert.equal(via.length, 1);
  const sol = solveRoom(room, { start, goal, via });
  assert.ok(sol.path, 'sin solución');
  assert.ok(sol.path.includes('montar'), 'la solución debe remontar montado');
  assert.equal(solveRoom(room, { start, goal, canMount: false }).path, null, 'a pie no debería resolverse');
  // C033 está en el único paso: todo camino a la salida la pisa
  const free = solveRoom(room, { start, goal });
  assert.equal(free.path.length, sol.path.length);
  assert.ok(room.gusts.some((g) => g.force === 2) && room.gusts.some((g) => g.force === 1));
});

test('(b) Galería del Remolino: bucle cerrado; solo se abre en línea girando las DOS veletas', () => {
  const room = roomOf(REMOLINO);
  const opts = { start: room.marks.S[0], goal: room.marks.X[0], sectors: REMOLINO.vanes };
  assert.ok(solvableWith(room, opts, ['a', 'b']), 'con las dos veletas debe resolverse');
  assert.ok(!solvableWith(room, opts, ['a']), 'solo con la veleta a no debe resolverse');
  assert.ok(!solvableWith(room, opts, ['b']), 'solo con la veleta b no debe resolverse');
  assert.ok(!solvableWith(room, opts, []), 'sin veletas no debe resolverse');
  // Todas las ráfagas del bucle son de fuerza 2 (no se remontan).
  assert.ok(room.gusts.every((g) => g.force === 2));
  // Configuración de la solución: compuerta hacia el oeste (3 giros) y pasillo hacia el norte (1 giro).
  const sol = solveRoom(room, opts);
  assert.equal(sol.path.filter((s) => s === 'veleta_a').length % 4, 3);
  assert.equal(sol.path.filter((s) => s === 'veleta_b').length % 4, 1);
});

test('(c) Sala de las Campanas: las tres campanas son alcanzables, C034 en el paso a la Norte, el vendaval solo deja salir', () => {
  const room = roomOf(CAMPANAS);
  const start = room.marks.S[0];
  const { N, E, W } = CAMPANAS.bells;
  const via = room.marks.C;
  assert.equal(via.length, 1);
  // Norte: exige remontar montado y pasa por C034
  const toN = solveRoom(room, { start, goal: N.strike, via });
  assert.ok(toN.path && toN.path.includes('montar'));
  assert.equal(solveRoom(room, { start, goal: N.strike, canMount: false }).path, null);
  const freeN = solveRoom(room, { start, goal: N.strike });
  assert.equal(freeN.path.length, toN.path.length, 'C034 debe quedar en el camino a la campana Norte');
  // Norte → Este → Oeste
  assert.ok(solveRoom(room, { start: N.strike, goal: E.strike }).path);
  assert.ok(solveRoom(room, { start: E.strike, goal: W.strike }).path);
  // pedestal del núcleo alcanzable
  assert.ok(solveRoom(room, { start: W.strike, goal: CAMPANAS.pedestal.front }).path);
  // vendaval: desde dentro se sale; desde el pie de la escalera no se entra
  const foot = [9, 15];
  assert.ok(solveRoom(room, { start, goal: foot }).path, 'debe poder salirse por el vendaval');
  const fromFoot = solveRoom(room, { start: foot, goal: start });
  assert.equal(fromFoot.path, null, 'el vendaval no debe dejar entrar');
  for (const [x, y] of CAMPANAS.gale) assert.ok(room.gustAt(x, y)?.force === 2, `vendaval en ${x},${y}`);
});

test('secuencia de campanas: largo–corto–corto (Norte, Este, Oeste); un fallo reinicia', () => {
  assert.equal(BELL_SEQUENCE.map((b) => `${b.bell}${b.long ? 'L' : 'C'}`).join(' '), 'NL EC WC');
  let s = strikeBell(0, 'N', true);
  assert.deepEqual(s, { step: 1, ok: true, done: false });
  s = strikeBell(1, 'E', false);
  assert.equal(s.step, 2);
  s = strikeBell(2, 'W', false);
  assert.deepEqual(s, { step: 3, ok: true, done: true });
  assert.equal(strikeBell(0, 'N', false).step, 0, 'la Norte corta no vale');
  assert.equal(strikeBell(1, 'W', false).step, 0, 'orden equivocado reinicia');
  assert.equal(strikeBell(2, 'N', true).step, 1, 'volver a empezar por la Norte larga cuenta como primera');
  assert.equal(strikeBell(1, 'E', true).step, 0, 'la Este larga no vale');
});

test('ráfagas en coordenadas de mapa con ids únicos', () => {
  const list = gustsInMap(FLECHAS, 2, 15, 'flecha');
  assert.equal(new Set(list.map((g) => g.id)).size, list.length);
  assert.ok(list.every((g) => g.x >= 2 && g.y >= 15));
});
