// Coordenadas de Caleta Sonda (docs/CAMPANA.md §1.3: pueblo de pescadores y buzos, 36×32, tileset 1 con palmeras;
// E Ruta 15 · O/S Arrecife del Eco y Mar del Sur). Arriba, en la meseta que llega de la Ruta 15, el Centro pequeño; una
// escalera baja al pueblo: el Faro Sonda en la punta oeste (Ramón), la tienda de pesca (Supercaña), la casa de los
// buzos, la playa, el embarcadero del ferri y el muelle de buzos (Buceo: hito de B13). Módulo puro.
//   T árboles · . hierba · : senda de arena · s playa · w mar · q piedra de muelle · d muelle de madera
export const W = 36;
export const H = 32;

/** Meseta del noreste (pincel `terraza`: muros laterales en x 20–21 y cara en las filas 15–17). */
export const PLATEAU = Object.freeze({ x0: 20, faceY: 15, stairs: { x: 24, y: 15 } });

export const TERRAIN = Object.freeze([
  ['w', 0, 25, 36, 7], ['w', 0, 6, 3, 19],
  ['T', 0, 0, 20, 3], ['T', 0, 3, 2, 3], ['T', 20, 0, 6, 3], ['T', 34, 0, 2, 10],
  [':', 24, 10, 12, 4], [':', 24, 14, 5, 1],
  [':', 24, 18, 5, 2], [':', 3, 18, 26, 2], [':', 3, 11, 3, 7], [':', 12, 9, 3, 9],
  ['s', 3, 20, 33, 5],
  ['q', 9, 25, 4, 5],
  ['d', 21, 25, 3, 6],
]);

export function terrainGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (const [c, x, y, w, h] of TERRAIN) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) g[j][i] = c;
  }
  return g;
}

export const EXITS = Object.freeze({
  east: { x: W - 1, y0: 10, y1: 13, to: 'ruta_15' },
});

export const BUILDINGS = Object.freeze({
  centro: { stamp: 'centro_pokemon', x: 27, y: 1, door: { x: 30, y: 9 }, to: 'caleta_centro' },
  tienda: { stamp: 'tienda_turquesa', x: 10, y: 3, door: { x: 13, y: 8 }, to: 'caleta_tienda' },
  faro: { stamp: 'faro', x: 3, y: 3, door: { x: 4, y: 11 }, to: 'caleta_faro' },
  buzos: { stamp: 'casa_rosa', x: 15, y: 13, door: { x: 16, y: 16 }, to: 'caleta_casa_buzos' },
  pescadores: { stamp: 'casa_rosa', x: 7, y: 12, door: { x: 8, y: 15 }, to: null },
});

export const INTERIOR_ENTRIES = Object.freeze({
  caleta_centro: { x: 9, y: 12 },
  caleta_tienda: { x: 4, y: 9 },
  caleta_faro: { x: 6, y: 9 },
  caleta_casa_buzos: { x: 6, y: 9 },
});

/** Muelle de buzos (Buceo, B13), embarcadero del ferri, bosque de algas y células. */
export const DIVERS = Object.freeze({
  dock: { x: 21, y: 25, w: 3, h: 6 },
  resonance: { x: 22, y: 30, dir: 2 }, // extremo del muelle: casilla prevista para la resonancia del Buceo (B13)
  diver: { x: 23, y: 30, dir: 2 },
  ainhoa: { x: 20, y: 28, dir: 6 }, // en el agua junto al muelle (charset de nadadora): ve las tres tablas del muelle
  kelpDive: { x: 31, y: 28 }, // remolino del bosque de algas (Buceo → caleta_algas)
});
export const FERRY = Object.freeze({ pier: { x: 9, y: 25, w: 4, h: 5 }, sailor: { x: 10, y: 29, dir: 8 }, sign: { x: 13, y: 24 } });
export const CELLS = Object.freeze({ c064: { x: 26, y: 29 } }); // C064: frente al muelle de buzos (Nadar)

export const PALMS = Object.freeze([[5, 20], [17, 20], [27, 20], [22, 4]]);
export const COAST_ROCKS = Object.freeze([{ id: 'binacle_caleta_1', x: 3, y: 21 }, { id: 'binacle_caleta_2', x: 35, y: 24 }]);
export const SEA_ROCKS = Object.freeze([[29, 27], [33, 29], [30, 30], [6, 29], [17, 30], [1, 12], [1, 17]]);

export const SPOTS = Object.freeze({
  townSign: { x: 33, y: 9 },
  netMender: { x: 9, y: 19, dir: 2 },
  oldLady: { x: 20, y: 22, dir: 2 },
  kid: { x: 25, y: 21, dir: 4 },
  gardener: { x: 24, y: 8, dir: 2 },
  barbaraclite: { x: 32, y: 23 }, // Barbaraclita: rocas de la playa (POKEDEX §7.7)
  rocks: [[31, 21], [33, 21]],
});

export const ITEMS = Object.freeze([
  { id: 'megapiedra_barbaraclita', x: SPOTS.barbaraclite.x, y: SPOTS.barbaraclite.y, item: 'BARBARACITE', hidden: true },
  { id: 'objeto_caleta_1', x: 7, y: 22, item: 'NETBALL' },
  { id: 'objeto_caleta_2', x: 24, y: 5, item: 'SUPERPOTION', hidden: true },
]);

export const FLY_POINT = Object.freeze({ x: 30, y: 10, dir: 2 });
export const FERRY_ARRIVAL = Object.freeze({ x: 10, y: 26, dir: 2 });
export const START = Object.freeze({ x: 34, y: 11, dir: 4 });
