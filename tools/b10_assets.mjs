// Arte propio del Bloque 10 — Pilar de la Memoria (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b10_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = patrón/fotograma):
//   objects/b10_bambu.png          32×128 mata de bambú (fila = variante; columnas = vaivén de las hojas)
//   objects/b10_palanca.png        32×64  palanca de piedra sepia con cuatro muescas (fila = posición 0–3)
//   objects/b10_umbral.png         96×32  umbrales bajos (pasos abordados desde el norte): 0–6 umbral glífico de la
//                                         Lectura con los k primeros glifos del relato encendidos en su sitio
//                                         (b10_hondo_logic.js); 8 losa de las Dos Manos
//   objects/b10_hueco_rollo.png    32×64  hueco de la estantería de los Rollos: 0 vacío, 1 rojo, 2 azul, 3 verde, 4 ocre
//   objects/b10_mural.png          64×64  paneles del Mural (1–6 = escenas de la historia; 0 = losa lisa)
// Los fotogramas se numeran fila a fila (índice = fila·4 + columna): fila 0 = dir 2, 1 = dir 4, 2 = dir 6, 3 = dir 8.
// Paleta: piedra sepia del Archivo Hondo (tinte P5) y verdes de bambú de Mnemos.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';
import { DOOR_GLYPHS, GLYPH_SEQUENCE } from '../game/src/content/events/b10_hondo_logic.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

/** Mezcla un color encima respetando alfa. */
function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}

function rect(img, x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) over(img, x, y, c);
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

function ring(img, cx, cy, r, c) {
  for (let a = 0; a < 360; a += 4) {
    const t = (a * Math.PI) / 180;
    over(img, Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), c);
  }
}

/** Hoja 4×4 a partir de una lista de fotogramas (índice = fila·4 + columna); los huecos se quedan vacíos. */
function gridSheet(frames, w, h) {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => frames[r * 4 + c] || new Img(w, h)));
  return sheet(rows, w, h);
}

// ───────────────────────────── Bambú ─────────────────────────────

const BAMBOO = {
  hi: '#C9E68A', light: '#9CCB55', mid: '#6FA23A', dark: '#44722A', node: '#2F5520',
  leafDark: '#2E5E27', leafMid: '#4F8F34', leafLight: '#7FC24C', ground: '#2A4A22', out: '#1C3318',
};

/** Variantes: tallos { x, w, top } y grupos de hojas { x, y, side }. Nativo 16×64 (×2 = 32×128). */
const BAMBOO_VARIANTS = [
  { stalks: [{ x: 1, w: 2, top: 10 }, { x: 6, w: 3, top: 2 }, { x: 12, w: 2, top: 15 }], leaves: [[2, 12, -1], [7, 4, 1], [7, 14, -1], [13, 17, 1], [3, 24, 1], [8, 30, -1], [13, 34, 1]] },
  { stalks: [{ x: 2, w: 3, top: 4 }, { x: 8, w: 2, top: 13 }, { x: 12, w: 3, top: 7 }], leaves: [[3, 6, 1], [2, 15, -1], [13, 9, 1], [9, 15, -1], [14, 21, 1], [4, 27, -1], [10, 33, 1]] },
  { stalks: [{ x: 1, w: 2, top: 15 }, { x: 5, w: 3, top: 5 }, { x: 11, w: 3, top: 1 }], leaves: [[6, 7, -1], [12, 3, 1], [2, 17, -1], [13, 13, 1], [7, 21, 1], [3, 29, -1], [12, 31, 1]] },
  { stalks: [{ x: 3, w: 3, top: 1 }, { x: 9, w: 2, top: 10 }, { x: 13, w: 2, top: 19 }], leaves: [[4, 3, 1], [3, 11, -1], [10, 12, 1], [14, 21, 1], [5, 19, -1], [9, 27, -1], [4, 33, 1]] },
];

