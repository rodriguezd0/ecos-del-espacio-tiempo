// Ilustración PROVISIONAL (D30) del mapa regional de Axis al estilo de los mapas de Añil/BW.
// Uso: node tools/pixel_map.mjs [--preview]
//   → game/assets/ui/region_map.png          (solo relieve, 480×320: la pantalla dibuja encima sus marcadores)
//   → game/assets/ui/region_map_marcado.png  (relieve + caminos + marcadores, referencia y uso sin marcadores)
//   → game/assets/ui/region_map.json         (coordenadas de cada lugar; ver docs/arte.md §6)
// Se pinta a 240×160 nativos y se amplía ×2 exacto (como el resto del arte). Geografía en
// tools/pixel_map_data.mjs (CAMPANA §1.1–1.2).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview } from './pixel.mjs';
import * as D from './pixel_map_data.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'game', 'assets', 'ui');
const S = 2;
const W = D.MAP_W / S;
const H = D.MAP_H / S;

// ───────────────────────────── Ruido determinista ─────────────────────────────

function hash(x, y, seed) {
  let h = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function valueNoise(x, y, seed) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, seed);
  const b = hash(xi + 1, yi, seed);
  const c = hash(xi, yi + 1, seed);
  const d = hash(xi + 1, yi + 1, seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Ruido fractal en [-1, 1]. */
function fbm(x, y, seed, octaves = 4) {
  let sum = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    sum += amp * (valueNoise(x * freq, y * freq, seed + i * 17) * 2 - 1);
    amp *= 0.5;
    freq *= 2;
  }
  return sum;
}

// ───────────────────────────── Geometría ─────────────────────────────

function insidePolygon(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segDist(px, py, [ax, ay], [bx, by]) {
  const vx = bx - ax;
  const vy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy || 1)));
  return Math.hypot(px - ax - t * vx, py - ay - t * vy);
}

/** Distancia con signo a un polígono (positiva dentro). */
function polygonSD(pts, x, y) {
  let d = Infinity;
  for (let i = 0; i < pts.length; i++) d = Math.min(d, segDist(x, y, pts[i], pts[(i + 1) % pts.length]));
  return insidePolygon(pts, x, y) ? d : -d;
}

/** Posición normalizada dentro de una elipse (< 1 dentro). */
const ellQ = (x, y, cx, cy, rx, ry) => Math.hypot((x - cx) / rx, (y - cy) / ry);

/** Distancia de chaflán (4/8 vecinos) a las casillas `src` (máscara booleana). */
function chamfer(src) {
  const INF = 1e9;
  const d = new Float32Array(W * H).map((_, i) => (src[i] ? 0 : INF));
  const pass = (x, y, dx, dy, cost) => {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
    const v = d[ny * W + nx] + cost;
    if (v < d[y * W + x]) d[y * W + x] = v;
  };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { pass(x, y, -1, 0, 1); pass(x, y, 0, -1, 1); pass(x, y, -1, -1, 1.4); pass(x, y, 1, -1, 1.4); }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { pass(x, y, 1, 0, 1); pass(x, y, 0, 1, 1); pass(x, y, 1, 1, 1.4); pass(x, y, -1, 1, 1.4); }
  return d;
}

// ───────────────────────────── Paleta ─────────────────────────────

