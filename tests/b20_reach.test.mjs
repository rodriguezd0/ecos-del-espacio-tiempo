// Bloque 20 — Pilar del Origen: alcanzabilidad a pie (docs/CAMPANA.md B20, §2.5 G16–G17). BFS con la pasabilidad real
// del mundo (tiles + eventos sólidos, páginas y parches según los flags) y las mecánicas de cada eco: montar para la grava
// (se retiran los eventos de grava), Nadar (agua navegable), Terreno (el barro se abre con la capacidad), Trepar (aristas
// de la pared), el espacio imposible (el vacío no se pisa: se cae) y la sala de ejes del tramo 9 (world/axis: su
// solucionador, y el mapa comparado casilla a casilla con la rejilla en cada eje). Comprueba que ninguna puerta de
// capacidad o de historia se salta, que no hay casillas trampa sin
// salida y que objetos y salidas se alcanzan con las capacidades de ese momento.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { isVoidCell } from '../game/src/world/impossible/logic.js';
import {
  PUERTA, T1, T2, T3, T4, T5, T6, T7, T8, T9, CIELO, TERRAZA, NUCLEO, ARRIVE, EXIT_STAND, INNER, tramoId,
} from '../game/src/content/maps/b20/layout.js';
import { F, V } from '../game/src/content/events/b20_common.js';
import { corridorPath, windRoom, WIND_ROOM, VANE_TURNS_NORTH, facetRoom6, t9Room, t9Local } from '../game/src/content/events/b20_logic.js';
import {
  AXIS_TIME, AXIS_SPACE, solveAxisRoom, solveAxis, axisReach, axisTraps, solvableWithout, planSummary, walkableAt,
} from '../game/src/world/axis/logic.js';
import { forgottenTraps } from '../game/src/content/events/b20_tramos_b.js';
import { solveRoom, parseRoom } from '../game/src/content/events/b06_wind_logic.js';
import { facetReach } from '../game/src/world/impossible/logic.js';

const DV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };
const key = (x, y) => `${x},${y}`;
const ALL = ['run', 'ram', 'terrain', 'climb', 'swim', 'detect', 'dive', 'fly', 'rebuild'];

/**
 * Mundo de un mapa. opts: flags, vars, abilities (capacidades de Zygarde; por defecto todas), erase (prefijos de id de
 * evento retirados), block (casillas tratadas como muro: disparadores de escena), swim, climb, jumps ([[from, to]…]).
 */
async function setup(mapId, { flags = [], vars = {}, abilities = ALL, erase = [], block = [], swim = false, climb = false, jumps = [] } = {}) {
  const state = GameState.create({ name: 'Prueba' });
  for (const f of flags) state.setFlag(f);
  for (const [k, v] of Object.entries(vars)) state.setVar(k, v);
  for (const a of abilities) state.setZygardeAbility(a, true);
  const built = await buildMapNode(mapId);
  const world = new World({ state });
  world.setCurrent({ ...built.entry, events: null });
  for (const ev of world.events) if (erase.some((p) => String(ev.id).startsWith(p))) ev.erased = true;
  const edges = new Map();
  const addEdge = (from, to) => { if (!edges.has(key(...from))) edges.set(key(...from), []); edges.get(key(...from)).push(to); };
  if (climb) {
    for (const ev of world.events) {
      const to = ev.def?.to;
      if (ev.erased || !ev.page || !Array.isArray(to) || ev.def?.type !== 'climbWall') continue;
      addEdge([ev.x + Math.sign(ev.x - to[0]), ev.y + Math.sign(ev.y - to[1])], to);
    }
  }
  for (const [from, to] of jumps) addEdge(from, to);
  return { state, world, map: built.entry.map, def: built.def, edges, swim, blocked: new Set(block.map(([x, y]) => key(x, y))) };
}

const solidAt = (env, x, y) => env.world.events.some((ev) => !ev.erased && ev.page && !ev.through && (ev.characterName || ev.solid) && ev.x === x && ev.y === y);

