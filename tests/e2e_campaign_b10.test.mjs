import test from 'node:test';
import assert from 'node:assert/strict';
import { installB10Observer } from '../tools/e2e_campaign_b10_page.mjs?routes=2';

async function withObserver(id, check) {
  const previous = globalThis.window;
  const ordinaryCalls = [];
  const ordinary = (...args) => { ordinaryCalls.push(args); return [8, 8]; };
  const world = {
    map: { id, width: 3, valid: (x, y) => x >= 0 && x < 3 && y >= 0 && y < 3 },
    player: { x: 1, y: 2, passable: (x, y, dir) => {
      const [dx, dy] = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] }[dir];
      return world.map.valid(x + dx, y + dy);
    } },
    events: [{ x: 1, y: 1, page: {}, trigger: 'touch', through: true }],
  };
  globalThis.window = { __campaign: { engine: {}, route: ordinary }, __map: { world }, __e2e: { route: ordinary } };
  try {
    await installB10Observer({ evaluate: async fn => fn() });
    await check({ world, ordinaryCalls, observer: window.__b10, route: (...args) => window.__e2e.route(...args) });
  } finally { globalThis.window = previous; }
}

test('campaña B10: Marisma conserva la ruta ordinaria que atraviesa el contacto obligatorio del puente', async () => {
  await withObserver('ruta_8_marisma', ({ route, ordinaryCalls }) => {
    assert.deepEqual(route(1, 0), [8, 8]);
    assert.deepEqual(ordinaryCalls, [[1, 0]]);
  });
});

test('campaña B10: el Archivo Hondo evita la caída y permite pisar un contacto elegido como destino', async () => {
  await withObserver('archivo_hondo', ({ route, ordinaryCalls }) => {
    const path = route(1, 0);
    assert.equal(path.length, 4);
    assert.notEqual(path[0], 8, 'el paso directo caería en el contacto');
    assert.deepEqual(route(1, 1), [8], 'la losa elegida sigue pudiendo activarse');
    assert.equal(ordinaryCalls.length, 0);
  });
});

test('campaña B10: salir del puzzle recupera automáticamente la ruta ordinaria sin reinstalar el observador', async () => {
  await withObserver('archivo_hondo', ({ world, route, ordinaryCalls }) => {
    assert.equal(route(1, 0).length, 4);
    world.map.id = 'archivo_hondo_nucleo';
    assert.deepEqual(route(1, 0), [8, 8]);
    assert.deepEqual(ordinaryCalls, [[1, 0]]);
  });
});
