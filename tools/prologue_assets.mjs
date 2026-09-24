// Genera el arte propio del prólogo y de la montaña del portal (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/prologue_assets.mjs [--preview]
//   game/assets/objects/aljibe.png   charset 4×4 de 160×128 (arte nativo 80×64 ×2): portal horizontal.
//        filas (dirección RMXP): 2 apagado · 4 violeta · 6 violeta intenso (Giratina) · 8 sellado verde.
//        columnas: 4 fotogramas de remolino (animación en parada).
//   game/assets/objects/ruinas.png   charset 4×4 de 64×64 (nativo 32×32 ×2), fila = variante (columnas iguales):
//        2 columna rota · 4 monolito con liquen · 6 columna entera · 8 escombros.
//   game/assets/objects/prologo_rocas.png  tira de 4 rocas flotantes del Mundo Distorsión (64×64 cada una).
// Con --preview deja ampliaciones en tools/cache/pixel/.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, mix, outline, preview } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

/** PRNG determinista (mulberry32). */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STONE = ['#B4B8B0', '#A2A69E', '#90948C', '#7C8078', '#686C66', '#555953', '#43463F'];
const MOSS = ['#7E9A5A', '#667F48', '#50673A'];
const OUTLINE = '#26282A';

const inEllipse = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
const shade = (i) => hex(STONE[Math.max(0, Math.min(STONE.length - 1, i))]);

// ───────────────────────────── Aljibe (portal horizontal) ─────────────────────────────

const AW = 80;
const AH = 64;
const CX = 40;
const CY = 29;
const RX = 36;
const RY = 21;
const IRX = 25;
const IRY = 13;
const FACE = 8; // alto de la cara frontal del brocal

/** Color del interior del aljibe según estado y fotograma. */
function voidColor(state, frame, x, y) {
  const dx = (x - CX) / IRX;
  const dy = (y - (CY + 1)) / IRY;
  const r = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx);
  const swirl = Math.sin(ang * 3 + r * 7 - frame * (Math.PI / 2));
  const level = Math.floor(((swirl + 1) / 2) * 3.99); // 0..3 (bandas)
  const depth = Math.max(0, 1 - r); // 1 en el centro
  if (state === 0) {
    const base = ['#07060C', '#0B0914', '#100C1E', '#140F26'];
    return hex(base[Math.min(3, Math.floor(depth * 2.2 + (level > 2 ? 1 : 0)))]);
  }
  if (state === 3) {
    const g = ['#0E1A10', '#1F3A1A', '#4E8A2E', '#B9FF66'];
    const k = Math.min(3, Math.floor(depth * 2 + level * 0.5));
    return hex(g[k]);
  }
  const pal = state === 1
    ? ['#12061F', '#2A0F4A', '#5B2596', '#9C5BE8', '#D6B4FF']
    : ['#2A0F4A', '#5B2596', '#9C5BE8', '#D6B4FF', '#FFFFFF'];
  const k = Math.min(4, Math.floor(depth * (state === 1 ? 2.2 : 3) + level * 0.6));
  return hex(pal[k]);
}

