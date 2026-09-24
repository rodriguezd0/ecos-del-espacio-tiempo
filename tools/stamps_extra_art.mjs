// Arte procedural del kit común de Pilar (X23) para el overlay de tiles (tools/stamps_extra.mjs).
// Se dibuja a resolución nativa DS (16 px por tile) y se amplía ×2, como el arte de Añil.
// Piedra neutra (el tinte de cada Pilar lo pone el tono del mapa: content/stamps/pilar.js), acentos
// violeta (aristas, glifos), verde hexagonal (Zygarde, zócalos vivos) y agua luminosa (canales, manantial).
import { Img, hex, outline } from './pixel.mjs';

export const N = 16; // píxeles nativos por tile

export const STONE = ['#D2CFC2', '#BDB9AB', '#A7A395', '#908C7F', '#79766A', '#625F56', '#4B4943'];
export const OUT = '#2B2A27';
export const VIOLET = ['#F2E4FF', '#D3B2FF', '#9D63E6', '#6936B4', '#3D1C6E'];
export const WATER = ['#E4FAFF', '#8AD8F2', '#44A6D8', '#2C74B2', '#1F4E86'];
export const GLOW = ['#F0FFC8', '#B9FF66', '#72CF4B', '#3F8A30'];
export const MOSS = ['#869E5E', '#6A8249', '#51683A'];

/** PRNG determinista (mulberry32). */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const S = (i) => hex(STONE[Math.max(0, Math.min(STONE.length - 1, i))]);
const C = (c, a = 255) => { const v = hex(c); v[3] = a; return v; };
export const stone = S;

/** Hexágono de lados planos arriba/abajo (flat-top) de "radio" R centrado en (cx, cy). */
export function inHex(x, y, cx, cy, R) {
  const dx = Math.abs(x + 0.5 - cx); const dy = Math.abs(y + 0.5 - cy);
  return dy <= R * 0.866 && dx + dy * 0.577 <= R;
}

function fillRect(img, x, y, w, h, col) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) img.set(i, j, col);
}

/** Surco hexagonal (contorno) y relleno opcional. */
function hexGroove(img, cx, cy, R, { groove = S(5), fill = null, glow = null } = {}) {
  const r = Math.ceil(R) + 1;
  for (let y = Math.floor(cy - r); y <= cy + r; y++) {
    for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      if (!inHex(x, y, cx, cy, R)) continue;
      if (!inHex(x, y, cx, cy, R - 1)) img.set(x, y, groove);
      else if (fill) img.set(x, y, fill);
    }
  }
  if (glow) {
    img.set(Math.floor(cx) - 1, Math.floor(cy) - 1, glow[0]); img.set(Math.floor(cx), Math.floor(cy) - 1, glow[1]);
    img.set(Math.floor(cx) - 1, Math.floor(cy), glow[1]); img.set(Math.floor(cx), Math.floor(cy), glow[2]);
  }
}

/** Musgo disperso sobre píxeles opacos en una franja. */
function moss(img, r, n, x0, y0, w, h) {
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.floor(r() * w); const y = y0 + Math.floor(r() * h);
    if (!img.alpha(x, y)) continue;
    img.set(x, y, hex(MOSS[Math.floor(r() * MOSS.length)]));
    if (r() < 0.5 && img.alpha(x + 1, y)) img.set(x + 1, y, hex(MOSS[1]));
  }
}

/** Fuste de columna con acanaladuras entre x0..x0+w-1 y y0..y1. */
function shaft(img, x0, w, y0, y1, r) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const k = (x - x0) / (w - 1);
      let s = k < 0.2 ? 1 : k < 0.5 ? 2 : k < 0.8 ? 3 : 4;
      if ([2, 5, 8].includes(x - x0) && w >= 9) s += 1;
      if (r() < 0.05) s += 1;
      img.set(x, y, S(s));
    }
  }
}

/** Basa o plinto (cara superior clara y frente). */
function plinth(img, x0, w, y0, h) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const top = y - y0 < 2;
      const k = (x - x0) / (w - 1);
      img.set(x, y, top ? S(k > 0.85 ? 2 : 1) : S(k < 0.15 ? 2 : k > 0.85 ? 4 : 3));
    }
  }
  for (let x = x0 + 3; x < x0 + w - 1; x += 7) img.set(x, y0 + 3, S(5));
}

