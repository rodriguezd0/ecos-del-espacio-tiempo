// Construcción del campamento del Monte (tileset 1, 40×28): la falda del Monte del Portal, donde la gran cascada
// del prólogo (X22) cae por la peña del oeste y el Albo corre hacia la Ruta 10 por una hoz de roca. En la
// explanada de tierra, el campamento del Consorcio Meridiano (Genesis): tiendas, camión, contenedores, focos, mesa
// de trabajo, barriles y cajas; la senda del Monte sube entre dos peñas (x 9–12) hacia la explanada del prólogo
// (montana_portal). El estado «abandonado» (tras llevarse el cristal EXP-03) lo aplica un evento con `patch`
// (content/events/b11_camp.js) que borra CAMP_PIECES; los pozos de sondeo que quedan son eventos (CAMP_HOLES).
// Coordenadas en ./layout.js (CAMP).
import { CAMP } from './layout.js';
import { decorate } from './paint.js';

const C = CAMP;

export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};
const union = (...parts) => parts.flat();

/**
 * Piezas del campamento activo (stamps de Exterior1) que desaparecen cuando Genesis se marcha. No se solapan entre
 * sí ni con el bosque (el parche las borra enteras: tests/b11_content.test.mjs lo comprueba).
 */
export const CAMP_PIECES = Object.freeze([
  ['tienda_campana', 20, 2], ['tienda_campana', 24, 2], ['tienda_campana', 31, 9], ['camion', 28, 3],
  ['contenedores', 33, 2], ['cajas_madera', 14, 11], ['barriles', 23, 13], ['barriles', 17, 9],
  ['farola_hierro', 20, 8], ['farola_hierro', 28, 8], ['mesa_terraza', 26, 11],
]);

/** Pozos de sondeo que quedan en la explanada al marcharse (eventos con el arte de tools/b11_assets.mjs). */
export const CAMP_HOLES = Object.freeze([[22, 11], [29, 6], [16, 13], [25, 5]]);

/** Casillas del Albo en el campamento (poza bajo la cascada y hoz hacia el este). */
export const RIVER_CELLS = Object.freeze(union(rect(3, 14, 6, 19), rect(3, 20, 39, 23)));

/** Suelo de tierra del campamento (explanadas, camino de la Ruta 10 y senda entre las peñas). */
export const GROUND_CELLS = Object.freeze(union(
  rect(14, 8, 34, 14), // explanada baja
  rect(20, 2, 34, 7), // explanada alta, junto a la peña
  rect(C.east.x - 5, C.east.y0, C.east.x, C.east.y1), // de la Ruta 10
  rect(9, 8, 13, 14), // pie de la senda
  rect(C.trail.x0, C.trail.y, C.trail.x1, 8), // la senda entre las peñas
));

function monte(b) {
  // Peña del oeste (la cascada cae por ella) y peña central; entre ambas (x 9–12) sube la senda del Monte.
  b.blob(null, rect(-2, -1, 8, 13), 'acantilado');
  b.blob(null, rect(13, -1, 19, 7), 'acantilado');
  // Hoz del Albo: banda rocosa entre la explanada y el río.
  b.blob(null, rect(7, 15, 35, 19), 'acantilado');
}

function waterfall(b) {
  b.rect(2, 3, 0, 4, 14, { autotile: 0 });
  b.paint('agua', RIVER_CELLS);
  b.paint('orilla', RIVER_CELLS);
  for (const [x, y] of [[5, 16], [12, 21], [24, 22], [33, 20], [18, 20]]) b.stamp('roca_agua', x, y);
}

function forests(b) {
  b.paint('bosque_pinos', rect(20, 0, 39, 1));
  b.paint('bosque_pinos', rect(38, 2, 39, 5));
  b.paint('bosque_pinos', rect(36, 9, 39, 19));
  b.paint('bosque_mixto', rect(0, 24, 39, 27));
  b.paint('bosque_pinos', rect(0, 14, 2, 23));
}

function ground(b) {
  b.paint('camino_tierra', GROUND_CELLS);
  // Matas de hierba que resisten entre las rodadas.
  for (const [x, y] of [[33, 14], [12, 13], [24, 12], [33, 7], [21, 7], [30, 13]]) b.stamp('brotes', x, y);
}

/** Casillas donde no va ningún detalle: eventos del campamento, pozos, paso de Gael y de la cuadrilla. */
function reserved() {
  const cells = [
    ...C.crates, [C.rig.x, C.rig.y], [C.tripod.x, C.tripod.y], [C.chief.x, C.chief.y], [C.perimeter.guard.x, C.perimeter.guard.y],
    ...C.techs.map((t) => [t.x, t.y]), ...CAMP_HOLES, [13, 9],
    ...rect(C.gael.x, C.gael.y, C.gael.x, C.duelSpot.y), ...rect(C.arrival.x, C.arrival.y0, C.east.x, C.arrival.y1),
  ];
  const set = new Set(cells.map(([x, y]) => `${x},${y}`));
  return (x, y) => set.has(`${x},${y}`);
}

function details(b) {
  for (const [n, x, y] of CAMP_PIECES) b.stamp(n, x, y);
  const avoid = reserved();
  // Piedras y un tocón al borde de la explanada (sobre la tierra, junto al risco de la hoz).
  decorate(b, [['roca_peque', 13, 14], ['roca_gris', 26, 14], ['tocon', 9, 14]], { avoid, over: [1] });
  decorate(b, [['roca_peque', 35, 9], ['roca_peque', 37, 3]], { avoid });
  b.rect(null, 35, 13, 1, 2, 'flores_amarillas');
}

export function buildCampamento(b) {
  b.fill(null, 'cesped');
  forests(b);
  ground(b);
  monte(b);
  waterfall(b);
  details(b);
}
