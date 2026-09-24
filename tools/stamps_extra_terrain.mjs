// Arte procedural de los terrenos de barrera del overlay (tools/stamps_extra.mjs): grava, barro, arena
// honda, nieve honda y ceniza (CAMPANA §1.1). Brushes `nine`: 3×3 + esquinas cóncavas 2×2 (5×3 tiles),
// con borde irregular y periódico (encaja entre tiles) y fondo transparente fuera de la mancha: se pintan
// en la capa 1 sobre el suelo del mapa. Los colores base se muestrean de los tilesets de Añil.
import { Img } from './pixel.mjs';
import { originalTileset } from './stamps_lib.mjs';
import { N, rng } from './stamps_extra_art.mjs';

/** Color medio (opaco) de un tile de la imagen original. */
export function sampleTile(image, col, row) {
  const png = originalTileset(image);
  let r = 0; let g = 0; let b = 0; let n = 0;
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const i = ((row * 32 + y) * png.width + col * 32 + x) * 4;
      if (png.data[i + 3] < 250) continue;
      r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2]; n++;
    }
  }
  if (!n) throw new Error(`sampleTile: tile vacío ${image} ${col},${row}`);
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n), 255];
}

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)));
/** Aclara (k > 0) u oscurece (k < 0) un color RGBA. */
export const tone = (c, k) => [clamp(c[0] + k), clamp(c[1] + k), clamp(c[2] + k), c[3] ?? 255];
const mixc = (a, b, t) => [0, 1, 2].map((i) => clamp(a[i] + (b[i] - a[i]) * t)).concat(255);
const gray = (c, t = 1) => { const l = c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11; return mixc(c, [l, l, l], t); };

