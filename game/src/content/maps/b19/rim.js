// Vacío de la Sima y sus bordes para los mapas del Bloque 19 (Calzada del Rey y Sima del Eje). Mismo lenguaje visual
// que la Senda del Mirador de B17 (content/maps/b17/rim.js), copiado aquí para no depender de un módulo de otro bloque
// que se edita en paralelo. Módulo PURO.
//   · Vacío: capas 0 y 1 sin suelo y en la capa 2 el muro invisible (tile 503 de Exterior1: vacío que bloquea). Por él
//     asoma el panorama del mapa (render/panorama.js, shader `sima`).
//   · Bordes (capa 1 de las casillas de vacío que tocan tierra): la cara de roca de la terraza de Añil (3 filas) cuelga
//     bajo la tierra, el labio de hierba asoma por encima y los muros finos a los lados. Toda la tierra se pisa y todo el
//     vacío bloquea; una losa alzada (capa 2, prioridad 0) tapa el borde y se pisa.
import { VOID_BLOCK } from './tiles.js';

/** Piezas de la terraza de muros finos de Exterior1 (filas 54–59). */
export const EDGE = Object.freeze({
  face: Object.freeze({ w0: [840, 848, 856], w1: [841, 849, 857], mid: [842, 850, 858], e1: [843, 851, 859], e0: [844, 852, 860] }),
  rim: Object.freeze({ w0: 824, w1: 817, mid: 818, e1: 819, e0: 828 }),
  side: Object.freeze({ w: 840, e: 844 }),
});

/** Rectángulo inclusivo → casillas. */
export function rect(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

/** Deja `cells` como vacío que bloquea (sin suelo; muro invisible en la capa 2). */
export function paintVoid(b, cells) {
  for (const [x, y] of cells) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, VOID_BLOCK); }
}

/**
 * Bordes de roca en las casillas de vacío que tocan tierra. `isVoid(x, y)` y `isLand(x, y)` (tierra junto al vacío;
 * fuera del mapa cuenta lo que diga el llamador). Cara bajo la tierra (hasta `faceRows` filas), labio encima, muros a
 * los lados. `skip(x, y)` evita casillas con otro dibujo.
 */
export function paintVoidEdges(b, isVoid, isLand, { W, H, skip = null, faceRows = 3 } = {}) {
  const cls = (x, y) => {
    if (!isLand(x - 1, y)) return 'w0';
    if (!isLand(x + 1, y)) return 'e0';
    if (!isLand(x - 2, y)) return 'w1';
    if (!isLand(x + 2, y)) return 'e1';
    return 'mid';
  };
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!isVoid(x, y) || (skip && skip(x, y))) continue;
      let id = 0;
      for (let k = 1; k <= faceRows && !id; k++) {
        if (!isLand(x, y - k)) { if (!isVoid(x, y - k)) break; continue; }
        id = EDGE.face[cls(x, y - k)][k - 1];
      }
      if (!id && isLand(x, y + 1)) id = EDGE.rim[cls(x, y + 1)];
      if (!id && isLand(x + 1, y)) id = EDGE.side.w;
      if (!id && isLand(x - 1, y)) id = EDGE.side.e;
      if (id) b.set(1, x, y, id);
    }
  }
}

/** Conjunto de claves «x,y» → predicado. */
export function cellSet(cells) {
  const s = new Set(cells.map(([x, y]) => `${x},${y}`));
  return (x, y) => s.has(`${x},${y}`);
}
