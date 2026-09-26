// Construcción de Villa Boreal (tileset 1, 44×40): pueblo de observadores de auroras entre el Mar Boreal (oeste) y la
// Gruta Escarcha (este). Costa con paseo de tablas y el embarcadero del ferri; loma nevada con el Observatorio Boreal
// (cúpula azul) y el sendero de los Lagos del Alma; calle mayor con el Centro, la tienda, la posada y una casa; plaza con
// la Torre de Hielo (andamio hasta el T13); los Talleres del Hielo con su patio; la boca de la Gruta Escarcha y el camino
// del Lago Viejo al noreste. Coordenadas en ./layout_boreal.js.
import { BOREAL } from './layout_boreal.js';
import { rect, union, grow, openMask, snowForest, scatterDecor, reservedFrom, decorate, sealEdges } from './paint.js';
import { borealEvents } from '../../events/b15_boreal.js';

const B = BOREAL;
const BD = B.buildings;

/** Caminos de nieve pisada. */
export const BOREAL_PATHS = Object.freeze(union(
  rect(B.street.x0, B.street.y0, B.street.x1, B.street.y1), // calle mayor
  rect(B.south.x0, B.street.y1, B.south.x1, B.height - 1), // hacia la Ruta 13
  rect(BD.centro.door.x - 1, BD.centro.door.y + 1, BD.centro.door.x + 1, B.street.y0),
  rect(BD.tienda.door.x, BD.tienda.door.y + 1, BD.tienda.door.x, B.street.y0),
  rect(BD.posada.door.x, BD.posada.door.y + 1, BD.posada.door.x, B.street.y0),
  rect(BD.casa.door.x, BD.casa.door.y + 1, BD.casa.door.x, B.street.y0),
  rect(B.hill.stairs.x, 10, B.hill.stairs.x + 2, B.street.y0), // de la calle a la escalera de la loma
  rect(B.north.x0, 0, B.north.x1, 6), rect(B.north.x0, 5, BD.observatorio.door.x, 6), // loma: Lagos y Observatorio
  rect(B.hill.stairs.x, 5, B.hill.stairs.x + 2, 6),
  rect(39, 3, 40, B.street.y0), rect(39, B.lakeExit.y0, B.width - 1, B.lakeExit.y1), // noreste: al Lago Viejo
  rect(8, 22, 12, 28), rect(BD.talleres.door.x, 30, BD.talleres.door.x, 31), rect(30, 30, 38, 31),
));

const PLAZA = Object.freeze(rect(B.plaza.x0, B.plaza.y0, B.plaza.x1, B.plaza.y1));

/** Huella de cada edificio (con su sombra) para que ni árboles ni detalles la pisen. */
const BUILDING_CELLS = Object.freeze(union(
  rect(8, 10, 14, 20), rect(15, 12, 21, 19), rect(27, 11, 32, 18), rect(33, 12, 38, 18), rect(26, 0, 30, 7),
  rect(31, 24, 37, 31), rect(9, 30, 14, 38),
));

function coast(b) {
  const water = [];
  for (let y = 0; y < B.height; y++) for (let x = 0; x <= B.sea.x1; x++) water.push([x, y]);
  // La orilla norte y sur se cierra con rocas nevadas sobre el agua; el paseo de tablas bordea el pueblo.
  b.paint('agua', water);
  const bw = B.boardwalk;
  b.paint('muelle', rect(bw.x0, bw.y0, bw.x1, bw.y1));
  const P = B.pier;
  b.paint('muelle', rect(P.x0, P.y0, P.x1, P.y1));
  b.stamp('velero', 0, 31);
  b.stamp('velero_2', 0, 21);
  for (const [x, y] of [[4, 4], [2, 9], [5, 15], [3, 36], [5, 38], [1, 2]]) b.stamp('roca_agua', x, y);
}

function hill(b) {
  const H = B.hill;
  b.blob(null, rect(H.x0, -4, H.x1, H.faceBottom), 'terraza_nevada');
  b.stamp('escalera_terraza', H.stairs.x, H.faceBottom - 2);
}

function streets(b) {
  const all = new Set([...BOREAL_PATHS, ...PLAZA].map(([x, y]) => `${x},${y}`));
  const mask = (x, y) => all.has(`${x},${y}`) || x >= B.width || y >= B.height || y < 0;
  b.paint('nieve_parche', BOREAL_PATHS.filter(([x, y]) => !PLAZA.some(([px, py]) => px === x && py === y)), { mask });
  b.paint('losas_centro', rect(B.plaza.x0 + 1, B.plaza.y0 + 1, B.plaza.x1 - 1, B.plaza.y1 - 1));
  b.paint('losas_borde', PLAZA);
}

