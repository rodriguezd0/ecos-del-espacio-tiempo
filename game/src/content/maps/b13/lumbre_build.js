// Construcción del Islote Lumbre (MapBuilder + ExteriorPrisma): isla de playa con espuma y prado claro, torii rosa en la
// playa del norte, cuatro cerezos en flor, flores sueltas, hierba alta, linternas de piedra y un banco en la playa del
// sur. El corro de piedras, los farolillos, la peña de la luna y la barca de Lucía son eventos (b13_lumbre.js).
import { W, H, ISLAND, MEADOW, TORII, TREES, GRASS, FLOWERS, STONE_LANTERNS, BENCH } from './lumbre_layout.js';
import { rect, paintBeaches, sealBeaches } from './paint.js';

export const islandCells = () => rect(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h);
export const meadowCells = () => rect(MEADOW.x, MEADOW.y, MEADOW.w, MEADOW.h);

export function buildLumbre(b) {
  b.fill(0, 'agua');
  const holed = paintBeaches(b, islandCells());
  const meadow = meadowCells();
  b.paint('cesped', meadow, { layer: 0 });
  b.paint('cesped_claro', meadow);
  // En la capa 2: así se ve el césped claro debajo (en la capa 1 lo sustituían y quedaba un cuadro de otro verde).
  for (const [s, x, y] of FLOWERS) b.stamp(s, x, y, { layer: 2 });
  for (const [x, y, w, h] of GRASS) b.paint('hierba_alta', rect(x, y, w, h));
  b.stamp(TORII.stamp, TORII.x, TORII.y);
  for (const [s, x, y] of TREES) b.stamp(s, x, y);
  for (const [x, y] of STONE_LANTERNS) b.stamp('linterna_piedra', x, y - 1);
  b.stamp('banco', BENCH.x, BENCH.y);
  sealBeaches(b, holed);
}

export { W, H };
