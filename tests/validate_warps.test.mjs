// Validador de contenido — warps y conexiones (tools/validate_content_lib.mjs): el warp de ORIGEN se puede activar
// (pisarlo/empujarlo desde una vecina pisable o, con dirTrigger, estando encima), la LLEGADA de warps y conexiones es
// pintada, transitable sin puente y no encerrada, y la alcanzabilidad avisa de warps en bolsillos. Mapas sintéticos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameMap } from '../game/src/world/gameMap.js';
import {
  Report, painted, standable, stepTarget, reachableFrom, warpActivation, arrivalProblem, checkWarps,
  checkConnections, checkWarpReach, entrySeeds, edgeCrossings,
} from '../tools/validate_content_lib.mjs';
import { T, testTileset } from './world_helpers.mjs';

const BRIDGE = 394;

/**
 * Mapa desde filas: capa 0 = césped salvo ' ' (vacío: sin ningún tile); símbolos en capa 1 como world_helpers
 * (# muro, L saliente, w agua) y '=' puente (agua en capa 1 + tablero con terrain tag Bridge en capa 2).
 */
function mapOf(rows, id = 'm') {
  const h = rows.length;
  const w = rows[0].length;
  const layers = [new Uint16Array(w * h), new Uint16Array(w * h), new Uint16Array(w * h)];
  const sym = { '#': T.WALL, L: T.LEDGE, w: T.WATER };
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    const i = x + y * w;
    if (ch === ' ') return;
    layers[0][i] = T.GRASS;
    if (sym[ch]) layers[1][i] = sym[ch];
    if (ch === '=') { layers[1][i] = T.WATER; layers[2][i] = BRIDGE; }
  }));
  const tileset = testTileset();
  tileset.terrainTags[BRIDGE] = 15;
  return new GameMap({ id, def: { id }, built: { width: w, height: h, layers }, tileset });
}

/** Contexto mínimo de checkWarps/checkConnections: mapas ya «construidos». */
function ctxOf(entries) {
  return { maps: Object.fromEntries(Object.keys(entries).map((k) => [k, true])), build: async (id) => entries[id] || null, solids: {} };
}

test('painted / standable: vacío, muro, agua (Nadar) y puente', () => {
  const m = mapOf(['. #w=']);
  assert.equal(painted(m, 0, 0), true);
  assert.equal(painted(m, 1, 0), false, 'una casilla sin tiles es el vacío');
  assert.equal(standable(m, 1, 0), false);
  assert.equal(standable(m, 2, 0), false, 'muro');
  assert.equal(standable(m, 3, 0), true, 'agua: se puede estar nadando');
  assert.equal(standable(m, 4, 0), true, 'puente: pisable a su altura');
  assert.equal(painted(m, 9, 9), false, 'fuera del mapa');
});

test('stepTarget: paso normal, muro, vacío y salto de saliente', () => {
  const m = mapOf(['...', '.#.', ' L.', '...']);
  assert.deepEqual(stepTarget(m, 0, 0, 6), [1, 0]);
  assert.equal(stepTarget(m, 1, 0, 2), null, 'muro');
  assert.equal(stepTarget(m, 0, 1, 2), null, 'al vacío no se anda');
  assert.deepEqual(stepTarget(m, 1, 1, 2), null, 'la saliente no se sube desde un muro');
  const ledge = mapOf(['.', 'L', '.']);
  assert.deepEqual(stepTarget(ledge, 0, 0, 2), [0, 2], 'la saliente se salta dos casillas');
  assert.equal(stepTarget(ledge, 0, 2, 8), null, 'y no se sube');
});

test('warpActivation: puerta en muro, warp encerrado, borde con conexión y dirTrigger', () => {
  const m = mapOf(['#####', '#.#.#', '#####', '.....']);
  const door = warpActivation(mapOf(['###', '#W#', '...'].map((r) => r.replace('W', '#'))), { x: 1, y: 1, to: 'x' });
  assert.deepEqual(door.errors, [], 'una puerta sobre un muro se activa empujando desde abajo');
  assert.deepEqual(door.spots, [[1, 2]]);
  const enclosed = warpActivation(mapOf(['###', '###', '.#.']), { x: 1, y: 1, to: 'x' });
  assert.match(enclosed.errors.join(), /entrada imposible/, 'rodeado de muros');
  assert.deepEqual(warpActivation(m, { x: 2, y: 1, to: 'x' }).spots, [[3, 1], [1, 1]], 'muro entre dos suelos: se empuja desde los lados');
  const pocket = warpActivation(m, { x: 1, y: 1, to: 'x' });
  assert.match(pocket.errors.join(), /entrada imposible/, 'pisable en sí, pero llegar encima no lo activa y no hay desde dónde pisarlo');
  const edge = mapOf(['##.', '###']);
  assert.match(warpActivation(edge, { x: 0, y: 0, to: 'x' }).errors.join(), /entrada imposible/);
  assert.deepEqual(warpActivation(edge, { x: 0, y: 0, to: 'x' }, { open: { west: true } }).errors, [], 'se entra desde el mapa conectado');
  assert.match(warpActivation(m, { x: 0, y: 0, to: 'x' }).errors.join(), /entrada imposible/);
  // dirTrigger: hay que poder estar encima
  const mat = mapOf(['#.#', '#.#']);
  assert.deepEqual(warpActivation(mat, { x: 1, y: 1, to: 'x', dirTrigger: 2 }).errors, []);
  assert.match(warpActivation(mat, { x: 0, y: 1, to: 'x', dirTrigger: 2 }).errors.join(), /no pisable/, 'barandilla');
  assert.match(warpActivation(mat, { x: 1, y: 1, to: 'x', dirTrigger: 5 }).errors.join(), /dirTrigger 5 inválido/);
  assert.match(warpActivation(mat, { x: 7, y: 7, to: 'x' }).errors.join(), /fuera del mapa/);
});

