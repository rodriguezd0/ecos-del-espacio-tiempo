// Arte propio del Bloque 22d (PROVISIONAL, D30) con tools/pixel.mjs: se dibuja a escala nativa DS (16 px por casilla)
// y se amplía ×2. Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime):
//   b22d_relieve.png       96×64  relieve de los mineros en la pared (2 sellado · 4 signos encendidos · 6 se agrieta)
//   b22d_marcas.png        32×32  marcas talladas en las rocas (2 pico · 4 lámpara · 6 vagoneta · 8 casco; col 1–3 brillo)
//   b22d_hielo.png         32×64  2 bloque en bruto · 4 bloque tallado · 6 talla vieja (modelo) · 8 muro de hielo (se funde)
//   b22d_trampilla.png     32×32  2 trampilla de madera · 4 abierta · 6 montacargas cerrado · 8 abierto
//   b22d_reloj.png         96×128 2 reloj parado · 4 en marcha (péndulo) · 6 sin maquinaria
//   b22d_piezas.png        32×32  2 péndulo · 4 rueda de escape · 6 pesa (col = destello)
//   b22d_puerta_acero.png  32×64  2 cerrada · 4 abriéndose (col = avance) · 6 abierta
//   b22d_sello.png         96×32  sello de los tres en el suelo (2 apagado · 4 tres luces · 6 escalera abierta)
//   b22d_sombra.png        64×32  sombras alargadas de piedra a la luz de la luna (vaivén de 4 fotogramas)
//   b22d_cierzo.png        32×64  2 puerta roja · 4 puerta verde · 6 tanque roto · 8 terminal
//   b22d_magma.png         32×32  2 losa de basalto · 4 basalto que aún brilla · 6 boca de magma (burbujea)
// Uso: node tools/b22d_assets.mjs [--preview]   (vistas previas en tools/cache/pixel/b22d_*.png)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const C = {
  ink: '#16181C', stone: '#8A8578', stoneHi: '#B3AD9E', stoneLo: '#5E5A51', stoneDk: '#3B3833',
  carve: '#2C2A26', chalk: '#E8E2CF', gold: '#F0C860', goldHi: '#FFF0B0', amber: '#E0902E',
  ice: '#BFE8F8', iceHi: '#F2FCFF', iceMd: '#86C8E6', iceLo: '#4E8FB8', iceDk: '#2C5F86',
  wood: '#7A5232', woodHi: '#A0703F', woodLo: '#4E331F', iron: '#5C6068', ironHi: '#8C929C', ironLo: '#34373D',
  brass: '#C8A040', brassHi: '#F2D478', brassLo: '#8A6A24', face: '#EDE6D2', faceLo: '#BDB4A0',
  steel: '#7E8894', steelHi: '#B8C2CE', steelLo: '#4A525C', steelDk: '#2A3038',
  red: '#E04848', redHi: '#FF9A8A', green: '#4AD070', greenHi: '#B8FFC8',
  glass: '#9ED8E8', glassDk: '#2E5864', screen: '#3AA8C8', screenHi: '#B8F0FF',
  basalt: '#34302E', basaltHi: '#524A44', magma: '#F06020', magmaHi: '#FFC050', magmaLo: '#A02810',
  rock: '#7A7070', rockHi: '#A09890', rockLo: '#4A4444', steelGlow: '#C8D8FF',
};
const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };
const put = (img, x, y, c) => { if (img.inside(x, y)) img.set(x, y, typeof c === 'string' ? hex(c) : c); };
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(img, x, y, c); };
function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) put(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), c);
}
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(img, x, y, c);
  }
}
function ring(img, cx, cy, r, c) {
  for (let a = 0; a < 48; a++) {
    const ang = (a / 48) * Math.PI * 2;
    put(img, Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r), c);
  }
}
function glow(img, cx, cy, r, c, alpha) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) over(img, x, y, rgba(c, Math.round(alpha * (1 - d / (r + 0.01)))));
    }
  }
}
const noise = (x, y, s = 1) => (((x * 73856093) ^ (y * 19349663) ^ (s * 83492791)) >>> 0) % 97;
const same4 = (f) => [f, f, f, f];
const blank = (w, h) => new Img(w, h);

