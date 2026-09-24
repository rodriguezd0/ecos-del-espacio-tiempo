// Arte propio del Bloque 7 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b07_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime), dibujadas a 16 px y
// ampliadas ×2 (escala DS×2):
//   objects/b07_estratos.png   32×32  rocas del derrumbe por estrato (fila 2 arenisca ocre · 4 caliza gris ·
//                                     6 arcilla roja · 8 pizarra negra), fisura blanca y un brillo que pasa
//   objects/b07_escombros.png  32×32  escombro macizo (no se rompe): fila = suelo (2 tierra · 4 arcilla · 6 pizarra ·
//                                     8 tierra oscura del cañón), columna = forma (se fija con `pattern`)
//   objects/b07_corte.png      96×96  corte de los estratos en la cara del bancal (2 normal · 4 franjas resaltadas)
//   objects/b07_tablilla.png   32×32  Tabla Pétrea que brilla en la pizarra
//   objects/b07_veta.png       32×32  veta de piedra activadora (2 dormida · 4 despierta · 6 arrancada)
//   objects/b07_fragua.png     96×64  fragua de la herrería (2 brasas · 4 a pleno fuego con chispas)
//   objects/b07_yunque.png     32×32  yunque sobre tocón (2 solo · 4 con el Mega Aro recién forjado)
//   objects/b07_sillares.png   32×32  sillares cortados apilados (4 variantes por fila)
//   objects/b07_carga.png      32×32  carga de voladura del Consorcio (luz magenta que parpadea)
//   objects/b07_pozo.png       32×32  pozo entre galerías (2 tapado con tablones · 4 abierto con escala · 6 cuerda)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

/** Generador determinista (texturas iguales en cada ejecución). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}

function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) over(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}

function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
    }
  }
}

/** Hoja 4×4 con la misma fila de fotogramas en las cuatro direcciones (o una fila distinta por dirección). */
function rowsSheet(rows, scale = 2) {
  const s = rows.map((r) => r.map((f) => f.scale(scale)));
  return sheet(s, s[0][0].w, s[0][0].h);
}

// ───────────────────────────── Rocas de estrato ─────────────────────────────

export const STRATA_PAL = Object.freeze({
  a: { hi: '#F4DA9E', light: '#E3BC72', mid: '#C4974A', dark: '#8C6430', band: '#F7E6B8', out: '#4A3214' }, // arenisca ocre
  b: { hi: '#F2F2EC', light: '#D2D2CA', mid: '#A6A69C', dark: '#6C6C64', band: '#FFFFFA', out: '#34342E' }, // caliza gris
  c: { hi: '#F0A58C', light: '#D4765A', mid: '#AC4E38', dark: '#742E22', band: '#F2BCA6', out: '#3A160E' }, // arcilla roja
  d: { hi: '#8A909E', light: '#5E6370', mid: '#434753', dark: '#26282F', band: '#9EA4B2', out: '#101116' }, // pizarra negra
});

/** Silueta de roca redondeada 14×12 dentro de 16×16 (máscara). */
function boulderMask(seed) {
  const r = rng(seed);
  const mask = [];
  for (let y = 0; y < 16; y++) {
    mask.push([]);
    for (let x = 0; x < 16; x++) {
      const nx = (x + 0.5 - 8) / 7;
      const ny = (y + 0.5 - 9.5) / 6.2;
      const bump = (r() - 0.5) * 0.12;
      mask[y].push(nx * nx + ny * ny * (y < 9 ? 1.1 : 0.85) <= 1 + bump && y >= 3 && y <= 15);
    }
  }
  return mask;
}

