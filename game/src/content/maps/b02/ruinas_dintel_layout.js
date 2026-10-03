// Coordenadas de las Ruinas del Dintel (Pilar del Umbral, P1): fuente única para el build, los eventos, las
// pruebas y el recorrido E2E. Documentado en content/maps/b02/README.md. Módulo puro.
//
// Segundo piso: conserva las cinco salas de 44×40 talladas en la roca (brush `sala` de Cueva1) y sus coordenadas
// para las partidas anteriores. Los nombres históricos `guardiana` y `nucleo` son ahora rellanos del puzzle;
// el Guardián y el núcleo reales están en ruinas_dintel_nucleo.js. Recorrido de este piso:
//   Antesala (abajo) ──dintel── Galería de los Dinteles (centro-oeste) ──losa deslizante── Cámara de Geodude
//   (arriba-oeste) ──derrumbe con una roca── Rellano (arriba-este) ──dintel── Escalera al piso 3 (centro-este)
//   ──losa del atajo (se abre desde dentro tras restaurar)── Antesala.
// Las salas se dan como rectángulos de SUELO (x0..x1, y0..y1); el brush pone 3 casillas de pared a los lados, 4
// filas arriba y 1 abajo.

export const W = 44;
export const H = 40;

export const ROOMS = Object.freeze({
  antesala: Object.freeze({ x0: 8, x1: 35, y0: 29, y1: 34 }),
  galeria: Object.freeze({ x0: 3, x1: 24, y0: 17, y1: 23 }),
  nucleo: Object.freeze({ x0: 31, x1: 40, y0: 17, y1: 23 }),
  geodude: Object.freeze({ x0: 3, x1: 21, y0: 5, y1: 11 }),
  guardiana: Object.freeze({ x0: 28, x1: 40, y0: 5, y1: 11 }),
});

/**
 * Pasos verticales bajo un dintel (stamp `pilar_dintel` 5×4 en la pared norte de la sala de abajo; hueco de 3
 * casillas x..x+2). `rows` = filas que se tallan (pared sur de la sala de arriba + pared norte de la de abajo).
 * `slab` = losa que cierra el hueco (evento de 3×3 casillas anclado en su casilla inferior central).
 */
export const PASSAGES = Object.freeze({
  galeria: Object.freeze({ x: 12, rows: [24, 28], dintel: { x: 11, y: 25 } }),
  losa: Object.freeze({ x: 17, rows: [12, 16], dintel: { x: 16, y: 13 }, slab: { x: 18, y: 16 } }),
  nucleo: Object.freeze({ x: 33, rows: [12, 16], dintel: { x: 32, y: 13 } }),
  atajo: Object.freeze({ x: 33, rows: [24, 28], dintel: { x: 32, y: 25 }, slab: { x: 34, y: 28 } }),
});

/**
 * Túnel del derrumbe entre la Cámara de Geodude y la de la Guardiana: una casilla de alto pegada a la pared norte
 * (la cara de roca de ambas salas sigue por encima) y la roca que lo corta.
 */
export const TUNNEL = Object.freeze({ x0: 22, x1: 27, y: 5, rock: { x: 24, y: 5 } });

/** Entrada desde la explanada (claridad en la pared sur de la antesala). */
export const ENTRANCE = Object.freeze({ stamp: { x: 20, y: 34 }, warp: { x: 21, y: 35 }, arrive: { x: 21, y: 34, dir: 8 } });

// ─── Antesala ────────────────────────────────────────────────────────────────────────────────────
export const ANTESALA = Object.freeze({
  placa: { x: 21, y: 29 },          // estela con la inscripción (2×2) y su traducción grabada a punzón
  read: [{ x: 21, y: 30 }, { x: 22, y: 30 }],  // casillas de lectura (fila inferior de la estela)
  cell: { x: 15, y: 30 },           // C010 (camino de la entrada a la Galería)
  casilda: { x: 23, y: 31, dir: 4 }, // donde espera Casilda en la antesala (junto a la estela)
  heal: { x: 21, y: 33, dir: 8 },   // reaparición tras perder contra Casilda
  torches: [{ x: 18, y: 27 }, { x: 25, y: 27 }],
});

