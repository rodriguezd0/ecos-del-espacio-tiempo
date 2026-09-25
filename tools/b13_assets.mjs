// Arte propio del Bloque 13 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b13_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime) dibujadas a escala nativa de
// DS y ampliadas ×2 (los frames anclan abajo-centro en la casilla del evento):
//   b13_barca.png       96×64  barca de Alerce (2 amarrada, balanceo · 4 motor en marcha)
//   b13_tanque.png      96×96  tanque de presión «Muestra Z-4» (2 lleno, núcleo que late · 4 abriéndose · 6 vacío)
//   b13_pantalla.png    96×64  pantalla mural (2 apagada · 4 ruido · 6 señal magenta)
//   b13_cultivo.png     32×64  tanque de cultivo con Solosis (fila = variante de color; burbujas)
//   b13_foto.png        32×32  foto enmarcada en la pared (2)
//   b13_tablilla.png    32×32  Tablilla en el suelo con brillo (2 Duende rosa · 4 Llama roja)
//   b13_piedra_baile.png 32×32 piedra del corro (2 apagada · 4 encendida · 6 guía que late)
//   b13_farolillo.png   32×64  farolillo de papel en su poste (2 apagado · 4 encendido)
//   b13_roca_luna.png   96×96  peña con una luna grabada ante la gruta (2 cerrada · 4 la luna brilla · 6 abierta)
//   b13_obsidiana.png   32×32  bloque de obsidiana (se empuja)
//   b13_respiradero.png 32×32  respiradero (2 taponado · 4 humea · 6 reabierto, con brillo)
//   b13_colada.png      32×32  colada (2 lava corriente · 4 costra fría · 6 boca/fuente · 8 costra con grietas)
//   b13_sonda.png       64×96  sonda de perforación de Genesis (2 en marcha · 4 parada)
//   b13_fragua.png      96×64  fragua de piedra (2 fría · 4 encendida)
//   b13_compuerta.png   32×32  compuerta de seguridad (2 cerrada · 4 recogida)
//   b13_pilote.png      32×32  pilote de hormigón que asoma en el agua (espuma)
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const G = { petrol: '#1F4E5A', petrolHi: '#2F6F7E', petrolLo: '#153740', white: '#F2F4F5', grey: '#C9CED2', coal: '#2B2D31', coalHi: '#44474D', magenta: '#B03A8C', magentaHi: '#E266B8' };
const Z = { green: '#7FD04A', greenHi: '#C8FF8A', greenLo: '#3E7A2A', core: '#E8FFD0' };
const LINE = '#101418';

const c = (color, a = 255) => { const v = hex(color); return [v[0], v[1], v[2], a]; };
function over(img, x, y, col) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = col[3] / 255;
  if (a === 0) { img.set(x, y, col); return; }
  img.set(x, y, [Math.round(r * (1 - t) + col[0] * t), Math.round(g * (1 - t) + col[1] * t), Math.round(b * (1 - t) + col[2] * t), Math.max(a, col[3])]);
}
const box = (img, x0, y0, x1, y1, color) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, typeof color === 'string' ? hex(color) : color); };
const blend = (img, x0, y0, x1, y1, col) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) over(img, x, y, col); };
function ellipse(img, cx, cy, rx, ry, color, { fill = true, blendIt = false } = {}) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (fill ? d <= 1 : Math.abs(d - 1) < 0.25) {
        if (blendIt) over(img, x, y, typeof color === 'string' ? c(color) : color);
        else img.set(x, y, typeof color === 'string' ? hex(color) : color);
      }
    }
  }
}
function line(img, x0, y0, x1, y1, color) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) img.set(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), hex(color));
}
const shadow = (img, cx, y, rx) => { for (let x = cx - rx; x <= cx + rx; x++) over(img, x, y, [0, 0, 0, 70]); };
const same4 = (f) => [f, f, f, f];
const S2 = (f) => f.scale(2);

