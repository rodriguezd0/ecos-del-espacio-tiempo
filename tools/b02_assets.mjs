// Arte propio del Bloque 2 (PROVISIONAL, D30) generado con tools/pixel.mjs. Uso: node tools/b02_assets.mjs [--preview]
// Todo en game/assets/objects/ (arte nativo ×2, anclado abajo-centro como cualquier charset 4×4):
//   piedra_dintel.png       64×64 · piedra giratoria de las alcobas (Galería de los Dinteles, D08): tambor de piedra
//                           con una ranura tallada que apunta a la dirección de la fila (abajo, izq., der., arriba).
//   piedra_dintel_viva.png  64×64 · la misma con la ranura encendida en verde (latido en las 4 columnas).
//   losa_dintel.png         96×96 · losa de piedra que cierra el hueco de un dintel (3×3 casillas) con banda de
//                           hexágonos; se desliza hacia arriba al abrirse.
//   tragaluz.png            64×128 · haz de luz cálida que cae de un tragaluz (translúcido, motas que se mueven).
//   arca_zygarde.png        64×64 · Arca de Zygarde: caja hexagonal cerrada (fila abajo) y abierta con brillo verde
//                           (fila arriba).
//   banco_piedra.png        96×64 · banco de piedra con musgo (3 casillas; Arboleda de los Nombres).
//   grieta_roca.png         64×64 · grieta abierta en la pared de roca (Cámara de Geodude).
// Con --preview deja ampliaciones en tools/cache/pixel/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

// Piedra neutra (el tinte ocre del P1 lo pone el tono del mapa) y verde de Zygarde (#B9FF66).
const STONE = { hi: '#D8D2C2', top: '#BEB6A2', mid: '#9E9682', side: '#857D6B', dark: '#625B4D', o: '#34302A', moss: '#6F8A4A' };
const GREEN = { core: '#E8FFC8', lit: '#B9FF66', glow: '#7CE05A', deep: '#3E8A2E' };

// ───────────────────────────── utilidades ─────────────────────────────

const C = (c) => hex(c);

function fillEllipse(img, cx, cy, rx, ry, color, { from = -Infinity, to = Infinity } = {}) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    if (y < from || y > to) continue;
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) img.set(x, y, C(color));
    }
  }
}

function line(img, x0, y0, x1, y1, color) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), C(color));
}

function rect(img, x, y, w, h, color) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) img.set(x + i, y + j, C(color));
}

/** Contorno de 1 px alrededor de lo opaco (sin tocar lo ya pintado). */
function outlined(img, color = STONE.o) {
  const out = img.clone();
  const c = C(color);
  for (let y = 0; y < img.h; y++) {
    for (let x = 0; x < img.w; x++) {
      if (img.alpha(x, y)) continue;
      if (img.alpha(x - 1, y) || img.alpha(x + 1, y) || img.alpha(x, y - 1) || img.alpha(x, y + 1)) out.set(x, y, c);
    }
  }
  return out;
}

// ───────────────────────────── piedra giratoria ─────────────────────────────

const DRUM = { cx: 16, top: 18, rx: 10, ry: 5, band: 6 };
/** Dirección RMXP → vector unitario de la ranura sobre la cara superior. */
const DIR_VEC = { 2: [0, 1], 4: [-1, 0], 6: [1, 0], 8: [0, -1] };

