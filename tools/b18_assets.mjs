// Arte propio del Bloque 18 — Pilar de la Convergencia (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b18_assets.mjs [--preview]
// Hojas de evento 4×4 (índice de fotograma = fila·4 + columna; fila 0 = dir 2, 1 = dir 4, 2 = dir 6, 3 = dir 8).
// Genéricas de la tensión de ejes (world/axis, las reutiliza B20):
//   objects/eje_cristal.png             32×64  cristal de cambio (fila 0 sin tensar · 1 tiempo · 2 espacio; 4 pasos)
//   objects/eje_escombro.png            32×32  escombro (fila 0 cae al abismo en bucle · 1 detenido en el aire)
//   objects/eje_corriente.png           32×32  agua de luz que fluye (filas = sentido 2/4/6/8; 4 pasos)
//   objects/eje_corriente_cristal.png   32×32  la corriente congelada: cristal pisable (filas = sentido)
//   objects/eje_pliegue.png             32×32  marca de pliegue (fila 0 cerrada · 1 abierta: remolino)
// Del bloque:
//   objects/b18_resonador.png           96×128 Resonador Sintético (fila 0 activo · 1 sobrecarga · 2 roto)
//   objects/b18_cadena.png              32×32  Cadena Sintética (fila 0 horizontal · 1 vertical · 2 rota)
//   objects/b18_aerodeslizador.png      128×96 aerodeslizador de Genesis (fila 0 posado · 1 en vuelo)
//   objects/b18_objetos.png             32×32  fila 0 cuaderno de Vértice · 1 Diamansfera · 2 Lustresfera · 3 reloj
// Paletas: piedra plata del P9, azul acero de Dialga, violeta de Palkia y los colores de Genesis (CAMPANA §5.1).
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };
const STONE = { hi: '#EEF0F6', light: '#C9CCD8', mid: '#9EA2B4', dark: '#6C7086', deep: '#44475A', out: '#23242F' };
const TIME = { hi: '#E6F2FF', light: '#9CCBFF', mid: '#5C92E8', dark: '#2E5AAE', deep: '#1B2F66' };
const SPACE = { hi: '#FFE8FF', light: '#EAA6FF', mid: '#C064E8', dark: '#7A33AE', deep: '#3E1A66' };
const GEN = { petrol: '#1F4E5A', petrolHi: '#2E7383', white: '#F2F4F5', grey: '#C4CACD', coal: '#2B2D31', coalHi: '#44474D', magenta: '#B03A8C', magHi: '#E86BC4' };

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
  for (let i = 0; i <= n; i++) over(img, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
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
      if (d <= r1 && d >= r0) over(img, x, y, c);
    }
  }
}
function ellipse(img, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) over(img, x, y, c);
  }
}
function gridSheet(frames, w, h) {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => frames[r * 4 + c] || new Img(w, h)));
  return sheet(rows, w, h);
}
/** Hexágono relleno (radio r) centrado en (cx, cy). */
function hexagon(img, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    const half = Math.round(r - Math.abs(y) * 0.5);
    for (let x = -half; x <= half; x++) over(img, cx + x, cy + y, c);
  }
}

// ───────────────────────────── cristal de cambio ─────────────────────────────

const CRYSTAL_PAL = [
  { hi: '#FFFFFF', light: '#E6E9F4', mid: '#B9BED6', dark: '#8288A6', glow: null },
  TIME,
  SPACE,
];

