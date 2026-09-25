// Arte propio del Bloque 19 — la Calzada del Rey (PROVISIONAL, D30) con tools/pixel.mjs. Uso:
//   node tools/b19_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime), dibujadas a escala nativa de
// DS y ampliadas ×2:
//   objects/b19_resonador.png   32×64  trozo del Resonador en su trípode (fila 2 tirando de las piedras · 4 apagado y
//                                      rajado tras la sobrecarga)
//   objects/b19_aguja.png       32×64  aguja de roca con un zócalo hexagonal gastado (fila 2 dormida · 4 despierta, verde)
//   objects/b19_estandarte.png  32×64  estandarte de los Peregrinos del Rey: corona dorada sobre azul (ondea)
//   objects/b19_tablilla.png    32×32  Tabla Draco en su hornacina (fila 2 con brillo · 4 hornacina vacía)
//   objects/b19_taller.png      32×32  piezas del taller del Rey (índice = fila·4 + columna, ver TALLER más abajo)
//   objects/b19_piedra.png      32×32  losa forzada por el Resonador (fila 2 flotando · 4 se agrieta y cae)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const C = {
  coal: '#2B2D31', coalHi: '#44474D', steel: '#6B7078', steelHi: '#9AA0A8',
  magenta: '#B03A8C', magentaHi: '#E266B8', violet: '#7C4DD8', violetHi: '#C8A8FF',
  wood: '#6B4A2E', woodHi: '#8E6A44', woodLo: '#4A321E',
  rock: '#7A7268', rockHi: '#A09686', rockLo: '#52493F', rockDk: '#342E28',
  hex: '#8C9096', hexHi: '#B8BCC2', hexLo: '#5E6268',
  green: '#2FBF5F', greenHi: '#9CF7B6', greenLo: '#1C7A3C',
  blue: '#24356B', blueHi: '#3A55A0', blueLo: '#172248', gold: '#E8C050', goldLo: '#A8842C',
  draco: '#4B3FA8', dracoHi: '#8C7CF0', dracoLo: '#2A2166',
  clay: '#A86A44', clayHi: '#C98A5E', cloth: '#8A7A5E', clothHi: '#B0A07E',
};
const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, hex(c)); };
function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), hex(c));
}
const same4 = (f) => [f, f, f, f];

// ───────────────────────────── Resonador ─────────────────────────────

function resonatorFrame(active, f) {
  const img = new Img(16, 32);
  for (let x = 2; x <= 13; x++) over(img, x, 31, [0, 0, 0, 80]);
  // trípode de madera
  line(img, 3, 30, 7, 17, C.woodLo); line(img, 4, 30, 8, 17, C.wood);
  line(img, 12, 30, 8, 17, C.woodLo); line(img, 13, 30, 9, 17, C.wood);
  line(img, 8, 30, 8, 18, C.woodHi);
  box(img, 5, 16, 11, 17, C.coal); // abrazadera
  // el trozo: una lámina dentada de metal carbón con núcleo magenta
  const shard = [[8, 3], [11, 7], [10, 9], [12, 12], [9, 16], [6, 15], [4, 11], [6, 8], [5, 5]];
  for (let y = 3; y <= 16; y++) {
    const xs = [];
    for (let i = 0; i < shard.length; i++) {
      const [ax, ay] = shard[i]; const [bx, by] = shard[(i + 1) % shard.length];
      if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
    }
    xs.sort((a, b) => a - b);
    for (let j = 0; j + 1 < xs.length; j += 2) for (let x = Math.ceil(xs[j]); x <= Math.floor(xs[j + 1]); x++) img.set(x, y, hex(C.coal));
  }
  line(img, 8, 3, 11, 7, C.steelHi); line(img, 5, 5, 8, 3, C.steel);
  if (!active) {
    // apagado: rajado, sin brillo
    box(img, 7, 8, 9, 12, '#3A2A36');
    line(img, 6, 6, 10, 14, '#1A1A1E');
    img.set(9, 9, hex('#5A3A50'));
    return outline(img, '#101014');
  }
  const pulse = [0, 1, 2, 1][f];
  box(img, 7, 8, 9, 12, C.magenta);
  box(img, 8, 9, 8, 11, C.magentaHi);
  if (pulse > 0) { img.set(7, 10, hex(C.magentaHi)); img.set(9, 10, hex(C.magentaHi)); }
  const out = outline(img, '#101014');
  // halo violeta y chispas que tiran hacia arriba (hacia las piedras), sobre el contorno
  for (let r = 3; r <= 4 + pulse; r++) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      over(out, Math.round(8 + Math.cos(ang) * r), Math.round(10 + Math.sin(ang) * r), rgba(C.violetHi, 26 + pulse * 10));
    }
  }
  const sparks = [[[4, 2], [5, 1]], [[12, 3], [13, 1]], [[10, 1], [10, 0]], [[3, 6], [2, 4]]];
  for (let i = 0; i < 2; i++) { const [[ax, ay], [bx, by]] = sparks[(f + i * 2) % 4]; line(out, ax, ay, bx, by, C.violetHi); }
  return out;
}

