// Acceso al agua (world/waterAccess.js): el aviso de nadar no sale desde un puente ni hacia el agua bajo un
// tablero, y una casilla bloqueada junto al agua no deja al jugador nadando sin la capacidad Nadar.
import test from 'node:test';
import assert from 'node:assert/strict';
import { canOfferSwim, isOnBridge, isSwimWater, nearestFreeSpot } from '../game/src/world/waterAccess.js';
import { TERRAIN_BY_ID, TERRAIN_NONE } from '../game/src/world/terrain.js';
import { buildMapNode } from '../tools/lib/map_node.mjs';

const [DOWN, LEFT, RIGHT, UP] = [2, 4, 6, 8];

/**
 * Mapa de prueba en ASCII: '.' tierra, '~' agua, '#' muro, '=' tablero sobre el agua (se pisa; terrain Water debajo),
 * 'B' tile con terrain tag Bridge sobre agua (con bridge 0 no se pisa, como en Essentials).
 */
function gridMap(rows) {
  const h = rows.length;
  const w = rows[0].length;
  const at = (x, y) => rows[y][x];
  const map = {
    width: w,
    height: h,
    valid: (x, y) => x >= 0 && y >= 0 && x < w && y < h,
    playerPassable: (x, y) => map.valid(x, y) && ['.', '='].includes(at(x, y)),
    terrainTagAt(x, y, bridge = 0, countBridge = false) {
      if (!map.valid(x, y)) return TERRAIN_NONE;
      const c = at(x, y);
      if (c === 'B') return countBridge || bridge > 0 ? TERRAIN_BY_ID.Bridge : TERRAIN_BY_ID.Water;
      return c === '~' || c === '=' ? TERRAIN_BY_ID.Water : TERRAIN_NONE;
    },
  };
  return map;
}

const worldAt = (map, x, y, direction, extra = {}) => ({
  map, bridge: 0, env: () => ({}), player: { x, y, direction, surfing: false }, ...extra,
});

// Río E–O (filas 3–4) con una pasarela de tablones N–S de 3 de ancho (x 4–6) y un embarcadero al sur (x 9–10).
const RIVER = gridMap([
  '............',
  '............',
  '............',
  '~~~~...~~~~~',
  '~~~~...~~~~~',
  '............',
  '.........~..',
  '........~..~',
  '........~~~~',
]);
// Tableros sobre el agua (x 2–3) y un tile Bridge (x 5) en un canal.
const DECKS = gridMap([
  '........',
  '~~==~B~~',
  '~~==~B~~',
  '........',
]);

test('desde la orilla se ofrece nadar; desde la pasarela del río, no', () => {
  assert.equal(canOfferSwim(worldAt(RIVER, 2, 2, DOWN)), true, 'orilla norte mirando al río');
  assert.equal(canOfferSwim(worldAt(RIVER, 4, 3, LEFT)), false, 'borde oeste de la pasarela');
  assert.equal(canOfferSwim(worldAt(RIVER, 6, 4, RIGHT)), false, 'borde este de la pasarela');
  assert.equal(isOnBridge(RIVER, 5, 3, LEFT), true);
  assert.equal(isOnBridge(RIVER, 2, 2, DOWN), false);
});

test('un embarcadero (un extremo en el agua) sí deja nadar por su punta y sus lados', () => {
  const PIER = gridMap([
    '...........',
    '~~~~...~~~~',
    '~~~~...~~~~',
    '~~~~~~~~~~~',
  ]);
  assert.equal(canOfferSwim(worldAt(PIER, 4, 2, LEFT)), true, 'lado del embarcadero');
  assert.equal(canOfferSwim(worldAt(PIER, 5, 2, DOWN)), true, 'punta del embarcadero');
});

