// Arte propio del Bloque 6 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b06_assets.mjs [--preview]
// Todas son hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime):
//   objects/rafagas.png           32×32  ráfaga de fuerza 1: estelas blancas y un galón suave en la dirección
//   objects/rafagas_fuertes.png   32×32  ráfaga de fuerza 2: tres estelas densas y doble galón azulado
//   objects/veleta.png            32×64  veleta de hierro con flecha de cobre (la fila = hacia dónde apunta)
//   objects/colector.png          64×64  esfera «Muestra Z-2» de Genesis con N2 dentro
//                                        (fila 2 activa · 4 agrietada · 6 rota · 8 base apagada)
//   objects/aerogenerador.png     64×128 aerogenerador blanco; las columnas giran las palas 30° (quieto = patrón 0)
//   objects/campana_viento.png    64×96  campana de bronce bajo un dintel de piedra con banda de hexágonos
//                                        (fila 2 quieta · 4 balanceo · 6 resonando · 8 = 2)
//   objects/hoguera.png           32×32  hoguera con olla (campamento de Abril)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

/** Rota 90° en sentido horario (nueva imagen). */
function rotCW(img) {
  const out = new Img(img.h, img.w);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) out.set(img.h - 1 - y, x, img.get(x, y));
  return out;
}
const rot180 = (img) => rotCW(rotCW(img));
const rotCCW = (img) => rotCW(rot180(img));

/** Mezcla un color encima respetando alfa (para brillos semitransparentes). */
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

/** Hoja 4×4 a partir de los fotogramas «hacia la derecha» (nativos): filas abajo, izquierda, derecha, arriba. */
function directionalSheet(rightFrames, scale = 2) {
  const rows = [rightFrames.map(rotCW), rightFrames.map(rot180), rightFrames, rightFrames.map(rotCCW)];
  const s = rows.map((r) => r.map((f) => f.scale(scale)));
  return sheet(s, s[0][0].w, s[0][0].h);
}

// ───────────────────────────── Ráfagas ─────────────────────────────

const WIND = { white: rgba('#FFFFFF', 215), pale: rgba('#DDF3FF', 170), blue: rgba('#9FD4F2', 150), deep: rgba('#5E9FD6', 190) };

/** Estela horizontal con cabeza brillante y cola que se desvanece (x de la cabeza, envuelve en 16). */
function streak(img, head, y, len, strong) {
  for (let i = 0; i < len; i++) {
    const x = (((head - i) % 16) + 16) % 16;
    const a = Math.round((strong ? 230 : 200) * (1 - i / (len + 1)));
    const c = i === 0 ? [255, 255, 255, a] : [214, 240, 255, a];
    over(img, x, y, c);
    if (strong && i < len - 2) over(img, x, y + 1, [159, 212, 242, Math.round(a * 0.55)]);
  }
}

// Flechas del viento (nativas 16×16, hacia la derecha): 'o' contorno, 'x' relleno.
const ARROW_SOFT = [
  '................',
  '................',
  '................',
  '................',
  '.........o......',
  '.........oo.....',
  '...ooooooxxo....',
  '...oxxxxxxxxo...',
  '...ooooooxxo....',
  '.........oo.....',
  '.........o......',
  '................',
];
const ARROW_DOUBLE = [
  '................',
  '................',
  '................',
  '.....o....o.....',
  '.....oo...oo....',
  '......oo...oo...',
  '.......oo...oo..',
  '........xo...xo.',
  '.......oo...oo..',
  '......oo...oo...',
  '.....oo...oo....',
  '.....o....o.....',
];

function drawPattern(img, rows, colors, dy = 0) {
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (colors[ch]) over(img, x, y + dy, colors[ch]); }));
}

function gustFrame(f, strong) {
  const img = new Img(16, 16);
  const shift = f * 4;
  if (strong) {
    drawPattern(img, ARROW_DOUBLE, { o: [94, 159, 214, 205], x: [255, 255, 255, 230] }, 1);
    streak(img, 3 + shift, 1, 6, true);
    streak(img, 11 + shift, 14, 6, true);
  } else {
    drawPattern(img, ARROW_SOFT, { o: [159, 212, 242, 150], x: [255, 255, 255, 120] }, 1);
    streak(img, 2 + shift, 2, 5, false);
    streak(img, 10 + shift, 13, 5, false);
  }
  return img;
}

// ───────────────────────────── Veleta ─────────────────────────────

