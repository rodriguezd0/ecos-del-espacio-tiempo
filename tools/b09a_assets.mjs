// Arte propio del Bloque 9a (PROVISIONAL, D30) con tools/pixel.mjs. Uso: node tools/b09a_assets.mjs [--preview]
// Hojas de evento 4×4 (fila = dirección RMXP 2/4/6/8, columna = fotograma de stepAnime); se dibujan a la mitad
// (1 píxel de arte = 2 de pantalla, escala DS×2) y se amplían ×2:
//   objects/b09_via.png        224×32  tramo de vía de 7 casillas (balasto, traviesas y dos carriles); fila 4 = paso
//                                      a nivel con tablones
//   objects/b09_via_1.png       32×32  una casilla de vía (fila 2) o de paso a nivel (fila 4), para los remates
//   objects/b09_topera.png      32×32  topera de fin de vía (parachoques rojo y blanco)
//   objects/b09_losas.png       32×64  losa votiva de Antea sobre su palé (fila 2: cuatro réplicas con matices,
//                                      4: la original con escarcha, 6: brillo verde del Core, 8: palé vacío)
//   objects/b09_colmena.png     96×96  colmena gigante de la Reserva alrededor de «la losa que zumba» (fila 2 viva con
//                                      obreras, 4 con las tres flores delante, 6 losa al aire, 8 marcas en el suelo)
//   objects/b09_furgoneta.png  192×160 furgoneta de los «restauradores» (recorte del camión del tileset Exterior2)
//   objects/b09_derrumbe.png    32×32  cascotes del Paso del Derrumbe (columnas = variantes)
//   objects/b09_flores.png      32×32  flores de la Reserva para T07: fila 2 pradera (amarilla), 4 ribera (lila),
//                                      6 huerto (azahar blanco); con polen dorado que chispea (columnas); 8 sin polen
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');
const ANIL_TILESET = path.join(ROOT, 'Pokemon Anil V4.13', 'Graphics', 'Tilesets');

const C = (s, a = 255) => { const v = hex(s); return [v[0], v[1], v[2], a]; };

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
function box(img, x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) over(img, x + i, y + j, c); }
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
  }
}
/** Hoja 4×4 con la misma fila de fotogramas en las cuatro direcciones (o filas distintas si se dan 4). */
function grid(rows, scale = 2) {
  const all = rows.length === 4 ? rows : [rows[0], rows[0], rows[0], rows[0]];
  const s = all.map((r) => r.map((f) => f.scale(scale)));
  return sheet(s, s[0][0].w, s[0][0].h);
}
const four = (f) => [f, f, f, f];

// ───────────────────────────── Vía ─────────────────────────────
const RAIL = { ballast: C('#8C8578'), ballastD: C('#6E685E'), ballastL: C('#A59E90'), sleeper: C('#6B4A2E'), sleeperD: C('#4A321E'), rail: C('#C9CDD2'), railD: C('#6C737C'), plank: C('#9C7448'), plankD: C('#6E5032') };

function railTile(len = 7 * 16, crossing = false) {
  const img = new Img(len, 16);
  for (let x = 0; x < len; x++) {
    for (let y = 1; y < 15; y++) {
      const n = (x * 7 + y * 13) % 11;
      img.set(x, y, n < 2 ? RAIL.ballastD : (n > 8 ? RAIL.ballastL : RAIL.ballast));
    }
  }
  for (let x = 1; x < len; x += 4) { box(img, x, 2, 2, 12, RAIL.sleeper); box(img, x + 1, 2, 1, 12, RAIL.sleeperD); }
  if (crossing) {
    box(img, 0, 3, len, 10, RAIL.plank);
    for (let x = 0; x < len; x += 6) box(img, x, 3, 1, 10, RAIL.plankD);
  }
  for (const y of [5, 10]) { box(img, 0, y, len, 1, RAIL.rail); box(img, 0, y + 1, len, 1, RAIL.railD); }
  return img;
}

function stopBlock() {
  const img = new Img(16, 16);
  box(img, 1, 4, 14, 9, C('#B03A2E'));
  for (let x = 2; x < 14; x += 4) box(img, x, 5, 2, 7, C('#F2F4F5'));
  box(img, 1, 12, 14, 2, C('#4A321E'));
  box(img, 2, 2, 2, 3, C('#6C737C'));
  box(img, 12, 2, 2, 3, C('#6C737C'));
  return outline(img, '#2B2D31');
}

// ───────────────────────────── Losas ─────────────────────────────
const SLAB = { metal: C('#6D7A86'), metalL: C('#96A3AE'), metalD: C('#46515B'), verd: C('#6FA38F'), pallet: C('#A77B4B'), palletD: C('#6E5032'), tag: C('#F2E8C8'), frost: C('#E8F6FF', 200) };

