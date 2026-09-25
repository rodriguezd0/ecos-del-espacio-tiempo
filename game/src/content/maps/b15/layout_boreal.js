// Coordenadas de Villa Boreal (CAMPANA §1.3: «Pueblo de observadores de auroras», 44×40, tileset 1 con nieve; S Ruta 13
// · N Lagos del Alma · E Gruta Escarcha · O Mar Boreal; Centro, tienda, Observatorio Boreal, Talleres del Hielo, posada,
// muelle con ferri tras P7) y de sus interiores. Fuente única para el constructor, los warps de ida y vuelta, los
// eventos, los tests y el README. Módulo puro.

export const BOREAL = Object.freeze({
  width: 44,
  height: 40,
  start: { x: 21, y: 37, dir: 8 },
  south: { y: 39, x0: 20, x1: 22, offset: 7 }, // ↔ Ruta 13 north (x 13–15): offset +7 / −7
  north: { y: 0, x0: 20, x1: 23 }, // sendero de los Lagos del Alma (B16; content/maps/b15/links.js)
  west: { offset: 0 }, // mar ↔ Mar Boreal east
  /** Costa: agua (x ≤ 5), paseo de tablas (x 6–7) y el embarcadero del ferri. */
  sea: { x1: 5 }, boardwalk: { x0: 6, x1: 7, y0: 9, y1: 35 },
  pier: { x0: 1, y0: 27, x1: 5, y1: 29 },
  ferry: { sailor: { x: 6, y: 26, dir: 4 }, arrival: { x: 3, y: 28, dir: 6 }, sign: { x: 8, y: 25 } },
  /** Loma del Observatorio (terraza nevada) y su escalera. */
  hill: { x0: 12, x1: 36, faceBottom: 9, stairs: { x: 23 } },
  /** Edificios: stamp, esquina y puerta (warp exterior → interior). */
  buildings: {
    centro: { stamp: 'centro_pokemon', x: 8, y: 10, door: { x: 11, y: 18 } },
    tienda: { stamp: 'tienda_turquesa', x: 15, y: 12, door: { x: 18, y: 17 } },
    posada: { stamp: 'edificio_naranja', x: 27, y: 11, door: { x: 29, y: 17 } },
    casa: { stamp: 'casa_gris', x: 33, y: 12, door: { x: 36, y: 16 } },
    observatorio: { stamp: 'casa_cupula', x: 26, y: -1, door: { x: 27, y: 4 } },
    talleres: { stamp: 'edificio_turquesa_ancho', x: 31, y: 24, door: { x: 34, y: 29 } },
    cabana: { stamp: 'cabana_turquesa', x: 9, y: 30, door: { x: 11, y: 36 } },
  },
  /** Calle mayor (filas 19–21) y plaza de la Torre de Hielo. */
  street: { x0: 8, y0: 19, x1: 43, y1: 21 },
  plaza: { x0: 15, y0: 24, x1: 27, y1: 34 },
  /** Torre de Hielo (sprite 3×5 casillas, pie en `tower`): andamio hasta el T13, torre después. */
  tower: { x: 21, y: 29, footprint: [[20, 29], [22, 29], [20, 28], [21, 28], [22, 28]] },
  flyPoint: { x: 21, y: 32, dir: 8 },
  /** Boca de la Gruta Escarcha (cueva_ladera en el borde este) y salida al Lago Viejo (franja del borde noreste). */
  cave: { stamp: { x: 41, y: 15 }, door: { x: 41, y: 17 }, arrival: { x: 40, y: 17, dir: 4 } },
  lakeExit: { x: 43, y0: 3, y1: 5 },
  /** Patio de los Talleres: bloques de hielo, trineo y tallas. */
  yard: { x0: 30, y0: 31, x1: 42, y1: 36, blocks: [[31, 33], [32, 33], [38, 32], [40, 34]], sled: { x: 35, y: 33 }, sculptures: [[37, 35, 0], [39, 35, 2], [41, 32, 1]] },
  /** Farolas (casilla del pie; el stamp ocupa las 3 de encima): a lo largo del lado sur de la calle y en la plaza. */
  lamps: [[13, 22], [25, 22], [31, 22], [40, 22], [15, 34], [27, 34]],
  /** Personajes del pueblo. */
  npcs: {
    llegada: { y: 38, x0: 6, x1: 43 }, // todo el ancho del borde sur, del paseo de tablas al borde este
    vecinaPlaza: { x: 17, y: 30, dir: 6 },
    ninoPerro: { x: 25, y: 26, dir: 4 },
    swinub: { x: 26, y: 31 },
    pescador: { x: 7, y: 16, dir: 4 },
    vigia: { x: 19, y: 3, dir: 2 },
    concejal: { x: 23, y: 33, dir: 8 },
  },
  items: { hidden1: { x: 42, y: 36 }, hidden2: { x: 13, y: 2 } },
});

/** Llegadas a los interiores (sobre el felpudo, mirando arriba) y tamaños. */
export const BOREAL_INTERIORS = Object.freeze({
  boreal_centro: { x: 9, y: 12 },
  boreal_tienda: { x: 4, y: 9 },
  boreal_posada: { x: 7, y: 10 },
  boreal_casa: { x: 6, y: 9 },
  boreal_observatorio: { x: 9, y: 12 },
  boreal_talleres: { x: 9, y: 12 },
});

/** Observatorio Boreal por dentro (tileset 4, 19×14) y su terraza en el tejado (tileset 1, 16×12). */
export const OBSERVATORIO = Object.freeze({
  width: 19, height: 14, entry: { x: 9, y: 12 },
  directora: { x: 5, y: 5, dir: 2 }, astronomo: { x: 14, y: 7, dir: 4 },
  // Escalera a la azotea (escalera_subir_der con la esquina en (x, y − 1)): se pisa (x, y) desde (x − 1, y).
  telescopio: { x: 9, y: 5 }, stairs: { x: 16, y: 4 }, charts: { x: 3, y: 3 },
});
export const TERRAZA = Object.freeze({
  width: 16, height: 12, entry: { x: 13, y: 9, dir: 8 },
  stairs: { x: 13, y: 10 }, dome: { x: 2, y: 1 }, telescope: { x: 10, y: 4 },
  gael: { x: 8, y: 6, dir: 2 }, core: { x: 9, y: 6 }, duel: { x: 8, y: 8, dir: 8 }, cell: { x: 2, y: 8 },
});

/** Talleres del Hielo por dentro (tileset 4, 19×14). */
export const TALLERES = Object.freeze({
  width: 19, height: 14, entry: { x: 9, y: 12 },
  rosendo: { x: 4, y: 6, dir: 6 }, nieves: { x: 12, y: 6, dir: 4 }, frigibax: { x: 15, y: 9 },
  bench: { x: 9, y: 5 }, blocks: [[2, 4], [3, 4], [15, 4], [16, 4]], tablet: { x: 9, y: 7 },
});