function crystalFrame(kind, step) {
  const img = new Img(16, 32);
  const p = CRYSTAL_PAL[kind];
  // sombra y pedestal hexagonal
  ellipse(img, 8, 29.5, 6, 1.6, [0, 0, 0, 80]);
  rect(img, 3, 25, 10, 4, rgba(STONE.mid));
  rect(img, 3, 25, 10, 1, rgba(STONE.light));
  rect(img, 3, 28, 10, 1, rgba(STONE.dark));
  rect(img, 5, 23, 6, 2, rgba(STONE.light));
  // cristal: rombo alargado que flota (baja y sube 1 px)
  const bob = [0, -1, -1, 0][step];
  const top = 5 + bob;
  const mid = 14 + bob;
  const bot = 21 + bob;
  for (let y = top; y <= bot; y++) {
    const t = y <= mid ? (y - top) / (mid - top) : (bot - y) / (bot - mid);
    const half = Math.max(0, Math.round(t * 4.2));
    for (let x = -half; x <= half; x++) {
      const col = x < -half / 2 ? p.dark : x <= 0 ? p.mid : x < half ? p.light : p.mid;
      over(img, 8 + x, y, rgba(col));
    }
  }
  line(img, 8, top + 1, 8, bot - 1, rgba(p.hi, 200));
  // destello que recorre el cristal
  const gy = top + 3 + step * 3;
  over(img, 9, gy, rgba(p.hi));
  over(img, 10, gy + 1, rgba(p.hi, 180));
  // halo (tiempo y espacio)
  if (kind > 0) {
    const a = [70, 110, 150, 110][step];
    ring(img, 8, mid, 6, 7.2, rgba(p.light, a));
    for (const [x, y] of [[2, 8], [14, 11], [1, 17], [15, 20]]) if ((x + y + step) % 3 === 0) over(img, x, y + bob, rgba(p.hi, 200));
  }
  return outline(img, STONE.out);
}
const crystalSheet = () => gridSheet([0, 1, 2].flatMap((k) => [0, 1, 2, 3].map((s) => crystalFrame(k, s).scale(2))), 32, 64);

// ───────────────────────────── escombro ─────────────────────────────

/** Losa rota vista desde arriba (≈ 12×10 a escala 1): canto claro arriba, cara oscura abajo. */
function slab(img, cx, cy, k, alpha = 255, frost = false) {
  const w = Math.max(2, Math.round(12 * k));
  const h = Math.max(2, Math.round(9 * k));
  const x0 = Math.round(cx - w / 2);
  const y0 = Math.round(cy - h / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const cut = (x + y < 2) || (w - 1 - x + y < 1) || (x + (h - 1 - y) < 1) || (w - 1 - x + (h - 1 - y) < 2);
      if (cut) continue;
      const c = y === 0 ? STONE.hi : y >= h - 2 ? STONE.dark : (x + y) % 5 === 0 ? STONE.mid : STONE.light;
      over(img, x0 + x, y0 + y, rgba(frost && (y === 0 || x === 0) ? TIME.light : c, alpha));
    }
  }
  if (w >= 6) { over(img, x0 + Math.round(w / 2), y0 + 2, rgba(STONE.deep, alpha)); over(img, x0 + Math.round(w / 2) + 1, y0 + 3, rgba(STONE.deep, alpha)); }
}

/** Escombro que cae en el abismo: visto desde arriba se aleja (encoge y se apaga) — 4 pasos en bucle. */
function debrisFalling(step) {
  const img = new Img(16, 16);
  const ks = [1.0, 0.72, 0.48, 0.26];
  const as = [255, 230, 190, 130];
  // sombra en el fondo del abismo
  ellipse(img, 8, 9, 4 * ks[step] + 1, 2 * ks[step] + 0.5, [0, 0, 0, 70]);
  slab(img, 8, 7 + step, ks[step], as[step]);
  // polvo que se desprende
  for (const [x, y] of [[2, (3 + step * 3) % 16], [13, (9 + step * 3) % 16], [6, (13 + step * 2) % 16]]) over(img, x, y, rgba(STONE.light, 150 - step * 20));
  return step < 3 ? outline(img, STONE.out) : img;
}

