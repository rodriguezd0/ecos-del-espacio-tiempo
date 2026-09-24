// Catálogo visual de objetos de un tileset: cada componente conexa de tiles no vacíos (como
// tools/stamps_components.mjs) dibujada por separado y rotulada con su rectángulo `src` "x,y wxh".
// Sirve para encontrar rápido edificios y objetos aislados al ampliar la biblioteca de stamps.
// Uso: node tools/stamps_scan.mjs <Imagen> --rows=a-b [--min=2] [--width=30] [--max=12]
//   --max descarta componentes más altos/anchos que N tiles (terrenos continuos).
// Salida: tools/cache/stamps/scan/<Imagen>_rA-B_pN.png
import fs from 'node:fs';
import path from 'node:path';
import { renderMap, savePNG, getTilesetDB } from './lib/tile_render.mjs';
import { drawText, fillRect, textWidth } from './stamps_font.mjs';
import { ROOT, originalTileset, isEmptyTile } from './stamps_lib.mjs';
import { FIRST_REGULAR_TILE } from '../game/src/shared/autotile.js';

const T = 32;
const OUT = path.join(ROOT, 'tools', 'cache', 'stamps', 'scan');

function args(argv) {
  const o = { _: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const [k, v] = a.slice(2).split('=');
    o[k] = v === undefined ? true : v;
  }
  return o;
}

/** Componentes conexas (4 vecinos) de tiles no vacíos en las filas r0..r1. */
function components(png, r0, r1, min = 2) {
  const filled = (x, y) => y >= r0 && y <= r1 && x >= 0 && x < 8 && !isEmptyTile(png, FIRST_REGULAR_TILE + y * 8 + x);
  const seen = new Set();
  const out = [];
  for (let y = r0; y <= r1; y++) {
    for (let x = 0; x < 8; x++) {
      if (seen.has(`${x},${y}`) || !filled(x, y)) continue;
      const stack = [[x, y]];
      seen.add(`${x},${y}`);
      let x0 = x; let x1 = x; let y0 = y; let y1 = y; let n = 0;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        n++;
        x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const k = `${cx + dx},${cy + dy}`;
          if (!seen.has(k) && filled(cx + dx, cy + dy)) { seen.add(k); stack.push([cx + dx, cy + dy]); }
        }
      }
      if (n >= min) out.push({ x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1, n });
    }
  }
  return out.sort((a, b) => a.y - b.y || a.x - b.x);
}

function main() {
  const o = args(process.argv.slice(2));
  const image = o._[0];
  if (!image || !o.rows) throw new Error('Uso: node tools/stamps_scan.mjs <Imagen> --rows=a-b [--min=2] [--max=12]');
  const [r0, r1] = String(o.rows).split('-').map(Number);
  const entry = Object.entries(getTilesetDB().tilesets).find(([, t]) => t.image === image);
  if (!entry) throw new Error(`Ningún tileset usa la imagen ${image}`);
  const png = originalTileset(image);
  const max = Number(o.max || 99);
  const comps = components(png, r0, Number.isFinite(r1) ? r1 : r0, Number(o.min || 2)).filter((c) => c.w <= max && c.h <= max);
  if (!comps.length) throw new Error('Sin componentes en ese rango');
  const pageW = Number(o.width || 30);
  // estanterías
  const items = comps.map((c) => ({ ...c, label: `${c.x},${c.y} ${c.w}x${c.h}`, bw: Math.max(c.w + 1, Math.ceil((textWidth(`${c.x},${c.y} ${c.w}x${c.h}`) + 4) / T)), bh: c.h + 1 }));
  let x = 0; let y = 0; let shelf = 0;
  for (const it of items) {
    if (x + it.bw > pageW && x > 0) { x = 0; y += shelf; shelf = 0; }
    it.px = x; it.py = y; x += it.bw; shelf = Math.max(shelf, it.bh);
  }
  const W = pageW; const H = y + shelf;
  const layers = [new Array(W * H).fill(0), new Array(W * H).fill(0), new Array(W * H).fill(0)];
  for (const it of items) {
    for (let j = 0; j < it.h; j++) {
      for (let i = 0; i < it.w; i++) layers[0][(it.px + i) + (it.py + 1 + j) * W] = FIRST_REGULAR_TILE + (it.y + j) * 8 + it.x + i;
    }
  }
  const out = renderMap({ tilesetId: Number(entry[0]), width: W, height: H, layers, background: [60, 64, 72, 255] });
  for (const it of items) {
    fillRect(out, it.px * T, it.py * T, it.bw * T, 1, [255, 0, 90, 255]);
    drawText(out, it.px * T + 2, it.py * T + 12, it.label, [255, 255, 120, 255], [0, 0, 0, 255]);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${image}_r${r0}-${r1}.png`);
  savePNG(out, file);
  console.log(`${comps.length} componentes → ${file}`);
}

try {
  main();
} catch (err) {
  console.error(`stamps_scan: ${err.message}`);
  process.exit(1);
}
