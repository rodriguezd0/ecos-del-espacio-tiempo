// Arte propio del Bloque 14 — Pilar de los Ecos (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b14_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8; columna = fotograma de stepAnime), dibujadas a escala
// nativa de DS y ampliadas ×2 (salvo la Bramaluna, que se amplía ×1,5 desde el seguidor de Añil):
//   b14_caracola.png        32×64  caracola del eco (2 presente · 4 Antea · 6 primigenia · 8 resonando)
//   b14_estatua.png         32×64  estatua de Antea (figura con una caracola en los labios) sobre su peana
//   b14_estatua_caida.png   96×32  la misma estatua caída y cubierta de coral (presente)
//   b14_rueda.png           32×32  rueda de compuerta (2 abierta · 4 cerrada con cadena)
//   b14_helecho.png         32×32  2 brote que se coge · 4 tierra húmeda · 6 brote plantado · 8 mata
//   b14_helecho_gigante.png 64×64  helecho gigante de la era primigenia (fila = variante)
//   b14_raiz.png            64×96  2 raíz viva sobre el muro (Antea) · 4 raíz petrificada (presente)
//   b14_draga.png           96×96  cabezal de la draga de Genesis (2 trabajando · 4 parado · 6 cubierto de coral)
//   b14_campana.png         96×96  campana de dragado de Genesis (2 con luces · 4 abandonada)
//   b14_coral.png           32×32  2 coral rojo · 4 abanico rosa · 6 coral cerebro · 8 anémona
//   b14_caja.png            32×32  caja de reliquias (2 sellada · 4 abierta y vacía)
//   b14_puerta.png          96×64  puerta de bronce de Antea (cerrada)
//   b14_equipo.png          32×32  aletas y gafas de Fausto
//   b14_puesto.png          96×64  puesto de redes (Antea)
//   b14_haz.png             32×64  haz de luz de una salida a la superficie
//   b14_bramaluna_alfa.png  96×96  Bramaluna (seguidor de Añil ×1,5: tamaño Alfa)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');
const ANIL_FOLLOWERS = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Characters', 'Followers');

const G = { petrol: '#1F4E5A', petrolHi: '#2F6F7E', petrolLo: '#153740', white: '#F2F4F5', grey: '#C9CED2', coal: '#2B2D31', coalHi: '#44474D', magenta: '#B03A8C', magentaHi: '#E266B8' };
const STONE = { hi: '#E2DCCD', mid: '#B9B09E', dark: '#857B6B', deep: '#5E5648', out: '#2E2A24' };
const BRONZE = { hi: '#F0C878', mid: '#B8863A', dark: '#7A5220', out: '#3A2610' };
const SHELL = { hi: '#FFF6EE', light: '#F6E4D6', mid: '#E6C2AE', dark: '#B98470', deep: '#9A6250', lip: '#F4A6B0', lipDark: '#D06A7E', out: '#3A2226' };
const ECHO = '#68D8C0';
const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const px = (img, x, y, c) => img.set(x, y, hex(c));
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, hex(c)); };
/** Elipse rellena; `fn(nx, ny, d)` devuelve el color de cada píxel (nx, ny normalizados, d = distancia 0..1). */
function ellipse(img, cx, cy, rx, ry, fn) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x - cx) / rx; const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (d > 1) continue;
      const c = fn(nx, ny, d);
      if (c) img.set(x, y, typeof c === 'string' ? hex(c) : c);
    }
  }
}
function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), hex(c));
}
const shadow = (img, x0, x1, y, a = 80) => { for (let x = x0; x <= x1; x++) over(img, x, y, [0, 0, 0, a]); };
// Las sombras se aplican DESPUÉS del contorno (si no, el contorno las rodea con una línea oscura).
const pendingShadows = new WeakMap();
const shadowLater = (img, x0, x1, y, a = 80) => pendingShadows.set(img, [...(pendingShadows.get(img) || []), [x0, x1, y, a]]);
function outlined(img, color) {
  const out = outline(img, color);
  for (const [x0, x1, y, a] of pendingShadows.get(img) || []) shadow(out, x0, x1, y, a);
  return out;
}
const four = (f) => [0, 1, 2, 3].map(f);
const same4 = (img) => [img, img, img, img];

// ───────────────────────────── Caracola del eco ─────────────────────────────

/**
 * Caracola espiral (como la de un caracol de mar, unos 13×12) vista de lado, con la abertura rosada abajo a la
 * derecha y la espira marcada; centro de la vuelta en (cx, cy).
 */