function strataRock(key, frame) {
  const p = STRATA_PAL[key];
  const img = new Img(16, 16);
  const mask = boulderMask(key.charCodeAt(0) * 7);
  const r = rng(key.charCodeAt(0) * 31);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!mask[y][x]) continue;
      // sombreado: luz arriba a la izquierda; bandas horizontales de sedimento cada 3 filas
      const shade = (x + y) / 30;
      let c = shade < 0.35 ? p.light : shade < 0.7 ? p.mid : p.dark;
      if (y % 3 === 1 && y > 4) c = shade < 0.6 ? p.band : p.mid;
      if (y === 14 || y === 15) c = p.dark;
      img.set(x, y, hex(c));
      if (r() < 0.08) img.set(x, y, hex(p.hi));
    }
  }
  // fisura blanca (Embestida): zigzag vertical
  const w = [255, 255, 255, 230];
  for (const [x, y] of [[8, 4], [8, 5], [7, 6], [7, 7], [8, 8], [9, 9], [9, 10], [8, 11], [10, 8]]) over(img, x, y, w);
  // brillo que recorre la roca de izquierda a derecha
  const gx = 3 + frame * 3;
  for (let y = 4; y <= 12; y++) {
    const x = gx + Math.floor((12 - y) / 3);
    if (mask[y]?.[x]) over(img, x, y, [255, 255, 255, 90]);
  }
  return outline(img, p.out);
}

function strataSheet() {
  return rowsSheet(['a', 'b', 'c', 'd'].map((k) => [0, 1, 2, 3].map((f) => strataRock(k, f))));
}

// ───────────────────────────── Escombros ─────────────────────────────

/** Paletas de escombro por suelo de galería: [claro, medio, oscuro, sombra, contorno]. */
const RUBBLE_PAL = Object.freeze({
  2: ['#CDBB9E', '#A8957A', '#7E6E58', '#554A3C', '#2C261E'], // tierra (galería del ocre y exterior)
  4: ['#D69A7A', '#AE7258', '#84503C', '#5A3426', '#2A140C'], // arcilla roja
  6: ['#AEB6C2', '#8490A0', '#5E6674', '#3C424C', '#16191E'], // pizarra gris azulada
  8: ['#BFAE8E', '#998868', '#72644C', '#4E4434', '#241E16'], // tierra oscura (derrumbe del cañón)
});

/** Montón de escombro que llena la casilla (base ancha para que los vecinos formen un solo derrumbe). */
function rubbleFrame(row, v) {
  const [light, mid, dark, shadow, out] = RUBBLE_PAL[row];
  const img = new Img(16, 16);
  const r = rng(100 + v * 17 + row * 3);
  for (let y = 3; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const nx = (x + 0.5 - 8) / 8.2;
      const ny = (y + 0.5 - 10.5) / 6.4;
      if (nx * nx + ny * ny > 1.05) continue;
      img.set(x, y, hex(y > 12 ? shadow : dark));
    }
  }
  const stones = [];
  for (let i = 0; i < 6; i++) stones.push({ x: 2 + r() * 12, y: 5 + r() * 8, rad: 1.8 + r() * 2.4 });
  stones.sort((a, b) => a.y - b.y);
  for (const s of stones) {
    for (let y = Math.floor(s.y - s.rad); y <= Math.ceil(s.y + s.rad); y++) {
      for (let x = Math.floor(s.x - s.rad); x <= Math.ceil(s.x + s.rad); x++) {
        const d = ((x + 0.5 - s.x) ** 2 + (y + 0.5 - s.y) ** 2) / (s.rad * s.rad);
        if (d > 1 || y > 15 || y < 2) continue;
        const lit = (x - s.x) + (y - s.y) < -0.8;
        img.set(x, y, hex(lit ? light : d > 0.6 ? dark : mid));
      }
    }
  }
  return outline(img, out);
}

function rubbleSheet() {
  return rowsSheet([2, 4, 6, 8].map((row) => [0, 1, 2, 3].map((v) => rubbleFrame(row, v))));
}

// ───────────────────────────── Corte de los estratos ─────────────────────────────

