// Arte propio del Bloque 3 (PROVISIONAL, D30) generado con tools/pixel.mjs. Uso: node tools/b03_assets.mjs [--preview]
//   game/assets/objects/noria.png      charset 4×4 de 64×64 (nativo 32×32 ×2): rueda de molino de madera con
//        salpicadura. Filas por dirección del evento: 2 gira normal · 4 parada · 6 gira al revés (Molino del
//        Diezmo, T02) · 8 gira a trompicones (el Albo errático antes del P2).
//   game/assets/objects/compuerta.png  charset 4×4 de 32×32 (nativo 16×16 ×2): tramo de compuerta de esclusa
//        (madera con flejes) con agua que rebosa aguas abajo (espuma animada). Filas: 2 tramo superior ·
//        4 tramo central · 6 tramo inferior · 8 tramo central sin rebose (esclusa quieta).
//   game/assets/objects/b03_objetos.png charset 4×4 de 32×32 (nativo 16×16 ×2), objetos sueltos (pattern = columna):
//        fila 2: matas de hierba muerta (4 variantes, espiral de la Arboleda, T01)
//        fila 4: banco de piedra (izquierda, centro, derecha) · sacos terreros
//        fila 6: tierra removida · hoyo abierto · hoyo con brillo (Tablilla) · brote verde
//        fila 8: charco (2 variantes) · cuerda anudada · hierba nueva con flores
// Paletas propias, sin el verde de Zygarde. Con --preview deja ampliaciones en tools/cache/pixel/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet, outline } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const px = (img, x, y, c) => img.set(Math.round(x), Math.round(y), typeof c === 'string' ? hex(c) : c);
function rect(img, x0, y0, w, h, c) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) px(img, x, y, c);
}
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  for (let i = 0; i <= n; i++) px(img, x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, c);
}

// ───────────────────────────── Rueda de molino ─────────────────────────────

const WHEEL = {
  o: '#3B2616', rim: '#8A5A32', rimHi: '#B07A45', spoke: '#6E4726', hub: '#4A3020', hubHi: '#9C6B3C',
  paddle: '#A06A38', paddleLo: '#6B4424', foam: '#F4FAFF', foam2: '#BFE0FF', water: '#6FA8E0',
};

/** Rueda de 8 palas girada `ang` radianes; `splash` 0..3 (espuma al pie) o -1 sin espuma. */
function wheelFrame(ang, splash) {
  const img = new Img(32, 32);
  const cx = 15.5;
  const cy = 16.5;
  const R = 12;
  // Palas (fuera del aro) y radios
  for (let k = 0; k < 8; k++) {
    const a = ang + (k * Math.PI) / 4;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    line(img, cx + ca * 3, cy + sa * 3, cx + ca * (R - 1), cy + sa * (R - 1), WHEEL.spoke);
    for (let r = R - 1; r <= R + 2; r++) {
      px(img, cx + ca * r, cy + sa * r, r === R + 2 ? WHEEL.paddleLo : WHEEL.paddle);
      px(img, cx + ca * r - sa, cy + sa * r + ca, WHEEL.paddleLo);
    }
  }
  // Aro doble
  for (let t = 0; t < 96; t++) {
    const a = (t / 96) * Math.PI * 2;
    px(img, cx + Math.cos(a) * R, cy + Math.sin(a) * R, Math.sin(a) < -0.2 ? WHEEL.rimHi : WHEEL.rim);
    px(img, cx + Math.cos(a) * (R - 3), cy + Math.sin(a) * (R - 3), WHEEL.rim);
  }
  // Cubo
  rect(img, 14, 15, 4, 4, WHEEL.hub);
  px(img, 15, 16, WHEEL.hubHi);
  const out = outline(img, WHEEL.o);
  // Agua y espuma al pie (la rueda entra en el canal)
  if (splash >= 0) {
    for (let x = 4; x <= 27; x++) {
      const y = 29 + ((x + splash) % 3 === 0 ? 0 : 1);
      px(out, x, y, WHEEL.water);
      px(out, x, 30, WHEEL.water);
      px(out, x, 31, WHEEL.water);
    }
    for (let i = 0; i < 6; i++) {
      const x = 6 + ((i * 7 + splash * 5) % 20);
      px(out, x, 28, WHEEL.foam);
      px(out, x + 1, 28, WHEEL.foam2);
      px(out, x, 27 - (splash % 2), WHEEL.foam2);
    }
  }
  return out.scale(2);
}

