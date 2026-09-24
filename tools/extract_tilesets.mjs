// Extrae tilesets de Añil: Data/Tilesets.rxdata → game/data/tilesets.json
// y reempaqueta cada imagen de 256px de ancho (muy alta) en un atlas de 2048px
// de ancho (64 columnas) apto para cualquier GPU. Copia también los autotiles.
// Uso: node tools/extract_tilesets.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { loadMarshal } from './lib/marshal.mjs';
import { ATLAS_COLUMNS, TILE } from '../game/src/shared/autotile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ANIL = path.join(ROOT, 'Pokemon Anil V4.13');
const OUT_DATA = path.join(ROOT, 'game', 'data');
const OUT_TS = path.join(ROOT, 'game', 'assets', 'tilesets');
const OUT_AT = path.join(ROOT, 'game', 'assets', 'autotiles');
fs.mkdirSync(OUT_TS, { recursive: true });
fs.mkdirSync(OUT_AT, { recursive: true });

const tilesets = loadMarshal(fs.readFileSync(path.join(ANIL, 'Data', 'Tilesets.rxdata')));
const imageInfo = {};

function repack(imageName) {
  if (imageInfo[imageName]) return imageInfo[imageName];
  const src = PNG.sync.read(fs.readFileSync(path.join(ANIL, 'Graphics', 'Tilesets', `${imageName}.png`)));
  const srcCols = Math.floor(src.width / TILE);
  const srcRows = Math.ceil(src.height / TILE);
  const count = srcCols * srcRows;
  const rows = Math.ceil(count / ATLAS_COLUMNS);
  const dst = new PNG({ width: ATLAS_COLUMNS * TILE, height: rows * TILE });
  dst.data.fill(0);
  for (let t = 0; t < count; t++) {
    const sx = (t % srcCols) * TILE;
    const sy = Math.floor(t / srcCols) * TILE;
    const dx = (t % ATLAS_COLUMNS) * TILE;
    const dy = Math.floor(t / ATLAS_COLUMNS) * TILE;
    for (let y = 0; y < TILE; y++) {
      if (sy + y >= src.height) break;
      const si = ((sy + y) * src.width + sx) * 4;
      const di = ((dy + y) * dst.width + dx) * 4;
      src.data.copy(dst.data, di, si, si + TILE * 4);
    }
  }
  fs.writeFileSync(path.join(OUT_TS, `${imageName}.png`), PNG.sync.write(dst));
  imageInfo[imageName] = { tileCount: count, atlasWidth: dst.width, atlasHeight: dst.height };
  console.log(`atlas ${imageName}: ${count} tiles → ${dst.width}x${dst.height}`);
  return imageInfo[imageName];
}

const autotileSizes = {};
function copyAutotile(name) {
  if (!name || autotileSizes[name]) return;
  const src = path.join(ANIL, 'Graphics', 'Autotiles', `${name}.png`);
  if (!fs.existsSync(src)) {
    console.warn(`autotile ausente: ${name}`);
    return;
  }
  fs.copyFileSync(src, path.join(OUT_AT, `${name}.png`));
  const png = PNG.sync.read(fs.readFileSync(src));
  autotileSizes[name] = { width: png.width, height: png.height };
}

const out = {};
for (const ts of tilesets) {
  if (!ts || !ts.tileset_name) continue;
  const info = repack(ts.tileset_name);
  ts.autotile_names.forEach(copyAutotile);
  out[ts.id] = {
    id: ts.id,
    name: ts.name,
    image: ts.tileset_name,
    autotiles: ts.autotile_names.map((n) => n || null),
    tileCount: info.tileCount,
    atlasWidth: info.atlasWidth,
    atlasHeight: info.atlasHeight,
    // Indexados por ID de tile (0..383 autotiles, 384+ normales)
    passages: Array.from(ts.passages.data),
    priorities: Array.from(ts.priorities.data),
    terrainTags: Array.from(ts.terrain_tags.data),
  };
}
// Copia todos los autotiles disponibles (algunos no están referenciados por tilesets pero sirven al mapear)
for (const f of fs.readdirSync(path.join(ANIL, 'Graphics', 'Autotiles'))) {
  if (f.toLowerCase().endsWith('.png')) copyAutotile(f.slice(0, -4));
}
fs.writeFileSync(path.join(OUT_DATA, 'tilesets.json'), JSON.stringify({ tilesets: out, autotiles: autotileSizes }));
console.log(`tilesets.json: ${Object.keys(out).length} tilesets, ${Object.keys(autotileSizes).length} autotiles`);