function drawConch(img, cx, cy, pal) {
  // cuerpo redondeado, iluminado desde arriba a la izquierda
  ellipse(img, cx, cy, 6.4, 5.6, (nx, ny) => {
    const l = -nx * 0.6 - ny * 0.8;
    return l > 0.55 ? pal.hi : l > 0.1 ? pal.light : l > -0.45 ? pal.mid : pal.dark;
  });
  // punta de la espira (arriba a la izquierda)
  ellipse(img, cx - 3.2, cy - 5, 2.2, 1.8, (nx, ny) => (ny < 0 ? pal.light : pal.mid));
  px(img, Math.round(cx - 4.5), Math.round(cy - 6.5), pal.hi);
  // surco en espiral
  for (let t = 0.3; t < 9.4; t += 0.08) {
    const r = 0.5 + t * 0.62;
    const x = Math.round(cx - 0.6 + Math.cos(t + 2.6) * r);
    const y = Math.round(cy - 0.4 + Math.sin(t + 2.6) * r * 0.88);
    if (Math.hypot((x - cx) / 6.4, (y - cy) / 5.6) < 0.98) px(img, x, y, pal.deep);
  }
  // abertura: labio rosado que se abre hacia abajo a la derecha
  ellipse(img, cx + 3.8, cy + 3.4, 2.4, 1.9, (nx, ny) => (nx < -0.2 && ny < 0.1 ? pal.lipDark : pal.lip));
  px(img, Math.round(cx + 3.4), Math.round(cy + 3.4), pal.lipDark);
  // brillo nacarado
  px(img, Math.round(cx - 2), Math.round(cy - 2), '#FFFFFF');
  px(img, Math.round(cx - 3), Math.round(cy - 1), pal.hi);
}

function caracolaFrame(era, f) {
  const img = new Img(16, 32);
  const glowA = [70, 120, 170, 120][f];
  const extras = [];
  if (era === 'antea' || era === 'resonando') {
    // peana de piedra labrada con banda de bronce
    box(img, 2, 25, 13, 30, STONE.mid); box(img, 2, 25, 13, 25, STONE.hi); box(img, 13, 26, 13, 30, STONE.dark);
    box(img, 1, 30, 14, 30, STONE.dark);
    box(img, 2, 27, 13, 27, BRONZE.mid); px(img, 7, 27, BRONZE.hi); px(img, 8, 27, BRONZE.hi);
    for (const x of [4, 11]) px(img, x, 29, STONE.deep);
    drawConch(img, 7.5, 18.5, SHELL);
  } else if (era === 'presente') {
    // roca azulada del fondo, algas y coral
    ellipse(img, 7.5, 27.5, 7.4, 3.8, (nx, ny) => (ny < -0.35 ? '#5C7A8C' : nx > 0.45 ? '#2E4452' : '#3F5B6C'));
    const dull = { ...SHELL, hi: '#E8E2DA', light: '#D4CAC2', mid: '#B4A39B', dark: '#86726A', deep: '#6E5A54', lip: '#C98A92', lipDark: '#9A5A66' };
    drawConch(img, 7.5, 19.5, dull);
    extras.push([2, 16, '#D8584E'], [3, 15, '#F08A74'], [3, 16, '#D8584E'], [12, 13, '#3E8E6E'], [12, 12, '#5FB08A'],
      [1, 24, '#3E8E6E'], [1, 23, '#5FB08A'], [14, 25, '#3E8E6E'], [14, 24, '#3E8E6E'], [10, 24, '#E88AB8']);
  } else {
    // arena clara, rayas de concha viva y helechos
    ellipse(img, 7.5, 28.5, 7.6, 2.9, (nx, ny) => (ny < 0 ? '#E6CF98' : '#C9AC6E'));
    const warm = { ...SHELL, hi: '#FFF4E0', light: '#F8DDB8', mid: '#EDB98A', dark: '#C07A48', deep: '#7E4A28', lip: '#F7A8A0', lipDark: '#D06A62' };
    drawConch(img, 7.5, 21, warm);
    extras.push([0, 27, '#4E9A3A'], [1, 26, '#7CC45A'], [1, 25, '#4E9A3A'], [0, 24, '#7CC45A'], [14, 26, '#4E9A3A'],
      [15, 25, '#7CC45A'], [14, 24, '#4E9A3A'], [13, 27, '#2F6B2A']);
  }
  for (const [x, y, c] of extras) px(img, x, y, c);
  const out = outlined(img,era === 'presente' ? '#14222C' : SHELL.out);
  shadow(out, 1, 14, 31, 80);
  // halo del eco (tras el contorno, para que no lo engorde)
  const strong = era === 'resonando';
  const ring = Math.min(255, strong ? glowA + 70 : glowA);
  const halo = [[0, 17], [15, 17], [1, 12], [14, 12], [4, 9], [11, 9], [0, 22], [15, 22], [7, 8], [8, 8]];
  for (const [x, y] of halo) over(out, x, y - (strong ? f % 2 : 0), rgba(ECHO, ring));
  if (strong) for (let r = 0; r < 3; r++) for (let x = 3 + r; x <= 12 - r; x++) over(out, x, 6 - r * 2 - (f % 2), rgba(ECHO, 60 + f * 20 - r * 15));
  if (f === 2 || strong) { over(out, 5, 15, rgba('#FFFFFF', 230)); over(out, 12, 19, rgba('#FFFFFF', 170)); }
  return out;
}

function caracolaSheet() {
  return sheet(['presente', 'antea', 'primigenia', 'resonando'].map((e) => four((f) => caracolaFrame(e, f).scale(2))), 32, 64);
}

