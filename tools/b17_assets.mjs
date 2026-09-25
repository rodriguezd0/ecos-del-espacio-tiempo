// Arte propio del Bloque 17 — Interludio 8: Axis en eclipse (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b17_assets.mjs [--preview]
// Hojas de evento 4×4 (índice de fotograma = fila·4 + columna; fila 0 = dir 2, 1 = dir 4, 2 = dir 6, 3 = dir 8):
//   objects/b17_torre_<viento|tormenta|temblor>.png  64×128  torre del Anillo de Captación (fila 0 encendida, 4 pulsos ·
//                                                     fila 1 apagada · fila 2 apagándose, chispas)
//   objects/b17_consola.png      32×32   consola de la torre (fila 0 encendida · 1 apagada · 2 chispas)
//   objects/b17_resonador.png    96×128  Resonador Sintético en construcción con la Cadena Sintética (fila 0, 4 pulsos)
//   objects/b17_piedra.png       32×64   piedra del Círculo del Jardín (fila 0 hundida · 1 hundida y encendida · 2 alzada ·
//                                        3 alzada con luz de luna)
//   panoramas/b17_sima.png       256×256 fondo del vacío de la Sima (se repite; niebla, estratos y motas violeta)
//   panoramas/b17_nubes.png      256×256 mar de nubes visto desde arriba (Mesa de los Vientos; se repite)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PANO = path.join(ROOT, 'game', 'assets', 'panoramas');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = Array.isArray(c) ? [...c, 255] : hex(c); return [v[0], v[1], v[2], a]; };
const GEN = { petrol: '#1F4E5A', petrolHi: '#2F6E7C', white: '#F2F4F5', grey: '#B9C0C4', carbon: '#2B2D31', carbonHi: '#44474E', magenta: '#B03A8C', magentaHi: '#F07AC8', dark: '#17181B' };

function over(img, x, y, c) {
  x = Math.round(x); y = Math.round(y);
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const rect = (img, x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) over(img, x, y, c); };
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) over(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
  }
}
function ring(img, cx, cy, r0, r1, c) {
  for (let y = Math.floor(cy - r1); y <= Math.ceil(cy + r1); y++) {
    for (let x = Math.floor(cx - r1); x <= Math.ceil(cx + r1); x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d >= r0 && d <= r1) over(img, x, y, c);
    }
  }
}
function gridSheet(frames, w, h) {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => frames[r * 4 + c] || new Img(w, h)));
  return sheet(rows, w, h);
}

// ───────────────────────────── Torres del Anillo ─────────────────────────────

const ACCENT = { viento: '#9FE3F0', tormenta: '#FFE15A', temblor: '#D9A25B' };

