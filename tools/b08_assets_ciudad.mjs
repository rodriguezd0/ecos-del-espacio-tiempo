// Arte propio de Ciudad Estrato, la Mina Galena y el Cerro Plomo (Bloque 8, PROVISIONAL D30). Hojas de evento 4×4
// (fila = dirección RMXP 2/4/6/8, columna = fotograma). Lo llama tools/b08_assets.mjs.
//   b08_perforadora.png  96×96  perforadora de Genesis del pozo lateral (4 fotogramas: la broca gira; fila 4 parada)
//   b08_vagoneta.png     32×32  vagoneta de mina con galena (fila 2 llena · 4 vacía)
//   b08_flotante.png     32×32  piedra que flota un palmo de noche (4 fotogramas de vaivén)
//   b08_grieta.png       32×32  grietas: fila 2 en el suelo (4 variantes) · 4 en fachadas (4 variantes)
//   b08_losa_pulso.png   96×32  Losa del Pulso (3 casillas): fila 2 normal · 4 brillo de Zygarde · 6 la Tablilla a la vista
//   b08_verja.png        32×64  verja de los Galena: columnas izquierda · candado · derecha · abierta (fila 2)
//   b08_via.png          32×32  vía: columnas horizontal · tope · vertical · cruce (fila 2)
//   b08_fosiles.png      32×32  fósiles en la roca de la galería honda (4 variantes)
//   b08_entibo.png       96×64  entibado de madera sobre un paso de la mina (marco de 3 casillas)
import { Img, rgba, over, px, rect, line, disc, ellipse, poly, noise, eventSheet, save } from './b08_assets_lib.mjs';

const G = {
  petrol: rgba('#1F4E5A'), petrolHi: rgba('#2F6E7E'), white: rgba('#F2F4F5'), coal: rgba('#2B2D31'), magenta: rgba('#B03A8C'),
  ink: rgba('#1C1A18'),
  wood0: rgba('#3A2616'), wood1: rgba('#5C3D22'), wood2: rgba('#825A34'), wood3: rgba('#A9794A'),
  iron0: rgba('#23262C'), iron1: rgba('#3E444E'), iron2: rgba('#5C6572'), iron3: rgba('#8C95A3'),
  rust: rgba('#7A4A2C'), rust2: rgba('#9C6238'),
  stone0: rgba('#45403A'), stone1: rgba('#6F6961'), stone2: rgba('#958E84'), stone3: rgba('#B6AFA4'), stone4: rgba('#D2CCC2'),
  galena: rgba('#8FA0B4'), galenaHi: rgba('#DDE6F0'),
  green: rgba('#9CF26A', 210), shadow: rgba('#000000', 80),
};

function drillFrame(f, stopped = false) {
  const img = new Img(48, 48);
  // boca del pozo
  ellipse(img, 24, 41, 13, 5, rgba('#15120F'));
  ellipse(img, 24, 40, 11, 3.5, rgba('#000000'));
  // torre en A (petróleo) con travesaños blancos
  line(img, 10, 44, 20, 4, G.petrol); line(img, 11, 44, 21, 4, G.petrolHi);
  line(img, 38, 44, 28, 4, G.petrol); line(img, 37, 44, 27, 4, G.petrolHi);
  for (const y of [14, 24, 34]) {
    const t = (44 - y) / 40;
    line(img, Math.round(10 + 10 * t), y, Math.round(38 - 10 * t), y, G.white);
  }
  rect(img, 18, 2, 12, 4, G.coal); line(img, 18, 2, 29, 2, G.iron3);
  rect(img, 22, 6, 4, 3, G.magenta);
  // broca que gira
  const phase = stopped ? 0 : f;
  rect(img, 22, 9, 4, 30, G.iron2);
  for (let y = 10 + phase * 2; y < 39; y += 8) { line(img, 22, y, 25, y + 3, G.iron3); line(img, 22, y + 1, 25, y + 4, G.iron0); }
  // motor y cables
  rect(img, 30, 30, 10, 8, G.white); rect(img, 31, 31, 8, 6, G.petrol);
  px(img, 35, 33, stopped ? G.coal : rgba('#FF4D6D')); px(img, 36, 33, G.magenta);
  line(img, 30, 34, 26, 30, G.coal);
  if (!stopped) for (let i = 0; i < 4; i++) px(img, 20 + noise(i, f, 3) * 8, 36 + noise(f, i, 7) * 4, G.stone3);
  return img;
}

