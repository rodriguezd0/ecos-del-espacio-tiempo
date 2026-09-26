// Arte propio del Bloque 22e (PROVISIONAL, D30): se dibuja a resolución nativa DS (16 px por casilla) y se amplía ×2.
// Paleta del «porvenir»: acero azulado, óxido, cian eléctrico y un violeta apagado (los ecos del Resonador).
//   game/assets/objects/b22e_boca.png      boca de la grieta en el Mirador Sur (3×2 casillas repartidas en la hoja
//                                          4×4 de 32×32): fila 2 arriba · fila 4 abajo · filas 6/8 con brillo
//   game/assets/objects/b22e_bloque.png    bloque de hierro: fila 2 suelto · 4 encajado (pulso cian) · 6 golpe
//   game/assets/objects/b22e_zocalo.png    zócalo de la plataforma: fila 2 vacío (pulso) · 4 lleno y encendido
//   game/assets/objects/b22e_escarcha.png  cristales de escarcha (filas 2/4/6/8: cuatro formas; destello animado)
//   game/assets/objects/b22e_puas.png      púas de hierro fundidas: filas 2/4 dos formas · 6 con chispas · 8 muñón
//   game/assets/objects/b22e_resonador.png pedazos del Resonador: fila 2 aro roto · 4 cadena · 6 placa · 8 tubo
//   game/assets/objects/b22e_marcas.png    marcas del eco en el suelo (patrón = columna, dirección = fila):
//                                          fila 2: rodadas · plumas · escamas · tajo · fila 4: huellas · costra de
//                                          escarcha · clavo quemado · destello
//   game/assets/objects/b22e_cristal.png   cristal cian del porvenir (32×64, cuatro destellos; filas = variantes)
//   game/assets/objects/b22e_columna.png   columna de hierro del taller (32×64)
//   game/assets/objects/b22e_palanca.png   palanca de retorno del taller: fila 2 arriba · 4 bajada
//   game/assets/objects/b22e_cuaderno.png  cuarto de Alerce (patrón = columna, dirección = fila): fila 2 cuaderno
//                                          verde · pila de cuadernos · foto enmarcada · mapa clavado · fila 4 aparato de
//                                          escucha · caja de archivos · recorte de periódico · carta
// Uso: node tools/b22e_assets.mjs [--preview]   (vista previa en tools/cache/pixel/b22e_*.png)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, sheet, preview } from './pixel.mjs';
import { rng } from './stamps_extra_art.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW_DIR = path.join(ROOT, 'tools', 'cache', 'pixel');
const N = 16;

const STEEL = ['#E6EEF4', '#B8C6D2', '#8B9CAC', '#627586', '#43525F', '#2C3640', '#1B2229'];
const RUST = ['#E3A06A', '#C07442', '#8E4E2C', '#5E321D'];
const CYAN = ['#F2FFFF', '#9CF6FF', '#3FD6F0', '#1A93B8', '#0E5A78'];
const VIOLET = ['#EBD9FF', '#B98CF0', '#7B4CC2', '#4A2A7E'];
const FROST = ['#FFFFFF', '#E3F4FF', '#B7DDF6', '#86BDE4', '#5A93C4'];
const OUTLINE = hex('#1A1C22');
const C = (c) => (typeof c === 'string' ? hex(c) : c);
const A = (c, a) => { const v = [...C(c)]; v[3] = a; return v; };
const x2 = (img) => img.scale(2);

function blank(w = N, h = N) { return new Img(w, h); }
function fillRect(img, x0, y0, w, h, c) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) img.set(x, y, C(c)); }
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), C(c));
}
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) img.set(x, y, C(c));
  }
}
function outlined(img) {
  const out = img.clone();
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
    if (img.alpha(x, y)) continue;
    if (img.alpha(x - 1, y) > 128 || img.alpha(x + 1, y) > 128 || img.alpha(x, y - 1) > 128 || img.alpha(x, y + 1) > 128) out.set(x, y, OUTLINE);
  }
  return out;
}

// ─────────────────────────────── boca de la grieta (48×32 nativos) ───────────────────────────────

