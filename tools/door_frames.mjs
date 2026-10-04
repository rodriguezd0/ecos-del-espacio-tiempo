// Evidencia del recorte: rasteriza los quads reales del panel, sin cambiar gráficos.
import fs from 'node:fs';
import { PNG } from 'pngjs';
import { doorEntry, THREE } from '../tests/door_helpers.mjs';
import { resolveDoorPanel } from '../game/src/world/doorAnimation.js';
import { createDoorPanel } from '../game/src/render/doorPanel.js';
import { renderMap, blit } from './lib/tile_render.mjs';

const inventory = JSON.parse(fs.readFileSync('tools/cache/door_inventory.json', 'utf8'));
const groups = inventory.groups.filter((g) => g.classification === 'closed-panel');
const columns = 4, cellW = 160, cellH = 128;

function draw(base, panel, png, left, top) {
  const out = new PNG({ width: base.width, height: base.height });
  out.data.set(base.data);
  for (const m of [...panel.group.children].sort((a, b) => a.renderOrder - b.renderOrder)) {
    if (!m.visible) continue;
    const w = m.scale.x, h = m.scale.y, x = m.position.x - w / 2 - left, y = m.position.y - h - top;
    const r = m.material.uniforms.uRect.value;
    for (let yy = Math.max(0, Math.ceil(y)); yy < Math.min(out.height, y + h); yy++) {
      for (let xx = Math.max(0, Math.ceil(x)); xx < Math.min(out.width, x + w); xx++) {
        const sx = Math.floor((r.x + (r.z - r.x) * (xx + 0.5 - x) / w) * png.width);
        const sy = Math.floor((r.y + (r.w - r.y) * (yy + 0.5 - y) / h) * png.height);
        const at = (sy * png.width + sx) * 4;
        if (png.data[at + 3] !== 255) throw new Error('La máscara incluye transparencia: ' + panel.group.userData.stamp);
        const target = (yy * out.width + xx) * 4, color = m.material.uniforms.uColor.value;
        for (let channel = 0; channel < 3; channel++) out.data[target + channel] = Math.round(png.data[at + channel] * (1 - color.w) + color.getComponent(channel) * 255 * color.w);
        out.data[target + 3] = 255;
      }
    }
  }
  return out;
}

const pages = [];
for (let start = 0; start < groups.length; start += 6) {
  const sheet = new PNG({ width: cellW * columns, height: cellH * Math.min(6, groups.length - start) });
  const rows = [];
  for (const [row, g] of groups.slice(start, start + 6).entries()) {
    const a = g.doors[0], { entry, png } = await doorEntry(a.map), descriptor = resolveDoorPanel(entry, a.x, a.y);
    if (!descriptor) throw new Error('Máscara no resuelta: ' + g.stamp);
    const base = renderMap({ tilesetId: entry.def.tileset, width: entry.map.width, height: entry.map.height,
      layers: entry.map.layers, region: { x: a.x - 2, y: a.y - 2, w: 5, h: 4 } });
    const panel = createDoorPanel(entry, descriptor, new THREE.Group());
    for (const [col, p] of [0, 1 / 3, 2 / 3, 1].entries()) {
      panel.setProgress(p);
      const frame = draw(base, panel, png, (a.x - 2) * 32, (a.y - 2) * 32);
      if (p === 0 && !frame.data.equals(base.data)) throw new Error('Cerrado distinto: ' + g.stamp);
      blit(sheet, frame, 0, 0, cellW, cellH, col * cellW, row * cellH);
    }
    rows.push({ inventoryGroup: inventory.groups.indexOf(g) + 1, stamp: g.stamp, image: g.image, map: a.map, rect: descriptor.rect, shade: descriptor.shade });
    panel.dispose();
  }
  const file = 'tools/cache/door_frames_' + (pages.length + 1) + '.png';
  fs.writeFileSync(file, PNG.sync.write(sheet));
  pages.push({ file, rows });
}
fs.writeFileSync('tools/cache/door_frames.json', JSON.stringify({ phases: [0, 1 / 3, 2 / 3, 1], pages }, null, 2) + '\n');
console.log(JSON.stringify({ variants: groups.length, pages: pages.length, summary: inventory.summary }));
