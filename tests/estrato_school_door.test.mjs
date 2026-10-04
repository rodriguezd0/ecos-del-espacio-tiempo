// El acceso de la Escuela del Pico debe usar el arco visible, no la ventana con hiedra.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { buildMapNode } from '../tools/lib/map_node.mjs';
import { drawTile } from '../tools/lib/tile_render.mjs';
import { GameState } from '../game/src/core/state.js';
import { World } from '../game/src/world/world.js';

const city = await buildMapNode('ciudad_estrato');
const school = await buildMapNode('estrato_escuela');
const entrance = city.def.warps.find(w => w.to === 'estrato_escuela');

function darkOpening(x) {
  const png = new PNG({ width: 32, height: 32 });
  drawTile(png, city.tileset, city.entry.map.data(x, 8, 2), 0, 0);
  let count = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    if (png.data[i] < 50 && png.data[i + 1] < 50 && png.data[i + 2] < 50 && png.data[i + 3] === 255) count++;
  }
  return count;
}

test('Estrato: el disparador de la escuela está sobre el arco negro de la fachada real', () => {
  assert.equal(darkOpening(37), 0, 'la antigua casilla es una ventana con hiedra');
  assert.ok(darkOpening(39) >= 100, 'el atlas actual conserva el arco dibujado');
  assert.deepEqual([entrance.x, entrance.y], [39, 8]);
  assert.ok(darkOpening(entrance.x) >= 100, 'la puerta usa la abertura de la imagen');
  assert.deepEqual([entrance.tx, entrance.ty, entrance.dir], [8, 12, 8]);
});

test('Estrato: el marcador del stamp coincide con la entrada visible', () => {
  const marker = city.entry.map.markers.find(m => m.kind === 'door' && m.stamp === 'mansion_ladrillo');
  assert.deepEqual([marker.x, marker.y], [39, 8]);
  assert.deepEqual([marker.x, marker.y], [entrance.x, entrance.y]);
});

test('Estrato: los tres felpudos de la escuela regresan delante del arco y permiten salir a la calle', () => {
  assert.equal(school.def.warps.length, 3);
  const world = new World({ state: GameState.create() });
  world.setCurrent(city.entry);
  for (const warp of school.def.warps) {
    assert.deepEqual([warp.to, warp.tx, warp.ty, warp.dir], ['ciudad_estrato', 39, 9, 2]);
    world.player.x = warp.tx;
    world.player.y = warp.ty;
    assert.ok(world.player.passable(warp.tx, warp.ty, 2), 'se puede continuar hacia la calle');
  }
});

test('Estrato: la ventana conserva sus píxeles y deja de ser una entrada invisible', () => {
  const png = new PNG({ width: 32, height: 32 });
  drawTile(png, city.tileset, city.entry.map.data(37, 8, 2), 0, 0);
  assert.deepEqual(Array.from(png.data.subarray((16 + 16 * 32) * 4, (16 + 16 * 32) * 4 + 4)), [78, 121, 31, 255]);
  assert.equal(city.def.warps.some(w => w.x === 37 && w.y === 8), false);
});