function mouth(glow) {
  const img = blank(48, 32);
  const r = rng(22);
  // borde de tierra levantada alrededor de la fisura
  for (let y = 4; y < 30; y++) for (let x = 2; x < 46; x++) {
    const dx = (x - 24) / 22;
    const dy = (y - 17) / 12;
    const d = dx * dx + dy * dy;
    if (d < 1 && d > 0.55) img.set(x, y, C(r() < 0.5 ? '#8A6A48' : '#6E5238'));
  }
  // fisura: franja diagonal irregular, negra con fondo azul
  for (let x = 6; x < 42; x++) {
    const mid = 17 + Math.round(Math.sin(x / 5) * 2) + Math.round((x - 24) / 10);
    const half = 3 + Math.round(3 * Math.sin((x - 6) / 36 * Math.PI));
    for (let y = mid - half; y <= mid + half; y++) {
      const depth = 1 - Math.abs(y - mid) / (half + 1);
      img.set(x, y, C(depth > 0.6 ? '#05070C' : depth > 0.3 ? '#0E1726' : '#1E2A3C'));
    }
    // labio de roca clara en el borde superior
    img.set(x, mid - half - 1, C('#9C8E78'));
    if (r() < 0.3) img.set(x, mid + half + 1, C('#4A3A2A'));
  }
  // destellos del porvenir dentro
  const n = glow ? 14 : 6;
  for (let i = 0; i < n; i++) {
    const x = 9 + Math.floor(r() * 30);
    const y = 15 + Math.floor(r() * 5);
    img.set(x, y, C(glow ? CYAN[i % 2] : CYAN[3]));
    if (glow && r() < 0.5) img.set(x + 1, y, A(CYAN[2], 180));
  }
  if (glow) for (let x = 12; x < 36; x += 3) img.set(x, 17 + Math.round(Math.sin(x) * 1.5), C(VIOLET[1]));
  // esquirlas de hierro clavadas en los bordes
  for (const [x, y] of [[9, 11], [37, 22], [30, 10], [15, 24]]) {
    line(img, x, y, x + 1, y - 3, STEEL[2]);
    img.set(x + 1, y - 3, C(STEEL[0]));
  }
  return img;
}

// ─────────────────────────────── bloque de hierro ───────────────────────────────

function block(mode, frame = 0) {
  const img = blank();
  // cara superior y frontal
  fillRect(img, 2, 3, 12, 4, STEEL[2]);
  fillRect(img, 2, 7, 12, 8, STEEL[4]);
  fillRect(img, 2, 3, 12, 1, STEEL[1]);
  fillRect(img, 2, 14, 12, 1, STEEL[6]);
  // óxido en las esquinas y remaches
  for (const [x, y] of [[3, 8], [12, 8], [3, 13], [12, 13]]) img.set(x, y, C(STEEL[1]));
  for (const [x, y] of [[4, 11], [5, 12], [11, 10], [10, 12], [2, 9]]) img.set(x, y, C(RUST[1]));
  img.set(6, 13, C(RUST[2]));
  // hexágono grabado en la cara
  const hx = [[7, 9], [8, 9], [6, 10], [9, 10], [6, 11], [9, 11], [7, 12], [8, 12]];
  for (const [x, y] of hx) img.set(x, y, C(mode === 'locked' ? CYAN[frame % 2 ? 1 : 2] : STEEL[5]));
  if (mode === 'locked') {
    for (let x = 2; x < 14; x++) img.set(x, 7, C(CYAN[(x + frame) % 3 === 0 ? 0 : 2]));
  }
  if (mode === 'hit') {
    const sparks = [[1, 5], [14, 4], [0, 9], [15, 11], [8, 1], [3, 2]];
    sparks.forEach(([x, y], i) => { if ((i + frame) % 2 === 0) img.set(x, y, C(i % 2 ? '#FFF3B0' : CYAN[1])); });
  }
  // sombra
  for (let x = 3; x < 14; x++) img.set(x, 15, A('#000000', 80));
  return outlined(img);
}

