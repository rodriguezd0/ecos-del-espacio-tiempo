// Plantillas de cuerpo del kit de protagonistas (prota_kit.mjs), 4.ª pasada al estilo de los charsets BW de
// Añil: torso estrecho (8 px con contorno), hombros más anchos que el torso, brazos que bajan abiertos en
// diagonal con la mano de 2×2 separada del cuerpo (silueta en rombo, no en caja), cadera algo más ancha que
// el torso y piernas cortas de 2 px con los pies separados por un hueco. Ciclo de CAMINAR: patrones 0, 1 y 3
// (el 2 repite el 0). Coordenadas en la rejilla del cuerpo (x 0..17 = columnas 7..24 del frame; y 0 = fila 18):
// hombros en y1–y2 (filas 19–20), bajo de la chaqueta en y7 (fila 25), cadera en y8, pies en y11 y suela en
// y12 (fila 30). Solo símbolos comunes (L/J/j/d chaqueta, T camiseta, G acento, S/s/r piel, P/p/Q/q pantalón,
// B/b/W calzado), así que cada protagonista las viste con su paleta.
import { part } from './prota_kit.mjs';

// Intercambio luz ↔ sombra al espejar (la luz sigue viniendo de la izquierda).
const SHADE_SWAP = { L: 'j', j: 'L', P: 'p', p: 'P', Q: 'q', q: 'Q', S: 's', s: 'S', B: 'b', b: 'B' };

/** Espejo horizontal de una parte en la rejilla de 18 columnas, con luz y sombra intercambiadas. */
export function mirrorPart(p, { shade = true } = {}) {
  const w = p.rows[0].length;
  const rows = p.rows.map((r) => [...r].reverse().map((ch) => (shade && SHADE_SWAP[ch]) || ch).join(''));
  return part(p.y, rows, 18 - p.x - w);
}

// ───────────────────────────── Torsos (chaqueta cerrada) ─────────────────────────────

/**
 * Frente (columnas 9..22): hombros con la sombra del cuello bajo la barbilla, cuello claro de la camiseta,
 * torso de 8 px (columnas 12..19) con la cremallera en la columna 16 y el tirador verde en la fila 21.
 */
export const TORSO_DOWN = part(1, [
  '.kLJkkkkkkJjk.',
  'kLJJdTTTTdJjjk',
  '...kLJJGjjk...',
  '...kLJJdJjk...',
  '...kLJJdJjk...',
  '...kJJJdjjk...',
  '...kjjjdjjk...',
], 2);

/** Espalda: la misma pieza sin camiseta ni cremallera (costura central en sombra). */
export const TORSO_UP = part(1, [
  '.kLJkkkkkkJjk.',
  'kLJJJJJJJJJjjk',
  '...kLJJjJjk...',
  '...kLJJjJjk...',
  '...kLJJjJjk...',
  '...kJJJjjjk...',
  '...kjjjjjjk...',
], 2);

/** Perfil (mirando a la izquierda, columnas 12..18): pecho a la izquierda con cuello claro y tirador verde. */
export const TORSO_LEFT = part(1, [
  '..kTJk.',
  '.kTdJjk',
  'kGLJJjk', // tirador en el borde del pecho, por delante del brazo cercano
  'kLJJJjk',
  'kLJJJjk',
  'kJJJjjk',
  'kjjjjjk',
], 5);

// ───────────────────────────── Brazos ─────────────────────────────

/** De frente, en reposo: mangas que bajan abiertas y manos de 2×2 separadas del torso. */
const ARMS_DOWN0 = part(3, [
  '.kLJk........kJjk.',
  '.kLJk........kJjk.',
  'kSsk..........kSsk',
  'ksrk..........ksrk',
  '.kk............kk.',
], 0);

/** De frente, paso: el brazo de la izquierda de la pantalla va atrás (mano alta), el otro adelante (baja). */
const ARMS_DOWN1 = part(3, [
  '.kLJk........kJjk.',
  '.kSsk........kJjk.',
  '.ksrk........kJjk.',
  '..kk.........kSsk.',
  '.............ksrk.',
  '..............kk..',
], 0);