function corteFrame(highlight) {
  const img = new Img(48, 48);
  const r = rng(777);
  const bands = [
    { key: 'a', to: 11 }, { key: 'b', to: 22 }, { key: 'c', to: 34 }, { key: 'd', to: 47 },
  ];
  // bordes ondulados entre capas (misma ondulación en cada columna) y silueta de frente de cantera recortado:
  // arriba dentado, los lados algo irregulares y la base recta (se apoya en el pie de la cara del bancal).
  const wobble = Array.from({ length: 48 }, (_, x) => Math.round(Math.sin(x / 5) * 1.2 + Math.sin(x / 2.3) * 0.6));
  const top = Array.from({ length: 48 }, (_, x) => 2 + Math.round(Math.abs(Math.sin(x / 3.1)) * 3 + (x % 7 === 0 ? 1 : 0)));
  const side = Array.from({ length: 48 }, (_, y) => Math.round(Math.abs(Math.sin(y / 4.3)) * 2));
  for (let x = 0; x < 48; x++) {
    let b = 0;
    for (let y = 0; y < 48; y++) {
      if (y < top[x] || x < side[y] || x > 47 - side[y]) continue;
      while (b < bands.length - 1 && y > bands[b].to + wobble[x]) b += 1;
      const p = STRATA_PAL[bands[b].key];
      // vetas finas discontinuas dentro de cada capa (sedimento), sin rayado regular
      const vein = (y + (x >> 3)) % 5 === 2 && ((x * 7 + y * 3) % 11) < 7;
      let c = vein ? p.band : p.mid;
      const tex = r();
      if (tex < 0.12) c = p.light;
      else if (tex > 0.93) c = p.dark;
      if (y >= 45) c = p.dark;
      img.set(x, y, hex(c));
    }
  }
  // grietas y marcas de pico
  line(img, 10, 14, 13, 20, rgba('#2A2018', 160));
  line(img, 33, 26, 30, 31, rgba('#2A2018', 160));
  line(img, 40, 6, 42, 10, rgba('#2A2018', 160));
  // contacto entre capas resaltado (lección de Alerce)
  if (highlight) {
    for (const band of bands.slice(0, 3)) {
      for (let x = 2; x < 46; x++) over(img, x, band.to + wobble[x], [255, 255, 230, 220]);
    }
  }
  // cantos laterales oscuros para asentarlo en la cara de roca
  return outline(img, '#2E2418');
}

function corteSheet() {
  const normal = corteFrame(false);
  const lit = corteFrame(true);
  return rowsSheet([[normal, normal, normal, normal], [lit, lit, lit, lit], [normal, normal, normal, normal], [normal, normal, normal, normal]]);
}

// ───────────────────────────── Tabla Pétrea ─────────────────────────────

function tabletFrame(f) {
  const img = new Img(16, 16);
  const glow = [0, 1, 2, 1][f];
  disc(img, 8, 9.5, 6.5 + glow * 0.4, [255, 236, 170, 50 + glow * 25]);
  for (let y = 5; y <= 13; y++) {
    for (let x = 3; x <= 12; x++) {
      const edge = y === 5 || x === 3;
      img.set(x, y, hex(edge ? '#E2C48E' : x === 12 || y === 13 ? '#7A5A30' : '#B98D55'));
    }
  }
  // glifo tallado (roca)
  for (const [x, y] of [[6, 7], [7, 7], [8, 7], [9, 7], [7, 8], [8, 8], [6, 9], [9, 9], [6, 10], [7, 11], [8, 11], [9, 10]]) img.set(x, y, hex('#5E4222'));
  if (glow === 2) { img.set(4, 6, hex('#FFFFFF')); img.set(11, 12, hex('#FFF4D0')); }
  return outline(img, '#3A2610');
}

function tabletSheet() {
  const frames = [0, 1, 2, 3].map(tabletFrame);
  return rowsSheet([frames, frames, frames, frames]);
}

// ───────────────────────────── Veta de piedra activadora ─────────────────────────────

const KEY = ['#FF9A3C', '#FFD35A', '#6FD3FF', '#FF5A7A', '#B6FF7A'];

