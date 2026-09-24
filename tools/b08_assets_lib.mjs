// Utilidades de dibujo para el arte propio del Bloque 8 (tools/b08_assets*.mjs), sobre tools/pixel.mjs.
// Se dibuja a resolución nativa (16 px por casilla, como la DS) y se amplía ×2 al guardar (DS×2, docs/arte.md).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet } from './pixel.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const OUT = path.join(ROOT, 'game', 'assets', 'objects');
export const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

/** '#RRGGBB' → [r, g, b, a] con alfa opcional. */
export const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

/** Mezcla un color encima respetando alfa. */
export function over(img, x, y, c) {
  if (!img.inside(x, y) || !c) return;
  const [r, g, b, a] = img.get(x, y);
  const t = (c[3] ?? 255) / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3] ?? 255)]);
}

export function px(img, x, y, c) { over(img, Math.round(x), Math.round(y), c); }

export function rect(img, x, y, w, h, c) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) over(img, x + i, y + j, c);
}

export function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) over(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}

export function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
    }
  }
}

export function ellipse(img, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) over(img, x, y, c);
    }
  }
}

/** Polígono relleno (lista de [x, y]) por paridad. */
export function poly(img, pts, c) {
  const ys = pts.map((p) => p[1]);
  for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
    const cy = y + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= cy && y1 > cy) || (y1 <= cy && y0 > cy)) xs.push(x0 + ((cy - y0) * (x1 - x0)) / (y1 - y0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) over(img, x, y, c);
    }
  }
}

/** Contorno de 1 px alrededor de lo opaco (sin tocar lo ya pintado). */
export function outlineIn(img, color) {
  const c = rgba(color);
  const copy = img.clone();
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (copy.alpha(x, y)) continue;
      if (copy.alpha(x - 1, y) || copy.alpha(x + 1, y) || copy.alpha(x, y - 1) || copy.alpha(x, y + 1)) img.set(x, y, c);
    }
  }
  return img;
}

/** Desplaza una imagen (nueva, mismo tamaño). */
export function shift(img, dx, dy) {
  const out = new Img(img.w, img.h);
  out.blit(img, dx, dy);
  return out;
}

/** Ruido determinista (0..1) por casilla. */
export function noise(x, y, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Hoja 4×4 a partir de filas de fotogramas nativos (fila = dirección 2/4/6/8). Cada fila puede traer 1–4
 * fotogramas (se repiten para llenar las 4 columnas). Se amplía ×scale.
 */
export function eventSheet(rows, scale = 2) {
  const full = [0, 1, 2, 3].map((r) => {
    const row = rows[r] || rows[0];
    return [0, 1, 2, 3].map((c) => row[c % row.length].scale(scale));
  });
  return sheet(full, full[0][0].w, full[0][0].h);
}

/** Guarda la hoja en game/assets/objects y, con --preview, una vista ampliada. */
export function save(name, img, { previewScale = 2 } = {}) {
  const file = img.save(path.join(OUT, name));
  if (process.argv.includes('--preview')) preview(img, { scale: previewScale, grid: img.w / 4 }).save(path.join(PREVIEW, `prev_${name}`));
  console.log(`→ ${path.relative(ROOT, file)} (${img.w}×${img.h})`);
  return file;
}

export { Img };
