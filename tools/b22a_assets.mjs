// Arte del Anclaje y del Mundo Distorsión profundo. Nativo 16 px, ampliado ×2, hojas RMXP 4×4.
// Uso: node tools/b22a_assets.mjs [--check] [--preview]. Provisional D30.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, sheet, preview } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game/assets/objects');
const CACHE = path.join(ROOT, 'tools/cache/pixel');
const S = { hi: '#ACA5BF', light: '#837E9A', mid: '#625D7A', dark: '#403853', rim: '#221C32' };
const V = ['#9163C0', '#C08FEF', '#E4C8FF', '#C08FEF'];
const G = ['#91CE51', '#BCF477', '#DDFFB4', '#BCF477'];

function box(img, x0, y0, x1, y1, color) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, hex(color));
}

function line(img, x0, y0, x1, y1, color) {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (true) {
    img.set(x0, y0, hex(color));
    if (x0 === x1 && y0 === y1) break;
    const e = 2 * err;
    if (e >= dy) { err += dy; x0 += sx; }
    if (e <= dx) { err += dx; y0 += sy; }
  }
}

function hexagon(img, cx, cy, r, color) {
  const points = [[cx - r, cy], [cx - Math.ceil(r / 2), cy - r], [cx + Math.ceil(r / 2), cy - r],
    [cx + r, cy], [cx + Math.ceil(r / 2), cy + r], [cx - Math.ceil(r / 2), cy + r]];
  points.forEach((a, i) => line(img, ...a, ...points[(i + 1) % 6], color));
}

function face(row, frame) {
  const img = new Img(16, 16);
  const anchored = row === 1 || row === 2;
  const center = row >= 2;
  box(img, 2, 3, 13, 13, anchored ? S.mid : S.dark);
  box(img, 3, 2, 12, 3, S.light);
  box(img, 3, 13, 12, 14, S.dark);
  line(img, 3, 4, 12, 4, S.hi);
  line(img, 3, 5, 3, 11, S.light);
  line(img, 12, 5, 12, 12, S.dark);
  if (center) hexagon(img, 7, 8, 3, anchored ? G[frame] : V[frame]);
  else {
    line(img, 5, 7, 10, 7, anchored ? G[frame] : V[frame]);
    line(img, 5, 9, 10, 9, anchored ? G[frame] : V[frame]);
  }
  return outline(img, S.rim);
}

function post(row, frame) {
  const img = new Img(16, 32);
  const lit = row % 2 === 1;
  box(img, 4, 26, 11, 29, S.dark);
  box(img, 5, 10, 10, 26, S.mid);
  box(img, 6, 8, 9, 10, S.light);
  line(img, 5, 11, 5, 25, S.light);
  line(img, 10, 11, 10, 25, S.dark);
  hexagon(img, 7, 17, 3, lit ? G[frame] : S.rim);
  img.set(7, 17, hex(lit ? G[(frame + 1) % 4] : S.dark));
  line(img, 6, 23, 9, 23, lit ? V[frame] : S.dark);
  return outline(img, S.rim);
}

function object(row, frame) {
  const img = new Img(16, 16);
  if (row === 0 || row === 1) {
    const c = row === 0 ? V[frame] : G[frame];
    hexagon(img, 7, 7, 4, c);
    hexagon(img, 8, 8, 3, c);
    img.set(7, 7, hex('#FFFFFF'));
  } else if (row === 2) {
    box(img, 3, 5, 12, 11, S.dark);
    hexagon(img, 7, 8, 4, G[frame]);
    hexagon(img, 7, 8, 2, G[(frame + 1) % 4]);
  } else {
    for (let n = 0; n < 3; n++) {
      box(img, 3 + n, 10 - n * 3, 12 - n, 12 - n * 3, '#D9DBED');
      line(img, 4 + n, 10 - n * 3, 11 - n, 10 - n * 3, '#FFFFFF');
      line(img, 4 + n, 12 - n * 3, 11 - n, 12 - n * 3, '#989EB9');
    }
  }
  return outline(img, S.rim);
}

function heart(row, frame) {
  const img = new Img(16, 32);
  if (row <= 1) {
    box(img, 3, 26, 12, 29, S.dark);
    box(img, 5, 22, 10, 26, S.mid);
    box(img, 4, 21, 11, 22, S.hi);
    if (row === 0) {
      for (let y = 7; y <= 18; y++) for (let x = 4; x <= 11; x++) {
        if ((x - 7.5) ** 2 / 16 + (y - 12.5) ** 2 / 36 <= 1) {
          img.set(x, y, hex(x < 7 ? '#DED7AE' : x < 10 ? '#9F945E' : '#615538'));
        }
      }
      line(img, 6, 10, 9, 15, V[frame]);
      img.set(6, 9, hex('#FFF5D6'));
    }
  } else {
    box(img, 3, 18, 12, 29, S.mid);
    line(img, 3, 18, 12, 18, S.hi);
    hexagon(img, 7, 24, 3, row === 3 ? G[frame] : S.rim);
  }
  return outline(img, S.rim);
}

const generators = { 'b22a_cara.png': [face, 16], 'b22a_poste.png': [post, 32],
  'b22a_objetos.png': [object, 16], 'b22a_corazon.png': [heart, 32] };
let stale = false;
for (const [name, [make, h]] of Object.entries(generators)) {
  const rows = Array.from({ length: 4 }, (_, row) => Array.from({ length: 4 }, (_, f) => make(row, f).scale(2)));
  const img = sheet(rows, 32, h * 2);
  const file = path.join(OUT, name);
  if (process.argv.includes('--check')) {
    const old = fs.existsSync(file) ? Img.load(file) : null;
    if (!old || old.w !== img.w || old.h !== img.h || !Buffer.from(old.data).equals(Buffer.from(img.data))) {
      console.error(`desactualizado objects/${name}`);
      stale = true;
    }
  } else img.save(file);
  if (process.argv.includes('--preview')) preview(img, { scale: 2, bg: '#202028' }).save(path.join(CACHE, name));
  console.log(`objects/${name} ${img.w}×${img.h}`);
}
if (stale) process.exitCode = 1;