/** Escombro detenido en el aire: la losa entera, quieta, con escarcha y el anillo del tiempo debajo. */
function debrisFrozen(step) {
  const img = new Img(16, 16);
  ellipse(img, 8, 12, 6.5, 2.2, rgba(TIME.deep, 150));
  ring(img, 8, 12, 4.8, 6.8, rgba(TIME.light, [110, 150, 190, 150][step]));
  slab(img, 8, 7, 1.0, 255, true);
  for (const [x, y] of [[1, 2], [14, 4], [12, 1], [3, 12]]) over(img, x, y, rgba(TIME.hi, 140 + ((step + x) % 2) * 80));
  return outline(img, STONE.out);
}
const debrisSheet = () => gridSheet([
  ...[0, 1, 2, 3].map((s) => debrisFalling(s).scale(2)),
  ...[0, 1, 2, 3].map((s) => debrisFrozen(s).scale(2)),
], 32, 32);

// ───────────────────────────── corrientes ─────────────────────────────

const DIRV = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

/** Casilla de agua de luz fluyendo hacia `dir` (paso 0..3). */
function currentFrame(dir, step) {
  const img = new Img(16, 16);
  const [vx, vy] = DIRV[dir];
  const horizontal = vx !== 0;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const across = horizontal ? y : x; // coordenada transversal
      const along = horizontal ? x * vx : y * vy;
      const edge = across === 0 || across === 15;
      const near = across === 1 || across === 14;
      const wave = (((along - step * 4) % 8) + 8) % 8;
      let c = TIME.deep;
      if (edge) c = STONE.dark;
      else if (near) c = '#2A2F5E';
      else if (wave < 2) c = SPACE.dark;
      else if (wave < 3) c = SPACE.mid;
      over(img, x, y, rgba(c));
    }
  }
  // cheurones que avanzan en el sentido de la corriente
  for (let k = 0; k < 2; k++) {
    const t = ((step * 4 + k * 8) % 16);
    for (let s = -2; s <= 2; s++) {
      const a = 6 + Math.abs(s);
      const along = t - Math.abs(s);
      const px = horizontal ? (vx > 0 ? along : 15 - along) : 8 + s - 1;
      const py = horizontal ? 8 + s - 1 : (vy > 0 ? along : 15 - along);
      if (a > 0) over(img, px, py, rgba(SPACE.hi, 230));
    }
  }
  return img;
}

function frozenCurrentFrame(dir, step) {
  const img = new Img(16, 16);
  const [vx, vy] = DIRV[dir];
  const horizontal = vx !== 0;
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const across = horizontal ? y : x;
      const edge = across === 0 || across === 15;
      let c = (x + y) % 5 === 0 ? TIME.hi : (x * 3 + y) % 7 === 0 ? TIME.mid : TIME.light;
      if (edge) c = STONE.dark;
      else if (across === 1 || across === 14) c = TIME.mid;
      over(img, x, y, rgba(c));
    }
  }
  // facetas y el cheurón congelado (se lee de dónde venía)
  for (let s = -2; s <= 2; s++) {
    const along = 8 - Math.abs(s);
    const px = horizontal ? (vx > 0 ? along : 15 - along) : 8 + s - 1;
    const py = horizontal ? 8 + s - 1 : (vy > 0 ? along : 15 - along);
    over(img, px, py, rgba(TIME.dark, 200));
  }
  // destello lento
  const g = [[3, 3], [11, 5], [6, 12], [12, 11]][step];
  over(img, g[0], g[1], rgba('#FFFFFF'));
  over(img, g[0] + 1, g[1], rgba('#FFFFFF', 150));
  return img;
}
const currentSheet = () => gridSheet([2, 4, 6, 8].flatMap((d) => [0, 1, 2, 3].map((s) => currentFrame(d, s).scale(2))), 32, 32);
const frozenCurrentSheet = () => gridSheet([2, 4, 6, 8].flatMap((d) => [0, 1, 2, 3].map((s) => frozenCurrentFrame(d, s).scale(2))), 32, 32);

// ───────────────────────────── pliegues ─────────────────────────────

