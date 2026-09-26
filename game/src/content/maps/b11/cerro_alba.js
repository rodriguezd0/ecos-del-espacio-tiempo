// Cerro del Alba (docs/CAMPANA.md §1.4: «Cornisa y cima sobre Villa Alba», tileset 1, 24×30, desde la Ruta 1 con
// Trepar; §2.3 C054 en la cornisa; brasero de Ho-Oh en el postgame). Se sube desde el mirador del nordeste de la
// Ruta 1 (raíces del muro este, content/events/b11_cerro.js); abajo, la base; una pared de raíces lleva a la cornisa
// (C054) y una escalera de piedra a la cima, donde espera un brasero frío. Sin encuentros.
import { zoneDefaults } from '../../services/zones.js';
import { CERRO } from './layout.js';
import { rect, raggedForest, decorate } from './paint.js';
import { cerroEvents } from '../../events/b11_cerro.js';

const C = CERRO;

/** Casillas libres de detalles: eventos (y su acceso), la pared de raíces y el sendero. */
function reserved() {
  const cells = [];
  for (const e of cerroEvents()) {
    if (!e.type && !e.sprite && e.trigger !== 'action') continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) cells.push([e.x + dx, e.y + dy]);
  }
  cells.push(C.wall.from, C.wall.to, ...rect(C.summit.stairs - 2, C.summit.y1 + 1, C.summit.stairs + 2, C.summit.y1 + 2));
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  return (x, y) => set.has(`${x},${y}`);
}

function build(b) {
  b.fill(null, 'cesped');
  // Bosque que rodea el cerro.
  raggedForest(b, 'bosque_pinos', 0, 23, 3, 29, { clipBottom: true, seed: 2 });
  raggedForest(b, ['bosque_pinos', 'bosque_mixto', 'bosque_pinos'], 8, 23, 23, 29, { clipBottom: true, seed: 3 });
  b.paint('bosque_pinos', rect(20, 0, 23, 12));
  b.paint('bosque_pinos', rect(0, 0, 3, 12));
  // Cornisa y cima (terrazas).
  b.blob(null, rect(C.cornisa.x0, C.cornisa.y0, C.cornisa.x1, C.cornisa.y1), 'terraza');
  b.blob(null, rect(C.summit.x0, C.summit.y0, C.summit.x1, C.summit.y1), 'terraza');
  b.stamp('escalera_terraza_ancha', C.summit.stairs - 2, C.summit.y1 - 2);
  // Sendero de la base hasta la pared de raíces y vereda gastada de la escalera al mirador.
  // (la vereda hacia la pared es de una fila: la de abajo es la de las puntas de los pinos)
  b.paint('camino_tierra', [...rect(4, 24, 6, 29), ...rect(4, 23, 12, 23)]);
  // Cima: estrado de losas con el brasero.
  b.stamp('estrado', 9, 1);
  const avoid = reserved();
  // Cornisa: pinos que enmarcan los lados, rocas, un banco mirando al pueblo y flores de monte.
  decorate(b, [
    ['pino', 0, 13], ['pino', 3, 14], ['pino', 14, 13], ['pino', 21, 15],
    ['roca_grande', 17, 17], ['roca_peque', 6, 17], ['roca_gris', 9, 19], ['tocon', 7, 13], ['banco', 15, 19],
    ['roca_peque', 20, 13], ['tronco_caido_h', 11, 14],
    // Cima: pino, rocas y tocón alrededor del estrado.
    ['pino', 6, 2], ['roca_grande', 16, 5], ['roca_peque', 7, 7], ['tocon', 17, 2], ['roca_peque', 17, 7],
  ], { avoid });
  decorate(b, [
    ['flores_blancas', 5, 15], ['flores_rosas', 9, 16], ['brotes', 12, 17], ['flores_blancas', 20, 16], ['brotes', 4, 19],
    ['flores_rosas', 8, 5], ['brotes', 15, 7], ['flores_blancas', 17, 8], ['flores_rosas', 7, 28],
    ['lupinos', 16, 12], ['macizo_flores', 5, 13], ['flores_rosas', 13, 19], ['flores_blancas', 8, 17],
  ], { avoid });
  b.rect(null, 14, 17, 3, 2, 'flores_amarillas');
  b.rect(null, 5, 6, 2, 1, 'flores_amarillas');
}

export default {
  id: 'cerro_alba',
  ...zoneDefaults('cerro_alba'),
  name: 'Cerro del Alba',
  tileset: 1,
  width: C.width,
  height: C.height,
  outdoor: true,
  battleback: 'Monte',
  start: { ...C.entry },
  build,
  events: cerroEvents(),
};
