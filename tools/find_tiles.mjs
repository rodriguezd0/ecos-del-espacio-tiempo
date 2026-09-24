// Hojas de contacto para localizar tiles y recortes (biblioteca de stamps).
//
// Uso:
//   node tools/find_tiles.mjs <imagen> [--rows=a-b] [--per=16] [--panels=3] [--scale=1] [--out=f.png]
//       Hoja del tileset ORIGINAL (8 columnas) con rejilla, nº de fila a la izquierda (y el ID RMXP del
//       tile de la columna 0 debajo) y columnas 0..7 arriba. Sin --rows genera todas las hojas en
//       tools/cache/stamps/tiles/<imagen>_<n>.png (per×panels filas por hoja).
//   node tools/find_tiles.mjs --map=<id> [--region=x,y,w,h] [--layers=0,1,2] [--as=<tileset>] [--scale=1] [--out=f.png]
//       Recorte de un mapa de Añil (tools/cache/anil_maps) con rejilla y coordenadas de casilla.
//       --as dibuja los mismos IDs con otro tileset (para comprobar si un recorte sirve en él).
//   node tools/find_tiles.mjs --usage=<tileId> [--tileset=<id>]
//       Lista mapas/posiciones/capas donde aparece un tile (para encontrar composiciones reales).
//   node tools/find_tiles.mjs --dump=<mapId> --region=x,y,w,h [--layers=0,1,2]
//       Imprime los IDs de las capas del recorte (para depurar stamps).
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { loadPNG, blit, renderMap, savePNG, getTilesetDB } from './lib/tile_render.mjs';
import { drawText, fillRect } from './stamps_font.mjs';
import { ROOT, TILESET_DIR, MAPS_DIR, T, loadAnilMap } from './stamps_lib.mjs';

const OUT_DIR = path.join(ROOT, 'tools', 'cache', 'stamps');
const MARGIN_L = 34;
const MARGIN_T = 12;
const GAP = 10;
const BG = [24, 24, 32, 255];

function parseArgs(argv) {
  const opts = { _: [] };
  for (const a of argv) {
    if (!a.startsWith('--')) { opts._.push(a); continue; }
    const [k, v] = a.slice(2).split('=');
    opts[k] = v === undefined ? true : v;
  }
  return opts;
}

function checker(png, x, y, w, h) {
  for (let j = 0; j < h; j++) {
    for (let i = 0; i < w; i++) {
      const c = ((Math.floor(i / 8) + Math.floor(j / 8)) & 1) ? 150 : 120;
      const k = ((y + j) * png.width + x + i) * 4;
      png.data[k] = c; png.data[k + 1] = c; png.data[k + 2] = c + 10; png.data[k + 3] = 255;
    }
  }
}

function gridLines(png, x0, y0, cols, rows, rgba = [255, 0, 80, 255]) {
  for (let r = 0; r <= rows; r++) fillRect(png, x0, y0 + r * T, cols * T, 1, rgba);
  for (let c = 0; c <= cols; c++) fillRect(png, x0 + c * T, y0, 1, rows * T, rgba);
}

/** Hoja de un rango de filas del tileset original, en `panels` columnas de `per` filas. */
function tilesetSheet(image, from, to, per, panels) {
  const src = loadPNG(path.join(TILESET_DIR, `${image}.png`));
  const maxRow = Math.floor(src.height / T) - 1;
  const last = Math.min(to, maxRow);
  const count = last - from + 1;
  const usedPanels = Math.min(panels, Math.ceil(count / per));
  const panelW = MARGIN_L + 8 * T + GAP;
  const png = new PNG({ width: usedPanels * panelW, height: MARGIN_T + Math.min(per, count) * T + 1 });
  fillRect(png, 0, 0, png.width, png.height, BG);
  for (let p = 0; p < usedPanels; p++) {
    const px = p * panelW + MARGIN_L;
    for (let c = 0; c < 8; c++) drawText(png, px + c * T + 13, 2, String(c), [255, 230, 120, 255]);
    for (let i = 0; i < per; i++) {
      const row = from + p * per + i;
      if (row > last) break;
      const y = MARGIN_T + i * T;
      checker(png, px, y, 8 * T, T);
      blit(png, src, 0, row * T, 8 * T, T, px, y);
      drawText(png, px - MARGIN_L + 2, y + 6, String(row), [255, 255, 255, 255]);
      drawText(png, px - MARGIN_L + 2, y + 18, String(384 + row * 8), [120, 200, 255, 255]);
    }
    gridLines(png, px, MARGIN_T, 8, Math.min(per, last - (from + p * per) + 1));
  }
  return png;
}

