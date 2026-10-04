import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { db } from './battle_helpers.mjs';
import * as layout from '../game/src/battle/scene/layout.js';

function image(species) {
  const png = PNG.sync.read(fs.readFileSync(`Pokemon Anil V4.13/Graphics/Pokemon/Back/${species}.png`));
  const { fw } = layout.stripFrames(png.width, png.height);
  let left = fw, top = png.height, right = 0, bottom = 0;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (png.data[(y * png.width + x) * 4 + 3] <= 8) continue;
    left = Math.min(left, x % fw); right = Math.max(right, x % fw + 1); top = Math.min(top, y); bottom = Math.max(bottom, y + 1);
  }
  return { fw, fh: png.height, bounds: { left, top, right, bottom } };
}
function pose(species, index, sideSize) {
  const img = image(species), metrics = layout.speciesMetrics(db, species);
  const p = layout.battlerRenderLayout(index, sideSize, metrics, img.fw, img.fh, img.bounds);
  return { ...p, metrics, img, body: { left: p.x + (img.bounds.left - img.fw / 2) * p.scale,
    right: p.x + (img.bounds.right - img.fw / 2) * p.scale, top: p.y - (img.fh - img.bounds.top) * p.scale,
    bottom: p.y - (img.fh - img.bounds.bottom) * p.scale } };
}

test('dobles/coop: contornos animados propios no se solapan ni entran en los paneles de PS o mensajes', () => {
  for (const [a, b] of [['CHARMELEON', 'CHARMELEON'], ['LITTEN', 'TURTWIG'], ['WAILORD', 'ONIX'], ['GROUDON', 'RAYQUAZA'], ['SNORLAX', 'CHARIZARD']]) {
    const p = pose(a, 0, 2), q = pose(b, 2, 2);
    assert.ok(p.body.right + 8 <= q.body.left, `${a}/${b}: cuerpos ${JSON.stringify([p.body, q.body])}`);
    for (const s of [p, q]) {
      assert.ok(s.body.left >= 0 && s.body.right < 256, 'fuera de los paneles propios');
      assert.ok(s.body.bottom <= layout.MESSAGE_Y, 'sobre la barra de mensajes');
      assert.ok(s.body.top >= 120, 'la espalda no invade las cajas rivales');
      assert.ok(s.scale > 0 && s.scale <= layout.spriteScale(s === p ? 0 : 2, s.metrics));
    }
  }
});

test('individual: escala y anclaje reales de las especies siguen la métrica de Añil', () => {
  for (const sp of ['CHARMELEON', 'LITTEN', 'WAILORD']) {
    const p = pose(sp, 0, 1), base = layout.battlerPosition(0), off = layout.spriteOffset(p.metrics, 0);
    assert.equal(p.scale, layout.spriteScale(0, p.metrics)); assert.equal(p.x, base.x + off.dx); assert.equal(p.y, base.y + off.dy);
  }
});

test('contorno: reúne todos los frames y descarta píxeles transparentes', () => {
  const data = new Uint8ClampedArray(8 * 3 * 4);
  data[(1 * 8 + 1) * 4 + 3] = 255;
  data[(2 * 8 + 7) * 4 + 3] = 100;
  data[3] = 8;
  assert.deepEqual(layout.spriteOpaqueBounds(data, 8, 3, 4), { left: 1, top: 1, right: 4, bottom: 3 });
  assert.deepEqual(layout.spriteOpaqueBounds(new Uint8ClampedArray(2 * 3 * 4), 2, 3), { left: 0, top: 0, right: 2, bottom: 3 });
});

test('sombras: mantienen las métricas en individual y se ajustan con la espalda en dobles', () => {
  const metrics = { back: [3, 6, 2], front: [-2, 5, 1.5], altitude: 3, shadow: [2, 4, -1], shadowSize: 2 };
  for (const index of [0, 1, 2, 3]) for (const size of [1, 2, 3]) {
    const p = layout.battlerRenderLayout(index, size, metrics, 96, 96, { left: 10, top: 2, right: 92, bottom: 96 });
    const normal = layout.spriteScale(index, metrics), original = layout.shadowPlacement(metrics, index, 96 * normal);
    const off = layout.spriteOffset(metrics, index), base = layout.battlerPosition(index, size);
    if (size === 2 && !(index & 1)) {
      assert.equal(p.shadow.dx, (original.dx - off.dx) * p.scale / normal);
      assert.equal(p.shadow.dy, (original.dy - off.dy) * p.scale / normal);
    } else {
      assert.equal(p.x + p.shadow.dx, base.x + original.dx);
      assert.equal(p.y + p.shadow.dy, base.y + original.dy);
    }
    assert.equal(p.shadow.zoomX, original.zoomX); assert.equal(p.shadow.zoomY, original.zoomY);
  }
  assert.equal(layout.battlerRenderLayout(0, 2, { shadowSize: 0 }, 96, 96).shadow.visible, false);
});