function resonatorSheet() {
  const on = [0, 1, 2, 3].map((f) => resonatorFrame(true, f).scale(2));
  const off = same4(resonatorFrame(false, 0).scale(2));
  return sheet([on, off, on, off], 32, 64);
}

// ───────────────────────────── Aguja ─────────────────────────────

function needleFrame(awake, f) {
  const img = new Img(16, 32);
  // columna de roca que sube del abismo (se oscurece hacia abajo)
  for (let y = 8; y <= 31; y++) {
    const half = 4 + Math.floor((y - 8) / 9);
    for (let x = 8 - half; x <= 7 + half; x++) {
      const edge = x === 8 - half || x === 7 + half;
      let c = hex(edge ? C.rockLo : (x < 8 ? C.rock : C.rockHi));
      if ((x * 7 + y * 3) % 11 === 0) c = hex(C.rockLo);
      const fade = Math.max(0, (y - 20) / 11);
      img.set(x, y, [Math.round(c[0] * (1 - fade * 0.85)), Math.round(c[1] * (1 - fade * 0.85)), Math.round(c[2] * (1 - fade * 0.8)), 255]);
    }
  }
  // cima plana con el zócalo hexagonal
  box(img, 3, 7, 12, 9, C.rockHi);
  const hexRows = [[6, 9], [5, 10], [4, 11], [4, 11], [5, 10], [6, 9]];
  hexRows.forEach(([a, b], j) => { for (let x = a; x <= b; x++) img.set(x, 2 + j, hex(C.hex)); });
  hexRows.forEach(([a, b], j) => { img.set(a, 2 + j, hex(C.hexLo)); img.set(b, 2 + j, hex(C.hexLo)); });
  box(img, 6, 2, 9, 2, C.hexHi);
  if (!awake) {
    line(img, 6, 3, 9, 6, C.hexLo); // grieta del zócalo gastado
    img.set(8, 4, hex(C.hexLo));
    return outline(img, '#16120E');
  }
  const glow = [0, 1, 2, 1][f];
  box(img, 6, 4, 9, 5, glow ? C.greenHi : C.green);
  img.set(5, 4, hex(C.green)); img.set(10, 5, hex(C.green));
  const out = outline(img, '#16120E');
  for (let r = 5; r <= 6 + glow; r++) {
    for (let a = 0; a < 18; a++) {
      const ang = (a / 18) * Math.PI * 2;
      over(out, Math.round(7.5 + Math.cos(ang) * r), Math.round(4.5 + Math.sin(ang) * (r - 1)), rgba(C.greenHi, 30 + glow * 12));
    }
  }
  return out;
}

function needleSheet() {
  const dormant = same4(needleFrame(false, 0).scale(2));
  const awake = [0, 1, 2, 3].map((f) => needleFrame(true, f).scale(2));
  return sheet([dormant, awake, dormant, awake], 32, 64);
}