function drumBase() {
  const img = new Img(32, 32);
  const { cx, top, rx, ry, band } = DRUM;
  // zócalo hexagonal bajo el tambor y sombra
  fillEllipse(img, cx, top + band + 2, rx + 2, ry - 1, '#00000055');
  fillHex(img, cx, top + band + 1, rx + 1, ry - 1, STONE.dark);
  // lateral del tambor (luz desde la izquierda)
  for (let y = top; y <= top + band; y++) {
    for (let x = cx - rx; x <= cx + rx; x++) img.set(x, y, C(x < cx - 4 ? STONE.mid : x > cx + 5 ? STONE.dark : STONE.side));
  }
  fillEllipse(img, cx, top + band, rx, ry, STONE.side, { from: top + band });
  // cara superior con un anillo tallado
  fillEllipse(img, cx, top, rx, ry, STONE.top);
  fillEllipse(img, cx - 1, top - 1, rx - 4, ry - 2, STONE.hi);
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2;
    img.set(Math.round(cx + Math.cos(t) * (rx - 3)), Math.round(top + Math.sin(t) * (ry - 1.5)), C(STONE.mid));
  }
  // musgo y vetas del lateral
  for (const [x, y] of [[cx - 9, top + 3], [cx - 8, top + 4], [cx + 7, top + 2], [cx - 3, top + 5]]) img.set(x, y, C(STONE.moss));
  for (const [x, y] of [[cx - 2, top + 2], [cx + 3, top + 4], [cx + 3, top + 5]]) img.set(x, y, C(STONE.dark));
  return outlined(img);
}

/**
 * Ranura tallada (2 px) desde el eje hasta el borde de la cara superior en la dirección `dir`, con muesca en el
 * borde y punta de flecha; hacia abajo baja además por el lateral. `lit` la rellena de verde (fase 0..3 = latido).
 */
function drumFrame(dir, lit = false, phase = 0) {
  const img = drumBase();
  const { cx, top, rx, ry, band } = DRUM;
  const [vx, vy] = DIR_VEC[dir];
  const reach = vx ? rx : ry;
  const groove = lit ? (phase % 2 ? GREEN.core : GREEN.lit) : STONE.o;
  const edge = lit ? GREEN.glow : STONE.dark;
  for (let k = 0; k <= reach; k++) {
    const x = cx + vx * k;
    const y = top + vy * k;
    img.set(x, y, C(groove));
    img.set(x + (vy ? 1 : 0), y + (vx ? 1 : 0), C(k === reach ? groove : edge)); // segundo píxel del surco
  }
  // punta de flecha 2 px antes del borde
  const ax = cx + vx * (reach - 2);
  const ay = top + vy * (reach - 2);
  for (const s of [-1, 1]) {
    img.set(ax - vx + (vy ? s * 2 : 0), ay - vy + (vx ? s * 2 : 0), C(groove));
    img.set(ax - vx * 2 + (vy ? s * 3 : 0), ay - vy * 2 + (vx ? s * 3 : 0), C(edge));
  }
  // muesca en el borde (la «ranura»)
  const nx = cx + vx * (reach + 1);
  const ny = top + vy * (reach + 1);
  img.set(nx, ny, C(lit ? GREEN.lit : STONE.o));
  if (dir === 2) for (let y = ny; y <= top + band + 2; y++) { img.set(cx, y, C(groove)); img.set(cx + 1, y, C(edge)); }
  img.set(cx, top, C(lit ? GREEN.core : STONE.o)); // eje
  if (lit) {
    const halo = phase === 1 || phase === 3 ? GREEN.lit : GREEN.deep;
    for (const [hx, hy] of [[nx + vx, ny + vy], [nx + vy, ny + vx], [nx - vy, ny - vx]]) img.set(hx, hy, C(halo));
  }
  return img.scale(2);
}

function stoneSheet(lit) {
  const rows = [2, 4, 6, 8].map((dir) => [0, 1, 2, 3].map((f) => drumFrame(dir, lit, lit ? f : 0)));
  return sheet(rows, 64, 64);
}

// ───────────────────────────── losa del dintel ─────────────────────────────

function slabFrame(f) {
  const img = new Img(48, 48);
  // cuerpo de la losa (3×3 casillas nativas de 16 px), algo más estrecha que el hueco
  rect(img, 2, 4, 44, 44, STONE.mid);
  rect(img, 2, 4, 44, 3, STONE.hi);
  rect(img, 2, 44, 44, 4, STONE.dark);
  for (let y = 8; y < 44; y += 9) line(img, 3, y, 44, y, STONE.side); // juntas de sillería
  for (const [x, y] of [[12, 8], [30, 17], [18, 26], [36, 35]]) line(img, x, y, x, y + 8, STONE.side);
  // banda de hexágonos (como la viga del dintel)
  rect(img, 2, 20, 44, 7, STONE.top);
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 10;
    for (const [dx, dy] of [[-1, -2], [0, -2], [1, -2], [-2, -1], [2, -1], [-2, 0], [2, 0], [-2, 1], [2, 1], [-1, 2], [0, 2], [1, 2]]) img.set(x + dx, 23 + dy, C(STONE.o));
    img.set(x, 23, C(i === 1 && f % 2 ? GREEN.deep : STONE.dark));
  }
  for (const [x, y] of [[5, 40], [6, 41], [40, 12], [41, 13], [39, 13]]) img.set(x, y, C(STONE.moss));
  return outlined(img).scale(2);
}

