// Galería de los Dinteles (docs/CAMPANA.md B02, D08): lógica PURA del puzzle de las tres piedras giratorias.
// Inscripción de la antesala: «El primero mira al alba. El segundo, al agua que no se va. El tercero, a quien
// entra.» → piedra 1 al este (tragaluz), piedra 2 al estanque quieto (el arroyo que sale es el señuelo), piedra 3
// hacia la puerta por la que entró el jugador. Cada acierto hace brillar la ranura en verde SOLO si el Core está a
// 3 casillas o menos; equivocarse no penaliza (la piedra vuelve a girar). Con las tres, se desliza la losa.
import { STONES } from '../maps/b02/ruinas_dintel_layout.js';
import { F, V } from './b02_common.js';

export { STONES };

/** Orden de giro (sentido horario visto desde arriba): arriba → derecha → abajo → izquierda. */
export const ROTATION = Object.freeze([8, 6, 2, 4]);
/** Orientación inicial de las tres piedras: miran a la pared de su alcoba. */
export const START_DIR = 8;
/** Distancia máxima del Core a la piedra para que la ranura responda (casillas, Manhattan). */
export const CORE_RANGE = 3;
export const DIR_NAME = Object.freeze({ 2: 'el sur', 4: 'el oeste', 6: 'el este', 8: 'el norte' });

/** Siguiente orientación al girar una vez. */
export function nextDir(dir) {
  const i = ROTATION.indexOf(dir);
  return ROTATION[(i < 0 ? 0 : i + 1) % ROTATION.length];
}

/** Flag de piedra resuelta (ranura encendida). */
export const stoneFlag = (stone) => `b02_${stone.id}_viva`;

/** Orientación actual guardada (var) o la inicial. */
export function stoneDir(state, stone) {
  const v = state?.var?.(V.stone(stone.id), START_DIR);
  return ROTATION.includes(v) ? v : START_DIR;
}

export const isSolved = (state, stone) => Boolean(state?.flag?.(stoneFlag(stone)));
export const solvedCount = (state) => STONES.filter((s) => isSolved(state, s)).length;
export const allSolved = (state) => STONES.every((s) => isSolved(state, s));

/** ¿Está el Core a CORE_RANGE casillas o menos de la piedra? (null o invisible = no). */
export function coreNear(core, stone, range = CORE_RANGE) {
  if (!core || core.visible === false || core.hidden) return false;
  return Math.abs(core.x - stone.x) + Math.abs(core.y - stone.y) <= range;
}

/**
 * Resultado de girar una piedra (puro). → { dir, correct, lit, already }
 *   dir: nueva orientación · correct: apunta a su respuesta · lit: la ranura se enciende (correcta + Core cerca)
 *   already: estaba resuelta (no gira: la ranura sigue encendida)
 */
export function turnStone(state, stone, { coreClose }) {
  if (isSolved(state, stone)) return { dir: stoneDir(state, stone), correct: true, lit: true, already: true };
  const dir = nextDir(stoneDir(state, stone));
  const correct = dir === stone.answer;
  return { dir, correct, lit: correct && Boolean(coreClose), already: false };
}

/** Aplica el resultado al estado (var de orientación y flag de piedra viva). */
export function applyTurn(state, stone, result) {
  state.setVar(V.stone(stone.id), result.dir);
  if (result.lit) state.setFlag(stoneFlag(stone), true);
}

/** Flag que abre la losa (lo pone el guion tras la animación). */
export const OPEN_FLAG = F.dinteles;