// ───────────────────────────── Estatua de Antea ─────────────────────────────

/**
 * Figura de pie con túnica que se lleva una caracola a los labios (unos 12×23), con la base de los pies en baseY.
 * Iluminada desde la izquierda.
 */
function statueBody(img, ox, baseY, pal) {
  const top = baseY - 22;
  const shade = (x, x0, x1) => (x <= x0 + 1 ? pal.hi : x >= x1 - 1 ? pal.dark : pal.mid);
  // túnica: hombros de 8 px que se abren hasta 12 en el bajo
  for (let y = top + 7; y <= baseY; y++) {
    const k = (y - (top + 7)) / (baseY - top - 7);
    const x0 = ox + 4 - Math.round(k * 2); const x1 = ox + 11 + Math.round(k * 2);
    for (let x = x0; x <= x1; x++) px(img, x, y, shade(x, x0, x1));
  }
  // pliegues verticales y cinturón
  for (const x of [ox + 6, ox + 9, ox + 11]) for (let y = top + 13; y <= baseY - 1; y++) if ((y + x) % 3) px(img, x, y, pal.dark);
  box(img, ox + 4, top + 12, ox + 11, top + 12, pal.deep);
  // cuello y cabeza con el pelo recogido en un moño
  box(img, ox + 7, top + 5, ox + 8, top + 6, pal.mid);
  ellipse(img, ox + 7.5, top + 2.8, 2.7, 2.9, (nx, ny) => (nx < -0.25 || ny < -0.45 ? pal.hi : nx > 0.45 ? pal.dark : pal.mid));
  ellipse(img, ox + 5.2, top + 1, 1.3, 1.2, () => pal.dark);
  // brazo derecho alzado hasta la boca y la caracola
  line(img, ox + 11, top + 8, ox + 12, top + 5, pal.mid);
  line(img, ox + 12, top + 8, ox + 13, top + 5, pal.dark);
  ellipse(img, ox + 12.5, top + 3.4, 2.3, 1.8, (nx, ny) => (nx < 0 && ny < 0.2 ? SHELL.light : SHELL.mid));
  px(img, ox + 14, top + 4, SHELL.lip); px(img, ox + 12, top + 3, SHELL.deep);
  // brazo izquierdo caído
  line(img, ox + 4, top + 8, ox + 3, top + 13, pal.hi);
}

function statueFrame() {
  const img = new Img(16, 32);
  // peana con ranura (se desliza)
  box(img, 1, 26, 14, 30, STONE.mid); box(img, 1, 26, 14, 26, STONE.hi); box(img, 14, 27, 14, 30, STONE.dark);
  box(img, 2, 29, 13, 29, STONE.deep);
  statueBody(img, 0, 25, STONE);
  const out = outlined(img,STONE.out);
  shadow(out, 1, 14, 31);
  return out;
}

function fallenFrame() {
  const img = new Img(48, 16);
  const pal = { hi: '#A9B4B8', mid: '#86939A', dark: '#5E6C74', deep: '#44525A', out: '#1C262C' };
  // la estatua tumbada (cabeza a la izquierda): se dibuja de pie en un lienzo y se gira 90°
  const up = new Img(16, 32);
  statueBody(up, 0, 30, pal);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 16; x++) {
    const c = up.get(x, y);
    if (c[3]) img.set(2 + y, 15 - x, c);
  }
  // grieta que la parte en dos y peana volcada
  for (let y = 2; y <= 13; y++) img.set(21, y, [0, 0, 0, 0]);
  box(img, 36, 3, 41, 12, pal.dark); box(img, 36, 3, 41, 4, pal.mid); box(img, 40, 5, 41, 12, pal.deep);
  // coral, algas y un abanico sobre la piedra
  for (const [x, y, c] of [[8, 4, '#D8584E'], [9, 3, '#F08A74'], [9, 4, '#D8584E'], [15, 5, '#E88AB8'], [16, 4, '#E88AB8'],
    [26, 4, '#D8584E'], [27, 3, '#F08A74'], [30, 11, '#3E8E6E'], [31, 12, '#3E8E6E'], [18, 11, '#5FB08A'], [12, 11, '#5FB08A'],
    [38, 3, '#E8C070'], [39, 3, '#E8C070'], [5, 11, '#3E8E6E']]) px(img, x, y, c);
  const out = outlined(img,pal.out);
  shadow(out, 2, 45, 14, 90);
  shadow(out, 3, 44, 15, 50);
  return out;
}

// ───────────────────────────── Rueda de compuerta ─────────────────────────────

