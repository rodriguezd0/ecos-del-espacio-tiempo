// Coordenadas de Villa Alba y de sus interiores (fuente única para warps de ida y vuelta).
// Documentado en content/maps/b01/README.md. Módulo puro.

/** Esquina superior izquierda de cada edificio (stamp) en villa_alba. */
export const BUILDINGS = Object.freeze({
  casa_gael: { stamp: 'casa_verde', x: 6, y: 6 },            // NO (verde)
  casa_vecinos_n: { stamp: 'casa_roja', x: 26, y: 6 },       // N (roja)
  laboratorio_alerce: { stamp: 'fachada_turquesa', x: 34, y: 14 }, // E (turquesa compacta)
  casa_prota: { stamp: 'casa_roja', x: 6, y: 18 },           // SO (roja)
  casa_vecinos_se: { stamp: 'casa_verde_pequena', x: 31, y: 21 }, // SE (verde)
});

/** Casilla de la puerta de cada edificio en villa_alba (warp exterior → interior). */
export const TOWN_DOORS = Object.freeze({
  casa_gael: { x: 9, y: 12 },
  casa_vecinos_n: { x: 30, y: 13 },
  laboratorio_alerce: { x: 37, y: 18 },
  casa_prota: { x: 10, y: 25 },
  casa_vecinos_se: { x: 33, y: 26 },
});

/** Casilla de llegada en cada interior al entrar desde el pueblo (sobre el felpudo, mirando arriba). */
export const INTERIOR_ENTRIES = Object.freeze({
  casa_prota_1f: { x: 7, y: 10 },
  casa_gael: { x: 7, y: 10 },
  laboratorio_alerce: { x: 9, y: 13 },
  casa_vecinos_n: { x: 6, y: 9 },
  casa_vecinos_se: { x: 6, y: 9 },
});

/**
 * Salidas del pueblo (conexiones sin fundido). `offset` = x del pueblo donde cae la x 0 del mapa vecino.
 * Norte: camino de 2 casillas (x 22–23) = entrada del Laberinto en su x 19–20 (su VILLA_OFFSET = 3).
 * Sur: hueco del bosque x 20–25 (camino x 21–24) = borde norte de la Ruta 1 en su x 12–17 (camino 13–16).
 */
export const TOWN_EXITS = Object.freeze({
  north: { x0: 22, x1: 23, y: 0, to: 'laberinto_profundidad', offset: 3 },
  south: { x0: 20, x1: 25, pathX0: 21, pathX1: 24, y: 35, to: 'ruta_1', offset: 8 },
});

/** Policía de guardia en el camino norte y casilla libre a su lado (bloqueada por un evento). */
export const POLICE_POST = Object.freeze({ x: 22, y: 8, free: { x: 23, y: 8 } });
