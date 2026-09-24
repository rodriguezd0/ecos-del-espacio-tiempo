// Arte propio del Bloque 4 (PROVISIONAL, D30) generado con tools/pixel.mjs. Uso: node tools/b04_assets.mjs [--preview]
//   game/assets/objects/b04_noria.png     charset 4×4 de 96×128 (nativo 48×64 ×2): noria de madera de la Escalera de
//        Estanques. Fila 0 (dir 2) girando (4 fotogramas), 1 (dir 4) enganchada y quieta, 2 (dir 6) suelta (engranaje
//        separado), 3 (dir 8) rota y con musgo (molino abandonado de la Garganta).
//   game/assets/objects/b04_compuerta.png charset 4×4 de 64×64: compuerta de esclusa (marco de piedra y tablón). Fila 0
//        cerrada, 1 abierta con el agua pasando (animada), 2 cerrada con musgo (esclusa de la Garganta), 3 abierta.
//   game/assets/objects/b04_mando.png charset 4×4 de 64×64: mandos de compuerta y palancas. Fila 0 mando cerrado
//        (volante arriba), 1 mando abierto (glifo de agua encendido, animado), 2 palanca arriba, 3 palanca abajo.
//   game/assets/objects/b04_baliza.png    charset 4×4 de 64×64: baliza de resonancia de tres patas del Consorcio
//        (Genesis, CAMPANA §5.1: petróleo, blanco clínico, carbón y magenta); anillo magenta que late.
// Con --preview deja ampliaciones en tools/cache/pixel/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const C = {
  o: '#1C1A1E', woodD: '#5A3A22', wood: '#7E5230', woodL: '#A8743F', woodH: '#C99A5C',
  stoneD: '#4E5563', stone: '#7B8494', stoneL: '#A7B0BE', stoneH: '#C9D0DA', moss: '#4F7A3A', mossL: '#6E9A4A',
  iron: '#3A3F4A', ironL: '#6A7282', brass: '#B58A34', brassL: '#E0B85A',
  water: '#3E8FD6', waterL: '#8CC8F2', foam: '#E6F6FF', waterD: '#285E9A',
  pet: '#1F4E5A', petL: '#2E6E7E', white: '#F2F4F5', carbon: '#2B2D31', mag: '#B03A8C', magL: '#FF8AD8', magD: '#5A2048',
  red: '#B8423A', glow: '#9FE8FF',
};
const P = (name) => hex(C[name] || name);

function fillRect(img, x, y, w, h, color) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.set(x + i, y + j, P(color));
}
function line(img, x0, y0, x1, y1, color) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), P(color));
}
function disc(img, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.5) img.set(cx + x, cy + y, P(color));
}
function ring(img, cx, cy, r, color) {
  for (let a = 0; a < 360; a += 3) {
    const t = (a * Math.PI) / 180;
    img.set(Math.round(cx + Math.cos(t) * r), Math.round(cy + Math.sin(t) * r), P(color));
  }
}

// ───────────────────────────── Noria ─────────────────────────────
const NORIA_W = 48;
const NORIA_H = 64;
const HUB = { x: 24, y: 26 };
const R = 19;

