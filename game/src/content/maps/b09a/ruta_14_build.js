// Construcción de la Ruta 14 y la Reserva del Delta con el MapBuilder (tileset 6, ExteriorSafari). Coordenadas:
// ruta_14_layout.js. Hierba de sabana, camino de arena, brazos del delta con orilla y pasarelas de tablones, arboledas
// frondosas, la valla de postes de la Reserva, la laguna con playa, la pradera de flores, el huerto en hileras y el
// seto que separa la Reserva interior.
import { W, H, PATH, WATER, BRIDGES, FENCE, RESERVE, GRASS } from './ruta_14_layout.js';

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
const inMap = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;
const cells = (list) => list.flatMap(([x, y, w, h]) => rect(x, y, w, h)).filter(inMap);

const T = (x, y) => 384 + y * 8 + x;
/**
 * Tablero de la pasarela: la fila 481 del embarcadero de ExteriorSafari (4232–4234), la única del muelle que Añil deja
 * pisar entera (sus filas bajas bloquean todas las direcciones: con el stamp `muelle` el puente no se podía cruzar).
 */
const PLANK = Object.freeze([T(0, 481), T(1, 481), T(2, 481)]);

const waterSet = () => new Set(cells([WATER.channelA, WATER.channelB, WATER.lagoon]).map(([x, y]) => `${x},${y}`));

function forests(b) {
  // Bandas de alto 4k+2 (docs/stamps.md «Bosque»): la última fila es de troncos y el borde no deja pasillos. Arriba
  // basta con 2 (las copas siguen fuera del mapa).
  const blocks = [
    // Norte (hueco del camino de Lúmina en x 28–31)
    ['bosque', 0, 0, 28, 2], ['bosque', 32, 0, 28, 2],
    // Oeste (cortado solo por los dos brazos, que entran por el borde) y este
    ['bosque_sabana', 0, 2, 3, 15], ['bosque_sabana', 0, 20, 3, 25], ['bosque_sabana', 0, 48, 3, 12],
    ['bosque_sabana', 57, 2, 3, 58],
    // Sur (hueco del camino de Nexo en x 28–31)
    // (entre la arboleda de la sabana, de árboles 3×7, y el bosque de 2×6 queda una columna de matas: sin medios árboles)
    ['bosque', 4, 54, 24, 6], ['bosque', 32, 54, 24, 6],
    // Arboledas interiores de la ruta
    ['bosque', 18, 10, 8, 6], ['bosque', 3, 36, 6, 6], ['bosque', 20, 26, 6, 6],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h).filter(inMap));
}

function water(b) {
  const list = [WATER.channelA, WATER.channelB, WATER.lagoon];
  const c = cells(list);
  b.paint('agua', c);
  b.paint('orilla', c);
}

/** Camino de arena sin pisar el agua (el camino cruza los brazos solo por las pasarelas). */
function sandPath(b) {
  const water = waterSet();
  b.paint('camino_arena', cells(PATH).filter(([x, y]) => !water.has(`${x},${y}`)));
}

/**
 * Pasarelas N–S de tablones. Bajo el tablero el suelo deja de ser agua (si no, al pulsar A a lo largo del tablero
 * saltaría el aviso de nadar); la orilla de las columnas vecinas sigue dibujando el agua por debajo.
 */
function bridges(b) {
  const water = waterSet();
  for (const { x, y, h } of BRIDGES) {
    for (const [cx, cy] of rect(x, y, 3, h)) {
      if (water.has(`${cx},${cy}`)) b.paint('cesped', [[cx, cy]]);
      b.set(1, cx, cy, PLANK[cx - x]);
      b.set(2, cx, cy, 0);
    }
  }
}

function fence(b) {
  const f = FENCE;
  const posts = [];
  for (let y = f.y0; y <= f.y1; y++) {
    if (y >= f.gate.y0 && y <= f.gate.y1) continue;
    if (y >= f.water.y0 && y <= f.water.y1) continue;
    posts.push([f.x, y]);
  }
  b.paint('valla_postes', posts);
}

function reserve(b) {
  const r = RESERVE;
  b.paint('cesped_claro', cells([r.meadow, r.orchard, [37, 22, 7, 10]]));
  b.paint('camino_tierra', cells([[37, 33, 9, 4], [37, 23, 4, 11], [41, 29, 13, 2], [45, 33, 3, 16], [42, 50, 8, 2]]));
  // Huerto: frutales en hileras (el manzano viejo del árbol de miel en SPOTS.honeyTree)
  for (const [x, y] of [[40, 37], [54, 35], [40, 41], [54, 41], [50, 36]]) b.stamp('arbol', x, y);
  b.stamp('arbol', 43, 37);
  // Seto entre el huerto y la Reserva interior (con el paso del enjambre)
  const hedge = [];
  for (let x = r.hedge.x0; x <= r.hedge.x1; x++) if (!r.hedge.gap.includes(x)) hedge.push([x, r.hedge.y]);
  for (const [x, y] of hedge) b.stamp('mata', x, y);
  // Puesto de guardas junto a la puerta
  b.stamp(r.post.stamp, r.post.x, r.post.y);
}

function details(b) {
  for (const [s, x, y] of [
    // Ruta: helechos, matorrales, rocas, tocones y árboles sueltos (nada sobre el camino ni sobre la hierba alta)
    ['helechos', 5, 15], ['helechos', 22, 20], ['matorral', 8, 11], ['mata', 16, 4], ['roca_peque', 9, 21],
    ['tocon_grande', 20, 3], ['matas_redondas', 17, 2], ['roca_peque', 23, 3],
    ['arbol_grande_2', 27, 11], ['helechos', 32, 15], ['arbol_grande_2', 28, 20], ['matas_redondas', 33, 22],
    ['matorral', 21, 43], ['helechos', 5, 43], ['roca_grande', 25, 36], ['mata', 10, 40], ['matas_redondas', 8, 30],
    ['helechos', 25, 43], ['arbol_grande_2', 5, 26], ['roca_grande', 19, 50], ['helechos', 17, 53], ['arbol', 24, 48], ['arbol', 14, 48],
    ['roca_peque', 33, 12], ['matorral', 26, 31], ['tocon_grande', 32, 40],
    ['cartel_ruta', 25, 1], ['cartel_madera', 33, 37], ['cartel_madera', 32, 52], ['poste', 11, 16], ['poste', 16, 16],
    // Reserva: laguna, pradera y alrededores de la colmena
    ['arbol_grande_2', 37, 2], ['helechos', 42, 5], ['helechos', 50, 4], ['roca_grande', 55, 5], ['matas_redondas', 39, 8],
    ['mata', 38, 14], ['mata', 55, 14], ['mata', 56, 17],
    ['helechos', 38, 21], ['mata', 55, 23], ['matorral', 44, 34], ['roca_peque', 56, 36], ['mata', 38, 37],
    ['helechos', 50, 53], ['roca_peque', 39, 53], ['palmera_maceta', 29, 30],
  ]) b.stamp(s, x, y);
  b.stamp('islote_arena', 50, 14);
  for (let y = 54; y < H; y++) for (const x of [3, 56]) b.stamp('mata', x, y);
}

export function buildRuta14(b) {
  b.fill(null, 'cesped');
  forests(b);
  water(b);
  sandPath(b);
  bridges(b);
  for (const g of GRASS) b.paint('hierba_alta', rect(...g).filter(inMap));
  reserve(b);
  fence(b);
  details(b);
}