function cartFrame(full) {
  const img = new Img(16, 16);
  // ruedas
  disc(img, 4, 13, 2, G.iron0); disc(img, 12, 13, 2, G.iron0); px(img, 4, 13, G.iron3); px(img, 12, 13, G.iron3);
  // caja
  poly(img, [[1, 6], [15, 6], [14, 13], [2, 13]], G.rust);
  poly(img, [[2, 7], [14, 7], [13, 12], [3, 12]], G.rust2);
  line(img, 1, 6, 15, 6, G.iron2); line(img, 2, 13, 14, 13, G.iron0);
  line(img, 5, 7, 5, 12, G.iron1); line(img, 11, 7, 11, 12, G.iron1);
  if (full) {
    for (const [x, y, c] of [[4, 5, G.galena], [6, 4, G.stone2], [8, 4, G.galena], [10, 5, G.stone3], [12, 5, G.galena], [7, 5, G.galenaHi], [9, 3, G.galena], [11, 4, G.stone1]]) {
      disc(img, x, y, 1.4, c);
    }
    px(img, 8, 3, G.galenaHi);
  }
  return img;
}

function pebbleFrame(f) {
  const img = new Img(16, 16);
  const lift = [0, 1, 2, 1][f];
  ellipse(img, 8, 14, 3.5 - lift * 0.4, 1.2, G.shadow);
  const y = 8 - lift;
  ellipse(img, 8, y, 4, 3, G.stone1);
  ellipse(img, 7.5, y - 0.5, 3.2, 2.3, G.stone2);
  ellipse(img, 7, y - 1, 1.6, 1, G.stone4);
  px(img, 10, y, G.galena);
  if (f === 2) { px(img, 3, y - 3, rgba('#9CF26A', 120)); px(img, 13, y - 2, rgba('#9CF26A', 90)); }
  return img;
}

const CRACK_LINES = [
  [[2, 6, 7, 8], [7, 8, 10, 4], [7, 8, 9, 13], [9, 13, 14, 14]],
  [[1, 12, 5, 9], [5, 9, 11, 10], [11, 10, 14, 5]],
  [[8, 1, 7, 6], [7, 6, 3, 9], [7, 6, 12, 10], [12, 10, 13, 15]],
  [[3, 2, 6, 7], [6, 7, 5, 12], [6, 7, 12, 8]],
];

function crackFrame(v, wall) {
  const img = new Img(16, 16);
  const dark = wall ? rgba('#2A211B', 200) : rgba('#2A2620', 210);
  const light = wall ? rgba('#E8DCC8', 80) : rgba('#C8BCA6', 70);
  for (const [x0, y0, x1, y1] of CRACK_LINES[v]) { line(img, x0, y0, x1, y1, dark); line(img, x0, y0 + 1, x1, y1 + 1, light); }
  if (!wall) { ellipse(img, 7, 8, 2.5, 1.2, rgba('#2A2620', 60)); }
  return img;
}

function losaFrame(state) {
  // 48×16 nativo (3 casillas): losa de piedra sobre un zócalo, centrada en la casilla del evento.
  const img = new Img(48, 16);
  const x0 = 1; const w = 46;
  rect(img, x0 + 1, 9, w - 2, 6, G.stone1);
  rect(img, x0 + 1, 2, w - 2, 8, G.stone2);
  rect(img, x0 + 2, 3, w - 4, 5, G.stone3);
  line(img, x0 + 1, 2, x0 + w - 2, 2, G.stone4);
  line(img, x0 + 1, 14, x0 + w - 2, 14, G.stone0);
  line(img, x0, 3, x0, 14, G.stone0); line(img, x0 + w - 1, 3, x0 + w - 1, 14, G.stone0);
  // dos huecos de codo y manos, gastados por siglos de pulsos
  for (const cx of [15, 32]) { ellipse(img, cx, 5, 3, 1.8, G.stone1); ellipse(img, cx, 5, 1.8, 1, G.stone0); }
  line(img, 19, 5, 28, 5, rgba('#6F6961', 150));
  for (let i = 0; i < 14; i++) px(img, x0 + 3 + noise(i, 1, 2) * 40, 10 + noise(1, i, 5) * 3, G.stone0);
  if (state === 'glow') {
    for (let x = x0 + 4; x < x0 + w - 4; x += 3) px(img, x, 7, G.green);
    ellipse(img, 24, 5, 18, 3, rgba('#9CF26A', 40));
  }
  if (state === 'tablet') {
    rect(img, 20, 3, 8, 5, rgba('#C8423A'));
    rect(img, 21, 4, 6, 3, rgba('#E86A5A'));
    line(img, 20, 3, 27, 3, rgba('#F7B0A0'));
    ellipse(img, 24, 5, 10, 4, rgba('#FFF4C8', 70));
  }
  return img;
}

function gateFrame(col, open) {
  const img = new Img(16, 32);
  if (open) {
    line(img, 1, 4, 1, 31, G.iron1); line(img, 14, 4, 14, 31, G.iron1);
    return img;
  }
  const bars = col === 0 ? [2, 6, 10, 14] : col === 2 ? [1, 5, 9, 13] : [1, 5, 10, 14];
  for (const x of bars) { line(img, x, 3, x, 30, G.iron2); line(img, x + 1, 3, x + 1, 30, G.iron0); px(img, x, 2, G.iron3); }
  line(img, 0, 8, 15, 8, G.iron1); line(img, 0, 24, 15, 24, G.iron1);
  line(img, 0, 9, 15, 9, G.iron0); line(img, 0, 25, 15, 25, G.iron0);
  if (col === 1) {
    rect(img, 5, 14, 6, 6, rgba('#B08A3C')); rect(img, 6, 15, 4, 4, rgba('#D8B25A'));
    ellipse(img, 8, 13, 2, 2, rgba('#6F6961')); px(img, 8, 13, rgba('#000000', 0));
    px(img, 8, 17, G.ink);
  }
  return img;
}