function buildNoria() {
  const step = Math.PI / 16; // 8 palas: el ciclo se repite cada 45° (4 fotogramas de 11,25°)
  const forward = [0, 1, 2, 3].map((i) => wheelFrame(i * step, i));
  const stopped = [0, 1, 2, 3].map(() => wheelFrame(0, -1));
  const reverse = [0, 1, 2, 3].map((i) => wheelFrame(-i * step, 3 - i));
  const jerky = [0, 0, 1, 3].map((i, k) => wheelFrame(i * step, k % 2 ? 1 : -1));
  return sheet([forward, stopped, reverse, jerky], 64, 64);
}

// ───────────────────────────── Compuerta de esclusa ─────────────────────────────

const GATE = {
  o: '#2A1C10', wood: '#7A5130', woodHi: '#A06E42', woodLo: '#5A3A20', iron: '#4E555E', ironHi: '#8A939E',
  stone: '#9C9A92', stoneHi: '#C4C2BA', stoneLo: '#6E6C66', foam: '#F4FAFF', foam2: '#BFE0FF', water: '#5E9AD6',
};

/** Tramo de compuerta (nativo 16×16). part: 'top' | 'mid' | 'bot'; f: fotograma; spill: rebosa. */
function gateFrame(part, f, spill) {
  const img = new Img(16, 16);
  // Hoja de madera vertical (x 4–9) con flejes de hierro
  for (let y = 0; y < 16; y++) {
    for (let x = 4; x <= 9; x++) {
      const c = x === 4 ? GATE.woodLo : x === 9 ? GATE.woodLo : (x === 5 ? GATE.woodHi : GATE.wood);
      px(img, x, y, c);
    }
    if (y % 3 === 1) px(img, 6 + (y % 2), y, GATE.woodLo); // vetas
  }
  for (const y of [3, 11]) { rect(img, 4, y, 6, 1, GATE.iron); px(img, 5, y, GATE.ironHi); }
  // Remates de piedra en los extremos (se apoyan en la orilla)
  if (part === 'top') { rect(img, 2, 0, 10, 4, GATE.stone); rect(img, 2, 0, 10, 1, GATE.stoneHi); rect(img, 2, 3, 10, 1, GATE.stoneLo); }
  if (part === 'bot') { rect(img, 2, 12, 10, 4, GATE.stone); rect(img, 2, 12, 10, 1, GATE.stoneHi); rect(img, 2, 15, 10, 1, GATE.stoneLo); }
  // Contorno solo de la madera y la piedra; el agua que rebosa va encima, sin contorno.
  const out = outline(img, GATE.o);
  if (spill) {
    for (let y = 0; y < 16; y++) {
      if ((part === 'top' && y < 4) || (part === 'bot' && y > 11)) continue;
      const k = (y + f * 2) % 4;
      px(out, 11, y, GATE.foam);
      px(out, 12, y, k < 2 ? GATE.foam : GATE.foam2);
      if (k === 0) px(out, 13, y, GATE.foam2);
      if ((y + f) % 5 === 0) px(out, 14, y, GATE.foam2);
    }
  }
  return out.scale(2);
}

function buildGate() {
  const row = (part, spill) => [0, 1, 2, 3].map((f) => gateFrame(part, f, spill));
  return sheet([row('top', true), row('mid', true), row('bot', true), row('mid', false)], 32, 32);
}

// ───────────────────────────── Objetos sueltos ─────────────────────────────

const DRY = { hi: '#D8BE68', mid: '#B8994A', lo: '#8C7034', dk: '#5E4A22' };
const STONE = { hi: '#D2D0C6', mid: '#ABA99F', lo: '#85837A', dk: '#5C5A53' };
const BAG = { hi: '#DCC99C', mid: '#BBA676', lo: '#8E7A50', dk: '#5E5034', tie: '#6A4A2A' };
const EARTH = { hi: '#A07A4E', mid: '#7E5C38', lo: '#5E4228', dk: '#3A281A', hole: '#22180F' };
const LEAF = { hi: '#8ED06A', mid: '#5DAA4A', lo: '#3E7E34', dk: '#2A5A24' };
const PUDDLE = { hi: '#CDE6FB', mid: '#8FC0EC', lo: '#6A9FD4' };