/** Dibuja un fotograma del aljibe (80×64 nativo). */
function drawAljibe(state, frame) {
  const img = new Img(AW, AH);
  const r = rng(1234); // mismo musgo/grietas en todos los fotogramas
  const blocks = 18;
  const blockShade = Array.from({ length: blocks }, () => Math.floor(r() * 3));
  // cara frontal del brocal (cilindro visible bajo la elipse)
  for (let x = CX - RX; x <= CX + RX; x++) {
    const t = (x - CX) / RX;
    const yb = CY + RY * Math.sqrt(Math.max(0, 1 - t * t));
    for (let k = 0; k < FACE; k++) {
      const y = Math.round(yb) + k;
      const joint = (k === 3) || ((Math.floor((x + (k > 3 ? 5 : 0)) / 10) * 10 === x + (k > 3 ? 5 : 0)));
      const lit = t < -0.3 ? 3 : t > 0.4 ? 5 : 4;
      img.set(x, y, joint ? shade(6) : shade(lit + (k > 5 ? 1 : 0)));
    }
  }
  // parte superior: brocal de bloques + interior
  for (let y = 0; y < AH; y++) {
    for (let x = 0; x < AW; x++) {
      if (!inEllipse(x, y, CX, CY, RX, RY)) continue;
      const inHole = inEllipse(x, y, CX, CY + 1, IRX, IRY);
      if (!inHole) {
        const ang = Math.atan2((y - CY) / RY, (x - CX) / RX);
        const seg = Math.floor(((ang + Math.PI) / (Math.PI * 2)) * blocks) % blocks;
        const segPos = (((ang + Math.PI) / (Math.PI * 2)) * blocks) % 1;
        const mortar = segPos < 0.07;
        // luz desde arriba-izquierda: el lado inferior-derecho más oscuro
        const light = Math.cos(ang - (-Math.PI * 0.75));
        let s = 2 + blockShade[seg] - Math.round(light * 1.4);
        const edgeOuter = !inEllipse(x, y, CX, CY, RX - 1.6, RY - 1.2);
        if (edgeOuter) s += 1;
        img.set(x, y, mortar ? shade(6) : shade(s));
        continue;
      }
      // interior: pared interior visible en el lado lejano (arriba)
      const t = (x - CX) / IRX;
      const top = CY + 1 - IRY * Math.sqrt(Math.max(0, 1 - t * t));
      const wall = y - top;
      if (wall < 5 && state !== 2) {
        const glow = state === 1 || state === 3;
        const base = [shade(5), shade(6), hex('#34373A'), hex('#26282B'), hex('#1B1C1F')][Math.max(0, Math.floor(wall))];
        const tint = glow ? (state === 3 ? '#4E8A2E' : '#5B2596') : null;
        const c = tint && wall >= 2 ? hex(mix(`#${base.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('')}`, tint, 0.35)) : base;
        img.set(x, y, c);
        continue;
      }
      img.set(x, y, voidColor(state, frame, x, y));
    }
  }
  // borde interior cercano iluminado (labio del brocal)
  for (let x = CX - IRX; x <= CX + IRX; x++) {
    const t = (x - CX) / IRX;
    const yb = Math.round(CY + 1 + IRY * Math.sqrt(Math.max(0, 1 - t * t)));
    img.set(x, yb, state === 0 ? shade(1) : hex(state === 3 ? '#B9FF66' : '#D6B4FF'));
    img.set(x, yb + 1, shade(0));
  }
  // musgo y liquen sobre el brocal
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2;
    const rr = 0.72 + r() * 0.22;
    const x = Math.round(CX + Math.cos(a) * RX * rr);
    const y = Math.round(CY + Math.sin(a) * RY * rr);
    const c = hex(MOSS[Math.floor(r() * MOSS.length)]);
    if (inEllipse(x, y, CX, CY + 1, IRX + 1, IRY + 1)) continue;
    img.set(x, y, c);
    if (r() < 0.6) img.set(x + 1, y, c);
    if (r() < 0.35) img.set(x, y + 1, hex(MOSS[2]));
  }
  // grietas
  const crack = (x0, y0, steps) => {
    let x = x0; let y = y0;
    for (let i = 0; i < steps; i++) {
      img.set(x, y, hex('#3A3D3A'));
      x += r() < 0.5 ? 1 : 0;
      y += 1;
    }
  };
  crack(CX - 22, CY + 12, 6);
  crack(CX + 17, CY - 17, 4);
  crack(CX + 29, CY + 9, 5);
  return outline(img, OUTLINE);
}

function buildAljibe() {
  const FW = AW * 2;
  const FH = AH * 2;
  const sheet = new Img(FW * 4, FH * 4);
  for (let state = 0; state < 4; state++) {
    for (let f = 0; f < 4; f++) sheet.blit(drawAljibe(state, f).scale(2), f * FW, state * FH);
  }
  return sheet;
}

// ───────────────────────────── Ruinas (charset de objetos) ─────────────────────────────

