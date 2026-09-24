// Coordenadas de Ciudad Nexo (docs/CAMPANA.md §1.3: puerto y nudo de comunicaciones, 64×52, tileset 1; N Ruta 14 ·
// O Ruta 15 · S/E Mar del Sur). Fuente única para el constructor, los eventos, los interiores, el README y los tests.
// La ciudad es un llano de ladrillo con la plaza del mercado; al sur, el muelle de piedra con el embarcadero de los
// ferris, el pantalán de los pescadores y el espigón del faro; al este, el brazo del Albo que desemboca junto al
// astillero; al suroeste, la playa que sigue hacia la Ruta 15. Módulo puro.
//   T árboles · B ladrillo · P plaza adoquinada · q piedra de muelle · s arena · w agua · d pantalán de madera · . jardín
export const W = 64;
export const H = 52;

export const TERRAIN = Object.freeze([
  ['w', 0, 38, 64, 14], ['w', 57, 3, 5, 35],
  ['T', 0, 0, 30, 3], ['T', 34, 0, 28, 3], ['T', 62, 0, 2, 38], ['T', 0, 3, 2, 17], ['T', 0, 24, 2, 8],
  ['B', 2, 3, 55, 29], ['B', 30, 0, 4, 3], ['B', 0, 20, 2, 4],
  ['.', 16, 3, 3, 8], ['.', 25, 3, 5, 7], ['.', 43, 3, 2, 8], ['.', 52, 3, 5, 10], ['.', 2, 16, 8, 3],
  ['.', 45, 13, 4, 8], ['.', 11, 16, 6, 3],
  ['P', 18, 13, 26, 11],
  ['q', 11, 32, 46, 6], ['q', 24, 38, 5, 11], ['q', 44, 38, 5, 12],
  ['s', 0, 32, 11, 11],
  ['d', 12, 38, 3, 8],
]);

export function terrainGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (const [c, x, y, w, h] of TERRAIN) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) g[j][i] = c;
  }
  return g;
}

/** Salidas: norte (Ruta 14, B09a: su camino sur x 28–31, offset 2) y oeste (Ruta 15). */
export const EXITS = Object.freeze({
  north: { y: 0, x0: 30, x1: 33, to: 'ruta_14_reserva' },
  west: { x: 0, y0: 20, y1: 23, to: 'ruta_15' },
});

/** Edificios: stamp, esquina y puerta (warp exterior → interior; `to: null` = puerta cerrada). */
export const BUILDINGS = Object.freeze({
  estacion: { stamp: 'torre_cristal', x: 2, y: 3, door: { x: 8, y: 12 }, to: 'nexo_estacion' },
  correos: { stamp: 'edificio_naranja', x: 19, y: 4, door: { x: 21, y: 10 }, to: 'nexo_correos' },
  centro: { stamp: 'centro_pokemon', x: 36, y: 3, door: { x: 39, y: 11 }, to: 'nexo_centro' },
  tienda: { stamp: 'tienda_turquesa', x: 45, y: 4, door: { x: 48, y: 9 }, to: 'nexo_tienda' },
  casaRio: { stamp: 'casa_azul_grande', x: 50, y: 14, door: { x: 52, y: 18 }, to: null },
  casaOeste: { stamp: 'casa_azul_grande', x: 3, y: 24, door: { x: 5, y: 28 }, to: null },
  pescador: { stamp: 'casa_azul', x: 12, y: 25, door: { x: 15, y: 29 }, to: 'nexo_casa_pescador' },
  aduana: { stamp: 'edificio_cupula', x: 35, y: 24, door: { x: 38, y: 30 }, to: null },
  astillero: { stamp: 'central', x: 45, y: 23, door: { x: 50, y: 30 }, to: 'nexo_astillero' },
  faro: { stamp: 'faro', x: 45, y: 38, door: { x: 46, y: 46 }, to: 'nexo_faro' },
});

/** Llegadas a los interiores (sobre el felpudo, mirando arriba). */
export const INTERIOR_ENTRIES = Object.freeze({
  nexo_estacion: { x: 13, y: 15 },
  nexo_correos: { x: 4, y: 9 }, // geometría de tienda estándar (services/shop.js SHOP_LAYOUT.door)
  nexo_centro: { x: 9, y: 12 },
  nexo_tienda: { x: 4, y: 9 },
  nexo_casa_pescador: { x: 6, y: 9 },
  nexo_astillero: { x: 10, y: 18 },
  nexo_faro: { x: 6, y: 9 },
});

