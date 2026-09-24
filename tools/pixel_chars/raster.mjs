// Rasterizado de formas para sprites grandes (combate): máscaras (elipse, polígono, cápsula),
// sombreado de celda con luz desde arriba-izquierda, contornos por pieza y de silueta.
import { Img, hex, fromRows } from '../pixel.mjs';

export class Mask {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.bits = new Uint8Array(w * h);
  }

  has(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.bits[y * this.w + x] === 1;
  }

  set(x, y, v = 1) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.bits[y * this.w + x] = v;
  }

  /** Nueva máscara = esta ∪ otras. */
  union(...others) {
    const out = new Mask(this.w, this.h);
    out.bits.set(this.bits);
    for (const o of others) for (let i = 0; i < out.bits.length; i++) if (o.bits[i]) out.bits[i] = 1;
    return out;
  }

  /** Nueva máscara = esta − otra. */
  minus(other) {
    const out = new Mask(this.w, this.h);
    for (let i = 0; i < out.bits.length; i++) out.bits[i] = this.bits[i] && !other.bits[i] ? 1 : 0;
    return out;
  }

  /** Nueva máscara = esta ∩ otra. */
  and(other) {
    const out = new Mask(this.w, this.h);
    for (let i = 0; i < out.bits.length; i++) out.bits[i] = this.bits[i] && other.bits[i] ? 1 : 0;
    return out;
  }

  /** Desplazada (dx, dy). */
  shift(dx, dy) {
    const out = new Mask(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.has(x, y)) out.set(x + dx, y + dy);
    return out;
  }

  count() {
    return this.bits.reduce((a, b) => a + b, 0);
  }
}

export function ellipse(w, h, cx, cy, rx, ry) {
  const m = new Mask(w, h);
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x + 0.5 - cx) / rx;
      const dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m.set(x, y);
    }
  }
  return m;
}

/** Polígono relleno (regla par-impar, muestreo en el centro del píxel). */
export function poly(w, h, pts) {
  const m = new Mask(w, h);
  for (let y = 0; y < h; y++) {
    const sy = y + 0.5;
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= sy && y1 > sy) || (y1 <= sy && y0 > sy)) xs.push(x0 + ((sy - y0) / (y1 - y0)) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      for (let x = Math.ceil(xs[i] - 0.5); x < Math.ceil(xs[i + 1] - 0.5); x++) m.set(x, y);
    }
  }
  return m;
}

/** Segmento grueso con extremos redondeados (brazos, piernas). */
export function capsule(w, h, x0, y0, x1, y1, r) {
  const m = new Mask(w, h);
  const vx = x1 - x0;
  const vy = y1 - y0;
  const len2 = vx * vx + vy * vy || 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const px = x + 0.5 - x0;
      const py = y + 0.5 - y0;
      const t = Math.max(0, Math.min(1, (px * vx + py * vy) / len2));
      const dx = px - t * vx;
      const dy = py - t * vy;
      if (dx * dx + dy * dy <= r * r) m.set(x, y);
    }
  }
  return m;
}

export function rect(w, h, x, y, rw, rh) {
  const m = new Mask(w, h);
  for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) m.set(i, j);
  return m;
}

function exitsWithin(mask, x, y, dx, dy, steps) {
  for (let s = 1; s <= steps; s++) if (!mask.has(x + dx * s, y + dy * s)) return true;
  return false;
}

/**
 * Pinta una pieza con sombreado de celda: borde interior con `line`, luz hacia (-1,-1) y sombra
 * hacia `shadowDir`. `tones` = { light, base, shadow, line } en hex.
 */
export function paint(img, mask, tones, { lightW = 2, shadowW = 3, shadowDir = [1, 1], line = true } = {}) {
  const t = Object.fromEntries(Object.entries(tones).map(([k, v]) => [k, hex(v)]));
  for (let y = 0; y < mask.h; y++) {
    for (let x = 0; x < mask.w; x++) {
      if (!mask.has(x, y)) continue;
      const edge = !mask.has(x - 1, y) || !mask.has(x + 1, y) || !mask.has(x, y - 1) || !mask.has(x, y + 1);
      let c = t.base;
      if (line && edge && t.line) c = t.line;
      else if (t.shadow && exitsWithin(mask, x, y, shadowDir[0], shadowDir[1], shadowW)) c = t.shadow;
      else if (t.light && exitsWithin(mask, x, y, -1, -1, lightW)) c = t.light;
      img.set(x, y, c);
    }
  }
  return img;
}

/** Relleno plano. */
export function fill(img, mask, color) {
  const c = hex(color);
  for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) if (mask.has(x, y)) img.set(x, y, c);
  return img;
}

/** Contorno de silueta: los píxeles opacos que tocan transparencia pasan a `color`. */
export function silhouette(img, color) {
  const c = hex(color);
  const out = img.clone();
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (!img.alpha(x, y)) continue;
      if (!img.alpha(x - 1, y) || !img.alpha(x + 1, y) || !img.alpha(x, y - 1) || !img.alpha(x, y + 1)) out.set(x, y, c);
    }
  }
  return out;
}

/** Línea de 1 px (Bresenham) para mechones, pliegues y costuras. */
export function line(img, x0, y0, x1, y1, color) {
  const c = hex(color);
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    img.set(x, y, c);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  return img;
}

/** Como `line`, pero solo pinta dentro de la máscara (para no salirse de la pieza). */
export function lineIn(img, mask, x0, y0, x1, y1, color) {
  const tmp = new Img(img.w, img.h);
  line(tmp, x0, y0, x1, y1, color);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (tmp.alpha(x, y) && mask.has(x, y)) img.set(x, y, tmp.get(x, y));
  return img;
}

/** Dibuja una matriz de caracteres (detalles a mano) en (x, y). */
export function stamp(img, rows, palette, x, y) {
  return img.blit(fromRows(rows, palette), x, y);
}

/** Recorta al lienzo: todo lo que quede fuera de `keep` se borra. */
export function clip(img, keep) {
  const out = img.clone();
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (!keep.has(x, y)) out.set(x, y, [0, 0, 0, 0]);
  return out;
}

export { Img };
