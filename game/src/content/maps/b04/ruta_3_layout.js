// Geometría de la Ruta 3 (CAMPANA B04 §1.4: «Ribera con cuestas de grava», tileset 1, 40×50; SE Ciudad Caudal ·
// NO Garganta del Albo). Módulo PURO: fuente única de coordenadas del mapa, sus eventos y los tests.
//
// Rehecha el 26-09 (correcciones del creador: árboles sobre los acantilados y junto a las cascadas, caminos que se
// cortaban, rocas que no dejaban pasar junto a la grava). Mismo diseño de juego: tres niveles de ribera unidos por
// tres cuestas de grava (solo montado, Correr), una célula en cada cuesta, los mismos entrenadores y enlaces.
//
//   y 0–8   terraza alta: bosque de la Garganta, camino norte (x 8–11), cuesta 2 (x 13–15, cara 9–11)
//           mirador del Albo (x 32–39, cima 0–5, cuesta 3 en su cara 6–8)
//   y 12–26 terraza media: prados, hierba alta, camino de la cuesta 2 a la cuesta 1 y ramal al mirador
//   y 30–38 vega baja: llegada desde Caudal (borde este, y 32–34), muelle del pescador, cuesta 1 (x 22–24, cara 27–29)
//   y 39–42 el Albo gira al este hacia Caudal · y 43–49 bosque de la otra orilla
// El río baja por el oeste (x 2–5) salvando las caras de las terrazas con cascadas; la otra orilla (x 0–1) es bosque.

export const W = 40;
export const H = 50;

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Terrazas (brush `terraza`, convexas): [x, y, w, h] con la cara sur en sus 3 últimas filas. */
export const TERRACES = Object.freeze({
  media: [-1, -1, 42, 31], // abarca las demás (terrazas anidadas); cima y 12–26, cara 27–29
  alta: [-1, -1, 33, 13], // cima y 0–8, cara 9–11
  mirador: [32, -1, 9, 10], // cima y 0–5, cara 6–8
});
/** Río: tramos [x, y, w, h] (sin las caras de las terrazas, donde hay cascada). */
export const RIVER = Object.freeze({
  alto: [2, 0, 4, 9],
  medio: [2, 12, 4, 15],
  bajo: [2, 30, 4, 9],
  este: [2, 39, 38, 4],
});
/** Cascadas donde el río salva las caras de las terrazas. */
export const FALLS = Object.freeze([[2, 9, 4, 3], [2, 27, 4, 3]]);

/** Cuestas de grava (Correr, montura del 10 %): [x, y, w, h] sobre la cara de la terraza. */
export const SLOPES = Object.freeze({
  cuesta_1: [22, 27, 3, 3],
  cuesta_2: [13, 9, 3, 3],
  cuesta_3: [35, 6, 3, 3],
});

/**
 * Camino principal (tierra), de Caudal (este) a la Garganta (norte). Sin tramos sueltos: cada ramal acaba en una
 * cuesta, en el muelle o en un borde del mapa.
 */
export const PATH = Object.freeze([
  ...rect(25, 32, 15, 3), // llegada desde Caudal
  ...rect(22, 30, 3, 5), // pie de la cuesta 1
  ...rect(15, 32, 7, 3), // hacia el muelle
  ...rect(14, 35, 3, 3), // bajada al muelle
  ...rect(22, 21, 3, 6), // cima de la cuesta 1
  ...rect(13, 21, 9, 2), // terraza media hacia el oeste
  ...rect(13, 12, 3, 9), // pie de la cuesta 2
  ...rect(16, 12, 22, 2), // ramal al mirador por la terraza media
  ...rect(35, 9, 3, 3), // pie de la cuesta 3
  ...rect(13, 4, 3, 5), // cima de la cuesta 2
  ...rect(8, 4, 5, 2),
  ...rect(8, 0, 4, 4), // salida a la Garganta
]);

/** Borde este hacia Caudal (y del camino) y norte hacia la Garganta (x del camino). */
export const EAST_EXIT = Object.freeze({ x: W - 1, y0: 32, y1: 34 });
export const NORTH_EXIT = Object.freeze({ y: 0, x0: 8, x1: 11 });

/** Muelle de la vega (tablones sobre el agua) y hierba alta. */
export const DOCK = Object.freeze([14, 38, 3, 3]);
export const TALL_GRASS = Object.freeze([
  [7, 30, 6, 5], [26, 35, 5, 3], [26, 15, 8, 5], [17, 15, 5, 5], [7, 14, 4, 8], [17, 6, 8, 3],
]);
/** Casillas de la orilla que se inundan de día hasta que se restaura el Pilar de la Corriente. */
export const FLOOD = Object.freeze([...rect(6, 36, 2, 2), ...rect(22, 36, 3, 2), ...rect(35, 36, 3, 2)]);

/** Células C016–C018 (una en cada cuesta de grava). */
export const CELL_SPOTS = Object.freeze({
  cell_ruta_3_1: { x: 23, y: 28 },
  cell_ruta_3_2: { x: 14, y: 10 },
  cell_ruta_3_3: { x: 36, y: 7 },
});

/** Bosques (pincel `forest`, árboles enteros): [pincel, x, y, w, h]. Nunca sobre una cara de terraza. */
export const FORESTS = Object.freeze([
  // Otra orilla del Albo, por niveles (entre cara y cara)
  ['bosque_pinos', 0, 0, 2, 9], ['bosque_pinos', 0, 12, 2, 15], ['bosque_pinos', 0, 30, 2, 9],
  // Pinar que baja de la Garganta a ambos lados del camino norte
  ['bosque_pinos', 6, 0, 2, 4], ['bosque_mixto', 16, 0, 14, 6],
  // Bosque de la otra orilla, al sur del río (sigue en Caudal)
  ['bosque_pinos', 0, 44, 14, 6], ['bosque_mixto', 14, 44, 12, 6], ['bosque', 26, 44, 14, 6],
]);