/** Torre a media resolución (32×64): mástil de celosía sobre zócalo, cabeza colectora por tipo. */
function towerFrame(kind, state, step) {
  const img = new Img(32, 64);
  const on = state === 'on';
  const spark = state === 'spark';
  const acc = rgba(ACCENT[kind]);
  // sombra y zócalo (estrechos: la torre ocupa una sola casilla y no tapa a quien está al lado)
  for (let x = 9; x <= 23; x++) over(img, x, 62, [0, 0, 0, 80]);
  rect(img, 10, 56, 12, 6, rgba(GEN.carbon));
  rect(img, 10, 56, 12, 1, rgba(GEN.carbonHi));
  rect(img, 11, 58, 10, 2, rgba(GEN.petrol));
  rect(img, 13, 58, 2, 2, rgba(on ? GEN.magenta : GEN.carbonHi));
  // patas de celosía
  const legL = (y) => 11 + ((56 - y) * 2) / 44;
  const legR = (y) => 20 - ((56 - y) * 2) / 44;
  for (let y = 14; y <= 56; y++) { over(img, legL(y), y, rgba(GEN.petrol)); over(img, legR(y), y, rgba(GEN.petrol)); }
  for (let y = 14; y <= 56; y++) { over(img, legL(y) + 1, y, rgba(GEN.petrolHi, 180)); }
  for (let y = 18; y < 56; y += 8) {
    line(img, legL(y), y, legR(y + 8), y + 8, rgba(GEN.carbonHi));
    line(img, legR(y), y, legL(y + 8), y + 8, rgba(GEN.carbonHi));
    line(img, legL(y), y, legR(y), y, rgba(GEN.petrol));
  }
  // paneles blancos con el emblema (dos tubos cruzados sobre un círculo, en pequeño)
  rect(img, 13, 30, 6, 7, rgba(GEN.white));
  ring(img, 16, 33.5, 1.4, 2.4, rgba(GEN.magenta, on ? 255 : 150));
  line(img, 14, 31, 18, 36, rgba(GEN.carbon));
  line(img, 18, 31, 14, 36, rgba(GEN.carbon));
  // cabeza colectora
  const glow = on ? 0.55 + 0.45 * Math.sin((step / 4) * Math.PI * 2) : (spark ? (step % 2 ? 0.8 : 0.1) : 0);
  if (kind === 'viento') {
    // el rotor se dibuja después del emisor (abajo), para que se vea por delante del brillo
  } else if (kind === 'tormenta') {
    // bobina alta: anillos apilados y arcos de chispas
    rect(img, 15, 0, 2, 12, rgba(GEN.carbonHi));
    for (let k = 0; k < 5; k++) ring(img, 16, 2 + k * 2.4, 1.6, 4.6 - k * 0.35, rgba(on ? (k % 2 ? GEN.white : ACCENT.tormenta) : GEN.grey));
    if (on || spark) {
      for (let k = 0; k < 2; k++) {
        const sx = [2, 30, 5, 27][(step + k * 2) % 4];
        const sy = 1 + ((step + k) % 3) * 2;
        line(img, 16, 3 + k * 3, (16 + sx) / 2, sy + 3, rgba(ACCENT.tormenta, 230));
        line(img, (16 + sx) / 2, sy + 3, sx, sy, rgba('#FFFFFF', 200));
      }
    }
  } else {
    // perforadora: yunque ocre en lo alto, bielas por el mástil y anillos de temblor en la base
    rect(img, 9, 1, 14, 6, rgba(on ? ACCENT.temblor : GEN.grey));
    rect(img, 9, 1, 14, 1, rgba(GEN.white, 170));
    rect(img, 9, 6, 14, 1, rgba(GEN.carbon));
    const py = on ? [0, 2, 4, 2][step] : 0;
    for (const x of [11, 20]) rect(img, x, 7, 1, 48, rgba(on ? '#A8783C' : GEN.carbonHi));
    rect(img, 10, 50 + Math.round(py / 2), 12, 3, rgba(on ? ACCENT.temblor : GEN.grey));
    if (on) {
      ring(img, 16, 60, 10 + step * 1.5, 11.5 + step * 1.5, rgba(ACCENT.temblor, 150 - step * 30));
      ring(img, 16, 60, 4 + step, 5 + step, rgba(ACCENT.temblor, 110));
    }
  }
  // emisor
  disc(img, 16, 9, 3.2, rgba(GEN.white));
  disc(img, 16, 9, 2.2, rgba(on || spark ? GEN.magenta : GEN.carbon));
  if (glow > 0) {
    disc(img, 16, 9, 1.2, rgba(GEN.magentaHi, Math.round(255 * glow)));
    ring(img, 16, 9, 3.5, 5 + glow * 2, rgba(GEN.magentaHi, Math.round(90 * glow)));
    // hilo de energía que sube (lo que drena)
    for (let y = 0; y < 5; y++) over(img, 16 + ((y + step) % 2), y, rgba(acc.slice(0, 3), Math.round(140 * glow)));
  }
  if (kind === 'viento') {
    // rotor de tres aspas anchas delante del emisor (gira encendida)
    const a0 = on ? (step * Math.PI) / 6 : 0.3;
    for (let k = 0; k < 3; k++) {
      const a = a0 + (k * 2 * Math.PI) / 3;
      for (let w = -1; w <= 1; w++) {
        const ox = -Math.sin(a) * w * 0.8; const oy = Math.cos(a) * w * 0.8;
        line(img, 16 + Math.cos(a) * 3 + ox, 9 + Math.sin(a) * 2 + oy, 16 + Math.cos(a) * 14 + ox, 9 + Math.sin(a) * 8 + oy, rgba(w === 0 ? GEN.white : GEN.grey));
      }
      over(img, 16 + Math.cos(a) * 14, 9 + Math.sin(a) * 8, on ? acc : rgba(GEN.carbonHi));
      over(img, 16 + Math.cos(a) * 13, 9 + Math.sin(a) * 7.5, on ? acc : rgba(GEN.carbonHi));
    }
  }
  if (spark) for (const [x, y] of [[10, 20 + step], [23, 26 - step], [15, 44 + step]]) over(img, x, y, rgba('#FFFFFF'));
  return img.scale(2);
}

const towerSheet = (kind) => gridSheet([
  ...[0, 1, 2, 3].map((s) => towerFrame(kind, 'on', s)),
  ...[0, 1, 2, 3].map(() => towerFrame(kind, 'off', 0)),
  ...[0, 1, 2, 3].map((s) => towerFrame(kind, 'spark', s)),
  ...[0, 1, 2, 3].map(() => towerFrame(kind, 'off', 0)),
], 64, 128);