// ───────────────────────────── signos de los mineros (8×8, trazo) ─────────────────────────────

const SIGNS = {
  pico: [[1, 1, 6, 1], [6, 1, 6, 2], [1, 1, 1, 2], [3, 1, 3, 7], [4, 1, 4, 7]],
  lampara: [[3, 0, 4, 0], [2, 1, 5, 1], [2, 2, 2, 5], [5, 2, 5, 5], [2, 5, 5, 5], [3, 6, 4, 6], [3, 3, 4, 3]],
  vagoneta: [[0, 2, 7, 2], [1, 3, 1, 5], [6, 3, 6, 5], [1, 5, 6, 5], [2, 6, 2, 7], [5, 6, 5, 7]],
  casco: [[2, 2, 5, 2], [1, 3, 6, 3], [1, 4, 1, 5], [6, 4, 6, 5], [0, 6, 7, 6], [3, 1, 4, 1]],
};
function drawSign(img, name, ox, oy, c) {
  for (const [x0, y0, x1, y1] of SIGNS[name]) line(img, ox + x0, oy + y0, ox + x1, oy + y1, c);
}

// ───────────────────────────── relieve de los mineros (48×32) ─────────────────────────────

function reliefFrame(mode, f) {
  const img = new Img(48, 32);
  // losa tallada en la roca: bisel, vetas y musgo en los bordes
  for (let y = 3; y <= 31; y++) {
    for (let x = 3; x <= 44; x++) {
      const edge = x === 3 || x === 44 || y === 3 || y === 31;
      let c = edge ? C.stoneDk : ((noise(x, y) % 9 === 0) ? C.stoneLo : C.stone);
      if (!edge && (y === 4 || x === 4)) c = C.stoneHi;
      put(img, x, y, c);
    }
  }
  for (let x = 6; x <= 41; x += 1) if (noise(x, 30) % 5 === 0) put(img, x, 30, '#51683A');
  // tres cartelas con los signos (vagoneta · lámpara · pico) y flechas talladas de derecha a izquierda
  const names = ['vagoneta', 'lampara', 'pico'];
  names.forEach((n, i) => {
    const ox = 8 + i * 12;
    box(img, ox - 1, 9, ox + 8, 20, C.stoneLo);
    box(img, ox, 10, ox + 7, 19, C.stone);
    let col = C.carve;
    if (mode === 'lit') col = [C.goldHi, C.gold, C.amber, C.gold][(f + i) % 4];
    drawSign(img, n, ox, 11, col);
  });
  for (const ax of [18, 30]) { line(img, ax + 2, 25, ax - 2, 25, C.carve); put(img, ax - 1, 24, C.carve); put(img, ax - 1, 26, C.carve); }
  // muescas de pico en el marco
  for (let x = 6; x <= 42; x += 4) put(img, x, 6, C.carve);
  if (mode === 'lit') glow(img, 24, 15, 20, C.gold, 40 + f * 8);
  if (mode === 'crack') {
    const n = f + 1;
    line(img, 24, 3, 22 - n, 12 + n * 3, C.ink);
    line(img, 24, 3, 27 + n, 14 + n * 3, C.ink);
    if (n > 2) { line(img, 22 - n, 12 + n * 3, 18, 31, C.ink); line(img, 27 + n, 14 + n * 3, 31, 31, C.ink); }
    glow(img, 24, 16, 8 + n * 3, C.goldHi, 50 + n * 20);
  }
  return img;
}
const reliefSheet = () => sheet([
  same4(reliefFrame('sealed', 0).scale(2)),
  [0, 1, 2, 3].map((f) => reliefFrame('lit', f).scale(2)),
  [0, 1, 2, 3].map((f) => reliefFrame('crack', f).scale(2)),
  same4(blank(96, 64)),
], 96, 64);

// ───────────────────────────── marcas en las rocas (16×16) ─────────────────────────────

