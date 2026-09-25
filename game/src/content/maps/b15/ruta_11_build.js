// Construcción de la Ruta 11 (tileset 1, 30×70): «Vertiente nevada». Del borde norte de la meseta de Brontia (pradera
// con parches de nieve y los restos del hielo-eco) se sube por tres tramos separados por caras de terraza nevada con
// escaleras de madera: pinares nevados a los lados, hierba alta nevada, el rincón de nieve honda de C089 (Terreno
// complicado) y la repisa alta de C090 tras una roca nevada agrietada (Embestida). Coordenadas en ./layout_ruta11.js.
import { RUTA11 } from './layout_ruta11.js';
import { rect, union, openMask, decorate, snowForest, scatterDecor, reservedFrom, sealEdges } from './paint.js';
import { ruta11Events } from '../../events/b15_ruta11.js';

const R = RUTA11;

/** Fila de la línea de nieve en la columna x (ondulada). */
const snowLineAt = (x) => R.snowLine + [0, 0, 1, 1, 2, 2, 2, 1, 1, 0][x % 10];

/** Meseta de un tramo: rectángulos que salen del mapa por arriba y los lados, con el pie ondulado. */
function plateau(segments) {
  return union(...segments.map(([x0, x1, bottom]) => rect(x0, -4, x1, bottom)));
}

export const PLATEAU_BAJA = Object.freeze(plateau([[-3, 7, 44], [8, 25, 45], [26, 33, 44]]));
export const PLATEAU_ALTA = Object.freeze(plateau([[-3, 11, 23], [12, 21, 22], [22, 33, 23]]));

/** Camino de nieve pisada (camino de tierra en la pradera). */
export const PATH_CELLS = Object.freeze(union(
  rect(R.south.x0, 57, R.south.x0 + 2, 69), // de Brontia hacia el norte
  rect(R.south.x0, 55, 19, 57), rect(17, 47, 19, 54), rect(17, 46, 22, 48), // curva hacia la escalera baja
  rect(19, 38, 22, 42), rect(7, 37, 20, 39), // tramo medio: de la escalera baja al oeste
  rect(6, 24, 9, 36), // subida a la escalera alta
  rect(6, 16, 9, 20), rect(7, 15, 15, 17), rect(R.north.x0, 0, R.north.x0 + 2, 16), // tramo alto hasta el Paso del Norte
));

/** Hierba alta nevada (encuentros de la Ruta 11). */
export const GRASS_CELLS = Object.freeze(union(
  rect(18, 58, 24, 62), rect(20, 55, 23, 57), rect(6, 50, 11, 54), // tramo bajo
  rect(12, 28, 19, 33), rect(23, 32, 26, 38), // tramo medio
  rect(18, 5, 23, 11), rect(7, 5, 11, 12), // tramo alto
));

/** Claros (todo lo demás es pinar nevado): camino, praderas de hierba alta, rincones y escaleras. */
export const CLEARINGS = Object.freeze(union(
  // tramo bajo: el camino y la escena de la montañera, la pradera del oeste, la del este y el rincón de nieve honda
  rect(9, 55, 20, 63), rect(5, 49, 12, 55), rect(13, 46, 23, 54), rect(17, 55, 25, 63),
  // tramo medio: senda, dos praderas, el rellano de la escalera y un claro con rocas
  rect(5, 34, 23, 41), rect(11, 27, 20, 34), rect(22, 31, 27, 39), rect(5, 24, 10, 33), rect(18, 38, 24, 42),
  // tramo alto: senda, praderas, la repisa y su subida
  rect(5, 13, 16, 20), rect(6, 4, 12, 13), rect(11, 0, 17, 13), rect(17, 4, 24, 12), rect(21, 5, 27, 14),
));

/** Columnas de borde (sin salida a los lados): pinar cerrado de arriba abajo hasta la pradera. */
const edgeCol = (x) => x <= 1 || x >= R.width - 2;

/** ¿La casilla es pradera (por debajo de la línea de nieve ondulada)? */
const isMeadow = (x, y) => y >= snowLineAt(Math.max(0, Math.min(R.width - 1, x))) + 5;

function ground(b) {
  b.fill(0, 'nieve');
  // La pradera de la meseta de Brontia asoma al pie de la vertiente. El borde de la nieve es un parche de nieve con
  // borde suave sobre el césped (la franja de nieve que toca la pradera), no un corte de casillas.
  const grass = [];
  const edge = [];
  for (let x = 0; x < R.width; x++) {
    for (let y = 0; y < R.height; y++) {
      if (isMeadow(x, y)) grass.push([x, y]);
      else if ([[0, 1], [1, 1], [-1, 1]].some(([dx, dy]) => isMeadow(x + dx, y + dy) && x + dx >= 0 && x + dx < R.width)) edge.push([x, y]);
    }
  }
  b.paint('cesped', [...grass, ...edge], { layer: 0 });
  b.paint('nieve_parche', edge, { mask: (x, y) => !isMeadow(x, y) || x < 0 || x >= R.width });
}