// ───────────────────────────── Consola ─────────────────────────────

function consoleFrame(state, step) {
  const img = new Img(16, 16);
  for (let x = 3; x <= 12; x++) over(img, x, 15, [0, 0, 0, 70]);
  rect(img, 4, 9, 2, 6, rgba(GEN.carbon));
  rect(img, 10, 9, 2, 6, rgba(GEN.carbon));
  rect(img, 2, 3, 12, 7, rgba(GEN.white));
  rect(img, 2, 3, 12, 1, rgba(GEN.grey));
  rect(img, 3, 4, 10, 4, rgba(GEN.dark));
  if (state === 'on') {
    for (let x = 4; x <= 11; x++) over(img, x, 6 - Math.round(Math.sin((x + step) * 1.3)), rgba(GEN.magentaHi));
    over(img, 12, 8, rgba(step % 2 ? GEN.magentaHi : GEN.magenta));
  } else if (state === 'spark') {
    over(img, 5 + step, 5, rgba('#FFFFFF'));
    over(img, 9, 4 + (step % 2), rgba(GEN.magentaHi));
  } else {
    over(img, 12, 8, rgba(GEN.carbonHi));
  }
  rect(img, 2, 9, 12, 1, rgba(GEN.petrol));
  return img.scale(2);
}
const consoleSheet = () => gridSheet([
  ...[0, 1, 2, 3].map((s) => consoleFrame('on', s)),
  ...[0, 1, 2, 3].map(() => consoleFrame('off', 0)),
  ...[0, 1, 2, 3].map((s) => consoleFrame('spark', s)),
  ...[0, 1, 2, 3].map(() => consoleFrame('off', 0)),
], 32, 32);

// ───────────────────────────── Resonador Sintético ─────────────────────────────

function resonatorFrame(step) {
  const img = new Img(48, 64);
  const g = 0.5 + 0.5 * Math.sin((step / 4) * Math.PI * 2);
  for (let x = 6; x <= 42; x++) over(img, x, 62, [0, 0, 0, 90]);
  // andamio de soporte
  for (const x of [8, 39]) rect(img, x, 30, 2, 32, rgba(GEN.carbon));
  for (let y = 34; y < 62; y += 7) { line(img, 9, y, 39, y + 6, rgba(GEN.carbonHi)); line(img, 39, y, 9, y + 6, rgba(GEN.carbonHi)); }
  rect(img, 6, 58, 36, 4, rgba(GEN.petrol));
  // anillo
  ring(img, 24, 26, 15, 19, rgba(GEN.white));
  ring(img, 24, 26, 15, 16, rgba(GEN.grey));
  ring(img, 24, 26, 18.2, 19, rgba(GEN.carbon));
  // Cadena Sintética: eslabones rojo-magenta que envuelven el anillo
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + step * 0.08;
    const x = 24 + Math.cos(a) * 17; const y = 26 + Math.sin(a) * 17;
    ring(img, x, y, 1.1, 2.3, rgba(k % 2 ? '#8E1F4F' : GEN.magenta));
  }
  // núcleo vacío con destello
  disc(img, 24, 26, 13, rgba('#2A1030', 160));
  disc(img, 24, 26, 3 + g * 3, rgba(GEN.magentaHi, Math.round(80 + 120 * g)));
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + step * 0.4;
    line(img, 24, 26, 24 + Math.cos(a) * 12, 26 + Math.sin(a) * 12, rgba(GEN.magentaHi, Math.round(60 * g)));
  }
  return img.scale(2);
}
const resonatorSheet = () => gridSheet([
  ...[0, 1, 2, 3].map((s) => resonatorFrame(s)),
  ...[0, 1, 2, 3].map((s) => resonatorFrame(s)),
  ...[0, 1, 2, 3].map((s) => resonatorFrame(s)),
  ...[0, 1, 2, 3].map((s) => resonatorFrame(s)),
], 96, 128);

// ───────────────────────────── Piedras del Círculo ─────────────────────────────

const ROCK = { light: '#9FB8B4', mid: '#7C9793', dark: '#556C69', deep: '#3A4B49', lichen: '#B7C96A', lichen2: '#8FA84E' };

