// Construcción de la Ruta 7 con el MapBuilder (tileset 5, Exterior3). Coordenadas: ruta_7_layout.js.
// Valle de hierba al pie de los riscos de la Sima: camino de tierra, vía con vallas (la vía y los cascotes son
// eventos con arte propio), apeadero abandonado sobre una terraza, estanque, pinares al sur y el Paso del Derrumbe
// entre dos macizos rocosos.
import { W, H, EXITS, PATH, CLIFFS, RAIL, PLATFORM, GRASS, POND, PASS } from './ruta_7_layout.js';
import { edgeMask } from '../pathBlend.js';

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
const inMap = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;
const cells = (list) => list.flatMap(([x, y, w, h]) => rect(x, y, w, h)).filter(inMap);

function forests(b) {
  // Alturas 2 o 4k+2 (docs/stamps.md «Bosque»): así la última fila es de troncos y el borde no deja pasillos.
  const blocks = [
    ['bosque_pinos', 0, 24, 14, 6], ['bosque_mixto', 14, 24, 24, 6], ['bosque_pinos', 38, 24, 20, 6], ['bosque', 58, 24, 14, 6],
    ['bosque_pinos', 82, 24, 8, 6],
  ];
  for (const [brush, x, y, w, h] of blocks) b.paint(brush, rect(x, y, w, h).filter(inMap));
}

function terrain(b) {
  b.fill(null, 'cesped');
  b.paint('cesped_claro', cells([[2, 7, 30, 3], [40, 8, 18, 4], [64, 7, 7, 8], [83, 7, 6, 8]]));
  for (const c of CLIFFS) b.paint('acantilado', rect(...c).filter(inMap));
  forests(b);
  const path = cells(PATH);
  b.paint('camino_tierra', path, { mask: edgeMask(b, path) }); // sin borde de hierba en las salidas
  for (const g of GRASS) b.paint('hierba_alta', rect(...g).filter(inMap));
  b.paint('estanque', rect(POND.x, POND.y, POND.w, POND.h));
}

function railway(b) {
  const gap = new Set(RAIL.crossings);
  const platform = new Set(rect(PLATFORM.terrace.x, 0, PLATFORM.terrace.w, 1).map(([x]) => x));
  const north = [];
  const south = [];
  for (let x = RAIL.x0; x <= RAIL.x1; x++) {
    if (gap.has(x)) continue;
    north.push([x, RAIL.fenceN]);
    if (!platform.has(x)) south.push([x, RAIL.fenceS]);
  }
  // La vía pasa por un balasto de tierra (capa 1); las vallas la separan del valle y del risco.
  const ballast = rect(RAIL.x0, RAIL.y, RAIL.x1 - RAIL.x0 + 1, 1);
  b.paint('camino_tierra', ballast, { mask: edgeMask(b, ballast) });
  b.paint('valla_blanca', north);
  b.paint('valla_blanca', south);
}

function platform(b) {
  const t = PLATFORM.terrace;
  b.paint('terraza', rect(t.x, t.y, t.w, t.h));
  b.paint('suelo_ciudad', rect(t.x + 1, t.y, t.w - 2, 2));
  b.stamp('escalera_terraza', PLATFORM.stairs.x, PLATFORM.stairs.y);
  b.paint('barro', rect(PLATFORM.mud.x, PLATFORM.mud.y, PLATFORM.mud.w, PLATFORM.mud.h));
  for (const [x, y] of PLATFORM.lamps) b.stamp('farola_blanca', x, y - 2);
}

function details(b, { northOpen }) {
  for (const [s, x, y] of [
    // Oeste: bosquecillo, rocas y flores junto a la entrada de Lúmina
    ['pino', 12, 11], ['arbol', 16, 10], ['roca_gris', 9, 18], ['flores_rosas', 5, 18], ['flores_blancas', 7, 19], ['tocon', 14, 13],
    ['arbustos', 26, 11], ['arbustos', 28, 11], ['arbustos', 30, 11], ['lupinos', 26, 13], ['macizo_flores', 30, 14], ['guijarros', 34, 13], ['arbustos', 32, 20],
    // Centro: estanque, rocas y el apeadero
    ['roca_gris', 29, 9], ['brotes', 20, 14], ['tocon', 33, 23], ['pino', 57, 13], ['roca_gris', 50, 11],
    ['guijarros_mina', 45, 11],
    // Este: antes del Paso
    ['arbol', 65, 13], ['pino', 68, 11], ['roca_gris', 66, 19], ['guijarros_mina', 69, 14], ['barrera_obras', 71, 15],
    ['arbol', 84, 9], ['pino', 87, 11], ['roca_gris', 83, 14], ['flores_blancas', 85, 21],
  ]) b.stamp(s, x, y);
  if (!northOpen) b.stamp('verja_puerta', EXITS.north.gate.x, EXITS.north.gate.y);
  b.stamp('cartel_ruta', 55, 8);
  b.stamp('cartel_madera', 2, 19);
  b.stamp('cartel_madera', 86, 15);
  // Paso del Derrumbe: grava suelta al pie de los macizos (decorativa)
  b.stamp('guijarros_mina', PASS.x0 + 1, PASS.y0 - 1);
  b.stamp('guijarros_mina', PASS.x0 + 5, PASS.y1 + 1);
  // Lomo de los macizos: rocas y matas (solo piezas de capa 2, para no tapar el acantilado)
  for (const [s, x, y] of [
    ['roca_gris', 74, 9], ['guijarros_mina', 77, 9], ['brotes', 80, 8], ['arbustos', 73, 23], ['roca_gris', 78, 24], ['brotes', 76, 25],
  ]) b.stamp(s, x, y);
}

/** Construcción completa. `opts.northOpen` quita la verja del Mirador de la Calzada cuando exista su mapa. */
export function buildRuta7(b, { northOpen = false } = {}) {
  terrain(b);
  railway(b);
  platform(b);
  details(b, { northOpen });
}

export const RUTA7_SIZE = Object.freeze({ W, H });
