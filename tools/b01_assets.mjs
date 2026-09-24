// Arte propio del Bloque 1 (PROVISIONAL, D30) generado con tools/pixel.mjs. Uso: node tools/b01_assets.mjs [--preview]
//   game/assets/objects/ventana_monte.png  charset 4×4 de 96×64 por fotograma (arte nativo 48×32 ×2): la vista
//        desde la ventana de la habitación (casa_prota_2f): cielo de mañana, el Monte del Portal con su gran
//        cascada (animada en las 4 columnas), el bosque y un tejado de Villa Alba. Solo se pinta sobre los
//        cristales de la ventana del tileset (Interior1, tiles [3,44] 2×2), el resto es transparente: el evento
//        se coloca en la casilla (5,3) y el marco queda en x 32–96 del fotograma.
//   game/assets/objects/tripode.png  charset 4×4 de 64×64 (nativo 32×32 ×2): trípode de medición del Consorcio
//        (petróleo y carbón, piloto magenta que parpadea en las 4 columnas). Paleta de CAMPANA §5.1 (X08).
// Con --preview deja ampliaciones en tools/cache/pixel/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');
const TILESET = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Tilesets', 'Interior1.png');
const WINDOW_SRC = { x: 3 * 32, y: 44 * 32, w: 64, h: 64 };
const GLASS = ['#6DA8F7', '#5581BD', '#5D90D5', '#4D73A7'].map((c) => hex(c).slice(0, 3).join(','));

// ───────────────────────────── Vista desde la ventana ─────────────────────────────

const SKY = ['#9ED0FF', '#B4DCFF', '#CBE8FF', '#DDF1FF'];
const MOUNT = { lit: '#8394BA', shade: '#63719A', dark: '#4F5B80', snow: '#C9D3EA' };
const FALL = ['#F4FBFF', '#BFE3FF'];
const FOREST = { tip: '#4C8A52', top: '#3A7446', body: '#2C5C3A', deep: '#244C31' };
const ROOF = { top: '#D0705A', body: '#B5523E', eave: '#8C3A2C' };

/** Altura de la cresta del monte en la columna nativa x (0..31 del hueco de la ventana). */
function ridge(x) {
  if (x <= 10) return 17 + (10 - x) * 0.85;
  if (x <= 16) return 17 + (x - 10) * 0.55;
  return 20 + (x - 17) * 0.3; // hombro más bajo (panel derecho)
}

/** Color de la vista en la casilla nativa (x, y) del hueco de 32×32 y fotograma `f`. */
function viewColor(x, y, f) {
  // Tejado de Villa Alba (panel derecho, abajo)
  if (x >= 21 && x <= 25 && y >= 24) return y === 24 ? ROOF.top : (y === 27 ? ROOF.eave : ROOF.body);
  // Bosque: copas en zigzag y cuerpo oscuro
  if (y >= 25 || (y === 24 && (x + (x >> 1)) % 2 === 0)) {
    if (y === 24) return FOREST.tip;
    if (y === 25) return (x % 3 === 0) ? FOREST.tip : FOREST.top;
    return y === 26 ? FOREST.body : FOREST.deep;
  }
  // Gran cascada: cae por la cara del monte, a la derecha de la cima; bruma al pie
  if ((x === 11 || x === 12) && y >= 19 && y <= 23) return FALL[(y - f + 8) % 2];
  if (x === 13 && y >= 19 && y <= 23) return MOUNT.dark; // pared de roca junto a la caída
  if (y === 24 && x >= 10 && x <= 13) return FALL[0];
  const top = ridge(x);
  if (y >= top) {
    if (y < top + 1 && x >= 9 && x <= 11) return MOUNT.snow; // cumbre clara
    if (x < 10) return (x + y) % 5 === 0 ? MOUNT.shade : MOUNT.lit;
    if (x > 16) return (x + y) % 4 === 0 ? MOUNT.dark : MOUNT.shade;
    return (x * 3 + y) % 7 === 0 ? MOUNT.dark : MOUNT.shade;
  }
  return SKY[Math.max(0, Math.min(SKY.length - 1, y - 16))];
}

