// Ruta 13 (docs/CAMPANA.md §1.4: «Nieve profunda», 30×60, tileset 1, S Paso del Norte · N Villa Boreal, BGM Ruta 2,
// fondo snow; Terreno complicado). Un valle nevado en dos tramos (una cara de terraza con escalera) cruzado por franjas
// de nieve honda: la del tramo bajo la atraviesa el camino y las del alto guardan C091, C092 y la Abomasnowita
// (POKEDEX §7.7). Eventos en content/events/b15_ruta13.js.
import { zoneDefaults } from '../../services/zones.js';
import { RUTA13 } from './layout_ruta13.js';
import { NORTH_PIECES } from './pieces.js';
import { internal } from './links.js';
import { rect, union, grow, openMask, snowForest, scatterDecor, reservedFrom, decorate, sealEdges } from './paint.js';
import { RUTA_13 } from '../../encounters/b15.js';
import { ruta13Events } from '../../events/b15_ruta13.js';

const R = RUTA13;

export const R13_PATHS = Object.freeze(union(
  rect(R.south.x0, 48, R.south.x1, 59), rect(R.south.x0, 47, 19, 49), rect(17, 34, 19, 48),
  rect(17, 20, 19, 30), rect(13, 18, 19, 20), rect(R.north.x0, 0, R.north.x1, 19),
));
const GRASS = Object.freeze(union(...R.grass.map(([x0, y0, x1, y1]) => rect(x0, y0, x1, y1))));
const DEEP = Object.freeze(union(...R.deep.map((d) => rect(d.x0, d.y0, d.x1, d.y1))));
/** Claros alrededor de camino, hierba y nieve honda, más dos rellanos abiertos; el resto es pinar nevado. */
// (la nieve honda del tramo bajo llega de pared a pared: no se ensancha hacia los lados para no abrir el pinar)
const CLEARINGS = Object.freeze(union(
  grow(R13_PATHS, 2, 1), grow([...GRASS, ...DEEP.filter(([x]) => x >= 3 && x <= R.width - 4)], 1, 1),
  rect(20, 3, 27, 6), rect(9, 34, 16, 40),
));

function build(b) {
  b.fill(0, 'nieve');
  b.blob(null, rect(-3, -4, 33, R.face.bottom), 'terraza_nevada');
  b.stamp('escalera_terraza', R.face.stairs.x, R.face.bottom - 2);
  const all = new Set(R13_PATHS.map(([x, y]) => `${x},${y}`));
  b.paint('nieve_parche', R13_PATHS.filter(([x, y]) => !DEEP.some(([dx, dy]) => dx === x && dy === y)), {
    mask: (x, y) => all.has(`${x},${y}`) || y < 0 || y >= R.height,
  });
  for (const d of R.deep) b.rect(null, d.x0, d.y0, d.x1 - d.x0 + 1, d.y1 - d.y0 + 1, 'nieve_honda');
  b.paint('hierba_nevada', GRASS);
  b.stamp('cartel_ruta', R.sign.x - 1, R.sign.y - 1);
  const faceRows = (y) => y >= R.face.bottom - 3 && y <= R.face.bottom + 1;
  // (y los eventos visibles con su entorno: ningún pino encima de un entrenador)
  const eventCells = ruta13Events().filter((e) => Number.isInteger(e.x) && e.sprite && e.type !== 'item').map((e) => [e.x, e.y]);
  const open = openMask([CLEARINGS, R13_PATHS, GRASS, DEEP, grow(eventCells, 1, 1)], 0);
  // Los lados del valle (sin salida) son pinar cerrado de arriba abajo; la nieve honda baja llega hasta él.
  const edgeCol = (x, y) => (x <= 1 || x >= R.width - 2) && !DEEP.some(([dx, dy]) => dx === x && dy === y);
  snowForest(b, { width: R.width, height: R.height, seed: 13, open: (x, y) => faceRows(y) || (open(x, y) && !edgeCol(x, y)) });
  const reserved = reservedFrom(ruta13Events(), [...R13_PATHS, ...GRASS, ...DEEP]);
  const pathNear = openMask([R13_PATHS, DEEP], 1);
  const avoid = (x, y) => reserved(x, y) || pathNear(x, y) || faceRows(y);
  // Pinos y matas que parten las explanadas del valle (entre la hierba y la nieve honda, junto al camino).
  const miss = decorate(b, [
    ['pino_nevado_peque', 11, 17], ['arbusto_nevado', 3, 19], ['roca_gris', 26, 16], ['pino_nevado_peque', 14, 34],
    ['tocon_nevado', 17, 8], ['arbusto_nevado', 17, 12], ['roca_gris', 6, 30],
  ], { avoid: reserved });
  if (globalThis.__B15_DEBUG) console.log('[ruta_13] sin sitio:', miss.join(' '));
  const free = CLEARINGS.filter(([x, y]) => !avoid(x, y));
  scatterDecor(b, free, [['pino_nevado_peque', 5], ['roca_gris', 3], ['monton_nieve', 2], ['arbusto_nevado', 3], ['tocon_nevado', 1]], { avoid, density: 0.45, gap: 1, seed: 29 });
  // Al sur solo se baja al Paso por el camino (x 13–15, la salida norte del Paso).
  decorate(b, [['arbusto_nevado', 7, R.height - 1], ['roca_gris', 10, R.height - 1]]);
  sealEdges(b, {
    width: R.width, height: R.height, sides: ['west', 'east', 'south'],
    keep: (x, y) => y === R.height - 1 && x >= R.south.x0 && x <= R.south.x1,
  });
}

export default {
  id: 'ruta_13',
  ...zoneDefaults('ruta_13'),
  tileset: 1,
  width: R.width,
  height: R.height,
  outdoor: true,
  start: { ...R.start },
  encounters: RUTA_13,
  weather: { type: 'snow', power: 4 },
  stormWeather: ['blizzard', 7],
  ...NORTH_PIECES,
  build,
  connections: [
    ...internal('south', 'paso_del_norte', R.south.offset),
    ...internal('north', 'villa_boreal', R.north.offset),
  ],
  events: ruta13Events(),
};