function markFrame(name, f) {
  const img = new Img(16, 16);
  const lit = f > 0;
  if (lit) glow(img, 8, 8, 7, C.gold, 60 + f * 25);
  drawSign(img, name, 4, 4, lit ? [C.goldHi, C.gold, C.goldHi][f - 1] : C.chalk);
  // arañazos de alrededor (las marcas se hacían a punta de pico)
  put(img, 3, 12, C.chalk); put(img, 12, 3, C.chalk);
  return img;
}
const marksSheet = () => sheet(['pico', 'lampara', 'vagoneta', 'casco'].map((n) => [0, 1, 2, 3].map((f) => markFrame(n, f).scale(2))), 32, 32);

// ───────────────────────────── hielo (16×32) ─────────────────────────────

function iceBlock(carved, f) {
  const img = new Img(16, 32);
  for (let x = 2; x <= 13; x++) over(img, x, 31, [0, 0, 0, 70]);
  if (!carved) {
    // bloque en bruto: aristas irregulares
    const top = [18, 17, 16, 16, 15, 15, 16, 15, 15, 16, 17, 18];
    for (let i = 0; i < 12; i++) for (let y = top[i]; y <= 30; y++) put(img, 2 + i, y, y < top[i] + 2 ? C.iceHi : (i < 4 ? C.iceMd : C.ice));
    line(img, 5, 19, 7, 27, C.iceLo); line(img, 10, 18, 9, 24, C.iceMd);
    return outline(img, C.iceDk);
  }
  // tallado: cara facetada con una estrella de hielo, brilla un poco
  for (let y = 14; y <= 30; y++) for (let x = 3; x <= 12; x++) put(img, x, y, (x + y) % 2 ? C.ice : C.iceHi);
  box(img, 3, 14, 12, 15, C.iceHi);
  line(img, 7, 18, 8, 18, C.iceLo); line(img, 7, 26, 8, 26, C.iceLo);
  line(img, 4, 22, 11, 22, C.iceMd); line(img, 7, 19, 7, 25, C.iceMd); line(img, 8, 19, 8, 25, C.iceMd);
  glow(img, 8, 22, 6, C.iceHi, 40 + f * 12);
  return outline(img, C.iceDk);
}
function iceModel() {
  const img = new Img(16, 32);
  for (let x = 3; x <= 12; x++) over(img, x, 31, [0, 0, 0, 70]);
  // peana de madera
  box(img, 3, 26, 12, 30, C.wood); box(img, 3, 26, 12, 26, C.woodHi); box(img, 3, 30, 12, 30, C.woodLo);
  // figurilla vieja: una cruz de cinco luces en un bloque gastado
  box(img, 4, 14, 11, 25, C.iceMd);
  box(img, 5, 15, 10, 24, C.ice);
  const dots = [[7, 16], [5, 19], [7, 19], [9, 19], [7, 22]];
  for (const [x, y] of dots) { box(img, x, y, x + 1, y + 1, C.iceHi); }
  line(img, 5, 14, 10, 14, C.iceHi);
  return outline(img, C.iceDk);
}
function iceWall(f) {
  const img = new Img(16, 32);
  const melt = f; // 0 entero → 3 casi fundido
  const top = 2 + melt * 6;
  for (let y = top; y <= 31; y++) {
    for (let x = 0; x <= 15; x++) {
      const band = (x + Math.floor(y / 3)) % 5;
      put(img, x, y, band === 0 ? C.iceHi : band === 1 ? C.iceMd : C.ice);
    }
  }
  // silueta tallada a medias (cruz) que se ve a través del hielo
  if (melt < 3) {
    line(img, 7, top + 6, 8, top + 6, C.iceLo); line(img, 5, top + 9, 10, top + 9, C.iceLo);
    line(img, 7, top + 12, 8, top + 12, C.iceLo);
  }
  for (let x = 0; x <= 15; x += 3) put(img, x, 31, rgba(C.iceDk, 200));
  if (melt > 0) for (let i = 0; i < melt * 3; i++) put(img, (i * 5) % 16, 31 - (i % 3), rgba(C.iceHi, 180));
  return img;
}
const iceSheet = () => sheet([
  [0, 0, 0, 0].map((f) => iceBlock(false, f).scale(2)),
  [0, 1, 2, 1].map((f) => iceBlock(true, f).scale(2)),
  same4(iceModel().scale(2)),
  [0, 1, 2, 3].map((f) => iceWall(f).scale(2)),
], 32, 64);

