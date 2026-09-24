// Arte propio de la Cámara de los Contrapesos (Bloque 8, PROVISIONAL D30). Hojas de evento 4×4 (fila = dirección
// RMXP 2/4/6/8, columna = fotograma). Lo llama tools/b08_assets.mjs.
//   b08_bloque.png      32×48  bloque de basalto (columna hexagonal); fila 6 = brillo (Balanza resuelta)
//   b08_piedra.png      32×32  piedra suelta con vetas de galena; fila 6 = brillo
//   b08_placa.png       32×32  placa: fila 2 arriba · 4 hundida
//   b08_suelo.png       32×32  suelo quebradizo: fila 2 grietas (4 variantes) · 4 agujero · 6 rompiéndose (animación)
//   b08_arena.png       32×32  arena profunda: 16 variantes de borde (índice = N1 + E2 + S4 + O8 → fila·4 + columna)
//   b08_platillo.png    32×32  platillo de bronce: fila 2 nivelado · 4 abajo · 6 arriba · 8 resuelto
//   b08_balanza.png     32×32  piezas de la Balanza: columnas viga · viga extremo · cadena · gancho (fila 8 = luz)
//   b08_eje.png         96×96  eje central de la Gran Balanza: fila 2 quieto · 4 resuelto
//   b08_contrapeso.png  32×96  contrapeso colgado sobre la sima (4 fotogramas de vaivén)
//   b08_losa.png        32×32  losa del paso al núcleo: fila 2 cerrada · 4 hundiéndose · 6 casi abajo
//   b08_palanca.png     32×48  palanca: fila 2 arriba · 4 abajo
import { Img, rgba, over, px, rect, line, disc, ellipse, poly, noise, eventSheet, save } from './b08_assets_lib.mjs';

const C = {
  ink: rgba('#1C2027'),
  basalt0: rgba('#2E3440'), basalt1: rgba('#3B4252'), basalt2: rgba('#4C566A'), basalt3: rgba('#66748A'), basalt4: rgba('#8A98AD'),
  stone0: rgba('#45403A'), stone1: rgba('#6F6961'), stone2: rgba('#958E84'), stone3: rgba('#B6AFA4'), stone4: rgba('#D2CCC2'),
  galena: rgba('#8FA0B4'), galenaHi: rgba('#DDE6F0'),
  bronze0: rgba('#4A331C'), bronze1: rgba('#7C5530'), bronze2: rgba('#B8864B'), bronze3: rgba('#D9A764'), bronze4: rgba('#F2D08E'),
  iron0: rgba('#23262C'), iron1: rgba('#3E444E'), iron2: rgba('#5C6572'), iron3: rgba('#8C95A3'),
  sand0: rgba('#8C7652'), sand1: rgba('#B09A70'), sand2: rgba('#C8B48A'), sand3: rgba('#DCCBA5'),
  glow: rgba('#EAF6FF', 170), green: rgba('#9CF26A', 200), shadow: rgba('#000000', 90),
};

// ───────────────────────────── Bloque y piedra ─────────────────────────────

function blockFrame(lit = false) {
  const img = new Img(16, 24);
  // cuerpo (caras laterales de la columna)
  poly(img, [[1, 7], [4, 10], [11, 10], [14, 7], [14, 20], [11, 23], [4, 23], [1, 20]], C.basalt1);
  poly(img, [[4, 10], [11, 10], [11, 23], [4, 23]], C.basalt2);
  poly(img, [[11, 10], [14, 7], [14, 20], [11, 23]], C.basalt0);
  // aristas verticales
  line(img, 4, 10, 4, 22, C.basalt3);
  line(img, 11, 10, 11, 22, C.basalt1);
  // cara superior hexagonal
  poly(img, [[4, 3], [11, 3], [14, 6.5], [11, 10], [4, 10], [1, 6.5]], lit ? C.basalt4 : C.basalt3);
  poly(img, [[5, 4], [10, 4], [12, 6.5], [10, 9], [5, 9], [3, 6.5]], lit ? rgba('#B7C6D8') : C.basalt4);
  // grabado hexagonal pequeño y vetas
  line(img, 6, 5, 9, 5, C.basalt2); line(img, 6, 8, 9, 8, C.basalt2);
  px(img, 5, 6, C.basalt2); px(img, 10, 6, C.basalt2); px(img, 5, 7, C.basalt2); px(img, 10, 7, C.basalt2);
  for (const [x, y] of [[6, 14], [8, 17], [7, 20], [12, 13], [2, 15]]) px(img, x, y, C.basalt3);
  // contorno
  line(img, 4, 2, 11, 2, C.ink); line(img, 0, 6, 0, 20, C.ink); line(img, 15, 6, 15, 20, C.ink);
  line(img, 1, 5, 3, 3, C.ink); line(img, 12, 3, 14, 5, C.ink); line(img, 1, 21, 3, 23, C.ink); line(img, 12, 23, 14, 21, C.ink);
  line(img, 4, 23, 11, 23, C.ink);
  if (lit) { line(img, 4, 10, 11, 10, C.green); px(img, 7, 6, C.green); px(img, 8, 7, C.green); }
  return img;
}

