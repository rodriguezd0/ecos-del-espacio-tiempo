import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MapBuilder, srcTileId, pathCells, nineId } from '../game/src/world/mapBuilder.js';
import { resolveAutotileId } from '../game/src/shared/autotile.js';
import { EncounterSystem, normalizeEntry } from '../game/src/world/encounters.js';

const mk = (opts = {}) => new MapBuilder({ width: 10, height: 8, tileset: 7, id: 'prueba', warn: () => {}, ...opts });

test('srcTileId: 384 + y*8 + x (imagen original de 8 columnas)', () => {
  assert.equal(srcTileId(0, 0), 384);
  assert.equal(srcTileId(4, 1), 396);
});

test('el builder es determinista (misma semilla → mismas capas)', () => {
  const run = () => {
    const b = mk();
    b.fill(0, { tile: 384, variants: [385, 386], chance: 0.5 });
    b.scatter(1, 0, 0, 10, 8, 400, 0.3);
    return b.build().layers.map((l) => Array.from(l));
  };
  assert.deepEqual(run(), run());
  const other = mk({ seed: 99 });
  other.fill(0, { tile: 384, variants: [385, 386], chance: 0.5 });
  assert.notDeepEqual(Array.from(other.build().layers[0]), run()[0]);
});

test('pattern y grid rellenan en mosaico según la posición', () => {
  const b = mk();
  b.fill(null, { pattern: [0, 0, 4, 4], layer: 0 });
  b.rect(null, 0, 0, 2, 2, { grid: [[136, 134], [130, 132]], layer: 1 });
  const { layers } = b.build();
  assert.equal(layers[0][0], srcTileId(0, 0));
  assert.equal(layers[0][5], srcTileId(1, 0));
  assert.equal(layers[0][4 + 4 * 10], srcTileId(0, 0));
  assert.deepEqual([layers[1][0], layers[1][1], layers[1][10], layers[1][11]], [136, 134, 130, 132]);
});

test('nine: esquinas, bordes, centro y esquinas cóncavas (NO,NE/SO,SE)', () => {
  const brush = { nine: [0, 4], inner: [3, 4], layer: 1 };
  const b = mk();
  b.rect(null, 1, 1, 4, 3, brush);
  const L = b.build().layers[1];
  const at = (x, y) => L[x + y * 10];
  assert.equal(at(1, 1), srcTileId(0, 4), 'esquina sup-izq');
  assert.equal(at(2, 1), srcTileId(1, 4), 'borde superior');
  assert.equal(at(4, 1), srcTileId(2, 4), 'esquina sup-der');
  assert.equal(at(2, 2), srcTileId(1, 5), 'centro');
  assert.equal(at(4, 3), srcTileId(2, 6), 'esquina inf-der');
  // cóncava: celda con todos los vecinos ortogonales dentro pero sin la diagonal NO
  const inside = (x, y) => !(x === 0 && y === 0);
  assert.equal(nineId(brush, 1, 1, inside), srcTileId(3, 4));
  assert.equal(nineId(brush, 1, 1, (x, y) => !(x === 2 && y === 2)), srcTileId(4, 5));
});

test('autotile por vecinos: el builder usa resolveAutotileId al construir', () => {
  const b = mk();
  b.autotile(0, 2, 2, 3, 3, 1);
  const { layers, width, height } = b.build();
  const slots = (x, y) => (x >= 2 && x <= 4 && y >= 2 && y <= 4 ? 1 : -1);
  for (let y = 2; y <= 4; y++) for (let x = 2; x <= 4; x++) {
    assert.equal(layers[0][x + y * width], resolveAutotileId(slots, x, y, width, height));
  }
  assert.equal(layers[0][0], 0);
});

test('stamp src: copia a su capa y omite tiles vacíos; marca la puerta', () => {
  const empty = new Set([srcTileId(0, 60)]);
  const b = mk({ isEmpty: (id) => empty.has(id), stamps: { casa: { src: [0, 60, 3, 2], layer: 2, door: [1, 1] } } });
  const info = b.stamp('casa', 2, 3);
  const { layers, markers } = b.build();
  assert.equal(layers[2][2 + 3 * 10], 0, 'tile vacío omitido');
  assert.equal(layers[2][3 + 3 * 10], srcTileId(1, 60));
  assert.equal(layers[2][4 + 4 * 10], srcTileId(2, 61));
  assert.deepEqual(info.door, { x: 3, y: 4 });
  assert.equal(markers[0].kind, 'door');
});

