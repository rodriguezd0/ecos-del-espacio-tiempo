// Coordenadas de la Ruta 8 · Marisma Turbia y Palafitos (docs/CAMPANA.md §1.4: 50×70, tileset 6, SE Lúmina · NO
// Mnemos; B09 parte B y TABLILLAS T08). Fuente única para el constructor, los eventos, el README y los tests.
// Salidas acordadas con los bloques vecinos: este (filas 63–66) ↔ Ciudad Lúmina oeste (maps/b09a/links.js, offset 54)
// y norte (x 30–33) ↔ Aldea Mnemos sur (maps/b10/pending_links.js, offset 0).
// Módulo puro. El terreno se describe con rectángulos de «carácter» que se pintan en orden (el último gana):
//   T árboles · . hierba · : senda de tierra roja · m barro (Terreno complicado) ·
//   w agua quieta de la marisma · " juncal (hierba alta: encuentros) · b tablones sobre el agua (puentes)
export const W = 50;
export const H = 70;

/** Rectángulos de terreno [carácter, x, y, w, h] en orden de pintado. */
export const TERRAIN = Object.freeze([
  // Bordes de arboleda (x pares y anchos pares: el pincel de bosque trabaja por parejas de columnas).
  ['T', 0, 0, 30, 4], ['T', 34, 0, 16, 4], ['T', 0, 4, 4, 64], ['T', 46, 4, 4, 59], ['T', 4, 4, 2, 4],
  // Sur: arboleda de 4 filas (árboles enteros) hasta el pasillo de Lúmina; bajo el pasillo, un matorral (build).
  ['T', 0, 66, 46, 4],
  // Norte: senda de Mnemos con su paso de barro entre dos charcas, prados y juncales.
  [':', 30, 0, 4, 22],
  ['w', 26, 4, 4, 5], ['w', 34, 4, 4, 5],
  ['m', 30, 5, 4, 3],
  ['"', 8, 5, 10, 4], ['"', 20, 5, 5, 4], ['"', 40, 4, 6, 4], ['"', 34, 17, 5, 4], ['"', 6, 10, 4, 4],
  // Bordes irregulares de los juncales (salientes y muescas: que no queden rectángulos perfectos).
  ['"', 10, 9, 5, 1], ['.', 8, 5, 2, 1], ['"', 21, 4, 3, 1], ['"', 42, 8, 3, 1], ['.', 45, 4, 1, 1],
  ['"', 35, 21, 3, 1], ['.', 38, 17, 1, 1], ['"', 4, 11, 2, 2],
  // Llanura de la bomba C (noroeste) con la poza Q1.
  ['m', 12, 13, 7, 7],
  // Bolsa de lodo de Q3 (el lodo más denso), con un cuello hacia el prado y otro hacia la senda.
  ['m', 21, 15, 7, 5], ['m', 24, 13, 2, 2], ['m', 28, 16, 2, 2],
  // Llanura de la bomba B (noreste) con la poza Q2 y C044.
  ['m', 37, 9, 8, 7],
  // Laguna (la antigua Laguna Clara) con los islotes de los Palafitos.
  ['w', 8, 22, 36, 19],
  [':', 4, 22, 4, 20], // senda de la orilla oeste
  ['.', 8, 22, 2, 2], ['.', 40, 22, 4, 3], ['.', 20, 22, 6, 1], // orilla norte irregular
  ['.', 12, 28, 10, 6], // islote P1 (casa de Remedios)
  ['.', 25, 28, 13, 11], // islote P2 (Palafitos: casas, puesto, embarcadero)
  [':', 13, 32, 8, 2], [':', 26, 33, 10, 3], [':', 30, 36, 5, 2],
  ['b', 8, 31, 4, 1], ['b', 22, 31, 3, 1], ['b', 38, 34, 2, 1],
  ['.', 40, 28, 6, 14], // orilla este
  // Sur: senda hacia Lúmina, llanura de la bomba A, poza Q4, charca y juncales.
  [':', 40, 33, 4, 29], [':', 38, 62, 4, 4],
  ['m', 33, 44, 6, 6],
  ['m', 5, 46, 8, 7],
  ['"', 14, 49, 10, 5], ['"', 26, 42, 6, 4], ['"', 5, 42, 6, 3], ['"', 16, 59, 8, 5], ['"', 28, 58, 6, 4],
  ['"', 8, 63, 6, 3],
  ['"', 16, 48, 5, 1], ['.', 23, 53, 1, 1], ['"', 27, 41, 3, 1], ['.', 31, 45, 1, 1], ['"', 14, 64, 3, 1],
  ['"', 24, 62, 3, 2],
  ['w', 27, 50, 5, 4], ['w', 6, 56, 7, 4],
  // Paso de barro de Lúmina (puerta de Terreno complicado): el pasillo de la salida este solo da al barro.
  ['m', 42, 62, 4, 4],
  [':', 46, 63, 4, 4], // pasillo de Lúmina: justo las filas de la salida (63–66)
]);