// ───────────────────────────── Piezas verticales ─────────────────────────────

function monolito() {
  const img = new Img(2 * N, 3 * N);
  const r = rng(101);
  plinth(img, 2, 28, 40, 7);
  for (let x = 7; x <= 24; x++) {
    let top = 4 + Math.round((x - 7) * 0.22);
    if (x >= 22) top += (x - 21) * 2;
    for (let y = top; y <= 40; y++) {
      let s = x <= 8 ? 1 : x <= 10 ? 2 : x >= 23 ? 4 : x >= 21 ? 3 : 2;
      if (y <= top + 1) s = Math.max(0, s - 2);
      else if (r() < 0.1) s += 1;
      img.set(x, y, S(s));
    }
  }
  const gl = [hex(VIOLET[1]), hex(VIOLET[2]), hex(VIOLET[3])];
  for (const cy of [13, 22, 31]) hexGroove(img, 16, cy, 4.2, { fill: S(3), glow: gl });
  for (const [a, b] of [[16.5, 19], [25.5, 28]]) for (let y = Math.floor(a); y <= b; y++) img.set(15, y, S(5));
  for (let i = 0; i < 6; i++) img.set(21 + (i % 2), 9 + i * 2, S(5)); // grieta
  moss(img, r, 18, 7, 30, 18, 14);
  moss(img, r, 10, 2, 40, 28, 4);
  return outline(img, OUT);
}

function columna() {
  const img = new Img(N, 3 * N);
  const r = rng(202);
  plinth(img, 1, 14, 41, 6);
  shaft(img, 3, 10, 9, 40, r);
  fillRect(img, 1, 4, 14, 1, S(0));
  fillRect(img, 1, 5, 14, 2, S(1));
  fillRect(img, 2, 7, 12, 2, S(3));
  hexGroove(img, 8, 24, 2.6, { fill: S(3) });
  moss(img, r, 8, 3, 30, 10, 12);
  return outline(img, OUT);
}

function columnaQuebrada() {
  const img = new Img(N, 2 * N);
  const r = rng(303);
  plinth(img, 1, 14, 25, 6);
  for (let x = 3; x <= 12; x++) {
    const top = 8 + Math.floor(r() * 5) + (x > 8 ? 2 : 0);
    for (let y = top; y <= 24; y++) {
      const k = (x - 3) / 9;
      img.set(x, y, S(k < 0.2 ? 1 : k < 0.5 ? 2 : k < 0.8 ? 3 : 4));
    }
    img.set(x, top, S(0));
  }
  // cascotes
  for (const [sx, sy, w, h] of [[0, 27, 3, 3], [12, 28, 4, 3], [5, 29, 3, 2]]) {
    for (let y = sy; y < sy + h; y++) for (let x = sx; x < sx + w; x++) img.set(x, y, S(y === sy ? 1 : 3));
  }
  moss(img, r, 8, 3, 14, 10, 14);
  return outline(img, OUT);
}

function dintel() {
  const img = new Img(5 * N, 4 * N);
  const r = rng(404);
  // sombra de la viga sobre el suelo (translúcida), solo en la fila 1
  for (let y = 17; y <= 24; y++) for (let x = 16; x <= 63; x++) img.set(x, y, [20, 18, 24, 70 - (y - 17) * 8]);
  for (const x0 of [3, 65]) {
    plinth(img, x0 - 2, 16, 57, 6);
    shaft(img, x0, 12, 16, 56, r);
    hexGroove(img, x0 + 6, 36, 2.6, { fill: S(3) });
  }
  for (let y = 3; y <= 16; y++) {
    for (let x = 0; x <= 79; x++) {
      let s = y <= 4 ? 0 : y <= 5 ? 1 : y >= 15 ? 4 : 2;
      if (y > 5 && y < 15 && r() < 0.08) s += 1;
      if (x <= 1 && y > 5) s = 1;
      if (x >= 78 && y > 5) s = 4;
      img.set(x, y, S(s));
    }
  }
  for (let i = 0; i < 7; i++) {
    const cx = 7 + i * 11 + (i >= 3 ? 1 : 0);
    if (i === 3) continue;
    hexGroove(img, cx, 10.5, 3.2, { fill: S(3) });
  }
  hexGroove(img, 40, 10.5, 5, { fill: S(4), glow: [hex(VIOLET[1]), hex(VIOLET[2]), hex(VIOLET[3])] });
  moss(img, r, 16, 0, 3, 80, 4);
  moss(img, r, 10, 1, 44, 78, 14);
  const out = outline(img, OUT);
  // el contorno no debe invadir las celdas vacías del hueco (filas 2–3, columnas 1–3)
  for (let y = 32; y < 64; y++) for (let x = 16; x < 64; x++) out.set(x, y, [0, 0, 0, 0]);
  return out;
}