// ───────────────────────────── Estandarte ─────────────────────────────

function bannerFrame(f) {
  const img = new Img(16, 32);
  for (let x = 5; x <= 10; x++) over(img, x, 31, [0, 0, 0, 70]);
  box(img, 7, 2, 8, 30, C.woodLo); box(img, 7, 2, 7, 30, C.wood); // mástil
  box(img, 3, 3, 12, 3, C.wood); // travesaño
  img.set(7, 1, hex(C.gold)); img.set(8, 1, hex(C.goldLo));
  const sway = [0, 1, 0, -1][f];
  for (let y = 4; y <= 18; y++) {
    const off = y > 12 ? sway : 0;
    for (let x = 4 + off; x <= 11 + off; x++) img.set(x, y, hex(x === 4 + off ? C.blueLo : x === 11 + off ? C.blueLo : C.blue));
  }
  // flecos y punta en V
  for (let x = 4 + sway; x <= 11 + sway; x++) img.set(x, 19 - Math.abs(x - 7.5 - sway) / 3 | 0, hex(C.gold));
  // corona dorada
  const crown = ['g.g.g', 'ggggg', 'ggggg', '.GGG.'];
  crown.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.') img.set(6 + i, 8 + j, hex(ch === 'g' ? C.gold : C.goldLo)); }));
  box(img, 5, 5, 10, 5, C.blueHi);
  return outline(img, '#101018');
}

function bannerSheet() {
  const row = [0, 1, 2, 3].map((f) => bannerFrame(f).scale(2));
  return sheet([row, row, row, row], 32, 64);
}

// ───────────────────────────── Tablilla ─────────────────────────────

function plateFrame(f, empty = false) {
  const img = new Img(16, 16);
  if (empty) return img;
  for (let x = 3; x <= 12; x++) over(img, x, 14, [0, 0, 0, 70]);
  box(img, 3, 4, 12, 13, C.draco);
  box(img, 3, 4, 12, 4, C.dracoHi); box(img, 3, 4, 3, 13, C.dracoHi);
  box(img, 12, 5, 12, 13, C.dracoLo); box(img, 4, 13, 12, 13, C.dracoLo);
  // grabado: un dragón estilizado (ala y cola)
  line(img, 5, 10, 8, 6, C.gold); line(img, 8, 6, 10, 8, C.gold); line(img, 10, 8, 9, 11, C.goldLo);
  const shine = [[5, 5], [7, 5], [9, 5], [11, 6]][f];
  img.set(shine[0], shine[1], hex('#FFFFFF'));
  const out = outline(img, '#0E0A22');
  for (let a = 0; a < 20; a++) {
    const ang = (a / 20) * Math.PI * 2;
    over(out, Math.round(7.5 + Math.cos(ang) * 7), Math.round(8.5 + Math.sin(ang) * 6), rgba(C.dracoHi, 36 + (f % 2) * 20));
  }
  return out;
}

function plateSheet() {
  const on = [0, 1, 2, 3].map((f) => plateFrame(f).scale(2));
  const off = same4(plateFrame(0, true).scale(2));
  return sheet([on, off, on, off], 32, 32);
}

// ───────────────────────────── Taller del Rey ─────────────────────────────

function hexStone(img, cx, cy, c = C.hex) {
  const rows = [[-1, 1], [-2, 2], [-2, 2], [-1, 1]];
  rows.forEach(([a, b], j) => { for (let x = a; x <= b; x++) img.set(cx + x, cy + j, hex(c)); });
  img.set(cx - 1, cy, hex(C.hexHi)); img.set(cx, cy, hex(C.hexHi));
  img.set(cx + 2, cy + 2, hex(C.hexLo)); img.set(cx + 1, cy + 3, hex(C.hexLo));
}

