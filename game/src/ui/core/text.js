// Texto pixelado para la capa UI: glifos de las fuentes de Añil rasterizados sin antialias y cacheados.
// Las fuentes de píxeles se rasterizan a su tamaño nativo (1 píxel de fuente = 1 px) y se amplían por
// vecino más cercano (glyphPatches.js), con los glifos rotos del TTF corregidos: ningún trazo se pierde.
// Coordenadas como Essentials: (x, y) = esquina superior de la línea, de modo que las posiciones de los
// scripts de Añil (pbDrawTextPositions) se pueden portar tal cual.
import { stringWidth, cropText as cropPure, wrapText as wrapPure } from './textCodes.js';
import { patchedGlyph, scaleMask } from './glyphPatches.js';

/**
 * Fuentes. `grid` = píxeles por em nativos de la fuente de píxeles (Power Green 12, Small 9): `size` es un
 * múltiplo de `grid` para que cada píxel de fuente sea un cuadrado entero (2 px de pantalla = 1 de arte).
 * `baseline` = distancia desde la y de Essentials hasta la línea base.
 */
export const FONTS = {
  system: { family: 'Power Green', size: 24, baseline: 21, grid: 12 },
  narrow: { family: 'Power Green Narrow', size: 24, baseline: 21, grid: 12 },
  small: { family: 'Power Green Small', size: 18, baseline: 18, grid: 9 },
  // Rótulos diminutos (ayudas de teclas, avisos): Power Green a 1 px por píxel de fuente, mismo tamaño
  // visual que Power Green Small a 12 px pero sin escala fraccionaria.
  tiny: { family: 'Power Green', size: 12, baseline: 12, grid: 12 },
  big: { family: 'Power Green', size: 48, baseline: 42, grid: 12 },
  // Escritura Unown (Fonts/Annon.ttf de Añil): se carga bajo demanda con ensureUnownFont()
  // (content/story/storyFx.js) antes de medir o dibujar. Solo A–Z, espacio, ? y !. No es de píxeles.
  unown: { family: 'Annon', size: 24, baseline: 22 },
  // Texto compacto (Libreta, placas de verso): Power Green Small ×2 con los glifos corregidos, el mismo
  // cuerpo que tenía Power Green a 20 px pero con píxeles enteros.
  note: { family: 'Power Green Small', size: 18, baseline: 18, grid: 9 },
};

const ALPHA_THRESHOLD = 96;
const MAX_GLYPHS = 6000;

const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const mctx = measureCanvas ? measureCanvas.getContext('2d') : null;
const advanceCache = new Map(); // `${font}|${ch}` → ancho
const glyphCache = new Map(); // `${font}|${color}|${mode}|${ch}` → { canvas, ox, oy }
const nativeCache = new Map(); // `${family}|${grid}|${ch}` → GlyphMask nativa | null (no es de píxeles)

function fontOf(name) {
  return FONTS[name] || FONTS.system;
}

function cssFont(f) {
  return `${f.size}px "${f.family}"`;
}

function scaleOf(f) {
  return f.size / f.grid;
}

/**
 * Glifo de una fuente de píxeles a su tamaño nativo (píxeles de fuente). Devuelve null si el carácter no
 * está en la fuente y el navegador lo dibuja con otra (aparecen píxeles a medio cubrir): entonces se
 * rasteriza al tamaño final como una fuente normal.
 */
function nativeGlyph(f, ch) {
  const key = `${f.family}|${f.grid}|${ch}`;
  if (nativeCache.has(key)) return nativeCache.get(key);
  let mask = patchedGlyph(f.family, ch);
  if (!mask) mask = rasterNative(f, ch);
  nativeCache.set(key, mask);
  return mask;
}

// El rasterizador del navegador difumina 1 px en horizontal los bordes de cada trazo (a tamaño nativo un
// hueco de 1 px entre dos trazos queda con alfa ≈129 y se rellenaba): se dibuja a 4× y se lee el interior
// de cada celda de 4×4, que ese filtro no toca.
const OVERSAMPLE = 4;
const INK = 128;
const PARTIAL_MIN = 40;
const PARTIAL_MAX = 215;

/**
 * ¿Tiene la fuente este carácter? Si falta, el navegador lo toma de una genérica: con dos genéricas distintas de
 * respaldo el ancho cambia. (Sin esto un carácter ausente y fino podía quedar en blanco al muestrear.)
 */
function fontHasGlyph(f, ch, px) {
  mctx.font = `${px}px "${f.family}", monospace`;
  const a = mctx.measureText(ch).width;
  mctx.font = `${px}px "${f.family}", serif`;
  return Math.abs(a - mctx.measureText(ch).width) < 0.01;
}

