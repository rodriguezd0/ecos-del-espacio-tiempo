// Geometría de la Garganta del Albo (CAMPANA B04 y §1.4: desfiladero con cascadas; tileset 1, 40×40; S Ruta 3 ·
// Pilar de la Corriente al norte). Módulo PURO: coordenadas del mapa, sus eventos y los tests.
//
//   x: 0–6 paredes escalonadas | 7–9 orilla oeste | 10–13 el Albo | 14–32 orilla este | 33–39 paredes escalonadas
//   y 0–6    gran cascada sobre la roca (cornisa a su lado: C055, Trepar) · terraza del Pilar (cara 6–8) y su puerta
//   y 7–13   Poza del Albo (remolino del Pozo: Buceo; islote C069: Nadar) · esclusa de cabecera (y 14)
//   y 14–22  garganta media: molino abandonado junto al río (C020), baliza 2 · orilla oeste y repisa (C019)
//   y 23–25  escalón con la cascada pequeña · cuesta de grava G1 (camino) · cuesta de la repisa (oeste)
//   y 26–39  garganta baja: llegada desde la Ruta 3 (x 16–19), baliza 1, puente a la orilla oeste y la Gruta

export const W = 40;
export const H = 40;

export function rect(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}

/**
 * Terrazas (brush `terraza`, convexas, cara sur de 3 filas) en orden de pintado: las paredes del desfiladero son
 * terrazas anidadas que se salen del mapa (solo se ven sus laterales, como estratos), la garganta media, la terraza
 * del Pilar y la roca de la gran cascada.
 */
export const TERRACES = Object.freeze([
  [-1, -1, 8, 42], // repisa de hierba al pie de la pared oeste
  [33, -1, 8, 42], // repisa de hierba al pie de la pared este
  [5, -1, 28, 27], // garganta media: cima y 0–22, cara 23–25
  [19, -1, 14, 10], // terraza del Pilar: cima y 0–5, cara 6–8
  [8, -1, 10, 8], // roca de la gran cascada: cornisa y 0–3, cara 4–6 (pared de Trepar)
]);

/**
 * Paredes de roca del desfiladero (brush `acantilado`, convexo): macizos que se salen del mapa por arriba y por
 * abajo, de modo que solo se ve su cuerpo rocoso. Se pintan antes que las terrazas (la repisa de hierba queda
 * entre la roca y el fondo de la garganta).
 */
export const WALLS = Object.freeze([
  [-2, 20, 5, 26], [37, 20, 5, 26], // tramo bajo: la roca retrocede y deja ver la cara del tramo alto
  [-2, -3, 7, 28], [35, -3, 7, 28], // tramo alto (cara sur en y 22–24, a la altura del escalón de la garganta)
]);

/** El Albo: poza bajo la gran cascada, río y cascadas. */
export const POOL = Object.freeze([8, 7, 7, 7]); // Poza del Albo (x 8–14, y 7–13)
export const RIVER = Object.freeze([[10, 14, 4, 9], [10, 26, 4, 14]]);
export const FALLS = Object.freeze([[10, 0, 4, 7], [10, 23, 4, 3]]);
/** Islote de arena de la Poza (célula C069, con Nadar) y remolino del Pozo del Albo (Buceo). */
export const ISLET = Object.freeze([9, 10, 2, 2]);
export const WHIRLPOOL = Object.freeze({ x: 13, y: 9 });

/** Cuestas de grava (Correr) y escaleras de terraza. */
export const SLOPES = Object.freeze({ g1: [23, 23, 3, 3], repisa: [7, 23, 2, 3] });
export const STAIRS = Object.freeze({ pilar: { x: 27, y: 6 } });
/**
 * Puente de tablones de la garganta baja hacia la orilla oeste. La Ruta 3 solo cubre el sur de x ≥ 8: para que la
 * cámara nunca enseñe el vacío de su esquina suroeste, la orilla oeste y el puente quedan por encima de y 34 y el
 * fondo de ambas orillas (y 34–39, x ≤ 15) es bosque.
 */