function socket(filled, frame = 0) {
  const img = blank();
  fillRect(img, 2, 4, 12, 9, STEEL[5]);
  fillRect(img, 3, 5, 10, 7, filled ? STEEL[3] : '#070A10');
  const c = filled ? CYAN[frame % 2 ? 0 : 1] : CYAN[(frame % 4) < 2 ? 3 : 2];
  for (let x = 2; x < 14; x++) { img.set(x, 4, C(c)); img.set(x, 12, C(c)); }
  for (let y = 4; y < 13; y++) { img.set(2, y, C(c)); img.set(13, y, C(c)); }
  return img;
}

// ─────────────────────────────── escarcha, púas, cristales ───────────────────────────────

function frost(variant, frame) {
  const img = blank();
  const r = rng(40 + variant);
  const spikes = 3 + variant;
  // agujas de hielo que se estrechan hasta la punta, inclinadas; la cara izquierda clara y la derecha en sombra
  for (let i = 0; i < spikes; i++) {
    const bx = 3 + Math.floor(r() * 10);
    const h = 5 + Math.floor(r() * (5 + variant));
    const lean = r() < 0.5 ? -1 : 1;
    const base = 1 + Math.floor(r() * 2);
    for (let k = 0; k < h; k++) {
      const w = Math.round(base * (1 - k / h));
      const cx = bx + Math.round((lean * k) / 4);
      for (let dx = -w; dx <= w; dx++) img.set(cx + dx, 14 - k, C(dx < 0 ? FROST[1] : dx > 0 ? FROST[3] : k > h - 3 ? FROST[0] : FROST[2]));
    }
  }
  // costra blanca en la base
  for (let x = 1; x < 15; x++) if (r() < 0.8) img.set(x, 15, C(FROST[2]));
  const out = outlined(img);
  // destello
  const sx = [4, 9, 12, 6][frame % 4];
  const sy = [7, 5, 9, 11][frame % 4];
  out.set(sx, sy, C('#FFFFFF'));
  out.set(sx + 1, sy, A('#FFFFFF', 150));
  out.set(sx, sy - 1, A('#FFFFFF', 150));
  return out;
}

function spikes(variant, frame) {
  const img = blank();
  const r = rng(60 + variant);
  if (variant === 3) {
    // muñón quemado a ras de suelo
    fillRect(img, 6, 11, 4, 3, STEEL[5]);
    fillRect(img, 4, 13, 8, 2, '#2A2622');
    return outlined(img);
  }
  const n = variant === 1 ? 4 : 3;
  for (let i = 0; i < n; i++) {
    const bx = 3 + i * (10 / n) + Math.floor(r() * 2);
    const h = 8 + Math.floor(r() * 6);
    for (let k = 0; k < h; k++) {
      const w = k < h / 2 ? 1 : 0;
      for (let dx = -w; dx <= w; dx++) img.set(Math.round(bx) + dx, 15 - k, C(k > h - 3 ? STEEL[1] : k % 4 === 0 ? RUST[2] : STEEL[3]));
    }
  }
  for (let x = 2; x < 14; x++) if (r() < 0.6) img.set(x, 15, C('#2A2622'));
  const out = outlined(img);
  if (variant === 2) {
    const pts = [[4, 3], [11, 2], [8, 6], [13, 7], [2, 8]];
    pts.forEach(([x, y], i) => { if ((i + frame) % 2 === 0) { out.set(x, y, C('#FFF7C0')); out.set(x + 1, y + 1, C(CYAN[1])); } });
  }
  return out;
}

function crystal(variant, frame) {
  const img = blank(N, 32);
  const r = rng(80 + variant);
  const shards = [[8, 22, 3], [5, 14, 2], [11, 16, 2], [3, 9, 1], [12, 11, 1]].slice(0, 3 + variant);
  for (const [cx, h, w] of shards) {
    for (let k = 0; k < h; k++) {
      const ww = Math.max(0, w - Math.floor((k * w) / h));
      for (let dx = -ww; dx <= ww; dx++) img.set(cx + dx, 30 - k, C(dx < 0 ? CYAN[2] : dx > 0 ? CYAN[3] : CYAN[1]));
    }
    img.set(cx, 30 - h, C(CYAN[0]));
  }
  for (let x = 2; x < 14; x++) if (r() < 0.7) img.set(x, 31, C('#3A3F48'));
  const out = outlined(img);
  const sy = [12, 18, 9, 22][frame % 4];
  out.set(8, sy, C('#FFFFFF'));
  out.set(7, sy, A('#FFFFFF', 140));
  out.set(9, sy, A('#FFFFFF', 140));
  return out;
}