function railFrame(kind) {
  const img = new Img(16, 16);
  if (kind === 'h' || kind === 'stop' || kind === 'x') {
    for (let x = 1; x < 16; x += 4) rect(img, x, 4, 2, 9, G.wood1);
    line(img, 0, 6, 15, 6, G.iron3); line(img, 0, 7, 15, 7, G.iron1);
    line(img, 0, 10, 15, 10, G.iron3); line(img, 0, 11, 15, 11, G.iron1);
  }
  if (kind === 'v' || kind === 'x') {
    for (let y = 1; y < 16; y += 4) rect(img, 4, y, 9, 2, G.wood1);
    line(img, 6, 0, 6, 15, G.iron3); line(img, 7, 0, 7, 15, G.iron1);
    line(img, 10, 0, 10, 15, G.iron3); line(img, 11, 0, 11, 15, G.iron1);
  }
  if (kind === 'stop') {
    rect(img, 11, 3, 4, 11, G.wood2); line(img, 11, 3, 14, 3, G.wood3); line(img, 11, 13, 14, 13, G.wood0);
    rect(img, 12, 6, 2, 5, rgba('#C8423A'));
  }
  return img;
}

function fossilFrame(v) {
  const img = new Img(16, 16);
  ellipse(img, 8, 9, 7, 5.5, G.stone1);
  ellipse(img, 8, 8.5, 6, 4.6, G.stone2);
  const bone = rgba('#E9DFC8');
  if (v === 0) { // cráneo
    ellipse(img, 8, 8, 3.5, 2.6, bone); px(img, 7, 8, G.stone0); px(img, 9, 8, G.stone0); line(img, 6, 10, 10, 10, G.stone0);
  } else if (v === 1) { // coraza
    ellipse(img, 8, 8.5, 3.5, 2.8, bone); line(img, 5, 8, 11, 8, G.stone0); line(img, 8, 6, 8, 11, G.stone0);
  } else if (v === 2) { // espina
    for (let x = 3; x < 13; x += 2) { line(img, x, 7, x, 10, bone); }
    line(img, 3, 8, 12, 8, bone);
  } else { // concha
    for (let r = 1; r <= 3; r++) ellipse(img, 8, 8.5, r, r * 0.8, r % 2 ? bone : G.stone1);
  }
  return img;
}

function entiboFrame() {
  const img = new Img(48, 32);
  // postes a los lados del paso y viga encima
  for (const x of [2, 42]) { rect(img, x, 6, 4, 26, G.wood1); line(img, x, 6, x, 31, G.wood3); line(img, x + 3, 6, x + 3, 31, G.wood0); }
  rect(img, 0, 2, 48, 6, G.wood2); line(img, 0, 2, 47, 2, G.wood3); line(img, 0, 7, 47, 7, G.wood0);
  for (const x of [8, 24, 40]) { px(img, x, 4, G.iron3); px(img, x, 5, G.iron1); }
  // farol colgado
  line(img, 24, 8, 24, 11, G.iron1);
  rect(img, 22, 11, 5, 5, rgba('#F2C14E')); rect(img, 23, 12, 3, 3, rgba('#FFF1B0'));
  return img;
}

export function buildCiudad() {
  save('b08_perforadora.png', eventSheet([[0, 1, 2, 3].map((f) => drillFrame(f)), [drillFrame(0, true)], [drillFrame(0, true)], [drillFrame(0, true)]]), { previewScale: 1 });
  save('b08_vagoneta.png', eventSheet([[cartFrame(true)], [cartFrame(false)], [cartFrame(true)], [cartFrame(false)]]));
  save('b08_flotante.png', eventSheet([[0, 1, 2, 3].map(pebbleFrame)]));
  save('b08_grieta.png', eventSheet([[0, 1, 2, 3].map((v) => crackFrame(v, false)), [0, 1, 2, 3].map((v) => crackFrame(v, true))]));
  save('b08_losa_pulso.png', eventSheet([[losaFrame('normal')], [losaFrame('glow')], [losaFrame('tablet')], [losaFrame('normal')]]), { previewScale: 1 });
  save('b08_verja.png', eventSheet([[gateFrame(0), gateFrame(1), gateFrame(2), gateFrame(1, true)]]));
  save('b08_via.png', eventSheet([['h', 'stop', 'v', 'x'].map(railFrame)]));
  save('b08_fosiles.png', eventSheet([[0, 1, 2, 3].map(fossilFrame)]));
  save('b08_entibo.png', eventSheet([[entiboFrame()]]), { previewScale: 1 });
}

export { over };
