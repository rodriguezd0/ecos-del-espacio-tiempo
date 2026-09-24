// Ciudad Lúmina (CAMPANA §1.3: 72×64, tileset 3 Exterior2 con el museo de piezas propias): FUENTE ÚNICA de las
// coordenadas del mapa (puertas, calles, plaza, parque, salidas y puestos de los personajes). La usan la
// construcción (lumina_build.js), la definición (ciudad_lumina.js), los eventos (content/events/b09a_lumina*.js) y
// las salidas de los interiores. Módulo puro.
//
// Plano: al norte, el Paseo del Mirador (y 9–12) con la tienda de trastos, la pastelería, el Hotel Mirador y la
// guardería; la verja del Mirador Sur (B17) en x 33–36. En el centro, la terraza del Museo de las Eras con su
// escalinata sobre la Plaza de las Eras. Al este, la estación central con la vía que llega de la Ruta 7 y la
// Avenida del Este; al sureste, el Centro Pokémon y los Grandes Almacenes; al suroeste, el Parque de las Eras; al
// sur, la Puerta del Delta (Ruta 14).
import { INTERNAL } from './links.js';

export const W = 72;
export const H = 64;

/** Salidas por los bordes. */
export const EXITS = Object.freeze({
  east: { x: 71, y0: 30, y1: 33, offset: INTERNAL.luminaToRuta7 }, // Ruta 7
  south: { y: 63, x0: 34, x1: 37, offset: INTERNAL.luminaToRuta14 }, // Ruta 14 y Reserva del Delta
  west: { x: 0, y0: 9, y1: 12 }, // Ruta 8 (B09b)
  north: { y: 0, x0: 33, x1: 36, gate: { x: 33, y: 1 } }, // Mirador Sur (B17)
});

/** Calles y plazas (rectángulos [x, y, w, h] de adoquín con bordillo). */
export const STREETS = Object.freeze({
  promenade: [0, 9, 70, 4], // Paseo del Mirador
  gatePath: [33, 0, 4, 9],
  westStreet: [20, 13, 4, 25],
  eastStreet: [47, 13, 5, 16],
  plaza: [20, 28, 33, 10], // Plaza de las Eras
  avenue: [52, 29, 20, 5], // Avenida del Este (la salida es y 30–33)
  southAvenue: [34, 38, 4, 26],
  crossStreet: [38, 48, 34, 3], // Calle de los Almacenes
  westBlock: [2, 21, 18, 3], // calle de los bloques del oeste
  westLane: [2, 13, 3, 8],
  parkGate: [28, 48, 6, 3],
  centerFront: [53, 44, 9, 4],
  stationSide: [52, 17, 6, 12],
});

/** Terraza del museo (brush `terraza`: la cara sur ocupa las 3 últimas filas) y su escalinata. */
export const TERRACE = Object.freeze({ x: 25, y: 13, w: 22, h: 15 });
export const STAIRS = Object.freeze({ x: 33, y: 25, w: 5, h: 3 }); // escalera_terraza_ancha

