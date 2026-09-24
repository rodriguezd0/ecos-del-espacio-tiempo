// Texto pixelado para la capa UI: glifos de las fuentes de Añil rasterizados sin antialias
// (alfa umbralizado) y cacheados. Coordenadas como Essentials: (x, y) = esquina superior de la línea,
// de modo que las posiciones de los scripts de Añil (pbDrawTextPositions) se pueden portar tal cual.
import { stringWidth, cropText as cropPure, wrapText as wrapPure } from './textCodes.js';

/**
 * Fuentes. `size` en px elegido para que cada píxel de la fuente sean 2 px de pantalla (nítido);
 * `baseline` = distancia desde la y de Essentials hasta la línea base.
 */
export const FONTS = {
  system: { family: 'Power Green', size: 24, baseline: 21 },
  narrow: { family: 'Power Green Narrow', size: 24, baseline: 21 },
  small: { family: 'Power Green Small', size: 18, baseline: 18 },
  tiny: { family: 'Power Green Small', size: 12, baseline: 12 },
  big: { family: 'Power Green', size: 48, baseline: 42 },
  // Escritura Unown (Fonts/Annon.ttf de Añil): se carga bajo demanda con ensureUnownFont()
  // (content/story/storyFx.js) antes de medir o dibujar. Solo A–Z, espacio, ? y !.
  unown: { family: 'Annon', size: 24, baseline: 22 },
  // Texto compacto y nítido (Libreta, placas de verso): Power Green a 20 px conserva la «m» y la «ll»,
  // que Power Green Small (small/tiny) pierde al rasterizar.
  note: { family: 'Power Green', size: 20, baseline: 18 },
};

const ALPHA_THRESHOLD = 96;
const MAX_GLYPHS = 6000;

const measureCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
const mctx = measureCanvas ? measureCanvas.getContext('2d') : null;
const advanceCache = new Map(); // `${font}|${ch}` → ancho
const glyphCache = new Map(); // `${font}|${color}|${mode}|${ch}` → { canvas, ox, oy }

function fontOf(name) {
  return FONTS[name] || FONTS.system;
}

function cssFont(f) {
  return `${f.size}px "${f.family}"`;
}

/** Ancho de avance de un carácter (px enteros). */
export function charWidth(ch, font = 'system') {
  const key = `${font}|${ch}`;
  let w = advanceCache.get(key);
  if (w === undefined) {
    const f = fontOf(font);
    mctx.font = cssFont(f);
    w = Math.round(mctx.measureText(ch).width);
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

const SHADOW_OFFSETS = [[2, 0], [0, 2], [2, 2]];
const OUTLINE_OFFSETS = [[-2, -2], [0, -2], [2, -2], [-2, 0], [2, 0], [-2, 2], [0, 2], [2, 2]];

/** Rasteriza un glifo (máscara coloreada). mode: 'base' | 'shadow' | 'outline'. */
function glyph(font, ch, color, mode) {
  const key = `${font}|${color}|${mode}|${ch}`;
  let gl = glyphCache.get(key);
  if (gl) return gl;
  const f = fontOf(font);
  const pad = 4;
  const w = charWidth(ch, font) + pad * 2 + 4;
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
  const offsets = mode === 'shadow' ? SHADOW_OFFSETS : mode === 'outline' ? OUTLINE_OFFSETS : [[0, 0]];
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
  gl = { canvas: c, ox: pad, oy: by };
  if (glyphCache.size > MAX_GLYPHS) glyphCache.clear();
  glyphCache.set(key, gl);
  return gl;
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
