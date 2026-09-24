// Recursos GPU de un tileset: atlas de tiles normales (game/assets/tilesets, 64 columnas) y un atlas
// de autotiles generado en tiempo de carga con los 48 patrones × N fotogramas de cada slot.
// También calcula qué tiles están vacíos (para que los stamps no copien tiles transparentes).
import { engine } from '../core/engine.js';
import { rawTexture, makeCanvas } from './textures.js';
import { autotileSourceRects, autotileFrameCount, TILE } from '../shared/autotile.js';
import { computeEmptyTiles, emptinessChecker } from '../world/tileEmptiness.js';

export const AUTO_ATLAS_W = 2048;
const cache = new Map();

/** Recursos de tileset (cacheados por id). */
export function loadTilesetResources(tilesetId) {
  if (!cache.has(tilesetId)) {
    const p = build(tilesetId);
    p.catch(() => cache.delete(tilesetId));
    cache.set(tilesetId, p);
  }
  return cache.get(tilesetId);
}

async function build(tilesetId) {
  const db = engine.data?.tilesets;
  const tileset = db?.tilesets?.[tilesetId];
  if (!tileset) throw new Error(`Tileset ${tilesetId} no existe en data/tilesets.json`);
  const atlasImg = await engine.assets.image(`assets/tilesets/${tileset.image}.png`);
  const atlasTex = rawTexture(atlasImg);
  const emptyFlags = computeEmptyFromImage(atlasImg, tileset.tileCount);
  const auto = await buildAutotileAtlas(tileset);
  return {
    id: tilesetId,
    tileset,
    atlasTex,
    atlasSize: [atlasImg.width, atlasImg.height],
    autoTex: auto.texture,
    autoSize: [auto.width, auto.height],
    slots: auto.slots,
    emptyFlags,
    isEmpty: emptinessChecker(emptyFlags),
  };
}

function computeEmptyFromImage(img, tileCount) {
  const { g } = makeCanvas(img.width, img.height);
  g.drawImage(img, 0, 0);
  const data = g.getImageData(0, 0, img.width, img.height).data;
  return computeEmptyTiles(data, img.width, tileCount);
}

/**
 * Atlas de autotiles: por slot, bloques de fotograma (256×192 con 8×6 patrones, o 32×32 si el
 * autotile es de un solo tile), varios fotogramas por fila de 2048 px.
 */
async function buildAutotileAtlas(tileset) {
  const slots = [];
  const images = await Promise.all(tileset.autotiles.map((name) => (name
    ? engine.assets.tryImage(`assets/autotiles/${name}.png`)
    : Promise.resolve(null))));
  let y = 0;
  images.forEach((img, s) => {
    if (!img) { slots.push(null); return; }
    const tall = img.height > TILE;
    const frames = autotileFrameCount(img.width, img.height);
    const blockW = tall ? 8 * TILE : TILE;
    const blockH = tall ? 6 * TILE : TILE;
    const perRow = Math.floor(AUTO_ATLAS_W / blockW);
    const rows = Math.ceil(frames / perRow);
    slots.push({ name: tileset.autotiles[s], img, tall, frames, blockW, blockH, perRow, y });
    y += rows * blockH;
  });
  const height = Math.max(TILE, y);
  const { canvas, g } = makeCanvas(AUTO_ATLAS_W, height);
  slots.forEach((slot, s) => {
    if (!slot) return;
    for (let f = 0; f < slot.frames; f++) {
      const fx = (f % slot.perRow) * slot.blockW;
      const fy = slot.y + Math.floor(f / slot.perRow) * slot.blockH;
      const patterns = slot.tall ? 48 : 1;
      for (let p = 0; p < patterns; p++) {
        const id = 48 * (s + 1) + p;
        const rects = autotileSourceRects(id, f, slot.img.height);
        const cx = fx + (p % 8) * TILE;
        const cy = fy + Math.floor(p / 8) * TILE;
        if (rects.length === 1) {
          const r = rects[0];
          g.drawImage(slot.img, r.x, r.y, r.w, r.h, cx, cy, TILE, TILE);
        } else {
          rects.forEach((r, q) => g.drawImage(slot.img, r.x, r.y, 16, 16, cx + (q % 2) * 16, cy + Math.floor(q / 2) * 16, 16, 16));
        }
      }
    }
  });
  for (const slot of slots) if (slot) delete slot.img;
  return { texture: rawTexture(canvas), width: AUTO_ATLAS_W, height, slots };
}

/** UV base (píxeles del atlas de autotiles, fotograma 0) y animación de un ID de autotile. */
export function autotileUV(res, id) {
  const s = Math.floor(id / 48) - 1;
  const slot = res.slots[s];
  if (!slot) return null;
  const p = id % 48;
  return {
    x: slot.tall ? (p % 8) * TILE : 0,
    y: slot.y + (slot.tall ? Math.floor(p / 8) * TILE : 0),
    anim: [slot.frames, slot.blockW, slot.blockH, slot.perRow],
    name: slot.name,
  };
}