function column() {
  const img = blank(N, 32);
  fillRect(img, 4, 4, 8, 26, STEEL[4]);
  fillRect(img, 4, 4, 2, 26, STEEL[3]);
  fillRect(img, 3, 2, 10, 3, STEEL[2]);
  fillRect(img, 3, 28, 10, 3, STEEL[5]);
  for (let y = 8; y < 28; y += 5) { img.set(6, y, C(STEEL[1])); img.set(10, y, C(STEEL[1])); }
  for (const [x, y] of [[9, 12], [7, 19], [10, 23], [5, 15]]) img.set(x, y, C(RUST[1]));
  fillRect(img, 4, 17, 8, 1, CYAN[3]);
  for (let x = 3; x < 13; x++) img.set(x, 31, A('#000000', 90));
  return outlined(img);
}

function lever(down) {
  const img = blank();
  fillRect(img, 4, 11, 8, 4, STEEL[4]);
  fillRect(img, 4, 11, 8, 1, STEEL[2]);
  if (down) { line(img, 7, 11, 12, 7, STEEL[1]); disc(img, 12, 7, 1.5, RUST[1]); } else { line(img, 8, 11, 4, 4, STEEL[1]); disc(img, 4, 4, 1.5, CYAN[2]); }
  return outlined(img);
}

// ─────────────────────────────── restos del Resonador ───────────────────────────────

function debris(kind) {
  const img = blank();
  if (kind === 0) {
    // trozo de aro: arco grueso de metal con una luz magenta apagada
    for (let a = 0; a < Math.PI * 0.9; a += 0.02) {
      for (let t = 0; t < 3; t++) {
        const R = 8 - t;
        img.set(Math.round(8 + Math.cos(a + 0.2) * R), Math.round(14 - Math.sin(a + 0.2) * R), C(t === 0 ? STEEL[2] : STEEL[4]));
      }
    }
    img.set(8, 7, C('#B03A8C')); img.set(9, 7, C('#7A2860'));
  } else if (kind === 1) {
    // eslabones rojos de la Cadena Sintética
    for (let i = 0; i < 3; i++) {
      const cx = 4 + i * 4;
      const cy = 11 - (i % 2) * 2;
      for (let a = 0; a < Math.PI * 2; a += 0.3) img.set(Math.round(cx + Math.cos(a) * 2.5), Math.round(cy + Math.sin(a) * 1.6), C(i % 2 ? '#8E1F2A' : '#C23A44'));
    }
  } else if (kind === 2) {
    // placa con el emblema (dos tubos cruzados sobre un círculo)
    fillRect(img, 2, 6, 12, 8, STEEL[3]);
    fillRect(img, 2, 6, 12, 1, STEEL[1]);
    for (let a = 0; a < Math.PI * 2; a += 0.3) img.set(Math.round(8 + Math.cos(a) * 3), Math.round(10 + Math.sin(a) * 3), C('#B03A8C'));
    line(img, 6, 8, 10, 12, '#F2F4F5'); line(img, 10, 8, 6, 12, '#F2F4F5');
  } else {
    // tubo roto
    fillRect(img, 3, 9, 10, 4, STEEL[3]);
    fillRect(img, 3, 9, 10, 1, STEEL[1]);
    fillRect(img, 12, 8, 2, 6, STEEL[5]);
    img.set(5, 11, C(RUST[1]));
  }
  for (let x = 2; x < 14; x++) img.set(x, 15, A('#000000', 60));
  return outlined(img);
}

// ─────────────────────────────── marcas del eco (calcos de suelo) ───────────────────────────────

