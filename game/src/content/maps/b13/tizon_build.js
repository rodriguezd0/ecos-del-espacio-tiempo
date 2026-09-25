// Construcción del Volcán Tizón (MapBuilder + Exterior3): mar al oeste con playa, caserío de la forja sobre césped y
// caminos de tierra, dos terrazas de ceniza con hierba oscura que suben hacia el norte, flancos de roca del volcán, la
// bocamina de las galerías de la forja y detalles (troncos, rocas, tocones). La fragua, los yunques y la gente son
// eventos (content/events/b13_tizon.js). Módulo puro.
import {
  W, H, LEVEL1, LEVEL2, VILLAGE, BEACHES, SEA, FLANKS, MINE, BUILDINGS, FORGE, GRASS,
} from './tizon_layout.js';
import { rect, key, paintBeaches, sealBeaches } from './paint.js';

const PATHS = Object.freeze([
  [9, 36, 12, 2], // de la playa al patio de la forja
  [20, 32, 5, 5], // bajada de la escalera al patio
  [14, 39, 3, 5], // puerta de Brasa
  [20, 39, 4, 2], [26, 44, 2, 1],
  [21, 16, 3, 13], // subida por la primera terraza
  [20, 6, 3, 7], // subida a la bocamina
]);

export function buildTizon(b) {
  b.fill(0, 'ceniza');
  const sea = SEA.flatMap(([x, y, w, h]) => rect(x, y, w, h));
  b.paint('agua', sea);
  const seaSet = new Set(sea.map(([x, y]) => key(x, y)));
  // Playas: espuma solo hacia el mar (los demás bordes dan a tierra; fuera del mapa, al oeste y al sur, también mar).
  const beach = BEACHES.flatMap(([x, y, w, h]) => rect(x, y, w, h));
  b.paint('agua', beach);
  const holed = paintBeaches(b, beach, (x, y) => x >= 0 && y >= 0 && x < W && y < H && !seaSet.has(key(x, y)));
  b.paint('cesped', rect(VILLAGE.x, VILLAGE.y, VILLAGE.w, VILLAGE.h), { layer: 0 });
  b.blob(null, rect(LEVEL1.x, LEVEL1.y, LEVEL1.w, LEVEL1.h), 'terraza');
  b.blob(null, rect(LEVEL2.x, LEVEL2.y, LEVEL2.w, LEVEL2.h), 'terraza');
  for (const [x, y, w, h] of FLANKS) b.paint('acantilado', rect(x, y, w, h));
  for (const [x, y, w, h] of PATHS) b.paint('camino_tierra', rect(x, y, w, h));
  for (const [x, y, w, h] of GRASS) b.paint('hierba_alta_oscura', rect(x, y, w, h));
  b.stamp('escalera_terraza_ancha', LEVEL1.stairs.x, LEVEL1.stairs.y);
  b.stamp('escalera_terraza_ancha', LEVEL2.stairs.x, LEVEL2.stairs.y);
  b.stamp('entrada_mina', MINE.x, MINE.y);
  for (const bd of Object.values(BUILDINGS)) b.stamp(bd.stamp, bd.x, bd.y);
  b.stamp('troncos', FORGE.stack.x, FORGE.stack.y);
  for (const [s, x, y] of [
    ['roca_gris', 12, 25], ['roca_gris', 29, 14], ['guijarros_mina', 16, 10], ['tocon', 25, 21], ['tocon', 14, 27],
    ['meseta_tierra', 28, 6], ['guijarros_mina', 27, 27], ['roca_gris', 17, 2], ['tocon', 32, 11], ['arbustos', 33, 40],
    ['fardo_paja', 31, 41], ['comedero', 17, 41], ['abrevadero', 26, 33], ['farola_hierro', 25, 28],
    ['cartel_madera', 10, 35], ['roca_gris', 11, 12], ['guijarros', 30, 30], ['arbustos', 11, 41], ['roca_agua', 3, 20], ['roca_agua', 2, 33], ['roca_agua', 4, 44], ['roca_agua', 12, 48],
  ]) b.stamp(s, x, y);
  sealBeaches(b, holed);
}

export { W, H };
