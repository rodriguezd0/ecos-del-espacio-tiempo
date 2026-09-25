// Arte propio del Bloque 12 (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b12_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime), dibujadas a escala nativa
// de DS y ampliadas ×2. Las cinco primeras son las de los tipos de evento genéricos de world/impossible/:
//   objects/ancla_poste.png        32×64   Ancla: poste de piedra (fila 2 apagado · 4 activo, brillo que late)
//   objects/ancla_veta.png, ancla_ojo.png, ancla_gota.png   32×64   Anclas del núcleo con el símbolo de cada sección
//                                           (La Cara Vuelta, La Mirada, El Sumidero): fila 2 apagada · 4 encendida
//   objects/arista_veta.png        32×32   destellos que recorren la veta violeta de una arista
//   objects/puente_mirada.png      32×32   losa espectral de La Mirada
//   objects/cascada_invertida.png  32×32   fila 2 agua que sube · 4 boca cerrada · 6 boca abierta · 8 llegada arriba
//   objects/pulsador_losa.png      32×32   fila 2 alzado · 4 hundido y encendido
//   objects/sello_brecha.png      160×160  sello de la brecha: fila 2 abierto con N3 dentro · 4 cerrándose · 6 sellado
//   objects/portal_distorsion.png  32×32   grieta-portal entre secciones del Mundo Distorsión (remolino que gira)
//   objects/b12_monte.png          32×32   explanada del prólogo: fila 2 tierra quemada · 4 piedra quemada ·
//                                           6 zarpazos del combate · 8 huellas de botas
//   objects/b12_genesis.png        32×32   fila 2 estaca de medición (cinta magenta) · 4 caja de sensores · 6 cable
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = hex(c); return [v[0], v[1], v[2], a]; };
function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const box = (img, x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) img.set(x, y, typeof c === 'string' ? hex(c) : c); };
const same4 = (f) => [f, f, f, f];
const V = { hi: '#E8D2FF', light: '#C49AF6', mid: '#9C5EE6', dark: '#5E3496', deep: '#2E1A52' };
const S = { hi: '#9E9AB8', light: '#817D9E', mid: '#67637F', dark: '#4C4863', deep: '#34304A', out: '#16121F' };
const Z = { hi: '#E4FFB8', mid: '#B9FF66', dark: '#5EA83A' }; // verde de Zygarde (N3)

// ───────────────────────────── Anclas ─────────────────────────────

function postFrame(lit, f, symbol = null) {
  const img = new Img(16, 32);
  for (let x = 3; x <= 12; x++) over(img, x, 31, [0, 0, 0, 80]); // sombra
  // cuerpo: obelisco achatado de base ancha
  const rows = [[6, 9, 8], [5, 10, 12], [4, 11, 26], [3, 12, 30]];
  for (let y = 8; y <= 30; y++) {
    const [x0, x1] = y < 12 ? [6, 9] : y < 26 ? [5, 10] : y < 29 ? [4, 11] : [3, 12];
    for (let x = x0; x <= x1; x++) {
      let c = S.mid;
      if (x === x0) c = S.light;
      if (x === x1) c = S.dark;
      if (y === 26 || y === 29) c = S.deep;
      img.set(x, y, hex(c));
    }
  }
  box(img, 6, 6, 9, 7, S.light); // remate
  img.set(7, 5, hex(S.hi)); img.set(8, 5, hex(S.hi));
  void rows;
  // anillo tallado (hexágono) a media altura
  const ring = [[7, 13], [8, 13], [6, 14], [9, 14], [6, 15], [9, 15], [6, 16], [9, 16], [7, 17], [8, 17]];
  const glow = [V.mid, V.light, V.hi, V.light][f];
  for (const [x, y] of ring) img.set(x, y, hex(lit ? glow : S.deep));
  if (lit) { img.set(7, 15, hex(Z.mid)); img.set(8, 15, hex(f % 2 ? Z.hi : Z.mid)); }
  // símbolo de sección en la base (núcleo)
  if (symbol) {
    const c = hex(lit ? V.hi : S.deep);
    const marks = {
      veta: [[5, 23], [6, 22], [7, 21], [8, 20], [9, 19], [10, 18], [7, 22], [8, 23]],
      ojo: [[6, 21], [7, 20], [8, 20], [9, 21], [6, 22], [9, 22], [7, 23], [8, 23], [7, 21], [8, 22]],
      gota: [[7, 18], [8, 18], [7, 19], [8, 19], [6, 20], [9, 20], [6, 21], [9, 21], [7, 22], [8, 22], [7, 23], [8, 23]],
    }[symbol];
    for (const [x, y] of marks) img.set(x, y, c);
  }
  let out = outline(img, S.out);
  if (lit) {
    // halo violeta que respira
    const r = [5, 6, 7, 6][f];
    for (let y = 2; y < 32; y++) {
      for (let x = 0; x < 16; x++) {
        if (out.alpha(x, y)) continue;
        const d = Math.hypot(x - 7.5, (y - 15) * 0.6);
        if (d < r + 3 && d > r - 1) over(out, x, y, [...hex(V.light).slice(0, 3), 60]);
      }
    }
  }
  return out;
}

