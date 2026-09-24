// Mapas de prueba construidos en Node: validez, determinismo y conectividad (se puede llegar a la puerta).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { MAPS } from '../game/src/content/maps/index.js';
import { dx, dy } from '../game/src/world/gameMap.js';

/** BFS de casillas alcanzables a pie (pasabilidad del jugador, saltando salientes hacia abajo). */
function reachable(map, sx, sy) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  const player = { isPlayer: true };
  while (q.length) {
    const [x, y] = q.shift();
    for (const d of [2, 4, 6, 8]) {
      let nx = x + dx(d);
      let ny = y + dy(d);
      if (!map.valid(nx, ny)) continue;
      if (!map.passable(x, y, d, player) || !map.passable(nx, ny, 10 - d, player)) continue;
      if (map.terrainTagAt(nx, ny).ledge) { nx += dx(d); ny += dy(d); if (!map.valid(nx, ny)) continue; }
      const k = `${nx},${ny}`;
      if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); }
    }
  }
  return seen;
}

for (const id of Object.keys(MAPS)) {
  test(`mapa ${id}: se construye de forma determinista y sus warps apuntan a mapas existentes`, async () => {
    const a = await buildMapNode(id);
    const b = await buildMapNode(id);
    assert.equal(a.built.width, a.def.width);
    for (let l = 0; l < 3; l++) assert.deepEqual(Array.from(a.built.layers[l]), Array.from(b.built.layers[l]));
    for (const w of a.def.warps || []) assert.ok(MAPS[w.to], `warp a mapa inexistente ${w.to}`);
    for (const c of a.def.connections || []) assert.ok(MAPS[c.to], `conexión a mapa inexistente ${c.to}`);
    for (const ev of a.def.events || []) assert.ok(a.entry.map.valid(ev.x, ev.y), `evento ${ev.id} fuera del mapa`);
  });
}

test('dev_test: desde el inicio se llega a la puerta de la casa, a la hierba alta y al borde este', async () => {
  const { def, entry } = await buildMapNode('dev_test');
  const r = reachable(entry.map, def.start.x, def.start.y);
  const door = def.warps.find((w) => w.to === 'dev_test_casa');
  assert.ok(r.has(`${door.x},${door.y}`), 'puerta alcanzable');
  assert.ok([...r].some((k) => { const [x, y] = k.split(',').map(Number); return entry.map.terrainTagAt(x, y).landWildEncounters; }), 'hierba alcanzable');
  assert.ok([...r].some((k) => k.startsWith(`${def.width - 1},`)), 'borde este (conexión) alcanzable');
});

test('dev_test_casa: la llegada es pasable y las salidas están en la alfombra', async () => {
  const { def, entry } = await buildMapNode('dev_test_casa');
  const outside = (await buildMapNode('dev_test')).def.warps[0];
  assert.ok(entry.map.passableStrict(outside.tx, outside.ty), 'casilla de llegada pasable');
  const r = reachable(entry.map, outside.tx, outside.ty);
  for (const w of def.warps) assert.ok(r.has(`${w.x},${w.y}`), `salida ${w.x},${w.y} alcanzable`);
});
