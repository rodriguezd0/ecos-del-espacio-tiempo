// Coordenadas del Paso del Norte (CAMPANA §1.4: «Collado con refugio», 30×30, tileset 1, S Ruta 11 · O Ruta 12 ·
// N Ruta 13) y de su refugio. Fuente única para el constructor, los eventos y los tests. Módulo puro.

export const PASO = Object.freeze({
  width: 30,
  height: 30,
  start: { x: 14, y: 27, dir: 8 },
  south: { y: 29, x0: 13, x1: 15, offset: 0 }, // ↔ Ruta 11 north (x 13–16)
  north: { y: 0, x0: 13, x1: 15, offset: 0 }, // ↔ Ruta 13 south
  /** Salida oeste a la Senda del Lazo: y 12–14 de aquí = y 40–42 de la Senda (offset −28 / +28). */
  west: { x: 0, y0: 12, y1: 14, offset: -28 },
  /** Refugio de montaña (cabaña, puerta en door; llegada al salir: la casilla de debajo). */
  refugio: { stamp: 'cabana_turquesa', x: 19, y: 8, door: { x: 21, y: 14 } },
  /** Mirador del noroeste desde el que se ve la columna de luz de la Cumbre Azur. */
  mirador: { x0: 3, y0: 2, x1: 11, y1: 8, bench: { x: 5, y: 3 }, tripod: { x: 9, y: 3 } },
  crossroads: { x0: 11, y0: 12, x1: 17, y1: 17 },
  signpost: { x: 11, y: 17 },
  /** Llegada (primera vez): franja al entrar desde la Ruta 11 (todo el ancho del collado en la fila 28). */
  arrival: { y: 28, x0: 10, x1: 19 },
  tecnicos: { german: { x: 7, y: 5, dir: 2 }, candela: { x: 10, y: 6, dir: 4 } },
  valentin: { x: 16, y: 21, dir: 4 },
  columnLight: { x: 0, y: 0 },
  items: { fullHeal: { x: 26, y: 22 }, ultra: { x: 3, y: 18 }, hidden: { x: 22, y: 25 } },
  grass: [[2, 17, 7, 22], [22, 19, 27, 23], [18, 1, 24, 5]],
});

/** Interior del refugio (tileset 4, 15×12). */
export const REFUGIO = Object.freeze({
  width: 15, height: 12, entry: { x: 7, y: 10 },
  guarda: { x: 4, y: 5, dir: 2 }, stove: { x: 11, y: 4 }, beds: { x: 10, y: 6 },
  hikers: [{ x: 3, y: 8, dir: 6 }, { x: 12, y: 9, dir: 4 }], map: { x: 7, y: 3 },
});