// ───────────────────────────── Barca ─────────────────────────────
function boatFrame(bob, motor) {
  const img = new Img(48, 32);
  const y0 = 16 + bob;
  // espuma alrededor del casco
  for (let x = 6; x <= 42; x++) over(img, x, y0 + 12, c('#E8F6FF', 150));
  ellipse(img, 24, y0 + 6, 20, 6, '#F2F4F5');
  ellipse(img, 24, y0 + 7, 19, 5, '#D8DEE4');
  box(img, 6, y0 + 4, 42, y0 + 6, '#E8EBEE');
  box(img, 8, y0 + 7, 40, y0 + 8, '#2F6F7E'); // franja
  box(img, 18, y0 - 4, 30, y0 + 3, '#C9CED2'); // cabina
  box(img, 20, y0 - 3, 28, y0 - 1, '#6FA8C8'); // cristal
  box(img, 40, y0 - 1, 44, y0 + 5, '#44474D'); // motor fueraborda
  if (motor) for (let i = 0; i < 4; i++) over(img, 45 + (i % 2), y0 + 8 + i, c('#FFFFFF', 160));
  return outline(img, LINE);
}
function boatSheet() {
  const moored = [0, 1, 0, 1].map((b) => S2(boatFrame(b, false)));
  const running = [0, 1, 0, 1].map((b) => S2(boatFrame(b, true)));
  return sheet([moored, running, moored, running], 96, 64);
}

// ───────────────────────────── Tanque de presión ─────────────────────────────
function tankFrame(state, f) {
  const img = new Img(48, 48);
  shadow(img, 24, 46, 16);
  box(img, 8, 40, 40, 45, G.coal); // peana
  box(img, 8, 40, 40, 40, G.coalHi);
  box(img, 10, 6, 38, 39, G.petrol); // cuerpo
  box(img, 10, 6, 38, 8, G.petrolHi);
  if (state !== 'empty') {
    box(img, 14, 10, 34, 36, state === 'open' ? '#5A8C7A' : '#2E8C6A'); // líquido verde
    const pulse = [0, 1, 2, 1][f];
    ellipse(img, 24, 24, 5 + pulse, 5 + pulse, Z.greenLo);
    ellipse(img, 24, 24, 4 + pulse * 0.5, 4 + pulse * 0.5, Z.green);
    ellipse(img, 24, 23, 2, 2, Z.core);
    for (let i = 0; i < 3; i++) img.set(17 + i * 7, 34 - ((f * 3 + i * 5) % 20), hex('#BFF5DA'));
  } else {
    box(img, 14, 10, 34, 36, '#0F2A2E');
    for (let x = 14; x <= 34; x++) over(img, x, 35, c(Z.green, 90));
  }
  box(img, 13, 9, 35, 9, G.grey); // marco del cristal
  box(img, 13, 37, 35, 37, G.grey);
  for (let y = 10; y <= 36; y += 1) over(img, 15, y, c('#FFFFFF', 60)); // reflejo
  if (state === 'open') { box(img, 12, 2, 36, 5, G.grey); for (let i = 0; i < 6; i++) over(img, 16 + i * 3, 1 + (f + i) % 3, c('#FFFFFF', 140)); } else box(img, 12, 3, 36, 6, G.coalHi);
  box(img, 18, 41, 30, 43, G.white); // placa
  box(img, 20, 42, 23, 42, G.magenta);
  box(img, 25, 42, 28, 42, G.coal);
  img.set(36, 12, hex(f % 2 ? G.magentaHi : G.magenta));
  return outline(img, LINE);
}
function tankSheet() {
  const row = (s) => [0, 1, 2, 3].map((f) => S2(tankFrame(s, f)));
  return sheet([row('full'), row('open'), row('empty'), row('full')], 96, 96);
}

