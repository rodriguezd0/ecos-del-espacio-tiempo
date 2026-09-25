// Arte propio del Bloque 20 — Pilar del Origen (PROVISIONAL, D30) con tools/pixel.mjs.
// Uso: node tools/b20_assets.mjs [--preview]
// Hojas de evento 4×4 (índice de fotograma = fila·4 + columna; fila 0 = dir 2, 1 = dir 4, 2 = dir 6, 3 = dir 8):
//   objects/b20_nicho.png          32×64  nicho de la Puerta de las Quince (0 vacío; 1–15 con la Tablilla T01–T15 encendida)
//   objects/b20_nicho_arceus.png   32×64  uno de los tres nichos del centro (fila 0: oscuro con un latido muy tenue)
//   objects/b20_haz.png            32×32  tramo de camino proyectado sobre el vacío (fila 0: brillo que recorre la losa)
//   objects/b20_fragmento.png      32×32  Fragmento Azur flotando (fila 0: giro con destello)
//   objects/b20_puerta.png         96×64  losa de la Puerta de las Quince (0 cerrada; 1–3 hundiéndose; 4 = vacío)
//   objects/b20_reja.png           32×64  reja del túnel de la cisterna (0 presente caída · 1 presente alzada ·
//                                         2 eco bajada · 3 eco alzada)
// Paleta: piedra clara del fondo de la Sima con el oro del P10 (el mapa añade el tono) y los colores de tipo.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Img, hex, outline, preview, sheet } from './pixel.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'game', 'assets', 'objects');
const PREVIEW = path.join(ROOT, 'tools', 'cache', 'pixel');

const rgba = (c, a = 255) => { const v = Array.isArray(c) ? [...c, 255] : hex(c); return [v[0], v[1], v[2], a]; };
const STONE = { light: '#E6DECF', mid: '#BFB39C', dark: '#8E826C', deep: '#4E4638', out: '#2E281F' };
const GOLD = { hi: '#FFF4C4', mid: '#F2CC5C', deep: '#B88A22' };
/** Colores de tipo de las quince Tablillas (T01…T15: Planta, Agua, Eléctrico, Roca, Lucha, Acero, Bicho, Veneno,
 * Psíquico, Siniestro, Hada, Fuego, Hielo, Volador, Dragón). */
const TYPE = ['#78C850', '#6890F0', '#F8D030', '#B8A038', '#C03028', '#B8B8D0', '#A8B820', '#A040A0', '#F85888', '#705848', '#EE99AC', '#F08030', '#98D8D8', '#A890F0', '#7038F8'];

function over(img, x, y, c) {
  if (!img.inside(x, y)) return;
  const [r, g, b, a] = img.get(x, y);
  const t = c[3] / 255;
  if (a === 0) { img.set(x, y, c); return; }
  img.set(x, y, [Math.round(r * (1 - t) + c[0] * t), Math.round(g * (1 - t) + c[1] * t), Math.round(b * (1 - t) + c[2] * t), Math.max(a, c[3])]);
}
const rect = (img, x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) over(img, x, y, c); };
function disc(img, cx, cy, r, c) {
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= r * r) over(img, x, y, c);
  }
}
function hexagon(img, cx, cy, r, c) {
  for (let y = -r; y <= r; y++) {
    const half = Math.round(r - Math.abs(y) * 0.5);
    for (let x = -half; x <= half; x++) over(img, cx + x, cy + y, c);
  }
}
function gridSheet(frames, w, h) {
  const rows = [0, 1, 2, 3].map((r) => [0, 1, 2, 3].map((c) => frames[r * 4 + c] || new Img(w, h)));
  return sheet(rows, w, h);
}

// ─────────────────────────────── Nichos ───────────────────────────────