const C = Object.fromEntries(Object.entries({
  deep: '#3A74C4', sea: '#4A8CD6', shallow: '#74B4E6', foam: '#A6D6F2', wave: '#5A9ADE', cold: '#3E6CB0',
  reef: '#7ED6CE', river: '#5AA8EA', lakeEdge: '#3A6CB0',
  beach: '#E6D6A0', beachShade: '#CCBA84',
  grass: ['#A4DA7A', '#8AC862', '#70AE4E'], hill: ['#8CC468', '#6EAA50', '#56903E'],
  rock: ['#C4AE88', '#A48C6A', '#7E6A50'], peak: ['#B4ACB8', '#948C9A', '#6E6878'],
  highland: ['#A8B478', '#8E9A62', '#727C4C'], mountEdge: '#4E3E30', snowEdge: '#62708C',
  mount: ['#C8B08A', '#A68A68', '#7A624A', '#624C3A'], mountSnow: ['#FFFFFF', '#D6E0EE'],
  hillEdge: '#3E7A34', hillTone: ['#8ACB66', '#6AAE4E'],
  snow: ['#FFFFFF', '#EAF0F8', '#C2CEE0'], forest: ['#6CB858', '#4E9A44', '#3A7A36'],
  lilac: ['#C4B2E4', '#A48ECC', '#7C68A8'], bamboo: ['#B6DC86', '#9CCA70', '#7CAC56'], blossom: '#F4A8C4',
  tropical: ['#5EBE6A', '#3E9C50', '#2A7A3C'], marsh: ['#AAAE7A', '#8C9462', '#6C744A'], pool: '#6A9090',
  desert: ['#D6D2CA', '#B8B4AC', '#96918A'], canyon: ['#E4A86A', '#D08850', '#AE6A3C'],
  meseta: ['#E2D696', '#C8B878', '#A69656'], cliff: '#7E6E44',
  abyss: '#140C20', abyss2: '#2A1A40', glow: '#7A4CC0', rim: '#4A3A5A',
  cloud: '#FFFFFF', cloudShade: '#D8E4F0', cloudEdge: '#9CB0CC', light: '#E8FCFF', beam: '#7CD8F8',
  road: '#F6F4EA', roadShade: '#5C6272', seaRoad: '#E8F4FF',
  townEdge: '#243052', town: '#4AA6EE', townLight: '#B0E4FF', cityCore: '#FFFFFF',
  placeEdge: '#40200E', place: '#D06E3A', placeLight: '#F4A070',
  pillarEdge: '#3A2A08', pillar: '#F2C63E', pillarLight: '#FFF0A0',
  postEdge: '#2A2436', post: '#9A86B8',
  volcano: '#8A5A48', lava: '#F0602C', metal: '#9AA2AE', metalDark: '#5A6270',
}).map(([k, v]) => [k, Array.isArray(v) ? v.map(hex) : hex(v)]));

// ───────────────────────────── Campos ─────────────────────────────

/** Coordenadas del centro del píxel nativo en el espacio 480×320. */
const P = (x, y) => [x * S + S / 2, y * S + S / 2];

function buildLand() {
  const land = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [px, py] = P(x, y);
      let sd = polygonSD(D.MAINLAND, px, py) + fbm(px / 22, py / 22, 11) * 9 + fbm(px / 7, py / 7, 5, 2) * 2;
      for (const [cx, cy, rx, ry] of D.ISLANDS) sd = Math.max(sd, (1 - ellQ(px, py, cx, cy, rx, ry)) * Math.min(rx, ry) + fbm(px / 6, py / 6, 3, 2) * 2);
      land[y * W + x] = sd > 0 ? 1 : 0;
    }
  }
  return land;
}

function buildElevation(land, inland) {
  const e = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!land[i]) { e[i] = -1; continue; }
      const [px, py] = P(x, y);
      // Llanura que sube hacia el interior + colinas suaves de ruido.
      let v = Math.min(inland[i] / 12, 1) * 0.16 + Math.max(0, fbm(px / 64, py / 64, 21)) * 0.3;
      for (const { pts, width, h } of D.RANGES) {
        let d = Infinity;
        for (let k = 0; k + 1 < pts.length; k++) d = Math.min(d, segDist(px, py, pts[k], pts[k + 1]));
        const t = 1 - d / width;
        const ridged = 1 - Math.abs(fbm(px / 20, py / 20, 29, 3)); // crestas y valles
        if (t > 0) v += h * Math.pow(t, 1.3) * (0.55 + 0.6 * ridged);
      }
      for (const [cx, cy, r, h, sharp] of D.PEAKS) {
        const t = 1 - Math.hypot(px - cx, py - cy) / r;
        if (t > 0) v += h * Math.pow(t, 1.1 * sharp) * (0.75 + 0.5 * valueNoise(px / 7, py / 7, 33));
      }
      for (const [cx, cy, rx, ry, h] of D.PLATEAUS) {
        const q = ellQ(px, py, cx, cy, rx, ry) + fbm(px / 10, py / 10, 41, 2) * 0.12;
        if (q < 1) v = Math.max(v, h * Math.min(1, (1 - q) / 0.18));
      }
      e[i] = v;
    }
  }
  return e;
}

