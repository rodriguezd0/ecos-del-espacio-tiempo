// Relleno del exterior de un mapa (world/borderFill.js): continúa el terreno del borde como los bloques de borde de
// los juegos oficiales, con árboles enteros (unidades completas, no filas sueltas), sin tiras en el vacío de las
// cuevas y con patrón propio por mapa (def.border.brush).
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  borderMode, lineRule, ruleIndex, sidePeriod, createEdgeFill, edgeVoid, buildBorderPattern,
} from '../game/src/world/borderFill.js';

const GRASS = 400;
const WATER = 136;
// Árbol de 2×2 casillas en las capas 1–2: TL, TR / BL, BR.
const TREE = [[1001, 1002], [1009, 1010]];

/** Mapa de prueba a partir de una función (x, y) → [capa0, capa1, capa2]. */
function makeMap(w, h, cell) {
  return { width: w, height: h, data: (x, y, l) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : cell(x, y)[l] || 0) };
}

/** Tiles de la casilla exterior (x, y) según el relleno: [capa0, capa1]. */
function tilesAt(map, fill, x, y) {
  const { ground, upper } = fill.source(x, y);
  return [ground ? map.data(ground[0], ground[1], 0) : 0, upper ? map.data(upper[0], upper[1], 1) : 0];
}

test('borderMode: exterior por defecto; negro en interiores, mapas pequeños, panorama e imposibles; patrón propio', () => {
  assert.equal(borderMode({ width: 40, height: 40, tileset: 7 }), 'edge');
  assert.equal(borderMode({ width: 40, height: 40, tileset: 4 }), 'none');
  assert.equal(borderMode({ width: 12, height: 10, tileset: 7 }), 'none');
  assert.equal(borderMode({ width: 40, height: 40, panorama: { image: 'a.png' } }), 'none');
  assert.equal(borderMode({ width: 40, height: 40, impossible: {} }), 'none');
  assert.equal(borderMode({ width: 40, height: 40, border: false }), 'none');
  assert.equal(borderMode({ width: 12, height: 10, border: 'edge' }), 'edge');
  assert.equal(borderMode({ width: 40, height: 40, border: { brush: 'bosque' } }), 'pattern');
});

test('lineRule: periodo desde el borde, saltando un objeto suelto, o ninguno', () => {
  assert.deepEqual(lineRule([1, 2, 1, 2, 1, 2]), { k: 0, p: 2 });
  assert.deepEqual(lineRule([9, 1, 1, 1, 1]), { k: 1, p: 1 }, 'cartel en el borde: se salta');
  assert.equal(lineRule([1, 2, 3, 4, 5, 6]), null);
  assert.deepEqual(sidePeriod([{ k: 0, p: 2 }, { k: 0, p: 2 }, { k: 0, p: 4 }, null, { k: 1, p: 1 }]), 2);
  // Periodo 2 desde el borde: fuera se alternan (borde, 2.ª casilla) con la fase correcta.
  const r = { k: 0, p: 2 };
  assert.deepEqual([1, 2, 3, 4].map((d) => ruleIndex(r, d)), [1, 0, 1, 0]);
});

test('un bosque de árboles 2×2 se continúa por unidades completas en los 4 lados y las esquinas', () => {
  const W = 12;
  const H = 10;
  const map = makeMap(W, H, (x, y) => [GRASS, TREE[y % 2][x % 2]]);
  const fill = createEdgeFill(map);
  const expected = (x, y) => TREE[((y % 2) + 2) % 2][((x % 2) + 2) % 2];
  for (let y = -5; y < H + 5; y++) {
    for (let x = -5; x < W + 5; x++) {
      if (x >= 0 && y >= 0 && x < W && y < H) continue;
      assert.deepEqual(tilesAt(map, fill, x, y), [GRASS, expected(x, y)], `(${x},${y})`);
    }
  }
});