function veinFrame(state, f) {
  const img = new Img(16, 16);
  const r = rng(55);
  // bloque de pizarra (misma silueta que las rocas de estrato) atravesado por la veta
  const mask = boulderMask(91);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!mask[y][x] && !(y >= 2 && y <= 15 && x >= 2 && x <= 13 && mask[Math.min(15, y + 1)][x])) continue;
      img.set(x, y, hex(r() < 0.15 ? '#5E6370' : y % 4 === 2 ? '#4B505C' : '#3A3E48'));
    }
  }
  const pts = [[3, 13], [4, 12], [5, 11], [6, 10], [9, 7], [10, 6], [11, 5], [12, 5]];
  if (state === 'taken') {
    disc(img, 8, 8, 2.5, rgba('#15161A'));
    if (f % 2 === 0) over(img, 9, 7, [255, 220, 150, 160]);
    return outline(img, '#101116');
  }
  pts.forEach(([x, y], i) => {
    const c = KEY[i % KEY.length];
    const bright = state === 'awake';
    over(img, x, y, rgba(c, bright ? 255 : 150));
    over(img, x + 1, y, rgba(c, bright ? 220 : 110));
    over(img, x, y + 1, rgba('#1A1C22', 200));
  });
  // piedra redonda del centro con la doble hélice (como las piedras activadoras)
  disc(img, 8, 8, 2.6, rgba(state === 'awake' ? '#FFE9A8' : '#B8A77A'));
  over(img, 7, 7, rgba('#FF6A3C')); over(img, 9, 9, rgba('#3C8CFF')); over(img, 8, 8, rgba('#FFFFFF', state === 'awake' ? 255 : 120));
  if (state === 'awake') {
    const sp = [[4, 3], [12, 9], [2, 8], [11, 13]][f];
    over(img, sp[0], sp[1], [255, 255, 255, 255]);
    over(img, sp[0] - 1, sp[1], [255, 255, 255, 140]); over(img, sp[0] + 1, sp[1], [255, 255, 255, 140]);
    over(img, sp[0], sp[1] - 1, [255, 255, 255, 140]); over(img, sp[0], sp[1] + 1, [255, 255, 255, 140]);
  }
  return outline(img, '#101116');
}

function veinSheet() {
  const rows = ['dormant', 'awake', 'taken', 'dormant'].map((s) => [0, 1, 2, 3].map((f) => veinFrame(s, f)));
  return rowsSheet(rows);
}

// ───────────────────────────── Fragua ─────────────────────────────

function forgeFrame(strong, f) {
  const img = new Img(48, 32);
  // campana de ladrillo con chimenea
  for (let y = 0; y < 32; y++) {
    for (let x = 6; x < 42; x++) {
      const inHood = y < 12 && x >= 14 + Math.max(0, 6 - y) && x < 34 - Math.max(0, 6 - y);
      const inBase = y >= 12;
      if (!inHood && !inBase) continue;
      const brick = ((y >> 2) % 2 === 0 ? x : x + 3) % 7 === 0 || y % 4 === 0;
      img.set(x, y, hex(brick ? '#5A2E22' : (x + y) % 9 === 0 ? '#A0584A' : '#8A4636'));
    }
  }
  // boca del fuego
  for (let y = 16; y <= 26; y++) for (let x = 16; x <= 31; x++) img.set(x, y, hex('#1C0E08'));
  // brasas y llamas
  const tall = strong ? [3, 5, 4, 6][f] : [1, 2, 1, 2][f];
  for (let x = 17; x <= 30; x++) {
    const h = Math.max(1, tall - Math.abs(x - 23.5) / 3 + ((x + f) % 3 === 0 ? 1 : 0));
    for (let k = 0; k < h; k++) {
      const y = 25 - k;
      img.set(x, y, hex(k === 0 ? '#FF6A1A' : k < h * 0.6 ? '#FFA533' : '#FFE27A'));
    }
  }
  for (let x = 17; x <= 30; x += 2) img.set(x, 26, hex('#FF3A12'));
  // repisa de piedra y fuelle
  for (let x = 12; x <= 35; x++) { img.set(x, 27, hex('#C9C4B8')); img.set(x, 28, hex('#8E8A80')); }
  for (let y = 22; y <= 29; y++) for (let x = 38; x <= 45; x++) if ((x - 38) + Math.abs(y - 26) < 8) img.set(x, y, hex(y === 22 ? '#B0804A' : '#7A5028'));
  if (strong) {
    const sparks = [[20, 10], [27, 8], [24, 5], [30, 12]];
    const [sx, sy] = sparks[f];
    over(img, sx, sy, [255, 240, 160, 255]); over(img, sx + 3, sy + 4, [255, 200, 90, 220]);
  }
  return outline(img, '#24110A');
}

