// Arte propio del Bloque 9b (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b09b_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime o `pattern` fijo):
//   objects/b09b_bomba.png        64×64  bomba de lodo de Genesis (fila 2 en marcha · 4 parada · 6 = 2 · 8 = 4)
//   objects/b09b_estaca.png       32×64  estaca de muestreo con cinta; `pattern` = lectura: fila 2 sin leer (blanca),
//                                        fila 4: 0 muy baja (azul) · 1 baja (verde) · 2 media (amarilla) · 3 alta (naranja),
//                                        fila 6: 0 muy alta (roja)
//   objects/b09b_lodo.png         32×32  poza de lodo denso (fila 2 burbujea · 4 en calma · 6 con la Tablilla asomando ·
//                                        8 hueco removido)
//   objects/b09b_plataforma.png  128×96  plataforma del Consorcio vista mar adentro (Talasa), luces magenta que parpadean
//   objects/b09b_prismaticos.png  32×64  prismáticos de monedas del muelle
//   objects/b09b_maletin.png      32×32  maletín de campo de Alerce (frascos y un medidor de aguja)
//   objects/b09b_boya.png         32×32  boya roja y blanca que se mece
// Paleta de Genesis (CAMPANA §5.1): petróleo #1F4E5A, blanco clínico #F2F4F5, carbón #2B2D31, magenta #B03A8C.
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

function rect(img, x, y, w, h, c) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) over(img, x + i, y + j, typeof c === 'string' ? rgba(c) : c);
}

function line(img, x0, y0, x1, y1, c) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) over(img, Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), typeof c === 'string' ? rgba(c) : c);
}

function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, typeof c === 'string' ? rgba(c) : c);
    }
  }
}

function ellipse(img, cx, cy, rx, ry, c) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) over(img, x, y, typeof c === 'string' ? rgba(c) : c);
    }
  }
}

const GEN = { petrol: '#1F4E5A', petrolHi: '#2E6E7E', petrolDk: '#163840', white: '#F2F4F5', whiteDk: '#C9CED2', coal: '#2B2D31', coalHi: '#44474E', magenta: '#B03A8C', magHi: '#FF8AD8', magOff: '#5A2A4A', out: '#15171A' };
const MUD = { dark: '#3A2A22', mid: '#5A4232', hi: '#7A5C44', toxic: '#6A4A6E', toxicHi: '#9A76A0', slick: '#A8C0A0' };

// ───────────────────────────── Bomba de lodo ─────────────────────────────

function pumpFrame(running, f) {
  const img = new Img(32, 32);
  // charco de lodo removido alrededor de la base
  ellipse(img, 16, 28, 13, 3.5, rgba(MUD.dark, 230));
  ellipse(img, 16, 28, 10, 2.6, rgba(running ? MUD.toxic : MUD.mid, 220));
  // manguera que sale hacia la derecha y se hunde en el barro
  line(img, 22, 25, 27, 27, GEN.coal); line(img, 22, 24, 27, 26, GEN.coalHi);
  line(img, 27, 27, 31, 28, GEN.coal);
  // plataforma
  rect(img, 7, 22, 18, 4, GEN.petrol);
  rect(img, 7, 22, 18, 1, GEN.petrolHi);
  rect(img, 7, 25, 18, 1, GEN.petrolDk);
  // patas en A
  line(img, 9, 22, 14, 6, GEN.coal); line(img, 10, 22, 15, 6, GEN.coalHi);
  line(img, 23, 22, 18, 6, GEN.coal); line(img, 22, 22, 17, 6, GEN.coalHi);
  line(img, 11, 15, 21, 15, GEN.coal);
  // motor blanco con emblema
  rect(img, 11, 3, 11, 6, GEN.white);
  rect(img, 11, 8, 11, 1, GEN.whiteDk);
  rect(img, 20, 3, 2, 6, GEN.whiteDk);
  // emblema: dos tubos cruzados sobre un círculo
  over(img, 14, 5, rgba(GEN.magenta)); over(img, 16, 5, rgba(GEN.magenta)); over(img, 15, 6, rgba(GEN.magenta));
  over(img, 14, 7, rgba(GEN.magenta)); over(img, 16, 7, rgba(GEN.magenta));
  // piloto
  const lit = running && f % 2 === 0;
  over(img, 19, 4, rgba(lit ? GEN.magHi : running ? GEN.magenta : GEN.magOff));
  // pistón: sube y baja en marcha
  const drop = running ? [0, 2, 4, 2][f] : 4;
  rect(img, 15, 9, 2, 10 + drop, '#8A949C');
  over(img, 15, 9, rgba('#C8D0D6')); over(img, 15, 10, rgba('#C8D0D6'));
  rect(img, 14, 18 + drop, 4, 2, GEN.coal);
  // salpicaduras de lodo tóxico
  if (running) {
    const spl = [[[11, 26], [21, 27]], [[12, 25], [20, 25], [9, 27]], [[10, 24], [22, 24], [16, 26]], [[13, 26], [19, 26]]][f];
    for (const [x, y] of spl) { over(img, x, y, rgba(MUD.toxicHi)); over(img, x, y - 1, rgba(MUD.toxic, 180)); }
  }
  return outline(img, GEN.out);
}