test('la fila de árboles que bordea el mapa sigue fuera como bosque de árboles enteros (no filas sueltas)', () => {
  // Filas 0–1: una fila de árboles 2×2 al norte; el resto, césped liso.
  const map = makeMap(10, 12, (x, y) => [GRASS, y < 2 ? TREE[y][x % 2] : 0]);
  const fill = createEdgeFill(map);
  for (let y = -6; y < 0; y++) {
    for (let x = -3; x < 13; x++) {
      assert.deepEqual(tilesAt(map, fill, x, y), [GRASS, TREE[((y % 2) + 2) % 2][((x % 2) + 2) % 2]], `(${x},${y})`);
    }
  }
});

test('un objeto suelto en el borde (farola) no se repite: fuera sigue el césped', () => {
  const LAMP = [2001, 2009];
  const map = makeMap(10, 12, (x, y) => [GRASS, x === 4 && y < 2 ? LAMP[y] : 0]);
  const fill = createEdgeFill(map);
  for (let y = -6; y < 0; y++) assert.deepEqual(tilesAt(map, fill, 4, y), [GRASS, 0], `(4,${y})`);
});

test('el suelo bajo un árbol copiado es el de su casilla (no el agua vecina)', () => {
  // Borde oeste: bosque de 3 árboles (x 0–5) sobre césped con raíz (401/402) en x 0–1 y agua debajo del resto: el
  // suelo solo tendría periodo desde x 2 (agua) y el decorado desde el borde (árboles).
  const ROOT = [401, 402];
  const map = makeMap(14, 8, (x, y) => [x < 2 ? ROOT[x] : WATER, x < 6 ? TREE[y % 2][x % 2] : 0]);
  const fill = createEdgeFill(map);
  for (let y = 0; y < 8; y++) {
    for (let x = -4; x < 0; x++) {
      const [g, u] = tilesAt(map, fill, x, y);
      assert.ok(u, `(${x},${y}) el bosque sigue hacia fuera`);
      assert.equal(g, ROOT[((x % 2) + 2) % 2], `(${x},${y}) árbol sobre su césped, no sobre el agua`);
    }
  }
});

test('cuevas «flotando» en negro: fuera todo es el vacío, sin tiras de pared sueltas', () => {
  const BLACK = 403;
  const WALL = 536;
  // Contorno negro salvo una pared que toca el borde oeste en la fila 5.
  const cave = makeMap(20, 12, (x, y) => (x === 0 && y === 5 ? [BLACK, WALL] : [BLACK, 0]));
  assert.deepEqual(edgeVoid(cave, { cave: true }), { cell: [0, 0] });
  const fill = createEdgeFill(cave, { cave: true });
  assert.ok(fill.isVoid);
  assert.deepEqual(tilesAt(cave, fill, -3, 5), [BLACK, 0]);
  // Sin tiles en el contorno (salas sobre vacío): negro, en cualquier tileset.
  const rooms = makeMap(20, 12, (x, y) => (x > 2 && y > 2 && x < 17 && y < 9 ? [GRASS, 0] : [0, 0]));
  assert.deepEqual(edgeVoid(rooms), { cell: null });
  assert.deepEqual(tilesAt(rooms, createEdgeFill(rooms), -1, 4), [0, 0]);
  // Un exterior con césped liso en el contorno no es «vacío» (fuera de las cuevas).
  assert.equal(edgeVoid(makeMap(20, 12, () => [GRASS, 0])), null);
});

test('patrón propio (def.border.brush): anillo pintado alrededor del mapa con el MapBuilder', () => {
  const def = { id: 'isla', width: 20, height: 16, tileset: 1, border: { brush: WATER, marginX: 3, marginY: 2 } };
  const ring = buildBorderPattern(def, { warn: () => {} });
  assert.deepEqual(ring.get('-1,-1'), [WATER, 0, 0]);
  assert.deepEqual(ring.get('22,17'), [WATER, 0, 0]);
  assert.ok(!ring.has('5,5'), 'dentro del mapa no se pinta');
  assert.equal(ring.size, (20 + 6) * (16 + 4) - 20 * 16);
  assert.equal(buildBorderPattern({ width: 40, height: 40 }), null);
});
