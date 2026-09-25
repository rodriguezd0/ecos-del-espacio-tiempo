// Piezas comunes de los mapas del Bloque 17 al borde de un vacío (la Sima del Eje en la Senda y el Mirador Sur; el mar
// de nubes alrededor de la Mesa de los Vientos). Módulo PURO.
//   · Vacío: capas 0 y 1 sin suelo y en la capa 2 el muro invisible (tile 503 de Exterior1/Exterior3: vacío que
//     bloquea, el mismo que usa el bosque bajo las copas). Por él asoma el panorama del mapa (render/panorama.js).
//   · Bordes: la cara de roca de la terraza de Añil (3 filas) cuelga bajo la tierra, el labio de hierba asoma por
//     encima y los muros laterales a los lados; se dibujan en la capa 1 de las casillas de vacío, así toda la tierra
//     sigue siendo pisable y todo el vacío bloquea. Una piedra alzada (capa 2) tapa la cara y se pisa.
//   · Zócalos: `socketTiles(img)` da los tiles del kit de Pilar del overlay (content/stamps/extraTiles.js).
import { extraDefs } from '../../stamps/extraTiles.js';

export const VOID_WALL = 503;

/** Piezas de la terraza de muros finos de Exterior1 / Exterior3 (mismos IDs; content/stamps/ExteriorBosqueCeleste.js). */
export const EDGE = Object.freeze({
  face: Object.freeze({ w0: [840, 848, 856], w1: [841, 849, 857], mid: [842, 850, 858], e1: [843, 851, 859], e0: [844, 852, 860] }),
  rim: Object.freeze({ w0: 824, w1: 817, mid: 818, e1: 819, e0: 828 }),
  side: Object.freeze({ w: 840, e: 844 }),
});

/** Tiles del kit de zócalos de un atlas ('Exterior1' | 'Exterior3'). */
export function socketTiles(image) {
  const S = extraDefs(image).stamps;
  const tile = (name) => S[name]?.tiles?.layers?.[2]?.[0] || 0;
  return Object.freeze({ stone: tile('pilar_zocalo'), worn: tile('pilar_zocalo_gastado'), live: tile('pilar_zocalo_vivo') });
}

/** Rectángulo inclusivo → casillas. */
export function rect(x0, y0, x1, y1) {
  const out = [];
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) out.push([x, y]);
  return out;
}

/** Rejilla de caracteres (filas de texto) → { w, h, at(x, y), cells(...chars) }. */
export function asciiGrid(rows) {
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const g = rows.map((r) => r.padEnd(w, ' '));
  const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? g[y][x] : null);
  const cells = (...chars) => {
    const out = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (chars.includes(g[y][x])) out.push([x, y]);
    return out;
  };
  return Object.freeze({ w, h, rows: g, at, cells });
}

/** Deja `cells` como vacío que bloquea (sin suelo; muro invisible en la capa 2). */
export function paintVoid(b, cells) {
  for (const [x, y] of cells) { b.set(0, x, y, 0); b.set(1, x, y, 0); b.set(2, x, y, VOID_WALL); }
}

/**
 * Bordes de roca en las casillas de vacío que tocan tierra. `isVoid(x, y)` y `isLand(x, y)` (tierra pisable junto al
 * vacío; fuera del mapa cuenta lo que diga el llamador). Cara bajo la tierra (hasta 3 filas), labio encima, muros a
 * los lados. `skip(x, y)` evita casillas (cascadas, zócalos con otro dibujo…).
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
        // la tierra está k filas por encima y entre medias todo es vacío
        id = EDGE.face[cls(x, y - k)][k - 1];
      }
      if (!id && isLand(x, y + 1)) id = EDGE.rim[cls(x, y + 1)];
      if (!id && isLand(x + 1, y)) id = EDGE.side.w;
      if (!id && isLand(x - 1, y)) id = EDGE.side.e;
      if (id) b.set(1, x, y, id);
    }
  }
}