function stalk(img, { x, w, top }, sway) {
  for (let y = top; y < 60; y++) {
    // el vaivén solo dobla el tercio alto
    const dx = y < top + 14 ? sway : 0;
    for (let i = 0; i < w; i++) {
      const c = i === 0 ? BAMBOO.hi : i === w - 1 ? BAMBOO.dark : BAMBOO.light;
      img.set(x + i + dx, y, hex(c));
    }
    if ((y - top) % 11 === 10) {
      for (let i = 0; i < w; i++) img.set(x + i + dx, y, hex(BAMBOO.node));
      img.set(x + dx, y - 1, hex(BAMBOO.hi));
    }
  }
  // punta
  img.set(x + Math.floor(w / 2) + sway, top - 1, hex(BAMBOO.mid));
}

function leafCluster(img, x, y, side, sway) {
  const dx = y < 22 ? sway : 0;
  const cx = x + dx;
  // tres hojas lanceoladas en abanico hacia `side`
  line(img, cx, y, cx + side * 5, y - 2, rgba(BAMBOO.leafMid));
  line(img, cx, y + 1, cx + side * 5, y + 1, rgba(BAMBOO.leafDark));
  line(img, cx, y, cx + side * 3, y - 4, rgba(BAMBOO.leafLight));
  over(img, cx + side * 6, y - 2, rgba(BAMBOO.leafLight));
  over(img, cx + side * 4, y + 2, rgba(BAMBOO.leafDark));
}

function bambooFrame(v, f) {
  const img = new Img(16, 64);
  const sway = [0, 1, 0, -1][f];
  // mata del pie (solo junto a los tallos) y sombra
  for (const s of BAMBOO_VARIANTS[v].stalks) {
    for (let x = s.x - 1; x <= s.x + s.w; x++) for (let y = 59; y <= 61; y++) if ((x + y) % 2 === 0 || y === 61) img.set(x, y, hex(BAMBOO.leafDark));
  }
  for (const s of BAMBOO_VARIANTS[v].stalks) stalk(img, s, sway);
  for (const [x, y, side] of BAMBOO_VARIANTS[v].leaves) leafCluster(img, x, y, side, sway);
  const out = outline(img, BAMBOO.out);
  for (let x = 1; x <= 14; x++) { if (!out.alpha(x, 62)) out.set(x, 62, [30, 50, 24, 110]); if (x > 2 && x < 13 && !out.alpha(x, 63)) out.set(x, 63, [30, 50, 24, 70]); }
  return out;
}

function bambooSheet() {
  const rows = [0, 1, 2, 3].map((v) => [0, 1, 2, 3].map((f) => bambooFrame(v, f).scale(2)));
  return sheet(rows, 32, 128);
}

// ───────────────────────────── Piedra sepia ─────────────────────────────

const SEPIA = { hi: '#D8C49A', light: '#B9A47C', mid: '#94805E', dark: '#6A5A42', deep: '#4A3E2E', out: '#261F17' };
const GOLD = { hi: '#FFF1BF', mid: '#F2D27A', dark: '#C99A3C' };

function stoneBlock(img, x0, y0, w, h) {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      let c = SEPIA.mid;
      if (y === y0) c = SEPIA.hi;
      else if (x === x0) c = SEPIA.light;
      else if (x === x0 + w - 1 || y === y0 + h - 1) c = SEPIA.dark;
      img.set(x, y, hex(c));
    }
  }
}

// ───────────────────────────── Palanca ─────────────────────────────

const LEVER_ANGLES = [-52, -18, 18, 52];
const LEVER_LENGTH = 9;

function leverFrame(pos) {
  const img = new Img(16, 32);
  stoneBlock(img, 1, 21, 14, 10);
  // grietas y glifo de la peana
  line(img, 4, 25, 6, 27, rgba(SEPIA.dark)); over(img, 11, 26, rgba(SEPIA.dark)); over(img, 12, 27, rgba(SEPIA.dark));
  // arco de muescas
  [3, 6, 9, 12].forEach((x, i) => {
    img.set(x, 22, hex(i === pos ? GOLD.mid : SEPIA.deep));
    if (i === pos) img.set(x, 23, hex(GOLD.dark));
  });
  // varilla desde el pivote
  const px = 7.5; const py = 21;
  const t = (LEVER_ANGLES[pos] * Math.PI) / 180;
  const ex = px + Math.sin(t) * LEVER_LENGTH; const ey = py - Math.cos(t) * LEVER_LENGTH;
  line(img, Math.round(px), py, Math.round(ex), Math.round(ey), rgba('#3A3128'));
  line(img, Math.round(px) + 1, py, Math.round(ex) + 1, Math.round(ey), rgba('#5C4E3E'));
  disc(img, ex + 0.5, ey, 2.2, rgba('#B07A3A'));
  over(img, Math.round(ex) - 1, Math.round(ey) - 1, rgba('#E8B870'));
  disc(img, px + 0.5, py, 1.6, rgba(SEPIA.deep));
  return outline(img, SEPIA.out);
}