function biomeAt(px, py) {
  for (const [name, cx, cy, rx, ry] of D.BIOMES) {
    if (ellQ(px, py, cx, cy, rx, ry) + fbm(px / 12, py / 12, 51, 3) * 0.22 < 1) return name;
  }
  return null;
}

// ───────────────────────────── Pintura ─────────────────────────────

function paintWater(img, land, seaDist) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (land[i]) continue;
      const [px, py] = P(x, y);
      const d = seaDist[i];
      const fjord = px > 320 && px < 392 && py < 110;
      let c = d <= 1.5 ? C.foam : d <= 3.5 ? C.shallow : d <= 7 ? C.sea : C.deep;
      if (fjord && d > 1.5) c = d <= 3.5 ? C.sea : C.cold;
      if (c === C.deep && hash(x, y, 7) < 0.05 && (x + y) % 3 === 0) c = C.wave;
      if (ellQ(px, py, 40, 312, 20, 8) < 1 && hash(x, y, 9) < 0.35) c = C.reef;
      img.set(x, y, c);
    }
  }
}

/** Sombreado por relieve: luz desde arriba-izquierda → índice de tono 0 (luz), 1 (base), 2 (sombra). */
function shadeIndex(e, x, y) {
  const at = (xx, yy) => e[Math.min(H - 1, Math.max(0, yy)) * W + Math.min(W - 1, Math.max(0, xx))];
  const slope = (at(x + 1, y) - at(x - 1, y)) + (at(x, y + 1) - at(x, y - 1));
  if (slope < -0.03) return 0;
  if (slope > 0.03) return 2;
  return 1;
}

/** Tintes por altura (como las capas de relieve de los mapas de Añil) y por bioma. */
function tonesFor(biome, elev, snow, py) {
  if (snow) return C.snow;
  if (biome === 'desert') return C.desert;
  if (biome === 'canyon') return Math.floor(elev * 14 + py / 24) % 2 ? C.canyon : C.rock;
  if (biome === 'meseta') return C.meseta;
  if (biome === 'marsh') return C.marsh;
  if (biome === 'lilac') return C.lilac;
  if (biome === 'bamboo') return C.bamboo;
  if (biome === 'tropical') return C.tropical;
  if (elev > 0.5) return C.highland;
  if (biome === 'forest') return C.forest;
  if (elev > 0.36) return C.hill;
  return C.grass;
}

function paintLand(img, land, e, seaDist) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!land[i]) continue;
      const [px, py] = P(x, y);
      const biome = biomeAt(px, py);
      const elev = e[i];
      const snow = biome !== 'sima' && biome !== 'meseta' && D.coldAt(px, py) + fbm(px / 10, py / 10, 61, 2) * 0.15 > 0.55;
      const tones = tonesFor(biome, elev, snow, py);
      let c = tones[shadeIndex(e, x, y)];
      const coast = seaDist && land[i] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !land[(y + dy) * W + x + dx]);
      if (coast && !snow && elev < 0.3 && !['marsh', 'canyon', 'meseta'].includes(biome)) c = py > 200 ? C.beach : C.beachShade;
      img.set(x, y, c);
      const treeLike = ['forest', 'lilac', 'tropical', 'bamboo'].includes(biome) && !snow && elev <= 0.55;
      if (treeLike && (x + (y % 2) * 2) % 3 === 0 && y % 2 === 0 && hash(x, y, 71) < 0.72) {
        img.set(x, y, tones[2]);
        if (y > 0 && land[i - W]) img.set(x, y - 1, tones[0]);
        if (biome === 'bamboo' && hash(x, y, 73) < 0.35) img.set(x, y - 1, C.blossom);
      }
      if (biome === 'marsh' && hash(x, y, 75) < 0.12) img.set(x, y, C.pool);
    }
  }
}