function neighbours(env, x, y) {
  const { world, map, swim } = env;
  const p = world.player;
  const out = [];
  for (const d of [2, 4, 6, 8]) {
    const nx = x + DV[d][0];
    const ny = y + DV[d][1];
    if (!map.valid(nx, ny) || env.blocked.has(key(nx, ny))) continue;
    if (env.def.impossible && isVoidCell(map, nx, ny)) continue;
    const water = map.terrainTagAt(nx, ny).canSurf;
    if (water) {
      if (swim && !solidAt(env, nx, ny)) out.push([nx, ny]);
      continue;
    }
    p.x = x; p.y = y;
    if (map.terrainTagAt(x, y).canSurf) {
      if (map.playerPassable(nx, ny, 10 - d, {}) && !solidAt(env, nx, ny)) out.push([nx, ny]);
      continue;
    }
    if (p.passable(x, y, d)) out.push([nx, ny]);
  }
  for (const to of env.edges.get(key(x, y)) || []) out.push(to);
  return out;
}

function reach(env, start) {
  const seen = new Set([key(...start)]);
  const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const n of neighbours(env, x, y)) {
      if (seen.has(key(...n))) continue;
      seen.add(key(...n));
      q.push(n);
    }
  }
  return { has: (x, y) => seen.has(key(x, y)), cells: [...seen].map((s) => s.split(',').map(Number)), size: seen.size };
}

/** ¿Hay una casilla vecina alcanzable desde la que usar (x, y)? (o pisarla) */
const usable = (r, x, y) => r.has(x, y) || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => r.has(x + dx, y + dy));

/** Casillas trampa: alcanzables desde `start` pero sin camino de vuelta a él. */
function traps(env, start) {
  const r = reach(env, start);
  return r.cells.filter(([x, y]) => !reach(env, [x, y]).has(...start));
}

/** Objetos del mapa (eventos `item` con página activa) que no se pueden coger. */
function unreachableItems(env, r) {
  return env.world.events.filter((e) => e.def?.type === 'item' && e.page && !usable(r, e.x, e.y)).map((e) => `${e.id} (${e.x},${e.y})`);
}

const A = [ARRIVE.x, ARRIVE.y];
const topExit = [EXIT_STAND.x, EXIT_STAND.y];

// ───────────────────────────── Puerta de las Quince ─────────────────────────────

test('Puerta de las Quince: la losa y el camino proyectado no se saltan; con los dos, se baja a la Senda', async () => {
  const start = [PUERTA.arrive.x, PUERTA.arrive.y];
  const ledge = [PUERTA.exitStand.x, PUERTA.exitStand.y];
  const threshold = [PUERTA.slab.x, PUERTA.threshold.y];
  const closed = await setup('puerta_quince');
  const r0 = reach(closed, start);
  assert.ok(!r0.has(...threshold), 'sin abrir la losa se llega al umbral');
  assert.ok(!r0.has(...ledge), 'sin abrir la losa se llega a la repisa de la Senda');
  for (const n of PUERTA.niches) assert.ok(usable(r0, n.x, n.y), `el nicho ${n.n} no se puede tocar`);
  assert.deepEqual(unreachableItems(closed, r0), []);
  const open = await setup('puerta_quince', { flags: [F.doorOpen] });
  const r1 = reach(open, start);
  assert.ok(r1.has(...threshold), 'con la losa abierta se llega al umbral');
  assert.ok(!r1.has(...ledge), 'sin reconstruir el camino se cruza el vacío');
  const built = await setup('puerta_quince', { flags: [F.doorOpen, F.path] });
  const r2 = reach(built, start);
  assert.ok(r2.has(...ledge), 'con el camino alzado no se llega a la repisa');
  assert.deepEqual(traps(built, start), []);
});

// ───────────────────────────── Tramos 1–5 ─────────────────────────────

test('tramo 1: la grava solo se sube montado; la losa solo se abre con las tres piedras', async () => {
  const foot = await setup(tramoId(1));
  const r0 = reach(foot, A);
  for (const s of T1.stones) assert.ok(!usable(r0, s.x, s.y), `a pie se llega a la piedra ${s.id}`);
  assert.ok(!r0.has(12, 8), 'a pie se sube la grava');
  const riding = await setup(tramoId(1), { erase: ['t1_grava'] });
  const r1 = reach(riding, A);
  for (const s of T1.stones) assert.ok(usable(r1, s.x, s.y), `montado no se llega a la piedra ${s.id}`);
  assert.ok(!r1.has(...topExit), 'sin las tres piedras se pasa bajo el dintel');
  const open = await setup(tramoId(1), { erase: ['t1_grava'], flags: [F.t1Slab] });
  const r2 = reach(open, A);
  assert.ok(r2.has(...topExit), 'con la losa abierta no se llega a la boca');
  assert.deepEqual(unreachableItems(open, r2), []);
  assert.deepEqual(traps(open, A), []);
});