function pumpSheet() {
  const run = [0, 1, 2, 3].map((f) => pumpFrame(true, f).scale(2));
  const stop = [0, 1, 2, 3].map(() => pumpFrame(false, 0).scale(2));
  return sheet([run, stop, run, stop], 64, 64);
}

// ───────────────────────────── Estaca de muestreo ─────────────────────────────

const RIBBON = {
  unread: ['#FFFFFF', '#D8DDE0'],
  1: ['#5AA0E8', '#3A70B8'],
  2: ['#6FD06A', '#3F9A3C'],
  3: ['#F2D24A', '#C8A020'],
  4: ['#F29A3A', '#C06A18'],
  5: ['#E8483A', '#A82A20'],
};

function stakeFrame(level) {
  const img = new Img(16, 32);
  // barro alrededor de la base
  ellipse(img, 8, 30, 5, 1.6, rgba(MUD.dark, 200));
  // palo
  rect(img, 7, 9, 2, 21, '#8A5A30');
  rect(img, 7, 9, 1, 21, '#B07A44');
  over(img, 7, 29, rgba('#5E3A1E')); over(img, 8, 29, rgba('#5E3A1E'));
  // remate y etiqueta
  rect(img, 6, 8, 4, 2, '#5E3A1E');
  rect(img, 9, 14, 3, 3, '#F2F4F5');
  over(img, 10, 15, rgba('#2B2D31'));
  // cinta ondeando
  const [c, d] = RIBBON[level] || RIBBON.unread;
  const pts = [[9, 9], [10, 9], [11, 10], [12, 10], [13, 11], [14, 11]];
  for (const [x, y] of pts) { over(img, x, y, rgba(c)); over(img, x, y + 1, rgba(d)); }
  over(img, 15, 12, rgba(c)); over(img, 15, 13, rgba(d));
  return outline(img, '#2A1A0E');
}

function stakeSheet() {
  const s = (lv) => stakeFrame(lv).scale(2);
  return sheet([
    [s('unread'), s('unread'), s('unread'), s('unread')],
    [s(1), s(2), s(3), s(4)],
    [s(5), s(5), s(5), s(5)],
    [s('unread'), s('unread'), s('unread'), s('unread')],
  ], 32, 64);
}

// ───────────────────────────── Poza de lodo denso ─────────────────────────────

function mudFrame(state, f) {
  const img = new Img(16, 16);
  ellipse(img, 8, 9, 7.5, 5.5, rgba(MUD.dark));
  ellipse(img, 8, 9, 6.2, 4.4, rgba(state === 'calm' ? MUD.mid : MUD.toxic));
  ellipse(img, 7, 8, 3.5, 2, rgba(state === 'calm' ? MUD.hi : MUD.toxicHi, 120));
  if (state === 'bubbling') {
    const bubbles = [[[5, 9, 1.4], [10, 7, 0.9]], [[6, 8, 1.8], [11, 10, 1.2]], [[9, 10, 1.6], [4, 8, 0.8]], [[10, 8, 1.1], [7, 11, 1.3]]][f];
    for (const [x, y, r] of bubbles) {
      disc(img, x, y, r, rgba(MUD.toxicHi, 230));
      over(img, Math.round(x - r / 2), Math.round(y - r / 2), rgba('#E8D8F0', 220));
    }
    // brillo aceitoso
    over(img, 12, 11, rgba(MUD.slick, 150)); over(img, 3, 10, rgba(MUD.slick, 130));
  } else if (state === 'tablet') {
    // esquina de una losa violeta que asoma y brilla
    rect(img, 6, 6, 5, 3, '#8A5AB0');
    rect(img, 6, 6, 5, 1, '#C8A0E8');
    over(img, 10, 7, rgba('#5A3A7A'));
    const glint = [[7, 6], [9, 6], [8, 5], [10, 6]][f];
    over(img, glint[0], glint[1], rgba('#FFFFFF'));
  } else if (state === 'hole') {
    ellipse(img, 8, 9, 4, 2.6, rgba('#22160F'));
    ellipse(img, 8, 10, 3, 1.4, rgba('#6A8A9A', 170));
  }
  return outline(img, '#1E140E');
}