function stoneFrame(lit = false) {
  const img = new Img(16, 16);
  ellipse(img, 8, 10.5, 6.5, 4.8, C.stone1);
  ellipse(img, 7.5, 9.5, 5.8, 4.2, C.stone2);
  ellipse(img, 6.8, 8.6, 3.8, 2.8, C.stone3);
  ellipse(img, 6, 7.8, 1.8, 1.2, C.stone4);
  // vetas de galena
  for (const [x, y] of [[10, 9], [11, 10], [9, 12], [4, 11], [12, 12]]) px(img, x, y, C.galena);
  px(img, 10, 8, C.galenaHi);
  // contorno
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (img.alpha(x, y)) continue;
      if (img.alpha(x - 1, y) || img.alpha(x + 1, y) || img.alpha(x, y - 1) || img.alpha(x, y + 1)) img.set(x, y, C.stone0);
    }
  }
  if (lit) { px(img, 7, 9, C.green); px(img, 8, 10, C.green); }
  return img;
}

// ───────────────────────────── Placa y suelo ─────────────────────────────

function plateFrame(pressed) {
  const img = new Img(16, 16);
  rect(img, 1, 1, 14, 14, pressed ? C.iron0 : C.iron1);
  rect(img, 2, 2, 12, 12, pressed ? C.basalt1 : C.basalt3);
  rect(img, pressed ? 3 : 2, pressed ? 3 : 2, pressed ? 10 : 12, pressed ? 10 : 11, pressed ? C.basalt2 : C.basalt4);
  // hexágono grabado
  const hx = [[6, 4], [10, 4], [12, 8], [10, 12], [6, 12], [4, 8]];
  for (let i = 0; i < 6; i++) line(img, ...hx[i], ...hx[(i + 1) % 6], pressed ? C.basalt1 : C.basalt2);
  if (!pressed) { line(img, 2, 13, 13, 13, C.basalt1); line(img, 13, 2, 13, 13, C.basalt1); }
  else { line(img, 3, 3, 12, 3, C.ink); line(img, 3, 3, 3, 12, C.ink); disc(img, 8, 8, 1.5, C.green); }
  return img;
}

const CRACKS = [
  [[3, 2, 7, 7], [7, 7, 5, 13], [7, 7, 12, 9], [12, 9, 14, 14]],
  [[1, 8, 6, 7], [6, 7, 9, 3], [6, 7, 10, 11], [10, 11, 9, 15]],
  [[8, 1, 8, 6], [8, 6, 3, 10], [8, 6, 13, 11], [3, 10, 2, 14]],
  [[2, 3, 6, 6], [6, 6, 11, 5], [11, 5, 14, 2], [6, 6, 8, 13]],
];

function crackFrame(v) {
  const img = new Img(16, 16);
  for (const [x0, y0, x1, y1] of CRACKS[v]) { line(img, x0, y0, x1, y1, rgba('#15181D', 230)); line(img, x0 + 1, y0, x1 + 1, y1, rgba('#9AA6B5', 90)); }
  for (const [x, y] of [[4, 12], [12, 4], [10, 14]]) px(img, (x + v * 3) % 15, y, rgba('#15181D', 160));
  return img;
}

