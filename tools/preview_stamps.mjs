// Hoja de contacto de una biblioteca de stamps: cada stamp sobre el suelo del tileset, con su nombre,
// tamaño y la puerta marcada (recuadro amarillo); después una demo de cada brush.
// Uso: node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=casa] [--brushes|--no-brushes]
//        [--width=28] [--height=34] [--scale=1] [--as=<tileset>]
//   --as dibuja la misma biblioteca con otro tileset (comprobar si sirve para un tileset hermano).
// Salida: tools/cache/stamps/preview/<Imagen>_pN.png (páginas de ~width×height tiles)
import fs from 'node:fs';
import path from 'node:path';
import { renderMap, savePNG } from './lib/tile_render.mjs';
import { drawText, fillRect, textWidth } from './stamps_font.mjs';
import { ROOT, loadStampDef, loadBaked } from './stamps_lib.mjs';
import { buildStampLibrary } from '../game/src/content/stamps/index.js';
import { paintBrush, brushKind, rectCells, brushDemo } from '../game/src/content/stamps/brushes.js';

const T = 32;
const OUT_DIR = path.join(ROOT, 'tools', 'cache', 'stamps', 'preview');

function parseArgs(argv) {
  const o = { _: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) { o._.push(a); continue; }
    const [k, v] = a.slice(2).split('=');
    o[k] = v === undefined ? true : v;
  }
  return o;
}

function buildItems(lib, def, o) {
  const items = [];
  const only = o.only ? new Set(String(o.only).split(',')) : null;
  for (const s of Object.values(lib.stamps)) {
    if (only && !only.has(s.name)) continue;
    if (o.tag && !s.tags.includes(o.tag)) continue;
    items.push({ kind: 'stamp', name: s.name, label: `${s.name} ${s.w}x${s.h}`, w: s.w + 2, h: s.h + 2, stamp: s });
  }
  const showBrushes = o['no-brushes'] ? false : !o.tag || o.brushes;
  if (showBrushes) {
    for (const [name, b] of Object.entries(lib.brushes)) {
      if (only && !only.has(name)) continue;
      const demo = brushDemo(b);
      items.push({ kind: 'brush', name, label: `[${brushKind(b)}] ${name}`, w: demo.w, h: demo.h, brush: b, demo });
    }
  }
  for (const it of items) it.w = Math.max(it.w, Math.ceil((textWidth(it.label) + 6) / T));
  return items;
}

function layout(items, pageW, pageH) {
  const pages = [];
  let page = null; let x = 0; let y = 0; let shelfH = 0;
  const newPage = () => { page = { items: [], w: pageW, h: 0 }; pages.push(page); x = 0; y = 0; shelfH = 0; };
  newPage();
  for (const it of items) {
    if (x + it.w > pageW && x > 0) { x = 0; y += shelfH; shelfH = 0; }
    if (y + it.h > pageH && y > 0) newPage();
    page.items.push({ ...it, px: x, py: y });
    page.w = Math.max(page.w, x + it.w);
    x += it.w; shelfH = Math.max(shelfH, it.h);
    page.h = Math.max(page.h, y + shelfH);
  }
  return pages;
}

function renderPage(lib, def, page, tilesetId = def.tileset) {
  const W = page.w; const H = page.h;
  const layers = [new Array(W * H).fill(0), new Array(W * H).fill(0), new Array(W * H).fill(0)];
  const put = (x, y, l, id) => { if (x >= 0 && y >= 0 && x < W && y < H) layers[l][x + y * W] = id; };
  const groundName = def.preview?.ground;
  if (groundName) for (const w of paintBrush(lib.brush(groundName), rectCells(0, 0, W, H))) put(w.x, w.y, w.layer, w.id);
  for (const it of page.items) {
    if (it.kind === 'stamp') {
      const s = it.stamp;
      s.layers.forEach((g, l) => g && g.forEach((id, i) => { if (id) put(it.px + 1 + (i % s.w), it.py + 1 + Math.floor(i / s.w), l, id); }));
    } else {
      const cells = it.demo.cells.map(([cx, cy]) => [it.px + cx, it.py + cy]);
      const under = def.preview?.under?.[it.name];
      if (under) for (const w of paintBrush(lib.brush(under), cells, { seed: 1 })) put(w.x, w.y, w.layer, w.id);
      for (const w of paintBrush(it.brush, cells, { seed: 1 })) put(w.x, w.y, w.layer, w.id);
    }
  }
  const png = renderMap({ tilesetId, width: W, height: H, layers, background: [40, 40, 48, 255] });
  for (const it of page.items) {
    const x0 = it.px * T; const y0 = it.py * T;
    // marco de la celda
    fillRect(png, x0, y0, it.w * T, 1, [255, 0, 90, 255]);
    fillRect(png, x0, y0, 1, it.h * T, [255, 0, 90, 255]);
    drawText(png, x0 + 3, y0 + 3, it.label, it.kind === 'brush' ? [140, 230, 255, 255] : [255, 255, 255, 255], [0, 0, 0, 255]);
    if (it.kind === 'stamp' && it.stamp.door) {
      const dx = (it.px + 1 + it.stamp.door[0]) * T; const dy = (it.py + 1 + it.stamp.door[1]) * T;
      for (let k = 0; k < 2; k++) {
        fillRect(png, dx + k, dy + k, T - 2 * k, 1, [255, 230, 0, 255]);
        fillRect(png, dx + k, dy + T - 1 - k, T - 2 * k, 1, [255, 230, 0, 255]);
        fillRect(png, dx + k, dy + k, 1, T - 2 * k, [255, 230, 0, 255]);
        fillRect(png, dx + T - 1 - k, dy + k, 1, T - 2 * k, [255, 230, 0, 255]);
      }
    }
  }
  return png;
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const image = o._[0];
  if (!image) throw new Error('Uso: node tools/preview_stamps.mjs <Imagen> [--only=a,b] [--tag=t]');
  const def = await loadStampDef(image);
  const baked = await loadBaked(image);
  const lib = buildStampLibrary(def, baked);
  const items = buildItems(lib, def, o);
  if (!items.length) throw new Error('Ningún stamp/brush coincide con el filtro');
  const pages = layout(items, Number(o.width || 28), Number(o.height || 34));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const as = o.as !== undefined ? Number(o.as) : def.tileset;
  const suffix = `${o.only || o.tag ? `_${String(o.tag || 'sel')}` : ''}${as !== def.tileset ? `_as${as}` : ''}`;
  pages.forEach((page, i) => {
    const out = path.join(OUT_DIR, `${image}${suffix}_p${i + 1}.png`);
    savePNG(renderPage(lib, def, page, as), out, Number(o.scale || 1));
    console.log(`→ ${out} (${page.items.map((it) => it.name).join(', ')})`);
  });
}

main().catch((err) => {
  console.error(`preview_stamps: ${err.message}`);
  process.exit(1);
});