test('tramo 2: el mando del islote solo se alcanza nadando; la salida, con el estanque vaciado', async () => {
  const foot = await setup(tramoId(2));
  const r0 = reach(foot, A);
  assert.ok(!usable(r0, T2.lever.x, T2.lever.y), 'a pie se llega al mando');
  const swim = await setup(tramoId(2), { swim: true });
  const r1 = reach(swim, A);
  assert.ok(r1.has(T2.leverStand.x, T2.leverStand.y), 'nadando no se llega al islote');
  assert.ok(!r1.has(...topExit), 'nadando se cruza la compuerta cerrada');
  const drained = await setup(tramoId(2), { flags: [F.t2Gate] });
  const r2 = reach(drained, A);
  assert.ok(r2.has(...topExit), 'con el estanque vacío no se llega a la boca');
  assert.deepEqual(unreachableItems(drained, r2), []);
  assert.deepEqual(traps(drained, A), []);
});

test('tramo 4: el barro pide Terreno y la salida, la placa hundida', async () => {
  const noTerrain = await setup(tramoId(4), { abilities: ['run', 'ram'] });
  const r0 = reach(noTerrain, A);
  assert.ok(!r0.has(T4.plate.x, T4.plate.y), 'sin Terreno se cruza el barro');
  const terrain = await setup(tramoId(4));
  const r1 = reach(terrain, A);
  assert.ok(r1.has(T4.plate.x, T4.plate.y), 'con Terreno no se llega a la placa');
  assert.ok(usable(r1, T4.spring.x + 1, T4.spring.y + 2), 'el manantial no se puede usar');
  assert.ok(!r1.has(...topExit), 'sin la placa se cruza el foso');
  const pressed = await setup(tramoId(4), { flags: [F.t4Plate] });
  const r2 = reach(pressed, A);
  assert.ok(r2.has(...topExit), 'con la plataforma alzada no se llega a la boca');
  assert.deepEqual(unreachableItems(pressed, r2), []);
  assert.deepEqual(traps(pressed, A), []);
});

test('tramo 5: solo el camino del custodio cruza el Suelo Olvidado; la repisa, trepando', async () => {
  const env = await setup(tramoId(5), { block: forgottenTraps() });
  const r0 = reach(env, A);
  const [lx, ly] = T5.path[T5.path.length - 1];
  assert.ok(r0.has(lx, ly), 'por el camino seguro no se llega al pie de la pared');
  assert.ok(!r0.has(...topExit), 'sin Trepar se llega a la repisa');
  for (const [x, y] of forgottenTraps()) assert.ok(!T5.path.some(([px, py]) => px === x && py === y), `la trampa (${x},${y}) está en el camino`);
  const climb = await setup(tramoId(5), { block: forgottenTraps(), climb: true });
  const r1 = reach(climb, A);
  assert.ok(r1.has(...topExit), 'trepando no se llega a la boca');
  assert.deepEqual(unreachableItems(climb, r1), []);
  assert.deepEqual(traps(climb, A), []);
});

test('tramo 3: sin girar la veleta (y sin romper la roca que la tapa) el viento no deja subir', async () => {
  const room = windRoom();
  const find = (ch) => { for (let y = 0; y < room.h; y++) { const x = room.rows[y].indexOf(ch); if (x >= 0) return [x, y]; } return null; };
  const opts = { start: find('S'), goal: find('X'), sectors: WIND_ROOM.vanes, canMount: true };
  const solved = solveRoom(room, opts);
  assert.ok(solved.path, 'la sala de viento no tiene solución');
  assert.equal(solved.path.filter((a) => a === 'veleta_a').length, VANE_TURNS_NORTH, 'la solución no gira la veleta dos veces');
  assert.ok(!solveRoom(room, { ...opts, maxVaneTurns: 0 }).path, 'se sube sin girar la veleta');
  const walled = parseRoom(T3.rows.map((r) => r.replace('R', '#')), T3.sectors);
  assert.ok(!solveRoom(walled, opts).path, 'se llega a la veleta sin romper la roca');
  // En el mapa real: la roca agrietada (evento sólido) es la única entrada al nicho de la veleta.
  const [rx, ry] = T3.rock;
  const rock = [rx + INNER.x, ry + INNER.y];
  const env = await setup(tramoId(3));
  const r0 = reach(env, A);
  assert.ok(!r0.has(...rock), 'se entra en el nicho de la veleta sin Embestida');
  assert.ok(usable(r0, ...rock), 'la roca agrietada no se puede embestir');
  const broken = await setup(tramoId(3), { erase: ['t3_roca'] });
  assert.ok(reach(broken, A).has(...rock), 'rota la roca no se llega a la veleta');
});