function wheelFrame(closed, f) {
  const img = new Img(16, 16);
  shadowLater(img,4, 11, 15);
  box(img, 7, 9, 8, 14, BRONZE.dark); box(img, 7, 9, 7, 14, BRONZE.mid); // eje
  box(img, 5, 13, 10, 14, STONE.mid); box(img, 5, 13, 10, 13, STONE.hi);
  const c = closed ? '#8E7040' : BRONZE.mid;
  ellipse(img, 7.5, 6.5, 5.5, 5.5, (nx, ny, d) => (d > 0.62 ? c : null));
  const a = (f * Math.PI) / 8 + (closed ? 0.3 : 0);
  for (let k = 0; k < 4; k++) {
    const t = a + (k * Math.PI) / 2;
    line(img, 7.5, 6.5, Math.round(7.5 + Math.cos(t) * 4.6), Math.round(6.5 + Math.sin(t) * 4.6), BRONZE.hi);
  }
  px(img, 7, 6, BRONZE.dark); px(img, 8, 7, BRONZE.dark);
  const out = outlined(img,BRONZE.out);
  if (closed) { for (let y = 2; y <= 12; y += 2) { over(out, 13, y, rgba('#9AA0A6')); over(out, 12, y + 1, rgba('#6E747A')); } }
  else for (let k = 0; k < 3; k++) over(out, 11 + (k % 2), 12 + ((k + f) % 3), rgba('#7AC8F0', 200));
  return out;
}

// ───────────────────────────── Helechos ─────────────────────────────

const FERN = { deep: '#1F4A1E', dark: '#2F6B2A', mid: '#4E9A3A', light: '#7CC45A', hi: '#B6E07A' };

function frond(img, x0, y0, len, dirx, diry, pal, sway = 0) {
  let x = x0; let y = y0;
  for (let i = 0; i < len; i++) {
    x += dirx * (i % 2 ? 1 : 0.6) + (i === len - 1 ? sway : 0);
    y += diry;
    px(img, Math.round(x), Math.round(y), i < len * 0.4 ? pal.dark : pal.mid);
    if (i % 2 === 0 && i > 0) { px(img, Math.round(x) + 1, Math.round(y) - 1, pal.light); px(img, Math.round(x) - 1, Math.round(y) - 1, pal.light); }
  }
  px(img, Math.round(x), Math.round(y), pal.hi);
}

function fernFrame(kind, f) {
  const img = new Img(16, 16);
  const soil = () => ellipse(img, 7.5, 12, 6, 3, (nx, ny) => (ny < -0.3 ? '#6A4A2E' : nx > 0.5 ? '#3A2616' : '#4E3522'));
  if (kind === 'sprout' || kind === 'planted') {
    if (kind === 'planted') soil(); else shadowLater(img,5, 10, 14, 60);
    const base = kind === 'planted' ? 11 : 13;
    line(img, 7, base, 7, base - 6, FERN.dark);
    frond(img, 7, base - 3, 4, -1, -0.5, FERN, f % 2 ? 1 : 0);
    frond(img, 8, base - 4, 4, 1, -0.6, FERN, f % 2 ? -1 : 0);
    px(img, 7, base - 7, FERN.hi); px(img, 8, base - 7, FERN.light); // voluta
  } else if (kind === 'soil') {
    soil();
    for (const [x, y] of [[5, 11], [9, 12], [7, 13]]) px(img, x, y, '#8FB8C8'); // humedad
  } else {
    shadowLater(img,3, 12, 15, 60);
    for (const [dx, len, s] of [[-1, 6, -1], [1, 6, 1], [-0.5, 7, 0], [0.5, 7, 0]]) frond(img, 7.5, 14, len, dx, -1.4, FERN, f % 2 ? s : 0);
  }
  const out = outlined(img,'#10240E');
  if (kind === 'sprout') for (const [x, y] of [[4, 5], [11, 6], [7, 2]]) over(out, x, y, rgba(ECHO, [90, 150, 200, 150][f]));
  return out;
}

/** Fronda pinnada: raquis curvo desde (x0, y0) con ángulo `a` (radianes) y foliolos a ambos lados. */
function pinnate(img, x0, y0, a, len, bend, pal, sway) {
  let x = x0; let y = y0; let ang = a;
  for (let i = 0; i < len; i++) {
    ang += bend;
    x += Math.cos(ang); y += Math.sin(ang);
    const tipSway = i > len * 0.6 ? sway * ((i - len * 0.6) / (len * 0.4)) : 0;
    const X = Math.round(x + tipSway); const Y = Math.round(y);
    px(img, X, Y, pal.dark);
    const leaf = Math.max(1, Math.round((1 - i / len) * 3.4));
    if (i % 2) continue;
    // foliolos perpendiculares, un poco inclinados hacia la punta
    for (const side of [-1, 1]) {
      const nx = -Math.sin(ang) * side; const ny = Math.cos(ang) * side;
      for (let k = 1; k <= leaf; k++) {
        const lx = Math.round(X + nx * k + Math.cos(ang) * k * 0.4); const ly = Math.round(Y + ny * k + Math.sin(ang) * k * 0.4);
        px(img, lx, ly, k === leaf ? pal.light : pal.mid);
      }
    }
  }
  px(img, Math.round(x + sway), Math.round(y), pal.hi);
}