// ───────────────────────────── Pantalla mural ─────────────────────────────
function screenFrame(mode, f) {
  const img = new Img(48, 32);
  box(img, 2, 2, 45, 27, G.coal);
  box(img, 4, 4, 43, 25, mode === 'off' ? '#0C1418' : '#10222A');
  if (mode === 'noise') for (let i = 0; i < 90; i++) { const x = 4 + ((i * 37 + f * 11) % 40); const y = 4 + ((i * 17 + f * 7) % 22); img.set(x, y, hex(i % 3 ? '#6C7C84' : '#C8D2D8')); }
  if (mode === 'signal') {
    ellipse(img, 24, 14, 6, 7, '#8A6FA0'); // cabeza
    box(img, 15, 20, 33, 25, '#E8E8EE'); // bata
    box(img, 22, 20, 26, 25, G.coal);
    box(img, 19, 12, 29, 13, G.magenta); // gafas con tinte violeta
    for (let y = 4; y <= 25; y += 2) for (let x = 4; x <= 43; x++) over(img, x, y, [0, 0, 0, 50]);
  }
  img.set(44, 26, hex(mode === 'off' ? G.coalHi : (f % 2 ? G.magentaHi : G.magenta)));
  box(img, 20, 28, 27, 30, G.coalHi); // soporte
  return outline(img, LINE);
}
function screenSheet() {
  const row = (m) => [0, 1, 2, 3].map((f) => S2(screenFrame(m, f)));
  return sheet([row('off'), row('noise'), row('signal'), row('off')], 96, 64);
}

// ───────────────────────────── Tanque de cultivo ─────────────────────────────
function vatFrame(tint, f) {
  const img = new Img(16, 32);
  shadow(img, 8, 31, 6);
  box(img, 2, 26, 13, 30, G.coal);
  box(img, 3, 4, 12, 26, tint);
  box(img, 2, 2, 13, 4, G.grey);
  for (let y = 5; y < 26; y++) over(img, 4, y, c('#FFFFFF', 70));
  // dos Solosis (esferas verdes con el núcleo)
  const o = [0, 1, 0, -1][f];
  ellipse(img, 8, 11 + o, 3, 3, '#BDF0B0');
  img.set(8, 11 + o, hex('#3E9A3A'));
  ellipse(img, 7, 20 - o, 2.5, 2.5, '#BDF0B0');
  img.set(7, 20 - o, hex('#3E9A3A'));
  img.set(10, 24 - ((f * 5) % 18), hex('#E8FFF0'));
  return outline(img, LINE);
}
function vatSheet() {
  const tints = ['#5FB7A0', '#6FC0B0', '#58A898', '#66B8A8'];
  return sheet(tints.map((t) => [0, 1, 2, 3].map((f) => S2(vatFrame(t, f)))), 32, 64);
}

// ───────────────────────────── Foto enmarcada ─────────────────────────────
function photoFrame() {
  const img = new Img(16, 16);
  box(img, 2, 2, 13, 12, '#6B4A2A');
  box(img, 3, 3, 12, 11, '#D8D0B8');
  box(img, 3, 3, 12, 6, '#9CC8D0'); // cielo y laguna
  box(img, 3, 7, 12, 8, '#7AA8B8');
  for (const x of [4, 6, 8, 10]) { box(img, x, 8, x, 10, '#3A3A3A'); img.set(x, 7, hex('#E0C0A0')); }
  img.set(8, 7, hex('#F8F8F8')); // el rostro rascado
  img.set(9, 9, hex('#3E8A3A')); // el cuaderno verde
  return outline(img, LINE);
}

// ───────────────────────────── Tablillas ─────────────────────────────
function plateFrame(color, hi, f) {
  const img = new Img(16, 16);
  shadow(img, 8, 14, 6);
  box(img, 3, 6, 12, 13, color);
  box(img, 3, 6, 12, 6, hi);
  box(img, 4, 8, 11, 8, hi);
  box(img, 4, 10, 9, 10, hi);
  if (f % 2 === 0) { img.set(7, 3, hex('#FFFFFF')); img.set(6, 4, hex('#FFFFFF')); img.set(8, 4, hex('#FFFFFF')); }
  return outline(img, LINE);
}
function plateSheet() {
  const row = (col, hi) => [0, 1, 2, 3].map((f) => S2(plateFrame(col, hi, f)));
  return sheet([row('#E890C0', '#FFD0E8'), row('#D8502A', '#FFB070'), row('#E890C0', '#FFD0E8'), row('#D8502A', '#FFB070')], 32, 32);
}