function buildings(b) {
  for (const bd of Object.values(BD)) b.stamp(bd.stamp, bd.x, bd.y);
  // El Observatorio (entero dentro del mapa: la cúpula no se corta en la costura con los Lagos) apoya su puerta en la
  // loma; la última fila del stamp (sombra) caería sobre el borde de la terraza: se quita y queda el borde.
  const obs = BD.observatorio;
  for (let x = obs.x; x < obs.x + 5; x++) b.set(2, x, obs.y + 7, 0);
  const cave = B.cave.stamp;
  b.stamp('cueva_ladera', cave.x, cave.y);
  b.stamp('roca_grande', cave.x - 2, cave.y - 2);
  b.stamp('roca_gris', cave.x, cave.y - 1);
}

function yard(b) {
  const Y = B.yard;
  b.paint('baranda', rect(Y.x0, Y.y1 + 1, Y.x1, Y.y1 + 1));
  b.paint('baranda_v', rect(Y.x0 - 1, Y.y0 + 1, Y.x0 - 1, Y.y1 + 1));
  b.stamp('troncos', 40, 29);
  b.stamp('empalizada', 38, 24);
}

function furniture(b) {
  for (const [x, y] of B.lamps) b.stamp('farola_hierro', x, y - 3);
  b.stamp('banco', 16, 26); b.stamp('banco', 24, 32); b.stamp('banco', 16, 32);
  b.stamp('banco', 17, 2); b.stamp('estatua_2', 14, 3);
  b.stamp('cartel_madera', 23, 22);
  b.stamp('buzon_rojo', 26, 16);
  b.stamp('maquinas_expendedoras', 19, 19); // junto a la puerta de la tienda (la farola de la esquina queda libre)
}

export function buildBoreal(b) {
  b.fill(0, 'nieve');
  coast(b);
  hill(b);
  streets(b);
  buildings(b);
  yard(b);
  furniture(b);
  const events = borealEvents({ lagosOpen: false });
  const eventCells = events.filter((e) => Number.isInteger(e.x)).map((e) => [e.x, e.y]);
  const clear = union(grow(BOREAL_PATHS, 1, 1), grow(PLAZA, 1, 1), grow(BUILDING_CELLS, 1, 1), grow(eventCells, 1, 1),
    rect(B.yard.x0 - 1, B.yard.y0 - 1, B.yard.x1 + 1, B.yard.y1 + 2), rect(0, 0, 7, B.height - 1), rect(12, 0, 36, 9),
    // boca de la Gruta Escarcha con sus rocas y leñera/empalizada de los Talleres: sin pinos encima
    rect(B.cave.stamp.x - 2, B.cave.stamp.y - 2, B.width - 1, B.cave.stamp.y + 3), rect(38, 24, 41, 30));
  const open = openMask([clear], 0);
  snowForest(b, { width: B.width, height: B.height, seed: 41, open });
  const reserved = reservedFrom(events, [...BOREAL_PATHS, ...PLAZA]);
  const avoid = (x, y) => reserved(x, y) || openMask([BUILDING_CELLS], 1)(x, y) || x <= 7 || (y >= 7 && y <= 10 && x >= 12 && x <= 36);
  const hillTop = rect(14, 0, 34, 6).filter(([x, y]) => !avoid(x, y));
  scatterDecor(b, hillTop, [['pino_nevado_peque', 4], ['roca_gris', 2], ['monton_nieve', 3]], { avoid, density: 0.3, gap: 1, seed: 43 });
  const town = rect(8, 10, 43, 38).filter(([x, y]) => !avoid(x, y));
  scatterDecor(b, town, [['monton_nieve', 4], ['arbusto_nevado', 3], ['tocon_nevado', 1], ['pino_nevado_peque', 2]], { avoid, density: 0.12, gap: 2, seed: 47 });
  // Remates de los bordes sin salida: matas bajo la valla de los Talleres y rocas al final de la calle mayor (la
  // calle termina en la boca de la Gruta Escarcha, no en el borde del mapa).
  decorate(b, [['arbusto_nevado', 31, 39], ['arbusto_nevado', 36, 39], ['arbusto_nevado', 40, 39], ['roca_grande', 42, 22]]);
  b.stamp('roca_grande', 42, 19);
  b.stamp('tocon_nevado', 43, 21);
  sealEdges(b, {
    width: B.width, height: B.height, sides: ['south', 'east'],
    keep: (x, y) => (y === B.height - 1 && x >= B.south.x0 - 3 && x <= B.south.x1 + 3) || (x === B.width - 1 && y >= B.lakeExit.y0 && y <= B.lakeExit.y1) || x <= B.sea.x1,
  });
}