/** Fuste de columna de `h` px nativos con acanaladuras, centrado en un lienzo de 32×32. */
function drawColumn({ h, broken, seed }) {
  const img = new Img(32, 32);
  const r = rng(seed);
  const x0 = 10;
  const w = 12;
  const baseY = 30;
  // basa
  for (let x = x0 - 2; x < x0 + w + 2; x++) for (let y = baseY - 3; y <= baseY; y++) img.set(x, y, shade(y === baseY - 3 ? 1 : 3));
  const topY = baseY - 3 - h;
  for (let y = topY; y < baseY - 3; y++) {
    for (let x = x0; x < x0 + w; x++) {
      const k = x - x0;
      let s = k < 3 ? 1 : k < 7 ? 2 : k < 10 ? 3 : 4;
      if (k === 2 || k === 6 || k === 9) s += 1; // acanaladuras
      img.set(x, y, shade(s));
    }
  }
  if (broken) {
    // corte irregular en la parte superior
    for (let x = x0; x < x0 + w; x++) {
      const cut = Math.floor(r() * 4);
      for (let y = topY; y < topY + cut; y++) img.set(x, y, [0, 0, 0, 0]);
      img.set(x, topY + cut, shade(0));
    }
  } else {
    // capitel
    for (let x = x0 - 2; x < x0 + w + 2; x++) for (let y = topY - 3; y < topY; y++) img.set(x, y, shade(y === topY - 3 ? 0 : 2));
  }
  for (let i = 0; i < 9; i++) {
    const x = x0 + Math.floor(r() * w);
    const y = topY + 2 + Math.floor(r() * (h - 2));
    img.set(x, y, hex(MOSS[Math.floor(r() * 3)]));
  }
  return outline(img, OUTLINE);
}

function drawMonolith(seed) {
  const img = new Img(32, 32);
  const r = rng(seed);
  // losa irregular: cima inclinada y cantos desconchados (nada de lápida redondeada)
  const x0 = 9;
  const x1 = 23;
  for (let x = x0; x < x1; x++) {
    const top = Math.round(3 + (x - x0) * 0.55 + (r() < 0.3 ? 1 : 0));
    const chipL = x === x0 ? 2 : 0;
    const chipR = x === x1 - 1 ? 3 : 0;
    for (let y = top + chipL + chipR; y <= 30; y++) {
      const k = x - x0;
      const s = k < 3 ? 1 : k > 10 ? 4 : 2 + (((x * 7 + y * 3) % 5) === 0 ? 1 : 0);
      img.set(x, y, shade(y === top + chipL + chipR ? Math.max(0, s - 1) : s));
    }
  }
  // liquen
  for (let i = 0; i < 26; i++) {
    const x = 9 + Math.floor(r() * 14);
    const y = 8 + Math.floor(r() * 20);
    if (img.alpha(x, y)) img.set(x, y, hex(r() < 0.5 ? '#A7B07A' : MOSS[1]));
  }
  // marcas erosionadas (sin escritura: solo surcos)
  for (let y = 12; y < 24; y += 4) for (let x = 13; x < 19; x++) if (r() < 0.6) img.set(x, y, shade(5));
  return outline(img, OUTLINE);
}

function drawRubble(seed) {
  const img = new Img(32, 32);
  const r = rng(seed);
  const stones = [[8, 24, 6, 4], [16, 26, 7, 4], [22, 22, 5, 4], [12, 19, 5, 3], [4, 27, 4, 3], [25, 27, 4, 3]];
  for (const [sx, sy, w, h] of stones) {
    for (let y = sy; y < sy + h; y++) {
      for (let x = sx; x < sx + w; x++) img.set(x, y, shade(y === sy ? 1 : x === sx + w - 1 ? 4 : 2 + (r() < 0.2 ? 1 : 0)));
    }
  }
  for (let i = 0; i < 6; i++) img.set(6 + Math.floor(r() * 22), 20 + Math.floor(r() * 10), hex(MOSS[0]));
  return outline(img, OUTLINE);
}