const GLYPHS = [
  ['.###.', '#...#', '#.#.#', '#...#', '.###.'],
  ['#...#', '.#.#.', '..#..', '.###.', '#.#.#'],
  ['.##..', '#..#.', '#.##.', '#..#.', '.##.#'],
  ['..#..', '.#.#.', '#.#.#', '.#.#.', '..#..'],
  ['###..', '#.#..', '###.#', '..#.#', '..###'],
  ['#.#.#', '.###.', '##.##', '.###.', '#.#.#'],
];

function glyph(img, g, x0, y0, col = S(5), eye = null) {
  GLYPHS[g].forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '#') img.set(x0 + i, y0 + j, col); }));
  if (eye) img.set(x0 + 2, y0 + 2, eye);
}

function placaUnown() {
  const img = new Img(2 * N, 2 * N);
  const r = rng(505);
  plinth(img, 3, 26, 26, 5);
  for (let y = 2; y <= 26; y++) {
    const inset = y === 2 ? 4 : y === 3 ? 2 : y === 4 ? 1 : 0;
    for (let x = 5 + inset; x <= 26 - inset; x++) {
      let s = x <= 6 ? 1 : x >= 25 ? 4 : 2;
      if (y <= 3) s = 0;
      if (r() < 0.07) s += 1;
      img.set(x, y, S(s));
    }
  }
  const eye = hex(VIOLET[2]);
  let g = 0;
  for (const y0 of [6, 13, 19]) for (const x0 of [8, 14, 20]) { glyph(img, g % GLYPHS.length, x0, y0, S(5), g % 3 === 0 ? eye : null); g++; }
  moss(img, r, 8, 5, 20, 22, 7);
  return outline(img, OUT);
}

function glifoSuelo(which) {
  const img = new Img(N, N);
  const r = rng(606 + which);
  for (let y = 1; y <= 14; y++) {
    for (let x = 1; x <= 14; x++) {
      if ((x === 1 || x === 14) && (y === 1 || y === 14)) continue;
      let s = y <= 2 || x <= 2 ? 1 : y >= 13 || x >= 13 ? 3 : 2;
      if (r() < 0.08) s += 1;
      img.set(x, y, S(s));
    }
  }
  glyph(img, which, 5, 5, S(5), hex(VIOLET[2]));
  return outline(img, STONE[6]);
}

function pedestal() {
  const img = new Img(N, 2 * N);
  // cuerpo (prisma hexagonal visto de frente)
  for (let y = 9; y <= 26; y++) {
    for (let x = 1; x <= 14; x++) img.set(x, y, S(x <= 4 ? 2 : x <= 10 ? 3 : 4));
  }
  fillRect(img, 1, 16, 14, 1, S(5));
  hexGroove(img, 8, 21, 2.2, { fill: S(3) });
  plinth(img, 0, 16, 26, 5);
  // cara superior hexagonal con el hueco del Fragmento
  for (let y = 1; y <= 14; y++) {
    for (let x = 0; x < N; x++) {
      if (!inHex(x, y, 8, 8.5, 7.6)) continue;
      img.set(x, y, S(y < 8 ? 0 : 1));
    }
  }
  hexGroove(img, 8, 8.5, 3.6, { groove: hex(VIOLET[3]), fill: S(6) });
  img.set(7, 8, hex(VIOLET[2])); img.set(8, 8, hex(VIOLET[1]));
  return outline(img, OUT);
}

function shard(img, tipX, tipY, baseY, half, lean = 0) {
  for (let y = tipY; y <= baseY; y++) {
    const t = (y - tipY) / Math.max(1, baseY - tipY);
    const hw = Math.max(0.5, half * Math.min(1, t * 1.6));
    const cx = tipX + lean * t;
    for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
      let c = x < cx - hw + 1 ? VIOLET[0] : x < cx ? VIOLET[1] : x < cx + hw - 1 ? VIOLET[2] : VIOLET[3];
      if (y > baseY - 2) c = VIOLET[3];
      img.set(x, y, hex(c));
    }
  }
}