/**
 * Hierba muerta: mancha de césped seco (paja) que cubre casi toda la casilla, con briznas marcadas y bordes
 * irregulares para que las casillas vecinas se unan en una franja continua (la espiral se lee desde arriba).
 */
function dryTuft(seed) {
  const img = new Img(16, 16);
  const rnd = (x, y) => ((x * 73 + y * 151 + seed * 37) % 97) / 97;
  // Mancha redondeada e irregular (casi toca los bordes: las casillas vecinas forman un rastro continuo)
  const cx = 7.5 + ((seed % 3) - 1) * 0.6;
  const cy = 8 + ((seed % 2) ? 0.5 : -0.5);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot((x - cx) / 7.6, (y - cy) / 7.2) + (rnd(x, y) - 0.5) * 0.28;
      if (d > 1) continue;
      const r = rnd(x >> 1, y >> 1);
      const c = hex(r < 0.12 ? DRY.lo : (r < 0.8 ? DRY.mid : DRY.hi));
      img.set(x, y, [c[0], c[1], c[2], d > 0.82 ? 150 : 235]);
    }
  }
  // Briznas secas en V (como las matas del césped del tileset, pero pajizas)
  for (let i = 0; i < 5; i++) {
    const bx = 3 + ((i * 5 + seed * 3) % 10);
    const by = 5 + ((i * 7 + seed) % 8);
    px(img, bx, by, DRY.dk);
    px(img, bx - 1, by - 1, DRY.lo);
    px(img, bx + 1, by - 1, DRY.lo);
    px(img, bx - 1, by - 2, DRY.hi);
  }
  return img.scale(2);
}

/** Banco de piedra de tres piezas: 'L' (pata izquierda), 'M' (losa) y 'R' (pata derecha). */
function stoneBench(side) {
  const img = new Img(16, 16);
  const x0 = side === 'L' ? 2 : 0;
  const x1 = side === 'R' ? 13 : 15;
  rect(img, x0, 5, x1 - x0 + 1, 4, STONE.mid);
  rect(img, x0, 5, x1 - x0 + 1, 1, STONE.hi);
  rect(img, x0, 8, x1 - x0 + 1, 1, STONE.lo);
  if (side !== 'M') {
    const lx = side === 'L' ? 4 : 8;
    rect(img, lx, 9, 4, 5, STONE.lo);
    rect(img, lx, 9, 1, 5, STONE.mid);
    rect(img, lx, 14, 4, 1, STONE.dk);
  } else {
    for (const x of [3, 9, 12]) px(img, x, 7, STONE.dk); // juntas de la losa
    rect(img, 1, 9, 14, 1, '#4C6A3A'); // sombra sobre la hierba
  }
  px(img, side === 'L' ? 6 : 10, 6, '#7FA062');
  const out = outline(img, STONE.dk);
  // El contorno no debe cerrar la losa entre piezas: se borra en los lados que continúan
  if (side !== 'L') for (let y = 4; y <= 9; y++) out.set(0, y, out.get(1, y));
  if (side !== 'R') for (let y = 4; y <= 9; y++) out.set(15, y, out.get(14, y));
  return out.scale(2);
}

function sandbags(v) {
  const img = new Img(16, 16);
  const bags = v === 0 ? [[1, 9], [8, 9], [4, 5]] : [[2, 10], [9, 10], [5, 6], [9, 5]];
  for (const [bx, by] of bags) {
    rect(img, bx, by, 7, 4, BAG.mid);
    rect(img, bx + 1, by, 5, 1, BAG.hi);
    rect(img, bx, by + 3, 7, 1, BAG.lo);
    px(img, bx + 3, by + 1, BAG.tie);
  }
  return outline(img, BAG.dk).scale(2);
}

