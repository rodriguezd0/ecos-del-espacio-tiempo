// Bloque 7 — rescate estratigráfico de la Cantería Solano (docs/TABLILLAS.md T04: «Nunca rompas la capa que sostiene
// a otra»; rocas por estratos rotas con Embestida de arriba abajo; romper en mal orden reinicia la sala). Reglas
// puras (content/events/b07_strata_logic.js) y salas (b07_strata_rooms.js) con un solucionador BFS:
//   · cada sala tiene solución con roturas legales y ninguna rotura legal deja al jugador sin salida;
//   · cada sala tiene al menos una trampa (una roca al alcance que sostiene a otra);
//   · la última sala solo se completa rompiendo la pizarra negra (aparece la Tablilla) con Quino rescatado;
//   · los eventos del mapa (rocas, atrapados, pozos) están donde dicen las salas ASCII.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STRATA, parseRoom, canBreak, supported, remainingRocks, solveRoom, deadEnds, fullMask, defaultGoal,
} from '../game/src/content/events/b07_strata_logic.js';
import { room, ROOMS } from '../game/src/content/events/b07_strata_rooms.js';
import { roomSolved, resetRoomIfUnsolved, roomStart, shaftSide, inMap } from '../game/src/content/events/b07_galerias.js';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';

test('estratos: cuatro capas de arriba abajo con su fila en la hoja de arte', () => {
  assert.deepEqual(STRATA.map((s) => s.key), ['a', 'b', 'c', 'd']);
  assert.deepEqual(STRATA.map((s) => s.n), [1, 2, 3, 4]);
  assert.deepEqual(STRATA.map((s) => s.row), [2, 4, 6, 8]);
});

test('regla: una roca sostiene a las vecinas en cruz de una capa más alta', () => {
  const r = parseRoom(['.a.', 'cbd', '.c.']);
  const [a, c1, b, d, c2] = r.rocks;
  assert.equal(a.key, 'a');
  assert.equal(b.key, 'b');
  assert.ok(!canBreak(r.rocks, b), 'la caliza sostiene la arenisca de encima');
  assert.ok(canBreak(r.rocks, a), 'la capa de arriba siempre se puede romper');
  assert.deepEqual(supported(r.rocks, c1).map((k) => k.key), ['b'], 'la arcilla sostiene la caliza (vecina)');
  assert.ok(!canBreak(r.rocks, d), 'la pizarra sostiene la caliza de su lado');
  assert.ok(canBreak(r.rocks, c2) === false, 'la arcilla de abajo sostiene la caliza');
  const left = remainingRocks(r, (1 << a.i));
  assert.ok(canBreak(left, b), 'sin la arenisca, la caliza se puede romper');
  // Misma capa: no se sostienen entre sí.
  const same = parseRoom(['bb']);
  assert.ok(canBreak(same.rocks, same.rocks[0]) && canBreak(same.rocks, same.rocks[1]));
});

test('las tres salas tienen solución legal, trampas a la vista y ningún callejón sin salida', () => {
  for (const n of [1, 2, 3]) {
    const r = room(n);
    const s = solveRoom(r);
    assert.ok(s.solved, `sala ${n}: sin solución`);
    assert.ok(s.traps.length > 0, `sala ${n}: ninguna trampa (roca que sostiene otra al alcance)`);
    assert.deepEqual(deadEnds(r), [], `sala ${n}: hay estados sin salida`);
    // Cada rotura de la solución es legal con las rocas que quedaban en ese momento.
    let mask = 0;
    for (const act of s.actions.filter((a) => a.type === 'break')) {
      const rock = r.rocks.find((k) => k.x === act.x && k.y === act.y);
      assert.ok(canBreak(remainingRocks(r, mask), rock), `sala ${n}: rotura ilegal en la solución (${act.x},${act.y})`);
      mask |= 1 << rock.i;
    }
    assert.ok(s.actions.filter((a) => a.type === 'free').length === r.marks.T.length + r.marks.Q.length, `sala ${n}: no rescata a todos`);
  }
});

