// Coordenadas de Aldea Mnemos (B10; docs/CAMPANA.md §1.3: «Aldea de bambú, cerezos y archivos», 48×44, tileset 9) y
// de sus interiores. FUENTE ÚNICA para el constructor, los warps de ida y vuelta, los eventos, las pruebas y el README.
// Módulo puro (Node y navegador).

export const W = 48;
export const H = 44;

const rectCells = (x, y, w, h) => {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
};

/** Salidas: norte → Ruta 9 / Bosque Neblino (B11, niebla hasta P5); sur → Ruta 8 / Marisma Turbia (B09). */
export const EXITS = Object.freeze({
  north: Object.freeze({ y: 0, x0: 22, x1: 24 }), // = x 22–24 del Neblino (B11: maps/b11/layout.js NEBLINO.south, offset 0)
  south: Object.freeze({ y: H - 1, x0: 30, x1: 33 }),
});

/** Fila del muro de niebla del norte (eventos sólidos hasta p5_restored) y del aviso de enlace pendiente. */
export const FOG_WALL_Y = 4;
/** Fila a la que devuelve la niebla (al sur del torii, ya en la aldea). */
export const FOG_RETURN_Y = 15;

/** Bandas de bosque que cierran la aldea (con los huecos de las salidas). */
export const FOREST = Object.freeze({ north: 6, south: 38, west: 4, east: 44 });

/** Calles de tierra y plaza. */
export const STREETS = Object.freeze({
  north: Object.freeze({ x: 22, y: 0, w: 3, h: 17 }),
  plaza: Object.freeze({ x: 18, y: 17, w: 16, h: 7 }),
  south: Object.freeze({ x: 30, y: 24, w: 4, h: H - 24 }),
  west: Object.freeze({ x: 5, y: 20, w: 13, h: 2 }), // plaza → patio del Archivo y casa de Íker
  archivo: Object.freeze({ x: 8, y: 17, w: 3, h: 3 }), // patio del Archivo → calle del oeste
  olvido: Object.freeze({ x: 16, y: 16, w: 2, h: 4 }), // puerta de Olvido → calle del oeste (el poste de los farolillos corta la plaza)
  te: Object.freeze({ x: 7, y: 33, w: 23, h: 2 }), // calle sur → herbolario → casa de té (bajo el estanque)
  centro: Object.freeze({ x: 34, y: 36, w: 6, h: 2 }), // calle sur → Centro
  jacinta: Object.freeze({ x: 34, y: 24, w: 8, h: 2 }), // calle sur → casa de Jacinta
});

/** Terraza del Santuario (noreste). La parte este (el risco de la Losa del Olvido) queda aislada por bambú. */
export const TERRACE = Object.freeze({
  x0: 28, y0: 6, x1: 43, y1: 16, faceRows: 3,
  stairs: Object.freeze({ stamp: 'escalera_roja', x: 32, y: 14 }),
  divider: Object.freeze(rectCells(37, 7, 1, 7)), // bambú que separa el risco (x 38–41) del recinto del Santuario
});

/** Edificios: stamp, esquina superior izquierda y casilla de la puerta (warp exterior → interior). */
export const BUILDINGS = Object.freeze({
  archivo: Object.freeze({ stamp: 'dojo', x: 6, y: 7, door: Object.freeze({ x: 9, y: 12 }) }),
  olvido: Object.freeze({ stamp: 'casa_oriental_rosa', x: 14, y: 7, door: Object.freeze({ x: 16, y: 13 }) }),
  santuario: Object.freeze({ stamp: 'templo_oscuro', x: 31, y: 6, door: Object.freeze({ x: 33, y: 12 }) }),
  te: Object.freeze({ stamp: 'pabellon_verde_2', x: 4, y: 26, door: Object.freeze({ x: 7, y: 32 }) }),
  herbolario: Object.freeze({ stamp: 'pabellon_verde', x: 23, y: 26, door: Object.freeze({ x: 25, y: 32 }) }),
  centro: Object.freeze({ stamp: 'centro_pokemon', x: 36, y: 27, door: Object.freeze({ x: 39, y: 35 }) }),
  jacinta: Object.freeze({ stamp: 'pabellon_rosa', x: 37, y: 17, door: Object.freeze({ x: 40, y: 23 }) }),
  // Casa de la familia de Íker (T09, B11): su interior (mnemos_casa_iker) y la puerta (ikerDoorEvent) son de B11.
  iker: Object.freeze({ stamp: 'casa_rosa', x: 4, y: 16, door: Object.freeze({ x: 5, y: 19 }) }),
});

/** Musharna de Íker en la casa de té (entrada al pozo de los Custodios, T09 de B11: teaHouseWellEvents). */
export const TEA_WELL = Object.freeze({ x: 12, y: 9, dir: 4 });

/** Torii del camino del norte (se pasa por debajo, entre sus patas en x 21 y 25). */
export const TORII = Object.freeze({ stamp: 'torii_negro', x: 20, y: 8 });

/** Estanque de lotos (agua + orilla) con el islote de C074 (solo se llega nadando). */
export const POND = Object.freeze({
  x: 11, y: 25, w: 9, h: 7,
  islet: Object.freeze({ x: 15, y: 28 }),
  lotus: Object.freeze([[12, 26], [17, 26], [12, 29], [17, 29]]),
});