function bigFernFrame(v, f) {
  const img = new Img(32, 32);
  const pal = [FERN, { ...FERN, dark: '#1E6A4A', mid: '#3E9A6E', light: '#6CC49A', hi: '#A8E6C8' },
    { ...FERN, dark: '#4E6A1E', mid: '#7A9A2E', light: '#A8C44E', hi: '#D8E88A' }, FERN][v];
  const sway = [0, 1, 0, -1][f];
  // frondas de atrás (más oscuras) y de delante
  const back = { ...pal, mid: pal.dark, light: pal.mid };
  for (const [a, len, bend] of [[-2.0, 16, -0.035], [-1.15, 16, 0.035]]) pinnate(img, 15.5, 29, a, len, bend, back, sway);
  for (const [a, len, bend] of [[-2.75, 13, -0.05], [-0.4, 13, 0.05], [-2.35, 15, -0.045], [-0.8, 15, 0.045], [-1.58, 16, 0.005]]) {
    pinnate(img, 15.5, 29, a, len, bend, pal, sway);
  }
  if (v === 3) for (const [x, y] of [[10, 14], [21, 13]]) { ellipse(img, x, y, 1.7, 1.7, () => pal.light); px(img, x, y, pal.dark); } // volutas
  const out = outlined(img,'#10240E');
  shadow(out, 6, 25, 31, 70);
  return out;
}

// ───────────────────────────── Raíz ─────────────────────────────

function rootFrame(petrified) {
  const img = new Img(32, 48);
  const pal = petrified
    ? { deep: '#3E4852', dark: '#5E6A78', mid: '#7F8C99', light: '#A6B2BD', moss: '#3E8E6E' }
    : { deep: '#3A2616', dark: '#5E3E24', mid: '#8E6A3E', light: '#B8925A', moss: '#5E8E3A' };
  // tronco principal serpenteante de arriba abajo
  for (let y = 0; y < 48; y++) {
    const cx = 15 + Math.round(Math.sin(y / 6) * 2.2);
    const half = 3 + (y > 38 ? Math.floor((y - 38) / 3) : 0);
    for (let x = cx - half; x <= cx + half; x++) px(img, x, y, x === cx - half ? pal.light : x >= cx + half - 1 ? pal.dark : pal.mid);
    if (y % 5 === 0) px(img, cx, y, pal.dark);
  }
  // raicillas que se agarran al muro
  for (const [y, dir, len] of [[6, -1, 8], [13, 1, 9], [21, -1, 10], [28, 1, 8], [35, -1, 9], [41, 1, 11], [45, -1, 12]]) {
    const cx = 15 + Math.round(Math.sin(y / 6) * 2.2);
    for (let i = 1; i <= len; i++) {
      const x = cx + dir * (3 + i);
      const yy = y + Math.round(i / 3);
      px(img, x, yy, i < len - 2 ? pal.mid : pal.dark);
      px(img, x, yy + 1, pal.deep);
    }
  }
  // musgo / algas
  for (const [x, y] of [[13, 4], [18, 17], [12, 26], [19, 33], [14, 44], [21, 40]]) { px(img, x, y, pal.moss); px(img, x + 1, y, pal.moss); }
  return outlined(img,petrified ? '#1C242C' : '#20140A');
}

// ───────────────────────────── Draga de Genesis ─────────────────────────────

function dredgeFrame(state, f) {
  const img = new Img(48, 48);
  const aged = state === 'aged';
  const pal = aged
    ? { frame: '#4E5A5E', frameHi: '#66747A', steel: '#3E4448', steelHi: '#5A6266', accent: '#6E4A5E', light: '#556064' }
    : { frame: G.petrol, frameHi: G.petrolHi, steel: G.coal, steelHi: G.coalHi, accent: G.magenta, light: G.white };
  shadowLater(img,4, 44, 46, 100);
  // brazo (escala) que baja desde arriba
  box(img, 20, 0, 27, 14, pal.frame); box(img, 20, 0, 21, 14, pal.frameHi);
  for (let y = 2; y <= 12; y += 4) box(img, 22, y, 25, y, pal.steel);
  line(img, 18, 0, 18, 16, '#1A1C1E'); line(img, 29, 0, 29, 16, '#1A1C1E'); // cables
  // bastidor
  box(img, 8, 14, 39, 19, pal.frame); box(img, 8, 14, 39, 15, pal.frameHi);
  box(img, 21, 16, 26, 18, pal.light);
  ellipse(img, 23.5, 17, 1.6, 1.4, () => pal.accent); // emblema
  // cortador cilíndrico con cuchillas helicoidales
  const turn = state === 'work' ? f : 0;
  for (let y = 20; y <= 42; y++) {
    for (let x = 6; x <= 41; x++) {
      const ex = (x - 23.5) / 18; const ey = (y - 31) / 11.5;
      if (ex * ex + ey * ey > 1) continue;
      const band = ((x + y * 2 + turn * 3) % 9) < 3;
      px(img, x, y, band ? pal.steelHi : pal.steel);
    }
  }
  for (let x = 8; x <= 39; x += 4) { const y = 42 - ((x + turn * 2) % 3); px(img, x, y, pal.light); px(img, x, y + 1, pal.steelHi); } // dientes
  if (state === 'work') for (let k = 0; k < 5; k++) over(img, 4 + ((k * 9 + f * 3) % 40), 44 - (k % 3), rgba('#C9B89A', 160)); // arena removida
  if (!aged) { const on = state === 'work' ? f % 2 : 0; px(img, 12, 16, on ? G.magentaHi : G.magenta); px(img, 35, 16, on ? G.magentaHi : G.magenta); }
  const out = outlined(img,'#0C1418');
  if (aged) {
    for (const [x, y, c] of [[10, 22, '#D8584E'], [11, 21, '#F08A74'], [30, 35, '#E88AB8'], [31, 34, '#E88AB8'], [18, 40, '#D8584E'], [36, 26, '#E8C070'], [24, 13, '#3E8E6E'], [25, 12, '#3E8E6E'], [9, 17, '#5FB08A'], [39, 18, '#5FB08A']]) {
      px(out, x, y, c); px(out, x + 1, y, c);
    }
    for (let x = 8; x <= 39; x += 3) over(out, x, 19, rgba('#7A4A2A', 170)); // óxido
  }
  return out;
}

