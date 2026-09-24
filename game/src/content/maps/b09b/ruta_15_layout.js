// Coordenadas de la Ruta 15 · Sendero de los Acantilados (docs/CAMPANA.md §1.4: 90×40, tileset 1; E Nexo · O Caleta
// Sonda; sendero libre tras P4). Arriba, la meseta con el sendero entre pinos y el mirador; una pared de acantilado la
// separa de las dos calas (playas con dunas, pescadores y rocas con Binacle); al sur, el Mar del Sur. Módulo puro.
//   T árboles · . hierba · : sendero de arena · s arena de la cala · w mar · " hierba de duna
export const W = 90;
export const H = 40;

/** Cara del acantilado (3 filas, pincel `terraza` de la meseta) y escaleras de bajada a las calas. */
export const CLIFF = Object.freeze({ faceY: 22, stairs: [{ x: 14, y: 22 }, { x: 72, y: 22 }] });

export const TERRAIN = Object.freeze([
  ['w', 0, 25, 90, 15],
  ['T', 0, 0, 90, 3], ['T', 0, 3, 2, 9], ['T', 0, 16, 2, 6], ['T', 88, 3, 2, 11], ['T', 88, 18, 2, 4],
  ['T', 20, 3, 8, 3], ['T', 52, 3, 10, 2], ['T', 36, 3, 4, 4],
  // Sendero de la meseta: de Nexo (este, filas 14–17) a Caleta Sonda (oeste, filas 12–15), con bajadas a las calas.
  [':', 60, 14, 30, 4], [':', 30, 10, 34, 4], [':', 60, 10, 4, 8], [':', 0, 12, 34, 4], [':', 30, 10, 4, 6],
  [':', 72, 18, 5, 4], [':', 14, 16, 5, 6], [':', 44, 14, 4, 6],
  ['"', 3, 17, 8, 4], ['"', 78, 18, 8, 3], ['"', 52, 18, 6, 3],
  // Calas: la del oeste (hacia Caleta) y la del este (hacia Nexo), separadas por el acantilado que cae al mar.
  // La cala del este baja hasta la fila 36 para seguir sin escalón en la playa de Nexo (sus filas 32–42).
  ['s', 0, 25, 31, 6], ['s', 48, 25, 42, 6], ['s', 78, 31, 12, 6],
  ['"', 3, 25, 6, 2], ['"', 22, 25, 5, 2], ['"', 55, 25, 7, 2],
  ['d', 63, 31, 3, 6],
]);

export function terrainGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (const [c, x, y, w, h] of TERRAIN) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) g[j][i] = c;
  }
  // La cara del acantilado (filas 22–24) la pinta el pincel de terraza sobre la hierba.
  return g;
}

export const EXITS = Object.freeze({
  east: { x: W - 1, y0: 14, y1: 17, to: 'ciudad_nexo' },
  west: { x: 0, y0: 12, y1: 15, to: 'caleta_sonda' },
});

/** Mirador sobre el acantilado. */
export const LOOKOUT = Object.freeze({ binoculars: { x: 47, y: 20 }, bench: { x: 41, y: 19 }, sign: { x: 43, y: 16 } });

/** Rocas de la costa con Binacle (visible fijo, POKEDEX §7.3): se les habla desde la arena. */
export const BINACLE_ROCKS = Object.freeze([
  { id: 'binacle_r15_1', x: 6, y: 30 },
  { id: 'binacle_r15_2', x: 52, y: 30 },
  { id: 'binacle_r15_3', x: 86, y: 36 },
]);

/** Pantalán de los pescadores en la cala del este y caseta de redes. */
export const JETTY = Object.freeze({ x: 63, y: 31, w: 3, h: 6, boat: { x: 66, y: 32 } });
export const HUT = Object.freeze({ x: 84, y: 25, door: { x: 85, y: 28 } });

/** Rocas sueltas en el agua (decoración): muchas al pie del acantilado, entre las calas. */
export const SEA_ROCKS = Object.freeze([
  [12, 33], [25, 32], [32, 26], [35, 28], [38, 25], [40, 29], [43, 26], [46, 27], [45, 33], [58, 34], [72, 32],
  [3, 36], [75, 37], [39, 34],
]);

export const SPOTS = Object.freeze({
  fishers: [{ x: 58, y: 29, dir: 2 }, { x: 64, y: 36, dir: 2 }],
  signEast: { x: 86, y: 13 },
  signWest: { x: 4, y: 11 },
  signCove: { x: 71, y: 19 },
});

export const TRAINERS = Object.freeze([
  // En el agua junto al pantalán (charset de nadadora): ve las tres tablas del pantalán.
  { id: 'nadadora_marina', trainer: 'b09b_nadadora_marina', name: 'Nadadora Marina', sprite: 'anil:nadadora', x: 62, y: 34, dir: 6, sight: 3 },
  { id: 'pescador_andres', trainer: 'b09b_pescador_andres', name: 'Pescador Andrés', sprite: 'anil:pescador', x: 26, y: 30, dir: 2, sight: 2 },
  { id: 'ornitologo_bruno', trainer: 'b09b_ornitologo_bruno', name: 'Ornitólogo Bruno', sprite: 'anil:ornitologo', x: 36, y: 19, dir: 6, sight: 3 },
  { id: 'excursionista_elena', trainer: 'b09b_excursionista_elena', name: 'Excursionista Elena', sprite: 'anil:excursionista_f', x: 55, y: 9, dir: 2, sight: 4 },
  { id: 'veterano_tomas', trainer: 'b09b_veterano_tomas', name: 'Veterano Tomás', sprite: 'anil:veterano', x: 49, y: 18, dir: 4, sight: 2 },
]);

export const ITEMS = Object.freeze([
  { id: 'objeto_r15_1', x: 10, y: 6, item: 'HYPERPOTION' },
  { id: 'objeto_r15_2', x: 18, y: 28, item: 'BIGPEARL', hidden: true },
  { id: 'objeto_r15_3', x: 67, y: 27, item: 'STARDUST', hidden: true },
  { id: 'objeto_r15_4', x: 86, y: 33, item: 'PEARL' },
  { id: 'objeto_r15_5', x: 76, y: 6, item: 'ELIXIR' },
  { id: 'objeto_r15_6', x: 28, y: 26, item: 'SHOALSALT' },
]);

export const START = Object.freeze({ x: 87, y: 15, dir: 4 });