function stoneFrame(standing, lit, step) {
  const img = new Img(16, 32);
  if (!standing) {
    for (let x = 2; x <= 13; x++) over(img, x, 30, [0, 0, 0, 60]);
    // losa hexagonal hundida a ras de suelo
    rect(img, 4, 25, 8, 5, rgba(ROCK.mid));
    rect(img, 3, 26, 10, 3, rgba(ROCK.mid));
    rect(img, 4, 25, 8, 1, rgba(ROCK.light));
    rect(img, 3, 28, 10, 1, rgba(ROCK.dark));
    over(img, 6, 27, rgba(ROCK.lichen)); over(img, 9, 26, rgba(ROCK.lichen2)); over(img, 10, 27, rgba(ROCK.lichen));
    // hexágono gastado grabado
    for (const [x, y] of [[7, 26], [8, 26], [6, 27], [9, 27], [7, 28], [8, 28]]) over(img, x, y, rgba(ROCK.deep, 150));
    if (lit) {
      const a = 120 + 60 * Math.sin((step / 4) * Math.PI * 2);
      for (const [x, y] of [[7, 26], [8, 26], [6, 27], [9, 27], [7, 28], [8, 28]]) over(img, x, y, rgba('#EAF6FF', a));
      for (let x = 2; x <= 13; x++) over(img, x, 24, rgba('#DDEBFF', 40));
    }
    return img.scale(2);
  }
  for (let x = 2; x <= 13; x++) over(img, x, 30, [0, 0, 0, 80]);
  // menhir con liquen (como las piedras antiguas del pueblo)
  const top = 8;
  for (let y = top; y <= 29; y++) {
    const t = (y - top) / 21;
    const half = 3 + Math.round(t * 2.2) + (y < top + 2 ? -1 : 0);
    for (let x = 8 - half; x <= 7 + half; x++) over(img, x, y, rgba(ROCK.mid));
    over(img, 8 - half, y, rgba(ROCK.dark));
    over(img, 7 + half, y, rgba(ROCK.deep));
    if (x0Lit(y)) over(img, 8 - half + 1, y, rgba(ROCK.light));
  }
  rect(img, 6, top, 4, 1, rgba(ROCK.light));
  for (const [x, y] of [[6, 14], [9, 18], [5, 22], [10, 24], [7, 26], [8, 11]]) over(img, x, y, rgba(ROCK.lichen));
  for (const [x, y] of [[7, 15], [10, 19], [6, 23]]) over(img, x, y, rgba(ROCK.lichen2));
  // hexágono tallado
  for (const [x, y] of [[7, 17], [8, 17], [6, 18], [9, 18], [7, 19], [8, 19]]) over(img, x, y, rgba(ROCK.deep, 170));
  if (lit) {
    const a = 110 + 70 * Math.sin((step / 4) * Math.PI * 2);
    for (const [x, y] of [[7, 17], [8, 17], [6, 18], [9, 18], [7, 19], [8, 19]]) over(img, x, y, rgba('#F4F8FF', a));
    for (let y = top; y <= 29; y += 3) over(img, 5, y, rgba('#DDEBFF', 70));
  }
  return img.scale(2);
}
function x0Lit(y) { return y % 3 !== 0; }

const stoneSheet = () => gridSheet([
  ...[0, 1, 2, 3].map(() => stoneFrame(false, false, 0)),
  ...[0, 1, 2, 3].map((s) => stoneFrame(false, true, s)),
  ...[0, 1, 2, 3].map(() => stoneFrame(true, false, 0)),
  ...[0, 1, 2, 3].map((s) => stoneFrame(true, true, s)),
], 32, 64);

// ───────────────────────────── Panorama de la Sima ─────────────────────────────