test('dificultad creciente: más capas, más rocas y más roturas en cada sala', () => {
  const breaks = [1, 2, 3].map((n) => solveRoom(room(n)).actions.filter((a) => a.type === 'break').length);
  assert.ok(breaks[0] < breaks[1] && breaks[1] < breaks[2], `roturas ${breaks.join(', ')}`);
  assert.deepEqual([1, 2, 3].map((n) => new Set(room(n).rocks.map((k) => k.key)).size), [2, 3, 4]);
  assert.deepEqual([1, 2, 3].map((n) => ROOMS[n].strata.length), [2, 3, 4]);
});

test('última sala: la meta exige a Quino fuera y toda la pizarra negra rota; la Tablilla no se salta', () => {
  const r = room(3);
  assert.equal(r.marks.E.length, 0, 'la última sala no tiene pozo de salida (se sale por la ventilación, con Quino)');
  const goal = defaultGoal(r);
  const dMask = r.rocks.filter((k) => k.key === 'd').reduce((m, k) => m | (1 << k.i), 0);
  assert.ok(!goal({ x: 0, y: 0, broken: fullMask(r) & ~dMask, freed: 1 }), 'sin la pizarra no hay Tablilla');
  assert.ok(!goal({ x: 0, y: 0, broken: fullMask(r), freed: 0 }), 'sin Quino no se termina');
  assert.ok(goal({ x: 0, y: 0, broken: dMask, freed: 1 }));
  assert.equal(r.marks.V.length, 1, 'falta la veta');
});

test('estado de las salas: resueltas con sus rescates; las no resueltas se reinician al entrar', () => {
  const s = GameState.create({ name: 'Prueba' });
  s.setVar('b07_sala_2', 5);
  resetRoomIfUnsolved(s, 2);
  assert.equal(s.var('b07_sala_2', 0), 0);
  s.setFlag('b07_timburr_2'); s.setFlag('b07_timburr_3');
  assert.ok(roomSolved(s, 2));
  s.setVar('b07_sala_2', 7);
  resetRoomIfUnsolved(s, 2);
  assert.equal(s.var('b07_sala_2', 0), 7, 'una sala resuelta conserva sus rocas rotas');
  assert.ok(!roomSolved(s, 3));
  s.setFlag('b07_quino');
  assert.ok(!roomSolved(s, 3), 'sin Tablilla la última sala no está resuelta');
  s.setFlag('b07_tablilla');
  assert.ok(roomSolved(s, 3));
});

test('mapa de las galerías: rocas, atrapados, pozos y cuerdas donde dicen las salas', async () => {
  const { entry } = await buildMapNode('canteria_solano');
  const world = new World({ state: GameState.create({ name: 'Prueba' }) });
  world.setCurrent({ ...entry, events: null });
  const byId = new Map(world.events.map((e) => [e.id, e]));
  for (const n of [1, 2, 3]) {
    const r = room(n);
    for (const rock of r.rocks) {
      const ev = byId.get(`roca_s${n}_${rock.i}`);
      const [x, y] = inMap(n, rock.x, rock.y);
      assert.ok(ev, `sala ${n}: falta la roca ${rock.i}`);
      assert.deepEqual([ev.x, ev.y], [x, y]);
      assert.equal(ev.direction, STRATA.find((s) => s.key === rock.key).row, `sala ${n}: color de la roca ${rock.i}`);
      assert.ok(ev.solid);
    }
    const [sx, sy] = roomStart(n);
    assert.ok(entry.map.valid(sx, sy));
  }
  assert.ok(byId.get('quino_atrapado'));
  assert.equal(world.events.filter((e) => /^timburr_s/.test(e.id)).length, 3);
  for (const n of [1, 2]) {
    const [x, y] = shaftSide(n);
    assert.ok(entry.map.valid(x, y), `llegada junto al pozo de la sala ${n}`);
  }
});