function anchorSheet(symbol = null) {
  const off = same4(postFrame(false, 0, symbol).scale(2));
  const on = [0, 1, 2, 3].map((f) => postFrame(true, f, symbol).scale(2));
  return sheet([off, on, off, on], 32, 64);
}

// ───────────────────────────── Arista, puente, cascada, pulsador ─────────────────────────────

const VEIN = [[1, 14], [2, 13], [3, 12], [4, 12], [5, 11], [6, 10], [7, 9], [8, 8], [9, 7], [10, 6], [11, 5], [12, 4], [13, 3], [14, 2]];

function veinFrame(f) {
  const img = new Img(16, 16);
  for (let i = 0; i < VEIN.length; i++) {
    const k = (i - f * 4 + 64) % 16;
    const [x, y] = VEIN[i];
    if (k < 3) {
      img.set(x, y, rgba(k === 0 ? V.hi : V.light, 230));
      over(img, x, y - 1, rgba(V.light, 110));
      over(img, x + 1, y, rgba(V.light, 110));
    }
  }
  return img;
}

function bridgeFrame(f) {
  const img = new Img(16, 16);
  for (let y = 1; y <= 14; y++) {
    for (let x = 1; x <= 14; x++) {
      const edge = x === 1 || x === 14 || y === 1 || y === 14;
      img.set(x, y, edge ? rgba(V.hi, 220) : rgba((x + y) % 4 === 0 ? V.light : V.mid, 150));
    }
  }
  // juntas de losa
  for (let x = 2; x <= 13; x++) img.set(x, 7, rgba(V.dark, 170));
  for (let y = 2; y <= 6; y++) img.set(9, y, rgba(V.dark, 170));
  for (let y = 8; y <= 13; y++) img.set(5, y, rgba(V.dark, 170));
  // brillo que barre la losa
  const sweep = [3, 6, 9, 12][f];
  for (let y = 2; y <= 13; y++) {
    const x = sweep + Math.floor((13 - y) / 3);
    if (x >= 2 && x <= 13) img.set(x, y, rgba(V.hi, 230));
  }
  return img;
}

const WATER = { hi: '#E6F4FF', light: '#A8D4FF', mid: '#6A9CE8', dark: '#4658C0', deep: '#2E2A8A' };
function waterColumn(f) {
  const img = new Img(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 3; x <= 12; x++) {
      const k = (y + f * 4) % 8;
      let c = x === 3 || x === 12 ? WATER.dark : WATER.mid;
      if ((x === 5 || x === 9) && k < 3) c = WATER.hi;
      else if ((x === 7 || x === 11) && (k + 4) % 8 < 2) c = WATER.light;
      img.set(x, y, rgba(c, 215));
    }
  }
  return img;
}

