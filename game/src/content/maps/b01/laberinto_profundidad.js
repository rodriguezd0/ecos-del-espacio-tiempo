// Laberinto de la Profundidad (X03, D04) — laberinto PRIVADO de setos altos y muros viejos con liquen,
// levantado hace generaciones sobre vestigios antiguos. Entrada al sur (camino norte de Villa Alba).
// B01 §4.5: sigilo (el policía patrulla el pasillo central y el jardín del este) y §4.6: cámara derruida
// del centro con el Core. Tileset 7. Guiones en content/events/b01_north_stealth.js y b01_north_core.js.
import { stealthEvents, SAFE_SPOT } from '../../events/b01_north_stealth.js';
import { coreChamberEvents } from '../../events/b01_north_core.js';
import { layoutHedges, paintHedges } from './laberinto_setos.js';

const W = 40;
const H = 34;

/** Entrada (fila inferior) alineada con el camino norte de Villa Alba: x 19–20 aquí = x 22–23 allí. */
export const LAB_ENTRY = Object.freeze({ x0: 19, x1: 20, y: H - 1 });
/** Desplazamiento de la conexión con Villa Alba (x del pueblo = x del laberinto + VILLA_OFFSET). */
export const VILLA_OFFSET = 3;

// Zonas: cámara (x 12–27, y 9–13) bajo un muro de roca con liquen; jardines viejos a los lados
// (x 4–10 y 29–35, y 6–13); pasillo de patrulla (y 16); pasillo inferior (y 19); patio de entrada
// (x 14–25, y 22–27) y rincones laterales (y 22–25). Setos: tramos horizontales [x0, x1, y] (2 filas)
// y verticales [x, y0, y1].
const BANDS = [
  [4, 5, 14], [8, 18, 14], [21, 31, 14], [34, 35, 14], // B2: huecos 6–7 (jardín O), 19–20 (cámara), 32–33 (jardín E)
  [4, 7, 17], [10, 29, 17], [32, 35, 17], // B1: huecos 8–9 y 30–31
  [4, 7, 20], [10, 18, 20], [21, 29, 20], [32, 35, 20], // B3: huecos 8–9, 19–20 (patio) y 30–31
  [4, 13, 26], [26, 35, 26], // B4: cierre del patio
];
const VERTS = [[11, 6, 13], [28, 6, 13], [13, 22, 25], [26, 22, 25]];

/** Bosque y roca: los setos que tocan estas casillas no se rematan. */
const isWall = (x, y) => x < 4 || x > 35 || y < 6 || y >= 28 || (y < 9 && x >= 12 && x <= 27);

export const HEDGES = layoutHedges(BANDS, VERTS, { walls: isWall });

/** Cámara derruida: suelo hundido, boquete, cascotes. */
export const CHAMBER = Object.freeze({
  x0: 12, y0: 9, x1: 27, y1: 13, door: [19, 20], pit: { x: 18, y: 9 }, core: { x: 20, y: 11 },
});

function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

const t = (col, row) => 384 + row * 8 + col;
const TILES = Object.freeze({
  boulder: [[t(5, 15), t(6, 15)], [t(5, 16), t(6, 16)]], // canto gris 2×2
  pebbles: t(6, 14),
  stones: t(3, 6),
  tealRock: t(6, 48),
  cracked: [t(0, 219), t(1, 219), t(0, 220), t(1, 220)], // losa blanca agrietada
  slab: { l: t(0, 136), m: [t(1, 136), t(2, 136), t(3, 136), t(4, 136)], r: t(5, 136) },
});

function paintForest(b) {
  b.paint('bosque_mixto', [
    ...rect(0, 0, 12, 6), ...rect(28, 0, 12, 6),
    ...rect(0, 6, 4, 28), ...rect(36, 6, 4, 28),
    ...rect(4, 28, 14, 6), ...rect(22, 28, 14, 6),
  ]);
}

function boulder(b, x, y) {
  TILES.boulder.forEach((row, j) => row.forEach((id, i) => b.set(2, x + i, y + j, id)));
}