function foldFrame(open, step) {
  const img = new Img(16, 16);
  if (!open) {
    ring(img, 8, 8, 4.2, 5.6, rgba(SPACE.dark, 150));
    ring(img, 8, 8, 1.5, 2.4, rgba(SPACE.dark, 120 + step * 10));
    for (const [x, y] of [[8, 1], [8, 14], [1, 8], [14, 8]]) over(img, x, y, rgba(SPACE.mid, 120));
    return img;
  }
  disc(img, 8, 8, 6.6, rgba(SPACE.deep, 200));
  // brazos del remolino que giran
  for (let arm = 0; arm < 3; arm++) {
    for (let t = 0; t < 14; t++) {
      const ang = arm * (Math.PI * 2 / 3) + t * 0.38 + step * (Math.PI / 6);
      const r = 0.7 + t * 0.42;
      over(img, 8 + Math.cos(ang) * r, 8 + Math.sin(ang) * r, rgba(t < 5 ? SPACE.hi : SPACE.light, 240 - t * 8));
    }
  }
  disc(img, 8, 8, 1.4, rgba('#FFFFFF'));
  ring(img, 8, 8, 6.2, 7.4, rgba(SPACE.mid, 170));
  return img;
}
const foldSheet = () => gridSheet([
  ...[0, 1, 2, 3].map((s) => foldFrame(false, s).scale(2)),
  ...[0, 1, 2, 3].map((s) => foldFrame(true, s).scale(2)),
], 32, 32);

// ───────────────────────────── Resonador Sintético ─────────────────────────────

function resonatorFrame(state, step) {
  const img = new Img(48, 64);
  ellipse(img, 24, 60, 20, 3.5, [0, 0, 0, 90]);
  // base de chapa y patas
  rect(img, 6, 50, 36, 9, rgba(GEN.coal));
  rect(img, 6, 50, 36, 2, rgba(GEN.coalHi));
  rect(img, 9, 53, 30, 3, rgba(GEN.petrol));
  for (const x of [8, 38]) rect(img, x, 57, 3, 4, rgba(GEN.coal));
  // cuerpo: columna blanca con franjas petróleo
  rect(img, 15, 22, 18, 29, rgba(GEN.white));
  rect(img, 15, 22, 3, 29, rgba(GEN.grey));
  rect(img, 30, 22, 3, 29, rgba(GEN.grey));
  for (const y of [28, 36, 44]) rect(img, 15, y, 18, 2, rgba(GEN.petrol));
  // bobinas laterales
  for (const x of [9, 35]) {
    rect(img, x, 30, 5, 16, rgba(GEN.coal));
    for (let y = 31; y < 46; y += 2) rect(img, x, y, 5, 1, rgba(state === 2 ? GEN.coalHi : '#8E5A3A'));
  }
  // emblema de los tubos cruzados
  line(img, 20, 38, 27, 45, rgba(GEN.magenta));
  line(img, 27, 38, 20, 45, rgba(GEN.magenta));
  // antena y anillo resonante
  rect(img, 22, 6, 4, 16, rgba(GEN.grey));
  ring(img, 24, 12, 7, 9, rgba(state === 2 ? GEN.coalHi : GEN.petrolHi));
  const lit = state === 0 ? [255, 180, 110, 180][step] : state === 1 ? [255, 90, 255, 140][step] : 0;
  if (lit) {
    disc(img, 24, 5, 2.5, rgba(GEN.magHi, lit));
    ring(img, 24, 12, 9.5, 11, rgba(GEN.magHi, Math.round(lit * 0.5)));
    for (const [x, y] of [[17, 25], [31, 25], [24, 33]]) over(img, x, y, rgba(GEN.magHi, lit));
  }
  if (state === 1) {
    // chispas de la sobrecarga
    const sparks = [[[6, 18], [12, 12]], [[40, 14], [44, 22]], [[4, 40], [10, 34]], [[38, 40], [46, 36]]];
    sparks.forEach(([[x0, y0], [x1, y1]], i) => { if ((i + step) % 2 === 0) line(img, x0, y0, x1, y1, rgba('#FFF6A8')); });
    disc(img, 24, 12, 3, rgba('#FFFFFF', 220));
  }
  if (state === 2) {
    // roto: antena doblada, grietas y humo
    line(img, 22, 6, 18, 2, rgba(GEN.grey));
    line(img, 17, 30, 22, 38, rgba(GEN.coal));
    line(img, 29, 24, 26, 32, rgba(GEN.coal));
    const sy = 4 - step * 2;
    disc(img, 28 + step, sy + 4, 3, rgba('#9A9AA0', 110));
    disc(img, 31 + step, sy, 2, rgba('#9A9AA0', 80));
  }
  return outline(img, GEN.coal);
}
const resonatorSheet = () => gridSheet([0, 1, 2].flatMap((st) => [0, 1, 2, 3].map((s) => resonatorFrame(st, s).scale(2))), 96, 128);

