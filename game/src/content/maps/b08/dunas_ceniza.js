import { withB24Events } from '../../events/b24_maps.js';
import { withB22bEvents } from '../../events/b22b_maps.js';
// Dunas de Ceniza (docs/CAMPANA.md §1.4: «Desierto gris con el Cerro Plomo», ExteriorSafari, 60×50; O Estrato;
// Terreno complicado). Llanura de ceniza gris con mesas de roca rojiza, matorrales y una cresta de norte a sur que
// solo se cruza por tres vados de ceniza honda. Al este, el macizo del Cerro Plomo con la boca de la galería de los
// Galena; al sur, las ruinas de zócalos; al noroeste, el boquete de la Cueva de las Dunas. Coordenadas: layout.js
// (DUNAS). Eventos: content/events/b08_dunas.js.
import { dunasEvents, ashCells, organic } from '../../events/b08_dunas.js';
import { DUNAS_CENIZA, DUNAS_RUINAS } from '../../encounters/b08.js';
import { DUNAS, ESTRATO, CERRO } from './layout.js';
import { cells } from './cave_kit.js';
import { paintPillarExterior } from '../../stamps/pilarVertical.js';

const D = DUNAS;
/** Estrato (este, filas 38–41) ↔ Dunas (oeste, filas 20–23). */
export const ESTRATO_TO_DUNAS = ESTRATO.east.y0 - D.west.y0;

const inMap = ([x, y]) => x >= 0 && y >= 0 && x < D.width && y < D.height;
const rectC = (x, y, w, h) => cells(x, y, w, h).filter(inMap);

/**
 * Paredes del cañón en el borde oeste: siguen la roca de Estrato al otro lado de la conexión (Estrato filas 0–37 y
 * 42–47 = Dunas filas −18–19 y 24–29), así que el único paso es la boca de las filas 20–23. Cada pared se pinta en
 * una sola pieza con la mesa que toca (el pincel `cliff` calcula bordes y cara por vecindad).
 */
function westWalls(b) {
  const north = [...cells(-3, -3, 7, 23), ...cells(2, 2, 9, 5)]; // x ≤ 3, filas ≤ 19 + mesa de la cueva
  const south = [...cells(-3, D.west.y1 + 1, 7, 29), ...cells(2, 43, 7, 7)]; // x ≤ 3, filas ≥ 24 + mesa del suroeste
  b.paint('acantilado', north);
  b.paint('acantilado', south);
}

function terrain(b) {
  b.fill(0, 'ceniza');
  // Cresta de norte a sur (mesas de roca) con tres vados.
  for (const [x, y, w, h] of D.ridge) b.paint('acantilado', rectC(x, y, w, h));
  westWalls(b);
  // Mesas sueltas y el macizo del Cerro Plomo.
  for (const [x, y, w, h] of [[30, 40, 7, 6], [50, 44, 10, 6], [26, -2, 8, 7], [12, 34, 4, 4]]) b.paint('acantilado', rectC(x, y, w, h));
  const c = D.cerro;
  b.paint('acantilado', rectC(c.x0, c.y0, c.x1 - c.x0 + 1, c.y1 - c.y0 + 1));
  b.paint('acantilado', rectC(c.x1 - 6, c.y0 - 3, 10, 6));
  // Ceniza honda (vados y campos).
  b.paint('ceniza_honda', ashCells());
  // Matorral de ceniza (encuentros), en manchas irregulares.
  const bushes = [[4, 29, 9, 5], [5, 35, 6, 3], [25, 22, 8, 4], [38, 30, 11, 5], [46, 37, 4, 3], [26, 7, 6, 4], [8, 10, 6, 3]];
  bushes.forEach(([x, y, w, h], i) => b.paint('hierba_alta', organic(x, y, x + w - 1, y + h - 1, 3 + i).filter(inMap)));
}

