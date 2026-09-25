// Arte propio del Bloque 21 (PROVISIONAL, D30): se dibuja a resolución nativa DS (16 px por casilla) y se amplía ×2,
// con la misma paleta de piedra que el kit común de Pilar (tools/stamps_extra_art.mjs).
//   game/assets/objects/b21_roca.png     cara de roca bajo los bordes de Columna Lanza (hoja 4×4 de 32×32):
//                                        fila 2 cara · fila 4 roca colgante que se pierde en el vacío (4 variantes)
//   game/assets/objects/b21_objetos.png  hoja 4×4 de 32×32: fila 2 Honor Ball (brillo animado) · fila 4 nota de Gael
//                                        · fila 6 Honor Ball abierta (luz verde) · fila 8 destello dorado
// Uso: node tools/b21_assets.mjs [--preview]   (vista previa en tools/cache/pixel/b21_*.png)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, sheet, preview } from './pixel.mjs';
import { STONE, MOSS, GLOW, rng } from './stamps_extra_art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW_DIR = path.join(ROOT, 'tools', 'cache', 'pixel');
const N = 16;
const S = (i) => hex(STONE[Math.max(0, Math.min(STONE.length - 1, i))]);
const A = (c, a) => { const v = typeof c === 'string' ? hex(c) : [...c]; v[3] = a; return v; };
const OUTLINE = hex('#2B2A27');

// ─────────────────────────────── roca bajo la Columna ───────────────────────────────

/** Cara de roca bajo un borde sur: labio claro, estratos verticales que se oscurecen, grietas y musgo. */
function face(seed) {
  const img = new Img(N, N);
  const r = rng(seed * 97 + 11);
  // Estratos horizontales irregulares: cada banda con su tono, más oscura cuanto más abajo.
  const bands = [2, 6, 10, 13].map((y) => y + Math.floor(r() * 2));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let c;
      if (y === 0) c = S(2);
      else if (y === 1) c = S(3);
      else {
        const depth = Math.min(2, Math.floor((y - 2) / 5));
        c = S(4 + depth);
        const seam = bands.some((b) => y === b + ((x * 7 + seed) % 5 === 0 ? 1 : 0));
        if (seam) c = S(Math.min(6, 5 + depth));
        else if (r() < 0.08) c = S(3 + depth);
      }
      img.set(x, y, c);
    }
  }
  // una grieta corta en diagonal
  let gx = 3 + Math.floor(r() * 10);
  for (let y = 3; y < 3 + 4 + Math.floor(r() * 4); y++) {
    img.set(gx, y, OUTLINE);
    if (r() < 0.5) gx = Math.max(1, Math.min(N - 2, gx + (seed % 2 ? 1 : -1)));
  }
  // musgo colgando del labio
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(r() * N);
    const len = 1 + Math.floor(r() * 3);
    for (let y = 2; y < 2 + len; y++) img.set(x, y, hex(MOSS[Math.min(2, y - 2)]));
  }
  // el borde inferior se deshace en picos (continúa en la roca colgante)
  for (let x = 0; x < N; x++) {
    const cut = r() < 0.35 ? 1 : 0;
    for (let y = N - cut; y < N; y++) img.set(x, y, [0, 0, 0, 0]);
  }
  return img;
}

/** Roca colgante: picos que bajan desde arriba y se desvanecen en el vacío. */
function drip(seed) {
  const img = new Img(N, N);
  const r = rng(seed * 53 + 7);
  let x = 0;
  while (x < N) {
    const w = 2 + Math.floor(r() * 4);
    const len = 3 + Math.floor(r() * 11);
    for (let i = 0; i < w && x + i < N; i++) {
      const edge = i === 0 || i === w - 1;
      const l = len - (edge ? 2 + Math.floor(r() * 2) : Math.floor(r() * 2));
      for (let y = 0; y < l; y++) {
        const fade = Math.max(40, 255 - Math.floor((y / Math.max(1, l)) * 200));
        const c = edge ? S(6) : S(y < 3 ? 5 : 6);
        img.set(x + i, y, A(c, y >= l - 1 ? Math.min(fade, 120) : fade));
      }
    }
    x += w + (r() < 0.3 ? 1 : 0);
  }
  return img;
}