function mark(kind) {
  const img = blank();
  const r = rng(100 + kind);
  switch (kind) {
    case 0: // rodadas: dos bandas de tacos en la arena
      for (const bx of [4, 10]) for (let y = 0; y < 16; y++) if (y % 3 !== 2) { img.set(bx, y, A('#8C6B3E', 200)); img.set(bx + 1, y, A('#6E5230', 200)); }
      break;
    case 1: // plumas negras con brillo metálico
      for (const [x, y, a] of [[4, 9, 0.5], [10, 6, -0.4], [8, 12, 0.1]]) {
        for (let k = 0; k < 6; k++) img.set(Math.round(x + k * Math.cos(a)), Math.round(y - k * Math.sin(a) * 0.5), C(k === 3 ? '#6A7BD8' : '#181A24'));
      }
      break;
    case 2: // escamas de fuego que brillan
      for (let i = 0; i < 12; i++) img.set(3 + Math.floor(r() * 10), 4 + Math.floor(r() * 9), C(i % 3 ? '#F2A13A' : '#FFE08A'));
      break;
    case 3: // tajo limpio en la piedra
      line(img, 2, 12, 13, 3, '#F4F0FF'); line(img, 3, 12, 14, 3, '#B9A8E6'); line(img, 2, 13, 13, 4, '#5E5670');
      break;
    case 4: // huellas enormes de manos en la chapa
      for (const bx of [3, 9]) {
        fillRect(img, bx, 7, 4, 4, A('#2A3038', 170));
        for (let f = 0; f < 3; f++) img.set(bx + f + (f > 1 ? 1 : 0), 5, A('#2A3038', 170));
      }
      break;
    case 5: // costra de escarcha
      for (let i = 0; i < 40; i++) img.set(1 + Math.floor(r() * 14), 3 + Math.floor(r() * 11), C(FROST[1 + (i % 3)]));
      break;
    case 6: // clavo quemado
      fillRect(img, 7, 8, 2, 5, STEEL[4]); img.set(7, 7, C(STEEL[2])); fillRect(img, 4, 12, 8, 2, A('#1C1A18', 180));
      break;
    default: // destello del eco
      for (let k = -3; k <= 3; k++) { img.set(8 + k, 8, A(CYAN[1], 255 - Math.abs(k) * 50)); img.set(8, 8 + k, A(CYAN[1], 255 - Math.abs(k) * 50)); }
      img.set(8, 8, C('#FFFFFF'));
  }
  return img;
}

// ─────────────────────────────── cuarto de Alerce ───────────────────────────────

function roomObject(kind) {
  const img = blank();
  switch (kind) {
    case 0: // cuaderno de tapas verdes, abierto a medias
      fillRect(img, 3, 7, 10, 6, '#2F6B45'); fillRect(img, 4, 8, 8, 4, '#3C8458'); fillRect(img, 12, 8, 1, 4, '#EDE6D2');
      img.set(5, 9, C('#9CC8A8'));
      break;
    case 1: // pila de cuadernos (verdes y grises)
      for (let i = 0; i < 4; i++) { fillRect(img, 3 + (i % 2), 12 - i * 2, 10, 2, i % 2 ? '#6A6E70' : '#2F6B45'); fillRect(img, 12 + (i % 2), 12 - i * 2, 1, 2, '#EDE6D2'); }
      break;
    case 2: // foto enmarcada: grupo junto a una laguna
      fillRect(img, 2, 3, 12, 10, '#6B4A2E'); fillRect(img, 3, 4, 10, 8, '#9AC4D8'); fillRect(img, 3, 9, 10, 3, '#5C8A4A');
      for (const x of [5, 7, 9, 11]) { img.set(x, 8, C('#3A3030')); img.set(x, 9, C('#3A3030')); }
      break;
    case 3: // mapa clavado con una laguna rodeada a lápiz
      fillRect(img, 2, 3, 12, 10, '#E8DFC4'); disc(img, 8, 8, 3, '#8CC0DC');
      for (let a = 0; a < Math.PI * 2; a += 0.25) img.set(Math.round(8 + Math.cos(a) * 4.5), Math.round(8 + Math.sin(a) * 4), C('#B23A3A'));
      img.set(2, 3, C('#C0C0C0'));
      break;
    case 4: // aparato de escucha: caja con diales y una antena de tres patas
      fillRect(img, 4, 8, 8, 6, STEEL[4]); disc(img, 6, 10, 1.2, '#E8E0B8'); disc(img, 10, 10, 1.2, '#E8E0B8');
      line(img, 8, 8, 8, 2, STEEL[2]); line(img, 8, 2, 5, 5, STEEL[3]); line(img, 8, 2, 11, 5, STEEL[3]);
      break;
    case 5: // caja de archivos con etiqueta
      fillRect(img, 3, 6, 10, 8, '#B08A5A'); fillRect(img, 3, 6, 10, 2, '#C8A472'); fillRect(img, 6, 9, 4, 2, '#F2ECDA');
      break;
    case 6: // recorte de periódico amarillento
      fillRect(img, 3, 4, 10, 9, '#E6DDB8');
      for (let y = 6; y < 12; y += 2) for (let x = 4; x < 12; x++) if ((x + y) % 4) img.set(x, y, C('#6A6450'));
      fillRect(img, 4, 4, 8, 1, '#3A3628');
      break;
    default: // carta doblada
      fillRect(img, 3, 6, 10, 7, '#F2ECDA'); line(img, 3, 6, 8, 10, '#C8BFA8'); line(img, 12, 6, 8, 10, '#C8BFA8');
  }
  return outlined(img);
}

