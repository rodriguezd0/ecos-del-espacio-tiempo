// Arte propio del Bloque 15 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b15_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma o variante), dibujadas a escala nativa
// de DS y ampliadas ×2:
//   objects/b15_hielo_0|1|2.png   32×32  placa de hielo del Lago Viejo (T13) sin grietas / agrietada / muy agrietada.
//                                        Casilla = variante de borde (ver content/events/b15_lago_logic.js#iceFrame):
//                                        0–3 interior, 4 N, 5 S, 6 E, 7 O, 8 NO, 9 NE, 10 SO, 11 SE, 12 N+S, 13 E+O,
//                                        14 NSO, 15 NSE (fila = floor(i/4), columna = i % 4)
//   objects/b15_hielo_roca.png    32×32  roca nevada sobre el hielo (columna = variante)
//   objects/b15_bloque_antiguo.png 32×32 bloque de hielo antiguo con capas violetas (fila 2 brillo · 4 liberado)
//   objects/b15_huellas.png       32×32  huellas en la nieve: fila 2 Larvitar hacia arriba · 4 Larvitar a la izquierda ·
//                                        6 Larvitar a la derecha · 8 botas hacia arriba (columna = variante)
//   objects/b15_torre_hielo.png   96×160 Torre de Hielo de Villa Boreal: fila 2 en pie (brillo) · 4 andamio vacío
//   objects/b15_telescopio.png    32×64  telescopio del Observatorio Boreal sobre su montura
//   objects/b15_esculturas.png    32×64  tallas de hielo de los Talleres (columna = pieza)
//   objects/b15_trineo.png        64×32  trineo de madera con bloques de hielo
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const ICE = {
  hi: '#F6FBFF', light: '#DDF0F8', base: '#BCDDEE', mid: '#9DC7E1', deep: '#76A6CB', line: '#5680AA', dark: '#3A5E88',
  water: '#23406A', snow: '#F2F4FA', snowShade: '#D6DAE8',
};
const px = (img, x, y, c) => img.set(x, y, hex(c));
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) px(img, x, y, c); };
const same4 = (f) => [f, f, f, f];