/** Losas antiguas con liquen (vestigios) en el suelo de un tramo horizontal. */
function slabRow(b, x0, x1, y) {
  for (let x = x0; x <= x1; x++) {
    const id = x === x0 ? TILES.slab.l : x === x1 ? TILES.slab.r : TILES.slab.m[x % TILES.slab.m.length];
    b.set(1, x, y, id);
  }
}

function paintChamber(b) {
  const c = CHAMBER;
  b.paint('acantilado', rect(c.x0, 0, c.x1 - c.x0 + 1, c.y0)); // muro viejo de roca con liquen
  b.paint({ nine: [3, 216] }, rect(c.x0, c.y0, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1), { layer: 1 });
  // Losas agrietadas y cascotes: la cámara está derruida (no es un altar).
  [[14, 10], [15, 12], [24, 10], [25, 12], [21, 13], [16, 11]].forEach(([x, y], i) => b.set(1, x, y, TILES.cracked[i % 4]));
  b.stamp('boquete', c.pit.x, c.pit.y, { layer: 2 });
  boulder(b, 12, 9);
  boulder(b, 26, 11);
  [[13, 12], [23, 9], [17, 13], [22, 12], [15, 9]].forEach(([x, y]) => b.set(2, x, y, TILES.tealRock));
  [[14, 13], [24, 13], [17, 10], [23, 11], [26, 10]].forEach(([x, y]) => b.set(2, x, y, TILES.pebbles));
}

function paintGardens(b) {
  // Jardines viejos (oeste y este) con losas de piedra y cantos caídos.
  slabRow(b, 5, 9, 8);
  slabRow(b, 30, 34, 8);
  boulder(b, 5, 11);
  boulder(b, 33, 6);
  [[9, 12], [30, 11], [7, 6]].forEach(([x, y]) => b.set(2, x, y, TILES.tealRock));
  [[10, 7], [29, 13], [34, 12]].forEach(([x, y]) => b.set(1, x, y, TILES.stones));
  // Rincones del sur: vestigios.
  slabRow(b, 5, 8, 23);
  slabRow(b, 31, 34, 23);
  boulder(b, 5, 24);
  boulder(b, 33, 24);
  [[11, 25], [28, 25], [16, 22], [23, 22]].forEach(([x, y]) => b.set(1, x, y, TILES.stones));
  // Jardines abandonados: hierba crecida (sin encuentros: el mapa no tiene tablas), setas y brotes.
  b.rect(null, 4, 12, 3, 2, 'hierba_alta');
  b.rect(null, 33, 12, 3, 2, 'hierba_alta');
  b.rect(null, 7, 9, 2, 1, 'hierba_alta');
  for (const [s, x, y] of [
    ['setas', 10, 6], ['setas', 29, 9], ['brotes', 4, 7], ['brotes', 35, 10], ['brotes', 8, 13],
    ['tocon', 35, 8], ['setas', 12, 22], ['brotes', 27, 23], ['setas', 35, 25], ['brotes', 5, 19],
  ]) b.stamp(s, x, y);
}

export default {
  id: 'laberinto_profundidad',
  name: 'Laberinto de la Profundidad',
  tileset: 7,
  width: W,
  height: H,
  outdoor: true,
  bgm: 'tension',
  battleback: 'field',
  start: { x: SAFE_SPOT.x, y: SAFE_SPOT.y, dir: 8 },
  tone: [-26, -12, -22, 34], // penumbra de setos altos: algo más oscuro y apagado que el pueblo

  build(b) {
    b.fill(null, 'cesped');
    paintForest(b);
    paintChamber(b);
    paintGardens(b);
    b.paint('camino_tierra', rect(LAB_ENTRY.x0, 22, 2, H - 22));
    paintHedges(b, HEDGES);
    b.stamp('cartel_madera', 17, 27);
  },

  connections: [{ dir: 'south', to: 'villa_alba', offset: -VILLA_OFFSET }],

  events: [
    ...stealthEvents(),
    ...coreChamberEvents(CHAMBER),
  ],
};