function holeFrame(v) {
  const img = new Img(16, 16);
  const r = 6.2 + (v % 2) * 0.4;
  ellipse(img, 8, 8.5, r + 0.8, r, rgba('#2B313B'));
  ellipse(img, 8, 8.7, r, r - 0.8, rgba('#0B0C10'));
  ellipse(img, 8, 9.5, r - 2, r - 3, rgba('#000000'));
  // bordes rotos
  for (let a = 0; a < 12; a++) {
    const ang = (a / 12) * Math.PI * 2 + v;
    const x = 8 + Math.cos(ang) * (r + 0.5);
    const y = 8.5 + Math.sin(ang) * (r - 0.3);
    if (noise(a, v, 3) > 0.45) px(img, x, y, rgba('#5E6B80'));
  }
  line(img, 3, 3, 1, 1, rgba('#15181D', 220));
  line(img, 13, 14, 15, 15, rgba('#15181D', 220));
  return img;
}

function breakingFrame(f) {
  const img = crackFrame(f % 4);
  if (f >= 1) ellipse(img, 8, 8.5, 2 + f * 1.4, 1.6 + f * 1.3, rgba('#0B0C10', 120 + f * 40));
  for (let i = 0; i < f * 3; i++) px(img, 2 + noise(i, f, 9) * 12, 2 + noise(f, i, 5) * 12, rgba('#8A98AD'));
  return img;
}

// ───────────────────────────── Arena profunda ─────────────────────────────

function sandFrame(mask) {
  const img = new Img(16, 16);
  rect(img, 0, 0, 16, 16, C.sand2);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const n = noise(x, y, 11);
      if (n > 0.86) over(img, x, y, C.sand3);
      else if (n < 0.1) over(img, x, y, C.sand1);
    }
  }
  // ondas y huellas hundidas
  for (const [y, s] of [[4, 0], [9, 5], [13, 2]]) for (let x = 0; x < 16; x++) if (((x + s) % 7) < 4) over(img, x, y + (((x + s) % 7) === 2 ? -1 : 0), C.sand1);
  ellipse(img, 5, 7, 1.4, 1, C.sand0); ellipse(img, 10, 11, 1.4, 1, C.sand0);
  // bordes expuestos: N 1 · E 2 · S 4 · O 8
  const edge = rgba('#8C7652');
  const soft = rgba('#8C7652', 110);
  if (mask & 1) { line(img, 0, 0, 15, 0, edge); line(img, 0, 1, 15, 1, soft); }
  if (mask & 2) { line(img, 15, 0, 15, 15, edge); line(img, 14, 0, 14, 15, soft); }
  if (mask & 4) { line(img, 0, 15, 15, 15, edge); line(img, 0, 14, 15, 14, soft); }
  if (mask & 8) { line(img, 0, 0, 0, 15, edge); line(img, 1, 0, 1, 15, soft); }
  return img;
}

// ───────────────────────────── La Gran Balanza ─────────────────────────────

function panFrame(state) {
  const img = new Img(16, 16);
  const dy = state === 'down' ? 1 : state === 'up' ? -1 : 0;
  const r = state === 'down' ? 6.4 : state === 'up' ? 7.2 : 6.8;
  if (state === 'up') ellipse(img, 8, 10, r, r - 2.2, C.shadow);
  ellipse(img, 8, 8 + dy, r, r - 1.2, C.bronze0);
  ellipse(img, 8, 8 + dy, r - 1, r - 2.2, state === 'down' ? C.bronze1 : C.bronze2);
  ellipse(img, 8, 7.4 + dy, r - 2.6, r - 3.6, state === 'down' ? C.bronze2 : C.bronze3);
  line(img, 5, 5 + dy, 8, 4 + dy, C.bronze4);
  // anillas de las cadenas
  for (const x of [3, 8, 13]) px(img, x, 2 + dy + (x === 8 ? -1 : 0), C.iron3);
  if (state === 'lit') {
    ellipse(img, 8, 8, r + 0.5, r - 0.5, rgba('#FFF4C8', 70));
    line(img, 4, 8, 12, 8, C.green);
  }
  return img;
}

