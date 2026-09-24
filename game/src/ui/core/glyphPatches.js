// Glifos de píxeles: correcciones de las fuentes de Añil y escalado entero sin pérdidas (módulo PURO).
//
// Las fuentes Power Green de Añil son de píxeles (rejilla de 64 unidades): a su tamaño nativo (`grid` px por
// em) cada píxel de fuente cae exactamente en un píxel de pantalla. text.js rasteriza cada glifo a ese
// tamaño y lo amplía por vecino más cercano, así ningún trazo desaparece al umbralizar.
//
// Power Green Small y Power Green Narrow (letras de 4 px) traen mal los contornos de algunas letras en el
// TTF: la «m» sale «#.#. / ##.#», la «w», la «M» y la «W» parecen una «H», y los puntos suspensivos solo
// tienen dos puntos. La «l» de Small lleva un banderín que invade la letra anterior («ll» se funde en una
// barra). Estas matrices (en píxeles de fuente) sustituyen a esos glifos.

/**
 * Glifo corregido: `rows` de arriba abajo; la última fila queda justo encima de la línea base, `raise` píxeles
 * más arriba (guiones) o `below` por debajo (descendentes). `adv` = avance en píxeles de fuente.
 * Las rayas (— y –) no existen en ninguna Power Green: se dibujan a la altura de su guion.
 */
const SMALL = {
  m: { adv: 6, rows: ['####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'] },
  w: { adv: 6, rows: ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'] },
  M: { adv: 6, rows: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'] },
  W: { adv: 6, rows: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'] },
  l: { adv: 2, rows: ['#', '#', '#', '#', '#', '#', '#'] },
  '…': { adv: 6, rows: ['#.#.#'] },
  '—': { adv: 7, raise: 3, rows: ['######'] },
  '–': { adv: 5, raise: 3, rows: ['####'] },
};

const NARROW = {
  m: { adv: 6, rows: ['####.', '#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#'] },
  w: { adv: 6, rows: ['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'] },
  M: { adv: 6, rows: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#', '#...#', '#...#'] },
  W: { adv: 6, rows: ['#...#', '#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '##.##', '#...#'] },
  '…': { adv: 6, rows: ['#.#.#'] },
  '—': { adv: 7, raise: 4, rows: ['######'] },
  '–': { adv: 5, raise: 4, rows: ['####'] },
};

const REGULAR = {
  '—': { adv: 8, raise: 4, rows: ['#######'] },
  '–': { adv: 6, raise: 4, rows: ['#####'] },
};

export const GLYPH_PATCHES = {
  'Power Green': REGULAR,
  'Power Green Small': SMALL,
  'Power Green Narrow': NARROW,
};

/**
 * Máscara de un glifo: `bits[y * w + x]` (1 = tinta); (x0, y0) = posición de la columna/fila 0 respecto al
 * origen del glifo (x) y a la línea base (y, negativa hacia arriba). `adv` = avance.
 * @typedef {{ adv: number, x0: number, y0: number, w: number, h: number, bits: Uint8Array }} GlyphMask
 */

/** @returns {GlyphMask|null} glifo corregido de `family` para `ch`, o null si el TTF sirve tal cual. */
export function patchedGlyph(family, ch) {
  const p = GLYPH_PATCHES[family]?.[ch];
  if (!p) return null;
  const bottom = (p.below || 0) - (p.raise || 0);
  const h = p.rows.length;
  const w = Math.max(...p.rows.map((r) => r.length));
  const bits = new Uint8Array(w * h);
  p.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] === '#') bits[y * w + x] = 1;
  });
  return { adv: p.adv, x0: 0, y0: bottom - h, w, h, bits };
}

const EPS = 1e-9;

/** Primer píxel de pantalla del píxel de fuente `i` a escala `s` (s ≥ 1: cada píxel ocupa al menos uno). */
export function scaledEdge(i, s) {
  return Math.floor(i * s + EPS);
}

/**
 * Amplía una máscara por vecino más cercano. Con escala entera cada píxel de fuente es un cuadrado de
 * s×s; con escala fraccionaria cada uno ocupa ⌊s⌋ o ⌈s⌉ píxeles, pero nunca cero (no se pierden trazos).
 * @param {GlyphMask} mask
 * @param {number} s  escala (≥ 1)
 * @returns {GlyphMask} máscara en píxeles de pantalla
 */
export function scaleMask(mask, s) {
  if (!(s >= 1)) throw new Error(`Escala de glifo no válida: ${s} (mínimo 1).`);
  const tx0 = scaledEdge(mask.x0, s);
  const ty0 = scaledEdge(mask.y0, s);
  const w = scaledEdge(mask.x0 + mask.w, s) - tx0;
  const h = scaledEdge(mask.y0 + mask.h, s) - ty0;
  const bits = new Uint8Array(Math.max(0, w * h));
  for (let y = 0; y < mask.h; y++) {
    const ya = scaledEdge(mask.y0 + y, s) - ty0;
    const yb = scaledEdge(mask.y0 + y + 1, s) - ty0;
    for (let x = 0; x < mask.w; x++) {
      if (!mask.bits[y * mask.w + x]) continue;
      const xa = scaledEdge(mask.x0 + x, s) - tx0;
      const xb = scaledEdge(mask.x0 + x + 1, s) - tx0;
      for (let yy = ya; yy < yb; yy++) bits.fill(1, yy * w + xa, yy * w + xb);
    }
  }
  return { adv: Math.round(mask.adv * s), x0: tx0, y0: ty0, w, h, bits };
}