// ───────────────────────────── Campana de dragado ─────────────────────────────

function bellFrame(lit, f) {
  const img = new Img(48, 48);
  // cables y torno de izado
  line(img, 14, 0, 19, 9, '#1A1C1E'); line(img, 33, 0, 28, 9, '#1A1C1E'); line(img, 24, 0, 24, 6, '#1A1C1E');
  box(img, 21, 5, 26, 8, G.coalHi); box(img, 21, 5, 26, 5, G.grey);
  // cúpula con brillo metálico
  ellipse(img, 23.5, 25, 18.5, 17, (nx, ny) => {
    if (ny > 0.5) return null;
    const l = -nx * 0.7 - ny * 0.5;
    return l > 0.55 ? '#5FA2B0' : l > 0.15 ? G.petrolHi : l > -0.35 ? G.petrol : G.petrolLo;
  });
  // remaches en dos aros
  for (const [ry, n] of [[0.35, 11], [0.72, 9]]) {
    for (let k = 0; k <= n; k++) {
      const t = Math.PI + (k / n) * Math.PI;
      px(img, Math.round(23.5 + Math.cos(t) * 18.5 * (1 - ry * 0.35)), Math.round(25 + Math.sin(t) * 17 * ry), G.grey);
    }
  }
  // franja blanca con el emblema (dos tubos cruzados sobre un círculo)
  box(img, 7, 29, 40, 32, G.white); box(img, 7, 32, 40, 32, G.grey);
  ellipse(img, 31, 30.5, 2.8, 2.4, () => G.magenta);
  line(img, 29, 29, 33, 32, G.white); line(img, 33, 29, 29, 32, G.white);
  // ojo de buey central
  ellipse(img, 20, 20, 4.6, 4.2, (nx, ny, d) => (d > 0.6 ? G.grey : lit ? (d < 0.2 ? '#FFFFFF' : f % 2 ? '#FFE9A0' : '#BFF0FF') : '#1E2A30'));
  // faldón con escotilla abierta
  box(img, 5, 33, 42, 41, G.coal); box(img, 5, 33, 42, 34, G.coalHi);
  for (let x = 8; x <= 40; x += 4) px(img, x, 37, G.grey);
  box(img, 18, 37, 29, 45, '#0C1014'); box(img, 18, 37, 29, 37, G.coalHi); box(img, 18, 37, 18, 45, G.coalHi);
  const out = outlined(img,'#0A1216');
  shadow(out, 4, 43, 46, 110);
  shadow(out, 6, 41, 47, 60);
  if (lit) {
    over(out, 24, 4, rgba(f % 2 ? G.magentaHi : G.magenta)); // piloto
    for (let k = 0; k < 4; k++) over(out, 43 - (k % 2) * 3, 28 - ((f * 3 + k * 7) % 26), rgba('#CFF6FF', 170)); // burbujas
  }
  return out;
}

// ───────────────────────────── Corales ─────────────────────────────

function coralFrame(kind, f) {
  const img = new Img(16, 16);
  shadowLater(img,3, 12, 15, 70);
  const s = [0, 1, 0, -1][f];
  if (kind === 0) { // coral rojo ramificado
    const pal = { dark: '#A83A3A', mid: '#D8584E', hi: '#F08A74' };
    const branches = [[7, 14, 7, 8], [7, 10, 4, 5], [7, 11, 11, 6], [4, 5, 3, 2], [11, 6, 12, 2], [7, 8, 8, 3]];
    for (const [x0, y0, x1, y1] of branches) line(img, x0, y0, x1 + (y1 < 5 ? s : 0), y1, pal.mid);
    for (const [x, y] of [[3, 2], [12, 2], [8, 3], [5, 5]]) px(img, x + (y < 5 ? s : 0), y, pal.hi);
    line(img, 6, 14, 8, 14, pal.dark);
  } else if (kind === 1) { // abanico rosa
    ellipse(img, 7.5 + s * 0.5, 7, 6, 6, (nx, ny) => (ny > 0.75 ? null : ((Math.round((nx + 1) * 6) + Math.round((ny + 1) * 6)) % 2 ? '#E88AB8' : '#B85A8E')));
    line(img, 7, 13, 7, 15, '#8E3E6A');
  } else if (kind === 2) { // coral cerebro
    ellipse(img, 7.5, 10, 6.5, 4.5, (nx, ny) => (Math.round(nx * 8 + Math.sin(ny * 6) * 2) % 3 === 0 ? '#B88A40' : ny < -0.3 ? '#F4D890' : '#E8C070'));
  } else { // anémona
    ellipse(img, 7.5, 12, 4, 2.5, (nx, ny) => (ny < 0 ? '#E07AA0' : '#B04A78'));
    for (let k = -3; k <= 3; k++) {
      const x0 = 7.5 + k; const sway = Math.round(Math.sin((f + k) * 1.3));
      line(img, Math.round(x0), 11, Math.round(x0 + k * 0.4 + sway), 5 + Math.abs(k), '#7FD0C8');
      px(img, Math.round(x0 + k * 0.4 + sway), 4 + Math.abs(k), '#C8F2EC');
    }
  }
  return outlined(img,'#2A0E16');
}

