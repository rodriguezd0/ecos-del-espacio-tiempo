// Piezas del jinete (protagonistas) para monturas y acciones de campo: torso sentado, pierna de perfil
// sentada y piernas colgantes. Reutiliza cabezas, paletas, cuerpo "chaqueta" y mochila (D06).
// PROVISIONAL (D30).
import { fromRows } from '../pixel.mjs';
import { PALETTES } from './palettes.mjs';
import { PROTA_M, PROTA_F } from './heads_protas.mjs';
import { WALK } from './body_jacket.mjs';
import { withBackpack } from './backpack.mjs';
import { buildFrame, checkRows } from './assemble.mjs';

export const PROTAS = Object.freeze({
  protagonista_m: { heads: PROTA_M, palette: PALETTES.protagonista_m },
  protagonista_f: { heads: PROTA_F, palette: PALETTES.protagonista_f },
});

/** Datos de un protagonista o error claro. */
export function prota(id) {
  const p = PROTAS[id];
  if (!p) throw new Error(`Sin datos de protagonista para "${id}" (se esperaba protagonista_m o protagonista_f)`);
  return p;
}

export const WALK_BAG = withBackpack(WALK);

const EMPTY = '..................';

/**
 * Corta un cuerpo por debajo de la fila `keep` (índice local 0..15) y cierra el borde inferior con
 * contorno bajo la última fila conservada: queda el torso sentado.
 */
export function cutBelow(rows, keep) {
  const close = [...rows[keep]].map((ch) => (ch === '.' ? '.' : 'k')).join('');
  return rows.map((r, i) => (i <= keep ? r : i === keep + 1 ? close : EMPTY));
}

/** Pierna sentada de perfil (mirando a la izquierda): muslo hacia delante y espinilla colgando. */
const SEATED_LEFT_LEGS = [
  '.....kPPssPk......', // 25 cadera y mano
  '..kkkPPPPPpk......', // 26 muslo hacia delante
  '.kPPPPPPPpkk......', // 27
  '.kQqkkkkkk........', // 28 rodilla
  '.kQqk.............', // 29
  'kBBBk.............', // 30
  '.kkk..............', // 31
];

/**
 * Frame nativo 32×32 del jinete: cabeza + torso (con mochila). `dir` = 'down' | 'left' | 'up'.
 * `seated: true` añade la pierna sentada de perfil (solo 'left').
 */
export function riderFrame(id, dir, { seated = false, pose = 0 } = {}) {
  const { heads, palette } = prota(id);
  const src = WALK_BAG[dir][pose];
  let body = cutBelow(src.body, 9); // filas 16..25 (hombros → cadera) + contorno
  if (seated && dir === 'left') body = [...src.body.slice(0, 9), ...checkRows('pierna sentada', SEATED_LEFT_LEGS, 18)];
  return buildFrame({ head: heads[dir], body, lift: src.lift }, palette);
}

/** Pierna colgante (vista de frente o de espaldas) de 4×6: rodilla, espinilla y zapato (el muslo queda tapado). */
export const HANGING_LEG = [
  'kPpk',
  'kQqk',
  'kQqk',
  'kBBk',
  'kBbk',
  '.kk.',
];

/** Pierna colgante como imagen con la paleta del protagonista. */
export function hangingLeg(id) {
  return fromRows(HANGING_LEG, prota(id).palette);
}