function noriaFrame(frame, mode) {
  const img = new Img(NORIA_W, NORIA_H);
  const broken = mode === 'broken';
  // Canal de piedra y pila de agua a los pies.
  fillRect(img, 4, 52, 40, 10, 'stoneD');
  fillRect(img, 5, 53, 38, 8, 'stone');
  fillRect(img, 7, 55, 34, 5, mode === 'dry' || broken ? 'stoneD' : 'water');
  if (!broken && mode !== 'dry') for (let x = 8; x < 40; x += 4) img.set(x + (frame % 4), 56, P('waterL'));
  // Soportes del eje.
  for (const px of [7, 38]) {
    fillRect(img, px, 22, 3, 32, 'stoneD');
    fillRect(img, px + 1, 22, 1, 32, 'stoneL');
  }
  line(img, 9, 24, 38, 24, 'iron');
  // Rueda: aro doble, radios y paletas (rotación de 11,25° por fotograma).
  const rot = mode === 'turn' ? frame * (Math.PI / 16) : 0;
  ring(img, HUB.x, HUB.y, R, 'woodD');
  ring(img, HUB.x, HUB.y, R - 1, broken ? 'woodD' : 'wood');
  ring(img, HUB.x, HUB.y, R - 6, 'woodD');
  for (let k = 0; k < 8; k++) {
    if (broken && (k === 2 || k === 5)) continue;
    const a = rot + (k * Math.PI) / 4;
    const cx = Math.cos(a); const sy = Math.sin(a);
    line(img, HUB.x, HUB.y, Math.round(HUB.x + cx * (R - 1)), Math.round(HUB.y + sy * (R - 1)), k % 2 ? 'wood' : 'woodL');
    // Paleta (tabla perpendicular en el aro).
    const px = HUB.x + cx * (R + 1); const py = HUB.y + sy * (R + 1);
    const tx = -sy * 2.5; const ty = cx * 2.5;
    line(img, Math.round(px - tx), Math.round(py - ty), Math.round(px + tx), Math.round(py + ty), 'woodH');
    line(img, Math.round(px - tx - cx), Math.round(py - ty - sy), Math.round(px + tx - cx), Math.round(py + ty - sy), 'woodD');
  }
  disc(img, HUB.x, HUB.y, 3, 'iron');
  disc(img, HUB.x, HUB.y, 1, 'brassL');
  // Engranaje del eje: engranado (piñón junto al buje) o separado.
  const gx = mode === 'loose' ? 36 : 31;
  disc(img, gx, 30, 3, 'iron');
  for (let k = 0; k < 6; k++) img.set(Math.round(gx + Math.cos(k + frame) * 4), Math.round(30 + Math.sin(k + frame) * 4), P('ironL'));
  // Agua que cae de las paletas al girar.
  if (mode === 'turn') {
    for (let k = 0; k < 5; k++) {
      const y = 8 + ((frame * 6 + k * 9) % 40);
      img.set(41, y, P('waterL'));
      img.set(42, y + 1, P('foam'));
      img.set(6, 50 - ((frame * 5 + k * 8) % 26), P('waterL'));
    }
  }
  if (broken) for (const [x, y] of [[20, 45], [21, 45], [30, 9], [31, 10], [12, 20], [13, 21], [36, 38]]) img.set(x, y, P('mossL'));
  return img.scale(2);
}

// ───────────────────────────── Compuerta ─────────────────────────────
function gateFrame(frame, open, mossy) {
  const img = new Img(32, 32);
  // Marco de piedra (dos postes y dintel).
  fillRect(img, 3, 6, 5, 24, 'stoneD'); fillRect(img, 4, 7, 3, 22, 'stone');
  fillRect(img, 24, 6, 5, 24, 'stoneD'); fillRect(img, 25, 7, 3, 22, 'stone');
  fillRect(img, 2, 3, 28, 5, 'stoneD'); fillRect(img, 3, 4, 26, 3, 'stoneL');
  // Agua bajo la compuerta.
  fillRect(img, 8, 22, 16, 8, open ? 'water' : 'waterD');
  // Tablón: abajo (cerrada) o levantado (abierta) con el agua pasando.
  const top = open ? 8 : 14;
  fillRect(img, 8, top, 16, 10, 'woodD');
  fillRect(img, 9, top + 1, 14, 8, 'wood');
  for (let x = 10; x < 23; x += 3) line(img, x, top + 1, x, top + 8, 'woodL');
  line(img, 16, 7, 16, top, 'iron');
  if (open) {
    for (let k = 0; k < 6; k++) {
      const x = 9 + ((k * 5 + frame * 3) % 14);
      img.set(x, 20 + (k % 3), P('foam'));
      img.set(x, 24 + ((k + frame) % 5), P('waterL'));
    }
  }
  if (mossy) for (const [x, y] of [[4, 28], [5, 27], [26, 28], [27, 26], [10, 17], [20, 16]]) img.set(x, y, P('moss'));
  return img.scale(2);
}

