// Previsualiza un mapa de Añil (referencia) a PNG.
// Uso: node tools/preview_anil_map.mjs <id> [salida.png] [--grid] [--scale=0.5]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMap, savePNG } from './lib/tile_render.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const id = Number(args[0]);
const outFile = args.find((a, i) => i > 0 && !a.startsWith('--')) || path.join(ROOT, 'tools', 'cache', 'previews', `anil_${id}.png`);
const grid = args.includes('--grid');
const scaleArg = args.find((a) => a.startsWith('--scale='));
const scale = scaleArg ? Number(scaleArg.split('=')[1]) : 1;

const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'cache', 'anil_maps', `${String(id).padStart(3, '0')}.json`), 'utf8'));
const charDir = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Characters');
const sprites = map.events
  .filter((e) => e.graphic && fs.existsSync(path.join(charDir, `${e.graphic}.png`)))
  .map((e) => ({ file: path.join(charDir, `${e.graphic}.png`), x: e.x, y: e.y, fy: ({ 2: 0, 4: 1, 6: 2, 8: 3 })[e.direction] || 0 }));
const png = renderMap({ tilesetId: map.tileset, width: map.width, height: map.height, layers: map.layers, sprites, grid });
savePNG(png, outFile, scale);
console.log(`${map.name} (${map.width}x${map.height}, tileset ${map.tileset}) → ${outFile}`);
