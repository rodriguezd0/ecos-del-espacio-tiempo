// Carga y caché de recursos (imágenes, texturas Three.js, JSON, fuentes).
import * as THREE from 'three';

export const ANIL_BASE = '/anil/';

export class Assets {
  constructor() {
    this.images = new Map();
    this.textures = new Map();
    this.jsons = new Map();
    this.fonts = new Map();
  }

  /** Ruta servida de un recurso original de Añil (p. ej. 'Graphics/Pokemon/Front/TURTWIG.png'). */
  anil(rel) {
    return ANIL_BASE + rel.split('/').map(encodeURIComponent).join('/');
  }

  image(url) {
    if (!this.images.has(url)) {
      this.images.set(url, new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`No se pudo cargar la imagen ${url}`));
        img.src = url;
      }));
    }
    return this.images.get(url);
  }

  /** Imagen opcional: resuelve null si no existe (p. ej. sprite shiny ausente). */
  async tryImage(url) {
    try {
      return await this.image(url);
    } catch {
      this.images.delete(url);
      return null;
    }
  }

  texture(url) {
    if (!this.textures.has(url)) {
      this.textures.set(url, this.image(url).then((img) => makePixelTexture(img)));
    }
    return this.textures.get(url);
  }

  json(url) {
    if (!this.jsons.has(url)) {
      this.jsons.set(url, fetch(url).then((r) => {
        if (!r.ok) throw new Error(`No se pudo cargar ${url} (${r.status})`);
        return r.json();
      }));
    }
    return this.jsons.get(url);
  }

  /** Registra una fuente TTF (p. ej. las de Añil) para usar en el canvas UI. */
  font(family, url) {
    if (!this.fonts.has(family)) {
      const face = new FontFace(family, `url("${url}")`);
      this.fonts.set(family, face.load().then((f) => {
        document.fonts.add(f);
        return f;
      }));
    }
    return this.fonts.get(family);
  }
}

/**
 * Textura Three.js apta para pixel art.
 * flipY = false: el mundo usa y hacia abajo (grupo raíz con scale.y = -1), así que
 * v = 0 corresponde a la fila superior de la imagen (cómodo para atlas y tiras).
 */
export function makePixelTexture(source) {
  const tex = new THREE.Texture(source);
  tex.flipY = false;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