test('nunca hacia el agua bajo un tablero o un tile de puente, ni con el jugador sobre un puente', () => {
  assert.equal(isSwimWater(DECKS, 2, 1), false, 'tablero que se pisa');
  assert.equal(isSwimWater(DECKS, 5, 1), false, 'agua bajo un tile Bridge');
  assert.equal(canOfferSwim(worldAt(DECKS, 2, 0, DOWN)), false, 'mirando al tablero desde la orilla');
  assert.equal(canOfferSwim(worldAt(DECKS, 5, 0, DOWN)), false, 'mirando al puente con tag Bridge');
  assert.equal(canOfferSwim(worldAt(DECKS, 2, 1, LEFT)), false, 'desde el tablero hacia el canal');
  assert.equal(canOfferSwim(worldAt(DECKS, 4, 0, DOWN)), true, 'agua libre del canal');
  assert.equal(canOfferSwim(worldAt(DECKS, 4, 0, DOWN, { bridge: 2 })), false, 'altura de puente > 0 (ctx.bridge)');
  const surfing = worldAt(DECKS, 4, 0, DOWN);
  surfing.player.surfing = true;
  assert.equal(canOfferSwim(surfing), false, 'ya nadando');
});

test('casilla bloqueada junto al agua: sin Nadar se aparece en tierra; con Nadar vale el agua más cercana', () => {
  const LAKE = gridMap([
    '#~~~~',
    '#~~~~',
    '##~~~',
    '....~',
  ]);
  assert.deepEqual(nearestFreeSpot(LAKE, 0, 0), { x: 0, y: 3 }, 'sin Nadar: la tierra aunque esté más lejos');
  assert.deepEqual(nearestFreeSpot(LAKE, 0, 0, { canSwim: true }), { x: 1, y: 0 });
  assert.deepEqual(nearestFreeSpot(LAKE, 2, 1, { canSwim: true }), { x: 2, y: 1 }, 'reanudar nadando');
  assert.deepEqual(nearestFreeSpot(LAKE, 2, 1), { x: 0, y: 3 }, 'sin Nadar nunca se queda en el agua');
});

test('mapas reales: puentes de tablones de la Ruta 1 y la Ruta 2 y embarcadero de Caudal', async () => {
  const ruta1 = (await buildMapNode('ruta_1')).entry.map;
  assert.equal(canOfferSwim(worldAt(ruta1, 13, 18, LEFT)), false, 'Ruta 1: puente del arroyo, lado oeste');
  assert.equal(canOfferSwim(worldAt(ruta1, 15, 19, RIGHT)), false, 'Ruta 1: puente del arroyo, lado este');
  assert.equal(canOfferSwim(worldAt(ruta1, 12, 17, DOWN)), true, 'Ruta 1: orilla del arroyo');
  const ruta2 = (await buildMapNode('ruta_2')).entry.map;
  assert.equal(canOfferSwim(worldAt(ruta2, 13, 16, LEFT)), false, 'Ruta 2: primer puente');
  assert.equal(canOfferSwim(worldAt(ruta2, 15, 53, RIGHT)), false, 'Ruta 2: segundo puente');
  const caudal = (await buildMapNode('ciudad_caudal')).entry.map;
  assert.equal(canOfferSwim(worldAt(caudal, 37, 41, DOWN)), true, 'Caudal: punta del embarcadero (C068)');
  assert.equal(canOfferSwim(worldAt(caudal, 36, 41, LEFT)), true, 'Caudal: lado del embarcadero');
});

test('las células de Nadar de B03–B05 siguen teniendo sitios desde los que entrar en su agua', async () => {
  const STEPS = [[DOWN, 0, 1], [LEFT, -1, 0], [RIGHT, 1, 0], [UP, 0, -1]];
  const targets = [['ruta_2', 23, 31], ['ciudad_caudal', 33, 42], ['garganta_albo', 10, 11], ['ruta_4', 16, 26]];
  for (const [id, tx, ty] of targets) {
    const map = (await buildMapNode(id)).entry.map;
    const body = new Set();
    const queue = [[tx, ty], ...STEPS.map(([, ax, ay]) => [tx + ax, ty + ay])];
    while (queue.length) {
      const [x, y] = queue.pop();
      if (body.has(`${x},${y}`) || !isSwimWater(map, x, y)) continue;
      body.add(`${x},${y}`);
      for (const [, ax, ay] of STEPS) queue.push([x + ax, y + ay]);
    }
    let entries = 0;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (!map.playerPassable(x, y, 0, {})) continue;
        for (const [d, ax, ay] of STEPS) if (body.has(`${x + ax},${y + ay}`) && canOfferSwim(worldAt(map, x, y, d))) entries += 1;
      }
    }
    assert.ok(body.size > 0 && entries > 0, `${id} (${tx},${ty}): agua ${body.size}, entradas ${entries}`);
  }
});
