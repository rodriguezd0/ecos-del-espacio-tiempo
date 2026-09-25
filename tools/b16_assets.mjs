// Arte propio del Bloque 16 — Pilar del Alma (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b16_assets.mjs [--preview]
// Hojas de evento 4×4 (índice de fotograma = fila·4 + columna; fila 0 = dir 2, 1 = dir 4, 2 = dir 6, 3 = dir 8):
//   objects/b16_glifo.png            32×32  piedra de glifo de cada Pilar (0–6 = P1–P7 apagada; 8–14 = encendida)
//   objects/b16_relieve.png          32×64  relieve de pared con lo que reparó cada Pilar (0–6; 8–14 = con su glifo)
//   objects/b16_puerta.png           32×64  puerta de piedra con numeral (0–3 = I–IV; 8 = abierta, 9 = sellada)
//   objects/b16_espejo.png           32×64  cristal de espejo (fila 0: brillo que recorre el cristal, 4 pasos)
//   objects/b16_telar.png            96×128 Telar del Alma (fila 0 vacío · 1 con las tres hebras · 2 con la Cadena Roja)
//   objects/b16_hebra.png            32×32  hebra flotante (fila 0 Saber · 1 Sentir · 2 Querer; 4 pasos de brillo)
//   objects/b16_sello.png            32×32  sello hexagonal del patio (0 cerrado; 1–3 con n hebras; 4 abierto)
//   objects/b16_zygarde_completo.png 128×128 Zygarde Completo (fotogramas del frontal de Añil) para la escena del puente
// Paleta: mármol y piedra con el rosa pálido del P8 (el mapa añade el tono) y los tintes de los Pilares (fragments.js).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';
import { FRAGMENTS } from '../game/src/content/story/fragments.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = Array.isArray(c) ? [...c, 255] : hex(c); return [v[0], v[1], v[2], a]; };
const STONE = { light: '#E4DCE0', mid: '#BDB1B9', dark: '#8C7F89', deep: '#5E5260', out: '#352C34' };
const PINK = { glow: '#F7B9CD', hi: '#FFE9F1', deep: '#D77A9C' };
const TINTS = FRAGMENTS.slice(0, 7).map((f) => f.tint);

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const rect = (img, x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) over(img, x, y, c); };
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) over(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
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

// Marcas de los glifos (5×5, una por Pilar): trazos de «escritura Unown» sencillos y distintos.
const MARKS = [
  ['.###.', '#...#', '#.#.#', '#...#', '.###.'], // Umbral: ojo en un marco
  ['#...#', '.#.#.', '..#..', '.#.#.', '#...#'], // Corriente
  ['..#..', '.#.#.', '#...#', '.#.#.', '..#..'], // Impulso
  ['#####', '..#..', '..#..', '..#..', '.###.'], // Masa
  ['##.##', '#...#', '..#..', '#...#', '##.##'], // Memoria
  ['#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'], // Invertido
  ['.#.#.', '#.#.#', '.....', '#.#.#', '.#.#.'], // Ecos
];
function mark(img, ox, oy, n, c) {
  MARKS[n].forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') over(img, ox + x, oy + y, c); }));
}

// ─────────────────────────────── Glifos (piedras) ───────────────────────────────

function glyphFrame(n, lit) {
  const img = new Img(16, 16);
  for (let x = 3; x <= 12; x++) over(img, x, 14, [0, 0, 0, 70]);
  hexagon(img, 8, 9, 5, rgba(STONE.mid));
  hexagon(img, 8, 8, 5, rgba(STONE.light));
  rect(img, 4, 12, 9, 1, rgba(STONE.dark));
  mark(img, 6, 6, n, rgba(lit ? TINTS[n] : STONE.deep));
  if (lit) {
    for (const [x, y] of [[3, 3], [13, 4], [2, 9], [14, 10], [8, 1]]) over(img, x, y, rgba(PINK.hi, 220));
  }
  return outline(img, STONE.out);
}
const glyphSheet = () => gridSheet([
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => glyphFrame(n, false).scale(2)), null,
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => glyphFrame(n, true).scale(2)),
], 32, 32);

// ─────────────────────────────── Relieves ───────────────────────────────