function mouthFrame(open, f) {
  const img = new Img(16, 16);
  // brocal de piedra (semicírculo en el borde norte de la isla)
  for (let y = 4; y <= 15; y++) {
    for (let x = 1; x <= 14; x++) {
      const d = Math.hypot(x - 7.5, (y - 9) * 1.1);
      if (d > 7) continue;
      let c = d > 5.5 ? S.light : d > 4.4 ? S.dark : S.deep;
      if (y > 13) c = S.dark;
      img.set(x, y, hex(c));
    }
  }
  if (!open) {
    // losa con glifo violeta
    for (let y = 6; y <= 12; y++) for (let x = 4; x <= 11; x++) if (Math.hypot(x - 7.5, (y - 9) * 1.1) < 4.4) img.set(x, y, hex(y < 8 ? S.hi : S.mid));
    for (const [x, y] of [[6, 8], [7, 8], [8, 8], [9, 8], [7, 9], [8, 10], [6, 11], [9, 11]]) img.set(x, y, hex(V.mid));
  } else {
    // agua que brota hacia arriba
    for (let y = 0; y <= 11; y++) {
      for (let x = 4; x <= 11; x++) {
        if (y > 6 && Math.hypot(x - 7.5, (y - 9) * 1.1) > 4.4) continue;
        const k = (y + f * 3) % 6;
        img.set(x, y, rgba(k < 2 ? WATER.hi : (x + y) % 3 ? WATER.mid : WATER.light, 225));
      }
    }
  }
  return outline(img, S.out);
}

function landingFrame(f) {
  const img = new Img(16, 16);
  for (let y = 6; y <= 15; y++) for (let x = 4; x <= 11; x++) img.set(x, y, rgba((y + f * 3) % 5 < 2 ? WATER.light : WATER.mid, 210));
  const spray = [[2, 4], [13, 3], [3, 2], [12, 5], [5, 1], [10, 1]];
  for (let i = 0; i < spray.length; i++) if ((i + f) % 2 === 0) img.set(spray[i][0], spray[i][1], rgba(WATER.hi, 230));
  return img;
}

function buttonFrame(pressed, f) {
  const img = new Img(16, 16);
  const hexPts = (x, y) => Math.abs(x - 7.5) + Math.abs((y - 8.5) * 0.9) < 7 && Math.abs(y - 8.5) < 5.6;
  for (let y = 2; y <= 15; y++) {
    for (let x = 1; x <= 14; x++) {
      if (!hexPts(x, y - (pressed ? 0 : 1))) continue;
      img.set(x, y, hex(pressed ? S.dark : (y < 7 ? S.light : S.mid)));
    }
  }
  if (!pressed) for (let x = 3; x <= 12; x++) if (img.alpha(x, 14)) img.set(x, 14, hex(S.deep));
  const glyph = [[7, 6], [8, 6], [6, 7], [9, 7], [7, 8], [8, 8], [7, 9], [8, 10], [7, 11]];
  for (const [x, y] of glyph) img.set(x, y + (pressed ? 1 : 0), hex(pressed ? [V.light, V.hi, V.light, V.mid][f] : V.dark));
  return outline(img, S.out);
}

function fallSheet() {
  return sheet([
    [0, 1, 2, 3].map((f) => waterColumn(f).scale(2)),
    same4(mouthFrame(false, 0).scale(2)),
    [0, 1, 2, 3].map((f) => mouthFrame(true, f).scale(2)),
    [0, 1, 2, 3].map((f) => landingFrame(f).scale(2)),
  ], 32, 32);
}

// ───────────────────────────── Sello de la brecha ─────────────────────────────