function leverSheet() {
  const rows = [0, 1, 2, 3].map((p) => { const f = leverFrame(p).scale(2); return [f, f, f, f]; });
  return sheet(rows, 32, 64);
}

// ───────────────────────────── Umbrales bajos (pasos que se abordan desde el norte) ─────────────────────────────
// Un sprite alto delante de un paso que se aborda desde el norte taparía al jugador (se ancla abajo): estas losas
// miden una sola casilla de alto. Fotogramas 0–6: umbral glífico con k glifos del relato encendidos; 8: losa de
// las Dos Manos.

function thresholdBase() {
  const img = new Img(48, 16);
  stoneBlock(img, 0, 3, 48, 13);
  rect(img, 0, 3, 48, 1, rgba(SEPIA.hi));
  line(img, 1, 14, 46, 14, rgba(SEPIA.dark));
  return img;
}

/** Glifos en miniatura (5×5) para el umbral bajo. */
const MINI_GLYPHS = {
  piedras: ['x.x.x', 'x.x.x', 'x.x.x', 'x.x.x', 'xxxxx'],
  agua: ['.....', 'xx.xx', '..x..', 'xx.xx', '..x..'],
  oido: ['.xxx.', 'x...x', 'x.x.x', 'x...x', '.xxx.'],
  corona: ['x.x.x', 'xxxxx', 'x...x', 'xxxxx', '.....'],
  grieta: ['..x..', '.x...', '..x..', '...x.', '..x..'],
  flauta: ['x....', '.x...', '..x..', '...x.', '....x'],
};

function glyphThreshold(lit) {
  const img = thresholdBase();
  const litGlyphs = new Set(GLYPH_SEQUENCE.slice(0, lit));
  DOOR_GLYPHS.forEach((glyph, i) => {
    const x0 = 2 + i * 7.6;
    const on = litGlyphs.has(glyph);
    rect(img, Math.round(x0), 5, 7, 8, rgba(on ? GOLD.mid : SEPIA.dark));
    rect(img, Math.round(x0) + 1, 6, 5, 6, rgba(on ? GOLD.hi : SEPIA.deep));
    MINI_GLYPHS[glyph].forEach((row, j) => [...row].forEach((ch, k) => {
      if (ch === 'x') over(img, Math.round(x0) + 1 + k, 6 + j, rgba(on ? '#6A4A18' : SEPIA.light));
    }));
  });
  return outline(img, SEPIA.out);
}

function handsSlab() {
  const img = thresholdBase();
  for (const cx of [14, 34]) {
    rect(img, cx - 3, 8, 7, 5, rgba(SEPIA.deep));
    for (let f = 0; f < 4; f++) rect(img, cx - 3 + f * 2, 5, 1, 3, rgba(SEPIA.deep));
    rect(img, cx + 4, 9, 2, 1, rgba(SEPIA.deep));
  }
  return outline(img, SEPIA.out);
}

function thresholdSheet() {
  const frames = [0, 1, 2, 3, 4, 5, 6].map((k) => glyphThreshold(k).scale(2));
  frames[8] = handsSlab().scale(2);
  return gridSheet(frames, 96, 32);
}

// ───────────────────────────── Hueco de la estantería de los Rollos ─────────────────────────────

