// Gráficos de EVENTO para las barreras de campo de Zygarde (CAMPANA §1.1) que no existen en Añil.
// Uso: node tools/stamps_objects.mjs [--preview]
//   game/assets/objects/barreras.png  charset 4×4 de 128×128 (fotogramas de 32×32; arte nativo 16×16 ×2)
//     fila = variante (dir RMXP) · columnas = 4 fotogramas de un brillo verde tenue (stepAnime: true)
//       dir 2  roca agrietada: fisura blanca con brillo verde (Embestida, evento `ramRock`)
//       dir 4  tronco caído agrietado (Embestida)
//       dir 6  vetas verdes de Trepar: SUPERPOSICIÓN transparente para poner sobre cualquier pared (evento `climbWall`)
//       dir 8  roca agrietada con nieve (Embestida en el norte)
// En un mapa: { type: 'ramRock', sprite: 'asset:objects/barreras.png', dir: 2, directionFix: true, stepAnime: true }
// Con --preview deja una ampliación en tools/cache/pixel/obj_barreras.png.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects', 'barreras.png');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel', 'obj_barreras.png');

const ROCK = ['#C9C4B8', '#ADA89C', '#948F84', '#7B776D', '#636058', '#4C4A44'];
const WOOD = ['#C79A62', '#A87C4A', '#8A6238', '#6C4A2A', '#50361F'];
const GLOW = ['#E6FFB0', '#B9FF66', '#7FD84A', '#4E9A32'];
const SNOW = ['#FFFFFF', '#E6EEF8', '#C8D6EA'];
const OUT_ROCK = '#2B2A27';

/** PRNG determinista (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisura en zigzag (coordenadas nativas 16×16) compartida por las rocas.
const CRACK = [[8, 3], [8, 4], [7, 5], [7, 6], [8, 7], [9, 8], [9, 9], [8, 10], [8, 11], [7, 12]];
const BRANCH = [[9, 6], [10, 6], [11, 7], [6, 9], [5, 10]];

/** Intensidad del brillo por fotograma (pulso suave). */
const pulse = (f) => [0, 1, 2, 1][f];

function drawCrack(img, f) {
  const g = pulse(f);
  for (const [x, y] of CRACK) {
    img.set(x, y, hex('#FFFFFF'));
    if (g > 0) img.set(x + 1, y, hex(GLOW[3 - g]));
  }
  for (const [x, y] of BRANCH) img.set(x, y, hex(ROCK[0]));
  if (g === 2) { img.set(8, 7, hex(GLOW[0])); img.set(9, 8, hex(GLOW[1])); }
}

function rock(f, snowy = false) {
  const img = new Img(16, 16);
  const r = rng(7);
  for (let y = 2; y < 16; y++) {
    for (let x = 1; x < 15; x++) {
      const dx = (x + 0.5 - 8) / 7; const dy = (y + 0.5 - 9.5) / 6.8;
      if (dx * dx + dy * dy > 1) continue;
      let s = dx < -0.4 ? 1 : dx > 0.45 ? 3 : 2;
      if (dy < -0.55) s -= 1;
      if (dy > 0.6) s += 1;
      if (r() < 0.12) s += 1;
      img.set(x, y, hex(ROCK[Math.max(0, Math.min(5, s))]));
    }
  }
  if (snowy) {
    for (let x = 3; x < 13; x++) {
      const depth = 2 + ((x * 7) % 3 === 0 ? 1 : 0);
      for (let y = 3; y < 3 + depth; y++) if (img.alpha(x, y)) img.set(x, y, hex(SNOW[y === 3 ? 0 : 1]));
    }
  }
  drawCrack(img, f);
  return outline(img, OUT_ROCK);
}

function log(f) {
  const img = new Img(16, 16);
  const r = rng(11);
  for (let y = 6; y < 14; y++) {
    for (let x = 1; x < 15; x++) {
      const k = (y - 6) / 7;
      let s = k < 0.2 ? 0 : k < 0.5 ? 1 : k < 0.8 ? 2 : 3;
      if (x % 4 === 0 && k > 0.2) s += 1; // vetas de corteza
      if (r() < 0.08) s += 1;
      img.set(x, y, hex(WOOD[Math.min(4, s)]));
    }
  }
  // cara cortada (anillos) a la derecha
  for (let y = 6; y < 14; y++) for (let x = 12; x < 15; x++) img.set(x, y, hex(y === 9 || y === 10 ? WOOD[3] : '#D8B27A'));
  img.set(13, 9, hex(WOOD[4])); img.set(13, 10, hex(WOOD[4]));
  // grieta con brillo
  const g = pulse(f);
  for (const [x, y] of [[6, 6], [6, 7], [7, 8], [7, 9], [6, 10], [6, 11], [7, 12]]) {
    img.set(x, y, hex('#FFF4DC'));
    if (g > 0) img.set(x + 1, y, hex(GLOW[3 - g]));
  }
  // musgo
  for (const [x, y] of [[3, 6], [4, 6], [9, 6], [10, 7]]) img.set(x, y, hex('#6E8A48'));
  return outline(img, '#2A1D12');
}

function veins(f) {
  const img = new Img(16, 16);
  const g = pulse(f);
  const lines = [[3, 0.9], [7, -0.7], [11, 0.6]];
  for (const [x0, ph] of lines) {
    for (let y = 0; y < 16; y++) {
      const x = Math.round(x0 + Math.sin(y / 2.4 + ph) * 1.2);
      img.set(x, y, hex(GLOW[3]));
      img.set(x + 1, y, hex(y % 5 === (f + 1) % 5 && g > 0 ? GLOW[1] : GLOW[2]));
    }
  }
  // asideros (raíces horizontales cortas)
  for (const [x, y] of [[4, 4], [8, 9], [12, 13], [2, 12]]) { img.set(x, y, hex(GLOW[2])); img.set(x + 1, y, hex(GLOW[3])); }
  if (g === 2) for (const [x, y] of [[4, 2], [8, 7], [12, 11]]) img.set(x, y, hex(GLOW[0]));
  return img;
}

function build() {
  const rows = [(f) => rock(f), log, veins, (f) => rock(f, true)];
  const sheet = new Img(128, 128);
  rows.forEach((fn, row) => {
    for (let f = 0; f < 4; f++) sheet.blit(fn(f).scale(2), f * 32, row * 32);
  });
  return sheet;
}

function main() {
  const img = build();
  img.save(OUT);
  console.log(`${path.relative(ROOT, OUT)} (${img.w}×${img.h})`);
  if (process.argv.includes('--preview')) {
    preview(img, { scale: 3, bg: '#5E6A58', grid: 32 }).save(PREVIEW);
    console.log(`  vista → ${path.relative(ROOT, PREVIEW)}`);
  }
}

try {
  main();
} catch (err) {
  console.error(`stamps_objects: ${err.message}`);
  process.exitCode = 1;
}