// ───────────────────────────── tragaluz ─────────────────────────────

function beamFrame(f) {
  const img = new Img(32, 64);
  // haz inclinado (entra por arriba a la derecha): más denso en el centro
  for (let y = 0; y < 60; y++) {
    const cx = 20 - Math.round(y * 0.12);
    const half = 3 + Math.round(y * 0.06);
    for (let x = cx - half; x <= cx + half; x++) {
      const edge = Math.abs(x - cx) / half;
      const a = Math.round((1 - edge * 0.7) * (y < 6 ? 30 + y * 8 : 78));
      img.set(x, y, [255, 240, 196, a]);
    }
  }
  // charco de luz en el suelo
  fillEllipse(img, 13, 59, 8, 3, '#FFF1C466');
  fillEllipse(img, 13, 59, 5, 2, '#FFF6D888');
  // motas de polvo que bajan despacio
  for (let k = 0; k < 6; k++) {
    const y = (k * 11 + f * 3) % 56;
    const x = 18 - Math.round(y * 0.12) + ((k * 5) % 5) - 2;
    img.set(x, y, [255, 252, 236, 200]);
  }
  return img.scale(2);
}

// ───────────────────────────── Arca de Zygarde ─────────────────────────────

const ARCA = { body: '#4C5A4E', face: '#617265', hi: '#8FA08F', dark: '#2E372F', o: '#1B201C', band: '#B89A5A' };

function hexPoints(cx, cy, r, ry) {
  return [[cx - r, cy], [cx - r / 2, cy - ry], [cx + r / 2, cy - ry], [cx + r, cy], [cx + r / 2, cy + ry], [cx - r / 2, cy + ry]];
}

function fillHex(img, cx, cy, r, ry, color) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    const t = Math.abs(y - cy) / ry;
    const half = r - (r / 2) * t;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) img.set(x, y, C(color));
  }
}

function arcaFrame(open, f) {
  const img = new Img(32, 32);
  const cx = 16;
  fillEllipse(img, cx, 28, 8, 2, '#00000055');
  // prisma hexagonal: lateral y tapa
  rect(img, cx - 7, 20, 15, 7, ARCA.body);
  rect(img, cx - 3, 20, 7, 7, ARCA.face);
  line(img, cx - 7, 23, cx + 7, 23, ARCA.band); // fleje de bronce
  const lidY = open ? 15 : 20;
  fillHex(img, cx, lidY, 7, 3, ARCA.hi);
  fillHex(img, cx, lidY, 4, 1.5, ARCA.face);
  const green = f % 2 ? GREEN.lit : GREEN.glow;
  if (open) {
    fillHex(img, cx, 20, 6, 2.5, ARCA.dark); // interior
    fillHex(img, cx, 20, 3, 1.2, green);
    for (const [x, y] of [[cx - 5, 12], [cx + 5, 11], [cx, 9 - (f % 2)]]) img.set(x, y, C(GREEN.core));
  } else {
    img.set(cx, lidY, C(f % 2 ? GREEN.deep : ARCA.dark)); // sello
  }
  for (const [x, y] of hexPoints(cx, lidY, 7, 3)) img.set(Math.round(x), Math.round(y), C(ARCA.dark));
  return outlined(img, ARCA.o).scale(2);
}

// ───────────────────────────── banco de piedra ─────────────────────────────