function sealFrame(stage, f) {
  const W = 80;
  const img = new Img(W, W);
  const cx = 39.5;
  const cy = 44.5;
  for (let y = 0; y < W; y++) {
    for (let x = 0; x < W; x++) {
      const dx = x - cx;
      const dy = (y - cy) * 1.35; // en perspectiva
      const r = Math.hypot(dx, dy);
      const a = Math.atan2(dy, dx);
      if (r > 37) continue;
      if (r > 30) {
        // anillo de piedra en segmentos
        const seg = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 12);
        const gap = Math.abs(((a + Math.PI) / (Math.PI * 2)) * 12 - seg - 0.5) > 0.44;
        const broken = stage === 0 && (seg === 2 || seg === 7 || seg === 10);
        if (gap || (broken && r > 33)) continue;
        img.set(x, y, hex(r > 35 ? S.dark : r > 32 ? S.mid : S.light));
        continue;
      }
      if (stage === 2) {
        // sellado: losa hexagonal con glifos violetas en calma
        const hexR = Math.max(Math.abs(dx) * 0.87 + Math.abs(dy) * 0.5, Math.abs(dy));
        let c = hexR < 27 ? S.mid : S.dark;
        if (Math.abs(hexR - 18) < 0.8 || Math.abs(hexR - 9) < 0.8) c = [V.mid, V.light, V.mid, V.dark][(f + Math.floor(hexR)) % 4];
        if (Math.abs(dx) < 0.8 || Math.abs(dy - dx * 0.58) < 0.8 || Math.abs(dy + dx * 0.58) < 0.8) c = hexR < 27 ? V.dark : c;
        img.set(x, y, hex(c));
        continue;
      }
      // abierto / cerrándose: vórtice violeta oscuro que gira
      const spin = a + r * 0.18 - f * 0.5;
      const band = (Math.sin(spin * 3) + 1) / 2;
      let c = band > 0.7 ? V.dark : band > 0.35 ? V.deep : '#170C2C';
      if (r < 6) c = r < 3 ? Z.hi : Z.mid; // N3, fundido con el sello
      else if (r < 9) c = (f + Math.floor(a * 3)) % 2 ? Z.dark : V.dark;
      if (stage === 1) {
        // cerrándose: losas que avanzan desde el anillo
        const close = 30 - (f + 1) * 5;
        if (r > close) c = r > close + 1 ? S.mid : S.dark;
      }
      img.set(x, y, hex(c));
    }
  }
  return outline(img, S.out);
}

function sealSheet() {
  const open = [0, 1, 2, 3].map((f) => sealFrame(0, f).scale(2));
  const closing = [0, 1, 2, 3].map((f) => sealFrame(1, f).scale(2));
  const sealed = [0, 1, 2, 3].map((f) => sealFrame(2, f).scale(2));
  return sheet([open, closing, sealed, sealed], 160, 160);
}

/** Grieta-portal entre secciones: remolino violeta pequeño que gira (32×32). */
function portalFrame(f) {
  const img = new Img(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const dx = x - 7.5;
      const dy = (y - 8.5) * 1.3;
      const r = Math.hypot(dx, dy);
      if (r > 7) continue;
      const a = Math.atan2(dy, dx);
      const band = (Math.sin(a * 2 + r * 0.9 - f * 1.2) + 1) / 2;
      let c = r > 6 ? rgba(V.light, 200) : band > 0.6 ? rgba(V.mid, 230) : band > 0.3 ? rgba(V.dark, 235) : rgba(V.deep, 240);
      if (r < 1.6) c = rgba(V.hi, 255);
      img.set(x, y, c);
    }
  }
  return img;
}

// ───────────────────────────── Monte del Portal ─────────────────────────────

function scorch() {
  const img = new Img(16, 16);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const d = Math.hypot(x - 7.5, (y - 8) * 1.2) + ((x * 7 + y * 13) % 5) * 0.4;
      if (d > 7.5) continue;
      over(img, x, y, d < 3.5 ? [28, 22, 24, 220] : d < 5.5 ? [52, 40, 38, 190] : [84, 66, 54, 120]);
      if ((x * 11 + y * 5) % 17 === 0 && d < 6) img.set(x, y, [150, 140, 150, 200]); // ceniza
    }
  }
  return img;
}

function charredStone() {
  const img = new Img(16, 16);
  for (let y = 5; y <= 14; y++) {
    for (let x = 2; x <= 13; x++) {
      const d = Math.hypot(x - 7.5, (y - 10) * 1.3);
      if (d > 5.8) continue;
      img.set(x, y, hex(y < 8 ? '#4A4448' : d > 4.5 ? '#231F22' : '#35302F'));
    }
  }
  for (const [x, y] of [[5, 9], [6, 10], [7, 10], [9, 11], [10, 12]]) img.set(x, y, hex('#8A4A6E')); // brillo violáceo apagado
  for (let x = 3; x <= 12; x++) over(img, x, 15, [0, 0, 0, 80]);
  return outline(img, '#120E12');
}

