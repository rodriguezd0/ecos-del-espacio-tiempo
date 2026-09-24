// Coordenadas de Villa Zaguán y de sus interiores (fuente única para warps de ida y vuelta, eventos, pruebas y
// E2E). Documentado en content/maps/b02/README.md. Módulo puro.
//
// Aldea de huertos a la salida del bosque (docs/CAMPANA.md §1.3): 40×36, tileset 1 (Exterior1).
// Norte: Ruta 1 (camino x 18–21) · Oeste: Explanada del Umbral (camino y 16–18) · Sur: Ruta 2 (camino x 18–21).

export const W = 40;
export const H = 36;

/** Esquina superior izquierda de cada edificio (stamp de Exterior1). */
export const BUILDINGS = Object.freeze({
  centro: { stamp: 'centro_pokemon', x: 23, y: 6 },        // puerta (3,8)
  casa_dintel: { stamp: 'casa_gris', x: 3, y: 19 },         // Casilda Roquer (puerta 3,4)
  casa_vecina: { stamp: 'casa_verde', x: 10, y: 19 },       // la vecina de las puertas (puerta 3,6)
  casa_huerto: { stamp: 'casa_naranja', x: 23, y: 20 },     // familia de hortelanos (puerta 3,5)
  escuela: { stamp: 'casa_naranja_ancha', x: 3, y: 7 },     // escuela (cerrada; puerta doble 2–3,4)
  granero: { stamp: 'granero_verde', x: 32, y: 15 },        // granero de los huertos (cerrado)
});

/** Puertas que no se abren (examinar): escuela y granero. */
export const CLOSED_DOORS = Object.freeze({
  escuela: [{ x: 5, y: 11 }, { x: 6, y: 11 }],
  granero: [{ x: 34, y: 20 }],
});

/** Casilla de la puerta de cada edificio (warp exterior → interior). */
export const TOWN_DOORS = Object.freeze({
  zaguan_centro: { x: 26, y: 14 },
  casa_dintel: { x: 6, y: 23 },
  zaguan_casa_vecina: { x: 13, y: 25 },
  zaguan_casa_huerto: { x: 26, y: 25 },
});

/** Casilla de llegada en cada interior (sobre el felpudo, mirando arriba). */
export const INTERIOR_ENTRIES = Object.freeze({
  casa_dintel: { x: 6, y: 9 },
  zaguan_casa_vecina: { x: 6, y: 9 },
  zaguan_casa_huerto: { x: 7, y: 10 },
});

/**
 * Conexiones sin fundido. `offset` = desplazamiento de la conexión (ARCHITECTURE §5): norte/sur → x del pueblo
 * donde cae la x 0 del vecino; oeste → y del pueblo donde cae la y 0 del vecino.
 *   Norte: camino x 18–21 = x 13–16 de la Ruta 1 (su enlace pendiente sur con offset −5).
 *   Oeste: camino y 16–18 = y 13–15 de la Explanada del Umbral (su salida este).
 *   Sur: camino x 18–21 hacia la Ruta 2 (B03; se abre sola cuando exista, maps/b02/pending_links.js).
 */
export const TOWN_EXITS = Object.freeze({
  north: { x0: 18, x1: 21, y: 0, to: 'ruta_1', offset: 5 },
  west: { y0: 16, y1: 18, x: 0, to: 'explanada_umbral', offset: 3 },
  south: { x0: 18, x1: 21, y: H - 1, to: 'ruta_2', offset: 0 },
});

/** Arboleda de los Nombres (T01 es de B03: aquí solo el lugar y sus piezas). */
export const ARBOLEDA = Object.freeze({
  area: { x: 9, y: 6, w: 8, h: 10 },
  founder: { x: 9, y: 8 },            // Árbol del Fundador (arbol_alto 2×6, tronco en la fila 13; pegado a la escuela)
  founderPlaque: { x: 9, y: 14 },     // placa grande (tablon_anuncios_2 2×2)
  bench: { x: 15, y: 13 },            // banco de piedra (3 casillas, x 14–16): 6 casillas al este del tronco
  trees: [[11, 6], [13, 6], [15, 6], [12, 11]], // árboles de nombre (2×4), con su placa al pie
});

/** Campanario sobre su terraza (vista cenital de la Arboleda en T01, B03). */
export const CAMPANARIO = Object.freeze({ terrace: { x: 31, y: 6, w: 7, h: 8 }, stairs: { x: 33, y: 11 }, bell: { x: 35, y: 6 }, chapel: { x: 31, y: 6 } });

/** Estanque del pueblo (Caña Vieja) y hierba alta de las afueras (al sur de la calleja). */
export const POND = Object.freeze({ x: 2, y: 28, w: 7, h: 4 });
export const GRASS = Object.freeze([
  { x: 10, y: 28, w: 7, h: 4 },
  { x: 23, y: 28, w: 7, h: 4 },
]);

/** Calleja del sur (filas 26–27): une las puertas de las casas del sur con la calle mayor. */
export const LANE = Object.freeze({ y: 26, h: 2, west: [2, 17], east: [22, 30] });

/** Huertos vallados (tierra de cultivo) al sureste; la cancela da a la calleja. */
export const HUERTOS = Object.freeze({ x: 31, y: 23, w: 7, h: 6 });

/** C008: calle principal, junto a la Arboleda (CAMPANA §2.3). */
export const CELL_C008 = Object.freeze({ x: 18, y: 11 });

/** Punto de Vuelo (delante del Centro Pokémon). */
export const FLY_POINT = Object.freeze({ x: 26, y: 15, dir: 2 });