function plot(img, x, y, c) {
  if (x >= 0 && y >= 0 && x < W && y < H) img.set(x, y, c);
}

/** Línea de Bresenham en coordenadas nativas. */
function line(img, x0, y0, x1, y1, c, { dotted = false } = {}) {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);
  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;
  let n = 0;
  for (;;) {
    if (!dotted || n % 3 !== 2) plot(img, x, y, c);
    n += 1;
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function paintRivers(img) {
  for (const pts of D.RIVERS) {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      line(img, ax / S, ay / S, bx / S, by / S, C.river);
    }
  }
}

function paintLakes(img) {
  for (const [cx, cy, rx, ry] of D.LAKES) {
    for (let y = Math.floor((cy - ry) / S) - 1; y <= Math.ceil((cy + ry) / S) + 1; y++) {
      for (let x = Math.floor((cx - rx) / S) - 1; x <= Math.ceil((cx + rx) / S) + 1; x++) {
        const q = ellQ(...P(x, y), cx, cy, rx, ry);
        if (q < 1) plot(img, x, y, q < 0.6 ? C.shallow : C.river);
        else if (q < 1.35) plot(img, x, y, C.lakeEdge);
      }
    }
  }
}

/** Gran cascada del Monte del Portal (flanco este): caída blanca de 2 px y espuma al pie. */
function paintCascade(img) {
  for (let y = 24; y <= 35; y++) {
    plot(img, 46, y, y % 3 ? C.light : C.foam);
    plot(img, 47, y, y % 3 === 1 ? C.foam : C.shallow);
  }
  for (const x of [44, 45, 48, 49]) plot(img, x, 35, C.foam);
  plot(img, 46, 36, C.foam);
  plot(img, 47, 36, C.foam);
}

/**
 * Montaña ilustrada (triángulo irregular): ladera izquierda iluminada, derecha en sombra, contorno
 * oscuro y casquete de nieve dentado. (mx, base) = pie central; h = altura en píxeles nativos.
 */
function mountain(img, mx, base, h, { snow = false, hill = false, seed = 0 } = {}) {
  const hw = Math.round(h * (hill ? 1.3 : 0.95));
  const cap = snow ? Math.max(2, Math.round(h * 0.42)) : 0;
  for (let r = 0; r <= h; r++) {
    const y = base - h + r;
    const jitter = r > 1 && r < h ? Math.round(hash(r, seed, 91) * 1.6 - 0.8) : 0;
    const w = Math.max(0, Math.round((r / h) * hw) + jitter);
    for (let dx = -w; dx <= w; dx++) {
      const x = mx + dx;
      const edge = Math.abs(dx) === w && r > 0;
      const capHere = r < cap + (hash(x, seed, 93) < 0.5 ? 0 : 1);
      let c;
      if (hill) c = edge ? C.hillEdge : dx <= 0 ? C.hillTone[0] : C.hillTone[1];
      else if (edge || r === 0) c = capHere ? C.snowEdge : C.mountEdge;
      else if (capHere) c = dx <= 0 ? C.mountSnow[0] : C.mountSnow[1];
      else if (dx < 0) c = h >= 8 && (r - dx) % 4 === 0 && r > cap + 1 ? C.mount[1] : C.mount[0]; // estrías en la cara iluminada
      else if (dx === 0) c = C.mount[1];
      else c = h >= 8 && (r + dx) % 4 === 0 ? C.mount[3] : C.mount[2]; // barrancos en la cara en sombra
      plot(img, x, y, c);
    }
  }
}

/** Poblaciones (480×320): las montañas no se dibujan encima. */
const TOWN_SPOTS = Object.values(D.PLACES).filter((p) => p[3] === 'town' || p[3] === 'city').map((p) => D.cellCenter(p[0], p[1]));

