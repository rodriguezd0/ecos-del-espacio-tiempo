// Geometría de la Ruta 3 (CAMPANA B04 §1.4: «Ribera con cuestas de grava», tileset 1, 40×50; SE Ciudad Caudal ·
// NO Garganta del Albo). Módulo PURO: fuente única de coordenadas del mapa, sus eventos y los tests.
//
// El Albo baja de la Garganta por el oeste (x 2–5) salvando cada escalón de la ribera con una cascada y gira al
// este (y 39–42) hacia Caudal. El camino sube por tres niveles: vega baja (llegada desde Caudal, muelle), terraza
// media (cuesta 1) y terraza alta (cuesta 2) hasta la Garganta. La cuesta 3 lleva al Mirador del Albo.
//
//   y 0   ═ Garganta (x 8–11) ═      terraza alta (y 0–8, cara 9–11)           │ mirador (cara 6–8)
//   y 12  río │ terraza media (y 12–26, cara 27–29)
//   y 30  río │ vega baja: muelle, pescador, llegada desde Caudal (borde este, y 32–35)
//   y 39  ══════════ el Albo hacia Caudal (borde este) ══════════   y 43–49 bosque de la otra orilla

export const W = 40;
export const H = 50;

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/** Terrazas (brush `terraza`, convexas): [x, y, w, h] con la cara sur en sus 3 últimas filas. */
export const TERRACES = Object.freeze({
  media: [0, -1, 40, 31], // abarca las demás (terrazas anidadas); cima y 12–26, cara 27–29
  alta: [0, -1, 32, 13], // cima y 0–8, cara 9–11
  mirador: [32, -1, 8, 10], // cima y 0–5, cara 6–8
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

/** Camino principal (tierra), de Caudal (este) a la Garganta (norte). */
export const PATH = Object.freeze([
  ...rect(25, 32, 15, 3), // llegada desde Caudal
  ...rect(22, 30, 3, 5), // pie de la cuesta 1
  ...rect(22, 21, 3, 6), // cima de la cuesta 1
  ...rect(13, 21, 12, 2), // terraza media hacia el oeste
  ...rect(13, 12, 3, 9), // pie de la cuesta 2
  ...rect(13, 5, 3, 4), // cima de la cuesta 2
  ...rect(8, 4, 8, 2),
  ...rect(8, 0, 4, 4), // salida a la Garganta
  ...rect(34, 9, 5, 3), // pie de la cuesta 3 (desvío al mirador)
  ...rect(16, 12, 19, 2),
]);

/** Borde este hacia Caudal (y del camino) y norte hacia la Garganta (x del camino). */
export const EAST_EXIT = Object.freeze({ x: W - 1, y0: 32, y1: 34 });
export const NORTH_EXIT = Object.freeze({ y: 0, x0: 8, x1: 11 });

/** Muelle de la vega (tablones sobre el agua) y hierba alta. */
export const DOCK = Object.freeze([14, 38, 3, 3]);
export const TALL_GRASS = Object.freeze([
  [27, 35, 7, 3], [8, 31, 8, 5], [26, 15, 8, 5], [17, 13, 6, 5], [8, 16, 4, 8], [20, 2, 6, 5],
]);
/** Casillas de la orilla que se inundan de día hasta que se restaura el Pilar de la Corriente. */
export const FLOOD = Object.freeze([...rect(6, 36, 2, 2), ...rect(22, 36, 3, 2), ...rect(35, 36, 3, 2)]);

/** Células C016–C018 (una en cada cuesta de grava). */
export const CELL_SPOTS = Object.freeze({
  cell_ruta_3_1: { x: 23, y: 28 },
  cell_ruta_3_2: { x: 14, y: 10 },
  cell_ruta_3_3: { x: 36, y: 7 },
});