const TALLER_DRAW = [
  // 0 banco (izquierda): losa de piedra sobre patas con una maza
  (img) => { box(img, 1, 6, 15, 9, C.rock); box(img, 1, 6, 15, 6, C.rockHi); box(img, 2, 10, 3, 14, C.rockLo); box(img, 1, 10, 15, 10, C.rockDk); box(img, 5, 3, 9, 5, C.wood); line(img, 9, 4, 13, 4, C.woodHi); },
  // 1 banco (derecha): cinceles y un hexágono a medio tallar
  (img) => { box(img, 0, 6, 14, 9, C.rock); box(img, 0, 6, 14, 6, C.rockHi); box(img, 12, 10, 13, 14, C.rockLo); box(img, 0, 10, 14, 10, C.rockDk); line(img, 2, 5, 6, 3, C.steelHi); line(img, 3, 5, 7, 3, C.steel); hexStone(img, 10, 2); },
  // 2 pila de sillares hexagonales
  (img) => { hexStone(img, 5, 9); hexStone(img, 10, 9); hexStone(img, 7, 5); hexStone(img, 8, 1, C.hexHi); for (let x = 2; x <= 13; x++) over(img, x, 14, [0, 0, 0, 70]); },
  // 3 losa con el puente grabado (el Rey dibujó el puente que cuidaba)
  (img) => { box(img, 1, 2, 14, 13, C.rock); box(img, 1, 2, 14, 2, C.rockHi); box(img, 14, 3, 14, 13, C.rockLo); line(img, 3, 9, 12, 9, C.rockDk); line(img, 3, 9, 5, 6, C.rockDk); line(img, 12, 9, 10, 6, C.rockDk); line(img, 5, 6, 10, 6, C.rockDk); for (const x of [4, 7, 10]) line(img, x, 10, x, 12, C.rockDk); },
  // 4 cama de piedra (cabecera)
  (img) => { box(img, 1, 3, 14, 15, C.rock); box(img, 1, 3, 14, 3, C.rockHi); box(img, 3, 5, 12, 8, C.cloth); box(img, 3, 5, 12, 5, C.clothHi); box(img, 3, 9, 12, 15, C.clothHi); },
  // 5 cama de piedra (pies)
  (img) => { box(img, 1, 0, 14, 11, C.rock); box(img, 3, 0, 12, 8, C.cloth); box(img, 3, 0, 12, 0, C.clothHi); box(img, 1, 11, 14, 12, C.rockLo); },
  // 6 cántaro de barro
  (img) => { box(img, 5, 5, 10, 13, C.clay); box(img, 4, 7, 11, 11, C.clay); box(img, 6, 3, 9, 4, C.clayHi); box(img, 5, 6, 5, 11, C.clayHi); for (let x = 4; x <= 11; x++) over(img, x, 14, [0, 0, 0, 70]); },
  // 7 herramientas colgadas (martillo, escuadra y cuerda)
  (img) => { box(img, 1, 2, 14, 3, C.wood); line(img, 3, 4, 3, 11, C.woodHi); box(img, 2, 11, 4, 12, C.steel); line(img, 8, 4, 8, 9, C.steelHi); line(img, 8, 9, 11, 9, C.steelHi); line(img, 12, 4, 13, 8, C.clothHi); line(img, 13, 8, 12, 12, C.clothHi); },
];

function tallerSheet() {
  const frames = TALLER_DRAW.map((draw) => { const img = new Img(16, 16); draw(img); return outline(img, '#18140F').scale(2); });
  const rows = [];
  for (let r = 0; r < 4; r++) rows.push([0, 1, 2, 3].map((c) => frames[r * 4 + c] || new Img(32, 32)));
  return sheet(rows, 32, 32);
}

// ───────────────────────────── Piedra forzada ─────────────────────────────

/**
 * Losa de la Calzada alzada a la fuerza por el Resonador: flota sobre el vacío con un halo violeta que tira de ella.
 * `bob` = desplazamiento vertical (px nativos) · `crack` 0–3 = cuánto se ha agrietado al caer.
 */