test('stamp horneado de la biblioteca ({ w, h, layers }) y ausencia tolerada', () => {
  const warns = [];
  const library = { stamps: { roca: { w: 2, h: 1, layers: [null, [500, 0], [0, 501]] } }, brushes: {} };
  const b = mk({ library, warn: (m) => warns.push(m) });
  b.stamp('roca', 0, 0);
  assert.equal(b.stamp('no_existe', 0, 0), null);
  const { layers } = b.build();
  assert.equal(layers[1][0], 500);
  assert.equal(layers[2][1], 501);
  assert.equal(layers[1][1], 0);
  assert.ok(warns.some((w) => w.includes('no_existe')));
});

test('fallback: solo se usa si la biblioteca no tiene el nombre', () => {
  const b = mk({ library: { stamps: {}, brushes: { suelo: { tile: 390 } } }, fallback: { brushes: { suelo: { tile: 391 }, otro: { tile: 392 } } } });
  b.rect(0, 0, 0, 1, 1, 'suelo');
  b.rect(0, 1, 0, 1, 1, 'otro');
  const { layers } = b.build();
  assert.equal(layers[0][0], 390);
  assert.equal(layers[0][1], 392);
});

test('forest nativo: copas en capa 2 y troncos en capa 1 (pasabilidad de troncos solapados)', () => {
  const b = mk({ width: 2, height: 10 });
  b.rect(null, 0, 0, 2, 10, { forest: { trees: [[0, 39]], size: [2, 6], period: [2, 4] }, layer: 2, trunkLayer: 1 });
  const { layers } = b.build();
  // árbol inferior anclado en y=4..9: filas 4..7 copa (capa 2), 8..9 tronco (capa 1)
  assert.equal(layers[2][0 + 4 * 2], srcTileId(0, 39));
  assert.equal(layers[1][0 + 8 * 2], srcTileId(0, 43));
  // árbol superior (y=0..5): su tronco (filas 4..5) queda en capa 1 bajo la copa del inferior
  assert.equal(layers[1][0 + 4 * 2], srcTileId(0, 43));
});

test('line: extremos y tramo medio (saliente)', () => {
  const b = mk();
  b.rect(null, 2, 5, 4, 1, { line: { ids: [651, 657, 652] }, layer: 1 });
  const L = b.build().layers[1];
  assert.deepEqual([2, 3, 4, 5].map((x) => L[x + 5 * 10]), [651, 657, 657, 652]);
});

test('pathCells: tramos ortogonales con anchura', () => {
  const cells = pathCells([[0, 0], [2, 0], [2, 1]], 1);
  assert.deepEqual(cells, [[0, 0], [1, 0], [2, 0], [2, 1]]);
  assert.equal(pathCells([[0, 0], [1, 0]], 2).length, 6);
});

test('encuentros: normalización de entradas y elección ponderada determinista', () => {
  assert.deepEqual(normalizeEntry([40, 'PIDGEY', 2, 4]), { weight: 40, species: 'PIDGEY', min: 2, max: 4, form: 0 });
  let i = 0;
  const seq = [0.1, 0.5, 0.9, 0.3];
  const rng = () => seq[i++ % seq.length];
  const enc = new EncounterSystem({ grass: [[70, 'A', 2, 2], [30, 'B', 5, 5]], grassNight: [[1, 'C', 9, 9]] }, rng);
  assert.equal(enc.resolveType('grass', 12), 'grass');
  assert.equal(enc.resolveType('grass', 23), 'grassNight');
  const pick = enc.choose('grass');
  assert.ok(['A', 'B'].includes(pick.species));
  assert.equal(enc.encounterType({ terrain: { landWildEncounters: false }, hour: 12 }), null);
  assert.equal(enc.encounterType({ terrain: { landWildEncounters: true }, hour: 12 }), 'grass');
});
