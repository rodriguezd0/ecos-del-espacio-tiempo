import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PNG } from 'pngjs';
import { renderMap } from '../tools/lib/tile_render.mjs';
import { doorEntry, THREE } from './door_helpers.mjs';

const cases = [
  ['villa_alba', 33, 26], ['ciudad_caudal', 20, 24], ['villa_alba', 10, 25],
  ['villa_zaguan', 26, 25], ['ciudad_caudal', 41, 29], ['ciudad_caudal', 44, 7],
  ['ciudad_caudal', 29, 47], ['ciudad_caudal', 14, 35], ['caudal_canal_alto', 4, 11],
  ['villa_brontia', 30, 8], ['villa_brontia', 4, 30], ['villa_brontia', 37, 32],
  ['ciudad_estrato', 8, 9], ['ciudad_estrato', 44, 9], ['ciudad_lumina', 13, 8],
  ['ciudad_nexo', 8, 12], ['ciudad_nexo', 15, 29], ['aldea_mnemos', 25, 32],
  ['aldea_mnemos', 7, 32], ['aldea_mnemos', 16, 13], ['aldea_mnemos', 40, 23],
  ['aldea_mnemos', 33, 12], ['estacion_talasa', 32, 32], ['paso_del_norte', 21, 14],
  ['monte_candil', 22, 11],
  ['aldea_mnemos', 5, 19], ['villa_boreal', 27, 5],
];

test('el inventario resuelve todos los accesos cerrados en los mapas registrados y por guion', async () => {
  const { doorInventory } = await import('../tools/door_inventory.mjs');
  const inventory = await doorInventory();
  assert.equal(inventory.summary.pending.groups, 0);
  assert.deepEqual(inventory.unresolved, []);
  assert.equal(inventory.resolvedClosedAccesses, inventory.summary['closed-panel'].warps);
  assert.ok(inventory.resolvedClosedAccesses >= 56, 'faltan accesos cerrados del inventario actual');
  assert.ok(inventory.groups.some(g => g.local && g.stamp === 'casa_cupula' && g.image === 'Exterior1'
    && g.doors.every(d => d.resolved)), 'la cúpula local de Boreal no está resuelta');
  assert.ok(inventory.groups.some(g => g.doors.some(d => d.script?.includes('ikerDoorEvent') && d.resolved)));
  assert.ok(inventory.groups.some(g => g.doors.some(d => d.script?.includes('flyWithAurora') && d.resolved)));
});

// Referencia de rasterización: quads/materiales reales, con muestreo nearest del atlas.
// No conoce la división del panel, la bisagra ni el algoritmo de la transición.
function raster(base, group, png, left, top) {
  const out = new PNG({ width: base.width, height: base.height });
  out.data.set(base.data);
  for (const mesh of [...group.children].sort((a, b) => a.renderOrder - b.renderOrder)) {
    if (!mesh.visible) continue;
    const w = mesh.scale.x, h = mesh.scale.y;
    const x = mesh.position.x - w / 2 - left, y = mesh.position.y - h - top;
    const uv = mesh.material.uniforms.uRect.value;
    for (let py = Math.max(0, Math.ceil(y)); py < Math.min(out.height, y + h); py++) {
      for (let px = Math.max(0, Math.ceil(x)); px < Math.min(out.width, x + w); px++) {
        const u = uv.x + (uv.z - uv.x) * ((px + 0.5 - x) / w);
        const v = uv.y + (uv.w - uv.y) * ((py + 0.5 - y) / h);
        const at = (Math.floor(v * png.height) * png.width + Math.floor(u * png.width)) * 4;
        if (png.data[at + 3] === 255) {
          const target = (py * out.width + px) * 4, color = mesh.material.uniforms.uColor.value;
          for (let i = 0; i < 3; i++) out.data[target + i] = Math.round(png.data[at + i] * (1 - color.w) + color.getComponent(i) * 255 * color.w);
          out.data[target + 3] = 255;
        }
        else assert.equal(png.data[at + 3], 0, 'el recorte usa un píxel parcialmente transparente inesperado');
      }
    }
  }
  return out;
}