// ───────────────────────────── trampilla y montacargas (16×16) ─────────────────────────────

function hatch(open, lift) {
  const img = new Img(16, 16);
  if (!lift) {
    box(img, 1, 1, 14, 14, open ? C.ink : C.wood);
    if (!open) {
      for (let y = 1; y <= 14; y += 4) line(img, 1, y, 14, y, C.woodLo);
      line(img, 1, 1, 14, 1, C.woodHi);
      disc(img, 11, 8, 1.5, C.iron); put(img, 11, 8, C.ink);
    } else {
      for (let y = 3; y <= 13; y += 3) line(img, 5, y, 10, y, C.woodHi); // escalera que baja
      line(img, 5, 2, 5, 14, C.woodLo); line(img, 10, 2, 10, 14, C.woodLo);
      box(img, 1, 0, 14, 1, C.woodHi);
    }
    return outline(img, C.woodLo);
  }
  box(img, 1, 1, 14, 14, open ? C.ink : C.ironLo);
  if (!open) {
    for (let x = 2; x <= 13; x += 2) line(img, x, 2, x, 13, C.iron);
    line(img, 1, 7, 14, 7, C.ironHi);
    put(img, 13, 2, C.amber);
  } else {
    box(img, 3, 3, 12, 12, '#23262B');
    line(img, 4, 4, 11, 4, C.iron); line(img, 4, 11, 11, 11, C.iron);
  }
  return outline(img, C.ink);
}
const hatchSheet = () => sheet([
  same4(hatch(false, false).scale(2)), same4(hatch(true, false).scale(2)),
  same4(hatch(false, true).scale(2)), same4(hatch(true, true).scale(2)),
], 32, 32);

// ───────────────────────────── reloj de la galería vieja (48×64) ─────────────────────────────

function clockFrame(mode, f) {
  const img = new Img(48, 64);
  // caja de madera y remate
  box(img, 12, 6, 35, 63, C.wood);
  box(img, 14, 8, 33, 61, C.woodHi);
  box(img, 10, 2, 37, 7, C.woodLo); box(img, 16, 0, 31, 2, C.woodLo);
  line(img, 12, 6, 12, 63, C.woodLo); line(img, 35, 6, 35, 63, C.woodLo);
  // esfera
  disc(img, 24, 20, 9, C.brassLo); disc(img, 24, 20, 8, C.face);
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2;
    put(img, Math.round(24 + Math.sin(a) * 7), Math.round(20 - Math.cos(a) * 7), C.ink);
  }
  const hand = (ang, len, c) => line(img, 24, 20, Math.round(24 + Math.sin(ang) * len), Math.round(20 - Math.cos(ang) * len), c);
  if (mode === 'run') {
    hand(((f * 3) / 12) * Math.PI * 2, 6, C.ink); hand((10 / 12) * Math.PI * 2, 4, C.ink);
  } else {
    hand((47 / 60) * Math.PI * 2, 6, C.ink); hand((3.8 / 12) * Math.PI * 2, 4, C.ink); // parado a las 3:47
  }
  put(img, 24, 20, C.brassHi);
  // ventana del péndulo
  box(img, 17, 32, 30, 56, mode === 'broken' ? C.ink : '#2A1E14');
  box(img, 17, 32, 30, 32, C.brassLo);
  if (mode === 'broken') {
    // sin maquinaria: huecos, un muelle suelto
    line(img, 20, 36, 26, 40, C.iron); line(img, 26, 40, 21, 44, C.iron);
    put(img, 28, 50, C.brassLo);
  } else {
    const swing = mode === 'run' ? [-4, -1, 3, 0][f] : 0;
    line(img, 24, 33, 24 + swing, 48, C.brass);
    disc(img, 24 + swing, 50, 3, C.brass); disc(img, 24 + swing, 50, 1.5, C.brassHi);
    // pesas
    box(img, 19, 38, 20, 44, C.ironHi); box(img, 28, 36, 29, 42, C.ironHi);
  }
  // placa de latón
  box(img, 18, 58, 29, 60, C.brass); line(img, 19, 59, 28, 59, C.brassLo);
  if (mode === 'run') glow(img, 24, 20, 12, C.goldHi, 30 + (f % 2) * 20);
  return outline(img, C.ink);
}
const clockSheet = () => sheet([
  same4(clockFrame('stop', 0).scale(2)),
  [0, 1, 2, 3].map((f) => clockFrame('run', f).scale(2)),
  same4(clockFrame('broken', 0).scale(2)),
  same4(blank(96, 128)),
], 96, 128);