export const BRIDGE = Object.freeze([10, 31, 4, 2]);
export const LOWER_WOODS = Object.freeze([[6, 34, 4, 6], [14, 34, 2, 6]]);

/** Caminos de tierra. */
export const PATH = Object.freeze([
  ...rect(16, 30, 4, 10), // llegada desde la Ruta 3
  ...rect(20, 30, 5, 2),
  ...rect(23, 26, 3, 4), // pie de la cuesta G1
  ...rect(23, 15, 3, 8), // cima de G1
  ...rect(15, 13, 14, 2), // hacia la esclusa
  ...rect(27, 9, 3, 4), // pie de la escalera del Pilar
  ...rect(22, 1, 8, 4), // explanada de la puerta
  ...rect(14, 31, 2, 2), ...rect(7, 29, 3, 5), // puente y orilla oeste
]);

/** Salida sur (a la Ruta 3) y entrada del Pilar (warp en la boca, bajo el dintel). */
export const SOUTH_EXIT = Object.freeze({ y: H - 1, x0: 16, x1: 19 });
export const PILAR_DOOR = Object.freeze({ dintel: [24, 0], mouth: [24, 0], warp: { x: 26, y: 2 }, arrive: { x: 26, y: 3, dir: 2 } });
/** Boca de la Gruta del Albo (pared oeste, garganta baja). */
export const GRUTA = Object.freeze({ stamp: [5, 30], warp: { x: 7, y: 32, dirTrigger: 4 }, arrive: { x: 7, y: 32, dir: 6 } });

/** Molino abandonado (granero junto al río con su rueda parada) y esclusa de cabecera (salida de la Poza). */
export const MILL = Object.freeze({ house: [16, 16], wheel: { x: 15, y: 21 }, door: { x: 18, y: 21 } });
export const SLUICE = Object.freeze({ gate: { x: 11, y: 14 }, wheel: { x: 14, y: 14 } });

export const TALL_GRASS = Object.freeze([[20, 34, 6, 4], [26, 27, 5, 3], [19, 9, 6, 3], [7, 26, 3, 3], [27, 17, 5, 4]]);
/** Charcos del desbordamiento (hasta restaurar el Pilar de la Corriente): la orilla este bajo la cascada pequeña. */
export const FLOOD = Object.freeze([...rect(14, 26, 2, 4)]);

/** Balizas de Genesis (Consorcio) con su técnico; Leandro; escena de Gael. */
export const BEACONS = Object.freeze([
  { id: 'baliza_1', x: 22, y: 36, tech: { x: 21, y: 33, dir: 2 } },
  { id: 'baliza_2', x: 30, y: 22, tech: { x: 28, y: 20, dir: 4 } },
  { id: 'baliza_3', x: 23, y: 4, tech: { x: 22, y: 3, dir: 2 } }, // (24, 3) es la base del dintel
]);
export const LEANDRO = Object.freeze({ sluice: { x: 15, y: 12, dir: 4 }, door: { x: 26, y: 3, dir: 2 } });
export const CLASH = Object.freeze({ trigger: rect(27, 5, 3, 1), player: { x: 27, y: 4, dir: 8 }, gael: { x: 28, y: 5, dir: 8 } });

export const CELL_SPOTS = Object.freeze({
  cell_garganta_1: { x: 9, y: 21 }, // repisa de la cascada pequeña (Correr)
  cell_garganta_2: { x: 15, y: 18 }, // junto a la rueda del molino abandonado
  cell_garganta_3: { x: 15, y: 1 }, // cornisa sobre la gran cascada (Trepar)
  cell_garganta_4: { x: 10, y: 11 }, // islote de la Poza (Nadar)
});
/** Pared de Trepar (vetas verdes) desde la orilla este de la Poza hasta la cornisa. */
export const CLIMB = Object.freeze({ up: { x: 15, y: 6, to: [15, 3] }, down: { x: 15, y: 4, to: [15, 7] } });
