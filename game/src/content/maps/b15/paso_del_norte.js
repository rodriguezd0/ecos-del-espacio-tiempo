// Paso del Norte (docs/CAMPANA.md §1.4: «Collado con refugio», 30×30, tileset 1, S Ruta 11 · O Ruta 12 (Senda del
// Lazo) · N Ruta 13, BGM PrismaRuta2, fondo snow). Cruce de caminos entre pinares nevados, el refugio de montaña y el
// mirador desde el que se ve la columna de luz de la Cumbre Azur (con los técnicos de Genesis que la miden). Eventos en
// content/events/b15_paso.js.
import { zoneDefaults } from '../../services/zones.js';
import { PASO } from './layout_paso.js';
import { NORTH_PIECES } from './pieces.js';
import { internal } from './links.js';
import { rect, union, openMask, snowForest, scatterDecor, reservedFrom, sealEdges, decorate } from './paint.js';
import { PASO_DEL_NORTE } from '../../encounters/b15.js';
import { pasoEvents } from '../../events/b15_paso.js';

const P = PASO;

export const PASO_PATHS = Object.freeze(union(
  rect(P.south.x0, 15, P.south.x1, 29), // subida desde la Ruta 11
  rect(P.north.x0, 0, P.north.x1, 14), // hacia la Ruta 13
  rect(0, P.west.y0, 14, P.west.y1), // hacia la Senda del Lazo
  rect(15, 14, P.refugio.door.x + 1, 16), rect(P.refugio.door.x - 1, 15, P.refugio.door.x + 1, 15), // al refugio
  rect(P.mirador.x0 + 2, 5, P.mirador.x0 + 5, 11), // al mirador
));

const GRASS = Object.freeze(union(...P.grass.map(([x0, y0, x1, y1]) => rect(x0, y0, x1, y1))));

const CLEARINGS = Object.freeze(union(
  rect(2, 1, 12, 9), rect(9, 10, 18, 18), rect(2, 16, 9, 23), rect(11, 18, 18, 29), rect(17, 17, 27, 25),
  rect(16, 2, 25, 7), rect(11, 1, 17, 10), rect(19, 8, 25, 17), rect(0, 11, 10, 15),
));

/**
 * Hombro nevado del este: el collado queda entre la ladera de la Cumbre Azur (oeste, con el pinar y el mirador) y esta
 * loma con pinos, que cierra el borde este por encima del refugio.
 */
const EAST_SHOULDER = Object.freeze(rect(26, -4, 33, 16));
/** Casillas de borde por las que se sale del Paso (conexiones). */
const EXITS = (x, y) => (y === P.height - 1 && x >= P.south.x0 && x <= P.south.x1 + 1)
  || (y === 0 && x >= P.north.x0 && x <= P.north.x1)
  || (x === 0 && y >= P.west.y0 && y <= P.west.y1);

function build(b) {
  b.fill(0, 'nieve');
  b.blob(null, EAST_SHOULDER, 'terraza_nevada');
  // Mirador: losas con bordillo y barandilla de madera mirando al oeste.
  const M = P.mirador;
  b.paint('losas_centro', rect(M.x0 + 1, M.y0 + 1, M.x1 - 1, M.y1 - 1));
  b.paint('losas_borde', rect(M.x0, M.y0, M.x1, M.y1));
  b.paint('baranda', rect(M.x0, M.y0 - 1, M.x1, M.y0 - 1));
  b.paint('baranda_v', rect(M.x0 - 1, M.y0 - 1, M.x0 - 1, M.y1));
  const all = new Set(PASO_PATHS.map(([x, y]) => `${x},${y}`));
  b.paint('nieve_parche', PASO_PATHS.filter(([x, y]) => !(x >= M.x0 && x <= M.x1 && y >= M.y0 && y <= M.y1)), {
    mask: (x, y) => all.has(`${x},${y}`) || x < 0 || y < 0 || y >= P.height,
  });
  b.paint('hierba_nevada', GRASS);
  b.stamp(P.refugio.stamp, P.refugio.x, P.refugio.y);
  b.stamp('troncos', P.refugio.x - 2, P.refugio.y + 4);
  b.stamp('banco', M.bench.x, M.bench.y);
  b.stamp('cartel_ruta', P.signpost.x - 1, P.signpost.y - 1);
  const open = openMask([CLEARINGS, PASO_PATHS, GRASS], 0);
  // Sin árboles sobre las paredes ni la cara de la loma del este (sí encima, en la loma).
  const shoulderWall = (x, y) => x >= 26 && ((x <= 27 && y <= 16) || (y >= 13 && y <= 16));
  snowForest(b, { width: P.width, height: P.height, seed: 5, open: (x, y) => open(x, y) || shoulderWall(x, y) });
  const reserved = reservedFrom(pasoEvents(), [...PASO_PATHS, ...GRASS]);
  const pathNear = openMask([PASO_PATHS], 1);
  const house = (x, y) => x >= P.refugio.x - 1 && x <= P.refugio.x + 8 && y >= P.refugio.y - 1 && y <= P.refugio.y + 9;
  const mir = (x, y) => x >= M.x0 - 1 && x <= M.x1 + 1 && y >= M.y0 - 1 && y <= M.y1 + 1;
  const avoid = (x, y) => reserved(x, y) || pathNear(x, y) || house(x, y) || mir(x, y);
  // Pinos sueltos que rompen las explanadas del cruce (sin tapar caminos, franja de llegada ni líneas de visión).
  const miss = decorate(b, [
    ['pino_nevado', 10, 21], ['pino_nevado_peque', 17, 23], ['arbusto_nevado', 23, 17],
    ['arbusto_nevado', 10, P.height - 1], ['arbusto_nevado', 17, P.height - 1], ['roca_gris', 2, 10], ['tocon_nevado', 12, 24],
  ], { avoid: reserved });
  if (globalThis.__B15_DEBUG) console.log('[paso] sin sitio:', miss.join(' '));
  const free = CLEARINGS.filter(([x, y]) => !avoid(x, y));
  scatterDecor(b, free, [['pino_nevado_peque', 5], ['pino_nevado', 2], ['roca_gris', 3], ['monton_nieve', 3], ['tocon_nevado', 1], ['arbusto_nevado', 2]], { avoid, density: 0.5, gap: 1, seed: 8 });
  sealEdges(b, { width: P.width, height: P.height, keep: EXITS });
}

export default {
  id: 'paso_del_norte',
  ...zoneDefaults('paso_del_norte'),
  tileset: 1,
  width: P.width,
  height: P.height,
  outdoor: true,
  start: { ...P.start },
  encounters: PASO_DEL_NORTE,
  weather: { type: 'snow', power: 3 },
  stormWeather: ['blizzard', 6],
  ...NORTH_PIECES,
  build,
  warps: [{ x: P.refugio.door.x, y: P.refugio.door.y, to: 'paso_refugio', tx: 7, ty: 10, dir: 8, door: true }],
  connections: [
    ...internal('south', 'ruta_11', P.south.offset),
    ...internal('north', 'ruta_13', P.north.offset),
    ...internal('west', 'ruta_12_senda_lazo', P.west.offset),
  ],
  events: pasoEvents(),
};