// ───────────────────────────── Piedra del corro ─────────────────────────────
function stoneFrame(mode, f) {
  const img = new Img(16, 16);
  ellipse(img, 8, 10, 6, 4, '#8A8A96');
  ellipse(img, 8, 9, 6, 3.5, '#B8B8C6');
  if (mode !== 'off') {
    const a = mode === 'guide' ? [120, 200, 255, 200][f] : 170;
    ellipse(img, 8, 9, 5, 3, [255, 190, 230, a], { blendIt: true });
    ellipse(img, 8, 9, 2, 1.5, [255, 250, 255, 230], { blendIt: true });
  }
  img.set(6, 8, hex('#D8D8E4'));
  return outline(img, '#3A3440');
}
function stoneSheet() {
  const row = (m) => [0, 1, 2, 3].map((f) => S2(stoneFrame(m, f)));
  return sheet([row('off'), row('lit'), row('guide'), row('off')], 32, 32);
}

// ───────────────────────────── Farolillo ─────────────────────────────
function lanternFrame(lit, f) {
  const img = new Img(16, 32);
  shadow(img, 8, 31, 4);
  box(img, 7, 10, 8, 30, '#5A3A22'); // poste
  box(img, 4, 8, 11, 9, '#5A3A22');
  ellipse(img, 8, 15, 4, 5, lit ? '#F05A40' : '#9A3A30');
  box(img, 5, 10, 10, 10, '#2B2020');
  box(img, 5, 20, 10, 20, '#2B2020');
  if (lit) {
    ellipse(img, 8, 15, 2.5, 3.5, [255, 220, 150, [200, 230, 210, 240][f]], { blendIt: true });
  }
  return outline(img, LINE);
}
function lanternSheet() {
  const off = same4(S2(lanternFrame(false, 0)));
  const on = [0, 1, 2, 3].map((f) => S2(lanternFrame(true, f)));
  return sheet([off, on, off, on], 32, 64);
}

// ───────────────────────────── Peña de la luna ─────────────────────────────
function moonRockFrame(mode, f) {
  const img = new Img(48, 48);
  shadow(img, 24, 47, 20);
  if (mode === 'open') {
    ellipse(img, 24, 32, 20, 16, '#5A5068');
    ellipse(img, 24, 36, 10, 11, '#120E18'); // boca de la gruta
    box(img, 14, 36, 34, 46, '#120E18');
    for (let i = 0; i < 5; i++) img.set(19 + i * 2, 38 + ((f + i) % 4), hex('#E8E0FF'));
  } else {
    ellipse(img, 24, 30, 21, 18, '#6A6078');
    ellipse(img, 22, 26, 18, 14, '#7E7490');
    const glow = mode === 'glow';
    ellipse(img, 24, 28, 7, 7, glow ? '#FFF6D0' : '#9A90AC'); // luna grabada
    ellipse(img, 27, 26, 6, 6, glow ? '#7E7490' : '#7E7490');
    if (glow) ellipse(img, 22, 29, 10, 10, [255, 240, 200, [60, 90, 120, 90][f]], { blendIt: true });
  }
  return outline(img, '#2A2432');
}
function moonRockSheet() {
  const row = (m) => [0, 1, 2, 3].map((f) => S2(moonRockFrame(m, f)));
  return sheet([row('closed'), row('glow'), row('open'), row('closed')], 96, 96);
}