function rnd(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ───────────────────────────── Placas de hielo ─────────────────────────────

/** Bordes de cada variante: [N, S, E, O]. */
export const ICE_EDGES = [
  [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0],
  [1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1],
  [1, 0, 0, 1], [1, 0, 1, 0], [0, 1, 0, 1], [0, 1, 1, 0],
  [1, 1, 0, 0], [0, 0, 1, 1], [1, 1, 0, 1], [1, 1, 1, 0],
];

function crackLines(img, level, seed) {
  if (!level) return;
  const r = rnd(seed * 31 + level);
  const strokes = level === 1 ? 2 : 4;
  for (let s = 0; s < strokes; s++) {
    let x = 5 + Math.floor(r() * 6);
    let y = 5 + Math.floor(r() * 6);
    const len = level === 1 ? 4 + Math.floor(r() * 3) : 5 + Math.floor(r() * 4);
    const dx = r() < 0.5 ? -1 : 1;
    for (let i = 0; i < len; i++) {
      px(img, x, y, level === 1 ? ICE.line : ICE.dark);
      if (level === 2 && i % 2 === 0) px(img, x + 1, y, ICE.line);
      x += r() < 0.6 ? dx : 0;
      y += r() < 0.7 ? 1 : -1;
      if (x < 1 || x > 14 || y < 1 || y > 14) break;
    }
  }
  if (level === 2) {
    // agujero central: agua oscura asomando entre las placas
    box(img, 7, 7, 8, 8, ICE.water);
    px(img, 6, 7, ICE.dark); px(img, 9, 8, ICE.dark); px(img, 7, 6, ICE.dark); px(img, 8, 9, ICE.dark);
  }
}

function iceFrame(i, level) {
  const img = new Img(16, 16);
  box(img, 0, 0, 15, 15, ICE.base);
  const r = rnd(1000 + i);
  // vetas de luz en diagonal y manchas de hielo más hondo
  for (let k = 0; k < 3; k++) {
    const x0 = Math.floor(r() * 16);
    const y0 = Math.floor(r() * 16);
    for (let t = 0; t < 4; t++) {
      if (x0 + t < 16 && y0 - t >= 0) px(img, x0 + t, y0 - t, t === 0 ? ICE.hi : ICE.light);
    }
  }
  for (let k = 0; k < 4; k++) px(img, Math.floor(r() * 16), Math.floor(r() * 16), ICE.mid);
  const [n, s, e, w] = ICE_EDGES[i];
  if (n) { box(img, 0, 0, 15, 1, ICE.snow); box(img, 0, 2, 15, 2, ICE.snowShade); box(img, 0, 3, 15, 3, ICE.mid); }
  if (s) { box(img, 0, 14, 15, 15, ICE.snow); box(img, 0, 13, 15, 13, ICE.deep); }
  if (w) { box(img, 0, 0, 1, 15, ICE.snow); box(img, 2, 0, 2, 15, ICE.snowShade); }
  if (e) { box(img, 14, 0, 15, 15, ICE.snow); box(img, 13, 0, 13, 15, ICE.snowShade); }
  // esquinas redondeadas
  if (n && w) { px(img, 2, 2, ICE.snow); px(img, 3, 2, ICE.snowShade); }
  if (n && e) { px(img, 13, 2, ICE.snow); px(img, 12, 2, ICE.snowShade); }
  if (s && w) { px(img, 2, 13, ICE.snow); }
  if (s && e) { px(img, 13, 13, ICE.snow); }
  crackLines(img, level, i + 1);
  return img.scale(2);
}

function iceSheet(level) {
  const frames = [];
  for (let row = 0; row < 4; row++) frames.push([0, 1, 2, 3].map((c) => iceFrame(row * 4 + c, level)));
  return sheet(frames, 32, 32);
}

// ───────────────────────────── Roca nevada y bloque antiguo ─────────────────────────────

function rockFrame(v) {
  const img = new Img(16, 16);
  const r = rnd(77 + v);
  const w0 = 3 + (v % 2); const w1 = 12 - (v % 3 === 0 ? 1 : 0);
  for (let y = 4; y <= 14; y++) {
    const inset = y < 7 ? 7 - y : 0;
    for (let x = w0 + inset; x <= w1 - inset; x++) px(img, x, y, y > 11 ? '#5B5F72' : '#7C8196');
  }
  for (let x = w0 + 2; x <= w1 - 2; x++) px(img, x, 4, ICE.snow);
  for (let x = w0 + 1; x <= w1 - 1; x++) { px(img, x, 5, ICE.snow); px(img, x, 6, r() < 0.7 ? ICE.snow : ICE.snowShade); }
  for (let k = 0; k < 3; k++) px(img, w0 + 1 + Math.floor(r() * (w1 - w0 - 2)), 9 + Math.floor(r() * 3), '#9095A8');
  for (let x = w0; x <= w1; x++) px(img, x, 15, '#3A5E88');
  return outline(img, '#2A2E3E').scale(2);
}

function ancientFrame(f, freed) {
  const img = new Img(16, 16);
  box(img, 2, 3, 13, 14, '#3C4E8C');
  const layers = ['#5B4C9C', '#4A5FA8', '#6A58B0', '#40569E', '#7466BC'];
  for (let y = 4; y <= 13; y++) for (let x = 3; x <= 12; x++) px(img, x, y, layers[(y + (x > 7 ? 1 : 0)) % layers.length]);
  box(img, 2, 3, 13, 3, '#9FB6E6');
  for (let x = 3; x <= 12; x++) px(img, x, 4, '#8AA2DC');
  // brillo que recorre la cara
  const sx = 3 + ((f * 3) % 10);
  for (let t = 0; t < 3; t++) if (sx + t <= 12) px(img, sx + t, 12 - t * 3, '#D8E4FF');
  if (freed) { box(img, 5, 7, 10, 9, '#C9B8FF'); px(img, 7, 8, '#FFFFFF'); px(img, 8, 8, '#FFFFFF'); }
  for (let x = 2; x <= 13; x++) px(img, x, 15, '#23406A');
  return outline(img, '#1C2248').scale(2);
}

// ───────────────────────────── Huellas ─────────────────────────────

function printFrame(kind, dir, v) {
  const img = new Img(16, 16);
  const c = kind === 'boot' ? '#8C93AA' : '#7885AC';
  const dk = kind === 'boot' ? '#6E758C' : '#56638E';
  const foot = (cx, cy, flip) => {
    if (kind === 'boot') {
      box(img, cx, cy, cx + 2, cy + 3, c); box(img, cx, cy + 4, cx + 2, cy + 4, dk); px(img, cx + 1, cy + 2, dk);
    } else {
      // pie de tres garras (Larvitar): planta ancha y tres dedos marcados
      box(img, cx - 1, cy + 1, cx + 2, cy + 3, c);
      box(img, cx, cy + 4, cx + 1, cy + 4, c);
      const toes = flip ? [[-2, -1], [0, -1], [2, -1], [3, 0]] : [[-2, 0], [-1, -1], [1, -1], [3, -1]];
      for (const [tx, ty] of toes) px(img, cx + tx, cy + ty, dk);
    }
  };
  const o = v % 2;
  if (dir === 8) { foot(4 + o, 9, false); foot(9 + o, 3, true); }
  else if (dir === 4) { foot(2, 6 + o, false); foot(9, 9 + o, true); }
  else { foot(3, 9 + o, true); foot(10, 6 + o, false); }
  return img.scale(2);
}

// ───────────────────────────── Torre de Hielo y andamio ─────────────────────────────

function towerFrame(f) {
  const img = new Img(32, 80);
  // base de nieve
  box(img, 4, 74, 27, 78, ICE.snowShade); box(img, 6, 73, 25, 73, ICE.snow);
  // cuerpo escalonado de bloques
  const tiers = [[7, 24, 58, 72], [9, 22, 42, 57], [11, 20, 28, 41], [13, 18, 16, 27]];
  tiers.forEach(([x0, x1, y0, y1], k) => {
    box(img, x0, y0, x1, y1, ICE.base);
    for (let y = y0; y <= y1; y += 5) for (let x = x0; x <= x1; x++) px(img, x, y, ICE.mid);
    for (let y = y0; y <= y1; y++) { px(img, x0, y, ICE.light); px(img, x1, y, ICE.deep); }
    box(img, x0, y0, x1, y0, ICE.hi);
    if (k < 3) for (let x = x0 + 2; x <= x1 - 2; x += 4) box(img, x, y0 + 2, x + 1, y0 + 3, ICE.deep);
  });
  // aguja y fanal
  box(img, 15, 6, 16, 15, ICE.light); px(img, 15, 5, ICE.hi); px(img, 16, 5, ICE.hi);
  const glow = ['#FFF6C8', '#FFE9A0', '#FFF6C8', '#FFFFFF'][f];
  box(img, 14, 10, 17, 13, glow);
  // destello que sube por la torre
  const gy = 70 - f * 16;
  for (let x = 8; x <= 23; x++) if (img.alpha(x, gy)) px(img, x, gy, ICE.hi);
  return outline(pad3(img), '#2E4A70').scale(2);
}

/** Centra un dibujo de 32 px de ancho en un marco de 48 (3 casillas: el pie queda en la casilla central). */
function pad3(img) {
  const out = new Img(48, img.h);
  out.blit(img, 8, 0);
  return out;
}

function scaffoldFrame() {
  const img = new Img(32, 80);
  box(img, 4, 74, 27, 78, ICE.snowShade);
  const wood = '#7A5634'; const woodHi = '#A07548';
  for (const x of [8, 23]) box(img, x, 22, x + 1, 74, wood);
  for (const x of [12, 19]) box(img, x, 38, x, 74, woodHi);
  for (const y of [30, 46, 62]) for (let x = 8; x <= 24; x++) px(img, x, y, woodHi);
  for (let i = 0; i < 14; i++) { px(img, 9 + i, 47 + i, wood); px(img, 23 - i, 47 + i, wood); }
  // lona rota ondeando y un cartel
  box(img, 10, 23, 21, 27, '#B8664A'); box(img, 12, 28, 19, 29, '#9A4E38');
  box(img, 13, 64, 19, 69, '#C9A26A'); for (let x = 14; x <= 18; x += 2) px(img, x, 66, '#6B4B2A');
  return outline(pad3(img), '#3A2A1C').scale(2);
}

// ───────────────────────────── Telescopio, tallas y trineo ─────────────────────────────

function telescopeFrame(f) {
  const img = new Img(16, 32);
  // trípode
  for (let i = 0; i <= 10; i++) {
    px(img, 7 - Math.floor(i / 2), 21 + i, '#4A5164');
    px(img, 8 + Math.floor(i / 2), 21 + i, '#4A5164');
  }
  box(img, 7, 21, 8, 31, '#3A4052');
  box(img, 6, 15, 9, 21, '#6A7388'); box(img, 6, 15, 9, 15, '#8E97AC');
  // tubo blanco y grueso inclinado hacia el cielo (arriba a la izquierda), apoyado en la montura
  for (let i = 0; i <= 9; i++) {
    const x = 2 + i; const y = 4 + i;
    for (let k = 0; k < 4; k++) px(img, x + k, y, k === 0 ? '#FFFFFF' : '#E4E9F2');
    px(img, x + 1, y + 1, '#C5CCDA'); px(img, x + 2, y + 1, '#AEB6C8');
  }
  box(img, 1, 2, 4, 4, '#2B3A66'); px(img, 2, 3, f % 2 ? '#9FE8FF' : '#5FA8D8');
  box(img, 11, 13, 13, 15, '#2E3445');
  return outline(img, '#1E2230').scale(2);
}

function sculptureFrame(v) {
  const img = new Img(16, 32);
  box(img, 3, 28, 12, 31, '#8C6A48'); box(img, 3, 28, 12, 28, '#A8845C');
  const fill = (pts) => { for (const [x, y] of pts) px(img, x, y, ICE.base); };
  const pts = [];
  if (v === 0) { for (let y = 12; y <= 27; y++) for (let x = 3; x <= 12; x++) if ((x - 7.5) ** 2 + (y - 20) ** 2 < 30) pts.push([x, y]); }
  else if (v === 1) { for (let y = 10; y <= 27; y++) { const w = y < 18 ? Math.floor((y - 10) / 1.2) : 6; for (let x = 7 - w; x <= 8 + w; x++) if (x >= 1 && x <= 14) pts.push([x, y]); } }
  else if (v === 2) { for (let y = 6; y <= 27; y++) { const w = 1 + Math.floor((y - 6) / 5); for (let x = 7 - w; x <= 8 + w; x++) pts.push([x, y]); } }
  else { for (let y = 14; y <= 27; y++) for (let x = 3; x <= 12; x++) pts.push([x, y]); }
  fill(pts);
  for (const [x, y] of pts) if ((x + y) % 7 === 0) px(img, x, y, ICE.hi);
  for (const [x, y] of pts) if ((x * 3 + y) % 11 === 0) px(img, x, y, ICE.mid);
  if (v === 0) { px(img, 5, 19, ICE.dark); px(img, 10, 19, ICE.dark); box(img, 6, 23, 9, 23, ICE.dark); }
  if (v === 3) for (let y = 16; y <= 26; y += 3) box(img, 4, y, 11, y, ICE.mid);
  return outline(img, '#2E4A70').scale(2);
}

function sledFrame() {
  const img = new Img(32, 16);
  for (let x = 2; x <= 29; x++) px(img, x, 14, '#5A3E24');
  px(img, 1, 13, '#5A3E24'); px(img, 30, 13, '#5A3E24');
  box(img, 3, 10, 28, 12, '#8C6038'); box(img, 3, 10, 28, 10, '#B07A48');
  for (const x0 of [5, 12, 19]) { box(img, x0, 3, x0 + 6, 9, ICE.base); box(img, x0, 3, x0 + 6, 3, ICE.hi); px(img, x0 + 6, 6, ICE.deep); }
  return outline(img, '#2A1C10').scale(2);
}

// ───────────────────────────── Principal ─────────────────────────────

const sheets = {
  b15_hielo_0: iceSheet(0),
  b15_hielo_1: iceSheet(1),
  b15_hielo_2: iceSheet(2),
  b15_hielo_roca: sheet(same4([0, 1, 2, 3].map(rockFrame)), 32, 32),
  b15_bloque_antiguo: sheet([
    [0, 1, 2, 3].map((f) => ancientFrame(f, false)), [0, 1, 2, 3].map((f) => ancientFrame(f, true)),
    [0, 1, 2, 3].map((f) => ancientFrame(f, false)), [0, 1, 2, 3].map((f) => ancientFrame(f, true)),
  ], 32, 32),
  b15_huellas: sheet([
    [0, 1, 2, 3].map((v) => printFrame('larvitar', 8, v)), [0, 1, 2, 3].map((v) => printFrame('larvitar', 4, v)),
    [0, 1, 2, 3].map((v) => printFrame('larvitar', 6, v)), [0, 1, 2, 3].map((v) => printFrame('boot', 8, v)),
  ], 32, 32),
  b15_torre_hielo: sheet([
    [0, 1, 2, 3].map(towerFrame), same4(scaffoldFrame()), [0, 1, 2, 3].map(towerFrame), same4(scaffoldFrame()),
  ], 96, 160),
  b15_telescopio: sheet(same4([0, 1, 2, 3].map(telescopeFrame)), 32, 64),
  b15_esculturas: sheet(same4([0, 1, 2, 3].map(sculptureFrame)), 32, 64),
  b15_trineo: sheet(same4(same4(sledFrame())), 64, 32),
};

for (const [name, img] of Object.entries(sheets)) {
  const file = img.save(path.join(OUT, `${name}.png`));
  console.log(`→ ${path.relative(ROOT, file)} (${img.w}×${img.h})`);
  if (process.argv.includes('--preview')) preview(img, { scale: 2 }).save(path.join(PREVIEW, `${name}.png`));
}
