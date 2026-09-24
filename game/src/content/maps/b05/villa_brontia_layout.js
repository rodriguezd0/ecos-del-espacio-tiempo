// Coordenadas de Villa Brontia (B05; CAMPANA §1.3: «Meseta con molinos y campanario», 44×40, tileset 1) y de sus
// interiores. Fuente única para el constructor, los warps de ida y vuelta, los eventos y el README. Módulo puro.

export const W = 44;
export const H = 40;

/** Calles (camino de arena) y plaza. */
export const STREETS = Object.freeze({
  west: { x: 0, y: 18, w: 15, h: 4 }, // desde la Ruta 4
  east: { x: 29, y: 18, w: W - 29, h: 4 }, // hacia la Ruta 5
  north: { x: 20, y: 0, w: 4, h: 16 }, // hacia la Ruta 11
  south: { x: 20, y: 25, w: 5, h: H - 25 }, // hacia la Ruta 6 (bajada por la escalera del borde de la meseta)
});
export const PLAZA = Object.freeze({ x: 15, y: 16, w: 14, h: 9 });

/** Borde sur de la meseta (cara de la terraza) y escalera de bajada al cañón. */
export const MESETA_EDGE = Object.freeze({ faceY: 37, stairs: { stamp: 'escalera_terraza_ancha', x: 20, y: 37 } });

/** Edificios: stamp, esquina superior izquierda y casilla de la puerta (warp exterior → interior). */
export const BUILDINGS = Object.freeze({
  centro: { stamp: 'centro_pokemon', x: 1, y: 5, door: { x: 4, y: 13 } },
  tienda: { stamp: 'tienda_turquesa', x: 9, y: 8, door: { x: 12, y: 13 } },
  abril: { stamp: 'casa_turquesa_balcon', x: 28, y: 2, door: { x: 30, y: 8 } },
  posada: { stamp: 'edificio_naranja', x: 2, y: 24, door: { x: 4, y: 30 } },
  granero: { stamp: 'granero_verde', x: 10, y: 24, door: { x: 12, y: 29 } },
  subestacion: { stamp: 'central', x: 32, y: 25, door: { x: 37, y: 32 } },
  estacion: { stamp: 'edificio_turquesa_ancho', x: 25, y: 28, door: { x: 28, y: 33 } },
});

/** Campanario de Sixto (sprite propio de 3×7 casillas; evento en la casilla de la puerta). */
export const TOWER = Object.freeze({ x: 25, y: 15, footprint: [[24, 12], [26, 12], [24, 13], [25, 13], [26, 13], [24, 14], [25, 14], [26, 14], [24, 15], [26, 15]] });

/** Molinos de viento del cerro (sprite 3×5; evento en la casilla de la puerta). `stuck` = el de la C027. */
export const MILLS = Object.freeze([
  { id: 'molino_norte', x: 37, y: 6 },
  { id: 'molino_atascado', x: 40, y: 10, stuck: true },
  { id: 'molino_sur', x: 36, y: 14 },
]);

/** Corrales de Wooloo (valla) y su puerta. */
export const PENS = Object.freeze({ x: 8, y: 31, w: 11, h: 6, gate: { x: 12, y: 31 } });

/** Farolas de hierro (esquina superior del stamp 1×4) de la plaza y las calles: luces cuando vuelve la corriente. */
export const LAMPS = Object.freeze([[16, 13], [28, 13], [15, 22], [28, 22], [42, 14]]);

/** Cartel del pueblo (junto a la calle oeste, a la entrada desde la Ruta 4). */
export const TOWN_SIGN = Object.freeze({ x: 9, y: 22 });

/** Llegadas a los interiores (sobre el felpudo, mirando arriba) — ver los mapas brontia_*. */
export const INTERIOR_ENTRIES = Object.freeze({
  brontia_centro: { x: 9, y: 12 },
  brontia_tienda: { x: 4, y: 9 },
  brontia_casa_abril: { x: 6, y: 9 },
  brontia_posada: { x: 7, y: 10 },
  brontia_subestacion: { x: 9, y: 11 },
  brontia_estacion: { x: 13, y: 15 },
  brontia_campanario: { x: 5, y: 10 },
});

/** Punto de Vuelo y llegada del tren (delante del Centro Pokémon y de la estación). */
export const FLY_POINT = Object.freeze({ x: 4, y: 14, dir: 2 });
export const TRAIN_ARRIVAL = Object.freeze({ x: 28, y: 34, dir: 2 });

/** Límites del pueblo: bordes con salida. */
export const EXITS = Object.freeze({
  west: { x: 0, y0: 18, y1: 21 },
  east: { x: W - 1, y0: 18, y1: 21 },
  north: { y: 0, x0: 20, x1: 23 },
  south: { y: H - 1, x0: 20, x1: 24 },
});
