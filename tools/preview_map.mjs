// Previsualiza un mapa de Axis construido con el MapBuilder → PNG.
// Uso: node tools/preview_map.mjs <id> [--grid] [--scale=0.5] [--pass] [--no-events] [--no-library] [--out=archivo.png]
//   --pass  superpone la pasabilidad (rojo = bloqueado, azul = agua, amarillo = saliente, verde = hierba)
// Salida por defecto: tools/cache/previews/<id>.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMap, savePNG } from './lib/tile_render.mjs';
import { buildMapNode } from './lib/map_node.mjs';
import { expandEventDef } from '../game/src/world/eventTypes.js';
import { normalizeEventDef } from '../game/src/world/mapEvent.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id) {
  console.error('Uso: node tools/preview_map.mjs <id> [--grid] [--scale=N] [--pass] [--no-events]');
  process.exit(1);
}
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };

const CHAR_DIR = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Characters');
function spriteFile(name) {
  if (!name) return null;
  if (name.startsWith('follower:')) {
    const [, species, form, shiny] = name.split(':');
    const dir = shiny === '1' ? 'Followers shiny' : 'Followers';
    const f = path.join(CHAR_DIR, dir, `${species}${form && form !== '0' ? `_${form}` : ''}.png`);
    return fs.existsSync(f) ? f : null;
  }
  const clean = name.replace(/^anil:/, '');
  const candidates = [path.join(CHAR_DIR, `${clean}.png`), path.join(ROOT, 'game', 'assets', 'characters', `${clean}.png`)];
  return candidates.find((f) => fs.existsSync(f)) || null;
}

const { def, built, entry, warnings } = await buildMapNode(id, { useLibrary: !flag('no-library') });
const sprites = [];
if (!flag('no-events')) {
  (def.events || []).forEach((raw, i) => {
    const ev = normalizeEventDef(expandEventDef(raw, def), i);
    const page = ev.pages[0];
    const file = spriteFile(page.sprite);
    if (file) sprites.push({ file, x: ev.x, y: ev.y, fy: ({ 2: 0, 4: 1, 6: 2, 8: 3 })[page.dir || 2] || 0 });
  });
}
const png = renderMap({ tilesetId: def.tileset, width: built.width, height: built.height, layers: built.layers, sprites, grid: flag('grid') });

function tint(x, y, [r, g, b], a = 0.35) {
  for (let py = y * 32; py < y * 32 + 32; py++) {
    for (let px = x * 32; px < x * 32 + 32; px++) {
      const i = (py * png.width + px) * 4;
      png.data[i] = png.data[i] * (1 - a) + r * a;
      png.data[i + 1] = png.data[i + 1] * (1 - a) + g * a;
      png.data[i + 2] = png.data[i + 2] * (1 - a) + b * a;
    }
  }
}
if (flag('pass')) {
  const map = entry.map;
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const t = map.terrainTagAt(x, y);
      if (t.ledge) tint(x, y, [255, 220, 0]);
      else if (t.canSurf) tint(x, y, [0, 90, 255]);
      else if (!map.passableStrict(x, y)) tint(x, y, [255, 0, 0]);
      else if (t.landWildEncounters) tint(x, y, [0, 255, 60], 0.25);
    }
  }
}
for (const w of def.warps || []) tint(w.x, w.y, [255, 0, 255], 0.5);

const out = opt('out', path.join(ROOT, 'tools', 'cache', 'previews', `${id}.png`));
savePNG(png, out, Number(opt('scale', 1)));
console.log(`${def.name} (${built.width}x${built.height}, tileset ${def.tileset}) → ${out}`);
if (warnings.length) console.log(`Avisos (${warnings.length}):\n  ${warnings.join('\n  ')}`);