const IRON = { dark: '#2F343B', mid: '#4A515B', hi: '#7C8591' };
const COPPER = { hi: '#F0A866', mid: '#C87533', dark: '#8A4A1E', out: '#4A2A12' };
const STONE = { hi: '#C9C4B8', mid: '#9A968C', dark: '#6E6A61', out: '#2E2C28' };

function arrowRight(img, cx, cy, wob) {
  const y = cy + wob;
  for (let x = cx - 5; x <= cx + 4; x++) img.set(x, y, hex(COPPER.mid));
  for (let x = cx - 4; x <= cx + 3; x++) img.set(x, y - 1, hex(COPPER.hi));
  // punta
  for (let k = 0; k < 3; k++) { img.set(cx + 5 + k, y - 2 + k, hex(COPPER.mid)); img.set(cx + 5 + k, y + 2 - k, hex(COPPER.dark)); }
  img.set(cx + 5, y - 1, hex(COPPER.hi)); img.set(cx + 5, y, hex(COPPER.mid)); img.set(cx + 6, y, hex(COPPER.mid)); img.set(cx + 5, y + 1, hex(COPPER.dark));
  // cola (plumas)
  for (let k = 0; k < 3; k++) { img.set(cx - 5 - k, y - 1 - k, hex(COPPER.mid)); img.set(cx - 5 - k, y + 1 + k, hex(COPPER.dark)); }
}

function arrowVertical(img, cx, cy, up, wob) {
  const x = cx + wob;
  const tip = up ? cy - 5 : cy + 4;
  const tail = up ? cy + 3 : cy - 4;
  const step = up ? 1 : -1;
  for (let y = Math.min(tip, tail); y <= Math.max(tip, tail); y++) { img.set(x, y, hex(COPPER.mid)); img.set(x + 1, y, hex(COPPER.dark)); }
  // punta ancha (triángulo relleno) para que se lea bien hacia dónde apunta
  for (let k = 0; k < 4; k++) {
    for (let i = -k; i <= k + 1; i++) img.set(x + i, tip + step * k, hex(i <= 0 ? COPPER.hi : COPPER.mid));
  }
  // cola en V, pequeña
  img.set(x - 1, tail, hex(COPPER.dark)); img.set(x + 2, tail, hex(COPPER.dark));
  img.set(x - 1, tail - step, hex(COPPER.mid)); img.set(x + 2, tail - step, hex(COPPER.mid));
}

function vaneFrame(dir, f) {
  const img = new Img(16, 32);
  // peana de piedra
  for (let y = 26; y <= 30; y++) for (let x = 4; x <= 11; x++) img.set(x, y, hex(y === 26 ? STONE.hi : x >= 10 || y === 30 ? STONE.dark : STONE.mid));
  // mástil
  for (let y = 9; y <= 26; y++) { img.set(7, y, hex(IRON.hi)); img.set(8, y, hex(IRON.mid)); }
  // cruz de rumbos
  for (let x = 4; x <= 11; x++) img.set(x, 14, hex(IRON.mid));
  for (let y = 12; y <= 16; y++) img.set(7, y, hex(IRON.hi));
  img.set(4, 13, hex(IRON.hi)); img.set(11, 13, hex(IRON.hi));
  // remate
  img.set(7, 9, hex(COPPER.hi)); img.set(8, 9, hex(COPPER.mid));
  const wob = f === 1 ? -1 : f === 3 ? 1 : 0;
  if (dir === 6) arrowRight(img, 8, 6, wob);
  else if (dir === 4) { const r = new Img(16, 32); arrowRight(r, 8, 6, wob); img.blit(r.mirrorX()); }
  else arrowVertical(img, 7, 5, dir === 8, wob);
  return outline(img, STONE.out);
}

function vaneSheet() {
  const rows = [2, 4, 6, 8].map((d) => [0, 1, 2, 3].map((f) => vaneFrame(d, f).scale(2)));
  return sheet(rows, 32, 64);
}

// ───────────────────────────── Colector «Muestra Z-2» ─────────────────────────────

const GEN = { petrol: '#1F4E5A', petrolHi: '#2E6E7E', white: '#F2F4F5', coal: '#2B2D31', coalHi: '#44474E', magenta: '#B03A8C', magHi: '#FF8AD8', out: '#15171A' };
const ZYG = ['#E6FFB0', '#B9FF66', '#7FD84A', '#4E9A32', '#23461A'];