/** Nicho tallado en la pared (16×32 de arte): arco de piedra y hueco. `tablet` = índice 0–14 o null. */
function nicheFrame(tablet) {
  const img = new Img(16, 32);
  rect(img, 1, 6, 14, 24, rgba(STONE.mid));
  rect(img, 2, 5, 12, 1, rgba(STONE.light));
  rect(img, 3, 4, 10, 1, rgba(STONE.light));
  rect(img, 1, 29, 14, 2, rgba(STONE.dark));
  // hueco
  rect(img, 4, 8, 8, 17, rgba(tablet === null ? '#1A160F' : '#2C2410'));
  rect(img, 5, 7, 6, 1, rgba(tablet === null ? '#1A160F' : '#2C2410'));
  // repisa
  rect(img, 3, 25, 10, 2, rgba(STONE.light));
  rect(img, 3, 27, 10, 1, rgba(STONE.dark));
  if (tablet === null) {
    // ranura vacía con un hexágono gastado
    hexagon(img, 8, 16, 3, rgba(STONE.deep));
    return outline(img, STONE.out);
  }
  const col = TYPE[tablet];
  // resplandor dorado y la Tablilla de pie en el hueco
  rect(img, 4, 8, 8, 17, rgba(GOLD.deep, 110));
  rect(img, 5, 11, 6, 13, rgba(col));
  rect(img, 5, 11, 6, 1, rgba('#FFFFFF', 160));
  rect(img, 5, 23, 6, 1, rgba(STONE.out, 160));
  hexagon(img, 8, 17, 2, rgba(GOLD.hi));
  for (const [x, y] of [[4, 9], [11, 10], [3, 20], [12, 22], [8, 7]]) over(img, x, y, rgba(GOLD.hi, 220));
  rect(img, 3, 25, 10, 1, rgba(GOLD.mid));
  return outline(img, STONE.out);
}

/** Nicho del centro (Arceus): siempre oscuro; `pulse` 0–3 aviva un poco el hexágono. */
function arceusNicheFrame(pulse) {
  const img = new Img(16, 32);
  rect(img, 1, 6, 14, 24, rgba(STONE.dark));
  rect(img, 2, 5, 12, 1, rgba(STONE.mid));
  rect(img, 3, 4, 10, 1, rgba(STONE.mid));
  rect(img, 4, 8, 8, 17, rgba('#0C0A08'));
  rect(img, 5, 7, 6, 1, rgba('#0C0A08'));
  rect(img, 3, 25, 10, 2, rgba(STONE.mid));
  const a = [40, 70, 100, 70][pulse];
  hexagon(img, 8, 16, 4, rgba(GOLD.deep, a));
  hexagon(img, 8, 16, 2, rgba('#0C0A08'));
  return outline(img, STONE.out);
}

// ─────────────────────────────── Camino proyectado ───────────────────────────────

function beamFrame(step) {
  const img = new Img(16, 16);
  rect(img, 1, 1, 14, 14, rgba(GOLD.mid, 90));
  rect(img, 2, 2, 12, 12, rgba(GOLD.hi, 70));
  for (let i = 0; i < 16; i++) {
    const x = (i + step * 4) % 16;
    over(img, x, i, rgba('#FFFFFF', 110));
    over(img, (x + 1) % 16, i, rgba(GOLD.hi, 90));
  }
  hexagon(img, 8, 8, 3, rgba(GOLD.hi, 120));
  rect(img, 1, 1, 14, 1, rgba(GOLD.hi, 160));
  rect(img, 1, 14, 14, 1, rgba(GOLD.deep, 160));
  return img;
}

// ─────────────────────────────── Fragmento Azur ───────────────────────────────

function shardFrame(step) {
  const img = new Img(16, 16);
  const w = [3, 2, 1, 2][step];
  for (let y = 3; y <= 12; y++) {
    const half = Math.max(0, Math.round(w * (1 - Math.abs(y - 7.5) / 5)));
    for (let x = -half; x <= half; x++) over(img, 8 + x, y, rgba(y < 7 ? '#9CD4FF' : '#4E8CE8'));
  }
  over(img, 8, 3, rgba('#FFFFFF'));
  if (step === 0) for (const [x, y] of [[5, 5], [11, 4], [10, 11]]) over(img, x, y, rgba('#FFFFFF', 200));
  return outline(img, '#1C3A70');
}

