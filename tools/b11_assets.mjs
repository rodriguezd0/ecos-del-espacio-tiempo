// Arte propio del Bloque 11 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b11_assets.mjs [--preview]
// Todas son hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime), dibujadas a
// escala nativa de DS y ampliadas ×2:
//   objects/b11_caja_exp03.png    32×32  caja de muestras del Consorcio con la etiqueta magenta «EXP-03»
//                                        (fila 2 sellada, con piloto que parpadea · 4 abierta y vacía)
//   objects/b11_perforadora.png   64×96  perforadora de muestras en trípode (fila 2 en marcha · 4 parada)
//   objects/b11_cristal_lila.png  32×64  racimos de cristal lila del Bosque Neblino (fila = variante, brillo)
//   objects/b11_sondeo.png        32×32  pozo de sondeo en el suelo (fila 2 abierto · 4 tapado con chapa)
//   objects/b11_tablilla.png      32×32  Tablilla en el suelo con brillo (fila 2 Oscura · 4 Mental)
//   objects/b11_brasero.png       32×64  brasero de piedra y bronce del Cerro del Alba (fila 2 frío · 4 encendido)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const G = { petrol: '#1F4E5A', petrolHi: '#2F6F7E', petrolLo: '#153740', white: '#F2F4F5', grey: '#C9CED2', coal: '#2B2D31', coalHi: '#44474D', magenta: '#B03A8C', magentaHi: '#E266B8' };
const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, hex(c)); };
const same4 = (f) => [f, f, f, f];

// ───────────────────────────── Caja EXP-03 ─────────────────────────────

function crateFrame(open, blink) {
  const img = new Img(16, 16);
  // sombra
  for (let x = 2; x <= 14; x++) over(img, x, 15, [0, 0, 0, 70]);
  if (!open) {
    box(img, 2, 5, 13, 14, G.petrol); // cuerpo
    box(img, 2, 3, 13, 5, G.petrolHi); // tapa
    box(img, 2, 5, 13, 5, G.petrolLo);
    for (const x of [2, 13]) box(img, x, 3, x, 14, G.coal); // cantoneras
    box(img, 2, 14, 13, 14, G.coal);
    box(img, 4, 8, 11, 11, G.white); // etiqueta
    box(img, 5, 9, 6, 10, G.magenta); // hexágono del emblema
    box(img, 7, 9, 10, 9, G.coalHi); // «EXP-03»
    box(img, 7, 10, 9, 10, G.coalHi);
    img.set(11, 4, hex(blink ? G.magentaHi : G.magenta)); // piloto
  } else {
    box(img, 2, 7, 13, 14, G.petrol);
    box(img, 3, 7, 12, 11, G.petrolLo); // interior vacío
    box(img, 4, 10, 6, 11, '#D8D0B8'); // virutas de embalaje
    box(img, 9, 9, 11, 10, '#D8D0B8');
    for (const x of [2, 13]) box(img, x, 7, x, 14, G.coal);
    box(img, 2, 14, 13, 14, G.coal);
    box(img, 4, 12, 11, 13, G.white); // etiqueta en el frente
    box(img, 5, 12, 6, 13, G.magenta);
    box(img, 1, 3, 14, 4, G.petrolHi); // tapa apoyada detrás
    box(img, 1, 5, 14, 5, G.petrolLo);
  }
  return outline(img, '#101418');
}

function crateSheet() {
  const sealed = [0, 1, 2, 3].map((f) => crateFrame(false, f === 2).scale(2));
  const open = same4(crateFrame(true, false).scale(2));
  return sheet([sealed, open, sealed, open], 32, 32);
}

// ───────────────────────────── Perforadora ─────────────────────────────