// ─────────────────────────────── objetos ───────────────────────────────

/** Honor Ball (PREMIERBALL): blanca con banda roja; `glint` = posición del brillo; `open` = abierta con luz verde. */
function honorBall(glint = 0, { open = false } = {}) {
  const img = new Img(N, N);
  const cx = 7.5; const cy = 10;
  const R = 4.6;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d > R + 0.4) continue;
      let c = d > R - 0.6 ? OUTLINE : hex('#F4F4F0');
      if (d <= R - 0.6) {
        if (Math.abs(y - cy) < 0.7) c = hex('#C83838');
        else if (y > cy) c = hex('#DCDCD6');
      }
      if (Math.hypot(x - cx, y - cy) < 1.3) c = d < 0.8 ? hex('#FFFFFF') : OUTLINE;
      img.set(x, y, c);
    }
  }
  if (open) {
    for (let y = 0; y < 7; y++) for (let x = 4; x < 12; x++) {
      const k = 1 - Math.abs(x - 7.5) / 4;
      if (k > 0 && r01(x, y) < k) img.set(x, y, A(GLOW[y < 3 ? 0 : 1], Math.round(200 * k)));
    }
  } else {
    const gx = [5, 6, 8, 6][glint % 4]; const gy = [7, 8, 7, 7][glint % 4];
    img.set(gx, gy, hex('#FFFFFF'));
    if (glint % 2 === 0) img.set(gx + 1, gy, A('#FFFFFF', 160));
  }
  // sombra en el suelo
  for (let x = 4; x < 12; x++) img.set(x, 15, A('#000000', 70));
  return img;
}

function r01(x, y) { return rng(x * 131 + y * 17 + 5)(); }

/** Nota de Gael sobre la mesa: papel doblado con líneas de letra apretada. */
function note() {
  const img = new Img(N, N);
  for (let y = 8; y < 14; y++) {
    for (let x = 3; x < 13; x++) {
      const border = y === 8 || y === 13 || x === 3 || x === 12;
      img.set(x, y, border ? hex('#8C8470') : hex('#F2ECDA'));
    }
  }
  for (const y of [10, 12]) for (let x = 5; x < 11; x++) if ((x + y) % 3) img.set(x, y, hex('#3C4A6A'));
  img.set(11, 9, hex('#D8CFB6'));
  return img;
}

/** Destello dorado (motas de luz de la Flauta y de las Tablillas). */
function sparkle(phase) {
  const img = new Img(N, N);
  const k = [3, 5, 4, 2][phase % 4];
  for (let i = -k; i <= k; i++) {
    const a = Math.round(255 * (1 - Math.abs(i) / (k + 1)));
    img.set(8 + i, 8, A('#FFE9A0', a));
    img.set(8, 8 + i, A('#FFE9A0', a));
  }
  img.set(8, 8, hex('#FFFFFF'));
  return img;
}

const x2 = (img) => img.scale(2);

function main() {
  const roca = sheet([
    [0, 1, 2, 3].map((i) => x2(face(i + 1))),
    [0, 1, 2, 3].map((i) => x2(drip(i + 1))),
    [0, 1, 2, 3].map((i) => x2(face(i + 11).mirrorX())),
    [0, 1, 2, 3].map((i) => x2(drip(i + 11).mirrorX())),
  ], 32, 32);
  const objetos = sheet([
    [0, 1, 2, 3].map((i) => x2(honorBall(i))),
    [0, 1, 2, 3].map(() => x2(note())),
    [0, 1, 2, 3].map(() => x2(honorBall(0, { open: true }))),
    [0, 1, 2, 3].map((i) => x2(sparkle(i))),
  ], 32, 32);
  const files = [
    roca.save(path.join(OUT_DIR, 'b21_roca.png')),
    objetos.save(path.join(OUT_DIR, 'b21_objetos.png')),
  ];
  if (process.argv.includes('--preview')) {
    files.push(preview(roca, { scale: 3 }).save(path.join(PREVIEW_DIR, 'b21_roca.png')));
    files.push(preview(objetos, { scale: 3 }).save(path.join(PREVIEW_DIR, 'b21_objetos.png')));
  }
  for (const f of files) console.log(`→ ${path.relative(ROOT, f)}`);
}

main();