function slab(variant = 0, { frost = false, glow = false, empty = false } = {}) {
  const img = new Img(16, 32);
  box(img, 1, 26, 14, 4, SLAB.pallet);
  for (let x = 2; x < 15; x += 4) box(img, x, 29, 2, 2, SLAB.palletD);
  box(img, 1, 26, 14, 1, SLAB.palletD);
  if (empty) return outline(img, '#2B2D31');
  box(img, 3, 6, 10, 20, SLAB.metal);
  box(img, 3, 6, 10, 1, SLAB.metalL);
  box(img, 3, 6, 1, 20, SLAB.metalL);
  box(img, 12, 7, 1, 19, SLAB.metalD);
  // relieve y verdín (varía un poco en cada réplica)
  box(img, 5, 9 + (variant % 2), 6, 1, SLAB.metalD);
  box(img, 5, 13, 6, 1, SLAB.metalD);
  box(img, 6, 16 + (variant % 3), 4, 3, SLAB.metalL);
  over(img, 4 + variant, 22, SLAB.verd); over(img, 5 + variant, 23, SLAB.verd); over(img, 10 - variant, 20, SLAB.verd);
  // grieta en Y (abajo a la izquierda)
  over(img, 4, 24, SLAB.metalD); over(img, 5, 23, SLAB.metalD); over(img, 5, 22, SLAB.metalD); over(img, 6, 23, SLAB.metalD);
  // etiqueta de papel
  box(img, 9, 23, 4, 3, SLAB.tag);
  if (frost) for (const [x, y] of [[4, 7], [8, 7], [11, 8], [4, 12], [11, 15], [5, 19], [10, 24]]) over(img, x, y, SLAB.frost);
  if (glow) { for (let y = 5; y < 27; y++) { over(img, 2, y, C('#B9FF66', 150)); over(img, 13, y, C('#B9FF66', 150)); } }
  return outline(img, '#2B2D31');
}

// ───────────────────────────── Colmena ─────────────────────────────
const HIVE = { comb: C('#E3B341'), combL: C('#F6D77A'), combD: C('#A8741E'), wax: C('#C98F2A'), stone: C('#7C8378'), stoneD: C('#555B53'), bee: C('#F4D23A'), beeD: C('#2B2D31') };

function hive(mode, frame) {
  const img = new Img(48, 48);
  // losa de piedra (base)
  box(img, 14, 36, 20, 9, HIVE.stone);
  box(img, 14, 36, 20, 1, C('#9AA196'));
  box(img, 14, 44, 20, 1, HIVE.stoneD);
  if (mode === 'bare') {
    for (let i = 0; i < 3; i++) { const y = 30 - i * 4 - (frame % 2); box(img, 18 + i * 4, y, 3, 1, C('#FFFFFF', 150)); }
    for (let x = 17; x < 32; x += 3) over(img, x, 40, C('#5C8A3A'));
    return outline(img, '#2B2D31');
  }
  if (mode === 'marks') {
    for (const [x, y] of [[16, 40], [22, 42], [29, 39], [31, 43]]) box(img, x, y, 3, 1, HIVE.stoneD);
    return img;
  }
  // panal: elipse de celdas hexagonales
  for (let y = 4; y < 40; y++) {
    for (let x = 6; x < 42; x++) {
      const dx = (x + 0.5 - 24) / 18;
      const dy = (y + 0.5 - 22) / 19;
      if (dx * dx + dy * dy > 1) continue;
      const cell = ((Math.floor(y / 3) % 2 ? x + 1 : x) % 4 === 0) || y % 3 === 0;
      img.set(x, y, cell ? HIVE.combD : ((x + y) % 7 === 0 ? HIVE.combL : HIVE.comb));
    }
  }
  box(img, 20, 34, 8, 4, HIVE.beeD); // boca de la colmena
  box(img, 21, 35, 6, 2, C('#1A1A1E'));
  // obreras alrededor
  const bees = [[4, 10], [40, 14], [8, 30], [42, 32], [30, 2], [14, 3]];
  bees.forEach(([bx, by], i) => {
    const x = bx + ((frame + i) % 2) * 2 - 1;
    const y = by + (((frame + i) >> 1) % 2);
    box(img, x, y, 3, 2, HIVE.bee); over(img, x + 1, y, HIVE.beeD); over(img, x + 1, y - 1, C('#FFFFFF', 200));
  });
  if (mode === 'flowers') {
    for (const [x, c] of [[12, '#F4D23A'], [22, '#B98BE0'], [32, '#FFFFFF']]) { disc(img, x + 2, 44, 2.2, C(c)); over(img, x + 2, 44, C('#E8A02A')); box(img, x + 2, 46, 1, 2, C('#4E8A36')); }
  }
  return outline(img, '#2B2D31');
}