function earth(kind) {
  const img = new Img(16, 16);
  if (kind === 'mound') {
    for (let y = 8; y <= 14; y++) for (let x = 3; x <= 12; x++) if ((x - 7.5) ** 2 / 25 + (y - 11) ** 2 / 9 <= 1) px(img, x, y, y < 10 ? EARTH.hi : EARTH.mid);
    for (const [x, y] of [[5, 12], [9, 11], [11, 13]]) px(img, x, y, EARTH.lo);
    return outline(img, EARTH.dk).scale(2);
  }
  if (kind === 'sprout') {
    rect(img, 5, 13, 6, 2, EARTH.mid);
    line(img, 8, 13, 8, 7, LEAF.lo);
    for (const [x, y] of [[6, 8], [7, 9], [9, 8], [10, 7], [5, 7]]) px(img, x, y, LEAF.mid);
    px(img, 8, 6, LEAF.hi);
    px(img, 10, 6, LEAF.hi);
    return outline(img, LEAF.dk).scale(2);
  }
  // Hoyo (con o sin brillo)
  for (let y = 5; y <= 14; y++) {
    for (let x = 2; x <= 13; x++) {
      const d = (x - 7.5) ** 2 / 36 + (y - 10) ** 2 / 20;
      if (d <= 1) px(img, x, y, d > 0.55 ? EARTH.mid : (d > 0.3 ? EARTH.lo : EARTH.hole));
    }
  }
  if (kind === 'glint') {
    rect(img, 6, 9, 4, 3, '#C9D27A');
    px(img, 6, 9, '#FFF6C0');
    px(img, 9, 11, '#8E9446');
    for (const [x, y] of [[7, 7], [10, 8], [5, 11]]) px(img, x, y, '#FFFBE0');
  }
  return outline(img, EARTH.dk).scale(2);
}

function puddle(v) {
  const img = new Img(16, 16);
  const [cx, cy, rx, ry] = v === 0 ? [7.5, 10, 6, 3.2] : [8, 9, 5, 4];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = (x - cx) ** 2 / rx ** 2 + (y - cy) ** 2 / ry ** 2;
      if (d <= 1) {
        const c = hex(d > 0.7 ? PUDDLE.lo : PUDDLE.mid);
        img.set(x, y, [c[0], c[1], c[2], 190]);
      }
    }
  }
  const h = hex(PUDDLE.hi);
  img.set(Math.round(cx) - 2, Math.round(cy) - 1, [h[0], h[1], h[2], 230]);
  img.set(Math.round(cx) - 1, Math.round(cy) - 1, [h[0], h[1], h[2], 230]);
  return img.scale(2);
}

/** Cuerda: lazada tendida en el suelo con el nudo (Mirta atada al Árbol del Fundador). */
function rope() {
  const img = new Img(16, 16);
  const c1 = '#C9A46A';
  const c2 = '#8E6E3E';
  for (let t = 0; t < 40; t++) {
    const a = (t / 40) * Math.PI * 2;
    px(img, 8 + Math.cos(a) * 6, 10 + Math.sin(a) * 3, t % 4 === 0 ? c2 : c1);
  }
  rect(img, 12, 9, 3, 3, c1);
  px(img, 13, 10, c2);
  line(img, 14, 12, 15, 15, c1);
  return img.scale(2);
}

function newGrass() {
  const img = new Img(16, 16);
  for (const [bx, by, h] of [[3, 13, 4], [6, 14, 5], [9, 13, 4], [12, 14, 3], [7, 11, 3]]) {
    for (let t = 0; t < h; t++) px(img, bx + (t > 2 ? 1 : 0), by - t, t === h - 1 ? LEAF.hi : LEAF.mid);
  }
  for (const [x, y, c] of [[4, 9, '#F7E27A'], [11, 10, '#F4A6C8'], [8, 8, '#FFFFFF']]) px(img, x, y, c);
  return outline(img, LEAF.dk).scale(2);
}

function buildObjects() {
  return sheet([
    [dryTuft(0), dryTuft(1), dryTuft(2), dryTuft(3)],
    [stoneBench('L'), stoneBench('M'), stoneBench('R'), sandbags(0)],
    [earth('mound'), earth('hole'), earth('glint'), earth('sprout')],
    [puddle(0), puddle(1), rope(), newGrass()],
  ], 32, 32);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const noria = buildNoria();
  const gate = buildGate();
  const objs = buildObjects();
  const files = [
    noria.save(path.join(OUT, 'noria.png')),
    gate.save(path.join(OUT, 'compuerta.png')),
    objs.save(path.join(OUT, 'b03_objetos.png')),
  ];
  if (process.argv.includes('--preview')) {
    files.push(preview(noria, { scale: 2, bg: '#6FA8E0' }).save(path.join(PREVIEW, 'noria_x2.png')));
    files.push(preview(gate, { scale: 3, bg: '#5E9AD6' }).save(path.join(PREVIEW, 'compuerta_x3.png')));
    files.push(preview(objs, { scale: 3, bg: '#8CCB6A' }).save(path.join(PREVIEW, 'b03_objetos_x3.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

build();