/** Perfil en reposo: brazo cercano colgando sobre el costado. */
const ARMS_LEFT0 = part(2, ['.kk.', 'kLJk', 'kLJk', 'kLJk', 'kSsk', 'ksrk', '.kk.'], 7);
/** Perfil, paso 1: brazo cercano atrás (la mano asoma detrás de la espalda). */
const ARMS_LEFT1 = part(2, ['.kk...', 'kLJk..', 'kLJJk.', '.kLJk.', '..kSsk', '..ksrk', '...kk.'], 7);
/** Perfil, paso 1: brazo lejano adelante (asoma delante del pecho, bajo el torso). */
const ARMBACK_LEFT1 = part(4, ['.kk', 'kjk', 'ksk', 'kk.'], 3);
/** Perfil, paso 3: brazo cercano adelante. */
const ARMS_LEFT3 = part(2, ['..kk.', '.kLJk', 'kLJk.', 'kLJk.', 'kSsk.', 'ksrk.', '.kk..'], 4);

// ───────────────────────────── Piernas ─────────────────────────────

/** De frente, de pie: cadera de 10 px, dos piernas de 2 px y los pies separados por un hueco. */
const LEGS_DOWN0 = part(8, [
  'kPPPPPPppk',
  'kPPpkkPPpk',
  'kQqk..kQqk',
  'kBbk..kBbk',
  '.kk....kk.',
], 4);

/** De frente, paso (cuerpo 1 px arriba): la pierna izquierda (pantalla) se levanta, la otra apoya. */
const LEGS_DOWN1 = part(7, [
  'kPPPPPPppk',
  'kPPpkkPPpk',
  'kBbk..kQqk',
  '.kk...kQqk',
  '......kBbk',
  '.......kk.',
], 4);

/** Perfil, de pie: las dos piernas juntas y la puntera hacia la izquierda. */
const LEGS_LEFT0 = part(8, [
  'kPPPPpk',
  '.kPPpk.',
  '.kQQqk.',
  'kBBBbk.',
  '.kkkk..',
], 5);

/** Perfil, zancada: pierna cercana (clara) adelante y lejana (sombra) atrás. */
const LEGS_LEFT1 = part(7, [
  '.....kPPPPpk......',
  '....kPPPkPPpk.....',
  '...kPPk..kppk.....',
  '..kQqk....kqqk....',
  '.kBBBk....kbbbk...',
  '..kkk......kkk....',
], 0);

/** Perfil, zancada contraria: pierna cercana atrás y lejana adelante. */
const LEGS_LEFT3 = part(7, [
  '.....kPPPPpk......',
  '....kppPkPPPk.....',
  '...kppk..kPPk.....',
  '..kqqk....kQQk....',
  '.kbbbk....kBBBk...',
  '..kkk......kkk....',
], 0);

// ───────────────────────────── Poses de caminar ─────────────────────────────

export const PROTA_WALK = Object.freeze({
  down: [
    { key: 'down0', lift: 0, torso: TORSO_DOWN, arms: ARMS_DOWN0, legs: LEGS_DOWN0 },
    { key: 'down1', lift: -1, torso: TORSO_DOWN, arms: ARMS_DOWN1, legs: LEGS_DOWN1 },
    { key: 'down3', lift: -1, torso: TORSO_DOWN, arms: mirrorPart(ARMS_DOWN1), legs: mirrorPart(LEGS_DOWN1) },
  ],
  left: [
    { key: 'left0', lift: 0, torso: TORSO_LEFT, arms: ARMS_LEFT0, legs: LEGS_LEFT0 },
    { key: 'left1', lift: -1, torso: TORSO_LEFT, arms: ARMS_LEFT1, armBack: ARMBACK_LEFT1, legs: LEGS_LEFT1 },
    { key: 'left3', lift: -1, torso: TORSO_LEFT, arms: ARMS_LEFT3, legs: LEGS_LEFT3 },
  ],
  up: [
    { key: 'up0', lift: 0, torso: TORSO_UP, arms: ARMS_DOWN0, legs: LEGS_DOWN0 },
    { key: 'up1', lift: -1, torso: TORSO_UP, arms: mirrorPart(ARMS_DOWN1), legs: LEGS_DOWN1 },
    { key: 'up3', lift: -1, torso: TORSO_UP, arms: ARMS_DOWN1, legs: mirrorPart(LEGS_DOWN1) },
  ],
});

export const PARTS = Object.freeze({
  TORSO_DOWN, TORSO_UP, TORSO_LEFT,
  ARMS_DOWN0, ARMS_DOWN1, ARMS_LEFT0, ARMS_LEFT1, ARMS_LEFT3, ARMBACK_LEFT1,
  LEGS_DOWN0, LEGS_DOWN1, LEGS_LEFT0, LEGS_LEFT1, LEGS_LEFT3,
});
