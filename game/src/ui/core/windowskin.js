// Ventanas 9-slice a partir de los windowskins de Añil (Graphics/Windowskins), con las reglas de
// SpriteWindow de Essentials (skinformat 1): cuerpo 16×16 en el centro; los "speech" de 96×48 tienen
// borde izquierdo 32 px y derecho 48 px.
import { anil, img, preload } from './images.js';

/** Marcos seleccionables en Opciones (índice = options.frame). speech = diálogos, menu = menús. */
export const FRAMES = [
  { name: 'Añil oscuro', speech: 'black', menu: 'black' },
  { name: 'Clásico', speech: 'speech pl 18', menu: 'choice 2' },
  { name: 'Grafito', speech: 'speech hgss 2', menu: 'choice 1' },
  { name: 'Ámbar', speech: 'speech hgss 1', menu: 'choice 1' },
  { name: 'Carmín', speech: 'speech hgss 3', menu: 'choice 3' },
  { name: 'Celeste', speech: 'speech hgss 4', menu: 'choice 17' },
  { name: 'Pradera', speech: 'speech hgss 5', menu: 'choice 4' },
  { name: 'Naranja', speech: 'speech hgss 6', menu: 'choice 10' },
  { name: 'Lavanda', speech: 'speech hgss 7', menu: 'choice 5' },
  { name: 'Madera', speech: 'speech pl 1', menu: 'choice 21' },
];

const skinUrl = (name) => anil(`Graphics/Windowskins/${name}.png`);
const info = new Map(); // name → { rect, borders, dark }

export function frameAt(index) {
  return FRAMES[index] || FRAMES[1];
}

/** Precarga los windowskins de un marco (o todos). */
export function preloadSkins(names = FRAMES.flatMap((f) => [f.speech, f.menu])) {
  return preload([...new Set(names)].map(skinUrl));
}

function computeInfo(name, im) {
  let rect;
  if ((im.width === 80 || im.width === 96) && im.height === 48) rect = [32, 16, 16, 16];
  else if (im.width === 80 && im.height === 80) rect = [32, 32, 16, 16];
  else rect = [(im.width - 16) / 2, (im.height - 16) / 2, 16, 16];
  const [rx, ry, rw, rh] = rect;
  const borders = { left: rx, top: ry, right: im.width - rx - rw, bottom: im.height - ry - rh };
  // Oscuridad del cuerpo (isDarkWindowskin): luminancia media del rectángulo central.
  let dark = true;
  try {
    const c = document.createElement('canvas');
    c.width = rw;
    c.height = rh;
    const g = c.getContext('2d');
    g.drawImage(im, rx, ry, rw, rh, 0, 0, rw, rh);
    const d = g.getImageData(0, 0, rw, rh).data;
    let r = 0; let gg = 0; let b = 0; let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      r += d[i]; gg += d[i + 1]; b += d[i + 2]; n += 1;
    }
    if (n) dark = (r * 0.299 + gg * 0.587 + b * 0.114) / n < 160;
  } catch (err) {
    console.warn('[ui] No se pudo analizar el windowskin', name, err);
  }
  const out = { rect, borders, dark };
  info.set(name, out);
  return out;
}

/** Información del skin (bordes, oscuro) o null si aún no ha cargado. */
export function skinInfo(name) {
  if (info.has(name)) return info.get(name);
  const im = img(skinUrl(name));
  return im ? computeInfo(name, im) : null;
}

/** ¿El skin es oscuro? (texto claro). Por defecto false mientras carga. */
export function isDarkSkin(name) {
  const inf = skinInfo(name);
  return inf ? inf.dark : false;
}

/** Bordes {left, top, right, bottom} del skin (16 por defecto). */
export function skinBorders(name) {
  const inf = skinInfo(name);
  return inf ? inf.borders : { left: 16, top: 16, right: 16, bottom: 16 };
}

function tile(g, im, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (dw <= 0 || dh <= 0 || sw <= 0 || sh <= 0) return;
  for (let y = 0; y < dh; y += sh) {
    const h = Math.min(sh, dh - y);
    for (let x = 0; x < dw; x += sw) {
      const w = Math.min(sw, dw - x);
      g.drawImage(im, sx, sy, w, h, dx + x, dy + y, w, h);
    }
  }
}

/**
 * Dibuja una ventana con el skin indicado.
 * @param {CanvasRenderingContext2D} g
 * @param {string} name  nombre del windowskin (sin extensión)
 * @param {number} x @param {number} y @param {number} w @param {number} h
 * @param {{ opacity?: number }} opts
 * @returns {boolean} false si el skin aún no está cargado
 */
export function drawWindow(g, name, x, y, w, h, opts = {}) {
  const im = img(skinUrl(name));
  if (!im) return false;
  const inf = skinInfo(name);
  const { left: L, top: T, right: R, bottom: B } = inf.borders;
  const [cx, cy, cw, ch] = inf.rect;
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const iw = im.width; const ih = im.height;
  const prev = g.globalAlpha;
  if (opts.opacity !== undefined) g.globalAlpha = prev * opts.opacity;
  // Esquinas
  g.drawImage(im, 0, 0, L, T, x, y, L, T);
  g.drawImage(im, iw - R, 0, R, T, x + w - R, y, R, T);
  g.drawImage(im, 0, ih - B, L, B, x, y + h - B, L, B);
  g.drawImage(im, iw - R, ih - B, R, B, x + w - R, y + h - B, R, B);
  // Lados (en mosaico)
  tile(g, im, cx, 0, cw, T, x + L, y, w - L - R, T);
  tile(g, im, cx, ih - B, cw, B, x + L, y + h - B, w - L - R, B);
  tile(g, im, 0, cy, L, ch, x, y + T, L, h - T - B);
  tile(g, im, iw - R, cy, R, ch, x + w - R, y + T, R, h - T - B);
  // Cuerpo
  tile(g, im, cx, cy, cw, ch, x + L, y + T, w - L - R, h - T - B);
  g.globalAlpha = prev;
  return true;
}
