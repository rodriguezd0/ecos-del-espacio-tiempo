// Texturas de efectos: formas pixeladas generadas en canvas (blancas, se tiñen en el shader) y celdas de
// las hojas de animación de Añil (Graphics/Animations, celdas de 192×192 en filas de 5).
import * as THREE from 'three';
import { engine } from '../../../core/engine.js';
import { rawTexture, tryRawTexture } from '../../../render/textures.js';

const PX = 2; // un "píxel de arte" = 2 px de pantalla
const cache = new Map();

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  draw(g, w, h);
  return rawTexture(c);
}

/** Rellena píxeles de arte (PX×PX) donde fn(x, y) devuelve un color o null, en una rejilla n×n. */
function pixelShape(n, fn) {
  return canvasTex(n * PX, n * PX, (g) => {
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const col = fn(x, y, n);
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x * PX, y * PX, PX, PX);
      }
    }
  });
}

const W = '#ffffff';
const L = 'rgba(255,255,255,0.55)';

const MAKERS = {
  // Brillo suave (halo) — degradado radial en escalones
  soft: () => pixelShape(16, (x, y, n) => {
    const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) / (n / 2);
    if (d > 1) return null;
    const a = Math.round((1 - d) * 4) / 4;
    return a > 0 ? `rgba(255,255,255,${a})` : null;
  }),
  dot: () => pixelShape(6, (x, y, n) => (Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5) <= n / 2 - 0.2 ? W : null)),
  ring: () => pixelShape(24, (x, y, n) => {
    const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5);
    return d <= n / 2 - 0.5 && d >= n / 2 - 2.5 ? W : null;
  }),
  star: () => pixelShape(9, (x, y) => {
    const dx = Math.abs(x - 4); const dy = Math.abs(y - 4);
    if (dx === 0 || dy === 0) return dx + dy <= 4 ? W : null;
    return dx === 1 && dy === 1 ? W : null;
  }),
  sparkle: () => pixelShape(7, (x, y) => {
    const dx = Math.abs(x - 3); const dy = Math.abs(y - 3);
    if ((dx === 0 && dy <= 3) || (dy === 0 && dx <= 3)) return W;
    return dx === 1 && dy === 1 ? L : null;
  }),
  shard: () => pixelShape(8, (x, y) => (Math.abs(x - 3.5) * 2.2 + Math.abs(y - 3.5) * 0.9 <= 4 ? (x < 4 ? W : L) : null)),
  bubble: () => pixelShape(10, (x, y, n) => {
    const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5);
    if (d > n / 2 - 0.3) return null;
    if (x === 3 && y === 3) return W;
    return d >= n / 2 - 1.5 ? W : 'rgba(255,255,255,0.28)';
  }),
  leaf: () => pixelShape(10, (x, y) => {
    const u = (x - y) / 1.414; const v = (x + y - 9) / 1.414;
    if (Math.abs(v) > 3.2 - Math.abs(u) * 0.55) return null;
    return Math.abs(u) < 0.6 ? L : W;
  }),
  flame: () => pixelShape(10, (x, y) => {
    const cx = 4.5; const top = 0.5;
    const half = y < top ? 0 : Math.min(4.5, (y - top) * 0.75) * (y > 7 ? (10 - y) / 3 : 1);
    if (Math.abs(x - cx) > half) return null;
    return Math.abs(x - cx) < half * 0.45 && y > 3 ? W : 'rgba(255,255,255,0.75)';
  }),
  streak: () => canvasTex(32, 4, (g) => {
    for (let x = 0; x < 16; x++) {
      g.fillStyle = `rgba(255,255,255,${(x / 16).toFixed(2)})`;
      g.fillRect(x * 2, 0, 2, 4);
    }
  }),
  wisp: () => pixelShape(12, (x, y, n) => {
    const d = Math.hypot((x - n / 2 + 0.5) * 1.3, y - n / 2 + 0.5 + Math.sin(x) * 0.8);
    if (d > n / 2 - 0.5) return null;
    return d < 2.5 ? W : 'rgba(255,255,255,0.5)';
  }),
  orb: () => pixelShape(12, (x, y, n) => {
    const d = Math.hypot(x - n / 2 + 0.5, y - n / 2 + 0.5);
    if (d > n / 2 - 0.3) return null;
    if (d < 2) return W;
    return d < 4 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)';
  }),
  rock: () => pixelShape(10, (x, y) => {
    const inside = Math.abs(x - 4.5) + Math.abs(y - 5) * 1.2 < 5.2 && y > 0;
    if (!inside) return null;
    if (x + y < 7) return '#d8c8a0';
    return x + y > 11 ? '#6c5838' : '#a88c60';
  }),
  slash: () => canvasTex(64, 64, (g) => {
    g.strokeStyle = W;
    for (let i = 0; i < 3; i++) {
      g.lineWidth = 4 - i;
      g.beginPath();
      g.moveTo(10 + i * 10, 56);
      g.quadraticCurveTo(30 + i * 8, 30, 56, 6 + i * 6);
      g.stroke();
    }
  }),
  bolt: () => canvasTex(24, 96, (g) => {
    g.fillStyle = W;
    let x = 12;
    for (let y = 0; y < 96; y += 8) {
      const nx = 6 + ((y * 7) % 13);
      const x0 = Math.min(x, nx); const x1 = Math.max(x, nx);
      g.fillRect(x0 - 2, y, x1 - x0 + 4, 4);
      g.fillRect(nx - 2, y + 4, 4, 4);
      x = nx;
    }
  }),
  arrow: () => pixelShape(9, (x, y) => {
    if (y <= 4) return Math.abs(x - 4) <= y ? W : null;
    return x >= 3 && x <= 5 ? W : null;
  }),
  impact: () => pixelShape(15, (x, y, n) => {
    const dx = x - 7; const dy = y - 7;
    const a = Math.atan2(dy, dx);
    const r = Math.hypot(dx, dy);
    const spike = 4.5 + 2.5 * Math.abs(Math.cos(a * 4));
    if (r > spike) return null;
    return r < 3 ? W : 'rgba(255,255,255,0.8)';
  }),
  heart: () => pixelShape(9, (x, y) => {
    const u = (x - 4) / 4; const v = (4 - y) / 4;
    return (u * u + v * v - 0.6) ** 3 - u * u * v * v * v <= 0 ? W : null;
  }),
  zzz: () => canvasTex(16, 16, (g) => {
    g.fillStyle = W;
    g.fillRect(2, 2, 12, 2); g.fillRect(2, 12, 12, 2);
    for (let i = 0; i < 5; i++) g.fillRect(10 - i * 2, 4 + i * 2, 2, 2);
  }),
};