// ───────────────────────────── piezas del reloj (16×16) ─────────────────────────────

function partFrame(kind, f) {
  const img = new Img(16, 16);
  for (let x = 3; x <= 12; x++) over(img, x, 14, [0, 0, 0, 60]);
  if (kind === 'pendulo') {
    line(img, 4, 12, 11, 5, C.brass); line(img, 4, 11, 10, 5, C.brassLo);
    disc(img, 4, 12, 2.5, C.brass); put(img, 4, 12, C.brassHi);
  } else if (kind === 'rueda') {
    disc(img, 8, 9, 4.5, C.brass); disc(img, 8, 9, 2, C.brassLo); put(img, 8, 9, C.brassHi);
    for (let t = 0; t < 8; t++) { const a = (t / 8) * Math.PI * 2; put(img, Math.round(8 + Math.cos(a) * 6), Math.round(9 + Math.sin(a) * 6), C.brassLo); }
  } else {
    box(img, 6, 5, 9, 13, C.ironHi); box(img, 6, 5, 6, 13, C.iron); put(img, 7, 4, C.iron); put(img, 8, 3, C.iron);
  }
  const out = outline(img, C.ink);
  const spark = [[12, 3], [3, 4], [13, 10], [2, 9]][f];
  put(out, spark[0], spark[1], C.goldHi);
  return out;
}
const partsSheet = () => sheet(['pendulo', 'rueda', 'pesa', 'pesa'].map((k) => [0, 1, 2, 3].map((f) => partFrame(k, f).scale(2))), 32, 32);

// ───────────────────────────── puerta de acero del Engranaje (16×32) ─────────────────────────────

function steelDoor(open) {
  const img = new Img(16, 32);
  box(img, 0, 2, 15, 31, C.steelDk);
  const gap = Math.round(open * 7);
  // dos hojas que se abren hacia los lados
  box(img, 1, 3, 7 - gap, 31, C.steel); box(img, 8 + gap, 3, 14, 31, C.steel);
  if (7 - gap >= 1) line(img, 7 - gap, 3, 7 - gap, 31, C.steelLo);
  if (8 + gap <= 14) line(img, 8 + gap, 3, 8 + gap, 31, C.steelHi);
  box(img, 0, 0, 15, 2, C.steelLo);
  if (open < 0.5) {
    // engranaje en relieve partido entre las dos hojas
    ring(img, 7.5, 14, 4, C.steelHi); disc(img, 7.5, 14, 1.5, C.steelLo);
    for (let t = 0; t < 8; t++) { const a = (t / 8) * Math.PI * 2; put(img, Math.round(7.5 + Math.cos(a) * 5.5), Math.round(14 + Math.sin(a) * 5.5), C.steelHi); }
  }
  for (const y of [6, 26]) { put(img, 2, y, C.steelHi); put(img, 13, y, C.steelHi); }
  return img;
}
const steelSheet = () => sheet([
  same4(steelDoor(0).scale(2)),
  [0.25, 0.5, 0.75, 1].map((o) => steelDoor(o).scale(2)),
  same4(steelDoor(1).scale(2)),
  same4(blank(32, 64)),
], 32, 64);

