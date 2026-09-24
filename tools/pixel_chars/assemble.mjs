// Ensamblado de charsets a partir de partes nativas (32×32 por frame, ampliadas ×2 al exportar).
// Convención de Essentials/RMXP: filas abajo, izquierda, derecha, arriba; columnas = patrón 0..3
// (0 y 2 de pie, 1 y 3 pasos opuestos).
import { Img, fromRows, compose, sheet } from '../pixel.mjs';

export const NATIVE = 32; // lado del frame nativo
export const SCALE = 2; // ampliación exacta al exportar (frame final 64×64)
export const PART_X = 7; // columna del frame donde empieza la rejilla local de 18 px de cabeza/cuerpo
export const BODY_Y = 16; // fila del frame donde empieza la rejilla del cuerpo
export const PART_W = 18; // ancho de la rejilla local de cabezas y cuerpos

const DIR_ROWS = ['down', 'left', 'right', 'up'];

/** Comprueba que todas las filas de una matriz tienen el mismo ancho. */
export function checkRows(name, rows, width = null) {
  const w = width || rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`${name}: la fila ${i} mide ${r.length}, se esperaba ${w} → "${r}"`);
  });
  return rows;
}

/** Duplica la fila `y` (estira el torso 1 px para adultos). */
export function stretchRows(rows, y) {
  return [...rows.slice(0, y + 1), rows[y], ...rows.slice(y + 1)];
}

/** Elimina la primera fila (para compensar un estiramiento sin cambiar la altura total). */
function dropFirst(rows) {
  return rows.slice(1);
}

/**
 * Construye un frame nativo 32×32.
 * @param {object} o
 * @param {string[]} o.head matriz de cabeza (18 de ancho)
 * @param {string[]} o.body matriz de cuerpo (18 de ancho, empieza en BODY_Y)
 * @param {string[][]} [o.overlays] matrices extra sobre el cuerpo (misma rejilla)
 * @param {number} o.lift desplazamiento vertical de la cabeza (px nativos, negativo = arriba)
 * @param {number} [o.headX] desplazamiento horizontal extra de la cabeza
 * @param {object} palette
 * @param {number} [o.tall] 1 → torso estirado 1 px (adulto)
 */
export function buildFrame({ head, body, overlays = [], lift = 0, headX = 0, tall = 0, stretchAt = 5 }, palette) {
  checkRows('cabeza', head, PART_W);
  checkRows('cuerpo', body, PART_W);
  overlays.forEach((o, i) => checkRows(`superposición ${i}`, o, PART_W));
  let bodyRows = body;
  let overlayRows = overlays;
  if (tall) {
    bodyRows = dropFirst(stretchRows(body, stretchAt));
    overlayRows = overlays.map((o) => dropFirst(stretchRows(o, stretchAt)));
  }
  const layers = [{ img: fromRows(bodyRows, palette), x: PART_X, y: BODY_Y - tall }];
  for (const o of overlayRows) layers.push({ img: fromRows(o, palette), x: PART_X, y: BODY_Y - tall });
  layers.push({ img: fromRows(head, palette), x: PART_X + headX, y: lift - tall });
  return compose(NATIVE, NATIVE, layers);
}

/**
 * Espeja brazos y piernas de una pose frontal/trasera conservando el torso (columnas `keep`
 * en las filas `rows`) e intercambiando luces y sombras para que la luz siga viniendo de la izquierda.
 */
export function mirrorLimbs(rows, { keepRows = [1, 8], keepCols = [5, 12] } = {}) {
  const SWAP = { L: 'j', j: 'L', P: 'p', p: 'P', Q: 'q', q: 'Q', S: 's', s: 'S', B: 'b', b: 'B', C: 'c', c: 'C' };
  return rows.map((row, y) => {
    const mirrored = [...row].reverse().map((ch) => SWAP[ch] || ch);
    if (y >= keepRows[0] && y <= keepRows[1]) {
      for (let x = keepCols[0]; x <= keepCols[1]; x++) mirrored[x] = row[x];
    }
    return mirrored.join('');
  });
}

/**
 * Hoja 4×4 de un personaje humano.
 * @param {object} ch especificación del personaje (heads, palette, tall, overlays)
 * @param {object} poses { down, left, up }: [p0, p1, p3] (el 2 repite el 0) o [p0, p1, p2, p3],
 *   con p = { key, body, lift }
 */
export function buildHumanSheet(ch, poses) {
  const rows = {};
  for (const dir of ['down', 'left', 'up']) {
    const mk = (p) => buildFrame({
      head: ch.heads[dir],
      body: p.body,
      overlays: (ch.overlays || []).map((ov) => ov[p.key]).filter(Boolean),
      lift: p.lift + (ch.headLift || 0),
      headX: p.headX || 0,
      tall: ch.tall || 0,
    }, ch.palette);
    const list = poses[dir];
    if (list.length === 3) {
      const f0 = mk(list[0]);
      rows[dir] = [f0, mk(list[1]), f0, mk(list[2])];
    } else if (list.length === 4) {
      rows[dir] = list.map(mk);
    } else {
      throw new Error(`Poses de "${dir}": se esperaban 3 o 4, hay ${list.length}`);
    }
  }
  rows.right = rows.left.map((f) => f.mirrorX());
  return sheet(DIR_ROWS.map((d) => rows[d]), NATIVE, NATIVE);
}

/** Hoja nativa → exportada con ampliación exacta (×SCALE por defecto). */
export function exportSheet(nativeSheet, scale = SCALE) {
  return nativeSheet.scale(scale);
}

export { Img };