/** Hash determinista de píxel (0..1). */
const ph = (x, y, s = 0) => rng(((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0)();

/** Ondulación periódica (período 16 px) para bordes que encajan entre tiles. */
const wob = (t, ph0 = 0) => Math.round(1.1 * Math.sin((2 * Math.PI * t) / 16 + 1.3 + ph0) + 0.7 * Math.sin((4 * Math.PI * t) / 16 + 0.4 + ph0));

/** ¿Está (lx, ly) dentro de la mancha para el tile (tx, ty) del bloque 5×3 de un nine? */
function insideNine(tx, ty, lx, ly) {
  if (tx >= 3) {
    const q = (tx - 3) + 2 * ty; // 0 NO, 1 NE, 2 SO, 3 SE
    const outX = q % 2 === 0 ? lx < 3 + wob(ly + 3) : lx > 12 - wob(ly + 11);
    const outY = q < 2 ? ly < 3 + wob(lx) : ly > 12 - wob(lx + 7);
    return !(outX && outY);
  }
  if (ty === 0 && ly < 3 + wob(lx)) return false;
  if (ty === 2 && ly > 12 - wob(lx + 7)) return false;
  if (tx === 0 && lx < 3 + wob(ly + 3)) return false;
  if (tx === 2 && lx > 12 - wob(ly + 11)) return false;
  // redondeo de las esquinas convexas
  const cxr = tx === 0 ? 6 : tx === 2 ? 9 : null;
  const cyr = ty === 0 ? 6 : ty === 2 ? 9 : null;
  if (cxr !== null && cyr !== null) {
    const nearX = tx === 0 ? lx < cxr : lx > cxr;
    const nearY = ty === 0 ? ly < cyr : ly > cyr;
    if (nearX && nearY && Math.hypot(lx - cxr, ly - cyr) > 3.4) return false;
  }
  return true;
}

/**
 * Bloque nine de 5×3 tiles (80×48 nativos). `tex(x, y)` color del interior (x, y en 0..15, periódico),
 * `rim` color del borde de 1 px.
 */
export function terrainNine({ tex, rim }) {
  const img = new Img(5 * N, 3 * N);
  for (let ty = 0; ty < 3; ty++) {
    for (let tx = 0; tx < 5; tx++) {
      if (tx >= 3 && ty === 2) continue;
      const inside = (lx, ly) => (lx < 0 || ly < 0 || lx >= N || ly >= N ? true : insideNine(tx, ty, lx, ly));
      for (let ly = 0; ly < N; ly++) {
        for (let lx = 0; lx < N; lx++) {
          if (!inside(lx, ly)) continue;
          const edge = !inside(lx - 1, ly) || !inside(lx + 1, ly) || !inside(lx, ly - 1) || !inside(lx, ly + 1);
          img.set(tx * N + lx, ty * N + ly, edge ? rim : tex(lx, ly));
        }
      }
    }
  }
  return img;
}

/** Huella hundida (2×4, con reborde claro arriba) en (x0, y0) del patrón: devuelve color o null. */
function footprint(x, y, x0, y0, deep, lip) {
  const dx = x - x0; const dy = y - y0;
  if (dx < 0 || dx > 1 || dy < 0 || dy > 4) return null;
  if (dy === 0) return lip;
  if (dy === 4 && dx === 1) return null;
  return deep;
}

// Rastro en zigzag (pie izquierdo / derecho) que se repite cada tile.
const PRINTS = [[3, 1], [8, 5], [4, 9], [11, 11]];

function prints(x, y, deep, lip, which = PRINTS) {
  for (const [px, py] of which) {
    const c = footprint(x, y, px, py, deep, lip);
    if (c) return c;
  }
  return null;
}

/** Guijarro de 2×2 en la rejilla del patrón: devuelve el color o null. */
function pebble(x, y, light, dark) {
  const cx = x - (x % 3); const cy = y - (y % 3);
  const h = ph(cx, cy, 13);
  if (h > 0.45) return null;
  const ox = cx + (h < 0.2 ? 0 : 1); const oy = cy + (h < 0.3 ? 0 : 1);
  if (x === ox && y === oy) return light;
  if ((x === ox + 1 && y === oy) || (x === ox && y === oy + 1)) return h < 0.25 ? light : dark;
  if (x === ox + 1 && y === oy + 1) return dark;
  return null;
}

function gravaTex() {
  const base = sampleTile('Exterior1', 4, 13); // camino de tierra
  const b = mixc(gray(base, 0.55), [128, 122, 112], 0.3);
  const light = tone(b, 34); const dark = tone(b, -34); const skid = tone(b, -22); const skidHi = tone(b, 16);
  // marcas de derrape: dos surcos cortos en diagonal (cuesta abajo = sur)
  const onSkid = (x, y, x0, y0) => { const t = y - y0; return t >= 0 && t < 7 && x === x0 + Math.floor(t / 3); };
  return {
    rim: tone(b, -40),
    tex: (x, y) => {
      if (onSkid(x, y, 3, 1) || onSkid(x, y, 10, 8)) return skid;
      if (onSkid(x - 1, y, 3, 1) || onSkid(x - 1, y, 10, 8)) return skidHi;
      const p = pebble(x, y, light, dark);
      if (p) return p;
      return ph(x, y, 7) < 0.12 ? tone(b, -12) : b;
    },
  };
}

function barroTex() {
  const soil = sampleTile('ExteriorSafari', 1, 13);
  const b = mixc(gray(soil, 0.25), [92, 70, 50], 0.6);
  const wet = tone(b, -16); const shine = tone(b, 26); const deep = tone(b, -44); const pool = mixc(b, [110, 124, 128], 0.55);
  return {
    rim: tone(b, -34),
    tex: (x, y) => {
      const f = prints(x, y, deep, shine, [[3, 2], [8, 9]]);
      if (f) return f;
      const pd = ((x - 12.5) / 2.8) ** 2 + ((y - 4.5) / 1.7) ** 2;
      if (pd <= 1) return pd < 0.3 && x <= 12 ? tone(pool, 30) : pool;
      const h = ph(x, y, 11);
      return h < 0.06 ? shine : h < 0.3 ? wet : b;
    },
  };
}

function arenaTex() {
  const b = sampleTile('ExteriorSafari', 1, 5);
  const ripple = tone(b, -16); const hi = tone(b, 14); const deep = tone(b, -58); const lip = tone(b, 22);
  return {
    rim: tone(b, -30),
    tex: (x, y) => {
      const f = prints(x, y, deep, lip);
      if (f) return f;
      const w = (y + Math.round(Math.sin(x / 2.5))) % 5;
      if (w === 0) return ripple;
      if (w === 1) return hi;
      return ph(x, y, 5) < 0.06 ? ripple : b;
    },
  };
}

function nieveTex() {
  const b = sampleTile('Exterior1', 1, 548);
  const shadow = mixc(b, [150, 176, 214], 0.45); const deep = mixc(b, [120, 150, 196], 0.6); const spark = [255, 255, 255, 255];
  return {
    rim: mixc(b, [170, 196, 228], 0.5),
    tex: (x, y) => {
      const f = prints(x, y, deep, spark);
      if (f) return f;
      const h = ph(x, y, 3);
      return h < 0.05 ? spark : h < 0.12 ? shadow : b;
    },
  };
}

function cenizaColors() {
  const sand = sampleTile('ExteriorSafari', 1, 5);
  return tone(gray(sand, 0.92), -52);
}

function cenizaHondaTex() {
  const b = tone(cenizaColors(), -20); // más oscura que el suelo de ceniza para que se lea la barrera
  const deep = tone(b, -44); const lip = tone(b, 20); const fleck = tone(b, -18); const light = tone(b, 12);
  return {
    rim: tone(b, -30),
    tex: (x, y) => {
      const f = prints(x, y, deep, lip);
      if (f) return f;
      const h = ph(x, y, 9);
      return h < 0.1 ? fleck : h < 0.16 ? light : b;
    },
  };
}

/** Suelo de ceniza en mosaico 2×2 (32×32 nativos, periódico). */
function cenizaPattern() {
  const b = cenizaColors();
  const hi = tone(b, 14); const lo = tone(b, -16); const fleck = tone(b, -30);
  const img = new Img(2 * N, 2 * N);
  for (let y = 0; y < 2 * N; y++) {
    for (let x = 0; x < 2 * N; x++) {
      const w = (y + Math.round(2 * Math.sin((2 * Math.PI * x) / 32) + Math.sin((4 * Math.PI * x) / 32))) % 8;
      let c = w === 0 ? hi : w === 1 ? lo : b;
      if (ph(x, y, 21) < 0.05) c = fleck;
      img.set(x, y, c);
    }
  }
  return img;
}

const TERRAINS = {
  grava: () => terrainNine(gravaTex()),
  barro: () => terrainNine(barroTex()),
  arena_honda: () => terrainNine(arenaTex()),
  nieve_honda: () => terrainNine(nieveTex()),
  ceniza_honda: () => terrainNine(cenizaHondaTex()),
  ceniza: cenizaPattern,
};

export const hasTerrainArt = (name) => Boolean(TERRAINS[name]);

/** Arte nativo (16 px/tile) de un terreno del overlay. */
export function drawTerrain(name) {
  const fn = TERRAINS[name];
  if (!fn) throw new Error(`Sin arte para el terreno "${name}"`);
  return fn();
}
