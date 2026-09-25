// Sima del Eje (docs/CAMPANA.md §1.4: «Abismo central · N Senda del Mirador · S Mirador Sur · E Calzada del Rey ·
// Reconstrucción»; B19: la Calzada del Rey termina en la entrada de la Puerta de las Quince). FUENTE ÚNICA de
// coordenadas del mapa `sima_eje` (tileset 1, 40×56): la usan la construcción, los eventos, las pruebas y el E2E.
// Módulo PURO. Todo lo que no es tierra es vacío (panorama `sima`). De arriba abajo:
//   · Oeste: la cornisa que baja de la Senda del Mirador (x 11–12, fila 0: warp a la bajada de la Senda), la Repisa
//     Norte, el sendero de la cornisa sobre el vacío (un hueco que se salva con Reconstrucción, G14) y la cornisa que
//     sube al Mirador Sur (x 3–4, última fila: warp a su bajada). Un rellano aparte guarda la Metagrossita.
//   · Este: la Puerta de la Bajada (desde la Peña del Rey) y la Calzada del Rey, que baja por dos rellanos hasta un
//     último tramo roto: solo se alza con la última Crónica (Tabla Draco, T15).
//   · Centro: el Umbral, explanada de losas ante la roca de la Puerta de las Quince (warp a `puerta_quince`, B20).

export const W = 40;
export const H = 56;

const P = (x, y, dir = 2) => Object.freeze({ x, y, dir });
const R = (x0, y0, x1, y1) => Object.freeze({ x0, y0, x1, y1 });
export const inRect = (r, x, y) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
export const rect = (x0, y0, x1, y1) => {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
};

/**
 * Bajadas de B17 (warps pulsando hacia el borde, maps/b19/links.js DESCENTS): la cornisa de la Senda del Mirador
 * (x 11–12, fila 0, pulsando arriba) y la del Mirador Sur (x 3–4, última fila, pulsando abajo).
 */
export const EXITS = Object.freeze({
  north: Object.freeze({ y: 0, x0: 11, x1: 12, dir: 8, to: 'senda_mirador' }),
  south: Object.freeze({ y: H - 1, x0: 3, x1: 4, dir: 2, to: 'mirador_sur' }),
});

// ───────────────────────────── Tierra ─────────────────────────────

/** Oeste: cornisas y sendero (tierra, camino de tierra). */
export const WEST = Object.freeze({
  ledgeN: R(11, 0, 12, 7), // cornisa que baja de la Senda
  repisa: R(5, 8, 16, 12), // Repisa Norte
  trail1: R(2, 13, 6, 24), // sendero pegado a la pared (tramo alto)
  trail2: R(1, 27, 6, 48), // sendero (tramo bajo)
  ledgeS: R(3, 49, 4, H - 1), // cornisa que sube al Mirador Sur
  alcove: R(8, 30, 10, 32), // rellano de la Metagrossita
});

/** Hueco del sendero del oeste (G14: Reconstrucción). Zócalos a los dos lados; se alzan x 3–5, y 25–26. */
export const GAP_W = Object.freeze({
  cells: Object.freeze(rect(3, 25, 5, 26)),
  sockets: Object.freeze([P(4, 24, 2), P(4, 27, 8)]),
});
/** Hueco del rellano de la Metagrossita (una losa). */
export const GAP_ALCOVE = Object.freeze({ cells: Object.freeze([[7, 31]]), socket: P(6, 31, 6) });

/** Este: la Bajada del Rey y los rellanos de su Calzada. */
export const EAST = Object.freeze({
  rock: R(30, 0, 39, 5), // roca de la Puerta de la Bajada (acantilado; cara en 3–5)
  landing1: R(30, 6, 38, 10),
  landing2: R(29, 22, 38, 27),
  landing3: R(27, 40, 35, 45),
});
/** La Puerta de la Bajada (warp a la Peña del Rey) y la llegada desde ella. */
export const BAJADA = Object.freeze({ dintel: Object.freeze({ x: 33, y: 2 }), door: Object.freeze({ x: 35, y: 5 }), arrive: P(35, 6, 2) });

/** La Calzada del Rey sobre el vacío (estrado de 3 de ancho): del primer rellano al segundo y al tercero. */
export const CALZADA = Object.freeze([R(34, 14, 36, 21), R(31, 31, 33, 39)]);
/**
 * Escaleras de piedra (escalera_terraza 3×3) sobre la cara de un rellano: bajan hacia la Calzada. Solo se pisa la
 * columna central (x + 1); las otras dos son barandilla.
 */
export const STAIRS = Object.freeze([Object.freeze({ x: 34, y: 11 }), Object.freeze({ x: 31, y: 28 })]);
export const inStairs = (x, y) => STAIRS.some((s) => x >= s.x && x <= s.x + 2 && y >= s.y && y <= s.y + 2);