/** Rejilla de caracteres [y][x] (pura). */
export function terrainGrid() {
  const g = Array.from({ length: H }, () => Array(W).fill('.'));
  for (const [c, x, y, w, h] of TERRAIN) {
    for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (i >= 0 && j >= 0 && i < W && j < H) g[j][i] = c;
  }
  return g;
}

/** Salidas por los bordes (acordadas con B09a y B10, ver README). */
export const EXITS = Object.freeze({
  north: { y: 0, x0: 30, x1: 33, to: 'aldea_mnemos' }, // Aldea Mnemos (B10): su salida sur x 30–33, offset 0
  east: { x: W - 1, y0: 63, y1: 66, to: 'ciudad_lumina' }, // Ciudad Lúmina (B09a): su salida oeste filas 9–12
});
/** Offsets de conexión (world/mapLoader.js#connectionOffset). */
export const LINKS = Object.freeze({ mnemos: 0, lumina: 54 });

/** Pasos de barro que abren Terreno complicado (G5): el de Lúmina y el de la senda de Mnemos. */
export const MUD_GATES = Object.freeze([
  { id: 'paso_lumina', x: 42, y: 62, w: 4, h: 4 },
  { id: 'paso_mnemos', x: 30, y: 5, w: 4, h: 3 },
]);

/** Casas sobre pilotes (stamp `palafito` 6×8, puerta en [3,5]). */
export const HOUSES = Object.freeze({
  remedios: { x: 14, y: 25, door: { x: 17, y: 30 }, to: 'palafitos_remedios' },
  familia: { x: 26, y: 25, door: { x: 29, y: 30 }, to: 'palafitos_casa' },
  vacia: { x: 32, y: 25, door: { x: 35, y: 30 }, to: null },
});

/** Llegadas a los interiores (sobre el felpudo, mirando arriba). */
export const INTERIOR_ENTRIES = Object.freeze({
  palafitos_remedios: { x: 6, y: 9 },
  palafitos_casa: { x: 6, y: 9 },
});

/** Pilotes de los palafitos (poste sobre el agua, a los lados de las casas: nunca bajo un tejado). */
export const STILTS = Object.freeze([
  [13, 27], [20, 27], [25, 27], [38, 27], [12, 34], [21, 34], [24, 39], [36, 39], [31, 39], [27, 39],
]);

/** Estacas de muestreo de Alerce (TABLILLAS T08: seis puntos). `name` para el resumen de Alerce. */
export const STAKES = Object.freeze([
  { n: 1, x: 36, y: 53, name: 'la estaca de la vereda sur' },
  { n: 2, x: 15, y: 47, name: 'la del prado del suroeste' },
  { n: 3, x: 44, y: 30, name: 'la del embarcadero este' },
  { n: 4, x: 5, y: 35, name: 'la de la orilla oeste' },
  { n: 5, x: 28, y: 12, name: 'la del prado alto' },
  { n: 6, x: 20, y: 10, name: 'la del juncal del norte' },
]);

/** Pozas de lodo denso (candidatas). `source` = bajo ella está la Tablilla. */
export const POOLS = Object.freeze([
  { id: 'q1', x: 13, y: 18, where: 'la llanura de la bomba del noroeste' },
  { id: 'q2', x: 43, y: 13, where: 'la llanura de la bomba del noreste' },
  { id: 'q3', x: 24, y: 17, where: 'la bolsa de lodo bajo el prado alto', source: true },
  { id: 'q4', x: 8, y: 49, where: 'el barrizal del suroeste' },
]);
export const SOURCE_POOL = POOLS.find((p) => p.source);