/** Edificios (esquina superior izquierda del stamp) y sus puertas. `walk` = casilla real de entrada si difiere. */
export const BUILDINGS = Object.freeze({
  trastos: { stamp: 'casa_pizarra', x: 3, y: 3, door: { x: 5, y: 8 } }, // tienda de trastos
  pasteleria: { stamp: 'restaurante', x: 11, y: 2, door: { x: 13, y: 8 } },
  hotel: { stamp: 'edificio_crema', x: 41, y: 2, door: { x: 43, y: 8 } }, // Hotel Mirador
  guarderia: { stamp: 'casa_turquesa_grande', x: 50, y: 3, door: { x: 53, y: 8 } },
  museo: { stamp: 'museo_eras', x: 32, y: 15, door: { x: 36, y: 22 } }, // Museo de las Eras (pieza propia)
  estacion: { stamp: 'grandes_almacenes', x: 58, y: 18, door: { x: 61, y: 28 } }, // estación central
  centro: { stamp: 'centro_pokemon', x: 54, y: 35, door: { x: 57, y: 43 } },
  almacenes: { stamp: 'tienda_torre', x: 62, y: 34, door: { x: 65, y: 47 } }, // Grandes Almacenes
  // Viviendas sin interior (puerta cerrada con aviso)
  bloque1: { stamp: 'bloque_verde_alto', x: 18, y: 3 },
  bloque2: { stamp: 'bloque_verde_puerta', x: 24, y: 2, door: { x: 26, y: 7 } },
  bloque3: { stamp: 'bloque_verde_puerta', x: 3, y: 14, door: { x: 5, y: 19 } },
  bloque4: { stamp: 'bloque_verde', x: 9, y: 14 },
  bloque5: { stamp: 'bloque_verde_alto', x: 14, y: 14 },
  rosa: { stamp: 'edificio_rosa', x: 3, y: 24, door: { x: 6, y: 30 } },
  granate: { stamp: 'casa_granate', x: 11, y: 26, door: { x: 12, y: 29 } },
  bloque6: { stamp: 'bloque_verde', x: 40, y: 51 },
  bloque7: { stamp: 'bloque_verde', x: 46, y: 51 },
  bloque8: { stamp: 'bloque_verde_alto', x: 53, y: 51 },
  bloque9: { stamp: 'bloque_verde', x: 59, y: 51 },
});

/** Vía del tren (llega de la Ruta 7 por el este) y su topera junto a la estación. */
export const RAIL = Object.freeze({ y: 15, x0: 57, x1: 71, stop: { x: 56, y: 15 }, fenceN: 14, fenceS: 16 });

/** Patio de la guardería (vallado) con sus Pokémon. */
export const YARD = Object.freeze({ x: 58, y: 2, w: 13, h: 7 });

/** Parque de las Eras (suroeste). */
export const PARK = Object.freeze({
  x: 2, y: 38, w: 30, h: 20,
  grass: [[3, 40, 8, 6], [11, 51, 8, 6], [21, 51, 8, 5]],
  pond: [20, 40, 6, 4],
  monument: { x: 12, y: 40 }, // estatuas gemelas «las Eras»
});

/** Personajes y puntos de interés. */
export const SPOTS = Object.freeze({
  bellboy: { x: 66, y: 31, dir: 4 }, // botones del Hotel Mirador (gala)
  gael: { x: 35, y: 25, dir: 2 }, // en la escalinata del museo (B3)
  gaelTrigger: { y: 28, x0: 33, x1: 37 }, // pie de la escalinata
  tutor: { x: 16, y: 47, dir: 2 },
  flyPoint: { x: 57, y: 44, dir: 2 }, // delante del Centro
  trainArrival: { x: 61, y: 29, dir: 2 },
  dockExit: { x: 44, y: 21, dir: 2 }, // salida del muelle de carga del museo (jardín este de la terraza)
  entrySign: { x: 68, y: 28 },
});

/**
 * Casilla de llegada en cada interior (felpudo o alfombra de la entrada; el jugador aparece mirando arriba). La fuente
 * única es esta tabla: la usan la definición de Lúmina (warps de las puertas) y los interiores (sus salidas).
 */
export const INTERIOR_ENTRY = Object.freeze({
  lumina_almacenes: { x: 9, y: 15 },
  lumina_museo: { x: 19, y: 16 },
  lumina_museo_der: { x: 28, y: 16 },
  lumina_hotel: { x: 13, y: 20 },
  lumina_guarderia: { x: 7, y: 10 },
  lumina_trastos: { x: 7, y: 10 },
  lumina_pasteleria: { x: 7, y: 10 },
  lumina_estacion: { x: 13, y: 15 },
});

/** Llegada al salir de cada interior (casilla bajo la puerta). */
export const OUTSIDE = Object.freeze(Object.fromEntries(
  Object.entries(BUILDINGS).filter(([, b]) => b.door).map(([k, b]) => [k, { x: b.door.x, y: b.door.y + 1, dir: 2 }]),
));