/** Cordilleras y colinas: montañas en rejilla con desplazamiento, de atrás adelante. */
function paintMountains(img, land, e) {
  const list = [];
  const STEP = 6;
  for (let gy = 0; gy < H; gy += STEP - 1) {
    for (let gx = (gy / (STEP - 1)) % 2 ? 3 : 0; gx < W; gx += STEP) {
      const x = gx + Math.floor(hash(gx, gy, 95) * 3);
      const y = gy + Math.floor(hash(gy, gx, 97) * 3);
      if (x < 2 || y < 2 || x >= W - 2 || y >= H - 2 || !land[y * W + x]) continue;
      const [px, py] = P(x, y);
      const biome = biomeAt(px, py);
      if (['sima', 'meseta', 'canyon', 'desert', 'marsh'].includes(biome)) continue;
      if (D.LAKES.some(([cx, cy, rx, ry]) => ellQ(px, py, cx, cy + 6, rx + 12, ry + 12) < 1)) continue;
      if (TOWN_SPOTS.some(([tx, ty]) => Math.abs(tx - px) < 14 && py - ty > -6 && py - ty < 22)) continue;
      const elev = e[y * W + x];
      const cold = D.coldAt(px, py);
      if (elev > 0.5) {
        const h = Math.min(12, Math.round(4 + (elev - 0.5) * 16));
        list.push({ x, y: y + 2, h, snow: cold > 0.12 || h >= 9, seed: x * 7 + y });
      } else if (elev > 0.4 && hash(x, y, 99) < 0.45 && cold < 0.4 && !['forest', 'lilac', 'bamboo', 'tropical'].includes(biome)) {
        list.push({ x, y: y + 1, h: 3, hill: true, seed: x + y * 3 });
      }
    }
  }
  list.sort((a, b) => a.y - b.y);
  for (const m of list) mountain(img, m.x, m.y, m.h, m);
  // Hitos por encima de la cordillera: Monte del Portal (noroeste) y Cumbre Azur (la más alta).
  mountain(img, 36, 32, 16, { snow: true, seed: 1 });
  mountain(img, 124, 30, 22, { snow: true, seed: 2 });
}

/** Textura de hierba: matas sueltas un tono más oscuras en las llanuras. */
function paintGrassTufts(img, land) {
  const grass = C.grass.map((c) => c.join());
  for (let y = 1; y < H; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!land[y * W + x] || hash(x, y, 101) > 0.06) continue;
      const here = img.get(x, y).join();
      const i = grass.indexOf(here);
      if (i === 0 || i === 1) { img.set(x, y, C.grass[i + 1]); img.set(x + 1, y - 1, C.grass[i + 1]); }
    }
  }
}

