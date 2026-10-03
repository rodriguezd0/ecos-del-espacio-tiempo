// Datos de los protagonistas y piezas del jinete para monturas y acciones de campo. Los dos usan el kit de
// protagonistas (prota_kit.mjs + prota_field.mjs, estilo de caminar BW con cabeza grande; docs/arte.md §9):
//   · protagonista_m: cabeza de prota_heads.mjs con las poses y la mochila comunes;
//   · protagonista_f: cabeza de prota_heads_f.mjs y poses propias (prota_body_f.mjs) con la mochila común.
// Las hojas de campo (mounts.mjs, actions.mjs, flight.mjs) piden aquí los frames y no dependen del kit.
import { fromRows, splitSheet } from '../pixel.mjs';
import { PALETTES } from './palettes.mjs';
import { PROTA_M_HEAD } from './prota_heads.mjs';
import { PROTA_F_HEAD } from './prota_heads_f.mjs';
import { PROTA_WALK_F, PROTA_RUN_F } from './prota_body_f.mjs';
import { PROTA } from './prota_kit.mjs';
import { kitWalkSheet, kitRunSheet, kitRiderFrame, kitClimbCycle, KIT_HANGING_LEG } from './prota_field.mjs';

export const PROTAS = Object.freeze({
  protagonista_m: Object.freeze({ head: PROTA_M_HEAD, palette: PALETTES.protagonista_m }),
  protagonista_f: Object.freeze({
    head: PROTA_F_HEAD, palette: PALETTES.protagonista_f, walk: PROTA_WALK_F, run: PROTA_RUN_F,
  }),
});

/** Datos de un protagonista o error claro. */
export function prota(id) {
  const p = PROTAS[id];
  if (!p) throw new Error(`Sin datos de protagonista para "${id}" (se esperaba protagonista_m o protagonista_f)`);
  return p;
}

/** Hoja nativa 4×4 (128×128) de caminar con mochila. */
export const walkSheet = (id) => kitWalkSheet(prota(id));

/** Hoja nativa 4×4 (128×128) de correr con mochila. */
export const runSheet = (id) => kitRunSheet(prota(id));

/** Frames nativos 32×32 de caminar: frames[fila][patrón]. */
export const walkFrames = (id) => splitSheet(walkSheet(id), PROTA.native, PROTA.native);

/** Ciclo de trepar (4 frames nativos de espaldas). */
export const climbCycle = (id) => kitClimbCycle(prota(id));

const EMPTY = '..................';

/**
 * Corta un cuerpo de las plantillas del elenco (body_jacket.mjs) por debajo de la fila `keep` (índice local
 * 0..15) y cierra el borde inferior con contorno: queda el torso sentado. Utilidad para jinetes del elenco.
 */
export function cutBelow(rows, keep) {
  const close = [...rows[keep]].map((ch) => (ch === '.' ? '.' : 'k')).join('');
  return rows.map((r, i) => (i <= keep ? r : i === keep + 1 ? close : EMPTY));
}

/**
 * Frame nativo 32×32 del jinete: cabeza + torso (con mochila). `dir` = 'down' | 'left' | 'up'.
 * `seated: true` añade la pierna sentada de perfil (solo 'left').
 */
export const riderFrame = (id, dir, { seated = false } = {}) => kitRiderFrame(prota(id), dir, { seated });

/** Pierna colgante (vista de frente o de espaldas) como imagen con la paleta del protagonista. */
export const hangingLeg = (id) => fromRows(KIT_HANGING_LEG, prota(id).palette);