const WOOD = { hi: '#C08A54', mid: '#8E5E34', dark: '#5E3C22', out: '#2A1A0E', hole: '#22180F' };
export const SCROLL_COLORS = Object.freeze({ rojo: '#C0392B', azul: '#2E6DB4', verde: '#3E8E41', ocre: '#D4A017' });
const SCROLL_ORDER = ['rojo', 'azul', 'verde', 'ocre'];

function cubbyFrame(color) {
  const img = new Img(16, 32);
  rect(img, 0, 2, 16, 30, rgba(WOOD.mid));
  rect(img, 0, 2, 16, 1, rgba(WOOD.hi));
  rect(img, 0, 3, 1, 29, rgba(WOOD.hi));
  rect(img, 15, 3, 1, 29, rgba(WOOD.dark));
  rect(img, 2, 6, 12, 14, rgba(WOOD.hole));
  rect(img, 1, 20, 14, 2, rgba(WOOD.hi));
  rect(img, 1, 22, 14, 1, rgba(WOOD.dark));
  // cajón bajo
  rect(img, 2, 24, 12, 6, rgba(WOOD.dark));
  rect(img, 7, 26, 2, 1, rgba(GOLD.dark));
  if (color) {
    const c = SCROLL_COLORS[color];
    rect(img, 3, 14, 10, 5, rgba(c));
    rect(img, 3, 14, 10, 1, rgba('#FFFFFF', 90));
    rect(img, 2, 13, 2, 7, rgba('#E9DDBE'));
    rect(img, 12, 13, 2, 7, rgba('#E9DDBE'));
    over(img, 2, 13, rgba('#FFFFFF', 160));
    rect(img, 7, 14, 1, 5, rgba('#3A2A18', 150));
  }
  return outline(img, WOOD.out);
}

function cubbySheet() {
  const frames = [null, ...SCROLL_ORDER].map((c) => cubbyFrame(c).scale(2));
  return gridSheet(frames, 32, 64);
}

// ───────────────────────────── Paneles del Mural ─────────────────────────────

const ENGRAVE = rgba(SEPIA.deep);
const LIGHT = rgba(SEPIA.hi);
const FLUTE = rgba('#4E86C8');
const CROWN = rgba('#E0B040');

function person(img, x, y, c = ENGRAVE) {
  over(img, x, y, c); over(img, x, y + 1, c); over(img, x - 1, y + 2, c); over(img, x, y + 2, c); over(img, x + 1, y + 2, c);
  over(img, x, y + 3, c); over(img, x - 1, y + 4, c); over(img, x + 1, y + 4, c);
}