function forgeSheet() {
  const rows = [false, true, false, false].map((s) => [0, 1, 2, 3].map((f) => forgeFrame(s, f)));
  return rowsSheet(rows);
}

// ───────────────────────────── Yunque ─────────────────────────────

function anvilFrame(ring, f) {
  const img = new Img(16, 16);
  // tocón
  for (let y = 11; y <= 15; y++) for (let x = 4; x <= 11; x++) img.set(x, y, hex(y === 11 ? '#C49A62' : x > 9 ? '#6A4424' : '#8E6034'));
  // yunque
  for (let x = 2; x <= 13; x++) img.set(x, 6, hex('#8A8E96'));
  for (let x = 1; x <= 13; x++) img.set(x, 7, hex('#4E525A'));
  for (let y = 8; y <= 10; y++) for (let x = 6; x <= 10; x++) img.set(x, y, hex('#3A3D44'));
  for (let x = 4; x <= 12; x++) img.set(x, 10, hex('#2E3036'));
  if (ring) {
    const gl = [0, 1, 2, 1][f];
    disc(img, 8, 4.5, 3 + gl * 0.3, [255, 230, 150, 60 + gl * 30]);
    for (const [x, y] of [[6, 4], [7, 3], [9, 3], [10, 4], [9, 5], [7, 5]]) img.set(x, y, hex('#C0C4CC'));
    img.set(8, 3, hex('#FFD35A')); img.set(8, 4, hex('#FF6A3C'));
  }
  return outline(img, '#18191C');
}

function anvilSheet() {
  const plain = [0, 1, 2, 3].map((f) => anvilFrame(false, f));
  const ring = [0, 1, 2, 3].map((f) => anvilFrame(true, f));
  return rowsSheet([plain, ring, plain, plain]);
}

// ───────────────────────────── Sillares ─────────────────────────────

function blocksFrame(v) {
  const img = new Img(16, 16);
  const keys = [['a', 'b'], ['b', 'b'], ['a', 'c'], ['b', 'd']][v];
  const block = (x0, y0, w, h, key) => {
    const p = STRATA_PAL[key];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) img.set(x, y, hex(y === y0 ? p.hi : x === x0 + w - 1 || y === y0 + h - 1 ? p.dark : p.light));
    for (let x = x0 + 1; x < x0 + w - 1; x++) img.set(x, y0 + 1, hex(p.band));
  };
  block(1, 9, 8, 6, keys[0]);
  block(8, 10, 7, 5, keys[1]);
  block(3, 4, 8, 5, keys[v % 2]);
  if (v === 3) block(10, 5, 5, 5, 'a');
  return outline(img, '#2A2218');
}

function blocksSheet() {
  return rowsSheet([0, 1, 2, 3].map((v) => { const f = blocksFrame(v); return [f, f, f, f]; }));
}

// ───────────────────────────── Carga del Consorcio ─────────────────────────────

const GEN = { petrol: '#1F4E5A', petrolHi: '#2E6E7E', white: '#F2F4F5', coal: '#2B2D31', magenta: '#B03A8C', magHi: '#FF8AD8' };