const ICONS = [
  (img) => { rect(img, 4, 12, 8, 9, rgba(STONE.deep)); rect(img, 5, 13, 4, 8, rgba('#9C7A54')); over(img, 8, 17, rgba('#E8D08A')); line(img, 11, 12, 11, 20, rgba(STONE.out)); },
  (img) => { for (const y of [13, 16, 19]) for (let x = 3; x <= 12; x++) over(img, x, y + Math.round(Math.sin(x * 0.9) * 1), rgba('#4A86D8')); },
  (img) => { for (let a = 0; a < 540; a += 20) { const t = (a * Math.PI) / 180; const r = 1 + a / 110; over(img, Math.round(8 + Math.cos(t) * r), Math.round(16 + Math.sin(t) * r), rgba('#F2F6FA')); } },
  (img) => { rect(img, 4, 18, 8, 3, rgba('#8E949C')); rect(img, 5, 15, 6, 3, rgba('#A6ACB4')); rect(img, 6, 12, 4, 3, rgba('#BEC4CC')); line(img, 8, 9, 8, 11, rgba(STONE.out)); },
  (img) => { for (const y of [12, 14, 16]) line(img, 3, y, 12, y, rgba('#F4EEE6', 150)); rect(img, 5, 18, 6, 3, rgba('#C09668')); line(img, 6, 19, 9, 19, rgba(STONE.out)); },
  (img) => { line(img, 8, 11, 7, 21, rgba(STONE.out)); disc(img, 5, 16, 2.2, rgba('#3A2A48', 200)); disc(img, 11, 15, 2.2, rgba('#3A2A48', 200)); over(img, 8, 11, rgba('#A868E8')); },
  (img) => { for (let x = 3; x <= 12; x++) over(img, x, 18 + Math.round(Math.sin(x * 0.8) * 1.5), rgba('#68D8C0')); disc(img, 11, 12, 1.8, rgba('#F4F0D8')); },
];

function reliefFrame(n, lit) {
  const img = new Img(16, 32);
  rect(img, 1, 7, 14, 17, rgba(STONE.mid));
  rect(img, 2, 8, 12, 15, rgba(STONE.light));
  rect(img, 1, 7, 14, 1, rgba(STONE.dark));
  rect(img, 1, 23, 14, 1, rgba(STONE.dark));
  ICONS[n](img);
  // hueco del glifo sobre el relieve (arriba): vacío o con el glifo encendido
  hexagon(img, 8, 4, 3, rgba(lit ? TINTS[n] : STONE.deep));
  if (lit) { rect(img, 1, 6, 14, 1, rgba(PINK.glow)); rect(img, 1, 24, 14, 1, rgba(PINK.glow)); }
  return outline(img, STONE.out);
}
const reliefSheet = () => gridSheet([
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => reliefFrame(n, false).scale(2)), null,
  ...[0, 1, 2, 3, 4, 5, 6].map((n) => reliefFrame(n, true).scale(2)),
], 32, 64);

// ─────────────────────────────── Puertas ───────────────────────────────

const NUMERALS = [
  ['#'], ['#.#'], ['#.#.#'], ['#.#.##'],
];
function doorFrame(kind) {
  const img = new Img(16, 32);
  rect(img, 1, 6, 14, 26, rgba(STONE.dark));
  rect(img, 2, 8, 12, 24, rgba(kind === 'open' ? '#120C14' : STONE.mid));
  if (kind !== 'open') {
    rect(img, 7, 8, 2, 24, rgba(STONE.dark)); // junta de las dos hojas
    hexagon(img, 8, 20, 3, rgba(kind === 'sealed' ? PINK.deep : STONE.light));
    if (kind === 3) {
      rect(img, 5, 10, 1, 5, rgba(STONE.out));
      line(img, 7, 10, 9, 14, rgba(STONE.out));
      line(img, 11, 10, 9, 14, rgba(STONE.out));
    } else if (Number.isInteger(kind)) {
      const n = NUMERALS[kind][0];
      [...n].forEach((ch, i) => { if (ch === '#') rect(img, 8 - Math.floor(n.length / 2) + i, 10, 1, 5, rgba(STONE.out)); });
    }
  }
  rect(img, 0, 4, 16, 3, rgba(STONE.light)); // dintel
  rect(img, 0, 6, 16, 1, rgba(STONE.deep));
  return outline(img, STONE.out);
}
function doorSheetFrames() {
  const frames = [0, 1, 2, 3].map((k) => doorFrame(k).scale(2));
  frames[8] = doorFrame('open').scale(2);
  frames[9] = doorFrame('sealed').scale(2);
  return frames;
}

// ─────────────────────────────── Espejo ───────────────────────────────

function mirrorFrame(step) {
  const img = new Img(16, 32);
  rect(img, 1, 0, 14, 32, rgba('#B9A4C8'));
  rect(img, 2, 0, 12, 32, rgba('#D9E6F4', 235));
  for (let y = 0; y < 32; y++) {
    const x = Math.round(3 + ((y + step * 8) % 32) * 0.3);
    over(img, x, y, rgba('#FFFFFF', 200));
    over(img, x + 1, y, rgba('#FFFFFF', 120));
  }
  rect(img, 1, 0, 1, 32, rgba('#8A6FA0'));
  rect(img, 14, 0, 1, 32, rgba('#8A6FA0'));
  return img;
}

// ─────────────────────────────── Telar ───────────────────────────────