function buildRuins() {
  const variants = [
    drawColumn({ h: 14, broken: true, seed: 7 }),
    drawMonolith(11),
    drawColumn({ h: 22, broken: false, seed: 3 }),
    drawRubble(5),
  ];
  const sheet = new Img(64 * 4, 64 * 4);
  variants.forEach((v, row) => {
    const big = v.scale(2);
    for (let c = 0; c < 4; c++) sheet.blit(big, c * 64, row * 64);
  });
  return sheet;
}

// ───────────────────────────── Rocas flotantes (Mundo Distorsión) ─────────────────────────────

const ROCK = ['#C88A78', '#A8665A', '#8A4E4A', '#6A3A40', '#4C2A34', '#35202A'];

function drawFloatingRock(seed, w, h) {
  const img = new Img(32, 32);
  const r = rng(seed);
  const cx = 16;
  const top = 9; // fila de la cara superior (plana, como un trozo de suelo arrancado)
  const ph1 = r() * 6;
  const ph2 = r() * 6;
  const skew = (r() - 0.5) * 5;
  const tips = [0.25 + r() * 0.2, 0.55 + r() * 0.2]; // puntas colgantes
  for (let y = top - 3; y < 32; y++) {
    const k = (y - top) / h;
    let half;
    if (y <= top + 1) half = (w / 2) * Math.sqrt(Math.max(0, 1 - ((top + 1 - y) / 4) ** 2)) + Math.sin(y + ph1) * 0.8;
    else if (k <= 1) half = (w / 2) * (1 - k) ** 1.1 + Math.sin(y * 0.9 + ph1) * 1.3 + Math.sin(y * 2.3 + ph2) * 0.7;
    else continue;
    const off = skew * Math.max(0, k);
    for (let x = Math.round(cx - half + off); x <= Math.round(cx + half + off); x++) {
      const nx = (x - cx - off) / Math.max(1, half);
      let s;
      if (y <= top + 1) s = y <= top - 2 ? 0 : 1;
      else s = 2 + Math.round((nx + 1) * 1.1) + (k > 0.6 ? 1 : 0);
      if (y > top + 1 && (x + Math.floor(y / 3)) % 5 === 0) s += 1; // estratos
      img.set(x, y, hex(ROCK[Math.max(0, Math.min(5, s))]));
    }
  }
  // puntas que cuelgan de la base
  for (const t of tips) {
    const tx = Math.round(cx - w / 2 + w * t + skew * 0.5);
    const len = 3 + Math.floor(r() * 4);
    const y0 = Math.round(top + h * 0.55);
    for (let i = 0; i < len; i++) {
      img.set(tx, y0 + i, hex(ROCK[4]));
      if (i < len - 2) img.set(tx + 1, y0 + i, hex(ROCK[5]));
    }
  }
  // borde de tierra clara en la cara superior
  for (let i = 0; i < 6; i++) img.set(cx - Math.floor(w / 3) + Math.floor(r() * (w * 0.66)), top - 1, hex('#E0A890'));
  return outline(img, '#1E1018');
}

function buildRocks() {
  const rocks = [drawFloatingRock(1, 24, 22), drawFloatingRock(2, 16, 16), drawFloatingRock(3, 28, 24), drawFloatingRock(4, 12, 12)];
  const strip = new Img(64 * rocks.length, 64);
  rocks.forEach((rk, i) => strip.blit(rk.scale(2), i * 64, 0));
  return strip;
}

// ───────────────────────────── main ─────────────────────────────

function main() {
  const wantPreview = process.argv.includes('--preview');
  const outputs = [
    ['aljibe', buildAljibe()],
    ['ruinas', buildRuins()],
    ['prologo_rocas', buildRocks()],
  ];
  for (const [name, img] of outputs) {
    const file = path.join(OUT, `${name}.png`);
    img.save(file);
    console.log(`${path.relative(ROOT, file)} (${img.w}×${img.h})`);
    if (wantPreview) {
      const pv = path.join(PREVIEW, `obj_${name}.png`);
      preview(img, { scale: name === 'aljibe' ? 1 : 2, bg: '#2E3440' }).save(pv);
      console.log(`  vista → ${path.relative(ROOT, pv)}`);
    }
  }
}

try {
  main();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
}