// ─────────────────────────────── Losa de la Puerta ───────────────────────────────

/** Losa de la Puerta de las Quince (48×32 de arte = 3×2 casillas): 0 cerrada; 1–3 hundiéndose; 4 abierta. */
function doorFrame(sink) {
  const img = new Img(48, 32);
  if (sink >= 4) return img;
  const top = Math.round(sink * 7);
  rect(img, 1, top, 46, 32 - top, rgba(STONE.mid));
  rect(img, 2, top + 1, 44, 1, rgba(STONE.light));
  rect(img, 23, top, 2, 32 - top, rgba(STONE.dark)); // junta de las hojas
  if (sink === 0) {
    for (let x = 4; x < 44; x += 6) hexagon(img, x + 2, 9, 2, rgba(GOLD.deep, 170)); // banda de hexágonos
    hexagon(img, 24, 20, 5, rgba(STONE.dark));
    hexagon(img, 24, 20, 3, rgba(GOLD.mid));
  }
  rect(img, 1, 30, 46, 2, rgba(STONE.dark));
  return outline(img, STONE.out);
}

// ─────────────────────────────── Reja de la cisterna ───────────────────────────────

/** Reja del túnel de la cisterna (16×32): presente caída/alzada (óxido y algas) · eco bajada/alzada (bronce limpio). */
function grateFrame(era, raised) {
  const img = new Img(16, 32);
  const bar = era === 'eco' ? '#C89A48' : '#6A5A44';
  const hi = era === 'eco' ? '#F2D48A' : '#8A7A5C';
  const y0 = raised ? 2 : 14;
  const h = raised ? 8 : 18;
  rect(img, 0, y0, 16, 2, rgba(bar));
  for (let x = 1; x < 16; x += 3) { rect(img, x, y0, 2, h, rgba(bar)); rect(img, x, y0, 1, h, rgba(hi)); }
  rect(img, 0, y0 + h - 2, 16, 2, rgba(bar));
  if (era !== 'eco') for (const [x, y] of [[3, y0 + 4], [9, y0 + h - 5], [13, y0 + 2]]) rect(img, x, y, 2, 2, rgba('#3E7A52', 200));
  return outline(img, STONE.out);
}

// ─────────────────────────────── Salida ───────────────────────────────

function build() {
  const files = [];
  const save = (img, name) => { files.push(img.save(path.join(OUT, name))); return img; };
  const outs = {
    nicho: save(gridSheet([nicheFrame(null), ...TYPE.map((_, i) => nicheFrame(i))].map((f) => f.scale(2)), 32, 64), 'b20_nicho.png'),
    nicho_arceus: save(gridSheet([0, 1, 2, 3].map((p) => arceusNicheFrame(p).scale(2)), 32, 64), 'b20_nicho_arceus.png'),
    haz: save(gridSheet([0, 1, 2, 3].map((s) => beamFrame(s).scale(2)), 32, 32), 'b20_haz.png'),
    fragmento: save(gridSheet([0, 1, 2, 3].map((s) => shardFrame(s).scale(2)), 32, 32), 'b20_fragmento.png'),
    puerta: save(gridSheet([0, 1, 2, 3, 4].map((s) => doorFrame(s).scale(2)), 96, 64), 'b20_puerta.png'),
    reja: save(gridSheet([
      grateFrame('presente', false).scale(2), grateFrame('presente', true).scale(2),
      grateFrame('eco', false).scale(2), grateFrame('eco', true).scale(2),
    ], 32, 64), 'b20_reja.png'),
  };
  if (process.argv.includes('--preview')) {
    for (const [k, img] of Object.entries(outs)) files.push(preview(img, { scale: 2, bg: '#1E1A14' }).save(path.join(PREVIEW, `b20_${k}.png`)));
  }
  for (const f of files) console.log(path.relative(ROOT, f));
}

try {
  build();
} catch (err) {
  console.error(`b20_assets: ${err.message}`);
  process.exitCode = 1;
}