// ───────────────────────────── Cadena Sintética ─────────────────────────────

function chainFrame(kind, step) {
  const img = new Img(16, 16);
  const glow = [150, 200, 240, 200][step];
  const link = (x, y, vertical) => {
    if (vertical) { ring(img, x, y, 1.2, 2.6, rgba('#8E9098')); over(img, x, y, rgba(GEN.magHi, glow)); } else { ellipse(img, x, y, 2.8, 1.8, rgba('#8E9098')); over(img, x, y, rgba(GEN.magHi, glow)); }
  };
  if (kind === 0) { for (let x = 1; x <= 15; x += 4) link(x, 9, false); line(img, 0, 9, 15, 9, rgba(GEN.magenta, 90)); }
  else if (kind === 1) { for (let y = 1; y <= 15; y += 4) link(8, y, true); line(img, 8, 0, 8, 15, rgba(GEN.magenta, 90)); }
  else if (kind === 2) {
    link(3, 11, false); link(7, 12, false);
    ellipse(img, 12, 10, 2.5, 1.5, rgba('#6E7078'));
    for (const [x, y] of [[10, 6], [13, 5], [5, 7]]) if ((x + step) % 2) over(img, x, y, rgba('#FFF6A8', 200));
  }
  return img;
}
const chainSheet = () => gridSheet([0, 1, 2].flatMap((k) => [0, 1, 2, 3].map((s) => chainFrame(k, s).scale(2))), 32, 32);

// ───────────────────────────── aerodeslizador ─────────────────────────────

function hoverFrame(flying, step) {
  const img = new Img(64, 48);
  const lift = flying ? [4, 5, 6, 5][step] : 0;
  ellipse(img, 32, 44, flying ? 20 : 26, flying ? 2.5 : 3.5, [0, 0, 0, flying ? 60 : 100]);
  const y0 = 16 - lift;
  // casco: elipse blanca con faldón petróleo
  ellipse(img, 32, y0 + 14, 28, 10, rgba(GEN.petrol));
  ellipse(img, 32, y0 + 12, 27, 9, rgba(GEN.white));
  ellipse(img, 32, y0 + 10, 24, 6, rgba('#FFFFFF'));
  rect(img, 6, y0 + 15, 52, 2, rgba(GEN.petrolHi));
  // cabina
  ellipse(img, 32, y0 + 7, 10, 5, rgba('#4C8FA3'));
  ellipse(img, 30, y0 + 6, 6, 2.5, rgba('#A9E2EE'));
  // emblema
  line(img, 45, y0 + 9, 50, y0 + 14, rgba(GEN.magenta));
  line(img, 50, y0 + 9, 45, y0 + 14, rgba(GEN.magenta));
  // toberas
  for (const x of [12, 52]) {
    rect(img, x - 3, y0 + 18, 6, 4, rgba(GEN.coal));
    if (flying) { disc(img, x, y0 + 24, 2.5, rgba(GEN.magHi, [220, 170, 240, 170][step])); disc(img, x, y0 + 26, 1.5, rgba('#FFFFFF', 160)); }
  }
  if (!flying) for (const x of [16, 48]) rect(img, x, y0 + 21, 2, 6, rgba(GEN.coal)); // patines
  return outline(img, GEN.coal);
}
const hoverSheet = () => gridSheet([
  ...[0, 1, 2, 3].map(() => hoverFrame(false, 0).scale(2)),
  ...[0, 1, 2, 3].map((s) => hoverFrame(true, s).scale(2)),
], 128, 96);