/** Textura procedural por nombre (cacheada). */
export function fxTexture(name) {
  const key = `proc:${name}`;
  if (!cache.has(key)) {
    const make = MAKERS[name] || MAKERS.dot;
    cache.set(key, make());
  }
  return cache.get(key);
}

export const FX_SHAPES = Object.keys(MAKERS);

// ---------------------------------------------------------------- hojas de Añil
const SHEETS = {
  status: 'Graphics/Animations/PRAS- Status.png',
  strike: 'Graphics/Animations/PRAS- Strike.png',
  stats: 'Graphics/Animations/PRAS- Stats.png',
  fire: 'Graphics/Animations/PRAS- Fire.png',
  ballParticle: 'Graphics/Battle animations/ballBurst_particle.png',
  ballStar: 'Graphics/Battle animations/ballBurst_star.png',
};

/** Celdas útiles de las hojas (índice de celda de 192×192, 5 por fila). */
export const CELLS = Object.freeze({
  poison: ['status', [0, 1, 3, 4]],
  duck: ['status', [6, 7, 8]],
  paraSpark: ['status', [9, 10, 11]],
  burn: ['status', [12, 13, 14, 15, 16]],
  sleepZ: ['status', [17, 18]],
  heart: ['status', [20, 21, 22, 23]],
  twinkle: ['status', [24, 25]],
  crystal: ['status', [26]],
  hitStar: ['strike', [0]],
  explosion: ['strike', [3, 4]],
  burst: ['strike', [18]],
  fist: ['strike', [1]],
  statArrow: ['stats', [14]],
  flame: ['fire', [6, 7, 8, 9, 10, 11]],
});

const sheets = new Map(); // clave → THREE.Texture | null (ya resueltas)

/** Carga las hojas en paralelo; las que falten quedan como null (los efectos usan formas propias). */
export async function resolveSheets() {
  await Promise.all(Object.entries(SHEETS).map(async ([key, rel]) => {
    if (sheets.has(key)) return;
    sheets.set(key, await tryRawTexture(engine.assets.anil(rel)));
  }));
}

/** Textura ya cargada de una hoja (o null). */
export function loadedSheet(key) {
  return sheets.get(key) || null;
}

/** { tex, rect: [u0,v0,u1,v1], w, h } de una celda con nombre (CELLS) o null si la hoja no cargó. */
export function cell(name, i = 0) {
  const def = CELLS[name];
  if (!def) return null;
  const tex = loadedSheet(def[0]);
  if (!tex || !tex.image) return null;
  const list = def[1];
  const idx = list[((i % list.length) + list.length) % list.length];
  const cols = Math.max(1, Math.floor(tex.image.width / 192));
  const cx = (idx % cols) * 192;
  const cy = Math.floor(idx / cols) * 192;
  const W0 = tex.image.width;
  const H0 = tex.image.height;
  return { tex, rect: [cx / W0, cy / H0, (cx + 192) / W0, (cy + 192) / H0], w: 192, h: 192, frames: list.length };
}

/** Textura completa de una imagen pequeña (partículas de la Ball). */
export function wholeSheet(name) {
  const tex = loadedSheet(name);
  if (!tex || !tex.image) return null;
  return { tex, rect: [0, 0, 1, 1], w: tex.image.width, h: tex.image.height, frames: 1 };
}

export function disposeFxTextures() {
  for (const [k, v] of cache) {
    if (k.startsWith('proc:') && v instanceof THREE.Texture) v.dispose();
  }
  for (const k of [...cache.keys()]) if (k.startsWith('proc:')) cache.delete(k);
}
