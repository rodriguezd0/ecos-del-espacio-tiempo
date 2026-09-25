// Coordenadas de la Ruta 13 (CAMPANA §1.4: «Nieve profunda», 30×60, tileset 1, S Paso del Norte · N Villa Boreal;
// Terreno complicado). Fuente única para el constructor, los eventos y los tests. Módulo puro.

export const RUTA13 = Object.freeze({
  width: 30,
  height: 60,
  start: { x: 14, y: 57, dir: 8 },
  south: { y: 59, x0: 13, x1: 15, offset: 0 }, // ↔ Paso del Norte north (x 13–15)
  north: { y: 0, x0: 13, x1: 15, offset: -7 }, // ↔ Villa Boreal south (x 20–22): offset −7 / +7
  /** Franja de llegada (primera vez): todo el ancho del tramo de abajo. */
  arrival: { y: 58, x0: 2, x1: 17 },
  /** La misma llegada para quien baja desde Villa Boreal (ferri): todo el paso de la fila 1. */
  arrivalNorth: { y: 1, x0: 10, x1: 17 },
  /** Cara de terraza (filas 31–33) con su escalera: al norte, el valle alto. */
  face: { bottom: 33, stairs: { x: 17 } },
  /** Franjas de nieve honda (Terreno complicado): cada casilla es un evento roughTerrain. */
  deep: [
    { id: 'baja', x0: 2, y0: 43, x1: 27, y1: 46 }, // la cruza el camino (de pared a pared)
    { id: 'oeste', x0: 3, y0: 22, x1: 9, y1: 28 }, // rincón de C092
    { id: 'este', x0: 20, y0: 7, x1: 26, y1: 13 }, // rincón de C091 y la Abomasnowita
  ],
  cells: { c091: { x: 24, y: 10 }, c092: { x: 5, y: 24 } },
  grass: [[4, 49, 10, 55], [21, 36, 26, 41], [4, 11, 10, 17], [22, 18, 27, 23]],
  trainers: { yolanda: { x: 22, y: 51, dir: 4 }, emilio: { x: 21, y: 26, dir: 4 }, genoveva: { x: 11, y: 14, dir: 6 } },
  traveler: { x: 17, y: 5, dir: 4 },
  sign: { x: 12, y: 56 },
  items: { abomasite: { x: 26, y: 10 }, maxRevive: { x: 25, y: 38 }, hidden: { x: 5, y: 34 } },
});