// ───────────────────────────── objetos sueltos ─────────────────────────────

function notebookFrame(step) {
  const img = new Img(16, 16);
  ellipse(img, 8, 12, 6, 1.6, [0, 0, 0, 70]);
  rect(img, 3, 6, 10, 6, rgba('#5B3A24'));
  rect(img, 3, 6, 10, 1, rgba('#7C5434'));
  rect(img, 4, 7, 8, 4, rgba('#6A4429'));
  rect(img, 12, 7, 1, 4, rgba('#E8E0CC'));
  line(img, 5, 9, 10, 9, rgba(GEN.magenta)); // cinta
  if (step % 2) over(img, 11, 6, rgba('#FFFFFF', 200));
  return outline(img, '#24160C');
}
function orbFrame(kind, step) {
  const img = new Img(16, 16);
  const pal = kind === 0 ? { a: '#DDE8FF', b: '#7AA6E8', c: '#3B5FAE', glow: '#B8D4FF' } : { a: '#FFF0FA', b: '#F2B6D8', c: '#B8649A', glow: '#FFD0EE' };
  ellipse(img, 8, 13, 5, 1.5, [0, 0, 0, 70]);
  disc(img, 8, 8, 5, rgba(pal.c));
  disc(img, 7.5, 7.5, 4.2, rgba(pal.b));
  disc(img, 6.5, 6.5, 2.2, rgba(pal.a));
  over(img, 6, 5, rgba('#FFFFFF'));
  const g = [[12, 3], [13, 9], [3, 11], [2, 4]][step];
  over(img, g[0], g[1], rgba(pal.glow));
  return outline(img, '#2A2440');
}
function clockFrame(step) {
  const img = new Img(16, 16);
  disc(img, 8, 8, 6, rgba('#C8A24A'));
  disc(img, 8, 8, 4.8, rgba('#F6F0DC'));
  const ang = step * (Math.PI / 2) - Math.PI / 2;
  line(img, 8, 8, 8 + Math.cos(ang) * 3.6, 8 + Math.sin(ang) * 3.6, rgba('#2B2D31'));
  line(img, 8, 8, 8, 5, rgba('#2B2D31'));
  return outline(img, '#4A3818');
}
const objectsSheet = () => gridSheet([
  ...[0, 1, 2, 3].map((s) => notebookFrame(s).scale(2)),
  ...[0, 1, 2, 3].map((s) => orbFrame(0, s).scale(2)),
  ...[0, 1, 2, 3].map((s) => orbFrame(1, s).scale(2)),
  ...[0, 1, 2, 3].map((s) => clockFrame(s).scale(2)),
], 32, 32);

// ───────────────────────────── salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const outs = {
    eje_cristal: save(crystalSheet(), 'eje_cristal.png'),
    eje_escombro: save(debrisSheet(), 'eje_escombro.png'),
    eje_corriente: save(currentSheet(), 'eje_corriente.png'),
    eje_corriente_cristal: save(frozenCurrentSheet(), 'eje_corriente_cristal.png'),
    eje_pliegue: save(foldSheet(), 'eje_pliegue.png'),
    b18_resonador: save(resonatorSheet(), 'b18_resonador.png'),
    b18_cadena: save(chainSheet(), 'b18_cadena.png'),
    b18_aerodeslizador: save(hoverSheet(), 'b18_aerodeslizador.png'),
    b18_objetos: save(objectsSheet(), 'b18_objetos.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [k, img] of Object.entries(outs)) files.push(preview(img, { scale: img.w > 256 ? 1 : 2, bg: '#1C1E2A' }).save(path.join(PREVIEW, `${k}.png`)));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b18_assets: ${err.message}`);
  process.exitCode = 1;
}