for (const [id, x, y] of cases) {
  test(id + ': el cerrado es idéntico y todos los cambios quedan dentro del panel', async () => {
    const { entry, png } = await doorEntry(id);
    const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
    const { createDoorPanel } = await import('../game/src/render/doorPanel.js');
    const descriptor = resolveDoorPanel(entry, x, y);
    assert.ok(descriptor);
    const base = renderMap({ tilesetId: entry.def.tileset, width: entry.map.width, height: entry.map.height,
      layers: entry.map.layers, region: { x: x - 2, y: y - 2, w: 5, h: 4 } });
    const parent = new THREE.Group();
    const panel = createDoorPanel(entry, descriptor, parent);
    const left = (x - 2) * 32, top = (y - 2) * 32;
    panel.setProgress(0);
    assert.ok(raster(base, panel.group, png, left, top).data.equals(base.data), 'el fotograma cerrado cambió la fachada');
    for (const p of [0.25, 0.5, 0.75, 1]) {
      panel.setProgress(p);
      const after = raster(base, panel.group, png, left, top);
      let changed = 0;
      const r = descriptor.rect;
      for (let yy = 0; yy < after.height; yy++) for (let xx = 0; xx < after.width; xx++) {
        const at = (yy * after.width + xx) * 4;
        if (!after.data.subarray(at, at + 4).equals(base.data.subarray(at, at + 4))) {
          changed++;
          const gx = xx + left, gy = yy + top;
          assert.ok(gx >= r.x && gx < r.x + r.w && gy >= r.y && gy < r.y + r.h,
            `progreso ${p}: modifica el marco en (${gx},${gy})`);
          if (descriptor.regions) assert.ok(descriptor.regions.some((m) => gx >= r.x + m.x && gx < r.x + m.x + m.w && gy >= r.y + m.y && gy < r.y + m.y + m.h), 'cambia un píxel fuera de la máscara interior');
        }
      }
      assert.ok(changed > 0, 'la puerta sigue cerrada en un estado de apertura');
    }
    panel.setProgress(0);
    assert.ok(raster(base, panel.group, png, left, top).data.equals(base.data));
    panel.dispose(); panel.dispose();
    assert.equal(parent.children.length, 0);
  });
}

test('los paneles no cambian layers y quedan por debajo del jugador delante de la puerta', async () => {
  const { entry } = await doorEntry('villa_alba');
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  const { createDoorPanel } = await import('../game/src/render/doorPanel.js');
  const before = entry.map.layers.map((l) => Array.from(l));
  const parent = new THREE.Group();
  const panel = createDoorPanel(entry, resolveDoorPanel(entry, 33, 26), parent);
  panel.setProgress(0.5);
  const { doorScene } = await import('./door_helpers.mjs');
  const t = await doorScene('villa_alba', 33, 27);
  const playerZ = t.world.player.screenZ(64) + 0.5;
  assert.ok(panel.group.children.every((m) => m.renderOrder < playerZ));
  assert.deepEqual(entry.map.layers.map((l) => Array.from(l)), before);
  panel.dispose();
});

test('coordenadas inválidas, gráficos no descritos y nombres heredados no crean panel', async () => {
  const { entry } = await doorEntry('villa_alba');
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  assert.equal(resolveDoorPanel(entry, NaN, 26), null);
  assert.equal(resolveDoorPanel(entry, 0, 0), null);
  const m = entry.map.markers.find((m) => m.kind === 'door');
  m.stamp = '__proto__';
  assert.equal(resolveDoorPanel(entry, m.x, m.y), null);
});

