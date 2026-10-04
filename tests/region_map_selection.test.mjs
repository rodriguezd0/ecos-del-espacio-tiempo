import test from 'node:test';
import assert from 'node:assert/strict';
import { GameState } from '../game/src/core/state.js';
globalThis.location ??= { search: '' };
const { engine } = await import('../game/src/core/engine.js');
const mod = await import('../game/src/ui/screens/regionMap.js');
const { REGION_MAP } = await import('../game/src/ui/logic/regionMapData.js');
const mapData = { name: 'Prueba', width: 4, height: 4, places: [
  { id: 'pueblo', name: 'Pueblo', kind: 'town', x: 1, y: 1, fly: true },
  { id: 'ruta', name: 'Ruta', kind: 'route', x: 2, y: 2 },
] };

function press(opts, key, x = 2, y = 2) {
  const previous = { state: engine.state, input: engine.input };
  engine.state = GameState.create(); engine.input = { repeat: () => false, pressed: (k) => k === key };
  try {
    const scene = new mod.RegionMapScene({ mapData, ...opts });
    scene.cx = x; scene.cy = y;
    const results = []; scene.finish = (value) => results.push(value);
    scene.tick();
    return { results, targets: scene.jumpTargets().map((p) => p.id), visited: [...engine.state.data.visited] };
  } finally { Object.assign(engine, previous); }
}

test('expediciones: marcar con A una ruta desconocida devuelve su lugar sin viajar', () => {
  const out = press({ mode: 'select' }, 'A');
  assert.deepEqual(out.results, ['ruta']);
  assert.ok(out.targets.includes('ruta'));
  assert.deepEqual(out.visited, []);
});
test('expediciones: una casilla vacía no selecciona y B cancela', () => {
  assert.deepEqual(press({ mode: 'select' }, 'A', 0, 0).results, []);
  assert.deepEqual(press({ mode: 'select' }, 'B').results, [null]);
});
test('el mapa normal permanece abierto al pulsar A', () => {
  assert.deepEqual(press({}, 'A').results, []);
});

test('L/R recorre todas las casillas del atlas real sin atascarse en lugares superpuestos', () => {
  const old = engine.state; engine.state = GameState.create();
  try {
    for (const opts of [{ mode: 'select' }, {}]) {
      const scene = new mod.RegionMapScene({ ...opts, mapData: REGION_MAP });
      const targets = scene.jumpTargets(), unique = new Set(targets.map(p => `${p.x},${p.y}`));
      assert.equal(targets.length, unique.size);
      scene.cx = targets[0].x; scene.cy = targets[0].y;
      for (const dir of [1, -1]) {
        const visited = new Set();
        for (let n = 0; n < targets.length; n++) { visited.add(`${scene.cx},${scene.cy}`); scene.jump(dir); }
        assert.deepEqual(visited, unique);
        assert.equal(scene.cx, targets[0].x); assert.equal(scene.cy, targets[0].y);
      }
    }
  } finally { engine.state = old; }
});