// ───────────────────────────── Caja, puerta, equipo, puesto, haz ─────────────────────────────

function crateFrame(open) {
  const img = new Img(16, 16);
  shadowLater(img,2, 14, 15);
  if (!open) {
    box(img, 2, 5, 13, 14, G.petrol); box(img, 2, 3, 13, 5, G.petrolHi);
    for (const x of [2, 13]) box(img, x, 3, x, 14, G.coal);
    box(img, 4, 8, 11, 11, G.white); box(img, 5, 9, 6, 10, G.magenta);
    for (const [x, y] of [[8, 9], [9, 10], [10, 9]]) px(img, x, y, G.coalHi); // «A» de Antea
  } else {
    box(img, 2, 7, 13, 14, G.petrol); box(img, 3, 7, 12, 11, G.petrolLo);
    for (const x of [2, 13]) box(img, x, 7, x, 14, G.coal);
    box(img, 4, 12, 11, 13, G.white); box(img, 1, 3, 14, 5, G.petrolHi);
  }
  return outlined(img,'#101418');
}

function gateFrame() {
  const img = new Img(48, 32);
  shadowLater(img,2, 45, 31, 90);
  box(img, 2, 2, 45, 30, BRONZE.mid);
  box(img, 2, 2, 45, 4, BRONZE.hi); box(img, 2, 28, 45, 30, BRONZE.dark);
  line(img, 23, 5, 23, 29, BRONZE.dark); line(img, 24, 5, 24, 29, BRONZE.out);
  for (let y = 7; y <= 26; y += 6) for (let x = 5; x <= 42; x += 6) { if (x === 23) continue; px(img, x, y, BRONZE.hi); px(img, x + 1, y + 1, BRONZE.dark); }
  // emblema: espiral de caracola en cada hoja
  for (const cx of [13, 34]) {
    ellipse(img, cx, 16, 5, 5, (nx, ny, d) => (d > 0.6 ? BRONZE.dark : d > 0.25 ? BRONZE.hi : BRONZE.dark));
  }
  for (const [x, y] of [[20, 17], [27, 17]]) box(img, x, y, x + 1, y + 2, '#3A2A18'); // tiradores
  return outlined(img,BRONZE.out);
}

function gearFrame() {
  const img = new Img(16, 16);
  shadowLater(img,2, 13, 14, 70);
  // aletas
  for (const [x0, c] of [[2, '#F2C84A'], [8, '#4AC8E0']]) {
    ellipse(img, x0 + 2.5, 9, 2.5, 4.5, (nx, ny) => (ny < -0.4 ? '#2B2D31' : nx < 0 ? c : '#C89A2A'));
  }
  // gafas encima
  ellipse(img, 5, 4, 2, 1.6, () => '#9FE6FF'); ellipse(img, 10, 4, 2, 1.6, () => '#9FE6FF');
  line(img, 3, 4, 12, 4, '#2B2D31'); px(img, 7, 4, '#2B2D31');
  return outlined(img,'#101418');
}

function stallFrame(f) {
  const img = new Img(48, 32);
  shadowLater(img,2, 45, 31, 80);
  // postes
  for (const x of [4, 43]) box(img, x, 8, x + 1, 29, '#6A4A2E');
  // toldo a rayas
  for (let x = 1; x <= 46; x++) for (let y = 3; y <= 9; y++) px(img, x, y, Math.floor(x / 4) % 2 ? '#F2E8D0' : '#2F9A9A');
  for (let x = 1; x <= 46; x += 2) px(img, x, 10, Math.floor(x / 4) % 2 ? '#D8CCB0' : '#1E7070');
  // mostrador y redes colgando
  box(img, 3, 20, 44, 27, '#8E6A3E'); box(img, 3, 20, 44, 21, '#B8925A');
  for (let x = 8; x <= 40; x += 2) for (let y = 11; y <= 18; y++) if ((x + y + f) % 4 === 0) px(img, x, y, '#C8B890');
  // cestas con pescado
  for (const cx of [12, 24, 36]) {
    ellipse(img, cx, 20, 3.5, 2, () => '#A07840');
    px(img, cx - 1, 18, '#8FB8D8'); px(img, cx + 1, 18, '#B0D0E8'); px(img, cx, 19, '#8FB8D8');
  }
  return outlined(img,'#2A1A0E');
}

