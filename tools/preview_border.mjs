// Vista previa del exterior de un mapa tal como lo enseña la cámara (world/seams.js + world/borderFill.js): el mapa, sus
// vecinos conectados y el relleno de borde de todas las casillas que la cámara puede mostrar.
// Uso: node tools/preview_border.mjs <id> [--no-neighbors] [--scale=0.5] [--outline] [--out=archivo.png]
//   --outline  marca en rojo el contorno de cada mapa (lo de fuera es relleno)
// Salida por defecto: tools/cache/previews/<id>_borde.png
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import { buildMapNode, loadLibrary } from './lib/map_node.mjs';
import { drawTile, getTilesetDB, savePNG } from './lib/tile_render.mjs';
import { planSeams, cameraReach, seamTileId } from '../game/src/world/seams.js';
import { buildBorderPattern, borderMode } from '../game/src/world/borderFill.js';
import { connectionOffset } from '../game/src/world/mapLoader.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id) {
  console.error('Uso: node tools/preview_border.mjs <id> [--no-neighbors] [--scale=N] [--outline] [--out=archivo.png]');
  process.exit(1);
}
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.split('=')[1] : d; };
const TILE = 32;

async function loadEntry(mapId) {
  const { def, entry } = await buildMapNode(mapId);
  if (borderMode(def) === 'pattern') entry.borderPattern = buildBorderPattern(def, await loadLibrary(def.tileset));
  return entry;
}

const current = await loadEntry(id);
const entries = [current];
if (!flag('no-neighbors')) {
  for (const conn of current.def.connections || []) {
    try {
      const other = await loadEntry(conn.to);
      other.offset = connectionOffset(conn, current.def, other.def);
      entries.push(other);
    } catch (err) {
      console.warn(`(vecino ${conn.to} no disponible: ${err.message})`);
    }
  }
}

const reach = cameraReach(current.map.width, current.map.height);
const W = reach.x1 - reach.x0;
const H = reach.y1 - reach.y0;
const png = new PNG({ width: W * TILE, height: H * TILE });
for (let i = 0; i < png.data.length; i += 4) png.data.set([0, 0, 0, 255], i);
const db = getTilesetDB();
const px = (x) => (x - reach.x0) * TILE;
const py = (y) => (y - reach.y0) * TILE;
const inView = (x, y) => x >= reach.x0 && y >= reach.y0 && x < reach.x1 && y < reach.y1;

const plan = planSeams(entries);
for (const e of entries) {
  const tileset = db.tilesets[e.def.tileset];
  for (let l = 0; l < 3; l++) {
    for (const c of plan.get(e.id) || []) drawTile(png, tileset, seamTileId(e.map, c, l), px(c.x + e.offset.x), py(c.y + e.offset.y));
    for (let y = 0; y < e.map.height; y++) {
      for (let x = 0; x < e.map.width; x++) {
        const gx = x + e.offset.x; const gy = y + e.offset.y;
        if (inView(gx, gy)) drawTile(png, tileset, e.map.data(x, y, l), px(gx), py(gy));
      }
    }
  }
}

if (flag('outline')) {
  const mark = (x, y) => { if (x >= 0 && y >= 0 && x < png.width && y < png.height) png.data.set([255, 40, 40, 255], (y * png.width + x) * 4); };
  for (const e of entries) {
    const x0 = px(e.offset.x); const y0 = py(e.offset.y);
    const x1 = x0 + e.map.width * TILE - 1; const y1 = y0 + e.map.height * TILE - 1;
    for (let x = x0; x <= x1; x++) { mark(x, y0); mark(x, y1); }
    for (let y = y0; y <= y1; y++) { mark(x0, y); mark(x1, y); }
  }
}

const out = opt('out', path.join(ROOT, 'tools', 'cache', 'previews', `${id}_borde.png`));
savePNG(png, out, Number(opt('scale', '0.5')));
const cells = [...plan.values()].reduce((n, l) => n + l.length, 0);
console.log(`${current.def.name || id} (${current.map.width}x${current.map.height}, borde ${borderMode(current.def)}): ${cells} casillas de relleno → ${out}`);