function collectorBase(img, f, lights) {
  // plataforma
  for (let y = 21; y <= 29; y++) {
    const w = y < 23 ? 11 : 13;
    for (let x = 16 - w; x <= 15 + w; x++) img.set(x, y, hex(y === 21 ? GEN.coalHi : y >= 28 ? GEN.out : y === 24 || y === 25 ? GEN.petrol : GEN.coal));
  }
  for (let x = 6; x <= 25; x++) img.set(x, 24, hex(GEN.petrolHi));
  // anillo que sujeta la esfera
  for (let x = 9; x <= 22; x++) { img.set(x, 20, hex(GEN.white)); img.set(x, 19, hex('#C9CED2')); }
  // luces magenta
  if (lights) {
    const on = [f % 2 === 0, f % 2 === 1, f % 2 === 0];
    [7, 16, 24].forEach((x, i) => img.set(x, 26, hex(on[i] ? GEN.magHi : GEN.magenta)));
  }
  // cables
  line(img, 2, 29, 5, 25, rgba(GEN.coal)); line(img, 29, 29, 26, 25, rgba(GEN.coal));
}

function glassSphere(img, cracked) {
  const cx = 15.5; const cy = 11.5; const r = 9;
  for (let y = 1; y <= 21; y++) {
    for (let x = 5; x <= 27; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > r) continue;
      if (d > r - 1) over(img, x, y, rgba('#7FA8B6', 230));
      else over(img, x, y, rgba('#CFEAF3', 70));
    }
  }
  // brillo
  line(img, 10, 5, 13, 3, rgba('#FFFFFF', 220));
  over(img, 9, 7, rgba('#FFFFFF', 200)); over(img, 11, 4, rgba('#FFFFFF', 180));
  if (cracked) {
    const w = rgba('#FFFFFF', 235);
    line(img, 20, 4, 18, 8, w); line(img, 18, 8, 21, 11, w); line(img, 18, 8, 15, 9, w);
    line(img, 9, 14, 12, 16, w); line(img, 12, 16, 11, 19, w);
  }
}

function core(img, f, bright) {
  const pulse = [0, 1, 2, 1][f];
  const cx = 15.5; const cy = 11.5;
  disc(img, cx, cy, 5 + pulse * 0.6 + (bright ? 1 : 0), rgba(ZYG[1], bright ? 120 : 70));
  disc(img, cx, cy, 3.4, rgba(ZYG[3]));
  disc(img, cx, cy, 2.6, rgba(ZYG[2]));
  // hexágono del núcleo
  const hexPts = [[15, 9], [16, 9], [17, 10], [17, 12], [16, 13], [15, 13], [14, 12], [14, 10]];
  for (const [x, y] of hexPts) img.set(x, y, hex(ZYG[bright ? 0 : 1]));
  img.set(15, 11, hex(ZYG[4])); img.set(16, 11, hex(ZYG[4]));
  if (pulse === 2 || bright) { img.set(15, 10, hex(ZYG[0])); img.set(16, 12, hex(ZYG[0])); }
}

function collectorFrame(state, f) {
  const img = new Img(32, 32);
  collectorBase(img, f, state !== 'off');
  if (state === 'active' || state === 'cracked') {
    core(img, f, state === 'cracked');
    glassSphere(img, state === 'cracked');
  } else {
    // esfera rota: cascos en el borde y trozos por el suelo
    const shard = rgba('#BFE0EA', 220);
    for (const [x, y] of [[8, 16], [9, 14], [22, 15], [23, 17], [10, 18], [21, 18]]) over(img, x, y, shard);
    line(img, 7, 19, 10, 13, rgba('#7FA8B6', 230)); line(img, 24, 19, 21, 13, rgba('#7FA8B6', 230));
    if (state === 'broken') for (const [x, y] of [[4, 30], [27, 30], [12, 31], [19, 31]]) over(img, x, y, shard);
  }
  return outline(img, GEN.out);
}

function collectorSheet() {
  const rows = ['active', 'cracked', 'broken', 'off'].map((s) => [0, 1, 2, 3].map((f) => collectorFrame(s, f).scale(2)));
  return sheet(rows, 64, 64);
}

// ───────────────────────────── Aerogenerador ─────────────────────────────

const TURB = { white: '#F4F8FA', light: '#DCE4EA', mid: '#B7C3CC', dark: '#7D8A94', out: '#3E4A54', stripe: '#4A7FC0' };