function details(b) {
  // Boca del Cerro Plomo y boquete de la cueva.
  // El pie del macizo tapaba la casilla de delante de la boca: se abre para poder llegar a la puerta.
  b.set(1, D.cerro.door.x, D.cerro.door.y + 1, 0);
  b.stamp('boquete', D.cave.x, D.cave.y);
  // Ruinas: anillo de zócalos gastados.
  const r = D.ruins;
  for (const [x, y] of [[r.x0 + 2, r.y0], [r.x0 + 4, r.y0], [r.x0 + 6, r.y0], [r.x0, r.y0 + 2], [r.x1, r.y0 + 2], [r.x0, r.y0 + 4], [r.x1, r.y0 + 4], [r.x0 + 2, r.y1], [r.x0 + 6, r.y1]]) {
    b.stamp('pilar_zocalo_gastado', x, y);
  }
  b.stamp('pilar_zocalo', r.x0 + 4, r.y0 + 3);
  for (const [s, x, y] of [
    ['roca_grande', 7, 16], ['roca_peque', 12, 20], ['roca_grande', 14, 25], ['mata', 9, 24], ['matorral', 5, 26], ['roca_peque', 16, 41],
    // (Sin tocones ni matas redondas: su base de hierba verde y agua desentona sobre la ceniza.)
    ['roca_grande', 10, 45], ['roca_peque', 12, 46], ['mata', 13, 38], ['mata', 14, 39], ['roca_grande', 26, 30], ['mata', 29, 28], ['roca_peque', 35, 25],
    ['matorral', 27, 38], ['roca_grande', 38, 36], ['mata', 50, 30], ['roca_peque', 55, 27], ['roca_grande', 57, 31], ['mata', 53, 33],
    ['roca_peque', 40, 27], ['mata', 25, 15], ['roca_grande', 31, 13], ['matorral', 44, 28], ['roca_peque', 49, 41], ['mata', 36, 45],
    ['roca_peque', 58, 43], ['roca_grande', 26, 47], ['guijarros', 25, 45], ['guijarros', 45, 26], ['guijarros', 6, 22], ['guijarros', 33, 47],
    // Boca del cañón (llegada desde Estrato): piedras caídas al pie de las paredes.
    ['roca_peque', 5, 17], ['roca_peque', 5, 24], ['guijarros', 6, 20],
  ]) b.stamp(s, x, y);
  // Lomo del Cerro Plomo y de la cresta: peñascos y alguna mata sobre la roca (la meseta no queda lisa).
  for (const [s, x, y] of [
    ['roca_grande', 39, 6], ['roca_grande', 44, 10], ['roca_grande', 52, 13], ['roca_grande', 40, 16],
    ['roca_peque', 42, 5], ['roca_peque', 55, 9], ['roca_peque', 37, 12], ['roca_peque', 54, 19],
    ['roca_grande', 41, 11], ['roca_peque', 43, 12], ['roca_grande', 50, 8], ['mata', 46, 6], ['mata', 53, 16], ['mata', 38, 19],
    ['roca_peque', 20, 3], ['roca_grande', 20, 19], ['roca_peque', 21, 34], ['mata', 19, 22], ['roca_peque', 22, 47],
  ]) b.stamp(s, x, y);
  b.stamp('cartel_madera', 4, 18);
  b.stamp('cartel_ruta', 42, 26);
}

export default {
  id: 'dunas_ceniza',
  name: 'Dunas de Ceniza',
  tileset: 6,
  width: D.width,
  height: D.height,
  outdoor: true,
  bgm: 'IslaCanela',
  battleback: 'Desierto',
  start: D.start,
  encounters: DUNAS_CENIZA,
  encounterZones: [{ ...D.ruinsZone, encounters: DUNAS_RUINAS }],
  build(b) {
    terrain(b);
    details(b);
    // La columna asoma sobre el Cerro; la puerta conservada conduce a la verja de los Galena.
    paintPillarExterior(b, { centerX: D.cerro.door.x, doorY: D.cerro.door.y });
  },
  warps: [
    { x: D.cerro.door.x, y: D.cerro.door.y, to: 'cerro_plomo', tx: CERRO.exit.arrive.x, ty: CERRO.exit.arrive.y, dir: 8, door: true },
  ],
  connections: [{ dir: 'west', to: 'ciudad_estrato', offset: -ESTRATO_TO_DUNAS }],
  events: withB24Events('dunas_ceniza', withB22bEvents('dunas_ceniza', dunasEvents())),
};