// ───────────────────────────── sello de los tres (48×16) ─────────────────────────────

function sealFrame(mode, f) {
  const img = new Img(48, 16);
  if (mode === 'open') {
    box(img, 14, 1, 33, 15, C.ink);
    for (let y = 3; y <= 14; y += 3) line(img, 16, y, 31, y, C.stoneLo);
    line(img, 14, 1, 33, 1, C.stoneHi);
    return img;
  }
  // grabado en el enlosado: un gran óvalo con tres nichos (roca · hielo · acero)
  for (let x = 2; x <= 45; x++) { over(img, x, 2, rgba(C.carve, 160)); over(img, x, 13, rgba(C.carve, 160)); }
  for (let y = 2; y <= 13; y++) { over(img, 2, y, rgba(C.carve, 160)); over(img, 45, y, rgba(C.carve, 160)); }
  const cols = mode === 'lit' ? [C.amber, C.iceHi, C.steelGlow] : [C.stoneLo, C.stoneLo, C.stoneLo];
  [9, 24, 39].forEach((cx, i) => {
    ring(img, cx, 8, 4, rgba(C.carve, 200));
    disc(img, cx, 8, 2, cols[i]);
    if (mode === 'lit') glow(img, cx, 8, 6, cols[i], 70 + ((f + i) % 3) * 30);
  });
  line(img, 13, 8, 19, 8, rgba(C.carve, 180)); line(img, 29, 8, 35, 8, rgba(C.carve, 180));
  return img;
}
const sealSheet = () => sheet([
  same4(sealFrame('dim', 0).scale(2)),
  [0, 1, 2, 3].map((f) => sealFrame('lit', f).scale(2)),
  same4(sealFrame('open', 0).scale(2)),
  same4(blank(96, 32)),
], 96, 32);

// ───────────────────────────── sombras a la luz de la luna (32×16) ─────────────────────────────

function shadowFrame(f, long = true) {
  const img = new Img(32, 16);
  const sway = [0, 1, 2, 1][f];
  const len = long ? 26 : 18;
  for (let i = 0; i < len; i++) {
    const w = Math.max(1, 4 - Math.floor(i / 7));
    const y = 12 - Math.round((i * (4 + sway)) / len);
    for (let j = -w; j <= w; j++) over(img, 3 + i, y + j, [10, 8, 30, 118 - Math.floor(i * 2)]);
  }
  return img;
}
const shadowSheet = () => sheet([
  [0, 1, 2, 3].map((f) => shadowFrame(f).scale(2)),
  [0, 1, 2, 3].map((f) => shadowFrame(f, false).scale(2)),
  [0, 1, 2, 3].map((f) => shadowFrame(f).scale(2)),
  [0, 1, 2, 3].map((f) => shadowFrame(f, false).scale(2)),
], 64, 32);

// ───────────────────────────── Instalación Cierzo (16×32) ─────────────────────────────