test('arrivalProblem: fuera, vacía, muro, puente, encerrada y salidas válidas', () => {
  const m = mapOf(['.#.#.', '###..', ' ...=', '#####']);
  assert.match(arrivalProblem(m, 9, 0), /fuera del mapa/);
  assert.match(arrivalProblem(m, 0, 2), /casilla vacía/);
  assert.match(arrivalProblem(m, 1, 0), /no transitable/);
  assert.match(arrivalProblem(m, 4, 2), /no transitable/, 'sobre un puente se aparecería nadando (altura 0)');
  assert.match(arrivalProblem(m, 0, 0), /encerrada/, 'rodeada de muros');
  assert.equal(arrivalProblem(m, 0, 0, { warps: [{ x: 0, y: 1, to: 'x' }] }), null, 'junto a una puerta sí hay salida');
  assert.equal(arrivalProblem(m, 0, 0, { open: { north: true } }), null, 'en un borde con conexión');
  assert.equal(arrivalProblem(m, 2, 0, { warps: [{ x: 2, y: 0, to: 'x', dirTrigger: 8 }] }), null, 'felpudo de salida');
  assert.equal(arrivalProblem(m, 2, 2), null);
});

test('reachableFrom: los warps normales son sumideros y los dirTrigger cortan su dirección', () => {
  const m = mapOf(['.....', '####.', '.....']);
  const all = reachableFrom(m, [[0, 0]]);
  assert.ok(all.has('0,2'), 'sin warps se rodea el muro');
  const sink = reachableFrom(m, [[0, 0]], { warps: [{ x: 4, y: 1, to: 'x' }] });
  assert.ok(sink.has('4,1') && !sink.has('4,2'), 'pisar el warp saca del mapa: no se sigue');
  const fromIt = reachableFrom(m, [[4, 1]], { warps: [{ x: 4, y: 1, to: 'x' }] });
  assert.ok(fromIt.has('0,0') && fromIt.has('0,2'), 'si es la llegada, se sale andando de él');
  const cut = reachableFrom(m, [[0, 0]], { warps: [{ x: 4, y: 1, to: 'x', dirTrigger: 2 }] });
  assert.ok(cut.has('4,1') && !cut.has('4,2'), 'desde un dirTrigger no se da el paso en su dirección');
});

test('checkWarps: activación en el origen y llegada en el destino', async () => {
  const origin = mapOf(['#W#', '#.#', '###'].map((r) => r.replace('W', '#')));
  const def = {
    id: 'a',
    warps: [
      { x: 1, y: 0, to: 'b', tx: 1, ty: 1 }, // correcto
      { x: 0, y: 2, to: 'b', tx: 0, ty: 0 }, // origen encerrado; llegada en muro
      { x: 1, y: 0, to: 'b', tx: 2, ty: 2 }, // llegada en el vacío
      { x: 1, y: 0, to: 'b', tx: 4, ty: 0 }, // llegada encerrada
      { x: 1, y: 0, to: 'zzz', tx: 0, ty: 0 },
    ],
  };
  const target = { def: { id: 'b', warps: [] }, entry: { map: mapOf(['#.##.', '...##', '.. ##'], 'b') } };
  const r = new Report();
  await checkWarps(r, 'a.js', def, { map: origin }, ctxOf({ b: target }));
  const msgs = r.errors.map((e) => e.msg);
  assert.equal(msgs.length, 5, msgs.join(' | '));
  assert.ok(!msgs.some((m) => /warp \(1,0\).*(entrada imposible|llegada \(1,1\))/.test(m)), 'la puerta correcta no da errores');
  assert.ok(msgs.some((m) => /warp \(0,2\).*entrada imposible/.test(m)));
  assert.ok(msgs.some((m) => /warp \(0,2\).*llegada \(0,0\) no transitable/.test(m)));
  assert.ok(msgs.some((m) => /llegada \(2,2\) en una casilla vacía/.test(m)));
  assert.ok(msgs.some((m) => /llegada \(4,0\) encerrada/.test(m)));
  assert.ok(msgs.some((m) => /zzz: mapa no registrado/.test(m)));
});