function turbineFrame(f) {
  const img = new Img(32, 64);
  // torre cónica
  for (let y = 18; y <= 63; y++) {
    const k = (y - 18) / 45;
    const half = 1 + k * 1.6;
    for (let x = Math.floor(15.5 - half); x <= Math.ceil(15.5 + half); x++) {
      const c = x < 15 ? TURB.white : x === 15 || x === 16 ? TURB.light : TURB.mid;
      img.set(x, y, hex(y >= 55 && y <= 57 ? TURB.stripe : c));
    }
  }
  // góndola
  for (let y = 14; y <= 18; y++) for (let x = 12; x <= 20; x++) img.set(x, y, hex(y === 14 ? TURB.white : y === 18 ? TURB.mid : x > 18 ? TURB.light : TURB.white));
  // palas (3), giro de 30° por fotograma
  const cx = 12.5; const cy = 16;
  for (let b = 0; b < 3; b++) {
    const a = ((f * 30 + b * 120 - 90) * Math.PI) / 180;
    const ex = cx + Math.cos(a) * 14; const ey = cy + Math.sin(a) * 14;
    line(img, cx, cy, ex, ey, rgba(TURB.white));
    const nx = -Math.sin(a); const ny = Math.cos(a);
    line(img, cx + nx, cy + ny, ex + nx * 0.5, ey + ny * 0.5, rgba(TURB.mid));
  }
  // buje
  disc(img, cx, cy, 1.6, rgba(TURB.light));
  img.set(12, 16, hex(TURB.dark));
  return outline(img, TURB.out);
}

function turbineSheet() {
  const frames = [0, 1, 2, 3].map((f) => turbineFrame(f).scale(2));
  return sheet([frames, frames, frames, frames], 64, 128);
}

// ───────────────────────────── Campana del Anillo ─────────────────────────────

const BRONZE = { hi: '#F4D27A', light: '#D9A441', mid: '#B07A2A', dark: '#7A5018', out: '#3A260C' };
const LINTEL = { hi: '#D6D2C6', mid: '#B0ABA0', dark: '#86817A', band: '#9B968C', out: '#3E3C37' };

function drawBellBody(img, angle, glow) {
  const pivotX = 15.5; const pivotY = 12;
  const shear = Math.tan((angle * Math.PI) / 180);
  const put = (x, y, c) => {
    const nx = Math.round(x + (y - pivotY) * shear);
    img.set(nx, y, hex(c));
  };
  // cuerda
  for (let y = 12; y <= 14; y++) put(15, y, '#6B5A3E');
  // cuerpo acampanado
  for (let y = 15; y <= 30; y++) {
    const t = (y - 15) / 15;
    const half = 3 + t * t * 5 + (y >= 28 ? 1 : 0);
    for (let x = Math.floor(pivotX - half); x <= Math.ceil(pivotX + half - 1); x++) {
      const rel = (x - (pivotX - half)) / (2 * half);
      let c = rel < 0.25 ? BRONZE.light : rel < 0.6 ? BRONZE.mid : BRONZE.dark;
      if (y === 15 || y === 16) c = BRONZE.light;
      if (y >= 29) c = rel < 0.5 ? BRONZE.mid : BRONZE.dark;
      if (glow && rel < 0.35 && y < 27) c = BRONZE.hi;
      put(x, y, c);
    }
  }
  // brillo vertical
  for (let y = 17; y <= 26; y++) put(12 + Math.floor((y - 17) / 5), y, BRONZE.hi);
  // badajo
  put(15, 31, BRONZE.dark); put(16, 31, BRONZE.dark); put(15, 32, BRONZE.mid);
}

function bellFrame(state, f) {
  const img = new Img(32, 48);
  // postes
  for (const x0 of [2, 26]) {
    for (let y = 9; y <= 46; y++) for (let x = x0; x <= x0 + 3; x++) img.set(x, y, hex(x === x0 ? LINTEL.hi : x === x0 + 3 ? LINTEL.dark : LINTEL.mid));
    for (let x = x0 - 1; x <= x0 + 4; x++) { img.set(x, 45, hex(LINTEL.dark)); img.set(x, 46, hex(LINTEL.dark)); }
  }
  // dintel con banda de hexágonos
  for (let y = 5; y <= 11; y++) for (let x = 0; x <= 31; x++) img.set(x, y, hex(y === 5 ? LINTEL.hi : y === 11 ? LINTEL.dark : LINTEL.mid));
  for (let x = 3; x <= 28; x += 5) {
    const lit = state === 'ring';
    const c = lit ? '#FFFFFF' : LINTEL.band;
    img.set(x, 7, hex(c)); img.set(x + 1, 7, hex(c)); img.set(x - 1, 8, hex(c)); img.set(x + 2, 8, hex(c)); img.set(x, 9, hex(c)); img.set(x + 1, 9, hex(c));
  }
  const angle = state === 'swing' ? [-14, -5, 14, 5][f] : 0;
  drawBellBody(img, angle, state === 'ring');
  const out = outline(img, LINTEL.out);
  if (state === 'ring') {
    const r = 11 + f * 2;
    for (let a = 0; a < 360; a += 6) {
      const x = 15.5 + Math.cos((a * Math.PI) / 180) * r;
      const y = 24 + Math.sin((a * Math.PI) / 180) * r * 0.75;
      over(out, Math.round(x), Math.round(y), [230, 246, 255, 160 - f * 30]);
    }
  } else if (state === 'idle' && f === 2) {
    over(out, 11, 18, [255, 255, 255, 200]);
  }
  return out;
}