function labDoor(ok) {
  const img = new Img(16, 32);
  box(img, 0, 4, 15, 31, C.steelLo);
  box(img, 2, 7, 13, 31, C.steel);
  line(img, 7, 7, 7, 31, C.steelDk); line(img, 8, 7, 8, 31, C.steelHi);
  box(img, 2, 7, 13, 8, C.steelHi);
  box(img, 5, 4, 10, 5, ok ? C.green : C.red); put(img, 6, 4, ok ? C.greenHi : C.redHi);
  for (let y = 12; y <= 28; y += 8) { put(img, 3, y, C.steelDk); put(img, 12, y, C.steelDk); }
  return img;
}
function brokenTank() {
  const img = new Img(16, 32);
  for (let x = 1; x <= 14; x++) over(img, x, 31, [0, 0, 0, 80]);
  box(img, 2, 26, 13, 30, C.ironLo); box(img, 2, 4, 13, 6, C.ironLo);
  box(img, 3, 7, 12, 25, C.glassDk);
  for (let y = 8; y <= 24; y += 2) put(img, 4, y, C.glass);
  // cristal roto: esquirlas y líquido derramado
  line(img, 9, 7, 12, 13, C.glass); line(img, 9, 7, 7, 15, C.glass); box(img, 8, 16, 12, 25, C.ink);
  for (let x = 4; x <= 14; x++) if (x % 3 === 0) over(img, x + 1, 31, rgba(C.screen, 110));
  put(img, 12, 28, C.red);
  return outline(img, C.ink);
}
function terminal(f) {
  const img = new Img(16, 32);
  for (let x = 2; x <= 13; x++) over(img, x, 31, [0, 0, 0, 70]);
  box(img, 3, 20, 12, 30, C.ironLo); box(img, 3, 20, 12, 21, C.iron);
  box(img, 2, 8, 13, 19, C.steelDk);
  box(img, 3, 9, 12, 17, f % 2 ? C.screen : '#2A7A90');
  for (let y = 10; y <= 16; y += 2) line(img, 4, y, 4 + ((y + f * 3) % 7), y, C.screenHi);
  box(img, 5, 24, 10, 25, C.ink);
  return outline(img, C.ink);
}
const cierzoSheet = () => sheet([
  same4(labDoor(false).scale(2)), same4(labDoor(true).scale(2)),
  same4(brokenTank().scale(2)), [0, 1, 2, 3].map((f) => terminal(f).scale(2)),
], 32, 64);

// ───────────────────────────── magma (16×16) ─────────────────────────────

function basalt(hot, f) {
  const img = new Img(16, 16);
  box(img, 0, 0, 15, 15, C.basalt);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (noise(x, y, 3) % 11 === 0) put(img, x, y, C.basaltHi);
  // juntas hexagonales de la colada enfriada
  line(img, 0, 5, 5, 3, C.ink); line(img, 5, 3, 10, 6, C.ink); line(img, 10, 6, 15, 4, C.ink);
  line(img, 0, 12, 6, 10, C.ink); line(img, 6, 10, 11, 13, C.ink); line(img, 5, 3, 6, 10, C.ink);
  if (hot) {
    const c = [C.magma, C.magmaHi, C.magma, C.magmaLo][f];
    line(img, 1, 6, 5, 4, c); line(img, 6, 11, 10, 13, c);
  }
  return img;
}
function vent(f) {
  const img = new Img(16, 16);
  disc(img, 8, 8, 7, C.basalt); disc(img, 8, 8, 5, C.magmaLo); disc(img, 8, 8, 4, C.magma);
  const b = [[6, 7], [10, 9], [8, 5], [7, 10]][f];
  disc(img, b[0], b[1], 1.5, C.magmaHi);
  glow(img, 8, 8, 8, C.magmaHi, 60);
  return img;
}
const magmaSheet = () => sheet([
  same4(basalt(false, 0).scale(2)),
  [0, 1, 2, 3].map((f) => basalt(true, f).scale(2)),
  [0, 1, 2, 3].map((f) => vent(f).scale(2)),
  same4(blank(32, 32)),
], 32, 32);

// ───────────────────────────── salida ─────────────────────────────

const SHEETS = {
  b22d_relieve: reliefSheet, b22d_marcas: marksSheet, b22d_hielo: iceSheet, b22d_trampilla: hatchSheet,
  b22d_reloj: clockSheet, b22d_piezas: partsSheet, b22d_puerta_acero: steelSheet, b22d_sello: sealSheet,
  b22d_sombra: shadowSheet, b22d_cierzo: cierzoSheet, b22d_magma: magmaSheet,
};

function main() {
  const wantPreview = process.argv.includes('--preview');
  for (const [name, make] of Object.entries(SHEETS)) {
    const img = make();
    const file = img.save(path.join(OUT, `${name}.png`));
    console.log(`${path.relative(ROOT, file)} (${img.w}×${img.h})`);
    if (wantPreview) preview(img, { scale: 2, grid: img.w / 4 }).save(path.join(PREVIEW, `${name}.png`));
  }
}

main();