function chargeFrame(f) {
  const img = new Img(16, 16);
  for (let y = 8; y <= 14; y++) for (let x = 3; x <= 12; x++) img.set(x, y, hex(y === 8 ? GEN.petrolHi : x === 12 || y === 14 ? GEN.coal : GEN.petrol));
  for (let x = 4; x <= 11; x++) img.set(x, 11, hex(GEN.white));
  // emblema (dos tubos cruzados sobre un círculo, en pequeño)
  img.set(7, 12, hex(GEN.magenta)); img.set(8, 12, hex(GEN.magenta)); img.set(7, 13, hex(GEN.magenta));
  // antena y luz
  line(img, 11, 8, 13, 4, rgba(GEN.coal));
  const on = f % 2 === 0;
  disc(img, 13.5, 3.5, on ? 2.2 : 1.2, rgba(on ? GEN.magHi : GEN.magenta, on ? 230 : 200));
  // cable
  line(img, 3, 13, 0, 15, rgba('#6A2A5A'));
  return outline(img, '#101214');
}

function chargeSheet() {
  const frames = [0, 1, 2, 3].map(chargeFrame);
  return rowsSheet([frames, frames, frames, frames]);
}

// ───────────────────────────── Pozo y cuerda ─────────────────────────────

function shaftFrame(state, f) {
  const img = new Img(16, 16);
  if (state === 'rope') {
    // cuerda que baja de un clavo en la roca, con nudos
    img.set(8, 0, hex('#8E8A80')); img.set(8, 1, hex('#5E5A52'));
    for (let y = 2; y <= 14; y++) img.set(8 + (y % 6 === 0 ? 1 : 0), y, hex(y % 4 === 0 ? '#6E4A24' : '#B08A50'));
    for (const y of [5, 9, 13]) { img.set(7, y, hex('#8A6434')); img.set(9, y, hex('#8A6434')); }
    return outline(img, '#2A1C0E');
  }
  // boca del pozo
  disc(img, 8, 9, 6.4, rgba('#5A5042'));
  disc(img, 8, 9, 5.2, rgba('#0C0A08'));
  if (state === 'covered') {
    for (let k = 0; k < 3; k++) {
      const y0 = 4 + k * 4;
      for (let y = y0; y < y0 + 3; y++) for (let x = 1; x <= 14; x++) img.set(x, y, hex(y === y0 ? '#D6A866' : y === y0 + 2 ? '#7A5028' : '#B0804A'));
      img.set(3, y0 + 1, hex('#3A3A3A')); img.set(12, y0 + 1, hex('#3A3A3A'));
    }
  } else {
    // escala de cuerda que baja al fondo
    for (let y = 4; y <= 14; y++) { img.set(6, y, hex('#B08A50')); img.set(10, y, hex('#B08A50')); }
    for (let y = 5; y <= 13; y += 2) for (let x = 7; x <= 9; x++) img.set(x, y, hex('#8A6434'));
    if (f === 1 || f === 3) over(img, 8, 15, [255, 255, 255, 60]);
  }
  return outline(img, '#1A140C');
}

function shaftSheet() {
  const rows = ['covered', 'open', 'rope', 'covered'].map((s) => [0, 1, 2, 3].map((f) => shaftFrame(s, f)));
  return rowsSheet(rows);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const made = {
    estratos: save(strataSheet(), 'b07_estratos.png'),
    escombros: save(rubbleSheet(), 'b07_escombros.png'),
    corte: save(corteSheet(), 'b07_corte.png'),
    tablilla: save(tabletSheet(), 'b07_tablilla.png'),
    veta: save(veinSheet(), 'b07_veta.png'),
    fragua: save(forgeSheet(), 'b07_fragua.png'),
    yunque: save(anvilSheet(), 'b07_yunque.png'),
    sillares: save(blocksSheet(), 'b07_sillares.png'),
    carga: save(chargeSheet(), 'b07_carga.png'),
    pozo: save(shaftSheet(), 'b07_pozo.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [name, img] of Object.entries(made)) {
      files.push(preview(img, { scale: 2, bg: '#7A6A58' }).save(path.join(PREVIEW, `b07_${name}.png`)));
    }
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b07_assets: ${err.message}`);
  process.exitCode = 1;
}
