// Kit de partes de los PROTAGONISTAS (3.ª pasada, estilo de caminar BW/Gen 5): proporción chibi con cabeza
// grande (17 filas, ≈ la mitad de la figura), torso corto y piernas cortas; frame nativo 32×32 exportado ×2.
// Es independiente de assemble.mjs/body_jacket.mjs (que siguen sirviendo al resto del elenco sin cambios).
//
// Rejilla (coordenadas del frame nativo):
//   · columnas 7..24 (PROTA.x = 7, ancho 18) para cabeza y cuerpo;
//   · cabeza: matriz de 18×20 que empieza en la fila 0 (+ lift): pelo desde la fila 2, barbilla en la 18
//     (puede medir 20 o 22 de ancho, centrada, si el pelo sobresale: ver checkHead);
//   · cuerpo: capas que empiezan en PROTA.bodyY = 18; hombros en la 19, cadera en la 25, pies en la 30.
// Capas de una pose (todas opcionales salvo `legs`/`torso`), en orden de dibujo:
//   armBack (brazo lejano, bajo el torso) · legs · torso · bag · arms (brazos visibles) · head
// Cada capa es { x?, y, rows } en la rejilla del cuerpo (x = 0..17 → columnas 7..24; y = 0 → fila 18).
// `lift` (0 o −1, rebote BW) desplaza cabeza, torso, brazos y mochila; las piernas se dibujan tal cual
// (la pierna apoyada llega al suelo y la otra se levanta).
// Símbolos de paleta comunes (ver palettes.mjs): k contorno · H/h/m/n pelo · S/s/r piel, o línea de piel ·
// e pupila, w brillo, i iris · L/J/j/d chaqueta · G acento verde · T/t camiseta · P/p pantalón, Q/q pierna
// baja · B/b/W calzado · A/a/D/z mochila.
import { fromRows, compose, sheet } from '../pixel.mjs';

export const PROTA = Object.freeze({ native: 32, x: 7, w: 18, headH: 20, bodyY: 18 });
export const LAYER_ORDER = Object.freeze(['armBack', 'legs', 'torso', 'bag', 'arms']);
const LIFTED = new Set(['armBack', 'torso', 'bag', 'arms']);
const DIR_ROWS = ['down', 'left', 'right', 'up'];

/** Parte { x, y, rows } validada: filas de igual ancho y dentro de la rejilla de 18 columnas. */
export function part(y, rows, x = 0) {
  if (!Array.isArray(rows) || !rows.length) throw new Error('parte vacía');
  const w = rows[0].length;
  rows.forEach((r, i) => {
    if (r.length !== w) throw new Error(`parte (y=${y}): la fila ${i} mide ${r.length}, se esperaba ${w} → "${r}"`);
  });
  if (x < 0 || x + w > PROTA.w) throw new Error(`parte (y=${y}) fuera de la rejilla: x=${x}, ancho ${w}`);
  return Object.freeze({ x, y, rows: Object.freeze([...rows]) });
}

/** Copia de una parte con `map` de símbolos aplicado ({ from: to }); no modifica la original. */
export function recolorPart(p, map) {
  if (!p) return p;
  return part(p.y, p.rows.map((r) => [...r].map((ch) => map[ch] || ch).join('')), p.x);
}

/** Copia de una parte desplazada. */
export function shiftPart(p, dx = 0, dy = 0) {
  return p ? part(p.y + dy, p.rows, p.x + dx) : p;
}

/** Margen máximo (por lado) que puede sobresalir una cabeza de la rejilla de 18 columnas (p. ej. una melena). */
export const HEAD_MAX_PAD = 2;

/**
 * Cabeza { down, left, up } con 20 filas por vista y 18 columnas (la rejilla) o 18 + 2·pad (pad ≤ 2),
 * centrada sobre la rejilla: sirve para que una melena sobresalga por los lados sin mover la cara.
 */
export function checkHead(name, head) {
  for (const dir of ['down', 'left', 'up']) {
    const rows = head[dir];
    if (!rows || rows.length !== PROTA.headH) throw new Error(`${name}.${dir}: se esperaban ${PROTA.headH} filas`);
  }
  const w = head.down[0].length;
  const pad = (w - PROTA.w) / 2;
  if (!Number.isInteger(pad) || pad < 0 || pad > HEAD_MAX_PAD) {
    throw new Error(`${name}: ancho ${w}; se esperaba ${PROTA.w} + 2·pad (pad 0..${HEAD_MAX_PAD})`);
  }
  for (const dir of ['down', 'left', 'up']) {
    head[dir].forEach((r, i) => {
      if (r.length !== w) throw new Error(`${name}.${dir}: la fila ${i} mide ${r.length} → "${r}"`);
    });
  }
  return head;
}

/** Columnas que la cabeza sobresale por cada lado de la rejilla (0 en una cabeza de 18 px). */
const headPad = (headRows) => (headRows[0].length - PROTA.w) / 2;

/**
 * Frame nativo 32×32 de un protagonista.
 * @param {object} pose { lift, headX?, headY?, legs, torso, bag?, arms?, armBack? }
 * @param {string[]} headRows matriz de la cabeza en esa dirección (18×20)
 * @param {object} palette
 * @param {object} [o] { skip: nombres de capas a omitir, extra: capas { img, x, y } encima }
 */
export function buildProtaFrame(pose, headRows, palette, { skip = [], extra = [] } = {}) {
  const lift = pose.lift || 0;
  const layers = [];
  for (const name of LAYER_ORDER) {
    const p = pose[name];
    if (!p || skip.includes(name)) continue;
    const dy = LIFTED.has(name) ? lift : 0;
    layers.push({ img: fromRows(p.rows, palette), x: PROTA.x + p.x, y: PROTA.bodyY + p.y + dy });
  }
  if (headRows && !skip.includes('head')) {
    const x = PROTA.x - headPad(headRows) + (pose.headX || 0);
    layers.push({ img: fromRows(headRows, palette), x, y: lift + (pose.headY || 0) });
  }
  return compose(PROTA.native, PROTA.native, [...layers, ...extra]);
}

/**
 * Hoja 4×4 nativa (128×128) de un protagonista.
 * @param {{ head: object, palette: object }} spec
 * @param {{ down: object[], left: object[], up: object[] }} poses 3 poses (p0, p1, p3; p2 = p0) o 4
 */
export function buildProtaSheet(spec, poses) {
  const rows = {};
  for (const dir of ['down', 'left', 'up']) {
    const list = poses[dir];
    const mk = (p) => buildProtaFrame(p, spec.head[dir], spec.palette);
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
  return sheet(DIR_ROWS.map((d) => rows[d]), PROTA.native, PROTA.native);
}

/**
 * Añade la mochila a unas poses: `bag` = { down, left, up } con partes relativas al torso de la pose
 * (se suman la x/y del torso). Devuelve poses nuevas (no modifica las recibidas).
 */
export function withProtaBag(poses, bag) {
  const add = (dir) => poses[dir].map((p) => {
    const b = typeof bag[dir] === 'function' ? bag[dir](p) : bag[dir];
    return b ? { ...p, bag: b } : p;
  });
  return { down: add('down'), left: add('left'), up: add('up') };
}