/** Plaza del mercado: fuente, puestos (el tendero va dibujado en el toldo: se le habla desde abajo), barriles. */
export const PLAZA = Object.freeze({
  fountain: { x: 29, y: 13 },
  stalls: [
    { stamp: 'puesto_mercado', x: 20, y: 19, role: 'pescado' },
    { stamp: 'puesto_mercado_2', x: 24, y: 19, role: 'mar' },
    { stamp: 'puesto_mercado', x: 35, y: 19, role: 'herreros' },
    { stamp: 'puesto_mercado_2', x: 39, y: 19, role: 'fruta' },
  ],
  barrels: [[27, 21], [33, 21]],
  palms: [[18, 13], [42, 13], [18, 21], [42, 21]],
});

/** Puerto: pantalán, embarcadero de los ferris, espigón y barcos. */
export const PORT = Object.freeze({
  wall: { y: 38, spans: [[16, 23], [29, 43], [49, 56]] }, // muro del muelle (filas 38–39) entre embarcaderos
  dock: { x: 12, y: 38, w: 3, h: 8 },
  fisher: { x: 13, y: 45, dir: 2 },
  ferryPier: { x: 24, y: 38, w: 5, h: 11 },
  ferrySailor: { x: 26, y: 48, dir: 8 },
  ferry: { x: 29, y: 42, w: 11, h: 5 }, // yate amarrado: los ferris no salen hasta P7 (casco: filas 1–4)
  binoculars: { x: 24, y: 48 },
  breakwater: { x: 44, y: 38, w: 5, h: 12 },
  boats: [['velero', 16, 40], ['velero_2', 17, 45], ['velero', 38, 48]],
  // Plataforma del Consorcio (Talasa) mar adentro, sprite 4×3 anclado abajo; por encima de la franja que tapa la
  // ventana de mensajes cuando la cámara llega al borde sur del mapa.
  platform: { x: 54, y: 47 },
  buoys: [[21, 49], [34, 50], [41, 41], [58, 48]],
  beachRail: { y: 31, x0: 2, x1: 10, gap: [6, 7, 8] },
});

/** Células: C075 en la desembocadura del Albo (etapa F, Nadar). */
export const CELLS = Object.freeze({ c075: { x: 60, y: 44 } });

/** NPC, carteles y objetos. */
export const SPOTS = Object.freeze({
  townSignN: { x: 34, y: 3 },
  townSignW: { x: 3, y: 19 },
  ferrySign: { x: 23, y: 37 },
  shipyardSign: { x: 44, y: 31 },
  aduanaDoor: { x: 38, y: 30 },
  sailorQuay: { x: 31, y: 34, dir: 2 },
  fountainLady: { x: 28, y: 18, dir: 6 },
  benchOld: { x: 23, y: 16, dir: 2 },
  kid: { x: 34, y: 16, dir: 4 },
  rogelio: { x: 20, y: 35, dir: 6 },
  riverFisher: { x: 55, y: 20, dir: 6 },
});

export const ITEMS = Object.freeze([
  { id: 'objeto_nexo_1', x: 3, y: 41, item: 'PEARL', hidden: true },
  { id: 'objeto_nexo_2', x: 7, y: 39, item: 'SHOALSHELL' },
  { id: 'objeto_nexo_3', x: 55, y: 34, item: 'HEARTSCALE', hidden: true },
  { id: 'objeto_nexo_4', x: 48, y: 48, item: 'DAMPROCK' },
  { id: 'objeto_nexo_5', x: 53, y: 5, item: 'SUPERREPEL', hidden: true },
]);

/** Punto de Vuelo, llegada del tren (delante de la estación) y del ferri (embarcadero). */
export const FLY_POINT = Object.freeze({ x: 39, y: 12, dir: 2 });
export const TRAIN_ARRIVAL = Object.freeze({ x: 8, y: 13, dir: 2 });
export const FERRY_ARRIVAL = Object.freeze({ x: 26, y: 40, dir: 2 });
export const START = Object.freeze({ x: 31, y: 2, dir: 2 });