function rigFrame(running, f) {
  const img = new Img(32, 48);
  // sombra
  for (let x = 5; x <= 27; x++) over(img, x, 46, [0, 0, 0, 70]);
  // trípode
  const legs = [[6, 45, 14, 6], [26, 45, 18, 6], [16, 45, 16, 6]];
  for (const [x0, y0, x1, y1] of legs) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n); const y = Math.round(y0 + ((y1 - y0) * i) / n);
      img.set(x, y, hex(G.coal)); img.set(x + 1, y, hex(G.coalHi));
    }
  }
  // cabezal: caja del motor
  box(img, 11, 5, 21, 14, G.white);
  box(img, 11, 5, 21, 6, G.grey);
  box(img, 11, 13, 21, 14, G.petrol);
  box(img, 14, 8, 17, 11, G.petrol); // panel
  img.set(15, 9, hex(G.magenta)); img.set(16, 9, hex(G.magenta)); img.set(15, 10, hex(G.magenta)); img.set(16, 10, hex(G.magenta));
  img.set(19, 7, hex(running && f % 2 ? G.magentaHi : G.magenta)); // piloto
  // barra de perforación (sube y baja en marcha)
  const bob = running ? [0, 1, 2, 1][f] : 0;
  box(img, 15, 15, 16, 41 + bob, G.coalHi);
  box(img, 15, 15 + (bob % 2), 15, 41 + bob, G.grey);
  // boca y polvo
  box(img, 12, 42, 19, 43, '#5A4A3A');
  if (running) {
    const puffs = [[11, 40], [20, 39], [9, 42], [22, 41]];
    for (let i = 0; i < 2; i++) {
      const [x, y] = puffs[(f + i) % 4];
      for (const [dx, dy] of [[0, 0], [1, 0], [0, -1], [1, -1]]) over(img, x + dx, y + dy, [226, 214, 196, 170]);
    }
  }
  return outline(img, '#101418');
}

function rigSheet() {
  const on = [0, 1, 2, 3].map((f) => rigFrame(true, f).scale(2));
  const off = same4(rigFrame(false, 0).scale(2));
  return sheet([on, off, on, off], 64, 96);
}

// ───────────────────────────── Cristal lila ─────────────────────────────

const LILAC = { hi: '#F4E6FF', light: '#D7B8F2', mid: '#B08AD8', dark: '#7C5AAE', deep: '#4E3778', out: '#2A1C44' };
// Agujas: [x del centro, fila de la punta, semiancho (1–2), inclinación en px por cada 8 filas]
const SHAPES = [
  [[8, 8, 2, 0], [4, 17, 1, -1], [12, 14, 1, 1]],
  [[6, 11, 1, -1], [9, 5, 2, 0], [13, 18, 1, 1]],
  [[7, 9, 2, 0], [3, 19, 1, -1], [11, 13, 1, 1], [13, 21, 1, 1]],
  [[8, 3, 2, 0], [4, 14, 1, -1], [12, 11, 1, 1]],
];

function crystalFrame(shape, f) {
  const img = new Img(16, 32);
  for (let x = 2; x <= 13; x++) over(img, x, 30, [60, 30, 90, 90]);
  // base de roca
  for (let x = 3; x <= 12; x++) { img.set(x, 29, hex('#3B3350')); img.set(x, 28, hex(x % 3 ? '#4A4163' : '#3B3350')); }
  for (const [cx, top, half, lean] of shape) {
    for (let y = top; y <= 28; y++) {
      const tip = y - top;
      const w = Math.min(half, Math.floor(tip / 2));
      const ox = Math.round(cx + (lean * (28 - y)) / 8);
      for (let x = ox - w; x <= ox + w; x++) {
        const face = x < ox ? LILAC.light : x === ox ? LILAC.mid : LILAC.dark;
        img.set(x, y, hex(tip === 0 ? LILAC.hi : face));
      }
    }
  }
  // destello que recorre una aguja
  const [cx, top, , lean] = shape[f % shape.length];
  const y = top + 2 + ((f * 4) % Math.max(3, 24 - top));
  const ox = Math.round(cx + (lean * (28 - y)) / 8);
  over(img, ox - 1, y, rgba(LILAC.hi, 235));
  over(img, ox - 1, y + 1, rgba(LILAC.hi, 150));
  return outline(img, LILAC.out);
}

function crystalSheet() {
  return sheet(SHAPES.map((s) => [0, 1, 2, 3].map((f) => crystalFrame(s, f).scale(2))), 32, 64);
}

// ───────────────────────────── Pozo de sondeo ─────────────────────────────

function holeFrame(capped) {
  const img = new Img(16, 16);
  for (let y = 3; y <= 13; y++) {
    for (let x = 2; x <= 13; x++) {
      const d = ((x - 7.5) ** 2) / 36 + ((y - 8) ** 2) / 25;
      if (d <= 1) img.set(x, y, hex(d > 0.62 ? '#CDBFA6' : d > 0.4 ? '#8B7A62' : '#1C1612'));
    }
  }
  if (capped) {
    for (let y = 5; y <= 11; y++) for (let x = 4; x <= 11; x++) {
      const d = ((x - 7.5) ** 2) / 16 + ((y - 8) ** 2) / 12;
      if (d <= 1) img.set(x, y, hex(d > 0.7 ? G.coal : G.coalHi));
    }
    img.set(6, 7, hex(G.grey)); img.set(9, 9, hex(G.grey));
  }
  return img;
}