// ─── Galería de los Dinteles: tres alcobas con piedras giratorias (D08) ───────────────────────────
// Inscripción: «El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien entra.»
// Dirección RMXP: 2 abajo · 4 izquierda · 6 derecha · 8 arriba. Todas empiezan mirando a la pared (8).
// Cada alcoba mide 2 casillas entre dos columnas: la piedra y el hueco desde el que se gira (`from`, de lado,
// para que el jugador no tape la piedra al mirarla).
export const STONES = Object.freeze([
  Object.freeze({ id: 'piedra_alba', n: 1, x: 23, y: 18, answer: 6, from: { x: 22, y: 18, dir: 6 }, clue: 'alba (tragaluz al este)' }),
  Object.freeze({ id: 'piedra_agua', n: 2, x: 7, y: 18, answer: 4, from: { x: 8, y: 18, dir: 4 }, clue: 'estanque quieto al oeste; el arroyo del este es el señuelo' }),
  Object.freeze({ id: 'piedra_entrada', n: 3, x: 13, y: 18, answer: 2, from: { x: 14, y: 18, dir: 4 }, clue: 'la puerta de la antesala, al sur' }),
]);
export const GALERIA = Object.freeze({
  pond: { x: 3, y: 17, w: 3, h: 3 },        // estanque quieto (oeste de la piedra 2)
  stream: { x: 10, w: 2, y0: 17, y1: 24, spout: { x: 10, y: 15 }, bridge: 21 }, // arroyo que sale de la sala (señuelo)
  skylight: { x: 24, y: 20 },               // tragaluz: haz de luz de la mañana al este de la piedra 1
  entry: [{ x: 12, y: 23 }, { x: 13, y: 23 }, { x: 14, y: 23 }], // franja de llegada (comentario de Casilda)
  casilda: { x: 16, y: 21, dir: 8 },
  columns: [6, 9, 12, 15, 21, 24],         // columnas de las alcobas (x), a los lados de cada una
});

// ─── Cámara de Geodude y Cámara de la Guardiana ──────────────────────────────────────────────────
export const CAMARA = Object.freeze({
  entry: [{ x: 17, y: 11 }, { x: 18, y: 11 }, { x: 19, y: 11 }],
  crack: { x: 2, y: 7 },                   // grieta en la pared oeste
  geodude: { x: 3, y: 7 },                 // Geodude encajado en ella
  pull: { x: 4, y: 7, dir: 4 },            // casilla desde la que se tira (mirando a la izquierda)
  cell: { x: 12, y: 9 },                   // C012
  casilda: { x: 14, y: 9, dir: 4 },
  guardian: { x: 34, y: 10, dir: 4 },      // rellano donde Casilda se despide antes de subir al piso 3
  challenge: [{ x: 28, y: 5 }],            // coordenadas históricas de la salida del túnel
  tunnelOut: { x: 28, y: 5 },
});

// ─── Antiguo núcleo: rellano de la escalera al tercer piso ─────────────────────────────────────────
export const NUCLEO = Object.freeze({
  camara: { x: 33, y: 18 },                // pilar_camara_nucleo 5×5 (centro 35,20)
  column: { x: 35, y: 20 },                // centro de la escalera al tercer piso
  front: { x: 35, y: 22, dir: 8 },         // casilla del jugador al acercar el Core
  arca: { x: 39, y: 18 },                  // caja hexagonal que Casilda «siempre vio cerrada»
  entry: [{ x: 33, y: 17 }, { x: 34, y: 17 }, { x: 35, y: 17 }],
  casilda: { x: 33, y: 20, dir: 6 },
  lever: { x: 35, y: 24 },                 // desde aquí Casilda abre la losa del atajo
});

/** Iterador de rectángulo como lista de casillas. */
export function cells(x, y, w, h) {
  const out = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) out.push([x + i, y + j]);
  return out;
}