// ───────────────────────────── Mandos y palancas ─────────────────────────────
function controlFrame(frame, kind) {
  const img = new Img(32, 32);
  // Pedestal de piedra.
  fillRect(img, 9, 18, 14, 12, 'stoneD'); fillRect(img, 10, 19, 12, 10, 'stone');
  fillRect(img, 8, 29, 16, 2, 'stoneD');
  line(img, 11, 20, 20, 20, 'stoneH');
  if (kind === 'closed' || kind === 'open') {
    // Volante de hierro de la compuerta.
    const cy = kind === 'open' ? 13 : 10;
    ring(img, 16, cy, 6, 'iron');
    ring(img, 16, cy, 5, 'ironL');
    line(img, 10, cy, 22, cy, 'iron'); line(img, 16, cy - 6, 16, cy + 6, 'iron');
    disc(img, 16, cy, 1, 'brassL');
    line(img, 16, cy + 6, 16, 18, 'iron');
    // Glifo de agua en la piedra: apagado (cerrada) o encendido y pulsando (abierta).
    const glyph = kind === 'open' ? (frame % 2 ? 'glow' : 'waterL') : 'stoneD';
    for (const [x, y] of [[14, 23], [15, 24], [16, 23], [17, 24], [18, 23], [15, 26], [16, 25], [17, 26]]) img.set(x, y, P(glyph));
  } else {
    // Palanca de bronce: arriba o abajo.
    const up = kind === 'up';
    line(img, 16, 19, up ? 13 : 21, up ? 6 : 12, 'iron');
    line(img, 17, 19, up ? 14 : 22, up ? 6 : 12, 'ironL');
    disc(img, up ? 13 : 21, up ? 6 : 12, 2, 'brass');
    img.set(up ? 12 : 20, up ? 5 : 11, P('brassL'));
    disc(img, 16, 19, 2, 'iron');
  }
  return img.scale(2);
}

// ───────────────────────────── Baliza ─────────────────────────────
function beaconFrame(frame) {
  const img = new Img(32, 32);
  // Tres patas.
  line(img, 15, 18, 8, 30, 'carbon'); line(img, 16, 18, 23, 30, 'carbon'); line(img, 15, 18, 15, 29, 'ironL');
  // Mástil y cuerpo.
  fillRect(img, 14, 8, 3, 11, 'carbon');
  fillRect(img, 11, 12, 9, 6, 'pet'); fillRect(img, 12, 13, 7, 1, 'petL');
  fillRect(img, 12, 15, 7, 2, 'white');
  img.set(15, 15, P('mag')); img.set(16, 15, P('mag'));
  // Antena con anillo magenta que late.
  line(img, 15, 2, 15, 8, 'carbon');
  const pulse = [1, 2, 3, 2][frame % 4];
  disc(img, 15, 3, 1, frame % 2 ? 'magL' : 'mag');
  if (pulse > 1) ring(img, 15, 3, pulse + 1, frame === 2 ? 'magL' : 'magD');
  // Ondas en el suelo.
  for (let k = 0; k < 3; k++) img.set(6 + k * 9 + (frame % 3), 31, P(frame % 2 ? 'mag' : 'magD'));
  return img.scale(2);
}

function build() {
  const turn = [0, 1, 2, 3].map((f) => noriaFrame(f, 'turn'));
  const engaged = Array(4).fill(noriaFrame(0, 'idle'));
  const loose = Array(4).fill(noriaFrame(0, 'loose'));
  const broken = Array(4).fill(noriaFrame(0, 'broken'));
  const noria = sheet([turn, engaged, loose, broken], 96, 128);

  const gate = sheet([
    Array(4).fill(gateFrame(0, false, false)),
    [0, 1, 2, 3].map((f) => gateFrame(f, true, false)),
    Array(4).fill(gateFrame(0, false, true)),
    [0, 1, 2, 3].map((f) => gateFrame(f, true, true)),
  ], 64, 64);

  const control = sheet([
    Array(4).fill(controlFrame(0, 'closed')),
    [0, 1, 2, 3].map((f) => controlFrame(f, 'open')),
    Array(4).fill(controlFrame(0, 'up')),
    Array(4).fill(controlFrame(0, 'down')),
  ], 64, 64);

  const beacon = [0, 1, 2, 3].map(beaconFrame);
  const beaconSheet = sheet([beacon, beacon, beacon, beacon], 64, 64);

  const files = [
    noria.save(path.join(OUT, 'b04_noria.png')),
    gate.save(path.join(OUT, 'b04_compuerta.png')),
    control.save(path.join(OUT, 'b04_mando.png')),
    beaconSheet.save(path.join(OUT, 'b04_baliza.png')),
  ];
  if (process.argv.includes('--preview')) {
    files.push(preview(noria, { scale: 2, bg: '#445066' }).save(path.join(PREVIEW, 'b04_noria_x2.png')));
    files.push(preview(gate, { scale: 3, bg: '#445066' }).save(path.join(PREVIEW, 'b04_compuerta_x3.png')));
    files.push(preview(control, { scale: 3, bg: '#445066' }).save(path.join(PREVIEW, 'b04_mando_x3.png')));
    files.push(preview(beaconSheet.crop(0, 0, 256, 64), { scale: 3, bg: '#7CB870' }).save(path.join(PREVIEW, 'b04_baliza_x3.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

build();