function clawMarks() {
  const img = new Img(16, 16);
  for (const off of [-4, 0, 4]) {
    for (let t = 0; t < 14; t++) {
      const x = 7 + off + Math.round((t - 7) * 0.35);
      const y = 1 + t;
      img.set(x, y, [36, 26, 40, 220]);
      over(img, x + 1, y, [120, 80, 160, 110]); // brillo vidrioso violeta
    }
  }
  return img;
}

function bootPrints() {
  const img = new Img(16, 16);
  const print = (x, y) => { for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 3], [0, 3]]) img.set(x + dx, y + dy, [70, 54, 40, 170]); };
  print(4, 10); print(9, 5); print(5, 0);
  return img;
}

function monteSheet() {
  const f = (g) => same4(g().scale(2));
  return sheet([f(scorch), f(charredStone), f(clawMarks), f(bootPrints)], 32, 32);
}

const G = { petrol: '#1F4E5A', petrolHi: '#2F6F7E', white: '#F2F4F5', coal: '#2B2D31', magenta: '#B03A8C', magentaHi: '#E266B8' };
function stake() {
  const img = new Img(16, 16);
  box(img, 7, 3, 8, 14, '#8A7A60');
  box(img, 7, 3, 7, 14, '#A89878');
  box(img, 9, 4, 12, 6, G.magenta); // cinta
  img.set(12, 7, hex(G.magentaHi));
  for (let x = 5; x <= 10; x++) img.set(x, 15, [0, 0, 0, 70]);
  return outline(img, '#101418');
}
function sensorBox() {
  const img = new Img(16, 16);
  box(img, 3, 7, 12, 13, G.petrol);
  box(img, 3, 7, 12, 8, G.petrolHi);
  box(img, 5, 10, 8, 11, G.white);
  img.set(11, 9, hex(G.magentaHi));
  box(img, 7, 3, 7, 6, G.coal); // antena
  for (let x = 3; x <= 12; x++) img.set(x, 14, [0, 0, 0, 70]);
  return outline(img, '#101418');
}
function cableCoil() {
  const img = new Img(16, 16);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const d = Math.hypot(x - 7.5, (y - 10) * 1.6);
    if (d < 5.5 && d > 2.5 && Math.round(d) % 2 === 0) img.set(x, y, hex(G.coal));
  }
  for (let x = 12; x <= 15; x++) img.set(x, 11, hex(G.coal));
  return img;
}
function genesisSheet() {
  const f = (g) => same4(g().scale(2));
  return sheet([f(stake), f(sensorBox), f(cableCoil), f(stake)], 32, 32);
}

// ───────────────────────────── salida ─────────────────────────────

const OUTPUTS = {
  'ancla_poste.png': () => anchorSheet(null),
  'ancla_veta.png': () => anchorSheet('veta'),
  'ancla_ojo.png': () => anchorSheet('ojo'),
  'ancla_gota.png': () => anchorSheet('gota'),
  'arista_veta.png': () => sheet(same4([0, 1, 2, 3].map((f) => veinFrame(f).scale(2))), 32, 32),
  'puente_mirada.png': () => sheet(same4([0, 1, 2, 3].map((f) => bridgeFrame(f).scale(2))), 32, 32),
  'cascada_invertida.png': fallSheet,
  'pulsador_losa.png': () => sheet([same4(buttonFrame(false, 0).scale(2)), [0, 1, 2, 3].map((f) => buttonFrame(true, f).scale(2)), same4(buttonFrame(false, 0).scale(2)), same4(buttonFrame(true, 0).scale(2))], 32, 32),
  'sello_brecha.png': sealSheet,
  'portal_distorsion.png': () => sheet(same4([0, 1, 2, 3].map((f) => portalFrame(f).scale(2))), 32, 32),
  'b12_monte.png': monteSheet,
  'b12_genesis.png': genesisSheet,
};

const showPreview = process.argv.includes('--preview');
for (const [name, make] of Object.entries(OUTPUTS)) {
  const img = make();
  img.save(path.join(OUT, name));
  if (showPreview) preview(img, { scale: 2, bg: '#202028' }).save(path.join(PREVIEW, `b12_${name}`));
  console.log(`objects/${name} ${img.w}×${img.h}`);
}
