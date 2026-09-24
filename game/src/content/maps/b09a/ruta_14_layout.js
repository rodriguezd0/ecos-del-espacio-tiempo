// Ruta 14 y Reserva del Delta (CAMPANA §1.4: 60×60, tileset 6 ExteriorSafari): delta tropical. FUENTE ÚNICA de las
// coordenadas del mapa. La usan la construcción (ruta_14_build.js), la definición (ruta_14_reserva.js), los eventos
// (content/events/b09a_reserva.js, b09a_t07.js) y las pruebas.
//
// Oeste: la Ruta 14, camino de arena que baja de Lúmina (norte, x 28–31) a Ciudad Nexo (sur, x 28–31) cruzando dos
// brazos del delta por pasarelas. Este: la Reserva del Delta, vallada, con la puerta y el puesto de guardas en
// (36, 33–36); dentro, la laguna (Nadar/Buceo, etapas F/G), la colmena gigante (T07), la pradera de flores, el huerto
// (Applin, árbol de miel, C043) y, tras el enjambre que cierra el sendero del sur, la «Reserva interior» (abre con T07).
import { INTERNAL, PENDING_LINKS } from './links.js';

export const W = 60;
export const H = 60;

export const EXITS = Object.freeze({
  north: { y: 0, x0: 28, x1: 31, offset: INTERNAL.ruta14ToLumina }, // Ciudad Lúmina
  south: { y: 59, x0: 28, x1: 31, offset: PENDING_LINKS.ruta_14_reserva.ciudad_nexo.offset }, // Ciudad Nexo (B09b)
});

/** Camino de arena de la ruta (rectángulos [x, y, w, h]). */
export const PATH = Object.freeze([
  [28, 0, 4, 10], [12, 6, 20, 4], [12, 6, 4, 31], [12, 33, 24, 4], [28, 33, 4, 27],
]);

/** Brazos del delta (agua con orilla; entran por el borde oeste) y laguna de la Reserva. */
export const WATER = Object.freeze({
  channelA: [0, 17, 42, 3], // brazo norte: se une a la laguna
  channelB: [0, 45, 35, 3], // brazo sur
  lagoon: [41, 6, 14, 15],
});

/** Pasarelas de tablones N–S de 3 de ancho sobre los brazos (una fila de tierra a cada lado del agua). */
export const BRIDGES = Object.freeze([{ x: 12, y: 16, h: 5 }, { x: 28, y: 44, h: 5 }]);

/** Valla de la Reserva (x 36) con la puerta y el hueco del brazo norte. */
export const FENCE = Object.freeze({ x: 36, y0: 2, y1: 53, gate: { y0: 33, y1: 36 }, water: { y0: 17, y1: 19 } });

/** Zonas de la Reserva. */
export const RESERVE = Object.freeze({
  x: 37, y: 4, w: 20, h: 50,
  hive: { x: 40, y: 28, tiles: [39, 26, 3, 3] }, // evento (96×96) anclado abajo en el centro
  hiveFront: { x: 40, y: 29 }, // casilla desde la que se habla con la colmena (mirando arriba)
  meadow: [44, 23, 13, 11], // Pradera de flores
  orchard: [40, 38, 17, 9], // Huerto
  shore: [42, 21, 13, 2], // orilla sur de la laguna (Ribera)
  hedge: { y: 47, x0: 37, x1: 56, gap: [45, 46, 47] }, // seto entre el huerto y la Reserva interior
  interior: [37, 48, 20, 6],
  movedHive: { x: 54, y: 52, tiles: [53, 50, 3, 3] }, // la colmena, mudada tras T07
  post: { stamp: 'caseta_turquesa_peque', x: 31, y: 26 }, // puesto de guardas (fuera de la valla)
});

/** Flores de T07: la buena de cada zona (con polen) y los señuelos. */
export const FLOWERS = Object.freeze({
  pradera: { good: { x: 54, y: 26 }, decoys: [[46, 25], [49, 30], [52, 32], [47, 28]] },
  ribera: { good: { x: 51, y: 22 }, decoys: [[43, 22], [46, 21], [53, 21]] },
  huerto: { good: { x: 43, y: 45 }, decoys: [[49, 43], [51, 45], [52, 40], [42, 43]] },
});

/** Obreras que llevan el polen desde la colmena (salida) y el punto de su flor (llegada). */
export const WORKERS = Object.freeze({
  pradera: { from: { x: 42, y: 27 }, to: { x: 54, y: 25 } },
  ribera: { from: { x: 40, y: 25 }, to: { x: 51, y: 21 } },
  huerto: { from: { x: 38, y: 29 }, to: { x: 43, y: 44 } },
});

/** Hierba alta (encuentros): ruta y Reserva interior. */
export const GRASS = Object.freeze([
  [3, 3, 8, 7], [17, 21, 9, 5], [3, 24, 7, 8], [17, 38, 9, 5], [3, 48, 9, 5], [33, 48, 2, 5],
  [45, 30, 8, 3], [38, 49, 8, 4], [48, 49, 4, 4],
]);

export const SPOTS = Object.freeze({
  guard: { x: 35, y: 37, dir: 8 }, // guarda de la Reserva, junto a la puerta
  ivanGate: { x: 37, y: 34, dir: 4 }, // Iván en la puerta (con la pista abierta)
  ivanAfter: { x: 38, y: 31, dir: 2 },
  swarm: [[45, 47], [46, 47], [47, 47]], // enjambre que cierra la Reserva interior
  applin: { x: 48, y: 42 },
  honeyTree: { x: 44, y: 40 }, // tronco del manzano viejo (se usa desde abajo)
  dive: { x: 48, y: 12 }, // remolino de la laguna (Buceo)
  signNorth: { x: 26, y: 2 },
  signGate: { x: 33, y: 37 },
  signSouth: { x: 32, y: 52 },
});