function beamPiece(kind, lit) {
  const img = new Img(16, 16);
  const band = lit ? rgba('#B7F28E') : C.iron3;
  if (kind === 'viga' || kind === 'izq' || kind === 'der') {
    const x0 = kind === 'izq' ? 4 : 0;
    const x1 = kind === 'der' ? 11 : 15;
    rect(img, x0, 5, x1 - x0 + 1, 6, C.iron1);
    line(img, x0, 5, x1, 5, C.iron3);
    line(img, x0, 10, x1, 10, C.iron0);
    for (let x = x0 + 1; x < x1; x += 4) { px(img, x, 7, band); px(img, x + 1, 8, band); }
    if (kind !== 'viga') {
      const hx = kind === 'izq' ? 5 : 10;
      line(img, hx, 11, hx, 14, C.iron2);
      px(img, hx - 1, 14, C.iron2); px(img, hx + 1, 14, C.iron2);
    }
  } else {
    // cadena vertical (con gancho abajo si kind === 'gancho')
    for (let y = 0; y < 16; y += 4) {
      ellipse(img, 8, y + 1.5, 1.6, 1.8, C.iron2);
      px(img, 8, y + 1, C.iron0);
      line(img, 8, y + 3, 8, y + 4, C.iron3);
    }
    if (kind === 'gancho') { line(img, 7, 13, 7, 15, C.iron3); line(img, 9, 13, 9, 15, C.iron3); }
    if (lit) for (let y = 2; y < 16; y += 4) px(img, 9, y, C.green);
  }
  return img;
}

function pivotFrame(lit) {
  const img = new Img(48, 48);
  // columna de piedra con banda de hexágonos
  rect(img, 19, 14, 10, 34, C.basalt2);
  rect(img, 19, 14, 3, 34, C.basalt3);
  rect(img, 26, 14, 3, 34, C.basalt1);
  line(img, 18, 14, 18, 47, C.ink); line(img, 29, 14, 29, 47, C.ink);
  for (let y = 20; y < 46; y += 7) {
    const hx = [[22, y], [26, y], [27, y + 2], [26, y + 4], [22, y + 4], [21, y + 2]];
    for (let i = 0; i < 6; i++) line(img, ...hx[i], ...hx[(i + 1) % 6], lit ? rgba('#B7F28E') : C.basalt1);
  }
  // capitel y rótula de bronce
  rect(img, 15, 10, 18, 5, C.basalt3); line(img, 15, 10, 32, 10, C.basalt4); line(img, 15, 14, 32, 14, C.ink);
  disc(img, 24, 7, 5.5, C.bronze1); disc(img, 24, 7, 4.2, C.bronze2); disc(img, 23, 6, 2, C.bronze4);
  // brazos de la viga que salen hacia los lados
  rect(img, 0, 5, 18, 5, C.iron1); rect(img, 30, 5, 18, 5, C.iron1);
  line(img, 0, 5, 18, 5, C.iron3); line(img, 30, 5, 47, 5, C.iron3);
  line(img, 0, 9, 18, 9, C.iron0); line(img, 30, 9, 47, 9, C.iron0);
  for (let x = 2; x < 18; x += 4) px(img, x, 7, lit ? rgba('#B7F28E') : C.iron3);
  for (let x = 32; x < 48; x += 4) px(img, x, 7, lit ? rgba('#B7F28E') : C.iron3);
  // cadena del platillo del centro
  for (let y = 16; y < 48; y += 4) { ellipse(img, 13, y + 1.5, 1.4, 1.7, C.iron2); ellipse(img, 35, y + 1.5, 1.4, 1.7, C.iron2); }
  if (lit) { disc(img, 24, 7, 7, rgba('#FFF4C8', 60)); disc(img, 24, 7, 2, rgba('#FFFFFF', 200)); }
  return img;
}

function weightFrame(sway) {
  const img = new Img(16, 48);
  const off = [0, 1, 0, -1][sway];
  for (let y = 0; y < 30; y += 3) {
    const x = 8 + Math.round((off * y) / 30);
    ellipse(img, x, y + 1, 1.2, 1.5, C.iron2);
    px(img, x, y + 1, C.iron0);
  }
  const bx = 8 + off;
  poly(img, [[bx - 4, 30], [bx + 4, 30], [bx + 6, 45], [bx - 6, 45]], C.iron1);
  poly(img, [[bx - 3, 31], [bx + 3, 31], [bx + 4, 44], [bx - 4, 44]], C.iron2);
  line(img, bx - 4, 30, bx + 4, 30, C.iron3);
  line(img, bx - 6, 46, bx + 6, 46, C.iron0);
  // hexágono grabado
  const hx = [[bx - 2, 35], [bx + 2, 35], [bx + 3, 37], [bx + 2, 40], [bx - 2, 40], [bx - 3, 37]];
  for (let i = 0; i < 6; i++) line(img, ...hx[i], ...hx[(i + 1) % 6], C.iron0);
  return img;
}