function holeSheet() {
  const open = same4(holeFrame(false).scale(2));
  const capped = same4(holeFrame(true).scale(2));
  return sheet([open, capped, open, capped], 32, 32);
}

// ───────────────────────────── Tablillas ─────────────────────────────

function plateFrame(colors, f) {
  const img = new Img(16, 16);
  for (let x = 3; x <= 12; x++) over(img, x, 13, [0, 0, 0, 80]);
  box(img, 4, 5, 11, 12, colors.mid);
  box(img, 4, 5, 11, 5, colors.light);
  box(img, 4, 12, 11, 12, colors.dark);
  box(img, 11, 6, 11, 12, colors.dark);
  box(img, 6, 7, 9, 10, colors.dark); // glifo
  img.set(7, 8, hex(colors.light)); img.set(8, 9, hex(colors.light));
  const glow = [60, 110, 160, 110][f];
  for (const [x, y] of [[3, 4], [12, 4], [3, 13], [12, 13], [7, 3], [8, 3]]) over(img, x, y, rgba(colors.glow, glow));
  return outline(img, colors.out);
}

const PLATES = {
  dread: { light: '#6B5A86', mid: '#3F3456', dark: '#241D33', glow: '#B79CFF', out: '#0E0A16' },
  mind: { light: '#F7B8DA', mid: '#E07AB3', dark: '#9C3F77', glow: '#FFD6EE', out: '#3A1428' },
};

function plateSheet() {
  const dread = [0, 1, 2, 3].map((f) => plateFrame(PLATES.dread, f).scale(2));
  const mind = [0, 1, 2, 3].map((f) => plateFrame(PLATES.mind, f).scale(2));
  return sheet([dread, mind, dread, mind], 32, 32);
}

// ───────────────────────────── Brasero del Cerro del Alba ─────────────────────────────

const STONE = { hi: '#D8D2C4', mid: '#AFA796', dark: '#7C7466', out: '#2E2A24' };
const BRONZE = { hi: '#F0C878', mid: '#B8863A', dark: '#7A5220' };

function brazierFrame(lit, f) {
  const img = new Img(16, 32);
  for (let x = 3; x <= 12; x++) over(img, x, 31, [0, 0, 0, 80]);
  // peana escalonada y fuste
  box(img, 3, 27, 12, 30, STONE.mid); box(img, 3, 27, 12, 27, STONE.hi); box(img, 12, 28, 12, 30, STONE.dark);
  box(img, 5, 16, 10, 26, STONE.mid); box(img, 5, 16, 5, 26, STONE.hi); box(img, 10, 16, 10, 26, STONE.dark);
  for (const y of [19, 23]) box(img, 5, y, 10, y, STONE.dark);
  // cuenco de bronce
  box(img, 2, 11, 13, 15, BRONZE.mid); box(img, 2, 11, 13, 11, BRONZE.hi); box(img, 3, 15, 12, 15, BRONZE.dark);
  box(img, 1, 10, 14, 10, BRONZE.dark);
  if (lit) {
    const tall = [0, 1, 2, 1][f];
    for (const [x, top] of [[5, 7 - tall], [6, 5 - tall], [7, 4 - tall], [8, 5 - tall], [9, 6 - tall], [10, 8]]) {
      for (let y = top; y <= 10; y++) img.set(x, y, hex(y >= 9 ? '#E8621E' : y >= top + 2 ? '#F7A233' : '#FFE27A'));
    }
  } else {
    box(img, 3, 9, 12, 10, '#6E6A66'); // ceniza fría
    img.set(6, 9, hex('#9A958F')); img.set(9, 10, hex('#4E4A46'));
  }
  return outline(img, STONE.out);
}

function brazierSheet() {
  const cold = same4(brazierFrame(false, 0).scale(2));
  const lit = [0, 1, 2, 3].map((f) => brazierFrame(true, f).scale(2));
  return sheet([cold, lit, cold, lit], 32, 64);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const out = {
    crate: save(crateSheet(), 'b11_caja_exp03.png'),
    rig: save(rigSheet(), 'b11_perforadora.png'),
    crystal: save(crystalSheet(), 'b11_cristal_lila.png'),
    hole: save(holeSheet(), 'b11_sondeo.png'),
    plate: save(plateSheet(), 'b11_tablilla.png'),
    brazier: save(brazierSheet(), 'b11_brasero.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [k, img] of Object.entries(out)) files.push(preview(img, { scale: 3 }).save(path.join(PREVIEW, `b11_${k}.png`)));
  }
  for (const f of files) console.log(`→ ${path.relative(ROOT, f)}`);
}

build();