function paintLandmarks(img) {
  // Sima del Eje: abismo con resplandor violeta y borde de roca.
  const [scx, scy, srx, sry] = D.BIOMES.find((b) => b[0] === 'sima').slice(1);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const [px, py] = P(x, y);
      const q = ellQ(px, py, scx, scy, srx, sry) + fbm(px / 8, py / 8, 81, 2) * 0.12;
      if (q >= 1.12) continue;
      let c = C.rim;
      if (q < 0.55) c = C.abyss;
      else if (q < 0.8) c = C.abyss2;
      else if (q < 0.95) c = py < scy ? C.glow : C.abyss2;
      img.set(x, y, c);
    }
  }
  // Cumbre Azur: anillo de nubes a media altura y destello de Columna Lanza en la cima.
  const [kx, apex] = [124, 8]; // cima de la montaña hito dibujada en paintMountains
  for (let a = 0; a < 360; a += 5) {
    const rad = (a * Math.PI) / 180;
    const x = Math.round(kx + Math.cos(rad) * 11);
    const y = Math.round(apex + 9 + Math.sin(rad) * 3);
    if (Math.sin(rad) < -0.2 && Math.abs(x - kx) < 5) continue; // la cima asoma por encima
    plot(img, x, y, Math.sin(rad) > 0.4 ? C.cloudEdge : C.cloud);
    if (Math.sin(rad) > 0) plot(img, x, y - 1, C.cloud);
  }
  for (let y = apex - 7; y <= apex - 1; y++) plot(img, kx, y, y % 2 ? C.beam : C.light);
  plot(img, kx - 1, apex - 1, C.beam);
  plot(img, kx + 1, apex - 1, C.beam);
  // Volcán Tizón: cono y cráter.
  for (let y = 145; y <= 152; y++) for (let x = 159; x <= 169; x++) {
    const t = Math.abs(x - 164) - (y - 145);
    if (t <= 0) plot(img, x, y, x < 164 ? C.volcano : C.rock[2]);
  }
  plot(img, 163, 145, C.lava); plot(img, 164, 145, C.lava); plot(img, 165, 145, C.lava); plot(img, 164, 146, C.lava);
  // Estación Talasa: plataforma metálica.
  for (let y = 154; y <= 157; y++) for (let x = 114; x <= 119; x++) plot(img, x, y, y === 157 || x === 119 ? C.metalDark : C.metal);
  // Bastión Axis: fortaleza sobre el islote.
  for (let y = 142; y <= 147; y++) for (let x = 208; x <= 215; x++) plot(img, x, y, y === 147 || x === 215 ? C.metalDark : C.peak[0]);
  for (const x of [208, 211, 214]) plot(img, x, 141, C.peak[1]);
  // Parque Eólico en la Meseta: tres aerogeneradores.
  for (const [x, y] of [[206, 80], [210, 78], [214, 81]]) { plot(img, x, y, C.cloud); plot(img, x, y + 1, C.metal); plot(img, x - 1, y - 1, C.cloud); plot(img, x + 1, y - 1, C.cloud); }
}

// ───────────────────────────── Caminos y marcadores ─────────────────────────────

const PLACE = (id) => {
  const p = D.PLACES[id];
  if (!p) throw new Error(`Lugar desconocido en un camino: ${id}`);
  return D.cellCenter(p[0], p[1]).map((v) => v / S);
};

/** Camino de 2 px nativos (4 px finales) con sombra, en codo horizontal → vertical. */
function paintPaths(img) {
  const seg = (ax, ay, bx, by, c) => {
    for (const [ox, oy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) line(img, ax + ox, ay + oy, bx + ox, by + oy, c);
  };
  const elbow = (a, b, c, shadow) => {
    const [ax, ay] = PLACE(a);
    const [bx, by] = PLACE(b);
    if (shadow) {
      seg(ax + 1, ay + 1, bx + 1, ay + 1, c);
      seg(bx + 1, ay + 1, bx + 1, by + 1, c);
    } else {
      seg(ax, ay, bx, ay, c);
      seg(bx, ay, bx, by, c);
    }
  };
  for (const [a, b] of D.PATHS) elbow(a, b, C.roadShade, true);
  for (const [a, b] of D.PATHS) elbow(a, b, C.road, false);
  for (const [a, b] of D.SEA_PATHS) {
    const [ax, ay] = PLACE(a);
    const [bx, by] = PLACE(b);
    line(img, ax, ay, bx, by, C.seaRoad, { dotted: true });
  }
}

function rectFill(img, x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) plot(img, x, y, c);
}

/** Marcador centrado en (cx, cy) nativo: tamaño par para que su centro caiga en la esquina de píxel. */
function marker(img, cx, cy, kind) {
  if (kind === 'city') {
    rectFill(img, cx - 3, cy - 3, 6, 6, C.townEdge);
    rectFill(img, cx - 2, cy - 2, 4, 4, C.town);
    rectFill(img, cx - 2, cy - 2, 2, 1, C.townLight);
    rectFill(img, cx - 1, cy - 1, 2, 2, C.cityCore);
  } else if (kind === 'town') {
    rectFill(img, cx - 3, cy - 3, 6, 6, C.townEdge);
    rectFill(img, cx - 2, cy - 2, 4, 4, C.town);
    rectFill(img, cx - 2, cy - 2, 2, 1, C.townLight);
  } else if (kind === 'pillar') {
    // Rombo de 4×4 (esquinas libres): borde oscuro, centro dorado con brillo.
    rectFill(img, cx - 1, cy - 2, 2, 4, C.pillarEdge);
    rectFill(img, cx - 2, cy - 1, 4, 2, C.pillarEdge);
    rectFill(img, cx - 1, cy - 1, 2, 2, C.pillar);
    plot(img, cx - 1, cy - 1, C.pillarLight);
  } else if (kind === 'place' || kind === 'post') {
    rectFill(img, cx - 2, cy - 2, 4, 4, kind === 'post' ? C.postEdge : C.placeEdge);
    rectFill(img, cx - 1, cy - 1, 2, 2, kind === 'post' ? C.post : C.place);
    plot(img, cx - 1, cy - 1, C.placeLight);
  }
}