function rasterNative(f, ch) {
  const os = OVERSAMPLE;
  const pad = 3; // en píxeles de fuente
  if (ch.trim() && !fontHasGlyph(f, ch, f.grid * os)) return null;
  mctx.font = `${f.grid * os}px "${f.family}"`;
  const adv = Math.round(mctx.measureText(ch).width / os);
  const cols = adv + pad * 3;
  const rows = f.grid * 2 + pad * 2;
  const base = pad + Math.round(f.grid * 1.4);
  const c = document.createElement('canvas');
  c.width = cols * os;
  c.height = rows * os;
  const g = c.getContext('2d');
  g.font = mctx.font;
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  g.fillText(ch, pad * os, base * os);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  const cells = new Uint8Array(cols * rows);
  let minX = cols; let minY = rows; let maxX = -1; let maxY = -1;
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      let on = 0;
      for (let k = 0; k < 4; k++) {
        const a = d[((cy * os + 1 + (k >> 1)) * c.width + cx * os + 1 + (k & 1)) * 4 + 3];
        if (a > PARTIAL_MIN && a < PARTIAL_MAX) return null; // no es un glifo de píxeles (falta en la fuente)
        if (a >= INK) on++;
      }
      if (on !== 0 && on !== 4) return null;
      if (!on) continue;
      cells[cy * cols + cx] = 1;
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
    }
  }
  if (maxX < 0) return { adv, x0: 0, y0: 0, w: 0, h: 0, bits: new Uint8Array(0) };
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const bits = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) bits[y * w + x] = cells[(y + minY) * cols + x + minX];
  }
  return { adv, x0: minX - pad, y0: minY - base, w, h, bits };
}

/** Ancho de avance de un carácter (px enteros). */
export function charWidth(ch, font = 'system') {
  const key = `${font}|${ch}`;
  let w = advanceCache.get(key);
  if (w === undefined) {
    const f = fontOf(font);
    const native = f.grid ? nativeGlyph(f, ch) : null;
    if (native) {
      w = Math.round(native.adv * scaleOf(f));
    } else {
      mctx.font = cssFont(f);
      w = Math.round(mctx.measureText(ch).width);
    }
    advanceCache.set(key, w);
  }
  return w;
}

export function measure(font = 'system') {
  return (ch) => charWidth(ch, font);
}

/** Ancho de una cadena en px. */
export function textWidth(text, font = 'system') {
  return stringWidth(String(text ?? ''), measure(font));
}

export function cropText(text, maxWidth, font = 'system') {
  return cropPure(text, maxWidth, measure(font));
}

export function wrapLines(text, maxWidth, font = 'system') {
  return wrapPure(text, maxWidth, measure(font));
}

