// Modo desarrollador: casilla de llegada al teletransportarse y catálogo de mapas por bloque.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import {
  isStandable, isGoodSpot, nearestGoodSpot, findArrivalSpot, arrivalCandidates, spotNear, parseCoords,
} from '../game/src/dev/devArrival.js';
import { mapCatalog, searchMaps, mapFolder, groupLabel } from '../game/src/dev/devMaps.js';

/** Mapa de juguete: '#' muro, '.' suelo, ' ' vacío; 'E' suelo con un evento sólido encima. */
function fakeMap(rows) {
  const height = rows.length;
  const width = rows[0].length;
  const at = (x, y) => rows[y]?.[x];
  const events = [];
  rows.forEach((r, y) => [...r].forEach((c, x) => { if (c === 'E') events.push({ x, y, through: false, at: (ax, ay) => ax === x && ay === y }); }));
  return {
    width, height, events,
    valid: (x, y) => x >= 0 && y >= 0 && x < width && y < height,
    isVoid: (x, y) => at(x, y) === ' ',
    playerPassable: (x, y) => at(x, y) === '.' || at(x, y) === 'E',
  };
}

test('casilla válida: pisable, sin evento sólido y con salida', () => {
  const m = fakeMap([
    '#####',
    '#.#.#',
    '###.#',
    '#E..#',
    '#####',
  ]);
  assert.equal(isStandable(m, 0, 0), false, 'muro');
  assert.equal(isStandable(m, 1, 3), false, 'evento sólido');
  assert.equal(isStandable(m, 1, 1), true);
  assert.equal(isGoodSpot(m, 1, 1), false, 'encerrada: no se puede salir');
  assert.equal(isGoodSpot(m, 3, 3), true);
  assert.deepEqual(nearestGoodSpot(m, 1, 1), { x: 3, y: 1 }, "la más cercana con salida");
});

test('orden de llegada: inicio, punto de Vuelo, puertas, conexiones y centro', () => {
  const m = fakeMap([
    '#######',
    '#.....#',
    '#.....#',
    '#.....#',
    '#######',
  ]);
  const def = { width: 7, height: 5, start: { x: 0, y: 0 }, flyPoint: { x: 2, y: 2, dir: 8 }, warps: [{ x: 5, y: 1, to: 'x' }] };
  const cands = arrivalCandidates(def);
  assert.deepEqual(cands.slice(0, 2).map((c) => c.source), ['inicio', 'vuelo']);
  assert.deepEqual(findArrivalSpot(def, m), { x: 2, y: 2, dir: 8, source: 'vuelo' }, 'el inicio es un muro: se usa el Vuelo');
  const noFly = { ...def, flyPoint: undefined };
  assert.equal(findArrivalSpot(noFly, m).source, 'puerta');
  const bare = { width: 7, height: 5 };
  assert.deepEqual(findArrivalSpot(bare, m), { x: 3, y: 2, dir: 2, source: 'centro' });
  const conn = { width: 7, height: 5, connections: [{ dir: 'south', to: 'y' }] };
  const c = findArrivalSpot(conn, m);
  assert.equal(c.source, 'conexión');
  assert.equal(c.y, 3, 'una casilla dentro del borde sur');
});

test('casilla escrita a mano: se ajusta a la válida más cercana y se lee «x,y»', () => {
  const m = fakeMap(['#####', '#...#', '#####']);
  assert.deepEqual(spotNear(m, 2, 1, 4), { x: 2, y: 1, dir: 4, adjusted: false });
  assert.equal(spotNear(m, 2, 0).adjusted, true);
  assert.deepEqual(parseCoords('12, 7'), { x: 12, y: 7 });
  assert.deepEqual(parseCoords('3 4 8'), { x: 3, y: 4, dir: 8 });
  assert.equal(parseCoords('3'), null);
  assert.equal(parseCoords('a,b'), null);
});

test('mapas reales: la llegada automática cae en una casilla pisable y con salida', async () => {
  for (const id of ['ruinas_dintel', 'villa_zaguan', 'ruta_1', 'casa_dintel', 'dev_test']) {
    const { def, entry } = await buildMapNode(id);
    const spot = findArrivalSpot(def, entry.map);
    assert.ok(spot, `${id}: hay llegada`);
    assert.ok(isGoodSpot(entry.map, spot.x, spot.y), `${id}: (${spot.x},${spot.y}) ${spot.source} es válida`);
  }
});

test('catálogo de mapas: todos los registrados, agrupados por bloque en orden y con búsqueda', () => {
  const cat = mapCatalog(MAPS, () => '');
  assert.equal(cat.maps.length, Object.keys(MAPS).length);
  assert.equal(mapFolder('() => import("./b09a/x.js")'), 'b09a');
  assert.equal(groupLabel('b02'), 'B02');
  assert.equal(groupLabel('dev'), 'Pruebas');
  const labels = cat.groups.map((g) => g.label);
  assert.ok(labels.indexOf('B02') < labels.indexOf('B10'), 'B02 antes que B10');
  assert.equal(labels[labels.length - 1], 'Pruebas');
  const named = mapCatalog(MAPS);
  assert.ok(searchMaps(named, 'ruinas_dintel').some((m) => m.id === 'ruinas_dintel'));
  assert.ok(searchMaps(named, 'B02').every((m) => m.group === 'B02'));
  assert.equal(searchMaps(named, 'villa alba')[0].id, 'villa_alba', 'el pueblo antes que sus casas');
});