/** Recorte de un mapa de Añil con coordenadas. */
function mapSheet(map, region, layerIdx, tilesetId = map.tileset) {
  const layers = map.layers.map((l, i) => (layerIdx.includes(i) ? l : new Array(l.length).fill(0)));
  const body = renderMap({ tilesetId, width: map.width, height: map.height, layers, region, background: [60, 60, 70, 255] });
  const png = new PNG({ width: body.width + MARGIN_L, height: body.height + MARGIN_T });
  fillRect(png, 0, 0, png.width, png.height, BG);
  blit(png, body, 0, 0, body.width, body.height, MARGIN_L, MARGIN_T);
  gridLines(png, MARGIN_L, MARGIN_T, region.w, region.h, [255, 0, 80, 255]);
  for (let c = 0; c < region.w; c++) drawText(png, MARGIN_L + c * T + 4, 2, String(region.x + c), [255, 230, 120, 255]);
  for (let r = 0; r < region.h; r++) drawText(png, 2, MARGIN_T + r * T + 12, String(region.y + r), [255, 255, 255, 255]);
  return png;
}

function parseRegion(str, map) {
  if (!str) return { x: 0, y: 0, w: map.width, h: map.height };
  const [x, y, w, h] = str.split(',').map(Number);
  if ([x, y, w, h].some((v) => !Number.isFinite(v))) throw new Error(`--region inválida: ${str}`);
  return { x, y, w: Math.min(w, map.width - x), h: Math.min(h, map.height - y) };
}

function usage(tileId, tilesetFilter) {
  const index = JSON.parse(fs.readFileSync(path.join(MAPS_DIR, 'index.json'), 'utf8'));
  const list = Array.isArray(index) ? index : Object.values(index);
  for (const m of list) {
    if (tilesetFilter !== undefined && m.tileset !== tilesetFilter) continue;
    let map;
    try { map = loadAnilMap(m.id); } catch { continue; }
    const hits = [];
    map.layers.forEach((layer, li) => layer.forEach((id, i) => {
      if (id === tileId) hits.push(`${i % map.width},${Math.floor(i / map.width)}@${li}`);
    }));
    if (hits.length) console.log(`${m.id} ${m.name} (ts ${m.tileset}): ${hits.length}× ${hits.slice(0, 12).join(' ')}`);
  }
}

function dump(map, region, layerIdx) {
  for (const li of layerIdx) {
    console.log(`capa ${li}:`);
    for (let y = region.y; y < region.y + region.h; y++) {
      const row = [];
      for (let x = region.x; x < region.x + region.w; x++) row.push(String(map.layers[li][x + y * map.width]).padStart(4));
      console.log(row.join(' '));
    }
  }
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const scale = o.scale ? Number(o.scale) : 1;
  const layerIdx = o.layers ? String(o.layers).split(',').map(Number) : [0, 1, 2];
  if (o.usage) return usage(Number(o.usage), o.tileset !== undefined ? Number(o.tileset) : undefined);
  if (o.dump) return dump(loadAnilMap(Number(o.dump)), parseRegion(o.region, loadAnilMap(Number(o.dump))), layerIdx);
  if (o.map) {
    const map = loadAnilMap(Number(o.map));
    const region = parseRegion(o.region, map);
    const out = o.out || path.join(OUT_DIR, 'maps', `map${o.map}_${region.x}_${region.y}_${region.w}x${region.h}.png`);
    const as = o.as !== undefined ? Number(o.as) : map.tileset;
    savePNG(mapSheet(map, region, layerIdx, as), out, scale);
    console.log(`${map.name} (ts ${map.tileset}${as !== map.tileset ? ` dibujado con ts ${as}` : ''}) región ${region.x},${region.y} ${region.w}x${region.h} → ${out}`);
    return;
  }
  const image = o._[0];
  if (!image) throw new Error('Falta <imagen> (p. ej. ExteriorBosqueCeleste) o --map=<id>');
  const per = Number(o.per || 16);
  const panels = Number(o.panels || 3);
  const src = loadPNG(path.join(TILESET_DIR, `${image}.png`));
  const totalRows = Math.floor(src.height / T);
  const ts = Object.entries(getTilesetDB().tilesets).find(([, t]) => t.image === image);
  if (ts) console.log(`tileset ${ts[0]} ${image}: ${totalRows} filas; autotiles: ${ts[1].autotiles.map((n, i) => `${i}=${n}`).join(' ')}`);
  if (o.rows) {
    const [a, b] = String(o.rows).split('-').map(Number);
    const out = o.out || path.join(OUT_DIR, 'tiles', `${image}_r${a}-${b}.png`);
    savePNG(tilesetSheet(image, a, Number.isFinite(b) ? b : a, per, panels), out, scale);
    console.log(`→ ${out}`);
    return;
  }
  const chunk = per * panels;
  for (let a = 0, n = 0; a < totalRows; a += chunk, n++) {
    const out = path.join(OUT_DIR, 'tiles', `${image}_${String(n).padStart(2, '0')}_r${a}-${a + chunk - 1}.png`);
    savePNG(tilesetSheet(image, a, a + chunk - 1, per, panels), out, scale);
  }
  console.log(`hojas en ${path.join(OUT_DIR, 'tiles')}`);
}

try {
  main();
} catch (err) {
  console.error(`find_tiles: ${err.message}`);
  process.exit(1);
}