function parseColor(color) {
  if (Array.isArray(color)) return color;
  const s = String(color || '#000');
  if (s[0] === '#') {
    const h = s.length === 4 ? s.slice(1).split('').map((c) => c + c).join('') : s.slice(1);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const m = s.match(/\d+/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}

const SHADOW_DIRS = [[1, 0], [0, 1], [1, 1]];
const OUTLINE_DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const MAX_SHADOW_STEP = 2; // sombra de Essentials: 1 píxel de arte (2 px); en `tiny` (×1), 1 px

function shadowOffsets(f, mode) {
  const dirs = mode === 'shadow' ? SHADOW_DIRS : mode === 'outline' ? OUTLINE_DIRS : [[0, 0]];
  const step = f.grid ? Math.max(1, Math.min(MAX_SHADOW_STEP, Math.round(scaleOf(f)))) : MAX_SHADOW_STEP;
  return dirs.map(([dx, dy]) => [dx * step, dy * step]);
}

/** Pinta una máscara (con sombra/contorno desplazados) en un canvas del color pedido. */
function paintMask(mask, color, offsets) {
  const pad = MAX_SHADOW_STEP + 1;
  const c = document.createElement('canvas');
  c.width = Math.max(1, mask.w + pad * 2);
  c.height = Math.max(1, mask.h + pad * 2);
  const g = c.getContext('2d');
  const img = g.createImageData(c.width, c.height);
  const d = img.data;
  const [r, gg, b] = parseColor(color);
  for (let y = 0; y < mask.h; y++) {
    for (let x = 0; x < mask.w; x++) {
      if (!mask.bits[y * mask.w + x]) continue;
      for (const [dx, dy] of offsets) {
        const i = ((y + pad + dy) * c.width + x + pad + dx) * 4;
        d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
      }
    }
  }
  g.putImageData(img, 0, 0);
  return { canvas: c, ox: pad - mask.x0, oy: pad - mask.y0 };
}

/** Rasteriza un glifo (máscara coloreada). mode: 'base' | 'shadow' | 'outline'. */
function glyph(font, ch, color, mode) {
  const key = `${font}|${color}|${mode}|${ch}`;
  let gl = glyphCache.get(key);
  if (gl) return gl;
  const f = fontOf(font);
  const native = f.grid ? nativeGlyph(f, ch) : null;
  gl = native ? paintMask(scaleMask(native, scaleOf(f)), color, shadowOffsets(f, mode)) : rasterGlyph(f, ch, color, mode);
  if (glyphCache.size > MAX_GLYPHS) glyphCache.clear();
  glyphCache.set(key, gl);
  return gl;
}

/** Fuentes que no son de píxeles (Annon) o caracteres que faltan en la fuente: alfa umbralizado. */
function rasterGlyph(f, ch, color, mode) {
  const pad = 4;
  mctx.font = cssFont(f);
  const w = Math.round(mctx.measureText(ch).width) + pad * 2 + 4;
  const h = Math.ceil(f.size * 1.6) + pad * 2;
  const c = document.createElement('canvas');
  c.width = Math.max(1, w);
  c.height = h;
  const g = c.getContext('2d');
  g.font = cssFont(f);
  g.textBaseline = 'alphabetic';
  g.fillStyle = '#fff';
  const by = pad + Math.round(f.size * 1.2);
  g.fillText(ch, pad, by);
  const img = g.getImageData(0, 0, c.width, c.height);
  const [r, gg, b] = parseColor(color);
  const d = img.data;
  const mask = new Uint8Array(c.width * c.height);
  for (let i = 0; i < mask.length; i++) mask[i] = d[i * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;
  const offsets = shadowOffsets(f, mode);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      let on = 0;
      for (const [dx, dy] of offsets) {
        const sx = x - dx;
        const sy = y - dy;
        if (sx >= 0 && sy >= 0 && sx < c.width && sy < c.height && mask[sy * c.width + sx]) { on = 1; break; }
      }
      const i = (y * c.width + x) * 4;
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = on ? 255 : 0;
    }
  }
  g.putImageData(img, 0, 0);
  return { canvas: c, ox: pad, oy: by };
}

/**
 * Dibuja un carácter con la línea base en (x, baselineY).
 */
function blitGlyph(g, font, ch, color, mode, x, baselineY) {
  if (ch === ' ') return;
  const gl = glyph(font, ch, color, mode);
  g.drawImage(gl.canvas, Math.round(x) - gl.ox, Math.round(baselineY) - gl.oy);
}

/**
 * Dibuja texto estilo Essentials (pbDrawShadowText): sombra en (+2,0),(0,+2),(+2,+2) y luego el color base.
 * @param {CanvasRenderingContext2D} g
 * @param {string} text
 * @param {number} x
 * @param {number} y  coordenada "de Essentials" (parte superior de la línea)
 * @param {{ font?: string, color?: string, shadow?: string|null, align?: 'left'|'center'|'right',
 *           outline?: boolean, alpha?: number }} opts
 * @returns {number} ancho dibujado
 */
export function drawText(g, text, x, y, opts = {}) {
  const s = String(text ?? '');
  if (!s) return 0;
  const font = opts.font || 'system';
  const f = fontOf(font);
  const w = textWidth(s, font);
  let sx = x;
  if (opts.align === 'center') sx = x - Math.floor(w / 2);
  else if (opts.align === 'right') sx = x - w;
  const by = y + f.baseline;
  const base = opts.color || '#505058';
  const prevAlpha = g.globalAlpha;
  if (opts.alpha !== undefined) g.globalAlpha = prevAlpha * opts.alpha;
  if (opts.shadow) {
    const mode = opts.outline ? 'outline' : 'shadow';
    let cx = sx;
    for (const ch of s) {
      blitGlyph(g, font, ch, opts.shadow, mode, cx, by);
      cx += charWidth(ch, font);
    }
  }
  let cx = sx;
  for (const ch of s) {
    blitGlyph(g, font, ch, base, 'base', cx, by);
    cx += charWidth(ch, font);
  }
  g.globalAlpha = prevAlpha;
  return w;
}

/**
 * Dibuja una lista de caracteres ya maquetados (mensajes): [{ ch, x, y, color, shadow }].
 * Primero todas las sombras y luego las bases, como Essentials.
 */
export function drawGlyphRun(g, run, font = 'system') {
  const f = fontOf(font);
  for (const c of run) if (c.shadow) blitGlyph(g, font, c.ch, c.shadow, 'shadow', c.x, c.y + f.baseline);
  for (const c of run) blitGlyph(g, font, c.ch, c.color, 'base', c.x, c.y + f.baseline);
}

/** Varias líneas de texto (ajustadas a `width`) a partir de (x, y), con `lineHeight` px entre líneas. */
export function drawParagraph(g, text, x, y, width, opts = {}) {
  const lh = opts.lineHeight || 32;
  const lines = wrapLines(text, width, opts.font || 'system');
  const max = opts.maxLines || lines.length;
  lines.slice(0, max).forEach((line, i) => drawText(g, line, x, y + i * lh, opts));
  return Math.min(lines.length, max);
}

/** Equivalente a pbDrawTextPositions: [[texto, x, y, align, base, sombra, font?]]. */
export function drawTextPositions(g, list) {
  for (const [text, x, y, align, color, shadow, font] of list) {
    drawText(g, text, x, y, { align: align || 'left', color, shadow, font });
  }
}