function slabFrame(step) {
  const img = new Img(16, 16);
  const sink = [0, 5, 10][step];
  const h = 15 - sink;
  if (h <= 0) return img;
  rect(img, 0, 16 - h, 16, h, C.basalt2);
  rect(img, 0, 16 - h, 16, 2, C.basalt4);
  line(img, 0, 15, 15, 15, C.ink);
  if (h > 8) {
    const y = 16 - h + 5;
    const hx = [[5, y], [10, y], [12, y + 3], [10, y + 6], [5, y + 6], [3, y + 3]];
    for (let i = 0; i < 6; i++) line(img, ...hx[i], ...hx[(i + 1) % 6], C.basalt1);
  }
  if (step > 0) for (let i = 0; i < 6; i++) px(img, noise(i, step, 2) * 16, 16 - h - 1 - noise(step, i, 4) * 3, C.stone2);
  return img;
}

function leverFrame(down) {
  const img = new Img(16, 24);
  rect(img, 2, 15, 12, 8, C.basalt2);
  rect(img, 2, 15, 12, 2, C.basalt4);
  line(img, 2, 22, 13, 22, C.ink);
  rect(img, 6, 17, 4, 2, C.ink);
  if (!down) {
    line(img, 8, 17, 10, 4, C.iron2); line(img, 9, 17, 11, 4, C.iron3);
    disc(img, 10.5, 3.5, 2.2, C.bronze2); px(img, 10, 2, C.bronze4);
  } else {
    line(img, 8, 18, 4, 11, C.iron2); line(img, 9, 18, 5, 11, C.iron3);
    disc(img, 4, 10.5, 2.2, C.bronze2); px(img, 3, 9, C.bronze4);
  }
  return img;
}

// ───────────────────────────── Hojas ─────────────────────────────

export function buildCamara() {
  save('b08_bloque.png', eventSheet([[blockFrame()], [blockFrame()], [blockFrame(true)], [blockFrame()]]));
  save('b08_piedra.png', eventSheet([[stoneFrame()], [stoneFrame()], [stoneFrame(true)], [stoneFrame()]]));
  save('b08_placa.png', eventSheet([[plateFrame(false)], [plateFrame(true)], [plateFrame(true)], [plateFrame(false)]]));
  save('b08_suelo.png', eventSheet([
    [0, 1, 2, 3].map(crackFrame),
    [0, 1, 2, 3].map(holeFrame),
    [0, 1, 2, 3].map(breakingFrame),
    [0, 1, 2, 3].map(holeFrame),
  ]));
  save('b08_arena.png', eventSheet([0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => sandFrame(r * 4 + c)))));
  save('b08_platillo.png', eventSheet([[panFrame('level')], [panFrame('down')], [panFrame('up')], [panFrame('lit')]]));
  const pieces = (lit) => ['viga', 'izq', 'der', 'cadena'].map((k) => beamPiece(k, lit));
  save('b08_balanza.png', eventSheet([pieces(false), [beamPiece('gancho', false), beamPiece('gancho', true), beamPiece('cadena', true), beamPiece('viga', true)], pieces(false), pieces(true)]));
  save('b08_eje.png', eventSheet([[pivotFrame(false)], [pivotFrame(true)], [pivotFrame(true)], [pivotFrame(false)]]), { previewScale: 1 });
  save('b08_contrapeso.png', eventSheet([[0, 1, 2, 3].map(weightFrame)]));
  save('b08_losa.png', eventSheet([[slabFrame(0)], [slabFrame(1)], [slabFrame(2)], [slabFrame(0)]]));
  save('b08_palanca.png', eventSheet([[leverFrame(false)], [leverFrame(true)], [leverFrame(true)], [leverFrame(false)]]));
}