test('tramo 6: la salida solo se alcanza girando por las dos aristas (ninguna casilla trampa: caer vuelve al poste)', () => {
  const room = facetRoom6();
  const start = { x: room.start.x, y: room.start.y, o: 0 };
  const seen = facetReach(room, start);
  assert.ok(seen.has(`${room.exit.x},${room.exit.y},0`), 'la salida no se alcanza');
  const flat = { ...room, aristas: [] };
  assert.ok(!facetReach(flat, start).has(`${room.exit.x},${room.exit.y},0`), 'la salida se alcanza sin girar');
  const it = T6.item;
  assert.ok([...seen].some((k) => k === `${it.x},${it.y},${it.orient}` || [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => k === `${it.x + dx},${it.y + dy},${it.orient}`)), 'el objeto de la pared violeta no se alcanza');
  assert.ok(seen.has(`${room.anchors[0].x},${room.anchors[0].y + 0},0`) || seen.has(`${room.anchors[0].x - 1},${room.anchors[0].y},0`), 'el poste no se alcanza');
});

// ───────────────────────────── Tramos 7–9 ─────────────────────────────

test('tramo 7: el pozo norte solo se alcanza buceando por el túnel, con la reja alzada en el eco', async () => {
  const surf = await setup(tramoId(7), { swim: true });
  const r0 = reach(surf, A);
  assert.ok(r0.has(T7.dive.x, T7.dive.y), 'nadando no se llega al remolino');
  assert.ok(!r0.has(...topExit), 'por la superficie se llega a la salida');
  assert.ok(usable(r0, T7.spring.x + 1, T7.spring.y + 2), 'el manantial no se puede usar');
  const down = await setup(`${tramoId(7)}_fondo`);
  const r1 = reach(down, [T7.dive.x, T7.dive.y]);
  assert.ok(usable(r1, T7.caracola.x, T7.caracola.y), 'en el fondo no se llega a la caracola');
  assert.ok(!r1.has(T7.surfaceSpot.x, T7.surfaceSpot.y), 'con la reja caída se cruza el túnel');
  assert.deepEqual(unreachableItems(down, r1), []);
  const echo = await setup(`${tramoId(7)}_eco`);
  const r2 = reach(echo, [T7.caracola.stand.x, T7.caracola.stand.y]);
  assert.ok(r2.has(T7.crankStand.x, T7.crankStand.y), 'en el eco no se llega a la manivela');
  assert.ok(!r2.has(T7.masonry.x, T7.masonry.y - 1), 'en el eco se pasa por el túnel (aún no existe)');
  const up = await setup(`${tramoId(7)}_fondo`, { flags: [F.t7Grate] });
  const r3 = reach(up, [T7.dive.x, T7.dive.y]);
  assert.ok(r3.has(T7.surfaceSpot.x, T7.surfaceSpot.y), 'con la reja alzada no se llega bajo el pozo norte');
  assert.deepEqual(traps(up, [T7.dive.x, T7.dive.y]), []);
  // De vuelta desde el tramo 8: desde la repisa norte se nada al pozo y hay un remolino para bajar al túnel
  const back = await setup(tramoId(7), { swim: true, flags: [F.t7Grate] });
  const r4 = reach(back, topExit);
  const pozo = back.world.events.find((e) => e.def?.type === 'diveSpot' && e.x === T7.wellDive.x && e.y === T7.wellDive.y);
  assert.ok(pozo && r4.has(pozo.x, pozo.y), 'desde la repisa norte no se puede bajar buceando (el jugador queda encerrado)');
  const ahead = back.world.events.find((e) => e.page && !e.erased && e.x === topExit[0] && e.y === topExit[1] + 1);
  assert.equal(ahead, undefined, 'un evento delante de la repisa tapa la oferta de nadar');
  assert.ok(reach(up, [T7.wellDive.x, T7.wellDive.y]).has(T7.dive.x, T7.dive.y), 'del pozo norte no se vuelve a la cisterna');
});