function loomFrame(state, pulse) {
  const img = new Img(48, 64);
  for (let x = 4; x <= 44; x++) over(img, x, 62, [0, 0, 0, 80]);
  // pies y marco de piedra
  rect(img, 4, 8, 4, 54, rgba(STONE.mid));
  rect(img, 40, 8, 4, 54, rgba(STONE.mid));
  rect(img, 2, 4, 44, 5, rgba(STONE.light));
  rect(img, 6, 44, 36, 4, rgba(STONE.dark));
  rect(img, 2, 58, 12, 4, rgba(STONE.dark));
  rect(img, 34, 58, 12, 4, rgba(STONE.dark));
  hexagon(img, 24, 6, 3, rgba(PINK.deep));
  // urdimbre
  for (let x = 10; x <= 38; x += 3) line(img, x, 9, x, 43, rgba(state === 'chain' ? '#C84050' : '#E8E0E6', 200));
  if (state === 'threads' || state === 'chain') {
    const cols = state === 'chain' ? ['#E03048', '#C82038', '#F05060'] : ['#FFE26E', '#FF96C4', '#6EAAFF'];
    cols.forEach((c, i) => {
      for (let x = 9; x <= 39; x++) {
        const y = 16 + i * 9 + Math.round(Math.sin((x + pulse * 2 + i * 3) * 0.5) * 2);
        over(img, x, y, rgba(c));
        over(img, x, y + 1, rgba(c, 150));
      }
    });
    if (state === 'chain') for (let i = 0; i < 6; i++) disc(img, 12 + i * 5, 50, 1.6, rgba('#E03048'));
  }
  return outline(img, STONE.out);
}
const loomSheet = () => gridSheet([
  ...[0, 0, 0, 0].map(() => loomFrame('empty', 0).scale(2)),
  ...[0, 1, 2, 3].map((p) => loomFrame('threads', p).scale(2)),
  ...[0, 1, 2, 3].map((p) => loomFrame('chain', p).scale(2)),
], 96, 128);

// ─────────────────────────────── Hebras y sello ───────────────────────────────

function threadFrame(color, step) {
  const img = new Img(16, 16);
  for (let i = 0; i < 12; i++) {
    const x = 2 + i;
    const y = 8 + Math.round(Math.sin((i + step * 2) * 0.7) * 3);
    over(img, x, y, rgba(color));
    over(img, x, y - 1, rgba('#FFFFFF', 90));
  }
  over(img, 8, 2 + step, rgba('#FFFFFF', 200));
  return img;
}
const threadSheet = () => gridSheet(['#FFE26E', '#FF96C4', '#6EAAFF'].flatMap((c) => [0, 1, 2, 3].map((s) => threadFrame(c, s).scale(2))), 32, 32);

function sealFrame(lit, open) {
  const img = new Img(16, 16);
  hexagon(img, 8, 8, 6, rgba(STONE.dark));
  hexagon(img, 8, 8, 5, rgba(open ? PINK.hi : STONE.light));
  const cols = ['#FFE26E', '#FF96C4', '#6EAAFF'];
  [[8, 5], [5, 10], [11, 10]].forEach(([x, y], i) => disc(img, x, y, 1.4, rgba(i < lit || open ? cols[i] : STONE.deep)));
  return outline(img, STONE.out);
}
const sealSheet = () => gridSheet([0, 1, 2, 3].map((n) => sealFrame(n, false).scale(2)).concat([sealFrame(3, true).scale(2)]), 32, 32);

// ─────────────────────────────── Zygarde Completo ───────────────────────────────

function zygardeSheet() {
  const file = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Pokemon', 'Front', 'ZYGARDE_2.png');
  if (!fs.existsSync(file)) throw new Error(`falta ${file}`);
  const strip = Img.load(file);
  const fw = strip.h;
  const count = Math.floor(strip.w / fw);
  const picks = [0, Math.floor(count / 4), Math.floor(count / 2), Math.floor((3 * count) / 4)];
  const frames = picks.map((i) => {
    const out = new Img(128, 128);
    out.blit(strip.crop(i * fw, 0, fw, fw), Math.floor((128 - fw) / 2), 128 - fw);
    return out;
  });
  return gridSheet([...frames, ...frames, ...frames, ...frames], 128, 128);
}

// ─────────────────────────────── Salida ───────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const outs = {
    glifo: save(glyphSheet(), 'b16_glifo.png'),
    relieve: save(reliefSheet(), 'b16_relieve.png'),
    puerta: save(gridSheet(doorSheetFrames(), 32, 64), 'b16_puerta.png'),
    espejo: save(gridSheet([0, 1, 2, 3].map((s) => mirrorFrame(s).scale(2)), 32, 64), 'b16_espejo.png'),
    telar: save(loomSheet(), 'b16_telar.png'),
    hebra: save(threadSheet(), 'b16_hebra.png'),
    sello: save(sealSheet(), 'b16_sello.png'),
    zygarde: save(zygardeSheet(), 'b16_zygarde_completo.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [k, img] of Object.entries(outs)) files.push(preview(img, { scale: k === 'zygarde' || k === 'telar' ? 1 : 2, bg: '#2A2230' }).save(path.join(PREVIEW, `b16_${k}.png`)));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b16_assets: ${err.message}`);
  process.exitCode = 1;
}