function stoneFrame(bob, crack, glow) {
  const img = new Img(16, 16);
  const top = 3 + bob;
  const vein = glow % 2 ? C.magentaHi : C.violetHi;
  if (crack < 3) {
    // cara superior de la losa (piedra clara, vista a tres cuartos) y canto oscuro debajo
    for (let y = top; y <= top + 5; y++) {
      const inset = y === top ? 1 : 0;
      for (let x = 1 + inset; x <= 14 - inset; x++) {
        let c = C.rockHi;
        if (y === top) c = '#C8BCA8';
        else if (x === 1 || x === 14) c = C.rock;
        if ((x * 5 + y * 3) % 13 === 0) c = C.rock;
        img.set(x, y, hex(c));
      }
    }
    for (let y = top + 6; y <= top + 8; y++) for (let x = 2; x <= 13; x++) img.set(x, y, hex(y === top + 6 ? C.rockLo : C.rockDk));
    // hexágono gastado grabado en la cara
    const hx = [[6, 9], [5, 10], [5, 10], [6, 9]];
    hx.forEach(([a, b], j) => {
      const y = top + 1 + j;
      if (j === 0 || j === 3) for (let x = a; x <= b; x++) img.set(x, y, hex(C.hexLo));
      else { img.set(a, y, hex(C.hexLo)); img.set(b, y, hex(C.hexLo)); }
    });
    // vetas violetas en el canto: la fuerza del Resonador que la sostiene
    img.set(4, top + 7, hex(vein)); img.set(10, top + 7, hex(vein)); img.set(7, top + 8, hex(vein));
    if (crack >= 1) { line(img, 8, top, 7, top + 5, C.rockDk); img.set(7, top + 3, hex(vein)); }
    if (crack >= 2) { line(img, 2, top + 2, 5, top + 4, C.rockDk); line(img, 11, top + 1, 13, top + 4, C.rockDk); }
  } else {
    // se rompe: dos pedazos que caen hacia la Sima
    box(img, 2, top + 4, 6, top + 6, C.rockLo); box(img, 2, top + 4, 6, top + 4, C.rockHi);
    box(img, 9, top + 7, 13, top + 9, C.rockLo); box(img, 9, top + 7, 13, top + 7, C.rockHi);
    img.set(7, top + 10, hex(C.rock)); img.set(8, top + 2, hex(C.rock));
  }
  const out = outline(img, '#1A1512');
  // halo violeta bajo la losa (se dibuja sobre el contorno, translúcido)
  if (crack < 3) {
    for (let x = 1; x <= 14; x++) {
      for (let y = top + 9; y <= Math.min(15, top + 12); y++) {
        const d = Math.abs(x - 7.5) / 7 + (y - top - 9) / 4;
        if (d < 1) over(out, x, y, rgba(C.violetHi, Math.round((1 - d) * (60 + glow * 20))));
      }
    }
  }
  return out;
}

function stoneSheet() {
  const bobRow = [0, 1, 1, 0].map((b, f) => stoneFrame(b, 0, f).scale(2));
  const fallRow = [0, 1, 2, 3].map((c) => stoneFrame(Math.min(c, 2) * 2, c, 1).scale(2));
  return sheet([bobRow, fallRow, bobRow, fallRow], 32, 32);
}

// ───────────────────────────── Salida ─────────────────────────────

const OUTPUTS = [
  ['b19_resonador.png', resonatorSheet],
  ['b19_aguja.png', needleSheet],
  ['b19_estandarte.png', bannerSheet],
  ['b19_tablilla.png', plateSheet],
  ['b19_taller.png', tallerSheet],
  ['b19_piedra.png', stoneSheet],
];

for (const [name, make] of OUTPUTS) {
  const img = make();
  console.log(img.save(path.join(OUT, name)));
  if (process.argv.includes('--preview')) preview(img, { scale: 3 }).save(path.join(PREVIEW, `preview_${name}`));
}