// ───────────────────────────── Cascotes ─────────────────────────────
function rubble(v) {
  const img = new Img(16, 16);
  const base = [C('#8A7A66'), C('#9C8B74'), C('#7A6A58'), C('#A08C70')][v % 4];
  const rocks = [[[5, 10, 5], [11, 9, 4], [8, 5, 3.5]], [[4, 9, 4], [10, 10, 5], [12, 5, 3]], [[8, 9, 6], [3, 12, 3], [13, 12, 3]], [[6, 7, 4.5], [11, 11, 4.5], [3, 12, 3]]][v % 4];
  for (const [x, y, r] of rocks) {
    disc(img, x, y, r, base);
    disc(img, x - 1, y - 1, r * 0.55, C('#C2B198', 180));
  }
  box(img, 2, 13, 12, 2, C('#6A5A48', 160));
  return outline(img, '#3A2E24');
}

// ───────────────────────────── Flores de T07 ─────────────────────────────
function flower(color, center, frame, pollen) {
  const img = new Img(16, 16);
  box(img, 7, 8, 1, 7, C('#4E8A36'));
  box(img, 5, 12, 2, 1, C('#5E9E42')); box(img, 9, 11, 2, 1, C('#5E9E42'));
  for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]]) disc(img, 7.5 + dx * 0.9, 6.5 + dy * 0.9, 1.8, C(color));
  disc(img, 7.5, 6.5, 1.6, C(center));
  let out = outline(img, '#2B3A24');
  if (pollen) {
    const sparks = [[3, 2], [12, 3], [2, 9], [13, 8], [7, 0]];
    for (let i = 0; i < 2; i++) { const [x, y] = sparks[(frame + i * 2) % sparks.length]; over(out, x, y, C('#FFE066')); over(out, x + 1, y, C('#FFF4B0', 200)); }
  }
  return out;
}

// ───────────────────────────── Furgoneta (recorte del tileset) ─────────────────────────────
function van() {
  const src = Img.load(path.join(ANIL_TILESET, 'Exterior2.png'));
  // El camión de Exterior2 (stamp `caravana`, filas 338–342, columnas 0–5; ID = 384 + fila·8 + col).
  return src.crop(0, (338 - 0) * 32, 6 * 32, 5 * 32);
}

// ───────────────────────────── Salida ─────────────────────────────
function save(name, img) {
  const file = img.save(path.join(OUT, name));
  if (process.argv.includes('--preview')) preview(img, { scale: 2 }).save(path.join(PREVIEW, name));
  console.log(`→ ${path.relative(ROOT, file)} (${img.w}×${img.h})`);
}

save('b09_via.png', grid([four(railTile()), four(railTile(112, true)), four(railTile()), four(railTile())]));
save('b09_via_1.png', grid([four(railTile(16)), four(railTile(16, true)), four(railTile(16)), four(railTile(16))]));
save('b09_topera.png', grid([four(stopBlock())]));
save('b09_losas.png', grid([
  [0, 1, 2, 3].map((v) => slab(v)),
  four(slab(1, { frost: true })),
  four(slab(1, { frost: true, glow: true })),
  four(slab(0, { empty: true })),
]));
save('b09_colmena.png', grid([
  [0, 1, 2, 3].map((f) => hive('live', f)),
  [0, 1, 2, 3].map((f) => hive('flowers', f)),
  [0, 1, 2, 3].map((f) => hive('bare', f)),
  four(hive('marks', 0)),
]));
save('b09_derrumbe.png', grid([[0, 1, 2, 3].map(rubble)]));
save('b09_flores.png', grid([
  [0, 1, 2, 3].map((f) => flower('#F4D23A', '#E07A1E', f, true)),
  [0, 1, 2, 3].map((f) => flower('#B98BE0', '#F4D23A', f, true)),
  [0, 1, 2, 3].map((f) => flower('#FFFFFF', '#F4D23A', f, true)),
  [flower('#F4D23A', '#E07A1E', 0, false), flower('#B98BE0', '#F4D23A', 0, false), flower('#FFFFFF', '#F4D23A', 0, false), flower('#F28CB0', '#F4D23A', 0, false)],
]));
{
  const v = van();
  save('b09_furgoneta.png', sheet([four(v), four(v), four(v), four(v)], v.w, v.h));
}