function mudSheet() {
  const row = (st) => [0, 1, 2, 3].map((f) => mudFrame(st, f).scale(2));
  return sheet([row('bubbling'), row('calm'), row('tablet'), row('hole')], 32, 32);
}

// ───────────────────────────── Plataforma lejana (Talasa) ─────────────────────────────

function platformFrame(f) {
  const img = new Img(64, 48);
  const haze = (c, a = 255) => { const v = hex(c); return [Math.round(v[0] * 0.7 + 150 * 0.3), Math.round(v[1] * 0.7 + 175 * 0.3), Math.round(v[2] * 0.7 + 200 * 0.3), a]; };
  // patas
  for (const x of [14, 26, 38, 50]) { rect(img, x, 26, 2, 18, haze('#3C4650')); over(img, x, 26, haze('#6A7682')); }
  line(img, 15, 30, 27, 40, haze('#3C4650')); line(img, 27, 30, 39, 40, haze('#3C4650')); line(img, 39, 30, 51, 40, haze('#3C4650'));
  // cubierta
  rect(img, 8, 20, 50, 6, haze(GEN.petrol));
  rect(img, 8, 20, 50, 1, haze(GEN.petrolHi));
  rect(img, 8, 25, 50, 1, haze(GEN.petrolDk));
  // módulos blancos
  rect(img, 12, 12, 16, 8, haze(GEN.white));
  rect(img, 12, 19, 16, 1, haze(GEN.whiteDk));
  for (let x = 14; x < 27; x += 3) over(img, x, 15, haze('#5A7A8A'));
  rect(img, 32, 14, 10, 6, haze(GEN.whiteDk));
  // torre de perforación
  line(img, 46, 20, 50, 2, haze('#4A525C')); line(img, 54, 20, 50, 2, haze('#4A525C'));
  line(img, 47, 14, 53, 14, haze('#4A525C')); line(img, 48, 8, 52, 8, haze('#4A525C'));
  // grúa
  line(img, 34, 14, 34, 6, haze('#4A525C')); line(img, 34, 6, 24, 9, haze('#4A525C'));
  // luces magenta que parpadean
  const on = (i) => (f + i) % 4 < 2;
  over(img, 50, 1, on(0) ? [255, 138, 216, 255] : haze(GEN.magOff));
  over(img, 13, 11, on(1) ? [255, 138, 216, 255] : haze(GEN.magOff));
  over(img, 57, 21, on(2) ? [255, 138, 216, 255] : haze(GEN.magOff));
  // espuma en las patas
  for (const x of [14, 26, 38, 50]) { over(img, x - 1, 44, [240, 248, 255, 200]); over(img, x + 2, 44, [240, 248, 255, 200]); over(img, x, 45, [220, 238, 250, 160]); }
  return img;
}

function platformSheet() {
  const frames = [0, 1, 2, 3].map((f) => platformFrame(f).scale(2));
  return sheet([frames, frames, frames, frames], 128, 96);
}

// ───────────────────────────── Prismáticos del muelle ─────────────────────────────

function binocularsFrame() {
  const img = new Img(16, 32);
  ellipse(img, 8, 30, 4, 1.3, rgba('#000000', 60));
  rect(img, 7, 16, 2, 14, '#5A6470');
  rect(img, 7, 16, 1, 14, '#8A96A2');
  rect(img, 5, 28, 6, 2, '#4A525C');
  // cabeza
  rect(img, 4, 9, 8, 7, '#3E7FA8');
  rect(img, 4, 9, 8, 1, '#6AAED6');
  rect(img, 11, 9, 1, 7, '#2A5A7A');
  // oculares
  disc(img, 6, 8, 1.6, '#2B2D31'); disc(img, 10, 8, 1.6, '#2B2D31');
  over(img, 6, 7, rgba('#9AD0F0')); over(img, 10, 7, rgba('#9AD0F0'));
  // ranura de monedas
  rect(img, 7, 12, 2, 1, '#F2D24A');
  return outline(img, '#1A2028');
}

