// Acceso síncrono a imágenes para el dibujo por frame: se piden con `img(url)` (carga perezosa)
// y se precargan con `preload([...])` en Scene.enter(). Rutas relativas a Añil con `anil(...)`.
import { engine } from '../../core/engine.js';

const loaded = new Map(); // url → HTMLImageElement | null (fallida)
const pending = new Map();

/** URL servida de un recurso de Añil (Graphics/..., sin extensión opcional → .png). */
export function anil(rel) {
  const path = /\.(png|gif|jpg|jpeg)$/i.test(rel) ? rel : `${rel}.png`;
  return engine.assets.anil(path);
}

/** Atajos de rutas frecuentes. */
export const UI = (rel) => anil(`Graphics/UI/${rel}`);

function load(url) {
  if (loaded.has(url)) return Promise.resolve(loaded.get(url));
  if (pending.has(url)) return pending.get(url);
  const p = engine.assets.tryImage(url).then((im) => {
    loaded.set(url, im);
    pending.delete(url);
    if (!im) console.warn(`[ui] Imagen no disponible: ${url}`);
    return im;
  });
  pending.set(url, p);
  return p;
}

/** Imagen ya cargada o null (lanza la carga si hace falta). */
export function img(url) {
  if (!url) return null;
  const im = loaded.get(url);
  if (im !== undefined) return im;
  load(url);
  return null;
}

/** Precarga una lista de URLs (las fallidas quedan como null sin romper). */
export function preload(urls) {
  return Promise.all(urls.filter(Boolean).map(load));
}

/** ¿Se intentó cargar y falló? */
export function failed(url) {
  return loaded.has(url) && loaded.get(url) === null;
}

/** Dibuja una imagen completa centrada en (cx, cy). */
export function blitCentered(g, url, cx, cy, scale = 1) {
  const im = img(url);
  if (!im) return false;
  const w = im.width * scale;
  const h = im.height * scale;
  g.drawImage(im, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
  return true;
}

/**
 * Dibuja una imagen o un recorte. Devuelve false si aún no está disponible.
 * blit(g, url, dx, dy) · blit(g, url, dx, dy, sx, sy, sw, sh) · opts.scale para ampliar.
 */
export function blit(g, url, dx, dy, sx, sy, sw, sh, scale = 1) {
  const im = typeof url === 'string' ? img(url) : url;
  if (!im) return false;
  if (sx === undefined) {
    g.drawImage(im, Math.round(dx), Math.round(dy), im.width * scale, im.height * scale);
    return true;
  }
  const w = sw < 0 || sw === undefined ? im.width - sx : sw;
  const h = sh < 0 || sh === undefined ? im.height - sy : sh;
  if (w <= 0 || h <= 0) return true;
  g.drawImage(im, sx, sy, w, h, Math.round(dx), Math.round(dy), w * scale, h * scale);
  return true;
}