/**
 * Bosquecillo de bambú tras la casa de té (C045 en su claro) y bambú suelto (sprites, events/b10_mnemos.js).
 * Del bosquecillo se entra por (9,23) desde la calle del oeste: (9,24) → (6,24), el claro.
 */
export const BAMBOO = Object.freeze({
  grove: Object.freeze([
    [4, 23], [5, 23], [6, 23], [7, 23], [8, 23], [10, 23],
    [4, 24], [5, 24], [10, 24],
    [4, 25], [5, 25], [6, 25], [7, 25], [8, 25], [9, 25], [10, 25],
  ]),
  clearing: Object.freeze({ x: 6, y: 24 }),
  entry: Object.freeze({ x: 9, y: 23 }),
  // Bambú suelto (decorado sólido): a los lados del camino del norte, junto a la plaza, a la entrada sur…
  loose: Object.freeze([
    [21, 13], [21, 15], [25, 13], [25, 15], [26, 16], [34, 17], [35, 17], [36, 17],
    [28, 35], [29, 36], [34, 32], [35, 33], [12, 21], [13, 21],
    [25, 1], [25, 5], // linde este del camino del norte (columna sin pareja en el bosque: bambú en vez de medio árbol)
  ]),
});

/** Risco del Santuario: pared con vetas (Trepar) y la Losa del Olvido (Spiritomb de noche con la Piedra Espíritu). */
export const RISCO = Object.freeze({
  wall: Object.freeze({ x: 40, y: 16, top: Object.freeze([40, 13]) }), // se sube desde (40,17)
  down: Object.freeze({ x: 40, y: 14, bottom: Object.freeze([40, 17]) }), // se baja desde (40,13)
  losa: Object.freeze({ stamp: 'menhir', x: 38, y: 7, event: Object.freeze({ x: 39, y: 10 }), front: Object.freeze({ x: 39, y: 11 }) }),
  item: Object.freeze({ x: 41, y: 9 }),
});

/** Árbol de miel (huerto entre la calle sur y el Centro) y hierba alta. */
export const HONEY_TREE = Object.freeze({ stamp: 'arbol', x: 34, y: 27, trunk: Object.freeze({ x: 34, y: 30 }) });
export const GRASS = Object.freeze([
  Object.freeze({ x: 4, y: 35, w: 18, h: 3 }), // prado del sur (bajo la casa de té y el herbolario)
  Object.freeze({ x: 11, y: 22, w: 6, h: 2 }), // ribazo al norte del estanque
]);

/** Plaza: estrado de losas, farolillos y linternas. */
export const PLAZA = Object.freeze({
  estrado: Object.freeze({ x: 26, y: 17 }),
  farolillos: Object.freeze({ x: 18, y: 16 }),
  linternas: Object.freeze([[25, 18], [25, 22], [32, 18], [32, 22], [26, 10]]),
});

/** Carteles (stamp cartel_madera + evento de lectura en la misma casilla). */
export const SIGNS = Object.freeze({
  aldea: Object.freeze({ x: 34, y: 37 }),
  plaza: Object.freeze({ x: 29, y: 24 }),
  herbolario: Object.freeze({ x: 22, y: 32 }),
  te: Object.freeze({ x: 11, y: 32 }),
  santuario: Object.freeze({ x: 35, y: 13 }),
  archivo: Object.freeze({ x: 5, y: 15 }),
});

/** Personajes exteriores (casilla y dirección). */
export const NPC = Object.freeze({
  olvido: Object.freeze({ x: 19, y: 19, dir: 2 }), // en la plaza, frente a su casa
  olvidoPuerta: Object.freeze({ x: 10, y: 13, dir: 4 }), // junto a la puerta del Archivo tras las notas
  fausta: Object.freeze({ x: 29, y: 37, dir: 6 }), // a la entrada sur
  bruno: Object.freeze({ x: 21, y: 27, dir: 4 }), // junto al estanque, con su Pancham
  pancham: Object.freeze({ x: 20, y: 28, dir: 8 }),
  nerea: Object.freeze({ x: 36, y: 21, dir: 4 }),
  monje: Object.freeze({ x: 31, y: 13, dir: 2 }), // campanero del Santuario (ante la puerta, junto a la campana)
  pescador: Object.freeze({ x: 14, y: 32, dir: 8 }),
});

/** Llegada del jugador desde el sur y la franja de la escena de llegada (toda la calle). */
export const ARRIVAL = Object.freeze({ x: 31, y: 41, dir: 8, trigger: Object.freeze({ y: 37, x0: 30, x1: 33 }) });

/** Llegadas a los interiores (sobre el felpudo, mirando arriba) — ver los mapas mnemos_*. */
export const INTERIOR_ENTRIES = Object.freeze({
  mnemos_centro: Object.freeze({ x: 9, y: 12 }),
  mnemos_herbolario: Object.freeze({ x: 4, y: 9 }),
  mnemos_casa_te: Object.freeze({ x: 7, y: 10 }),
  mnemos_casa_olvido: Object.freeze({ x: 6, y: 9 }),
  mnemos_casa_jacinta: Object.freeze({ x: 6, y: 9 }),
  mnemos_santuario: Object.freeze({ x: 6, y: 17 }),
  mnemos_archivo: Object.freeze({ x: 11, y: 15 }),
});

/** Punto de Vuelo (delante del Centro) y aparición por defecto. */
export const FLY_POINT = Object.freeze({ x: 39, y: 36, dir: 2 });
export const START = Object.freeze({ x: 31, y: 41, dir: 8 });

export { rectCells };