function benchFrame() {
  const img = new Img(48, 32);
  fillEllipse(img, 24, 28, 20, 2.5, '#00000044');
  // patas
  for (const x of [6, 38]) { rect(img, x, 20, 5, 8, STONE.side); rect(img, x, 20, 5, 2, STONE.mid); }
  // asiento
  rect(img, 2, 15, 44, 6, STONE.mid);
  rect(img, 2, 14, 44, 2, STONE.hi);
  rect(img, 2, 20, 44, 1, STONE.dark);
  for (const x of [14, 30]) line(img, x, 15, x, 19, STONE.side);
  for (const [x, y] of [[4, 16], [5, 17], [41, 18], [42, 17], [20, 19], [9, 25], [39, 24]]) img.set(x, y, C(STONE.moss));
  return outlined(img).scale(2);
}

// ───────────────────────────── grieta en la roca ─────────────────────────────

function crackFrame() {
  const img = new Img(32, 32);
  const dark = '#141312';
  const rim = '#4A4436';
  // grieta vertical irregular con el borde más claro
  const cols = [[15, 8], [14, 10], [14, 12], [13, 14], [13, 16], [12, 18], [12, 20], [13, 22], [13, 24], [14, 26]];
  for (const [x, y] of cols) {
    const w = 3 + ((y / 2) % 3);
    for (let j = 0; j < 2; j++) {
      rect(img, x - 1, y + j, w + 2, 1, rim);
      rect(img, x, y + j, w, 1, dark);
    }
  }
  for (const [x, y] of [[10, 27], [20, 27], [18, 28], [11, 29]]) rect(img, x, y, 2, 1, STONE.dark); // cascotes
  return img.scale(2);
}

// ───────────────────────────── salida ─────────────────────────────

function build() {
  const still = (fn) => { const f = fn(); return [f, f, f, f]; };
  const files = [];
  files.push(stoneSheet(false).save(path.join(OUT, 'piedra_dintel.png')));
  files.push(stoneSheet(true).save(path.join(OUT, 'piedra_dintel_viva.png')));
  const slab = [0, 1, 2, 3].map(slabFrame);
  files.push(sheet([slab, slab, slab, slab], 96, 96).save(path.join(OUT, 'losa_dintel.png')));
  const beam = [0, 1, 2, 3].map(beamFrame);
  files.push(sheet([beam, beam, beam, beam], 64, 128).save(path.join(OUT, 'tragaluz.png')));
  const closed = [0, 1, 2, 3].map((f) => arcaFrame(false, f));
  const open = [0, 1, 2, 3].map((f) => arcaFrame(true, f));
  files.push(sheet([closed, closed, open, open], 64, 64).save(path.join(OUT, 'arca_zygarde.png')));
  files.push(sheet([still(benchFrame), still(benchFrame), still(benchFrame), still(benchFrame)], 96, 64).save(path.join(OUT, 'banco_piedra.png')));
  files.push(sheet([still(crackFrame), still(crackFrame), still(crackFrame), still(crackFrame)], 64, 64).save(path.join(OUT, 'grieta_roca.png')));
  if (process.argv.includes('--preview')) {
    const bg = { bg: '#8C7A60' };
    files.push(preview(stoneSheet(false), { scale: 2, ...bg }).save(path.join(PREVIEW, 'piedra_dintel_x2.png')));
    files.push(preview(stoneSheet(true), { scale: 2, ...bg }).save(path.join(PREVIEW, 'piedra_dintel_viva_x2.png')));
    files.push(preview(sheet([slab], 96, 96), { scale: 2, ...bg }).save(path.join(PREVIEW, 'losa_dintel_x2.png')));
    files.push(preview(sheet([beam], 64, 128), { scale: 2, bg: '#3A3024' }).save(path.join(PREVIEW, 'tragaluz_x2.png')));
    files.push(preview(sheet([closed, open], 64, 64), { scale: 3, ...bg }).save(path.join(PREVIEW, 'arca_x3.png')));
    files.push(preview(benchFrame(), { scale: 3, bg: '#7CB870' }).save(path.join(PREVIEW, 'banco_piedra_x3.png')));
    files.push(preview(crackFrame(), { scale: 3, ...bg }).save(path.join(PREVIEW, 'grieta_x3.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

build();