function windowMask() {
  const tiles = Img.load(TILESET);
  const w = tiles.crop(WINDOW_SRC.x, WINDOW_SRC.y, WINDOW_SRC.w, WINDOW_SRC.h);
  const mask = [];
  for (let y = 0; y < w.h; y++) {
    for (let x = 0; x < w.w; x++) {
      const [r, g, b, a] = w.get(x, y);
      if (a && GLASS.includes(`${r},${g},${b}`)) mask.push([x, y]);
    }
  }
  if (mask.length < 100) throw new Error(`Máscara de cristal sospechosa (${mask.length} px): ¿cambió el tileset?`);
  return mask;
}

function windowFrame(mask, f) {
  const img = new Img(96, 64);
  for (const [x, y] of mask) img.set(32 + x, y, hex(viewColor(x >> 1, y >> 1, f)));
  return img;
}

// ───────────────────────────── Trípode del Consorcio ─────────────────────────────

const TRI = {
  o: '#15171A', leg: '#2B2D31', legHi: '#4A4D55', box: '#1F4E5A', boxHi: '#2E6E7E', boxLo: '#163840',
  label: '#F2F4F5', lens: '#9FD8E8', led: ['#FF8AD8', '#B03A8C', '#5A2048', '#B03A8C'],
};

function line(img, x0, y0, x1, y1, color) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), hex(color));
}

function tripodFrame(f) {
  const img = new Img(32, 32);
  // Patas (tres), con brillo en la central
  line(img, 15, 17, 9, 30, TRI.leg);
  line(img, 16, 17, 22, 30, TRI.leg);
  line(img, 15, 17, 15, 29, TRI.legHi);
  line(img, 16, 17, 16, 29, TRI.leg);
  for (const [x, y] of [[9, 31], [22, 31], [15, 30], [16, 30]]) img.set(x, y, hex(TRI.o));
  // Cabezal
  for (let y = 15; y <= 17; y++) for (let x = 13; x <= 18; x++) img.set(x, y, hex(TRI.leg));
  // Caja del instrumento
  for (let y = 8; y <= 14; y++) {
    for (let x = 11; x <= 20; x++) {
      const edge = y === 8 || y === 14 || x === 11 || x === 20;
      img.set(x, y, hex(edge ? TRI.o : (y === 9 ? TRI.boxHi : (y === 13 ? TRI.boxLo : TRI.box))));
    }
  }
  // Objetivo, etiqueta blanca y piloto
  for (const [x, y] of [[9, 10], [10, 10], [9, 11], [10, 11]]) img.set(x, y, hex(TRI.lens));
  for (const [x, y] of [[8, 10], [8, 11]]) img.set(x, y, hex(TRI.o));
  for (let x = 13; x <= 16; x++) img.set(x, 11, hex(TRI.label));
  img.set(18, 10, hex(TRI.led[f % TRI.led.length]));
  return img.scale(2);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const mask = windowMask();
  const frames = [0, 1, 2, 3].map((f) => windowFrame(mask, f));
  const win = sheet([frames, frames, frames, frames], 96, 64);
  const tri = [0, 1, 2, 3].map(tripodFrame);
  const tripod = sheet([tri, tri, tri, tri], 64, 64);
  const files = [
    win.save(path.join(OUT, 'ventana_monte.png')),
    tripod.save(path.join(OUT, 'tripode.png')),
  ];
  if (process.argv.includes('--preview')) {
    files.push(preview(win.crop(0, 0, 96 * 2, 64), { scale: 4, bg: '#E8D8B0' }).save(path.join(PREVIEW, 'ventana_monte_x4.png')));
    files.push(preview(tripod.crop(0, 0, 64 * 4, 64), { scale: 3, bg: '#7CB870' }).save(path.join(PREVIEW, 'tripode_x3.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

build();