/** Nivel de lectura (1–5) de una estaca respecto a un origen: cuanto más cerca, más sube la aguja. Puro. */
export function readingLevel(stake, source = SOURCE_POOL) {
  const d = Math.hypot(stake.x - source.x, stake.y - source.y);
  if (d <= 7) return 5;
  if (d <= 13) return 4;
  if (d <= 20) return 3;
  if (d <= 28) return 2;
  return 1;
}

export const READING_WORDS = Object.freeze({ 1: 'muy baja', 2: 'baja', 3: 'media', 4: 'alta', 5: 'muy alta' });

/** Bombas de lodo de Genesis y su técnico (combate de guion). `front` = casilla de reintento. */
export const PUMPS = Object.freeze([
  { n: 1, x: 35, y: 45, tech: { x: 36, y: 47, dir: 2, trainer: 'b09b_tecnica_bomba_1', front: { x: 36, y: 48, dir: 8 } } },
  { n: 2, x: 40, y: 10, tech: { x: 41, y: 12, dir: 2, trainer: 'b09b_tecnico_bomba_2', front: { x: 41, y: 13, dir: 8 } } },
  // El técnico 3 mira al oeste: se reintenta a su espalda, mirándolo (fuera de su línea de visión).
  { n: 3, x: 15, y: 14, tech: { x: 16, y: 16, dir: 4, trainer: 'b09b_tecnico_bomba_3', front: { x: 17, y: 16, dir: 4 } } },
]);

/** Células (§2.3): C044 barro junto a la bomba del noreste (D) y C072 aguas hondas de la laguna (F, Nadar). */
export const CELLS = Object.freeze({
  c044: { x: 38, y: 14 },
  c072: { x: 18, y: 38 },
});

/** Escenas y personajes. */
export const SPOTS = Object.freeze({
  arrival: { x: 47, y0: 63, y1: 66 }, // franja de llegada desde Lúmina (pasillo este)
  panPump: { x: 35, y: 45 },
  alerceFrom: { x: 24, y: 31 }, // llega por el puente del islote grande
  alerceStation: { x: 33, y: 37, dir: 2 }, // su puesto de muestreo junto al agua
  kit: { x: 34, y: 37 },
  finale: { player: { x: 32, y: 37, dir: 6 }, remedios: { x: 31, y: 36, dir: 6 }, alerceExit: { x: 40, y: 34 } },
  youths: [{ x: 27, y: 36, dir: 6 }, { x: 28, y: 36, dir: 4 }],
  kid: { x: 14, y: 33, dir: 6 }, wooper: { x: 15, y: 33 },
  vendor: { x: 36, y: 33, dir: 4 },
  fisher: { x: 29, y: 38, dir: 2 },
  northMark: { y: 2, x0: 30, x1: 33 }, // senda de Mnemos: marca la salida del bloque
});

/** Espuma tóxica sobre el agua (desaparece al sanar la marisma). Lejos de tierra. */
export const FOAM = Object.freeze([[11, 25], [36, 24], [22, 38], [15, 37], [33, 23], [10, 38]]);

/** Objetos del mapa. */
export const ITEMS = Object.freeze([
  { id: 'objeto_marisma_1', x: 20, y: 46, item: 'FULLHEAL' },
  { id: 'objeto_marisma_2', x: 45, y: 8, item: 'SUPERREPEL' },
  { id: 'objeto_marisma_3', x: 17, y: 18, item: 'BLACKSLUDGE' },
  { id: 'objeto_marisma_4', x: 5, y: 65, item: 'TINYMUSHROOM', hidden: true },
  { id: 'objeto_marisma_5', x: 36, y: 21, item: 'REVIVE', hidden: true },
  { id: 'objeto_marisma_6', x: 45, y: 40, item: 'ULTRABALL' },
]);

/** Carteles. */
export const SIGNS = Object.freeze({
  lumina: { x: 39, y: 61 },
  mnemos: { x: 29, y: 9 },
  palafitos: { x: 45, y: 33 },
  consorcio: { x: 36, y: 9 },
});

/** Aparición por defecto: entrada desde Lúmina. */
export const START = Object.freeze({ x: 48, y: 64, dir: 4 });