function paintMarkers(img) {
  for (const [cx, cy, , kind, extra] of Object.values(D.PLACES)) {
    if (kind === 'route' || kind === 'sea' || extra?.parent) continue;
    const [x, y] = D.cellCenter(cx, cy).map((v) => v / S);
    marker(img, x, y, kind);
  }
}

// ───────────────────────────── Salida ─────────────────────────────

export function buildRegionJson() {
  const places = {};
  const coords = {};
  const cells = new Map();
  for (const [id, [cx, cy, name, kind, extra = {}]] of Object.entries(D.PLACES)) {
    const xy = D.cellCenter(cx, cy);
    if (!extra.parent) {
      const key = `${cx},${cy}`;
      if (cells.has(key)) throw new Error(`Casilla ${key} repetida: ${cells.get(key)} y ${id}`);
      cells.set(key, id);
    }
    coords[id] = xy;
    places[id] = { name, kind, xy, cell: [cx, cy], ...extra };
  }
  return {
    provisional: 'D30 · X02',
    note: 'Coordenadas en píxeles del PNG de 480×320 (centro de casilla de 16 px). Generado por tools/pixel_map.mjs.',
    image: 'assets/ui/region_map.png', // solo relieve
    marked: 'assets/ui/region_map_marcado.png', // con caminos y marcadores
    width: D.MAP_W,
    height: D.MAP_H,
    cell: D.CELL,
    coords,
    places,
    paths: D.PATHS,
    seaPaths: D.SEA_PATHS,
  };
}

export function renderRegionMap() {
  const land = buildLand();
  const seaDist = chamfer(land);
  const inland = chamfer(land.map((v) => (v ? 0 : 1)));
  const e = buildElevation(land, inland);
  const base = new Img(W, H);
  paintWater(base, land, seaDist);
  paintLand(base, land, e, seaDist);
  paintGrassTufts(base, land);
  paintRivers(base);
  paintMountains(base, land, e);
  paintLakes(base);
  paintCascade(base);
  paintLandmarks(base);
  const full = base.clone();
  paintPaths(full);
  paintMarkers(full);
  return { base, full };
}

function main() {
  const { base, full } = renderRegionMap();
  base.scale(S).save(path.join(OUT_DIR, 'region_map.png'));
  full.scale(S).save(path.join(OUT_DIR, 'region_map_marcado.png'));
  const json = buildRegionJson();
  // Arrays de primitivos en una sola línea (legible y compacto).
  const text = JSON.stringify(json, null, 1).replace(/\[\s*((?:"[^"]*"|-?[\d.]+)(?:,\s*(?:"[^"]*"|-?[\d.]+))*)\s*\]/g,
    (_, inner) => `[${inner.split(/,\s*/).join(', ')}]`);
  fs.writeFileSync(path.join(OUT_DIR, 'region_map.json'), `${text}\n`);
  console.log(`✓ game/assets/ui/region_map.png, region_map_marcado.png, region_map.json (${Object.keys(json.places).length} lugares)`);
  if (process.argv.includes('--preview')) {
    const file = path.join(ROOT, 'tools', 'cache', 'pixel', '_region_map.png');
    preview(full, { scale: 4, grid: 8, gridColor: '#FFFFFF30' }).save(file);
    console.log(`  vista → ${path.relative(ROOT, file)}`);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exitCode = 1;
  }
}