test('checkWarps: evento sólido que siempre está sobre la llegada → aviso', async () => {
  const map = mapOf(['...']);
  const ctx = ctxOf({ b: { def: { id: 'b' }, entry: { map } } });
  ctx.solids.b = new Set(['1,0']);
  const r = new Report();
  await checkWarps(r, 'a.js', { id: 'a', warps: [{ x: 0, y: 0, to: 'b', tx: 1, ty: 0 }] }, { map: mapOf(['..']) }, ctx);
  assert.equal(r.errors.length, 0);
  assert.match(r.warnings.map((e) => e.msg).join(), /evento sólido/);
});

test('checkConnections: cruce al vacío y llegada encerrada en el vecino', async () => {
  const a = mapOf(['.....', '.....']);
  // b al sur: (0,0) vacío, (2,0) bolsillo entre muros, (4,0) paso bueno
  const b = mapOf([' #.#.', '#####'.replace(/#$/, '.')], 'b');
  const def = { id: 'a', connections: [{ dir: 'south', to: 'b', offset: 0 }] };
  const other = { def: { id: 'b', connections: [{ dir: 'north', to: 'a', offset: 0 }] }, entry: { map: b } };
  const r = new Report();
  await checkConnections(r, 'a.js', def, { map: a }, ctxOf({ b: other }));
  const msgs = r.errors.map((e) => e.msg);
  assert.ok(msgs.some((m) => /desde \(0,1\) se cruza a \(0,0\), una casilla vacía/.test(m)), msgs.join(' | '));
  assert.ok(msgs.some((m) => /desde \(2,1\) se llega a \(2,0\), encerrada/.test(m)), msgs.join(' | '));
  assert.ok(!msgs.some((m) => /\(4,1\)/.test(m)), 'el paso bueno no da error');
  assert.ok(!msgs.some((m) => /ninguna casilla/.test(m)));
  assert.deepEqual(edgeCrossings(a, b, def.connections[0]).map(([x]) => x), [2, 4], 'el vacío no cuenta como cruce');
});

test('checkWarpReach: warp en un bolsillo y dirTrigger que corta un paso', () => {
  const map = mapOf(['...#..', '...#..', '......']);
  const r = new Report();
  const def = {
    id: 'm',
    warps: [
      { x: 0, y: 0, to: 'x' }, // alcanzable
      { x: 4, y: 2, to: 'x', dirTrigger: 2 }, // abajo es el borde: bien
      { x: 1, y: 2, to: 'x', dirTrigger: 6 }, // a la derecha hay suelo alcanzable por otro lado
    ],
  };
  checkWarpReach(r, 'm.js', def, { map }, [[0, 1]]);
  const msgs = r.warnings.map((e) => e.msg);
  assert.equal(msgs.length, 1, msgs.join(' | '));
  assert.match(msgs[0], /warp \(1,2\).*derecha \(2,2\) es transitable/);
  const pocket = mapOf(['.#...', '##...']);
  const r2 = new Report();
  checkWarpReach(r2, 'p.js', { id: 'p', warps: [{ x: 0, y: 0, to: 'x', dirTrigger: 8 }, { x: 4, y: 0, to: 'x' }] }, { map: pocket }, [[3, 1]]);
  assert.deepEqual(r2.warnings.map((e) => e.msg.slice(0, 11)), ['warp (0,0) '], 'el del bolsillo avisa; el otro no');
});

test('entrySeeds: start, llegadas de warps y eventos, conexiones, transporte y vecinas de eventos', () => {
  const all = {
    m: {
      def: {
        id: 'm', start: { x: 0, y: 0 }, flyPoint: { x: 1, y: 0 },
        events: [{ id: 'npc', x: 3, y: 1 }, { id: 'pared', type: 'climbWall', x: 2, y: 2, to: [2, 0] }],
        connections: [{ dir: 'east', to: 'n', offset: 0 }],
      },
      entry: { map: mapOf(['.....', '.....', '.....']) },
    },
    n: { def: { id: 'n', warps: [{ x: 0, y: 0, to: 'm', tx: 4, ty: 2 }], events: [{ id: 'buzo', x: 0, y: 0, to: 'm', tx: 0, ty: 2 }], connections: [{ dir: 'west', to: 'm' }] }, entry: { map: mapOf(['.', '.', '.']) } },
  };
  const seeds = entrySeeds('m', all, { transport: [{ map: 'm', arrival: { x: 1, y: 1 } }], scriptWarps: [{ map: 'm', x: 2, y: 1 }] })
    .map(([x, y]) => `${x},${y}`);
  for (const k of ['0,0', '1,0', '4,2', '0,2', '2,0', '1,1', '2,1', '3,0', '4,1', '4,0']) assert.ok(seeds.includes(k), `falta la semilla ${k}`);
});