/** Último tramo: entre el tercer rellano y el Umbral. Solo con la Tabla Draco (la última Crónica completa el camino). */
export const GAP_FINAL = Object.freeze({
  cells: Object.freeze(rect(25, 41, 26, 43)),
  socket: P(27, 42, 4),
  /** Llegada al tercer rellano (fin de la Calzada): sin la Tablilla, Zygarde nota que el camino sigue y no sabe por dónde. */
  deadEnd: Object.freeze([[31, 40], [32, 40], [33, 40]]),
});

/** El Umbral: explanada de losas ante la Puerta de las Quince. */
export const UMBRAL = Object.freeze({
  plaza: R(11, 38, 24, 48),
  rock: R(12, 30, 23, 37), // la roca de la Puerta (acantilado; cara en 35–37)
  dintel: Object.freeze({ x: 16, y: 34 }), // pilar_dintel 5×4: hueco x 17–19, filas 35–37
  door: Object.freeze({ x: 18, y: 37 }), // warp a puerta_quince (se empuja hacia arriba desde (18,38))
  arrive: P(18, 38, 2), // llegada al volver de la Puerta (B20 lee `puertaQuinceArrival` de la definición)
  landing: Object.freeze([[24, 41], [24, 42], [24, 43]]), // primeras losas del Umbral tras el último tramo
  stele: Object.freeze({ x: 22, y: 45 }), // pilar_placa_unown 2×2 (base en y 46): se lee desde (22,47)
});

/** Pilas del antiguo Puente y agujas: tierra sin acceso (decorado del abismo). */
export const ISLETS = Object.freeze([R(18, 14, 20, 16), R(22, 20, 23, 21), R(9, 20, 10, 20), R(20, 50, 22, 51), R(35, 50, 37, 51), R(27, 32, 27, 33)]);

const LAND = [
  ...Object.values(WEST), EAST.landing1, EAST.landing2, EAST.landing3, ...CALZADA, UMBRAL.plaza, ...ISLETS,
];
/** ¿Tierra pisable (o isla) en el mapa? (sin contar las rocas, las escaleras ni lo que alza la Reconstrucción) */
export function isLand(x, y) {
  return LAND.some((r) => inRect(r, x, y));
}
/** ¿Roca maciza (acantilados de la Bajada y de la Puerta)? */
export const isRock = (x, y) => inRect(EAST.rock, x, y) || inRect(UMBRAL.rock, x, y);
/** ¿Vacío de la Sima? (dentro del mapa; las escaleras cuelgan sobre la cara de un rellano y no son vacío) */
export const isChasm = (x, y) => x >= 0 && x < W && y >= 0 && y < H && !isLand(x, y) && !isRock(x, y) && !inStairs(x, y);

// ───────────────────────────── Contenido ─────────────────────────────

/** Llegadas para pruebas y E2E. */
export const ARRIVALS = Object.freeze({
  north: P(11, 1, 2), // desde la Senda del Mirador
  south: P(3, H - 2, 8), // desde el Mirador Sur
  bajada: BAJADA.arrive, // desde la Peña del Rey
});

/** Estela de los Custodios en la Repisa Norte (pilar_placa_unown 2×2, base en y 10): se lee desde (13,11). */
export const REPISA_STELE = Object.freeze({ x: 13, y: 9 });

/**
 * Zonas con encuentros (Cueva / ruina de POKEDEX_DISTRIBUCION §7.3): el oeste (cornisas, Repisa, sendero y rellano; el
 * Umbral, x 11–24 desde la fila 30, queda fuera) y los rellanos de la Calzada.
 */
export const ENCOUNTER_RECTS = Object.freeze([R(0, 0, 16, 29), R(0, 30, 10, H - 1), R(27, 6, 39, 45)]);

export const ITEMS = Object.freeze([
  Object.freeze({ id: 'objeto_sima_1', x: 9, y: 31, item: 'METAGROSSITE' }), // rellano aparte (Reconstrucción)
  Object.freeze({ id: 'objeto_sima_2', x: 15, y: 11, item: 'MAXREVIVE' }),
  Object.freeze({ id: 'objeto_sima_3', x: 1, y: 40, item: 'STARPIECE', hidden: true }),
  Object.freeze({ id: 'objeto_sima_4', x: 37, y: 26, item: 'FULLRESTORE' }),
  Object.freeze({ id: 'objeto_sima_5', x: 12, y: 47, item: 'ULTRABALL', count: 3 }),
  Object.freeze({ id: 'objeto_sima_6', x: 34, y: 44, item: 'PPUP' }),
]);

export const TRAINERS = Object.freeze([
  Object.freeze({ id: 'montanera_olaya', trainer: 'b19_montanera_olaya', x: 5, y: 17, dir: 4, sight: 3 }),
  Object.freeze({ id: 'veterano_ruperto', trainer: 'b19_veterano_ruperto', x: 2, y: 36, dir: 6, sight: 3 }),
]);