/** Ruido de valor periódico (se repite cada `period` celdas: el panorama se puede teselar). */
function periodicNoise(seed, period) {
  const hash = (i, j) => {
    const a = ((i % period) + period) % period; const b = ((j % period) + period) % period;
    const s = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453;
    return s - Math.floor(s);
  };
  return (x, y) => {
    const i = Math.floor(x); const j = Math.floor(y);
    const fx = x - i; const fy = y - j;
    const u = fx * fx * (3 - 2 * fx); const v = fy * fy * (3 - 2 * fy);
    const a = hash(i, j); const b = hash(i + 1, j); const c = hash(i, j + 1); const d = hash(i + 1, j + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
}

function simaPanorama() {
  const S = 256;
  const img = new Img(S, S);
  const n1 = periodicNoise(1, 8);
  const n2 = periodicNoise(2, 16);
  const n3 = periodicNoise(3, 32);
  const deep = hex('#0B0C19'); const mid = hex('#1B1934'); const mistC = hex('#6E6A9A');
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const u = x / S; const v = y / S;
      const f = 0.55 * n1(u * 8, v * 8) + 0.3 * n2(u * 16, v * 16) + 0.15 * n3(u * 32, v * 32);
      // estratos: bandas horizontales suaves (paredes lejanas de la Sima)
      const strata = 0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 6 + f * 3.1);
      let r = deep[0] + (mid[0] - deep[0]) * (0.35 + 0.65 * f * strata);
      let g = deep[1] + (mid[1] - deep[1]) * (0.35 + 0.65 * f * strata);
      let b = deep[2] + (mid[2] - deep[2]) * (0.35 + 0.65 * f * strata);
      // niebla que sube a jirones
      const mist = Math.min(1, Math.max(0, n2(u * 16 + 3, v * 16) * 0.7 + n1(u * 8 + 5, v * 8) * 0.5 - 0.6) * 1.8);
      r += (mistC[0] - r) * mist * 0.45; g += (mistC[1] - g) * mist * 0.45; b += (mistC[2] - b) * mist * 0.45;
      // pixelado de 2 px (escala del arte)
      img.set(x, y, [Math.round(r), Math.round(g), Math.round(b), 255]);
    }
  }
  // motas violeta (grietas de la crisis que se ven al fondo)
  const n4 = periodicNoise(9, 64);
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      if (n4((x / S) * 64, (y / S) * 64) > 0.975) {
        const c = [200, 150, 255, 255];
        img.set(x, y, c); img.set(x + 1, y, [150, 110, 210, 255]);
      }
    }
  }
  // bloques de 2×2 (misma escala que los tiles)
  const out = new Img(S, S);
  for (let y = 0; y < S; y += 2) for (let x = 0; x < S; x += 2) {
    const c = img.get(x, y);
    out.set(x, y, c); out.set(x + 1, y, c); out.set(x, y + 1, c); out.set(x + 1, y + 1, c);
  }
  return out;
}

/** Mar de nubes visto desde arriba (Mesa de los Vientos): cúmulos blancos sobre un azul pálido, teselable. */
function cloudPanorama() {
  const S = 256;
  const img = new Img(S, S);
  const n1 = periodicNoise(11, 4);
  const n2 = periodicNoise(12, 8);
  const n3 = periodicNoise(13, 16);
  const sky = hex('#7FB4E0'); const shade = hex('#B9D3EC'); const white = hex('#F4F8FC');
  for (let y = 0; y < S; y += 2) {
    for (let x = 0; x < S; x += 2) {
      const u = x / S; const v = y / S;
      const f = 0.5 * n1(u * 4, v * 4) + 0.33 * n2(u * 8, v * 8) + 0.17 * n3(u * 16, v * 16);
      // sombra bajo cada cúmulo: el mismo ruido desplazado hacia abajo
      const g = 0.5 * n1(u * 4, v * 4 - 0.08) + 0.33 * n2(u * 8, v * 8 - 0.16) + 0.17 * n3(u * 16, v * 16 - 0.3);
      let c = sky;
      if (g > 0.44) c = shade;
      if (f > 0.47) c = white;
      if (f > 0.47 && f < 0.5) c = shade;
      const px = [c[0], c[1], c[2], 255];
      img.set(x, y, px); img.set(x + 1, y, px); img.set(x, y + 1, px); img.set(x + 1, y + 1, px);
    }
  }
  return img;
}

// ───────────────────────────── Salida ─────────────────────────────

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PANO, { recursive: true });
  const files = [];
  const save = (img, dir, name) => { files.push(img.save(path.join(dir, name))); return img; };
  const made = {
    torre_viento: save(towerSheet('viento'), OUT, 'b17_torre_viento.png'),
    torre_tormenta: save(towerSheet('tormenta'), OUT, 'b17_torre_tormenta.png'),
    torre_temblor: save(towerSheet('temblor'), OUT, 'b17_torre_temblor.png'),
    consola: save(consoleSheet(), OUT, 'b17_consola.png'),
    resonador: save(resonatorSheet(), OUT, 'b17_resonador.png'),
    piedra: save(stoneSheet(), OUT, 'b17_piedra.png'),
    sima: save(simaPanorama(), PANO, 'b17_sima.png'),
    nubes: save(cloudPanorama(), PANO, 'b17_nubes.png'),
  };
  if (process.argv.includes('--preview')) {
    fs.mkdirSync(PREVIEW, { recursive: true });
    for (const [k, img] of Object.entries(made)) preview(img, { scale: k === 'sima' || k === 'nubes' ? 1 : 2 }).save(path.join(PREVIEW, `b17_${k}.png`));
  }
  for (const f of files) console.log(`→ ${path.relative(ROOT, f || '')}`);
}

main();
