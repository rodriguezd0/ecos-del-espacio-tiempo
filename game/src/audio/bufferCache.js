// Descarga, lectura de metadatos (bucle) y decodificación de audio con caché LRU por grupo.
// La música decodificada ocupa mucho (3 min estéreo 48 kHz ≈ 70 MB), por eso se limitan las
// pistas BGM/ME retenidas; los SE y gritos son pequeños y se guardan muchos más.
import { parseAudioMeta } from './oggMeta.js';

export const CACHE_LIMITS = { bgm: 4, me: 6, se: 320, cry: 240 };

/** Map con expulsión del elemento usado hace más tiempo. */
export class LruMap {
  constructor(max) {
    this.max = Math.max(1, max);
    this.map = new Map();
  }
  get size() { return this.map.size; }
  has(key) { return this.map.has(key); }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    while (this.map.size > this.max) this.map.delete(this.map.keys().next().value);
    return this;
  }
  delete(key) { return this.map.delete(key); }
  clear() { this.map.clear(); }
}

export class AudioLoader {
  /**
   * @param {{ urlFor: (path: string) => string, warn?: (key: string, msg: string) => void }} opts
   */
  constructor({ urlFor, warn }) {
    this.urlFor = urlFor;
    this.warn = warn || ((_k, msg) => console.warn(msg));
    this.bytes = new Map(); // path → Promise<ArrayBuffer|null> (descargas previas a decodificar)
    this.decoded = Object.fromEntries(Object.entries(CACHE_LIMITS).map(([g, n]) => [g, new LruMap(n)]));
    this.missing = new Set();
  }

  /** Descarga sin decodificar (no necesita AudioContext): útil antes del primer gesto. */
  prefetch(path) {
    if (this.missing.has(path)) return Promise.resolve(null);
    if (!this.bytes.has(path)) this.bytes.set(path, this.fetchBytes(path));
    return this.bytes.get(path);
  }

  async fetchBytes(path) {
    const url = this.urlFor(path);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        this.markMissing(path, `[audio] No se encontró ${path} (HTTP ${res.status}). Se continúa sin ese sonido.`);
        return null;
      }
      return await res.arrayBuffer();
    } catch (err) {
      this.markMissing(path, `[audio] Error de red al cargar ${path}: ${err.message || err}`);
      return null;
    }
  }

  markMissing(path, msg) {
    this.missing.add(path);
    this.warn(`missing:${path}`, msg);
  }

  /** ¿Está ya decodificado (sin esperar)? */
  isCached(path, group) {
    return Boolean(this.decoded[group]?.has(path));
  }

  /**
   * Carga y decodifica. → Promise<{ buffer: AudioBuffer, meta } | null> (null si falta o no se decodifica).
   * `group`: 'bgm' | 'me' | 'se' | 'cry' (decide el límite de caché).
   */
  load(ctx, path, group = 'se') {
    const cache = this.decoded[group] || this.decoded.se;
    const hit = cache.get(path);
    if (hit) return hit;
    const promise = this.decode(ctx, path);
    cache.set(path, promise);
    promise.then((r) => { if (!r) cache.delete(path); });
    return promise;
  }

  async decode(ctx, path) {
    const data = await this.prefetch(path);
    this.bytes.delete(path);
    if (!data) return null;
    let meta = null;
    try {
      meta = parseAudioMeta(data); // antes de decodeAudioData, que separa (detach) el ArrayBuffer
    } catch (err) {
      this.warn(`meta:${path}`, `[audio] Metadatos ilegibles en ${path}: ${err.message}`);
    }
    try {
      const buffer = await ctx.decodeAudioData(data);
      return { buffer, meta };
    } catch (err) {
      this.markMissing(path, `[audio] No se pudo decodificar ${path}: ${err && err.message ? err.message : err}`);
      return null;
    }
  }

  stats() {
    return Object.fromEntries(Object.entries(this.decoded).map(([g, lru]) => [g, lru.size]));
  }
}