function bellSheet() {
  const rows = ['idle', 'swing', 'ring', 'idle'].map((s) => [0, 1, 2, 3].map((f) => bellFrame(s, f).scale(2)));
  return sheet(rows, 64, 96);
}

// ───────────────────────────── Hoguera con olla ─────────────────────────────

function fireFrame(f) {
  const img = new Img(16, 16);
  // corro de piedras
  for (const [x, y] of [[2, 12], [4, 13], [7, 14], [10, 13], [12, 12], [2, 10], [13, 10]]) {
    img.set(x, y, hex(STONE.hi)); img.set(x + 1, y, hex(STONE.mid)); img.set(x, y + 1, hex(STONE.dark)); img.set(x + 1, y + 1, hex(STONE.dark));
  }
  // leños cruzados
  line(img, 4, 12, 11, 10, rgba('#8A5A30')); line(img, 4, 10, 11, 12, rgba('#5E3A1E'));
  // llamas (parpadean)
  const tall = [0, 1, 2, 1][f];
  const cols = [[6, 9 - tall % 2], [7, 7 - tall], [8, 6 - tall], [9, 8 - (tall > 0 ? 1 : 0)], [10, 9]];
  for (const [x, top] of cols) {
    for (let y = top; y <= 10; y++) img.set(x, y, hex(y >= 9 ? '#E8621E' : y >= top + 2 ? '#F7A233' : '#FFE27A'));
  }
  img.set(8, 9, hex('#FFF4C0')); img.set(7, 9, hex('#FFE27A'));
  // olla pequeña sobre una piedra, a un lado
  for (let y = 4; y <= 6; y++) for (let x = 11; x <= 14; x++) img.set(x, y, hex(y === 4 ? '#7A7A7A' : x === 14 ? '#2E2E2E' : '#4A4A4A'));
  img.set(10, 4, hex('#5A5A5A'));
  // vapor
  const steam = [[12, 2], [13, 1], [12, 1], [13, 2]][f];
  over(img, steam[0], steam[1], [240, 240, 240, 170]);
  return outline(img, '#221A12');
}

function fireSheet() {
  const frames = [0, 1, 2, 3].map((f) => fireFrame(f).scale(2));
  return sheet([frames, frames, frames, frames], 32, 32);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const gust1 = save(directionalSheet([0, 1, 2, 3].map((f) => gustFrame(f, false))), 'rafagas.png');
  const gust2 = save(directionalSheet([0, 1, 2, 3].map((f) => gustFrame(f, true))), 'rafagas_fuertes.png');
  const vane = save(vaneSheet(), 'veleta.png');
  const col = save(collectorSheet(), 'colector.png');
  const turb = save(turbineSheet(), 'aerogenerador.png');
  const bell = save(bellSheet(), 'campana_viento.png');
  const fire = save(fireSheet(), 'hoguera.png');
  if (process.argv.includes('--preview')) {
    const opts = { scale: 2, bg: '#7FB86C' };
    files.push(preview(gust1, { ...opts, grid: 32 }).save(path.join(PREVIEW, 'b06_rafagas.png')));
    files.push(preview(gust2, { ...opts, grid: 32 }).save(path.join(PREVIEW, 'b06_rafagas_fuertes.png')));
    files.push(preview(vane, { ...opts, grid: 32 }).save(path.join(PREVIEW, 'b06_veleta.png')));
    files.push(preview(col, { ...opts, bg: '#8A8F96' }).save(path.join(PREVIEW, 'b06_colector.png')));
    files.push(preview(turb, { scale: 1, bg: '#7FB86C' }).save(path.join(PREVIEW, 'b06_aerogenerador.png')));
    files.push(preview(bell, opts).save(path.join(PREVIEW, 'b06_campana.png')));
    files.push(preview(fire, { ...opts, bg: '#7FB86C' }).save(path.join(PREVIEW, 'b06_hoguera.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b06_assets: ${err.message}`);
  process.exitCode = 1;
}