// ─────────────────────────────── hojas ───────────────────────────────

function mouthSheet() {
  const rows = [];
  for (const glow of [false, true]) {
    const big = mouth(glow);
    for (const ty of [0, 1]) rows.push([0, 1, 2, 0].map((tx, i) => (i < 3 ? x2(big.crop(tx * N, ty * N, N, N)) : x2(blank()))));
  }
  return sheet(rows, 32, 32);
}

function main() {
  const frames4 = (fn) => [0, 1, 2, 3].map((f) => x2(fn(f)));
  const sheets = {
    b22e_boca: mouthSheet(),
    b22e_bloque: sheet([frames4(() => block('loose')), frames4((f) => block('locked', f)), frames4((f) => block('hit', f)), frames4(() => block('loose'))], 32, 32),
    b22e_zocalo: sheet([frames4((f) => socket(false, f)), frames4((f) => socket(true, f)), frames4((f) => socket(false, f)), frames4((f) => socket(true, f))], 32, 32),
    b22e_escarcha: sheet([0, 1, 2, 3].map((v) => frames4((f) => frost(v, f))), 32, 32),
    b22e_puas: sheet([0, 1, 2, 3].map((v) => frames4((f) => spikes(v, f))), 32, 32),
    b22e_resonador: sheet([0, 1, 2, 3].map((k) => frames4(() => debris(k))), 32, 32),
    b22e_marcas: sheet([[0, 1, 2, 3].map((k) => x2(mark(k))), [4, 5, 6, 7].map((k) => x2(mark(k))), [0, 1, 2, 3].map((k) => x2(mark(k))), [4, 5, 6, 7].map((k) => x2(mark(k)))], 32, 32),
    b22e_cristal: sheet([0, 1, 2, 0].map((v) => frames4((f) => crystal(v, f))), 32, 64),
    b22e_columna: sheet([0, 1, 2, 3].map(() => frames4(() => column())), 32, 64),
    b22e_palanca: sheet([frames4(() => lever(false)), frames4(() => lever(true)), frames4(() => lever(false)), frames4(() => lever(true))], 32, 32),
    b22e_cuaderno: sheet([[0, 1, 2, 3].map((k) => x2(roomObject(k))), [4, 5, 6, 7].map((k) => x2(roomObject(k))), [0, 1, 2, 3].map((k) => x2(roomObject(k))), [4, 5, 6, 7].map((k) => x2(roomObject(k)))], 32, 32),
  };
  const files = [];
  for (const [name, img] of Object.entries(sheets)) {
    files.push(img.save(path.join(OUT_DIR, `${name}.png`)));
    if (process.argv.includes('--preview')) files.push(preview(img, { scale: 2 }).save(path.join(PREVIEW_DIR, `${name}.png`)));
  }
  for (const f of files) console.log(`→ ${path.relative(ROOT, f)}`);
}

main();
