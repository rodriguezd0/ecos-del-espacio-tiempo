// Texturas "crudas" para los shaders del mundo: sin conversión de espacio de color (NoColorSpace),
// de modo que los valores sRGB del PNG llegan tal cual al canvas (pixel-perfect) y los tonos de
// pantalla operan como en RMXP (sobre valores de 0..255).
import * as THREE from 'three';
import { engine } from '../core/engine.js';

const cache = new Map();

export function rawTexture(source) {
  const tex = new THREE.Texture(source);
  tex.flipY = false;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.NoColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

/** Textura cruda cacheada por URL. Rechaza si la imagen no existe. */
export function loadRawTexture(url) {
  if (!cache.has(url)) {
    const p = engine.assets.image(url).then((img) => rawTexture(img));
    p.catch(() => cache.delete(url));
    cache.set(url, p);
  }
  return cache.get(url);
}

/** Igual que loadRawTexture pero resuelve null si no existe. */
export async function tryRawTexture(url) {
  try {
    return await loadRawTexture(url);
  } catch {
    return null;
  }
}

/** Textura repetible (niebla, clima en mosaico), cacheada por URL (antes se creaba una textura nueva en cada mapa). */
export function loadRepeatTexture(url) {
  const key = `repeat:${url}`;
  if (!cache.has(key)) {
    const p = engine.assets.image(url).then((img) => {
      const tex = rawTexture(img);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    });
    p.catch(() => cache.delete(key));
    cache.set(key, p);
  }
  return cache.get(key);
}

/** Canvas 2D auxiliar (en navegador). */
export function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d', { willReadFrequently: false });
  g.imageSmoothingEnabled = false;
  return { canvas: c, g };
}