function terraces(b) {
  b.blob(null, PLATEAU_BAJA, 'terraza_nevada');
  b.blob(null, PLATEAU_ALTA, 'terraza_nevada');
  for (const f of R.faces) b.stamp(f.stairs.stamp, f.stairs.x, f.faceBottom - 2);
  const L = R.ledge;
  b.blob(null, rect(L.x0, L.y0, L.x1, L.y1), 'terraza_nevada');
  b.stamp('escalera_terraza', L.stairs.x, L.stairs.y);
}

function paths(b) {
  const all = new Set(PATH_CELLS.map(([x, y]) => `${x},${y}`));
  const mask = (x, y) => all.has(`${x},${y}`) || y >= R.height;
  const snowPart = PATH_CELLS.filter(([x, y]) => y < snowLineAt(x) + 5);
  const grassPart = PATH_CELLS.filter(([x, y]) => y >= snowLineAt(x) + 5);
  b.paint('nieve_parche', snowPart, { mask });
  b.paint('camino_arena', grassPart, { mask });
}

function deepSnow(b) {
  const d = R.deepSnow;
  b.rect(null, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1, 'nieve_honda');
}

function forests(b) {
  const L = R.ledge;
  const open = openMask([
    CLEARINGS, PATH_CELLS, GRASS_CELLS, rect(R.deepSnow.x0 - 1, R.deepSnow.y0 - 1, R.deepSnow.x1 + 1, R.deepSnow.y1 + 1),
    rect(L.x0 - 1, L.y0 - 1, L.x1, L.y1 + 2),
  ], 0);
  // Las caras de terraza y la pradera baja (y ≥ 64) no llevan árboles encima.
  const faceRows = (y) => (y >= 41 && y <= 46) || (y >= 19 && y <= 24) || y >= 64;
  snowForest(b, {
    width: R.width, height: R.height, seed: 11,
    open: (x, y) => faceRows(y) || (open(x, y) && !edgeCol(x)),
  });
  // A los lados de la pradera de Brontia, pinos verdes como los del pueblo (sin nieve).
  b.paint('bosque_pinos', [...rect(0, 64, 1, 69), ...rect(R.width - 2, 64, R.width - 1, 69)]);
}

function details(b) {
  const reserved = reservedFrom(ruta11Events(), [...PATH_CELLS, ...GRASS_CELLS]);
  const pathNear = openMask([PATH_CELLS], 1);
  const L = R.ledge;
  const onLedge = (x, y) => x >= L.x0 - 1 && x <= L.x1 + 1 && y >= L.y0 - 1 && y <= L.y1 + 3;
  const avoid = (x, y) => reserved(x, y) || pathNear(x, y) || onLedge(x, y) || (y >= 41 && y <= 46) || (y >= 19 && y <= 24);
  const free = CLEARINGS.filter(([x, y]) => !avoid(x, y) && !b.get(1, x, y) && !b.get(2, x, y));
  scatterDecor(b, free, [['pino_nevado_peque', 6], ['pino_nevado', 4], ['roca_gris', 2], ['monton_nieve', 2], ['tocon_nevado', 2], ['arbusto_nevado', 3]], { avoid, density: 0.55, gap: 1, seed: 21 });
  decorate(b, [
    ['roca_gris', 8, 57], ['tocon_nevado', 20, 50], ['troncos', 7, 47], ['roca_gris', 11, 44 - 4],
    ['tocon_nevado', 4, 40], ['roca_grande', 23, 27], ['roca_gris', 11, 29], ['tocon_nevado', 20, 35],
    ['roca_gris', 13, 13], ['tocon_nevado', 20, 14], ['roca_grande', 2, 17], ['monton_nieve', 9, 2],
    ['monton_nieve', 24, 42 - 2], ['monton_nieve', 4, 33], ['monton_nieve', 18, 25], ['monton_nieve', 22, 1],
  ], { avoid });
  decorate(b, [
    ['matas_nieve', 9, 52], ['matas_nieve', 13, 49], ['matas_nieve', 24, 29], ['matas_nieve', 5, 21],
    ['matas_nieve', 19, 15], ['matas_nieve', 12, 3], ['matas_nieve', 7, 42 - 3], ['matas_nieve', 25, 45 - 8],
  ], { avoid });
  b.stamp('cartel_ruta', R.sign.x - 1, R.sign.y - 1);
  b.stamp('cartel_madera', R.signTop.x, R.signTop.y);
}

export function buildRuta11(b) {
  ground(b);
  terraces(b);
  paths(b);
  deepSnow(b);
  b.paint('hierba_nevada', GRASS_CELLS.filter(([x, y]) => !b.get(1, x, y) && !b.get(2, x, y)));
  forests(b);
  details(b);
  // Arriba solo se sube al Paso por el camino (x 13–16); a los lados, matas contra el pinar.
  decorate(b, [['arbusto_nevado', R.north.x0 - 3, 0], ['tocon_nevado', R.north.x1 + 1, 0]]);
  sealEdges(b, { width: R.width, height: R.height, sides: ['west', 'east', 'north'], keep: (x, y) => y === 0 && x >= R.north.x0 && x <= R.north.x1 });
}