test('la máscara irregular conserva los píxeles del muro alrededor del tirador', async () => {
  const { entry, png } = await doorEntry('villa_alba');
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  const { createDoorPanel } = await import('../game/src/render/doorPanel.js');
  const descriptor = resolveDoorPanel(entry, 33, 26);
  descriptor.regions = [{ x: 2, y: 0, w: 34, h: 34 }, { x: 0, y: 14, w: 2, h: 8 }];
  const left = 32 * 31, top = 32 * 24;
  const base = renderMap({ tilesetId: entry.def.tileset, width: entry.map.width, height: entry.map.height,
    layers: entry.map.layers, region: { x: 31, y: 24, w: 5, h: 4 } });
  const panel = createDoorPanel(entry, descriptor, new THREE.Group());
  for (const p of [0.25, 0.5, 0.75, 1]) {
    panel.setProgress(p);
    const after = raster(base, panel.group, png, left, top);
    for (let y = 0; y < 34; y++) for (let x = 0; x < 2; x++) {
      if (y >= 14 && y < 22) continue;
      const at = ((descriptor.rect.y - top + y) * base.width + descriptor.rect.x - left + x) * 4;
      assert.ok(after.data.subarray(at, at + 4).equals(base.data.subarray(at, at + 4)), 'la apertura pintó fuera de la madera visible');
    }
  }
  panel.dispose();
});

test('la persiana sube verticalmente dentro del hueco y libera el atlas compartido', async () => {
  const { entry } = await doorEntry('villa_alba');
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  const { createDoorPanel } = await import('../game/src/render/doorPanel.js');
  const descriptor = { ...resolveDoorPanel(entry, 33, 26), mode: 'lift' };
  const panel = createDoorPanel(entry, descriptor, new THREE.Group());
  const original = panel.group.children.slice(1).map((m) => ({ x: m.position.x, y: m.position.y }));
  panel.setProgress(0.5);
  assert.ok(panel.group.children.slice(1).some((m, i) => m.visible && m.position.y < original[i].y), 'la persiana no se levanta');
  assert.ok(panel.group.children.slice(1).every((m, i) => !m.visible || m.position.x === original[i].x));
  let textureDisposals = 0;
  entry.res.atlasTex.addEventListener('dispose', () => textureDisposals++);
  panel.setProgress(Infinity);
  assert.equal(panel.group.userData.progress, 0);
  panel.setProgress(4);
  assert.equal(panel.group.userData.progress, 1);
  panel.dispose(); panel.dispose(); panel.setProgress(0);
  assert.equal(textureDisposals, 0);
});

test('el hueco abierto de la madera oriental queda en sombra', async () => {
  const { entry, png } = await doorEntry('aldea_mnemos');
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  const { createDoorPanel } = await import('../game/src/render/doorPanel.js');
  const descriptor = resolveDoorPanel(entry, 25, 32);
  const base = renderMap({ tilesetId: entry.def.tileset, width: entry.map.width, height: entry.map.height,
    layers: entry.map.layers, region: { x: 23, y: 30, w: 5, h: 4 } });
  const panel = createDoorPanel(entry, descriptor, new THREE.Group());
  panel.setProgress(1);
  const after = raster(base, panel.group, png, 23 * 32, 30 * 32);
  const at = ((descriptor.rect.y - 30 * 32 + 10) * after.width + descriptor.rect.x - 23 * 32 + 10) * 4;
  const luminance = after.data[at] * 0.2126 + after.data[at + 1] * 0.7152 + after.data[at + 2] * 0.0722;
  assert.ok(luminance < 80, 'el hueco conserva el brillo de la madera cerrada');
  panel.dispose();
});

test('los vanos locales del Museo, Talasa y Grandes Almacenes conservan su diseño abierto', async () => {
  const { resolveDoorPanel } = await import('../game/src/world/doorAnimation.js');
  for (const [id, x, y] of [['ciudad_lumina', 36, 22], ['estacion_talasa', 29, 22], ['ciudad_caudal', 57, 42]]) {
    const { entry } = await doorEntry(id);
    assert.ok(entry.map.markers.some(m => m.kind === 'door' && m.x === x && m.y === y));
    const before = entry.map.layers.map(l => Array.from(l));
    assert.equal(resolveDoorPanel(entry, x, y), null);
    assert.deepEqual(entry.map.layers.map(l => Array.from(l)), before);
  }
});