const SCENES = {
  // (1) Los Pilares ya existían: diez piedras en el horizonte y un sol
  1(img) {
    line(img, 4, 24, 27, 24, ENGRAVE);
    for (let i = 0; i < 10; i++) {
      const x = 5 + i * 2.3;
      const h = 5 + (i % 3);
      line(img, Math.round(x), 23, Math.round(x), 23 - h, ENGRAVE);
      over(img, Math.round(x), 23 - h - 1, LIGHT);
    }
    ring(img, 23.5, 9.5, 3, ENGRAVE);
  },
  // (2) La Tañedora y el mar: figura en lo alto con la flauta azul; el mar se retira
  2(img) {
    line(img, 4, 24, 12, 12, ENGRAVE); line(img, 12, 12, 17, 24, ENGRAVE);
    person(img, 12, 7);
    line(img, 13, 9, 16, 8, FLUTE);
    for (const [x, y] of [[19, 17], [21, 20], [23, 17], [25, 20]]) { over(img, x, y, ENGRAVE); over(img, x + 1, y - 1, ENGRAVE); over(img, x + 2, y, ENGRAVE); }
    line(img, 18, 24, 27, 24, ENGRAVE);
  },
  // (3) Los pueblos aprenden a escuchar: piedra alta, dos figuras de rodillas y anillos de sonido
  3(img) {
    rect(img, 14, 9, 4, 15, rgba(SEPIA.dark));
    line(img, 14, 9, 17, 9, LIGHT);
    person(img, 8, 18); person(img, 23, 18);
    ring(img, 16, 14, 7, rgba(SEPIA.deep, 170));
    ring(img, 16, 14, 10, rgba(SEPIA.deep, 110));
    line(img, 4, 24, 27, 24, ENGRAVE);
  },
  // (4) El rey y la corona: figura coronada; los Pilares le dan la espalda (inclinados)
  4(img) {
    person(img, 16, 13);
    line(img, 14, 11, 18, 11, CROWN); over(img, 14, 10, CROWN); over(img, 16, 10, CROWN); over(img, 18, 10, CROWN);
    line(img, 6, 23, 4, 12, ENGRAVE); line(img, 9, 23, 8, 13, ENGRAVE);
    line(img, 23, 23, 24, 13, ENGRAVE); line(img, 26, 23, 28, 12, ENGRAVE);
    line(img, 4, 24, 27, 24, ENGRAVE);
  },
  // (5) La tierra se abre: un puente y una grieta que parte el valle
  5(img) {
    for (let x = 5; x <= 26; x++) over(img, x, Math.round(9 + ((x - 15.5) ** 2) / 30), ENGRAVE);
    line(img, 5, 9, 5, 13, ENGRAVE); line(img, 26, 9, 26, 13, ENGRAVE);
    const crack = [[16, 12], [15, 15], [17, 17], [14, 20], [16, 22], [15, 25]];
    for (let i = 1; i < crack.length; i++) line(img, crack[i - 1][0], crack[i - 1][1], crack[i][0], crack[i][1], rgba('#1A140E'));
    line(img, 4, 24, 13, 24, ENGRAVE); line(img, 18, 24, 27, 24, ENGRAVE);
  },
  // (6) La flauta rota: tres trozos azules y diez puntos alrededor
  6(img) {
    line(img, 7, 16, 11, 14, FLUTE); line(img, 14, 17, 18, 15, FLUTE); line(img, 21, 14, 25, 12, FLUTE);
    for (let i = 0; i < 10; i++) {
      const t = (i / 10) * Math.PI * 2;
      over(img, Math.round(16 + Math.cos(t) * 10), Math.round(15 + Math.sin(t) * 7), ENGRAVE);
    }
    over(img, 12, 12, LIGHT); over(img, 19, 19, LIGHT);
  },
};

function panelFrame(n) {
  const img = new Img(32, 32);
  stoneBlock(img, 1, 1, 30, 30);
  rect(img, 3, 3, 26, 26, rgba('#A99272'));
  rect(img, 3, 3, 26, 1, rgba(SEPIA.dark));
  rect(img, 3, 3, 1, 26, rgba(SEPIA.dark));
  if (SCENES[n]) SCENES[n](img);
  // desgaste
  for (const [x, y] of [[5, 27], [26, 5], [27, 26], [4, 6]]) over(img, x, y, rgba(SEPIA.light, 180));
  return outline(img, SEPIA.out);
}

function muralSheet() {
  const frames = [0, 1, 2, 3, 4, 5, 6].map((n) => panelFrame(n).scale(2));
  return gridSheet(frames, 64, 64);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const bamboo = save(bambooSheet(), 'b10_bambu.png');
  const lever = save(leverSheet(), 'b10_palanca.png');
  const threshold = save(thresholdSheet(), 'b10_umbral.png');
  const cubby = save(cubbySheet(), 'b10_hueco_rollo.png');
  const mural = save(muralSheet(), 'b10_mural.png');
  if (process.argv.includes('--preview')) {
    files.push(preview(bamboo, { scale: 1, bg: '#7FB86C' }).save(path.join(PREVIEW, 'b10_bambu.png')));
    files.push(preview(lever, { scale: 2, bg: '#3A3128', grid: 32 }).save(path.join(PREVIEW, 'b10_palanca.png')));
    files.push(preview(threshold, { scale: 2, bg: '#3A3128' }).save(path.join(PREVIEW, 'b10_umbral.png')));
    files.push(preview(cubby, { scale: 2, bg: '#3A3128' }).save(path.join(PREVIEW, 'b10_hueco_rollo.png')));
    files.push(preview(mural, { scale: 2, bg: '#3A3128' }).save(path.join(PREVIEW, 'b10_mural.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b10_assets: ${err.message}`);
  process.exitCode = 1;
}