test('tramo 8: el pasillo lleva de la llegada a las tres puertas; cada puerta se usa desde el pasillo', async () => {
  const env = await setup(tramoId(8));
  const r = reach(env, A);
  for (const d of T8.doors) assert.ok(usable(r, d.x, d.y), `la puerta ${d.n} no se alcanza`);
  const path = corridorPath(ARRIVE.x - INNER.x, ARRIVE.y - INNER.y, T8.doors[1].x - INNER.x, 0);
  assert.ok(path && path.length > 30, 'el pasillo no serpentea');
  assert.deepEqual(traps(env, A), []);
});

// Tramo 9: sala de ejes de world/axis (B18). El solucionador trabaja sobre la rejilla; aquí se comprueba además que el
// mapa real (tiles, eventos sólidos y parches de cada eje) coincide casilla a casilla con la rejilla.
const T9_MODES = [null, AXIS_TIME, AXIS_SPACE];
const t9Map = (lx, ly) => [lx + INNER.x, ly + INNER.y];

test('tramo 9: la sala de ejes pide los dos ejes y la Reconstrucción, sin trampas', () => {
  const room = t9Room();
  const plan = solveAxisRoom(room);
  assert.ok(plan, 'la sala reconstruida no tiene solución');
  const sum = planSummary(plan);
  assert.deepEqual([...sum.modes].sort(), [AXIS_SPACE, AXIS_TIME], 'la solución no usa los dos ejes');
  assert.equal(sum.folds, 1, 'la solución no cruza el pliegue');
  assert.equal(solvableWithout(room, AXIS_TIME), false, 'se resuelve sin parar la cascada');
  assert.equal(solvableWithout(room, AXIS_SPACE), false, 'se resuelve sin abrir el pliegue');
  assert.deepEqual(axisTraps(room), [], 'casillas trampa en la sala reconstruida');
  // Entrada y salida de la rejilla = llegada y boca norte del tramo
  assert.deepEqual(t9Map(room.entry.x, room.entry.y), [ARRIVE.x, ARRIVE.y]);
  assert.deepEqual(room.exits.map((e) => t9Map(e.x, e.y)), [topExit]);
  // Antes de reconstruir: no hay salida, pero sí el zócalo; y nada de lo alcanzable desde la entrada deja sin vuelta
  const broken = t9Room({ rebuilt: false });
  assert.equal(solveAxisRoom(broken), null, 'sin reconstruir se llega a la boca');
  const fromEntry = [...axisReach(broken, T9_MODES.map((mode) => ({ ...broken.entry, mode }))).values()];
  const stand = t9Local(T9.gap.stand.x, T9.gap.stand.y);
  assert.ok(fromEntry.some((s) => s.x === stand.x && s.y === stand.y), 'el zócalo de la Reconstrucción no se alcanza');
  const isEntry = (x, y) => x === broken.entry.x && y === broken.entry.y;
  assert.deepEqual(fromEntry.filter((s) => !solveAxis(broken, s, isEntry)), [], 'trampas antes de reconstruir');
  // El objeto de la isla (escombros detenidos) y la pared escrita
  const all = [...axisReach(room, [{ ...room.entry, mode: null }]).values()];
  for (const it of room.items) assert.ok(all.some((s) => s.x === it.x && s.y === it.y), `el objeto (${it.x},${it.y}) no se alcanza`);
  for (const [x, y] of T9.wallScene) {
    const p = t9Local(x, y);
    assert.ok(all.some((s) => s.x === p.x && s.y === p.y), `la pared escrita (${x},${y}) no se pisa`);
  }
});

