// Renderizador de mapas en Node (sin navegador) para previsualizar y validar mapas.
// Compone capas de tiles RMXP usando los atlas reempaquetados de game/assets/tilesets
// y los autotiles de game/assets/autotiles. Soporta superponer sprites de personajes y rejilla.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';
import {
  TILE, FIRST_REGULAR_TILE, isAutotile, autotileSlot, autotileSourceRects, regularTileAtlasPos,
} from '../../game/src/shared/autotile.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const GAME = path.join(ROOT, 'game');
const cache = new Map();

export function loadPNG(file) {
  if (!cache.has(file)) cache.set(file, PNG.sync.read(fs.readFileSync(file)));
  return cache.get(file);
}

let tilesetDB = null;
export function getTilesetDB() {
  if (!tilesetDB) tilesetDB = JSON.parse(fs.readFileSync(path.join(GAME, 'data', 'tilesets.json'), 'utf8'));
  return tilesetDB;
}

/** Copia con mezcla alfa un rectángulo de src sobre dst. */
export function blit(dst, src, sx, sy, sw, sh, dx, dy) {
  for (let y = 0; y < sh; y++) {
    const ty = dy + y;
    if (ty < 0 || ty >= dst.height || sy + y < 0 || sy + y >= src.height) continue;
    for (let x = 0; x < sw; x++) {
      const tx = dx + x;
      if (tx < 0 || tx >= dst.width || sx + x < 0 || sx + x >= src.width) continue;
      const si = ((sy + y) * src.width + (sx + x)) * 4;
      const a = src.data[si + 3];
      if (a === 0) continue;
      const di = (ty * dst.width + tx) * 4;
      if (a === 255) {
        dst.data[di] = src.data[si]; dst.data[di + 1] = src.data[si + 1]; dst.data[di + 2] = src.data[si + 2]; dst.data[di + 3] = 255;
      } else {
        const k = a / 255;
        dst.data[di] = Math.round(src.data[si] * k + dst.data[di] * (1 - k));
        dst.data[di + 1] = Math.round(src.data[si + 1] * k + dst.data[di + 1] * (1 - k));
        dst.data[di + 2] = Math.round(src.data[si + 2] * k + dst.data[di + 2] * (1 - k));
        dst.data[di + 3] = Math.max(dst.data[di + 3], a);
      }
    }
  }
}

export function drawTile(dst, tileset, id, px, py) {
  if (!id) return;
  if (id >= FIRST_REGULAR_TILE) {
    const atlas = loadPNG(path.join(GAME, 'assets', 'tilesets', `${tileset.image}.png`));
    const p = regularTileAtlasPos(id);
    blit(dst, atlas, p.x, p.y, TILE, TILE, px, py);
    return;
  }
  if (!isAutotile(id)) return;
  const name = tileset.autotiles[autotileSlot(id)];
  if (!name) return;
  const file = path.join(GAME, 'assets', 'autotiles', `${name}.png`);
  if (!fs.existsSync(file)) return;
  const img = loadPNG(file);
  const rects = autotileSourceRects(id, 0, img.height);
  if (rects.length === 1) {
    blit(dst, img, rects[0].x, rects[0].y, 32, 32, px, py);
    return;
  }
  rects.forEach((r, i) => blit(dst, img, r.x, r.y, 16, 16, px + (i % 2) * 16, py + Math.floor(i / 2) * 16));
}

/**
 * Renderiza un mapa a PNG.
 * @param {object} opts
 *   tilesetId, width, height, layers: number[][] (cada capa width*height, índice x + y*width)
 *   sprites?: [{ file, x, y, frameW, frameH, fx, fy }]  (x,y en tiles; se ancla abajo-centro)
 *   grid?: boolean, region?: {x,y,w,h} en tiles
 */
export function renderMap({ tilesetId, width, height, layers, sprites = [], grid = false, region = null, background = [0, 0, 0, 255] }) {
  const tileset = getTilesetDB().tilesets[tilesetId];
  if (!tileset) throw new Error(`Tileset ${tilesetId} inexistente`);
  const rg = region || { x: 0, y: 0, w: width, h: height };
  const png = new PNG({ width: rg.w * TILE, height: rg.h * TILE });
  for (let i = 0; i < png.data.length; i += 4) png.data.set(background, i);
  for (const layer of layers) {
    for (let y = rg.y; y < rg.y + rg.h; y++) {
      for (let x = rg.x; x < rg.x + rg.w; x++) {
        drawTile(png, tileset, layer[x + y * width], (x - rg.x) * TILE, (y - rg.y) * TILE);
      }
    }
  }
  for (const s of sprites) {
    const img = loadPNG(s.file);
    const fw = s.frameW || img.width / 4;
    const fh = s.frameH || img.height / 4;
    const px = Math.round((s.x - rg.x) * TILE + TILE / 2 - fw / 2);
    const py = Math.round((s.y - rg.y) * TILE + TILE - fh);
    blit(png, img, (s.fx || 0) * fw, (s.fy || 0) * fh, fw, fh, px, py);
  }
  if (grid) {
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        if (x % TILE === 0 || y % TILE === 0) {
          const i = (y * png.width + x) * 4;
          png.data[i] = (png.data[i] + 255) >> 1; png.data[i + 1] >>= 1; png.data[i + 2] >>= 1;
        }
      }
    }
  }
  return png;
}

export function savePNG(png, file, scale = 1) {
  let out = png;
  if (scale !== 1) {
    out = new PNG({ width: Math.round(png.width * scale), height: Math.round(png.height * scale) });
    for (let y = 0; y < out.height; y++) {
      for (let x = 0; x < out.width; x++) {
        const si = (Math.floor(y / scale) * png.width + Math.floor(x / scale)) * 4;
        const di = (y * out.width + x) * 4;
        png.data.copy(out.data, di, si, si + 4);
      }
    }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(out));
}