// ───────────────────────────── Obsidiana, respiradero, colada ─────────────────────────────
function obsidianFrame() {
  const img = new Img(16, 16);
  shadow(img, 8, 15, 6);
  box(img, 2, 4, 13, 14, '#1A1420');
  box(img, 2, 2, 13, 5, '#3A2C48');
  line(img, 4, 7, 7, 11, '#5A4478');
  line(img, 9, 6, 11, 9, '#6A5490');
  img.set(4, 3, hex('#B8A0E0'));
  img.set(11, 3, hex('#8A70B8'));
  return outline(img, LINE);
}
function ventFrame(mode, f) {
  const img = new Img(16, 16);
  ellipse(img, 8, 10, 6, 4, '#3A2A2A');
  ellipse(img, 8, 10, 4, 2.5, mode === 'plugged' ? '#4A3A38' : '#140C0C');
  if (mode === 'plugged') { img.set(6, 9, hex('#D8602A')); img.set(10, 11, hex('#B8401A')); }
  if (mode !== 'plugged') {
    for (let i = 0; i < 3; i++) ellipse(img, 8 + [-1, 1, 0][i], 6 - ((f + i * 2) % 6), 2, 1.5, [230, 230, 230, 150 - i * 30], { blendIt: true });
  }
  if (mode === 'open') ellipse(img, 8, 10, 3, 1.5, [255, 150, 60, 160], { blendIt: true });
  return outline(img, LINE);
}
function ventSheet() {
  const row = (m) => [0, 1, 2, 3].map((f) => S2(ventFrame(m, f)));
  return sheet([row('plugged'), row('smoke'), row('open'), row('plugged')], 32, 32);
}
function crustFrame(hot, f) {
  const img = new Img(16, 16);
  box(img, 0, 0, 15, 15, '#2A2226');
  for (let i = 0; i < 12; i++) img.set((i * 7) % 16, (i * 11) % 16, hex('#3A3036'));
  if (hot) { line(img, 2, 3, 7, 8, '#E86A2A'); line(img, 7, 8, 13, 6, '#FF8A3A'); if (f % 2) img.set(7, 8, hex('#FFE0A0')); }
  else { line(img, 3, 4, 6, 7, '#463A3E'); line(img, 9, 10, 12, 12, '#463A3E'); }
  return img;
}
/** Lava corriente (casilla entera): rojo y naranja que fluyen, con burbujas amarillas. `bright` = boca o fuente. */
function moltenFrame(f, bright) {
  const img = new Img(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const w = Math.sin((x + f * 2) * 0.7 + y * 0.45) + Math.sin((y - f) * 0.9 - x * 0.3);
      const col = w > 1.1 ? '#FFD23A' : w > 0.2 ? '#FF7A1E' : w > -0.8 ? '#E0401A' : '#A8241A';
      img.set(x, y, hex(col));
    }
  }
  for (let i = 0; i < 3; i++) img.set((f * 5 + i * 6) % 16, (i * 7 + f * 3) % 16, hex('#FFF4B0'));
  if (bright) blend(img, 0, 0, 15, 15, [255, 230, 120, 70]);
  // bordes oscuros de roca fundida
  for (let i = 0; i < 16; i++) { over(img, i, 0, [60, 16, 10, 90]); over(img, i, 15, [60, 16, 10, 90]); }
  return img;
}
function crustSheet() {
  const molten = [0, 1, 2, 3].map((f) => S2(moltenFrame(f, false)));
  const cold = same4(S2(crustFrame(false, 0)));
  const source = [0, 1, 2, 3].map((f) => S2(moltenFrame(f, true)));
  const hot = [0, 1, 2, 3].map((f) => S2(crustFrame(true, f)));
  return sheet([molten, cold, source, hot], 32, 32);
}

// ───────────────────────────── Sonda de perforación ─────────────────────────────
function drillFrame(running, f) {
  const img = new Img(32, 48);
  shadow(img, 16, 46, 12);
  box(img, 6, 38, 26, 45, G.coal);
  box(img, 6, 38, 26, 38, G.coalHi);
  line(img, 8, 38, 15, 4, G.petrolHi); line(img, 24, 38, 17, 4, G.petrolHi);
  box(img, 13, 2, 19, 5, G.white);
  box(img, 15, 5, 17, 40 + (running ? f % 2 : 0), G.grey); // barrena
  box(img, 9, 30, 23, 36, G.petrol);
  box(img, 11, 32, 14, 34, G.magenta);
  img.set(21, 31, hex(running && f % 2 ? '#FF5040' : '#6A2A2A'));
  if (running) for (let i = 0; i < 3; i++) over(img, 12 + i * 4, 44 - (f + i) % 3, c('#D8C8B8', 150));
  return outline(img, LINE);
}
function drillSheet() {
  const run = [0, 1, 2, 3].map((f) => S2(drillFrame(true, f)));
  const stop = same4(S2(drillFrame(false, 0)));
  return sheet([run, stop, run, stop], 64, 96);
}