function binocularsSheet() {
  const f = binocularsFrame().scale(2);
  return sheet([[f, f, f, f], [f, f, f, f], [f, f, f, f], [f, f, f, f]], 32, 64);
}

// ───────────────────────────── Maletín de campo de Alerce ─────────────────────────────

function kitFrame(f) {
  const img = new Img(16, 16);
  ellipse(img, 8, 14, 7, 1.4, rgba('#000000', 70));
  // tapa abierta
  rect(img, 2, 3, 12, 4, '#6A4426');
  rect(img, 3, 4, 10, 2, '#8A5A34');
  // caja
  rect(img, 2, 7, 12, 6, '#7A4E2C');
  rect(img, 2, 7, 12, 1, '#A06A3C');
  rect(img, 3, 8, 10, 4, '#3A2618');
  // frascos
  const vial = ['#7ACBE8', '#A8D86A', '#D8C07A'];
  vial.forEach((c, i) => { rect(img, 4 + i * 2, 8, 1, 3, c); over(img, 4 + i * 2, 8, rgba('#FFFFFF', 200)); });
  // medidor de aguja
  rect(img, 10, 8, 3, 3, '#E8E4D8');
  const needle = [[11, 9], [12, 9], [11, 8], [12, 8]][f];
  over(img, needle[0], needle[1], rgba('#C8302A'));
  over(img, 11, 10, rgba('#2B2D31'));
  // cierres
  over(img, 5, 12, rgba('#C8B070')); over(img, 10, 12, rgba('#C8B070'));
  return outline(img, '#24160C');
}

function kitSheet() {
  const row = [0, 1, 2, 3].map((f) => kitFrame(f).scale(2));
  return sheet([row, row, row, row], 32, 32);
}

// ───────────────────────────── Boya ─────────────────────────────

function buoyFrame(f) {
  const img = new Img(16, 16);
  const bob = [0, 1, 1, 0][f];
  ellipse(img, 8, 13, 6, 1.6, rgba('#E8F4FF', 150));
  rect(img, 5, 7 + bob, 6, 6, '#E8483A');
  rect(img, 5, 9 + bob, 6, 2, '#F2F4F5');
  rect(img, 5, 7 + bob, 1, 6, '#F27A6A');
  rect(img, 7, 3 + bob, 2, 4, '#4A525C');
  over(img, 7, 2 + bob, rgba(f < 2 ? '#FFF27A' : '#B8A850'));
  over(img, 8, 2 + bob, rgba(f < 2 ? '#FFF27A' : '#B8A850'));
  return outline(img, '#2A1414');
}

function buoySheet() {
  const row = [0, 1, 2, 3].map((f) => buoyFrame(f).scale(2));
  return sheet([row, row, row, row], 32, 32);
}

// ───────────────────────────── Salida ─────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const pump = save(pumpSheet(), 'b09b_bomba.png');
  const stake = save(stakeSheet(), 'b09b_estaca.png');
  const mud = save(mudSheet(), 'b09b_lodo.png');
  const plat = save(platformSheet(), 'b09b_plataforma.png');
  const bino = save(binocularsSheet(), 'b09b_prismaticos.png');
  const kit = save(kitSheet(), 'b09b_maletin.png');
  const buoy = save(buoySheet(), 'b09b_boya.png');
  if (process.argv.includes('--preview')) {
    const opts = { scale: 2, bg: '#8A9A6A' };
    files.push(preview(pump, opts).save(path.join(PREVIEW, 'b09b_bomba.png')));
    files.push(preview(stake, opts).save(path.join(PREVIEW, 'b09b_estaca.png')));
    files.push(preview(mud, opts).save(path.join(PREVIEW, 'b09b_lodo.png')));
    files.push(preview(plat, { scale: 2, bg: '#3A7AC8' }).save(path.join(PREVIEW, 'b09b_plataforma.png')));
    files.push(preview(bino, opts).save(path.join(PREVIEW, 'b09b_prismaticos.png')));
    files.push(preview(kit, opts).save(path.join(PREVIEW, 'b09b_maletin.png')));
    files.push(preview(buoy, { scale: 2, bg: '#3A7AC8' }).save(path.join(PREVIEW, 'b09b_boya.png')));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b09b_assets: ${err.message}`);
  process.exitCode = 1;
}