function arista() {
  const img = new Img(N, 2 * N);
  for (let x = 2; x <= 13; x++) for (let y = 27; y <= 30; y++) img.set(x, y, S(y === 27 ? 2 : 4));
  shard(img, 11, 14, 28, 2.2, 1);
  shard(img, 7, 2, 28, 4, -1);
  return outline(img, VIOLET[4]);
}

function aristaGrande() {
  const img = new Img(2 * N, 2 * N);
  for (let x = 2; x <= 29; x++) for (let y = 27; y <= 30; y++) img.set(x, y, S(y === 27 ? 2 : 4));
  shard(img, 7, 10, 28, 3.2, -1);
  shard(img, 24, 8, 28, 3.6, 1);
  shard(img, 15, 1, 29, 5, 0);
  return outline(img, VIOLET[4]);
}

function manantial() {
  const img = new Img(3 * N, 3 * N);
  const r = rng(707);
  const cx = 24; const cy = 23;
  const inE = (x, y, rx, ry, oy = 0) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - (cy + oy)) / ry) ** 2 <= 1;
  // frente del pilón (cilindro)
  for (let x = 2; x <= 45; x++) {
    for (let y = 0; y < 48; y++) {
      if (!inE(x, y, 22, 18, 5) || inE(x, y, 22, 18)) continue;
      img.set(x, y, S(x < 12 ? 3 : x > 36 ? 5 : 4));
    }
  }
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 48; x++) {
      if (!inE(x, y, 22, 18)) continue;
      if (!inE(x, y, 17, 13)) { img.set(x, y, S(y < cy ? 1 : 2 + (r() < 0.1 ? 1 : 0))); continue; }
      const d = Math.hypot((x + 0.5 - cx) / 17, (y + 0.5 - cy) / 13);
      const ring = Math.abs(((d * 3.2) % 1) - 0.5) < 0.12;
      img.set(x, y, hex(ring ? WATER[1] : d > 0.85 ? WATER[3] : WATER[2]));
    }
  }
  // surtidor central
  for (let y = cy - 4; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 2; x++) img.set(x, y, S(x < cx - 1 ? 1 : x > cx ? 4 : 2));
  for (const [x, y] of [[23, 13], [24, 12], [22, 15], [25, 14], [20, 17], [27, 16], [19, 19], [28, 19], [24, 10]]) img.set(x, y, hex(WATER[0]));
  for (const [x, y] of [[22, 14], [25, 13], [21, 16], [26, 15]]) img.set(x, y, hex(WATER[1]));
  moss(img, r, 14, 4, 8, 40, 30);
  return outline(img, OUT);
}

// ───────────────────────────── Suelos y calcos ─────────────────────────────

function escalinata(w) {
  const img = new Img(w * N, 3 * N);
  const r = rng(808 + w);
  const W = w * N;
  for (let k = 0; k < 5; k++) {
    const y0 = k * 9 + 2;
    for (let y = y0; y < y0 + 9 && y < 48; y++) {
      for (let x = 0; x < W; x++) {
        const tread = y - y0 < 3;
        let s = tread ? (y === y0 ? 0 : 1) : (y - y0 < 5 ? 3 : 4);
        if (x <= 1) s += 1;
        if (x >= W - 2) s += 2;
        if (!tread && r() < 0.06) s += 1;
        img.set(x, y, S(s));
      }
    }
  }
  for (let x = 0; x < W; x++) { img.set(x, 0, S(2)); img.set(x, 1, S(1)); }
  moss(img, r, w * 5, 0, 0, W, 48);
  return img;
}