function shaftFrame(f) {
  const img = new Img(16, 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 2; x <= 13; x++) {
      const edge = Math.min(x - 2, 13 - x);
      const a = Math.max(0, Math.min(120, edge * 22 - 10 + ((y + f * 3) % 8 < 2 ? 25 : 0))) * (0.45 + 0.55 * (y / 31));
      if (a > 0) over(img, x, y, [210, 245, 255, Math.round(a)]);
    }
  }
  for (let k = 0; k < 3; k++) over(img, 5 + k * 3, 28 - ((f * 5 + k * 9) % 24), [255, 255, 255, 200]); // burbujas
  return img;
}

// ───────────────────────────── Bramaluna Alfa (×1,5) ─────────────────────────────

function bramalunaAlfa() {
  const file = path.join(ANIL_FOLLOWERS, 'ROARINGMOON.png');
  if (!fs.existsSync(file)) throw new Error(`No se encuentra el seguidor de Añil: ${file}`);
  const src = Img.load(file);
  const out = new Img(Math.round(src.w * 1.5), Math.round(src.h * 1.5));
  for (let y = 0; y < out.h; y++) for (let x = 0; x < out.w; x++) out.set(x, y, src.get(Math.floor(x / 1.5), Math.floor(y / 1.5)));
  return out;
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const fern = (k) => four((f) => fernFrame(k, f).scale(2));
  const out = {
    caracola: save(caracolaSheet(), 'b14_caracola.png'),
    estatua: save(sheet([same4(statueFrame().scale(2)), same4(statueFrame().scale(2)), same4(statueFrame().scale(2)), same4(statueFrame().scale(2))], 32, 64), 'b14_estatua.png'),
    caida: save(sheet([0, 1, 2, 3].map(() => same4(fallenFrame().scale(2))), 96, 32), 'b14_estatua_caida.png'),
    rueda: save(sheet([four((f) => wheelFrame(false, f).scale(2)), four((f) => wheelFrame(true, f).scale(2)), four((f) => wheelFrame(false, f).scale(2)), four((f) => wheelFrame(true, f).scale(2))], 32, 32), 'b14_rueda.png'),
    helecho: save(sheet([fern('sprout'), fern('soil'), fern('planted'), fern('clump')], 32, 32), 'b14_helecho.png'),
    gigante: save(sheet([0, 1, 2, 3].map((v) => four((f) => bigFernFrame(v, f).scale(2))), 64, 64), 'b14_helecho_gigante.png'),
    raiz: save(sheet([same4(rootFrame(false).scale(2)), same4(rootFrame(true).scale(2)), same4(rootFrame(false).scale(2)), same4(rootFrame(true).scale(2))], 64, 96), 'b14_raiz.png'),
    draga: save(sheet([four((f) => dredgeFrame('work', f).scale(2)), same4(dredgeFrame('stop', 0).scale(2)), same4(dredgeFrame('aged', 0).scale(2)), four((f) => dredgeFrame('work', f).scale(2))], 96, 96), 'b14_draga.png'),
    campana: save(sheet([four((f) => bellFrame(true, f).scale(2)), same4(bellFrame(false, 0).scale(2)), four((f) => bellFrame(true, f).scale(2)), same4(bellFrame(false, 0).scale(2))], 96, 96), 'b14_campana.png'),
    coral: save(sheet([0, 1, 2, 3].map((k) => four((f) => coralFrame(k, f).scale(2))), 32, 32), 'b14_coral.png'),
    caja: save(sheet([same4(crateFrame(false).scale(2)), same4(crateFrame(true).scale(2)), same4(crateFrame(false).scale(2)), same4(crateFrame(true).scale(2))], 32, 32), 'b14_caja.png'),
    puerta: save(sheet([0, 1, 2, 3].map(() => same4(gateFrame().scale(2))), 96, 64), 'b14_puerta.png'),
    equipo: save(sheet([0, 1, 2, 3].map(() => same4(gearFrame().scale(2))), 32, 32), 'b14_equipo.png'),
    puesto: save(sheet([0, 1, 2, 3].map(() => four((f) => stallFrame(f).scale(2))), 96, 64), 'b14_puesto.png'),
    haz: save(sheet([0, 1, 2, 3].map(() => four((f) => shaftFrame(f).scale(2))), 32, 64), 'b14_haz.png'),
    bramaluna: save(bramalunaAlfa(), 'b14_bramaluna_alfa.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [k, img] of Object.entries(out)) files.push(preview(img, { scale: k === 'bramaluna' ? 1 : 2 }).save(path.join(PREVIEW, `b14_${k}.png`)));
  }
  for (const f of files) console.log(`→ ${path.relative(ROOT, f)}`);
}

build();