// ───────────────────────────── Fragua ─────────────────────────────
function forgeFrame(lit, f) {
  const img = new Img(48, 32);
  shadow(img, 24, 31, 20);
  box(img, 4, 12, 43, 29, '#6A5A50'); // piedra
  for (let x = 4; x <= 43; x += 6) box(img, x, 12, x, 29, '#5A4A42');
  box(img, 4, 12, 43, 13, '#8A7A6E');
  box(img, 14, 16, 33, 27, '#1A1210'); // hogar
  if (lit) {
    for (let i = 0; i < 8; i++) {
      const h = 3 + ((i * 3 + f * 5) % 6);
      box(img, 16 + i * 2, 26 - h, 17 + i * 2, 26, i % 2 ? '#FF9A3A' : '#FFD06A');
    }
    blend(img, 14, 16, 33, 27, [255, 120, 40, 60]);
  } else {
    for (let i = 0; i < 8; i++) box(img, 16 + i * 2, 24, 17 + i * 2, 26, i % 2 ? '#4A4A4A' : '#6A6A6A');
  }
  box(img, 18, 2, 29, 11, '#5A4A42'); // campana de humos
  box(img, 20, 0, 27, 2, '#4A3A34');
  return outline(img, LINE);
}
function forgeSheet() {
  const cold = same4(S2(forgeFrame(false, 0)));
  const lit = [0, 1, 2, 3].map((f) => S2(forgeFrame(true, f)));
  return sheet([cold, lit, cold, lit], 96, 64);
}

// ───────────────────────────── Compuerta y pilote ─────────────────────────────
function shutterFrame(open) {
  const img = new Img(16, 16);
  if (open) {
    box(img, 1, 12, 14, 14, G.coal);
    for (let x = 1; x <= 14; x += 3) box(img, x, 12, x, 14, '#E8C040');
    return img;
  }
  box(img, 1, 0, 14, 15, '#9AA0A8');
  for (let y = 1; y <= 14; y += 3) box(img, 1, y, 14, y, '#6A7078');
  for (let x = 1; x <= 14; x += 4) box(img, x, 13, x + 1, 15, '#E8C040');
  box(img, 1, 13, 14, 13, G.coal);
  return outline(img, LINE);
}
function shutterSheet() {
  const closed = same4(S2(shutterFrame(false)));
  const open = same4(S2(shutterFrame(true)));
  return sheet([closed, open, closed, open], 32, 32);
}
function pileFrame(f) {
  const img = new Img(16, 16);
  ellipse(img, 8, 11, 6, 3, [232, 246, 255, 120 + (f % 2) * 50], { blendIt: true });
  box(img, 5, 3, 10, 11, '#9A9EA4');
  box(img, 5, 3, 10, 4, '#C8CCD0');
  box(img, 5, 9, 10, 11, '#5E7A6E'); // algas y percebes
  return outline(img, LINE);
}
function pileSheet() {
  return sheet(same4([0, 1, 0, 1].map((f) => S2(pileFrame(f)))), 32, 32);
}

// ───────────────────────────── Principal ─────────────────────────────
const SHEETS = {
  b13_barca: boatSheet, b13_tanque: tankSheet, b13_pantalla: screenSheet, b13_cultivo: vatSheet,
  b13_foto: () => sheet(same4(same4(S2(photoFrame()))), 32, 32), b13_tablilla: plateSheet, b13_piedra_baile: stoneSheet,
  b13_farolillo: lanternSheet, b13_roca_luna: moonRockSheet, b13_obsidiana: () => sheet(same4(same4(S2(obsidianFrame()))), 32, 32),
  b13_respiradero: ventSheet, b13_colada: crustSheet, b13_sonda: drillSheet, b13_fragua: forgeSheet,
  b13_compuerta: shutterSheet, b13_pilote: pileSheet,
};

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PREVIEW, { recursive: true });
const withPreview = process.argv.includes('--preview');
for (const [name, make] of Object.entries(SHEETS)) {
  const img = make();
  img.save(path.join(OUT, `${name}.png`));
  if (withPreview) preview(img, { scale: 2 }).save(path.join(PREVIEW, `${name}.png`));
  console.log(`${name}.png ${img.w}×${img.h}`);
}