function camaraNucleo() {
  const img = new Img(5 * N, 5 * N);
  const cx = 40; const cy = 40; const R = 37;
  for (let y = 0; y < 80; y++) {
    for (let x = 0; x < 80; x++) {
      if (!inHex(x, y, cx, cy, R)) continue;
      if (!inHex(x, y, cx, cy, R - 2)) img.set(x, y, C(STONE[5], 210));
      else if (!inHex(x, y, cx, cy, R - 3)) img.set(x, y, C(GLOW[2], 150));
      else if (!inHex(x, y, cx, cy, R - 4)) img.set(x, y, C(STONE[5], 150));
      else img.set(x, y, C(STONE[1], 45));
    }
  }
  for (let a = 0; a < 6; a++) {
    const ang = (a * Math.PI) / 3;
    for (let t = 11; t <= R - 5; t += 0.5) {
      const x = Math.round(cx + Math.cos(ang) * t - 0.5); const y = Math.round(cy + Math.sin(ang) * t * 0.866 - 0.5);
      img.set(x, y, C(STONE[5], 200));
      img.set(x, y + 1, C(GLOW[3], 120));
    }
    const vx = cx + Math.cos(ang) * (R - 6); const vy = cy + Math.sin(ang) * (R - 6) * 0.866;
    hexGroove(img, vx, vy, 3.4, { groove: S(5), fill: S(2) });
  }
  hexGroove(img, cx, cy, 10, { groove: S(5), fill: S(4) });
  hexGroove(img, cx, cy, 7, { groove: hex(GLOW[2]), fill: S(6) });
  hexGroove(img, cx, cy, 3, { groove: hex(GLOW[1]), fill: hex(GLOW[0]) });
  return img;
}

function zocalo(kind) {
  const img = new Img(N, N);
  const r = rng(909 + kind.length);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inHex(x, y - 2, 8, 8, 7.4)) img.set(x, y, S(4));
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (!inHex(x, y, 8, 7.4, 7.4)) continue;
      img.set(x, y, S(y < 6 ? 1 : 2));
    }
  }
  hexGroove(img, 8, 7.4, 3.8, { groove: kind === 'vivo' ? hex(GLOW[1]) : S(4), fill: kind === 'vivo' ? hex(GLOW[2]) : null });
  if (kind === 'vivo') { img.set(7, 7, hex(GLOW[0])); img.set(8, 7, hex(GLOW[0])); }
  if (kind === 'gastado') {
    for (const [x, y] of [[3, 4], [4, 5], [4, 6], [5, 7], [11, 9], [12, 10], [12, 11]]) img.set(x, y, S(5));
    for (const [x, y] of [[1, 7], [2, 3], [14, 8], [13, 12], [9, 13]]) img.set(x, y, [0, 0, 0, 0]);
    moss(img, r, 6, 1, 1, 14, 13);
  }
  return outline(img, STONE[6]);
}

function losaEco() {
  const img = new Img(2 * N, 2 * N);
  const r = rng(1010);
  for (let y = 1; y <= 30; y++) {
    for (let x = 1; x <= 30; x++) {
      if ((x <= 2 || x >= 29) && (y <= 2 || y >= 29) && !((x === 2 || x === 29) && (y === 2 || y === 29))) continue;
      let s = y <= 2 || x <= 2 ? 1 : y >= 29 || x >= 29 ? 3 : 2;
      if (r() < 0.06) s += 1;
      img.set(x, y, S(s));
    }
  }
  for (let y = 3; y <= 28; y++) {
    for (let x = 3; x <= 28; x++) {
      const d = Math.hypot(x + 0.5 - 16, y + 0.5 - 16);
      for (const [rad, col] of [[4, VIOLET[2]], [8, STONE[5]], [12, VIOLET[3]]]) if (Math.abs(d - rad) < 0.62) img.set(x, y, hex(col));
    }
  }
  img.set(15, 15, hex(VIOLET[1])); img.set(16, 15, hex(VIOLET[0])); img.set(15, 16, hex(VIOLET[1])); img.set(16, 16, hex(VIOLET[1]));
  return outline(img, STONE[6]);
}

/** Canal de resonancia: tira de 3 tiles (inicio, medio repetible, fin) en horizontal. */
function canalH() {
  const img = new Img(3 * N, N);
  for (let x = 0; x < 3 * N; x++) {
    const left = x < 4; const right = x > 3 * N - 5;
    for (let y = 2; y <= 13; y++) {
      const inset = left ? 4 - x : right ? x - (3 * N - 5) : 0;
      if (y < 2 + inset || y > 13 - inset) continue;
      let c;
      if (y <= 3 + inset) c = S(1);
      else if (y >= 12 - inset) c = S(4);
      else if (y === 7 || y === 8) c = hex(x % 8 === 3 || x % 8 === 4 ? WATER[0] : WATER[1]);
      else c = hex(y < 7 ? WATER[2] : WATER[3]);
      if (left && x === 0) c = S(3);
      img.set(x, y, c);
    }
  }
  return outline(img, STONE[6]);
}