test('tramo 9: el mapa coincide con la rejilla de ejes en los tres modos, antes y después de reconstruir', async () => {
  for (const rebuilt of [false, true]) {
    const room = t9Room({ rebuilt });
    for (const mode of T9_MODES) {
      const env = await setup(tramoId(9), { flags: rebuilt ? [F.t9Gap] : [], vars: mode ? { [V.t9Axis]: mode } : {} });
      const wrong = [];
      for (let ly = 0; ly < room.h; ly++) {
        for (let lx = 0; lx < room.w; lx++) {
          if (room.at(lx, ly) === 'o') continue; // el objeto es sólido hasta cogerlo (rincón sin paso)
          const [x, y] = t9Map(lx, ly);
          const real =!solidAt(env, x, y) && [2, 4, 6, 8].some((d) => env.map.playerPassable(x, y, d, {}));
          if (real !== walkableAt(room, lx, ly, mode)) wrong.push(`${room.at(lx, ly)}(${x},${y}) ${real ? 'se pisa' : 'bloquea'}`);
        }
      }
      assert.deepEqual(wrong, [], `rejilla ≠ mapa (reconstruido ${rebuilt}, eje ${mode})`);
    }
  }
  const env = await setup(tramoId(9));
  const kinds = (k) => env.world.events.filter((e) => e.def?.axisKind === k).length;
  const room = t9Room();
  assert.equal(kinds('crystal'), room.crystals.length);
  assert.equal(kinds('current'), room.currents.length);
  assert.equal(kinds('fold'), room.folds.length * 2);
  assert.equal(kinds('debris'), room.debris.length);
  assert.ok(env.def.voidBlocks, 'sin voidBlocks los escombros se pisan en el vacío');
  const items = env.world.events.filter((e) => e.def?.type === 'item').map((e) => [e.x - INNER.x, e.y - INNER.y]);
  assert.deepEqual(items, room.items.map((i) => [i.x, i.y]));
});

// ───────────────────────────── Cielo Interior, Terraza y Núcleo ─────────────────────────────

const trioStrips = () => Object.values(CIELO.trio).flatMap((t) => t.strip);

test('Cielo Interior: el Trío corta el paso (cada terraza) y el arco solo se abre tras el sello', async () => {
  const start = [CIELO.arrive.x, CIELO.arrive.y];
  const sealed = await setup('cielo_interior', { block: trioStrips() });
  const r0 = reach(sealed, start);
  assert.ok(!r0.has(CIELO.gateStand.x, CIELO.gateStand.y), 'se llega al arco sin pasar por el Trío');
  assert.ok(!r0.has(CIELO.trio.tornadus.at.x, CIELO.trio.tornadus.at.y + 1), 'se rodea la franja de Tornadus');
  const done = await setup('cielo_interior', { flags: [F.tornadus, F.thundurus, F.landorus, F.trio] });
  const r1 = reach(done, start);
  assert.ok(r1.has(CIELO.gateStand.x, CIELO.gateStand.y), 'tras el Trío no se llega al arco');
  for (const s of CIELO.springs) assert.ok(r1.has(s.stand.x, s.stand.y), `manantial ${s.n} inalcanzable`);
  assert.deepEqual(unreachableItems(done, r1), []);
  assert.deepEqual(traps(done, start), []);
});

test('Terraza: el dintel del núcleo queda cerrado hasta ganar a Gael', async () => {
  const start = [TERRAZA.arrive.x, TERRAZA.arrive.y];
  const before = await setup('terraza_ultimo_sello', { flags: [F.gaelHeal] });
  assert.ok(!reach(before, start).has(TERRAZA.door.x, TERRAZA.door.y + 1), 'sin ganar a Gael se llega al dintel');
  const after = await setup('terraza_ultimo_sello', { flags: [F.gaelHeal, F.gaelB6, F.gaelTalk, F.gaelGone] });
  const r = reach(after, start);
  assert.ok(r.has(TERRAZA.door.x, TERRAZA.door.y + 1), 'tras ganar a Gael no se llega al dintel');
  assert.ok(r.has(TERRAZA.steleStand.x, TERRAZA.steleStand.y), 'la estela del verso X no se alcanza');
  assert.deepEqual(traps(after, start), []);
});

test('Núcleo del Origen: el sello del suelo se alcanza desde la llegada', async () => {
  const env = await setup('nucleo_origen');
  const r = reach(env, [NUCLEO.arrive.x, NUCLEO.arrive.y]);
  assert.ok(r.has(NUCLEO.coreStand.x, NUCLEO.coreStand.y), 'no se llega al núcleo');
  assert.ok(r.has(NUCLEO.back.x, NUCLEO.back.y), 'no se llega a la salida');
});
