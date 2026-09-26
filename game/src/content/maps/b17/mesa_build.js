// Construcción de la Mesa de los Vientos (tileset 1, Exterior1). Meseta de hierba sobre un mar de nubes (panorama
// propio que asoma por el vacío), con cara de roca bajo el borde; el Alto es una terraza de muros finos; caserío de
// cabañas turquesa, corral de valla blanca, molinos de viento y prados de hierba alta. Módulo puro.
import {
  W, H, MESA, AGUJA, ALTO, WISH_ROCK, LANDING, BUILDINGS, CORRAL, GRASS, PATHS, MILLS, roundRect,
} from './mesa_layout.js';
import { VOID_WALL, paintVoidEdges } from './rim.js';

/** Piezas propias del mapa. */
export const MESA_BRUSHES = Object.freeze({});

const LAND = new Set([...roundRect(MESA.x0, MESA.y0, MESA.x1, MESA.y1, MESA.r), ...roundRect(AGUJA.x0, AGUJA.y0, AGUJA.x1, AGUJA.y1, AGUJA.r)]
  .map(([x, y]) => `${x},${y}`));

/** ¿Tierra de la Mesa? */
export const isMesaLand = (x, y) => LAND.has(`${x},${y}`);
/** ¿Nube (vacío que bloquea)? */
export const isCloud = (x, y) => x >= 0 && y >= 0 && x < W && y < H && !isMesaLand(x, y);

const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

/**
 * Nubes: sin suelo (asoma el panorama `assets/panoramas/b17_nubes.png`, que se desplaza despacio) y muro invisible.
 * Bajo el borde, la cara de roca de la mesa.
 */
function paintClouds(b) {
  const clouds = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (isCloud(x, y)) clouds.push([x, y]);
  for (const [x, y] of clouds) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, VOID_WALL); }
  paintVoidEdges(b, isCloud, isMesaLand, { W, H });
}

/** Panorama del mar de nubes (render/panorama.js). */
export const MESA_PANORAMA = Object.freeze({ image: 'assets/panoramas/b17_nubes.png', parallax: 0.4, scroll: [5, 1] });

function paintGround(b) {
  const seen = new Set();
  const path = [];
  for (const [x0, y0, x1, y1] of PATHS) for (const [x, y] of rect(x0, y0, x1, y1)) if (!seen.has(`${x},${y}`)) { seen.add(`${x},${y}`); path.push([x, y]); }
  b.paint('camino_tierra', path);
  b.paint('hierba_alta', GRASS.flatMap(([x0, y0, x1, y1]) => rect(x0, y0, x1, y1)));
  // la Aguja: roca pelada con matas
  b.paint('camino_tierra', roundRect(AGUJA.x0, AGUJA.y0, AGUJA.x1, AGUJA.y1, AGUJA.r));
}

function paintAlto(b) {
  b.blob(null, rect(ALTO.x0, ALTO.y0, ALTO.x1, ALTO.y1), 'terraza');
  b.stamp('roca_grande', WISH_ROCK.x, WISH_ROCK.y);
  for (const [s, x, y] of [['flores_blancas', 18, 5], ['flores_rosas', 23, 7], ['brotes', 20, 8], ['lupinos', 12, 7]]) b.stamp(s, x, y);
}

function paintVillage(b) {
  b.stamp('estrado', LANDING.x, LANDING.y);
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  for (const [x, y] of MILLS) b.stamp('molino', x, y);
  // corral de los Altaria: valla blanca con la puerta al sur
  const C = CORRAL;
  b.paint('valla_blanca', rect(C.x0, C.y0, C.x1, C.y0));
  b.paint('valla_blanca', [...rect(C.x0, C.y1, C.gate.x0 - 1, C.y1), ...rect(C.gate.x1 + 1, C.y1, C.x1, C.y1)]);
  b.paint('valla_blanca_v', rect(C.x0, C.y0 + 1, C.x0, C.y1 - 1));
  b.paint('valla_blanca_v', rect(C.x1, C.y0 + 1, C.x1, C.y1 - 1));
  b.paint('cesped_claro', rect(C.x0 + 1, C.y0 + 1, C.x1 - 1, C.y1 - 1));
  for (const [s, x, y] of [['tocon', 23, 16], ['troncos', 25, 16], ['arbustos', 21, 13], ['tocon', 27, 13]]) b.stamp(s, x, y);
  // detalles del caserío
  for (const [s, x, y] of [
    ['campana', 21, 24], ['cartel_madera', 22, 31], ['buzon_rojo', 9, 27], ['troncos', 9, 23], ['banco', 11, 26],
    ['macizo_flores', 4, 30], ['flores_blancas', 11, 30], ['flores_rosas', 13, 31], ['lupinos', 26, 20],
    ['jardinera_flores', 27, 27], ['farola_hierro', 14, 26], ['farola_hierro', 21, 28],
  ]) b.stamp(s, x, y);
}

function paintWild(b) {
  // rocas, matas y flores en los prados y en el borde (el viento las tumba hacia el este)
  for (const [s, x, y] of [
    ['roca_grande', 7, 9], ['roca_peque', 3, 11], ['roca_gris', 12, 16], ['arbustos', 14, 18], ['flores_blancas', 15, 15],
    ['lupinos', 5, 19], ['roca_peque', 9, 33], ['flores_rosas', 16, 33], ['roca_gris', 28, 9], ['arbustos', 29, 10],
    ['flores_blancas', 30, 28], ['roca_peque', 22, 33], ['brotes', 26, 11], ['setas', 2, 15], ['roca_grande', 13, 21],
    ['arbustos', 36, 14], ['roca_peque', 35, 20], ['brotes', 38, 17],
  ]) b.stamp(s, x, y);
}

export function buildMesa(b) {
  b.fill(null, 'cesped');
  paintGround(b);
  paintAlto(b);
  paintVillage(b);
  paintWild(b);
  paintClouds(b);
}

export { W, H };