function transpose(img) {
  const out = new Img(img.h, img.w);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) out.set(y, x, img.get(x, y));
  return out;
}

/** Enlosado (nine): 3×3 + esquinas cóncavas 2×2 a la derecha (5×3 tiles). */
function enlosado() {
  const img = new Img(5 * N, 3 * N);
  const base = (x, y, t) => {
    const lx = ((x % N) + N) % N; const ly = ((y % N) + N) % N;
    const top = ly < 8;
    const mortar = ly === 0 || ly === 8 || (top ? lx === 0 || lx === 8 : lx === 4 || lx === 12);
    if (mortar) return S(4);
    const stoneIdx = top ? (lx < 8 ? 0 : 1) : (lx >= 4 && lx < 12 ? 2 : 3);
    const h = rng(t * 31 + stoneIdx * 7 + 3)();
    let s = h < 0.33 ? 1 : h < 0.66 ? 2 : 3;
    if ((top ? ly === 1 : ly === 9)) s -= 1;
    if (rng(x * 131 + y * 17 + t)() < 0.07) s += 1;
    return S(s);
  };
  const curb = (edge, lx, ly) => {
    if (edge === 'n') return ly <= 2 ? (ly === 0 ? S(2) : S(ly === 1 ? 3 : 5)) : null;
    if (edge === 's') return ly >= 13 ? (ly === 15 ? S(6) : S(ly === 13 ? 2 : 4)) : null;
    if (edge === 'w') return lx <= 2 ? (lx === 0 ? S(2) : S(lx === 1 ? 3 : 5)) : null;
    if (edge === 'e') return lx >= 13 ? (lx === 15 ? S(6) : S(lx === 13 ? 2 : 4)) : null;
    return null;
  };
  for (let ty = 0; ty < 3; ty++) {
    for (let tx = 0; tx < 5; tx++) {
      if (tx >= 3 && ty === 2) continue;
      const edges = [];
      if (tx < 3) {
        if (ty === 0) edges.push('n');
        if (ty === 2) edges.push('s');
        if (tx === 0) edges.push('w');
        if (tx === 2) edges.push('e');
      }
      for (let ly = 0; ly < N; ly++) {
        for (let lx = 0; lx < N; lx++) {
          let c = base(lx, ly, 1);
          for (const e of edges) c = curb(e, lx, ly) || c;
          if (tx >= 3) {
            // esquinas cóncavas: NO, NE / SO, SE
            const q = (tx - 3) + 2 * ty;
            const cxn = q % 2 === 0 ? lx <= 2 : lx >= 13;
            const cyn = q < 2 ? ly <= 2 : ly >= 13;
            if (cxn && cyn) c = S(5);
          }
          img.set(tx * N + lx, ty * N + ly, c);
        }
      }
    }
  }
  return img;
}

const PIECES = {
  pilar_monolito: monolito,
  pilar_columna: columna,
  pilar_columna_quebrada: columnaQuebrada,
  pilar_dintel: dintel,
  pilar_placa_unown: placaUnown,
  pilar_glifo: () => glifoSuelo(0),
  pilar_glifo_2: () => glifoSuelo(4),
  pilar_pedestal: pedestal,
  pilar_escalinata: () => escalinata(3),
  pilar_escalinata_ancha: () => escalinata(5),
  pilar_camara_nucleo: camaraNucleo,
  pilar_zocalo: () => zocalo(''),
  pilar_zocalo_gastado: () => zocalo('gastado'),
  pilar_zocalo_vivo: () => zocalo('vivo'),
  pilar_losa_eco: losaEco,
  pilar_arista: arista,
  pilar_arista_grande: aristaGrande,
  pilar_manantial: manantial,
  pilar_canal: canalH,
  pilar_canal_v: () => transpose(canalH()),
  pilar_enlosado: enlosado,
};

/** ¿Hay arte procedural para esta pieza del kit? */
export const hasKitArt = (name) => Boolean(PIECES[name]);

/** Arte nativo (16 px/tile) de una pieza del kit. */
export function drawKitPiece(name) {
  const fn = PIECES[name];
  if (!fn) throw new Error(`Sin arte para la pieza "${name}"`);
  return fn();
}
