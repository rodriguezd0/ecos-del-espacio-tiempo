// Coordenadas y pauta de la Ruta 12, Senda del Lazo, tramo bajo (CAMPANA §1.4: «Ladera de la Cumbre Azur», 40×50,
// tileset 1, E Paso del Norte, BGM Transicion; B15: «En la Senda del Lazo se sube y se vuelve al principio»). Módulo
// puro: fuente única para el constructor, los eventos, los tests y el E2E.
//
// La ladera sube en cuatro caras de terraza, cada una con tres escaleras (oeste, centro, este). Solo una escalera por
// cara lleva de verdad al rellano de arriba; al coronar cualquiera de las otras, el camino se dobla y devuelve al
// principio (el lazo). La pauta se lee en el propio mapa: los pastores subían detrás de los Larvitar, y sus huellas de
// tres garras llevan en cada rellano hasta la escalera buena. En el tercer rellano unas huellas de botas (de los
// curiosos que se pierden) llevan a una escalera falsa; en el último la nieve fresca las ha tapado, pero un Larvitar
// espera al pie de la escalera buena. Encima, el mirador (Tyranitarita) y el tramo alto: un bucle que no se rompe.

export const SENDA = Object.freeze({
  width: 40,
  height: 50,
  east: { x: 39, y0: 40, y1: 42, offset: 28 }, // ↔ Paso del Norte west (y 12–14; offset −28)
  start: { x: 37, y: 41, dir: 4 },
  /** Casilla del principio a la que devuelve el lazo. */
  loopStart: { x: 29, y: 41, dir: 8 },
  /** Mesetas escalonadas (rectángulos que salen del mapa por arriba): la de cada cara contiene a las de encima. */
  plateaus: [
    { x0: 5, x1: 34, faceBottom: 34 }, // rellano 1 (suelo y 27–31)
    { x0: 7, x1: 32, faceBottom: 26 }, // rellano 2 (suelo y 19–23)
    { x0: 9, x1: 30, faceBottom: 18 }, // rellano 3 (suelo y 11–15)
    { x0: 11, x1: 28, faceBottom: 10 }, // mirador (suelo y 3–7)
  ],
  /**
   * Escaleras de cada cara (x de la columna izquierda del stamp 3×3; se sube por la del centro). La cara k separa el
   * suelo de abajo (fila faceBottom + 1) del rellano k (fila faceBottom − 3).
   */
  stairs: [
    { O: 8, N: 18, E: 28 },
    { O: 10, N: 19, E: 26 },
    { O: 12, N: 19, E: 25 },
    { O: 14, N: 19, E: 23 },
  ],
  /** La pauta de los Larvitar: cara 1 → este, 2 → oeste, 3 → centro, 4 → este. */
  pattern: ['E', 'O', 'N', 'E'],
  /** Llanura del principio (suelo transitable) y plaza con la piedra de los pastores. */
  base: { x0: 14, y0: 35, x1: 39, y1: 45 },
  guideStone: { x: 27, y: 38 },
  telmo: { x: 21, y: 40, dir: 6 },
  curiosa: { x: 33, y: 37, dir: 2 },
  /** Larvitar guía del último rellano (al pie de la escalera buena de la cara 4). */
  larvitar: { dir: 8 },
  /** Mirador: la madriguera de los Larvitar con la Tyranitarita, la aspirante y el tramo alto (el bucle verdadero). */
  mirador: { den: { x: 24, y: 3 }, stone: { x: 24, y: 4 }, pupitar: { x: 26, y: 5 }, ximena: { x: 14, y: 5, dir: 6 }, sign: { x: 17, y: 3 } },
  high: { y: 2, x0: 18, x1: 21, back: { x: 20, y: 7, dir: 2 } },
  items: { hyper: { x: 31, y: 29 }, revive: { x: 10, y: 21 }, hidden: { x: 33, y: 45 } },
});

/** Fila del suelo del rellano de ABAJO de la cara k (0–3) y la del rellano de ARRIBA. */
export const footRow = (k) => SENDA.plateaus[k].faceBottom + 1;
export const topRow = (k) => SENDA.plateaus[k].faceBottom - 3;

/** Columna por la que se sube la escalera `side` de la cara k. */
export const stairColumn = (k, side) => SENDA.stairs[k][side] + 1;

/** Escalera buena de la cara k → { side, x (columna de subida), foot: [x, y], top: [x, y] }. */
export function correctStair(k) {
  const side = SENDA.pattern[k];
  const x = stairColumn(k, side);
  return { side, x, foot: [x, footRow(k)], top: [x, topRow(k)] };
}

/** Casillas de coronación de las escaleras falsas: subir a ellas (mirando arriba) devuelve al principio. */
export function wrongTops() {
  const out = [];
  SENDA.stairs.forEach((row, k) => {
    for (const side of ['O', 'N', 'E']) {
      if (side === SENDA.pattern[k]) continue;
      out.push({ face: k, side, x: stairColumn(k, side), y: topRow(k) });
    }
  });
  return out;
}

/**
 * Rastro de huellas entre dos casillas: primero en vertical hasta la fila `turnY`, luego en horizontal y al final en
 * vertical hasta el pie de la escalera. Una huella cada dos casillas. → [{ x, y, dir }] (dir = fila de la hoja)
 */
export function trail(from, to, turnY) {
  const out = [];
  const [fx, fy] = from;
  const [tx, ty] = to;
  let step = 0;
  const put = (x, y, dir) => { if (step++ % 2 === 0) out.push({ x, y, dir }); };
  for (let y = fy; y > turnY; y--) put(fx, y, 8);
  const hdir = tx < fx ? 4 : 6;
  for (let x = fx; x !== tx; x += tx < fx ? -1 : 1) put(x, turnY, hdir);
  for (let y = turnY; y >= ty; y--) put(tx, y, 8);
  return out;
}
